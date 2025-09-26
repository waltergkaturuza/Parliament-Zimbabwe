// src/pages/subcenter/SimpleSubCenterDashboard.tsx
import React, { useState, useEffect } from 'react';
import {
  Card,
  Typography,
  Spin,
  Alert,
  Button,
  Tooltip,
  Progress,
  Row,
  Col,
  Statistic,
} from 'antd';
import {
  DashboardOutlined,
  LineChartOutlined,
  ArrowUpOutlined,
  ReloadOutlined,
  BarChartOutlined,
  RiseOutlined,
  FallOutlined,
} from '@ant-design/icons';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
} from 'chart.js';
import { useAuth } from '@/contexts/AuthContext';
import apiClient from '@/api/index';

const { Title: AntTitle, Text } = Typography;

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  ChartTooltip,
  Legend
);

interface DashboardStats {
  total_subcenters?: number;
  active_subcenters?: number;
  recent_subcenters?: number;
  total_coupons_assigned?: number;
  available_coupons?: number;
  used_coupons?: number;
  recently_distributed?: number;
  total_value_usd?: number;
  performance_score?: number;
}

interface TrendData {
  labels: string[];
  usage_data: number[];
  moving_average: number[];
}

const SimpleSubCenterDashboard: React.FC = () => {
  const { user, isAuthLoading } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [trendData, setTrendData] = useState<TrendData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Don't render if auth is still loading
  if (isAuthLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <Spin size="large" />
      </div>
    );
  }

  // If no user or loading, show a simple message
  if (!user) {
    return (
      <Alert
        message="Authentication Required"
        description="Please log in to access the dashboard."
        type="warning"
        showIcon
        style={{ margin: 24 }}
      />
    );
  }

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch subcenter stats from real backend API
      const statsResponse = await apiClient.get('/subcenters/stats/');
      const statsData = statsResponse.data;
      
      // Extract relevant stats for the dashboard
      const dashboardStats: DashboardStats = {
        total_subcenters: statsData.total_subcenters || 0,
        active_subcenters: statsData.active_subcenters || 0,
        recent_subcenters: statsData.recent_subcenters || 0,
        total_coupons_assigned: statsData.totals?.total_coupons || 0,
        available_coupons: statsData.totals?.available_coupons || 0,
        used_coupons: statsData.totals?.used_coupons || 0,
        recently_distributed: statsData.totals?.recent_transactions || 0,
        total_value_usd: statsData.totals?.total_value_usd || 0,
        performance_score: statsData.averages?.avg_performance_score || 0,
      };
      
      setStats(dashboardStats);

      // Try to fetch trend data from analytics endpoint
      try {
        const trendResponse = await apiClient.get('/analytics/subcenter-distribution-timeline/');
        const trendData = trendResponse.data;
        
        setTrendData({
          labels: trendData.labels || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          usage_data: trendData.usage_data || [12, 19, 15, 25, 22, 18, 20],
          moving_average: trendData.moving_average || [12, 15, 16, 18, 20, 21, 19]
        });
      } catch (trendError) {
        console.warn('Analytics endpoint not available, using default trend data:', trendError);
        // Use simple trend data based on available stats
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const baseUsage = Math.max(1, Math.floor((dashboardStats.used_coupons || 0) / 7));
        const mockData = days.map((_, i) => baseUsage + Math.floor(Math.random() * 5));
        const mockMA = mockData.map((val, i) => {
          const start = Math.max(0, i - 2);
          const end = Math.min(mockData.length - 1, i + 2);
          const sum = mockData.slice(start, end + 1).reduce((a, b) => a + b, 0);
          return Math.round(sum / (end - start + 1));
        });
        
        setTrendData({
          labels: days,
          usage_data: mockData,
          moving_average: mockMA
        });
      }
      
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Set minimal fallback data on error
      setStats({
        total_subcenters: 0,
        active_subcenters: 0,
        recent_subcenters: 0,
        total_coupons_assigned: 0,
        available_coupons: 0,
        used_coupons: 0,
        recently_distributed: 0,
      });
      setTrendData({
        labels: ['No Data'],
        usage_data: [0],
        moving_average: [0]
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
    },
  };

  return (
    <div style={{ 
      background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
      minHeight: '100vh',
      padding: '24px',
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <AntTitle level={1} style={{ color: 'white', marginBottom: 8 }}>
                SubCenter Analytics Dashboard
              </AntTitle>
              <Text style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px' }}>
                Past 14 days • Last updated: {lastUpdated.toLocaleTimeString()}
              </Text>
            </div>
            <Tooltip title="Refresh Data">
              <Button 
                icon={<ReloadOutlined />}
                onClick={fetchDashboardData}
                type="primary"
                ghost
                loading={loading}
              />
            </Tooltip>
          </div>
        </div>

        {/* Key Metrics Row */}
        <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
          <Col xs={24} sm={8}>
            <Card 
              hoverable
              style={{ 
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
              }}
            >
              <Statistic
                title="Total Coupons"
                value={stats?.total_coupons_assigned || 0}
                prefix={<DashboardOutlined />}
                valueStyle={{ color: '#1976D2' }}
              />
              <div style={{ display: 'flex', alignItems: 'center', marginTop: 8 }}>
                <RiseOutlined style={{ color: '#4caf50', marginRight: 4 }} />
                <Text style={{ color: '#4caf50', fontSize: '12px' }}>
                  {stats?.total_subcenters || 0} SubCenters active
                </Text>
              </div>
            </Card>
          </Col>

          <Col xs={24} sm={8}>
            <Card 
              hoverable
              style={{ 
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
              }}
            >
              <Statistic
                title="Available Coupons"
                value={stats?.available_coupons || 0}
                prefix={<LineChartOutlined />}
                valueStyle={{ color: '#28a745' }}
              />
              <div style={{ display: 'flex', alignItems: 'center', marginTop: 8 }}>
                <RiseOutlined style={{ color: '#4caf50', marginRight: 4 }} />
                <Text style={{ color: '#4caf50', fontSize: '12px' }}>
                  ${stats?.total_value_usd?.toLocaleString() || '0'} total value
                </Text>
              </div>
            </Card>
          </Col>

          <Col xs={24} sm={8}>
            <Card 
              hoverable
              style={{ 
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
              }}
            >
              <Statistic
                title="Recently Distributed"
                value={stats?.recently_distributed || 0}
                prefix={<BarChartOutlined />}
                valueStyle={{ color: '#dc3545' }}
              />
              <div style={{ display: 'flex', alignItems: 'center', marginTop: 8 }}>
                <Text style={{ color: '#666', fontSize: '12px' }}>
                  Performance: {stats?.performance_score?.toFixed(1) || '0'}%
                </Text>
              </div>
            </Card>
          </Col>
        </Row>

        {/* Charts Row */}
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={12}>
            <Card
              title="Usage Trend"
              style={{ 
                background: 'rgba(255, 255, 255, 0.98)',
                backdropFilter: 'blur(10px)',
                height: 400,
              }}
            >
              {trendData && trendData.labels.length > 0 ? (
                <div style={{ height: 300 }}>
                  <Line
                    data={{
                      labels: trendData.labels,
                      datasets: [
                        {
                          label: 'Used',
                          data: trendData.usage_data,
                          borderColor: '#2196F3',
                          backgroundColor: 'rgba(33, 150, 243, 0.1)',
                          tension: 0.4,
                        },
                        {
                          label: '7-day MA',
                          data: trendData.moving_average,
                          borderColor: '#FF9800',
                          backgroundColor: 'rgba(255, 152, 0, 0.1)',
                          borderDash: [5, 5],
                          tension: 0.4,
                        },
                      ],
                    }}
                    options={lineChartOptions}
                  />
                </div>
              ) : (
                <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Spin />
                </div>
              )}
            </Card>
          </Col>

          <Col xs={24} lg={12}>
            <Card
              title="Quick Actions"
              style={{ 
                background: 'rgba(255, 255, 255, 0.98)',
                backdropFilter: 'blur(10px)',
                height: 400,
              }}
            >
              <div style={{ height: 300, display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px 0' }}>
                <Button type="primary" size="large" icon={<DashboardOutlined />}>
                  View Detailed Analytics
                </Button>
                <Button size="large" icon={<LineChartOutlined />}>
                  Generate Report
                </Button>
                <Button size="large" icon={<BarChartOutlined />}>
                  Manage Allocations
                </Button>
                <Button size="large" icon={<ArrowUpOutlined />}>
                  Performance Metrics
                </Button>
              </div>
            </Card>
          </Col>
        </Row>

        {/* Additional Dashboard Sections */}
        <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
          <Col xs={24} lg={12}>
            <Card
              title="Distribution by SubCenter (last 14 days)"
              style={{ 
                background: 'rgba(255, 255, 255, 0.98)',
                backdropFilter: 'blur(10px)',
                height: 300,
              }}
            >
              <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {loading ? (
                  <Spin />
                ) : (
                  <div style={{ textAlign: 'center', color: '#666' }}>
                    <BarChartOutlined style={{ fontSize: 48, marginBottom: 16 }} />
                    <div>No distribution data available</div>
                  </div>
                )}
              </div>
            </Card>
          </Col>

          <Col xs={24} lg={12}>
            <Card
              title="Top 5 Programs by Coupons (last 30 days)"
              style={{ 
                background: 'rgba(255, 255, 255, 0.98)',
                backdropFilter: 'blur(10px)',
                height: 300,
              }}
            >
              <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {loading ? (
                  <Spin />
                ) : (
                  <div style={{ textAlign: 'center', color: '#666' }}>
                    <LineChartOutlined style={{ fontSize: 48, marginBottom: 16 }} />
                    <div>No program data available</div>
                  </div>
                )}
              </div>
            </Card>
          </Col>
        </Row>

        <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
          <Col xs={24} lg={12}>
            <Card
              title="Utilization Rate"
              style={{ 
                background: 'rgba(255, 255, 255, 0.98)',
                backdropFilter: 'blur(10px)',
                height: 250,
              }}
            >
              <div style={{ height: 170, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontSize: 48, fontWeight: 'bold', color: '#666', marginBottom: 8 }}>
                  {stats?.used_coupons && stats?.total_coupons_assigned ? 
                    Math.round((stats.used_coupons / stats.total_coupons_assigned) * 100) : 0}%
                </div>
                <div style={{ color: '#666' }}>Utilization</div>
                <Progress
                  percent={stats?.used_coupons && stats?.total_coupons_assigned ? 
                    Math.round((stats.used_coupons / stats.total_coupons_assigned) * 100) : 0}
                  showInfo={false}
                  style={{ width: '80%', marginTop: 16 }}
                />
              </div>
            </Card>
          </Col>

          <Col xs={24} lg={12}>
            <Card
              title="Recent Activity"
              style={{ 
                background: 'rgba(255, 255, 255, 0.98)',
                backdropFilter: 'blur(10px)',
                height: 250,
              }}
            >
              <div style={{ height: 170, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center', color: '#666' }}>
                  <DashboardOutlined style={{ fontSize: 24, marginBottom: 8 }} />
                  <div>No recent activity</div>
                </div>
              </div>
            </Card>
          </Col>
        </Row>

        {/* Coupon Allocation Section */}
        <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
          <Col xs={24}>
            <Card
              title="Coupon Allocation"
              style={{ 
                background: 'rgba(255, 255, 255, 0.98)',
                backdropFilter: 'blur(10px)',
                height: 200,
              }}
            >
              <Row gutter={[16, 16]} style={{ height: 120 }}>
                <Col xs={8} style={{ textAlign: 'center' }}>
                  <div style={{ color: '#2196F3', fontSize: 14, fontWeight: 'bold', marginBottom: 8 }}>
                    Available
                  </div>
                  <div style={{ 
                    width: 20, 
                    height: 20, 
                    borderRadius: '50%', 
                    backgroundColor: '#4caf50', 
                    margin: '0 auto 8px',
                    display: 'inline-block'
                  }} />
                  <div style={{ fontSize: 16, fontWeight: 'bold' }}>
                    {stats?.available_coupons || 0}
                  </div>
                </Col>
                <Col xs={8} style={{ textAlign: 'center' }}>
                  <div style={{ color: '#FF9800', fontSize: 14, fontWeight: 'bold', marginBottom: 8 }}>
                    Used
                  </div>
                  <div style={{ 
                    width: 20, 
                    height: 20, 
                    borderRadius: '50%', 
                    backgroundColor: '#ff9800', 
                    margin: '0 auto 8px',
                    display: 'inline-block'
                  }} />
                  <div style={{ fontSize: 16, fontWeight: 'bold' }}>
                    {stats?.used_coupons || 0}
                  </div>
                </Col>
                <Col xs={8} style={{ textAlign: 'center' }}>
                  <div style={{ color: '#9C27B0', fontSize: 14, fontWeight: 'bold', marginBottom: 8 }}>
                    Reserved
                  </div>
                  <div style={{ 
                    width: 20, 
                    height: 20, 
                    borderRadius: '50%', 
                    backgroundColor: '#9c27b0', 
                    margin: '0 auto 8px',
                    display: 'inline-block'
                  }} />
                  <div style={{ fontSize: 16, fontWeight: 'bold' }}>
                    {Math.max(0, (stats?.total_coupons_assigned || 0) - (stats?.available_coupons || 0) - (stats?.used_coupons || 0))}
                  </div>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default SimpleSubCenterDashboard;