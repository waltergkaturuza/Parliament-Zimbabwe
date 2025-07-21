// src/pages/main-center/components/AnalyticsFinance.tsx
import { useState } from 'react';
import type { FC } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Typography,
  DatePicker,
  Select,
  Space,
  Button,
  Table,
  Tag,
  Progress,
  Divider,
} from 'antd';
import {
  DollarOutlined,
  RiseOutlined,
  FallOutlined,
  BarChartOutlined,
  FileTextOutlined,
  DownloadOutlined,
  PieChartOutlined,
} from '@ant-design/icons';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const AnalyticsFinance: FC = () => {
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(30, 'days'),
    dayjs(),
  ]);
  const [selectedMetric, setSelectedMetric] = useState('revenue');

  // Sample data
  const financialData = [
    { date: '01/07', revenue: 2400000, costs: 1800000, profit: 600000, coupons: 12000 },
    { date: '02/07', revenue: 2600000, costs: 1950000, profit: 650000, coupons: 13000 },
    { date: '03/07', revenue: 2800000, costs: 2100000, profit: 700000, coupons: 14000 },
    { date: '04/07', revenue: 3000000, costs: 2250000, profit: 750000, coupons: 15000 },
  ];

  const consumptionBySubCenter = [
    { name: 'Harare Central', value: 35, amount: 2800000, color: '#1890ff' },
    { name: 'Bulawayo North', value: 25, amount: 2000000, color: '#52c41a' },
    { name: 'Mutare East', value: 20, amount: 1600000, color: '#faad14' },
    { name: 'Gweru South', value: 15, amount: 1200000, color: '#f5222d' },
    { name: 'Others', value: 5, amount: 400000, color: '#722ed1' },
  ];

  const fuelTypeDistribution = [
    { name: 'Petrol 20L', value: 45, amount: 3600000, color: '#1890ff' },
    { name: 'Petrol 5L', value: 30, amount: 600000, color: '#52c41a' },
    { name: 'Diesel 20L', value: 20, amount: 1520000, color: '#faad14' },
    { name: 'Diesel 5L', value: 5, amount: 95000, color: '#f5222d' },
  ];

  const monthlyComparison = [
    { month: 'Jan', thisYear: 18000000, lastYear: 15000000 },
    { month: 'Feb', thisYear: 19500000, lastYear: 16200000 },
    { month: 'Mar', thisYear: 21000000, lastYear: 17800000 },
    { month: 'Apr', thisYear: 22500000, lastYear: 19000000 },
    { month: 'May', thisYear: 24000000, lastYear: 20500000 },
    { month: 'Jun', thisYear: 25500000, lastYear: 22000000 },
    { month: 'Jul', thisYear: 12000000, lastYear: 11500000 },
  ];

  // Calculate totals and percentages
  const totalRevenue = financialData.reduce((sum, item) => sum + item.revenue, 0);
  const totalCosts = financialData.reduce((sum, item) => sum + item.costs, 0);
  const totalProfit = totalRevenue - totalCosts;
  const profitMargin = (totalProfit / totalRevenue) * 100;
  const totalCoupons = financialData.reduce((sum, item) => sum + item.coupons, 0);

  // Growth calculations
  const revenueGrowth = financialData.length > 1 
    ? ((financialData[financialData.length - 1].revenue - financialData[0].revenue) / financialData[0].revenue) * 100
    : 0;

  const topPerformers = [
    { subCenter: 'Harare Central', revenue: 2800000, growth: 15.2, coupons: 14000 },
    { subCenter: 'Bulawayo North', revenue: 2000000, growth: 12.8, coupons: 10000 },
    { subCenter: 'Mutare East', revenue: 1600000, growth: 8.5, coupons: 8000 },
  ];

  const columns = [
    {
      title: 'Sub Center',
      dataIndex: 'subCenter',
      key: 'subCenter',
    },
    {
      title: 'Revenue (ZWG)',
      dataIndex: 'revenue',
      key: 'revenue',
      render: (value: number) => value.toLocaleString(),
    },
    {
      title: 'Growth',
      dataIndex: 'growth',
      key: 'growth',
      render: (value: number) => (
        <Text style={{ color: value > 0 ? '#52c41a' : '#ff4d4f' }}>
          {value > 0 ? <RiseOutlined /> : <FallOutlined />}
          {' '}{Math.abs(value).toFixed(1)}%
        </Text>
      ),
    },
    {
      title: 'Coupons Used',
      dataIndex: 'coupons',
      key: 'coupons',
      render: (value: number) => value.toLocaleString(),
    },
    {
      title: 'Performance',
      key: 'performance',
      render: (_: any, record: any) => {
        const performance = (record.growth / 20) * 100; // Assume 20% is excellent
        return (
          <Progress
            percent={Math.min(performance, 100)}
            size="small"
            status={performance > 80 ? 'success' : performance > 50 ? 'active' : 'exception'}
          />
        );
      },
    },
  ];

  return (
    <div>
      {/* Header with Controls */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={4}>Analytics & Finance</Title>
          <Text type="secondary">Financial insights and consumption analytics</Text>
        </Col>
        <Col>
          <Space>
            <RangePicker
              value={dateRange}
              onChange={(dates) => setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs])}
            />
            <Select value={selectedMetric} onChange={setSelectedMetric} style={{ width: 120 }}>
              <Option value="revenue">Revenue</Option>
              <Option value="profit">Profit</Option>
              <Option value="coupons">Coupons</Option>
            </Select>
            <Button icon={<DownloadOutlined />}>Export</Button>
          </Space>
        </Col>
      </Row>

      {/* Key Metrics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Revenue"
              value={totalRevenue}
              prefix="ZWG"
              valueStyle={{ color: '#1890ff' }}
              formatter={(value) => value?.toLocaleString()}
            />
            <div style={{ marginTop: 8 }}>
              <Text style={{ color: revenueGrowth > 0 ? '#52c41a' : '#ff4d4f', fontSize: '12px' }}>
                {revenueGrowth > 0 ? '↑' : '↓'} {Math.abs(revenueGrowth).toFixed(1)}% from last period
              </Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Profit"
              value={totalProfit}
              prefix="ZWG"
              valueStyle={{ color: '#52c41a' }}
              formatter={(value) => value?.toLocaleString()}
            />
            <div style={{ marginTop: 8 }}>
              <Text style={{ fontSize: '12px' }}>
                Margin: {profitMargin.toFixed(1)}%
              </Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Coupons Processed"
              value={totalCoupons}
              valueStyle={{ color: '#722ed1' }}
              formatter={(value) => value?.toLocaleString()}
            />
            <div style={{ marginTop: 8 }}>
              <Text style={{ fontSize: '12px' }}>
                Avg: {(totalCoupons / financialData.length).toLocaleString()} per day
              </Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Operational Costs"
              value={totalCosts}
              prefix="ZWG"
              valueStyle={{ color: '#faad14' }}
              formatter={(value) => value?.toLocaleString()}
            />
            <div style={{ marginTop: 8 }}>
              <Text style={{ fontSize: '12px' }}>
                {((totalCosts / totalRevenue) * 100).toFixed(1)}% of revenue
              </Text>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Charts Section */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {/* Revenue Trend */}
        <Col xs={24} lg={12}>
          <Card title="Revenue & Profit Trend" extra={<FileTextOutlined />}>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={financialData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} />
                <Tooltip formatter={(value: number) => [`ZWG ${value.toLocaleString()}`, '']} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stackId="1"
                  stroke="#1890ff"
                  fill="#1890ff"
                  name="Revenue"
                />
                <Area
                  type="monotone"
                  dataKey="profit"
                  stackId="2"
                  stroke="#52c41a"
                  fill="#52c41a"
                  name="Profit"
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        {/* Yearly Comparison */}
        <Col xs={24} lg={12}>
          <Card title="Year-over-Year Comparison" extra={<BarChartOutlined />}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyComparison}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`} />
                <Tooltip formatter={(value: number) => [`ZWG ${value.toLocaleString()}`, '']} />
                <Bar dataKey="thisYear" fill="#1890ff" name="2024" />
                <Bar dataKey="lastYear" fill="#d9d9d9" name="2023" />
                <Legend />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {/* Sub Center Distribution */}
        <Col xs={24} lg={12}>
          <Card title="Revenue by Sub Center" extra={<PieChartOutlined />}>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={consumptionBySubCenter}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {consumptionBySubCenter.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number, name: string, props: any) => [
                  `${value}% (ZWG ${props.payload.amount.toLocaleString()})`,
                  name
                ]} />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        {/* Fuel Type Distribution */}
        <Col xs={24} lg={12}>
          <Card title="Revenue by Fuel Type" extra={<PieChartOutlined />}>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={fuelTypeDistribution}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {fuelTypeDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number, name: string, props: any) => [
                  `${value}% (ZWG ${props.payload.amount.toLocaleString()})`,
                  name
                ]} />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* Performance Table */}
      <Card title="Sub Center Performance Rankings">
        <Table
          columns={columns}
          dataSource={topPerformers}
          rowKey="subCenter"
          pagination={false}
          size="small"
        />
      </Card>

      <Divider />

      {/* Additional Insights */}
      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card title="Top Insights" size="small">
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text strong>Peak Revenue Day</Text>
                <br />
                <Text>04/07/2024 - ZWG 3,000,000</Text>
              </div>
              <div>
                <Text strong>Best Performing Center</Text>
                <br />
                <Text>Harare Central (+15.2%)</Text>
              </div>
              <div>
                <Text strong>Most Popular Fuel</Text>
                <br />
                <Text>Petrol 20L (45% of sales)</Text>
              </div>
            </Space>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card title="Cost Breakdown" size="small">
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text>Fuel Procurement: 75%</Text>
                <Progress percent={75} size="small" />
              </div>
              <div>
                <Text>Operations: 15%</Text>
                <Progress percent={15} size="small" />
              </div>
              <div>
                <Text>Distribution: 8%</Text>
                <Progress percent={8} size="small" />
              </div>
              <div>
                <Text>Administration: 2%</Text>
                <Progress percent={2} size="small" />
              </div>
            </Space>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card title="Key Ratios" size="small">
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text strong>Profit Margin</Text>
                <br />
                <Text style={{ color: '#52c41a' }}>{profitMargin.toFixed(1)}%</Text>
              </div>
              <div>
                <Text strong>Revenue per Coupon</Text>
                <br />
                <Text>ZWG {(totalRevenue / totalCoupons).toFixed(0)}</Text>
              </div>
              <div>
                <Text strong>Daily Average Revenue</Text>
                <br />
                <Text>ZWG {(totalRevenue / financialData.length).toLocaleString()}</Text>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AnalyticsFinance;
