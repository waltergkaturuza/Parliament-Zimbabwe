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
} from '@ant-design/icons';

const { Title, Text } = Typography;

const CenterOverview: FC = () => {
  const [loading, setLoading] = useState(true);
  const [centerData, setCenterData] = useState({
    centerId: 'SC-001',
    centerName: 'Harare South Sub Center',
    totalBooks: 45,
    booksUsed: 12,
    totalCoupons: 900,
    couponsUsed: 240,
    activeMembers: 18,
    pendingHandovers: 3,
    lastHandover: '2024-07-02',
  });

  useEffect(() => {
    // Fetch center data from API
    const fetchCenterData = async () => {
      try {
        // Replace with actual API call
        // const response = await fetch('/api/v1/subcenter/overview/');
        setLoading(false);
      } catch (error) {
        console.error('Error fetching center data:', error);
        setLoading(false);
      }
    };

    fetchCenterData();
  }, []);

  const recentActivities = [
    {
      id: 1,
      type: 'handover',
      description: 'Received 20 petrol books from Main Center',
      timestamp: '2024-07-04 10:30',
      status: 'completed',
    },
    {
      id: 2,
      type: 'distribution',
      description: 'Distributed 5 diesel coupons to Hon. Mukamuri',
      timestamp: '2024-07-04 09:15',
      status: 'completed',
    },
    {
      id: 3,
      type: 'handover',
      description: 'Pending handover of 15 diesel books',
      timestamp: '2024-07-03 16:45',
      status: 'pending',
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0, color: '#1890ff' }}>
          <EnvironmentOutlined /> Sub Center Overview
        </Title>
        <Text type="secondary">{centerData.centerName} - {centerData.centerId}</Text>
      </div>

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
              percent={((centerData.totalBooks - centerData.booksUsed) / centerData.totalBooks) * 100}
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
              percent={((centerData.totalCoupons - centerData.couponsUsed) / centerData.totalCoupons) * 100}
              size="small"
              showInfo={false}
              style={{ marginTop: 8 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Active Members"
              value={centerData.activeMembers}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Pending Handovers"
              value={centerData.pendingHandovers}
              prefix={<ExclamationCircleOutlined />}
              valueStyle={{ color: centerData.pendingHandovers > 0 ? '#ff4d4f' : '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Alerts */}
      {centerData.pendingHandovers > 0 && (
        <Alert
          message="Pending Handovers"
          description={`You have ${centerData.pendingHandovers} pending handovers from the Main Center. Please check the handovers section.`}
          type="warning"
          showIcon
          style={{ marginBottom: 24 }}
          action={
            <Button size="small" type="primary">
              View Handovers
            </Button>
          }
        />
      )}

      <Row gutter={[16, 16]}>
        {/* Recent Activities */}
        <Col xs={24} lg={12}>
          <Card title="Recent Activities" extra={<Button type="link">View All</Button>}>
            <Timeline
              items={recentActivities.map(activity => ({
                dot: activity.status === 'completed' ? 
                  <CheckCircleOutlined style={{ color: '#52c41a' }} /> : 
                  <ClockCircleOutlined style={{ color: '#faad14' }} />,
                children: (
                  <div>
                    <Text strong>{activity.description}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {activity.timestamp}
                    </Text>
                  </div>
                ),
              }))}
            />
          </Card>
        </Col>

        {/* Center Information */}
        <Col xs={24} lg={12}>
          <Card title="Center Information">
            <List
              itemLayout="horizontal"
              dataSource={[
                {
                  title: 'Center ID',
                  description: centerData.centerId,
                  icon: <DashboardOutlined />,
                },
                {
                  title: 'Center Name',
                  description: centerData.centerName,
                  icon: <EnvironmentOutlined />,
                },
                {
                  title: 'Last Handover',
                  description: centerData.lastHandover,
                  icon: <ClockCircleOutlined />,
                },
                {
                  title: 'Status',
                  description: 'Active',
                  icon: <CheckCircleOutlined />,
                },
              ]}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar icon={item.icon} />}
                    title={item.title}
                    description={item.description}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default CenterOverview;
