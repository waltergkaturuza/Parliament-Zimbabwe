// src/pages/audit/TransactionAudit.tsx
import { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  DatePicker,
  Input,
  Select,
  Row,
  Col,
  Statistic,
  Alert,
  Typography,
  Modal,
  Descriptions,
  Timeline,
  message,
} from 'antd';
import {
  SearchOutlined,
  EyeOutlined,
  ExportOutlined,
  SecurityScanOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  UserOutlined,
  EnvironmentOutlined,
} from '@ant-design/icons';
import apiClient from '../../api/index';
import type { AuditTransaction, AuditTrail } from '../../types';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;
const { Search } = Input;

const TransactionAudit: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState<AuditTransaction[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState<AuditTransaction | null>(null);
  const [auditTrail, setAuditTrail] = useState<AuditTrail[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [filters, setFilters] = useState({
    dateRange: null as any,
    status: 'all',
    type: 'all',
    center: 'all',
    searchTerm: '',
  });
  const [auditStats, setAuditStats] = useState({
    totalTransactions: 0,
    flaggedTransactions: 0,
    suspiciousActivities: 0,
    auditScore: 0,
  });

  useEffect(() => {
    fetchTransactions();
    fetchAuditStats();
  }, [filters]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.dateRange) {
        params.append('start_date', filters.dateRange[0].format('YYYY-MM-DD'));
        params.append('end_date', filters.dateRange[1].format('YYYY-MM-DD'));
      }
      if (filters.status !== 'all') params.append('status', filters.status);
      if (filters.type !== 'all') params.append('type', filters.type);
      if (filters.center !== 'all') params.append('center', filters.center);
      if (filters.searchTerm) params.append('search', filters.searchTerm);

      const response = await apiClient.get(`/audit/transactions/?${params.toString()}`);
      setTransactions(response.data?.results || []);
    } catch (error) {
      console.error('Failed to fetch audit transactions:', error);
      message.error('Failed to load audit transactions');
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditStats = async () => {
    try {
      const response = await apiClient.get('/audit/transaction-stats/');
      setAuditStats(response.data || {});
    } catch (error) {
      console.error('Failed to fetch audit stats:', error);
    }
  };

  const fetchAuditTrail = async (transactionId: string) => {
    try {
      const response = await apiClient.get(`/audit/transactions/${transactionId}/trail/`);
      setAuditTrail(response.data || []);
    } catch (error) {
      console.error('Failed to fetch audit trail:', error);
      message.error('Failed to load audit trail');
    }
  };

  const viewTransactionDetails = async (transaction: AuditTransaction) => {
    setSelectedTransaction(transaction);
    await fetchAuditTrail(transaction.id);
    setModalVisible(true);
  };

  const exportAuditReport = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.dateRange) {
        params.append('start_date', filters.dateRange[0].format('YYYY-MM-DD'));
        params.append('end_date', filters.dateRange[1].format('YYYY-MM-DD'));
      }

      const response = await apiClient.get(`/audit/transactions/export/?${params.toString()}`, {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `transaction-audit-${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      message.success('Audit report exported successfully');
    } catch (error) {
      console.error('Failed to export audit report:', error);
      message.error('Failed to export audit report');
    }
  };

  const getRiskLevel = (score: number) => {
    if (score >= 80) return { level: 'High', color: 'red' };
    if (score >= 40) return { level: 'Medium', color: 'orange' };
    return { level: 'Low', color: 'green' };
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'flagged':
        return <WarningOutlined style={{ color: '#faad14' }} />;
      case 'suspicious':
        return <ExclamationCircleOutlined style={{ color: '#f5222d' }} />;
      case 'verified':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      default:
        return <ClockCircleOutlined style={{ color: '#1890ff' }} />;
    }
  };

  const columns = [
    {
      title: 'Transaction ID',
      dataIndex: 'id',
      key: 'id',
      width: 120,
      render: (id: string) => (
        <Text copyable={{ text: id }} className="font-mono text-sm">
          {id.substring(0, 8)}...
        </Text>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag color="blue">{type.replace('_', ' ').toUpperCase()}</Tag>
      ),
    },
    {
      title: 'User',
      dataIndex: 'user',
      key: 'user',
      render: (user: any) => (
        <Space>
          <UserOutlined />
          <Text>{user?.username || 'Unknown'}</Text>
        </Space>
      ),
    },
    {
      title: 'Center',
      dataIndex: 'center',
      key: 'center',
      render: (center: any) => (
        <Space>
          <EnvironmentOutlined />
          <Text>{center?.name || 'N/A'}</Text>
        </Space>
      ),
    },
    {
      title: 'Risk Score',
      dataIndex: 'risk_score',
      key: 'risk_score',
      render: (score: number) => {
        const risk = getRiskLevel(score);
        return (
          <Tag color={risk.color}>
            {risk.level} ({score}%)
          </Tag>
        );
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Space>
          {getStatusIcon(status)}
          <Text>{status.toUpperCase()}</Text>
        </Space>
      ),
    },
    {
      title: 'Timestamp',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: AuditTransaction) => (
        <Space>
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => viewTransactionDetails(record)}
          >
            Details
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <Title level={2} className="mb-0">Transaction Audit</Title>
          <Text type="secondary">Monitor and analyze all system transactions for security and compliance</Text>
        </div>
        <Button
          type="primary"
          icon={<ExportOutlined />}
          onClick={exportAuditReport}
        >
          Export Report
        </Button>
      </div>

      {/* Statistics */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Transactions"
              value={auditStats.totalTransactions}
              prefix={<SecurityScanOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Flagged"
              value={auditStats.flaggedTransactions}
              valueStyle={{ color: '#faad14' }}
              prefix={<WarningOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Suspicious"
              value={auditStats.suspiciousActivities}
              valueStyle={{ color: '#f5222d' }}
              prefix={<ExclamationCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Audit Score"
              value={auditStats.auditScore}
              precision={1}
              suffix="/100"
              valueStyle={{
                color: auditStats.auditScore >= 80 ? '#52c41a' : 
                       auditStats.auditScore >= 60 ? '#faad14' : '#f5222d'
              }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card title="Filters">
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <RangePicker
              style={{ width: '100%' }}
              placeholder={['Start Date', 'End Date']}
              onChange={(dates) => setFilters({ ...filters, dateRange: dates })}
            />
          </Col>
          <Col xs={24} sm={12} lg={4}>
            <Select
              style={{ width: '100%' }}
              placeholder="Status"
              value={filters.status}
              onChange={(status) => setFilters({ ...filters, status })}
            >
              <Option value="all">All Status</Option>
              <Option value="verified">Verified</Option>
              <Option value="flagged">Flagged</Option>
              <Option value="suspicious">Suspicious</Option>
              <Option value="pending">Pending</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} lg={4}>
            <Select
              style={{ width: '100%' }}
              placeholder="Type"
              value={filters.type}
              onChange={(type) => setFilters({ ...filters, type })}
            >
              <Option value="all">All Types</Option>
              <Option value="book_handover">Book Handover</Option>
              <Option value="fuel_distribution">Fuel Distribution</Option>
              <Option value="coupon_issuance">Coupon Issuance</Option>
              <Option value="user_action">User Action</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Search
              placeholder="Search transactions..."
              allowClear
              value={filters.searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilters({ ...filters, searchTerm: e.target.value })}
              onSearch={() => fetchTransactions()}
            />
          </Col>
        </Row>
      </Card>

      {/* Alert for high-risk transactions */}
      {auditStats.suspiciousActivities > 0 && (
        <Alert
          message={`${auditStats.suspiciousActivities} Suspicious Activities Detected`}
          description="Review flagged transactions immediately and take appropriate action."
          type="error"
          showIcon
          action={
            <Button size="small" danger>
              Review Now
            </Button>
          }
        />
      )}

      {/* Transactions Table */}
      <Card title="Transaction Audit Log">
        <Table
          dataSource={transactions}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} transactions`,
          }}
        />
      </Card>

      {/* Transaction Details Modal */}
      <Modal
        title="Transaction Details"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={800}
      >
        {selectedTransaction && (
          <div className="space-y-4">
            <Descriptions title="Transaction Information" bordered column={2}>
              <Descriptions.Item label="Transaction ID" span={2}>
                <Text copyable={{ text: selectedTransaction.id }} className="font-mono">
                  {selectedTransaction.id}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Type">
                {selectedTransaction.type?.replace('_', ' ').toUpperCase()}
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Space>
                  {getStatusIcon(selectedTransaction.status)}
                  {selectedTransaction.status.toUpperCase()}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="Risk Score">
                {(() => {
                  const risk = getRiskLevel(selectedTransaction.risk_score);
                  return (
                    <Tag color={risk.color}>
                      {risk.level} ({selectedTransaction.risk_score}%)
                    </Tag>
                  );
                })()}
              </Descriptions.Item>
              <Descriptions.Item label="User">
                {selectedTransaction.user?.username || 'Unknown'}
              </Descriptions.Item>
              <Descriptions.Item label="Center">
                {selectedTransaction.center?.name || 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Timestamp">
                {new Date(selectedTransaction.created_at).toLocaleString()}
              </Descriptions.Item>
            </Descriptions>

            <Card title="Audit Trail" size="small">
              <Timeline>
                {auditTrail.map((trail, index) => (
                  <Timeline.Item
                    key={index}
                    color={trail.action_type === 'create' ? 'green' : 
                           trail.action_type === 'update' ? 'blue' : 'red'}
                  >
                    <div>
                      <Text strong>{trail.action_type.toUpperCase()}</Text>
                      <br />
                      <Text type="secondary">{trail.description}</Text>
                      <br />
                      <Text type="secondary" className="text-xs">
                        {trail.user} • {new Date(trail.timestamp).toLocaleString()}
                      </Text>
                    </div>
                  </Timeline.Item>
                ))}
              </Timeline>
            </Card>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default TransactionAudit;
