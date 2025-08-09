// src/pages/subcenter/BeneficiaryAllocationPage.tsx
import { useState, useEffect } from 'react';
import type { FC } from 'react';
import {
  Card,
  Row,
  Col,
  Typography,
  Tabs,
  Space,
  Button,
  Statistic,
  Alert,
  Badge,
  Timeline,
  List,
  Tag,
  Progress,
  Divider,
  message,
} from 'antd';
import {
  TeamOutlined,
  SendOutlined,
  CarOutlined,
  HistoryOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  UserOutlined,
  FileTextOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import BeneficiaryManagement from './components/BeneficiaryManagement';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

interface AllocationSummary {
  id: string;
  date: string;
  sessionName: string;
  programName: string;
  beneficiariesCount: number;
  totalCoupons: number;
  totalLitres: number;
  totalValue: number;
  status: 'COMPLETED' | 'PENDING' | 'IN_PROGRESS';
  allocatedBy: string;
}

interface SystemStats {
  totalBeneficiaries: number;
  activeBeneficiaries: number;
  totalAllocationsToday: number;
  totalLitresToday: number;
  pendingAllocations: number;
  systemBalance: number;
}

const BeneficiaryAllocationPage: FC = () => {
  const [activeTab, setActiveTab] = useState('management');
  const [loading, setLoading] = useState(false);

  // Sample allocation history
  const [allocationHistory, setAllocationHistory] = useState<AllocationSummary[]>([
    {
      id: 'ALLOC001',
      date: '2024-08-09',
      sessionName: 'Morning Parliamentary Session',
      programName: 'Budget Review Committee',
      beneficiariesCount: 15,
      totalCoupons: 150,
      totalLitres: 750,
      totalValue: 135000,
      status: 'COMPLETED',
      allocatedBy: 'Peter Ncube',
    },
    {
      id: 'ALLOC002',
      date: '2024-08-09',
      sessionName: 'Committee Site Visit',
      programName: 'Infrastructure Development',
      beneficiariesCount: 8,
      totalCoupons: 120,
      totalLitres: 600,
      totalValue: 108000,
      status: 'COMPLETED',
      allocatedBy: 'Susan Moyo',
    },
    {
      id: 'ALLOC003',
      date: '2024-08-09',
      sessionName: 'Emergency Session',
      programName: 'Crisis Response Committee',
      beneficiariesCount: 12,
      totalCoupons: 60,
      totalLitres: 300,
      totalValue: 54000,
      status: 'IN_PROGRESS',
      allocatedBy: 'Michael Khumalo',
    },
  ]);

  // System statistics
  const [systemStats, setSystemStats] = useState<SystemStats>({
    totalBeneficiaries: 45,
    activeBeneficiaries: 42,
    totalAllocationsToday: 3,
    totalLitresToday: 1650,
    pendingAllocations: 1,
    systemBalance: 8450,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'success';
      case 'IN_PROGRESS': return 'processing';
      case 'PENDING': return 'warning';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED': return <CheckCircleOutlined />;
      case 'IN_PROGRESS': return <ClockCircleOutlined />;
      case 'PENDING': return <ClockCircleOutlined />;
      default: return <ClockCircleOutlined />;
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={1} style={{ marginBottom: 8 }}>
          <TeamOutlined style={{ marginRight: 12 }} />
          Beneficiary Allocation Management
        </Title>
        <Text type="secondary">
          Manage beneficiaries and process fuel allocations for parliamentary sessions and events.
        </Text>
      </div>

      {/* System Overview */}
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={16}>
          <Col span={4}>
            <Statistic
              title="Total Beneficiaries"
              value={systemStats.totalBeneficiaries}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
          <Col span={4}>
            <Statistic
              title="Active Members"
              value={systemStats.activeBeneficiaries}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Col>
          <Col span={4}>
            <Statistic
              title="Allocations Today"
              value={systemStats.totalAllocationsToday}
              prefix={<SendOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Col>
          <Col span={4}>
            <Statistic
              title="Fuel Allocated Today"
              value={systemStats.totalLitresToday}
              suffix="L"
              prefix={<CarOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Col>
          <Col span={4}>
            <Statistic
              title="Pending Allocations"
              value={systemStats.pendingAllocations}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Col>
          <Col span={4}>
            <Statistic
              title="System Balance"
              value={systemStats.systemBalance}
              suffix="L"
              prefix={<CarOutlined />}
              valueStyle={{ color: '#13c2c2' }}
            />
          </Col>
        </Row>
      </Card>

      {/* Status Alerts */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={12}>
          <Alert
            message="System Status: Operational"
            description="All beneficiary allocation systems are running normally. Ready to process allocations."
            type="success"
            showIcon
          />
        </Col>
        <Col span={12}>
          <Alert
            message={`${systemStats.pendingAllocations} Pending Allocation${systemStats.pendingAllocations !== 1 ? 's' : ''}`}
            description="There are allocations in progress that require monitoring."
            type="info"
            showIcon
          />
        </Col>
      </Row>

      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="Beneficiary Management" key="management">
          <BeneficiaryManagement />
        </TabPane>

        <TabPane tab="Allocation History" key="history">
          <Card>
            <div style={{ marginBottom: 16 }}>
              <Title level={3}>Recent Allocations</Title>
              <Text type="secondary">
                Review completed and ongoing fuel allocations to beneficiaries.
              </Text>
            </div>

            <List
              dataSource={allocationHistory}
              renderItem={(allocation) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={
                      <Badge 
                        status={getStatusColor(allocation.status) as any}
                        dot
                      />
                    }
                    title={
                      <Space>
                        <Text strong>{allocation.sessionName}</Text>
                        <Tag color="blue">{allocation.programName}</Tag>
                        <Badge 
                          status={getStatusColor(allocation.status) as any}
                          text={allocation.status.replace('_', ' ')}
                        />
                      </Space>
                    }
                    description={
                      <Space direction="vertical" size={0}>
                        <Space>
                          <CalendarOutlined />
                          <Text type="secondary">
                            {dayjs(allocation.date).format('DD MMM YYYY')}
                          </Text>
                          <Divider type="vertical" />
                          <UserOutlined />
                          <Text type="secondary">
                            {allocation.beneficiariesCount} beneficiaries
                          </Text>
                          <Divider type="vertical" />
                          <FileTextOutlined />
                          <Text type="secondary">
                            {allocation.totalCoupons} coupons
                          </Text>
                        </Space>
                        <Space>
                          <CarOutlined />
                          <Text type="secondary">
                            {allocation.totalLitres}L
                          </Text>
                          <Divider type="vertical" />
                          <Text type="secondary">
                            ZWG {allocation.totalValue.toLocaleString()}
                          </Text>
                          <Divider type="vertical" />
                          <Text type="secondary">
                            Allocated by: {allocation.allocatedBy}
                          </Text>
                        </Space>
                      </Space>
                    }
                  />
                  <div>
                    {getStatusIcon(allocation.status)}
                  </div>
                </List.Item>
              )}
            />
          </Card>
        </TabPane>

        <TabPane tab="System Analytics" key="analytics">
          <Row gutter={16}>
            <Col span={12}>
              <Card title="Monthly Allocation Trends" style={{ marginBottom: 16 }}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div>
                    <Text strong>MPs Allocations</Text>
                    <Progress percent={85} strokeColor="#1890ff" />
                    <Text type="secondary">42 of 50 MPs allocated this month</Text>
                  </div>
                  <div>
                    <Text strong>Senators Allocations</Text>
                    <Progress percent={78} strokeColor="#722ed1" />
                    <Text type="secondary">15 of 20 Senators allocated this month</Text>
                  </div>
                  <div>
                    <Text strong>Staff Allocations</Text>
                    <Progress percent={65} strokeColor="#52c41a" />
                    <Text type="secondary">25 of 40 Staff allocated this month</Text>
                  </div>
                  <div>
                    <Text strong>Driver Allocations</Text>
                    <Progress percent={90} strokeColor="#fa8c16" />
                    <Text type="secondary">18 of 20 Drivers allocated this month</Text>
                  </div>
                </Space>
              </Card>

              <Card title="Fuel Usage by Category">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div>
                    <Text strong>Members of Parliament</Text>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Text>12,450L</Text>
                      <Text type="secondary">45% of total</Text>
                    </div>
                    <Progress percent={45} strokeColor="#1890ff" />
                  </div>
                  <div>
                    <Text strong>Senators</Text>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Text>6,200L</Text>
                      <Text type="secondary">22% of total</Text>
                    </div>
                    <Progress percent={22} strokeColor="#722ed1" />
                  </div>
                  <div>
                    <Text strong>Official Drivers</Text>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Text>5,400L</Text>
                      <Text type="secondary">19% of total</Text>
                    </div>
                    <Progress percent={19} strokeColor="#fa8c16" />
                  </div>
                  <div>
                    <Text strong>Parliament Staff</Text>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Text>3,950L</Text>
                      <Text type="secondary">14% of total</Text>
                    </div>
                    <Progress percent={14} strokeColor="#52c41a" />
                  </div>
                </Space>
              </Card>
            </Col>

            <Col span={12}>
              <Card title="System Timeline" style={{ marginBottom: 16 }}>
                <Timeline
                  items={[
                    {
                      color: 'green',
                      children: (
                        <div>
                          <Text strong>Bulk allocation completed</Text>
                          <br />
                          <Text type="secondary">
                            15 MPs allocated 750L for Budget Committee
                          </Text>
                          <br />
                          <Text type="secondary">2 hours ago</Text>
                        </div>
                      ),
                    },
                    {
                      color: 'blue',
                      children: (
                        <div>
                          <Text strong>Emergency allocation processed</Text>
                          <br />
                          <Text type="secondary">
                            8 Senators allocated 400L for Crisis Response
                          </Text>
                          <br />
                          <Text type="secondary">4 hours ago</Text>
                        </div>
                      ),
                    },
                    {
                      color: 'orange',
                      children: (
                        <div>
                          <Text strong>System maintenance completed</Text>
                          <br />
                          <Text type="secondary">
                            All beneficiary profiles updated
                          </Text>
                          <br />
                          <Text type="secondary">8 hours ago</Text>
                        </div>
                      ),
                    },
                    {
                      color: 'gray',
                      children: (
                        <div>
                          <Text strong>Monthly allocation reset</Text>
                          <br />
                          <Text type="secondary">
                            All beneficiary balances refreshed
                          </Text>
                          <br />
                          <Text type="secondary">1 day ago</Text>
                        </div>
                      ),
                    },
                  ]}
                />
              </Card>

              <Card title="Quick Actions">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Button 
                    type="primary" 
                    icon={<SendOutlined />} 
                    block
                    onClick={() => setActiveTab('management')}
                  >
                    New Bulk Allocation
                  </Button>
                  <Button 
                    icon={<UserOutlined />} 
                    block
                    onClick={() => setActiveTab('management')}
                  >
                    Add New Beneficiary
                  </Button>
                  <Button 
                    icon={<HistoryOutlined />} 
                    block
                    onClick={() => setActiveTab('history')}
                  >
                    View Allocation History
                  </Button>
                  <Button 
                    icon={<FileTextOutlined />} 
                    block
                  >
                    Generate Reports
                  </Button>
                </Space>
              </Card>
            </Col>
          </Row>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default BeneficiaryAllocationPage;
