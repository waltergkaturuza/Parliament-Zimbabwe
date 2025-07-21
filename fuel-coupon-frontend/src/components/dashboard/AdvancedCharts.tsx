import * as React from 'react';
import { Card, Row, Col, Typography, Select, Button, Space, Statistic, Progress } from 'antd';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
  ComposedChart,
  RadialBarChart,
  RadialBar,
  Treemap,
  ScatterChart,
  Scatter,
  FunnelChart,
  Funnel,
  LabelList,
} from 'recharts';
import { motion } from 'framer-motion';
import {
  RiseOutlined,
  FallOutlined,
  DashboardOutlined,
  BarChartOutlined,
  PieChartOutlined,
  LineChartOutlined,
  AreaChartOutlined,
  FunnelPlotOutlined,
  DotChartOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;

// Color palettes
const CHART_COLORS = [
  '#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1',
  '#13c2c2', '#eb2f96', '#fa8c16', '#a0d911', '#2f54eb'
];

const PERFORMANCE_COLORS = ['#ff4d4f', '#ff7a45', '#ffa940', '#52c41a'];

interface ChartContainerProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  actions?: React.ReactNode;
  loading?: boolean;
}

const ChartContainer: React.FC<ChartContainerProps> = ({
  title,
  subtitle,
  icon,
  children,
  actions,
  loading = false
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
  >
    <Card
      title={
        <div className="flex items-center gap-2">
          {icon}
          <div>
            <Title level={5} className="mb-0">{title}</Title>
            {subtitle && <Text type="secondary" className="text-sm">{subtitle}</Text>}
          </div>
        </div>
      }
      extra={actions}
      className="h-full"
      loading={loading}
    >
      {children}
    </Card>
  </motion.div>
);

// Fuel Consumption Heatmap
export const FuelConsumptionHeatmap: React.FC<{ data?: any[] }> = ({ data = [] }) => {
  const heatmapData = data.length ? data : [
    { name: 'Harare', petrol: 400, diesel: 240, efficiency: 85 },
    { name: 'Bulawayo', petrol: 300, diesel: 139, efficiency: 92 },
    { name: 'Mutare', petrol: 200, diesel: 98, efficiency: 78 },
    { name: 'Gweru', petrol: 278, diesel: 390, efficiency: 88 },
    { name: 'Kwekwe', petrol: 189, diesel: 480, efficiency: 91 },
  ];

  return (
    <ChartContainer
      title="Regional Fuel Consumption"
      subtitle="Efficiency and usage by region"
      icon={<AreaChartOutlined />}
      actions={
        <Space>
          <Select defaultValue="monthly" size="small">
            <Option value="daily">Daily</Option>
            <Option value="weekly">Weekly</Option>
            <Option value="monthly">Monthly</Option>
          </Select>
          <Button size="small" type="primary" ghost>Export</Button>
        </Space>
      }
    >
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={heatmapData}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis dataKey="name" />
          <YAxis yAxisId="left" />
          <YAxis yAxisId="right" orientation="right" />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #d9d9d9',
              borderRadius: '6px',
            }}
          />
          <Legend />
          <Bar yAxisId="left" dataKey="petrol" fill="#1890ff" name="Petrol (L)" />
          <Bar yAxisId="left" dataKey="diesel" fill="#52c41a" name="Diesel (L)" />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="efficiency"
            stroke="#fa8c16"
            strokeWidth={3}
            name="Efficiency %"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};

