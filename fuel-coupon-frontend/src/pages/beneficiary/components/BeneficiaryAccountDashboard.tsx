// src/pages/beneficiary/components/BeneficiaryAccountDashboard.tsx
import { useState, useEffect } from 'react';
import type { FC } from 'react';
import {
  Card,
  Row,
  Col,
  Typography,
  Statistic,
  Table,
  Tag,
  Button,
  Space,
  Progress,
  Timeline,
  Calendar,
  Badge,
  Descriptions,
  Tabs,
  Avatar,
  Alert,
  List,
  Modal,
  Divider,
  Tooltip,
  message,
} from 'antd';
import {
  UserOutlined,
  CarOutlined,
  FireOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
  HistoryOutlined,
  FileTextOutlined,
  TeamOutlined,
  SettingOutlined,
  BankOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  MailOutlined,
} from '@ant-design/icons';
import { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { useAuth } from '../../../contexts/AuthContext';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

interface BeneficiaryProfile {
  id: string;
  memberId: string;
  name: string;
  position: string;
  department: string;
  category: 'MP' | 'SENATOR' | 'STAFF' | 'DRIVER' | 'CONSULTANT';
  contactInfo: {
    email: string;
    phone: string;
    office: string;
    address: string;
  };
  vehicleInfo: {
    make: string;
    model: string;
    year: number;
    engineSize: string;
    registrationNumber: string;
    fuelType: 'PETROL' | 'DIESEL';
  };
  allocationProfile: {
    monthlyAllocation: number;
    currentBalance: number;
    usedThisMonth: number;
    lastUpdated: string;
    baseAllocation: number;
    multiplier: number;
  };
  status: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';
  joinDate: string;
  lastLogin: string;
}

interface CouponAllocation {
  id: string;
  allocationDate: string;
  sessionName: string;
  programName: string;
  eventName?: string;
  couponsAllocated: number;
  totalLitres: number;
  totalValue: number;
  couponsUsed: number;
  couponsRemaining: number;
  status: 'ACTIVE' | 'USED' | 'EXPIRED' | 'VOIDED';
  allocatedBy: string;
  subCenterName: string;
  firstCouponSerial: string;
  lastCouponSerial: string;
  expiryDate: string;
  notes?: string;
  coupons: CouponDetail[];
}

interface CouponDetail {
  id: string;
  couponSerial: string;
  status: 'ALLOCATED' | 'USED' | 'EXPIRED' | 'VOIDED';
  usedDate?: string;
  usedLocation?: string;
  litres: number;
  value: number;
}

interface AttendanceRecord {
  id: string;
  date: string;
  sessionName: string;
  sessionType: 'PLENARY' | 'COMMITTEE' | 'SPECIAL' | 'WORKSHOP';
  startTime: string;
  endTime: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
  duration: number;
  location: string;
  notes?: string;
}

interface EventCalendar {
  id: string;
  title: string;
  date: string;
  time: string;
  type: 'SESSION' | 'COMMITTEE' | 'EVENT' | 'MEETING';
  location: string;
  description: string;
  fuelAllocationEligible: boolean;
  estimatedFuelRequirement?: number;
  status: 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
}

const BeneficiaryAccountDashboard: FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedAllocation, setSelectedAllocation] = useState<CouponAllocation | null>(null);
  const [allocationDetailsVisible, setAllocationDetailsVisible] = useState(false);

  // Sample beneficiary profile data
  const [profile, setProfile] = useState<BeneficiaryProfile>({
    id: 'BEN001',
    memberId: 'MP001',
    name: 'Hon. John Mukamuri',
    position: 'Member of Parliament',
    department: 'Finance Committee',
    category: 'MP',
    contactInfo: {
      email: 'john.mukamuri@parliament.gov.zw',
      phone: '+263771234567',
      office: 'Room 205, Parliament Building',
      address: '123 Independence Ave, Harare',
    },
    vehicleInfo: {
      make: 'Toyota',
      model: 'Prado',
      year: 2022,
      engineSize: '3.0L V6',
      registrationNumber: 'AEZ-1234',
      fuelType: 'DIESEL',
    },
    allocationProfile: {
      monthlyAllocation: 300,
      currentBalance: 185,
      usedThisMonth: 115,
      lastUpdated: '2024-08-09',
      baseAllocation: 200,
      multiplier: 1.5, // MP multiplier
    },
    status: 'ACTIVE',
    joinDate: '2023-08-23',
    lastLogin: '2024-08-09 09:30',
  });

  const [allocations, setAllocations] = useState<CouponAllocation[]>([
    {
      id: 'ALLOC001',
      allocationDate: '2024-08-09',
      sessionName: 'Morning Parliamentary Session',
      programName: 'Budget Review Committee',
      couponsAllocated: 10,
      totalLitres: 50,
      totalValue: 9000,
      couponsUsed: 3,
      couponsRemaining: 7,
      status: 'ACTIVE',
      allocatedBy: 'Peter Ncube - Harare Sub-Center',
      subCenterName: 'Harare Central Sub-Center',
      firstCouponSerial: 'DSL5-2024-08-000001',
      lastCouponSerial: 'DSL5-2024-08-000010',
      expiryDate: '2024-08-16',
      notes: 'Committee travel and official duties',
      coupons: [
        {
          id: 'C001',
          couponSerial: 'DSL5-2024-08-000001',
          status: 'USED',
          usedDate: '2024-08-09',
          usedLocation: 'Shell Station - Borrowdale',
          litres: 5,
          value: 900,
        },
        {
          id: 'C002',
          couponSerial: 'DSL5-2024-08-000002',
          status: 'USED',
          usedDate: '2024-08-09',
          usedLocation: 'Total Station - Sam Levy',
          litres: 5,
          value: 900,
        },
        {
          id: 'C003',
          couponSerial: 'DSL5-2024-08-000003',
          status: 'USED',
          usedDate: '2024-08-09',
          usedLocation: 'Puma Station - Westgate',
          litres: 5,
          value: 900,
        },
      ],
    },
    {
      id: 'ALLOC002',
      allocationDate: '2024-08-05',
      sessionName: 'Special Committee Session',
      programName: 'Infrastructure Development',
      eventName: 'Site Inspection Tour',
      couponsAllocated: 20,
      totalLitres: 100,
      totalValue: 18000,
      couponsUsed: 20,
      couponsRemaining: 0,
      status: 'USED',
      allocatedBy: 'Susan Moyo - Bulawayo Sub-Center',
      subCenterName: 'Bulawayo North Sub-Center',
      firstCouponSerial: 'DSL5-2024-08-000021',
      lastCouponSerial: 'DSL5-2024-08-000040',
      expiryDate: '2024-08-12',
      notes: 'Multi-day committee travel for infrastructure inspection',
      coupons: [],
    },
  ]);

  const [attendance, setAttendance] = useState<AttendanceRecord[]>([
    {
      id: 'ATT001',
      date: '2024-08-09',
      sessionName: 'Parliamentary Plenary Session',
      sessionType: 'PLENARY',
      startTime: '09:00',
      endTime: '17:00',
      status: 'PRESENT',
      duration: 8,
      location: 'Main Parliament Chamber',
    },
    {
      id: 'ATT002',
      date: '2024-08-08',
      sessionName: 'Finance Committee Meeting',
      sessionType: 'COMMITTEE',
      startTime: '14:00',
      endTime: '16:30',
      status: 'PRESENT',
      duration: 2.5,
      location: 'Committee Room A',
    },
    {
      id: 'ATT003',
      date: '2024-08-07',
      sessionName: 'Budget Workshop',
      sessionType: 'WORKSHOP',
      startTime: '09:00',
      endTime: '12:00',
      status: 'LATE',
      duration: 2.5,
      location: 'Conference Hall',
      notes: 'Arrived 30 minutes late due to traffic',
    },
  ]);

  const [upcomingEvents, setUpcomingEvents] = useState<EventCalendar[]>([
    {
      id: 'EVT001',
      title: 'Parliamentary Plenary Session',
      date: '2024-08-12',
      time: '09:00',
      type: 'SESSION',
      location: 'Main Parliament Chamber',
      description: 'Regular parliamentary session for bill readings and debates',
      fuelAllocationEligible: true,
      estimatedFuelRequirement: 25,
      status: 'UPCOMING',
    },
    {
      id: 'EVT002',
      title: 'Finance Committee Site Visit',
      date: '2024-08-15',
      time: '08:00',
      type: 'COMMITTEE',
      location: 'Harare Industrial Area',
      description: 'Committee inspection of new industrial developments',
      fuelAllocationEligible: true,
      estimatedFuelRequirement: 40,
      status: 'UPCOMING',
    },
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'green';
      case 'USED': return 'blue';
      case 'EXPIRED': return 'orange';
      case 'VOIDED': return 'red';
      case 'PRESENT': return 'green';
      case 'ABSENT': return 'red';
      case 'LATE': return 'orange';
      case 'EXCUSED': return 'blue';
      case 'UPCOMING': return 'blue';
      case 'ONGOING': return 'orange';
      case 'COMPLETED': return 'green';
      case 'CANCELLED': return 'red';
      default: return 'default';
    }
  };

  const getCategoryInfo = (category: string) => {
    switch (category) {
      case 'MP':
        return { label: 'Member of Parliament', color: 'blue', icon: <BankOutlined /> };
      case 'SENATOR':
        return { label: 'Senator', color: 'purple', icon: <BankOutlined /> };
      case 'STAFF':
        return { label: 'Parliament Staff', color: 'green', icon: <TeamOutlined /> };
      case 'DRIVER':
        return { label: 'Official Driver', color: 'orange', icon: <CarOutlined /> };
      case 'CONSULTANT':
        return { label: 'Consultant', color: 'cyan', icon: <UserOutlined /> };
      default:
        return { label: category, color: 'default', icon: <UserOutlined /> };
    }
  };

  const allocationColumns: ColumnsType<CouponAllocation> = [
    {
      title: 'Date',
      dataIndex: 'allocationDate',
      key: 'allocationDate',
      render: (date) => dayjs(date).format('DD MMM YYYY'),
    },
    {
      title: 'Session/Program',
      key: 'session',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text strong style={{ fontSize: '12px' }}>{record.sessionName}</Text>
          <Text type="secondary" style={{ fontSize: '11px' }}>{record.programName}</Text>
          {record.eventName && (
            <Text type="secondary" style={{ fontSize: '10px', fontStyle: 'italic' }}>
              {record.eventName}
            </Text>
          )}
        </Space>
      ),
    },
    {
      title: 'Coupons',
      key: 'coupons',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text style={{ fontSize: '12px' }}>
            <strong>{record.couponsUsed}</strong> used / {record.couponsAllocated} total
          </Text>
          <Progress 
            percent={(record.couponsUsed / record.couponsAllocated) * 100} 
           
            status={record.couponsRemaining === 0 ? 'success' : 'normal'}
          />
        </Space>
      ),
    },
    {
      title: 'Fuel',
      key: 'fuel',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text style={{ fontSize: '12px' }}>{record.totalLitres}L</Text>
          <Text type="secondary" style={{ fontSize: '11px' }}>
            ZWG {record.totalValue.toLocaleString()}
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
          {status}
        </Tag>
      ),
    },
    {
      title: 'Expires',
      dataIndex: 'expiryDate',
      key: 'expiryDate',
      render: (date) => {
        const isExpiringSoon = dayjs(date).diff(dayjs(), 'days') <= 3;
        return (
          <Text 
            style={{ 
              fontSize: '12px',
              color: isExpiringSoon ? '#ff4d4f' : undefined 
            }}
          >
            {dayjs(date).format('DD MMM')}
            {isExpiringSoon && <ExclamationCircleOutlined style={{ marginLeft: 4 }} />}
          </Text>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button
         
          icon={<EyeOutlined />}
          onClick={() => {
            setSelectedAllocation(record);
            setAllocationDetailsVisible(true);
          }}
        >
          View
        </Button>
      ),
    },
  ];

  const attendanceColumns: ColumnsType<AttendanceRecord> = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (date) => dayjs(date).format('DD MMM YYYY'),
    },
    {
      title: 'Session',
      key: 'session',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text strong style={{ fontSize: '12px' }}>{record.sessionName}</Text>
          <Tag color={record.sessionType === 'PLENARY' ? 'blue' : record.sessionType === 'COMMITTEE' ? 'green' : 'orange'}>
            {record.sessionType}
          </Tag>
        </Space>
      ),
    },
    {
      title: 'Time',
      key: 'time',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text style={{ fontSize: '12px' }}>{record.startTime} - {record.endTime}</Text>
          <Text type="secondary" style={{ fontSize: '11px' }}>{record.duration}h duration</Text>
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {status}
        </Tag>
      ),
    },
    {
      title: 'Location',
      dataIndex: 'location',
      key: 'location',
      render: (location) => (
        <Text style={{ fontSize: '12px' }}>{location}</Text>
      ),
    },
  ];

  const categoryInfo = getCategoryInfo(profile.category);

  return (
    <div>
      {/* Header Section */}
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={16} align="middle">
          <Col>
            <Avatar size={80} icon={categoryInfo.icon} style={{ backgroundColor: categoryInfo.color }} />
          </Col>
          <Col flex={1}>
            <Space direction="vertical" size={0}>
              <Title level={2} style={{ margin: 0 }}>
                {profile.name}
              </Title>
              <Space>
                <Tag color={categoryInfo.color} icon={categoryInfo.icon}>
                  {categoryInfo.label}
                </Tag>
                <Tag color="blue">{profile.position}</Tag>
                <Tag color="green">{profile.department}</Tag>
              </Space>
              <Space>
                <Text type="secondary">Member ID: {profile.memberId}</Text>
                <Divider type="vertical" />
                <Text type="secondary">Last Login: {profile.lastLogin}</Text>
              </Space>
            </Space>
          </Col>
          <Col>
            <Space direction="vertical" align="end">
              <Badge 
                status={profile.status === 'ACTIVE' ? 'success' : 'error'} 
                text={profile.status}
              />
              <Text type="secondary">Joined: {dayjs(profile.joinDate).format('DD MMM YYYY')}</Text>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Statistics Cards */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Monthly Allocation"
              value={profile.allocationProfile.monthlyAllocation}
              suffix="L"
              prefix={<FireOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Current Balance"
              value={profile.allocationProfile.currentBalance}
              suffix="L"
              valueStyle={{ 
                color: profile.allocationProfile.currentBalance > 50 ? '#3f8600' : '#cf1322' 
              }}
            />
            <Progress 
              percent={(profile.allocationProfile.currentBalance / profile.allocationProfile.monthlyAllocation) * 100}
             
              style={{ marginTop: 8 }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Used This Month"
              value={profile.allocationProfile.usedThisMonth}
              suffix="L"
              prefix={<CarOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Active Allocations"
              value={allocations.filter(a => a.status === 'ACTIVE').length}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="Overview" key="overview">
          <Row gutter={16}>
            <Col span={16}>
              <Card title="Recent Fuel Allocations" style={{ marginBottom: 16 }}>
                <Table
                  columns={allocationColumns}
                  dataSource={allocations}
                  rowKey="id"
                  pagination={{ pageSize: 5 }}
                 
                />
              </Card>

              <Card title="Upcoming Events">
                <List
                  dataSource={upcomingEvents}
                  renderItem={(event) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={
                          <Badge 
                            status={getStatusColor(event.status) as any}
                            dot
                          />
                        }
                        title={
                          <Space>
                            <Text strong>{event.title}</Text>
                            <Tag color={getStatusColor(event.type)}>{event.type}</Tag>
                            {event.fuelAllocationEligible && (
                              <Tag color="green" icon={<FireOutlined />}>
                                Fuel Eligible
                              </Tag>
                            )}
                          </Space>
                        }
                        description={
                          <Space direction="vertical" size={0}>
                            <Space>
                              <CalendarOutlined />
                              <Text>{dayjs(event.date).format('DD MMM YYYY')} at {event.time}</Text>
                            </Space>
                            <Space>
                              <EnvironmentOutlined />
                              <Text>{event.location}</Text>
                            </Space>
                            <Text type="secondary">{event.description}</Text>
                            {event.estimatedFuelRequirement && (
                              <Text type="secondary">
                                Estimated fuel: {event.estimatedFuelRequirement}L
                              </Text>
                            )}
                          </Space>
                        }
                      />
                    </List.Item>
                  )}
                />
              </Card>
            </Col>

            <Col span={8}>
              <Card title="Profile Information" style={{ marginBottom: 16 }}>
                <Descriptions column={1}>
                  <Descriptions.Item label="Vehicle">
                    {profile.vehicleInfo.year} {profile.vehicleInfo.make} {profile.vehicleInfo.model}
                  </Descriptions.Item>
                  <Descriptions.Item label="Engine">
                    {profile.vehicleInfo.engineSize} ({profile.vehicleInfo.fuelType})
                  </Descriptions.Item>
                  <Descriptions.Item label="Registration">
                    {profile.vehicleInfo.registrationNumber}
                  </Descriptions.Item>
                  <Descriptions.Item label="Base Allocation">
                    {profile.allocationProfile.baseAllocation}L
                  </Descriptions.Item>
                  <Descriptions.Item label="Category Multiplier">
                    {profile.allocationProfile.multiplier}x
                  </Descriptions.Item>
                </Descriptions>
              </Card>

              <Card title="Contact Information">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Space>
                    <MailOutlined />
                    <Text copyable>{profile.contactInfo.email}</Text>
                  </Space>
                  <Space>
                    <PhoneOutlined />
                    <Text copyable>{profile.contactInfo.phone}</Text>
                  </Space>
                  <Space>
                    <BankOutlined />
                    <Text>{profile.contactInfo.office}</Text>
                  </Space>
                  <Space>
                    <EnvironmentOutlined />
                    <Text>{profile.contactInfo.address}</Text>
                  </Space>
                </Space>
              </Card>
            </Col>
          </Row>
        </TabPane>

        <TabPane tab="Fuel Allocations" key="allocations">
          <Card>
            <Table
              columns={allocationColumns}
              dataSource={allocations}
              rowKey="id"
              pagination={{
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => 
                  `${range[0]}-${range[1]} of ${total} allocations`,
              }}
            />
          </Card>
        </TabPane>

        <TabPane tab="Attendance" key="attendance">
          <Card>
            <Table
              columns={attendanceColumns}
              dataSource={attendance}
              rowKey="id"
              pagination={{
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => 
                  `${range[0]}-${range[1]} of ${total} records`,
              }}
            />
          </Card>
        </TabPane>

        <TabPane tab="Calendar" key="calendar">
          <Card>
            <Calendar
              dateCellRender={(date) => {
                const dayEvents = upcomingEvents.filter(event => 
                  dayjs(event.date).isSame(date, 'day')
                );
                return (
                  <div>
                    {dayEvents.map(event => (
                      <Badge
                        key={event.id}
                        status={getStatusColor(event.type) as any}
                        text={
                          <Text style={{ fontSize: '10px' }}>
                            {event.title}
                          </Text>
                        }
                      />
                    ))}
                  </div>
                );
              }}
            />
          </Card>
        </TabPane>
      </Tabs>

      {/* Allocation Details Modal */}
      <Modal
        title={
          <Space>
            <FileTextOutlined />
            Allocation Details - {selectedAllocation?.sessionName}
          </Space>
        }
        open={allocationDetailsVisible}
        onCancel={() => setAllocationDetailsVisible(false)}
        footer={null}
        width={800}
      >
        {selectedAllocation && (
          <div>
            <Descriptions bordered column={2} style={{ marginBottom: 16 }}>
              <Descriptions.Item label="Allocation Date">
                {dayjs(selectedAllocation.allocationDate).format('DD MMM YYYY')}
              </Descriptions.Item>
              <Descriptions.Item label="Allocated By">
                {selectedAllocation.allocatedBy}
              </Descriptions.Item>
              <Descriptions.Item label="Session">{selectedAllocation.sessionName}</Descriptions.Item>
              <Descriptions.Item label="Program">{selectedAllocation.programName}</Descriptions.Item>
              <Descriptions.Item label="Total Coupons">{selectedAllocation.couponsAllocated}</Descriptions.Item>
              <Descriptions.Item label="Total Fuel">{selectedAllocation.totalLitres}L</Descriptions.Item>
              <Descriptions.Item label="Total Value">ZWG {selectedAllocation.totalValue.toLocaleString()}</Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={getStatusColor(selectedAllocation.status)}>
                  {selectedAllocation.status}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Coupon Range" span={2}>
                {selectedAllocation.firstCouponSerial} - {selectedAllocation.lastCouponSerial}
              </Descriptions.Item>
              {selectedAllocation.notes && (
                <Descriptions.Item label="Notes" span={2}>
                  {selectedAllocation.notes}
                </Descriptions.Item>
              )}
            </Descriptions>

            {selectedAllocation.coupons && selectedAllocation.coupons.length > 0 && (
              <>
                <Divider>Individual Coupon Usage</Divider>
                <List
                  dataSource={selectedAllocation.coupons}
                  renderItem={(coupon) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={
                          <Badge 
                            status={getStatusColor(coupon.status) as any} 
                            dot 
                          />
                        }
                        title={
                          <Space>
                            <Text strong>{coupon.couponSerial}</Text>
                            <Tag color={getStatusColor(coupon.status)}>
                              {coupon.status}
                            </Tag>
                          </Space>
                        }
                        description={
                          coupon.status === 'USED' ? (
                            <Space direction="vertical" size={0}>
                              <Text type="secondary">
                                Used: {dayjs(coupon.usedDate).format('DD MMM YYYY')}
                              </Text>
                              <Text type="secondary">
                                Location: {coupon.usedLocation}
                              </Text>
                              <Text type="secondary">
                                {coupon.litres}L - ZWG {coupon.value.toLocaleString()}
                              </Text>
                            </Space>
                          ) : (
                            <Text type="secondary">
                              {coupon.litres}L - ZWG {coupon.value.toLocaleString()}
                            </Text>
                          )
                        }
                      />
                    </List.Item>
                  )}
                />
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default BeneficiaryAccountDashboard;
