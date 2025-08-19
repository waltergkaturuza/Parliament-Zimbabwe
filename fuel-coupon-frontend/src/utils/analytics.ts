// src/utils/analytics.ts
import { UsageAnalyticsData } from '../api/analytics';
import dayjs from 'dayjs';

export interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    borderColor?: string;
    backgroundColor?: string;
    tension?: number;
    pointRadius?: number;
    yAxisID?: string;
  }>;
}

export interface PieChartData {
  labels: string[];
  datasets: Array<{
    data: number[];
    backgroundColor: string[];
    borderColor: string[];
    borderWidth: number;
  }>;
}

export const generateLineChartData = (data: UsageAnalyticsData): ChartData => {
  return {
    labels: data.dailyUsage.map(item => dayjs(item.date).format('MM/DD')),
    datasets: [
      {
        label: 'Fuel Usage (L)',
        data: data.dailyUsage.map(item => item.liters),
        borderColor: '#1890ff',
        backgroundColor: 'rgba(24, 144, 255, 0.1)',
        tension: 0.4,
        pointRadius: 4,
      },
      {
        label: 'Coupons Used',
        data: data.dailyUsage.map(item => item.coupons),
        borderColor: '#52c41a',
        backgroundColor: 'rgba(82, 196, 26, 0.1)',
        tension: 0.4,
        pointRadius: 4,
        yAxisID: 'y1',
      }
    ],
  };
};

export const generateBarChartData = (data: UsageAnalyticsData): ChartData => {
  return {
    labels: data.subCenterUsage.map(item => item.subCenter),
    datasets: [
      {
        label: 'Coupons Used',
        data: data.subCenterUsage.map(item => item.coupons),
        backgroundColor: 'rgba(24, 144, 255, 0.6)',
        borderColor: '#1890ff',
      }
    ],
  };
};

export const generatePieChartData = (data: UsageAnalyticsData): PieChartData => {
  const colors = ['#ff6384', '#36a2eb', '#cc65fe', '#ffce56', '#4bc0c0'];
  
  return {
    labels: data.fuelTypeBreakdown.map(item => item.type),
    datasets: [
      {
        data: data.fuelTypeBreakdown.map(item => item.value),
        backgroundColor: colors.slice(0, data.fuelTypeBreakdown.length),
        borderColor: colors.slice(0, data.fuelTypeBreakdown.length).map(color => color.replace('0.6', '1')),
        borderWidth: 1,
      }
    ],
  };
};

export const formatCurrency = (amount: number, currency: 'USD' | 'ZWG' = 'USD'): string => {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  
  return formatter.format(amount);
};

export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('en-US').format(num);
};

export const formatPercentage = (value: number): string => {
  return `${value.toFixed(1)}%`;
};

export const calculateGrowth = (current: number, previous: number): {
  value: number;
  percentage: number;
  isPositive: boolean;
} => {
  const diff = current - previous;
  const percentage = previous > 0 ? (diff / previous) * 100 : 0;
  
  return {
    value: Math.abs(diff),
    percentage: Math.abs(percentage),
    isPositive: diff >= 0,
  };
};

export const generateDateRangeOptions = () => {
  return [
    {
      label: 'Last 7 Days',
      value: 7,
      range: [dayjs().subtract(7, 'day'), dayjs()]
    },
    {
      label: 'Last 30 Days',
      value: 30,
      range: [dayjs().subtract(30, 'day'), dayjs()]
    },
    {
      label: 'Last 3 Months',
      value: 90,
      range: [dayjs().subtract(3, 'month'), dayjs()]
    },
    {
      label: 'Last 6 Months',
      value: 180,
      range: [dayjs().subtract(6, 'month'), dayjs()]
    },
    {
      label: 'Last Year',
      value: 365,
      range: [dayjs().subtract(1, 'year'), dayjs()]
    }
  ];
};

export const exportTableData = (data: any[], filename: string, format: 'csv' | 'json' = 'csv') => {
  if (format === 'csv') {
    const headers = Object.keys(data[0] || {});
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } else {
    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
