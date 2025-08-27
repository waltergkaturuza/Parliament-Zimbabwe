// src/pages/audit/TransactionAudit.tsx
import { useState, useEffect } from 'react';
import type { FC } from 'react';
import {
  Card,
  Table,
  Button,
  Input,
  Select,
  DatePicker,
  Space,
  Typography,
  Row,
  Col,
  Statistic,
  Tag,
  Alert,
  Spin,
  message,
  Modal,
  Badge,
  Tooltip,
} from 'antd';
import {
  SearchOutlined,
  FilterOutlined,
  ExportOutlined,
  EyeOutlined,
  AlertOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  ShieldOutlined,
} from '@ant-design/icons';
import { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { auditAPI } from '../../api/audit';
import type { AuditTransaction } from '../../types/audit';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const TransactionAudit: FC = () => {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<AuditTransaction[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState<AuditTransaction | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  
  // Filters
  const [searchText, setSearchText] = useState('');
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedRiskLevel, setSelectedRiskLevel] = useState<string>('');
  const [dateRange, setDateRange] = useState<any[]>([]);

  // Statistics
  const [stats, setStats] = useState({
    total: 0,
    verified: 0,
    flagged: 0,
    suspicious: 0,
    pending: 0,
    highRisk: 0,
  });

  useEffect(() => {
    fetchTransactions();
    fetchStats();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await auditAPI.getTransactions({
        search: searchText,
        user: selectedUser || undefined,
        status: selectedStatus || undefined,
        start_date: dateRange[0] ? dayjs(dateRange[0]).format('YYYY-MM-DD') : undefined,
        end_date: dateRange[1] ? dayjs(dateRange[1]).format('YYYY-MM-DD') : undefined,
      });
      
      setTransactions(response.results || []);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
      message.error('Failed to load audit transactions');
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await auditAPI.getTransactionStats();
      setStats(response);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTransactions();
    }, 500);

    return () => clearTimeout(timer);
  }, [searchText, selectedUser, selectedStatus, selectedRiskLevel, dateRange]);

  const handleViewDetails = (transaction: AuditTransaction) => {
    setSelectedTransaction(transaction);
    setDetailModalVisible(true);
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    message.info('Export functionality will be implemented');
  };

  const getRiskColor = (riskScore: number) => {
    if (riskScore >= 80) return '#ff4d4f';
    if (riskScore >= 60) return '#fa8c16';
    if (riskScore >= 40) return '#fadb14';
    return '#52c41a';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'green';
      case 'flagged': return 'red';
      case 'suspicious': return 'orange';
      case 'pending': return 'blue';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified': return <CheckCircleOutlined />;
      case 'flagged': return <AlertOutlined />;
      case 'suspicious': return <WarningOutlined />;
      case 'pending': return <ClockCircleOutlined />;
      default: return null;
    }
  };

  const columns: ColumnsType<AuditTransaction> = [
    {
      title: 'Transaction ID',
      dataIndex: 'id',
      key: 'id',
      width: 120,
      render: (id: string) => (
        <Text code>{id.slice(0, 8)}...</Text>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type: string) => (
        <Tag color="blue">{type.toUpperCase()}</Tag>
      ),
    },
    {
      title: 'User',
      key: 'user',
      width: 150,
      render: (_, record) => (
        <div>
          {record.user ? (
            <>
              <div style={{ fontWeight: 'bold' }}>
                {record.user.first_name} {record.user.last_name}
              </div>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                @{record.user.username}
              </Text>
            </>
          ) : (
            <Text type="secondary">System</Text>
          )}
        </div>
      ),
    },
    {
      title: 'Center',
      key: 'center',
      width: 120,
      render: (_, record) => (
        record.center ? (
          <div>
            <div style={{ fontWeight: 'bold' }}>{record.center.name}</div>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.center.code}
            </Text>
          </div>
        ) : (
          <Text type="secondary">-</Text>
        )
      ),
    },
    {
      title: 'Risk Score',
      dataIndex: 'risk_score',
      key: 'risk_score',
      width: 100,
      render: (score: number) => (
        <div style={{ textAlign: 'center' }}>
          <Badge
            count={score}
            style={{ 
              backgroundColor: getRiskColor(score),
              color: '#fff'
            }}
          />
        </div>
      ),
      sorter: (a, b) => a.risk_score - b.risk_score,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => (
        <Tag color={getStatusColor(status)} icon={getStatusIcon(status)}>
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Created',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 140,
      render: (date: string) => (
        <div>
          <div>{dayjs(date).format('MMM DD, YYYY')}</div>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {dayjs(date).format('HH:mm:ss')}
          </Text>
        </div>
      ),
      sorter: (a, b) => dayjs(a.created_at).unix() - dayjs(b.created_at).unix(),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      render: (_, record) => (
        <Space>
          <Tooltip title="View Details">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => handleViewDetails(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>Loading transaction audit data...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', fontFamily: 'Rockwell, serif' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ fontFamily: 'Rockwell, serif', fontSize: '18px', margin: 0 }}>
          <ShieldOutlined /> Transaction Audit
        </Title>
        <p style={{ color: '#666', margin: '8px 0 0 0', fontSize: '16px' }}>
          Monitor and analyze all system transactions for security and compliance
        </p>
      </div>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={4}>
          <Card size="small">
            <Statistic
              title="Total Transactions"
              value={stats.total}
              prefix={<AlertOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={4}>
          <Card size="small">
            <Statistic
              title="Verified"
              value={stats.verified}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={4}>
          <Card size="small">
            <Statistic
              title="Flagged"
              value={stats.flagged}
              prefix={<AlertOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={4}>
          <Card size="small">
            <Statistic
              title="Suspicious"
              value={stats.suspicious}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={4}>
          <Card size="small">
            <Statistic
              title="Pending"
              value={stats.pending}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={4}>
          <Card size="small">
            <Statistic
              title="High Risk"
              value={stats.highRisk}
              prefix={<AlertOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card style={{ marginBottom: '16px' }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={6}>
            <Input
              placeholder="Search transactions..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Select
              style={{ width: '100%' }}
              placeholder="Status"
              value={selectedStatus}
              onChange={setSelectedStatus}
              allowClear
            >
              <Option value="verified">Verified</Option>
              <Option value="flagged">Flagged</Option>
              <Option value="suspicious">Suspicious</Option>
              <Option value="pending">Pending</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Select
              style={{ width: '100%' }}
              placeholder="Risk Level"
              value={selectedRiskLevel}
              onChange={setSelectedRiskLevel}
              allowClear
            >
              <Option value="high">High (80+)</Option>
              <Option value="medium">Medium (40-79)</Option>
              <Option value="low">Low (0-39)</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <RangePicker
              style={{ width: '100%' }}
              value={dateRange}
              onChange={setDateRange}
              format="DD/MM/YYYY"
            />
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Space>
              <Button
                icon={<FilterOutlined />}
                onClick={fetchTransactions}
              >
                Filter
              </Button>
              <Button
                icon={<ExportOutlined />}
                onClick={handleExport}
              >
                Export
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* High Risk Alert */}
      {stats.highRisk > 0 && (
        <Alert
          message={`${stats.highRisk} high-risk transactions detected`}
          description="Review these transactions immediately for potential security issues."
          type="warning"
          showIcon
          closable
          style={{ marginBottom: '16px' }}
        />
      )}

      {/* Transactions Table */}
      <Card
        title={`Transaction Audit (${transactions.length} transactions)`}
        extra={
          <Space>
            <Button icon={<ExportOutlined />} onClick={handleExport}>
              Export Data
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={transactions}
          rowKey="id"
          loading={loading}
          pagination={{
            total: transactions.length,
            pageSize: 20,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} transactions`,
          }}
          scroll={{ x: 1000 }}
        />
      </Card>

      {/* Transaction Detail Modal */}
      <Modal
        title="Transaction Details"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            Close
          </Button>,
        ]}
        width={800}
      >
        {selectedTransaction && (
          <div>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Text strong>Transaction ID:</Text>
                <br />
                <Text code>{selectedTransaction.id}</Text>
              </Col>
              <Col span={12}>
                <Text strong>Type:</Text>
                <br />
                <Tag color="blue">{selectedTransaction.type}</Tag>
              </Col>
              <Col span={12}>
                <Text strong>Risk Score:</Text>
                <br />
                <Badge
                  count={selectedTransaction.risk_score}
                  style={{ 
                    backgroundColor: getRiskColor(selectedTransaction.risk_score),
                    color: '#fff'
                  }}
                />
              </Col>
              <Col span={12}>
                <Text strong>Status:</Text>
                <br />
                <Tag color={getStatusColor(selectedTransaction.status)} icon={getStatusIcon(selectedTransaction.status)}>
                  {selectedTransaction.status.toUpperCase()}
                </Tag>
              </Col>
              <Col span={24}>
                <Text strong>User:</Text>
                <br />
                <Text>
                  {selectedTransaction.user 
                    ? `${selectedTransaction.user.first_name} ${selectedTransaction.user.last_name} (@${selectedTransaction.user.username})`
                    : 'System'
                  }
                </Text>
              </Col>
              <Col span={24}>
                <Text strong>Center:</Text>
                <br />
                <Text>
                  {selectedTransaction.center 
                    ? `${selectedTransaction.center.name} (${selectedTransaction.center.code})`
                    : 'N/A'
                  }
                </Text>
              </Col>
              <Col span={24}>
                <Text strong>Created:</Text>
                <br />
                <Text>{dayjs(selectedTransaction.created_at).format('MMMM DD, YYYY HH:mm:ss')}</Text>
              </Col>
              {selectedTransaction.details && (
                <Col span={24}>
                  <Text strong>Details:</Text>
                  <pre style={{ 
                    background: '#f5f5f5', 
                    padding: '12px', 
                    borderRadius: '4px',
                    marginTop: '8px',
                    fontSize: '12px',
                    overflow: 'auto'
                  }}>
                    {JSON.stringify(selectedTransaction.details, null, 2)}
                  </pre>
                </Col>
              )}
            </Row>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default TransactionAudit;