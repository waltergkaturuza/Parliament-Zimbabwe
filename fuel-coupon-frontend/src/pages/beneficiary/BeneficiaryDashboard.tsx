import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Card, 
  Row, 
  Col, 
  Typography, 
  Button, 
  Spin, 
  Space,
  Statistic,
  Badge,
  Tag
} from 'antd';
import { 
  FileTextOutlined, 
  HistoryOutlined, 
  UserOutlined,
  CarOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';

const { Title, Paragraph } = Typography;

const BeneficiaryDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    totalRequests: 8,
    approvedRequests: 5,
    pendingRequests: 2,
    rejectedRequests: 1,
    totalFuelUsed: 245.5,
    remainingFuel: 154.5,
  });

  useEffect(() => {
    // Simulate data loading
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '400px' 
      }}>
        <Space direction="vertical" align="center">
          <Spin size="large" />
          <Typography.Text type="secondary">Loading dashboard...</Typography.Text>
        </Space>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '24px'
        }}>
          <div>
            <Title level={2} style={{ margin: 0 }}>
              Welcome, {user?.name || user?.username || 'Beneficiary'}
            </Title>
            <Paragraph type="secondary" style={{ margin: 0, marginTop: '8px' }}>
              Manage your fuel coupon requests and view your usage history
            </Paragraph>
          </div>
          <Tag color="blue" style={{ padding: '4px 12px', fontSize: '14px' }}>
            {user?.role?.replace('_', ' ') || 'Beneficiary'}
          </Tag>
        </div>

        {/* Statistics Cards */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Total Requests"
                value={dashboardData.totalRequests}
                prefix={<FileTextOutlined style={{ color: '#1890ff' }} />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Approved"
                value={dashboardData.approvedRequests}
                prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Pending"
                value={dashboardData.pendingRequests}
                prefix={<ClockCircleOutlined style={{ color: '#faad14' }} />}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Total Fuel Used (L)"
                value={dashboardData.totalFuelUsed}
                precision={1}
                prefix={<CarOutlined style={{ color: '#722ed1' }} />}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
        </Row>

        {/* Action Cards */}
        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <Card
              hoverable
              style={{ height: '100%' }}
              cover={
                <div style={{ 
                  padding: '40px', 
                  textAlign: 'center', 
                  backgroundColor: '#f0f9ff' 
                }}>
                  <FileTextOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
                </div>
              }
            >
              <Card.Meta
                title="Fuel Coupon Requests"
                description="Submit new requests and track existing ones"
              />
              <div style={{ marginTop: '16px' }}>
                <Button 
                  type="primary" 
                  block
                  onClick={() => navigate('/dashboard/beneficiaries')}
                >
                  Manage Requests
                </Button>
              </div>
            </Card>
          </Col>

          <Col xs={24} md={8}>
            <Card
              hoverable
              style={{ height: '100%' }}
              cover={
                <div style={{ 
                  padding: '40px', 
                  textAlign: 'center', 
                  backgroundColor: '#f6ffed' 
                }}>
                  <HistoryOutlined style={{ fontSize: '48px', color: '#52c41a' }} />
                </div>
              }
            >
              <Card.Meta
                title="Usage History"
                description="View your fuel consumption records"
              />
              <div style={{ marginTop: '16px' }}>
                <Button 
                  type="primary" 
                  block
                  onClick={() => navigate('/dashboard/attendance')}
                >
                  View History
                </Button>
              </div>
            </Card>
          </Col>

          <Col xs={24} md={8}>
            <Card
              hoverable
              style={{ height: '100%' }}
              cover={
                <div style={{ 
                  padding: '40px', 
                  textAlign: 'center', 
                  backgroundColor: '#fff7e6' 
                }}>
                  <UserOutlined style={{ fontSize: '48px', color: '#fa8c16' }} />
                </div>
              }
            >
              <Card.Meta
                title="Profile Settings"
                description="Update your account information"
              />
              <div style={{ marginTop: '16px' }}>
                <Button 
                  type="primary" 
                  block
                  onClick={() => navigate('/dashboard/settings')}
                >
                  Update Profile
                </Button>
              </div>
            </Card>
          </Col>
        </Row>

        {/* Recent Activity */}
        <Card title="Recent Activity" style={{ marginTop: '24px' }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Space>
                <Badge status="success" />
                <span>Fuel request #FR-2024-005 approved</span>
              </Space>
              <Typography.Text type="secondary">2 hours ago</Typography.Text>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Space>
                <Badge status="processing" />
                <span>Fuel request #FR-2024-006 under review</span>
              </Space>
              <Typography.Text type="secondary">1 day ago</Typography.Text>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Space>
                <Badge status="default" />
                <span>Profile updated successfully</span>
              </Space>
              <Typography.Text type="secondary">3 days ago</Typography.Text>
            </div>
          </Space>
        </Card>
      </Space>
    </div>
  );
};

export default BeneficiaryDashboard;
