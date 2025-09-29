// src/pages/admin/components/UsersManagementTab.tsx
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
  Progress
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
  SearchOutlined
} from '@ant-design/icons';
import { motion } from 'framer-motion';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';
import { UserService, User as ApiUser } from '@/api/users';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

interface UsersManagementTabProps {
  loading?: boolean;
}

const UsersManagementTab: React.FC<UsersManagementTabProps> = ({ loading = false }) => {
  const [searchText, setSearchText] = useState('');
  const [selectedRole, setSelectedRole] = useState<string | undefined>();
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<ApiUser | null>(null);
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  // Server-side pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(50);

  // Fetch users data
  const { data: users = [], isLoading: usersLoading, error } = useQuery({
    queryKey: ['users', searchText, selectedRole, selectedStatus, currentPage, pageSize],
    queryFn: () => UserService.getUsers({
      search: searchText || undefined,
      role: selectedRole,
      is_active: selectedStatus === 'active' ? true : selectedStatus === 'inactive' ? false : undefined,
      page: currentPage,
      page_size: pageSize,
    }),
  });

  // Reset to first page when filters/search change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchText, selectedRole, selectedStatus]);

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

  const getRoleTag = (role: string) => {
    const config = roleConfig[role as keyof typeof roleConfig];
    if (!config) return <Tag>{role}</Tag>;
    
    return (
      <Tag color={config.color} icon={config.icon}>
        {config.label}
      </Tag>
    );
  };

  const getStatusTag = (user: ApiUser) => {
    if (!user.is_active) {
      return <Tag color="red">Inactive</Tag>;
    }
    return <Tag color="green">Active</Tag>;
  };

  // Table columns
  const columns: ColumnsType<ApiUser> = [
    {
      title: 'User',
      key: 'user',
      render: (_, record) => (
        <div className="flex items-center space-x-3">
          <Avatar size={40} icon={<UserOutlined />} />
          <div>
            <div className="font-medium">{record.first_name} {record.last_name}</div>
            <div className="text-sm text-gray-500">{record.username}</div>
            {record.email && (
              <div className="text-xs text-gray-400 flex items-center">
                <MailOutlined className="mr-1" />
                {record.email}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role) => getRoleTag(role),
      filters: Object.keys(roleConfig).map(role => ({
        text: roleConfig[role as keyof typeof roleConfig].label,
        value: role,
      })),
      onFilter: (value, record) => record.role === value,
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => getStatusTag(record),
      filters: [
        { text: 'Active', value: 'active' },
        { text: 'Inactive', value: 'inactive' },
      ],
      onFilter: (value, record) => {
        if (value === 'active') return record.is_active;
        if (value === 'inactive') return !record.is_active;
        return true;
      },
    },
    {
      title: 'Sub Center',
      dataIndex: 'sub_center',
      key: 'sub_center',
      render: (subCenter) => subCenter?.name || '-',
    },
    {
      title: 'Joined',
      dataIndex: 'date_joined',
      key: 'date_joined',
      render: (date) => dayjs(date).format('MMM DD, YYYY'),
      sorter: (a, b) => dayjs(a.date_joined).unix() - dayjs(b.date_joined).unix(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
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
          <Dropdown
            menu={{
              items: [
                {
                  key: 'toggle-status',
                  label: record.is_active ? 'Deactivate' : 'Activate',
                  icon: record.is_active ? <LockOutlined /> : <UnlockOutlined />,
                  onClick: () => handleToggleStatus(record),
                },
                {
                  key: 'delete',
                  label: 'Delete',
                  icon: <DeleteOutlined />,
                  danger: true,
                  onClick: () => handleDeleteUser(record),
                },
              ],
            }}
            trigger={['click']}
          >
            <Button type="text" icon={<MoreOutlined />} />
          </Dropdown>
        </Space>
      ),
    },
  ];

  // Event handlers
  const handleViewUser = (user: ApiUser) => {
    // Implement view user details
    console.log('View user:', user);
  };

  const handleEditUser = (user: ApiUser) => {
    setEditingUser(user);
    form.setFieldsValue(user);
    setIsModalVisible(true);
  };

  const handleDeleteUser = (user: ApiUser) => {
    Modal.confirm({
      title: 'Delete User',
      content: `Are you sure you want to delete user "${user.username}"?`,
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          await UserService.deleteUser(user.id);
          message.success('User deleted successfully');
          queryClient.invalidateQueries({ queryKey: ['users'] });
        } catch (error) {
          message.error('Failed to delete user');
        }
      },
    });
  };

  const handleToggleStatus = async (user: ApiUser) => {
    try {
      await UserService.updateUser(user.id, { 
        username: user.username,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        is_active: !user.is_active,
        sub_center: user.sub_center?.id || undefined
      });
      message.success(`User ${user.is_active ? 'deactivated' : 'activated'} successfully`);
      queryClient.invalidateQueries({ queryKey: ['users'] });
    } catch (error) {
      message.error('Failed to update user status');
    }
  };

  const handleCreateUser = () => {
    setEditingUser(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      
      if (editingUser) {
        await UserService.updateUser(editingUser.id, values);
        message.success('User updated successfully');
      } else {
        await UserService.createUser(values);
        message.success('User created successfully');
      }
      
      setIsModalVisible(false);
      queryClient.invalidateQueries({ queryKey: ['users'] });
    } catch (error) {
      message.error('Failed to save user');
    }
  };

  // Statistics for users
  const usersArray: ApiUser[] = (users as any)?.results ?? (users as any);
  const totalCount: number = (users as any)?.count ?? (Array.isArray(usersArray) ? usersArray.length : 0);
  const userStats = {
    total: totalCount,
    active: usersArray.filter((u: ApiUser) => u.is_active).length,
    byRole: Object.keys(roleConfig).reduce((acc: Record<string, number>, role) => {
      acc[role] = usersArray.filter((u: ApiUser) => u.role === role).length;
      return acc;
    }, {} as Record<string, number>)
  };

  return (
    <div className="space-y-6">
      {/* User Statistics */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Total Users"
              value={userStats.total}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Active Users"
              value={userStats.active}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
            <Progress 
              percent={Math.round((userStats.active / userStats.total) * 100)} 
              showInfo={false} 
              size="small" 
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="New This Month"
              value={users.filter((u: ApiUser) => dayjs(u.date_joined).isAfter(dayjs().startOf('month'))).length}
              prefix={<PlusOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters and Actions */}
      <Card>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <Search
              placeholder="Search users..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ maxWidth: 300 }}
              allowClear
            />
            <Select
              placeholder="Filter by role"
              value={selectedRole}
              onChange={setSelectedRole}
              allowClear
              style={{ minWidth: 200 }}
            >
              {Object.entries(roleConfig).map(([key, config]) => (
                <Option key={key} value={key}>
                  <span className="flex items-center gap-2">
                    {config.icon}
                    {config.label}
                  </span>
                </Option>
              ))}
            </Select>
            <Select
              placeholder="Filter by status"
              value={selectedStatus}
              onChange={setSelectedStatus}
              allowClear
              style={{ minWidth: 150 }}
            >
              <Option value="active">Active</Option>
              <Option value="inactive">Inactive</Option>
            </Select>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreateUser}
          >
            Add User
          </Button>
        </div>

        {/* Users Table */}
        <Table
          columns={columns}
          dataSource={usersArray}
          rowKey="id"
          loading={usersLoading || loading}
          pagination={{
            current: currentPage,
            pageSize,
            total: totalCount,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `Total ${total} users`,
            onChange: (page, size) => {
              setCurrentPage(page);
              if (size && size !== pageSize) setPageSize(size);
            },
          }}
          scroll={{ x: 1000 }}
        />
      </Card>

      {/* User Form Modal */}
      <Modal
        title={editingUser ? 'Edit User' : 'Create User'}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={() => setIsModalVisible(false)}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          requiredMark={false}
        >
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
          <Form.Item
            name="username"
            label="Username"
            rules={[{ required: true, message: 'Please enter username' }]}
          >
            <Input />
          </Form.Item>
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
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="role"
                label="Role"
                rules={[{ required: true, message: 'Please select role' }]}
              >
                <Select>
                  {Object.entries(roleConfig).map(([key, config]) => (
                    <Option key={key} value={key}>
                      <span className="flex items-center gap-2">
                        {config.icon}
                        {config.label}
                      </span>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="is_active" label="Status" valuePropName="checked">
                <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
              </Form.Item>
            </Col>
          </Row>
          {!editingUser && (
            <Form.Item
              name="password"
              label="Password"
              rules={[{ required: true, message: 'Please enter password' }]}
            >
              <Input.Password />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  );
};

export default UsersManagementTab;
