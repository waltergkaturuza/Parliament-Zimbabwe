import * as React from 'react';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { adminService } from '@/api/admin';
import { useAuth } from '@/contexts/AuthContext';
import {
  Layout,
  Card,
  Row,
  Col,
  Statistic,
  Progress,
  Typography,
  Space,
  Button,
  Alert,
  Tabs,
  Empty,
  Spin,
  ConfigProvider,
  theme,
  Grid,
  Segmented,
  App,
} from 'antd';
import {
  DashboardOutlined,
  UserOutlined,
  CarOutlined,
  FileTextOutlined,
  SettingOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  BarChartOutlined,
  PieChartOutlined,
  LineChartOutlined,
  AreaChartOutlined,
  ReloadOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
  LockOutlined,
  SecurityScanOutlined,
  RiseOutlined,
  FallOutlined,
  BankOutlined,
  CalendarOutlined,
  HomeOutlined,
  CrownOutlined,
  FlagOutlined,
  TrophyOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import type { AdminDashboardStats } from '@/types/admin';
import UsersManagementTab from '@/pages/admin/components/UsersManagementTab';
import SystemAnalyticsTab from '@/pages/admin/components/SystemAnalyticsTab';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { useBreakpoint } = Grid;

// Color palette for charts
const CHART_COLORS = [
  '#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1',
  '#13c2c2', '#eb2f96', '#fa8c16', '#a0d911', '#2f54eb'
];

// Animation variants
const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      duration: 0.6,
      staggerChildren: 0.1
    }
  }
};

const cardVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { duration: 0.3 }
  },
  hover: { 
    scale: 1.02,
    transition: { duration: 0.2 }
  }
};

// Enhanced Statistics Card Component
interface EnhancedStatsCardProps {
  title: string;
  value: number | string;
  icon?: React.ReactNode;
  trend?: number;
  suffix?: string;
  prefix?: string;
  precision?: number;
  status?: 'increase' | 'decrease' | 'stable';
  color?: string;
  description?: string;
  loading?: boolean;
  onClick?: () => void;
}

