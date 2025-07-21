// src/components/shared/Chart.tsx
import React from 'react';
import { Pie, Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface ChartProps {
  title: string;
  type: 'pie' | 'line' | 'bar';
  data: any; // Adjust type based on your data structure
  options?: any; // Optional chart options
}

export const Chart: React.FC<ChartProps> = ({ title, type, data, options }) => {
  const defaultOptions = {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: title,
      },
      legend: {
        position: 'bottom' as 'bottom',
      },
    },
  };

  const chartOptions = options || defaultOptions;

  switch (type) {
    case 'pie':
      return <Pie data={data} options={chartOptions} />;
    case 'line':
      return <Line data={data} options={chartOptions} />;
    case 'bar':
      return <Bar data={data} options={chartOptions} />;
    default:
      return <p>Unsupported chart type: {type}</p>;
  }
};
