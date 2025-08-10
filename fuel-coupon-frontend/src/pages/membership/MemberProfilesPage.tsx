// src/pages/membership/MemberProfilesPage.tsx
import React, { useState } from 'react';
import {
  Card,
  Table,
  Input,
  Select,
  Button,
  Row,
  Col,
  Typography,
  Space,
  Tag,
  Avatar,
  Drawer,
  Descriptions,
  Badge,
  Progress,
  Tabs,
  Statistic,
  message,
  Modal,
} from 'antd';
import {
  UserOutlined,
  SearchOutlined,
  FilterOutlined,
  EyeOutlined,
  EditOutlined,
  DownloadOutlined,
  TeamOutlined,
  CarOutlined,
  BankOutlined,
  PhoneOutlined,
  MailOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import { motion } from 'framer-motion';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;
const { TabPane } = Tabs;

interface MemberProfile {
  id: string;
  employeeId: string;
  name: string;
  title: string;
  category: string;
  position: string;
  department: string;
  constituency?: string;
  party?: string;
  email: string;
  phone: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  joinDate: string;
  lastLogin: string;
  monthlyAllocation: number;
  currentBalance: number;
  usedThisMonth: number;
  vehicleInfo: {
    make: string;
    model: string;
    year: number;
    registration: string;
    fuelType: string;
  };
  avatar?: string;
}

const MemberProfilesPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedMember, setSelectedMember] = useState<MemberProfile | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Mock data - in real app, this would come from API
  const mockData: MemberProfile[] = [
    {
      id: '1',
      employeeId: 'MP001',
      name: 'Hon. John Mukamuri',
      title: 'Hon.',
      category: 'MP',
      position: 'Member of Parliament',
      department: 'House of Assembly',
      constituency: 'Harare East',
      party: 'ZANU-PF',
      email: 'j.mukamuri@parliament.gov.zw',
      phone: '+263 77 123 4567',
      status: 'ACTIVE',
      joinDate: '2023-08-15',
      lastLogin: '2024-01-15 09:30',
      monthlyAllocation: 300,
      currentBalance: 150,
      usedThisMonth: 150,
      vehicleInfo: {
        make: 'Toyota',
        model: 'Prado',
        year: 2022,
        registration: 'ABZ 1234',
        fuelType: 'DIESEL',
      },
    },
    {
      id: '2',
      employeeId: 'SEN001',
      name: 'Hon. Dr. Mary Chitepo',
      title: 'Hon. Dr.',
      category: 'SENATOR',
      position: 'Senator',
      department: 'Senate',
      constituency: 'Bulawayo',
      party: 'MDC Alliance',
      email: 'm.chitepo@parliament.gov.zw',
      phone: '+263 77 987 6543',
      status: 'ACTIVE',
      joinDate: '2023-09-01',
      lastLogin: '2024-01-14 16:45',
      monthlyAllocation: 280,
      currentBalance: 200,
      usedThisMonth: 80,
      vehicleInfo: {
        make: 'Mercedes',
        model: 'C-Class',
        year: 2021,
        registration: 'CBD 5678',
        fuelType: 'PETROL',
      },
    },
    {
      id: '3',
      employeeId: 'STF001',
      name: 'Mr. Peter Zvobgo',
      title: 'Mr.',
      category: 'STAFF',
      position: 'Senior Clerk',
      department: 'Administration',
      email: 'p.zvobgo@parliament.gov.zw',
      phone: '+263 77 555 1234',
      status: 'ACTIVE',
      joinDate: '2022-03-10',
      lastLogin: '2024-01-15 08:15',
      monthlyAllocation: 200,
      currentBalance: 180,
      usedThisMonth: 20,
      vehicleInfo: {
        make: 'Honda',
        model: 'CR-V',
        year: 2020,
        registration: 'EFG 9012',
        fuelType: 'PETROL',
      },
    },
  ];

  const categories = [
    { value: 'MP', label: 'Member of Parliament', color: 'blue' },
    { value: 'SENATOR', label: 'Senator', color: 'green' },
    { value: 'GOVERNOR', label: 'Governor', color: 'purple' },
    { value: 'STAFF', label: 'Parliament Staff', color: 'default' },
    { value: 'DRIVER', label: 'Official Driver', color: 'orange' },
  ];

  const statuses = [
    { value: 'ACTIVE', label: 'Active', color: 'green' },
    { value: 'INACTIVE', label: 'Inactive', color: 'default' },
    { value: 'SUSPENDED', label: 'Suspended', color: 'red' },
  ];

  const getCategoryColor = (category: string) => {
    const cat = categories.find(c => c.value === category);
    return cat ? cat.color : 'default';
  };

  const getStatusColor = (status: string) => {
    const stat = statuses.find(s => s.value === status);
    return stat ? stat.color : 'default';
  };

  const filteredData = mockData.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchText.toLowerCase()) ||
                         member.employeeId.toLowerCase().includes(searchText.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchText.toLowerCase());
    const matchesCategory = !selectedCategory || member.category === selectedCategory;
    const matchesStatus = !selectedStatus || member.status === selectedStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const columns: ColumnsType<MemberProfile> = [
    {
      title: 'Member',
      key: 'member',
      render: (record: MemberProfile) => (
        <div className="flex items-center gap-3">
          <Avatar
            size={40}
            src={record.avatar}
            icon={<UserOutlined />}
            style={{ backgroundColor: getCategoryColor(record.category) }}
          />
          <div>
            <div className="font-medium">{record.name}</div>
            <div className="text-gray-500 text-sm">{record.employeeId}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: (category: string) => (
        <Tag color={getCategoryColor(category)}>
          {categories.find(c => c.value === category)?.label || category}
        </Tag>
      ),
    },
    {
      title: 'Position',
      dataIndex: 'position',
      key: 'position',
    },
    {
      title: 'Department',
      dataIndex: 'department',
      key: 'department',
    },
    {
      title: 'Constituency',
      dataIndex: 'constituency',
      key: 'constituency',
      render: (constituency: string) => constituency || '-',
    },
    {
      title: 'Fuel Usage',
      key: 'fuelUsage',
      render: (record: MemberProfile) => (
        <div className="space-y-1">
          <div className="text-sm">
            {record.usedThisMonth}L / {record.monthlyAllocation}L
          </div>
          <Progress
            percent={(record.usedThisMonth / record.monthlyAllocation) * 100}
            size="small"
            status={record.usedThisMonth >= record.monthlyAllocation ? 'exception' : 'active'}
          />
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>
          {statuses.find(s => s.value === status)?.label || status}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: MemberProfile) => (
        <Space>
          <Button
            type="text"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => {
              setSelectedMember(record);
              setDrawerVisible(true);
            }}
          />
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            onClick={() => message.info('Edit functionality would be implemented')}
          />
        </Space>
      ),
    },
  ];

  const renderMemberOverview = () => (
    <div className="space-y-6">
      {selectedMember && (
        <>
          <div className="flex items-center gap-4">
            <Avatar
              size={80}
              src={selectedMember.avatar}
              icon={<UserOutlined />}
              style={{ backgroundColor: getCategoryColor(selectedMember.category) }}
            />
            <div>
              <Title level={3} className="mb-0">{selectedMember.name}</Title>
              <Text type="secondary">{selectedMember.position}</Text>
              <div className="mt-2 space-x-2">
                <Tag color={getCategoryColor(selectedMember.category)}>
                  {categories.find(c => c.value === selectedMember.category)?.label}
                </Tag>
                <Tag color={getStatusColor(selectedMember.status)}>
                  {statuses.find(s => s.value === selectedMember.status)?.label}
                </Tag>
                {selectedMember.party && (
                  <Tag color="blue">{selectedMember.party}</Tag>
                )}
              </div>
            </div>
          </div>

          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Card size="small" title="Contact Information">
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="Email">
                    <Space>
                      <MailOutlined />
                      {selectedMember.email}
                    </Space>
                  </Descriptions.Item>
                  <Descriptions.Item label="Phone">
                    <Space>
                      <PhoneOutlined />
                      {selectedMember.phone}
                    </Space>
                  </Descriptions.Item>
                  <Descriptions.Item label="Constituency">
                    <Space>
                      <EnvironmentOutlined />
                      {selectedMember.constituency || 'N/A'}
                    </Space>
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            </Col>
            <Col xs={24} md={12}>
              <Card size="small" title="Employment Details">
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="Employee ID">
                    {selectedMember.employeeId}
                  </Descriptions.Item>
                  <Descriptions.Item label="Department">
                    {selectedMember.department}
                  </Descriptions.Item>
                  <Descriptions.Item label="Join Date">
                    <Space>
                      <CalendarOutlined />
                      {new Date(selectedMember.joinDate).toLocaleDateString()}
                    </Space>
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            </Col>
          </Row>
        </>
      )}
    </div>
  );

  const renderFuelAllocation = () => (
    <div className="space-y-6">
      {selectedMember && (
        <>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={8}>
              <Card>
                <Statistic
                  title="Monthly Allocation"
                  value={selectedMember.monthlyAllocation}
                  suffix="L"
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card>
                <Statistic
                  title="Used This Month"
                  value={selectedMember.usedThisMonth}
                  suffix="L"
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card>
                <Statistic
                  title="Current Balance"
                  value={selectedMember.currentBalance}
                  suffix="L"
                  valueStyle={{ 
                    color: selectedMember.currentBalance <= 50 ? '#ff4d4f' : '#52c41a'
                  }}
                />
              </Card>
            </Col>
          </Row>

          <Card title="Fuel Usage Trend">
            <Progress
              percent={(selectedMember.usedThisMonth / selectedMember.monthlyAllocation) * 100}
              status={selectedMember.usedThisMonth >= selectedMember.monthlyAllocation ? 'exception' : 'active'}
              strokeColor={{
                '0%': '#108ee9',
                '100%': '#87d068',
              }}
            />
            <div className="mt-4 text-center">
              <Text>
                {selectedMember.usedThisMonth}L used out of {selectedMember.monthlyAllocation}L allocation
              </Text>
            </div>
          </Card>
        </>
      )}
    </div>
  );

  const renderVehicleInfo = () => (
    <div className="space-y-6">
      {selectedMember && (
        <Card title="Vehicle Information" extra={<CarOutlined />}>
          <Descriptions column={2}>
            <Descriptions.Item label="Make & Model">
              {selectedMember.vehicleInfo.make} {selectedMember.vehicleInfo.model}
            </Descriptions.Item>
            <Descriptions.Item label="Year">
              {selectedMember.vehicleInfo.year}
            </Descriptions.Item>
            <Descriptions.Item label="Registration">
              {selectedMember.vehicleInfo.registration}
            </Descriptions.Item>
            <Descriptions.Item label="Fuel Type">
              <Tag color={selectedMember.vehicleInfo.fuelType === 'DIESEL' ? 'blue' : 'green'}>
                {selectedMember.vehicleInfo.fuelType}
              </Tag>
            </Descriptions.Item>
          </Descriptions>
        </Card>
      )}
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <Title level={2}>
              <TeamOutlined className="mr-2" />
              Member Profiles
            </Title>
            <Text type="secondary">
              View and manage member profiles and their information
            </Text>
          </div>

          <Card className="mb-6">
            <Row gutter={[16, 16]} align="middle">
              <Col xs={24} md={8}>
                <Search
                  placeholder="Search members..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  prefix={<SearchOutlined />}
                />
              </Col>
              <Col xs={24} md={4}>
                <Select
                  placeholder="Category"
                  value={selectedCategory}
                  onChange={setSelectedCategory}
                  allowClear
                  style={{ width: '100%' }}
                >
                  {categories.map(cat => (
                    <Option key={cat.value} value={cat.value}>{cat.label}</Option>
                  ))}
                </Select>
              </Col>
              <Col xs={24} md={4}>
                <Select
                  placeholder="Status"
                  value={selectedStatus}
                  onChange={setSelectedStatus}
                  allowClear
                  style={{ width: '100%' }}
                >
                  {statuses.map(status => (
                    <Option key={status.value} value={status.value}>{status.label}</Option>
                  ))}
                </Select>
              </Col>
              <Col xs={24} md={8}>
                <Space>
                  <Button icon={<FilterOutlined />}>
                    Advanced Filters
                  </Button>
                  <Button icon={<DownloadOutlined />}>
                    Export
                  </Button>
                </Space>
              </Col>
            </Row>
          </Card>

          <Card>
            <div className="mb-4">
              <Text type="secondary">
                Showing {filteredData.length} of {mockData.length} members
              </Text>
            </div>
            <Table
              columns={columns}
              dataSource={filteredData}
              rowKey="id"
              loading={loading}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => 
                  `${range[0]}-${range[1]} of ${total} members`,
              }}
            />
          </Card>

          <Drawer
            title="Member Profile"
            placement="right"
            width={600}
            onClose={() => setDrawerVisible(false)}
            open={drawerVisible}
          >
            <Tabs activeKey={activeTab} onChange={setActiveTab}>
              <TabPane tab="Overview" key="overview">
                {renderMemberOverview()}
              </TabPane>
              <TabPane tab="Fuel Allocation" key="fuel">
                {renderFuelAllocation()}
              </TabPane>
              <TabPane tab="Vehicle" key="vehicle">
                {renderVehicleInfo()}
              </TabPane>
            </Tabs>
          </Drawer>
        </div>
      </div>
    </motion.div>
  );
};

export default MemberProfilesPage;
