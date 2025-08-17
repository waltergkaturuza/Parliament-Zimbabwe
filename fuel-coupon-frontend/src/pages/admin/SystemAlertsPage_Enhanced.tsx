// src/pages/admin/SystemAlertsPage.tsx - Enhanced with comprehensive functionality
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/api';
import {
  Table,
  Card,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  message,
  Typography,
  Row,
  Col,
  Statistic,
  Alert,
  Drawer,
  Descriptions,
  Badge,
  Timeline,
  Empty,
  Tooltip,
  Switch,
  Divider,
  Popconfirm,
  Checkbox
} from 'antd';
import {
  BellOutlined,
  ExclamationCircleOutlined,
  WarningOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  PlusOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  FilterOutlined,
  CloseCircleOutlined,
  SecurityScanOutlined,
  SettingOutlined,
  FileSearchOutlined
} from '@ant-design/icons';
import { motion } from 'framer-motion';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

interface SystemAlert {
  id: number;
  title: string;
  message: string;
  alert_type: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL' | 'SECURITY';
  status: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED' | 'DISMISSED';
  priority: 1 | 2 | 3 | 4; // Low, Medium, High, Critical
  target_roles?: string[] | null;
  expires_at?: string | null;
  is_dismissible: boolean;
  created: string;
  modified: string;
  created_by?: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
  };
  acknowledged_by?: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
  };
  acknowledged_at?: string;
  created_by_details?: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
  };
}

interface AlertStats {
  total_alerts: number;
  active_alerts: number;
  resolved_alerts: number;
  dismissed_alerts: number;
  acknowledged_alerts: number;
  expired_alerts: number;
  alerts_by_type: Record<string, number>;
  alerts_by_priority: Record<string, number>;
  recent_activity: {
    alerts_last_7_days: number;
    critical_alerts_last_7_days: number;
  };
  urgency_indicators: {
    active_critical: number;
    active_high: number;
    requires_attention: number;
  };
}

