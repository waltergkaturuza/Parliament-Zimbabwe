// src/pages/admin/UsersManagementPage.tsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Table,
  Card,
  Button,
  Space,
  Input,
  Select,
  Tag,
  Modal,
  Form,
  message,
  Tooltip,
  Row,
  Col,
  Typography,
  Badge,
  Dropdown,
  Avatar,
  Switch,
  Statistic,
  Progress,
  Drawer,
  Descriptions,
  Tabs,
  Alert
} from 'antd';
import {
  PlusOutlined,
  UserOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  LockOutlined,
  UnlockOutlined,
  MoreOutlined,
  TeamOutlined,
  CrownOutlined,
  SafetyCertificateOutlined,
  BankOutlined,
  AuditOutlined,
  MailOutlined,
  PhoneOutlined,
  SettingOutlined,
  SearchOutlined,
  ReloadOutlined,
  ExportOutlined,
  FilterOutlined
} from '@ant-design/icons';
import { motion } from 'framer-motion';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';
import { adminService } from '@/api/admin';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  is_active: boolean;
  date_joined: string;
  last_login?: string;
  phone?: string;
  sub_center?: {
    id: number;
    name: string;
  };
}

interface UserStats {
  total_users: number;
  active_users: number;
  new_users_today: number;
  users_by_role: Record<string, number>;
}

