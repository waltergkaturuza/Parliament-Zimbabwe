// src/pages/main-center/MainCenterDashboard.tsx
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Layout,
  Card,
  Row,
  Col,
  Statistic,
  Typography,
  Tabs,
  Space,
  Button,
  Badge,
  Progress,
  Alert,
  Divider,
  notification,
} from 'antd';
import {
  DashboardOutlined,
  InboxOutlined,
  BookOutlined,
  SendOutlined,
  BarChartOutlined,
  DollarOutlined,
  CarOutlined,
  EnvironmentOutlined,
  AlertOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import apiClient from '@/api';

// Import modular components
import BoxReceiptManagement from './components/BoxReceiptManagement';
import InventoryOverview from './components/InventoryOverview';
import BookDispatchManagement from './components/BookDispatchManagement';
import AnalyticsFinance from './components/AnalyticsFinance';
import FuelPriceManagement from './components/FuelPriceManagement';
import SubCenterMonitoring from './components/SubCenterMonitoring';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const MainCenterDashboard: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview');
  const [dashboardStats, setDashboardStats] = useState({
    totalBoxesReceived: 0,
    totalBooksDispatched: 0,
    totalCouponsActive: 0,
    totalMonetaryValue: 0,
    pendingReceipts: 0,
    activeSubCenters: 0,
    lowInventoryAlerts: 0,
    todayReceipts: 0,
    currentPetrolPrice: 0,
    currentDieselPrice: 0,
    pendingHandovers: 0,
    completedDispatchesToday: 0,
  });
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState<any[]>([]);

  // Handle tab change and update URL
  const handleTabChange = (key: string) => {
    setActiveTab(key);
    setSearchParams({ tab: key });
  };

  // Fetch dashboard statistics
  useEffect(() => {
    fetchDashboardStats();
    // Set up real-time updates every 5 minutes instead of 30 seconds
    const interval = setInterval(fetchDashboardStats, 300000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      console.log('Fetching dashboard stats from backend...');
      
      // Try to fetch from actual Django API
      try {
        const response = await apiClient.get('/dashboard/');
        
        const data = response.data;
        console.log('Dashboard data from API:', data);
        setDashboardStats({
          totalBoxesReceived: data.total_boxes_received || 0,
          totalBooksDispatched: data.total_books_dispatched || 0,
          totalCouponsActive: data.total_coupons_active || 0,
          totalMonetaryValue: data.total_monetary_value || 0,
          pendingReceipts: data.pending_receipts || 0,
          activeSubCenters: data.active_subcenters || 0,
          lowInventoryAlerts: data.low_inventory_alerts || 0,
          todayReceipts: data.today_receipts || 0,
          currentPetrolPrice: data.current_petrol_price || 200,
          currentDieselPrice: data.current_diesel_price || 180,
          pendingHandovers: data.pending_handovers || 0,
          completedDispatchesToday: data.completed_dispatches_today || 0,
        });
        
        // Also try to fetch alerts
        try {
          const alertsResponse = await apiClient.get('/analytics/');
          const alertsData = alertsResponse.data;
          setAlerts(alertsData.alerts || []);
        } catch (alertError) {
          console.log('Could not fetch alerts:', alertError);
        }
        
        return; // Exit early if API call was successful
      } catch (apiError) {
        console.log('API not available or error occurred:', apiError);
      }
      
      // Use mock data if API fails or is not available
      console.log('Using mock data for dashboard');
      setDashboardStats({
        totalBoxesReceived: 245,
        totalBooksDispatched: 4680,
        totalCouponsActive: 93600,
        totalMonetaryValue: 18720000, // ZWL
        pendingReceipts: 12,
        activeSubCenters: 18,
        lowInventoryAlerts: 3,
        todayReceipts: 6,
        currentPetrolPrice: 200,
        currentDieselPrice: 180,
        pendingHandovers: 8,
        completedDispatchesToday: 14,
      });
      
      setAlerts([
        {
          id: 1,
          type: 'warning',
          message: 'Harare South Sub-Center has low petrol coupon inventory (< 50 coupons)',
          timestamp: new Date().toISOString(),
        },
        {
          id: 2,
          type: 'info',
          message: 'New fuel price update pending approval',
          timestamp: new Date().toISOString(),
        },
      ]);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      // Don't show error notification for missing backend
    } finally {
      setLoading(false);
    }
  };

  const tabItems = [
    {
      key: 'overview',
      label: (
        <Space>
          <DashboardOutlined />
          Overview
        </Space>
      ),
      children: (
        <InventoryOverview />
      ),
    },
    {
      key: 'batch-receipt',
      label: (
        <Space>
          <InboxOutlined />
          Batch Receipt
          {dashboardStats.pendingReceipts > 0 && (
            <Badge count={dashboardStats.pendingReceipts} size="small" />
          )}
        </Space>
      ),
      children: (
        <BoxReceiptManagement />
      ),
    },
    {
      key: 'book-dispatch',
      label: (
        <Space>
          <SendOutlined />
          Book Dispatch
          {dashboardStats.pendingHandovers > 0 && (
            <Badge count={dashboardStats.pendingHandovers} size="small" />
          )}
        </Space>
      ),
      children: (
        <BookDispatchManagement />
      ),
    },
    {
      key: 'fuel-pricing',
      label: (
        <Space>
          <CarOutlined />
          Fuel Pricing
        </Space>
      ),
      children: (
        <FuelPriceManagement />
      ),
    },
    {
      key: 'analytics',
      label: (
        <Space>
          <BarChartOutlined />
          Analytics & Finance
        </Space>
      ),
      children: (
        <AnalyticsFinance />
      ),
    },
    {
      key: 'sub-centers',
      label: (
        <Space>
          <EnvironmentOutlined />
          Sub Centers
        </Space>
      ),
      children: (
        <SubCenterMonitoring />
      ),
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div style={{ padding: '0 24px' }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <Title level={2} style={{ margin: 0, color: '#1890ff' }}>
            Main Center Dashboard
          </Title>
          <Text type="secondary">
            Fuel Coupon Management System - Petrotrade Integration
          </Text>
        </div>

        {/* Quick Stats */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} md={6}>
            <Card loading={loading}>
              <Statistic
                title="Batches Received"
                value={dashboardStats.totalBoxesReceived}
                prefix={<InboxOutlined />}
                valueStyle={{ color: '#3f8600' }}
              />
              <Text type="secondary" style={{ fontSize: '12px' }}>
                Today: {dashboardStats.todayReceipts}
              </Text>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card loading={loading}>
              <Statistic
                title="Books Dispatched"
                value={dashboardStats.totalBooksDispatched}
                prefix={<BookOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
              <Text type="secondary" style={{ fontSize: '12px' }}>
                Today: {dashboardStats.completedDispatchesToday}
              </Text>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card loading={loading}>
              <Statistic
                title="Active Coupons"
                value={dashboardStats.totalCouponsActive}
                prefix={<DashboardOutlined />}
                valueStyle={{ color: '#722ed1' }}
              />
              <Text type="secondary" style={{ fontSize: '12px' }}>
                Available for distribution
              </Text>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card loading={loading}>
              <Statistic
                title="Total Value (ZWL)"
                value={dashboardStats.totalMonetaryValue}
                prefix={<DollarOutlined />}
                valueStyle={{ color: '#cf1322' }}
                formatter={(value) => `${value?.toLocaleString()}`}
              />
              <Text type="secondary" style={{ fontSize: '12px' }}>
                Current inventory value
              </Text>
            </Card>
          </Col>
        </Row>

        {/* Additional Stats Row */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} md={6}>
            <Card loading={loading}>
              <Statistic
                title="Current Petrol Price"
                value={dashboardStats.currentPetrolPrice}
                prefix={<CarOutlined />}
                valueStyle={{ color: '#1890ff' }}
                formatter={(value) => `ZWL ${value}`}
                suffix="/ Litre"
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card loading={loading}>
              <Statistic
                title="Current Diesel Price"
                value={dashboardStats.currentDieselPrice}
                prefix={<CarOutlined />}
                valueStyle={{ color: '#52c41a' }}
                formatter={(value) => `ZWL ${value}`}
                suffix="/ Litre"
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card loading={loading}>
              <Statistic
                title="Active Sub Centers"
                value={dashboardStats.activeSubCenters}
                prefix={<EnvironmentOutlined />}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card loading={loading}>
              <Statistic
                title="Pending Handovers"
                value={dashboardStats.pendingHandovers}
                prefix={<SendOutlined />}
                valueStyle={{ color: '#fa8c16' }}
              />
            </Card>
          </Col>
        </Row>

        {/* Dynamic Alerts */}
        {alerts.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            {alerts.map((alert) => (
              <Alert
                key={alert.id}
                message={alert.message}
                type={alert.type}
                showIcon
                closable
                style={{ marginBottom: 8 }}
                action={
                  <Button size="small" type="primary">
                    View Details
                  </Button>
                }
              />
            ))}
          </div>
        )}

        {/* Main Content Tabs */}
        <Card>
          <Tabs
            activeKey={activeTab}
            onChange={handleTabChange}
            items={tabItems}
            tabBarStyle={{ marginBottom: 24 }}
          />
        </Card>
      </div>
    </motion.div>
  );
};

export default MainCenterDashboard;
