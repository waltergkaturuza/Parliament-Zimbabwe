// src/components/fuel/dynamic/AllocationAnalytics.tsx
// Dynamic Fuel Allocation Analytics Component

import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  DatePicker,
  Select,
  Button,
  Space,
  Table,
  Tag,
  Progress,
  Alert,
  message,
  Tooltip,
  Typography
} from 'antd';
import {
  BarChartOutlined,
  LineChartOutlined,
  PieChartOutlined,
  DownloadOutlined,
  ReloadOutlined,
  RiseOutlined,
  DollarOutlined,
  CarOutlined,
  UserOutlined
} from '@ant-design/icons';
import {
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
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import type { ColumnsType } from 'antd/es/table';
import type { RangePickerProps } from 'antd/es/date-picker';
import dayjs from 'dayjs';

// API and Types
import dynamicAllocationApi from '../../../api/dynamicAllocation';
import type {
  AllocationAnalytics as IAllocationAnalytics,
  DynamicAllocation,
  EnhancedParliamentSession
} from '../../../types/dynamicAllocation';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { Title, Text } = Typography;

interface AnalyticsFilter {
  dateRange: [string, string] | null;
  sessionId: number | undefined;
  constituencyId: number | undefined;
}

interface ChartData {
  name: string;
  value: number;
  litres?: number;
  usd?: number;
  count?: number;
}

const AllocationAnalytics: React.FC = () => {
  // State
  const [loading, setLoading] = useState<boolean>(true);
  const [analytics, setAnalytics] = useState<IAllocationAnalytics | null>(null);
  const [sessions, setSessions] = useState<EnhancedParliamentSession[]>([]);
  const [filters, setFilters] = useState<AnalyticsFilter>({
    dateRange: null,
    sessionId: undefined,
    constituencyId: undefined
  });

  // Chart colors
  const colors = ['#1890ff', '#52c41a', '#fa8c16', '#eb2f96', '#722ed1', '#13c2c2', '#facc14', '#f5222d'];

  // Load analytics data
  const loadAnalytics = async () => {
    try {
      setLoading(true);

      // Prepare API parameters
      const params: any = {};
      if (filters.dateRange) {
        params.start_date = filters.dateRange[0];
        params.end_date = filters.dateRange[1];
      }
      if (filters.sessionId) {
        params.session_id = filters.sessionId;
      }
      if (filters.constituencyId) {
        params.constituency_id = filters.constituencyId;
      }

      const [analyticsRes, sessionsRes] = await Promise.all([
        dynamicAllocationApi.analytics.getAnalytics(params),
        dynamicAllocationApi.enhancedSessions.getAll()
      ]);

      setAnalytics(analyticsRes);
      setSessions(sessionsRes.results || []);
    } catch (error: any) {
      console.error('Failed to load analytics:', error);
      message.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  // Handle filter changes
  const handleFilterChange = (key: keyof AnalyticsFilter, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Handle date range change
  const handleDateRangeChange: RangePickerProps['onChange'] = (dates) => {
    if (dates && dates[0] && dates[1]) {
      setFilters(prev => ({
        ...prev,
        dateRange: [dates[0].format('YYYY-MM-DD'), dates[1].format('YYYY-MM-DD')]
      }));
    } else {
      setFilters(prev => ({ ...prev, dateRange: null }));
    }
  };

  // Export analytics data
  const exportAnalytics = async (format: 'csv' | 'excel' | 'pdf') => {
    try {
      const params: any = { format };
      if (filters.dateRange) {
        params.start_date = filters.dateRange[0];
        params.end_date = filters.dateRange[1];
      }
      if (filters.sessionId) {
        params.session_id = filters.sessionId;
      }

      const blob = await dynamicAllocationApi.analytics.exportAllocations(params);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `allocation_analytics_${dayjs().format('YYYY-MM-DD')}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
      
      message.success(`Analytics exported as ${format.toUpperCase()}`);
    } catch (error: any) {
      console.error('Export failed:', error);
      message.error('Failed to export analytics');
    }
  };

  // Prepare chart data
  const getConstituencyData = (): ChartData[] => {
    if (!analytics?.constituency_breakdown) return [];
    
    return Object.entries(analytics.constituency_breakdown).map(([name, data]) => ({
      name,
      value: data.total_litres,
      litres: data.total_litres,
      usd: data.total_usd,
      count: data.allocation_count
    }));
  };

  const getEngineCategoryData = (): ChartData[] => {
    if (!analytics?.engine_category_breakdown) return [];
    
    return Object.entries(analytics.engine_category_breakdown).map(([name, data]) => ({
      name,
      value: data.allocation_count,
      litres: data.total_litres,
      usd: data.total_usd,
      count: data.allocation_count
    }));
  };

  const getMonthlyTrendData = (): ChartData[] => {
    if (!analytics?.monthly_trends) return [];
    
    return analytics.monthly_trends.map(trend => ({
      name: trend.month,
      value: trend.total_litres,
      litres: trend.total_litres,
      usd: trend.total_usd,
      count: trend.allocation_count
    }));
  };

  // Top allocations table columns
  const topAllocationsColumns: ColumnsType<any> = [
    {
      title: 'Rank',
      key: 'rank',
      width: 60,
      render: (_, __, index) => (
        <Tag color={index < 3 ? 'gold' : 'blue'}>
          #{index + 1}
        </Tag>
      )
    },
    {
      title: 'Beneficiary',
      key: 'beneficiary',
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <strong>{record.beneficiary_name}</strong>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.constituency_name}
          </Text>
        </Space>
      )
    },
    {
      title: 'Total Allocation',
      key: 'allocation',
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <Text strong style={{ color: '#1890ff' }}>
            {record.total_litres.toFixed(2)}L
          </Text>
          <Text strong style={{ color: '#52c41a', fontSize: '12px' }}>
            ${record.total_usd.toFixed(2)}
          </Text>
        </Space>
      )
    },
    {
      title: 'Allocations',
      dataIndex: 'allocation_count',
      key: 'count',
      render: (count: number) => (
        <Tag color="purple">{count} times</Tag>
      )
    }
  ];

  // Load data on mount and filter changes
  useEffect(() => {
    loadAnalytics();
  }, [filters]);

  return (
    <div>
      {/* Filters */}
      <Card size="small" style={{ marginBottom: '16px' }}>
        <Row gutter={16} align="middle">
          <Col xs={24} sm={8} md={6}>
            <RangePicker
              onChange={handleDateRangeChange}
              style={{ width: '100%' }}
              placeholder={['Start Date', 'End Date']}
            />
          </Col>
          <Col xs={24} sm={8} md={6}>
            <Select
              placeholder="Parliament Session"
              value={filters.sessionId}
              onChange={(value) => handleFilterChange('sessionId', value)}
              allowClear
              style={{ width: '100%' }}
            >
              {sessions.map(session => (
                <Option key={session.id} value={session.id}>
                  {session.name}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={8} md={6}>
            <Space>
              <Button
                type="primary"
                icon={<ReloadOutlined />}
                onClick={loadAnalytics}
                loading={loading}
              >
                Refresh
              </Button>
              <Button
                icon={<DownloadOutlined />}
                onClick={() => exportAnalytics('csv')}
              >
                Export CSV
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Summary Statistics */}
      {analytics && (
        <Card title="Overview Statistics" loading={loading} style={{ marginBottom: '16px' }}>
          <Row gutter={16}>
            <Col xs={12} sm={6}>
              <Statistic
                title="Total Allocations"
                value={analytics.total_allocations}
                prefix={<UserOutlined style={{ color: '#1890ff' }} />}
              />
            </Col>
            <Col xs={12} sm={6}>
              <Statistic
                title="Total Litres"
                value={analytics.total_litres}
                precision={2}
                suffix="L"
                prefix={<CarOutlined style={{ color: '#52c41a' }} />}
              />
            </Col>
            <Col xs={12} sm={6}>
              <Statistic
                title="Total USD"
                value={analytics.total_usd}
                precision={2}
                prefix="$"
                valueStyle={{ color: '#cf1322' }}
                suffix="USD"
              />
            </Col>
            <Col xs={12} sm={6}>
              <Statistic
                title="Average per Allocation"
                value={analytics.average_allocation_litres}
                precision={2}
                suffix="L"
                prefix={<RiseOutlined style={{ color: '#722ed1' }} />}
              />
            </Col>
          </Row>
        </Card>
      )}

      {/* Charts Section */}
      <Row gutter={16} style={{ marginBottom: '16px' }}>
        {/* Constituency Breakdown */}
        <Col xs={24} lg={12}>
          <Card title="Allocation by Constituency" loading={loading}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={getConstituencyData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                <YAxis />
                <RechartsTooltip 
                  formatter={(value, name) => [
                    `${Number(value).toFixed(2)}L`,
                    'Total Litres'
                  ]}
                  labelFormatter={(label) => `Constituency: ${label}`}
                />
                <Bar dataKey="value" fill="#1890ff" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        {/* Engine Category Breakdown */}
        <Col xs={24} lg={12}>
          <Card title="Allocation by Engine Category" loading={loading}>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={getEngineCategoryData()}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {getEngineCategoryData().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  formatter={(value) => [`${value} allocations`, 'Count']}
                />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* Monthly Trends */}
      {analytics?.monthly_trends && analytics.monthly_trends.length > 0 && (
        <Card title="Monthly Allocation Trends" loading={loading} style={{ marginBottom: '16px' }}>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={getMonthlyTrendData()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <RechartsTooltip 
                formatter={(value, name) => [
                  name === 'litres' ? `${Number(value).toFixed(2)}L` : 
                  name === 'usd' ? `$${Number(value).toFixed(2)}` : value,
                  name === 'litres' ? 'Total Litres' :
                  name === 'usd' ? 'Total USD' : 'Count'
                ]}
                labelFormatter={(label) => `Month: ${label}`}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="litres" 
                stroke="#1890ff" 
                strokeWidth={2}
                name="Total Litres"
              />
              <Line 
                type="monotone" 
                dataKey="count" 
                stroke="#52c41a" 
                strokeWidth={2}
                name="Allocation Count"
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Top Beneficiaries */}
      {analytics?.top_beneficiaries && analytics.top_beneficiaries.length > 0 && (
        <Card title="Top Beneficiaries" loading={loading}>
          <Table
            columns={topAllocationsColumns}
            dataSource={analytics.top_beneficiaries}
            rowKey="beneficiary_id"
            size="small"
            pagination={{ pageSize: 10 }}
          />
        </Card>
      )}

      {/* No Data State */}
      {!loading && (!analytics || analytics.total_allocations === 0) && (
        <Card>
          <Alert
            message="No Analytics Data"
            description="No allocation data found for the selected filters. Try adjusting your date range or session filter."
            type="info"
            showIcon
            style={{ textAlign: 'center' }}
          />
        </Card>
      )}
    </div>
  );
};

export default AllocationAnalytics;
