// src/pages/main-center/components/BookDispatchManagementEnhanced.tsx
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
  InputNumber,
  Space,
  Tag,
  Divider,
  Row,
  Col,
  Typography,
  Alert,
  Steps,
  Checkbox,
  message,
  Statistic,
  Badge,
  Tooltip,
  List,
  DatePicker,
  TimePicker,
  Descriptions,
  Collapse,
  Progress,
  Radio,
} from 'antd';
import {
  SendOutlined,
  PlusOutlined,
  PrinterOutlined,
  DownloadOutlined,
  CheckOutlined,
  ClockCircleOutlined,
  BookOutlined,
  EnvironmentOutlined,
  UserOutlined,
  EyeOutlined,
  CalendarOutlined,
  NumberOutlined,
  FileTextOutlined,
  SafetyOutlined,
  TeamOutlined,
  CarOutlined,
  BarcodeOutlined,
  ReloadOutlined,
  CalculatorOutlined,
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { Step } = Steps;
const { Panel } = Collapse;

// Enhanced interfaces for intelligent dispatch
interface BookDispatchEnhanced {
  id: string;
  dispatchId: string;
  toSubcenter: string;
  subcenterName: string;
  dispatchedBy: string;
  dispatchedDate: string;
  dispatchedTime: string;
  
  // Intelligent Generation Configuration
  generationMode: 'book-selection' | 'serial-range' | 'quantity-based' | 'mixed-allocation';
  
  // Books and Coupons
  selectedBooks: DispatchBook[];
  generatedCoupons: GeneratedCoupon[];
  
  // Totals
  totalBooks: number;
  totalCoupons: number;
  totalValue: number;
  
  // Status and Processing
  status: 'PENDING' | 'CONFIGURED' | 'VERIFIED' | 'DISPATCHED' | 'RECEIVED' | 'CONFIRMED';
  
  // Receipt and Confirmation
  receivedBy?: string;
  receivedDate?: string;
  receivedTime?: string;
  receiverSignature?: string;
  
  // Transport Details
  transportMethod: 'DIRECT_DELIVERY' | 'PICKUP' | 'COURIER' | 'GOVERNMENT_VEHICLE';
  vehicleNumber?: string;
  driverName?: string;
  driverPhone?: string;
  courierService?: string;
  trackingNumber?: string;
  
  // Documentation
  deliveryNote?: string;
  dispatchNotes?: string;
  specialInstructions?: string;
  
  // Verification
  verificationChecks: string[];
  verificationNotes?: string;
  verifiedBy?: string;
  verifiedAt?: string;
}

interface DispatchBook {
  id: string;
  bookId: string;
  bookCode: string;
  boxId: string;
  fuelType: 'PETROL' | 'DIESEL';
  denomination: 5 | 10 | 20 | 50;
  firstCouponNumber: string;
  lastCouponNumber: string;
  numberOfCoupons: number;
  isSelected: boolean;
  generatedCoupons?: GeneratedCoupon[];
}

interface GeneratedCoupon {
  id: string;
  couponNumber: string;
  bookId: string;
  fuelType: 'PETROL' | 'DIESEL';
  denomination: number;
  value: number;
  pricePerLitre: number;
  generatedAt: string;
  status: 'GENERATED' | 'VERIFIED' | 'DISPATCHED';
}

interface SubCenter {
  id: string;
  name: string;
  code: string;
  location: string;
  manager: string;
  phone: string;
  capacity: number;
  currentAllocation: number;
}

interface IntelligentGeneratorConfig {
  mode: 'book-selection' | 'serial-range' | 'quantity-based' | 'mixed-allocation';
  
  // Book Selection Mode
  selectedBookIds?: string[];
  
  // Serial Range Mode
  startSerial?: string;
  endSerial?: string;
  
  // Quantity Based Mode
  targetCouponCount?: number;
  targetBookCount?: number;
  preferredDenomination?: number;
  fuelTypePreference?: 'PETROL' | 'DIESEL' | 'MIXED';
  
  // Mixed Allocation Mode
  allocationRules?: AllocationRule[];
}

interface AllocationRule {
  subcenter: string;
  fuelType: 'PETROL' | 'DIESEL';
  denomination: number;
  quantity: number;
  priority: number;
}

interface VerificationProcess {
  id: string;
  name: string;
  description: string;
  required: boolean;
  completed: boolean;
}

const BookDispatchManagementEnhanced: FC = () => {
  // State Management
  const [dispatches, setDispatches] = useState<BookDispatchEnhanced[]>([]);
  const [availableBooks, setAvailableBooks] = useState<DispatchBook[]>([]);
  const [subcenters, setSubcenters] = useState<SubCenter[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Modal States
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isPreviewModalVisible, setIsPreviewModalVisible] = useState(false);
  const [isConfirmationModalVisible, setIsConfirmationModalVisible] = useState(false);
  
  // Current Dispatch State
  const [currentDispatch, setCurrentDispatch] = useState<BookDispatchEnhanced | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  
  // Form and Generation State
  const [form] = Form.useForm();
  const [generatorConfig, setGeneratorConfig] = useState<IntelligentGeneratorConfig>({
    mode: 'book-selection'
  });
  const [generatedCoupons, setGeneratedCoupons] = useState<GeneratedCoupon[]>([]);
  const [verificationProcesses, setVerificationProcesses] = useState<VerificationProcess[]>([]);
  
  // Load initial data
  useEffect(() => {
    loadDispatches();
    loadAvailableBooks();
    loadSubcenters();
    loadVerificationProcesses();
  }, []);

  const loadDispatches = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/v1/dispatches/');
      setDispatches(response.data.results || response.data);
    } catch (error) {
      message.error('Failed to load dispatches');
      console.error('Error loading dispatches:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableBooks = async () => {
    try {
      const response = await apiClient.get('/api/v1/books/available-for-dispatch/');
      setAvailableBooks(response.data.results || response.data);
    } catch (error) {
      message.error('Failed to load available books');
      console.error('Error loading books:', error);
    }
  };

  const loadSubcenters = async () => {
    try {
      const response = await apiClient.get('/api/v1/subcenters/');
      setSubcenters(response.data.results || response.data);
    } catch (error) {
      message.error('Failed to load subcenters');
      console.error('Error loading subcenters:', error);
    }
  };

  const loadVerificationProcesses = () => {
    const defaultProcesses: VerificationProcess[] = [
      {
        id: 'coupon_count_verification',
        name: 'Coupon Count Verification',
        description: 'Verify total coupon count matches expected numbers',
        required: true,
        completed: false
      },
      {
        id: 'serial_number_validation',
        name: 'Serial Number Validation',
        description: 'Validate all coupon serial numbers are sequential and valid',
        required: true,
        completed: false
      },
      {
        id: 'book_integrity_check',
        name: 'Book Integrity Check',
        description: 'Check physical condition and completeness of books',
        required: true,
        completed: false
      },
      {
        id: 'destination_verification',
        name: 'Destination Verification',
        description: 'Confirm subcenter details and capacity',
        required: true,
        completed: false
      },
      {
        id: 'transport_documentation',
        name: 'Transport Documentation',
        description: 'Prepare delivery notes and tracking information',
        required: false,
        completed: false
      },
      {
        id: 'security_clearance',
        name: 'Security Clearance',
        description: 'Security approval for high-value dispatches',
        required: false,
        completed: false
      }
    ];
    setVerificationProcesses(defaultProcesses);
  };

  // Intelligent Generator Functions
  const generateCouponsIntelligently = async (config: IntelligentGeneratorConfig) => {
    try {
      setLoading(true);
      
      let endpoint = '/api/v1/dispatches/generate-coupons/';
      let payload: any = {
        mode: config.mode
      };

      // Mode-specific logic
      switch (config.mode) {
        case 'book-selection':
          if (!config.selectedBookIds?.length) {
            message.error('Please select at least one book');
            return;
          }
          payload.selectedBookIds = config.selectedBookIds;
          break;

        case 'serial-range':
          if (!config.startSerial || !config.endSerial) {
            message.error('Please provide both start and end serial numbers');
            return;
          }
          payload.startSerial = config.startSerial;
          payload.endSerial = config.endSerial;
          break;

        case 'quantity-based':
          if (!config.targetCouponCount && !config.targetBookCount) {
            message.error('Please specify either target coupon count or book count');
            return;
          }
          payload.targetCouponCount = config.targetCouponCount;
          payload.targetBookCount = config.targetBookCount;
          payload.preferredDenomination = config.preferredDenomination;
          payload.fuelTypePreference = config.fuelTypePreference;
          break;

        case 'mixed-allocation':
          if (!config.allocationRules?.length) {
            message.error('Please define allocation rules');
            return;
          }
          payload.allocationRules = config.allocationRules;
          break;
      }

      const response = await apiClient.post(endpoint, payload);
      const generatedData = response.data;

      setGeneratedCoupons(generatedData.coupons || []);
      
      // Update current dispatch with generated data
      if (currentDispatch) {
        setCurrentDispatch({
          ...currentDispatch,
          generatedCoupons: generatedData.coupons || [],
          selectedBooks: generatedData.books || [],
          totalBooks: generatedData.total_books || 0,
          totalCoupons: generatedData.total_coupons || 0,
          totalValue: generatedData.total_value || 0,
          status: 'CONFIGURED'
        });
      }

      message.success(`Successfully generated ${generatedData.total_coupons} coupons in ${generatedData.total_books} books`);
      setCurrentStep(1); // Move to verification step
      
    } catch (error) {
      message.error('Failed to generate coupons');
      console.error('Error generating coupons:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateCouponGeneration = (books: DispatchBook[]): { valid: boolean; message: string; stats: any } => {
    if (!books.length) {
      return { valid: false, message: 'No books selected', stats: {} };
    }

    const totalCoupons = books.reduce((sum, book) => sum + book.numberOfCoupons, 0);
    const totalBooks = books.length;
    const fuelTypes = [...new Set(books.map(book => book.fuelType))];
    const denominations = [...new Set(books.map(book => book.denomination))];

    const stats = {
      totalBooks,
      totalCoupons,
      fuelTypes,
      denominations,
      estimatedValue: books.reduce((sum, book) => sum + (book.numberOfCoupons * book.denomination), 0)
    };

    return {
      valid: true,
      message: `Ready to dispatch ${totalBooks} books with ${totalCoupons} coupons`,
      stats
    };
  };

  // Verification Functions
  const performVerificationCheck = (processId: string) => {
    setVerificationProcesses(prev =>
      prev.map(process =>
        process.id === processId
          ? { ...process, completed: !process.completed }
          : process
      )
    );
  };

  const performSelectAllVerification = () => {
    const allCompleted = verificationProcesses.every(process => process.completed);
    setVerificationProcesses(prev =>
      prev.map(process => ({ ...process, completed: !allCompleted }))
    );
  };

  // Dispatch Functions
  const startNewDispatch = () => {
    const newDispatch: BookDispatchEnhanced = {
      id: `dispatch-${Date.now()}`,
      dispatchId: `DISP-${dayjs().format('YYYYMMDD')}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      toSubcenter: '',
      subcenterName: '',
      dispatchedBy: 'Current User', // Get from auth context
      dispatchedDate: dayjs().format('YYYY-MM-DD'),
      dispatchedTime: dayjs().format('HH:mm:ss'),
      generationMode: 'book-selection',
      selectedBooks: [],
      generatedCoupons: [],
      totalBooks: 0,
      totalCoupons: 0,
      totalValue: 0,
      status: 'PENDING',
      transportMethod: 'DIRECT_DELIVERY',
      verificationChecks: []
    };

    setCurrentDispatch(newDispatch);
    setCurrentStep(0);
    setIsModalVisible(true);
    form.resetFields();
  };

  const proceedToNextStep = () => {
    setCurrentStep(prev => Math.min(prev + 1, 3));
  };

  const goBackToPreviousStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const finalizeDispatch = async () => {
    if (!currentDispatch) return;

    try {
      setLoading(true);

      // Validate all required verification checks are completed
      const requiredChecks = verificationProcesses.filter(process => process.required);
      const completedRequiredChecks = requiredChecks.filter(process => process.completed);

      if (completedRequiredChecks.length < requiredChecks.length) {
        message.error('Please complete all required verification checks before dispatching');
        return;
      }

      const dispatchData = {
        ...currentDispatch,
        status: 'DISPATCHED',
        verificationChecks: verificationProcesses
          .filter(process => process.completed)
          .map(process => process.id),
        verifiedBy: 'Current User', // Get from auth context
        verifiedAt: dayjs().toISOString()
      };

      const response = await apiClient.post('/api/v1/dispatches/', dispatchData);
      
      setDispatches(prev => [response.data, ...prev]);
      setIsModalVisible(false);
      setCurrentDispatch(null);
      setCurrentStep(0);
      message.success('Dispatch created successfully!');
      
      // Refresh available books
      loadAvailableBooks();
      
    } catch (error) {
      message.error('Failed to create dispatch');
      console.error('Error creating dispatch:', error);
    } finally {
      setLoading(false);
    }
  };

  // Print and Download Functions
  const handlePrintDispatch = () => {
    if (!currentDispatch) return;
    
    // Generate print-friendly view
    const printContent = generatePrintContent(currentDispatch);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleDownloadDispatch = () => {
    if (!currentDispatch) return;
    
    // Generate CSV/PDF download
    const csvContent = generateCSVContent(currentDispatch);
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dispatch-${currentDispatch.dispatchId}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const generatePrintContent = (dispatch: BookDispatchEnhanced): string => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Book Dispatch Report - ${dispatch.dispatchId}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .section { margin-bottom: 20px; }
            .book-list { border-collapse: collapse; width: 100%; }
            .book-list th, .book-list td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .book-list th { background-color: #f2f2f2; }
            .signature-section { margin-top: 50px; }
            .signature-box { display: inline-block; width: 200px; height: 80px; border: 1px solid #000; margin: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Parliament Fuel Coupon System</h1>
            <h2>Book Dispatch Report</h2>
            <p>Dispatch ID: ${dispatch.dispatchId}</p>
          </div>
          
          <div class="section">
            <h3>Dispatch Details</h3>
            <p><strong>To Subcenter:</strong> ${dispatch.subcenterName}</p>
            <p><strong>Dispatched By:</strong> ${dispatch.dispatchedBy}</p>
            <p><strong>Date:</strong> ${dispatch.dispatchedDate}</p>
            <p><strong>Time:</strong> ${dispatch.dispatchedTime}</p>
            <p><strong>Total Books:</strong> ${dispatch.totalBooks}</p>
            <p><strong>Total Coupons:</strong> ${dispatch.totalCoupons}</p>
            <p><strong>Total Value:</strong> $${dispatch.totalValue.toFixed(2)}</p>
          </div>

          <div class="section">
            <h3>Books Dispatched</h3>
            <table class="book-list">
              <thead>
                <tr>
                  <th>Book Code</th>
                  <th>Fuel Type</th>
                  <th>Denomination</th>
                  <th>First Coupon</th>
                  <th>Last Coupon</th>
                  <th>Coupon Count</th>
                </tr>
              </thead>
              <tbody>
                ${dispatch.selectedBooks.map(book => `
                  <tr>
                    <td>${book.bookCode}</td>
                    <td>${book.fuelType}</td>
                    <td>${book.denomination}L</td>
                    <td>${book.firstCouponNumber}</td>
                    <td>${book.lastCouponNumber}</td>
                    <td>${book.numberOfCoupons}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div class="signature-section">
            <div>
              <p><strong>Dispatched by:</strong></p>
              <div class="signature-box"></div>
              <p>Name: _________________ Date: _________</p>
            </div>
            <div>
              <p><strong>Received by:</strong></p>
              <div class="signature-box"></div>
              <p>Name: _________________ Date: _________</p>
            </div>
          </div>
        </body>
      </html>
    `;
  };

  const generateCSVContent = (dispatch: BookDispatchEnhanced): string => {
    const headers = ['Book Code', 'Fuel Type', 'Denomination', 'First Coupon', 'Last Coupon', 'Coupon Count', 'Value'];
    const rows = dispatch.selectedBooks.map(book => [
      book.bookCode,
      book.fuelType,
      book.denomination,
      book.firstCouponNumber,
      book.lastCouponNumber,
      book.numberOfCoupons,
      (book.numberOfCoupons * book.denomination).toFixed(2)
    ]);

    const csvContent = [
      `Book Dispatch Report - ${dispatch.dispatchId}`,
      `To Subcenter: ${dispatch.subcenterName}`,
      `Dispatched By: ${dispatch.dispatchedBy}`,
      `Date: ${dispatch.dispatchedDate} ${dispatch.dispatchedTime}`,
      `Total Books: ${dispatch.totalBooks}`,
      `Total Coupons: ${dispatch.totalCoupons}`,
      `Total Value: $${dispatch.totalValue.toFixed(2)}`,
      '',
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    return csvContent;
  };

  // Render Functions
  const renderIntelligentGenerator = () => (
    <Card title="🧠 Intelligent Coupon Generator" className="mb-4">
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Form.Item label="Generation Mode">
            <Radio.Group
              value={generatorConfig.mode}
              onChange={(e) => setGeneratorConfig(prev => ({ ...prev, mode: e.target.value }))}
            >
              <Radio.Button value="book-selection">📚 Book Selection</Radio.Button>
              <Radio.Button value="serial-range">🔢 Serial Range</Radio.Button>
              <Radio.Button value="quantity-based">📊 Quantity Based</Radio.Button>
              <Radio.Button value="mixed-allocation">🎯 Mixed Allocation</Radio.Button>
            </Radio.Group>
          </Form.Item>
        </Col>

        {generatorConfig.mode === 'book-selection' && (
          <Col span={24}>
            <div className="border p-4 rounded">
              <Title level={5}>📚 Select Books to Dispatch</Title>
              <Table
                dataSource={availableBooks}
                pagination={false}
                size="small"
                rowSelection={{
                  type: 'checkbox',
                  selectedRowKeys: generatorConfig.selectedBookIds || [],
                  onChange: (selectedRowKeys) => {
                    setGeneratorConfig(prev => ({
                      ...prev,
                      selectedBookIds: selectedRowKeys as string[]
                    }));
                  }
                }}
                columns={[
                  { title: 'Book Code', dataIndex: 'bookCode', key: 'bookCode' },
                  { title: 'Fuel Type', dataIndex: 'fuelType', key: 'fuelType' },
                  { title: 'Denomination', dataIndex: 'denomination', key: 'denomination', render: (val) => `${val}L` },
                  { title: 'Coupons', dataIndex: 'numberOfCoupons', key: 'numberOfCoupons' },
                  { title: 'First Coupon', dataIndex: 'firstCouponNumber', key: 'firstCouponNumber' },
                  { title: 'Last Coupon', dataIndex: 'lastCouponNumber', key: 'lastCouponNumber' }
                ]}
              />
            </div>
          </Col>
        )}

        {generatorConfig.mode === 'serial-range' && (
          <Col span={24}>
            <div className="border p-4 rounded">
              <Title level={5}>🔢 Define Serial Number Range</Title>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="Start Serial Number">
                    <Input
                      placeholder="e.g., ZW001000001"
                      value={generatorConfig.startSerial}
                      onChange={(e) => setGeneratorConfig(prev => ({ ...prev, startSerial: e.target.value }))}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="End Serial Number">
                    <Input
                      placeholder="e.g., ZW001002000"
                      value={generatorConfig.endSerial}
                      onChange={(e) => setGeneratorConfig(prev => ({ ...prev, endSerial: e.target.value }))}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </div>
          </Col>
        )}

        {generatorConfig.mode === 'quantity-based' && (
          <Col span={24}>
            <div className="border p-4 rounded">
              <Title level={5}>📊 Quantity-Based Generation</Title>
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item label="Target Coupon Count">
                    <InputNumber
                      min={1}
                      max={10000}
                      value={generatorConfig.targetCouponCount}
                      onChange={(value) => setGeneratorConfig(prev => ({ ...prev, targetCouponCount: value || undefined }))}
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="Target Book Count">
                    <InputNumber
                      min={1}
                      max={100}
                      value={generatorConfig.targetBookCount}
                      onChange={(value) => setGeneratorConfig(prev => ({ ...prev, targetBookCount: value || undefined }))}
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="Preferred Denomination">
                    <Select
                      value={generatorConfig.preferredDenomination}
                      onChange={(value) => setGeneratorConfig(prev => ({ ...prev, preferredDenomination: value }))}
                      allowClear
                    >
                      <Option value={5}>5 Litres</Option>
                      <Option value={10}>10 Litres</Option>
                      <Option value={20}>20 Litres</Option>
                      <Option value={50}>50 Litres</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="Fuel Type Preference">
                    <Select
                      value={generatorConfig.fuelTypePreference}
                      onChange={(value) => setGeneratorConfig(prev => ({ ...prev, fuelTypePreference: value }))}
                      allowClear
                    >
                      <Option value="PETROL">Petrol Only</Option>
                      <Option value="DIESEL">Diesel Only</Option>
                      <Option value="MIXED">Mixed (Both)</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
            </div>
          </Col>
        )}

        <Col span={24}>
          <Space>
            <Button
              type="primary"
              icon={<CalculatorOutlined />}
              onClick={() => generateCouponsIntelligently(generatorConfig)}
              loading={loading}
            >
              Generate Coupons
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={loadAvailableBooks}
            >
              Refresh Books
            </Button>
          </Space>
        </Col>
      </Row>
    </Card>
  );

  const renderGenerationPreview = () => {
    if (!currentDispatch || !currentDispatch.generatedCoupons.length) return null;

    const validation = validateCouponGeneration(currentDispatch.selectedBooks);

    return (
      <Card title="📋 Generation Preview" className="mb-4">
        <Row gutter={[16, 16]}>
          <Col span={24}>
            {validation.valid ? (
              <Alert
                message="Generation Successful"
                description={validation.message}
                type="success"
                showIcon
                className="mb-4"
              />
            ) : (
              <Alert
                message="Generation Error"
                description={validation.message}
                type="error"
                showIcon
                className="mb-4"
              />
            )}
          </Col>

          <Col span={6}>
            <Statistic title="Total Books" value={currentDispatch.totalBooks} prefix={<BookOutlined />} />
          </Col>
          <Col span={6}>
            <Statistic title="Total Coupons" value={currentDispatch.totalCoupons} prefix={<NumberOutlined />} />
          </Col>
          <Col span={6}>
            <Statistic title="Total Value" value={currentDispatch.totalValue} prefix="$" precision={2} />
          </Col>
          <Col span={6}>
            <Statistic 
              title="Avg Coupons/Book" 
              value={currentDispatch.totalBooks > 0 ? (currentDispatch.totalCoupons / currentDispatch.totalBooks).toFixed(1) : 0} 
            />
          </Col>

          <Col span={24}>
            <Collapse>
              <Panel header="📚 Book Details" key="books">
                <Table
                  dataSource={currentDispatch.selectedBooks}
                  pagination={false}
                  size="small"
                  columns={[
                    { title: 'Book Code', dataIndex: 'bookCode', key: 'bookCode' },
                    { title: 'Fuel Type', dataIndex: 'fuelType', key: 'fuelType' },
                    { title: 'Denomination', dataIndex: 'denomination', key: 'denomination', render: (val) => `${val}L` },
                    { title: 'Coupons', dataIndex: 'numberOfCoupons', key: 'numberOfCoupons' },
                    { title: 'First Coupon', dataIndex: 'firstCouponNumber', key: 'firstCouponNumber' },
                    { title: 'Last Coupon', dataIndex: 'lastCouponNumber', key: 'lastCouponNumber' },
                    { 
                      title: 'Value', 
                      key: 'value', 
                      render: (_, book) => `$${(book.numberOfCoupons * book.denomination).toFixed(2)}` 
                    }
                  ]}
                />
              </Panel>
            </Collapse>
          </Col>
        </Row>
      </Card>
    );
  };

  const renderVerificationStep = () => (
    <Card title="✅ Dispatch Verification" className="mb-4">
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <div className="flex justify-between items-center mb-4">
            <Title level={5}>Verification Checklist</Title>
            <Button
              type="primary"
              size="small"
              onClick={performSelectAllVerification}
            >
              {verificationProcesses.every(p => p.completed) ? 'Uncheck All' : 'Select All'}
            </Button>
          </div>

          <List
            dataSource={verificationProcesses}
            renderItem={(process) => (
              <List.Item
                actions={[
                  <Checkbox
                    checked={process.completed}
                    onChange={() => performVerificationCheck(process.id)}
                  >
                    {process.completed ? 'Completed' : 'Pending'}
                  </Checkbox>
                ]}
              >
                <List.Item.Meta
                  avatar={
                    <Badge
                      status={process.completed ? 'success' : process.required ? 'error' : 'default'}
                      text={process.required ? 'Required' : 'Optional'}
                    />
                  }
                  title={process.name}
                  description={process.description}
                />
              </List.Item>
            )}
          />
        </Col>

        <Col span={24}>
          <Form.Item label="Verification Notes">
            <TextArea
              rows={3}
              placeholder="Add any verification notes or observations..."
              value={currentDispatch?.verificationNotes}
              onChange={(e) => setCurrentDispatch(prev => prev ? { ...prev, verificationNotes: e.target.value } : null)}
            />
          </Form.Item>
        </Col>

        <Col span={24}>
          <Progress
            percent={Math.round((verificationProcesses.filter(p => p.completed).length / verificationProcesses.length) * 100)}
            status={verificationProcesses.filter(p => p.required).every(p => p.completed) ? 'success' : 'active'}
            format={(percent) => `${verificationProcesses.filter(p => p.completed).length}/${verificationProcesses.length} Checks`}
          />
        </Col>
      </Row>
    </Card>
  );

  const renderConfirmationStep = () => (
    <Card title="🚀 Dispatch Confirmation" className="mb-4">
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Alert
            message="Ready to Dispatch"
            description="All verification checks completed. Review the details below and confirm dispatch."
            type="success"
            showIcon
            className="mb-4"
          />
        </Col>

        <Col span={12}>
          <Descriptions title="Dispatch Summary" bordered size="small">
            <Descriptions.Item label="Dispatch ID">{currentDispatch?.dispatchId}</Descriptions.Item>
            <Descriptions.Item label="To Subcenter">{currentDispatch?.subcenterName}</Descriptions.Item>
            <Descriptions.Item label="Date">{currentDispatch?.dispatchedDate}</Descriptions.Item>
            <Descriptions.Item label="Time">{currentDispatch?.dispatchedTime}</Descriptions.Item>
            <Descriptions.Item label="Total Books">{currentDispatch?.totalBooks}</Descriptions.Item>
            <Descriptions.Item label="Total Coupons">{currentDispatch?.totalCoupons}</Descriptions.Item>
            <Descriptions.Item label="Total Value">${currentDispatch?.totalValue.toFixed(2)}</Descriptions.Item>
            <Descriptions.Item label="Transport Method">{currentDispatch?.transportMethod}</Descriptions.Item>
          </Descriptions>
        </Col>

        <Col span={12}>
          <Card title="📋 Actions Available" size="small">
            <Space direction="vertical" className="w-full">
              <Button
                type="default"
                icon={<PrinterOutlined />}
                onClick={handlePrintDispatch}
                className="w-full"
              >
                Print Dispatch Report
              </Button>
              <Button
                type="default"
                icon={<DownloadOutlined />}
                onClick={handleDownloadDispatch}
                className="w-full"
              >
                Download CSV Report
              </Button>
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={finalizeDispatch}
                loading={loading}
                className="w-full"
                size="large"
              >
                Confirm & Dispatch
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>
    </Card>
  );

  // Step configurations
  const steps = [
    {
      title: 'Configuration',
      description: 'Setup dispatch and generate coupons',
      icon: <CalculatorOutlined />,
      content: (
        <>
          {renderIntelligentGenerator()}
          {renderGenerationPreview()}
        </>
      )
    },
    {
      title: 'Verification',
      description: 'Verify generated coupons and books',
      icon: <CheckOutlined />,
      content: renderVerificationStep()
    },
    {
      title: 'Confirmation',
      description: 'Final review and dispatch',
      icon: <SendOutlined />,
      content: renderConfirmationStep()
    }
  ];

  // Table columns for dispatches list
  const dispatchColumns: ColumnsType<BookDispatchEnhanced> = [
    {
      title: 'Dispatch ID',
      dataIndex: 'dispatchId',
      key: 'dispatchId',
      render: (text) => <Text strong>{text}</Text>
    },
    {
      title: 'Subcenter',
      dataIndex: 'subcenterName',
      key: 'subcenterName'
    },
    {
      title: 'Date',
      dataIndex: 'dispatchedDate',
      key: 'dispatchedDate',
      render: (date, record) => `${date} ${record.dispatchedTime}`
    },
    {
      title: 'Books/Coupons',
      key: 'totals',
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <Text>{record.totalBooks} books</Text>
          <Text type="secondary">{record.totalCoupons} coupons</Text>
        </Space>
      )
    },
    {
      title: 'Value',
      dataIndex: 'totalValue',
      key: 'totalValue',
      render: (value) => `$${value.toFixed(2)}`
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const statusConfig = {
          PENDING: { color: 'orange', text: 'Pending' },
          CONFIGURED: { color: 'blue', text: 'Configured' },
          VERIFIED: { color: 'cyan', text: 'Verified' },
          DISPATCHED: { color: 'green', text: 'Dispatched' },
          RECEIVED: { color: 'purple', text: 'Received' },
          CONFIRMED: { color: 'success', text: 'Confirmed' }
        };
        const config = statusConfig[status as keyof typeof statusConfig];
        return <Tag color={config.color}>{config.text}</Tag>;
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Tooltip title="View Details">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => {
                setCurrentDispatch(record);
                setIsPreviewModalVisible(true);
              }}
            />
          </Tooltip>
          <Tooltip title="Print">
            <Button
              type="text"
              icon={<PrinterOutlined />}
              onClick={() => {
                setCurrentDispatch(record);
                handlePrintDispatch();
              }}
            />
          </Tooltip>
        </Space>
      )
    }
  ];

  return (
    <div className="book-dispatch-management-enhanced">
      <div className="flex justify-between items-center mb-6">
        <div>
          <Title level={2}>📦 Enhanced Book Dispatch Management</Title>
          <Text type="secondary">Intelligent coupon generation and book dispatch to subcenters</Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="large"
          onClick={startNewDispatch}
        >
          New Dispatch
        </Button>
      </div>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Dispatches"
              value={dispatches.length}
              prefix={<SendOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Available Books"
              value={availableBooks.length}
              prefix={<BookOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Active Subcenters"
              value={subcenters.length}
              prefix={<EnvironmentOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Pending Dispatches"
              value={dispatches.filter(d => d.status === 'PENDING' || d.status === 'CONFIGURED').length}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Dispatches Table */}
      <Card title="Recent Dispatches">
        <Table
          dataSource={dispatches}
          columns={dispatchColumns}
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} dispatches`
          }}
        />
      </Card>

      {/* New Dispatch Modal */}
      <Modal
        title={
          <div className="flex items-center">
            <SendOutlined className="mr-2" />
            Create New Book Dispatch - {currentDispatch?.dispatchId}
          </div>
        }
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          setCurrentDispatch(null);
          setCurrentStep(0);
        }}
        footer={null}
        width={1200}
        destroyOnHidden
      >
        <div className="new-dispatch-modal">
          {/* Progress Steps */}
          <Steps
            current={currentStep}
            className="mb-6"
            items={steps.map(step => ({
              title: step.title,
              description: step.description,
              icon: step.icon
            }))}
          />

          {/* Basic Information */}
          <Card className="mb-4" size="small">
            <Form form={form} layout="inline">
              <Form.Item label="To Subcenter" required>
                <Select
                  style={{ width: 200 }}
                  placeholder="Select subcenter"
                  value={currentDispatch?.toSubcenter}
                  onChange={(value) => {
                    const subcenter = subcenters.find(s => s.id === value);
                    if (subcenter && currentDispatch) {
                      setCurrentDispatch({
                        ...currentDispatch,
                        toSubcenter: value,
                        subcenterName: subcenter.name
                      });
                    }
                  }}
                >
                  {subcenters.map(subcenter => (
                    <Option key={subcenter.id} value={subcenter.id}>
                      {subcenter.name} ({subcenter.code})
                    </Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item label="Transport Method">
                <Select
                  style={{ width: 180 }}
                  value={currentDispatch?.transportMethod}
                  onChange={(value) => setCurrentDispatch(prev => prev ? { ...prev, transportMethod: value } : null)}
                >
                  <Option value="DIRECT_DELIVERY">Direct Delivery</Option>
                  <Option value="PICKUP">Pickup</Option>
                  <Option value="COURIER">Courier Service</Option>
                  <Option value="GOVERNMENT_VEHICLE">Government Vehicle</Option>
                </Select>
              </Form.Item>
            </Form>
          </Card>

          {/* Step Content */}
          <div className="step-content">
            {steps[currentStep]?.content}
          </div>

          {/* Navigation */}
          <div className="flex justify-between mt-6">
            <Button
              onClick={goBackToPreviousStep}
              disabled={currentStep === 0}
            >
              Previous
            </Button>
            
            <Space>
              {currentStep < steps.length - 1 && (
                <Button
                  type="primary"
                  onClick={proceedToNextStep}
                  disabled={
                    (currentStep === 0 && (!currentDispatch?.generatedCoupons.length || !currentDispatch.toSubcenter)) ||
                    (currentStep === 1 && !verificationProcesses.filter(p => p.required).every(p => p.completed))
                  }
                >
                  Next
                </Button>
              )}
            </Space>
          </div>
        </div>
      </Modal>

      {/* Preview Modal */}
      <Modal
        title="Dispatch Details"
        open={isPreviewModalVisible}
        onCancel={() => setIsPreviewModalVisible(false)}
        footer={[
          <Button key="print" icon={<PrinterOutlined />} onClick={handlePrintDispatch}>
            Print
          </Button>,
          <Button key="download" icon={<DownloadOutlined />} onClick={handleDownloadDispatch}>
            Download
          </Button>,
          <Button key="close" onClick={() => setIsPreviewModalVisible(false)}>
            Close
          </Button>
        ]}
        width={800}
      >
        {currentDispatch && (
          <div>
            <Descriptions bordered>
              <Descriptions.Item label="Dispatch ID">{currentDispatch.dispatchId}</Descriptions.Item>
              <Descriptions.Item label="Subcenter">{currentDispatch.subcenterName}</Descriptions.Item>
              <Descriptions.Item label="Date">{currentDispatch.dispatchedDate} {currentDispatch.dispatchedTime}</Descriptions.Item>
              <Descriptions.Item label="Books">{currentDispatch.totalBooks}</Descriptions.Item>
              <Descriptions.Item label="Coupons">{currentDispatch.totalCoupons}</Descriptions.Item>
              <Descriptions.Item label="Value">${currentDispatch.totalValue.toFixed(2)}</Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default BookDispatchManagementEnhanced;
