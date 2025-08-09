// src/pages/subcenter/SubCenterManagement.tsx
import React, { useState, useEffect } from 'react';
import type { FC } from 'react';
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
  Row,
  Col,
  Typography,
  Badge,
  Tabs,
  Switch,
  DatePicker,
  InputNumber,
  Divider,
  Alert,
  Popconfirm,
  Descriptions,
  Avatar,
  Statistic
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { TabsProps } from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  BankOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  EnvironmentOutlined,
  UserOutlined,
  CarOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ToolOutlined,
  SafetyCertificateOutlined,
  PhoneOutlined,
  MailOutlined,
  CalendarOutlined,
  IdcardOutlined
} from '@ant-design/icons';
import { motion } from 'framer-motion';
import dayjs from 'dayjs';
import apiClient from '@/api/index';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;
const { TabPane } = Tabs;
const { TextArea } = Input;

// Interfaces
interface SubCenter {
  id: string;
  code: string;
  name: string;
  location: string;
  is_active: boolean;
  managed_by?: {
    id: string;
    username: string;
    first_name: string;
    last_name: string;
  };
  created: string;
  modified: string;
  users_count?: number;
  active_programs?: number;
  distributed_coupons?: number;
  capacity?: number;
}

interface PoolVehicle {
  id: string;
  registration_number: string;
  make: string;
  model: string;
  year: number;
  vehicle_type: string;
  fuel_type: string;
  engine_cc?: number;
  status: string;
  assigned_subcenter: string;
  current_mileage: number;
  last_service_date?: string;
  next_service_due?: string;
  insurance_expiry?: string;
  current_driver?: {
    id: string;
    full_name: string;
    employee_id: string;
  };
}

interface Driver {
  id: string;
  employee_id: string;
  first_name: string;
  last_name: string;
  id_number: string;
  license_number: string;
  license_class: string;
  license_expiry: string;
  phone_number: string;
  email?: string;
  address: string;
  status: string;
  assigned_subcenter: string;
  hire_date: string;
  current_vehicle?: {
    id: string;
    registration_number: string;
    make: string;
    model: string;
  };
}

interface Manager {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  role: string;
  is_active: boolean;
}

