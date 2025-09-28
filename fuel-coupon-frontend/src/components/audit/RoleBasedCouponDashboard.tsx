// src/components/audit/RoleBasedCouponDashboard.tsx
import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Row,
  Col,
  Typography,
  Statistic,
  Tag,
  Space,
  Button,
  Alert,
  Timeline,
  Badge,
  Tabs,
  Select,
  DatePicker,
  Input,
  Modal,
  Descriptions,
  message,
  Empty,
  Tooltip,
} from 'antd';
import {
  SendOutlined,
  SwapOutlined,
  UserOutlined,
  EyeOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  BarcodeOutlined,
  FileTextOutlined,
  ReloadOutlined,
  SearchOutlined,
  CalendarOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import apiClient from '@/api';
import { useAuth } from '@/contexts/AuthContext';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { TabPane } = Tabs;

interface CouponSerialTracking {
  id: string;
  serial_number: string; // PU006GH001001, PU006GH001002, etc.
  fuel_type: 'PETROL' | 'DIESEL';
  denomination: 5 | 20;
  book_serial: string;
  current_status: 'DISPATCHED' | 'IN_TRANSIT' | 'RECEIVED' | 'ALLOCATED' | 'USED' | 'EXPIRED';
  
  // Role-specific tracking
  dispatcher_info: {
    dispatched_by: string;
    dispatch_date: string;
    dispatch_time: string;
    from_center: string;
    to_center: string;
    dispatch_id: string;
    batch_number: string;
  };
  
  handover_info?: {
    received_by: string;
    received_date: string;
    received_time: string;
    handover_confirmed: boolean;
    handover_id: string;
    vehicle_number?: string;
    driver_name?: string;
  };
  
  allocation_info?: {
    allocated_to: string;
    beneficiary_name: string;
    allocated_by: string;
    allocated_date: string;
    allocated_time: string;
    allocation_source: string; // Monthly, Session, Committee, etc.
    allocation_id: string;
  };
  
  usage_info?: {
    used_date: string;
    used_time: string;
    station_name: string;
    station_operator: string;
    usage_id: string;
    litres_dispensed: number;
  };
  
  // Real-time tracking
  last_updated: string;
  current_holder: string; // Who currently has responsibility
  next_expected_action: string;
  days_since_dispatch: number;
  location_status: 'MAIN_CENTER' | 'IN_TRANSIT' | 'SUB_CENTER' | 'WITH_BENEFICIARY' | 'AT_STATION' | 'USED';
}

interface RoleBasedStats {
  // Dispatcher perspective
  total_dispatched: number;
  pending_receipt: number;
  confirmed_received: number;
  overdue_handovers: number;
  
  // Auditor perspective
  total_in_system: number;
  accountability_gaps: number;
  compliance_score: number;
  flagged_serials: number;
  
  // Beneficiary perspective
  total_allocated: number;
  available_for_use: number;
  used_coupons: number;
  expired_coupons: number;
}

interface RoleBasedCouponDashboardProps {
  userRole: 'DISPATCHER' | 'AUDITOR' | 'BENEFICIARY' | 'SUB_CENTER' | 'MAIN_CENTER';
  userId?: string;
  showRealTimeUpdates?: boolean;
}

const RoleBasedCouponDashboard: React.FC<RoleBasedCouponDashboardProps> = ({
  userRole,
  userId,
  showRealTimeUpdates = true,
}) => {
  const { user } = useAuth();
  const [coupons, setCoupons] = useState<CouponSerialTracking[]>([]);
  const [stats, setStats] = useState<RoleBasedStats>({
    total_dispatched: 0,
    pending_receipt: 0,
    confirmed_received: 0,
    overdue_handovers: 0,
    total_in_system: 0,
    accountability_gaps: 0,
    compliance_score: 100,
    flagged_serials: 0,
    total_allocated: 0,
    available_for_use: 0,
    used_coupons: 0,
    expired_coupons: 0,
  });
  const [loading, setLoading] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<CouponSerialTracking | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('current');
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);

  useEffect(() => {
    fetchRoleBasedCoupons();
    if (showRealTimeUpdates) {
      const interval = setInterval(fetchRoleBasedCoupons, 30000); // Update every 30 seconds
      return () => clearInterval(interval);
    }
  }, [userRole, userId, statusFilter, dateRange]);

  const fetchRoleBasedCoupons = async () => {
    setLoading(true);
    try {
      console.log(`🔍 Fetching ${userRole} coupon tracking data...`);
      
      const params: any = {
        role: userRole,
        user_id: userId || user?.id,
        include_timestamps: true,
        include_chain_tracking: true,
      };
      
      if (statusFilter) params.status = statusFilter;
      if (dateRange) {
        params.start_date = dateRange[0].format('YYYY-MM-DD');
        params.end_date = dateRange[1].format('YYYY-MM-DD');
      }
      
      const response = await apiClient.get('/audit/role-based-tracking/', { params });
      const trackingData = response.data.results || response.data.coupons || [];
      const statsData = response.data.stats || {};
      
      console.log(`📊 ${userRole} tracking data loaded:`, trackingData.length, 'coupons');
      setCoupons(trackingData);
      setStats(statsData);
      
    } catch (error) {
      console.error('Error fetching role-based tracking:', error);
      message.error(`Failed to load ${userRole.toLowerCase()} tracking data`);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DISPATCHED': return 'blue';
      case 'IN_TRANSIT': return 'purple';
      case 'RECEIVED': return 'green';
      case 'ALLOCATED': return 'orange';
      case 'USED': return 'success';
      case 'EXPIRED': return 'error';
      default: return 'default';
    }
  };

  const getLocationBadge = (location: string) => {
    const colors = {
      'MAIN_CENTER': 'blue',
      'IN_TRANSIT': 'purple',
      'SUB_CENTER': 'green',
      'WITH_BENEFICIARY': 'orange',
      'AT_STATION': 'gold',
      'USED': 'success',
    };
    return <Badge color={colors[location as keyof typeof colors] || 'default'} text={location.replace('_', ' ')} />;
  };

  const viewCouponDetails = (coupon: CouponSerialTracking) => {
    setSelectedCoupon(coupon);
    setDetailModalVisible(true);
  };

  // Role-specific column configurations
  const getColumnsForRole = (): ColumnsType<CouponSerialTracking> => {
    const baseColumns: ColumnsType<CouponSerialTracking> = [
      {
        title: 'Serial Number',
        dataIndex: 'serial_number',
        key: 'serial_number',
        width: 130,
        render: (text) => (
          <Text strong style={{ fontFamily: 'monospace', fontSize: '11px' }}>
            {text}
          </Text>
        ),
        sorter: (a, b) => a.serial_number.localeCompare(b.serial_number),
      },
      {
        title: 'Status',
        dataIndex: 'current_status',
        key: 'current_status',
        width: 100,
        render: (status) => (
          <Tag color={getStatusColor(status)}>{status}</Tag>
        ),
      },
      {
        title: 'Location',
        dataIndex: 'location_status',
        key: 'location_status',
        width: 120,
        render: (location) => getLocationBadge(location),
      },
    ];

    switch (userRole) {
      case 'DISPATCHER':
      case 'MAIN_CENTER':
        return [
          ...baseColumns,
          {
            title: 'Dispatched',
            key: 'dispatch_info',
            width: 180,
            render: (_, record) => (
              <div>
                <Text style={{ fontSize: '11px' }}>
                  {dayjs(record.dispatcher_info.dispatch_date).format('MMM DD, HH:mm')}
                </Text>
                <br />
                <Text type="secondary" style={{ fontSize: '10px' }}>
                  to {record.dispatcher_info.to_center}
                </Text>
                <br />
                <Text type="secondary" style={{ fontSize: '10px' }}>
                  Batch: {record.dispatcher_info.batch_number}
                </Text>
              </div>
            ),
          },
          {
            title: 'Receipt Status',
            key: 'receipt_status',
            width: 150,
            render: (_, record) => (
              <div>
                {record.handover_info ? (
                  <>
                    <Tag color="green">RECEIVED</Tag>
                    <br />
                    <Text type="secondary" style={{ fontSize: '10px' }}>
                      {dayjs(record.handover_info.received_date).format('MMM DD, HH:mm')}
                    </Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: '10px' }}>
                      by {record.handover_info.received_by}
                    </Text>
                  </>
                ) : (
                  <>
                    <Tag color={record.days_since_dispatch > 3 ? 'red' : 'orange'}>
                      PENDING
                    </Tag>
                    <br />
                    <Text type="secondary" style={{ fontSize: '10px' }}>
                      {record.days_since_dispatch} days ago
                    </Text>
                  </>
                )}
              </div>
            ),
          },
          {
            title: 'Current Holder',
            dataIndex: 'current_holder',
            key: 'current_holder',
            width: 120,
            render: (holder) => (
              <Text style={{ fontSize: '11px' }}>{holder}</Text>
            ),
          },
        ];

      case 'SUB_CENTER':
        return [
          ...baseColumns,
          {
            title: 'Received',
            key: 'received_info',
            width: 150,
            render: (_, record) => (
              <div>
                {record.handover_info ? (
                  <>
                    <Text style={{ fontSize: '11px' }}>
                      {dayjs(record.handover_info.received_date).format('MMM DD, HH:mm')}
                    </Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: '10px' }}>
                      by {record.handover_info.received_by}
                    </Text>
                  </>
                ) : (
                  <Text type="secondary">Not received</Text>
                )}
              </div>
            ),
          },
          {
            title: 'Allocation',
            key: 'allocation_status',
            width: 180,
            render: (_, record) => (
              <div>
                {record.allocation_info ? (
                  <>
                    <Text style={{ fontSize: '11px' }}>
                      {record.allocation_info.beneficiary_name}
                    </Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: '10px' }}>
                      {dayjs(record.allocation_info.allocated_date).format('MMM DD, HH:mm')}
                    </Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: '10px' }}>
                      {record.allocation_info.allocation_source}
                    </Text>
                  </>
                ) : record.handover_info ? (
                  <Tag color="orange">AVAILABLE</Tag>
                ) : (
                  <Text type="secondary">—</Text>
                )}
              </div>
            ),
          },
        ];

      case 'BENEFICIARY':
        return [
          ...baseColumns,
          {
            title: 'Allocated to Me',
            key: 'my_allocation',
            width: 150,
            render: (_, record) => (
              <div>
                {record.allocation_info ? (
                  <>
                    <Text style={{ fontSize: '11px' }}>
                      {dayjs(record.allocation_info.allocated_date).format('MMM DD, HH:mm')}
                    </Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: '10px' }}>
                      {record.allocation_info.allocation_source}
                    </Text>
                  </>
                ) : (
                  <Text type="secondary">Not allocated</Text>
                )}
              </div>
            ),
          },
          {
            title: 'Usage Status',
            key: 'usage_status',
            width: 150,
            render: (_, record) => (
              <div>
                {record.usage_info ? (
                  <>
                    <Tag color="green">USED</Tag>
                    <br />
                    <Text type="secondary" style={{ fontSize: '10px' }}>
                      {dayjs(record.usage_info.used_date).format('MMM DD, HH:mm')}
                    </Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: '10px' }}>
                      @ {record.usage_info.station_name}
                    </Text>
                  </>
                ) : record.allocation_info ? (
                  <Tag color="orange">AVAILABLE FOR USE</Tag>
                ) : (
                  <Text type="secondary">—</Text>
                )}
              </div>
            ),
          },
          {
            title: 'Fuel Amount',
            key: 'fuel_amount',
            width: 100,
            render: (_, record) => (
              <div>
                <Tag color={record.fuel_type === 'PETROL' ? 'blue' : 'orange'}>
                  {record.fuel_type}
                </Tag>
                <br />
                <Text strong style={{ fontSize: '12px' }}>{record.denomination}L</Text>
              </div>
            ),
          },
        ];

      case 'AUDITOR':
        return [
          ...baseColumns,
          {
            title: 'Chain Completeness',
            key: 'audit_status',
            width: 150,
            render: (_, record) => {
              const hasDispatch = !!record.dispatcher_info;
              const hasHandover = !!record.handover_info;
              const hasAllocation = !!record.allocation_info;
              const hasUsage = !!record.usage_info;
              
              const completeness = [hasDispatch, hasHandover, hasAllocation, hasUsage].filter(Boolean).length;
              const total = record.current_status === 'USED' ? 4 : record.current_status === 'ALLOCATED' ? 3 : 2;
              
              return (
                <div>
                  <Text style={{ fontSize: '11px' }}>
                    {completeness}/{total} stages
                  </Text>
                  <br />
                  {completeness === total ? (
                    <Tag color="green">COMPLETE</Tag>
                  ) : (
                    <Tag color="orange">INCOMPLETE</Tag>
                  )}
                </div>
              );
            },
          },
          {
            title: 'Last Activity',
            key: 'last_activity',
            width: 150,
            render: (_, record) => (
              <div>
                <Text style={{ fontSize: '11px' }}>
                  {dayjs(record.last_updated).format('MMM DD, HH:mm')}
                </Text>
                <br />
                <Text type="secondary" style={{ fontSize: '10px' }}>
                  by {record.current_holder}
                </Text>
              </div>
            ),
          },
          {
            title: 'Next Action',
            dataIndex: 'next_expected_action',
            key: 'next_expected_action',
            width: 120,
            render: (action) => (
              <Tag color="blue" style={{ fontSize: '10px' }}>
                {action}
              </Tag>
            ),
          },
        ];

      default:
        return baseColumns;
    }
  };

  const renderRoleSpecificStats = () => {
    switch (userRole) {
      case 'DISPATCHER':
      case 'MAIN_CENTER':
        return (
          <Row gutter={[16, 16]}>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Total Dispatched"
                  value={stats.total_dispatched}
                  prefix={<SendOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Pending Receipt"
                  value={stats.pending_receipt}
                  prefix={<ClockCircleOutlined />}
                  valueStyle={{ color: stats.pending_receipt > 0 ? '#faad14' : '#52c41a' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Confirmed Received"
                  value={stats.confirmed_received}
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Overdue Handovers"
                  value={stats.overdue_handovers}
                  prefix={<ExclamationCircleOutlined />}
                  valueStyle={{ color: stats.overdue_handovers > 0 ? '#ff4d4f' : '#52c41a' }}
                />
              </Card>
            </Col>
          </Row>
        );

      case 'AUDITOR':
        return (
          <Row gutter={[16, 16]}>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Total in System"
                  value={stats.total_in_system}
                  prefix={<BarcodeOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Compliance Score"
                  value={stats.compliance_score}
                  suffix="%"
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: stats.compliance_score >= 95 ? '#52c41a' : stats.compliance_score >= 85 ? '#faad14' : '#ff4d4f' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Accountability Gaps"
                  value={stats.accountability_gaps}
                  prefix={<ExclamationCircleOutlined />}
                  valueStyle={{ color: stats.accountability_gaps > 0 ? '#ff4d4f' : '#52c41a' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Flagged Serials"
                  value={stats.flagged_serials}
                  prefix={<ExclamationCircleOutlined />}
                  valueStyle={{ color: stats.flagged_serials > 0 ? '#ff4d4f' : '#52c41a' }}
                />
              </Card>
            </Col>
          </Row>
        );

      case 'BENEFICIARY':
        return (
          <Row gutter={[16, 16]}>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Allocated to Me"
                  value={stats.total_allocated}
                  prefix={<UserOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Available for Use"
                  value={stats.available_for_use}
                  prefix={<BarcodeOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Used"
                  value={stats.used_coupons}
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Expired"
                  value={stats.expired_coupons}
                  prefix={<ClockCircleOutlined />}
                  valueStyle={{ color: stats.expired_coupons > 0 ? '#ff4d4f' : '#52c41a' }}
                />
              </Card>
            </Col>
          </Row>
        );

      default:
        return null;
    }
  };

  const filteredCoupons = coupons.filter(coupon => {
    const matchesSearch = !searchText || 
      (coupon.serial_number && coupon.serial_number.toString().toLowerCase().includes(searchText.toLowerCase())) ||
      (coupon.current_holder && coupon.current_holder.toString().toLowerCase().includes(searchText.toLowerCase()));
    
    return matchesSearch;
  });

  return (
    <div>
      {/* Header */}
      <Card style={{ marginBottom: 16 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={3} style={{ margin: 0 }}>
              {userRole.replace('_', ' ')} Coupon Tracking Dashboard
            </Title>
            <Text type="secondary">
              Real-time individual coupon serial tracking with precise timestamps
            </Text>
            {showRealTimeUpdates && (
              <Badge 
                dot 
                color="green" 
                style={{ marginLeft: 8 }}
                title="Auto-updating every 30 seconds"
              />
            )}
          </Col>
          <Col>
            <Space>
              <Button 
                icon={<ReloadOutlined />} 
                onClick={fetchRoleBasedCoupons}
                loading={loading}
              >
                Refresh
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Statistics */}
      <div style={{ marginBottom: 24 }}>
        {renderRoleSpecificStats()}
      </div>

      {/* Filters */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={8}>
            <Search
              placeholder="Search by serial number or holder"
              allowClear
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </Col>
          <Col xs={24} sm={6}>
            <Select
              placeholder="Filter by status"
              allowClear
              style={{ width: '100%' }}
              value={statusFilter}
              onChange={setStatusFilter}
            >
              <Option value="DISPATCHED">Dispatched</Option>
              <Option value="IN_TRANSIT">In Transit</Option>
              <Option value="RECEIVED">Received</Option>
              <Option value="ALLOCATED">Allocated</Option>
              <Option value="USED">Used</Option>
              <Option value="EXPIRED">Expired</Option>
            </Select>
          </Col>
          <Col xs={24} sm={10}>
            <RangePicker
              style={{ width: '100%' }}
              value={dateRange}
              onChange={(dates) => setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)}
              placeholder={['Start Date', 'End Date']}
            />
          </Col>
        </Row>
      </Card>

      {/* Main Table */}
      <Card title={`${userRole.replace('_', ' ')} View: ${filteredCoupons.length} Coupon Serials`}>
        <Table
          columns={[
            ...getColumnsForRole(),
            {
              title: 'Actions',
              key: 'actions',
              width: 80,
              render: (_, record) => (
                <Button
                  type="link"
                  size="small"
                  icon={<EyeOutlined />}
                  onClick={() => viewCouponDetails(record)}
                >
                  Details
                </Button>
              ),
            },
          ]}
          dataSource={filteredCoupons}
          rowKey="id"
          loading={loading}
          size="small"
          scroll={{ x: 1200 }}
          pagination={{
            pageSize: 50,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} of ${total} coupon serials`,
          }}
        />
      </Card>

      {/* Detail Modal */}
      <Modal
        title={`Complete Serial Tracking: ${selectedCoupon?.serial_number}`}
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={900}
      >
        {selectedCoupon && (
          <div>
            <Alert
              message="Complete Accountability Chain"
              description="This shows the complete journey of this specific coupon serial number with precise timestamps and responsible parties."
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />

            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="Serial Number" span={2}>
                <Text strong style={{ fontFamily: 'monospace', fontSize: '14px' }}>
                  {selectedCoupon.serial_number}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Current Status">
                <Tag color={getStatusColor(selectedCoupon.current_status)}>
                  {selectedCoupon.current_status}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Location">
                {getLocationBadge(selectedCoupon.location_status)}
              </Descriptions.Item>
              <Descriptions.Item label="Current Holder" span={2}>
                <Text strong>{selectedCoupon.current_holder}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Days Since Dispatch">
                {selectedCoupon.days_since_dispatch} days
              </Descriptions.Item>
              <Descriptions.Item label="Next Expected Action">
                <Tag color="blue">{selectedCoupon.next_expected_action}</Tag>
              </Descriptions.Item>
            </Descriptions>

            <Title level={5} style={{ marginTop: 24, marginBottom: 16 }}>
              Complete Accountability Timeline
            </Title>
            
            <Timeline>
              {/* Dispatch */}
              <Timeline.Item color="blue" dot={<SendOutlined />}>
                <div>
                  <Text strong>Dispatched from Main Center</Text>
                  <br />
                  <Text>
                    {dayjs(selectedCoupon.dispatcher_info.dispatch_date).format('MMMM DD, YYYY')} at{' '}
                    {selectedCoupon.dispatcher_info.dispatch_time}
                  </Text>
                  <br />
                  <Text type="secondary">
                    By: {selectedCoupon.dispatcher_info.dispatched_by}
                  </Text>
                  <br />
                  <Text type="secondary">
                    Route: {selectedCoupon.dispatcher_info.from_center} → {selectedCoupon.dispatcher_info.to_center}
                  </Text>
                  <br />
                  <Text type="secondary">
                    Batch: {selectedCoupon.dispatcher_info.batch_number} | 
                    Dispatch ID: {selectedCoupon.dispatcher_info.dispatch_id}
                  </Text>
                </div>
              </Timeline.Item>

              {/* Handover */}
              {selectedCoupon.handover_info && (
                <Timeline.Item color="green" dot={<SwapOutlined />}>
                  <div>
                    <Text strong>Received at SubCenter</Text>
                    <br />
                    <Text>
                      {dayjs(selectedCoupon.handover_info.received_date).format('MMMM DD, YYYY')} at{' '}
                      {selectedCoupon.handover_info.received_time}
                    </Text>
                    <br />
                    <Text type="secondary">
                      Received by: {selectedCoupon.handover_info.received_by}
                    </Text>
                    <br />
                    <Text type="secondary">
                      Handover ID: {selectedCoupon.handover_info.handover_id}
                    </Text>
                    {selectedCoupon.handover_info.vehicle_number && (
                      <>
                        <br />
                        <Text type="secondary">
                          Vehicle: {selectedCoupon.handover_info.vehicle_number} | 
                          Driver: {selectedCoupon.handover_info.driver_name}
                        </Text>
                      </>
                    )}
                  </div>
                </Timeline.Item>
              )}

              {/* Allocation */}
              {selectedCoupon.allocation_info && (
                <Timeline.Item color="orange" dot={<UserOutlined />}>
                  <div>
                    <Text strong>Allocated to Beneficiary</Text>
                    <br />
                    <Text>
                      {dayjs(selectedCoupon.allocation_info.allocated_date).format('MMMM DD, YYYY')} at{' '}
                      {selectedCoupon.allocation_info.allocated_time}
                    </Text>
                    <br />
                    <Text type="secondary">
                      Beneficiary: {selectedCoupon.allocation_info.beneficiary_name}
                    </Text>
                    <br />
                    <Text type="secondary">
                      Allocated by: {selectedCoupon.allocation_info.allocated_by}
                    </Text>
                    <br />
                    <Text type="secondary">
                      Source: {selectedCoupon.allocation_info.allocation_source}
                    </Text>
                    <br />
                    <Text type="secondary">
                      Allocation ID: {selectedCoupon.allocation_info.allocation_id}
                    </Text>
                  </div>
                </Timeline.Item>
              )}

              {/* Usage */}
              {selectedCoupon.usage_info && (
                <Timeline.Item color="green" dot={<CheckCircleOutlined />}>
                  <div>
                    <Text strong>Used at Fuel Station</Text>
                    <br />
                    <Text>
                      {dayjs(selectedCoupon.usage_info.used_date).format('MMMM DD, YYYY')} at{' '}
                      {selectedCoupon.usage_info.used_time}
                    </Text>
                    <br />
                    <Text type="secondary">
                      Station: {selectedCoupon.usage_info.station_name}
                    </Text>
                    <br />
                    <Text type="secondary">
                      Operator: {selectedCoupon.usage_info.station_operator}
                    </Text>
                    <br />
                    <Text type="secondary">
                      Litres Dispensed: {selectedCoupon.usage_info.litres_dispensed}L
                    </Text>
                    <br />
                    <Text type="secondary">
                      Usage ID: {selectedCoupon.usage_info.usage_id}
                    </Text>
                  </div>
                </Timeline.Item>
              )}
            </Timeline>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default RoleBasedCouponDashboard;