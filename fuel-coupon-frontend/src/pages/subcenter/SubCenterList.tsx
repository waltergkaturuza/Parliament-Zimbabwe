// src/pages/subcenter/SubCenterList.tsx
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
  Progress
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  BankOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  EnvironmentOutlined,
  UserOutlined,
  MoreOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { motion } from 'framer-motion';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import SubcentersService, { type SubCenter } from '@/api/subcenters';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

const SubCenterList = () => {
  const queryClient = useQueryClient();
  const [searchText, setSearchText] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingSubCenter, setEditingSubCenter] = useState<SubCenter | null>(null);
  const [form] = Form.useForm();

  // Fetch subcenters data
  const { data: subcenters = [], isLoading: loading } = useQuery({
    queryKey: ['subcenters', searchText, selectedStatus],
    queryFn: async () => {
      const params: any = {};
      if (searchText) params.search = searchText;
      if (selectedStatus) params.is_active = selectedStatus === 'active';
      
      return await SubcentersService.getSubcenters(params);
    }
  });
  const getStatusTag = (subcenter: SubCenter) => {
        {
          id: '2',
          code: 'SC-CHI-002',
          name: 'Chitungwiza Sub-Center',
          location: 'Unit L Shopping Center, Chitungwiza',
          is_active: true,
          managed_by: {
            id: '3',
            username: 'jane.smith',
            first_name: 'Jane',
            last_name: 'Smith'
          },
          created: '2024-02-01T00:00:00Z',
          modified: '2024-06-28T14:15:00Z',
          users_count: 38,
          active_programs: 2,
          distributed_coupons: 890,
          capacity: 40
        },
        {
          id: '3',
          code: 'SC-BWY-003',
          name: 'Bulawayo West Sub-Center',
          location: 'Lobengula Street, Bulawayo',
          is_active: true,
          managed_by: {
            id: '4',
            username: 'mike.wilson',
            first_name: 'Mike',
            last_name: 'Wilson'
          },
          created: '2024-03-10T00:00:00Z',
          modified: '2024-07-02T09:45:00Z',
          users_count: 32,
          active_programs: 1,
          distributed_coupons: 670,
          capacity: 35
        },
        {
          id: '4',
          code: 'SC-GWE-004',
          name: 'Gweru Sub-Center',
          location: 'Main Street, Gweru',
          is_active: false,
          created: '2024-04-20T00:00:00Z',
          modified: '2024-06-15T16:20:00Z',
          users_count: 0,
          active_programs: 0,
          distributed_coupons: 0,
          capacity: 25
        },
        {
          id: '5',
          code: 'SC-MUT-005',
          name: 'Mutare Sub-Center',
          location: 'Herbert Chitepo Street, Mutare',
          is_active: true,
          managed_by: {
            id: '5',
            username: 'sarah.johnson',
            first_name: 'Sarah',
            last_name: 'Johnson'
          },
          created: '2024-05-05T00:00:00Z',
          modified: '2024-07-03T11:10:00Z',
          users_count: 28,
          active_programs: 2,
          distributed_coupons: 520,
          capacity: 30
        }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const getStatusTag = (subcenter: SubCenter) => {
    if (!subcenter.is_active) {
      return <Tag color="red" icon={<ExclamationCircleOutlined />}>Inactive</Tag>;
    }
    return <Tag color="green" icon={<CheckCircleOutlined />}>Active</Tag>;
  };

  const getCapacityColor = (used: number, capacity: number) => {
    const percentage = (used / capacity) * 100;
    if (percentage >= 90) return '#ff4d4f';
    if (percentage >= 70) return '#faad14';
    return '#52c41a';
  };

  const columns: ColumnsType<SubCenter> = [
    {
      title: 'Sub-Center Details',
      key: 'details',
      render: (_, record) => (
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Avatar 
              icon={<BankOutlined />} 
              style={{ backgroundColor: '#1890ff' }}
              size="small"
            />
            <Text strong>{record.name}</Text>
            {getStatusTag(record)}
          </div>
          <Text type="secondary" className="text-xs block">
            Code: {record.code}
          </Text>
          <div className="flex items-center gap-1 mt-1">
            <EnvironmentOutlined className="text-gray-500 text-xs" />
            <Text type="secondary" className="text-xs">
              {record.location.length > 50 
                ? `${record.location.substring(0, 50)}...`
                : record.location
              }
            </Text>
          </div>
        </div>
      ),
      width: 300,
    },
    {
      title: 'Manager',
      key: 'manager',
      render: (_, record) => (
        <div>
          {record.managed_by ? (
            <div className="flex items-center gap-2">
              <Avatar 
                size="small"
                icon={<UserOutlined />}
                style={{ backgroundColor: '#52c41a' }}
              >
                {record.managed_by.first_name.charAt(0)}
              </Avatar>
              <div>
                <Text className="text-sm">
                  {record.managed_by.first_name} {record.managed_by.last_name}
                </Text>
                <br />
                <Text type="secondary" className="text-xs">
                  @{record.managed_by.username}
                </Text>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <Text type="secondary">Unassigned</Text>
              <br />
              <Button size="small" type="link">
                Assign Manager
              </Button>
            </div>
          )}
        </div>
      ),
      width: 180,
    },
    {
      title: 'Statistics',
      key: 'stats',
      render: (_, record) => (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Text className="text-xs">Users:</Text>
            <Badge 
              count={record.users_count} 
              style={{ backgroundColor: '#1890ff' }}
            />
          </div>
          <div className="flex justify-between items-center">
            <Text className="text-xs">Programs:</Text>
            <Badge 
              count={record.active_programs} 
              style={{ backgroundColor: '#52c41a' }}
            />
          </div>
          <div className="flex justify-between items-center">
            <Text className="text-xs">Coupons:</Text>
            <Badge 
              count={record.distributed_coupons} 
              style={{ backgroundColor: '#faad14' }}
            />
          </div>
        </div>
      ),
      width: 120,
    },
    {
      title: 'Capacity',
      key: 'capacity',
      render: (_, record) => (
        <div className="text-center">
          <Progress
            type="circle"
            size={60}
            percent={record.capacity ? Math.round((record.users_count! / record.capacity) * 100) : 0}
            strokeColor={getCapacityColor(record.users_count!, record.capacity!)}
            format={(percent) => `${record.users_count}/${record.capacity}`}
          />
          <div className="text-xs text-gray-500 mt-1">
            {record.capacity ? Math.round((record.users_count! / record.capacity) * 100) : 0}% capacity
          </div>
        </div>
      ),
      width: 100,
    },
    {
      title: 'Created',
      key: 'created',
      render: (_, record) => (
        <div className="text-sm">
          <div>{dayjs(record.created).format('MMM DD, YYYY')}</div>
          <Text type="secondary" className="text-xs">
            Modified: {dayjs(record.modified).format('MMM DD')}
          </Text>
        </div>
      ),
      sorter: (a, b) => dayjs(a.created).unix() - dayjs(b.created).unix(),
      width: 120,
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
                label: 'View Details',
                onClick: () => handleView(record),
              },
              {
                key: 'edit',
                icon: <EditOutlined />,
                label: 'Edit Sub-Center',
                onClick: () => handleEdit(record),
              },
              {
                type: 'divider',
              },
              {
                key: 'toggle',
                icon: record.is_active ? <ExclamationCircleOutlined /> : <CheckCircleOutlined />,
                label: record.is_active ? 'Deactivate' : 'Activate',
                onClick: () => handleToggleStatus(record.id, !record.is_active),
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

  const handleView = (subcenter: SubCenter) => {
    message.info(`Viewing details for: ${subcenter.name}`);
  };

  const handleEdit = (subcenter: SubCenter) => {
    setEditingSubCenter(subcenter);
    form.setFieldsValue({
      ...subcenter,
    });
    setIsModalVisible(true);
  };

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: 'Are you sure you want to delete this sub-center?',
      content: 'This action cannot be undone and will affect all associated users and programs.',
      okText: 'Yes, Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk() {
        setSubcenters(subcenters.filter(sc => sc.id !== id));
        message.success('Sub-center deleted successfully');
      },
    });
  };

  const handleToggleStatus = (id: string, isActive: boolean) => {
    setSubcenters(subcenters.map(subcenter => 
      subcenter.id === id ? { ...subcenter, is_active: isActive } : subcenter
    ));
    message.success(`Sub-center ${isActive ? 'activated' : 'deactivated'} successfully`);
  };

  const handleModalOk = () => {
    form.validateFields().then((values) => {
      if (editingSubCenter) {
        // Update existing sub-center
        setSubcenters(subcenters.map(sc => 
          sc.id === editingSubCenter.id ? { ...sc, ...values, modified: new Date().toISOString() } : sc
        ));
        message.success('Sub-center updated successfully');
      } else {
        // Create new sub-center
        const newSubCenter: SubCenter = {
          id: Date.now().toString(),
          ...values,
          is_active: true,
          users_count: 0,
          active_programs: 0,
          distributed_coupons: 0,
          created: new Date().toISOString(),
          modified: new Date().toISOString(),
        };
        setSubcenters([newSubCenter, ...subcenters]);
        message.success('Sub-center created successfully');
      }
      
      setIsModalVisible(false);
      setEditingSubCenter(null);
      form.resetFields();
    });
  };

  const filteredSubcenters = subcenters.filter(subcenter => {
    const matchesSearch = 
      subcenter.name.toLowerCase().includes(searchText.toLowerCase()) ||
      subcenter.code.toLowerCase().includes(searchText.toLowerCase()) ||
      subcenter.location.toLowerCase().includes(searchText.toLowerCase());
    
    let matchesStatus = true;
    if (selectedStatus) {
      switch (selectedStatus) {
        case 'active':
          matchesStatus = subcenter.is_active;
          break;
        case 'inactive':
          matchesStatus = !subcenter.is_active;
          break;
        case 'managed':
          matchesStatus = !!subcenter.managed_by;
          break;
        case 'unmanaged':
          matchesStatus = !subcenter.managed_by;
          break;
      }
    }
    
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: subcenters.length,
    active: subcenters.filter(sc => sc.is_active).length,
    managed: subcenters.filter(sc => sc.managed_by).length,
    totalUsers: subcenters.reduce((sum, sc) => sum + (sc.users_count || 0), 0),
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="p-6"
    >
      <div className="mb-6">
        <Title level={2} className="mb-2">Sub-Center Management</Title>
        <Text type="secondary">
          Manage distribution sub-centers and their operations
        </Text>
      </div>

      {/* Statistics Cards */}
      <Row gutter={16} className="mb-6">
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Total Sub-Centers"
              value={stats.total}
              prefix={<BankOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Active"
              value={stats.active}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="With Managers"
              value={stats.managed}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Total Users"
              value={stats.totalUsers}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters and Actions */}
      <Card className="mb-4">
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Search
              placeholder="Search sub-centers..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={24} sm={8} md={6}>
            <Select
              placeholder="Status"
              value={selectedStatus}
              onChange={setSelectedStatus}
              allowClear
              style={{ width: '100%' }}
            >
              <Option value="active">Active</Option>
              <Option value="inactive">Inactive</Option>
              <Option value="managed">With Manager</Option>
              <Option value="unmanaged">Unmanaged</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6}></Col>
          <Col xs={24} sm={12} md={4}>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  setEditingSubCenter(null);
                  form.resetFields();
                  setIsModalVisible(true);
                }}
              >
                New Sub-Center
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Sub-Centers Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={filteredSubcenters}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} of ${total} sub-centers`,
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        title={editingSubCenter ? 'Edit Sub-Center' : 'Create New Sub-Center'}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={() => {
          setIsModalVisible(false);
          setEditingSubCenter(null);
          form.resetFields();
        }}
        width={600}
        okText={editingSubCenter ? 'Update' : 'Create'}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            is_active: true,
            capacity: 30,
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Sub-Center Code"
                name="code"
                rules={[{ required: true, message: 'Please enter sub-center code' }]}
              >
                <Input placeholder="e.g., SC-HRE-001" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Capacity"
                name="capacity"
                rules={[{ required: true, message: 'Please enter capacity' }]}
              >
                <Input type="number" placeholder="Maximum users" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Sub-Center Name"
            name="name"
            rules={[{ required: true, message: 'Please enter sub-center name' }]}
          >
            <Input placeholder="Enter sub-center name" />
          </Form.Item>

          <Form.Item
            label="Location Address"
            name="location"
            rules={[{ required: true, message: 'Please enter location' }]}
          >
            <Input.TextArea
              rows={3}
              placeholder="Enter complete address"
            />
          </Form.Item>

          <Form.Item name="is_active" valuePropName="checked">
            <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
            <span className="ml-2">Sub-Center Active</span>
          </Form.Item>
        </Form>
      </Modal>
    </motion.div>
  );
};

export default SubCenterList;
