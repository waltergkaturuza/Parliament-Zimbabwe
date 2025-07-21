// src/pages/admin/SystemAlertsPage.tsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  Tooltip
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
  CloseCircleOutlined
} from '@ant-design/icons';
import { motion } from 'framer-motion';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface SystemAlert {
  id: number;
  title: string;
  message: string;
  alert_type: 'INFO' | 'WARNING' | 'CRITICAL' | 'SUCCESS';
  status: 'ACTIVE' | 'RESOLVED' | 'DISMISSED';
  created: string;
  resolved_at?: string;
  created_by: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
  };
  resolved_by?: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
  };
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  category: string;
  affected_systems?: string[];
}

interface AlertStats {
  total_alerts: number;
  active_alerts: number;
  critical_alerts: number;
  resolved_today: number;
}

const SystemAlertsPage: React.FC = () => {
  const [selectedType, setSelectedType] = useState<string | undefined>();
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>();
  const [selectedPriority, setSelectedPriority] = useState<string | undefined>();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [editingAlert, setEditingAlert] = useState<SystemAlert | null>(null);
  const [viewingAlert, setViewingAlert] = useState<SystemAlert | null>(null);
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  // Fetch alerts data
  const { data: alertsData, isLoading } = useQuery({
    queryKey: ['system-alerts', selectedType, selectedStatus, selectedPriority],
    queryFn: async () => {
      // Mock data for now - replace with actual API call
      const mockAlerts: SystemAlert[] = [
        {
          id: 1,
          title: 'Low Fuel Stock Alert',
          message: 'Fuel stock levels are running low. Current stock: 150 coupons remaining.',
          alert_type: 'WARNING',
          status: 'ACTIVE',
          created: '2025-07-06T08:00:00Z',
          priority: 'HIGH',
          category: 'INVENTORY',
          created_by: {
            id: 1,
            username: 'system',
            first_name: 'System',
            last_name: 'Administrator'
          },
          affected_systems: ['Inventory Management', 'Distribution']
        },
        {
          id: 2,
          title: 'System Maintenance Completed',
          message: 'Scheduled system maintenance has been completed successfully. All services are now operational.',
          alert_type: 'SUCCESS',
          status: 'ACTIVE',
          created: '2025-07-06T06:00:00Z',
          priority: 'MEDIUM',
          category: 'MAINTENANCE',
          created_by: {
            id: 1,
            username: 'admin_user',
            first_name: 'System',
            last_name: 'Administrator'
          }
        },
        {
          id: 3,
          title: 'Failed Login Attempts',
          message: 'Multiple failed login attempts detected from IP: 192.168.1.100. Security review recommended.',
          alert_type: 'CRITICAL',
          status: 'RESOLVED',
          created: '2025-07-05T22:30:00Z',
          resolved_at: '2025-07-06T09:00:00Z',
          priority: 'URGENT',
          category: 'SECURITY',
          created_by: {
            id: 2,
            username: 'security_system',
            first_name: 'Security',
            last_name: 'System'
          },
          resolved_by: {
            id: 1,
            username: 'admin_user',
            first_name: 'System',
            last_name: 'Administrator'
          },
          affected_systems: ['Authentication', 'Security']
        },
        {
          id: 4,
          title: 'Database Backup Completed',
          message: 'Daily database backup completed successfully. Backup size: 2.1 GB',
          alert_type: 'INFO',
          status: 'DISMISSED',
          created: '2025-07-06T02:00:00Z',
          resolved_at: '2025-07-06T08:30:00Z',
          priority: 'LOW',
          category: 'BACKUP',
          created_by: {
            id: 3,
            username: 'backup_system',
            first_name: 'Backup',
            last_name: 'System'
          }
        }
      ];

      return {
        alerts: mockAlerts.filter(alert => {
          const matchesType = !selectedType || alert.alert_type === selectedType;
          const matchesStatus = !selectedStatus || alert.status === selectedStatus;
          const matchesPriority = !selectedPriority || alert.priority === selectedPriority;
          
          return matchesType && matchesStatus && matchesPriority;
        }),
        stats: {
          total_alerts: mockAlerts.length,
          active_alerts: mockAlerts.filter(a => a.status === 'ACTIVE').length,
          critical_alerts: mockAlerts.filter(a => a.alert_type === 'CRITICAL' && a.status === 'ACTIVE').length,
          resolved_today: mockAlerts.filter(a => 
            a.resolved_at && dayjs(a.resolved_at).isSame(dayjs(), 'day')
          ).length
        } as AlertStats
      };
    }
  });

  // Alert type configuration
  const alertTypeConfig = {
    INFO: {
      color: '#1890ff',
      icon: <InfoCircleOutlined />,
      label: 'Information'
    },
    WARNING: {
      color: '#faad14',
      icon: <WarningOutlined />,
      label: 'Warning'
    },
    CRITICAL: {
      color: '#ff4d4f',
      icon: <ExclamationCircleOutlined />,
      label: 'Critical'
    },
    SUCCESS: {
      color: '#52c41a',
      icon: <CheckCircleOutlined />,
      label: 'Success'
    }
  };

  const priorityConfig = {
    LOW: { color: '#d9d9d9', label: 'Low' },
    MEDIUM: { color: '#1890ff', label: 'Medium' },
    HIGH: { color: '#faad14', label: 'High' },
    URGENT: { color: '#ff4d4f', label: 'Urgent' }
  };

  const statusConfig = {
    ACTIVE: { color: '#ff4d4f', label: 'Active' },
    RESOLVED: { color: '#52c41a', label: 'Resolved' },
    DISMISSED: { color: '#d9d9d9', label: 'Dismissed' }
  };

  // Resolve alert mutation
  const resolveAlertMutation = useMutation({
    mutationFn: async (alertId: number) => {
      // Mock API call - replace with actual endpoint
      await new Promise(resolve => setTimeout(resolve, 500));
      return alertId;
    },
    onSuccess: () => {
      message.success('Alert resolved successfully');
      queryClient.invalidateQueries({ queryKey: ['system-alerts'] });
    },
    onError: () => {
      message.error('Failed to resolve alert');
    }
  });

  // Create alert mutation
  const createAlertMutation = useMutation({
    mutationFn: async (alertData: Partial<SystemAlert>) => {
      // Mock API call - replace with actual endpoint
      await new Promise(resolve => setTimeout(resolve, 1000));
      return alertData;
    },
    onSuccess: () => {
      message.success('Alert created successfully');
      setIsModalVisible(false);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ['system-alerts'] });
    },
    onError: () => {
      message.error('Failed to create alert');
    }
  });

  const handleCreateAlert = () => {
    setEditingAlert(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleViewAlert = (alert: SystemAlert) => {
    setViewingAlert(alert);
    setIsDrawerVisible(true);
  };

  const handleResolveAlert = (alertId: number) => {
    Modal.confirm({
      title: 'Resolve Alert',
      content: 'Are you sure you want to mark this alert as resolved?',
      onOk: () => {
        resolveAlertMutation.mutate(alertId);
      }
    });
  };

  const handleSaveAlert = async () => {
    try {
      const values = await form.validateFields();
      createAlertMutation.mutate(values);
    } catch (error) {
      message.error('Please fix form errors before saving');
    }
  };

  const columns: ColumnsType<SystemAlert> = [
    {
      title: 'Alert',
      key: 'alert',
      render: (_, record) => (
        <div className="flex items-start gap-3">
          <div 
            className="text-lg mt-1"
            style={{ color: alertTypeConfig[record.alert_type].color }}
          >
            {alertTypeConfig[record.alert_type].icon}
          </div>
          <div className="flex-1">
            <div className="font-medium">{record.title}</div>
            <div className="text-gray-500 text-sm line-clamp-2">
              {record.message}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Tag>{record.category}</Tag>
              {record.affected_systems?.map(system => (
                <Tag key={system} color="blue">
                  {system}
                </Tag>
              ))}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'alert_type',
      key: 'type',
      width: 120,
      render: (type: keyof typeof alertTypeConfig) => (
        <Tag 
          color={alertTypeConfig[type].color}
          icon={alertTypeConfig[type].icon}
        >
          {alertTypeConfig[type].label}
        </Tag>
      ),
      filters: Object.entries(alertTypeConfig).map(([key, config]) => ({
        text: config.label,
        value: key,
      })),
      onFilter: (value, record) => record.alert_type === value,
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
      render: (priority: keyof typeof priorityConfig) => (
        <Tag color={priorityConfig[priority].color}>
          {priorityConfig[priority].label}
        </Tag>
      ),
      filters: Object.entries(priorityConfig).map(([key, config]) => ({
        text: config.label,
        value: key,
      })),
      onFilter: (value, record) => record.priority === value,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: keyof typeof statusConfig) => (
        <Badge 
          status={status === 'ACTIVE' ? 'error' : status === 'RESOLVED' ? 'success' : 'default'}
          text={statusConfig[status].label}
        />
      ),
      filters: Object.entries(statusConfig).map(([key, config]) => ({
        text: config.label,
        value: key,
      })),
      onFilter: (value, record) => record.status === value,
    },
    {
      title: 'Created',
      dataIndex: 'created',
      key: 'created',
      width: 150,
      render: (created: string) => (
        <div>
          <div>{dayjs(created).format('MMM DD, YYYY')}</div>
          <div className="text-gray-400 text-xs">
            {dayjs(created).format('HH:mm')}
          </div>
        </div>
      ),
      sorter: (a, b) => dayjs(a.created).unix() - dayjs(b.created).unix(),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="View Details">
            <Button 
              type="text" 
              icon={<EyeOutlined />} 
              onClick={() => handleViewAlert(record)}
            />
          </Tooltip>
          {record.status === 'ACTIVE' && (
            <Tooltip title="Resolve">
              <Button 
                type="text" 
                icon={<CheckCircleOutlined />}
                loading={resolveAlertMutation.isPending}
                onClick={() => handleResolveAlert(record.id)}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex justify-between items-center mb-6">
          <div>
            <Title level={2} className="!mb-0">System Alerts</Title>
            <Text type="secondary">Monitor and manage system alerts and notifications</Text>
          </div>
          <Space>
            <Button 
              icon={<ReloadOutlined />}
              onClick={() => queryClient.invalidateQueries({ queryKey: ['system-alerts'] })}
            >
              Refresh
            </Button>
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={handleCreateAlert}
            >
              Create Alert
            </Button>
          </Space>
        </div>

        {/* Statistics Cards */}
        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={24} sm={6}>
            <Card size="small">
              <Statistic
                title="Total Alerts"
                value={alertsData?.stats.total_alerts || 0}
                prefix={<BellOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card size="small">
              <Statistic
                title="Active Alerts"
                value={alertsData?.stats.active_alerts || 0}
                prefix={<ExclamationCircleOutlined />}
                valueStyle={{ color: '#ff4d4f' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card size="small">
              <Statistic
                title="Critical Alerts"
                value={alertsData?.stats.critical_alerts || 0}
                prefix={<WarningOutlined />}
                valueStyle={{ color: '#ff4d4f' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card size="small">
              <Statistic
                title="Resolved Today"
                value={alertsData?.stats.resolved_today || 0}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
        </Row>

        {/* Active Critical Alerts Banner */}
        {(alertsData?.stats.critical_alerts || 0) > 0 && (
          <Alert
            message={`${alertsData?.stats.critical_alerts || 0} Critical Alert${(alertsData?.stats.critical_alerts || 0) > 1 ? 's' : ''} Require Immediate Attention`}
            type="error"
            showIcon
            className="mb-6"
            action={
              <Button size="small" danger>
                View Critical
              </Button>
            }
          />
        )}

        {/* Filters */}
        <Card className="mb-6">
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} sm={6}>
              <Select
                placeholder="Alert Type"
                value={selectedType}
                onChange={setSelectedType}
                allowClear
                className="w-full"
              >
                {Object.entries(alertTypeConfig).map(([key, config]) => (
                  <Option key={key} value={key}>
                    <Space>
                      {config.icon}
                      {config.label}
                    </Space>
                  </Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} sm={6}>
              <Select
                placeholder="Status"
                value={selectedStatus}
                onChange={setSelectedStatus}
                allowClear
                className="w-full"
              >
                {Object.entries(statusConfig).map(([key, config]) => (
                  <Option key={key} value={key}>{config.label}</Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} sm={6}>
              <Select
                placeholder="Priority"
                value={selectedPriority}
                onChange={setSelectedPriority}
                allowClear
                className="w-full"
              >
                {Object.entries(priorityConfig).map(([key, config]) => (
                  <Option key={key} value={key}>{config.label}</Option>
                ))}
              </Select>
            </Col>
          </Row>
        </Card>

        {/* Alerts Table */}
        <Card>
          <Table
            columns={columns}
            dataSource={alertsData?.alerts || []}
            rowKey="id"
            loading={isLoading}
            pagination={{
              total: alertsData?.alerts.length || 0,
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => 
                `${range[0]}-${range[1]} of ${total} alerts`,
            }}
          />
        </Card>

        {/* Create Alert Modal */}
        <Modal
          title="Create System Alert"
          open={isModalVisible}
          onOk={handleSaveAlert}
          onCancel={() => {
            setIsModalVisible(false);
            form.resetFields();
          }}
          width={600}
          confirmLoading={createAlertMutation.isPending}
        >
          <Form
            form={form}
            layout="vertical"
            className="mt-4"
          >
            <Form.Item
              name="title"
              label="Alert Title"
              rules={[{ required: true, message: 'Title is required' }]}
            >
              <Input placeholder="Enter alert title" />
            </Form.Item>
            
            <Form.Item
              name="message"
              label="Alert Message"
              rules={[{ required: true, message: 'Message is required' }]}
            >
              <TextArea 
                rows={4} 
                placeholder="Enter detailed alert message"
              />
            </Form.Item>
            
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="alert_type"
                  label="Alert Type"
                  rules={[{ required: true, message: 'Type is required' }]}
                >
                  <Select placeholder="Select alert type">
                    {Object.entries(alertTypeConfig).map(([key, config]) => (
                      <Option key={key} value={key}>
                        <Space>
                          {config.icon}
                          {config.label}
                        </Space>
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="priority"
                  label="Priority"
                  rules={[{ required: true, message: 'Priority is required' }]}
                >
                  <Select placeholder="Select priority">
                    {Object.entries(priorityConfig).map(([key, config]) => (
                      <Option key={key} value={key}>{config.label}</Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            
            <Form.Item
              name="category"
              label="Category"
              rules={[{ required: true, message: 'Category is required' }]}
            >
              <Select placeholder="Select category">
                <Option value="SECURITY">Security</Option>
                <Option value="INVENTORY">Inventory</Option>
                <Option value="MAINTENANCE">Maintenance</Option>
                <Option value="BACKUP">Backup</Option>
                <Option value="PERFORMANCE">Performance</Option>
                <Option value="USER">User Management</Option>
                <Option value="SYSTEM">System</Option>
              </Select>
            </Form.Item>
          </Form>
        </Modal>

        {/* Alert Details Drawer */}
        <Drawer
          title="Alert Details"
          open={isDrawerVisible}
          onClose={() => setIsDrawerVisible(false)}
          width={600}
        >
          {viewingAlert && (
            <div>
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div 
                    className="text-2xl"
                    style={{ color: alertTypeConfig[viewingAlert.alert_type].color }}
                  >
                    {alertTypeConfig[viewingAlert.alert_type].icon}
                  </div>
                  <div>
                    <Title level={4} className="!mb-0">{viewingAlert.title}</Title>
                    <Space>
                      <Tag color={alertTypeConfig[viewingAlert.alert_type].color}>
                        {alertTypeConfig[viewingAlert.alert_type].label}
                      </Tag>
                      <Tag color={priorityConfig[viewingAlert.priority].color}>
                        {priorityConfig[viewingAlert.priority].label}
                      </Tag>
                      <Badge 
                        status={viewingAlert.status === 'ACTIVE' ? 'error' : 'success'}
                        text={statusConfig[viewingAlert.status].label}
                      />
                    </Space>
                  </div>
                </div>
                
                <Alert
                  message={viewingAlert.message}
                  type={viewingAlert.alert_type.toLowerCase() as any}
                  showIcon
                />
              </div>

              <Descriptions bordered column={1} className="mb-6">
                <Descriptions.Item label="Category">{viewingAlert.category}</Descriptions.Item>
                <Descriptions.Item label="Created">
                  {dayjs(viewingAlert.created).format('MMMM DD, YYYY HH:mm')}
                </Descriptions.Item>
                <Descriptions.Item label="Created By">
                  {viewingAlert.created_by.first_name} {viewingAlert.created_by.last_name}
                  <Text type="secondary" className="ml-2">
                    (@{viewingAlert.created_by.username})
                  </Text>
                </Descriptions.Item>
                {viewingAlert.resolved_at && (
                  <>
                    <Descriptions.Item label="Resolved">
                      {dayjs(viewingAlert.resolved_at).format('MMMM DD, YYYY HH:mm')}
                    </Descriptions.Item>
                    {viewingAlert.resolved_by && (
                      <Descriptions.Item label="Resolved By">
                        {viewingAlert.resolved_by.first_name} {viewingAlert.resolved_by.last_name}
                        <Text type="secondary" className="ml-2">
                          (@{viewingAlert.resolved_by.username})
                        </Text>
                      </Descriptions.Item>
                    )}
                  </>
                )}
                {viewingAlert.affected_systems && (
                  <Descriptions.Item label="Affected Systems">
                    <Space wrap>
                      {viewingAlert.affected_systems.map(system => (
                        <Tag key={system} color="blue">{system}</Tag>
                      ))}
                    </Space>
                  </Descriptions.Item>
                )}
              </Descriptions>

              {viewingAlert.status === 'ACTIVE' && (
                <div className="text-center">
                  <Button
                    type="primary"
                    icon={<CheckCircleOutlined />}
                    loading={resolveAlertMutation.isPending}
                    onClick={() => handleResolveAlert(viewingAlert.id)}
                  >
                    Mark as Resolved
                  </Button>
                </div>
              )}
            </div>
          )}
        </Drawer>
      </motion.div>
    </div>
  );
};

export default SystemAlertsPage;
