// src/components/beneficiary/BeneficiaryCouponDashboard.tsx
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
  Timeline,
  Modal,
  Descriptions,
  Alert,
  Badge,
  Progress,
  Input,
  Select,
  DatePicker,
  Tooltip,
  message,
  Empty,
} from 'antd';
import {
  UserOutlined,
  BarcodeOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
  SearchOutlined,
  CalendarOutlined,
  CarOutlined,
  ReloadOutlined,
  DownloadOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import apiClient from '@/api';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

interface BeneficiaryCoupon {
  id: string;
  serial_number: string;
  fuel_type: 'PETROL' | 'DIESEL';
  denomination: 5 | 20;
  book_serial: string;
  status: 'ALLOCATED' | 'USED' | 'EXPIRED';
  
  // Allocation details
  allocated_date: string;
  allocated_by: string;
  allocation_source: string; // e.g., "Monthly Entitlement", "Session Attendance"
  
  // Usage details
  used_date?: string;
  used_at_station?: string;
  station_name?: string;
  usage_notes?: string;
  
  // Expiry
  expiry_date?: string;
  
  // Tracking
  dispatch_id: string;
  from_center: string;
  to_center: string;
  handover_date: string;
}

interface BeneficiaryFuelSummary {
  beneficiary_id: string;
  beneficiary_name: string;
  position: string;
  department: string;
  
  // Entitlements
  total_entitlement: number;
  monthly_entitlement: number;
  session_entitlement: number;
  special_entitlement: number;
  
  // Current period usage
  total_allocated: number;
  total_used: number;
  total_remaining: number;
  
  // Coupon counts
  coupons_allocated: number;
  coupons_used: number;
  coupons_expired: number;
  
  // Values
  total_value_allocated: number;
  total_value_used: number;
  
  // Dates
  last_allocation_date?: string;
  last_usage_date?: string;
  current_period_start: string;
  current_period_end: string;
}

interface BeneficiaryCouponDashboardProps {
  beneficiaryId?: string;
  showSearch?: boolean;
  showFilters?: boolean;
  showSummary?: boolean;
  viewMode?: 'table' | 'timeline' | 'summary';
  dateRange?: [string, string];
}

const BeneficiaryCouponDashboard: React.FC<BeneficiaryCouponDashboardProps> = ({
  beneficiaryId,
  showSearch = true,
  showFilters = true,
  showSummary = true,
  viewMode = 'table',
  dateRange,
}) => {
  const [coupons, setCoupons] = useState<BeneficiaryCoupon[]>([]);
  const [summary, setSummary] = useState<BeneficiaryFuelSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<BeneficiaryCoupon | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  
  // Filters
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [fuelTypeFilter, setFuelTypeFilter] = useState<string | undefined>();
  const [selectedDateRange, setSelectedDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);

  useEffect(() => {
    if (beneficiaryId) {
      fetchBeneficiaryCoupons();
      fetchBeneficiarySummary();
    }
  }, [beneficiaryId, statusFilter, fuelTypeFilter, selectedDateRange]);

  const fetchBeneficiaryCoupons = async () => {
    if (!beneficiaryId) return;
    
    setLoading(true);
    try {
      console.log('🔍 Fetching beneficiary coupons...');
      
      const params: any = {
        beneficiary_id: beneficiaryId,
      };
      
      if (statusFilter) params.status = statusFilter;
      if (fuelTypeFilter) params.fuel_type = fuelTypeFilter;
      if (selectedDateRange) {
        params.start_date = selectedDateRange[0].format('YYYY-MM-DD');
        params.end_date = selectedDateRange[1].format('YYYY-MM-DD');
      } else if (dateRange) {
        params.start_date = dateRange[0];
        params.end_date = dateRange[1];
      }
      
      const response = await apiClient.get('/beneficiaries/coupons/', { params });
      const couponData = response.data.results || response.data || [];
      
      console.log('🎫 Beneficiary coupons loaded:', couponData.length);
      setCoupons(couponData);
      
    } catch (error) {
      console.error('Error fetching beneficiary coupons:', error);
      message.error('Failed to load beneficiary coupons');
    } finally {
      setLoading(false);
    }
  };

  const fetchBeneficiarySummary = async () => {
    if (!beneficiaryId) return;
    
    try {
      console.log('📊 Fetching beneficiary fuel summary...');
      
      const response = await apiClient.get(`/beneficiaries/${beneficiaryId}/fuel-summary/`);
      const summaryData = response.data;
      
      console.log('📋 Beneficiary summary loaded:', summaryData);
      setSummary(summaryData);
      
    } catch (error) {
      console.error('Error fetching beneficiary summary:', error);
      // Don't show error message for summary as it's supplementary
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ALLOCATED': return 'orange';
      case 'USED': return 'green';
      case 'EXPIRED': return 'red';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ALLOCATED': return <ClockCircleOutlined />;
      case 'USED': return <CheckCircleOutlined />;
      case 'EXPIRED': return <ExclamationCircleOutlined />;
      default: return null;
    }
  };

  const handleExportCoupons = () => {
    if (coupons.length === 0) {
      message.warning('No coupons to export');
      return;
    }

    const csvContent = [
      ['Serial Number', 'Status', 'Fuel Type', 'Denomination', 'Allocated Date', 'Used Date', 'Station', 'Allocation Source'].join(','),
      ...coupons.map(c => [
        c.serial_number,
        c.status,
        c.fuel_type,
        c.denomination,
        c.allocated_date,
        c.used_date || '',
        c.station_name || '',
        c.allocation_source
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `beneficiary-coupons-${dayjs().format('YYYY-MM-DD')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const viewCouponDetails = (coupon: BeneficiaryCoupon) => {
    setSelectedCoupon(coupon);
    setDetailModalVisible(true);
  };

  const getFilteredCoupons = () => {
    return coupons.filter(coupon => {
      const matchesSearch = !searchText || 
        coupon.serial_number.toLowerCase().includes(searchText.toLowerCase()) ||
        coupon.allocation_source.toLowerCase().includes(searchText.toLowerCase()) ||
        (coupon.station_name && coupon.station_name.toLowerCase().includes(searchText.toLowerCase()));
      
      return matchesSearch;
    });
  };

  const couponColumns: ColumnsType<BeneficiaryCoupon> = [
    {
      title: 'Serial Number',
      dataIndex: 'serial_number',
      key: 'serial_number',
      width: 140,
      render: (text) => (
        <Text strong style={{ fontFamily: 'monospace', fontSize: '11px' }}>
          {text}
        </Text>
      ),
      sorter: (a, b) => a.serial_number.localeCompare(b.serial_number),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => (
        <Tag color={getStatusColor(status)} icon={getStatusIcon(status)}>
          {status}
        </Tag>
      ),
      filters: [
        { text: 'Allocated', value: 'ALLOCATED' },
        { text: 'Used', value: 'USED' },
        { text: 'Expired', value: 'EXPIRED' },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: 'Fuel Info',
      key: 'fuel_info',
      width: 120,
      render: (_, record) => (
        <div>
          <Tag color={record.fuel_type === 'PETROL' ? 'blue' : 'orange'}>
            {record.fuel_type}
          </Tag>
          <br />
          <Text type="secondary" style={{ fontSize: '11px' }}>{record.denomination}L</Text>
        </div>
      ),
    },
    {
      title: 'Allocation',
      key: 'allocation_info',
      width: 180,
      render: (_, record) => (
        <div>
          <Text style={{ fontSize: '12px' }}>{record.allocation_source}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '10px' }}>
            {dayjs(record.allocated_date).format('MMM DD, YYYY')}
          </Text>
          <br />
          <Text type="secondary" style={{ fontSize: '10px' }}>
            by {record.allocated_by}
          </Text>
        </div>
      ),
      sorter: (a, b) => dayjs(a.allocated_date).unix() - dayjs(b.allocated_date).unix(),
    },
    {
      title: 'Usage',
      key: 'usage_info',
      width: 150,
      render: (_, record) => (
        <div>
          {record.status === 'USED' && record.used_date ? (
            <>
              <Text style={{ fontSize: '11px', color: '#52c41a' }}>
                {dayjs(record.used_date).format('MMM DD, YYYY')}
              </Text>
              {record.station_name && (
                <>
                  <br />
                  <Text type="secondary" style={{ fontSize: '10px' }}>
                    @ {record.station_name}
                  </Text>
                </>
              )}
            </>
          ) : record.status === 'EXPIRED' ? (
            <Text type="danger" style={{ fontSize: '11px' }}>
              Expired {record.expiry_date && dayjs(record.expiry_date).format('MMM DD')}
            </Text>
          ) : (
            <Text type="secondary">Pending use</Text>
          )}
        </div>
      ),
    },
    {
      title: 'Book Serial',
      dataIndex: 'book_serial',
      key: 'book_serial',
      width: 100,
      render: (text) => (
        <Text style={{ fontFamily: 'monospace', fontSize: '10px' }}>
          {text}
        </Text>
      ),
    },
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
  ];

  const renderSummaryCards = () => {
    if (!summary) return null;

    return (
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Total Entitlement"
              value={summary.total_entitlement}
              suffix="L"
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Allocated"
              value={summary.total_allocated}
              suffix="L"
              prefix={<BarcodeOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Used"
              value={summary.total_used}
              suffix="L"
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Remaining"
              value={summary.total_remaining}
              suffix="L"
              prefix={<ClockCircleOutlined />}
              valueStyle={{ 
                color: summary.total_remaining > 0 ? '#52c41a' : '#ff4d4f' 
              }}
            />
          </Card>
        </Col>
        
        <Col span={24}>
          <Card>
            <Row gutter={[16, 16]}>
              <Col span={8}>
                <div>
                  <Text type="secondary">Usage Progress</Text>
                  <Progress 
                    percent={Math.round((summary.total_used / summary.total_entitlement) * 100)}
                    strokeColor="#52c41a"
                    format={percent => `${percent}% Used`}
                  />
                </div>
              </Col>
              <Col span={8}>
                <div>
                  <Text type="secondary">Coupon Status</Text>
                  <div style={{ marginTop: 8 }}>
                    <Tag color="orange">{summary.coupons_allocated - summary.coupons_used} Pending</Tag>
                    <Tag color="green">{summary.coupons_used} Used</Tag>
                    <Tag color="red">{summary.coupons_expired} Expired</Tag>
                  </div>
                </div>
              </Col>
              <Col span={8}>
                <div>
                  <Text type="secondary">Value Summary</Text>
                  <div style={{ marginTop: 8 }}>
                    <div>
                      <Text style={{ fontSize: '12px' }}>
                        Allocated: <Text strong>ZWG${summary.total_value_allocated.toLocaleString()}</Text>
                      </Text>
                    </div>
                    <div>
                      <Text style={{ fontSize: '12px' }}>
                        Used: <Text strong>ZWG${summary.total_value_used.toLocaleString()}</Text>
                      </Text>
                    </div>
                  </div>
                </div>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    );
  };

  const renderTimelineView = () => {
    const sortedCoupons = [...getFilteredCoupons()].sort((a, b) => 
      dayjs(b.allocated_date).unix() - dayjs(a.allocated_date).unix()
    );

    return (
      <Card title="Coupon Timeline">
        <Timeline>
          {sortedCoupons.map(coupon => (
            <Timeline.Item
              key={coupon.id}
              dot={getStatusIcon(coupon.status)}
              color={getStatusColor(coupon.status)}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <Text strong style={{ fontFamily: 'monospace' }}>{coupon.serial_number}</Text>
                    <Tag color={coupon.fuel_type === 'PETROL' ? 'blue' : 'orange'} style={{ marginLeft: 8 }}>
                      {coupon.fuel_type} {coupon.denomination}L
                    </Tag>
                    <br />
                    <Text type="secondary">{coupon.allocation_source}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: '11px' }}>
                      Allocated: {dayjs(coupon.allocated_date).format('MMMM DD, YYYY HH:mm')}
                    </Text>
                    {coupon.used_date && (
                      <>
                        <br />
                        <Text type="secondary" style={{ fontSize: '11px' }}>
                          Used: {dayjs(coupon.used_date).format('MMMM DD, YYYY HH:mm')}
                          {coupon.station_name && ` @ ${coupon.station_name}`}
                        </Text>
                      </>
                    )}
                  </div>
                  <Tag color={getStatusColor(coupon.status)}>
                    {coupon.status}
                  </Tag>
                </div>
              </div>
            </Timeline.Item>
          ))}
        </Timeline>
        
        {sortedCoupons.length === 0 && (
          <Empty 
            description="No coupons found matching your criteria"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        )}
      </Card>
    );
  };

  if (!beneficiaryId) {
    return (
      <Card>
        <Empty 
          description="Select a beneficiary to view their coupon dashboard"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </Card>
    );
  }

  return (
    <div>
      {/* Summary Cards */}
      {showSummary && renderSummaryCards()}

      {/* Filters */}
      {(showSearch || showFilters) && (
        <Card style={{ marginBottom: 16 }}>
          <Row gutter={[16, 16]} align="middle">
            {showSearch && (
              <Col xs={24} sm={12} md={8}>
                <Search
                  placeholder="Search coupons, source, or station"
                  allowClear
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                />
              </Col>
            )}
            {showFilters && (
              <>
                <Col xs={24} sm={6} md={4}>
                  <Select
                    placeholder="Status"
                    allowClear
                    style={{ width: '100%' }}
                    value={statusFilter}
                    onChange={setStatusFilter}
                  >
                    <Option value="ALLOCATED">Allocated</Option>
                    <Option value="USED">Used</Option>
                    <Option value="EXPIRED">Expired</Option>
                  </Select>
                </Col>
                <Col xs={24} sm={6} md={4}>
                  <Select
                    placeholder="Fuel Type"
                    allowClear
                    style={{ width: '100%' }}
                    value={fuelTypeFilter}
                    onChange={setFuelTypeFilter}
                  >
                    <Option value="PETROL">Petrol</Option>
                    <Option value="DIESEL">Diesel</Option>
                  </Select>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <RangePicker
                    style={{ width: '100%' }}
                    value={selectedDateRange}
                    onChange={(dates) => setSelectedDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)}
                  />
                </Col>
              </>
            )}
            <Col xs={24} sm={24} md={2}>
              <Space>
                <Button 
                  icon={<ReloadOutlined />} 
                  onClick={() => {
                    fetchBeneficiaryCoupons();
                    fetchBeneficiarySummary();
                  }}
                  loading={loading}
                />
                <Button 
                  icon={<DownloadOutlined />} 
                  onClick={handleExportCoupons}
                  disabled={coupons.length === 0}
                />
              </Space>
            </Col>
          </Row>
        </Card>
      )}

      {/* Main Content */}
      {viewMode === 'table' && (
        <Card title={`Individual Coupons (${getFilteredCoupons().length})`}>
          <Table
            columns={couponColumns}
            dataSource={getFilteredCoupons()}
            rowKey="id"
            loading={loading}
            size="small"
            scroll={{ x: 1000 }}
            pagination={{
              pageSize: 20,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => 
                `${range[0]}-${range[1]} of ${total} coupons`,
            }}
          />
        </Card>
      )}

      {viewMode === 'timeline' && renderTimelineView()}

      {/* Detail Modal */}
      <Modal
        title={`Coupon Details: ${selectedCoupon?.serial_number}`}
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={700}
      >
        {selectedCoupon && (
          <div>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="Serial Number" span={2}>
                <Text strong style={{ fontFamily: 'monospace' }}>
                  {selectedCoupon.serial_number}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={getStatusColor(selectedCoupon.status)} icon={getStatusIcon(selectedCoupon.status)}>
                  {selectedCoupon.status}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Fuel Type">
                <Tag color={selectedCoupon.fuel_type === 'PETROL' ? 'blue' : 'orange'}>
                  {selectedCoupon.fuel_type} ({selectedCoupon.denomination}L)
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Book Serial" span={2}>
                <Text style={{ fontFamily: 'monospace' }}>{selectedCoupon.book_serial}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Allocation Source" span={2}>
                {selectedCoupon.allocation_source}
              </Descriptions.Item>
            </Descriptions>

            <Title level={5} style={{ marginTop: 24, marginBottom: 16 }}>Coupon Journey</Title>
            <Timeline>
              <Timeline.Item color="blue">
                <div>
                  <Text strong>Dispatched from Main Center</Text>
                  <br />
                  <Text type="secondary">
                    {dayjs(selectedCoupon.handover_date).format('MMMM DD, YYYY')}
                  </Text>
                  <br />
                  <Text type="secondary">
                    {selectedCoupon.from_center} → {selectedCoupon.to_center}
                  </Text>
                </div>
              </Timeline.Item>
              
              <Timeline.Item color="orange">
                <div>
                  <Text strong>Allocated to Beneficiary</Text>
                  <br />
                  <Text type="secondary">
                    {dayjs(selectedCoupon.allocated_date).format('MMMM DD, YYYY HH:mm')}
                  </Text>
                  <br />
                  <Text type="secondary">
                    by {selectedCoupon.allocated_by}
                  </Text>
                  <br />
                  <Text type="secondary">
                    Source: {selectedCoupon.allocation_source}
                  </Text>
                </div>
              </Timeline.Item>
              
              {selectedCoupon.used_date && (
                <Timeline.Item color="green">
                  <div>
                    <Text strong>Used at Fuel Station</Text>
                    <br />
                    <Text type="secondary">
                      {dayjs(selectedCoupon.used_date).format('MMMM DD, YYYY HH:mm')}
                    </Text>
                    {selectedCoupon.station_name && (
                      <>
                        <br />
                        <Text type="secondary">
                          Station: {selectedCoupon.station_name}
                        </Text>
                      </>
                    )}
                    {selectedCoupon.usage_notes && (
                      <>
                        <br />
                        <Text type="secondary">
                          Notes: {selectedCoupon.usage_notes}
                        </Text>
                      </>
                    )}
                  </div>
                </Timeline.Item>
              )}
              
              {selectedCoupon.status === 'EXPIRED' && (
                <Timeline.Item color="red">
                  <div>
                    <Text strong>Expired</Text>
                    <br />
                    <Text type="secondary">
                      {selectedCoupon.expiry_date && dayjs(selectedCoupon.expiry_date).format('MMMM DD, YYYY')}
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

export default BeneficiaryCouponDashboard;