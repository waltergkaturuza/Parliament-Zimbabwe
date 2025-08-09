// src/pages/admin/ReportsAnalyticsPage.tsx
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  Row,
  Col,
  Select,
  DatePicker,
  Button,
  Space,
  Typography,
  Statistic,
  Progress,
  Table,
  Tag,
  Tabs,
  Empty,
  Tooltip,
  Divider
} from 'antd';
import {
  BarChartOutlined,
  LineChartOutlined,
  PieChartOutlined,
  AreaChartOutlined,
  FileTextOutlined,
  DownloadOutlined,
  PrinterOutlined,
  ReloadOutlined,
  CalendarOutlined,
  RiseOutlined,
  FallOutlined,
  DollarOutlined,
  CarOutlined,
  UserOutlined
} from '@ant-design/icons';
import { motion } from 'framer-motion';
import dayjs from 'dayjs';
import { adminService } from '@/api/admin';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

interface ReportData {
  fuel_consumption: {
    daily: Array<{ date: string; petrol: number; diesel: number; total: number }>;
    monthly: Array<{ month: string; petrol: number; diesel: number; total: number }>;
    by_subcenter: Array<{ subcenter: string; total: number; percentage: number }>;
  };
  user_activity: {
    registrations: Array<{ date: string; count: number }>;
    logins: Array<{ date: string; count: number }>;
    by_role: Array<{ role: string; count: number; percentage: number }>;
  };
  system_performance: {
    response_times: Array<{ endpoint: string; avg_time: number; count: number }>;
    error_rates: Array<{ date: string; errors: number; total: number; rate: number }>;
    uptime: number;
  };
  financial: {
    fuel_costs: Array<{ date: string; usd_cost: number; zwg_cost: number }>;
    savings: Array<{ category: string; amount: number; percentage: number }>;
    budget_utilization: number;
  };
}

const ReportsAnalyticsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('fuel');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(30, 'days'),
    dayjs()
  ]);
  const [reportType, setReportType] = useState('summary');

  // Fetch reports data
  const { data: reportData, isLoading } = useQuery({
    queryKey: ['reports-analytics', dateRange, reportType],
    queryFn: async () => {
      // Mock data for now - replace with actual API call
      return {
        fuel_consumption: {
          daily: Array.from({ length: 30 }, (_, i) => ({
            date: dayjs().subtract(29 - i, 'days').format('YYYY-MM-DD'),
            petrol: Math.floor(Math.random() * 500) + 200,
            diesel: Math.floor(Math.random() * 300) + 150,
            total: 0 // Will be calculated
          })).map(item => ({ ...item, total: item.petrol + item.diesel })),
          monthly: Array.from({ length: 12 }, (_, i) => ({
            month: dayjs().subtract(11 - i, 'months').format('MMM YYYY'),
            petrol: 0,
            diesel: 0,
            total: 0
          })),
          by_subcenter: [
            { subcenter: 'Bulawayo Regional Office', total: 0, percentage: 0 },
            { subcenter: 'Harare Main Center', total: 0, percentage: 0 },
            { subcenter: 'Gweru District Office', total: 0, percentage: 0 },
            { subcenter: 'Mutare Regional Office', total: 0, percentage: 0 }
          ]
        },
        user_activity: {
          registrations: Array.from({ length: 30 }, (_, i) => ({
            date: dayjs().subtract(29 - i, 'days').format('YYYY-MM-DD'),
            count: 0
          })),
          logins: Array.from({ length: 30 }, (_, i) => ({
            date: dayjs().subtract(29 - i, 'days').format('YYYY-MM-DD'),
            count: 0
          })),
          by_role: [
            { role: 'BENEFICIARY', count: 0, percentage: 0 },
            { role: 'SUB_CENTER', count: 0, percentage: 0 },
            { role: 'MAIN_CENTER', count: 0, percentage: 0 },
            { role: 'ADMIN', count: 0, percentage: 0 },
            { role: 'AUDITOR', count: 0, percentage: 0 }
          ]
        },
        system_performance: {
          response_times: [
            { endpoint: '/api/v1/auth/login', avg_time: 0, count: 0 },
            { endpoint: '/api/v1/coupons/', avg_time: 0, count: 0 },
            { endpoint: '/api/v1/allocations/', avg_time: 0, count: 0 },
            { endpoint: '/api/v1/admin/dashboard/', avg_time: 0, count: 0 }
          ],
          error_rates: Array.from({ length: 30 }, (_, i) => ({
            date: dayjs().subtract(29 - i, 'days').format('YYYY-MM-DD'),
            errors: 0,
            total: 0,
            rate: 0
          })).map(item => ({ ...item, rate: (item.errors / item.total) * 100 })),
          uptime: 99.87
        },
        financial: {
          fuel_costs: Array.from({ length: 30 }, (_, i) => ({
            date: dayjs().subtract(29 - i, 'days').format('YYYY-MM-DD'),
            usd_cost: Math.floor(Math.random() * 5000) + 2000,
            zwg_cost: Math.floor(Math.random() * 137500) + 55000
          })),
          savings: [
            // All savings data should come from backend API
            // For now, return empty array to avoid hard-coded data
          ],
          budget_utilization: 0 // Should come from backend API
        }
      } as ReportData;
    }
  });

  const handleExportReport = (format: 'pdf' | 'excel' | 'csv') => {
    console.log(`Exporting report as ${format}`);
    // Implement export functionality
  };

  const tabItems = [
    {
      key: 'fuel',
      label: (
        <span>
          <CarOutlined />
          Fuel Consumption
        </span>
      ),
      children: (
        <Row gutter={[24, 24]}>
          {/* Summary Cards */}
          <Col span={24}>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={8}>
                <Card size="small">
                  <Statistic
                    title="Total Fuel Consumed (30 days)"
                    value={reportData?.fuel_consumption.daily.reduce((sum, item) => sum + item.total, 0) || 0}
                    suffix="L"
                    valueStyle={{ color: '#1890ff' }}
                    prefix={<CarOutlined />}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={8}>
                <Card size="small">
                  <Statistic
                    title="Average Daily Consumption"
                    value={Math.round((reportData?.fuel_consumption.daily.reduce((sum, item) => sum + item.total, 0) || 0) / 30)}
                    suffix="L/day"
                    valueStyle={{ color: '#52c41a' }}
                    prefix={<RiseOutlined />}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={8}>
                <Card size="small">
                  <Statistic
                    title="Top Consuming Center"
                    value={reportData?.fuel_consumption.by_subcenter[0]?.subcenter.split(' ')[0] || 'N/A'}
                    suffix={`${reportData?.fuel_consumption.by_subcenter[0]?.percentage}%`}
                    valueStyle={{ color: '#722ed1' }}
                    prefix={<BarChartOutlined />}
                  />
                </Card>
              </Col>
            </Row>
          </Col>

          {/* Daily Consumption Chart */}
          <Col xs={24} lg={16}>
            <Card title="Daily Fuel Consumption (Last 30 Days)" size="small">
              <div className="h-80 flex items-center justify-center">
                <Empty 
                  description="Chart visualization would be implemented with a charting library like Recharts or Chart.js"
                  image={<AreaChartOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />}
                />
              </div>
            </Card>
          </Col>

          {/* Consumption by Sub-Center */}
          <Col xs={24} lg={8}>
            <Card title="Consumption by Sub-Center" size="small">
              <div className="space-y-4">
                {reportData?.fuel_consumption.by_subcenter.map((item, index) => (
                  <div key={index}>
                    <div className="flex justify-between mb-1">
                      <Text className="text-sm">{item.subcenter}</Text>
                      <Text className="text-sm font-medium">{item.percentage}%</Text>
                    </div>
                    <Progress 
                      percent={item.percentage} 
                      showInfo={false}
                      strokeColor={['#1890ff', '#52c41a', '#faad14', '#f5222d'][index]}
                    />
                  </div>
                ))}
              </div>
            </Card>
          </Col>

          {/* Monthly Trend Table */}
          <Col span={24}>
            <Card title="Monthly Consumption Trends" size="small">
              <Table
                size="small"
                dataSource={reportData?.fuel_consumption.monthly || []}
                rowKey="month"
                columns={[
                  { title: 'Month', dataIndex: 'month', key: 'month' },
                  { 
                    title: 'Petrol (L)', 
                    dataIndex: 'petrol', 
                    key: 'petrol',
                    render: (value: number) => value.toLocaleString()
                  },
                  { 
                    title: 'Diesel (L)', 
                    dataIndex: 'diesel', 
                    key: 'diesel',
                    render: (value: number) => value.toLocaleString()
                  },
                  { 
                    title: 'Total (L)', 
                    dataIndex: 'total', 
                    key: 'total',
                    render: (value: number) => (
                      <Text strong>{value.toLocaleString()}</Text>
                    )
                  }
                ]}
                pagination={false}
                scroll={{ x: true }}
              />
            </Card>
          </Col>
        </Row>
      )
    },
    {
      key: 'users',
      label: (
        <span>
          <UserOutlined />
          User Activity
        </span>
      ),
      children: (
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={12}>
            <Card title="User Registrations (Last 30 Days)" size="small">
              <div className="h-64 flex items-center justify-center">
                <Empty 
                  description="Line chart showing daily user registrations"
                  image={<LineChartOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />}
                />
              </div>
            </Card>
          </Col>
          
          <Col xs={24} lg={12}>
            <Card title="Daily Login Activity" size="small">
              <div className="h-64 flex items-center justify-center">
                <Empty 
                  description="Bar chart showing daily login counts"
                  image={<BarChartOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />}
                />
              </div>
            </Card>
          </Col>

          <Col span={24}>
            <Card title="Users by Role Distribution" size="small">
              <Row gutter={[16, 16]}>
                {reportData?.user_activity.by_role.map((item, index) => (
                  <Col xs={24} sm={12} lg={8} key={index}>
                    <div className="text-center p-4 border rounded">
                      <div className="text-2xl font-bold mb-2" style={{ color: ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1'][index] }}>
                        {item.count}
                      </div>
                      <div className="text-sm text-gray-500 mb-2">{item.role.replace('_', ' ')}</div>
                      <Progress 
                        type="circle" 
                        size={60}
                        percent={item.percentage}
                        strokeColor={['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1'][index]}
                      />
                    </div>
                  </Col>
                ))}
              </Row>
            </Card>
          </Col>
        </Row>
      )
    },
    {
      key: 'performance',
      label: (
        <span>
          <LineChartOutlined />
          Performance
        </span>
      ),
      children: (
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={8}>
            <Card size="small">
              <Statistic
                title="System Uptime"
                value={reportData?.system_performance.uptime || 0}
                precision={2}
                suffix="%"
                valueStyle={{ color: '#52c41a' }}
                prefix={<RiseOutlined />}
              />
            </Card>
          </Col>
          
          <Col xs={24} lg={16}>
            <Card title="API Response Times" size="small">
              <Table
                size="small"
                dataSource={reportData?.system_performance.response_times || []}
                rowKey="endpoint"
                columns={[
                  { title: 'API Endpoint', dataIndex: 'endpoint', key: 'endpoint' },
                  { 
                    title: 'Avg Response Time', 
                    dataIndex: 'avg_time', 
                    key: 'avg_time',
                    render: (value: number) => `${value}ms`,
                    sorter: (a, b) => a.avg_time - b.avg_time
                  },
                  { 
                    title: 'Request Count', 
                    dataIndex: 'count', 
                    key: 'count',
                    render: (value: number) => value.toLocaleString()
                  },
                  {
                    title: 'Performance',
                    key: 'performance',
                    render: (_, record) => (
                      <Tag color={record.avg_time < 200 ? 'green' : record.avg_time < 500 ? 'orange' : 'red'}>
                        {record.avg_time < 200 ? 'Excellent' : record.avg_time < 500 ? 'Good' : 'Needs Attention'}
                      </Tag>
                    )
                  }
                ]}
                pagination={false}
              />
            </Card>
          </Col>

          <Col span={24}>
            <Card title="Error Rate Trends" size="small">
              <div className="h-64 flex items-center justify-center">
                <Empty 
                  description="Error rate chart over time"
                  image={<AreaChartOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />}
                />
              </div>
            </Card>
          </Col>
        </Row>
      )
    },
    {
      key: 'financial',
      label: (
        <span>
          <DollarOutlined />
          Financial
        </span>
      ),
      children: (
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={8}>
            <Card size="small">
              <Statistic
                title="Budget Utilization"
                value={reportData?.financial.budget_utilization || 0}
                precision={1}
                suffix="%"
                valueStyle={{ color: '#1890ff' }}
                prefix={<DollarOutlined />}
              />
              <Progress 
                percent={reportData?.financial.budget_utilization || 0}
                strokeColor="#1890ff"
                className="mt-2"
              />
            </Card>
          </Col>

          <Col xs={24} lg={16}>
            <Card title="Cost Savings Analysis" size="small">
              <div className="space-y-4">
                {reportData?.financial.savings.map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-3 border rounded">
                    <div>
                      <div className="font-medium">{item.category}</div>
                      <div className="text-sm text-gray-500">{item.percentage}% savings</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-600">
                        ${item.amount.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">USD saved</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </Col>

          <Col span={24}>
            <Card title="Daily Fuel Costs (USD vs ZWG)" size="small">
              <div className="h-64 flex items-center justify-center">
                <Empty 
                  description="Dual-axis chart showing costs in both currencies"
                  image={<LineChartOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />}
                />
              </div>
            </Card>
          </Col>
        </Row>
      )
    }
  ];

  return (
    <div className="p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex justify-between items-center mb-6">
          <div>
            <Title level={2} className="!mb-0">Reports & Analytics</Title>
            <Text type="secondary">Comprehensive system reports and data analytics</Text>
          </div>
          <Space>
            <RangePicker
              value={dateRange}
              onChange={(dates) => setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs])}
              format="MMM DD, YYYY"
            />
            <Select value={reportType} onChange={setReportType} className="w-32">
              <Option value="summary">Summary</Option>
              <Option value="detailed">Detailed</Option>
              <Option value="custom">Custom</Option>
            </Select>
            <Button icon={<ReloadOutlined />}>Refresh</Button>
            <Button icon={<DownloadOutlined />} onClick={() => handleExportReport('pdf')}>
              Export PDF
            </Button>
            <Button icon={<FileTextOutlined />} onClick={() => handleExportReport('excel')}>
              Export Excel
            </Button>
          </Space>
        </div>

        <Card>
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={tabItems}
            size="large"
          />
        </Card>
      </motion.div>
    </div>
  );
};

export default ReportsAnalyticsPage;
