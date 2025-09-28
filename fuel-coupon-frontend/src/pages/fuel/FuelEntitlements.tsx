// src/pages/fuel/FuelEntitlements.tsx
import { useState, useEffect } from 'react';
import type { FC } from 'react';
import type { Dayjs } from 'dayjs';
import {
  Card,
  Table,
  Button,
  Space,
  Form,
  Input,
  DatePicker,
  Select,
  Modal,
  Tag,
  Spin,
  Typography,
  Row,
  Col,
  Statistic,
  Popconfirm,
  Tooltip,
  InputNumber,
  Badge,
  Alert,
  Tabs,
  Descriptions,
  message,
  Progress,
  Dropdown,
  Menu
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckOutlined,
  CloseOutlined,
  DownloadOutlined,
  FilterOutlined,
  ReloadOutlined,
  UserOutlined,
  CalendarOutlined,
  ThunderboltOutlined,
  WarningOutlined,
  FileTextOutlined,
  BulbOutlined,
  HistoryOutlined,
  AuditOutlined
} from '@ant-design/icons';
import { FuelEntitlementsService, type FuelEntitlement, type FuelEntitlementStats, type CreateEntitlementData } from '../../api/fuelEntitlements';
import { SessionService } from '../../api/sessions';
import { ProgramService } from '../../api/programs';
import { adminService } from '../../api/admin';
import type { ParliamentSession, User, Program } from '../../types';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { TabPane } = Tabs;

interface FuelEntitlementsPageProps {}

