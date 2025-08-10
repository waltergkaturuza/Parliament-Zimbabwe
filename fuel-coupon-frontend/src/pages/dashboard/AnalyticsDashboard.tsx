// src/pages/dashboard/AnalyticsDashboard.tsx - Advanced Analytics Dashboard for Power Users
import { useState, useEffect } from 'react';
import {
  Layout,
  Card,
  Row,
  Col,
  Statistic,
  Progress,
  Table,
  List,
  Avatar,
  Badge,
  Typography,
  Space,
  Button,
  Dropdown,
  Tag,
  Alert,
  DatePicker,
  Select,
  Spin,
  Empty,
  Tooltip,
  Timeline,
  Divider,
} from 'antd';
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  CarOutlined,
  FileTextOutlined,
  TeamOutlined,
  DollarOutlined,
  AlertOutlined,
  RiseOutlined,
  CalendarOutlined,
  EyeOutlined,
  DownloadOutlined,
  ReloadOutlined,
  FilterOutlined,
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  Pie,
} from 'recharts';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../api/apiClient';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

interface DashboardStats {
  totalCoupons: number;
  activeCoupons: number;
  totalBeneficiaries: number;
  totalAllocations: number;
  pendingApprovals: number;
  monthlyUsage: number;
  fuelSavings: number;
  systemEfficiency: number;
}

interface ChartData {
  usageTrend: Array<{ date: string; amount: number; efficiency: number }>;
  allocationByCategory: Array<{ category: string; amount: number; color: string }>;
  monthlyComparison: Array<{ month: string; current: number; previous: number }>;
  topBeneficiaries: Array<{ name: string; usage: number; efficiency: number }>;
}

interface RecentActivity {
  id: string;
  type: 'allocation' | 'transaction' | 'approval' | 'system';
  title: string;
  description: string;
  timestamp: string;
  status: 'success' | 'warning' | 'error' | 'info';
  user?: string;
}

