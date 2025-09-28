// src/components/audit/CouponTrackingTable.tsx
import React, { useState, useEffect } from 'react';
import {
  Table,
  Card,
  Input,
  Select,
  Tag,
  Space,
  Button,
  Tooltip,
  Typography,
  Badge,
  Row,
  Col,
  Statistic,
  Alert,
  Timeline,
  Modal,
  Descriptions,
  message,
} from 'antd';
import {
  SearchOutlined,
  FilterOutlined,
  EyeOutlined,
  ExportOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  SendOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import apiClient from '@/api';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

interface IndividualCoupon {
  id: string;
  serial_number: string; // PetroTrade format: PU006GH001001
  fuel_type: 'PETROL' | 'DIESEL';
  denomination: 5 | 20;
  book_id: string;
  book_serial: string;
  status: 'DISPATCHED' | 'RECEIVED' | 'ALLOCATED' | 'USED' | 'EXPIRED';
  
  // Dispatch tracking
  dispatch_id?: string;
  dispatch_date?: string;
  dispatched_by?: string;
  from_center?: string;
  to_center?: string;
  
  // Handover tracking
  handover_id?: string;
  received_date?: string;
  received_by?: string;
  
  // Allocation tracking
  allocated_to_beneficiary?: string;
  beneficiary_name?: string;
  allocated_date?: string;
  allocated_by?: string;
  
  // Usage tracking
  used_date?: string;
  used_at_station?: string;
  station_name?: string;
  
  created_date: string;
  last_updated: string;
}

interface CouponTrackingTableProps {
  showSearch?: boolean;
  showFilters?: boolean;
  showStats?: boolean;
  filter?: {
    status?: string;
    dispatch_id?: string;
    beneficiary?: string;
    center?: string;
  };
  onCouponSelect?: (coupon: IndividualCoupon) => void;
  maxHeight?: number;
}

const CouponTrackingTable: React.FC<CouponTrackingTableProps> = ({
  showSearch = true,
  showFilters = true,
  showStats = true,
  filter = {},
  onCouponSelect,
  maxHeight = 600,
}) => {
  const [coupons, setCoupons] = useState<IndividualCoupon[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>(filter.status);
  const [selectedCoupon, setSelectedCoupon] = useState<IndividualCoupon | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  
  // Statistics
  const [stats, setStats] = useState({
    total: 0,
    dispatched: 0,
    received: 0,
    allocated: 0,
    used: 0,
    expired: 0,
  });

  useEffect(() => {
    fetchCoupons();
  }, [filter, statusFilter]);

  useEffect(() => {
    calculateStats();
  }, [coupons]);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      console.log('🔍 Fetching individual coupons...');
      
      const params: any = {};
      if (filter.dispatch_id) params.dispatch_id = filter.dispatch_id;
      if (filter.beneficiary) params.beneficiary = filter.beneficiary;
      if (filter.center) params.center = filter.center;
      if (statusFilter) params.status = statusFilter;
      if (searchText) params.search = searchText;
      
      const response = await apiClient.get('/coupons/individual/', { params });
      const couponData = response.data.results || response.data || [];
      
      console.log('📋 Individual coupons loaded:', couponData.length);
      setCoupons(couponData);
      
    } catch (error) {
      console.error('Error fetching coupons:', error);
      message.error('Failed to load coupon tracking data');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    const newStats = {
      total: coupons.length,
      dispatched: coupons.filter(c => c.status === 'DISPATCHED').length,
      received: coupons.filter(c => c.status === 'RECEIVED').length,
      allocated: coupons.filter(c => c.status === 'ALLOCATED').length,
      used: coupons.filter(c => c.status === 'USED').length,
      expired: coupons.filter(c => c.status === 'EXPIRED').length,
    };
    setStats(newStats);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DISPATCHED': return 'blue';
      case 'RECEIVED': return 'green';
      case 'ALLOCATED': return 'orange';
      case 'USED': return 'purple';
      case 'EXPIRED': return 'red';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DISPATCHED': return <SendOutlined />;
      case 'RECEIVED': return <CheckCircleOutlined />;
      case 'ALLOCATED': return <UserOutlined />;
      case 'USED': return <CheckCircleOutlined />;
      case 'EXPIRED': return <ClockCircleOutlined />;
      default: return null;
    }
  };

  const handleSearch = (value: string) => {
    setSearchText(value);
    // Filter locally for immediate response
    if (value) {
      const filtered = coupons.filter(c => 
        (c.serial_number && c.serial_number.toString().toLowerCase().includes(value.toLowerCase())) ||
        (c.beneficiary_name && c.beneficiary_name.toString().toLowerCase().includes(value.toLowerCase())) ||
        (c.book_serial && c.book_serial.toString().toLowerCase().includes(value.toLowerCase()))
      );
      setCoupons(filtered);
    } else {
      fetchCoupons();
    }
  };

  const viewCouponDetails = (coupon: IndividualCoupon) => {
    setSelectedCoupon(coupon);
    setDetailModalVisible(true);
    onCouponSelect?.(coupon);
  };

  const exportCoupons = () => {
    const csvContent = [
      ['Serial Number', 'Status', 'Fuel Type', 'Denomination', 'Book Serial', 'Dispatch Date', 'Beneficiary', 'Used Date'].join(','),
      ...coupons.map(c => [
        c.serial_number,
        c.status,
        c.fuel_type,
        c.denomination,
        c.book_serial,
        c.dispatch_date || '',
        c.beneficiary_name || '',
        c.used_date || ''
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `coupon-tracking-${dayjs().format('YYYY-MM-DD')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const columns: ColumnsType<IndividualCoupon> = [
    {
      title: 'Serial Number',
      dataIndex: 'serial_number',
      key: 'serial_number',
      width: 150,
      render: (text) => (
        <Text strong style={{ fontFamily: 'monospace', fontSize: '12px' }}>
          {text}
        </Text>
      ),
      sorter: (a, b) => a.serial_number.localeCompare(b.serial_number),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => (
        <Tag color={getStatusColor(status)} icon={getStatusIcon(status)}>
          {status}
        </Tag>
      ),
      filters: [
        { text: 'Dispatched', value: 'DISPATCHED' },
        { text: 'Received', value: 'RECEIVED' },
        { text: 'Allocated', value: 'ALLOCATED' },
        { text: 'Used', value: 'USED' },
        { text: 'Expired', value: 'EXPIRED' },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: 'Fuel/Denomination',
      key: 'fuel_info',
      width: 140,
      render: (_, record) => (
        <div>
          <Tag color={record.fuel_type === 'PETROL' ? 'blue' : 'orange'}>
            {record.fuel_type}
          </Tag>
          <br />
          <Text type="secondary">{record.denomination}L</Text>
        </div>
      ),
    },
    {
      title: 'Book Serial',
      dataIndex: 'book_serial',
      key: 'book_serial',
      width: 120,
      render: (text) => (
        <Text style={{ fontFamily: 'monospace', fontSize: '11px' }}>
          {text}
        </Text>
      ),
    },
    {
      title: 'Dispatch Info',
      key: 'dispatch_info',
      width: 200,
      render: (_, record) => (
        <div>
          {record.dispatch_date && (
            <>
              <Text type="secondary" style={{ fontSize: '11px' }}>
                {dayjs(record.dispatch_date).format('MMM DD, YYYY')}
              </Text>
              <br />
            </>
          )}
          {record.from_center && record.to_center && (
            <Text type="secondary" style={{ fontSize: '10px' }}>
              {record.from_center} → {record.to_center}
            </Text>
          )}
        </div>
      ),
    },
    {
      title: 'Beneficiary',
      dataIndex: 'beneficiary_name',
      key: 'beneficiary_name',
      width: 150,
      render: (name, record) => (
        <div>
          {name ? (
            <>
              <Text style={{ fontSize: '12px' }}>{name}</Text>
              {record.allocated_date && (
                <>
                  <br />
                  <Text type="secondary" style={{ fontSize: '10px' }}>
                    {dayjs(record.allocated_date).format('MMM DD')}
                  </Text>
                </>
              )}
            </>
          ) : (
            <Text type="secondary">Not allocated</Text>
          )}
        </div>
      ),
    },
    {
      title: 'Usage',
      key: 'usage_info',
      width: 120,
      render: (_, record) => (
        <div>
          {record.status === 'USED' && record.used_date ? (
            <>
              <Tag color="purple">USED</Tag>
              <br />
              <Text type="secondary" style={{ fontSize: '10px' }}>
                {dayjs(record.used_date).format('MMM DD')}
              </Text>
            </>
          ) : record.status === 'ALLOCATED' ? (
            <Tag color="orange">PENDING</Tag>
          ) : (
            <Text type="secondary">—</Text>
          )}
        </div>
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
          View
        </Button>
      ),
    },
  ];

  return (
    <div>
      {/* Statistics */}
      {showStats && (
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={4}>
            <Card>
              <Statistic title="Total Coupons" value={stats.total} />
            </Card>
          </Col>
          <Col xs={24} sm={4}>
            <Card>
              <Statistic 
                title="Dispatched" 
                value={stats.dispatched} 
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={4}>
            <Card>
              <Statistic 
                title="Received" 
                value={stats.received} 
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={4}>
            <Card>
              <Statistic 
                title="Allocated" 
                value={stats.allocated} 
                valueStyle={{ color: '#fa8c16' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={4}>
            <Card>
              <Statistic 
                title="Used" 
                value={stats.used} 
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={4}>
            <Card>
              <Statistic 
                title="Expired" 
                value={stats.expired} 
                valueStyle={{ color: '#ff4d4f' }}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* Filters */}
      {(showSearch || showFilters) && (
        <Card style={{ marginBottom: 16 }}>
          <Row gutter={[16, 16]} align="middle">
            {showSearch && (
              <Col xs={24} sm={12} md={8}>
                <Search
                  placeholder="Search by serial, beneficiary, or book"
                  allowClear
                  onSearch={handleSearch}
                  style={{ width: '100%' }}
                />
              </Col>
            )}
            {showFilters && (
              <Col xs={24} sm={12} md={6}>
                <Select
                  placeholder="Filter by status"
                  allowClear
                  style={{ width: '100%' }}
                  value={statusFilter}
                  onChange={setStatusFilter}
                >
                  <Option value="DISPATCHED">Dispatched</Option>
                  <Option value="RECEIVED">Received</Option>
                  <Option value="ALLOCATED">Allocated</Option>
                  <Option value="USED">Used</Option>
                  <Option value="EXPIRED">Expired</Option>
                </Select>
              </Col>
            )}
            <Col xs={24} sm={24} md={10}>
              <Space>
                <Button 
                  icon={<ReloadOutlined />} 
                  onClick={fetchCoupons}
                  loading={loading}
                >
                  Refresh
                </Button>
                <Button 
                  icon={<ExportOutlined />} 
                  onClick={exportCoupons}
                  disabled={coupons.length === 0}
                >
                  Export CSV
                </Button>
              </Space>
            </Col>
          </Row>
        </Card>
      )}

      {/* Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={coupons}
          rowKey="id"
          loading={loading}
          size="small"
          scroll={{ x: 1200, y: maxHeight }}
          pagination={{
            pageSize: 50,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} of ${total} coupons`,
          }}
        />
      </Card>

      {/* Detail Modal */}
      <Modal
        title={`Coupon Details: ${selectedCoupon?.serial_number}`}
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={800}
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
            </Descriptions>

            <Title level={5} style={{ marginTop: 24, marginBottom: 16 }}>Tracking Timeline</Title>
            <Timeline>
              <Timeline.Item dot={<CheckCircleOutlined style={{ color: '#52c41a' }} />}>
                <div>
                  <Text strong>Created</Text>
                  <br />
                  <Text type="secondary">
                    {dayjs(selectedCoupon.created_date).format('MMMM DD, YYYY HH:mm')}
                  </Text>
                </div>
              </Timeline.Item>
              
              {selectedCoupon.dispatch_date && (
                <Timeline.Item color="blue" dot={<SendOutlined />}>
                  <div>
                    <Text strong>Dispatched</Text>
                    <br />
                    <Text type="secondary">
                      {dayjs(selectedCoupon.dispatch_date).format('MMMM DD, YYYY HH:mm')}
                    </Text>
                    {selectedCoupon.from_center && selectedCoupon.to_center && (
                      <>
                        <br />
                        <Text type="secondary">
                          {selectedCoupon.from_center} → {selectedCoupon.to_center}
                        </Text>
                      </>
                    )}
                  </div>
                </Timeline.Item>
              )}
              
              {selectedCoupon.received_date && (
                <Timeline.Item color="green" dot={<CheckCircleOutlined />}>
                  <div>
                    <Text strong>Received</Text>
                    <br />
                    <Text type="secondary">
                      {dayjs(selectedCoupon.received_date).format('MMMM DD, YYYY HH:mm')}
                    </Text>
                    {selectedCoupon.received_by && (
                      <>
                        <br />
                        <Text type="secondary">Received by: {selectedCoupon.received_by}</Text>
                      </>
                    )}
                  </div>
                </Timeline.Item>
              )}
              
              {selectedCoupon.allocated_date && (
                <Timeline.Item color="orange" dot={<UserOutlined />}>
                  <div>
                    <Text strong>Allocated to Beneficiary</Text>
                    <br />
                    <Text type="secondary">
                      {dayjs(selectedCoupon.allocated_date).format('MMMM DD, YYYY HH:mm')}
                    </Text>
                    {selectedCoupon.beneficiary_name && (
                      <>
                        <br />
                        <Text type="secondary">Beneficiary: {selectedCoupon.beneficiary_name}</Text>
                      </>
                    )}
                  </div>
                </Timeline.Item>
              )}
              
              {selectedCoupon.used_date && (
                <Timeline.Item color="purple" dot={<CheckCircleOutlined />}>
                  <div>
                    <Text strong>Used at Station</Text>
                    <br />
                    <Text type="secondary">
                      {dayjs(selectedCoupon.used_date).format('MMMM DD, YYYY HH:mm')}
                    </Text>
                    {selectedCoupon.station_name && (
                      <>
                        <br />
                        <Text type="secondary">Station: {selectedCoupon.station_name}</Text>
                      </>
                    )}
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

export default CouponTrackingTable;