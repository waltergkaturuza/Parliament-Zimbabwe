// src/pages/main-center/components/InventoryManagement.tsx
import { useState, useEffect } from 'react';
import type { FC } from 'react';
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
import apiClient from '../../../api/apiClient';

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
      // Simulate API call - replace with actual API calls
      const sampleBoxInventory: BoxInventory[] = [
        {
          id: '1',
          boxId: 'BOX001',
          boxCode: 'FCB-2024-0001',
          receivedDate: '2024-08-01',
          totalBooks: 10,
          booksAvailable: 7,
          booksDispatched: 3,
          fuelType: 'PETROL',
          couponAmount: 20,
          totalCoupons: 200,
          couponsAvailable: 140,
          couponsDispatched: 60,
          totalValue: 800000,
          valueDispatched: 240000,
          valueRemaining: 560000,
          status: 'PARTIAL',
          location: 'Main Storage A1',
          books: [],
        },
        {
          id: '2',
          boxId: 'BOX002',
          boxCode: 'FCB-2024-0002',
          receivedDate: '2024-08-05',
          totalBooks: 10,
          booksAvailable: 10,
          booksDispatched: 0,
          fuelType: 'DIESEL',
          couponAmount: 5,
          totalCoupons: 200,
          couponsAvailable: 200,
          couponsDispatched: 0,
          totalValue: 180000,
          valueDispatched: 0,
          valueRemaining: 180000,
          status: 'FULL',
          location: 'Main Storage A2',
          books: [],
        },
      ];

      setBoxInventory(sampleBoxInventory);
      calculateStats(sampleBoxInventory);
    } catch (error) {
      console.error('Error loading inventory:', error);
      message.error('Failed to load inventory data');
    } finally {
      setLoading(false);
    }
  };

  const loadDispatchHistory = async () => {
    try {
      const sampleHistory: DispatchHistory[] = [
        {
          id: '1',
          dispatchId: 'DSP-2024-08-001',
          date: '2024-08-08',
          time: '10:30',
          subCenterName: 'Harare Central Sub-Center',
          officerName: 'Peter Ncube',
          booksCount: 3,
          couponsCount: 60,
          totalValue: 240000,
          status: 'CONFIRMED',
          trackingNumber: 'TRK-001',
        },
        {
          id: '2',
          dispatchId: 'DSP-2024-08-002',
          date: '2024-08-09',
          time: '14:15',
          subCenterName: 'Bulawayo North Sub-Center',
          officerName: 'Susan Moyo',
          booksCount: 2,
          couponsCount: 40,
          totalValue: 72000,
          status: 'DISPATCHED',
          trackingNumber: 'TRK-002',
        },
      ];

      setDispatchHistory(sampleHistory);
    } catch (error) {
      console.error('Error loading dispatch history:', error);
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

  const calculateRequirements = () => {
    // Sample requirements calculation
    const sampleRequirements: FuelRequirement[] = [
      {
        period: 'daily',
        fuelType: 'PETROL',
        requiredLitres: 500,
        requiredCoupons: 25,
        estimatedCost: 100000,
        startDate: dayjs().format('YYYY-MM-DD'),
        endDate: dayjs().format('YYYY-MM-DD'),
      },
      {
        period: 'weekly',
        fuelType: 'DIESEL',
        requiredLitres: 800,
        requiredCoupons: 160,
        estimatedCost: 144000,
        startDate: dayjs().startOf('week').format('YYYY-MM-DD'),
        endDate: dayjs().endOf('week').format('YYYY-MM-DD'),
      },
      {
        period: 'event',
        fuelType: 'PETROL',
        requiredLitres: 2000,
        requiredCoupons: 100,
        estimatedCost: 400000,
        eventName: 'Parliament Special Session',
        startDate: '2024-08-15',
        endDate: '2024-08-20',
      },
    ];

    setRequirements(sampleRequirements);
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
            percent={(record.booksAvailable / record.totalBooks) * 100} 
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
            percent={(record.couponsAvailable / record.totalCoupons) * 100} 
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
