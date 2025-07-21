// src/pages/admin/AuditLogs.tsx
import { useState, useEffect } from 'react';
import type { FC } from 'react';
import { Card, Table, Button, Input, Select, DatePicker, Tag, Space, Typography, Row, Col, message, Spin, Modal } from 'antd';
import { SearchOutlined, DownloadOutlined, EyeOutlined, FilterOutlined, ReloadOutlined } from '@ant-design/icons';
import apiClient from '@/api/apiClient';
import dayjs from 'dayjs';

const { Title } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

interface AuditLog {
  id: string;
  timestamp: string;
  user: {
    id: string;
    username: string;
    first_name: string;
    last_name: string;
    role: string;
  };
  action: string;
  resource_type: string;
  resource_id: string;
  ip_address: string;
  user_agent: string;
  changes: any;
  status: 'success' | 'failed' | 'warning';
  details: string;
}

const AuditLogs: FC = () => {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  
  // Filters
  const [searchText, setSearchText] = useState('');
  const [selectedAction, setSelectedAction] = useState<string>('all');
  const [selectedResource, setSelectedResource] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(7, 'day'),
    dayjs()
  ]);

  // Filter options
  const [users, setUsers] = useState<any[]>([]);
  const [actions, setActions] = useState<string[]>([]);
  const [resources, setResources] = useState<string[]>([]);

  useEffect(() => {
    loadAuditLogs();
    loadFilterOptions();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [logs, searchText, selectedAction, selectedResource, selectedStatus, selectedUser, dateRange]);

  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      
      // Mock audit logs data - replace with actual API call
      const mockLogs: AuditLog[] = [
        {
          id: '1',
          timestamp: dayjs().subtract(1, 'hour').toISOString(),
          user: {
            id: '1',
            username: 'admin',
            first_name: 'John',
            last_name: 'Doe',
            role: 'admin'
          },
          action: 'CREATE',
          resource_type: 'COUPON',
          resource_id: 'COUP-001',
          ip_address: '192.168.1.100',
          user_agent: 'Mozilla/5.0...',
          changes: { status: 'active', allocated_to: 'beneficiary_123' },
          status: 'success',
          details: 'Created new fuel coupon for beneficiary'
        },
        {
          id: '2',
          timestamp: dayjs().subtract(2, 'hour').toISOString(),
          user: {
            id: '2',
            username: 'officer_1',
            first_name: 'Jane',
            last_name: 'Smith',
            role: 'main_center_officer'
          },
          action: 'UPDATE',
          resource_type: 'FUEL_PRICE',
          resource_id: 'PRICE-PETROL',
          ip_address: '192.168.1.101',
          user_agent: 'Mozilla/5.0...',
          changes: { old_price: 1.75, new_price: 1.80 },
          status: 'success',
          details: 'Updated petrol price'
        },
        {
          id: '3',
          timestamp: dayjs().subtract(3, 'hour').toISOString(),
          user: {
            id: '3',
            username: 'sub_officer',
            first_name: 'Mike',
            last_name: 'Johnson',
            role: 'subcenter_officer'
          },
          action: 'DELETE',
          resource_type: 'BOX',
          resource_id: 'BOX-001',
          ip_address: '192.168.1.102',
          user_agent: 'Mozilla/5.0...',
          changes: { status: 'deleted' },
          status: 'failed',
          details: 'Failed to delete box - contains active books'
        },
        {
          id: '4',
          timestamp: dayjs().subtract(4, 'hour').toISOString(),
          user: {
            id: '1',
            username: 'admin',
            first_name: 'John',
            last_name: 'Doe',
            role: 'admin'
          },
          action: 'LOGIN',
          resource_type: 'USER_SESSION',
          resource_id: 'SESSION-001',
          ip_address: '192.168.1.100',
          user_agent: 'Mozilla/5.0...',
          changes: { login_time: dayjs().subtract(4, 'hour').toISOString() },
          status: 'success',
          details: 'User logged in successfully'
        },
        {
          id: '5',
          timestamp: dayjs().subtract(5, 'hour').toISOString(),
          user: {
            id: '4',
            username: 'beneficiary_1',
            first_name: 'Alice',
            last_name: 'Brown',
            role: 'beneficiary'
          },
          action: 'VIEW',
          resource_type: 'HANDOVER',
          resource_id: 'HAND-001',
          ip_address: '192.168.1.103',
          user_agent: 'Mozilla/5.0...',
          changes: {},
          status: 'warning',
          details: 'Attempted to view restricted handover details'
        }
      ];

      // Simulate API delay
      setTimeout(() => {
        setLogs(mockLogs);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error loading audit logs:', error);
      message.error('Failed to load audit logs');
      setLoading(false);
    }
  };

  const loadFilterOptions = async () => {
    try {
      // Extract unique values for filters
      const uniqueActions = ['LOGIN', 'LOGOUT', 'CREATE', 'UPDATE', 'DELETE', 'VIEW', 'EXPORT'];
      const uniqueResources = ['USER', 'COUPON', 'BOX', 'BOOK', 'HANDOVER', 'FUEL_PRICE', 'USER_SESSION'];
      
      // Mock users data
      const mockUsers = [
        { id: '1', username: 'admin', first_name: 'John', last_name: 'Doe' },
        { id: '2', username: 'officer_1', first_name: 'Jane', last_name: 'Smith' },
        { id: '3', username: 'sub_officer', first_name: 'Mike', last_name: 'Johnson' },
        { id: '4', username: 'beneficiary_1', first_name: 'Alice', last_name: 'Brown' }
      ];

      setActions(uniqueActions);
      setResources(uniqueResources);
      setUsers(mockUsers);
    } catch (error) {
      console.error('Error loading filter options:', error);
    }
  };

  const applyFilters = () => {
    let filtered = logs;

    // Search filter
    if (searchText) {
      filtered = filtered.filter(log =>
        log.user.username.toLowerCase().includes(searchText.toLowerCase()) ||
        log.user.first_name.toLowerCase().includes(searchText.toLowerCase()) ||
        log.user.last_name.toLowerCase().includes(searchText.toLowerCase()) ||
        log.action.toLowerCase().includes(searchText.toLowerCase()) ||
        log.resource_type.toLowerCase().includes(searchText.toLowerCase()) ||
        log.details.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    // Action filter
    if (selectedAction !== 'all') {
      filtered = filtered.filter(log => log.action === selectedAction);
    }

    // Resource filter
    if (selectedResource !== 'all') {
      filtered = filtered.filter(log => log.resource_type === selectedResource);
    }

    // Status filter
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(log => log.status === selectedStatus);
    }

    // User filter
    if (selectedUser !== 'all') {
      filtered = filtered.filter(log => log.user.id === selectedUser);
    }

    // Date range filter
    filtered = filtered.filter(log => {
      const logDate = dayjs(log.timestamp);
      return logDate.isAfter(dateRange[0].startOf('day')) && logDate.isBefore(dateRange[1].endOf('day'));
    });

    setFilteredLogs(filtered);
  };

  const clearFilters = () => {
    setSearchText('');
    setSelectedAction('all');
    setSelectedResource('all');
    setSelectedStatus('all');
    setSelectedUser('all');
    setDateRange([dayjs().subtract(7, 'day'), dayjs()]);
  };

  const exportLogs = () => {
    // Mock export functionality
    message.success('Audit logs exported successfully');
  };

  const showLogDetails = (log: AuditLog) => {
    setSelectedLog(log);
    setDetailModalVisible(true);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'success': 'green',
      'failed': 'red',
      'warning': 'orange'
    };
    return colors[status] || 'default';
  };

  const getActionColor = (action: string) => {
    const colors: Record<string, string> = {
      'CREATE': 'green',
      'UPDATE': 'blue',
      'DELETE': 'red',
      'VIEW': 'cyan',
      'LOGIN': 'purple',
      'LOGOUT': 'gray',
      'EXPORT': 'orange'
    };
    return colors[action] || 'default';
  };

  const columns = [
    {
      title: 'Timestamp',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 150,
      render: (timestamp: string) => (
        <div>
          <div>{dayjs(timestamp).format('DD/MM/YYYY')}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {dayjs(timestamp).format('HH:mm:ss')}
          </div>
        </div>
      ),
      sorter: (a: AuditLog, b: AuditLog) => dayjs(a.timestamp).unix() - dayjs(b.timestamp).unix()
    },
    {
      title: 'User',
      key: 'user',
      width: 150,
      render: (_: any, record: AuditLog) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>
            {record.user.first_name} {record.user.last_name}
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            @{record.user.username} ({record.user.role})
          </div>
        </div>
      )
    },
    {
      title: 'Action',
      dataIndex: 'action',
      key: 'action',
      width: 100,
      render: (action: string) => (
        <Tag color={getActionColor(action)}>
          {action}
        </Tag>
      ),
      filters: actions.map(action => ({ text: action, value: action })),
      onFilter: (value: any, record: AuditLog) => record.action === value
    },
    {
      title: 'Resource',
      key: 'resource',
      width: 120,
      render: (_: any, record: AuditLog) => (
        <div>
          <div>{record.resource_type}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {record.resource_id}
          </div>
        </div>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>
          {status.toUpperCase()}
        </Tag>
      ),
      filters: [
        { text: 'Success', value: 'success' },
        { text: 'Failed', value: 'failed' },
        { text: 'Warning', value: 'warning' }
      ],
      onFilter: (value: any, record: AuditLog) => record.status === value
    },
    {
      title: 'IP Address',
      dataIndex: 'ip_address',
      key: 'ip_address',
      width: 120
    },
    {
      title: 'Details',
      dataIndex: 'details',
      key: 'details',
      ellipsis: true
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      render: (_: any, record: AuditLog) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => showLogDetails(record)}
        >
          View
        </Button>
      )
    }
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <p>Loading audit logs...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', fontFamily: 'Rockwell, serif' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ fontFamily: 'Rockwell, serif', fontSize: '18px', margin: 0 }}>
          Audit Logs
        </Title>
        <p style={{ color: '#666', margin: '8px 0 0 0', fontSize: '16px' }}>
          Track and monitor all system activities and user actions
        </p>
      </div>

      {/* Filters */}
      <Card style={{ marginBottom: '16px' }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={6}>
            <Input
              placeholder="Search logs..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Select
              style={{ width: '100%' }}
              placeholder="Action"
              value={selectedAction}
              onChange={setSelectedAction}
            >
              <Option value="all">All Actions</Option>
              {actions.map(action => (
                <Option key={action} value={action}>{action}</Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Select
              style={{ width: '100%' }}
              placeholder="Resource"
              value={selectedResource}
              onChange={setSelectedResource}
            >
              <Option value="all">All Resources</Option>
              {resources.map(resource => (
                <Option key={resource} value={resource}>{resource}</Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Select
              style={{ width: '100%' }}
              placeholder="Status"
              value={selectedStatus}
              onChange={setSelectedStatus}
            >
              <Option value="all">All Status</Option>
              <Option value="success">Success</Option>
              <Option value="failed">Failed</Option>
              <Option value="warning">Warning</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <RangePicker
              style={{ width: '100%' }}
              value={dateRange}
              onChange={(dates) => dates && setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs])}
            />
          </Col>
        </Row>
        <Row gutter={[16, 16]} style={{ marginTop: '16px' }} align="middle">
          <Col xs={24} sm={12} md={6}>
            <Select
              style={{ width: '100%' }}
              placeholder="User"
              value={selectedUser}
              onChange={setSelectedUser}
              showSearch
            >
              <Option value="all">All Users</Option>
              {users.map(user => (
                <Option key={user.id} value={user.id}>
                  {user.first_name} {user.last_name} (@{user.username})
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={18}>
            <Space>
              <Button icon={<FilterOutlined />} onClick={clearFilters}>
                Clear Filters
              </Button>
              <Button icon={<ReloadOutlined />} onClick={loadAuditLogs}>
                Refresh
              </Button>
              <Button type="primary" icon={<DownloadOutlined />} onClick={exportLogs}>
                Export
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Audit Logs Table */}
      <Card>
        <div style={{ marginBottom: '16px' }}>
          <Title level={4} style={{ fontFamily: 'Rockwell, serif', fontSize: '16px', margin: 0 }}>
            Audit Log Entries ({filteredLogs.length} records)
          </Title>
        </div>

        <Table
          columns={columns}
          dataSource={filteredLogs}
          rowKey="id"
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} entries`
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* Log Detail Modal */}
      <Modal
        title="Audit Log Details"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            Close
          </Button>
        ]}
        width={600}
      >
        {selectedLog && (
          <div style={{ fontFamily: 'Rockwell, serif' }}>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <strong>Timestamp:</strong><br />
                {dayjs(selectedLog.timestamp).format('DD/MM/YYYY HH:mm:ss')}
              </Col>
              <Col span={12}>
                <strong>User:</strong><br />
                {selectedLog.user.first_name} {selectedLog.user.last_name} (@{selectedLog.user.username})
              </Col>
              <Col span={12}>
                <strong>Action:</strong><br />
                <Tag color={getActionColor(selectedLog.action)}>{selectedLog.action}</Tag>
              </Col>
              <Col span={12}>
                <strong>Status:</strong><br />
                <Tag color={getStatusColor(selectedLog.status)}>{selectedLog.status.toUpperCase()}</Tag>
              </Col>
              <Col span={12}>
                <strong>Resource Type:</strong><br />
                {selectedLog.resource_type}
              </Col>
              <Col span={12}>
                <strong>Resource ID:</strong><br />
                {selectedLog.resource_id}
              </Col>
              <Col span={12}>
                <strong>IP Address:</strong><br />
                {selectedLog.ip_address}
              </Col>
              <Col span={12}>
                <strong>User Agent:</strong><br />
                <span style={{ fontSize: '12px', wordBreak: 'break-all' }}>
                  {selectedLog.user_agent}
                </span>
              </Col>
              <Col span={24}>
                <strong>Details:</strong><br />
                {selectedLog.details}
              </Col>
              {Object.keys(selectedLog.changes).length > 0 && (
                <Col span={24}>
                  <strong>Changes:</strong><br />
                  <pre style={{ 
                    background: '#f5f5f5', 
                    padding: '8px', 
                    borderRadius: '4px',
                    fontSize: '12px',
                    overflow: 'auto'
                  }}>
                    {JSON.stringify(selectedLog.changes, null, 2)}
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

export default AuditLogs;
