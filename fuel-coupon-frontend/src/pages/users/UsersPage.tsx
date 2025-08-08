// src/pages/users/UsersPage.tsx
import { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Input,
  Select,
  Tag,
  Modal,
  Form,
  message,
  Tooltip,
  Statistic,
  Row,
  Col,
  Typography,
  Badge,
  Dropdown,
  Avatar,
  Switch,
  Divider
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
  SettingOutlined
} from '@ant-design/icons';
import { motion } from 'framer-motion';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import type { ColumnsType } from 'antd/es/table';
import { UserService, User as ApiUser } from '@/api/users';

// Configure dayjs
dayjs.extend(relativeTime);

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

const UsersPage = () => {
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<ApiUser | null>(null);
  const [form] = Form.useForm();

  // Load users from API
  useEffect(() => {
    const loadUsers = async () => {
      setLoading(true);
      try {
        const response = await UserService.getUsers();
        setUsers(response.results || response);
      } catch (error) {
        console.error('Failed to load users:', error);
        message.error('Failed to load users');
        // Fallback to mock data for demo
        setUsers([
          {
            id: '1',
            username: 'admin',
            email: 'admin@parliament.gov.zw',
            first_name: 'System',
            last_name: 'Administrator',
            role: 'ADMIN',
            phone: '+263771234567',
            is_active: true,
            is_staff: true,
            date_joined: '2024-01-01T00:00:00Z',
            last_login: '2024-07-04T14:00:00Z',
            last_activity: '2024-07-04T14:30:00Z'
          },
          {
            id: '2',
            username: 'john.doe',
            email: 'john.doe@parliament.gov.zw',
            first_name: 'John',
            last_name: 'Doe',
            role: 'MAIN_CENTER',
            phone: '+263772345678',
            is_active: true,
            is_staff: true,
            date_joined: '2024-02-15T00:00:00Z',
            last_login: '2024-07-04T13:45:00Z',
            last_activity: '2024-07-04T14:15:00Z'
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, []);

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
      color: '#faad14', 
      icon: <SafetyCertificateOutlined />, 
      label: 'Main Center Approver',
      description: 'Main center approval authority'
    },
    SUB_CENTER_APPROVER: { 
      color: '#fa8c16', 
      icon: <SafetyCertificateOutlined />, 
      label: 'Sub Center Approver',
      description: 'Sub center approval authority'
    },
    BENEFICIARY: { 
      color: '#13c2c2', 
      icon: <UserOutlined />, 
      label: 'Beneficiary',
      description: 'Coupon recipient'
    },
    AUDITOR: { 
      color: '#eb2f96', 
      icon: <AuditOutlined />, 
      label: 'Auditor',
      description: 'System auditor'
    }
  };

  const getStatusTag = (user: ApiUser) => {
    if (!user.is_active) {
      return <Tag color="red">Inactive</Tag>;
    }
    
    const lastActivity = user.last_activity ? dayjs(user.last_activity) : null;
    const isOnline = lastActivity && dayjs().diff(lastActivity, 'minute') < 15;
    
    return (
      <Tag color={isOnline ? "green" : "default"}>
        {isOnline ? 'Online' : 'Offline'}
      </Tag>
    );
  };

  const columns: ColumnsType<ApiUser> = [
    {
      title: 'User',
      key: 'user',
      render: (_, record) => (
        <div className="flex items-center gap-3">
          <Avatar 
            size={40}
            icon={<UserOutlined />}
            style={{ 
              backgroundColor: roleConfig[record.role as keyof typeof roleConfig].color,
              fontSize: '16px'
            }}
          >
            {record.first_name.charAt(0)}{record.last_name.charAt(0)}
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <Text strong>{record.first_name} {record.last_name}</Text>
              {getStatusTag(record)}
            </div>
            <Text type="secondary" className="text-sm">@{record.username}</Text>
            {record.is_staff && (
              <Badge 
                count="Staff" 
                style={{ backgroundColor: '#f0f0f0', color: '#666', fontSize: '10px' }}
              />
            )}
          </div>
        </div>
      ),
      width: 250,
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role: keyof typeof roleConfig) => {
        const config = roleConfig[role];
        return (
          <Tooltip title={config.description}>
            <Tag 
              color={config.color}
              icon={config.icon}
              className="text-sm"
            >
              {config.label}
            </Tag>
          </Tooltip>
        );
      },
      filters: Object.entries(roleConfig).map(([key, value]) => ({
        text: value.label,
        value: key,
      })),
      width: 150,
    },
    {
      title: 'Contact',
      key: 'contact',
      render: (_, record) => (
        <div className="space-y-1">
          <div className="flex items-center gap-1">
            <MailOutlined className="text-gray-500 text-xs" />
            <Text className="text-sm">{record.email}</Text>
          </div>
          {record.phone && (
            <div className="flex items-center gap-1">
              <PhoneOutlined className="text-gray-500 text-xs" />
              <Text className="text-sm">{record.phone}</Text>
            </div>
          )}
          {record.sub_center && (
            <Badge 
              count={record.sub_center.name} 
              style={{ backgroundColor: '#e6f7ff', color: '#1890ff', fontSize: '10px' }}
            />
          )}
        </div>
      ),
      width: 200,
    },
    {
      title: 'Activity',
      key: 'activity',
      render: (_, record) => (
        <div className="text-sm">
          <div className="mb-1">
            <Text type="secondary">Joined: </Text>
            <Text>{dayjs(record.date_joined).format('MMM DD, YYYY')}</Text>
          </div>
          {record.last_login && (
            <div className="mb-1">
              <Text type="secondary">Last login: </Text>
              <Text>{dayjs(record.last_login).format('MMM DD, HH:mm')}</Text>
            </div>
          )}
          {record.last_activity && (
            <div>
              <Text type="secondary">Last seen: </Text>
              <Text>{dayjs(record.last_activity).fromNow()}</Text>
            </div>
          )}
        </div>
      ),
      sorter: (a, b) => {
        const aActivity = a.last_activity || a.date_joined;
        const bActivity = b.last_activity || b.date_joined;
        return dayjs(bActivity).unix() - dayjs(aActivity).unix();
      },
      width: 180,
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => (
        <div className="text-center">
          <Switch
            checked={record.is_active}
            onChange={(checked) => handleToggleStatus(record.id, checked)}
            checkedChildren="Active"
            unCheckedChildren="Inactive"
            style={{
              backgroundColor: record.is_active ? '#52c41a' : '#f5222d'
            }}
          />
        </div>
      ),
      width: 100,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Dropdown
          menu={{
            items: [
              {
                key: 'view',
                icon: <EyeOutlined />,
                label: 'View Profile',
                onClick: () => handleView(record),
              },
              {
                key: 'edit',
                icon: <EditOutlined />,
                label: 'Edit User',
                onClick: () => handleEdit(record),
              },
              {
                type: 'divider',
              },
              {
                key: 'reset-password',
                icon: <LockOutlined />,
                label: 'Reset Password',
                onClick: () => handleResetPassword(record.id),
              },
              {
                key: 'toggle-status',
                icon: record.is_active ? <LockOutlined /> : <UnlockOutlined />,
                label: record.is_active ? 'Deactivate' : 'Activate',
                onClick: () => handleToggleStatus(record.id, !record.is_active),
              },
              {
                type: 'divider',
              },
              {
                key: 'delete',
                icon: <DeleteOutlined />,
                label: 'Delete User',
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

  const handleView = (user: ApiUser) => {
    message.info(`Viewing profile for: ${user.first_name} ${user.last_name}`);
  };

  const handleEdit = (user: ApiUser) => {
    setEditingUser(user);
    form.setFieldsValue({
      ...user,
      date_joined: dayjs(user.date_joined),
    });
    setIsModalVisible(true);
  };

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: 'Are you sure you want to delete this user?',
      content: 'This action cannot be undone.',
      okText: 'Yes, Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk() {
        setUsers(users.filter(u => u.id !== id));
        message.success('User deleted successfully');
      },
    });
  };

  const handleToggleStatus = (id: string, isActive: boolean) => {
    setUsers(users.map(user => 
      user.id === id ? { ...user, is_active: isActive } : user
    ));
    message.success(`User ${isActive ? 'activated' : 'deactivated'} successfully`);
  };

  const handleResetPassword = (id: string) => {
    Modal.confirm({
      title: 'Reset user password?',
      content: 'A new temporary password will be sent to the user\'s email.',
      onOk() {
        message.success('Password reset email sent successfully');
      },
    });
  };

  const handleModalOk = () => {
    form.validateFields().then((values) => {
      const userData = {
        ...values,
        date_joined: values.date_joined.toISOString(),
      };
      
      if (editingUser) {
        // Update existing user
        setUsers(users.map(u => 
          u.id === editingUser.id ? { ...u, ...userData } : u
        ));
        message.success('User updated successfully');
      } else {
        // Create new user
        const newUser: ApiUser = {
          id: Date.now().toString(),
          ...userData,
          is_active: true,
          is_staff: values.role !== 'BENEFICIARY',
          last_activity: new Date().toISOString(),
        };
        setUsers([newUser, ...users]);
        message.success('User created successfully');
      }
      
      setIsModalVisible(false);
      setEditingUser(null);
      form.resetFields();
    });
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.first_name.toLowerCase().includes(searchText.toLowerCase()) ||
      user.last_name.toLowerCase().includes(searchText.toLowerCase()) ||
      user.username.toLowerCase().includes(searchText.toLowerCase()) ||
      user.email.toLowerCase().includes(searchText.toLowerCase());
    
    const matchesRole = !selectedRole || user.role === selectedRole;
    
    let matchesStatus = true;
    if (selectedStatus) {
      switch (selectedStatus) {
        case 'active':
          matchesStatus = user.is_active;
          break;
        case 'inactive':
          matchesStatus = !user.is_active;
          break;
        case 'online':
          const lastActivity = user.last_activity ? dayjs(user.last_activity) : null;
          matchesStatus = !!(lastActivity && dayjs().diff(lastActivity, 'minute') < 15);
          break;
        case 'staff':
          matchesStatus = user.is_staff;
          break;
      }
    }
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const stats = {
    total: users.length,
    active: users.filter(u => u.is_active).length,
    online: users.filter(u => {
      const lastActivity = u.last_activity ? dayjs(u.last_activity) : null;
      return lastActivity && dayjs().diff(lastActivity, 'minute') < 15;
    }).length,
    staff: users.filter(u => u.is_staff).length,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="p-6"
    >
      <div className="mb-6">
        <Title level={2} className="mb-2">User Management</Title>
        <Text type="secondary">
          Manage system users, roles, and permissions
        </Text>
      </div>

      {/* Statistics Cards */}
      <Row gutter={16} className="mb-6">
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Total Users"
              value={stats.total}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Active Users"
              value={stats.active}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Online Now"
              value={stats.online}
              prefix={<SafetyCertificateOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Staff Members"
              value={stats.staff}
              prefix={<CrownOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters and Actions */}
      <Card className="mb-4">
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={8} md={6}>
            <Search
              placeholder="Search users..."
              value={searchText}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchText(e.target.value)}
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={24} sm={8} md={4}>
            <Select
              placeholder="Role"
              value={selectedRole}
              onChange={setSelectedRole}
              allowClear
              style={{ width: '100%' }}
            >
              {Object.entries(roleConfig).map(([key, value]) => (
                <Option key={key} value={key}>
                  {value.label}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={8} md={4}>
            <Select
              placeholder="Status"
              value={selectedStatus}
              onChange={setSelectedStatus}
              allowClear
              style={{ width: '100%' }}
            >
              <Option value="active">Active</Option>
              <Option value="inactive">Inactive</Option>
              <Option value="online">Online</Option>
              <Option value="staff">Staff</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6}></Col>
          <Col xs={24} sm={12} md={4}>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  setEditingUser(null);
                  form.resetFields();
                  setIsModalVisible(true);
                }}
              >
                New User
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Users Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={filteredUsers}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} of ${total} users`,
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        title={editingUser ? 'Edit User' : 'Create New User'}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={() => {
          setIsModalVisible(false);
          setEditingUser(null);
          form.resetFields();
        }}
        width={600}
        okText={editingUser ? 'Update' : 'Create'}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            role: 'BENEFICIARY',
            is_active: true,
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="First Name"
                name="first_name"
                rules={[{ required: true, message: 'Please enter first name' }]}
              >
                <Input placeholder="Enter first name" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Last Name"
                name="last_name"
                rules={[{ required: true, message: 'Please enter last name' }]}
              >
                <Input placeholder="Enter last name" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Username"
                name="username"
                rules={[{ required: true, message: 'Please enter username' }]}
              >
                <Input placeholder="Enter username" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Email"
                name="email"
                rules={[
                  { required: true, message: 'Please enter email' },
                  { type: 'email', message: 'Please enter valid email' }
                ]}
              >
                <Input placeholder="Enter email address" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Role"
                name="role"
                rules={[{ required: true, message: 'Please select role' }]}
              >
                <Select>
                  {Object.entries(roleConfig).map(([key, value]) => (
                    <Option key={key} value={key}>
                      <Space>
                        {value.icon}
                        {value.label}
                      </Space>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Phone Number"
                name="phone"
              >
                <Input placeholder="Enter phone number" />
              </Form.Item>
            </Col>
          </Row>

          <Divider />

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="is_active" valuePropName="checked">
                <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
                <span className="ml-2">Account Active</span>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="is_staff" valuePropName="checked">
                <Switch checkedChildren="Staff" unCheckedChildren="Regular" />
                <span className="ml-2">Staff Member</span>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </motion.div>
  );
};

export default UsersPage;
