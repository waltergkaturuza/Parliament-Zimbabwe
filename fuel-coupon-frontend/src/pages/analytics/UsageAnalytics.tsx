// src/pages/analytics/UsageAnalytics.tsx
import { useState, useEffect } from 'react';
import type { FC } from 'react';
import { Card, Row, Col, Statistic, DatePicker, Select, Button, Table, Typography, Spin, message } from 'antd';
import { BarChartOutlined, DollarOutlined, RiseOutlined, PieChartOutlined, DownloadOutlined, SyncOutlined } from '@ant-design/icons';
import { Line, Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title as ChartTitle,
  Tooltip,
  Legend,
} from 'chart.js';
import apiClient from '@/api/apiClient';
import dayjs from 'dayjs';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  ChartTitle,
  Tooltip,
  Legend
);

const { Title } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

interface UsageData {
  totalCouponsIssued: number;
  totalCouponsUsed: number;
  totalFuelLiters: number;
  totalCostUSD: number;
  usageRate: number;
  dailyUsage: Array<{
    date: string;
    coupons: number;
    liters: number;
    cost: number;
  }>;
  subCenterUsage: Array<{
    subCenter: string;
    coupons: number;
    liters: number;
    cost: number;
  }>;
  beneficiaryUsage: Array<{
    beneficiary: string;
    coupons: number;
    liters: number;
    cost: number;
  }>;
  fuelTypeBreakdown: Array<{
    type: string;
    value: number;
    percentage: number;
  }>;
}