const FuelEntitlements: FC<FuelEntitlementsPageProps> = () => {
  // State management
  const [loading, setLoading] = useState(true);

  // --- Category filter and multi-select logic ---
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  const [selectedBeneficiaryIds, setSelectedBeneficiaryIds] = useState<string[]>([]);
  const [entitlements, setEntitlements] = useState<FuelEntitlement[]>([]);
  const [stats, setStats] = useState<FuelEntitlementStats>({
    total_entitlements: 0,
    pending_entitlements: 0,
    approved_entitlements: 0,
    expired_entitlements: 0,
    total_litres_entitled: 0,
    total_litres_allocated: 0,
    allocation_percentage: 0
  });
  const [beneficiaries, setBeneficiaries] = useState<User[]>([]);
  const [sessions, setSessions] = useState<ParliamentSession[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  
  // Modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [bulkModalVisible, setBulkModalVisible] = useState(false);
  const [monthlyModalVisible, setMonthlyModalVisible] = useState(false);
  const [editingEntitlement, setEditingEntitlement] = useState<FuelEntitlement | null>(null);
  
  // Forms
  const [form] = Form.useForm();
  const [bulkForm] = Form.useForm();
  const [monthlyForm] = Form.useForm();
  
  // Filters and pagination
  const [filters, setFilters] = useState({
    beneficiary: '',
    entitlement_type: '',
    status: '',
    session: '',
    search: ''
  });
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0
  });
  
  // Active tab
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadEntitlements();
  }, [filters, dateRange, pagination.current, activeTab]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [statsData, beneficiariesData, sessionsData, programsData] = await Promise.all([
        FuelEntitlementsService.getStats(),
        adminService.getUsers({ role: 'BENEFICIARY', is_active: true }),
        SessionService.getSessions({ status: 'active' }),
        ProgramService.getPrograms({ is_active: true })
      ]);
      
      setStats(statsData);
      setBeneficiaries((beneficiariesData.results || beneficiariesData) as unknown as User[]);
      setSessions(sessionsData.results || sessionsData);
      setPrograms(programsData.results || programsData);
    } catch (error) {
      console.error('Error loading initial data:', error);
      message.error('Failed to load initial data');
    } finally {
      setLoading(false);
    }
  };

  const loadEntitlements = async () => {
    try {
      setLoading(true);
      
      let params: any = {
        ...filters,
        page: pagination.current,
        page_size: pagination.pageSize
      };
      
      // Add date range to params
      if (dateRange) {
        params.period_start = dateRange[0].format('YYYY-MM-DD');
        params.period_end = dateRange[1].format('YYYY-MM-DD');
      }
      
      // Apply tab-specific filters
      if (activeTab === 'pending') {
        params.status = 'PENDING';
      } else if (activeTab === 'approved') {
        params.status = 'APPROVED';
      } else if (activeTab === 'expired') {
        params.status = 'EXPIRED';
      }
      
      const response = await FuelEntitlementsService.getEntitlements(params);
      setEntitlements(response.results);
      setPagination(prev => ({
        ...prev,
        total: response.count
      }));
    } catch (error) {
      console.error('Error loading entitlements:', error);
      message.error('Failed to load entitlements');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingEntitlement(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (entitlement: FuelEntitlement) => {
    setEditingEntitlement(entitlement);
    form.setFieldsValue({
      beneficiary: entitlement.beneficiary?.id,
      entitlement_type: entitlement.entitlement_type,
      litres_entitled: entitlement.litres_entitled,
      period_start: dayjs(entitlement.period_start),
      period_end: dayjs(entitlement.period_end),
      justification: entitlement.justification,
      notes: entitlement.notes,
      session: entitlement.session?.id
    });
    setModalVisible(true);
  };

  const handleSubmit = async (values: any) => {
    console.log('🚀 FuelEntitlements handleSubmit called with:', values);
    
    try {
      // Pre-flight authentication check
      const token = localStorage.getItem('access_token');
      console.log('Auth check - token exists:', !!token);
      
      if (!token) {
        message.error('Authentication required. Please log in again.');
        console.warn('❌ No authentication token found');
        return;
      }

      // Check if token is expired
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const now = Math.floor(Date.now() / 1000);
        if (payload.exp < now) {
          message.error('Session expired. Please log in again.');
          console.warn('❌ Authentication token expired');
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          return;
        }
        console.log('✅ Authentication token is valid');
      } catch (tokenError) {
        console.error('❌ Invalid token format:', tokenError);
        message.error('Invalid authentication token. Please log in again.');
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        return;
      }

      const entitlementData: CreateEntitlementData = {
        beneficiary: values.beneficiary,
        entitlement_type: values.entitlement_type,
        litres_entitled: values.litres_entitled,
        period_start: values.period_start.format('YYYY-MM-DD'),
        period_end: values.period_end.format('YYYY-MM-DD'),
        justification: values.justification,
        notes: values.notes,
        session: values.session
      };

      console.log('📝 Submitting entitlement data:', entitlementData);

      if (editingEntitlement) {
        console.log('✏️ Updating entitlement:', editingEntitlement.id);
        await FuelEntitlementsService.updateEntitlement(editingEntitlement.id, entitlementData);
        message.success('Entitlement updated successfully');
      } else {
        console.log('➕ Creating new entitlement');
        await FuelEntitlementsService.createEntitlement(entitlementData);
        message.success('Entitlement created successfully');
      }

      setModalVisible(false);
      setEditingEntitlement(null);
      form.resetFields();
      await Promise.all([loadEntitlements(), loadInitialData()]);
      
    } catch (error: any) {
      console.error('❌ Error saving entitlement:', error);
      
      // Enhanced error handling with specific messages
      if (error?.response?.status === 401) {
        message.error('Authentication failed. Please log out and log in again.');
        console.error('🔐 Authentication error:', error.response.data);
      } else if (error?.response?.status === 400) {
        // Handle validation errors
        const errorData = error.response.data;
        if (typeof errorData === 'object' && errorData !== null) {
          const errorMessages = Object.entries(errorData)
            .map(([field, messages]: [string, any]) => {
              const msgArray = Array.isArray(messages) ? messages : [messages];
              return `${field}: ${msgArray.join(', ')}`;
            })
            .join('; ');
          message.error(`Validation error: ${errorMessages}`);
          console.error('📝 Validation errors:', errorData);
        } else {
          message.error(`Bad request: ${errorData || 'Unknown validation error'}`);
        }
      } else if (error?.response?.status === 403) {
        message.error('You do not have permission to perform this action.');
        console.error('🚫 Permission error:', error.response.data);
      } else if (error?.response?.status === 404) {
        message.error('Fuel entitlements endpoint not found. Please contact support.');
        console.error('🔍 Not found error:', error.response.data);
      } else if (error?.response?.status >= 500) {
        message.error('Server error occurred. Please try again later or contact support.');
        console.error('🔥 Server error:', error.response.data);
      } else if (error?.code === 'NETWORK_ERROR' || error?.message?.includes('Network Error')) {
        message.error('Network connection failed. Please check your internet connection.');
        console.error('🌐 Network error:', error.message);
      } else if (error?.code === 'TIMEOUT') {
        message.error('Request timed out. Please try again.');
        console.error('⏰ Timeout error:', error.message);
      } else {
        // Generic error fallback
        const errorMsg = error?.response?.data?.detail || 
                        error?.response?.data?.message ||
                        error?.message || 
                        'An unexpected error occurred';
        message.error(`Failed to save entitlement: ${errorMsg}`);
        console.error('❓ Unknown error:', error);
      }
    }
  };

  const handleDelete = async (entitlementId: string) => {
    try {
      await FuelEntitlementsService.deleteEntitlement(entitlementId);
      message.success('Entitlement deleted successfully');
      await Promise.all([loadEntitlements(), loadInitialData()]);
    } catch (error) {
      console.error('Error deleting entitlement:', error);
      message.error('Failed to delete entitlement');
    }
  };

  const handleApprove = async (entitlementId: string) => {
    try {
      await FuelEntitlementsService.approveEntitlement(entitlementId);
      message.success('Entitlement approved successfully');
      await Promise.all([loadEntitlements(), loadInitialData()]);
    } catch (error) {
      console.error('Error approving entitlement:', error);
      message.error('Failed to approve entitlement');
    }
  };

  const handleReject = async (entitlementId: string, reason: string) => {
    try {
      await FuelEntitlementsService.rejectEntitlement(entitlementId, reason);
      message.success('Entitlement rejected');
      await Promise.all([loadEntitlements(), loadInitialData()]);
    } catch (error) {
      console.error('Error rejecting entitlement:', error);
      message.error('Failed to reject entitlement');
    }
  };

  const handleBulkCreate = async (values: any) => {
    try {
      const bulkData = {
        entitlement_type: values.entitlement_type,
        period_start: values.period_start.format('YYYY-MM-DD'),
        period_end: values.period_end.format('YYYY-MM-DD'),
        justification: values.justification,
        session: values.session,
        beneficiaries: values.beneficiaries.map((b: any) => ({
          beneficiary_id: b.beneficiary_id,
          litres_entitled: b.litres_entitled,
          notes: b.notes
        }))
      };

      const result = await FuelEntitlementsService.bulkCreateEntitlements(bulkData);
      message.success(`Created ${result.created_count} entitlements successfully`);
      
      if (result.errors && result.errors.length > 0) {
        message.warning(`Some errors occurred: ${result.errors.join(', ')}`);
      }

      setBulkModalVisible(false);
      bulkForm.resetFields();
      await Promise.all([loadEntitlements(), loadInitialData()]);
    } catch (error) {
      console.error('Error bulk creating entitlements:', error);
      message.error('Failed to create bulk entitlements');
    }
  };

  const handleGenerateMonthly = async (values: any) => {
    try {
      const result = await FuelEntitlementsService.generateMonthlyEntitlements({
        month: values.month,
        year: values.year,
        notes: values.notes
      });
      
      message.success(`Generated ${result.created_count} monthly entitlements`);
      
      if (result.errors && result.errors.length > 0) {
        message.warning(`Some errors occurred: ${result.errors.join(', ')}`);
      }

      setMonthlyModalVisible(false);
      monthlyForm.resetFields();
      await Promise.all([loadEntitlements(), loadInitialData()]);
    } catch (error) {
      console.error('Error generating monthly entitlements:', error);
      message.error('Failed to generate monthly entitlements');
    }
  };

  const handleExport = async (format: 'csv' | 'excel' | 'pdf') => {
    try {
      const blob = await FuelEntitlementsService.exportEntitlements({
        format,
        ...filters,
        ...(dateRange ? {
          period_start: dateRange[0].format('YYYY-MM-DD'),
          period_end: dateRange[1].format('YYYY-MM-DD')
        } : {})
      });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `fuel-entitlements.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      message.success(`Entitlements exported as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Error exporting entitlements:', error);
      message.error('Failed to export entitlements');
    }
  };

  const columns = [
    {
      title: 'Beneficiary',
      key: 'beneficiary',
      render: (record: FuelEntitlement) => (
        <div>
          <div className="font-medium">{record.beneficiary?.full_name || 'Unknown'}</div>
          <div className="text-sm text-gray-500">{record.beneficiary?.category}</div>
        </div>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'entitlement_type',
      key: 'entitlement_type',
      render: (type: string) => (
        <Tag color={
          type === 'MONTHLY' ? 'blue' :
          type === 'SESSION' ? 'green' :
          type === 'EMERGENCY' ? 'red' : 'default'
        }>
          {type.replace('_', ' ')}
        </Tag>
      ),
    },
    {
      title: 'Period',
      key: 'period',
      render: (record: FuelEntitlement) => (
        <div>
          <div>{dayjs(record.period_start).format('MMM DD')} - {dayjs(record.period_end).format('MMM DD, YYYY')}</div>
        </div>
      ),
    },
    {
      title: 'Program',
      key: 'program',
      render: (record: FuelEntitlement) => (
        <div>
          {record.program ? (
            <div>
              <div className="font-medium">{record.program.title}</div>
              <div className="text-sm text-gray-500">{record.program.program_type.replace('_', ' ')}</div>
            </div>
          ) : (
            <span className="text-gray-400">-</span>
          )}
        </div>
      ),
    },
    {
      title: 'Session',
      key: 'session',
      render: (record: FuelEntitlement) => (
        <div>
          {record.session ? (
            <div>
              <div className="font-medium">{record.session.title}</div>
              <div className="text-sm text-gray-500">{dayjs(record.session.start_date).format('MMM DD, YYYY')}</div>
            </div>
          ) : (
            <span className="text-gray-400">-</span>
          )}
        </div>
      ),
    },
    {
      title: 'Entitlement',
      key: 'entitlement',
      render: (record: FuelEntitlement) => (
        <div>
          <div className="font-medium">{record.litres_entitled}L</div>
          <Progress
            percent={Math.round((record.litres_allocated / record.litres_entitled) * 100)}
            size="small"
            status={record.litres_allocated >= record.litres_entitled ? 'success' : 'active'}
          />
          <div className="text-sm text-gray-500">
            {record.litres_allocated}L allocated
          </div>
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const config = {
          PENDING: { color: 'orange', icon: <WarningOutlined /> },
          APPROVED: { color: 'green', icon: <CheckOutlined /> },
          ALLOCATED: { color: 'blue', icon: <ThunderboltOutlined /> },
          PARTIALLY_ALLOCATED: { color: 'gold', icon: <ThunderboltOutlined /> },
          EXPIRED: { color: 'red', icon: <CloseOutlined /> },
          CANCELLED: { color: 'default', icon: <CloseOutlined /> }
        };
        const { color, icon } = config[status as keyof typeof config] || config.PENDING;
        
        return (
          <Tag color={color} icon={icon}>
            {status.replace('_', ' ')}
          </Tag>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: FuelEntitlement) => (
        <Space>
          <Tooltip title="Edit">
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
              disabled={record.status === 'EXPIRED' || record.status === 'CANCELLED'}
            />
          </Tooltip>
          
          {record.status === 'PENDING' && (
            <Tooltip title="Approve">
              <Button
                type="link"
                icon={<CheckOutlined />}
                onClick={() => handleApprove(record.id)}
                style={{ color: 'green' }}
              />
            </Tooltip>
          )}
          
          {record.status === 'PENDING' && (
            <Tooltip title="Reject">
              <Popconfirm
                title="Reject Entitlement"
                description="Are you sure you want to reject this entitlement?"
                onConfirm={() => handleReject(record.id, 'Rejected by administrator')}
                okText="Yes"
                cancelText="No"
              >
                <Button
                  type="link"
                  icon={<CloseOutlined />}
                  danger
                />
              </Popconfirm>
            </Tooltip>
          )}
          
          <Tooltip title="Delete">
            <Popconfirm
              title="Delete Entitlement"
              description="Are you sure you want to delete this entitlement?"
              onConfirm={() => handleDelete(record.id)}
              okText="Yes"
              cancelText="No"
            >
              <Button
                type="link"
                icon={<DeleteOutlined />}
                danger
                disabled={record.status === 'ALLOCATED' || record.status === 'PARTIALLY_ALLOCATED'}
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  const exportMenu = (
    <Menu>
      <Menu.Item key="csv" onClick={() => handleExport('csv')}>
        Export as CSV
      </Menu.Item>
      <Menu.Item key="excel" onClick={() => handleExport('excel')}>
        Export as Excel
      </Menu.Item>
      <Menu.Item key="pdf" onClick={() => handleExport('pdf')}>
        Export as PDF
      </Menu.Item>
    </Menu>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Title level={2} className="mb-2">
            <ThunderboltOutlined /> Fuel Entitlements
          </Title>
          <Text type="secondary">
            Manage fuel entitlements for parliament members and staff
          </Text>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={loadEntitlements}>
            Refresh
          </Button>
          <Dropdown overlay={exportMenu} trigger={['click']}>
            <Button icon={<DownloadOutlined />}>
              Export
            </Button>
          </Dropdown>
          <Button 
            icon={        <BulbOutlined />} 
            onClick={() => setBulkModalVisible(true)}
          >
            Bulk Create
          </Button>
          <Button 
            icon={<CalendarOutlined />} 
            onClick={() => setMonthlyModalVisible(true)}
          >
            Generate Monthly
          </Button>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={handleCreate}
          >
            New Entitlement
          </Button>
        </Space>
      </div>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Entitlements"
              value={stats.total_entitlements}
              prefix={<FileTextOutlined className="text-blue-600" />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Pending Approval"
              value={stats.pending_entitlements}
              prefix={<WarningOutlined className="text-orange-600" />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Litres Entitled"
              value={stats.total_litres_entitled}
              suffix="L"
              prefix={<ThunderboltOutlined className="text-green-600" />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Allocation Rate"
              value={stats.allocation_percentage}
              suffix="%"
              precision={1}
              prefix={<AuditOutlined className="text-purple-600" />}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="Filter by beneficiary"
              value={filters.beneficiary}
              onChange={(value) => setFilters({ ...filters, beneficiary: value || '' })}
              allowClear
              showSearch
              style={{ width: '100%' }}
            >
              {beneficiaries.map(user => (
                <Option key={user.id} value={user.id}>
                  {user.first_name} {user.last_name}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="Filter by type"
              value={filters.entitlement_type}
              onChange={(value) => setFilters({ ...filters, entitlement_type: value || '' })}
              allowClear
              style={{ width: '100%' }}
            >
              <Option value="MONTHLY">Monthly</Option>
              <Option value="SESSION">Session</Option>
              <Option value="COMMITTEE">Committee</Option>
              <Option value="EMERGENCY">Emergency</Option>
              <Option value="TRAVEL_ALLOWANCE">Travel Allowance</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="Filter by status"
              value={filters.status}
              onChange={(value) => setFilters({ ...filters, status: value || '' })}
              allowClear
              style={{ width: '100%' }}
            >
              <Option value="PENDING">Pending</Option>
              <Option value="APPROVED">Approved</Option>
              <Option value="ALLOCATED">Allocated</Option>
              <Option value="EXPIRED">Expired</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <RangePicker
              placeholder={['Start Date', 'End Date']}
              value={dateRange}
              onChange={(dates) => setDateRange(dates as [Dayjs, Dayjs] | null)}
              style={{ width: '100%' }}
            />
          </Col>
        </Row>
      </Card>

      {/* Entitlements Table */}
      <Card>
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
          tabBarExtraContent={
            <Input.Search
              placeholder="Search entitlements..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              style={{ width: 250 }}
            />
          }
        >
          <TabPane tab="All Entitlements" key="all" />
          <TabPane 
            tab={
              <Badge count={stats.pending_entitlements} offset={[10, 0]}>
                Pending
              </Badge>
            } 
            key="pending" 
          />
          <TabPane tab="Approved" key="approved" />
          <TabPane tab="Expired" key="expired" />
        </Tabs>
        
        <Table
          columns={columns}
          dataSource={entitlements}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
            onChange: (page, pageSize) => setPagination({ ...pagination, current: page, pageSize: pageSize || 20 })
          }}
        />
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        title={editingEntitlement ? 'Edit Entitlement' : 'Create New Entitlement'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingEntitlement(null);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="beneficiary"
            label="Beneficiary"
            rules={[{ required: true, message: 'Please select a beneficiary' }]}
          >
            <Select
              placeholder="Select beneficiary"
              showSearch
              filterOption={(input, option) => {
                const children = option?.children as unknown as string;
                return children ? children.toLowerCase().includes(input.toLowerCase()) : false;
              }}
            >
              {beneficiaries.map(user => (
                <Option key={user.id} value={user.id}>
                  {user.first_name} {user.last_name} ({user.username})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="entitlement_type"
            label="Entitlement Type"
            rules={[{ required: true, message: 'Please select entitlement type' }]}
          >
            <Select placeholder="Select type">
              <Option value="MONTHLY">Monthly Entitlement</Option>
              <Option value="SESSION">Parliament Session</Option>
              <Option value="COMMITTEE">Committee Meeting</Option>
              <Option value="SPECIAL_EVENT">Special Event</Option>
              <Option value="TRAVEL_ALLOWANCE">Travel Allowance</Option>
              <Option value="EMERGENCY">Emergency Allocation</Option>
              <Option value="CONSTITUENCY_WORK">Constituency Work</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="litres_entitled"
            label="Litres Entitled"
            rules={[{ required: true, message: 'Please enter litres entitled' }]}
          >
            <InputNumber
              min={0}
              placeholder="Enter litres"
              style={{ width: '100%' }}
              addonAfter="L"
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="period_start"
                label="Period Start"
                rules={[{ required: true, message: 'Please select start date' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="period_end"
                label="Period End"
                rules={[{ required: true, message: 'Please select end date' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="program"
                label="Related Program (Optional)"
              >
                <Select
                  placeholder="Select program"
                  allowClear
                  showSearch
                  filterOption={(input, option) => {
                    const children = option?.children as unknown as string;
                    return children ? children.toLowerCase().includes(input.toLowerCase()) : false;
                  }}
                >
                  {programs.map(program => (
                    <Option key={program.id} value={program.id}>
                      {program.title} ({program.program_type})
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="session"
                label="Related Session (Optional)"
              >
                <Select
                  placeholder="Select session"
                  allowClear
                  showSearch
                  filterOption={(input, option) => {
                    const children = option?.children as unknown as string;
                    return children ? children.toLowerCase().includes(input.toLowerCase()) : false;
                  }}
                >
                  {sessions.map(session => (
                    <Option key={session.id} value={session.id}>
                      {session.title} ({dayjs(session.start_date).format('MMM DD, YYYY')})
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="justification"
            label="Justification"
            rules={[{ required: true, message: 'Please provide justification' }]}
          >
            <Input.TextArea
              rows={3}
              placeholder="Enter justification for this entitlement"
            />
          </Form.Item>

          <Form.Item
            name="notes"
            label="Additional Notes"
          >
            <Input.TextArea
              rows={2}
              placeholder="Enter any additional notes"
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingEntitlement ? 'Update' : 'Create'} Entitlement
              </Button>
              <Button onClick={() => {
                setModalVisible(false);
                setEditingEntitlement(null);
                form.resetFields();
              }}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Bulk Create Modal */}
      <Modal
        title="Bulk Create Entitlements"
        open={bulkModalVisible}
        onCancel={() => {
          setBulkModalVisible(false);
          bulkForm.resetFields();
        }}
        footer={null}
        width={800}
      >
        <Form
          form={bulkForm}
          layout="vertical"
          onFinish={handleBulkCreate}
        >
          <Alert
            message="Bulk Create Entitlements"
            description="Create multiple entitlements for different beneficiaries at once."
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="entitlement_type"
                label="Entitlement Type"
                rules={[{ required: true, message: 'Please select entitlement type' }]}
              >
                <Select placeholder="Select type">
                  <Option value="MONTHLY">Monthly Entitlement</Option>
                  <Option value="SESSION">Parliament Session</Option>
                  <Option value="COMMITTEE">Committee Meeting</Option>
                  <Option value="EMERGENCY">Emergency Allocation</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="session"
                label="Related Session (Optional)"
              >
                <Select placeholder="Select session" allowClear>
                  {sessions.map(session => (
                    <Option key={session.id} value={session.id}>
                      {session.title}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="period_start"
                label="Period Start"
                rules={[{ required: true, message: 'Please select start date' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="period_end"
                label="Period End"
                rules={[{ required: true, message: 'Please select end date' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="justification"
            label="Justification"
            rules={[{ required: true, message: 'Please provide justification' }]}
          >
            <Input.TextArea
              rows={2}
              placeholder="Enter justification for these entitlements"
            />
          </Form.Item>

          <Form.List name="beneficiaries">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Card key={key} size="small" style={{ marginBottom: 8 }}>
                    <Row gutter={16} align="middle">
                      <Col span={8}>
                        <Form.Item
                          {...restField}
                          name={[name, 'beneficiary_id']}
                          rules={[{ required: true, message: 'Select beneficiary' }]}
                        >
                          <Select placeholder="Select beneficiary" showSearch>
                            {beneficiaries.map(user => (
                              <Option key={user.id} value={user.id}>
                                {user.first_name} {user.last_name}
                              </Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <Form.Item
                          {...restField}
                          name={[name, 'litres_entitled']}
                          rules={[{ required: true, message: 'Enter litres' }]}
                        >
                          <InputNumber 
                            placeholder="Litres" 
                            min={0} 
                            style={{ width: '100%' }}
                            addonAfter="L"
                          />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item
                          {...restField}
                          name={[name, 'notes']}
                        >
                          <Input placeholder="Notes (optional)" />
                        </Form.Item>
                      </Col>
                      <Col span={2}>
                        <Button 
                          type="link" 
                          danger 
                          onClick={() => remove(name)}
                          icon={<DeleteOutlined />}
                        />
                      </Col>
                    </Row>
                  </Card>
                ))}
                <Form.Item>
                  <Button 
                    type="dashed" 
                    onClick={() => add()} 
                    block 
                    icon={<PlusOutlined />}
                  >
                    Add Beneficiary
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Create Bulk Entitlements
              </Button>
              <Button onClick={() => {
                setBulkModalVisible(false);
                bulkForm.resetFields();
              }}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Monthly Generation Modal */}
      <Modal
        title="Generate Monthly Entitlements"
        open={monthlyModalVisible}
        onCancel={() => {
          setMonthlyModalVisible(false);
          monthlyForm.resetFields();
        }}
        footer={null}
        width={500}
      >
        <Form
          form={monthlyForm}
          layout="vertical"
          onFinish={handleGenerateMonthly}
        >
          <Alert
            message="Generate Monthly Entitlements"
            description="Generate monthly entitlements for all active beneficiaries based on their profiles."
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="month"
                label="Month"
                rules={[{ required: true, message: 'Please select month' }]}
              >
                <Select placeholder="Select month">
                  {Array.from({ length: 12 }, (_, i) => (
                    <Option key={i + 1} value={i + 1}>
                      {dayjs().month(i).format('MMMM')}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="year"
                label="Year"
                rules={[{ required: true, message: 'Please select year' }]}
              >
                <InputNumber
                  min={2020}
                  max={2030}
                  placeholder="Year"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="notes"
            label="Notes"
          >
            <Input.TextArea
              rows={3}
              placeholder="Enter any notes for the monthly generation"
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Generate Monthly Entitlements
              </Button>
              <Button onClick={() => {
                setMonthlyModalVisible(false);
                monthlyForm.resetFields();
              }}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default FuelEntitlements;
