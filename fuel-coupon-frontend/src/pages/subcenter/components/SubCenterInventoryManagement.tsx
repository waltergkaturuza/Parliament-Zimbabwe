// src/pages/subcenter/components/SubCenterInventoryManagement.tsx
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
  Badge,
  Select,
  DatePicker,
  Input,
  Tabs,
  Form,
  InputNumber,
  message,
  Divider,
  Timeline,
  Checkbox,
} from 'antd';
import {
  InboxOutlined,
  BookOutlined,
  EyeOutlined,
  SendOutlined,
  UserOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  FileTextOutlined,
  PlusOutlined,
  CalendarOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import apiClient from '../../../api/index';
import { useAuth } from '../../../contexts/AuthContext';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Search } = Input;
const { Option } = Select;
const { TabPane } = Tabs;
const { TextArea } = Input;

interface IncomingBook {
  id: string;
  bookId: string;
  bookNumber: string;
  boxId: string;
  fuelType: 'PETROL' | 'DIESEL';
  couponAmount: 5 | 20;
  firstCouponSerial: string;
  lastCouponSerial: string;
  totalCoupons: number;
  couponsAllocated: number;
  couponsRemaining: number;
  totalValue: number;
  valueAllocated: number;
  valueRemaining: number;
  receivedDate: string;
  receivedTime: string;
  receivedBy: string;
  dispatchId: string;
  fromMainCenter: string;
  status: 'RECEIVED' | 'IN_USE' | 'COMPLETED' | 'PARTIALLY_USED';
  pages: CouponPage[];
}

interface CouponPage {
  id: string;
  pageNumber: number;
  couponSerial: string;
  bookId: string;
  status: 'AVAILABLE' | 'ALLOCATED' | 'USED' | 'VOIDED';
  allocatedTo?: string;
  allocatedDate?: string;
  usedDate?: string;
  beneficiaryName?: string;
  beneficiaryId?: string;
  sessionId?: string;
  programName?: string;
  eventName?: string;
  notes?: string;
}

interface Beneficiary {
  id: string;
  name: string;
  memberId: string;
  position: string;
  department: string;
  allocatedLitres: number;
  usedLitres: number;
  remainingLitres: number;
  status: 'ACTIVE' | 'SUSPENDED' | 'COMPLETED';
  lastAllocation: string;
}

interface AllocationRecord {
  id: string;
  beneficiaryId: string;
  beneficiaryName: string;
  allocationDate: string;
  sessionName: string;
  programName: string;
  firstCouponSerial: string;
  lastCouponSerial: string;
  totalCoupons: number;
  totalLitres: number;
  totalValue: number;
  notes: string;
  allocatedBy: string;
  status: 'ALLOCATED' | 'USED' | 'PARTIALLY_USED' | 'VOIDED';
  pages: string[]; // Array of coupon serials
}

interface PendingDispatch {
  id: string;
  dispatchId: string;
  fromMainCenter: string;
  sentDate: string;
  sentTime: string;
  books: Array<{
    bookId: string;
    fuelType: 'PETROL' | 'DIESEL';
    couponAmount: 5 | 20;
    totalCoupons: number;
    totalValue: number;
  }>;
  totalBooks: number;
  totalCoupons: number;
  totalValue: number;
  status: 'DISPATCHED' | 'IN_TRANSIT' | 'DELIVERED';
  trackingNumber?: string;
  notes?: string;
}

interface SubCenterStats {
  totalBooksReceived: number;
  totalCouponsReceived: number;
  totalValueReceived: number;
  couponsAllocated: number;
  couponsUsed: number;
  couponsRemaining: number;
  valueAllocated: number;
  valueUsed: number;
  valueRemaining: number;
  activeBeneficiaries: number;
  totalAllocations: number;
}

