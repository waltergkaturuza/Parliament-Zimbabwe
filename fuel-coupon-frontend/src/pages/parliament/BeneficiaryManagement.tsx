// src/pages/parliament/BeneficiaryManagement.tsx
import { useState, useCallback } from 'react';
import {
  Table,
  Card,
  Button,
  Space,
  Tag,
  Input,
  Select,
  Modal,
  Form,
  Upload,
  Progress,
  Statistic,
  Row,
  Col,
  Tooltip,
  Avatar,
  Typography,
  Badge,
  Drawer,
  Descriptions,
  Timeline,
  Alert,
  Tabs,
  List,
  Empty,
  Image,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  FilterOutlined,
  DownloadOutlined,
  UploadOutlined,
  UserOutlined,
  EditOutlined,
  EyeOutlined,
  DeleteOutlined,
  CarOutlined,
  FileTextOutlined,
  PhoneOutlined,
  MailOutlined,
  HomeOutlined,
  BankOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  TeamOutlined,
  ReloadOutlined,
  ExportOutlined,
  ImportOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

const { Search } = Input;
const { Title, Text } = Typography;
const { TextArea } = Input;
const { TabPane } = Tabs;

interface Beneficiary {
  id: string;
  parliamentaryId: string;
  name: string;
  title: string;
  category: 'MP' | 'SENATOR' | 'STAFF' | 'OFFICIAL';
  constituency?: string;
  party?: string;
  phoneNumber: string;
  email: string;
  address: string;
  dateOfBirth: string;
  nationalId: string;
  profilePhoto?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  entitlements: {
    monthlyAllocation: number;
    maxPerTransaction: number;
    vehicleCount: number;
  };
  fuelUsage: {
    currentMonth: number;
    lastMonth: number;
    yearToDate: number;
    totalUsed: number;
  };
  vehicles: Array<{
    id: string;
    registration: string;
    make: string;
    model: string;
    year: number;
    fuelType: 'PETROL' | 'DIESEL';
  }>;
  lastActivity: string;
  createdAt: string;
}

interface BeneficiaryFilters {
  search?: string;
  category?: string;
  status?: string;
  constituency?: string;
  party?: string;
}

const BeneficiaryManagement = () => {
  const [filters, setFilters] = useState<BeneficiaryFilters>({});
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [selectedBeneficiary, setSelectedBeneficiary] = useState<Beneficiary | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [createForm] = Form.useForm();
  const queryClient = useQueryClient();

  // Fetch beneficiaries data
  const { data: beneficiaries, isLoading, refetch } = useQuery<Beneficiary[]>({
    queryKey: ['beneficiaries', filters],
    queryFn: async () => {
      // Simulated data - replace with actual API call
      return Array.from({ length: 200 }, (_, i) => ({
        id: `ben_${i + 1}`,
        parliamentaryId: `MP${String(i + 1).padStart(4, '0')}`,
        name: `Hon. ${['John', 'Jane', 'Michael', 'Sarah', 'David', 'Mary'][i % 6]} ${['Smith', 'Johnson', 'Williams', 'Brown', 'Davis', 'Miller'][i % 6]}`,
        title: ['Honorable', 'Right Honorable', 'Dr.', 'Prof.'][i % 4],
        category: ['MP', 'SENATOR', 'STAFF', 'OFFICIAL'][i % 4] as any,
        constituency: i % 4 === 0 ? `Constituency ${i + 1}` : undefined,
        party: ['ZANU-PF', 'MDC', 'CCC', 'Independent'][i % 4],
        phoneNumber: `+263 ${Math.floor(Math.random() * 900000) + 100000}`,
        email: `beneficiary${i + 1}@parliament.gov.zw`,
        address: `${Math.floor(Math.random() * 999) + 1} ${['Main', 'Second', 'Third'][i % 3]} Street, Harare`,
        dateOfBirth: new Date(1960 + Math.random() * 40, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString(),
        nationalId: `${Math.floor(Math.random() * 90) + 10}-${Math.floor(Math.random() * 900000) + 100000}Z${Math.floor(Math.random() * 90) + 10}`,
        profilePhoto: Math.random() > 0.7 ? 'https://via.placeholder.com/150' : undefined,
        status: ['ACTIVE', 'INACTIVE', 'SUSPENDED'][Math.floor(Math.random() * 3)] as any,
        entitlements: {
          monthlyAllocation: [500, 750, 1000, 1500][Math.floor(Math.random() * 4)],
          maxPerTransaction: [200, 300, 400, 500][Math.floor(Math.random() * 4)],
          vehicleCount: Math.floor(Math.random() * 3) + 1,
        },
        fuelUsage: {
          currentMonth: Math.floor(Math.random() * 400) + 100,
          lastMonth: Math.floor(Math.random() * 400) + 100,
          yearToDate: Math.floor(Math.random() * 4000) + 1000,
          totalUsed: Math.floor(Math.random() * 10000) + 5000,
        },
        vehicles: Array.from({ length: Math.floor(Math.random() * 3) + 1 }, (_, v) => ({
          id: `veh_${i}_${v}`,
          registration: `ABC ${Math.floor(Math.random() * 900) + 100}GP`,
          make: ['Toyota', 'Honda', 'Nissan', 'Ford', 'BMW'][Math.floor(Math.random() * 5)],
          model: ['Camry', 'Civic', 'Altima', 'Focus', '320i'][Math.floor(Math.random() * 5)],
          year: 2015 + Math.floor(Math.random() * 9),
          fuelType: Math.random() > 0.5 ? 'PETROL' : 'DIESEL',
        })),
        lastActivity: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
      }));
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'success';
      case 'INACTIVE': return 'default';
      case 'SUSPENDED': return 'error';
      default: return 'default';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'MP': return 'blue';
      case 'SENATOR': return 'purple';
      case 'STAFF': return 'orange';
      case 'OFFICIAL': return 'green';
      default: return 'default';
    }
  };

  const columns = [
    {
      title: 'Beneficiary',
      key: 'beneficiary',
      width: 300,
      render: (record: Beneficiary) => (
        <div className="flex items-center gap-3">
          <Avatar
            size={48}
            src={record.profilePhoto}
            icon={<UserOutlined />}
            className="flex-shrink-0"
          />
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-gray-900 truncate">
              {record.title} {record.name}
            </div>
            <div className="text-sm text-gray-500">{record.parliamentaryId}</div>
            <div className="flex items-center gap-2 mt-1">
              <Tag color={getCategoryColor(record.category)}>
                {record.category}
              </Tag>
              {record.constituency && (
                <Text type="secondary" className="text-xs truncate">
                  {record.constituency}
                </Text>
              )}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Contact',
      key: 'contact',
      width: 200,
      render: (record: Beneficiary) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <PhoneOutlined className="text-gray-400" />
            <Text className="text-sm">{record.phoneNumber}</Text>
          </div>
          <div className="flex items-center gap-2">
            <MailOutlined className="text-gray-400" />
            <Text className="text-sm truncate">{record.email}</Text>
          </div>
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      filters: [
        { text: 'Active', value: 'ACTIVE' },
        { text: 'Inactive', value: 'INACTIVE' },
        { text: 'Suspended', value: 'SUSPENDED' },
      ],
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{status}</Tag>
      ),
    },
    {
      title: 'Monthly Allocation',
      key: 'allocation',
      width: 120,
      sorter: true,
      render: (record: Beneficiary) => (
        <div className="text-center">
          <div className="font-semibold">${record.entitlements.monthlyAllocation}</div>
          <div className="text-xs text-gray-500">
            Used: ${record.fuelUsage.currentMonth}
          </div>
          <Progress
            percent={Math.round((record.fuelUsage.currentMonth / record.entitlements.monthlyAllocation) * 100)}
            size="small"
            status={record.fuelUsage.currentMonth > record.entitlements.monthlyAllocation ? 'exception' : 'normal'}
          />
        </div>
      ),
    },
    {
      title: 'Vehicles',
      key: 'vehicles',
      width: 100,
      render: (record: Beneficiary) => (
        <div className="text-center">
          <Badge count={record.vehicles.length} showZero>
            <CarOutlined className="text-2xl text-gray-400" />
          </Badge>
        </div>
      ),
    },
    {
      title: 'Last Activity',
      dataIndex: 'lastActivity',
      key: 'lastActivity',
      width: 120,
      sorter: true,
      render: (date: string) => (
        <div className="text-sm">
          {format(new Date(date), 'MMM dd, yyyy')}
        </div>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (record: Beneficiary) => (
        <Space size="small">
          <Tooltip title="View Details">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => {
                setSelectedBeneficiary(record);
                setIsDetailDrawerOpen(true);
              }}
            />
          </Tooltip>
          <Tooltip title="Edit">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
            />
          </Tooltip>
          <Tooltip title="Vehicles">
            <Button
              type="text"
              size="small"
              icon={<CarOutlined />}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: React.Key[]) => setSelectedRowKeys(keys as string[]),
    getCheckboxProps: (record: Beneficiary) => ({
      disabled: record.status === 'SUSPENDED',
    }),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Title level={2}>Beneficiary Management</Title>
          <Text type="secondary">
            Manage parliament members, staff, and their fuel entitlements
          </Text>
        </div>
        <Space>
          <Button icon={<ImportOutlined />}>Import</Button>
          <Button icon={<ExportOutlined />}>Export</Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsCreateModalOpen(true)}
          >
            Add Beneficiary
          </Button>
        </Space>
      </div>

      {/* Statistics */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Total Beneficiaries"
              value={beneficiaries?.length || 0}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Active MPs"
              value={beneficiaries?.filter(b => b.category === 'MP' && b.status === 'ACTIVE').length || 0}
              valueStyle={{ color: '#1890ff' }}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Total Vehicles"
              value={beneficiaries?.reduce((sum, b) => sum + b.vehicles.length, 0) || 0}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CarOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Monthly Allocations"
              value={beneficiaries?.reduce((sum, b) => sum + b.entitlements.monthlyAllocation, 0) || 0}
              prefix="$"
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card>
        <div className="flex flex-wrap gap-4 items-center">
          <Search
            placeholder="Search by name, ID, or constituency"
            style={{ width: 300 }}
            onSearch={(value: string) => setFilters({ ...filters, search: value })}
          />
          <Select
            placeholder="Category"
            style={{ width: 120 }}
            allowClear
            onChange={(value) => setFilters({ ...filters, category: value })}
            options={[
              { label: 'MP', value: 'MP' },
              { label: 'Senator', value: 'SENATOR' },
              { label: 'Staff', value: 'STAFF' },
              { label: 'Official', value: 'OFFICIAL' },
            ]}
          />
          <Select
            placeholder="Status"
            style={{ width: 120 }}
            allowClear
            onChange={(value) => setFilters({ ...filters, status: value })}
            options={[
              { label: 'Active', value: 'ACTIVE' },
              { label: 'Inactive', value: 'INACTIVE' },
              { label: 'Suspended', value: 'SUSPENDED' },
            ]}
          />
          <Select
            placeholder="Party"
            style={{ width: 150 }}
            allowClear
            onChange={(value) => setFilters({ ...filters, party: value })}
            options={[
              { label: 'ZANU-PF', value: 'ZANU-PF' },
              { label: 'MDC', value: 'MDC' },
              { label: 'CCC', value: 'CCC' },
              { label: 'Independent', value: 'Independent' },
            ]}
          />
          <Button icon={<ReloadOutlined />} onClick={() => refetch()}>
            Refresh
          </Button>
        </div>
      </Card>

      {/* Bulk Actions */}
      {selectedRowKeys.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Alert
            message={
              <div className="flex items-center justify-between">
                <span>{selectedRowKeys.length} beneficiary(ies) selected</span>
                <Space>
                  <Button size="small">Activate</Button>
                  <Button size="small">Suspend</Button>
                  <Button size="small">Export</Button>
                </Space>
              </div>
            }
            type="info"
            closable
            onClose={() => setSelectedRowKeys([])}
          />
        </motion.div>
      )}

      {/* Main Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={beneficiaries}
          rowKey="id"
          rowSelection={rowSelection}
          loading={isLoading}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} of ${total} beneficiaries`,
          }}
          scroll={{ x: 1400 }}
        />
      </Card>

      {/* Beneficiary Detail Drawer */}
      <Drawer
        title="Beneficiary Details"
        open={isDetailDrawerOpen}
        onClose={() => setIsDetailDrawerOpen(false)}
        width={800}
      >
        {selectedBeneficiary && (
          <Tabs activeKey={activeTab} onChange={setActiveTab}>
            <TabPane tab="Overview" key="overview">
              <div className="space-y-6">
                {/* Profile Section */}
                <Card>
                  <div className="flex items-start gap-6">
                    <Avatar
                      size={120}
                      src={selectedBeneficiary.profilePhoto}
                      icon={<UserOutlined />}
                    />
                    <div className="flex-1">
                      <Title level={3} className="mb-2">
                        {selectedBeneficiary.title} {selectedBeneficiary.name}
                      </Title>
                      <div className="flex items-center gap-4 mb-4">
                        <Tag color={getCategoryColor(selectedBeneficiary.category)}>
                          {selectedBeneficiary.category}
                        </Tag>
                        <Tag color={getStatusColor(selectedBeneficiary.status)}>
                          {selectedBeneficiary.status}
                        </Tag>
                        {selectedBeneficiary.party && (
                          <Tag color="blue">{selectedBeneficiary.party}</Tag>
                        )}
                      </div>
                      <Descriptions column={2}>
                        <Descriptions.Item label="Parliamentary ID">
                          {selectedBeneficiary.parliamentaryId}
                        </Descriptions.Item>
                        <Descriptions.Item label="National ID">
                          {selectedBeneficiary.nationalId}
                        </Descriptions.Item>
                        <Descriptions.Item label="Phone">
                          {selectedBeneficiary.phoneNumber}
                        </Descriptions.Item>
                        <Descriptions.Item label="Email">
                          {selectedBeneficiary.email}
                        </Descriptions.Item>
                        {selectedBeneficiary.constituency && (
                          <Descriptions.Item label="Constituency">
                            {selectedBeneficiary.constituency}
                          </Descriptions.Item>
                        )}
                        <Descriptions.Item label="Date of Birth">
                          {format(new Date(selectedBeneficiary.dateOfBirth), 'MMMM dd, yyyy')}
                        </Descriptions.Item>
                      </Descriptions>
                    </div>
                  </div>
                </Card>

                {/* Fuel Usage Summary */}
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <Card title="Fuel Entitlements">
                      <Descriptions column={1}>
                        <Descriptions.Item label="Monthly Allocation">
                          ${selectedBeneficiary.entitlements.monthlyAllocation}
                        </Descriptions.Item>
                        <Descriptions.Item label="Max Per Transaction">
                          ${selectedBeneficiary.entitlements.maxPerTransaction}
                        </Descriptions.Item>
                        <Descriptions.Item label="Vehicle Count">
                          {selectedBeneficiary.entitlements.vehicleCount}
                        </Descriptions.Item>
                      </Descriptions>
                    </Card>
                  </Col>
                  <Col span={12}>
                    <Card title="Usage Statistics">
                      <Descriptions column={1}>
                        <Descriptions.Item label="Current Month">
                          ${selectedBeneficiary.fuelUsage.currentMonth}
                        </Descriptions.Item>
                        <Descriptions.Item label="Last Month">
                          ${selectedBeneficiary.fuelUsage.lastMonth}
                        </Descriptions.Item>
                        <Descriptions.Item label="Year to Date">
                          ${selectedBeneficiary.fuelUsage.yearToDate}
                        </Descriptions.Item>
                        <Descriptions.Item label="Total Used">
                          ${selectedBeneficiary.fuelUsage.totalUsed}
                        </Descriptions.Item>
                      </Descriptions>
                    </Card>
                  </Col>
                </Row>
              </div>
            </TabPane>

            <TabPane tab="Vehicles" key="vehicles">
              <div className="space-y-4">
                {selectedBeneficiary.vehicles.length > 0 ? (
                  selectedBeneficiary.vehicles.map((vehicle) => (
                    <Card key={vehicle.id} size="small">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Avatar icon={<CarOutlined />} />
                          <div>
                            <div className="font-semibold">
                              {vehicle.make} {vehicle.model} ({vehicle.year})
                            </div>
                            <div className="text-sm text-gray-500">
                              Registration: {vehicle.registration}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <Tag color={vehicle.fuelType === 'PETROL' ? 'blue' : 'orange'}>
                            {vehicle.fuelType}
                          </Tag>
                        </div>
                      </div>
                    </Card>
                  ))
                ) : (
                  <Empty description="No vehicles registered" />
                )}
              </div>
            </TabPane>

            <TabPane tab="Activity" key="activity">
              <Timeline>
                <Timeline.Item color="green">
                  <p>Account created</p>
                  <p className="text-gray-500 text-sm">
                    {format(new Date(selectedBeneficiary.createdAt), 'MMMM dd, yyyy HH:mm')}
                  </p>
                </Timeline.Item>
                <Timeline.Item color="blue">
                  <p>Last activity</p>
                  <p className="text-gray-500 text-sm">
                    {format(new Date(selectedBeneficiary.lastActivity), 'MMMM dd, yyyy HH:mm')}
                  </p>
                </Timeline.Item>
              </Timeline>
            </TabPane>
          </Tabs>
        )}
      </Drawer>
    </div>
  );
};

export default BeneficiaryManagement;
