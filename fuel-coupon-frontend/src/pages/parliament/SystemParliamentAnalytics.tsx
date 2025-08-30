// src/pages/parliament/SystemParliamentAnalytics.tsx
import React, { useState, useEffect } from 'react';
import type { FC } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Typography,
  Select,
  Spin,
  Progress,
  Table,
  Tag,
  Space,
  Button,
  App
} from 'antd';
import {
  BarChartOutlined,
  LineChartOutlined,
  RiseOutlined,
  TeamOutlined,
  CalendarOutlined,
  CarOutlined,
  EnvironmentOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  DashboardOutlined,
  FileTextOutlined,
  ExportOutlined
} from '@ant-design/icons';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import apiClient from '@/api/index';

const { Title, Text } = Typography;
const { Option } = Select;

interface SubCenterPerformance {
  name: string;
  sessions: number;
  attendance_rate: number;
  fuel_efficiency: number;
  compliance_score: number;
  status: 'excellent' | 'good' | 'needs_improvement' | 'poor';
}

interface TrendData {
  month: string;
  sessions: number;
  attendance: number;
  fuel_usage: number;
  efficiency: number;
}

const SystemParliamentAnalytics: FC = () => {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(true);
  const [performanceData, setPerformanceData] = useState<SubCenterPerformance[]>([]);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('last_6_months');
  const [selectedMetric, setSelectedMetric] = useState<string>('all');

  const [stats, setStats] = useState({
    totalSessions: 0,
    totalAttendance: 0,
    totalFuelAllocated: 0,
    averageEfficiency: 0,
    activeSubcenters: 0,
    systemCompliance: 0,
    monthlyGrowth: 0,
    costPerSession: 0
  });

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      await Promise.allSettled([
        loadOverviewStats(),
        loadPerformanceData(),
        loadTrendData()
      ]);
      setLoading(false);
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPeriod, selectedMetric]);

  const loadOverviewStats = async () => {
    try {
      const res = await apiClient.get('/subcenter/overview/', { params: { include_parliament_data: true } });
      const d = res.data || {};
      setStats({
        totalSessions: d.total_sessions || 0,
        totalAttendance: d.total_attendance || 0,
        totalFuelAllocated: d.total_fuel_allocated || 0,
        averageEfficiency: d.average_compliance || 0,
        activeSubcenters: d.active_subcenters || 0,
        systemCompliance: d.average_compliance || 0,
        monthlyGrowth: d.monthly_growth || 0,
        costPerSession: d.cost_per_session || 0
      });
    } catch (error: any) {
      console.error('Error loading overview stats:', error);
      message.error('Failed to load overview stats');
    }
  };

  const loadPerformanceData = async () => {
    try {
      const res = await apiClient.get('/subcenter/statistics/', { params: { include_parliament_data: true } });
      const items = Array.isArray(res.data) ? res.data : (Array.isArray(res.data?.results) ? res.data.results : []);
      const mapped: SubCenterPerformance[] = items.map((it: any) => ({
        name: it.name || it.subcenter_name || 'Unknown',
        sessions: it.sessions || it.sessions_count || 0,
        attendance_rate: it.attendance_rate || it.avg_attendance_rate || 0,
        fuel_efficiency: it.fuel_efficiency || it.avg_fuel_efficiency || 0,
        compliance_score: it.compliance_score || it.avg_compliance || 0,
        status: (it.status as SubCenterPerformance['status']) || 'good',
      }));
      setPerformanceData(mapped);
    } catch (error: any) {
      console.error('Error loading performance data:', error);
      message.error('Failed to load subcenter performance');
      setPerformanceData([]);
    }
  };

  const loadTrendData = async () => {
    try {
      const res = await apiClient.get('/parliament/analytics/', { params: { period: selectedPeriod, metric: selectedMetric } });
      const items = Array.isArray(res.data) ? res.data : (Array.isArray(res.data?.results) ? res.data.results : []);
      const mapped: TrendData[] = items.map((it: any) => ({
        month: it.period || it.month || '',
        sessions: it.sessions_count || it.sessions || 0,
        attendance: it.total_attendance || it.attendance || 0,
        fuel_usage: it.fuel_allocated || it.fuel_usage || 0,
        efficiency: it.compliance_score || it.efficiency || 0,
      }));
      setTrendData(mapped);
    } catch (error: any) {
      console.error('Error loading trend data:', error);
      message.error('Failed to load trend data');
      setTrendData([]);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'green';
      case 'good': return 'blue';
      case 'needs_improvement': return 'orange';
      case 'poor': return 'red';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent': return <CheckCircleOutlined />;
      case 'good': return <CheckCircleOutlined />;
      case 'needs_improvement': return <ExclamationCircleOutlined />;
      case 'poor': return <ClockCircleOutlined />;
      default: return <ClockCircleOutlined />;
    }
  };

  const performanceColumns = [
    {
      title: 'SubCenter',
      dataIndex: 'name',
      key: 'name',
      sorter: (a: SubCenterPerformance, b: SubCenterPerformance) => a.name.localeCompare(b.name),
    },
    {
      title: 'Sessions',
      dataIndex: 'sessions',
      key: 'sessions',
      sorter: (a: SubCenterPerformance, b: SubCenterPerformance) => a.sessions - b.sessions,
      render: (sessions: number) => <Text strong>{sessions}</Text>
    },
    {
      title: 'Attendance Rate',
      dataIndex: 'attendance_rate',
      key: 'attendance_rate',
      sorter: (a: SubCenterPerformance, b: SubCenterPerformance) => a.attendance_rate - b.attendance_rate,
      render: (rate: number) => (
        <Progress
          percent={rate}
          size="small"
          status={rate >= 80 ? 'success' : rate >= 65 ? 'normal' : 'exception'}
        />
      )
    },
    {
      title: 'Compliance Score',
      dataIndex: 'compliance_score',
      key: 'compliance_score',
      sorter: (a: SubCenterPerformance, b: SubCenterPerformance) => a.compliance_score - b.compliance_score,
      render: (score: number) => (
        <Progress
          percent={score}
          size="small"
          status={score >= 90 ? 'success' : score >= 75 ? 'normal' : 'exception'}
        />
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)} icon={getStatusIcon(status)}>
          {status.replace('_', ' ').toUpperCase()}
        </Tag>
      )
    }
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>Loading system analytics...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>
          <DashboardOutlined /> System Parliament Analytics
        </Title>
        <Text type="secondary">
          Comprehensive analytics and performance insights across all parliamentary operations
        </Text>
      </div>

      <Space style={{ marginBottom: 24 }}>
        <Select
          value={selectedPeriod}
          onChange={setSelectedPeriod}
          style={{ width: 200 }}
        >
          <Option value="last_month">Last Month</Option>
          <Option value="last_3_months">Last 3 Months</Option>
          <Option value="last_6_months">Last 6 Months</Option>
          <Option value="last_year">Last Year</Option>
        </Select>
        
        <Select
          value={selectedMetric}
          onChange={setSelectedMetric}
          style={{ width: 200 }}
        >
          <Option value="all">All Metrics</Option>
          <Option value="sessions">Sessions Only</Option>
          <Option value="attendance">Attendance Only</Option>
          <Option value="fuel">Fuel Allocation</Option>
          <Option value="compliance">Compliance</Option>
        </Select>

        <Button type="primary" icon={<ExportOutlined />}>
          Export Report
        </Button>
      </Space>

      {/* Key Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card>
            <Statistic
              title="Total Sessions"
              value={stats.totalSessions}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card>
            <Statistic
              title="Total Attendance"
              value={stats.totalAttendance}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card>
            <Statistic
              title="Fuel Allocated (L)"
              value={stats.totalFuelAllocated}
              prefix={<CarOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card>
            <Statistic
              title="System Efficiency"
              value={stats.averageEfficiency}
              suffix="%"
              prefix={<RiseOutlined />}
              valueStyle={{ color: stats.averageEfficiency >= 85 ? '#52c41a' : '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card>
            <Statistic
              title="Active SubCenters"
              value={stats.activeSubcenters}
              prefix={<EnvironmentOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card>
            <Statistic
              title="System Compliance"
              value={stats.systemCompliance}
              suffix="%"
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: stats.systemCompliance >= 85 ? '#52c41a' : '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card>
            <Statistic
              title="Monthly Growth"
              value={stats.monthlyGrowth}
              suffix="%"
              prefix={<RiseOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card>
            <Statistic
              title="Cost per Session"
              value={stats.costPerSession}
              prefix="$"
              precision={2}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Trend Charts */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <Card title={<><LineChartOutlined /> Session & Attendance Trends</>}>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <RechartsTooltip />
                <Legend />
                <Line type="monotone" dataKey="sessions" stroke="#1890ff" name="Sessions" />
                <Line type="monotone" dataKey="attendance" stroke="#52c41a" name="Attendance" />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title={<><BarChartOutlined /> Fuel Usage & Efficiency</>}>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <RechartsTooltip />
                <Legend />
                <Area type="monotone" dataKey="fuel_usage" stackId="1" stroke="#faad14" fill="#faad14" name="Fuel Usage" />
                <Area type="monotone" dataKey="efficiency" stackId="2" stroke="#722ed1" fill="#722ed1" name="Efficiency %" />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* SubCenter Performance Table */}
      <Card 
        title={<><BarChartOutlined /> SubCenter Performance Analysis</>}
        extra={
          <Space>
            <Button icon={<FileTextOutlined />}>Generate Report</Button>
            <Button type="primary" icon={<ExportOutlined />}>Export Data</Button>
          </Space>
        }
      >
        <Table
          columns={performanceColumns}
          dataSource={performanceData}
          rowKey="name"
          pagination={{ pageSize: 10 }}
          scroll={{ x: 800 }}
        />
      </Card>
    </div>
  );
};

export default SystemParliamentAnalytics;