const UsersManagementPage: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [selectedRole, setSelectedRole] = useState<string | undefined>();
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  // Fetch users data
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['admin-users', searchText, selectedRole, selectedStatus],
    queryFn: async () => {
      // Mock data for now - replace with actual API call
      const mockUsers: User[] = [
        {
          id: 1,
          username: 'admin_user',
          email: 'admin@parliament.gov.zw',
          first_name: 'System',
          last_name: 'Administrator',
          role: 'ADMIN',
          is_active: true,
          date_joined: '2024-01-01T00:00:00Z',
          last_login: '2025-07-06T10:00:00Z',
          phone: '+263712345678'
        },
        {
          id: 2,
          username: 'maincenter_test',
          email: 'maincenter@parliament.gov.zw',
          first_name: 'Main',
          last_name: 'Center Officer',
          role: 'MAIN_CENTER',
          is_active: true,
          date_joined: '2024-02-01T00:00:00Z',
          last_login: '2025-07-06T09:30:00Z',
          phone: '+263712345679'
        },
        {
          id: 3,
          username: 'subcenter_user',
          email: 'subcenter@parliament.gov.zw',
          first_name: 'Sub',
          last_name: 'Center Officer',
          role: 'SUB_CENTER',
          is_active: true,
          date_joined: '2024-03-01T00:00:00Z',
          last_login: '2025-07-05T14:30:00Z',
          sub_center: { id: 1, name: 'Bulawayo Regional Office' }
        }
      ];

      return {
        users: mockUsers.filter(user => {
          const matchesSearch = !searchText || 
            user.username.toLowerCase().includes(searchText.toLowerCase()) ||
            user.email.toLowerCase().includes(searchText.toLowerCase()) ||
            `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchText.toLowerCase());
          
          const matchesRole = !selectedRole || user.role === selectedRole;
          const matchesStatus = !selectedStatus || 
            (selectedStatus === 'active' && user.is_active) ||
            (selectedStatus === 'inactive' && !user.is_active);
          
          return matchesSearch && matchesRole && matchesStatus;
        }),
        stats: {
          total_users: mockUsers.length,
          active_users: mockUsers.filter(u => u.is_active).length,
          new_users_today: 0,
          users_by_role: {
            'ADMIN': 1,
            'MAIN_CENTER': 1,
            'SUB_CENTER': 1,
            'AUDITOR': 0,
            'BENEFICIARY': 0
          }
        } as UserStats
      };
    }
  });

  // Role configuration
  const roleConfig = {
    SUPERUSER: {
      color: '#722ed1', 
      icon: <CrownOutlined />, 
      label: 'Super User',
      description: 'Developer access'
    },
    ADMIN: { 
      color: '#f5222d', 
      icon: <SettingOutlined />, 
      label: 'Administrator',
      description: 'Full system access'
    },
    MAIN_CENTER: { 
      color: '#1890ff', 
      icon: <BankOutlined />, 
      label: 'Main Center',
      description: 'Main center officer'
    },
    SUB_CENTER: { 
      color: '#52c41a', 
      icon: <TeamOutlined />, 
      label: 'Sub Center',
      description: 'Sub center officer'
    },
    MAIN_CENTER_APPROVER: {
      color: '#13c2c2',
      icon: <SafetyCertificateOutlined />,
      label: 'Main Center Approver',
      description: 'Approval authority for main center'
    },
    SUB_CENTER_APPROVER: {
      color: '#eb2f96',
      icon: <SafetyCertificateOutlined />,
      label: 'Sub Center Approver',
      description: 'Approval authority for sub center'
    },
    AUDITOR: { 
      color: '#fa8c16', 
      icon: <AuditOutlined />, 
      label: 'Auditor',
      description: 'System auditor'
    },
    BENEFICIARY: { 
      color: '#a0d911', 
      icon: <UserOutlined />, 
      label: 'Beneficiary',
      description: 'Fuel recipient'
    }
  };

  // Create/Update user mutation
  const saveUserMutation = useMutation({
    mutationFn: async (userData: Partial<User>) => {
      // Mock API call - replace with actual endpoint
      await new Promise(resolve => setTimeout(resolve, 1000));
      return userData;
    },
    onSuccess: () => {
      message.success(editingUser ? 'User updated successfully' : 'User created successfully');
      setIsModalVisible(false);
      setEditingUser(null);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: () => {
      message.error('Failed to save user');
    }
  });

  // Toggle user status mutation
  const toggleUserMutation = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: number; isActive: boolean }) => {
      // Mock API call - replace with actual endpoint
      await new Promise(resolve => setTimeout(resolve, 500));
      return { userId, isActive };
    },
    onSuccess: (data) => {
      message.success(`User ${data.isActive ? 'activated' : 'deactivated'} successfully`);
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: () => {
      message.error('Failed to update user status');
    }
  });

  const handleCreateUser = () => {
    setEditingUser(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    form.setFieldsValue(user);
    setIsModalVisible(true);
  };

  const handleViewUser = (user: User) => {
    setViewingUser(user);
    setIsDrawerVisible(true);
  };

  const handleSaveUser = async () => {
    try {
      const values = await form.validateFields();
      saveUserMutation.mutate({
        ...values,
        id: editingUser?.id
      });
    } catch (error) {
      message.error('Please fix form errors before saving');
    }
  };

  const handleToggleStatus = (user: User) => {
    toggleUserMutation.mutate({
      userId: user.id,
      isActive: !user.is_active
    });
  };

  const columns: ColumnsType<User> = [
    {
      title: 'User',
      key: 'user',
      render: (_, record) => (
        <div className="flex items-center gap-3">
          <Avatar 
            size="large" 
            icon={<UserOutlined />}
            style={{ backgroundColor: roleConfig[record.role as keyof typeof roleConfig]?.color }}
          >
            {record.first_name?.[0]}{record.last_name?.[0]}
          </Avatar>
          <div>
            <div className="font-medium">{record.username}</div>
            <div className="text-gray-500 text-sm">
              {record.first_name} {record.last_name}
            </div>
            <div className="text-gray-400 text-xs">{record.email}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => {
        const config = roleConfig[role as keyof typeof roleConfig];
        return (
          <Tag 
            color={config?.color} 
            icon={config?.icon}
            className="px-2 py-1"
          >
            {config?.label || role}
          </Tag>
        );
      },
      filters: Object.entries(roleConfig).map(([key, config]) => ({
        text: config.label,
        value: key,
      })),
      onFilter: (value, record) => record.role === value,
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'status',
      render: (isActive: boolean) => (
        <Badge 
          status={isActive ? "success" : "error"} 
          text={isActive ? "Active" : "Inactive"} 
        />
      ),
      filters: [
        { text: 'Active', value: true },
        { text: 'Inactive', value: false },
      ],
      onFilter: (value, record) => record.is_active === value,
    },
    {
      title: 'Last Login',
      dataIndex: 'last_login',
      key: 'last_login',
      render: (lastLogin: string) => (
        <div>
          {lastLogin ? (
            <>
              <div>{dayjs(lastLogin).format('MMM DD, YYYY')}</div>
              <div className="text-gray-400 text-xs">
                {dayjs(lastLogin).format('HH:mm')}
              </div>
            </>
          ) : (
            <Text type="secondary">Never</Text>
          )}
        </div>
      ),
      sorter: (a, b) => dayjs(a.last_login || 0).unix() - dayjs(b.last_login || 0).unix(),
    },
    {
      title: 'Joined',
      dataIndex: 'date_joined',
      key: 'date_joined',
      render: (dateJoined: string) => dayjs(dateJoined).format('MMM DD, YYYY'),
      sorter: (a, b) => dayjs(a.date_joined).unix() - dayjs(b.date_joined).unix(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="View Details">
            <Button 
              type="text" 
              icon={<EyeOutlined />} 
              onClick={() => handleViewUser(record)}
            />
          </Tooltip>
          <Tooltip title="Edit User">
            <Button 
              type="text" 
              icon={<EditOutlined />} 
              onClick={() => handleEditUser(record)}
            />
          </Tooltip>
          <Tooltip title={record.is_active ? "Deactivate" : "Activate"}>
            <Button 
              type="text" 
              icon={record.is_active ? <LockOutlined /> : <UnlockOutlined />}
              loading={toggleUserMutation.isPending}
              onClick={() => handleToggleStatus(record)}
              danger={record.is_active}
            />
          </Tooltip>
          <Dropdown
            menu={{
              items: [
                {
                  key: 'reset-password',
                  label: 'Reset Password',
                  icon: <LockOutlined />
                },
                {
                  key: 'send-email',
                  label: 'Send Email',
                  icon: <MailOutlined />
                },
                {
                  key: 'delete',
                  label: 'Delete User',
                  icon: <DeleteOutlined />,
                  danger: true
                }
              ]
            }}
            trigger={['click']}
          >
            <Button type="text" icon={<MoreOutlined />} />
          </Dropdown>
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
            <Title level={2} className="!mb-0">Users Management</Title>
            <Text type="secondary">Manage system users and their permissions</Text>
          </div>
          <Space>
            <Button 
              icon={<ExportOutlined />}
            >
              Export
            </Button>
            <Button 
              icon={<ReloadOutlined />}
              onClick={() => queryClient.invalidateQueries({ queryKey: ['admin-users'] })}
            >
              Refresh
            </Button>
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={handleCreateUser}
            >
              Add User
            </Button>
          </Space>
        </div>

        {/* Statistics Cards */}
        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={24} sm={6}>
            <Card size="small">
              <Statistic
                title="Total Users"
                value={usersData?.stats.total_users || 0}
                prefix={<TeamOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card size="small">
              <Statistic
                title="Active Users"
                value={usersData?.stats.active_users || 0}
                prefix={<UserOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card size="small">
              <Statistic
                title="New Today"
                value={usersData?.stats.new_users_today || 0}
                prefix={<PlusOutlined />}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card size="small">
              <Statistic
                title="Admins"
                value={usersData?.stats.users_by_role?.ADMIN || 0}
                prefix={<CrownOutlined />}
                valueStyle={{ color: '#f5222d' }}
              />
            </Card>
          </Col>
        </Row>

        {/* Filters */}
        <Card className="mb-6">
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} sm={8}>
              <Search
                placeholder="Search users..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                allowClear
              />
            </Col>
            <Col xs={24} sm={4}>
              <Select
                placeholder="Role"
                value={selectedRole}
                onChange={setSelectedRole}
                allowClear
                className="w-full"
              >
                {Object.entries(roleConfig).map(([key, config]) => (
                  <Option key={key} value={key}>{config.label}</Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} sm={4}>
              <Select
                placeholder="Status"
                value={selectedStatus}
                onChange={setSelectedStatus}
                allowClear
                className="w-full"
              >
                <Option value="active">Active</Option>
                <Option value="inactive">Inactive</Option>
              </Select>
            </Col>
          </Row>
        </Card>

        {/* Users Table */}
        <Card>
          <Table
            columns={columns}
            dataSource={usersData?.users || []}
            rowKey="id"
            loading={usersLoading}
            pagination={{
              total: usersData?.users.length || 0,
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => 
                `${range[0]}-${range[1]} of ${total} users`,
            }}
          />
        </Card>

        {/* Create/Edit User Modal */}
        <Modal
          title={editingUser ? 'Edit User' : 'Create New User'}
          open={isModalVisible}
          onOk={handleSaveUser}
          onCancel={() => {
            setIsModalVisible(false);
            setEditingUser(null);
            form.resetFields();
          }}
          width={600}
          confirmLoading={saveUserMutation.isPending}
        >
          <Form
            form={form}
            layout="vertical"
            className="mt-4"
          >
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="username"
                  label="Username"
                  rules={[
                    { required: true, message: 'Username is required' },
                    { min: 3, message: 'Username must be at least 3 characters' }
                  ]}
                >
                  <Input />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="email"
                  label="Email"
                  rules={[
                    { required: true, message: 'Email is required' },
                    { type: 'email', message: 'Invalid email format' }
                  ]}
                >
                  <Input />
                </Form.Item>
              </Col>
            </Row>
            
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="first_name"
                  label="First Name"
                  rules={[{ required: true, message: 'First name is required' }]}
                >
                  <Input />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="last_name"
                  label="Last Name"
                  rules={[{ required: true, message: 'Last name is required' }]}
                >
                  <Input />
                </Form.Item>
              </Col>
            </Row>
            
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="role"
                  label="Role"
                  rules={[{ required: true, message: 'Role is required' }]}
                >
                  <Select placeholder="Select role">
                    {Object.entries(roleConfig).map(([key, config]) => (
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
                  name="phone"
                  label="Phone Number"
                >
                  <Input />
                </Form.Item>
              </Col>
            </Row>
            
            <Form.Item
              name="is_active"
              label="Status"
              valuePropName="checked"
            >
              <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
            </Form.Item>
          </Form>
        </Modal>

        {/* User Details Drawer */}
        <Drawer
          title="User Details"
          open={isDrawerVisible}
          onClose={() => setIsDrawerVisible(false)}
          width={600}
        >
          {viewingUser && (
            <div>
              <div className="text-center mb-6">
                <Avatar 
                  size={64} 
                  icon={<UserOutlined />}
                  style={{ backgroundColor: roleConfig[viewingUser.role as keyof typeof roleConfig]?.color }}
                >
                  {viewingUser.first_name?.[0]}{viewingUser.last_name?.[0]}
                </Avatar>
                <Title level={4} className="mt-2 mb-0">
                  {viewingUser.first_name} {viewingUser.last_name}
                </Title>
                <Text type="secondary">@{viewingUser.username}</Text>
              </div>

              <Descriptions bordered column={1}>
                <Descriptions.Item label="Role">
                  <Tag 
                    color={roleConfig[viewingUser.role as keyof typeof roleConfig]?.color} 
                    icon={roleConfig[viewingUser.role as keyof typeof roleConfig]?.icon}
                  >
                    {roleConfig[viewingUser.role as keyof typeof roleConfig]?.label || viewingUser.role}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Email">{viewingUser.email}</Descriptions.Item>
                <Descriptions.Item label="Phone">{viewingUser.phone || 'Not provided'}</Descriptions.Item>
                <Descriptions.Item label="Status">
                  <Badge 
                    status={viewingUser.is_active ? "success" : "error"} 
                    text={viewingUser.is_active ? "Active" : "Inactive"} 
                  />
                </Descriptions.Item>
                <Descriptions.Item label="Date Joined">
                  {dayjs(viewingUser.date_joined).format('MMMM DD, YYYY HH:mm')}
                </Descriptions.Item>
                <Descriptions.Item label="Last Login">
                  {viewingUser.last_login 
                    ? dayjs(viewingUser.last_login).format('MMMM DD, YYYY HH:mm')
                    : 'Never'
                  }
                </Descriptions.Item>
                {viewingUser.sub_center && (
                  <Descriptions.Item label="Sub Center">
                    {viewingUser.sub_center.name}
                  </Descriptions.Item>
                )}
              </Descriptions>
            </div>
          )}
        </Drawer>
      </motion.div>
    </div>
  );
};

export default UsersManagementPage;