const EnhancedStatsCard: React.FC<EnhancedStatsCardProps> = ({
  title,
  value,
  icon,
  trend,
  suffix,
  prefix,
  precision = 0,
  status,
  color,
  description,
  loading = false,
  onClick
}) => {
  const getTrendIcon = () => {
    if (status === 'increase') return <ArrowUpOutlined style={{ color: '#52c41a' }} />;
    if (status === 'decrease') return <ArrowDownOutlined style={{ color: '#f5222d' }} />;
    return null;
  };

  const getTrendColor = () => {
    if (status === 'increase') return '#52c41a';
    if (status === 'decrease') return '#f5222d';
    return '#1890ff';
  };

  return (
    <motion.div variants={cardVariants} whileHover="hover">
      <Card
        hoverable={!!onClick}
        onClick={onClick}
        className="h-full"
        styles={{
          body: { padding: '20px' }
        }}
        loading={loading}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {icon && <span style={{ color: color || '#1890ff', fontSize: '20px' }}>{icon}</span>}
              <Text type="secondary" className="text-sm font-medium">
                {title}
              </Text>
            </div>
            <Statistic
              value={value}
              precision={precision}
              prefix={prefix}
              suffix={suffix}
              valueStyle={{
                color: color || getTrendColor(),
                fontSize: '24px',
                fontWeight: 'bold'
              }}
            />
            {description && (
              <Text type="secondary" className="text-xs mt-1 block">
                {description}
              </Text>
            )}
          </div>
          {trend !== undefined && (
            <div className="text-right">
              <div className="flex items-center gap-1">
                {getTrendIcon()}
                <Text
                  style={{ color: getTrendColor() }}
                  className="text-sm font-medium"
                >
                  {Math.abs(trend)}%
                </Text>
              </div>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
};

// Quick Actions Component
const QuickActions: React.FC = () => {
  const navigate = useNavigate();
  
  const actions = [
    {
      title: 'Manage Users',
      description: 'Add, edit, or approve users',
      icon: <TeamOutlined />,
      color: '#1890ff',
      onClick: () => navigate('/admin/users')
    },
    {
      title: 'Parliament Sessions',
      description: 'Manage POZ activities & fuel',
      icon: <BankOutlined />,
      color: '#52c41a',
      onClick: () => navigate('/dashboard/sessions')
    },
    {
      title: 'View Reports',
      description: 'Generate comprehensive reports',
      icon: <BarChartOutlined />,
      color: '#fa8c16',
      onClick: () => navigate('/admin/reports')
    },
    {
      title: 'System Settings',
      description: 'Configure system parameters',
      icon: <SettingOutlined />,
      color: '#722ed1',
      onClick: () => navigate('/admin/settings')
    }
  ];

  return (
    <Card title="Quick Actions" size="small" className="mb-4">
      <Row gutter={[12, 12]}>
        {actions.map((action, index) => (
          <Col xs={12} sm={6} key={index}>
            <Card
              hoverable
              onClick={action.onClick}
              className="text-center h-full"
              size="small"
              styles={{ body: { padding: '12px' } }}
            >
              <div style={{ color: action.color, fontSize: '20px', marginBottom: '4px' }}>
                {action.icon}
              </div>
              <Text strong className="text-sm">{action.title}</Text>
              <br />
              <Text type="secondary" className="text-xs">{action.description}</Text>
            </Card>
          </Col>
        ))}
      </Row>
    </Card>
  );
};

// System Health Component
const SystemHealth: React.FC<{ healthData?: any }> = ({ healthData }) => {
  const healthItems = [
    {
      name: 'API Response',
      value: 95,
      status: 'excellent',
      icon: <CheckCircleOutlined />,
      unit: '%'
    },
    {
      name: 'Database',
      value: 88,
      status: 'good',
      icon: <FileTextOutlined />,
      unit: '%'
    },
    {
      name: 'Uptime',
      value: 99.9,
      status: 'excellent',
      icon: <CheckCircleOutlined />,
      unit: '%'
    },
    {
      name: 'Security',
      value: 92,
      status: 'good',
      icon: <SecurityScanOutlined />,
      unit: '%'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return '#52c41a';
      case 'good': return '#1890ff';
      case 'warning': return '#faad14';
      case 'critical': return '#f5222d';
      default: return '#d9d9d9';
    }
  };

  return (
    <Card title="System Health" size="small" className="mb-4">
      <Row gutter={[12, 12]}>
        {healthItems.map((item, index) => (
          <Col xs={12} sm={6} key={index}>
            <div className="text-center">
              <div style={{ color: getStatusColor(item.status), fontSize: '16px', marginBottom: '4px' }}>
                {item.icon}
              </div>
              <Progress
                type="circle"
                percent={item.value}
                size={50}
                strokeColor={getStatusColor(item.status)}
                format={() => `${item.value}${item.unit}`}
              />
              <Text className="block mt-1 text-xs font-medium">{item.name}</Text>
            </div>
          </Col>
        ))}
      </Row>
    </Card>
  );
};

// Parliament Sessions Component
const ParliamentSessionsTab: React.FC = () => {
  const navigate = useNavigate();
  
  // Parliament activity types based on POZ requirements
  const parliamentActivities = [
    {
      id: 1,
      name: 'Weekly House of Assembly Sittings',
      type: 'WEEKLY_SITTING',
      frequency: 'Weekly',
      estimatedFuel: '2500L',
      description: 'Regular parliamentary sessions for House of Assembly',
      participants: 270,
      status: 'Active',
      color: '#1890ff',
      icon: <BankOutlined />
    },
    {
      id: 2,
      name: 'Weekly Senate Sittings',
      type: 'WEEKLY_SITTING',
      frequency: 'Weekly', 
      estimatedFuel: '1200L',
      description: 'Regular parliamentary sessions for Senate',
      participants: 80,
      status: 'Active',
      color: '#52c41a',
      icon: <BankOutlined />
    },
    {
      id: 3,
      name: 'Portfolio Committee Meetings',
      type: 'COMMITTEE_MEETING',
      frequency: 'As Needed',
      estimatedFuel: '800L',
      description: 'Various portfolio committee meetings',
      participants: 'Variable',
      status: 'Active',
      color: '#722ed1',
      icon: <TeamOutlined />
    },
    {
      id: 4,
      name: 'Monthly Constituency Visits',
      type: 'CONSTITUENCY_VISIT',
      frequency: 'Monthly',
      estimatedFuel: '42,000L',
      description: '120L per Member/Senator × 350 Members',
      participants: 350,
      status: 'Active',
      color: '#fa8c16',
      icon: <HomeOutlined />
    },
    {
      id: 5,
      name: 'Independence Day Celebrations',
      type: 'STATE_FUNCTION',
      frequency: 'Annual',
      estimatedFuel: '5000L',
      description: 'National Independence Day celebrations',
      participants: 'All Members',
      status: 'Scheduled',
      color: '#f5222d',
      icon: <FlagOutlined />
    },
    {
      id: 6,
      name: 'Heroes Day Commemorations',
      type: 'STATE_FUNCTION',
      frequency: 'Annual',
      estimatedFuel: '4500L',
      description: 'National Heroes Day commemorations',
      participants: 'All Members',
      status: 'Scheduled',
      color: '#eb2f96',
      icon: <TrophyOutlined />
    },
    {
      id: 7,
      name: 'Culture Day Celebrations',
      type: 'STATE_FUNCTION',
      frequency: 'Annual',
      estimatedFuel: '3500L',
      description: 'National Culture Day celebrations',
      participants: 'All Members',
      status: 'Scheduled',
      color: '#13c2c2',
      icon: <CrownOutlined />
    },
    {
      id: 8,
      name: 'National Youth Day',
      type: 'STATE_FUNCTION',
      frequency: 'Annual',
      estimatedFuel: '3000L',
      description: 'National Youth Day activities',
      participants: 'Selected Members',
      status: 'Scheduled',
      color: '#a0d911',
      icon: <UserOutlined />
    },
    {
      id: 9,
      name: 'Heroes Burial Attendances',
      type: 'SPECIAL_EVENT',
      frequency: 'As Needed',
      estimatedFuel: 'Variable',
      description: 'Attendance at heroes burial ceremonies',
      participants: 'Selected Members',
      status: 'Active',
      color: '#faad14',
      icon: <TrophyOutlined />
    },
    {
      id: 10,
      name: 'Zimbabwe Trade Fair (April)',
      type: 'ANNUAL_EVENT',
      frequency: 'Annual',
      estimatedFuel: '8000L',
      description: 'Annual trade fair in Bulawayo - all members',
      participants: 'All Members',
      status: 'Scheduled',
      color: '#2f54eb',
      icon: <BankOutlined />
    },
    {
      id: 11,
      name: 'Pre-Budget Seminar (November)',
      type: 'ANNUAL_EVENT',
      frequency: 'Annual',
      estimatedFuel: '8500L',
      description: 'Annual pre-budget seminar in Bulawayo',
      participants: 'All Members',
      status: 'Scheduled',
      color: '#fa541c',
      icon: <BarChartOutlined />
    },
    {
      id: 12,
      name: 'Public Hearings & Field Visits',
      type: 'FIELD_VISIT',
      frequency: 'Regular',
      estimatedFuel: 'Variable',
      description: 'Portfolio committee public hearings nationwide',
      participants: 'Committee Members',
      status: 'Active',
      color: '#1890ff',
      icon: <CalendarOutlined />
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return '#52c41a';
      case 'Scheduled': return '#1890ff';
      case 'Completed': return '#722ed1';
      case 'Cancelled': return '#f5222d';
      default: return '#d9d9d9';
    }
  };

  return (
    <div>
      <Row gutter={[24, 24]}>
        {/* Summary Cards */}
        <Col xs={24}>
          <Row gutter={[16, 16]} className="mb-6">
            <Col xs={24} sm={12} lg={6}>
              <Card className="text-center">
                <Statistic
                  title="Total Annual Fuel Budget"
                  value="580,000"
                  suffix="L"
                  valueStyle={{ color: '#1890ff' }}
                  prefix={<CarOutlined />}
                />
                <Text type="secondary" className="text-xs">
                  Estimated annual requirement
                </Text>
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card className="text-center">
                <Statistic
                  title="Monthly Constituency Allocation"
                  value="42,000"
                  suffix="L"
                  valueStyle={{ color: '#fa8c16' }}
                  prefix={<HomeOutlined />}
                />
                <Text type="secondary" className="text-xs">
                  120L × 350 Members/Senators
                </Text>
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card className="text-center">
                <Statistic
                  title="Active Parliament Members"
                  value="350"
                  valueStyle={{ color: '#52c41a' }}
                  prefix={<TeamOutlined />}
                />
                <Text type="secondary" className="text-xs">
                  MPs + Senators requiring fuel
                </Text>
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card className="text-center">
                <Statistic
                  title="Annual Events"
                  value="12"
                  valueStyle={{ color: '#722ed1' }}
                  prefix={<CalendarOutlined />}
                />
                <Text type="secondary" className="text-xs">
                  Major events requiring fuel
                </Text>
              </Card>
            </Col>
          </Row>
        </Col>

        {/* Activities Grid */}
        <Col xs={24}>
          <Card title="Parliament Activities & Fuel Requirements" size="small">
            <Row gutter={[16, 16]}>
              {parliamentActivities.map((activity) => (
                <Col xs={24} sm={12} lg={8} xl={6} key={activity.id}>
                  <Card 
                    size="small" 
                    hoverable
                    className="h-full"
                    styles={{ body: { padding: '16px' } }}
                    onClick={() => navigate(`/parliament/sessions/${activity.type.toLowerCase()}`)}
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div style={{ 
                        color: activity.color, 
                        fontSize: '20px',
                        minWidth: '20px'
                      }}>
                        {activity.icon}
                      </div>
                      <div className="flex-1">
                        <Text strong className="text-sm leading-tight">
                          {activity.name}
                        </Text>
                        <div className="mt-1">
                          <span
                            style={{
                              background: getStatusColor(activity.status),
                              color: 'white',
                              padding: '2px 6px',
                              borderRadius: '3px',
                              fontSize: '10px',
                              fontWeight: 'bold'
                            }}
                          >
                            {activity.status.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <Text type="secondary" className="text-xs">Frequency:</Text>
                        <Text className="text-xs font-medium">{activity.frequency}</Text>
                      </div>
                      <div className="flex justify-between">
                        <Text type="secondary" className="text-xs">Est. Fuel:</Text>
                        <Text className="text-xs font-medium text-orange-600">
                          {activity.estimatedFuel}
                        </Text>
                      </div>
                      <div className="flex justify-between">
                        <Text type="secondary" className="text-xs">Participants:</Text>
                        <Text className="text-xs font-medium">{activity.participants}</Text>
                      </div>
                    </div>
                    
                    <div className="mt-3 pt-2 border-t border-gray-100">
                      <Text type="secondary" className="text-xs leading-tight">
                        {activity.description}
                      </Text>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>

        {/* Quick Actions for Parliament Activities */}
        <Col xs={24}>
          <Card title="Parliament Management Actions" size="small">
            <Row gutter={[12, 12]}>
              <Col xs={24} sm={12} lg={6}>
                <Button 
                  type="primary" 
                  block 
                  icon={<CalendarOutlined />}
                  onClick={() => navigate('/dashboard/sessions')}
                >
                  Manage Sessions
                </Button>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Button 
                  block 
                  icon={<AppstoreOutlined />}
                  onClick={() => navigate('/dashboard/programs')}
                >
                  Manage Programs
                </Button>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Button 
                  block 
                  icon={<TeamOutlined />}
                  onClick={() => navigate('/dashboard/attendance')}
                >
                  Track Attendance
                </Button>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Button 
                  block 
                  icon={<CarOutlined />}
                  onClick={() => navigate('/parliament/fuel-allocations')}
                >
                  Manage Fuel Allocations
                </Button>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Button 
                  block 
                  icon={<BarChartOutlined />}
                  onClick={() => navigate('/parliament/reports')}
                >
                  View Reports
                </Button>
              </Col>
            </Row>
          </Card>
        </Col>

        {/* Recent Parliament Activities */}
        <Col xs={24}>
          <Card title="Recent Parliament Activities" size="small">
            <Space direction="vertical" className="w-full" size="small">
              {[
                {
                  activity: 'House of Assembly Sitting',
                  date: 'July 4, 2025',
                  attendance: '265/270 Members',
                  fuelAllocated: '2,400L',
                  status: 'Completed'
                },
                {
                  activity: 'Senate Portfolio Committee',
                  date: 'July 3, 2025', 
                  attendance: '15/20 Members',
                  fuelAllocated: '450L',
                  status: 'Completed'
                },
                {
                  activity: 'Monthly Constituency Allocation',
                  date: 'July 1, 2025',
                  attendance: '350/350 Members',
                  fuelAllocated: '42,000L',
                  status: 'Completed'
                },
                {
                  activity: 'Public Hearing - Masvingo',
                  date: 'June 28, 2025',
                  attendance: '8/12 Committee Members',
                  fuelAllocated: '1,200L',
                  status: 'Completed'
                }
              ].map((item, index) => (
                <div key={index} className="flex justify-between items-center p-3 border border-gray-100 rounded">
                  <div className="flex-1">
                    <Text strong className="text-sm">{item.activity}</Text>
                    <br />
                    <Text type="secondary" className="text-xs">
                      {item.date} • {item.attendance}
                    </Text>
                  </div>
                  <div className="text-right">
                    <Text className="text-sm font-medium text-orange-600">
                      {item.fuelAllocated}
                    </Text>
                    <br />
                    <span
                      style={{
                        background: '#52c41a',
                        color: 'white',
                        padding: '2px 6px',
                        borderRadius: '3px',
                        fontSize: '10px'
                      }}
                    >
                      {item.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

const AdminDashboard: React.FC = () => {
  const { user, accessToken, isAuthenticated, isAuthLoading, logout } = useAuth();
  const { notification } = App.useApp(); // Use App context for notifications
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const screens = useBreakpoint();
  
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>('7d');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshing, setRefreshing] = useState(false);

  const {
    data: adminStats,
    isLoading: isStatsLoading,
    isError: isStatsError,
    error: statsError,
    refetch: refetchStats,
  } = useQuery<AdminDashboardStats>({
    queryKey: ['admin-dashboard-stats', accessToken, selectedTimeRange],
    queryFn: () => adminService.getAdminStatistics(),
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // Auto refresh every 5 minutes
    retry: 2,
    enabled: isAuthenticated && !!accessToken && !isAuthLoading,
  });

  // Auto-refresh functionality
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] });
      await refetchStats();
      notification.success({
        message: 'Data Refreshed',
        description: 'Dashboard data has been updated successfully',
        placement: 'topRight'
      });
    } catch (error) {
      notification.error({
        message: 'Refresh Failed',
        description: 'Failed to refresh dashboard data',
        placement: 'topRight'
      });
    } finally {
      setRefreshing(false);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  if (isAuthLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <Spin size="large">
          <div className="text-center p-6">
            <Title level={4} type="secondary">Loading Dashboard...</Title>
          </div>
        </Spin>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <Card className="text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">
            <LockOutlined />
          </div>
          <Title level={3} type="danger">Access Denied</Title>
          <Paragraph type="secondary" className="mb-4">
            You must be logged in as an administrator to view this dashboard
          </Paragraph>
          <Button type="primary" size="large" onClick={() => navigate('/login')}>
            Go to Login
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: '#1890ff',
          borderRadius: 8,
        },
      }}
    >
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="h-full"
        style={{ padding: '24px' }}
      >
        {/* Error Alert - More subtle */}
        {isStatsError && (
          <Alert
            message="Some data may be outdated"
            description="Using cached data while reconnecting to server..."
            type="warning"
            showIcon
            closable
            className="mb-4"
            action={
              <Button size="small" onClick={handleRefresh} loading={refreshing}>
                Retry
              </Button>
            }
          />
        )}

        {/* Page Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '24px'
        }}>
          <div>
            <Title level={2} style={{ margin: 0 }}>
              Admin Dashboard
            </Title>
            <Paragraph type="secondary" style={{ margin: 0, marginTop: '8px' }}>
              Comprehensive system overview and management
            </Paragraph>
          </div>
          <Space>
            <Segmented
              value={selectedTimeRange}
              onChange={setSelectedTimeRange}
              options={[
                { label: '7D', value: '7d' },
                { label: '30D', value: '30d' },
                { label: '90D', value: '90d' },
                { label: 'YTD', value: 'ytd' }
              ]}
              size="small"
            />
            
            <Button
              icon={<ReloadOutlined spin={refreshing} />}
              onClick={handleRefresh}
              loading={refreshing}
              size="small"
            >
              Refresh
            </Button>
            
            <Button
              icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
              onClick={toggleFullscreen}
              size="small"
            />
          </Space>
        </div>

              {/* Main Statistics Cards */}
              <Row gutter={[16, 16]} className="mb-4">
                <Col xs={24} sm={12} lg={6}>
                  <EnhancedStatsCard
                    title="Total Users"
                    value={adminStats?.total_users || 156}
                    icon={<TeamOutlined />}
                    trend={12}
                    status="increase"
                    description="Active system users"
                    loading={isStatsLoading}
                    onClick={() => navigate('/admin/users')}
                  />
                </Col>
                <Col xs={24} sm={12} lg={6}>
                  <EnhancedStatsCard
                    title="Active Sessions"
                    value={adminStats?.active_today || 42}
                    icon={<UserOutlined />}
                    trend={5}
                    status="increase"
                    color="#52c41a"
                    description="Users online today"
                    loading={isStatsLoading}
                  />
                </Col>
                <Col xs={24} sm={12} lg={6}>
                  <EnhancedStatsCard
                    title="Total Coupons"
                    value={adminStats?.total_coupons || 2840}
                    icon={<FileTextOutlined />}
                    trend={-2}
                    status="decrease"
                    color="#722ed1"
                    description="All fuel coupons"
                    loading={isStatsLoading}
                  />
                </Col>
                <Col xs={24} sm={12} lg={6}>
                  <EnhancedStatsCard
                    title="Fuel Consumed"
                    value={adminStats?.total_fuel_volume_consumed || 18420}
                    suffix="L"
                    icon={<CarOutlined />}
                    trend={8}
                    status="increase"
                    color="#fa8c16"
                    description="Total fuel dispensed"
                    loading={isStatsLoading}
                  />
                </Col>
              </Row>

              {/* Quick Actions */}
              <QuickActions />

              {/* System Health */}
              <SystemHealth />

              {/* Charts and Analytics */}
              <Tabs
                activeKey={activeTab}
                onChange={setActiveTab}
                size="large"
                items={[
                  {
                    key: 'overview',
                    label: (
                      <span>
                        <DashboardOutlined />
                        Overview
                      </span>
                    ),
                    children: (
                      <Row gutter={[24, 24]}>
                        {/* Coupon Status Overview */}
                        <Col xs={24} lg={12}>
                          <Card title="Coupon Status Overview" size="small" className="h-full">
                            <Space direction="vertical" className="w-full" size="small">
                              {adminStats?.coupon_status_distribution ? Object.entries(adminStats.coupon_status_distribution).map(([status, count]) => (
                                <div key={status} className="flex justify-between items-center">
                                  <Text>{status.replace('_', ' ').toUpperCase()}</Text>
                                  <div className="flex items-center gap-2">
                                    <Progress 
                                      percent={Math.round((count / (adminStats.total_coupons || 1)) * 100)} 
                                      showInfo={false} 
                                      size="small" 
                                      className="w-20"
                                    />
                                    <Text strong>{count}</Text>
                                  </div>
                                </div>
                              )) : (
                                // Sample data when API is not available
                                [
                                  { status: 'AVAILABLE', count: 1840, total: 2840 },
                                  { status: 'ALLOCATED', count: 680, total: 2840 },
                                  { status: 'USED', count: 240, total: 2840 },
                                  { status: 'EXPIRED', count: 80, total: 2840 }
                                ].map(({ status, count, total }) => (
                                  <div key={status} className="flex justify-between items-center">
                                    <Text>{status}</Text>
                                    <div className="flex items-center gap-2">
                                      <Progress 
                                        percent={Math.round((count / total) * 100)} 
                                        showInfo={false} 
                                        size="small" 
                                        className="w-20"
                                      />
                                      <Text strong>{count}</Text>
                                    </div>
                                  </div>
                                ))
                              )}
                            </Space>
                          </Card>
                        </Col>

                        {/* Recent Activity */}
                        <Col xs={24} lg={12}>
                          <Card title="Recent Activity" size="small" className="h-full">
                            {adminStats?.recently_allocated_coupons?.length ? (
                              <Space direction="vertical" className="w-full" size="small">
                                {adminStats.recently_allocated_coupons.slice(0, 4).map((coupon, index) => (
                                  <div key={coupon.id} className="flex justify-between items-center p-2 border-b">
                                    <div>
                                      <Text strong className="text-sm">Coupon #{coupon.id}</Text>
                                      <br />
                                      <Text type="secondary" className="text-xs">
                                        {coupon.allocated_to?.username ? `Allocated to: ${coupon.allocated_to.username}` : 'Unallocated'}
                                      </Text>
                                    </div>
                                    <Text type="secondary" className="text-xs">
                                      {coupon.allocated_date ? new Date(coupon.allocated_date).toLocaleDateString() : 'N/A'}
                                    </Text>
                                  </div>
                                ))}
                              </Space>
                            ) : (
                              // Sample activity when API is not available
                              <Space direction="vertical" className="w-full" size="small">
                                {[
                                  { id: 'C001', user: 'john_doe', action: 'User Registration', time: '2 hours ago' },
                                  { id: 'C002', user: 'admin', action: 'Coupon Distribution', time: '4 hours ago' },
                                  { id: 'C003', user: 'jane_smith', action: 'Fuel Allocation', time: '6 hours ago' },
                                  { id: 'C004', user: 'system', action: 'System Backup', time: '1 day ago' }
                                ].map((activity, index) => (
                                  <div key={activity.id} className="flex justify-between items-center p-2 border-b">
                                    <div>
                                      <Text strong className="text-sm">{activity.action}</Text>
                                      <br />
                                      <Text type="secondary" className="text-xs">
                                        By: {activity.user}
                                      </Text>
                                    </div>
                                    <Text type="secondary" className="text-xs">
                                      {activity.time}
                                    </Text>
                                  </div>
                                ))}
                              </Space>
                            )}
                          </Card>
                        </Col>

                        {/* System Performance */}
                        <Col xs={24}>
                          <Card title="System Performance Overview">
                            <Row gutter={[16, 16]}>
                              <Col xs={24} sm={6}>
                                <Statistic
                                  title="Allocation Rate"
                                  value={adminStats?.coupon_allocation_rate || 0}
                                  precision={1}
                                  suffix="%"
                                  valueStyle={{ color: '#3f8600' }}
                                  prefix={<RiseOutlined />}
                                />
                              </Col>
                              <Col xs={24} sm={6}>
                                <Statistic
                                  title="Usage Rate"
                                  value={adminStats?.coupon_usage_rate || 0}
                                  precision={1}
                                  suffix="%"
                                  valueStyle={{ color: '#1890ff' }}
                                  prefix={<BarChartOutlined />}
                                />
                              </Col>
                              <Col xs={24} sm={6}>
                                <Statistic
                                  title="Available Stock"
                                  value={adminStats?.total_coupons_available || 0}
                                  valueStyle={{ color: '#722ed1' }}
                                  prefix={<FileTextOutlined />}
                                />
                              </Col>
                              <Col xs={24} sm={6}>
                                <Statistic
                                  title="Fuel Consumed"
                                  value={adminStats?.total_fuel_volume_consumed || 0}
                                  suffix="L"
                                  valueStyle={{ color: '#fa8c16' }}
                                  prefix={<CarOutlined />}
                                />
                              </Col>
                            </Row>
                          </Card>
                        </Col>
                      </Row>
                    ),
                  },
                  {
                    key: 'analytics',
                    label: (
                      <span>
                        <BarChartOutlined />
                        Advanced Analytics
                      </span>
                    ),
                    children: (
                      <SystemAnalyticsTab />
                    ),
                  },
                  {
                    key: 'users',
                    label: (
                      <span>
                        <TeamOutlined />
                        Users Management
                      </span>
                    ),
                    children: (
                      <UsersManagementTab />
                    ),
                  },
                  {
                    key: 'parliament-sessions',
                    label: (
                      <span>
                        <BankOutlined />
                        Parliament Sessions
                      </span>
                    ),
                    children: (
                      <ParliamentSessionsTab />
                    ),
                  },
                ]}
              />

              {/* Recent Activity */}
              <Card title="Recent System Activity" size="small">
                <Row gutter={[16, 16]}>
                  {[
                    {
                      title: 'User Registration',
                      description: 'New user "john_doe" registered',
                      time: '2 hours ago',
                      type: 'success',
                      icon: <UserOutlined />
                    },
                    {
                      title: 'Coupon Distribution',
                      description: '100 coupons distributed to Harare Sub-center',
                      time: '4 hours ago',
                      type: 'info',
                      icon: <FileTextOutlined />
                    },
                    {
                      title: 'System Maintenance',
                      description: 'Scheduled maintenance completed',
                      time: '1 day ago',
                      type: 'warning',
                      icon: <SettingOutlined />
                    },
                    {
                      title: 'Security Scan',
                      description: 'Weekly security scan completed successfully',
                      time: '2 days ago',
                      type: 'success',
                      icon: <SecurityScanOutlined />
                    }
                  ].map((activity, index) => (
                    <Col xs={24} sm={12} lg={6} key={index}>
                      <Card size="small" className="h-full">
                        <div className="flex items-start gap-3">
                          <div style={{ 
                            color: activity.type === 'success' ? '#52c41a' : 
                                   activity.type === 'warning' ? '#faad14' : '#1890ff',
                            fontSize: '16px'
                          }}>
                            {activity.icon}
                          </div>
                          <div className="flex-1">
                            <Text strong className="text-sm">{activity.title}</Text>
                            <br />
                            <Text type="secondary" className="text-xs">{activity.description}</Text>
                            <br />
                            <Text type="secondary" className="text-xs">{activity.time}</Text>
                          </div>
                        </div>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </Card>
            </motion.div>
    </ConfigProvider>
  );
};

export default AdminDashboard;
