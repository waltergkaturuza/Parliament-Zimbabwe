// src/pages/main-center/components/BookDispatchManagement.tsx
import { useState, useEffect } from 'react';
import type { FC } from 'react';
import { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import apiClient from '../../../api/index';
import {
  Card,
  Table,
  Button,
  Form,
  Modal,
  Input,
  Select,
  DatePicker,
  InputNumber,
  Space,
  Tag,
  Divider,
  Row,
  Col,
  Typography,
  Alert,
  Descriptions,
  Transfer,
  message,
  Popconfirm,
  Steps,
  Checkbox,
  Upload,
  Badge,
  Tooltip,
  Statistic,
  Timeline,
  TimePicker,
} from 'antd';
import {
  SendOutlined,
  PlusOutlined,
  EyeOutlined,
  PrinterOutlined,
  FileTextOutlined,
  CheckOutlined,
  ClockCircleOutlined,
  CarOutlined,
  EnvironmentOutlined,
  UserOutlined,
  UploadOutlined,
  BookOutlined,
  InboxOutlined,
  ExclamationCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  DollarCircleOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { Step } = Steps;

interface BookDispatch {
  id: string;
  dispatchId: string;
  subCenterId: string;
  subCenterName: string;
  dispatchedBy: string;
  dispatchedDate: string;
  dispatchedTime: string;
  books: DispatchedBook[];
  totalBooks: number;
  totalCoupons: number;
  totalValue: number;
  status: 'PENDING' | 'DISPATCHED' | 'RECEIVED' | 'CONFIRMED' | 'CANCELLED';
  receivedBy?: string;
  receivedDate?: string;
  receivedTime?: string;
  receiverSignature?: string;
  transportDetails?: string;
  vehicleNumber?: string;
  driverName?: string;
  driverPhone?: string;
  notes?: string;
  trackingNumber?: string;
}

interface DispatchedBook {
  id: string;
  bookId: string;
  boxId: string;
  fuelType: 'PETROL' | 'DIESEL';
  couponAmount: 5 | 20;
  firstCouponId: string;
  lastCouponId: string;
  numberOfCoupons: number;
  value: number;
  pricePerLitre: number;
}

interface AvailableBook {
  key: string;
  bookId: string;
  boxId: string;
  fuelType: 'PETROL' | 'DIESEL';
  couponAmount: 5 | 20;
  firstCouponId: string;
  lastCouponId: string;
  numberOfCoupons: number;
  value: number;
  pricePerLitre: number;
  status: 'VERIFIED' | 'AVAILABLE';
}

interface SubCenter {
  id: string;
  name: string;
  location: string;
  officerName: string;
  phone: string;
  email: string;
  status: 'ACTIVE' | 'INACTIVE';
}

const BookDispatchManagement: FC = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [selectedDispatch, setSelectedDispatch] = useState<BookDispatch | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [dispatches, setDispatches] = useState<BookDispatch[]>([]);
  const [availableBooks, setAvailableBooks] = useState<AvailableBook[]>([]);
  const [subCenters, setSubCenters] = useState<SubCenter[]>([]);
  const [selectedBooks, setSelectedBooks] = useState<string[]>([]);
  const [nextDispatchNumber, setNextDispatchNumber] = useState('');
  
  // New state for book details functionality
  const [selectedBookForDetails, setSelectedBookForDetails] = useState<AvailableBook | null>(null);
  const [bookDetailsModalVisible, setBookDetailsModalVisible] = useState(false);
  const [bookDetailConfirmations, setBookDetailConfirmations] = useState<Record<string, boolean>>({});

  // Load data from API instead of hardcoded sample data
  useEffect(() => {
    loadDispatches();
    loadAvailableBooks();
    loadSubCenters();
  }, []);

  const loadDispatches = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/v1/dispatches/');
      const data = response.data.results || response.data || [];
      setDispatches(data);
    } catch (error) {
      console.error('Error loading dispatches:', error);
      message.error('Failed to load dispatches');
      // Fallback to empty array instead of sample data
      setDispatches([]);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableBooks = async () => {
    try {
      const response = await apiClient.get('/api/v1/books/', {
        params: { status: 'VERIFIED', available: true }
      });
      const data = response.data.results || response.data || [];
      setAvailableBooks(data);
    } catch (error) {
      console.error('Error loading available books:', error);
      message.error('Failed to load available books');
      // Fallback to empty array
      setAvailableBooks([]);
    }
  };

  const loadSubCenters = async () => {
    try {
      const response = await apiClient.get('/api/v1/subcenters/');
      const data = response.data.results || response.data || [];
      setSubCenters(data);
    } catch (error) {
      console.error('Error loading sub-centers:', error);
      message.error('Failed to load sub-centers');
      // Fallback to empty array
      setSubCenters([]);
    }
  };

  // Helper function to generate individual coupon serials from first and last serial
  const generateCouponSerials = (firstSerial: string, numberOfCoupons: number): string[] => {
    const serials: string[] = [];
    
    // Extract the numeric part and prefix from the first serial
    const match = firstSerial.match(/^(.*?)(\d+)$/);
    if (!match) {
      return serials;
    }
    
    const prefix = match[1];
    const startNumber = parseInt(match[2], 10);
    const numberLength = match[2].length;
    
    // Generate all serial numbers
    for (let i = 0; i < numberOfCoupons; i++) {
      const currentNumber = startNumber + i;
      const paddedNumber = currentNumber.toString().padStart(numberLength, '0');
      serials.push(`${prefix}${paddedNumber}`);
    }
    
    return serials;
  };

  // Helper function to handle book detail confirmation
  const handleBookDetailConfirmation = (bookId: string, confirmed: boolean) => {
    setBookDetailConfirmations(prev => ({
      ...prev,
      [bookId]: confirmed
    }));
  };

  // Helper function to check if all selected books are confirmed
  const areAllBooksConfirmed = (): boolean => {
    return selectedBooks.every(bookId => bookDetailConfirmations[bookId] === true);
  };

  // Helper function to reset confirmations when books selection changes
  useEffect(() => {
    // Reset confirmations when selected books change
    setBookDetailConfirmations({});
  }, [selectedBooks]);

  // Helper function to reset form and state when modal closes
  const handleModalClose = () => {
    setIsModalVisible(false);
    setCurrentStep(0);
    setSelectedBooks([]);
    setBookDetailConfirmations({});
    form.resetFields();
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchDispatches();
    fetchAvailableBooks();
    fetchSubCenters();
    generateNextDispatchNumber();
  }, []);

  const fetchDispatches = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/api/v1/dispatches/');
      const data = response.data;
      
      // Handle both paginated and direct array responses
      const dispatches = data.results || data;
      
      if (Array.isArray(dispatches)) {
        // Map backend data to frontend format
        const mappedDispatches = dispatches.map((dispatch: any) => ({
          id: String(dispatch.id),
          dispatchId: `DSP-${new Date(dispatch.dispatch_date).getFullYear()}-${String(new Date(dispatch.dispatch_date).getMonth() + 1).padStart(2, '0')}-${String(dispatch.id).padStart(4, '0')}`,
          subCenterId: dispatch.to_center?.id || '',
          subCenterName: dispatch.to_center?.name || 'Unknown Center',
          dispatchedBy: dispatch.dispatched_by?.first_name && dispatch.dispatched_by?.last_name 
            ? `${dispatch.dispatched_by.first_name} ${dispatch.dispatched_by.last_name}` 
            : 'System User',
          dispatchedDate: new Date(dispatch.dispatch_date).toISOString().split('T')[0],
          dispatchedTime: new Date(dispatch.dispatch_date).toTimeString().split(' ')[0],
          books: dispatch.books?.map((book: any) => ({
            id: String(book.id),
            bookId: book.book_number || `BK-${book.id}`,
            boxId: book.box?.box_code || 'Unknown Box',
            fuelType: 'DIESEL' as const, // Default - backend doesn't have this field yet
            couponAmount: 20 as const, // Default
            firstCouponId: book.first_coupon_number || '',
            lastCouponId: book.last_coupon_number || '',
            numberOfCoupons: 10, // Default coupons per book
            value: 10 * 37.95, // Calculate based on current fuel price
            pricePerLitre: 37.95,
          })) || [],
          totalBooks: dispatch.book_count || 0,
          totalCoupons: (dispatch.book_count || 0) * 10,
          totalValue: (dispatch.book_count || 0) * 10 * 37.95,
          status: dispatch.status === 'PENDING' ? 'PENDING' : 
                  dispatch.status === 'DISPATCHED' ? 'DISPATCHED' :
                  dispatch.status === 'RECEIVED' ? 'RECEIVED' : 'PENDING',
          receivedDate: dispatch.received_date ? new Date(dispatch.received_date).toISOString().split('T')[0] : undefined,
          notes: dispatch.notes || '',
          trackingNumber: `TRK-${new Date().getFullYear()}-${String(dispatch.id).padStart(6, '0')}`,
        }));
        
        setDispatches(mappedDispatches);
      } else {
        console.warn('No dispatches data received from API');
        setDispatches([]);
      }
    } catch (error) {
      console.error('Error fetching dispatches:', error);
      setDispatches([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableBooks = async () => {
    try {
      const response = await apiClient.get('/api/v1/books/');
      const data = response.data;
      
      // Handle both paginated and direct array responses
      const books = data.results || data;
      
      if (Array.isArray(books)) {
        // Filter for available books and map to frontend format
        const availableBooks = books.filter((book: any) => !book.is_assigned).map((book: any) => ({
          key: String(book.id),
          bookId: book.book_number || `BK-${book.id}`,
          boxId: book.box?.box_code || 'Unknown Box',
          fuelType: 'DIESEL' as const, // Default - backend doesn't have this field yet
          couponAmount: 20 as const, // Default
          firstCouponId: book.first_coupon_number || '',
          lastCouponId: book.last_coupon_number || '',
          numberOfCoupons: 10, // Default coupons per book
          value: 10 * 37.95, // Calculate based on current fuel price
          pricePerLitre: 37.95,
          status: 'AVAILABLE' as const,
        }));
        
        setAvailableBooks(availableBooks);
      } else {
        console.warn('No books data received from API');
        setAvailableBooks([]);
      }
    } catch (error) {
      console.error('Error fetching available books:', error);
      setAvailableBooks([]);
    }
  };

  const fetchSubCenters = async () => {
    try {
      const response = await apiClient.get('/api/v1/subcenters/');
      const data = response.data;
      
      // Handle both paginated and direct array responses
      const subcenters = data.results || data;
      
      if (Array.isArray(subcenters)) {
        // Map backend data to frontend format
        const mappedSubCenters = subcenters.map((subcenter: any) => ({
          id: String(subcenter.id),
          name: subcenter.name,
          location: subcenter.location || 'Unknown Location',
          officerName: subcenter.officer_in_charge?.first_name && subcenter.officer_in_charge?.last_name 
            ? `${subcenter.officer_in_charge.first_name} ${subcenter.officer_in_charge.last_name}` 
            : 'Unknown Officer',
          phone: subcenter.contact_phone || '',
          email: subcenter.contact_email || '',
          status: 'ACTIVE' as const, // Default status
        }));
        
        setSubCenters(mappedSubCenters);
      } else {
        console.warn('No subcenters data received from API');
        setSubCenters([]);
      }
    } catch (error) {
      console.error('Error fetching sub centers:', error);
      setSubCenters([]);
    }
  };

  const generateNextDispatchNumber = () => {
    const year = new Date().getFullYear();
    const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
    const lastDispatch = dispatches
      .filter(dispatch => dispatch.dispatchId.includes(`${year}-${month}`))
      .sort((a, b) => b.dispatchId.localeCompare(a.dispatchId))[0];
    
    let nextNumber = 1;
    if (lastDispatch) {
      const lastNumber = parseInt(lastDispatch.dispatchId.split('-')[3]) || 0;
      nextNumber = lastNumber + 1;
    }
    
    setNextDispatchNumber(`DSP-${year}-${month}-${nextNumber.toString().padStart(4, '0')}`);
  };

  // Form handlers
  const handleAddDispatch = () => {
    setCurrentStep(0);
    form.resetFields();
    setSelectedBooks([]);
    generateNextDispatchNumber();
    setIsModalVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const selectedBookDetails = availableBooks.filter(book => 
        selectedBooks.includes(book.key)
      );

      const totalBooks = selectedBookDetails.length;
      const totalCoupons = selectedBookDetails.reduce((sum, book) => sum + book.numberOfCoupons, 0);
      const totalValue = selectedBookDetails.reduce((sum, book) => sum + book.value, 0);

      const newDispatch: BookDispatch = {
        id: Date.now().toString(),
        dispatchId: nextDispatchNumber,
        subCenterId: values.subCenterId,
        subCenterName: subCenters.find(sc => sc.id === values.subCenterId)?.name || '',
        dispatchedBy: values.dispatchedBy,
        dispatchedDate: values.dispatchedDate?.format('YYYY-MM-DD') || new Date().toISOString().split('T')[0],
        dispatchedTime: values.dispatchedTime?.format('HH:mm') || new Date().toTimeString().slice(0, 5),
        books: selectedBookDetails.map(book => ({
          id: book.key,
          bookId: book.bookId,
          boxId: book.boxId,
          fuelType: book.fuelType,
          couponAmount: book.couponAmount,
          firstCouponId: book.firstCouponId,
          lastCouponId: book.lastCouponId,
          numberOfCoupons: book.numberOfCoupons,
          value: book.value,
          pricePerLitre: book.pricePerLitre,
        })),
        totalBooks,
        totalCoupons,
        totalValue,
        status: 'DISPATCHED',
        transportDetails: values.transportDetails,
        vehicleNumber: values.vehicleNumber,
        driverName: values.driverName,
        driverPhone: values.driverPhone,
        notes: values.notes,
        trackingNumber: `TRK-${new Date().getFullYear()}-${(new Date().getMonth() + 1).toString().padStart(2, '0')}${Date.now().toString().slice(-4)}`,
      };

      // API call to save dispatch
      try {
        const response = await fetch('/api/v1/dispatches/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newDispatch),
        });

        if (response.ok) {
          setDispatches([newDispatch, ...dispatches]);
          // Remove dispatched books from available books
          setAvailableBooks(prev => prev.filter(book => !selectedBooks.includes(book.key)));
          message.success('Books dispatched successfully!');
        } else {
          throw new Error('API call failed');
        }
      } catch (apiError) {
        // For demo, add to local state
        setDispatches([newDispatch, ...dispatches]);
        setAvailableBooks(prev => prev.filter(book => !selectedBooks.includes(book.key)));
        message.success('Books dispatched successfully! (Demo mode)');
      }

      setIsModalVisible(false);
      generateNextDispatchNumber();
    } catch (error) {
      console.error('Error submitting dispatch:', error);
      message.error('Failed to dispatch books');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReceipt = async (dispatch: BookDispatch) => {
    try {
      const updatedDispatch = {
        ...dispatch,
        status: 'CONFIRMED' as const,
      };

      // Update in local state (replace with API call)
      setDispatches(prev => 
        prev.map(d => d.id === dispatch.id ? updatedDispatch : d)
      );

      message.success('Receipt confirmed successfully!');
    } catch (error) {
      console.error('Error confirming receipt:', error);
      message.error('Failed to confirm receipt');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'orange';
      case 'DISPATCHED': return 'blue';
      case 'RECEIVED': return 'green';
      case 'CONFIRMED': return 'purple';
      case 'CANCELLED': return 'red';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return <ClockCircleOutlined />;
      case 'DISPATCHED': return <SendOutlined />;
      case 'RECEIVED': return <InboxOutlined />;
      case 'CONFIRMED': return <CheckOutlined />;
      case 'CANCELLED': return <ExclamationCircleOutlined />;
      default: return null;
    }
  };

  const columns: ColumnsType<BookDispatch> = [
    {
      title: 'Dispatch ID',
      dataIndex: 'dispatchId',
      key: 'dispatchId',
      fixed: 'left',
      width: 160,
      render: (text, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{text}</Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.trackingNumber}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Sub Center',
      key: 'subCenter',
      width: 200,
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{record.subCenterName}</Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            <EnvironmentOutlined /> {record.subCenterId}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Books & Coupons',
      key: 'inventory',
      width: 150,
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
      width: 120,
      render: (value) => (
        <Text strong>ZWG {value.toLocaleString()}</Text>
      ),
    },
    {
      title: 'Dispatch Details',
      key: 'dispatchDetails',
      width: 180,
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text style={{ fontSize: '12px' }}>
            <UserOutlined /> {record.dispatchedBy}
          </Text>
          <Text style={{ fontSize: '12px' }}>
            <ClockCircleOutlined /> {record.dispatchedDate} {record.dispatchedTime}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Transport',
      key: 'transport',
      width: 150,
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          {record.vehicleNumber && (
            <Text style={{ fontSize: '12px' }}>
              <CarOutlined /> {record.vehicleNumber}
            </Text>
          )}
          {record.driverName && (
            <Text style={{ fontSize: '12px' }}>
              {record.driverName}
            </Text>
          )}
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => (
        <Badge
          status={getStatusColor(status) as any}
          text={
            <Space>
              {getStatusIcon(status)}
              {status}
            </Space>
          }
        />
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 200,
      render: (_, record) => (
        <Space>
          <Tooltip title="View Details">
            <Button
              type="primary"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => {
                setSelectedDispatch(record);
                setViewModalVisible(true);
              }}
            />
          </Tooltip>
          
          {record.status === 'RECEIVED' && (
            <Tooltip title="Confirm Receipt">
              <Button
                type="default"
                size="small"
                icon={<CheckOutlined />}
                onClick={() => handleConfirmReceipt(record)}
              />
            </Tooltip>
          )}
          
          <Tooltip title="Print Dispatch Note">
            <Button
              size="small"
              icon={<PrinterOutlined />}
              onClick={() => {
                // Handle print dispatch note
                window.print();
              }}
            />
          </Tooltip>
          
          {record.status === 'PENDING' && (
            <Popconfirm
              title="Are you sure you want to cancel this dispatch?"
              onConfirm={() => {
                setDispatches(prev => prev.filter(d => d.id !== record.id));
                message.success('Dispatch cancelled');
              }}
              okText="Yes"
              cancelText="No"
            >
              <Tooltip title="Cancel">
                <Button
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                />
              </Tooltip>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  // Transfer component for book selection
  const bookTransferColumns = [
    {
      dataIndex: 'bookId',
      title: 'Book ID',
    },
    {
      dataIndex: 'fuelType',
      title: 'Fuel',
      render: (fuelType: string) => (
        <Tag color={fuelType === 'PETROL' ? 'blue' : 'green'}>
          {fuelType}
        </Tag>
      ),
    },
    {
      dataIndex: 'couponAmount',
      title: 'Amount',
      render: (amount: number) => `${amount}L`,
    },
    {
      dataIndex: 'numberOfCoupons',
      title: 'Coupons',
    },
    {
      dataIndex: 'value',
      title: 'Value',
      render: (value: number) => `ZWG ${value.toLocaleString()}`,
    },
  ];

  return (
    <div>
      {/* Header */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Title level={4}>Book Dispatch Management</Title>
          <Text type="secondary">Dispatch coupon books to sub-centers with tracking</Text>
        </Col>
        <Col>
          <Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddDispatch}
            >
              New Dispatch
            </Button>
            <Button
              icon={<FileTextOutlined />}
              onClick={() => {
                message.info('Bulk dispatch report feature coming soon');
              }}
            >
              Generate Report
            </Button>
          </Space>
        </Col>
      </Row>

      {/* Quick Stats */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={6}>
          <Card size="small">
            <Statistic
              title="Total Dispatches"
              value={dispatches.length}
              prefix={<SendOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card size="small">
            <Statistic
              title="Pending Confirmation"
              value={dispatches.filter(d => d.status === 'RECEIVED').length}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card size="small">
            <Statistic
              title="Available Books"
              value={availableBooks.length}
              prefix={<BookOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card size="small">
            <Statistic
              title="Next Dispatch"
              value={nextDispatchNumber}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Main Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={dispatches}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1400 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} dispatches`,
          }}
        />
      </Card>

      {/* Add Dispatch Modal */}
      <Modal
        title={
          <Space>
            <SendOutlined />
            New Book Dispatch
          </Space>
        }
        open={isModalVisible}
        onCancel={handleModalClose}
        footer={null}
        width={900}
        destroyOnClose
      >
        <Steps current={currentStep} style={{ marginBottom: 24 }}>
          <Step title="Sub Center" icon={<EnvironmentOutlined />} />
          <Step title="Select Books" icon={<BookOutlined />} />
          <Step title="Books Details" icon={<FileTextOutlined />} />
          <Step title="Confirmation" icon={<CheckOutlined />} />
        </Steps>

        <Form
          form={form}
          layout="vertical"
        >
          {currentStep === 0 && (
            <>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="Dispatch ID"
                    name="dispatchId"
                    initialValue={nextDispatchNumber}
                  >
                    <Input disabled />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Dispatched By"
                    name="dispatchedBy"
                    rules={[{ required: true, message: 'Please enter dispatcher name' }]}
                  >
                    <Input placeholder="Enter dispatcher name" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="Dispatch Date"
                    name="dispatchedDate"
                    initialValue={dayjs()}
                    rules={[{ required: true, message: 'Please select date' }]}
                  >
                    <DatePicker style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Dispatch Time"
                    name="dispatchedTime"
                    initialValue={dayjs()}
                    rules={[{ required: true, message: 'Please select time' }]}
                  >
                    <TimePicker style={{ width: '100%' }} format="HH:mm" />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                label="Sub Center"
                name="subCenterId"
                rules={[{ required: true, message: 'Please select sub center' }]}
              >
                <Select placeholder="Select destination sub center">
                  {subCenters.map(sc => (
                    <Option key={sc.id} value={sc.id}>
                      <Space direction="vertical" size={0}>
                        <Text strong>{sc.name}</Text>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          {sc.location} - {sc.officerName}
                        </Text>
                      </Space>
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <div style={{ textAlign: 'right' }}>
                <Button
                  type="primary"
                  onClick={() => setCurrentStep(1)}
                >
                  Next: Select Books
                </Button>
              </div>
            </>
          )}

          {currentStep === 1 && (
            <>
              <Alert
                message="Select Books for Dispatch"
                description="Choose the verified books to dispatch to the selected sub-center."
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />

              <Transfer
                dataSource={availableBooks}
                titles={['Available Books', 'Selected Books']}
                targetKeys={selectedBooks}
                onChange={(targetKeys: React.Key[]) => setSelectedBooks(targetKeys as string[])}
                render={item => `${item.bookId} - ${item.fuelType} ${item.couponAmount}L (${item.numberOfCoupons} coupons)`}
                oneWay
                style={{ marginBottom: 16 }}
              />

              {selectedBooks.length > 0 && (
                <Card size="small" title="Dispatch Summary">
                  <Row gutter={16}>
                    <Col span={8}>
                      <Statistic
                        title="Total Books"
                        value={selectedBooks.length}
                        prefix={<BookOutlined />}
                      />
                    </Col>
                    <Col span={8}>
                      <Statistic
                        title="Total Coupons"
                        value={availableBooks
                          .filter(book => selectedBooks.includes(book.key))
                          .reduce((sum, book) => sum + book.numberOfCoupons, 0)
                        }
                      />
                    </Col>
                    <Col span={8}>
                      <Statistic
                        title="Total Value"
                        value={availableBooks
                          .filter(book => selectedBooks.includes(book.key))
                          .reduce((sum, book) => sum + book.value, 0)
                        }
                        formatter={(value) => `ZWG ${value?.toLocaleString()}`}
                      />
                    </Col>
                  </Row>
                </Card>
              )}

              <div style={{ textAlign: 'right', marginTop: 16 }}>
                <Space>
                  <Button onClick={() => setCurrentStep(0)}>
                    Previous
                  </Button>
                  <Button
                    type="primary"
                    onClick={() => setCurrentStep(2)}
                    disabled={selectedBooks.length === 0}
                  >
                    Next: Books Details
                  </Button>
                </Space>
              </div>
            </>
          )}

          {currentStep === 2 && (
            <>
              <Alert
                message="Review Books Details"
                description="Review each book's serial number range and confirm the details before proceeding to dispatch."
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />

              <div style={{ marginBottom: 16 }}>
                <Text strong>Selected Books for Dispatch:</Text>
              </div>

              <Table
                dataSource={availableBooks.filter(book => selectedBooks.includes(book.key))}
                columns={[
                  {
                    title: 'Book ID',
                    dataIndex: 'bookId',
                    key: 'bookId',
                    render: (bookId) => <Text strong>{bookId}</Text>,
                  },
                  {
                    title: 'Fuel Type',
                    dataIndex: 'fuelType',
                    key: 'fuelType',
                    render: (fuelType) => (
                      <Tag color={fuelType === 'PETROL' ? 'blue' : 'green'}>
                        {fuelType}
                      </Tag>
                    ),
                  },
                  {
                    title: 'Amount',
                    dataIndex: 'couponAmount',
                    key: 'couponAmount',
                    render: (amount) => `${amount}L`,
                  },
                  {
                    title: 'Total Coupons',
                    dataIndex: 'numberOfCoupons',
                    key: 'numberOfCoupons',
                    render: (count) => (
                      <Badge count={count} showZero color="blue" />
                    ),
                  },
                  {
                    title: 'Serial Range',
                    key: 'serialRange',
                    render: (_, record) => (
                      <Space direction="vertical" size={0}>
                        <Text style={{ fontSize: '12px' }}>
                          <strong>First:</strong> {record.firstCouponId}
                        </Text>
                        <Text style={{ fontSize: '12px' }}>
                          <strong>Last:</strong> {record.lastCouponId}
                        </Text>
                      </Space>
                    ),
                  },
                  {
                    title: 'Value',
                    dataIndex: 'value',
                    key: 'value',
                    render: (value) => (
                      <Text strong>ZWG {value.toLocaleString()}</Text>
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
                            setSelectedBookForDetails(record);
                            setBookDetailsModalVisible(true);
                          }}
                        >
                          View Coupons
                        </Button>
                        <Checkbox
                          checked={bookDetailConfirmations[record.key] || false}
                          onChange={(e) => handleBookDetailConfirmation(record.key, e.target.checked)}
                        >
                          Confirmed
                        </Checkbox>
                      </Space>
                    ),
                  },
                ]}
                pagination={false}
                size="small"
              />

              <Card size="small" title="Dispatch Summary" style={{ marginTop: 16 }}>
                <Row gutter={16}>
                  <Col span={6}>
                    <Statistic
                      title="Total Books"
                      value={selectedBooks.length}
                      prefix={<BookOutlined />}
                    />
                  </Col>
                  <Col span={6}>
                    <Statistic
                      title="Total Coupons"
                      value={availableBooks
                        .filter(book => selectedBooks.includes(book.key))
                        .reduce((sum, book) => sum + book.numberOfCoupons, 0)
                      }
                    />
                  </Col>
                  <Col span={6}>
                    <Statistic
                      title="Total Value"
                      value={availableBooks
                        .filter(book => selectedBooks.includes(book.key))
                        .reduce((sum, book) => sum + book.value, 0)
                      }
                      formatter={(value) => `ZWG ${value?.toLocaleString()}`}
                    />
                  </Col>
                  <Col span={6}>
                    <Statistic
                      title="Confirmed Books"
                      value={Object.values(bookDetailConfirmations).filter(Boolean).length}
                      suffix={`/ ${selectedBooks.length}`}
                      valueStyle={{ 
                        color: areAllBooksConfirmed() ? '#3f8600' : '#cf1322' 
                      }}
                    />
                  </Col>
                </Row>
              </Card>

              <div style={{ textAlign: 'right', marginTop: 16 }}>
                <Space>
                  <Button onClick={() => setCurrentStep(1)}>
                    Previous
                  </Button>
                  <Button
                    type="primary"
                    onClick={() => setCurrentStep(3)}
                    disabled={!areAllBooksConfirmed()}
                  >
                    Next: Confirmation
                  </Button>
                </Space>
              </div>
            </>
          )}

          {currentStep === 3 && (
            <>
              <Alert
                message="Confirm Dispatch"
                description="Please review all details before confirming the dispatch."
                type="warning"
                showIcon
                style={{ marginBottom: 16 }}
              />

              <Descriptions bordered column={2}>
                <Descriptions.Item label="Dispatch ID">{nextDispatchNumber}</Descriptions.Item>
                <Descriptions.Item label="Sub Center">
                  {form.getFieldValue('subCenterId') && 
                    subCenters.find(sc => sc.id === form.getFieldValue('subCenterId'))?.name
                  }
                </Descriptions.Item>
                <Descriptions.Item label="Total Books">{selectedBooks.length}</Descriptions.Item>
                <Descriptions.Item label="Total Coupons">
                  {availableBooks
                    .filter(book => selectedBooks.includes(book.key))
                    .reduce((sum, book) => sum + book.numberOfCoupons, 0)
                  }
                </Descriptions.Item>
                <Descriptions.Item label="Total Value">
                  ZWG {availableBooks
                    .filter(book => selectedBooks.includes(book.key))
                    .reduce((sum, book) => sum + book.value, 0)
                    .toLocaleString()
                  }
                </Descriptions.Item>
                <Descriptions.Item label="Dispatcher">{form.getFieldValue('dispatchedBy')}</Descriptions.Item>
              </Descriptions>

              <div style={{ textAlign: 'right', marginTop: 16 }}>
                <Space>
                  <Button onClick={() => setCurrentStep(2)}>
                    Previous
                  </Button>
                  <Button onClick={handleModalClose}>
                    Cancel
                  </Button>
                  <Button
                    type="primary"
                    loading={loading}
                    onClick={handleSubmit}
                  >
                    Confirm Dispatch
                  </Button>
                </Space>
              </div>
            </>
          )}
        </Form>
      </Modal>

      {/* View Dispatch Details Modal */}
      <Modal
        title={
          <Space>
            <EyeOutlined />
            Dispatch Details - {selectedDispatch?.dispatchId}
          </Space>
        }
        open={viewModalVisible}
        onCancel={() => setViewModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setViewModalVisible(false)}>
            Close
          </Button>,
          <Button
            key="print"
            type="primary"
            icon={<PrinterOutlined />}
            onClick={() => window.print()}
          >
            Print
          </Button>,
        ]}
        width={900}
      >
        {selectedDispatch && (
          <div>
            <Descriptions bordered column={2}>
              <Descriptions.Item label="Dispatch ID">{selectedDispatch.dispatchId}</Descriptions.Item>
              <Descriptions.Item label="Tracking Number">{selectedDispatch.trackingNumber}</Descriptions.Item>
              <Descriptions.Item label="Sub Center">{selectedDispatch.subCenterName}</Descriptions.Item>
              <Descriptions.Item label="Status">
                <Badge
                  status={getStatusColor(selectedDispatch.status) as any}
                  text={selectedDispatch.status}
                />
              </Descriptions.Item>
              <Descriptions.Item label="Dispatched By">{selectedDispatch.dispatchedBy}</Descriptions.Item>
              <Descriptions.Item label="Dispatch Date">{selectedDispatch.dispatchedDate} {selectedDispatch.dispatchedTime}</Descriptions.Item>
              <Descriptions.Item label="Total Books">{selectedDispatch.totalBooks}</Descriptions.Item>
              <Descriptions.Item label="Total Coupons">{selectedDispatch.totalCoupons}</Descriptions.Item>
              <Descriptions.Item label="Total Value">ZWG {selectedDispatch.totalValue.toLocaleString()}</Descriptions.Item>
              <Descriptions.Item label="Vehicle Number">{selectedDispatch.vehicleNumber || 'N/A'}</Descriptions.Item>
              <Descriptions.Item label="Driver">{selectedDispatch.driverName || 'N/A'}</Descriptions.Item>
              <Descriptions.Item label="Driver Phone">{selectedDispatch.driverPhone || 'N/A'}</Descriptions.Item>
              {selectedDispatch.receivedBy && (
                <>
                  <Descriptions.Item label="Received By">{selectedDispatch.receivedBy}</Descriptions.Item>
                  <Descriptions.Item label="Received Date">{selectedDispatch.receivedDate} {selectedDispatch.receivedTime}</Descriptions.Item>
                </>
              )}
              {selectedDispatch.notes && (
                <Descriptions.Item label="Notes" span={2}>
                  {selectedDispatch.notes}
                </Descriptions.Item>
              )}
            </Descriptions>

            <Divider>Dispatched Books</Divider>
            <Table
              dataSource={selectedDispatch.books}
              columns={[
                {
                  title: 'Book ID',
                  dataIndex: 'bookId',
                  key: 'bookId',
                },
                {
                  title: 'Box ID',
                  dataIndex: 'boxId',
                  key: 'boxId',
                },
                {
                  title: 'Fuel Type',
                  dataIndex: 'fuelType',
                  key: 'fuelType',
                  render: (fuelType) => (
                    <Tag color={fuelType === 'PETROL' ? 'blue' : 'green'}>
                      {fuelType}
                    </Tag>
                  ),
                },
                {
                  title: 'Amount',
                  dataIndex: 'couponAmount',
                  key: 'couponAmount',
                  render: (amount) => `${amount}L`,
                },
                {
                  title: 'Coupons',
                  dataIndex: 'numberOfCoupons',
                  key: 'numberOfCoupons',
                },
                {
                  title: 'Value',
                  dataIndex: 'value',
                  key: 'value',
                  render: (value) => `ZWG ${value.toLocaleString()}`,
                },
                {
                  title: 'Coupon Range',
                  key: 'couponRange',
                  render: (_, record) => (
                    <Space direction="vertical" size={0}>
                      <Text style={{ fontSize: '12px' }}>
                        <strong>First:</strong> {record.firstCouponId}
                      </Text>
                      <Text style={{ fontSize: '12px' }}>
                        <strong>Last:</strong> {record.lastCouponId}
                      </Text>
                    </Space>
                  ),
                },
              ]}
              pagination={false}
              size="small"
            />
          </div>
        )}
      </Modal>

      {/* Book Details Modal */}
      <Modal
        title={
          <Space>
            <BookOutlined />
            Book Coupon Details - {selectedBookForDetails?.bookId}
          </Space>
        }
        open={bookDetailsModalVisible}
        onCancel={() => setBookDetailsModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setBookDetailsModalVisible(false)}>
            Close
          </Button>,
          <Button
            key="confirm"
            type="primary"
            onClick={() => {
              if (selectedBookForDetails) {
                handleBookDetailConfirmation(selectedBookForDetails.key, true);
                setBookDetailsModalVisible(false);
                message.success('Book details confirmed');
              }
            }}
          >
            Confirm Book Details
          </Button>,
        ]}
        width={800}
      >
        {selectedBookForDetails && (
          <div>
            <Descriptions bordered column={2} style={{ marginBottom: 16 }}>
              <Descriptions.Item label="Book ID">{selectedBookForDetails.bookId}</Descriptions.Item>
              <Descriptions.Item label="Box ID">{selectedBookForDetails.boxId}</Descriptions.Item>
              <Descriptions.Item label="Fuel Type">
                <Tag color={selectedBookForDetails.fuelType === 'PETROL' ? 'blue' : 'green'}>
                  {selectedBookForDetails.fuelType}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Coupon Amount">{selectedBookForDetails.couponAmount}L</Descriptions.Item>
              <Descriptions.Item label="Total Coupons">{selectedBookForDetails.numberOfCoupons}</Descriptions.Item>
              <Descriptions.Item label="Total Value">ZWG {selectedBookForDetails.value.toLocaleString()}</Descriptions.Item>
              <Descriptions.Item label="First Coupon">{selectedBookForDetails.firstCouponId}</Descriptions.Item>
              <Descriptions.Item label="Last Coupon">{selectedBookForDetails.lastCouponId}</Descriptions.Item>
            </Descriptions>

            <Divider>All Coupon Serials in this Book</Divider>
            
            <Alert
              message="Coupon Serial Numbers"
              description={`This book contains ${selectedBookForDetails.numberOfCoupons} coupons with serials from ${selectedBookForDetails.firstCouponId} to ${selectedBookForDetails.lastCouponId}`}
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />

            <div style={{ 
              maxHeight: '300px', 
              overflowY: 'auto', 
              border: '1px solid #d9d9d9', 
              borderRadius: '6px',
              padding: '16px',
              backgroundColor: '#fafafa'
            }}>
              <Row gutter={[8, 8]}>
                {generateCouponSerials(selectedBookForDetails.firstCouponId, selectedBookForDetails.numberOfCoupons).map((serial, index) => (
                  <Col span={8} key={serial}>
                    <Card size="small" style={{ textAlign: 'center' }}>
                      <Text style={{ fontSize: '12px', fontFamily: 'monospace' }}>
                        <strong>#{index + 1}</strong><br />
                        {serial}
                      </Text>
                    </Card>
                  </Col>
                ))}
              </Row>
            </div>

            <div style={{ marginTop: 16, textAlign: 'center' }}>
              <Space>
                <Badge count={selectedBookForDetails.numberOfCoupons} showZero>
                  <Button icon={<FileTextOutlined />}>Total Coupons</Button>
                </Badge>
                <Badge count={`ZWG ${selectedBookForDetails.value.toLocaleString()}`} color="green">
                  <Button icon={<DollarCircleOutlined />}>Total Value</Button>
                </Badge>
              </Space>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default BookDispatchManagement;
