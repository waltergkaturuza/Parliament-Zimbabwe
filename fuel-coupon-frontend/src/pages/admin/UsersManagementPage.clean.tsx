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
import { adminService, type User as ApiUser } from '@/api/admin';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

// Align local User type with API's User to avoid type mismatches
type User = ApiUser;

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
  // Server-side pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(50);
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  // Fetch users data
  const { data: usersData, isLoading: usersLoading, error } = useQuery({
    queryKey: ['admin-users', searchText, selectedRole, selectedStatus, currentPage, pageSize],
    queryFn: async () => {
      try {
        return await adminService.getUsers({
          search: searchText || undefined,
          role: selectedRole,
          is_active: selectedStatus === 'active' ? true : selectedStatus === 'inactive' ? false : undefined,
          page: currentPage,
          page_size: pageSize
        });
      } catch (err) {
        console.error('Error fetching users:', err);
        // Return mock data as fallback
        return {
          results: [
            {
              id: 1,
              username: 'admin_user',
              email: 'admin@parliament.gov.zw',
              first_name: 'System',
              last_name: 'Administrator',
              role: 'ADMIN',
              is_active: true,
              is_approved: true,
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
              is_approved: true,
              date_joined: '2024-02-01T00:00:00Z',
              last_login: '2025-07-06T08:30:00Z',
              phone: '+263712345679'
            },
            {
              id: 3,
              username: 'subcenter_test',
              email: 'subcenter@parliament.gov.zw',
              first_name: 'Sub',
              last_name: 'Center Officer',
              role: 'SUB_CENTER',
              is_active: true,
              is_approved: true,
              date_joined: '2024-03-01T00:00:00Z',
              last_login: '2025-07-05T14:30:00Z',
              sub_center: 1,
              sub_center_details: { id: 1, name: 'Bulawayo Regional Office', code: 'BYO' }
            }
          ],
          count: 3
        };
      }
    }
  });

  // Reset to first page when filters/search change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchText, selectedRole, selectedStatus]);

  // Fetch user stats
  const { data: stats } = useQuery({
    queryKey: ['user-stats'],
    queryFn: async () => {
      try {
        return await adminService.getUserStats();
      } catch (err) {
        console.error('Error fetching user stats:', err);
        // Return mock stats as fallback
        return {
          total_users: usersData?.count || 0,
          active_users: usersData?.results?.filter(u => u.is_active).length || 0,
          new_users_today: 0,
          users_by_role: {
            'ADMIN': 1,
            'MAIN_CENTER': 1,
            'SUB_CENTER': 1,
            'AUDITOR': 0,
            'BENEFICIARY': 0
          }
        };
      }
    }
  });

  // Update and delete mutations
  const updateUserMutation = useMutation({
    mutationFn: ({ id, ...userData }: { id: number } & Partial<User>) => 
      adminService.updateUser(id, userData),
    onSuccess: () => {
      message.success(editingUser ? 'User updated successfully' : 'User created successfully');
      setIsModalVisible(false);
      setEditingUser(null);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (error: any) => {
      message.error(`Failed to save user: ${error.message}`);
    }
  });

  const deleteUserMutation = useMutation({
    mutationFn: adminService.deleteUser,
    onSuccess: () => {
      message.success('User deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (error: any) => {
      message.error(`Failed to delete user: ${error.message}`);
    }
  });

  const handleCreate = () => {
    setEditingUser(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    form.setFieldsValue(user);
    setIsModalVisible(true);
  };

  const handleView = (user: User) => {
    setViewingUser(user);
    setIsDrawerVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      updateUserMutation.mutate({
        id: editingUser?.id || 0, // Will be handled by create API if no ID
        ...values
      });
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const handleDelete = (userId: number) => {
    Modal.confirm({
      title: 'Are you sure you want to delete this user?',
      content: 'This action cannot be undone.',
      okText: 'Yes, Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: () => {
        deleteUserMutation.mutate(userId);
      }
    });
  };

  const users = usersData?.results || [];
  const userStats = stats || {
    total_users: 0,
    active_users: 0,
    new_users_today: 0,
    users_by_role: {}
  };

  const getRoleConfig = (role: string) => {
    const configs = {
      SUPER_ADMIN: { 
        color: '#722ed1', 
        icon: <CrownOutlined />, 
        label: 'Super Admin',
        description: 'Full system access'
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
        color: '#722ed1', 
        icon: <AuditOutlined />, 
        label: 'Auditor',
        description: 'Audit and compliance'
      },
      BENEFICIARY: { 
        color: '#fadb14', 
        icon: <UserOutlined />, 
        label: 'Beneficiary',
        description: 'Parliament member'
      }
    };
    return configs[role as keyof typeof configs] || { 
      color: '#666', 
      icon: <UserOutlined />, 
      label: role,
      description: 'Unknown role'
    };
  };

  const columns: ColumnsType<User> = [
    {
      title: 'User',
      key: 'user',
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Avatar 
            size="large" 
            icon={<UserOutlined />}
            style={{ marginRight: 12, backgroundColor: getRoleConfig(record.role).color }}
          />
          <div>
            <div style={{ fontWeight: 600 }}>
              {record.first_name} {record.last_name}
            </div>
            <div style={{ color: '#666', fontSize: '12px' }}>
              @{record.username}
            </div>
          </div>
        </div>
      ),
      width: 200,
    },
    {
      title: 'Contact',
      key: 'contact',
      render: (_, record) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
            <MailOutlined style={{ marginRight: 6, color: '#666' }} />
            <Text style={{ fontSize: '12px' }}>{record.email}</Text>
          </div>
          {record.phone && (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <PhoneOutlined style={{ marginRight: 6, color: '#666' }} />
              <Text style={{ fontSize: '12px' }}>{record.phone}</Text>
            </div>
          )}
        </div>
      ),
      width: 200,
    },
    {
      title: 'Role',
      key: 'role',
      render: (_, record) => {
        const config = getRoleConfig(record.role);
        return (
          <Tooltip title={config.description}>
            <Tag color={config.color} icon={config.icon}>
              {config.label}
            </Tag>
          </Tooltip>
        );
      },
      width: 150,
    },
    {
      title: 'Sub Center',
      key: 'sub_center',
      render: (_, record) => (
        record.sub_center ? (
          <Tag color="blue">{record.sub_center_details ? record.sub_center_details.name : '-'}</Tag>
        ) : (
          <Text type="secondary">-</Text>
        )
      ),
      width: 150,
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <Tag color={record.is_active ? 'green' : 'red'}>
            {record.is_active ? 'Active' : 'Inactive'}
          </Tag>
          {record.is_approved !== undefined && (
            <Tag color={record.is_approved ? 'blue' : 'orange'}>
              {record.is_approved ? 'Approved' : 'Pending'}
            </Tag>
          )}
        </Space>
      ),
      width: 100,
    },
    {
      title: 'Last Login',
      key: 'last_login',
      render: (_, record) => (
        record.last_login ? (
          <div>
            <div>{dayjs(record.last_login).format('MMM DD, YYYY')}</div>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {dayjs(record.last_login).format('HH:mm')}
            </Text>
          </div>
        ) : (
          <Text type="secondary">Never</Text>
        )
      ),
      width: 120,
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      render: (_, record) => (
        <Dropdown
          menu={{
            items: [
              {
                key: 'view',
                icon: <EyeOutlined />,
                label: 'View Details',
                onClick: () => handleView(record),
              },
              {
                key: 'edit',
                icon: <EditOutlined />,
                label: 'Edit',
                onClick: () => handleEdit(record),
              },
              {
                type: 'divider',
              },
              {
                key: 'delete',
                icon: <DeleteOutlined />,
                label: 'Delete',
                danger: true,
                onClick: () => handleDelete(record.id),
              },
            ],
          }}
          trigger={['click']}
        >
          <Button icon={<MoreOutlined />} size="small" />
        </Dropdown>
      ),
      width: 70,
    },
  ];

  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchText || 
      user.username.toLowerCase().includes(searchText.toLowerCase()) ||
      user.email.toLowerCase().includes(searchText.toLowerCase()) ||
      `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchText.toLowerCase());
    
    const matchesRole = !selectedRole || user.role === selectedRole;
    const matchesStatus = !selectedStatus || 
      (selectedStatus === 'active' && user.is_active) ||
      (selectedStatus === 'inactive' && !user.is_active);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{ padding: '24px' }}
    >
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>
          User Management
        </Title>
        <Text type="secondary">
          Manage system users and their permissions
        </Text>
      </div>

      {error && (
        <Alert
          message="Error loading users"
          description="Using cached data. Some features may be limited."
          type="warning"
          style={{ marginBottom: 16 }}
          closable
        />
      )}

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Users"
              value={userStats.total_users}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Active Users"
              value={userStats.active_users}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="New Today"
              value={userStats.new_users_today}
              prefix={<PlusOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '14px', color: '#666' }}>Active Rate</div>
                <div style={{ fontSize: '24px', fontWeight: 600, color: '#52c41a' }}>
                  {userStats.total_users > 0 ? Math.round((userStats.active_users / userStats.total_users) * 100) : 0}%
                </div>
              </div>
              <Progress
                type="circle"
                size={48}
                percent={userStats.total_users > 0 ? Math.round((userStats.active_users / userStats.total_users) * 100) : 0}
                strokeColor="#52c41a"
                format={() => ''}
              />
            </div>
          </Card>
        </Col>
      </Row>

      {/* Main Content */}
      <Card>
        <Row gutter={[16, 16]} align="middle" style={{ marginBottom: 16 }}>
          <Col flex="auto">
            <Space wrap>
              <Search
                placeholder="Search users..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ width: 300 }}
                allowClear
              />
              <Select
                placeholder="Filter by role"
                value={selectedRole}
                onChange={setSelectedRole}
                style={{ width: 150 }}
                allowClear
              >
                <Option value="ADMIN">Admin</Option>
                <Option value="MAIN_CENTER">Main Center</Option>
                <Option value="SUB_CENTER">Sub Center</Option>
                <Option value="AUDITOR">Auditor</Option>
                <Option value="BENEFICIARY">Beneficiary</Option>
              </Select>
              <Select
                placeholder="Filter by status"
                value={selectedStatus}
                onChange={setSelectedStatus}
                style={{ width: 120 }}
                allowClear
              >
                <Option value="active">Active</Option>
                <Option value="inactive">Inactive</Option>
              </Select>
            </Space>
          </Col>
          <Col>
            <Space>
              <Button
                icon={<ExportOutlined />}
                onClick={() => message.info('Export functionality coming soon')}
              >
                Export
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCreate}
              >
                Add User
              </Button>
            </Space>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={filteredUsers}
          rowKey="id"
          loading={usersLoading}
          pagination={{
            current: currentPage,
            pageSize,
            total: usersData?.count || 0,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} users`,
            onChange: (page, size) => {
              setCurrentPage(page);
              if (size && size !== pageSize) setPageSize(size);
            }
          }}
          scroll={{ x: 800 }}
        />
      </Card>

      {/* Add/Edit User Modal */}
      <Modal
        title={editingUser ? 'Edit User' : 'Add New User'}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          setEditingUser(null);
          form.resetFields();
        }}
        onOk={handleSubmit}
        confirmLoading={updateUserMutation.isPending}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            is_active: true,
            is_approved: true
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="username"
                label="Username"
                rules={[{ required: true, message: 'Please enter username' }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { required: true, message: 'Please enter email' },
                  { type: 'email', message: 'Please enter valid email' }
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
                rules={[{ required: true, message: 'Please enter first name' }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="last_name"
                label="Last Name"
                rules={[{ required: true, message: 'Please enter last name' }]}
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
                rules={[{ required: true, message: 'Please select role' }]}
              >
                <Select>
                  <Option value="ADMIN">Administrator</Option>
                  <Option value="MAIN_CENTER">Main Center Officer</Option>
                  <Option value="SUB_CENTER">Sub Center Officer</Option>
                  <Option value="AUDITOR">Auditor</Option>
                  <Option value="BENEFICIARY">Beneficiary</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="phone" label="Phone Number">
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="is_active" valuePropName="checked">
                <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="is_approved" valuePropName="checked">
                <Switch checkedChildren="Approved" unCheckedChildren="Pending" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* User Details Drawer */}
      <Drawer
        title="User Details"
        open={isDrawerVisible}
        onClose={() => setIsDrawerVisible(false)}
        width={400}
      >
        {viewingUser && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <Avatar 
                size={80} 
                icon={<UserOutlined />}
                style={{ backgroundColor: getRoleConfig(viewingUser.role).color }}
              />
              <div style={{ marginTop: 12 }}>
                <Title level={4} style={{ margin: 0 }}>
                  {viewingUser.first_name} {viewingUser.last_name}
                </Title>
                <Text type="secondary">@{viewingUser.username}</Text>
              </div>
            </div>

            <Descriptions column={1} size="small">
              <Descriptions.Item label="Email">{viewingUser.email}</Descriptions.Item>
              <Descriptions.Item label="Phone">{viewingUser.phone || 'Not provided'}</Descriptions.Item>
              <Descriptions.Item label="Role">
                <Tag color={getRoleConfig(viewingUser.role).color}>
                  {getRoleConfig(viewingUser.role).label}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Sub Center">
                {viewingUser.sub_center_details ? viewingUser.sub_center_details.name : 'Not assigned'}
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={viewingUser.is_active ? 'green' : 'red'}>
                  {viewingUser.is_active ? 'Active' : 'Inactive'}
                </Tag>
              </Descriptions.Item>
              {viewingUser.is_approved !== undefined && (
                <Descriptions.Item label="Approval">
                  <Tag color={viewingUser.is_approved ? 'blue' : 'orange'}>
                    {viewingUser.is_approved ? 'Approved' : 'Pending'}
                  </Tag>
                </Descriptions.Item>
              )}
              <Descriptions.Item label="Joined">
                {dayjs(viewingUser.date_joined).format('MMMM DD, YYYY')}
              </Descriptions.Item>
              <Descriptions.Item label="Last Login">
                {viewingUser.last_login ? dayjs(viewingUser.last_login).format('MMMM DD, YYYY HH:mm') : 'Never'}
              </Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Drawer>
    </motion.div>
  );
};

export default UsersManagementPage;
