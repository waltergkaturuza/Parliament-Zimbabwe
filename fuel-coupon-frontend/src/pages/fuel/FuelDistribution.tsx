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
  Tooltip,
  message
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
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import apiClient from '@/api/index';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

export default function FuelDistribution() {
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [allocateModalVisible, setAllocateModalVisible] = useState(false);
  const [selectedSubCenter, setSelectedSubCenter] = useState(null);
  const [selectedConstituency, setSelectedConstituency] = useState(null);
  const [selectedBeneficiary, setSelectedBeneficiary] = useState<any>(null);
  const [form] = Form.useForm();
  const [allocateForm] = Form.useForm();
  const [activeTab, setActiveTab] = useState('distributions');
  const queryClient = useQueryClient();

  // Real API queries to replace mock data
  const { data: subCenters, isLoading: loadingSubCenters } = useQuery({
    queryKey: ['subcenters'],
    queryFn: async () => {
      const response = await apiClient.get('/subcenters/');
      return response.data.results || response.data;
    }
  });

  const { data: distributions, isLoading: loadingDistributions } = useQuery({
    queryKey: ['distributions'],
    queryFn: async () => {
      const response = await apiClient.get('/distributions/');
      return response.data.results || response.data;
    }
  });

  // Pagination state for beneficiaries
  const [beneficiaryPage, setBeneficiaryPage] = useState(1);
  const [beneficiaryPageSize, setBeneficiaryPageSize] = useState(10);
  const [beneficiaryTotal, setBeneficiaryTotal] = useState(0);

  // Fetch all constituencies for Select field
  const { data: constituencies, isLoading: loadingConstituencies } = useQuery({
    queryKey: ['constituencies'],
    queryFn: async () => {
      // Fetch all constituencies with large page_size to ensure we get all options
      const response = await apiClient.get('/constituencies/?page_size=1000');
      return response.data.results || response.data;
    }
  });

  // Fetch all beneficiaries for dropdowns and validation (not paginated)
  const { data: allBeneficiaries, isLoading: loadingAllBeneficiaries } = useQuery({
    queryKey: ['all-beneficiaries'],
    queryFn: async () => {
      // Fetch all beneficiaries with large page_size to ensure we get all options
      const response = await apiClient.get('/beneficiaries/?page_size=10000');
      return response.data.results || response.data;
    }
  });

  // Beneficiaries with pagination for table display
  const { data: beneficiariesResponse, isLoading: loadingBeneficiaries } = useQuery({
    queryKey: ['beneficiaries', beneficiaryPage, beneficiaryPageSize],
    queryFn: async () => {
      const response = await apiClient.get('/beneficiaries/', {
        params: { page: beneficiaryPage, page_size: beneficiaryPageSize }
      });
      setBeneficiaryTotal(response.data.count || (response.data.results ? response.data.results.length : 0));
      return response.data;
    }
  });

  // Extract paginated beneficiaries for table display
  const beneficiaries = beneficiariesResponse?.results || beneficiariesResponse;

  // Mutations for creating distributions and allocations
  const createDistributionMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiClient.post('/distributions/', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['distributions'] });
      queryClient.invalidateQueries({ queryKey: ['beneficiaries'] });
      queryClient.invalidateQueries({ queryKey: ['all-beneficiaries'] });
      setCreateModalVisible(false);
      setSelectedBeneficiary(null);
      form.resetFields();
    }
  });

  const allocateBeneficiaryMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiClient.post('/beneficiary-allocations/', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beneficiaries'] });
      queryClient.invalidateQueries({ queryKey: ['all-beneficiaries'] });
      setAllocateModalVisible(false);
      allocateForm.resetFields();
    }
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
      title: 'Beneficiary',
      key: 'beneficiary',
      render: (record: any) => (
        <div className="flex items-center gap-3">
          <Avatar icon={<UserOutlined />} />
          <div>
            <Text strong>{record.name}</Text>
            <div className="text-xs text-gray-500">{record.category || 'Unknown Category'}</div>
            {record.constituency && (
              <div className="text-xs text-blue-500">{record.constituency}</div>
            )}
          </div>
        </div>
      )
    },
    {
      title: 'Location',
      dataIndex: 'constituency',
      key: 'constituency',
      render: (constituency: string) => constituency || <Text type="secondary">No Constituency</Text>
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: (category: string) => (
        <Tag color="blue">{category || 'Unknown'}</Tag>
      )
    },
    {
      title: 'Monthly Allocation',
      dataIndex: 'monthlyAllocation',
      key: 'monthlyAllocation',
      render: (allocation: number) => `${allocation || 0}L`
    },
    {
      title: 'Usage This Month',
      key: 'usage',
      render: (record: any) => {
        const used = record.usedThisMonth || 0;
        const total = record.monthlyAllocation || 0;
        const percentage = total > 0 ? (used / total) * 100 : 0;
        return (
          <div>
            <Text>{used}L / {total}L</Text>
            <Progress 
              percent={percentage} 
              size="small" 
              status={percentage > 90 ? 'exception' : percentage > 70 ? 'normal' : 'success'}
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
            Allocate
          </Button>
          <Button 
            size="small" 
            icon={<DownloadOutlined />}
          >
            History
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

  const totalBeneficiaries = allBeneficiaries?.length || 0;
  const totalMonthlyAllocation = allBeneficiaries?.reduce((sum: number, beneficiary: any) => sum + (beneficiary.monthlyAllocation || 0), 0) || 0;
  const activeDistributions = distributions?.filter((d: any) => d.status === 'IN_TRANSIT').length || 0;
  const pendingDistributions = distributions?.filter((d: any) => d.status === 'PENDING').length || 0;

  // Helper functions for allocation validation
  const getRemainingAllocation = (beneficiary: any) => {
    if (!beneficiary) return 0;
    const used = beneficiary.usedThisMonth || 0;
    const total = beneficiary.monthlyAllocation || 0;
    return Math.max(0, total - used);
  };

  const validateAllocationAmount = (amount: number, beneficiary: any) => {
    if (!beneficiary || !amount) return true;
    const remaining = getRemainingAllocation(beneficiary);
    return amount <= remaining;
  };

  const getAllocationWarningMessage = (amount: number, beneficiary: any) => {
    if (!beneficiary || !amount) return '';
    const remaining = getRemainingAllocation(beneficiary);
    if (amount > remaining) {
      return `Amount exceeds remaining allocation! Maximum available: ${remaining}L`;
    }
    if (amount > remaining * 0.8) {
      return `Warning: This will use ${((amount / beneficiary.monthlyAllocation) * 100).toFixed(1)}% of monthly allocation`;
    }
    return '';
  };

  const handleBeneficiarySelect = (beneficiaryId: string) => {
    const beneficiary = allBeneficiaries?.find((b: any) => b.id === beneficiaryId);
    setSelectedBeneficiary(beneficiary);
    
    // Reset amount field when beneficiary changes
    form.setFieldsValue({ amount: undefined });
  };

  const handleCreateDistribution = async (values: any) => {
    try {
      // Validate allocation before submitting
      if (selectedBeneficiary && !validateAllocationAmount(values.amount, selectedBeneficiary)) {
        const remaining = getRemainingAllocation(selectedBeneficiary);
        message.error(`Amount exceeds beneficiary's remaining allocation of ${remaining}L`);
        return;
      }
      
      await createDistributionMutation.mutateAsync(values);
      message.success('Fuel allocation created successfully!');
    } catch (error: any) {
      console.error('Error creating distribution:', error);
      message.error(error.message || 'Failed to create fuel allocation');
    }
  };

  const handleAllocateToBeneficiary = async (values: any) => {
    try {
      // Validate each selected beneficiary's remaining allocation
      const selectedBeneficiaryList = allBeneficiaries?.filter((b: any) => values.beneficiaries.includes(b.id)) || [];
      const invalidAllocations = selectedBeneficiaryList.filter((beneficiary: any) => 
        !validateAllocationAmount(values.amountPerBeneficiary, beneficiary)
      );
      
      if (invalidAllocations.length > 0) {
        const beneficiaryNames = invalidAllocations.map((b: any) => 
          `${b.name} (${getRemainingAllocation(b)}L remaining)`
        ).join(', ');
        message.error(`Amount exceeds remaining allocation for: ${beneficiaryNames}`);
        return;
      }
      
      await allocateBeneficiaryMutation.mutateAsync(values);
      message.success('Bulk fuel allocation created successfully!');
    } catch (error: any) {
      console.error('Error allocating to beneficiary:', error);
      message.error(error.message || 'Failed to create bulk allocation');
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
          pagination={{ 
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} distributions`,
            pageSizeOptions: ['10', '20', '50', '100']
          }}
        />
      )
    },
    {
      key: 'beneficiaries-list',
      label: (
        <span>
          <UserOutlined />
          Beneficiaries
        </span>
      ),
      children: (
        <Table
          columns={subCenterColumns}
          dataSource={beneficiaries}
          loading={loadingBeneficiaries}
          rowKey="id"
          pagination={{
            current: beneficiaryPage,
            pageSize: beneficiaryPageSize,
            total: beneficiaryTotal,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} beneficiaries`,
            pageSizeOptions: ['10', '20', '50', '100'],
            onChange: (page, pageSize) => {
              setBeneficiaryPage(page);
              setBeneficiaryPageSize(pageSize || 10);
            },
            onShowSizeChange: (current, size) => {
              setBeneficiaryPage(1); // Reset to first page when changing page size
              setBeneficiaryPageSize(size);
            }
          }}
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
          pagination={{
            current: beneficiaryPage,
            pageSize: beneficiaryPageSize,
            total: beneficiaryTotal,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} beneficiaries`,
            pageSizeOptions: ['10', '20', '50', '100'],
            onChange: (page, pageSize) => {
              setBeneficiaryPage(page);
              setBeneficiaryPageSize(pageSize || 10);
            },
            onShowSizeChange: (current, size) => {
              setBeneficiaryPage(1); // Reset to first page when changing page size
              setBeneficiaryPageSize(size);
            }
          }}
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
              title="Total Beneficiaries"
              value={totalBeneficiaries}
              prefix={<UserOutlined className="text-blue-600" />}
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
              title="Total Monthly Allocation"
              value={totalMonthlyAllocation}
              suffix="L"
              prefix={<ThunderboltOutlined className="text-purple-600" />}
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
        title="Allocate Fuel to Beneficiary"
        open={createModalVisible}
        onCancel={() => {
          setCreateModalVisible(false);
          setSelectedBeneficiary(null);
          form.resetFields();
        }}
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
                name="beneficiary"
                label="Beneficiary"
                rules={[{ required: true, message: 'Please select a beneficiary' }]}
              >
                <Select 
                  placeholder="Select beneficiary"
                  showSearch
                  optionFilterProp="children"
                  onChange={handleBeneficiarySelect}
                  filterOption={(input, option) => {
                    if (!option) return false;
                    const label = option.children?.toString().toLowerCase() || '';
                    return label.includes(input.toLowerCase());
                  }}
                >
                  {allBeneficiaries
                    ?.filter((beneficiary: any) => {
                      // If no constituency is selected, show all beneficiaries
                      if (!selectedConstituency) return true;
                      // If constituency is selected, only show beneficiaries from that constituency
                      return beneficiary.constituency === selectedConstituency;
                    })
                    ?.map((beneficiary: any) => (
                    <Option key={beneficiary.id} value={beneficiary.id}>
                      {beneficiary.name} {beneficiary.constituency ? `(${beneficiary.constituency})` : '(No Constituency)'} - {getRemainingAllocation(beneficiary)}L remaining
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
          
          {/* Beneficiary Allocation Summary */}
          {selectedBeneficiary && (
            <Card size="small" style={{ marginBottom: 16, backgroundColor: '#f6ffed', border: '1px solid #b7eb8f' }}>
              <Row gutter={16}>
                <Col span={8}>
                  <Statistic
                    title="Monthly Allocation"
                    value={selectedBeneficiary.monthlyAllocation || 0}
                    suffix="L"
                    valueStyle={{ fontSize: '16px', color: '#52c41a' }}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="Used This Month"
                    value={selectedBeneficiary.usedThisMonth || 0}
                    suffix="L"
                    valueStyle={{ fontSize: '16px', color: '#fa8c16' }}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="Remaining"
                    value={getRemainingAllocation(selectedBeneficiary)}
                    suffix="L"
                    valueStyle={{ 
                      fontSize: '16px', 
                      color: getRemainingAllocation(selectedBeneficiary) > 0 ? '#1890ff' : '#ff4d4f' 
                    }}
                  />
                </Col>
              </Row>
              <Progress 
                percent={((selectedBeneficiary.usedThisMonth || 0) / (selectedBeneficiary.monthlyAllocation || 1)) * 100}
                status={getRemainingAllocation(selectedBeneficiary) <= 0 ? 'exception' : 'normal'}
                strokeColor={getRemainingAllocation(selectedBeneficiary) <= 0 ? '#ff4d4f' : '#52c41a'}
                style={{ marginTop: 8 }}
              />
            </Card>
          )}
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="amount"
                label="Amount (Litres)"
                rules={[
                  { required: true, message: 'Please enter amount' },
                  {
                    validator: async (_, value) => {
                      if (!value || !selectedBeneficiary) return;
                      if (!validateAllocationAmount(value, selectedBeneficiary)) {
                        throw new Error(`Amount exceeds remaining allocation of ${getRemainingAllocation(selectedBeneficiary)}L`);
                      }
                    }
                  }
                ]}
                help={selectedBeneficiary && form.getFieldValue('amount') ? getAllocationWarningMessage(form.getFieldValue('amount'), selectedBeneficiary) : 
                      selectedBeneficiary ? `Remaining allocation: ${getRemainingAllocation(selectedBeneficiary)}L` : ''}
                validateStatus={selectedBeneficiary && form.getFieldValue('amount') && !validateAllocationAmount(form.getFieldValue('amount'), selectedBeneficiary) ? 'error' : ''}
              >
                <InputNumber
                  min={1}
                  max={selectedBeneficiary ? getRemainingAllocation(selectedBeneficiary) : 10000}
                  placeholder="Enter amount in litres"
                  style={{ width: '100%' }}
                  onChange={() => {
                    // Trigger re-render to update validation message
                    form.validateFields(['amount']);
                  }}
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
            name="constituency"
            label="Constituency (Optional)"
            help="Leave blank to include all beneficiaries, or select to filter by constituency"
          >
            <Select 
              placeholder="Select constituency (optional)" 
              loading={loadingConstituencies} 
              allowClear 
              showSearch
              optionFilterProp="children"
              onChange={(value) => setSelectedConstituency(value)}
              filterOption={(input, option) => {
                if (!option) return false;
                const label = option.children?.toString().toLowerCase() || '';
                return label.includes(input.toLowerCase());
              }}
            >
              {constituencies?.map((c: any) => (
                <Option key={c.id} value={c.id}>{c.name}</Option>
              ))}
            </Select>
          </Form.Item>
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
              {allBeneficiaries?.map((beneficiary: any) => (
                <Option key={beneficiary.id} value={beneficiary.id}>
                  {beneficiary.name} ({beneficiary.category}) - {getRemainingAllocation(beneficiary)}L remaining
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