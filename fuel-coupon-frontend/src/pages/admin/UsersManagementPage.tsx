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
  FilterOutlined,
  CheckOutlined,
  CloseOutlined
} from '@ant-design/icons';
import { motion } from 'framer-motion';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';
import { adminService, type User, type UserStats, type SubCenter } from '@/api/admin';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

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
  const [formRole, setFormRole] = useState<string | undefined>(); // Track role in form
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  // Fetch users data
  const { data: usersData, isLoading: usersLoading, error } = useQuery({
    queryKey: ['admin-users', searchText, selectedRole, selectedStatus],
    queryFn: async () => {
      try {
        return await adminService.getUsers({
          search: searchText || undefined,
          role: selectedRole,
          is_active: selectedStatus === 'active' ? true : selectedStatus === 'inactive' ? false : undefined,
          page_size: 50
        });
      } catch (err) {
        console.error('Error fetching users:', err);
        // Return empty results when API fails
        return {
          results: [],
          count: 0
        };
      }
    }
  });

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

  // Fetch sub-centers for dropdown
  const { data: subCenters } = useQuery({
    queryKey: ['sub-centers'],
    queryFn: async () => {
      try {
        return await adminService.getSubCenters();
      } catch (err) {
        console.error('Error fetching sub-centers:', err);
        return [];
      }
    }
  });

  // Fetch available roles from backend
  const { data: availableRoles } = useQuery({
    queryKey: ['available-roles'],
    queryFn: async () => {
      try {
        console.log('🔄 Fetching roles from backend API...');
        const roles = await adminService.getRoles();
        console.log('✅ Roles fetched successfully:', roles.length, 'roles');
        console.log('📋 Roles:', roles.map(r => r.code).join(', '));
        const hasSergeant = roles.some(r => r.code === 'SERGEANT_OF_ARMS');
        console.log('🎯 SERGEANT_OF_ARMS found:', hasSergeant);
        return roles;
      } catch (err) {
        console.error('❌ Error fetching roles from backend:', err);
        console.log('🔄 Using fallback roles...');
        // Fallback to complete list of roles if backend fails
        return [
          { code: 'SUPERUSER', name: 'Super User (Developer)' },
          { code: 'ADMIN', name: 'System Administrator' },
          { code: 'MAIN_CENTER', name: 'Main Center Officer' },
          { code: 'SUB_CENTER', name: 'Sub Center Officer' },
          { code: 'BENEFICIARY', name: 'Beneficiary' },
          { code: 'AUDITOR', name: 'Auditor' },
          { code: 'MAIN_CENTER_APPROVER', name: 'Main Center Approver' },
          { code: 'SUB_CENTER_APPROVER', name: 'Sub Center Approver' },
          { code: 'SERGEANT_OF_ARMS', name: 'Sergeant of Arms' }
        ];
      }
    }
  });

  // Update and delete mutations
  const updateUserMutation = useMutation({
    mutationFn: ({ id, ...userData }: { id: number } & Partial<User>) => {
      if (id && id > 0) {
        // Update existing user
        return adminService.updateUser(id, userData);
      } else {
        // Create new user
        return adminService.createUser(userData);
      }
    },
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

  const approveUserMutation = useMutation({
    mutationFn: adminService.approveUser,
    onSuccess: (response) => {
      // Handle enhanced response with email status
      const emailStatus = response.email_sent ? ' (Email sent successfully)' : ' (Email failed to send)';
      message.success(`User approved successfully${emailStatus}`);
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-users-stats'] });
    },
    onError: (error: any) => {
      message.error(`Failed to approve user: ${error.message}`);
    }
  });

  const rejectUserMutation = useMutation({
    mutationFn: ({ userId, reason }: { userId: number; reason: string }) => 
      adminService.rejectUser(userId, reason),
    onSuccess: (response) => {
      // Handle enhanced response with email status
      const emailStatus = response.email_sent ? ' (Email sent successfully)' : 
                         (response.email_address ? ' (Email failed to send)' : ' (No email address on file)');
      message.success(`User rejected successfully${emailStatus}`);
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-users-stats'] });
    },
    onError: (error: any) => {
      message.error(`Failed to reject user: ${error.message}`);
    }
  });

  const handleCreate = () => {
    setEditingUser(null);
    setFormRole(undefined); // Reset form role
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormRole(user.role); // Set form role from user
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
      
      if (editingUser?.id) {
        // Update existing user
        updateUserMutation.mutate({
          id: editingUser.id,
          ...values
        });
      } else {
        // Create new user - don't pass ID
        updateUserMutation.mutate({
          id: 0, // Will be ignored for creation
          ...values
        });
      }
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

  const handleApprove = (user: User) => {
    Modal.confirm({
      title: 'Approve User Registration',
      content: `Are you sure you want to approve ${user.first_name} ${user.last_name}'s registration?`,
      okText: 'Yes, Approve',
      okType: 'primary',
      cancelText: 'Cancel',
      onOk: () => {
        approveUserMutation.mutate(user.id);
      }
    });
  };

  const handleReject = (user: User) => {
    let rejectionReason = '';
    Modal.confirm({
      title: 'Reject User Registration',
      content: (
        <div>
          <p>Are you sure you want to reject {user.first_name} {user.last_name}'s registration?</p>
          <Input.TextArea
            placeholder="Enter rejection reason..."
            onChange={(e) => rejectionReason = e.target.value}
            rows={3}
          />
        </div>
      ),
      okText: 'Yes, Reject',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: () => {
        if (!rejectionReason.trim()) {
          message.error('Please provide a rejection reason');
          return;
        }
        rejectUserMutation.mutate({ userId: user.id, reason: rejectionReason });
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
        description: 'System administrator'
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
      SERGEANT_OF_ARMS: {
        color: '#fa8c16',
        icon: <SafetyCertificateOutlined />,
        label: 'Sergeant of Arms',
        description: 'Parliamentary attendance management'
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
        record.sub_center_details ? (
          <Tag color="blue">{record.sub_center_details.name}</Tag>
        ) : (
          <Text type="secondary">Not assigned</Text>
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
          {record.approval_status && (
            <Tag 
              color={
                record.approval_status === 'approved' ? 'blue' : 
                record.approval_status === 'rejected' ? 'red' : 'orange'
              }
            >
              {record.approval_status === 'approved' ? 'Approved' : 
               record.approval_status === 'rejected' ? 'Rejected' : 'Pending'}
            </Tag>
          )}
          {record.rejection_reason && (
            <Tooltip title={record.rejection_reason}>
              <Tag color="red" style={{ cursor: 'help' }}>
                Rejected
              </Tag>
            </Tooltip>
          )}
        </Space>
      ),
      width: 120,
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
      render: (_, record) => {
        const menuItems: any[] = [
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
          }
        ];

        // Add approval actions for non-approved users
        if (!record.is_approved && !record.rejection_reason) {
          menuItems.push(
            { type: 'divider' as const },
            {
              key: 'approve',
              icon: <CheckOutlined />,
              label: 'Approve',
              style: { color: '#52c41a' },
              onClick: () => handleApprove(record),
            },
            {
              key: 'reject',
              icon: <CloseOutlined />,
              label: 'Reject',
              style: { color: '#ff4d4f' },
              onClick: () => handleReject(record),
            }
          );
        }

        // Add re-approve action for rejected users
        if (record.rejection_reason) {
          menuItems.push(
            { type: 'divider' as const },
            {
              key: 'approve',
              icon: <CheckOutlined />,
              label: 'Re-approve',
              style: { color: '#52c41a' },
              onClick: () => handleApprove(record),
            }
          );
        }

        menuItems.push(
          { type: 'divider' as const },
          {
            key: 'delete',
            icon: <DeleteOutlined />,
            label: 'Delete',
            danger: true,
            onClick: () => handleDelete(record.id),
          }
        );

        return (
          <Dropdown
            menu={{ items: menuItems }}
            trigger={['click']}
          >
            <Button icon={<MoreOutlined />} size="small" />
          </Dropdown>
        );
      },
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
                style={{ width: 200 }}
                allowClear
              >
                {availableRoles?.map((role) => (
                  <Option key={role.code} value={role.code}>
                    {role.name}
                  </Option>
                ))}
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
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} users`,
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
        width={900}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            is_active: true,
            is_approved: true
          }}
        >
          {/* Role-based Sub Center Requirement Notice */}
          {['SUB_CENTER', 'AUDITOR', 'BENEFICIARY', 'SUB_CENTER_APPROVER'].includes(formRole || '') && (
            <Alert
              message="Sub Center Assignment Required"
              description={`Users with ${formRole?.replace('_', ' ')} role must be assigned to a specific sub-center as they will work exclusively within that sub-center.`}
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}

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

          {/* Password fields - only show when creating new user */}
          {!editingUser && (
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="password"
                  label="Password"
                  rules={[
                    { required: true, message: 'Please enter password' },
                    { min: 8, message: 'Password must be at least 8 characters' }
                  ]}
                >
                  <Input.Password />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="password2"
                  label="Confirm Password"
                  dependencies={['password']}
                  rules={[
                    { required: true, message: 'Please confirm password' },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue('password') === value) {
                          return Promise.resolve();
                        }
                        return Promise.reject(new Error('Passwords do not match!'));
                      },
                    }),
                  ]}
                >
                  <Input.Password />
                </Form.Item>
              </Col>
            </Row>
          )}

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
                <Select onChange={(value) => setFormRole(value)}>
                  {availableRoles?.map((role) => (
                    <Option key={role.code} value={role.code}>
                      {role.name}
                    </Option>
                  ))}
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
              <Form.Item 
                name="sub_center" 
                label={
                  ['SUB_CENTER', 'AUDITOR', 'BENEFICIARY', 'SUB_CENTER_APPROVER', 'SERGEANT_OF_ARMS'].includes(formRole || '') 
                    ? "Sub Center (Required)" 
                    : "Sub Center (Optional)"
                }
                rules={[
                  ...((['SUB_CENTER', 'AUDITOR', 'BENEFICIARY', 'SUB_CENTER_APPROVER', 'SERGEANT_OF_ARMS'].includes(formRole || '')) 
                    ? [{ required: true, message: 'Sub Center is required for this role' }] 
                    : [])
                ]}
              >
                <Select
                  placeholder={
                    ['SUB_CENTER', 'AUDITOR', 'BENEFICIARY', 'SUB_CENTER_APPROVER', 'SERGEANT_OF_ARMS'].includes(formRole || '')
                      ? "Select sub center (required for this role)"
                      : "Select sub center (optional)"
                  }
                  allowClear
                  showSearch
                  optionFilterProp="label"
                >
                  {subCenters?.map((subCenter) => (
                    <Option key={subCenter.id} value={subCenter.id} label={`${subCenter.name} (${subCenter.code})`}>
                      {subCenter.name} ({subCenter.code})
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="registration_justification" label="Registration Justification (Optional)">
                <Input.TextArea placeholder="Reason for creating this user account" rows={2} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="national_id" label="National ID (Optional)">
                <Input placeholder="National ID number" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="full_address" label="Full Address (Optional)">
                <Input.TextArea placeholder="Complete address" rows={2} />
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