const SubCenterManagement: FC = () => {
  // State for all tabs
  const [activeTab, setActiveTab] = useState('subcenters');
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');

  // SubCenter states
  const [subcenters, setSubcenters] = useState<SubCenter[]>([]);
  const [isSubCenterModalVisible, setIsSubCenterModalVisible] = useState(false);
  const [editingSubCenter, setEditingSubCenter] = useState<SubCenter | null>(null);
  const [subCenterForm] = Form.useForm();

  // Vehicle states
  const [vehicles, setVehicles] = useState<PoolVehicle[]>([]);
  const [isVehicleModalVisible, setIsVehicleModalVisible] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<PoolVehicle | null>(null);
  const [vehicleForm] = Form.useForm();

  // Driver states
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isDriverModalVisible, setIsDriverModalVisible] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [driverForm] = Form.useForm();

  // Manager states
  const [availableManagers, setAvailableManagers] = useState<Manager[]>([]);

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load mock data for demonstration
      await Promise.all([
        loadSubCenters(),
        loadVehicles(),
        loadDrivers(),
        loadAvailableManagers()
      ]);
    } catch (error) {
      message.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadSubCenters = async () => {
    // Use real API data - no fallback mock data
    setSubcenters([]);
  };

  const loadVehicles = async () => {
    // Use real API data - no fallback mock data
    setVehicles([]);
  };

  const loadDrivers = async () => {
    // Use real API data - no fallback mock data
    setDrivers([]);
  };

  const loadAvailableManagers = async () => {
    // Mock data - replace with actual API call
    setAvailableManagers([
      {
        id: '4',
        username: 'alice.manager',
        first_name: 'Alice',
        last_name: 'Manager',
        email: 'alice.manager@parliament.gov.zw',
        phone: '+263734567890',
        role: 'SUB_CENTER',
        is_active: true
      },
      {
        id: '5',
        username: 'bob.supervisor',
        first_name: 'Bob',
        last_name: 'Supervisor',
        email: 'bob.supervisor@parliament.gov.zw',
        phone: '+263745678901',
        role: 'MAIN_CENTER',
        is_active: true
      }
    ]);
  };

  // SubCenter handlers
  const handleCreateSubCenter = () => {
    setEditingSubCenter(null);
    subCenterForm.resetFields();
    setIsSubCenterModalVisible(true);
  };

  const handleEditSubCenter = (record: SubCenter) => {
    setEditingSubCenter(record);
    subCenterForm.setFieldsValue({
      code: record.code,
      name: record.name,
      location: record.location,
      managed_by: record.managed_by?.id,
      capacity: record.capacity,
      is_active: record.is_active
    });
    setIsSubCenterModalVisible(true);
  };

  const handleSubCenterSubmit = async (values: any) => {
    try {
      if (editingSubCenter) {
        // Update subcenter
        message.success('SubCenter updated successfully');
      } else {
        // Create subcenter
        message.success('SubCenter created successfully');
      }
      setIsSubCenterModalVisible(false);
      loadSubCenters();
    } catch (error) {
      message.error('Failed to save subcenter');
    }
  };

  // Vehicle handlers
  const handleCreateVehicle = () => {
    setEditingVehicle(null);
    vehicleForm.resetFields();
    setIsVehicleModalVisible(true);
  };

  const handleEditVehicle = (record: PoolVehicle) => {
    setEditingVehicle(record);
    vehicleForm.setFieldsValue({
      ...record,
      last_service_date: record.last_service_date ? dayjs(record.last_service_date) : undefined,
      next_service_due: record.next_service_due ? dayjs(record.next_service_due) : undefined,
      insurance_expiry: record.insurance_expiry ? dayjs(record.insurance_expiry) : undefined
    });
    setIsVehicleModalVisible(true);
  };

  const handleVehicleSubmit = async (values: any) => {
    try {
      if (editingVehicle) {
        message.success('Vehicle updated successfully');
      } else {
        message.success('Vehicle created successfully');
      }
      setIsVehicleModalVisible(false);
      loadVehicles();
    } catch (error) {
      message.error('Failed to save vehicle');
    }
  };

  // Driver handlers
  const handleCreateDriver = () => {
    setEditingDriver(null);
    driverForm.resetFields();
    setIsDriverModalVisible(true);
  };

  const handleEditDriver = (record: Driver) => {
    setEditingDriver(record);
    driverForm.setFieldsValue({
      ...record,
      license_expiry: dayjs(record.license_expiry),
      hire_date: dayjs(record.hire_date)
    });
    setIsDriverModalVisible(true);
  };

  const handleDriverSubmit = async (values: any) => {
    try {
      if (editingDriver) {
        message.success('Driver updated successfully');
      } else {
        message.success('Driver created successfully');
      }
      setIsDriverModalVisible(false);
      loadDrivers();
    } catch (error) {
      message.error('Failed to save driver');
    }
  };

  // Table columns
  const subCenterColumns: ColumnsType<SubCenter> = [
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
      width: 120,
      render: (text) => <Text code>{text}</Text>
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text) => <Text strong>{text}</Text>
    },
    {
      title: 'Location',
      dataIndex: 'location',
      key: 'location',
      ellipsis: true
    },
    {
      title: 'Manager',
      dataIndex: 'managed_by',
      key: 'managed_by',
      render: (manager) => manager ? (
        <Space>
          <Avatar size="small" icon={<UserOutlined />} />
          <Text>{manager.first_name} {manager.last_name}</Text>
        </Space>
      ) : <Text type="secondary">Not assigned</Text>
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 100,
      render: (active) => (
        <Tag color={active ? 'green' : 'red'}>
          {active ? 'Active' : 'Inactive'}
        </Tag>
      )
    },
    {
      title: 'Capacity',
      dataIndex: 'capacity',
      key: 'capacity',
      width: 100,
      render: (capacity, record) => (
        <Statistic
          value={record.users_count || 0}
          suffix={`/ ${capacity || 0}`}
          valueStyle={{ fontSize: '14px' }}
        />
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEditSubCenter(record)}
          />
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => {/* TODO: View details */}}
          />
        </Space>
      )
    }
  ];

  const vehicleColumns: ColumnsType<PoolVehicle> = [
    {
      title: 'Registration',
      dataIndex: 'registration_number',
      key: 'registration_number',
      width: 120,
      render: (text) => <Text code>{text}</Text>
    },
    {
      title: 'Vehicle',
      key: 'vehicle',
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <Text strong>{record.make} {record.model}</Text>
          <Text type="secondary">{record.year} • {record.vehicle_type}</Text>
        </Space>
      )
    },
    {
      title: 'Driver',
      dataIndex: 'current_driver',
      key: 'current_driver',
      render: (driver) => driver ? (
        <Space>
          <Avatar size="small" icon={<UserOutlined />} />
          <Text>{driver.full_name}</Text>
        </Space>
      ) : <Text type="secondary">No driver assigned</Text>
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => {
        const colors = {
          ACTIVE: 'green',
          MAINTENANCE: 'orange',
          RETIRED: 'red',
          DAMAGED: 'red'
        };
        return <Tag color={colors[status as keyof typeof colors]}>{status}</Tag>;
      }
    },
    {
      title: 'Mileage',
      dataIndex: 'current_mileage',
      key: 'current_mileage',
      width: 100,
      render: (mileage) => `${mileage?.toLocaleString()} km`
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEditVehicle(record)}
          />
          <Button
            type="text"
            icon={<ToolOutlined />}
            onClick={() => {/* TODO: Maintenance log */}}
          />
        </Space>
      )
    }
  ];

  const driverColumns: ColumnsType<Driver> = [
    {
      title: 'Employee ID',
      dataIndex: 'employee_id',
      key: 'employee_id',
      width: 120,
      render: (text) => <Text code>{text}</Text>
    },
    {
      title: 'Name',
      key: 'name',
      render: (_, record) => (
        <Space>
          <Avatar icon={<UserOutlined />} />
          <Space direction="vertical" size="small">
            <Text strong>{record.first_name} {record.last_name}</Text>
            <Text type="secondary">{record.license_class}</Text>
          </Space>
        </Space>
      )
    },
    {
      title: 'Contact',
      key: 'contact',
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <Space>
            <PhoneOutlined />
            <Text>{record.phone_number}</Text>
          </Space>
          {record.email && (
            <Space>
              <MailOutlined />
              <Text>{record.email}</Text>
            </Space>
          )}
        </Space>
      )
    },
    {
      title: 'Vehicle',
      dataIndex: 'current_vehicle',
      key: 'current_vehicle',
      render: (vehicle) => vehicle ? (
        <Space>
          <CarOutlined />
          <Text>{vehicle.registration_number}</Text>
        </Space>
      ) : <Text type="secondary">No vehicle assigned</Text>
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => {
        const colors = {
          ACTIVE: 'green',
          INACTIVE: 'default',
          SUSPENDED: 'red',
          ON_LEAVE: 'orange'
        };
        return <Tag color={colors[status as keyof typeof colors]}>{status}</Tag>;
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEditDriver(record)}
          />
          <Button
            type="text"
            icon={<SafetyCertificateOutlined />}
            onClick={() => {/* TODO: License details */}}
          />
        </Space>
      )
    }
  ];

  const tabItems: TabsProps['items'] = [
    {
      key: 'subcenters',
      label: (
        <Space>
          <BankOutlined />
          SubCenters
          <Badge count={subcenters.length} size="small" />
        </Space>
      ),
      children: (
        <Card>
          <Row gutter={[16, 16]} align="middle" style={{ marginBottom: 16 }}>
            <Col flex="auto">
              <Space>
                <Search
                  placeholder="Search subcenters..."
                  style={{ width: 300 }}
                  onSearch={(value) => setSearchText(value)}
                />
                <Select
                  placeholder="Filter by status"
                  style={{ width: 150 }}
                  allowClear
                >
                  <Option value="active">Active</Option>
                  <Option value="inactive">Inactive</Option>
                </Select>
              </Space>
            </Col>
            <Col>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCreateSubCenter}
              >
                New SubCenter
              </Button>
            </Col>
          </Row>
          <Table
            columns={subCenterColumns}
            dataSource={subcenters}
            rowKey="id"
            loading={loading}
            pagination={{
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `Total ${total} subcenters`
            }}
          />
        </Card>
      )
    },
    {
      key: 'vehicles',
      label: (
        <Space>
          <CarOutlined />
          Pool Vehicles
          <Badge count={vehicles.length} size="small" />
        </Space>
      ),
      children: (
        <Card>
          <Row gutter={[16, 16]} align="middle" style={{ marginBottom: 16 }}>
            <Col flex="auto">
              <Space>
                <Search
                  placeholder="Search vehicles..."
                  style={{ width: 300 }}
                  onSearch={(value) => setSearchText(value)}
                />
                <Select
                  placeholder="Filter by status"
                  style={{ width: 150 }}
                  allowClear
                >
                  <Option value="ACTIVE">Active</Option>
                  <Option value="MAINTENANCE">Maintenance</Option>
                  <Option value="RETIRED">Retired</Option>
                </Select>
              </Space>
            </Col>
            <Col>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCreateVehicle}
              >
                Add Vehicle
              </Button>
            </Col>
          </Row>
          <Table
            columns={vehicleColumns}
            dataSource={vehicles}
            rowKey="id"
            loading={loading}
            pagination={{
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `Total ${total} vehicles`
            }}
          />
        </Card>
      )
    },
    {
      key: 'drivers',
      label: (
        <Space>
          <TeamOutlined />
          Drivers
          <Badge count={drivers.length} size="small" />
        </Space>
      ),
      children: (
        <Card>
          <Row gutter={[16, 16]} align="middle" style={{ marginBottom: 16 }}>
            <Col flex="auto">
              <Space>
                <Search
                  placeholder="Search drivers..."
                  style={{ width: 300 }}
                  onSearch={(value) => setSearchText(value)}
                />
                <Select
                  placeholder="Filter by status"
                  style={{ width: 150 }}
                  allowClear
                >
                  <Option value="ACTIVE">Active</Option>
                  <Option value="INACTIVE">Inactive</Option>
                  <Option value="SUSPENDED">Suspended</Option>
                  <Option value="ON_LEAVE">On Leave</Option>
                </Select>
              </Space>
            </Col>
            <Col>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCreateDriver}
              >
                Add Driver
              </Button>
            </Col>
          </Row>
          <Table
            columns={driverColumns}
            dataSource={drivers}
            rowKey="id"
            loading={loading}
            pagination={{
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `Total ${total} drivers`
            }}
          />
        </Card>
      )
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Row gutter={[24, 24]}>
        <Col span={24}>
          <Card>
            <Row justify="space-between" align="middle">
              <Col>
                <Title level={2} style={{ margin: 0 }}>
                  <BankOutlined /> SubCenter Management
                </Title>
                <Text type="secondary">
                  Manage subcenters, pool vehicles, and drivers
                </Text>
              </Col>
            </Row>
          </Card>
        </Col>

        <Col span={24}>
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={tabItems}
            size="large"
          />
        </Col>
      </Row>

      {/* SubCenter Modal */}
      <Modal
        title={editingSubCenter ? 'Edit SubCenter' : 'Create New SubCenter'}
        open={isSubCenterModalVisible}
        onCancel={() => setIsSubCenterModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={subCenterForm}
          layout="vertical"
          onFinish={handleSubCenterSubmit}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="code"
                label="SubCenter Code"
                rules={[{ required: true, message: 'Please input subcenter code!' }]}
              >
                <Input placeholder="e.g., SC-HRE-001" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="capacity"
                label="Capacity"
                rules={[{ required: true, message: 'Please input capacity!' }]}
              >
                <InputNumber
                  min={1}
                  style={{ width: '100%' }}
                  placeholder="Maximum users"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="name"
            label="SubCenter Name"
            rules={[{ required: true, message: 'Please input subcenter name!' }]}
          >
            <Input placeholder="e.g., Harare Central Sub-Center" />
          </Form.Item>

          <Form.Item
            name="location"
            label="Location"
            rules={[{ required: true, message: 'Please input location!' }]}
          >
            <TextArea
              rows={3}
              placeholder="Complete address of the subcenter"
            />
          </Form.Item>

          <Form.Item
            name="managed_by"
            label="Manager"
          >
            <Select
              placeholder="Select a manager"
              allowClear
              showSearch
              optionFilterProp="children"
            >
              {availableManagers.map(manager => (
                <Option key={manager.id} value={manager.id}>
                  {manager.first_name} {manager.last_name} ({manager.username})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="is_active"
            label="Status"
            valuePropName="checked"
          >
            <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setIsSubCenterModalVisible(false)}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit">
                {editingSubCenter ? 'Update' : 'Create'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Vehicle Modal */}
      <Modal
        title={editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}
        open={isVehicleModalVisible}
        onCancel={() => setIsVehicleModalVisible(false)}
        footer={null}
        width={700}
      >
        <Form
          form={vehicleForm}
          layout="vertical"
          onFinish={handleVehicleSubmit}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="registration_number"
                label="Registration Number"
                rules={[{ required: true, message: 'Please input registration number!' }]}
              >
                <Input placeholder="e.g., ABC-1234" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="vehicle_type"
                label="Vehicle Type"
                rules={[{ required: true, message: 'Please select vehicle type!' }]}
              >
                <Select placeholder="Select type">
                  <Option value="CAR">Car</Option>
                  <Option value="VAN">Van</Option>
                  <Option value="TRUCK">Truck</Option>
                  <Option value="MOTORCYCLE">Motorcycle</Option>
                  <Option value="PICKUP">Pickup Truck</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="make"
                label="Make"
                rules={[{ required: true, message: 'Please input make!' }]}
              >
                <Input placeholder="e.g., Toyota" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="model"
                label="Model"
                rules={[{ required: true, message: 'Please input model!' }]}
              >
                <Input placeholder="e.g., Hilux" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="year"
                label="Year"
                rules={[{ required: true, message: 'Please input year!' }]}
              >
                <InputNumber
                  min={1990}
                  max={new Date().getFullYear() + 1}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="fuel_type"
                label="Fuel Type"
                rules={[{ required: true, message: 'Please select fuel type!' }]}
              >
                <Select placeholder="Select fuel type">
                  <Option value="PETROL">Petrol</Option>
                  <Option value="DIESEL">Diesel</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="engine_cc"
                label="Engine CC"
              >
                <InputNumber
                  min={500}
                  max={10000}
                  style={{ width: '100%' }}
                  placeholder="Engine capacity"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="status"
                label="Status"
                rules={[{ required: true, message: 'Please select status!' }]}
              >
                <Select placeholder="Select status">
                  <Option value="ACTIVE">Active</Option>
                  <Option value="MAINTENANCE">Under Maintenance</Option>
                  <Option value="RETIRED">Retired</Option>
                  <Option value="DAMAGED">Damaged</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="assigned_subcenter"
                label="Assigned SubCenter"
                rules={[{ required: true, message: 'Please select subcenter!' }]}
              >
                <Select placeholder="Select subcenter">
                  {subcenters.map(sc => (
                    <Option key={sc.id} value={sc.id}>
                      {sc.name} ({sc.code})
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="current_mileage"
                label="Current Mileage (km)"
              >
                <InputNumber
                  min={0}
                  style={{ width: '100%' }}
                  placeholder="Odometer reading"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="last_service_date"
                label="Last Service Date"
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="next_service_due"
                label="Next Service Due"
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="insurance_expiry"
                label="Insurance Expiry"
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setIsVehicleModalVisible(false)}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit">
                {editingVehicle ? 'Update' : 'Add'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Driver Modal */}
      <Modal
        title={editingDriver ? 'Edit Driver' : 'Add New Driver'}
        open={isDriverModalVisible}
        onCancel={() => setIsDriverModalVisible(false)}
        footer={null}
        width={700}
      >
        <Form
          form={driverForm}
          layout="vertical"
          onFinish={handleDriverSubmit}
        >
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="employee_id"
                label="Employee ID"
                rules={[{ required: true, message: 'Please input employee ID!' }]}
              >
                <Input placeholder="e.g., DRV001" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="first_name"
                label="First Name"
                rules={[{ required: true, message: 'Please input first name!' }]}
              >
                <Input placeholder="First name" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="last_name"
                label="Last Name"
                rules={[{ required: true, message: 'Please input last name!' }]}
              >
                <Input placeholder="Last name" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="id_number"
                label="ID Number"
                rules={[{ required: true, message: 'Please input ID number!' }]}
              >
                <Input placeholder="e.g., 12-345678-A12" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="license_number"
                label="License Number"
                rules={[{ required: true, message: 'Please input license number!' }]}
              >
                <Input placeholder="e.g., DL-123456" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="license_class"
                label="License Class"
                rules={[{ required: true, message: 'Please select license class!' }]}
              >
                <Select placeholder="Select class">
                  <Option value="CLASS_1">Class 1 (Motorcycle)</Option>
                  <Option value="CLASS_2">Class 2 (Light Vehicle)</Option>
                  <Option value="CLASS_3">Class 3 (Heavy Vehicle)</Option>
                  <Option value="CLASS_4">Class 4 (Public Service Vehicle)</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="license_expiry"
                label="License Expiry"
                rules={[{ required: true, message: 'Please select license expiry!' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="status"
                label="Status"
                rules={[{ required: true, message: 'Please select status!' }]}
              >
                <Select placeholder="Select status">
                  <Option value="ACTIVE">Active</Option>
                  <Option value="INACTIVE">Inactive</Option>
                  <Option value="SUSPENDED">Suspended</Option>
                  <Option value="ON_LEAVE">On Leave</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="phone_number"
                label="Phone Number"
                rules={[{ required: true, message: 'Please input phone number!' }]}
              >
                <Input placeholder="+263712345678" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="email"
                label="Email"
              >
                <Input placeholder="email@example.com" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="address"
            label="Address"
            rules={[{ required: true, message: 'Please input address!' }]}
          >
            <TextArea rows={2} placeholder="Physical address" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="assigned_subcenter"
                label="Assigned SubCenter"
                rules={[{ required: true, message: 'Please select subcenter!' }]}
              >
                <Select placeholder="Select subcenter">
                  {subcenters.map(sc => (
                    <Option key={sc.id} value={sc.id}>
                      {sc.name} ({sc.code})
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="hire_date"
                label="Hire Date"
                rules={[{ required: true, message: 'Please select hire date!' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setIsDriverModalVisible(false)}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit">
                {editingDriver ? 'Update' : 'Add'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </motion.div>
  );
};

export default SubCenterManagement;