const AnalyticsDashboard = () => {
  const { user, hasRole } = useAuth();
  const [dateRange, setDateRange] = useState<[Date, Date]>([
    startOfMonth(new Date()),
    endOfMonth(new Date()),
  ]);
  const [selectedMetric, setSelectedMetric] = useState('usage');

  // Fetch dashboard data
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery<DashboardStats>({
    queryKey: ['analytics-dashboard-stats', dateRange],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/analytics/', {
          params: {
            start_date: format(dateRange[0], 'yyyy-MM-dd'),
            end_date: format(dateRange[1], 'yyyy-MM-dd'),
          },
        });
        
        const data = response.data;
        
        return {
          totalCoupons: data.fuel_summary?.total_coupons_issued || 0,
          activeCoupons: data.fuel_summary?.active_coupons || 0,
          totalBeneficiaries: data.beneficiary_summary?.total_active || 0,
          totalAllocations: data.allocation_summary?.total_allocations || 0,
          pendingApprovals: data.allocation_summary?.pending_approvals || 0,
          monthlyUsage: data.fuel_summary?.usage_rate || 0,
          fuelSavings: data.financial?.fuel_savings || 0,
          systemEfficiency: data.system_summary?.efficiency_rate || 0,
        };
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
        // Fallback data structure
        return {
          totalCoupons: 0,
          activeCoupons: 0,
          totalBeneficiaries: 0,
          totalAllocations: 0,
          pendingApprovals: 0,
          monthlyUsage: 0,
          fuelSavings: 0,
          systemEfficiency: 0,
        };
      }
    },
  });

  const { data: chartData, isLoading: chartLoading } = useQuery<ChartData>({
    queryKey: ['analytics-dashboard-charts', dateRange],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/analytics/', {
          params: {
            start_date: format(dateRange[0], 'yyyy-MM-dd'),
            end_date: format(dateRange[1], 'yyyy-MM-dd'),
            include_charts: true,
          },
        });
        
        const data = response.data;
        
        return {
          usageTrend: data.charts?.usage_trend || [],
          allocationByCategory: data.charts?.allocation_by_category || [
            { category: 'MPs', amount: 0, color: '#1890ff' },
            { category: 'Senators', amount: 0, color: '#52c41a' },
            { category: 'Staff', amount: 0, color: '#faad14' },
            { category: 'Officials', amount: 0, color: '#f5222d' },
          ],
          monthlyComparison: data.charts?.monthly_comparison || [],
          topBeneficiaries: data.beneficiary_summary?.top_users || [],
        };
      } catch (error) {
        console.error('Failed to fetch chart data:', error);
        // Fallback data structure
        return {
          usageTrend: [],
          allocationByCategory: [
            { category: 'MPs', amount: 0, color: '#1890ff' },
            { category: 'Senators', amount: 0, color: '#52c41a' },
            { category: 'Staff', amount: 0, color: '#faad14' },
            { category: 'Officials', amount: 0, color: '#f5222d' },
          ],
          monthlyComparison: [],
          topBeneficiaries: [],
        };
      }
    },
  });

  const { data: recentActivity, isLoading: activityLoading } = useQuery<RecentActivity[]>({
    queryKey: ['analytics-dashboard-activity'],
    queryFn: async () => {
      return [
        {
          id: '1',
          type: 'allocation',
          title: 'New Allocation Created',
          description: 'Monthly allocation for March 2025 created for MPs',
          timestamp: new Date().toISOString(),
          status: 'success',
          user: 'Admin User',
        },
        {
          id: '2',
          type: 'approval',
          title: 'Pending Approval',
          description: '15 fuel requests awaiting approval',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          status: 'warning',
        },
        {
          id: '3',
          type: 'transaction',
          title: 'Bulk Transaction',
          description: '45 coupons distributed to beneficiaries',
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          status: 'success',
          user: 'System Auto',
        },
      ];
    },
  });

  const StatCard = ({ title, value, prefix, suffix, trend, color, icon, loading }: any) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="h-full hover:shadow-lg transition-shadow">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div className={`p-2 rounded-lg bg-${color}-100`}>
                {icon}
              </div>
              <Text type="secondary" className="text-sm">
                {title}
              </Text>
            </div>
            <Statistic
              value={value}
              prefix={prefix}
              suffix={suffix}
              loading={loading}
              valueStyle={{ fontSize: '24px', fontWeight: 'bold' }}
            />
          </div>
          {trend && (
            <div className={`text-${trend > 0 ? 'green' : 'red'}-500 text-right`}>
              {trend > 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
              <div className="text-sm mt-1">{Math.abs(trend)}%</div>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );

  const quickActions = [
    {
      key: 'allocate',
      label: 'Create Allocation',
      icon: <FileTextOutlined />,
      onClick: () => {},
    },
    {
      key: 'approve',
      label: 'Review Approvals',
      icon: <AlertOutlined />,
      badge: stats?.pendingApprovals,
      onClick: () => {},
    },
    {
      key: 'report',
      label: 'Generate Report',
      icon: <DownloadOutlined />,
      onClick: () => {},
    },
  ];

  const isLoading = statsLoading || chartLoading || activityLoading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Title level={2} className="mb-2">
            Advanced Analytics Dashboard 📊
          </Title>
          <Text type="secondary">
            Comprehensive data analysis and insights for fuel management system
          </Text>
        </div>
        <Space>
          <RangePicker
            value={[dateRange[0] as any, dateRange[1] as any]}
            onChange={(dates) => dates && setDateRange([dates[0]!.toDate(), dates[1]!.toDate()])}
          />
          <Button icon={<ReloadOutlined />} onClick={() => refetchStats()}>
            Refresh
          </Button>
        </Space>
      </div>

      {/* Alert Section */}
      {stats && stats.pendingApprovals > 0 && (
        <Alert
          message={`You have ${stats.pendingApprovals} pending approvals that need your attention.`}
          type="warning"
          action={
            <Button size="small" type="primary">
              Review Now
            </Button>
          }
          showIcon
          closable
        />
      )}

      {/* Key Metrics */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Total Coupons"
            value={stats?.totalCoupons}
            icon={<FileTextOutlined className="text-blue-600" />}
            trend={12.5}
            color="blue"
            loading={statsLoading}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Active Beneficiaries"
            value={stats?.totalBeneficiaries}
            icon={<TeamOutlined className="text-green-600" />}
            trend={8.2}
            color="green"
            loading={statsLoading}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Monthly Usage"
            value={stats?.monthlyUsage}
            suffix="%"
            icon={<CarOutlined className="text-orange-600" />}
            trend={-3.1}
            color="orange"
            loading={statsLoading}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="System Efficiency"
            value={stats?.systemEfficiency}
            suffix="%"
            icon={<RiseOutlined className="text-purple-600" />}
            trend={5.7}
            color="purple"
            loading={statsLoading}
          />
        </Col>
      </Row>

      {/* Quick Actions */}
      <Card title="Quick Actions" className="mb-6">
        <Row gutter={[16, 16]}>
          {quickActions.map((action) => (
            <Col xs={24} sm={8} key={action.key}>
              <Button
                type="dashed"
                size="large"
                icon={action.icon}
                onClick={action.onClick}
                className="w-full h-16 flex items-center justify-center gap-2"
              >
                <span>{action.label}</span>
                {action.badge && <Badge count={action.badge} />}
              </Button>
            </Col>
          ))}
        </Row>
      </Card>

      {/* Charts Section */}
      <Row gutter={[16, 16]}>
        {/* Usage Trend */}
        <Col xs={24} lg={16}>
          <Card
            title="Fuel Usage Trend"
            extra={
              <Select
                value={selectedMetric}
                onChange={setSelectedMetric}
                size="small"
                options={[
                  { value: 'usage', label: 'Usage' },
                  { value: 'efficiency', label: 'Efficiency' },
                  { value: 'cost', label: 'Cost' },
                ]}
              />
            }
            loading={chartLoading}
          >
            {chartData?.usageTrend ? (
              <ResponsiveContainer width="100%" height={300}>
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <div className="text-4xl mb-2">📈</div>
                    <div>Usage Trend Chart</div>
                    <div className="text-sm">Interactive chart will be displayed here</div>
                  </div>
                </div>
              </ResponsiveContainer>
            ) : (
              <Empty description="No data available" />
            )}
          </Card>
        </Col>

        {/* Allocation Distribution */}
        <Col xs={24} lg={8}>
          <Card title="Allocation by Category" loading={chartLoading}>
            {chartData?.allocationByCategory ? (
              <ResponsiveContainer width="100%" height={300}>
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <div className="text-4xl mb-2">🥧</div>
                    <div>Allocation Distribution</div>
                    <div className="text-sm">Pie chart will be displayed here</div>
                  </div>
                </div>
              </ResponsiveContainer>
            ) : (
              <Empty description="No data available" />
            )}
          </Card>
        </Col>
      </Row>

      {/* Bottom Section */}
      <Row gutter={[16, 16]}>
        {/* Recent Activity */}
        <Col xs={24} lg={12}>
          <Card title="Recent Activity" loading={activityLoading}>
            {recentActivity ? (
              <Timeline
                items={recentActivity.map((activity) => ({
                  color: activity.status === 'success' ? 'green' : 
                         activity.status === 'warning' ? 'orange' : 
                         activity.status === 'error' ? 'red' : 'blue',
                  children: (
                    <div>
                      <div className="font-medium">{activity.title}</div>
                      <div className="text-gray-600 text-sm mt-1">
                        {activity.description}
                      </div>
                      <div className="text-gray-400 text-xs mt-2">
                        {format(new Date(activity.timestamp), 'MMM dd, yyyy HH:mm')}
                        {activity.user && ` • by ${activity.user}`}
                      </div>
                    </div>
                  ),
                }))}
              />
            ) : (
              <Empty description="No recent activity" />
            )}
          </Card>
        </Col>

        {/* Top Beneficiaries */}
        <Col xs={24} lg={12}>
          <Card title="Top Fuel Users" extra={<Button size="small">View All</Button>}>
            {chartData?.topBeneficiaries ? (
              <List
                dataSource={chartData.topBeneficiaries}
                renderItem={(item, index) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={
                        <Badge count={index + 1} size="small">
                          <Avatar icon={<TeamOutlined />} />
                        </Badge>
                      }
                      title={item.name}
                      description={
                        <div className="flex items-center gap-4">
                          <span>Usage: {item.usage}L</span>
                          <Progress
                            percent={item.efficiency}
                            size="small"
                            status={item.efficiency > 90 ? 'success' : 'normal'}
                            className="flex-1"
                          />
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="No data available" />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AnalyticsDashboard;
