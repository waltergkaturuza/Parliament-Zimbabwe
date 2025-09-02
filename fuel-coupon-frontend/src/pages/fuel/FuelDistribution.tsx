import React, { useState } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Table, 
  Button, 
  Modal, 
  Form, 
  Input, 
  Select, 
  InputNumber, 
  DatePicker, 
  Space, 
  Typography, 
  Tag, 
  Statistic, 
  Divider,
  Tabs,
  Progress,
  List,
  Avatar,
  Badge,
  Tooltip
} from 'antd';
import { 
  PlusOutlined, 
  TruckOutlined, 
  UserOutlined, 
  EnvironmentOutlined,
  ThunderboltOutlined,
  SendOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  ReloadOutlined,
  DownloadOutlined,
  UploadOutlined
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

// Mock data - replace with actual API calls
const mockSubCenters = [
  { id: 1, name: 'Harare Central', code: 'HAR001', location: 'Harare', manager: 'John Doe', capacity: 500, currentStock: 15000 },
  { id: 2, name: 'Bulawayo North', code: 'BUL001', location: 'Bulawayo', manager: 'Jane Smith', capacity: 300, currentStock: 8500 },
  { id: 3, name: 'Mutare East', code: 'MUT001', location: 'Mutare', manager: 'Peter Jones', capacity: 200, currentStock: 4200 },
  { id: 4, name: 'Gweru Central', code: 'GWE001', location: 'Gweru', manager: 'Mary Wilson', capacity: 250, currentStock: 6800 }
];

const mockDistributions = [
  {
    id: 1,
    subCenter: 'Harare Central',
    fuelType: 'PETROL',
    amount: 5000,
    date: '2025-09-01',
    status: 'DELIVERED',
    driver: 'Robert Brown',
    vehicle: 'ZBD 123 GP'
  },
  {
    id: 2,
    subCenter: 'Bulawayo North',
    fuelType: 'DIESEL',
    amount: 3000,
    date: '2025-09-02',
    status: 'IN_TRANSIT',
    driver: 'Susan Green',
    vehicle: 'ZBF 456 GP'
  },
  {
    id: 3,
    subCenter: 'Mutare East',
    fuelType: 'PETROL',
    amount: 2000,
    date: '2025-09-02',
    status: 'PENDING',
    driver: null,
    vehicle: null
  }
];

const mockBeneficiaries = [
  {
    id: 1,
    name: 'Hon. Member A',
    category: 'MP',
    constituency: 'Harare East',
    monthlyAllocation: 400,
    usedThisMonth: 320,
    lastAllocation: '2025-08-30'
  },
  {
    id: 2,
    name: 'Sen. Member B',
    category: 'SENATOR',
    constituency: 'Bulawayo',
    monthlyAllocation: 350,
    usedThisMonth: 280,
    lastAllocation: '2025-08-28'
  }
];

export default function FuelDistribution() {
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [allocateModalVisible, setAllocateModalVisible] = useState(false);
  const [selectedSubCenter, setSelectedSubCenter] = useState(null);
  const [form] = Form.useForm();
  const [allocateForm] = Form.useForm();
  const [activeTab, setActiveTab] = useState('distributions');

  // Mock queries - replace with actual API calls
  const { data: subCenters, isLoading: loadingSubCenters } = useQuery({
    queryKey: ['subCenters'],
    queryFn: () => Promise.resolve(mockSubCenters)
  });

  const { data: distributions, isLoading: loadingDistributions } = useQuery({
    queryKey: ['distributions'],
    queryFn: () => Promise.resolve(mockDistributions)
  });

  const { data: beneficiaries, isLoading: loadingBeneficiaries } = useQuery({
    queryKey: ['beneficiaries'],
    queryFn: () => Promise.resolve(mockBeneficiaries)
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DELIVERED': return 'green';
      case 'IN_TRANSIT': return 'blue';
      case 'PENDING': return 'orange';
      case 'CANCELLED': return 'red';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DELIVERED': return <CheckCircleOutlined />;
      case 'IN_TRANSIT': return <TruckOutlined />;
      case 'PENDING': return <ClockCircleOutlined />;
      case 'CANCELLED': return <ExclamationCircleOutlined />;
      default: return null;
    }
  };

  const distributionColumns = [
    {
      title: 'Sub Center',
      dataIndex: 'subCenter',
      key: 'subCenter',
      render: (text: string) => (
        <div className="flex items-center gap-2">
          <Avatar icon={<EnvironmentOutlined />} size="small" />
          <Text strong>{text}</Text>
        </div>
      )
    },
    {
      title: 'Fuel Type',
      dataIndex: 'fuelType',
      key: 'fuelType',
      render: (type: string) => (
        <Tag color={type === 'PETROL' ? 'blue' : 'orange'}>
          <ThunderboltOutlined /> {type}
        </Tag>
      )
    },
    {
      title: 'Amount (L)',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => <Text strong>{amount.toLocaleString()}</Text>
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => dayjs(date).format('DD MMM YYYY')
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)} icon={getStatusIcon(status)}>
          {status.replace('_', ' ')}
        </Tag>
      )
    },
    {
      title: 'Driver/Vehicle',
      key: 'transport',
      render: (record: any) => (
        <div>
          {record.driver ? (
            <>
              <div>{record.driver}</div>
              <Text type="secondary" className="text-xs">{record.vehicle}</Text>
            </>
          ) : (
            <Text type="secondary">Not assigned</Text>
          )}
        </div>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: any) => (
        <Space>
          <Tooltip title="View Details">
            <Button type="text" icon={<DownloadOutlined />} size="small" />
          </Tooltip>
          {record.status === 'PENDING' && (
            <Tooltip title="Assign Transport">
              <Button type="text" icon={<TruckOutlined />} size="small" />
            </Tooltip>
          )}
        </Space>
      )
    }
  ];

  const subCenterColumns = [
    {
      title: 'Sub Center',
      key: 'center',
      render: (record: any) => (
        <div className="flex items-center gap-3">
          <Avatar icon={<EnvironmentOutlined />} />
          <div>
            <Text strong>{record.name}</Text>
            <div className="text-xs text-gray-500">{record.code}</div>
          </div>
        </div>
      )
    },
    {
      title: 'Location',
      dataIndex: 'location',
      key: 'location'
    },
    {
      title: 'Manager',
      dataIndex: 'manager',
      key: 'manager',
      render: (manager: string) => (
        <div className="flex items-center gap-2">
          <Avatar icon={<UserOutlined />} size="small" />
          {manager}
        </div>
      )
    },
    {
      title: 'Capacity',
      dataIndex: 'capacity',
      key: 'capacity',
      render: (capacity: number) => `${capacity} beneficiaries`
    },
    {
      title: 'Current Stock',
      dataIndex: 'currentStock',
      key: 'currentStock',
      render: (stock: number, record: any) => {
        const percentage = (stock / (record.capacity * 100)) * 100;
        return (
          <div>
            <Text strong>{stock.toLocaleString()}L</Text>
            <Progress 
              percent={Math.min(percentage, 100)} 
              size="small" 
              status={percentage > 70 ? 'success' : percentage > 30 ? 'normal' : 'exception'}
              showInfo={false}
            />
          </div>
        );
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: any) => (
        <Space>
          <Button 
            type="primary" 
            size="small" 
            icon={<SendOutlined />}
            onClick={() => {
              setSelectedSubCenter(record);
              setCreateModalVisible(true);
            }}
          >
            Distribute
          </Button>
          <Button 
            size="small" 
            icon={<UserOutlined />}
            onClick={() => {
              setSelectedSubCenter(record);
              setAllocateModalVisible(true);
            }}
          >
            Allocate
          </Button>
        </Space>
      )
    }
  ];

  const beneficiaryColumns = [
    {
      title: 'Beneficiary',
      key: 'beneficiary',
      render: (record: any) => (
        <div className="flex items-center gap-3">
          <Avatar icon={<UserOutlined />} />
          <div>
            <Text strong>{record.name}</Text>
            <div className="flex items-center gap-2 mt-1">
              <Tag color="blue">{record.category}</Tag>
              <Text type="secondary" className="text-xs">{record.constituency}</Text>
            </div>
          </div>
        </div>
      )
    },
    {
      title: 'Monthly Allocation',
      dataIndex: 'monthlyAllocation',
      key: 'monthlyAllocation',
      render: (amount: number) => `${amount}L`
    },
    {
      title: 'Usage This Month',
      key: 'usage',
      render: (record: any) => {
        const percentage = (record.usedThisMonth / record.monthlyAllocation) * 100;
        return (
          <div>
            <Text>{record.usedThisMonth}L / {record.monthlyAllocation}L</Text>
            <Progress 
              percent={percentage} 
              size="small" 
              status={percentage > 90 ? 'exception' : percentage > 70 ? 'normal' : 'success'}
            />
          </div>
        );
      }
    },
    {
      title: 'Last Allocation',
      dataIndex: 'lastAllocation',
      key: 'lastAllocation',
      render: (date: string) => dayjs(date).format('DD MMM YYYY')
    },
    {
      title: 'Actions',
      key: 'actions',
      render: () => (
        <Space>
          <Button type="text" size="small" icon={<PlusOutlined />}>
            Allocate
          </Button>
          <Button type="text" size="small" icon={<DownloadOutlined />}>
            History
          </Button>
        </Space>
      )
    }
  ];

  const totalStock = subCenters?.reduce((sum: number, center: any) => sum + center.currentStock, 0) || 0;
  const totalCapacity = subCenters?.reduce((sum: number, center: any) => sum + (center.capacity * 100), 0) || 0;
  const activeDistributions = distributions?.filter((d: any) => d.status === 'IN_TRANSIT').length || 0;
  const pendingDistributions = distributions?.filter((d: any) => d.status === 'PENDING').length || 0;

  const handleCreateDistribution = async (values: any) => {
    try {
      console.log('Creating distribution:', values);
      // Add API call here
      setCreateModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error('Error creating distribution:', error);
    }
  };

  const handleAllocateToBeneficiary = async (values: any) => {
    try {
      console.log('Allocating to beneficiary:', values);
      // Add API call here
      setAllocateModalVisible(false);
      allocateForm.resetFields();
    } catch (error) {
      console.error('Error allocating to beneficiary:', error);
    }
  };

  const tabItems = [
    {
      key: 'distributions',
      label: (
        <span>
          <TruckOutlined />
          Distributions
          {pendingDistributions > 0 && <Badge count={pendingDistributions} offset={[10, 0]} />}
        </span>
      ),
      children: (
        <Table
          columns={distributionColumns}
          dataSource={distributions}
          loading={loadingDistributions}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      )
    },
    {
      key: 'subcenters',
      label: (
        <span>
          <EnvironmentOutlined />
          Sub Centers
        </span>
      ),
      children: (
        <Table
          columns={subCenterColumns}
          dataSource={subCenters}
          loading={loadingSubCenters}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      )
    },
    {
      key: 'beneficiaries',
      label: (
        <span>
          <UserOutlined />
          Beneficiaries
        </span>
      ),
      children: (
        <Table
          columns={beneficiaryColumns}
          dataSource={beneficiaries}
          loading={loadingBeneficiaries}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Title level={2} className="mb-2">
            <ThunderboltOutlined /> Fuel Distribution
          </Title>
          <Text type="secondary">
            Manage fuel distribution to sub-centers and beneficiaries
          </Text>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />}>
            Refresh
          </Button>
          <Button icon={<UploadOutlined />}>
            Import
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalVisible(true)}>
            New Distribution
          </Button>
        </Space>
      </div>

      {/* Statistics */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Fuel Stock"
              value={totalStock}
              suffix="L"
              prefix={<ThunderboltOutlined className="text-blue-600" />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Active Distributions"
              value={activeDistributions}
              prefix={<TruckOutlined className="text-green-600" />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Pending Distributions"
              value={pendingDistributions}
              prefix={<ClockCircleOutlined className="text-orange-600" />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Storage Utilization"
              value={Math.round((totalStock / totalCapacity) * 100)}
              suffix="%"
              prefix={<EnvironmentOutlined className="text-purple-600" />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Main Content */}
      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          size="large"
        />
      </Card>

      {/* Create Distribution Modal */}
      <Modal
        title="Create New Distribution"
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        onOk={() => form.submit()}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateDistribution}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="subCenter"
                label="Sub Center"
                rules={[{ required: true, message: 'Please select a sub center' }]}
              >
                <Select placeholder="Select sub center">
                  {subCenters?.map((center: any) => (
                    <Option key={center.id} value={center.id}>
                      {center.name} ({center.code})
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="fuelType"
                label="Fuel Type"
                rules={[{ required: true, message: 'Please select fuel type' }]}
              >
                <Select placeholder="Select fuel type">
                  <Option value="PETROL">Petrol</Option>
                  <Option value="DIESEL">Diesel</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="amount"
                label="Amount (Litres)"
                rules={[{ required: true, message: 'Please enter amount' }]}
              >
                <InputNumber
                  min={1}
                  max={10000}
                  placeholder="Enter amount in litres"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="deliveryDate"
                label="Delivery Date"
                rules={[{ required: true, message: 'Please select delivery date' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="notes"
            label="Notes"
          >
            <Input.TextArea rows={3} placeholder="Additional notes..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* Allocate to Beneficiary Modal */}
      <Modal
        title="Allocate Fuel to Beneficiaries"
        open={allocateModalVisible}
        onCancel={() => setAllocateModalVisible(false)}
        onOk={() => allocateForm.submit()}
        width={600}
      >
        <Form
          form={allocateForm}
          layout="vertical"
          onFinish={handleAllocateToBeneficiary}
        >
          <Form.Item
            name="beneficiaries"
            label="Select Beneficiaries"
            rules={[{ required: true, message: 'Please select beneficiaries' }]}
          >
            <Select
              mode="multiple"
              placeholder="Select beneficiaries"
              showSearch
              filterOption={(input, option) =>
                (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
              }
            >
              {beneficiaries?.map((beneficiary: any) => (
                <Option key={beneficiary.id} value={beneficiary.id}>
                  {beneficiary.name} ({beneficiary.category})
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="fuelType"
                label="Fuel Type"
                rules={[{ required: true, message: 'Please select fuel type' }]}
              >
                <Select placeholder="Select fuel type">
                  <Option value="PETROL">Petrol</Option>
                  <Option value="DIESEL">Diesel</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="amountPerBeneficiary"
                label="Amount per Beneficiary (L)"
                rules={[{ required: true, message: 'Please enter amount' }]}
              >
                <InputNumber
                  min={1}
                  max={500}
                  placeholder="Litres"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="reason"
            label="Allocation Reason"
            rules={[{ required: true, message: 'Please provide reason' }]}
          >
            <Select placeholder="Select reason">
              <Option value="MONTHLY_ALLOCATION">Monthly Allocation</Option>
              <Option value="PARLIAMENT_SESSION">Parliament Session</Option>
              <Option value="COMMITTEE_MEETING">Committee Meeting</Option>
              <Option value="CONSTITUENCY_WORK">Constituency Work</Option>
              <Option value="SPECIAL_EVENT">Special Event</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}