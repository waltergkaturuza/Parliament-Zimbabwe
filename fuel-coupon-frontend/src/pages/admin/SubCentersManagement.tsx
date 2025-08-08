// src/pages/admin/SubCentersManagement.tsx
import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Typography,
  Input,
  Select,
  Tag,
  Modal,
  Form,
  Row,
  Col,
  message,
  Popconfirm,
  Tooltip,
  Divider,
  Badge
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  MailOutlined,
  UserOutlined,
  BankOutlined,
  FilterOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { motion } from 'framer-motion';

const { Title, Text } = Typography;
const { Option } = Select;

interface SubCenter {
  id: number;
  name: string;
  location: string;
  address: string;
  phone?: string;
  email?: string;
  manager?: string;
  status: 'active' | 'inactive' | 'maintenance';
  capacity: number;
  current_users: number;
  last_activity?: string;
  created_at: string;
  updated_at: string;
}

const SubCentersManagement: React.FC = () => {
  const [subCenters, setSubCenters] = useState<SubCenter[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingSubCenter, setEditingSubCenter] = useState<SubCenter | null>(null);
  const [form] = Form.useForm();

  // Load sub-centers from API
  const loadSubCenters = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      // const response = await apiClient.get('/sub-centers/');
      // setSubCenters(response.data.results || []);
      
      // Mock data for now - remove when API is connected
      setTimeout(() => {
        setSubCenters([]);
        setLoading(false);
        message.info('No sub-centers found. Create your first sub-center to get started.');
      }, 1000);
    } catch (error) {
      console.error('Error loading sub-centers:', error);
      message.error('Failed to load sub-centers');
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubCenters();
  }, []);

  const handleCreateSubCenter = () => {
    setEditingSubCenter(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEditSubCenter = (subCenter: SubCenter) => {
    setEditingSubCenter(subCenter);
    form.setFieldsValue({
      name: subCenter.name,
      location: subCenter.location,
      address: subCenter.address,
      phone: subCenter.phone,
      email: subCenter.email,
      manager: subCenter.manager,
      status: subCenter.status,
      capacity: subCenter.capacity
    });
    setIsModalVisible(true);
  };

  const handleDeleteSubCenter = async (id: number) => {
    try {
      // TODO: Replace with actual API call
      // await apiClient.delete(`/sub-centers/${id}/`);
      message.success('Sub-center deleted successfully');
      loadSubCenters();
    } catch (error) {
      console.error('Error deleting sub-center:', error);
      message.error('Failed to delete sub-center');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editingSubCenter) {
        // TODO: Replace with actual API call
        // await apiClient.put(`/sub-centers/${editingSubCenter.id}/`, values);
        message.success('Sub-center updated successfully');
      } else {
        // TODO: Replace with actual API call
        // await apiClient.post('/sub-centers/', values);
        message.success('Sub-center created successfully');
      }
      setIsModalVisible(false);
      loadSubCenters();
    } catch (error) {
      console.error('Error saving sub-center:', error);
      message.error('Failed to save sub-center');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'green';
      case 'inactive': return 'red';
      case 'maintenance': return 'orange';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Active';
      case 'inactive': return 'Inactive';
      case 'maintenance': return 'Maintenance';
      default: return 'Unknown';
    }
  };

  const filteredSubCenters = subCenters.filter(subCenter => {
    const matchesSearch = !searchText || 
      subCenter.name.toLowerCase().includes(searchText.toLowerCase()) ||
      subCenter.location.toLowerCase().includes(searchText.toLowerCase()) ||
      (subCenter.manager && subCenter.manager.toLowerCase().includes(searchText.toLowerCase()));
    
    const matchesStatus = !statusFilter || subCenter.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const columns: ColumnsType<SubCenter> = [
    {
      title: 'Sub-Center Name',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Space direction="vertical" size={0}>
          <Text strong className="text-base">{text}</Text>
          <Text type="secondary" className="text-sm">
            <EnvironmentOutlined className="mr-1" />
            {record.location}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Contact Information',
      key: 'contact',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          {record.phone && (
            <Text className="text-sm">
              <PhoneOutlined className="mr-1" />
              {record.phone}
            </Text>
          )}
          {record.email && (
            <Text className="text-sm">
              <MailOutlined className="mr-1" />
              {record.email}
            </Text>
          )}
          {!record.phone && !record.email && (
            <Text type="secondary" className="text-sm">No contact info</Text>
          )}
        </Space>
      ),
    },
    {
      title: 'Manager',
      dataIndex: 'manager',
      key: 'manager',
      render: (text) => (
        <Space>
          <UserOutlined />
          <Text>{text || 'Not assigned'}</Text>
        </Space>
      ),
    },
    {
      title: 'Capacity',
      key: 'capacity',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Badge 
            count={record.current_users} 
            style={{ backgroundColor: record.current_users > record.capacity * 0.8 ? '#ff4d4f' : '#52c41a' }}
          />
          <Text type="secondary" className="text-sm">
            {record.current_users} / {record.capacity} users
          </Text>
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {getStatusText(status)}
        </Tag>
      ),
    },
    {
      title: 'Last Activity',
      dataIndex: 'last_activity',
      key: 'last_activity',
      render: (date) => (
        <Text type="secondary" className="text-sm">
          {date ? new Date(date).toLocaleDateString() : 'No activity'}
        </Text>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Tooltip title="Edit Sub-Center">
            <Button 
              type="text" 
              icon={<EditOutlined />} 
              onClick={() => handleEditSubCenter(record)}
              className="text-blue-600 hover:text-blue-800"
            />
          </Tooltip>
          <Popconfirm
            title="Delete Sub-Center"
            description="Are you sure you want to delete this sub-center? This action cannot be undone."
            onConfirm={() => handleDeleteSubCenter(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Tooltip title="Delete Sub-Center">
              <Button 
                type="text" 
                icon={<DeleteOutlined />} 
                danger
                className="text-red-600 hover:text-red-800"
              />
            </Tooltip>
          </Popconfirm>
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
        {/* Header */}
        <div className="mb-6">
          <Title level={2} className="mb-2">
            <BankOutlined className="mr-3" />
            Sub-Centers Management
          </Title>
          <Text type="secondary" className="text-base">
            Manage and configure sub-center locations, capacity, and assignments
          </Text>
        </div>

        {/* Controls */}
        <Card className="mb-6">
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} sm={12} md={8} lg={6}>
              <Input
                placeholder="Search sub-centers..."
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                allowClear
              />
            </Col>
            <Col xs={24} sm={12} md={6} lg={4}>
              <Select
                placeholder="Filter by status"
                value={statusFilter}
                onChange={setStatusFilter}
                allowClear
                className="w-full"
                suffixIcon={<FilterOutlined />}
              >
                <Option value="active">Active</Option>
                <Option value="inactive">Inactive</Option>
                <Option value="maintenance">Maintenance</Option>
              </Select>
            </Col>
            <Col xs={24} sm={24} md={10} lg={14} className="text-right">
              <Space>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={loadSubCenters}
                  loading={loading}
                >
                  Refresh
                </Button>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleCreateSubCenter}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Add Sub-Center
                </Button>
              </Space>
            </Col>
          </Row>
        </Card>

        {/* Table */}
        <Card>
          <Table
            columns={columns}
            dataSource={filteredSubCenters}
            rowKey="id"
            loading={loading}
            pagination={{
              total: filteredSubCenters.length,
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} of ${total} sub-centers`,
            }}
            locale={{
              emptyText: (
                <div className="text-center py-8">
                  <BankOutlined className="text-4xl text-gray-400 mb-4" />
                  <Text type="secondary" className="text-lg block mb-2">
                    No sub-centers found
                  </Text>
                  <Text type="secondary">
                    Create your first sub-center to get started
                  </Text>
                </div>
              ),
            }}
          />
        </Card>

        {/* Create/Edit Modal */}
        <Modal
          title={editingSubCenter ? 'Edit Sub-Center' : 'Create New Sub-Center'}
          open={isModalVisible}
          onCancel={() => setIsModalVisible(false)}
          footer={null}
          width={600}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            autoComplete="off"
          >
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="name"
                  label="Sub-Center Name"
                  rules={[
                    { required: true, message: 'Please enter sub-center name' },
                    { min: 3, message: 'Name must be at least 3 characters' }
                  ]}
                >
                  <Input placeholder="Enter sub-center name" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="location"
                  label="Location"
                  rules={[{ required: true, message: 'Please enter location' }]}
                >
                  <Input placeholder="Enter location" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="address"
              label="Address"
              rules={[{ required: true, message: 'Please enter address' }]}
            >
              <Input.TextArea rows={3} placeholder="Enter full address" />
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="phone"
                  label="Phone Number"
                >
                  <Input placeholder="Enter phone number" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="email"
                  label="Email Address"
                  rules={[{ type: 'email', message: 'Please enter valid email' }]}
                >
                  <Input placeholder="Enter email address" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="manager"
                  label="Manager"
                >
                  <Input placeholder="Enter manager name" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="capacity"
                  label="User Capacity"
                  rules={[
                    { required: true, message: 'Please enter capacity' },
                    { type: 'number', min: 1, message: 'Capacity must be at least 1' }
                  ]}
                >
                  <Input type="number" placeholder="Enter user capacity" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="status"
              label="Status"
              rules={[{ required: true, message: 'Please select status' }]}
            >
              <Select placeholder="Select status">
                <Option value="active">Active</Option>
                <Option value="inactive">Inactive</Option>
                <Option value="maintenance">Maintenance</Option>
              </Select>
            </Form.Item>

            <Divider />

            <div className="text-right">
              <Space>
                <Button onClick={() => setIsModalVisible(false)}>
                  Cancel
                </Button>
                <Button type="primary" htmlType="submit">
                  {editingSubCenter ? 'Update' : 'Create'} Sub-Center
                </Button>
              </Space>
            </div>
          </Form>
        </Modal>
      </motion.div>
    </div>
  );
};

export default SubCentersManagement;