const UsageAnalytics: FC = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<UsageData>({
    totalCouponsIssued: 0,
    totalCouponsUsed: 0,
    totalFuelLiters: 0,
    totalCostUSD: 0,
    usageRate: 0,
    dailyUsage: [],
    subCenterUsage: [],
    beneficiaryUsage: [],
    fuelTypeBreakdown: []
  });
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(30, 'day'),
    dayjs()
  ]);
  const [selectedSubCenter, setSelectedSubCenter] = useState<string>('all');
  const [subCenters, setSubCenters] = useState<any[]>([]);

  useEffect(() => {
    loadSubCenters();
  }, []);

  useEffect(() => {
    loadAnalyticsData();
  }, [dateRange, selectedSubCenter]);

  const loadSubCenters = async () => {
    try {
      const response = await apiClient.get('/api/v1/subcenters/');
      const subCenterData = response.data.results || response.data;
      setSubCenters(subCenterData);
    } catch (error) {
      console.error('Error loading sub centers:', error);
    }
  };

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      const params = {
        start_date: dateRange[0].format('YYYY-MM-DD'),
        end_date: dateRange[1].format('YYYY-MM-DD'),
        sub_center: selectedSubCenter !== 'all' ? selectedSubCenter : undefined
      };

      const response = await apiClient.get('/api/v1/analytics/', { params });
      
      // Mock data for demonstration - replace with actual API response
      const mockData: UsageData = {
        totalCouponsIssued: 2500,
        totalCouponsUsed: 1875,
        totalFuelLiters: 18750,
        totalCostUSD: 23437.50,
        usageRate: 75,
        dailyUsage: Array.from({ length: 30 }, (_, i) => ({
          date: dayjs().subtract(29 - i, 'day').format('YYYY-MM-DD'),
          coupons: Math.floor(Math.random() * 100) + 50,
          liters: Math.floor(Math.random() * 1000) + 500,
          cost: Math.floor(Math.random() * 1250) + 625
        })),
        subCenterUsage: [
          { subCenter: 'Parliament Main', coupons: 650, liters: 6500, cost: 8125 },
          { subCenter: 'Ministry Block A', coupons: 425, liters: 4250, cost: 5312.50 },
          { subCenter: 'Ministry Block B', coupons: 380, liters: 3800, cost: 4750 },
          { subCenter: 'Government House', coupons: 420, liters: 4200, cost: 5250 }
        ],
        beneficiaryUsage: [
          { beneficiary: 'Hon. John Doe', coupons: 85, liters: 850, cost: 1062.50 },
          { beneficiary: 'Hon. Jane Smith', coupons: 78, liters: 780, cost: 975 },
          { beneficiary: 'Hon. Peter Jones', coupons: 72, liters: 720, cost: 900 },
          { beneficiary: 'Hon. Mary Brown', coupons: 69, liters: 690, cost: 862.50 },
          { beneficiary: 'Hon. David Wilson', coupons: 65, liters: 650, cost: 812.50 }
        ],
        fuelTypeBreakdown: [
          { type: 'Petrol', value: 11250, percentage: 60 },
          { type: 'Diesel', value: 7500, percentage: 40 }
        ]
      };

      setData(mockData);
    } catch (error) {
      console.error('Error loading analytics data:', error);
      message.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const exportData = () => {
    // Mock export functionality
    message.success('Analytics data exported successfully');
  };

  // Chart configurations using Chart.js format
  const lineChartData = {
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

  const lineChartOptions = {
    responsive: true,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: false,
      },
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Date'
        }
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Liters'
        }
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: 'Coupons'
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  const barChartData = {
    labels: data.subCenterUsage.map(item => item.subCenter),
    datasets: [
      {
        label: 'Fuel Usage (L)',
        data: data.subCenterUsage.map(item => item.liters),
        backgroundColor: 'rgba(82, 196, 26, 0.8)',
        borderColor: '#52c41a',
        borderWidth: 1,
      },
      {
        label: 'Cost (USD)',
        data: data.subCenterUsage.map(item => item.cost),
        backgroundColor: 'rgba(24, 144, 255, 0.8)',
        borderColor: '#1890ff',
        borderWidth: 1,
        yAxisID: 'y1',
      }
    ],
  };

  const barChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Sub Centers'
        }
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Liters'
        }
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: 'Cost (USD)'
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  const pieChartData = {
    labels: data.fuelTypeBreakdown.map(item => item.type),
    datasets: [
      {
        data: data.fuelTypeBreakdown.map(item => item.value),
        backgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0',
          '#9966FF',
        ],
        borderColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0',
          '#9966FF',
        ],
        borderWidth: 1,
      },
    ],
  };

  const pieChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const total = data.fuelTypeBreakdown.reduce((sum, item) => sum + item.value, 0);
            const percentage = ((context.raw / total) * 100).toFixed(1);
            return `${context.label}: ${context.raw} L (${percentage}%)`;
          }
        }
      }
    },
  };

  const topBeneficiariesColumns = [
    {
      title: 'Beneficiary',
      dataIndex: 'beneficiary',
      key: 'beneficiary'
    },
    {
      title: 'Coupons Used',
      dataIndex: 'coupons',
      key: 'coupons',
      sorter: (a: any, b: any) => a.coupons - b.coupons
    },
    {
      title: 'Fuel (L)',
      dataIndex: 'liters',
      key: 'liters',
      sorter: (a: any, b: any) => a.liters - b.liters
    },
    {
      title: 'Cost (USD)',
      dataIndex: 'cost',
      key: 'cost',
      render: (cost: number) => `$${cost.toFixed(2)}`,
      sorter: (a: any, b: any) => a.cost - b.cost
    }
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <p>Loading analytics data...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', fontFamily: 'Rockwell, serif' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ fontFamily: 'Rockwell, serif', fontSize: '18px', margin: 0 }}>
          Fuel Usage Analytics
        </Title>
        <p style={{ color: '#666', margin: '8px 0 0 0', fontSize: '16px' }}>
          Comprehensive analytics and insights on fuel coupon usage
        </p>
      </div>

      {/* Filters */}
      <Card style={{ marginBottom: '24px' }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                Date Range:
              </label>
              <RangePicker
                value={dateRange}
                onChange={(dates) => dates && setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs])}
                style={{ width: '100%' }}
              />
            </div>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                Sub Center:
              </label>
              <Select
                value={selectedSubCenter}
                onChange={setSelectedSubCenter}
                style={{ width: '100%' }}
              >
                <Option value="all">All Sub Centers</Option>
                {subCenters.map((center) => (
                  <Option key={center.id} value={center.id}>
                    {center.name}
                  </Option>
                ))}
              </Select>
            </div>
          </Col>
          <Col xs={24} sm={24} md={8}>
            <div style={{ paddingTop: '32px' }}>
              <Button
                icon={<SyncOutlined />}
                onClick={loadAnalyticsData}
                style={{ marginRight: '8px' }}
              >
                Refresh
              </Button>
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                onClick={exportData}
              >
                Export
              </Button>
            </div>
          </Col>
        </Row>
      </Card>

      {/* Key Metrics */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Coupons Issued"
              value={data.totalCouponsIssued}
              prefix={<BarChartOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Coupons Used"
              value={data.totalCouponsUsed}
              suffix={`/ ${data.totalCouponsIssued}`}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Fuel (L)"
              value={data.totalFuelLiters}
              prefix={<RiseOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Cost (USD)"
              value={data.totalCostUSD}
              prefix={<DollarOutlined />}
              precision={2}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Usage Rate */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col span={24}>
          <Card>
            <Statistic
              title="Overall Usage Rate"
              value={data.usageRate}
              suffix="%"
              valueStyle={{ 
                color: data.usageRate >= 80 ? '#52c41a' : 
                       data.usageRate >= 60 ? '#fa8c16' : '#ff4d4f',
                fontSize: '24px'
              }}
            />
          </Card>
        </Col>
      </Row>

      {/* Charts */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} lg={16}>
          <Card>
            <Title level={4} style={{ fontFamily: 'Rockwell, serif', fontSize: '16px', marginBottom: '16px' }}>
              Daily Fuel Usage Trend
            </Title>
            <div style={{ height: '300px' }}>
              <Line data={lineChartData} options={lineChartOptions} />
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card>
            <Title level={4} style={{ fontFamily: 'Rockwell, serif', fontSize: '16px', marginBottom: '16px' }}>
              Fuel Type Breakdown
            </Title>
            <div style={{ height: '300px' }}>
              <Pie data={pieChartData} options={pieChartOptions} />
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} lg={12}>
          <Card>
            <Title level={4} style={{ fontFamily: 'Rockwell, serif', fontSize: '16px', marginBottom: '16px' }}>
              Sub Center Usage
            </Title>
            <div style={{ height: '300px' }}>
              <Bar data={barChartData} options={barChartOptions} />
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card>
            <Title level={4} style={{ fontFamily: 'Rockwell, serif', fontSize: '16px', marginBottom: '16px' }}>
              Top Beneficiaries by Usage
            </Title>
            <Table
              columns={topBeneficiariesColumns}
              dataSource={data.beneficiaryUsage}
              pagination={false}
              size="small"
              rowKey="beneficiary"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default UsageAnalytics;
