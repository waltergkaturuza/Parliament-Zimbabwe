// src/pages/main-center/components/SubCenterMonitoring.tsx
import { useState, useEffect } from 'react';
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
  Spin,
  message,
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
  ExportOutlined,
  DollarOutlined,
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
import apiClient from '../../../api/index';

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
  totalValueUSD: number;
  totalValueZWG: number;
  lastActivity: string;
  performanceScore: number;
  monthlyConsumptionUSD: number;
  alerts: number;
  coordinates?: { lat: number; lng: number };
}

const SubCenterMonitoring: FC = () => {
  const [selectedCenter, setSelectedCenter] = useState<SubCenter | null>(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(true);
  const [subCenters, setSubCenters] = useState<SubCenter[]>([]);

  useEffect(() => {
    loadSubCenters();
  }, []);

  const loadSubCenters = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/api/v1/subcenters/');
      const data = response.data;
      
      // Handle both paginated and direct array responses
      const centers = data.results || data;
      
      if (Array.isArray(centers)) {
        const mappedCenters = centers.map((center: any) => ({
          id: String(center.id),
          name: center.name || 'Unnamed Center',
          code: center.code || `SC${String(center.id).padStart(3, '0')}`,
          location: center.location || 'Not specified',
          manager: center.manager_name || 'Not assigned',
          contact: center.contact_number || 'Not provided',
          email: center.email || 'Not provided',
          status: (center.status?.toUpperCase() || 'ACTIVE') as 'ACTIVE' | 'INACTIVE' | 'SUSPENDED',
          totalBooks: center.total_books || 0,
          booksUsed: center.books_used || 0,
          booksRemaining: (center.total_books || 0) - (center.books_used || 0),
          totalValueUSD: center.total_value_usd || 0,
          totalValueZWG: center.total_value_zwg || (center.total_value_usd || 0) * 27.5,
          lastActivity: center.last_activity || new Date().toISOString(),
          performanceScore: center.performance_score || 0,
          monthlyConsumptionUSD: center.monthly_consumption_usd || 0,
          alerts: center.alerts_count || 0,
          coordinates: center.coordinates ? {
            lat: center.coordinates.lat,
            lng: center.coordinates.lng
          } : undefined,
        }));
        setSubCenters(mappedCenters);
      } else {
        setSubCenters([]);
      }
    } catch (error) {
      console.error('Error loading sub-centers:', error);
      message.error('Failed to load sub-center data');
      setSubCenters([]);
    } finally {
      setLoading(false);
    }
  };

  // Export function
  const handleExportData = () => {
    try {
      const headers = ['Code', 'Name', 'Location', 'Manager', 'Contact', 'Status', 'Total Books', 'Books Used', 'Books Remaining', 'Total Value USD', 'Performance Score'];
      const csvContent = [
        headers.join(','),
        ...subCenters.map(center => [
          center.code,
          center.name,
          center.location,
          center.manager,
          center.contact,
          center.status,
          center.totalBooks,
          center.booksUsed,
          center.booksRemaining,
          center.totalValueUSD,
          center.performanceScore
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `subcenter_monitoring_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Export error:', error);
      message.error('Failed to export data');
    }
  };

  // Filter data
  const filteredData = subCenters.filter(center => {
    const matchesSearch = center.name.toLowerCase().includes(searchText.toLowerCase()) ||
                         center.code.toLowerCase().includes(searchText.toLowerCase()) ||
                         center.location.toLowerCase().includes(searchText.toLowerCase());
    const matchesStatus = filterStatus === 'all' || center.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const totalActiveSubCenters = subCenters.filter(c => c.status === 'ACTIVE').length;
  const totalValueUSD = subCenters.reduce((sum, c) => sum + c.totalValueUSD, 0);
  const averagePerformance = subCenters.length > 0 ? 
    subCenters.reduce((sum, c) => sum + c.performanceScore, 0) / subCenters.length : 0;
  const totalAlerts = subCenters.reduce((sum, c) => sum + c.alerts, 0);

  const performanceData = subCenters.map(center => ({
    name: center.code,
    performance: center.performanceScore,
    consumption: center.monthlyConsumptionUSD, // In USD
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
      title: 'Monthly Value (USD)',
      dataIndex: 'monthlyConsumptionUSD',
      key: 'monthlyConsumptionUSD',
      width: 140,
      render: (value) => (
        <Space>
          <DollarOutlined style={{ color: '#52c41a' }} />
          <Text>${(value || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</Text>
        </Space>
      ),
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

  return (
    <Spin spinning={loading}>
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
              <Button
                icon={<ExportOutlined />}
                onClick={handleExportData}
              >
                Export
              </Button>
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
              title="Total Value (USD)"
              value={totalValueUSD}
              precision={2}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#722ed1' }}
              formatter={(value) => `$${(value || 0).toLocaleString()}`}
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
    </Spin>
  );
};

export default SubCenterMonitoring;
