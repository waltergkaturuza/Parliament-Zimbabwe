// src/pages/main-center/components/InventoryManagement.tsx
import { useState, useEffect } from 'react';
import type { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Table,
  Button,
  Space,
  Typography,
  Row,
  Col,
  Statistic,
  Tag,
  Modal,
  Descriptions,
  Alert,
  Progress,
  Timeline,
  Badge,
  Select,
  DatePicker,
  Input,
  Tabs,
  Tooltip,
  message,
  Divider,
} from 'antd';
import {
  InboxOutlined,
  BookOutlined,
  EyeOutlined,
  SendOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  BarChartOutlined,
  CalendarOutlined,
  FileTextOutlined,
  ExportOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import apiClient from '../../../api/index';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Search } = Input;
const { Option } = Select;
const { TabPane } = Tabs;

interface BoxInventory {
  id: string;
  boxId: string;
  boxCode: string;
  receivedDate: string;
  totalBooks: number;
  booksAvailable: number;
  booksDispatched: number;
  fuelType: 'PETROL' | 'DIESEL';
  couponAmount: 5 | 20;
  totalCoupons: number;
  couponsAvailable: number;
  couponsDispatched: number;
  totalValue: number;
  valueDispatched: number;
  valueRemaining: number;
  status: 'FULL' | 'PARTIAL' | 'EMPTY' | 'RESERVED';
  location: string;
  books: BookInventory[];
}

interface BookInventory {
  id: string;
  bookId: string;
  bookNumber: string;
  boxId: string;
  fuelType: 'PETROL' | 'DIESEL';
  couponAmount: 5 | 20;
  firstCouponSerial: string;
  lastCouponSerial: string;
  totalCoupons: number;
  couponsUsed: number;
  couponsRemaining: number;
  totalValue: number;
  valueUsed: number;
  valueRemaining: number;
  status: 'AVAILABLE' | 'DISPATCHED' | 'IN_USE' | 'COMPLETED';
  dispatchDate?: string;
  dispatchedTo?: string;
  subCenterName?: string;
  currentLocation: 'MAIN_CENTER' | 'IN_TRANSIT' | 'SUBCENTER';
  pages: CouponPage[];
}

interface CouponPage {
  id: string;
  pageNumber: number;
  couponSerial: string;
  status: 'AVAILABLE' | 'ALLOCATED' | 'USED' | 'VOIDED';
  allocatedTo?: string;
  allocatedDate?: string;
  usedDate?: string;
  beneficiaryName?: string;
  sessionId?: string;
  programName?: string;
}

interface DispatchHistory {
  id: string;
  dispatchId: string;
  date: string;
  time: string;
  subCenterName: string;
  officerName: string;
  booksCount: number;
  couponsCount: number;
  totalValue: number;
  status: 'DISPATCHED' | 'RECEIVED' | 'CONFIRMED';
  trackingNumber: string;
}

interface InventoryStats {
  totalBoxes: number;
  totalBooks: number;
  totalCoupons: number;
  totalValue: number;
  availableBooks: number;
  dispatchedBooks: number;
  availableCoupons: number;
  dispatchedCoupons: number;
  availableValue: number;
  dispatchedValue: number;
  lowStockBoxes: number;
  emptyBoxes: number;
}

interface FuelRequirement {
  period: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'event';
  fuelType: 'PETROL' | 'DIESEL';
  requiredLitres: number;
  requiredCoupons: number;
  estimatedCost: number;
  eventName?: string;
  startDate: string;
  endDate: string;
}