const SubCenterInventoryManagement: FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('inventory');
  const [incomingBooks, setIncomingBooks] = useState<IncomingBook[]>([]);
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [allocations, setAllocations] = useState<AllocationRecord[]>([]);
  const [pendingDispatches, setPendingDispatches] = useState<PendingDispatch[]>([]);
  const [stats, setStats] = useState<SubCenterStats>({
    totalBooksReceived: 0,
    totalCouponsReceived: 0,
    totalValueReceived: 0,
    couponsAllocated: 0,
    couponsUsed: 0,
    couponsRemaining: 0,
    valueAllocated: 0,
    valueUsed: 0,
    valueRemaining: 0,
    activeBeneficiaries: 0,
    totalAllocations: 0,
  });

  // Modal states
  const [selectedBook, setSelectedBook] = useState<IncomingBook | null>(null);
  const [bookDetailsModalVisible, setBookDetailsModalVisible] = useState(false);
  const [allocationModalVisible, setAllocationModalVisible] = useState(false);
  const [selectedBeneficiary, setBeneficiary] = useState<Beneficiary | null>(null);
  
  // Form for allocation
  const [allocationForm] = Form.useForm();

  useEffect(() => {
    loadInventoryData();
    loadBeneficiaries();
    loadAllocations();
    loadPendingDispatches();
  }, []);

  const loadInventoryData = async () => {
    setLoading(true);
    try {
      // Simulate incoming books from main center dispatches
      // Load books received by this subcenter from API
      const response = await apiClient.get('/books/received/');
      const booksData = response.data.results || response.data || [];

      const processedBooks: IncomingBook[] = booksData.map((book: any) => {
        // Calculate coupon pages for this book
        const pages = generateCouponPages(
          book.first_coupon_serial || `${book.fuel_type}${book.coupon_amount}-${book.id}-000001`,
          book.total_coupons || 20,
          String(book.id)
        );

        return {
          id: String(book.id),
          bookId: `BOOK${String(book.id).padStart(3, '0')}`,
          bookNumber: book.book_number || `${book.fuel_type}${book.coupon_amount}-BOOK-2024-${String(book.id).padStart(3, '0')}`,
          boxId: book.box?.box_code || `FCB-2024-${String(book.box_id || book.id).padStart(4, '0')}`,
          fuelType: (book.fuel_type || 'PETROL') as 'PETROL' | 'DIESEL',
          couponAmount: (book.coupon_amount || (book.fuel_type === 'PETROL' ? 20 : 5)) as 5 | 20,
          firstCouponSerial: book.first_coupon_serial || `${book.fuel_type}${book.coupon_amount}-2024-08-000001`,
          lastCouponSerial: book.last_coupon_serial || `${book.fuel_type}${book.coupon_amount}-2024-08-000020`,
          totalCoupons: book.total_coupons || 20,
          couponsAllocated: book.coupons_allocated || 0,
          couponsRemaining: (book.total_coupons || 20) - (book.coupons_allocated || 0),
          totalValue: book.total_value || ((book.total_coupons || 20) * (book.coupon_amount || 20) * (book.fuel_type === 'PETROL' ? 37.95 : 36.00)),
          valueAllocated: book.value_allocated || 0,
          valueRemaining: (book.total_value || 0) - (book.value_allocated || 0),
          receivedDate: book.received_date ? dayjs(book.received_date).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'),
          receivedTime: book.received_time || dayjs().format('HH:mm'),
          receivedBy: book.received_by?.full_name || book.received_by_name || 'System User',
          dispatchId: book.dispatch?.dispatch_id || book.dispatch_id || `DSP-${String(book.id).padStart(6, '0')}`,
          fromMainCenter: 'Parliament Main Center',
          status: book.status || 'RECEIVED',
          pages,
        };
      });

      setIncomingBooks(processedBooks);
      calculateStats(processedBooks);
    } catch (error) {
      console.error('Error loading inventory:', error);
      message.error('Failed to load inventory data');
    } finally {
      setLoading(false);
    }
  };

  const generateCouponPages = (firstSerial: string, count: number, bookId: string): CouponPage[] => {
    const pages: CouponPage[] = [];
    const match = firstSerial.match(/^(.*?)(\d+)$/);
    if (!match) return pages;

    const prefix = match[1];
    const startNumber = parseInt(match[2], 10);
    const numberLength = match[2].length;

    for (let i = 0; i < count; i++) {
      const currentNumber = startNumber + i;
      const paddedNumber = currentNumber.toString().padStart(numberLength, '0');
      const couponSerial = `${prefix}${paddedNumber}`;

      pages.push({
        id: `page_${bookId}_${i + 1}`,
        pageNumber: i + 1,
        couponSerial,
        bookId,
        status: 'AVAILABLE', // Default status, should be updated from backend data
        allocatedTo: undefined,
        allocatedDate: undefined,
        beneficiaryName: undefined,
        beneficiaryId: undefined,
        sessionId: undefined,
        programName: undefined,
      });
    }

    return pages;
  };

  const loadBeneficiaries = async () => {
    try {
      const response = await apiClient.get('/beneficiaries/', {
        params: { page_size: 100 }
      });
      
      const beneficiariesData = response.data.results || response.data || [];
      setBeneficiaries(beneficiariesData);
    } catch (error) {
      console.error('Error loading beneficiaries:', error);
      // Keep empty array as fallback
      setBeneficiaries([]);
    }
  };

  const loadAllocations = async () => {
    try {
      const response = await apiClient.get('/allocations/', {
        params: { page_size: 100 }
      });
      
      const allocationsData = response.data.results || response.data || [];
      setAllocations(allocationsData);
    } catch (error) {
      console.error('Error loading allocations:', error);
      // Keep empty array as fallback
      setAllocations([]);
    }
  };

  const loadPendingDispatches = async () => {
    try {
      // Get current user/subcenter ID from auth context
      const currentSubCenterId = user?.sub_center_id || user?.centerId;
      const currentSubCenterName = user?.sub_center?.name || 'Current Sub-Center';
      
      console.log('🔍 Loading dispatches for sub-center:', {
        subCenterId: currentSubCenterId,
        subCenterName: currentSubCenterName,
        userInfo: user
      });
      
      // Load all dispatches and filter for current sub-center
      const response = await apiClient.get('/dispatches/', {
        params: { 
          page_size: 100 
        }
      });
      
      const dispatchesData = response.data.results || response.data || [];
      
      console.log('📦 All dispatches from API:', dispatchesData);
      
      // Filter dispatches for current sub-center that are DISPATCHED status
      const filteredDispatches = dispatchesData.filter((dispatch: any) => {
        const dispatchSubCenterId = dispatch.subCenterId || dispatch.sub_center_id || dispatch.to_center_id;
        const dispatchStatus = dispatch.status;
        
        console.log('🔍 Checking dispatch:', {
          dispatchId: dispatch.dispatchId || dispatch.id,
          dispatchSubCenterId,
          currentSubCenterId,
          status: dispatchStatus,
          matches: String(dispatchSubCenterId) === String(currentSubCenterId),
          isDispatched: dispatchStatus === 'DISPATCHED'
        });
        
        return String(dispatchSubCenterId) === String(currentSubCenterId) && 
               (dispatchStatus === 'DISPATCHED' || dispatchStatus === 'PENDING');
      });
      
      console.log('📦 Filtered pending dispatches for sub-center:', filteredDispatches);
      
      const pendingDispatches: PendingDispatch[] = filteredDispatches.map((dispatch: any) => ({
        id: dispatch.id,
        dispatchId: dispatch.dispatchId || dispatch.dispatch_id || `DSP-${dispatch.id}`,
        fromMainCenter: dispatch.fromCenter || dispatch.from_center || 'Main Center',
        sentDate: dispatch.dispatchedDate || dispatch.dispatched_date || dayjs().format('YYYY-MM-DD'),
        sentTime: dispatch.dispatchedTime || dispatch.dispatched_time || dayjs().format('HH:mm'),
        books: dispatch.books || [],
        totalBooks: dispatch.totalBooks || dispatch.total_books || (dispatch.books ? dispatch.books.length : 0),
        totalCoupons: dispatch.totalCoupons || dispatch.total_coupons || 
          (dispatch.books ? dispatch.books.reduce((sum: number, book: any) => 
            sum + (book.numberOfCoupons || book.number_of_coupons || 0), 0) : 0),
        totalValue: dispatch.totalValue || dispatch.total_value || 
          (dispatch.books ? dispatch.books.reduce((sum: number, book: any) => 
            sum + (book.value || 0), 0) : 0),
        status: 'DISPATCHED' as const,
        trackingNumber: dispatch.trackingNumber || dispatch.tracking_number || `TRK-${dispatch.id}`,
        notes: dispatch.notes || 'Dispatch from Main Center',
      }));
      
      console.log('✅ Final pending dispatches to display:', pendingDispatches);
      setPendingDispatches(pendingDispatches);
    } catch (error) {
      console.error('Error loading pending dispatches:', error);
      message.error('Failed to load pending dispatches from backend');
      setPendingDispatches([]);
    }
  };

  const calculateStats = (books: IncomingBook[]) => {
    const newStats: SubCenterStats = {
      totalBooksReceived: books.length,
      totalCouponsReceived: books.reduce((sum, book) => sum + book.totalCoupons, 0),
      totalValueReceived: books.reduce((sum, book) => sum + book.totalValue, 0),
      couponsAllocated: books.reduce((sum, book) => sum + book.couponsAllocated, 0),
      couponsUsed: 0, // Calculate from usage data
      couponsRemaining: books.reduce((sum, book) => sum + book.couponsRemaining, 0),
      valueAllocated: books.reduce((sum, book) => sum + book.valueAllocated, 0),
      valueUsed: 0, // Calculate from usage data
      valueRemaining: books.reduce((sum, book) => sum + book.valueRemaining, 0),
      activeBeneficiaries: beneficiaries.filter(b => b.status === 'ACTIVE').length,
      totalAllocations: allocations.length,
    };

    setStats(newStats);
  };

  const handleCouponAllocation = async (values: any) => {
    try {
      const { beneficiaryId, firstSerial, lastSerial, sessionName, programName, notes } = values;
      
      // Validate serial range and calculate coupons
      const firstMatch = firstSerial.match(/^(.*?)(\d+)$/);
      const lastMatch = lastSerial.match(/^(.*?)(\d+)$/);
      
      if (!firstMatch || !lastMatch) {
        message.error('Invalid coupon serial format');
        return;
      }

      const firstNum = parseInt(firstMatch[2], 10);
      const lastNum = parseInt(lastMatch[2], 10);
      const totalCoupons = lastNum - firstNum + 1;

      if (totalCoupons <= 0) {
        message.error('Last serial must be greater than first serial');
        return;
      }

      // Check if coupons span across multiple books
      const affectedBooks = incomingBooks.filter(book => {
        const bookFirstNum = parseInt(book.firstCouponSerial.match(/(\d+)$/)![1], 10);
        const bookLastNum = parseInt(book.lastCouponSerial.match(/(\d+)$/)![1], 10);
        return (firstNum >= bookFirstNum && firstNum <= bookLastNum) ||
               (lastNum >= bookFirstNum && lastNum <= bookLastNum) ||
               (firstNum <= bookFirstNum && lastNum >= bookLastNum);
      });

      if (affectedBooks.length === 0) {
        message.error('No books found containing the specified coupon range');
        return;
      }

      // Create allocation record
      const newAllocation: AllocationRecord = {
        id: `ALLOC${Date.now()}`,
        beneficiaryId,
        beneficiaryName: beneficiaries.find(b => b.id === beneficiaryId)?.name || '',
        allocationDate: dayjs().format('YYYY-MM-DD'),
        sessionName,
        programName,
        firstCouponSerial: firstSerial,
        lastCouponSerial: lastSerial,
        totalCoupons,
        totalLitres: totalCoupons * (affectedBooks[0]?.couponAmount || 20),
        totalValue: totalCoupons * (affectedBooks[0]?.couponAmount || 20) * 200, // Assume 200 per litre
        notes,
        allocatedBy: 'Current User', // Would get from auth context
        status: 'ALLOCATED',
        pages: generateSerialRange(firstSerial, lastSerial),
      };

      setAllocations([...allocations, newAllocation]);
      message.success(`Successfully allocated ${totalCoupons} coupons across ${affectedBooks.length} book(s)`);
      setAllocationModalVisible(false);
      allocationForm.resetFields();
      
      // Reload data to update statistics
      loadInventoryData();
    } catch (error) {
      console.error('Error allocating coupons:', error);
      message.error('Failed to allocate coupons');
    }
  };

  const generateSerialRange = (firstSerial: string, lastSerial: string): string[] => {
    const serials: string[] = [];
    const match = firstSerial.match(/^(.*?)(\d+)$/);
    if (!match) return serials;

    const prefix = match[1];
    const startNumber = parseInt(match[2], 10);
    const endNumber = parseInt(lastSerial.match(/(\d+)$/)![1], 10);
    const numberLength = match[2].length;

    for (let i = startNumber; i <= endNumber; i++) {
      const paddedNumber = i.toString().padStart(numberLength, '0');
      serials.push(`${prefix}${paddedNumber}`);
    }

    return serials;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'RECEIVED': return 'blue';
      case 'IN_USE': return 'orange';
      case 'COMPLETED': return 'green';
      case 'PARTIALLY_USED': return 'orange';
      case 'ACTIVE': return 'green';
      case 'SUSPENDED': return 'red';
      case 'ALLOCATED': return 'blue';
      case 'USED': return 'green';
      case 'AVAILABLE': return 'default';
      default: return 'default';
    }
  };

  const booksColumns: ColumnsType<IncomingBook> = [
    {
      title: 'Book Number',
      dataIndex: 'bookNumber',
      key: 'bookNumber',
      render: (number) => <Text strong>{number}</Text>,
    },
    {
      title: 'Fuel Type',
      dataIndex: 'fuelType',
      key: 'fuelType',
      render: (type) => (
        <Tag color={type === 'PETROL' ? 'blue' : 'green'}>
          {type} {incomingBooks.find(b => b.fuelType === type)?.couponAmount}L
        </Tag>
      ),
    },
    {
      title: 'Coupon Range',
      key: 'couponRange',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text style={{ fontSize: '12px' }}>
            First: <strong>{record.firstCouponSerial}</strong>
          </Text>
          <Text style={{ fontSize: '12px' }}>
            Last: <strong>{record.lastCouponSerial}</strong>
          </Text>
        </Space>
      ),
    },
    {
      title: 'Usage',
      key: 'usage',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text style={{ fontSize: '12px' }}>
            Allocated: <strong>{record.couponsAllocated}</strong> / {record.totalCoupons}
          </Text>
          <Progress 
            percent={(record.couponsAllocated / record.totalCoupons) * 100} 
            size="small"
          />
        </Space>
      ),
    },
    {
      title: 'Value Remaining',
      dataIndex: 'valueRemaining',
      key: 'valueRemaining',
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
    {
      title: 'Received',
      key: 'received',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text style={{ fontSize: '12px' }}>{record.receivedDate}</Text>
          <Text type="secondary" style={{ fontSize: '10px' }}>{record.receivedTime}</Text>
        </Space>
      ),
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
              setSelectedBook(record);
              setBookDetailsModalVisible(true);
            }}
          >
            View Pages
          </Button>
        </Space>
      ),
    },
  ];

  const beneficiaryColumns: ColumnsType<Beneficiary> = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (name) => <Text strong>{name}</Text>,
    },
    {
      title: 'Member ID',
      dataIndex: 'memberId',
      key: 'memberId',
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
      title: 'Fuel Allocation',
      key: 'allocation',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text style={{ fontSize: '12px' }}>
            Used: <strong>{record.usedLitres}L</strong> / {record.allocatedLitres}L
          </Text>
          <Progress 
            percent={(record.usedLitres / record.allocatedLitres) * 100} 
            size="small"
          />
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
      title: 'Last Allocation',
      dataIndex: 'lastAllocation',
      key: 'lastAllocation',
    },
  ];

  const allocationColumns: ColumnsType<AllocationRecord> = [
    {
      title: 'Beneficiary',
      dataIndex: 'beneficiaryName',
      key: 'beneficiaryName',
      render: (name) => <Text strong>{name}</Text>,
    },
    {
      title: 'Date',
      dataIndex: 'allocationDate',
      key: 'allocationDate',
    },
    {
      title: 'Session/Program',
      key: 'session',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text style={{ fontSize: '12px' }}>{record.sessionName}</Text>
          <Text type="secondary" style={{ fontSize: '10px' }}>{record.programName}</Text>
        </Space>
      ),
    },
    {
      title: 'Coupon Range',
      key: 'range',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text style={{ fontSize: '11px' }}>
            {record.firstCouponSerial} - {record.lastCouponSerial}
          </Text>
          <Text type="secondary" style={{ fontSize: '10px' }}>
            {record.totalCoupons} coupons ({record.totalLitres}L)
          </Text>
        </Space>
      ),
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

  // Pending dispatches columns
  const pendingDispatchesColumns: ColumnsType<PendingDispatch> = [
    {
      title: 'Dispatch ID',
      dataIndex: 'dispatchId',
      key: 'dispatchId',
      render: (dispatchId) => (
        <Text strong>{dispatchId}</Text>
      ),
    },
    {
      title: 'From',
      dataIndex: 'fromMainCenter',
      key: 'fromMainCenter',
    },
    {
      title: 'Sent',
      key: 'sent',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text style={{ fontSize: '12px' }}>
            <CalendarOutlined /> {record.sentDate}
          </Text>
          <Text style={{ fontSize: '12px' }}>
            <ClockCircleOutlined /> {record.sentTime}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Books & Coupons',
      key: 'inventory',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text><BookOutlined /> {record.totalBooks} Books</Text>
          <Text style={{ fontSize: '12px' }}>
            {record.totalCoupons} Coupons
          </Text>
        </Space>
      ),
    },
    {
      title: 'Total Value',
      dataIndex: 'totalValue',
      key: 'totalValue',
      render: (value) => (
        <Text strong>ZWG {value.toLocaleString()}</Text>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'DISPATCHED' ? 'blue' : status === 'IN_TRANSIT' ? 'orange' : 'green'}>
          {status}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<CheckCircleOutlined />}
            onClick={() => handleConfirmReception(record)}
          >
            Confirm Reception
          </Button>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => {
              Modal.info({
                title: `Dispatch ${record.dispatchId} Details`,
                content: (
                  <div>
                    <p><strong>Tracking:</strong> {record.trackingNumber}</p>
                    <p><strong>Books:</strong> {record.totalBooks}</p>
                    <p><strong>Coupons:</strong> {record.totalCoupons}</p>
                    <p><strong>Value:</strong> ZWG {record.totalValue.toLocaleString()}</p>
                    {record.notes && <p><strong>Notes:</strong> {record.notes}</p>}
                  </div>
                ),
              });
            }}
          >
            View Details
          </Button>
        </Space>
      ),
    },
  ];

  // Confirm reception handler
  const handleConfirmReception = async (dispatch: PendingDispatch) => {
    try {
      console.log('✅ Confirming reception of dispatch:', dispatch.dispatchId);
      
      // Try API call to confirm reception
      try {
        await apiClient.patch(`/dispatches/${dispatch.id}/`, {
          status: 'RECEIVED',
          receptionConfirmed: true,
          receivedDate: new Date().toISOString().split('T')[0],
          receivedTime: new Date().toTimeString().slice(0, 5),
        });
        
        message.success(`Successfully confirmed reception of dispatch ${dispatch.dispatchId}`);
      } catch (apiError) {
        console.warn('API confirmation failed, updating local state only');
        message.success(`Confirmed reception of dispatch ${dispatch.dispatchId} (local update)`);
      }

      // Remove from pending dispatches (since it's now received)
      setPendingDispatches(prev => prev.filter(d => d.id !== dispatch.id));
      
      // Optionally, refresh inventory to show newly received books
      loadInventoryData();
      
    } catch (error) {
      console.error('Error confirming reception:', error);
      message.error('Failed to confirm reception');
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={2}>SubCenter Inventory</Title>
            <Text type="secondary">
              Manage incoming books and allocate fuel coupons to beneficiaries
            </Text>
          </Col>
          <Col>
            <Space>
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={() => setAllocationModalVisible(true)}
              >
                New Allocation
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
              title="Books Received"
              value={stats.totalBooksReceived}
              prefix={<BookOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Coupons Available"
              value={stats.couponsRemaining}
              suffix={`/ ${stats.totalCouponsReceived}`}
              valueStyle={{ color: stats.couponsRemaining > 0 ? '#3f8600' : '#cf1322' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Active Beneficiaries"
              value={stats.activeBeneficiaries}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Value Remaining"
              value={stats.valueRemaining}
              formatter={(value) => `ZWG ${value?.toLocaleString()}`}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
      </Row>

      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="Book Inventory" key="inventory">
          <Card>
            <Table
              columns={booksColumns}
              dataSource={incomingBooks}
              rowKey="id"
              loading={loading}
              pagination={{
                pageSize: 10,
                showTotal: (total, range) => 
                  `${range[0]}-${range[1]} of ${total} books`,
              }}
            />
          </Card>
        </TabPane>

        <TabPane tab="Beneficiaries" key="beneficiaries">
          <Card>
            <Table
              columns={beneficiaryColumns}
              dataSource={beneficiaries}
              rowKey="id"
              pagination={{
                pageSize: 10,
                showTotal: (total, range) => 
                  `${range[0]}-${range[1]} of ${total} beneficiaries`,
              }}
            />
          </Card>
        </TabPane>

        <TabPane tab="Allocation History" key="allocations">
          <Card>
            <Table
              columns={allocationColumns}
              dataSource={allocations}
              rowKey="id"
              pagination={{
                pageSize: 10,
                showTotal: (total, range) => 
                  `${range[0]}-${range[1]} of ${total} allocations`,
              }}
            />
          </Card>
        </TabPane>

        <TabPane tab="Pending Dispatches" key="pending-dispatches">
          <Card>
            <Table
              columns={pendingDispatchesColumns}
              dataSource={pendingDispatches}
              rowKey="id"
              loading={loading}
              pagination={{
                pageSize: 10,
                showTotal: (total, range) => 
                  `${range[0]}-${range[1]} of ${total} pending dispatches`,
              }}
            />
          </Card>
        </TabPane>
      </Tabs>

      {/* Book Details Modal */}
      <Modal
        title={
          <Space>
            <BookOutlined />
            Book Pages - {selectedBook?.bookNumber}
          </Space>
        }
        open={bookDetailsModalVisible}
        onCancel={() => setBookDetailsModalVisible(false)}
        footer={null}
        width={1000}
      >
        {selectedBook && (
          <div>
            <Descriptions bordered column={2} style={{ marginBottom: 16 }}>
              <Descriptions.Item label="Book Number">{selectedBook.bookNumber}</Descriptions.Item>
              <Descriptions.Item label="Fuel Type">
                <Tag color={selectedBook.fuelType === 'PETROL' ? 'blue' : 'green'}>
                  {selectedBook.fuelType} {selectedBook.couponAmount}L
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="First Serial">{selectedBook.firstCouponSerial}</Descriptions.Item>
              <Descriptions.Item label="Last Serial">{selectedBook.lastCouponSerial}</Descriptions.Item>
              <Descriptions.Item label="Total Coupons">{selectedBook.totalCoupons}</Descriptions.Item>
              <Descriptions.Item label="Allocated">{selectedBook.couponsAllocated}</Descriptions.Item>
              <Descriptions.Item label="Remaining">{selectedBook.couponsRemaining}</Descriptions.Item>
              <Descriptions.Item label="Received Date">{selectedBook.receivedDate} {selectedBook.receivedTime}</Descriptions.Item>
            </Descriptions>

            <Divider>Individual Coupon Pages</Divider>
            
            <div style={{ 
              maxHeight: '400px', 
              overflowY: 'auto', 
              border: '1px solid #d9d9d9', 
              borderRadius: '6px',
              padding: '16px',
            }}>
              <Row gutter={[8, 8]}>
                {selectedBook.pages.map((page, index) => (
                  <Col span={8} key={page.id}>
                    <Card 
                      size="small" 
                      style={{ 
                        textAlign: 'center',
                        backgroundColor: page.status === 'ALLOCATED' ? '#e6f7ff' : '#f5f5f5'
                      }}
                    >
                      <Space direction="vertical" size={0}>
                        <Text strong style={{ fontSize: '12px' }}>
                          Page #{page.pageNumber}
                        </Text>
                        <Text style={{ fontSize: '11px', fontFamily: 'monospace' }}>
                          {page.couponSerial}
                        </Text>
                        <Tag 
                          color={getStatusColor(page.status)}
                        >
                          {page.status}
                        </Tag>
                        {page.beneficiaryName && (
                          <Text style={{ fontSize: '10px' }} type="secondary">
                            {page.beneficiaryName}
                          </Text>
                        )}
                      </Space>
                    </Card>
                  </Col>
                ))}
              </Row>
            </div>
          </div>
        )}
      </Modal>

      {/* Allocation Modal */}
      <Modal
        title={
          <Space>
            <SendOutlined />
            Allocate Fuel Coupons
          </Space>
        }
        open={allocationModalVisible}
        onCancel={() => {
          setAllocationModalVisible(false);
          allocationForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={allocationForm}
          layout="vertical"
          onFinish={handleCouponAllocation}
        >
          <Alert
            message="Coupon Allocation"
            description="Allocate sequential coupon pages to beneficiaries. Coupons may span across multiple books."
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />

          <Form.Item
            label="Beneficiary"
            name="beneficiaryId"
            rules={[{ required: true, message: 'Please select a beneficiary' }]}
          >
            <Select placeholder="Select beneficiary">
              {beneficiaries.map(beneficiary => {
                const displayName = beneficiary.name || 'Unknown Name';
                return (
                  <Option key={beneficiary.id} value={beneficiary.id}>
                    <Space direction="vertical" size={0}>
                      <Text strong>{displayName}</Text>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        {beneficiary.position} - {beneficiary.department}
                      </Text>
                    </Space>
                  </Option>
                );
              })}
            </Select>
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="First Coupon Serial"
                name="firstSerial"
                rules={[{ required: true, message: 'Please enter first serial' }]}
              >
                <Input placeholder="e.g., PET20-2024-08-000001" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Last Coupon Serial"
                name="lastSerial"
                rules={[{ required: true, message: 'Please enter last serial' }]}
              >
                <Input placeholder="e.g., PET20-2024-08-000010" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Session Name"
                name="sessionName"
                rules={[{ required: true, message: 'Please enter session name' }]}
              >
                <Input placeholder="e.g., Morning Session" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Program Name"
                name="programName"
                rules={[{ required: true, message: 'Please enter program name' }]}
              >
                <Input placeholder="e.g., Committee Meeting" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Notes"
            name="notes"
          >
            <TextArea 
              rows={3} 
              placeholder="Additional allocation notes..."
            />
          </Form.Item>

          <div style={{ textAlign: 'right' }}>
            <Space>
              <Button onClick={() => {
                setAllocationModalVisible(false);
                allocationForm.resetFields();
              }}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit">
                Allocate Coupons
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default SubCenterInventoryManagement;
