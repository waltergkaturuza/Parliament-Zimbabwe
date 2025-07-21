// src/pages/main-center/components/SubCenterMonitoring.tsx
import { useState } from 'react';
import type { FC } from 'react';
import {
  Card,
  Table,
  Row,
  Col,
  Statistic,
  Typography,
  Space,
  Button,
  Tag,
  Progress,
  Badge,
  Modal,
  Descriptions,
  Alert,
  Select,
  Input,
  Tooltip,
} from 'antd';
import {
  EnvironmentOutlined,
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
  EyeOutlined,
  AlertOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  DashboardOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import { ColumnsType } from 'antd/es/table';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

interface SubCenter {
  id: string;
  name: string;
  code: string;
  location: string;
  manager: string;
  contact: string;
  email: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  totalBooks: number;
  booksUsed: number;
  booksRemaining: number;
  totalValue: number;
  lastActivity: string;
  performanceScore: number;
  monthlyConsumption: number;
  alerts: number;
  coordinates?: { lat: number; lng: number };
}

const SubCenterMonitoring: FC = () => {
  const [selectedCenter, setSelectedCenter] = useState<SubCenter | null>(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchText, setSearchText] = useState('');

  // Sample data
  const subCenters: SubCenter[] = [
    {
      id: '1',
      name: 'Harare Central',
      code: 'HC001',
      location: 'Harare CBD',
      manager: 'John Mukamuri',
      contact: '+263 77 123 4567',
      email: 'john.mukamuri@parliament.gov.zw',
      status: 'ACTIVE',
      totalBooks: 150,
      booksUsed: 125,
      booksRemaining: 25,
      totalValue: 3000000,
      lastActivity: '2024-07-04 14:30',
      performanceScore: 95,
      monthlyConsumption: 2800000,
      alerts: 1,
    },
    {
      id: '2',
      name: 'Bulawayo North',
      code: 'BN002',
      location: 'Bulawayo Industrial',
      manager: 'Mary Chigwamba',
      contact: '+263 77 234 5678',
      email: 'mary.chigwamba@parliament.gov.zw',
      status: 'ACTIVE',
      totalBooks: 120,
      booksUsed: 85,
      booksRemaining: 35,
      totalValue: 2400000,
      lastActivity: '2024-07-04 12:15',
      performanceScore: 87,
      monthlyConsumption: 2000000,
      alerts: 0,
    },
    {
      id: '3',
      name: 'Mutare East',
      code: 'ME003',
      location: 'Mutare Commercial',
      manager: 'Peter Zimunya',
      contact: '+263 77 345 6789',
      email: 'peter.zimunya@parliament.gov.zw',
      status: 'ACTIVE',
      totalBooks: 100,
      booksUsed: 95,
      booksRemaining: 5,
      totalValue: 2000000,
      lastActivity: '2024-07-04 10:45',
      performanceScore: 78,
      monthlyConsumption: 1600000,
      alerts: 2,
    },
    {
      id: '4',
      name: 'Gweru South',
      code: 'GS004',
      location: 'Gweru Town',
      manager: 'Sarah Moyo',
      contact: '+263 77 456 7890',
      email: 'sarah.moyo@parliament.gov.zw',
      status: 'INACTIVE',
      totalBooks: 80,
      booksUsed: 60,
      booksRemaining: 20,
      totalValue: 1600000,
      lastActivity: '2024-07-02 16:20',
      performanceScore: 65,
      monthlyConsumption: 1200000,
      alerts: 3,
    },
  ];

  const consumptionTrend = [
    { date: '01/07', harare: 450000, bulawayo: 320000, mutare: 280000, gweru: 180000 },
    { date: '02/07', harare: 480000, bulawayo: 340000, mutare: 290000, gweru: 190000 },
    { date: '03/07', harare: 510000, bulawayo: 360000, mutare: 300000, gweru: 200000 },
    { date: '04/07', harare: 520000, bulawayo: 380000, mutare: 310000, gweru: 210000 },
  ];

  const performanceData = subCenters.map(center => ({
    name: center.code,
    performance: center.performanceScore,
    consumption: center.monthlyConsumption / 1000000, // Convert to millions
  }));

  const columns: ColumnsType<SubCenter> = [
    {
      title: 'Center',
      key: 'center',
      fixed: 'left',
      width: 200,
      render: (_, record) => (
        <div>
          <Text strong>{record.name}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.code} • {record.location}
          </Text>
        </div>
      ),
    },
    {
      title: 'Manager',
      key: 'manager',
      width: 150,
      render: (_, record) => (
        <div>
          <Text>{record.manager}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            <PhoneOutlined /> {record.contact}
          </Text>
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const colors: Record<string, string> = {
          ACTIVE: 'green',
          INACTIVE: 'orange',
          SUSPENDED: 'red',
        };
        return <Tag color={colors[status] || 'default'}>{status}</Tag>;
      },
    },
    {
      title: 'Books Inventory',
      key: 'inventory',
      width: 150,
      render: (_, record) => {
        const percentage = (record.booksRemaining / record.totalBooks) * 100;
        const status = percentage < 20 ? 'exception' : percentage < 50 ? 'active' : 'success';
        
        return (
          <div>
            <Text>{record.booksRemaining}/{record.totalBooks}</Text>
            <Progress
              percent={percentage}
              size="small"
              status={status}
              showInfo={false}
              style={{ marginTop: 4 }}
            />
          </div>
        );
      },
    },
    {
      title: 'Performance',
      dataIndex: 'performanceScore',
      key: 'performanceScore',
      width: 120,
      render: (score) => (
        <div>
          <Text strong style={{ color: score > 80 ? '#52c41a' : score > 60 ? '#faad14' : '#ff4d4f' }}>
            {score}%
          </Text>
          <Progress
            percent={score}
            size="small"
            showInfo={false}
            status={score > 80 ? 'success' : score > 60 ? 'active' : 'exception'}
            style={{ marginTop: 4 }}
          />
        </div>
      ),
    },
    {
      title: 'Monthly Value',
      dataIndex: 'monthlyConsumption',
      key: 'monthlyConsumption',
      width: 120,
      render: (value) => `ZWG ${(value / 1000000).toFixed(1)}M`,
    },
    {
      title: 'Last Activity',
      dataIndex: 'lastActivity',
      key: 'lastActivity',
      width: 130,
      render: (time) => {
        const isRecent = dayjs().diff(dayjs(time), 'hours') < 24;
        return (
          <Text style={{ color: isRecent ? '#52c41a' : '#faad14' }}>
            {dayjs(time).format('DD/MM HH:mm')}
          </Text>
        );
      },
    },
    {
      title: 'Alerts',
      dataIndex: 'alerts',
      key: 'alerts',
      width: 80,
      render: (alerts) => (
        <Badge
          count={alerts}
          overflowCount={9}
          style={{ backgroundColor: alerts > 0 ? '#ff4d4f' : '#52c41a' }}
        />
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 100,
      render: (_, record) => (
        <Space>
          <Tooltip title="View Details">
            <Button
              type="link"
              icon={<EyeOutlined />}
              onClick={() => viewCenterDetails(record)}
            />
          </Tooltip>
          <Tooltip title="Dashboard">
            <Button
              type="link"
              icon={<DashboardOutlined />}
              onClick={() => openCenterDashboard(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const viewCenterDetails = (center: SubCenter) => {
    setSelectedCenter(center);
    setDetailsModalVisible(true);
  };

  const openCenterDashboard = (center: SubCenter) => {
    // Navigate to center-specific dashboard
    console.log('Opening dashboard for:', center.name);
  };

  const filteredCenters = subCenters.filter((center) => {
    const matchesSearch = center.name.toLowerCase().includes(searchText.toLowerCase()) ||
                         center.code.toLowerCase().includes(searchText.toLowerCase()) ||
                         center.manager.toLowerCase().includes(searchText.toLowerCase());
    const matchesStatus = filterStatus === 'all' || center.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  // Calculate summary statistics
  const totalCenters = subCenters.length;
  const activeCenters = subCenters.filter(c => c.status === 'ACTIVE').length;
  const totalAlerts = subCenters.reduce((sum, c) => sum + c.alerts, 0);
  const avgPerformance = subCenters.reduce((sum, c) => sum + c.performanceScore, 0) / totalCenters;
  const lowInventoryCenters = subCenters.filter(c => (c.booksRemaining / c.totalBooks) < 0.2).length;

  return (
    <div>
      {/* Header */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Title level={4}>Sub Center Monitoring</Title>
          <Text type="secondary">Monitor and manage all sub centers across the country</Text>
        </Col>
        <Col>
          <Space>
            <Search
              placeholder="Search centers..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 200 }}
            />
            <Select
              value={filterStatus}
              onChange={setFilterStatus}
              style={{ width: 120 }}
            >
              <Option value="all">All Status</Option>
              <Option value="ACTIVE">Active</Option>
              <Option value="INACTIVE">Inactive</Option>
              <Option value="SUSPENDED">Suspended</Option>
            </Select>
          </Space>
        </Col>
      </Row>

      {/* Summary Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Centers"
              value={totalCenters}
              prefix={<EnvironmentOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
            <div style={{ marginTop: 8 }}>
              <Text style={{ fontSize: '12px', color: '#52c41a' }}>
                {activeCenters} Active
              </Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Active Alerts"
              value={totalAlerts}
              prefix={<AlertOutlined />}
              valueStyle={{ color: totalAlerts > 5 ? '#ff4d4f' : '#faad14' }}
            />
            <div style={{ marginTop: 8 }}>
              <Text style={{ fontSize: '12px' }}>
                {lowInventoryCenters} Low Inventory
              </Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Avg Performance"
              value={avgPerformance}
              precision={1}
              suffix="%"
              prefix={<BarChartOutlined />}
              valueStyle={{ color: avgPerformance > 80 ? '#52c41a' : '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Monthly Total"
              value={subCenters.reduce((sum, c) => sum + c.monthlyConsumption, 0) / 1000000}
              precision={1}
              suffix="M ZWG"
              prefix="$"
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Alerts */}
      {totalAlerts > 0 && (
        <Alert
          message={`${totalAlerts} alerts require attention across sub centers`}
          type="warning"
          showIcon
          style={{ marginBottom: 24 }}
          action={
            <Button size="small" type="primary">
              View All Alerts
            </Button>
          }
        />
      )}

      {/* Charts */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <Card title="Daily Consumption Trend" size="small">
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={consumptionTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`} />
                <RechartsTooltip formatter={(value: number) => [`ZWG ${value.toLocaleString()}`, '']} />
                <Line type="monotone" dataKey="harare" stroke="#1890ff" name="Harare" />
                <Line type="monotone" dataKey="bulawayo" stroke="#52c41a" name="Bulawayo" />
                <Line type="monotone" dataKey="mutare" stroke="#faad14" name="Mutare" />
                <Line type="monotone" dataKey="gweru" stroke="#f5222d" name="Gweru" />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Performance vs Consumption" size="small">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <RechartsTooltip />
                <Bar dataKey="performance" fill="#1890ff" name="Performance %" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* Centers Table */}
      <Card title={`Sub Centers (${filteredCenters.length} of ${totalCenters})`}>
        <Table
          columns={columns}
          dataSource={filteredCenters}
          rowKey="id"
          scroll={{ x: 1200 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} centers`,
          }}
          rowClassName={(record) => {
            if (record.alerts > 2) return 'high-alert-row';
            if (record.status === 'INACTIVE') return 'inactive-row';
            return '';
          }}
        />
      </Card>

      {/* Center Details Modal */}
      <Modal
        title={`${selectedCenter?.name} Details`}
        open={detailsModalVisible}
        onCancel={() => setDetailsModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailsModalVisible(false)}>
            Close
          </Button>,
          <Button key="dashboard" type="primary">
            Open Dashboard
          </Button>,
        ]}
        width={800}
      >
        {selectedCenter && (
          <div>
            <Descriptions bordered column={2}>
              <Descriptions.Item label="Center Name">{selectedCenter.name}</Descriptions.Item>
              <Descriptions.Item label="Center Code">{selectedCenter.code}</Descriptions.Item>
              <Descriptions.Item label="Location">{selectedCenter.location}</Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={selectedCenter.status === 'ACTIVE' ? 'green' : 'orange'}>
                  {selectedCenter.status}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Manager">{selectedCenter.manager}</Descriptions.Item>
              <Descriptions.Item label="Contact">{selectedCenter.contact}</Descriptions.Item>
              <Descriptions.Item label="Email" span={2}>{selectedCenter.email}</Descriptions.Item>
              <Descriptions.Item label="Total Books">{selectedCenter.totalBooks}</Descriptions.Item>
              <Descriptions.Item label="Books Remaining">{selectedCenter.booksRemaining}</Descriptions.Item>
              <Descriptions.Item label="Performance Score">{selectedCenter.performanceScore}%</Descriptions.Item>
              <Descriptions.Item label="Monthly Consumption">
                ZWG {selectedCenter.monthlyConsumption.toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="Last Activity">
                {dayjs(selectedCenter.lastActivity).format('DD/MM/YYYY HH:mm')}
              </Descriptions.Item>
              <Descriptions.Item label="Active Alerts">
                <Badge count={selectedCenter.alerts} />
              </Descriptions.Item>
            </Descriptions>

            {selectedCenter.alerts > 0 && (
              <div style={{ marginTop: 16 }}>
                <Title level={5}>Active Alerts</Title>
                <Space direction="vertical" style={{ width: '100%' }}>
                  {selectedCenter.booksRemaining < 10 && (
                    <Alert
                      message="Low Inventory"
                      description="Book inventory is running low. Consider scheduling a dispatch."
                      type="warning"
                      showIcon
                    />
                  )}
                  {dayjs().diff(dayjs(selectedCenter.lastActivity), 'hours') > 48 && (
                    <Alert
                      message="Inactive Center"
                      description="No activity recorded in the last 48 hours."
                      type="error"
                      showIcon
                    />
                  )}
                  {selectedCenter.performanceScore < 70 && (
                    <Alert
                      message="Low Performance"
                      description="Performance score is below acceptable threshold."
                      type="warning"
                      showIcon
                    />
                  )}
                </Space>
              </div>
            )}
          </div>
        )}
      </Modal>

      <style>{`
        .high-alert-row {
          background-color: #fff2f0;
        }
        .high-alert-row:hover {
          background-color: #ffe7e3 !important;
        }
        .inactive-row {
          background-color: #fffbe6;
        }
        .inactive-row:hover {
          background-color: #fff7d3 !important;
        }
      `}</style>
    </div>
  );
};

export default SubCenterMonitoring;