const InventoryManagement: FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [boxInventory, setBoxInventory] = useState<BoxInventory[]>([]);
  const [dispatchHistory, setDispatchHistory] = useState<DispatchHistory[]>([]);
  const [stats, setStats] = useState<InventoryStats>({
    totalBoxes: 0,
    totalBooks: 0,
    totalCoupons: 0,
    totalValue: 0,
    availableBooks: 0,
    dispatchedBooks: 0,
    availableCoupons: 0,
    dispatchedCoupons: 0,
    availableValue: 0,
    dispatchedValue: 0,
    lowStockBoxes: 0,
    emptyBoxes: 0,
  });
  const [requirements, setRequirements] = useState<FuelRequirement[]>([]);
  
  // Modal states
  const [selectedBox, setSelectedBox] = useState<BoxInventory | null>(null);
  const [boxDetailsModalVisible, setBoxDetailsModalVisible] = useState(false);
  const [selectedBook, setSelectedBook] = useState<BookInventory | null>(null);
  const [bookDetailsModalVisible, setBookDetailsModalVisible] = useState(false);
  
  // Filter states
  const [filterFuelType, setFilterFuelType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchText, setSearchText] = useState('');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);

  useEffect(() => {
    loadInventoryData();
    loadDispatchHistory();
    calculateRequirements();
  }, []);

  const loadInventoryData = async () => {
    setLoading(true);
    try {
      // Load boxes from API
      const boxResponse = await apiClient.get('/boxes/');
      const boxData = boxResponse.data.results || boxResponse.data || [];

      console.log('Loaded boxes data:', boxData);

      // Transform box data to inventory format using actual Box model fields
      const inventoryData = boxData.map((box: any) => {
        // Use the actual Box model fields we added
        const totalBooks = box.number_of_books || 0;
        const booksDispatched = box.books_dispatched || 0;
        const booksAvailable = totalBooks - booksDispatched;
        
        const totalCoupons = box.total_coupons_calculated || 0;
        const couponsUsed = box.coupons_used || 0;
        const couponsAvailable = totalCoupons - couponsUsed;
        
        const totalLitres = parseFloat(box.total_litres || 0);
        const litresUsed = parseFloat(box.litres_used || 0);
        const litresRemaining = totalLitres - litresUsed;
        
        // Use the monetary values from the Box model
        const totalValue = parseFloat(box.total_value_zwg || 0);
        const valueUsed = totalLitres > 0 ? (litresUsed / totalLitres) * totalValue : 0;
        const valueRemaining = totalValue - valueUsed;

        // Determine status based on books remaining
        let status: 'FULL' | 'PARTIAL' | 'EMPTY' | 'RESERVED' = 'FULL';
        if (booksAvailable === 0) status = 'EMPTY';
        else if (booksAvailable < totalBooks * 0.3) status = 'PARTIAL';

        return {
          id: String(box.id),
          boxId: box.box_code || `FCB-${String(box.id).padStart(4, '0')}`,
          boxCode: box.box_code || `FCB-${String(box.id).padStart(4, '0')}`,
          receivedDate: box.received_at ? dayjs(box.received_at).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'),
          totalBooks,
          booksAvailable,
          booksDispatched,
          fuelType: (box.fuel_type || 'DIESEL') as 'PETROL' | 'DIESEL',
          couponAmount: (box.denomination || 20) as 5 | 20,
          totalCoupons,
          couponsAvailable,
          couponsDispatched: couponsUsed, // Map coupons_used to couponsDispatched
          totalValue,
          valueDispatched: valueUsed,
          valueRemaining,
          status,
          location: box.location || 'Main Warehouse',
          books: [], // Books will be loaded separately if needed
        };
      });

      console.log('Mapped inventory data:', inventoryData);
      setBoxInventory(inventoryData);
      calculateStats(inventoryData);
    } catch (error) {
      console.error('Error loading inventory:', error);
      message.error('Failed to load inventory data');
      // Set empty data on error
      setBoxInventory([]);
      setStats({
        totalBoxes: 0,
        totalBooks: 0,
        totalCoupons: 0,
        totalValue: 0,
        availableBooks: 0,
        dispatchedBooks: 0,
        availableCoupons: 0,
        dispatchedCoupons: 0,
        availableValue: 0,
        dispatchedValue: 0,
        lowStockBoxes: 0,
        emptyBoxes: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const loadDispatchHistory = async () => {
    try {
      // Load dispatch history from API
      const response = await apiClient.get('/dispatches/');
      const dispatches = response.data.results || response.data || [];

      const historyData: DispatchHistory[] = dispatches.map((dispatch: any) => ({
        id: String(dispatch.id),
        dispatchId: dispatch.dispatch_id || `DSP-${String(dispatch.id).padStart(6, '0')}`,
        date: dispatch.dispatch_date ? dayjs(dispatch.dispatch_date).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'),
        time: dispatch.dispatch_time || dayjs().format('HH:mm'),
        subCenterName: dispatch.subcenter?.name || dispatch.subcenter_name || 'Unknown Sub-Center',
        officerName: dispatch.dispatched_by?.full_name || dispatch.dispatched_by_name || 'System User',
        booksCount: dispatch.books?.length || dispatch.total_books || 0,
        couponsCount: dispatch.total_coupons || 0,
        totalValue: dispatch.total_value || 0,
        status: dispatch.status || 'PENDING',
        trackingNumber: dispatch.tracking_number || `TRK-${String(dispatch.id).padStart(3, '0')}`,
      }));

      setDispatchHistory(historyData);
    } catch (error) {
      console.error('Error loading dispatch history:', error);
      // Set empty array on error, but don't show error message since this is secondary data
      setDispatchHistory([]);
    }
  };

  const calculateStats = (inventory: BoxInventory[]) => {
    const newStats: InventoryStats = {
      totalBoxes: inventory.length,
      totalBooks: inventory.reduce((sum, box) => sum + box.totalBooks, 0),
      totalCoupons: inventory.reduce((sum, box) => sum + box.totalCoupons, 0),
      totalValue: inventory.reduce((sum, box) => sum + box.totalValue, 0),
      availableBooks: inventory.reduce((sum, box) => sum + box.booksAvailable, 0),
      dispatchedBooks: inventory.reduce((sum, box) => sum + box.booksDispatched, 0),
      availableCoupons: inventory.reduce((sum, box) => sum + box.couponsAvailable, 0),
      dispatchedCoupons: inventory.reduce((sum, box) => sum + box.couponsDispatched, 0),
      availableValue: inventory.reduce((sum, box) => sum + box.valueRemaining, 0),
      dispatchedValue: inventory.reduce((sum, box) => sum + box.valueDispatched, 0),
      lowStockBoxes: inventory.filter(box => (box.booksAvailable / box.totalBooks) < 0.3).length,
      emptyBoxes: inventory.filter(box => box.booksAvailable === 0).length,
    };

    setStats(newStats);
  };

  const calculateRequirements = async () => {
    try {
      // Try to get fuel consumption analytics from API
      const response = await apiClient.get('/analytics/fuel-requirements/');
      const apiRequirements = response.data.results || response.data || [];
      
      if (apiRequirements.length > 0) {
        setRequirements(apiRequirements);
        return;
      }
    } catch (error) {
      console.log('API fuel requirements not available, using calculated estimates');
    }

    try {
      // If API doesn't have requirements, calculate based on historical data
      const analyticsResponse = await apiClient.get('/analytics/consumption-trend/?days=30');
      const consumptionData = analyticsResponse.data;
      
      // Calculate average daily consumption
      const avgDailyPetrol = consumptionData?.petrol_avg || 500;
      const avgDailyDiesel = consumptionData?.diesel_avg || 800;
      
      // Generate requirements based on historical patterns
      const calculatedRequirements: FuelRequirement[] = [
        {
          period: 'daily',
          fuelType: 'PETROL',
          requiredLitres: Math.round(avgDailyPetrol),
          requiredCoupons: Math.round(avgDailyPetrol / 20), // 20L per petrol coupon
          estimatedCost: Math.round(avgDailyPetrol * 37.95), // Current petrol price
          startDate: dayjs().format('YYYY-MM-DD'),
          endDate: dayjs().format('YYYY-MM-DD'),
        },
        {
          period: 'weekly',
          fuelType: 'DIESEL',
          requiredLitres: Math.round(avgDailyDiesel * 7),
          requiredCoupons: Math.round((avgDailyDiesel * 7) / 5), // 5L per diesel coupon
          estimatedCost: Math.round(avgDailyDiesel * 7 * 36.00), // Current diesel price
          startDate: dayjs().startOf('week').format('YYYY-MM-DD'),
          endDate: dayjs().endOf('week').format('YYYY-MM-DD'),
        },
        {
          period: 'monthly',
          fuelType: 'PETROL',
          requiredLitres: Math.round(avgDailyPetrol * 30),
          requiredCoupons: Math.round((avgDailyPetrol * 30) / 20),
          estimatedCost: Math.round(avgDailyPetrol * 30 * 37.95),
          startDate: dayjs().startOf('month').format('YYYY-MM-DD'),
          endDate: dayjs().endOf('month').format('YYYY-MM-DD'),
        },
      ];

      setRequirements(calculatedRequirements);
    } catch (error) {
      console.error('Error calculating requirements:', error);
      // Fallback to basic estimates if analytics fail
      const fallbackRequirements: FuelRequirement[] = [
        {
          period: 'daily',
          fuelType: 'PETROL',
          requiredLitres: 500,
          requiredCoupons: 25,
          estimatedCost: 18975,
          startDate: dayjs().format('YYYY-MM-DD'),
          endDate: dayjs().format('YYYY-MM-DD'),
        },
        {
          period: 'weekly',
          fuelType: 'DIESEL',
          requiredLitres: 800,
          requiredCoupons: 160,
          estimatedCost: 28800,
          startDate: dayjs().startOf('week').format('YYYY-MM-DD'),
          endDate: dayjs().endOf('week').format('YYYY-MM-DD'),
        },
      ];

      setRequirements(fallbackRequirements);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'FULL': return 'green';
      case 'PARTIAL': return 'orange';
      case 'EMPTY': return 'red';
      case 'RESERVED': return 'blue';
      case 'AVAILABLE': return 'green';
      case 'DISPATCHED': return 'blue';
      case 'IN_USE': return 'orange';
      case 'COMPLETED': return 'gray';
      case 'CONFIRMED': return 'green';
      default: return 'default';
    }
  };

  const boxColumns: ColumnsType<BoxInventory> = [
    {
      title: 'Box Code',
      dataIndex: 'boxCode',
      key: 'boxCode',
      render: (code) => <Text strong>{code}</Text>,
    },
    {
      title: 'Fuel Type',
      dataIndex: 'fuelType',
      key: 'fuelType',
      render: (type) => (
        <Tag color={type === 'PETROL' ? 'blue' : 'green'}>
          {type}
        </Tag>
      ),
    },
    {
      title: 'Coupon Amount',
      dataIndex: 'couponAmount',
      key: 'couponAmount',
      render: (amount) => `${amount}L`,
    },
    {
      title: 'Books',
      key: 'books',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text style={{ fontSize: '12px' }}>
            Available: <strong>{record.booksAvailable}</strong> / {record.totalBooks}
          </Text>
          <Progress 
            percent={record.totalBooks > 0 ? (record.booksAvailable / record.totalBooks) * 100 : 0} 
            size="small"
            status={record.booksAvailable === 0 ? 'exception' : 'normal'}
          />
        </Space>
      ),
    },
    {
      title: 'Coupons',
      key: 'coupons',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text style={{ fontSize: '12px' }}>
            Available: <strong>{record.couponsAvailable}</strong> / {record.totalCoupons}
          </Text>
          <Progress 
            percent={record.totalCoupons > 0 ? (record.couponsAvailable / record.totalCoupons) * 100 : 0} 
            size="small"
            status={record.couponsAvailable === 0 ? 'exception' : 'normal'}
          />
        </Space>
      ),
    },
    {
      title: 'Value Remaining',
      dataIndex: 'valueRemaining',
      key: 'valueRemaining',
      render: (value) => <Text strong>ZWG {value.toLocaleString()}</Text>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Badge 
          status={getStatusColor(status) as any} 
          text={status}
        />
      ),
    },
    {
      title: 'Location',
      dataIndex: 'location',
      key: 'location',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => {
              setSelectedBox(record);
              setBoxDetailsModalVisible(true);
            }}
          >
            View Details
          </Button>
          <Button
            size="small"
            type="primary"
            icon={<SendOutlined />}
            disabled={record.booksAvailable === 0}
            onClick={() => {
              navigate(`/main-center/book-dispatch?boxId=${record.id}&boxCode=${record.boxCode}`);
            }}
          >
            Dispatch
          </Button>
        </Space>
      ),
    },
  ];

  const historyColumns: ColumnsType<DispatchHistory> = [
    {
      title: 'Dispatch ID',
      dataIndex: 'dispatchId',
      key: 'dispatchId',
      render: (id) => <Text strong>{id}</Text>,
    },
    {
      title: 'Date & Time',
      key: 'datetime',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text>{record.date}</Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>{record.time}</Text>
        </Space>
      ),
    },
    {
      title: 'Sub Center',
      key: 'subcenter',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text>{record.subCenterName}</Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>{record.officerName}</Text>
        </Space>
      ),
    },
    {
      title: 'Books',
      dataIndex: 'booksCount',
      key: 'booksCount',
      render: (count) => <Badge count={count} showZero />,
    },
    {
      title: 'Coupons',
      dataIndex: 'couponsCount',
      key: 'couponsCount',
      render: (count) => <Badge count={count} showZero />,
    },
    {
      title: 'Value',
      dataIndex: 'totalValue',
      key: 'totalValue',
      render: (value) => `ZWG ${value.toLocaleString()}`,
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
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={2}>Inventory Management</Title>
            <Text type="secondary">
              Track boxes, books, and fuel distribution across main center and subcenters
            </Text>
          </Col>
          <Col>
            <Space>
              <Button 
                icon={<ReloadOutlined />} 
                onClick={loadInventoryData}
                loading={loading}
              >
                Refresh
              </Button>
              <Button 
                type="primary" 
                icon={<ExportOutlined />}
              >
                Export Report
              </Button>
            </Space>
          </Col>
        </Row>
      </div>

      {/* Statistics Cards */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Boxes"
              value={stats.totalBoxes}
              prefix={<InboxOutlined />}
              suffix={
                <Tooltip title={`${stats.lowStockBoxes} low stock, ${stats.emptyBoxes} empty`}>
                  {stats.lowStockBoxes > 0 && <WarningOutlined style={{ color: '#ff4d4f' }} />}
                </Tooltip>
              }
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Available Books"
              value={stats.availableBooks}
              prefix={<BookOutlined />}
              suffix={`/ ${stats.totalBooks}`}
              valueStyle={{ color: stats.availableBooks > 0 ? '#3f8600' : '#cf1322' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Available Coupons"
              value={stats.availableCoupons}
              suffix={`/ ${stats.totalCoupons}`}
              valueStyle={{ color: stats.availableCoupons > 0 ? '#3f8600' : '#cf1322' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Available Value"
              value={stats.availableValue}
              formatter={(value) => `ZWG ${value?.toLocaleString()}`}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
      </Row>

      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="Inventory Overview" key="overview">
          <Card>
            <div style={{ marginBottom: 16 }}>
              <Row gutter={16}>
                <Col span={6}>
                  <Search
                    placeholder="Search boxes..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    allowClear
                  />
                </Col>
                <Col span={4}>
                  <Select
                    style={{ width: '100%' }}
                    placeholder="Fuel Type"
                    value={filterFuelType}
                    onChange={setFilterFuelType}
                  >
                    <Option value="all">All Types</Option>
                    <Option value="PETROL">Petrol</Option>
                    <Option value="DIESEL">Diesel</Option>
                  </Select>
                </Col>
                <Col span={4}>
                  <Select
                    style={{ width: '100%' }}
                    placeholder="Status"
                    value={filterStatus}
                    onChange={setFilterStatus}
                  >
                    <Option value="all">All Status</Option>
                    <Option value="FULL">Full</Option>
                    <Option value="PARTIAL">Partial</Option>
                    <Option value="EMPTY">Empty</Option>
                  </Select>
                </Col>
              </Row>
            </div>

            <Table
              columns={boxColumns}
              dataSource={boxInventory.filter(box => {
                const matchesSearch = searchText === '' || 
                  box.boxCode.toLowerCase().includes(searchText.toLowerCase());
                const matchesFuelType = filterFuelType === 'all' || 
                  box.fuelType === filterFuelType;
                const matchesStatus = filterStatus === 'all' || 
                  box.status === filterStatus;
                return matchesSearch && matchesFuelType && matchesStatus;
              })}
              rowKey="id"
              loading={loading}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => 
                  `${range[0]}-${range[1]} of ${total} boxes`,
              }}
            />
          </Card>
        </TabPane>

        <TabPane tab="Dispatch History" key="history">
          <Card>
            <Table
              columns={historyColumns}
              dataSource={dispatchHistory}
              rowKey="id"
              pagination={{
                pageSize: 10,
                showTotal: (total, range) => 
                  `${range[0]}-${range[1]} of ${total} dispatches`,
              }}
            />
          </Card>
        </TabPane>

        <TabPane tab="Fuel Requirements" key="requirements">
          <Card>
            <Alert
              message="Fuel Requirements Analysis"
              description="Projected fuel needs based on historical usage and upcoming events"
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />

            <Row gutter={16}>
              {requirements.map((req, index) => (
                <Col span={8} key={index}>
                  <Card 
                    size="small" 
                    title={
                      <Space>
                        <CalendarOutlined />
                        {req.period.charAt(0).toUpperCase() + req.period.slice(1)}
                        {req.eventName && ` - ${req.eventName}`}
                      </Space>
                    }
                  >
                    <Descriptions column={1} size="small">
                      <Descriptions.Item label="Fuel Type">
                        <Tag color={req.fuelType === 'PETROL' ? 'blue' : 'green'}>
                          {req.fuelType}
                        </Tag>
                      </Descriptions.Item>
                      <Descriptions.Item label="Required Litres">
                        {req.requiredLitres.toLocaleString()}L
                      </Descriptions.Item>
                      <Descriptions.Item label="Required Coupons">
                        {req.requiredCoupons.toLocaleString()}
                      </Descriptions.Item>
                      <Descriptions.Item label="Estimated Cost">
                        ZWG {req.estimatedCost.toLocaleString()}
                      </Descriptions.Item>
                      <Descriptions.Item label="Period">
                        {req.startDate} to {req.endDate}
                      </Descriptions.Item>
                    </Descriptions>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card>
        </TabPane>
      </Tabs>

      {/* Box Details Modal */}
      <Modal
        title={
          <Space>
            <InboxOutlined />
            Box Details - {selectedBox?.boxCode}
          </Space>
        }
        open={boxDetailsModalVisible}
        onCancel={() => setBoxDetailsModalVisible(false)}
        footer={null}
        width={1000}
      >
        {selectedBox && (
          <div>
            <Descriptions bordered column={2} style={{ marginBottom: 16 }}>
              <Descriptions.Item label="Box Code">{selectedBox.boxCode}</Descriptions.Item>
              <Descriptions.Item label="Received Date">{selectedBox.receivedDate}</Descriptions.Item>
              <Descriptions.Item label="Fuel Type">
                <Tag color={selectedBox.fuelType === 'PETROL' ? 'blue' : 'green'}>
                  {selectedBox.fuelType}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Coupon Amount">{selectedBox.couponAmount}L</Descriptions.Item>
              <Descriptions.Item label="Total Books">{selectedBox.totalBooks}</Descriptions.Item>
              <Descriptions.Item label="Books Available">{selectedBox.booksAvailable}</Descriptions.Item>
              <Descriptions.Item label="Books Dispatched">{selectedBox.booksDispatched}</Descriptions.Item>
              <Descriptions.Item label="Location">{selectedBox.location}</Descriptions.Item>
              <Descriptions.Item label="Total Value">ZWG {selectedBox.totalValue.toLocaleString()}</Descriptions.Item>
              <Descriptions.Item label="Value Remaining">ZWG {selectedBox.valueRemaining.toLocaleString()}</Descriptions.Item>
              <Descriptions.Item label="Status" span={2}>
                <Badge status={getStatusColor(selectedBox.status) as any} text={selectedBox.status} />
              </Descriptions.Item>
            </Descriptions>

            <Divider>Books in this Box</Divider>
            
            {/* Books table would go here - to be implemented with individual book details */}
            <Alert
              message="Book Details"
              description="Individual book tracking with coupon serials will be displayed here. Each book shows dispatch status, subcenter assignment, and detailed coupon page tracking."
              type="info"
              showIcon
            />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default InventoryManagement;
