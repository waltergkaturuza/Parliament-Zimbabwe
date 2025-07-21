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
  DatePicker,
  Spin,
  Progress,
  Table,
  Tag,
  Space,
  Button,
  Alert,
  Tooltip,
  Divider,
  App
} from 'antd';
import {
  BarChartOutlined,
  LineChartOutlined,
  PieChartOutlined,
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
  BarChart,
  Bar,
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
import apiClient from '@/api/apiClient';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

interface AnalyticsData {
  period: string;
  sessions: number;
  attendance: number;
  fuel_allocated: number;
  subcenters_active: number;
  programs: number;
  compliance_score: number;
}

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
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData[]>([]);
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
    loadAnalytics();
    loadPerformanceData();
    loadTrendData();
    loadStats();
  }, [selectedPeriod, selectedMetric]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      
      // Mock analytics data
      const mockAnalytics: AnalyticsData[] = [
        {
          period: 'December 2024',
          sessions: 89,
          attendance: 1245,
          fuel_allocated: 24500,
          subcenters_active: 8,
          programs: 15,
          compliance_score: 92
        },
        {
          period: 'November 2024',
          sessions: 76,
          attendance: 1089,
          fuel_allocated: 21800,
          subcenters_active: 7,
          programs: 12,
          compliance_score: 88
        },
        {
          period: 'October 2024',
          sessions: 82,
          attendance: 1156,
          fuel_allocated: 23200,
          subcenters_active: 8,
          programs: 14,
          compliance_score: 90
        },
        {
          period: 'September 2024',
          sessions: 71,
          attendance: 987,
          fuel_allocated: 19500,
          subcenters_active: 6,
          programs: 11,
          compliance_score: 85
        },
        {
          period: 'August 2024',
          sessions: 68,
          attendance: 932,
          fuel_allocated: 18200,
          subcenters_active: 6,
          programs: 10,
          compliance_score: 83
        },
        {
          period: 'July 2024',
          sessions: 74,
          attendance: 1021,
          fuel_allocated: 20100,
          subcenters_active: 7,
          programs: 13,
          compliance_score: 87
        }
      ];

      setAnalyticsData(mockAnalytics);
    } catch (error) {
      console.error('Error loading analytics:', error);
      message.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const loadPerformanceData = async () => {
    try {
      // Mock performance data
      const mockPerformance: SubCenterPerformance[] = [
        {
          name: 'Harare Central',
          sessions: 45,
          attendance_rate: 94,
          fuel_efficiency: 89,
          compliance_score: 96,
          status: 'excellent'
        },
        {
          name: 'Bulawayo',
          sessions: 32,
          attendance_rate: 87,
          fuel_efficiency: 85,
          compliance_score: 91,
          status: 'good'
        },
        {
          name: 'Chitungwiza',
          sessions: 28,
          attendance_rate: 82,
          fuel_efficiency: 78,
          compliance_score: 84,
          status: 'good'
        },
        {
          name: 'Gweru',
          sessions: 15,
          attendance_rate: 68,
          fuel_efficiency: 65,
          compliance_score: 72,
          status: 'needs_improvement'
        },
        {
          name: 'Mutare',
          sessions: 22,
          attendance_rate: 79,
          fuel_efficiency: 81,
          compliance_score: 86,
          status: 'good'
        },
        {
          name: 'Masvingo',
          sessions: 18,
          attendance_rate: 71,
          fuel_efficiency: 69,
          compliance_score: 75,
          status: 'needs_improvement'
        }
      ];

      setPerformanceData(mockPerformance);
    } catch (error) {
      console.error('Error loading performance data:', error);
    }
  };

  const loadTrendData = async () => {
    try {
      // Mock trend data
      const mockTrends: TrendData[] = [
        { month: 'Jul', sessions: 74, attendance: 1021, fuel_usage: 20100, efficiency: 87 },
        { month: 'Aug', sessions: 68, attendance: 932, fuel_usage: 18200, efficiency: 83 },
        { month: 'Sep', sessions: 71, attendance: 987, fuel_usage: 19500, efficiency: 85 },
        { month: 'Oct', sessions: 82, attendance: 1156, fuel_usage: 23200, efficiency: 90 },
        { month: 'Nov', sessions: 76, attendance: 1089, fuel_usage: 21800, efficiency: 88 },
        { month: 'Dec', sessions: 89, attendance: 1245, fuel_usage: 24500, efficiency: 92 }
      ];

      setTrendData(mockTrends);
    } catch (error) {
      console.error('Error loading trend data:', error);
    }
  };

  const loadStats = async () => {
    try {
      // Mock stats
      setStats({
        totalSessions: 460,
        totalAttendance: 6430,
        totalFuelAllocated: 127300,
        averageEfficiency: 86,
        activeSubcenters: 8,
        systemCompliance: 89,
        monthlyGrowth: 12.5,
        costPerSession: 276.8
      });
    } catch (error) {
      console.error('Error loading stats:', error);
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
          status={rate >= 85 ? 'success' : rate >= 70 ? 'normal' : 'exception'}
        />
      )
    },
    {
      title: 'Fuel Efficiency',
      dataIndex: 'fuel_efficiency',
      key: 'fuel_efficiency',
      sorter: (a: SubCenterPerformance, b: SubCenterPerformance) => a.fuel_efficiency - b.fuel_efficiency,
      render: (efficiency: number) => (
        <Progress
          percent={efficiency}
          size="small"
          status={efficiency >= 80 ? 'success' : efficiency >= 65 ? 'normal' : 'exception'}
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

  const COLORS = ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1', '#fa8c16'];

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

      <Alert
        message="Real-time Analytics Dashboard"
        description="This dashboard provides real-time insights into parliament session management, attendance tracking, fuel allocation efficiency, and subcenter performance across the entire system."
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

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
