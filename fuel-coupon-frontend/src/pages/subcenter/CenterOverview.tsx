// src/pages/subcenter/CenterOverview.tsx
import { useState, useEffect } from 'react';
import type { FC } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Progress,
  Table,
  Tag,
  Space,
  Button,
  Alert,
  Typography,
  Timeline,
  List,
  Avatar,
  Spin,
  message,
} from 'antd';
import {
  BookOutlined,
  CarOutlined,
  UserOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  EnvironmentOutlined,
  DashboardOutlined,
  DollarOutlined,
  ExportOutlined,
} from '@ant-design/icons';
import apiClient from '../../api/index';

const { Title, Text } = Typography;

interface CenterData {
  centerId: string;
  centerName: string;
  totalBooks: number;
  booksUsed: number;
  totalCoupons: number;
  couponsUsed: number;
  activeMembers: number;
  pendingHandovers: number;
  lastHandover: string;
  totalValueUSD: number;
  monthlyConsumptionUSD: number;
}

interface Activity {
  id: number;
  type: string;
  description: string;
  timestamp: string;
  status: string;
  valueUSD?: number;
}

const CenterOverview: FC = () => {
  const [loading, setLoading] = useState(true);
  const [centerData, setCenterData] = useState<CenterData>({
    centerId: '',
    centerName: '',
    totalBooks: 0,
    booksUsed: 0,
    totalCoupons: 0,
    couponsUsed: 0,
    activeMembers: 0,
    pendingHandovers: 0,
    lastHandover: '',
    totalValueUSD: 0,
    monthlyConsumptionUSD: 0,
  });
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);

  useEffect(() => {
    fetchCenterData();
    fetchRecentActivities();
  }, []);

  const fetchCenterData = async () => {
    try {
      const response = await apiClient.get('/subcenter/overview/');
      const data = response.data;
      
      setCenterData({
        centerId: data.center_id || '',
        centerName: data.center_name || '',
        totalBooks: data.total_books || 0,
        booksUsed: data.books_used || 0,
        totalCoupons: data.total_coupons || 0,
        couponsUsed: data.coupons_used || 0,
        activeMembers: data.active_members || 0,
        pendingHandovers: data.pending_handovers || 0,
        lastHandover: data.last_handover || '',
        totalValueUSD: data.total_value_usd || 0,
        monthlyConsumptionUSD: data.monthly_consumption_usd || 0,
      });
    } catch (error) {
      console.error('Error fetching center data:', error);
      message.error('Failed to load center overview data');
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentActivities = async () => {
    try {
      const response = await apiClient.get('/subcenter/activities/');
      const activities = response.data.map((item: any) => ({
        id: item.id,
        type: item.activity_type || 'unknown',
        description: item.description || '',
        timestamp: item.timestamp || '',
        status: item.status || 'unknown',
        valueUSD: item.value_usd || 0,
      }));
      setRecentActivities(activities);
    } catch (error) {
      console.error('Error fetching activities:', error);
      setRecentActivities([]);
    }
  };

  // Export function
  const handleExportData = () => {
    try {
      const headers = ['Activity Type', 'Description', 'Timestamp', 'Status', 'Value USD'];
      const csvContent = [
        headers.join(','),
        ...recentActivities.map(item => [
          item.type,
          `"${item.description}"`,
          item.timestamp,
          item.status,
          item.valueUSD || 0
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `center_activities_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Export error:', error);
      message.error('Failed to export data');
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>Loading center overview...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={2} style={{ margin: 0, color: '#1890ff' }}>
            <EnvironmentOutlined /> Sub Center Overview
          </Title>
          <Text type="secondary">{centerData.centerName} - {centerData.centerId}</Text>
        </Col>
        <Col>
          <Button 
            icon={<ExportOutlined />} 
            onClick={handleExportData}
            type="primary"
          >
            Export Activities
          </Button>
        </Col>
      </Row>

      {/* Key Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Books Available"
              value={centerData.totalBooks - centerData.booksUsed}
              suffix={`/ ${centerData.totalBooks}`}
              prefix={<BookOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
            <Progress 
              percent={centerData.totalBooks > 0 ? ((centerData.totalBooks - centerData.booksUsed) / centerData.totalBooks) * 100 : 0}
              size="small"
              showInfo={false}
              style={{ marginTop: 8 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Coupons Remaining"
              value={centerData.totalCoupons - centerData.couponsUsed}
              suffix={`/ ${centerData.totalCoupons}`}
              prefix={<CarOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
            <Progress 
              percent={centerData.totalCoupons > 0 ? ((centerData.totalCoupons - centerData.couponsUsed) / centerData.totalCoupons) * 100 : 0}
              size="small"
              showInfo={false}
              style={{ marginTop: 8 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Value"
              value={centerData.totalValueUSD}
              prefix={<DollarOutlined />}
              suffix="USD"
              precision={0}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Monthly Consumption"
              value={centerData.monthlyConsumptionUSD}
              prefix={<DollarOutlined />}
              suffix="USD"
              precision={0}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Quick Actions & Status */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} md={12}>
          <Card title="Center Status" extra={<DashboardOutlined />}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>Active Members</Text>
                <Tag color="green">{centerData.activeMembers}</Tag>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>Pending Handovers</Text>
                <Tag color={centerData.pendingHandovers > 0 ? 'orange' : 'green'}>
                  {centerData.pendingHandovers}
                </Tag>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>Last Handover</Text>
                <Text type="secondary">{centerData.lastHandover || 'No recent handovers'}</Text>
              </div>
            </Space>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="Quick Actions">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button type="primary" block icon={<BookOutlined />}>
                Request Books
              </Button>
              <Button block icon={<CarOutlined />}>
                Distribute Coupons
              </Button>
              <Button block icon={<CheckCircleOutlined />}>
                Process Handover
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Recent Activities */}
      <Card title="Recent Activities" extra={<ClockCircleOutlined />}>
        {recentActivities.length > 0 ? (
          <Timeline>
            {recentActivities.map((activity) => (
              <Timeline.Item
                key={activity.id}
                color={activity.status === 'completed' ? 'green' : 'orange'}
                dot={
                  activity.status === 'completed' ? 
                    <CheckCircleOutlined style={{ fontSize: '16px' }} /> : 
                    <ExclamationCircleOutlined style={{ fontSize: '16px' }} />
                }
              >
                <div>
                  <Text strong>{activity.description}</Text>
                  {activity.valueUSD && activity.valueUSD > 0 && (
                    <div>
                      <DollarOutlined style={{ color: '#52c41a', marginRight: 4 }} />
                      <Text type="secondary">${activity.valueUSD.toLocaleString()} USD</Text>
                    </div>
                  )}
                  <div>
                    <Text type="secondary">{activity.timestamp}</Text>
                    <Tag 
                      color={activity.status === 'completed' ? 'success' : 'warning'}
                      style={{ marginLeft: 8 }}
                    >
                      {activity.status}
                    </Tag>
                  </div>
                </div>
              </Timeline.Item>
            ))}
          </Timeline>
        ) : (
          <Alert
            message="No Recent Activities"
            description="No activities found for this sub center."
            type="info"
            showIcon
          />
        )}
      </Card>
    </div>
export default CenterOverview;
