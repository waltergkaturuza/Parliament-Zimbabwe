// src/pages/main-center/components/AnalyticsFinance.tsx
import { useState, useEffect } from 'react';
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
  Spin,
  message,
} from 'antd';
import {
  DollarOutlined,
  RiseOutlined,
  FallOutlined,
  BarChartOutlined,
  FileTextOutlined,
  DownloadOutlined,
  PieChartOutlined,
  ExportOutlined,
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
import apiClient from '../../../api/index';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

interface FinancialData {
  date: string;
  revenueUSD: number;
  costsUSD: number;
  profitUSD: number;
  coupons: number;
}

interface SummaryData {
  totalRevenue: number;
  totalCosts: number;
  totalProfit: number;
  profitMargin: number;
  revenueGrowth: number;
  totalBoxes: number;
  totalCoupons: number;
  totalLitres: number;
  averageValuePerBox: number;
}

const AnalyticsFinance: FC = () => {
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(30, 'days'),
    dayjs(),
  ]);
  const [selectedMetric, setSelectedMetric] = useState('revenue');
  const [loading, setLoading] = useState(true);
  const [financialData, setFinancialData] = useState<FinancialData[]>([]);
  const [summaryData, setSummaryData] = useState<SummaryData>({
    totalRevenue: 0,
    totalCosts: 0,
    totalProfit: 0,
    profitMargin: 0,
    revenueGrowth: 0,
    totalBoxes: 0,
    totalCoupons: 0,
    totalLitres: 0,
    averageValuePerBox: 0
  });

  useEffect(() => {
    loadFinancialData();
  }, [dateRange]);

  const loadFinancialData = async () => {
    setLoading(true);
    try {
      const [startDate, endDate] = dateRange;
      const response = await apiClient.get('/analytics/', {
        params: {
          start_date: startDate.format('YYYY-MM-DD'),
          end_date: endDate.format('YYYY-MM-DD'),
        }
      });
      
      const data = response.data;
      
      if (data && Array.isArray(data.daily_data)) {
        const mappedData = data.daily_data.map((item: any) => ({
          date: dayjs(item.date).format('DD/MM'),
          revenueUSD: item.revenue_usd || 0,
          costsUSD: item.costs_usd || 0,
          profitUSD: item.profit_usd || 0,
          coupons: item.coupons_issued || 0,
        }));
        setFinancialData(mappedData);
        
        // Store summary data for display
        setSummaryData({
          totalRevenue: data.financial_summary?.total_revenue_usd || 0,
          totalCosts: data.financial_summary?.total_costs_usd || 0,
          totalProfit: data.financial_summary?.total_profit_usd || 0,
          profitMargin: data.financial_summary?.profit_margin || 0,
          revenueGrowth: data.financial_summary?.revenue_growth_rate || 0,
          totalBoxes: data.operational_summary?.total_boxes_processed || 0,
          totalCoupons: data.operational_summary?.total_coupons_issued || 0,
          totalLitres: data.operational_summary?.total_litres_allocated || 0,
          averageValuePerBox: data.operational_summary?.average_value_per_box || 0
        });
      } else {
        setFinancialData([]);
        setSummaryData({
          totalRevenue: 0,
          totalCosts: 0,
          totalProfit: 0,
          profitMargin: 0,
          revenueGrowth: 0,
          totalBoxes: 0,
          totalCoupons: 0,
          totalLitres: 0,
          averageValuePerBox: 0
        });
      }
    } catch (error) {
      console.error('Error loading financial data:', error);
      message.error('Failed to load financial analytics');
      setFinancialData([]);
    } finally {
      setLoading(false);
    }
  };

  // Export function
  const handleExportData = () => {
    try {
      const headers = ['Date', 'Revenue USD', 'Costs USD', 'Profit USD', 'Coupons Issued'];
      const csvContent = [
        headers.join(','),
        ...financialData.map(item => [
          item.date,
          item.revenueUSD,
          item.costsUSD,
          item.profitUSD,
          item.coupons
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `financial_analytics_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Export error:', error);
      message.error('Failed to export data');
    }
  };

  // Calculate totals and percentages from summary data
  const totalRevenueUSD = summaryData.totalRevenue;
  const totalCostsUSD = summaryData.totalCosts;
  const totalProfitUSD = summaryData.totalProfit;
  const profitMargin = summaryData.profitMargin;
  const totalCoupons = summaryData.totalCoupons;
  const revenueGrowth = summaryData.revenueGrowth;

  // Chart colors
  const chartColors = ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1'];

  const columns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
    },
    {
      title: 'Revenue (USD)',
      dataIndex: 'revenueUSD',
      key: 'revenueUSD',
      render: (value: number) => (
        <Space>
          <DollarOutlined style={{ color: '#52c41a' }} />
          <Text strong>${value.toLocaleString()}</Text>
        </Space>
      ),
    },
    {
      title: 'Costs (USD)',
      dataIndex: 'costsUSD',
      key: 'costsUSD',
      render: (value: number) => (
        <Space>
          <DollarOutlined style={{ color: '#f5222d' }} />
          <Text>${value.toLocaleString()}</Text>
        </Space>
      ),
    },
    {
      title: 'Profit (USD)',
      dataIndex: 'profitUSD',
      key: 'profitUSD',
      render: (value: number) => (
        <Space>
          <DollarOutlined style={{ color: value >= 0 ? '#52c41a' : '#f5222d' }} />
          <Text type={value >= 0 ? 'success' : 'danger'} strong>
            ${value.toLocaleString()}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Coupons',
      dataIndex: 'coupons',
      key: 'coupons',
      render: (value: number) => <Text>{value.toLocaleString()}</Text>,
    },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>Loading financial analytics...</div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={3}>
            <BarChartOutlined /> Financial Analytics
          </Title>
        </Col>
        <Col>
          <Space>
            <RangePicker
              value={dateRange}
              onChange={(dates) => {
                if (dates && dates[0] && dates[1]) {
                  setDateRange([dates[0], dates[1]]);
                }
              }}
              format="DD/MM/YYYY"
            />
            <Select
              value={selectedMetric}
              onChange={setSelectedMetric}
              style={{ width: 120 }}
            >
              <Option value="revenue">Revenue</Option>
              <Option value="profit">Profit</Option>
              <Option value="costs">Costs</Option>
            </Select>
            <Button 
              icon={<ExportOutlined />} 
              onClick={handleExportData}
              type="primary"
            >
              Export
            </Button>
          </Space>
        </Col>
      </Row>

      {/* Key Metrics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Revenue"
              value={totalRevenueUSD}
              prefix={<DollarOutlined />}
              suffix="USD"
              precision={0}
              valueStyle={{ color: '#52c41a' }}
            />
            <div style={{ marginTop: 8 }}>
              <Tag color={revenueGrowth >= 0 ? 'green' : 'red'}>
                {revenueGrowth >= 0 ? <RiseOutlined /> : <FallOutlined />}
                {Math.abs(revenueGrowth).toFixed(1)}%
              </Tag>
              <Text type="secondary" style={{ marginLeft: 8 }}>growth</Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Costs"
              value={totalCostsUSD}
              prefix={<DollarOutlined />}
              suffix="USD"
              precision={0}
              valueStyle={{ color: '#f5222d' }}
            />
            <div style={{ marginTop: 8 }}>
              <Text type="secondary">
                {((totalCostsUSD / (totalRevenueUSD || 1)) * 100).toFixed(1)}% of revenue
              </Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Net Profit"
              value={totalProfitUSD}
              prefix={<DollarOutlined />}
              suffix="USD"
              precision={0}
              valueStyle={{ color: totalProfitUSD >= 0 ? '#52c41a' : '#f5222d' }}
            />
            <div style={{ marginTop: 8 }}>
              <Progress
                percent={Math.abs(profitMargin)}
                status={profitMargin >= 0 ? 'success' : 'exception'}
                showInfo={false}
                size="small"
              />
              <Text type="secondary">{profitMargin.toFixed(1)}% margin</Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Boxes Processed"
              value={summaryData.totalBoxes}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
            <div style={{ marginTop: 8 }}>
              <Text type="secondary">
                ${summaryData.averageValuePerBox.toFixed(0)} avg/box
              </Text>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Secondary Metrics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={8}>
          <Card size="small">
            <Statistic
              title="Total Coupons Issued"
              value={summaryData.totalCoupons}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card size="small">
            <Statistic
              title="Total Litres Allocated"
              value={summaryData.totalLitres}
              suffix="L"
              precision={0}
              valueStyle={{ color: '#eb2f96' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card size="small">
            <Statistic
              title="Average Daily Revenue"
              value={totalRevenueUSD / Math.max(1, (dateRange[1].diff(dateRange[0], 'days') + 1))}
              prefix={<DollarOutlined />}
              suffix="USD"
              precision={0}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Charts Section */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={16}>
          <Card title="Financial Trends (USD)" extra={<BarChartOutlined />}>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={financialData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`} />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    `$${value.toLocaleString()}`,
                    name === 'revenueUSD' ? 'Revenue' : 
                    name === 'costsUSD' ? 'Costs' : 'Profit'
                  ]}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="revenueUSD"
                  stackId="1"
                  stroke="#52c41a"
                  fill="#52c41a"
                  fillOpacity={0.6}
                  name="Revenue USD"
                />
                <Area
                  type="monotone"
                  dataKey="costsUSD"
                  stackId="2"
                  stroke="#f5222d"
                  fill="#f5222d"
                  fillOpacity={0.6}
                  name="Costs USD"
                />
                <Area
                  type="monotone"
                  dataKey="profitUSD"
                  stackId="3"
                  stroke="#1890ff"
                  fill="#1890ff"
                  fillOpacity={0.6}
                  name="Profit USD"
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="Performance Metrics" extra={<PieChartOutlined />}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ marginBottom: 16 }}>
                <Text strong>Profit Margin</Text>
                <div>
                  <Progress
                    type="circle"
                    percent={Math.abs(profitMargin)}
                    status={profitMargin >= 0 ? 'success' : 'exception'}
                    format={(percent) => `${percent?.toFixed(1)}%`}
                  />
                </div>
              </div>
              <Divider />
              <div>
                <Text strong>Cost Efficiency</Text>
                <div style={{ marginTop: 8 }}>
                  <Progress
                    percent={totalCostsUSD > 0 ? (totalProfitUSD / totalCostsUSD) * 100 : 0}
                    status="active"
                    format={(percent) => `${percent?.toFixed(1)}%`}
                  />
                </div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Data Table */}
      <Card 
        title="Financial Details" 
        extra={
          <Button icon={<DownloadOutlined />} onClick={handleExportData}>
            Export CSV
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={financialData}
          rowKey="date"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} records`,
          }}
        />
      </Card>
    </div>
  );
};

export default AnalyticsFinance;