// User Activity Funnel
export const UserActivityFunnel: React.FC<{ data?: any[] }> = ({ data = [] }) => {
  const funnelData = data.length ? data : [
    { name: 'Total Users', value: 1000, fill: '#1890ff' },
    { name: 'Active Users', value: 800, fill: '#52c41a' },
    { name: 'Regular Users', value: 600, fill: '#faad14' },
    { name: 'Power Users', value: 200, fill: '#722ed1' },
  ];

  return (
    <ChartContainer
      title="User Engagement Funnel"
      subtitle="User activity levels breakdown"
      icon={<FunnelPlotOutlined />}
    >
      <ResponsiveContainer width="100%" height={300}>
        <FunnelChart>
          <Tooltip />
          <Funnel
            dataKey="value"
            data={funnelData}
            isAnimationActive
          >
            <LabelList position="center" fill="#fff" />
          </Funnel>
        </FunnelChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};

// System Performance Gauge
export const SystemPerformanceGauge: React.FC<{ data?: any[] }> = ({ data = [] }) => {
  const performanceData = data.length ? data : [
    { name: 'CPU', value: 75, fill: '#52c41a' },
    { name: 'Memory', value: 60, fill: '#1890ff' },
    { name: 'Disk', value: 45, fill: '#faad14' },
    { name: 'Network', value: 85, fill: '#722ed1' },
  ];

  return (
    <ChartContainer
      title="System Performance"
      subtitle="Real-time resource utilization"
      icon={<DashboardOutlined />}
    >
      <Row gutter={[16, 16]}>
        {performanceData.map((item, index) => (
          <Col xs={12} sm={6} key={index}>
            <div className="text-center">
              <Progress
                type="circle"
                percent={item.value}
                width={80}
                strokeColor={item.fill}
                format={(percent) => `${percent}%`}
              />
              <Text className="block mt-2 font-medium">{item.name}</Text>
            </div>
          </Col>
        ))}
      </Row>
    </ChartContainer>
  );
};

// Correlation Matrix
export const CorrelationMatrix: React.FC<{ data?: any[] }> = ({ data = [] }) => {
  const correlationData = data.length ? data : [
    { x: 'Users', y: 'Fuel Usage', value: 0.8, fill: '#52c41a' },
    { x: 'Users', y: 'System Load', value: 0.6, fill: '#1890ff' },
    { x: 'Fuel Usage', y: 'Efficiency', value: -0.3, fill: '#faad14' },
    { x: 'System Load', y: 'Response Time', value: 0.9, fill: '#f5222d' },
  ];

  return (
    <ChartContainer
      title="Metrics Correlation"
      subtitle="Relationship between key metrics"
      icon={<DotChartOutlined />}
    >
      <ResponsiveContainer width="100%" height={300}>
        <ScatterChart data={correlationData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="category" dataKey="x" />
          <YAxis type="category" dataKey="y" />
          <Tooltip cursor={{ strokeDasharray: '3 3' }} />
          <Scatter dataKey="value" fill="#1890ff" />
        </ScatterChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};

// Predictive Analytics Chart
export const PredictiveAnalytics: React.FC<{ data?: any[] }> = ({ data = [] }) => {
  const predictiveData = data.length ? data : [
    { month: 'Jan', actual: 4000, predicted: 4200, confidence: [3800, 4600] },
    { month: 'Feb', actual: 3000, predicted: 3100, confidence: [2800, 3400] },
    { month: 'Mar', actual: 2000, predicted: 2200, confidence: [1900, 2500] },
    { month: 'Apr', actual: null, predicted: 2780, confidence: [2400, 3200] },
    { month: 'May', actual: null, predicted: 3200, confidence: [2800, 3600] },
    { month: 'Jun', actual: null, predicted: 3500, confidence: [3100, 3900] },
  ];

  return (
    <ChartContainer
      title="Fuel Usage Prediction"
      subtitle="AI-powered consumption forecasting"
      icon={<LineChartOutlined />}
      actions={
        <Space>
          <Text type="secondary" className="text-sm">Accuracy: 94.2%</Text>
        </Space>
      }
    >
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={predictiveData}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Area
            dataKey="confidence"
            fill="#1890ff"
            fillOpacity={0.1}
            stroke="none"
            name="Confidence Interval"
          />
          <Line
            type="monotone"
            dataKey="actual"
            stroke="#52c41a"
            strokeWidth={3}
            name="Actual Usage"
            connectNulls={false}
          />
          <Line
            type="monotone"
            dataKey="predicted"
            stroke="#fa8c16"
            strokeWidth={2}
            strokeDasharray="5 5"
            name="Predicted Usage"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};

// Efficiency Treemap
export const EfficiencyTreemap: React.FC<{ data?: any[] }> = ({ data = [] }) => {
  const treemapData = data.length ? data : [
    {
      name: 'Fuel System',
      children: [
        { name: 'Distribution', size: 2324, efficiency: 85 },
        { name: 'Storage', size: 1623, efficiency: 92 },
        { name: 'Transport', size: 1842, efficiency: 78 },
        { name: 'Usage Tracking', size: 1134, efficiency: 96 }
      ]
    }
  ];

  const CustomizedContent = (props: any) => {
    const { name, efficiency, x, y, width, height } = props;
    
    return (
      <g>
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          style={{
            fill: efficiency > 90 ? '#52c41a' : efficiency > 80 ? '#faad14' : '#f5222d',
            fillOpacity: 0.8,
            stroke: '#fff',
            strokeWidth: 2
          }}
        />
        {width > 60 && height > 40 && (
          <>
            <text
              x={x + width / 2}
              y={y + height / 2 - 10}
              textAnchor="middle"
              fill="#fff"
              fontSize="12"
              fontWeight="bold"
            >
              {name}
            </text>
            <text
              x={x + width / 2}
              y={y + height / 2 + 10}
              textAnchor="middle"
              fill="#fff"
              fontSize="10"
            >
              {efficiency}%
            </text>
          </>
        )}
      </g>
    );
  };

  return (
    <ChartContainer
      title="System Efficiency Map"
      subtitle="Performance across components"
      icon={<BarChartOutlined />}
    >
      <ResponsiveContainer width="100%" height={300}>
        <Treemap
          data={treemapData}
          dataKey="size"
          aspectRatio={4/3}
          stroke="#fff"
          content={<CustomizedContent />}
        />
      </ResponsiveContainer>
    </ChartContainer>
  );
};

// Export all components
export {
  ChartContainer,
  CHART_COLORS,
  PERFORMANCE_COLORS
};