const SystemAlertsPage: React.FC = () => {
  // State management
  const [selectedType, setSelectedType] = useState<string | undefined>();
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>();
  const [selectedPriority, setSelectedPriority] = useState<string | undefined>();
  const [searchText, setSearchText] = useState<string>('');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [editingAlert, setEditingAlert] = useState<SystemAlert | null>(null);
  const [viewingAlert, setViewingAlert] = useState<SystemAlert | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [showExpired, setShowExpired] = useState(false);
  
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  // Alert type configuration
  const alertTypeConfig = {
    INFO: { color: '#1890ff', icon: <InfoCircleOutlined />, label: 'Information' },
    WARNING: { color: '#faad14', icon: <WarningOutlined />, label: 'Warning' },
    ERROR: { color: '#ff7875', icon: <ExclamationCircleOutlined />, label: 'Error' },
    CRITICAL: { color: '#ff4d4f', icon: <ExclamationCircleOutlined />, label: 'Critical' },
    SECURITY: { color: '#722ed1', icon: <SecurityScanOutlined />, label: 'Security' }
  };

  // Priority configuration (matching backend numeric values)
  const priorityConfig = {
    1: { color: '#52c41a', label: 'Low' },
    2: { color: '#1890ff', label: 'Medium' },
    3: { color: '#faad14', label: 'High' },
    4: { color: '#ff4d4f', label: 'Critical' }
  };

  // Status configuration
  const statusConfig = {
    ACTIVE: { color: '#1890ff', label: 'Active' },
    ACKNOWLEDGED: { color: '#faad14', label: 'Acknowledged' },
    RESOLVED: { color: '#52c41a', label: 'Resolved' },
    DISMISSED: { color: '#8c8c8c', label: 'Dismissed' }
  };

  // Fetch alerts data
  const { data: alertsData, isLoading, refetch } = useQuery({
    queryKey: [
      'system-alerts',
      selectedType,
      selectedStatus,
      selectedPriority,
      searchText,
      dateRange?.[0]?.format('YYYY-MM-DD'),
      dateRange?.[1]?.format('YYYY-MM-DD'),
      showExpired
    ],
    queryFn: async () => {
      try {
        const params: Record<string, any> = {};
        
        if (selectedType) params.alert_type = selectedType;
        if (selectedStatus) params.status = selectedStatus;
        if (selectedPriority) params.priority = selectedPriority;
        if (searchText) params.search = searchText;
        if (dateRange?.[0]) params.start_date = dateRange[0].format('YYYY-MM-DD');
        if (dateRange?.[1]) params.end_date = dateRange[1].format('YYYY-MM-DD');
        if (showExpired) params.show_expired = 'true';

        const response = await apiClient.get('/system-alerts/', { params });
        return response.data;
      } catch (error) {
        console.error('Error fetching alerts:', error);
        message.error('Failed to fetch alerts');
        return [];
      }
    }
  });

  // Fetch alert statistics
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['system-alerts-stats'],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/system-alerts/stats/');
        return response.data as AlertStats;
      } catch (error) {
        console.error('Error fetching alert stats:', error);
        return {
          total_alerts: 0,
          active_alerts: 0,
          resolved_alerts: 0,
          dismissed_alerts: 0,
          acknowledged_alerts: 0,
          expired_alerts: 0,
          alerts_by_type: {},
          alerts_by_priority: {},
          recent_activity: {
            alerts_last_7_days: 0,
            critical_alerts_last_7_days: 0,
          },
          urgency_indicators: {
            active_critical: 0,
            active_high: 0,
            requires_attention: 0,
          }
        } as AlertStats;
      }
    }
  });

  // Mutation for creating alerts
  const createAlertMutation = useMutation({
    mutationFn: async (alertData: any) => {
      const response = await apiClient.post('/system-alerts/create_system_alert/', alertData);
      return response.data;
    },
    onSuccess: () => {
      message.success('Alert created successfully');
      setIsModalVisible(false);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ['system-alerts'] });
      queryClient.invalidateQueries({ queryKey: ['system-alerts-stats'] });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Failed to create alert');
    }
  });

  // Mutation for updating alerts
  const updateAlertMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await apiClient.put(`/system-alerts/${id}/`, data);
      return response.data;
    },
    onSuccess: () => {
      message.success('Alert updated successfully');
      setIsModalVisible(false);
      form.resetFields();
      setEditingAlert(null);
      queryClient.invalidateQueries({ queryKey: ['system-alerts'] });
      queryClient.invalidateQueries({ queryKey: ['system-alerts-stats'] });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Failed to update alert');
    }
  });

  // Action mutations
  const acknowledgeAlertMutation = useMutation({
    mutationFn: async (alertId: number) => {
      const response = await apiClient.post(`/system-alerts/${alertId}/acknowledge/`);
      return response.data;
    },
    onSuccess: () => {
      message.success('Alert acknowledged successfully');
      queryClient.invalidateQueries({ queryKey: ['system-alerts'] });
      queryClient.invalidateQueries({ queryKey: ['system-alerts-stats'] });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error || 'Failed to acknowledge alert');
    }
  });

  const resolveAlertMutation = useMutation({
    mutationFn: async (alertId: number) => {
      const response = await apiClient.post(`/system-alerts/${alertId}/resolve/`);
      return response.data;
    },
    onSuccess: () => {
      message.success('Alert resolved successfully');
      queryClient.invalidateQueries({ queryKey: ['system-alerts'] });
      queryClient.invalidateQueries({ queryKey: ['system-alerts-stats'] });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error || 'Failed to resolve alert');
    }
  });

  const dismissAlertMutation = useMutation({
    mutationFn: async (alertId: number) => {
      const response = await apiClient.post(`/system-alerts/${alertId}/dismiss/`);
      return response.data;
    },
    onSuccess: () => {
      message.success('Alert dismissed successfully');
      queryClient.invalidateQueries({ queryKey: ['system-alerts'] });
      queryClient.invalidateQueries({ queryKey: ['system-alerts-stats'] });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error || 'Failed to dismiss alert');
    }
  });

  const bulkResolveAlertsMutation = useMutation({
    mutationFn: async (alertIds: number[]) => {
      const response = await apiClient.post('/system-alerts/bulk_resolve/', { alert_ids: alertIds });
      return response.data;
    },
    onSuccess: (data) => {
      message.success(data.message || 'Alerts resolved successfully');
      setSelectedRowKeys([]);
      queryClient.invalidateQueries({ queryKey: ['system-alerts'] });
      queryClient.invalidateQueries({ queryKey: ['system-alerts-stats'] });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error || 'Failed to resolve alerts');
    }
  });

  // Event handlers
  const openCreateModal = () => {
    setEditingAlert(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const openEditModal = (alert: SystemAlert) => {
    setEditingAlert(alert);
    form.setFieldsValue({
      title: alert.title,
      message: alert.message,
      alert_type: alert.alert_type,
      priority: alert.priority,
      target_roles: alert.target_roles,
      expires_at: alert.expires_at ? dayjs(alert.expires_at) : null,
      is_dismissible: alert.is_dismissible
    });
    setIsModalVisible(true);
  };

  const openViewDrawer = (alert: SystemAlert) => {
    setViewingAlert(alert);
    setIsDrawerVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      if (editingAlert) {
        updateAlertMutation.mutate({ id: editingAlert.id, data: values });
      } else {
        createAlertMutation.mutate(values);
      }
    } catch (error) {
      console.error('Form validation failed:', error);
    }
  };

  const handleBulkResolve = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('Please select alerts to resolve');
      return;
    }
    bulkResolveAlertsMutation.mutate(selectedRowKeys as number[]);
  };

  const clearFilters = () => {
    setSelectedType(undefined);
    setSelectedStatus(undefined);
    setSelectedPriority(undefined);
    setSearchText('');
    setDateRange(null);
    setShowExpired(false);
  };

  // Table columns
  const columns: ColumnsType<SystemAlert> = [
    {
      title: 'Type',
      dataIndex: 'alert_type',
      key: 'alert_type',
      width: 100,
      filters: Object.entries(alertTypeConfig).map(([key, config]) => ({
        text: config.label,
        value: key
      })),
      onFilter: (value, record) => record.alert_type === value,
      render: (alertType: keyof typeof alertTypeConfig) => (
        <Space>
          <span style={{ color: alertTypeConfig[alertType].color }}>
            {alertTypeConfig[alertType].icon}
          </span>
          <Tag color={alertTypeConfig[alertType].color}>
            {alertTypeConfig[alertType].label}
          </Tag>
        </Space>
      )
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      sorter: (a, b) => a.title.localeCompare(b.title),
      render: (text) => <Text strong>{text}</Text>
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
      filters: Object.entries(priorityConfig).map(([key, config]) => ({
        text: config.label,
        value: parseInt(key)
      })),
      onFilter: (value, record) => record.priority === value,
      render: (priority: keyof typeof priorityConfig) => (
        <Tag color={priorityConfig[priority].color}>
          {priorityConfig[priority].label}
        </Tag>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      filters: Object.entries(statusConfig).map(([key, config]) => ({
        text: config.label,
        value: key
      })),
      onFilter: (value, record) => record.status === value,
      render: (status: keyof typeof statusConfig) => (
        <Badge
          status={status === 'ACTIVE' ? 'processing' : status === 'RESOLVED' ? 'success' : 'default'}
          text={statusConfig[status].label}
        />
      )
    },
    {
      title: 'Created',
      dataIndex: 'created',
      key: 'created',
      width: 120,
      sorter: (a, b) => dayjs(a.created).unix() - dayjs(b.created).unix(),
      render: (created) => (
        <Tooltip title={dayjs(created).format('MMMM DD, YYYY HH:mm:ss')}>
          {dayjs(created).format('MMM DD, YYYY')}
        </Tooltip>
      )
    },
    {
      title: 'Expires',
      dataIndex: 'expires_at',
      key: 'expires_at',
      width: 120,
      render: (expiresAt) => {
        if (!expiresAt) return <Text type="secondary">Never</Text>;
        const isExpired = dayjs().isAfter(dayjs(expiresAt));
        return (
          <Tooltip title={dayjs(expiresAt).format('MMMM DD, YYYY HH:mm:ss')}>
            <Text type={isExpired ? 'danger' : 'secondary'}>
              {dayjs(expiresAt).format('MMM DD, YYYY')}
            </Text>
          </Tooltip>
        );
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 200,
      render: (_, record) => (
        <Space>
          <Tooltip title="View Details">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => openViewDrawer(record)}
              size="small"
            />
          </Tooltip>
          <Tooltip title="Edit">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => openEditModal(record)}
              size="small"
            />
          </Tooltip>
          {record.status === 'ACTIVE' && (
            <>
              <Tooltip title="Acknowledge">
                <Button
                  type="text"
                  icon={<CheckCircleOutlined />}
                  onClick={() => acknowledgeAlertMutation.mutate(record.id)}
                  size="small"
                  style={{ color: '#faad14' }}
                />
              </Tooltip>
              <Tooltip title="Resolve">
                <Button
                  type="text"
                  icon={<CheckCircleOutlined />}
                  onClick={() => resolveAlertMutation.mutate(record.id)}
                  size="small"
                  style={{ color: '#52c41a' }}
                />
              </Tooltip>
            </>
          )}
          {record.is_dismissible && record.status !== 'DISMISSED' && (
            <Tooltip title="Dismiss">
              <Button
                type="text"
                icon={<CloseCircleOutlined />}
                onClick={() => dismissAlertMutation.mutate(record.id)}
                size="small"
                style={{ color: '#ff4d4f' }}
              />
            </Tooltip>
          )}
        </Space>
      )
    }
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (selectedKeys: React.Key[]) => {
      setSelectedRowKeys(selectedKeys);
    },
    getCheckboxProps: (record: SystemAlert) => ({
      disabled: record.status === 'RESOLVED' || record.status === 'DISMISSED',
    }),
  };

  return (
    <div style={{ padding: '24px' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div style={{ marginBottom: '24px' }}>
          <Title level={2}>
            <BellOutlined style={{ marginRight: '12px', color: '#1890ff' }} />
            System Alerts Management
          </Title>
          <Text type="secondary">
            Monitor and manage system alerts, notifications, and warnings
          </Text>
        </div>

        {/* Statistics Cards */}
        <Row gutter={16} style={{ marginBottom: '24px' }}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Total Alerts"
                value={stats?.total_alerts || 0}
                prefix={<BellOutlined />}
                loading={statsLoading}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Active Alerts"
                value={stats?.active_alerts || 0}
                prefix={<ExclamationCircleOutlined />}
                valueStyle={{ color: '#1890ff' }}
                loading={statsLoading}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Critical Alerts"
                value={stats?.urgency_indicators?.active_critical || 0}
                prefix={<WarningOutlined />}
                valueStyle={{ color: '#ff4d4f' }}
                loading={statsLoading}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Requires Attention"
                value={stats?.urgency_indicators?.requires_attention || 0}
                prefix={<ExclamationCircleOutlined />}
                valueStyle={{ color: '#faad14' }}
                loading={statsLoading}
              />
            </Card>
          </Col>
        </Row>

        {/* Urgency Alert */}
        {(stats?.urgency_indicators?.active_critical || 0) > 0 && (
          <Alert
            message={`${stats?.urgency_indicators?.active_critical || 0} critical alerts require immediate attention`}
            type="error"
            showIcon
            style={{ marginBottom: '16px' }}
            action={
              <Button size="small" danger>
                View Critical
              </Button>
            }
          />
        )}

        {/* Filters */}
        <Card style={{ marginBottom: '24px' }}>
          <Row gutter={16} align="middle">
            <Col xs={24} sm={6}>
              <Input.Search
                placeholder="Search alerts..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ width: '100%' }}
              />
            </Col>
            <Col xs={24} sm={4}>
              <Select
                placeholder="Type"
                value={selectedType}
                onChange={setSelectedType}
                allowClear
                style={{ width: '100%' }}
              >
                {Object.entries(alertTypeConfig).map(([key, config]) => (
                  <Option key={key} value={key}>
                    {config.icon} {config.label}
                  </Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} sm={4}>
              <Select
                placeholder="Status"
                value={selectedStatus}
                onChange={setSelectedStatus}
                allowClear
                style={{ width: '100%' }}
              >
                {Object.entries(statusConfig).map(([key, config]) => (
                  <Option key={key} value={key}>
                    {config.label}
                  </Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} sm={4}>
              <Select
                placeholder="Priority"
                value={selectedPriority}
                onChange={setSelectedPriority}
                allowClear
                style={{ width: '100%' }}
              >
                {Object.entries(priorityConfig).map(([key, config]) => (
                  <Option key={key} value={parseInt(key)}>
                    {config.label}
                  </Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} sm={6}>
              <RangePicker
                value={dateRange}
                onChange={setDateRange}
                style={{ width: '100%' }}
                placeholder={['Start Date', 'End Date']}
              />
            </Col>
          </Row>
          <Row style={{ marginTop: '16px' }} gutter={16}>
            <Col>
              <Switch
                checked={showExpired}
                onChange={setShowExpired}
                checkedChildren="Show Expired"
                unCheckedChildren="Hide Expired"
              />
            </Col>
            <Col flex="auto">
              <Space style={{ float: 'right' }}>
                <Button icon={<FilterOutlined />} onClick={clearFilters}>
                  Clear Filters
                </Button>
                <Button icon={<ReloadOutlined />} onClick={() => refetch()}>
                  Refresh
                </Button>
                <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
                  Create Alert
                </Button>
              </Space>
            </Col>
          </Row>
        </Card>

        {/* Bulk Actions */}
        {selectedRowKeys.length > 0 && (
          <Card style={{ marginBottom: '16px', backgroundColor: '#f6ffed' }}>
            <Row align="middle" justify="space-between">
              <Col>
                <Text strong>{selectedRowKeys.length} alerts selected</Text>
              </Col>
              <Col>
                <Space>
                  <Popconfirm
                    title="Bulk resolve selected alerts?"
                    description="This action will resolve all selected alerts."
                    onConfirm={handleBulkResolve}
                    okText="Yes"
                    cancelText="No"
                  >
                    <Button
                      type="primary"
                      icon={<CheckCircleOutlined />}
                      loading={bulkResolveAlertsMutation.isPending}
                    >
                      Bulk Resolve
                    </Button>
                  </Popconfirm>
                  <Button onClick={() => setSelectedRowKeys([])}>
                    Clear Selection
                  </Button>
                </Space>
              </Col>
            </Row>
          </Card>
        )}

        {/* Alerts Table */}
        <Card>
          <Table
            rowSelection={rowSelection}
            columns={columns}
            dataSource={alertsData || []}
            rowKey="id"
            loading={isLoading}
            pagination={{
              total: alertsData?.length || 0,
              pageSize: 20,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} alerts`
            }}
            scroll={{ x: 1200 }}
            size="middle"
          />
        </Card>

        {/* Create/Edit Modal */}
        <Modal
          title={editingAlert ? 'Edit Alert' : 'Create New Alert'}
          open={isModalVisible}
          onOk={handleSubmit}
          onCancel={() => {
            setIsModalVisible(false);
            setEditingAlert(null);
            form.resetFields();
          }}
          okText={editingAlert ? 'Update' : 'Create'}
          confirmLoading={createAlertMutation.isPending || updateAlertMutation.isPending}
          width={600}
        >
          <Form
            form={form}
            layout="vertical"
            initialValues={{
              alert_type: 'INFO',
              priority: 2,
              is_dismissible: true
            }}
          >
            <Form.Item
              name="title"
              label="Alert Title"
              rules={[{ required: true, message: 'Please enter alert title' }]}
            >
              <Input placeholder="Enter alert title" />
            </Form.Item>

            <Form.Item
              name="message"
              label="Alert Message"
              rules={[{ required: true, message: 'Please enter alert message' }]}
            >
              <TextArea
                placeholder="Enter detailed alert message"
                rows={4}
                showCount
                maxLength={1000}
              />
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="alert_type"
                  label="Alert Type"
                  rules={[{ required: true }]}
                >
                  <Select placeholder="Select alert type">
                    {Object.entries(alertTypeConfig).map(([key, config]) => (
                      <Option key={key} value={key}>
                        {config.icon} {config.label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="priority"
                  label="Priority"
                  rules={[{ required: true }]}
                >
                  <Select placeholder="Select priority">
                    {Object.entries(priorityConfig).map(([key, config]) => (
                      <Option key={key} value={parseInt(key)}>
                        {config.label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="target_roles"
              label="Target Roles (Optional)"
              tooltip="Leave empty to target all users"
            >
              <Select
                mode="multiple"
                placeholder="Select target roles"
                allowClear
              >
                <Option value="MAIN_CENTER">Main Center</Option>
                <Option value="SUB_CENTER">Sub Center</Option>
                <Option value="PARLIAMENT_MEMBER">Parliament Member</Option>
                <Option value="DRIVER">Driver</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="expires_at"
              label="Expiration Date (Optional)"
              tooltip="Leave empty for no expiration"
            >
              <DatePicker
                showTime
                format="YYYY-MM-DD HH:mm"
                placeholder="Select expiration date"
                style={{ width: '100%' }}
              />
            </Form.Item>

            <Form.Item name="is_dismissible" valuePropName="checked">
              <Checkbox>Allow users to dismiss this alert</Checkbox>
            </Form.Item>
          </Form>
        </Modal>

        {/* View Alert Drawer */}
        <Drawer
          title="Alert Details"
          placement="right"
          onClose={() => setIsDrawerVisible(false)}
          open={isDrawerVisible}
          width={600}
        >
          {viewingAlert && (
            <div>
              <div style={{ marginBottom: '24px' }}>
                <Space style={{ marginBottom: '16px' }}>
                  <span style={{ color: alertTypeConfig[viewingAlert.alert_type].color }}>
                    {alertTypeConfig[viewingAlert.alert_type].icon}
                  </span>
                  <Title level={4} style={{ margin: 0 }}>
                    {viewingAlert.title}
                  </Title>
                </Space>
                <Space wrap>
                  <Tag color={alertTypeConfig[viewingAlert.alert_type].color}>
                    {alertTypeConfig[viewingAlert.alert_type].label}
                  </Tag>
                  <Tag color={priorityConfig[viewingAlert.priority].color}>
                    {priorityConfig[viewingAlert.priority].label}
                  </Tag>
                  <Badge
                    status={viewingAlert.status === 'ACTIVE' ? 'processing' : 
                           viewingAlert.status === 'RESOLVED' ? 'success' : 'default'}
                    text={statusConfig[viewingAlert.status].label}
                  />
                </Space>
              </div>

              <Descriptions column={1} bordered>
                <Descriptions.Item label="Message">
                  <div style={{ whiteSpace: 'pre-wrap' }}>
                    {viewingAlert.message}
                  </div>
                </Descriptions.Item>
                <Descriptions.Item label="Created By">
                  {viewingAlert.created_by_details?.first_name} {viewingAlert.created_by_details?.last_name}
                  {viewingAlert.created_by_details?.username && (
                    <Text type="secondary"> (@{viewingAlert.created_by_details.username})</Text>
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="Created At">
                  {dayjs(viewingAlert.created).format('MMMM DD, YYYY HH:mm')}
                </Descriptions.Item>
                {viewingAlert.acknowledged_at && (
                  <>
                    <Descriptions.Item label="Acknowledged At">
                      {dayjs(viewingAlert.acknowledged_at).format('MMMM DD, YYYY HH:mm')}
                    </Descriptions.Item>
                    {viewingAlert.acknowledged_by && (
                      <Descriptions.Item label="Acknowledged By">
                        {viewingAlert.acknowledged_by.first_name} {viewingAlert.acknowledged_by.last_name}
                        <Text type="secondary"> (@{viewingAlert.acknowledged_by.username})</Text>
                      </Descriptions.Item>
                    )}
                  </>
                )}
                {viewingAlert.expires_at && (
                  <Descriptions.Item label="Expires At">
                    <Text type={dayjs().isAfter(dayjs(viewingAlert.expires_at)) ? 'danger' : 'secondary'}>
                      {dayjs(viewingAlert.expires_at).format('MMMM DD, YYYY HH:mm')}
                    </Text>
                  </Descriptions.Item>
                )}
                <Descriptions.Item label="Target Roles">
                  {viewingAlert.target_roles && viewingAlert.target_roles.length > 0 ? (
                    <Space wrap>
                      {viewingAlert.target_roles.map(role => (
                        <Tag key={role}>{role.replace('_', ' ')}</Tag>
                      ))}
                    </Space>
                  ) : (
                    <Text type="secondary">All users</Text>
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="Dismissible">
                  {viewingAlert.is_dismissible ? (
                    <Tag color="green">Yes</Tag>
                  ) : (
                    <Tag color="red">No</Tag>
                  )}
                </Descriptions.Item>
              </Descriptions>

              <Divider />

              <Space>
                {viewingAlert.status === 'ACTIVE' && (
                  <>
                    <Button
                      type="primary"
                      icon={<CheckCircleOutlined />}
                      onClick={() => {
                        acknowledgeAlertMutation.mutate(viewingAlert.id);
                        setIsDrawerVisible(false);
                      }}
                      loading={acknowledgeAlertMutation.isPending}
                    >
                      Acknowledge
                    </Button>
                    <Button
                      type="primary"
                      icon={<CheckCircleOutlined />}
                      style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                      onClick={() => {
                        resolveAlertMutation.mutate(viewingAlert.id);
                        setIsDrawerVisible(false);
                      }}
                      loading={resolveAlertMutation.isPending}
                    >
                      Resolve
                    </Button>
                  </>
                )}
                {viewingAlert.is_dismissible && viewingAlert.status !== 'DISMISSED' && (
                  <Button
                    danger
                    icon={<CloseCircleOutlined />}
                    onClick={() => {
                      dismissAlertMutation.mutate(viewingAlert.id);
                      setIsDrawerVisible(false);
                    }}
                    loading={dismissAlertMutation.isPending}
                  >
                    Dismiss
                  </Button>
                )}
                <Button
                  icon={<EditOutlined />}
                  onClick={() => {
                    setIsDrawerVisible(false);
                    openEditModal(viewingAlert);
                  }}
                >
                  Edit
                </Button>
              </Space>
            </div>
          )}
        </Drawer>
      </motion.div>
    </div>
  );
};

export default SystemAlertsPage;
