// src/pages/main-center/components/BoxReceiptManagement.tsx
import { useState, useEffect } from 'react';
import type { FC } from 'react';
import apiClient from '@/api/index';
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
  QRCode,
  Upload,
  message,
  Popconfirm,
  Steps,
  Checkbox,
  Tooltip,
  Badge,
  Statistic,
  TimePicker,
} from 'antd';
import {
  PlusOutlined,
  ScanOutlined,
  CheckOutlined,
  EyeOutlined,
  PrinterOutlined,
  UploadOutlined,
  InboxOutlined,
  BarcodeOutlined,
  FileTextOutlined,
  UserOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  EditOutlined,
  DeleteOutlined,
  SendOutlined,
  AlertOutlined,
  CarOutlined,
  FolderOutlined,
  FolderOpenOutlined,
  HistoryOutlined,
} from '@ant-design/icons';
import { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { Step } = Steps;

interface BoxReceipt {
  id: string;
  boxId: string;
  barcode: string;
  supplier: string;
  receivedDate: string;
  receivedTime: string;
  receivedBy: string;
  receivedBySignature?: string;
  fuelType: 'PETROL' | 'DIESEL';
  couponAmount: 5 | 20 | 50; // Denomination in litres
  numberOfBooks: number;
  couponsPerBook: number;
  totalCoupons: number;
  totalLitres: number;
  firstCouponId: string;
  lastCouponId: string;
  monetaryValueUSD: number; // Value in USD
  fuelPricePerLitreUSD: number; // Price per litre in USD
  exchangeRate?: number; // USD to ZWG exchange rate for reference (2025: ~27.50)
  status: 'PENDING' | 'RECEIVED' | 'VERIFIED' | 'DISPATCHED' | 'DAMAGED' | 'ARCHIVED';
  verificationNotes?: string;
  damageReport?: string;
  booksGenerated?: BookInfo[];
  qrCodeData?: string;
  deliveryNote?: string;
  invoiceNumber?: string;
  notes?: string;
  // Backward compatibility
  monetaryValue?: number; // For backward compatibility (ZWG)
  fuelPricePerLitre?: number; // For backward compatibility (ZWG)
}

interface BookInfo {
  bookId: string;
  firstCouponId: string;
  lastCouponId: string;
  numberOfCoupons: number;
}

const BoxReceiptManagement: FC = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [verifyModalVisible, setVerifyModalVisible] = useState(false);
  const [selectedBox, setSelectedBox] = useState<BoxReceipt | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [form] = Form.useForm();
  const [verifyForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [boxReceipts, setBoxReceipts] = useState<BoxReceipt[]>([]);
  const [nextBoxNumber, setNextBoxNumber] = useState('');
  const [calculatedBooks, setCalculatedBooks] = useState<BookInfo[]>([]);
  const [activeTab, setActiveTab] = useState<'receipts' | 'verification' | 'inventory'>('receipts');
  
  // Archive-related state
  const [showArchived, setShowArchived] = useState(false);
  const [archiveModalVisible, setArchiveModalVisible] = useState(false);
  const [archiveForm] = Form.useForm();

  // Sample data - enhanced with all required fields
  const sampleBoxReceipts: BoxReceipt[] = [
    {
      id: '1',
      boxId: 'FCB-2025-0021',
      barcode: '1234567890123',
      supplier: 'Petrotrade Zimbabwe',
      receivedDate: '2025-07-06',
      receivedTime: '14:30',
      receivedBy: 'John Mukamuri',
      receivedBySignature: 'data:image/base64...',
      fuelType: 'DIESEL',
      couponAmount: 20,
      numberOfBooks: 10,
      couponsPerBook: 10,
      totalCoupons: 100,
      totalLitres: 2000,
      firstCouponId: 'PU00GH355101',
      lastCouponId: 'PU00GH355200',
      monetaryValueUSD: 2760.00, // 2000L * $1.38/L
      fuelPricePerLitreUSD: 1.38,
      exchangeRate: 27.50,
      monetaryValue: 75900, // For backward compatibility (USD * exchange rate)
      fuelPricePerLitre: 37.95, // For backward compatibility
      status: 'VERIFIED',
      verificationNotes: 'All books intact, seals verified, barcode scanned successfully. Sequential numbering verified.',
      invoiceNumber: 'PTZ-INV-2025-0021',
      deliveryNote: 'PTZ-DN-2025-0021',
      qrCodeData: JSON.stringify({
        boxId: 'FCB-2025-0021',
        fuelType: 'DIESEL',
        amount: 20,
        totalLitres: 2000,
        supplier: 'Petrotrade Zimbabwe',
        date: '2025-07-06',
        firstCoupon: 'PU00GH355101',
        lastCoupon: 'PU00GH355200'
      }),
      notes: 'All books intact, sequential coupon numbering verified (PU00GH355101-PU00GH355200)',
    },
    {
      id: '2',
      boxId: 'FCB-2025-0022',
      barcode: '1234567890124',
      supplier: 'Petrotrade Zimbabwe',
      receivedDate: '2025-07-06',
      receivedTime: '09:15',
      receivedBy: 'Mary Chigwamba',
      fuelType: 'PETROL',
      couponAmount: 20,
      numberOfBooks: 15,
      couponsPerBook: 10,
      totalCoupons: 150,
      totalLitres: 3000,
      firstCouponId: 'PU00GH355201',
      lastCouponId: 'PU00GH355350',
      monetaryValueUSD: 4350.00, // 3000L * $1.45/L
      fuelPricePerLitreUSD: 1.45,
      exchangeRate: 27.50,
      monetaryValue: 108750000, // For backward compatibility
      fuelPricePerLitre: 36250, // For backward compatibility
      status: 'RECEIVED',
      invoiceNumber: 'PTZ-INV-2025-0022',
      deliveryNote: 'PTZ-DN-2025-0022',
      notes: 'Pending verification - sequential numbering to be verified',
    },
    {
      id: '3',
      boxId: 'FCB-2025-0023',
      barcode: '1234567890125',
      supplier: 'Petrotrade Zimbabwe',
      receivedDate: '2025-07-05',
      receivedTime: '16:45',
      receivedBy: 'James Mpofu',
      fuelType: 'DIESEL',
      couponAmount: 50,
      numberOfBooks: 8,
      couponsPerBook: 10,
      totalCoupons: 80,
      totalLitres: 4000,
      firstCouponId: 'PU00GH355351',
      lastCouponId: 'PU00GH355430',
      monetaryValueUSD: 5520.00, // 4000L * $1.38/L
      fuelPricePerLitreUSD: 1.38,
      exchangeRate: 27.50,
      monetaryValue: 138000000, // For backward compatibility
      fuelPricePerLitre: 34500, // For backward compatibility
      status: 'DISPATCHED',
      verificationNotes: 'Verified and dispatched to Harare Central',
      invoiceNumber: 'PTZ-INV-2024-0003',
      deliveryNote: 'PTZ-DN-2024-0003',
      notes: 'Fully processed and dispatched',
    },
  ];

  // Fetch data on component mount
  useEffect(() => {
    // Initialize with sample data immediately to prevent undefined errors
    setBoxReceipts(sampleBoxReceipts);
    fetchBoxReceipts();
    generateNextBoxNumber();
  }, []);

  const fetchBoxReceipts = async () => {
    setLoading(true);
    try {
      // Replace with actual API call
      const response = await fetch('/api/v1/boxes/');
      if (response.ok) {
        const data = await response.json();
        // Normalize data to ensure all required fields are present
        const normalizedData = Array.isArray(data) ? data.map((item: any) => ({
          id: item.id || '',
          boxId: item.boxId || '',
          barcode: item.barcode || '',
          supplier: item.supplier || '',
          receivedDate: item.receivedDate || '',
          receivedTime: item.receivedTime || '',
          receivedBy: item.receivedBy || '',
          receivedBySignature: item.receivedBySignature,
          fuelType: item.fuelType || 'PETROL',
          couponAmount: item.couponAmount || 20,
          numberOfBooks: item.numberOfBooks || 0,
          couponsPerBook: item.couponsPerBook || 10,
          totalCoupons: item.totalCoupons || (item.numberOfBooks || 0) * (item.couponsPerBook || 10),
          totalLitres: item.totalLitres || 0,
          firstCouponId: item.firstCouponId || '',
          lastCouponId: item.lastCouponId || '',
          monetaryValueUSD: item.monetaryValueUSD || item.monetaryValue_usd || 0,
          fuelPricePerLitreUSD: item.fuelPricePerLitreUSD || item.fuel_price_per_litre_usd || 0,
          exchangeRate: item.exchangeRate || item.exchange_rate || 27.50,
          // Backward compatibility
          monetaryValue: item.monetaryValue || (item.monetaryValueUSD || 0) * (item.exchangeRate || 27.50),
          fuelPricePerLitre: item.fuelPricePerLitre || (item.fuelPricePerLitreUSD || 0) * (item.exchangeRate || 27.50),
          status: item.status || 'PENDING',
          verificationNotes: item.verificationNotes,
          damageReport: item.damageReport,
          booksGenerated: item.booksGenerated,
          qrCodeData: item.qrCodeData,
          deliveryNote: item.deliveryNote,
          invoiceNumber: item.invoiceNumber,
          notes: item.notes,
        })) : sampleBoxReceipts;
        setBoxReceipts(normalizedData);
      } else {
        // Use sample data if API fails
        setBoxReceipts(sampleBoxReceipts);
      }
    } catch (error) {
      console.error('Error fetching box receipts:', error);
      setBoxReceipts(sampleBoxReceipts);
    } finally {
      setLoading(false);
    }
  };

  const generateNextBoxNumber = () => {
    const year = new Date().getFullYear();
    const lastBox = boxReceipts
      .filter(box => box.boxId.includes(year.toString()))
      .sort((a, b) => b.boxId.localeCompare(a.boxId))[0];
    
    let nextNumber = 1;
    if (lastBox) {
      const lastNumber = parseInt(lastBox.boxId.split('-')[2]) || 0;
      nextNumber = lastNumber + 1;
    }
    
    setNextBoxNumber(`FCB-${year}-${nextNumber.toString().padStart(4, '0')}`);
  };

  // Auto-calculate coupon IDs and book information
  const calculateCouponRange = (fuelType: string, couponAmount: number, totalCoupons: number) => {
    // Use the Parliament coupon numbering format from the image
    // Get the last coupon number from existing boxes
    const existingBoxes = boxReceipts.filter(box => 
      box.fuelType === fuelType && box.couponAmount === couponAmount
    );
    
    let lastCouponNumber = 355100; // Starting from the range shown in the image
    if (existingBoxes.length > 0) {
      const lastBox = existingBoxes
        .sort((a, b) => b.lastCouponId.localeCompare(a.lastCouponId))[0];
      
      const match = lastBox.lastCouponId.match(/(\d+)$/);
      if (match) {
        lastCouponNumber = parseInt(match[1]);
      }
    }

    // Use the actual format from the coupon image: PU00GH355xxx
    const prefix = 'PU00GH';
    
    const firstCouponNumber = lastCouponNumber + 1;
    const lastCouponNumberCalculated = firstCouponNumber + totalCoupons - 1;
    
    const firstCouponId = `${prefix}${firstCouponNumber.toString().padStart(6, '0')}`;
    const lastCouponId = `${prefix}${lastCouponNumberCalculated.toString().padStart(6, '0')}`;
    
    return {
      firstCouponId,
      lastCouponId,
    };
  };

  // Calculate monetary value based on fuel price and total litres
  const calculateMonetaryValue = (totalLitres: number, pricePerLitre: number) => {
    return totalLitres * pricePerLitre;
  };

  // Form handlers
  const handleAddBox = () => {
    setCurrentStep(0);
    form.resetFields();
    generateNextBoxNumber();
    setIsModalVisible(true);
  };

  const handleFormChange = (changedFields: any, allFields: any) => {
    const fuelType = allFields.find((f: any) => f.name[0] === 'fuelType')?.value;
    const couponAmount = allFields.find((f: any) => f.name[0] === 'couponAmount')?.value;
    const numberOfBooks = allFields.find((f: any) => f.name[0] === 'numberOfBooks')?.value;
    const fuelPriceUSD = allFields.find((f: any) => f.name[0] === 'fuelPricePerLitreUSD')?.value;
    const exchangeRate = allFields.find((f: any) => f.name[0] === 'exchangeRate')?.value || 27.50;
    const couponsPerBook = allFields.find((f: any) => f.name[0] === 'couponsPerBook')?.value || 10;

    if (fuelType && couponAmount && numberOfBooks) {
      const totalCoupons = numberOfBooks * couponsPerBook;
      const totalLitres = totalCoupons * couponAmount;
      form.setFieldsValue({ 
        totalLitres,
        totalCoupons,
        couponsPerBook 
      });

      if (fuelPriceUSD) {
        const monetaryValueUSD = totalLitres * fuelPriceUSD;
        const monetaryValueZWG = monetaryValueUSD * exchangeRate;
        const fuelPriceZWG = fuelPriceUSD * exchangeRate;
        
        form.setFieldsValue({ 
          monetaryValueUSD,
          monetaryValue: monetaryValueZWG,
          fuelPricePerLitre: fuelPriceZWG
        });
      }

      // Calculate coupon range
      const couponData = calculateCouponRange(fuelType, couponAmount, totalCoupons);
      form.setFieldsValue({
        firstCouponId: couponData.firstCouponId,
        lastCouponId: couponData.lastCouponId,
      });
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      // Safe date formatting with fallbacks
      const receivedDate = values.receivedDate 
        ? (typeof values.receivedDate.format === 'function' 
           ? values.receivedDate.format('YYYY-MM-DD') 
           : new Date().toISOString().split('T')[0])
        : new Date().toISOString().split('T')[0];

      const receivedTime = values.receivedTime 
        ? (typeof values.receivedTime.format === 'function' 
           ? values.receivedTime.format('HH:mm') 
           : new Date().toTimeString().slice(0, 5))
        : new Date().toTimeString().slice(0, 5);

      const newBox: BoxReceipt = {
        id: Date.now().toString(),
        boxId: nextBoxNumber,
        barcode: values.barcode,
        supplier: values.supplier,
        receivedDate,
        receivedTime,
        receivedBy: values.receivedBy,
        receivedBySignature: values.signature,
        fuelType: values.fuelType,
        couponAmount: values.couponAmount,
        numberOfBooks: values.numberOfBooks,
        couponsPerBook: values.couponsPerBook || 10,
        totalCoupons: (values.numberOfBooks || 0) * (values.couponsPerBook || 10),
        totalLitres: values.totalLitres,
        firstCouponId: values.firstCouponId,
        lastCouponId: values.lastCouponId,
        monetaryValueUSD: values.monetaryValueUSD || 0,
        fuelPricePerLitreUSD: values.fuelPricePerLitreUSD || 0,
        exchangeRate: values.exchangeRate || 27.50,
        // Backward compatibility
        monetaryValue: values.monetaryValue || ((values.monetaryValueUSD || 0) * (values.exchangeRate || 27.50)),
        fuelPricePerLitre: values.fuelPricePerLitre || ((values.fuelPricePerLitreUSD || 0) * (values.exchangeRate || 27.50)),
        status: 'RECEIVED',
        invoiceNumber: values.invoiceNumber,
        deliveryNote: values.deliveryNote,
        notes: values.notes,
        booksGenerated: calculatedBooks,
        qrCodeData: JSON.stringify({
          boxId: nextBoxNumber,
          fuelType: values.fuelType,
          amount: values.couponAmount,
          totalLitres: values.totalLitres,
          supplier: values.supplier,
          date: receivedDate
        }),
      };

      // API call to save box
      try {
        const response = await apiClient.post('/api/v1/boxes/', newBox);

        if (response.status === 200 || response.status === 201) {
          setBoxReceipts([newBox, ...boxReceipts]);
          message.success('Box receipt recorded successfully!');
        } else {
          throw new Error('API call failed');
        }
      } catch (apiError) {
        console.error('API Error:', apiError);
        // Fallback: add to local state but show appropriate message
        setBoxReceipts([newBox, ...boxReceipts]);
        message.warning('Box saved locally. Please check network connection and sync later.');
      }

      setIsModalVisible(false);
      generateNextBoxNumber();
    } catch (error) {
      console.error('Error submitting box receipt:', error);
      message.error('Failed to record box receipt');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyBox = async (box: BoxReceipt) => {
    setSelectedBox(box);
    verifyForm.setFieldsValue({
      boxId: box.boxId,
      verificationNotes: box.verificationNotes || '',
    });
    setVerifyModalVisible(true);
  };

  const handleConfirmVerification = async () => {
    try {
      const values = await verifyForm.validateFields();
      
      if (selectedBox) {
        const updatedBox = {
          ...selectedBox,
          status: 'VERIFIED' as const,
          verificationNotes: values.verificationNotes,
        };

        // Update in local state (replace with API call)
        setBoxReceipts(prev => 
          prev.map(box => box.id === selectedBox.id ? updatedBox : box)
        );

        message.success('Box verified successfully!');
        setVerifyModalVisible(false);
        setSelectedBox(null);
      }
    } catch (error) {
      console.error('Error verifying box:', error);
      message.error('Failed to verify box');
    }
  };

  // Archive management functions
  const handleArchiveBox = async (box: BoxReceipt) => {
    setSelectedBox(box);
    archiveForm.resetFields();
    setArchiveModalVisible(true);
  };

  const handleConfirmArchive = async () => {
    try {
      const values = await archiveForm.validateFields();
      
      if (selectedBox) {
        // Call archive API
        const response = await apiClient.post('/archive/record/', {
          content_type_id: 1, // Box content type ID (you'd get this from a content types API)
          object_id: selectedBox.id,
          reason: values.reason
        });

        if (response.status === 200) {
          message.success('Box archived successfully!');
          setArchiveModalVisible(false);
          setSelectedBox(null);
          
          // Remove from current list if not showing archived items
          if (!showArchived) {
            setBoxReceipts(prev => prev.filter(box => box.id !== selectedBox.id));
          }
        }
      }
    } catch (error) {
      console.error('Error archiving box:', error);
      message.error('Failed to archive box');
    }
  };

  const handleUnarchiveBox = async (box: BoxReceipt) => {
    try {
      const response = await apiClient.post('/archive/unarchive/', {
        content_type_id: 1, // Box content type ID
        object_id: box.id,
        reason: 'Restored by user'
      });

      if (response.status === 200) {
        message.success('Box restored successfully!');
        
        // Remove from archived list if showing archived items
        if (showArchived) {
          setBoxReceipts(prev => prev.filter(b => b.id !== box.id));
        }
      }
    } catch (error) {
      console.error('Error restoring box:', error);
      message.error('Failed to restore box');
    }
  };

  const loadArchivedRecords = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/archive/records/');
      
      if (response.status === 200) {
        // Transform archived data to match BoxReceipt interface
        const archivedBoxes = response.data.boxes?.map((box: any) => ({
          ...box,
          status: 'ARCHIVED' as const,
        })) || [];
        
        setBoxReceipts(archivedBoxes);
      }
    } catch (error) {
      console.error('Error loading archived records:', error);
      message.error('Failed to load archived records');
    } finally {
      setLoading(false);
    }
  };

  const handleViewBox = (box: BoxReceipt) => {
    // For now, just show box details in a modal or navigate to details
    // You can expand this to show a detailed modal
    message.info(`Viewing details for Box ${box.boxId}`);
  };

  const toggleArchivedView = () => {
    setShowArchived(!showArchived);
    if (!showArchived) {
      loadArchivedRecords();
    } else {
      // Load regular records (you'd replace this with actual API call)
      setBoxReceipts(sampleBoxReceipts);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'orange';
      case 'RECEIVED': return 'blue';
      case 'VERIFIED': return 'green';
      case 'DISPATCHED': return 'purple';
      case 'DAMAGED': return 'red';
      case 'ARCHIVED': return 'grey';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return <ClockCircleOutlined />;
      case 'RECEIVED': return <InboxOutlined />;
      case 'VERIFIED': return <CheckOutlined />;
      case 'DISPATCHED': return <SendOutlined />;
      case 'DAMAGED': return <AlertOutlined />;
      case 'ARCHIVED': return <FolderOutlined />;
      default: return null;
    }
  };

  const columns: ColumnsType<BoxReceipt> = [
    {
      title: 'Box ID',
      dataIndex: 'boxId',
      key: 'boxId',
      fixed: 'left',
      width: 150,
      render: (text, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{text}</Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            <BarcodeOutlined /> {record.barcode}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Supplier',
      dataIndex: 'supplier',
      key: 'supplier',
      width: 150,
    },
    {
      title: 'Fuel Info',
      key: 'fuelInfo',
      width: 120,
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Tag color={record.fuelType === 'PETROL' ? 'blue' : 'green'}>
            {record.fuelType}
          </Tag>
          <Text style={{ fontSize: '12px' }}>
            {record.couponAmount}L Coupons
          </Text>
          <Text style={{ fontSize: '12px' }}>
            {record.numberOfBooks} Books × {record.couponsPerBook || 10} coupons
          </Text>
          <Text style={{ fontSize: '11px', color: '#666' }}>
            Total: {record.totalCoupons || (record.numberOfBooks * (record.couponsPerBook || 10))} coupons
          </Text>
        </Space>
      ),
    },
    {
      title: 'Total Volume',
      dataIndex: 'totalLitres',
      key: 'totalLitres',
      width: 120,
      render: (value) => `${(value || 0).toLocaleString()}L`,
    },
    {
      title: 'Monetary Value',
      key: 'monetaryValue',
      width: 180,
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>${(record.monetaryValueUSD || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} USD</Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            @ ${(record.fuelPricePerLitreUSD || 0).toFixed(4)}/L
          </Text>
          {record.exchangeRate && (
            <Text type="secondary" style={{ fontSize: '11px' }}>
              ≈ ZWG {((record.monetaryValueUSD || 0) * (record.exchangeRate || 1)).toLocaleString()}
            </Text>
          )}
        </Space>
      ),
    },
    {
      title: 'Coupon Range',
      key: 'couponRange',
      width: 200,
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
      title: 'Received Details',
      key: 'receivedDetails',
      width: 180,
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text style={{ fontSize: '12px' }}>
            <UserOutlined /> {record.receivedBy}
          </Text>
          <Text style={{ fontSize: '12px' }}>
            <ClockCircleOutlined /> {record.receivedDate} {record.receivedTime}
          </Text>
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
                setSelectedBox(record);
                setViewModalVisible(true);
              }}
            />
          </Tooltip>
          
          {record.status === 'RECEIVED' && (
            <Tooltip title="Verify Box">
              <Button
                type="default"
                size="small"
                icon={<CheckOutlined />}
                onClick={() => handleVerifyBox(record)}
              />
            </Tooltip>
          )}
          
          <Tooltip title="Print QR Code">
            <Button
              size="small"
              icon={<PrinterOutlined />}
              onClick={() => {
                // Handle print QR code
                window.print();
              }}
            />
          </Tooltip>
          
          {!showArchived && record.status !== 'ARCHIVED' && (
            <Tooltip title="Archive Box">
              <Button
                size="small"
                icon={<FolderOutlined />}
                onClick={() => handleArchiveBox(record)}
              />
            </Tooltip>
          )}
          
          {showArchived && record.status === 'ARCHIVED' && (
            <Tooltip title="Restore Box">
              <Button
                size="small"
                type="primary"
                icon={<FolderOpenOutlined />}
                onClick={() => handleUnarchiveBox(record)}
              />
            </Tooltip>
          )}
          
          {record.status === 'PENDING' && !showArchived && (
            <Popconfirm
              title="Are you sure you want to delete this box receipt?"
              onConfirm={() => {
                setBoxReceipts(prev => prev.filter(box => box.id !== record.id));
                message.success('Box receipt deleted');
              }}
              okText="Yes"
              cancelText="No"
            >
              <Tooltip title="Delete">
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

  return (
    <div>
      {/* Header */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Title level={4}>Box Receipt Management</Title>
          <Text type="secondary">Receive and verify coupon boxes from Petrotrade</Text>
        </Col>
        <Col>
          <Space>
            <Button
              type={showArchived ? "primary" : "default"}
              icon={showArchived ? <FolderOpenOutlined /> : <FolderOutlined />}
              onClick={toggleArchivedView}
            >
              {showArchived ? 'Show Active' : 'Show Archived'}
            </Button>
            <Button
              icon={<HistoryOutlined />}
              onClick={() => {
                // Navigate to audit logs
                message.info('Audit logs feature available');
              }}
            >
              Audit Logs
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddBox}
              disabled={showArchived}
            >
              Receive New Box
            </Button>
            <Button
              icon={<ScanOutlined />}
              onClick={() => {
                message.info('Barcode scanner feature coming soon');
              }}
            >
              Scan Barcode
            </Button>
          </Space>
        </Col>
      </Row>

      {/* Navigation Tabs */}
      <Card style={{ marginBottom: 16 }}>
        <Space size="large">
          <Button 
            type={activeTab === 'receipts' ? 'primary' : 'default'}
            onClick={() => setActiveTab('receipts')}
            icon={<InboxOutlined />}
          >
            Box Receipts
          </Button>
          <Button 
            type={activeTab === 'verification' ? 'primary' : 'default'}
            onClick={() => setActiveTab('verification')}
            icon={<CheckOutlined />}
          >
            Box Verification
          </Button>
          <Button 
            type={activeTab === 'inventory' ? 'primary' : 'default'}
            onClick={() => setActiveTab('inventory')}
            icon={<FolderOutlined />}
          >
            Box Inventory
          </Button>
        </Space>
      </Card>

      {/* Box Receipts Tab */}
      {activeTab === 'receipts' && (
        <>
          {/* Quick Stats */}
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col xs={24} sm={6}>
              <Card size="small">
                <Statistic
                  title="Total Boxes"
                  value={boxReceipts.length}
                  prefix={<InboxOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={6}>
              <Card size="small">
                <Statistic
                  title="Pending Verification"
                  value={boxReceipts.filter(box => box.status === 'RECEIVED').length}
                  prefix={<ClockCircleOutlined />}
                  valueStyle={{ color: '#faad14' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={6}>
              <Card size="small">
                <Statistic
                  title="Total Value (USD)"
                  value={boxReceipts.reduce((sum, box) => sum + (box.monetaryValueUSD || 0), 0)}
                  prefix={<DollarOutlined />}
                  formatter={(value) => `$${(value || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={6}>
              <Card size="small">
                <Statistic
                  title="Next Box Number"
                  value={nextBoxNumber}
                  prefix={<FileTextOutlined />}
                />
              </Card>
            </Col>
          </Row>

          {/* Main Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={boxReceipts}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1400 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} boxes`,
          }}
        />
      </Card>
        </>
      )}

      {/* Box Verification Tab */}
      {activeTab === 'verification' && (
        <Card title="Box Verification Center" extra={
          <Space>
            <Text type="secondary">Verify received boxes and view their contents</Text>
          </Space>
        }>
          {/* Pending Verification Boxes */}
          <div style={{ marginBottom: 24 }}>
            <Title level={5}>Boxes Pending Verification</Title>
            {boxReceipts.filter(box => box.status === 'RECEIVED').map(box => (
              <Card 
                key={box.id} 
                size="small" 
                style={{ marginBottom: 16 }}
                title={`Box ${box.boxId}`}
                extra={
                  <Space>
                    <Tag color="orange">Pending Verification</Tag>
                    <Button 
                      type="primary" 
                      size="small"
                      icon={<CheckOutlined />}
                      onClick={() => handleVerifyBox(box)}
                    >
                      Verify Now
                    </Button>
                  </Space>
                }
              >
                <Row gutter={16}>
                  <Col span={8}>
                    <Descriptions size="small" column={1}>
                      <Descriptions.Item label="Fuel Type">{box.fuelType}</Descriptions.Item>
                      <Descriptions.Item label="Denomination">{box.couponAmount}L</Descriptions.Item>
                      <Descriptions.Item label="Received Date">{box.receivedDate}</Descriptions.Item>
                    </Descriptions>
                  </Col>
                  <Col span={8}>
                    <Descriptions size="small" column={1}>
                      <Descriptions.Item label="Books">{box.numberOfBooks}</Descriptions.Item>
                      <Descriptions.Item label="Total Coupons">{box.totalCoupons}</Descriptions.Item>
                      <Descriptions.Item label="Total Litres">{box.totalLitres}L</Descriptions.Item>
                    </Descriptions>
                  </Col>
                  <Col span={8}>
                    <Descriptions size="small" column={1}>
                      <Descriptions.Item label="First Coupon">{box.firstCouponId}</Descriptions.Item>
                      <Descriptions.Item label="Last Coupon">{box.lastCouponId}</Descriptions.Item>
                      <Descriptions.Item label="Value (USD)">
                        ${(box.monetaryValueUSD || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}
                      </Descriptions.Item>
                    </Descriptions>
                  </Col>
                </Row>
              </Card>
            ))}
            
            {boxReceipts.filter(box => box.status === 'RECEIVED').length === 0 && (
              <Alert 
                message="No boxes pending verification" 
                description="All received boxes have been verified." 
                type="info" 
                showIcon 
              />
            )}
          </div>

          <Divider />

          {/* Verified Boxes */}
          <div>
            <Title level={5}>Recently Verified Boxes</Title>
            {boxReceipts.filter(box => box.status === 'VERIFIED').slice(0, 5).map(box => (
              <Card 
                key={box.id} 
                size="small" 
                style={{ marginBottom: 16 }}
                title={`Box ${box.boxId}`}
                extra={
                  <Space>
                    <Tag color="green">Verified</Tag>
                    <Button 
                      size="small"
                      icon={<EyeOutlined />}
                      onClick={() => handleViewBox(box)}
                    >
                      View Details
                    </Button>
                  </Space>
                }
              >
                <Row gutter={16}>
                  <Col span={12}>
                    <Text strong>Books Generated:</Text>
                    {box.booksGenerated?.map((book, index) => (
                      <div key={index} style={{ marginTop: 4 }}>
                        <Tag color="blue">Book {index + 1}</Tag>
                        <Text code>{book.firstCouponId} - {book.lastCouponId}</Text>
                        <Text type="secondary" style={{ marginLeft: 8 }}>({book.numberOfCoupons} coupons)</Text>
                      </div>
                    )) || <Text type="secondary">No book details available</Text>}
                  </Col>
                  <Col span={12}>
                    <Descriptions size="small" column={1}>
                      <Descriptions.Item label="Verification Notes">
                        {box.verificationNotes || 'No notes provided'}
                      </Descriptions.Item>
                      <Descriptions.Item label="Status">
                        <Tag color="green">{box.status}</Tag>
                      </Descriptions.Item>
                    </Descriptions>
                  </Col>
                </Row>
              </Card>
            ))}
          </div>
        </Card>
      )}

      {/* Box Inventory Tab */}
      {activeTab === 'inventory' && (
        <Card title="Box Inventory Overview">
          <Row gutter={16}>
            <Col span={24}>
              <Alert 
                message="Inventory Management" 
                description="Complete inventory tracking with books and individual coupon details will be available in this section." 
                type="info" 
                showIcon 
                style={{ marginBottom: 16 }}
              />
              
              {/* Summary Cards */}
              <Row gutter={16} style={{ marginBottom: 16 }}>
                <Col xs={24} sm={8}>
                  <Card size="small">
                    <Statistic
                      title="Total Books Generated"
                      value={boxReceipts.reduce((sum, box) => sum + (box.numberOfBooks || 0), 0)}
                      prefix={<FileTextOutlined />}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={8}>
                  <Card size="small">
                    <Statistic
                      title="Total Coupons Available"
                      value={boxReceipts.reduce((sum, box) => sum + (box.totalCoupons || 0), 0)}
                      prefix={<BarcodeOutlined />}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={8}>
                  <Card size="small">
                    <Statistic
                      title="Total Fuel Volume"
                      value={boxReceipts.reduce((sum, box) => sum + (box.totalLitres || 0), 0)}
                      prefix={<CarOutlined />}
                      suffix="L"
                    />
                  </Card>
                </Col>
              </Row>
              
              {/* Detailed Box List */}
              <Title level={5}>Box Details</Title>
              {boxReceipts.map(box => (
                <Card 
                  key={box.id} 
                  size="small" 
                  style={{ marginBottom: 12 }}
                  title={`${box.boxId} - ${box.fuelType} ${box.couponAmount}L`}
                  extra={<Tag color={box.status === 'VERIFIED' ? 'green' : 'orange'}>{box.status}</Tag>}
                >
                  <Descriptions size="small" column={4}>
                    <Descriptions.Item label="Books">{box.numberOfBooks}</Descriptions.Item>
                    <Descriptions.Item label="Coupons">{box.totalCoupons}</Descriptions.Item>
                    <Descriptions.Item label="Range">{box.firstCouponId} - {box.lastCouponId}</Descriptions.Item>
                    <Descriptions.Item label="Date">{box.receivedDate}</Descriptions.Item>
                  </Descriptions>
                </Card>
              ))}
            </Col>
          </Row>
        </Card>
      )}

      {/* Add Box Modal */}
      <Modal
        title={
          <Space>
            <InboxOutlined />
            Receive New Box from Petrotrade
          </Space>
        }
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={800}
        destroyOnHidden
      >
        <Steps current={currentStep} style={{ marginBottom: 24 }}>
          <Step title="Basic Info" icon={<InboxOutlined />} />
          <Step title="Fuel Details" icon={<CarOutlined />} />
          <Step title="Verification" icon={<CheckOutlined />} />
        </Steps>

        <Form
          form={form}
          layout="vertical"
          onFieldsChange={handleFormChange}
        >
          {currentStep === 0 && (
            <>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="Box ID"
                    name="boxId"
                    initialValue={nextBoxNumber}
                  >
                    <Input disabled />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Barcode"
                    name="barcode"
                    rules={[{ required: true, message: 'Please enter barcode' }]}
                  >
                    <Input 
                      placeholder="Scan or enter barcode"
                      addonAfter={
                        <Button
                          type="text"
                          icon={<ScanOutlined />}
                          onClick={() => message.info('Scanner feature coming soon')}
                        />
                      }
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="Supplier"
                    name="supplier"
                    initialValue="Petrotrade Zimbabwe"
                    rules={[{ required: true, message: 'Please enter supplier' }]}
                  >
                    <Select>
                      <Option value="Petrotrade Zimbabwe">Petrotrade Zimbabwe</Option>
                      <Option value="Other Supplier">Other Supplier</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Received By"
                    name="receivedBy"
                    rules={[{ required: true, message: 'Please enter receiver name' }]}
                  >
                    <Input placeholder="Enter receiver name" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="Received Date"
                    name="receivedDate"
                    initialValue={dayjs()}
                    rules={[{ required: true, message: 'Please select date' }]}
                  >
                    <DatePicker style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Received Time"
                    name="receivedTime"
                    initialValue={dayjs()}
                    rules={[{ required: true, message: 'Please select time' }]}
                  >
                    <TimePicker style={{ width: '100%' }} format="HH:mm" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="Invoice Number"
                    name="invoiceNumber"
                  >
                    <Input placeholder="Enter invoice number" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Delivery Note"
                    name="deliveryNote"
                  >
                    <Input placeholder="Enter delivery note number" />
                  </Form.Item>
                </Col>
              </Row>

              <div style={{ textAlign: 'right' }}>
                <Button
                  type="primary"
                  onClick={() => setCurrentStep(1)}
                >
                  Next: Fuel Details
                </Button>
              </div>
            </>
          )}

          {currentStep === 1 && (
            <>
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item
                    label="Fuel Type"
                    name="fuelType"
                    rules={[{ required: true, message: 'Please select fuel type' }]}
                  >
                    <Select placeholder="Select fuel type">
                      <Option value="PETROL">Petrol</Option>
                      <Option value="DIESEL">Diesel</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label="Coupon Amount (Litres)"
                    name="couponAmount"
                    rules={[{ required: true, message: 'Please select coupon amount' }]}
                  >
                    <Select placeholder="Select coupon amount">
                      <Option value={5}>5 Litres</Option>
                      <Option value={20}>20 Litres</Option>
                      <Option value={50}>50 Litres</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item
                    label="Number of Books"
                    name="numberOfBooks"
                    initialValue={10}
                    rules={[{ required: true, message: 'Please enter number of books' }]}
                  >
                    <InputNumber
                      min={1}
                      max={50}
                      style={{ width: '100%' }}
                      placeholder="Number of books in box"
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label="Coupons per Book"
                    name="couponsPerBook"
                    initialValue={10}
                    rules={[{ required: true, message: 'Please enter coupons per book' }]}
                  >
                    <InputNumber
                      min={1}
                      max={25}
                      style={{ width: '100%' }}
                      placeholder="Coupons per book"
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label="Total Coupons"
                    name="totalCoupons"
                  >
                    <InputNumber
                      disabled
                      style={{ width: '100%' }}
                      placeholder="Auto-calculated"
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="Total Litres"
                    name="totalLitres"
                  >
                    <InputNumber
                      disabled
                      style={{ width: '100%' }}
                      formatter={(value) => `${value} L`}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Fuel Price per Litre (USD)"
                    name="fuelPricePerLitreUSD"
                    rules={[{ required: true, message: 'Please enter fuel price in USD' }]}
                  >
                    <InputNumber
                      min={0}
                      precision={4}
                      step={0.01}
                      style={{ width: '100%' }}
                      placeholder="e.g., 1.38"
                      formatter={(value) => `$${value}`}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="USD/ZWG Exchange Rate"
                    name="exchangeRate"
                    initialValue={27.50}
                  >
                    <InputNumber
                      min={0}
                      precision={2}
                      style={{ width: '100%' }}
                      placeholder="e.g., 27.50"
                      formatter={(value) => `1 USD = ${value} ZWG`}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Fuel Price per Litre (ZWG)"
                    name="fuelPricePerLitre"
                  >
                    <InputNumber
                      disabled
                      style={{ width: '100%' }}
                      formatter={(value) => `ZWG ${(value || 0).toLocaleString()}`}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="First Coupon ID"
                    name="firstCouponId"
                    rules={[{ required: true, message: 'Please enter first coupon ID' }]}
                  >
                    <Input 
                      placeholder="Enter first coupon number (e.g., PU00GH355101)"
                      style={{ fontFamily: 'monospace' }}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Last Coupon ID"
                    name="lastCouponId"
                    rules={[{ required: true, message: 'Please enter last coupon ID' }]}
                  >
                    <Input 
                      placeholder="Enter last coupon number (e.g., PU00GH355200)"
                      style={{ fontFamily: 'monospace' }}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="Monetary Value (USD)"
                    name="monetaryValueUSD"
                  >
                    <InputNumber
                      disabled
                      precision={2}
                      style={{ width: '100%' }}
                      formatter={(value) => `$${(value || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Monetary Value (ZWG)"
                    name="monetaryValue"
                  >
                    <InputNumber
                      disabled
                      style={{ width: '100%' }}
                      formatter={(value) => `ZWG ${(value || 0).toLocaleString()}`}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <div style={{ textAlign: 'right' }}>
                <Space>
                  <Button onClick={() => setCurrentStep(0)}>
                    Previous
                  </Button>
                  <Button
                    type="primary"
                    onClick={() => setCurrentStep(2)}
                  >
                    Next: Verification
                  </Button>
                </Space>
              </div>
            </>
          )}

          {currentStep === 2 && (
            <>
              <Alert
                message="Verification Required"
                description="Please verify all box details and confirm receipt before submitting."
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />

              <Form.Item
                label="Verification Notes"
                name="notes"
              >
                <TextArea
                  rows={4}
                  placeholder="Enter any verification notes, damage reports, or observations..."
                />
              </Form.Item>

              <Form.Item label="Digital Signature">
                <Upload
                  name="signature"
                  listType="picture-card"
                  className="avatar-uploader"
                  showUploadList={false}
                  beforeUpload={() => false}
                >
                  <div>
                    <UploadOutlined />
                    <div style={{ marginTop: 8 }}>Upload Signature</div>
                  </div>
                </Upload>
              </Form.Item>

              <div style={{ textAlign: 'right' }}>
                <Space>
                  <Button onClick={() => setCurrentStep(1)}>
                    Previous
                  </Button>
                  <Button onClick={() => setIsModalVisible(false)}>
                    Cancel
                  </Button>
                  <Button
                    type="primary"
                    loading={loading}
                    onClick={handleSubmit}
                  >
                    Confirm Receipt
                  </Button>
                </Space>
              </div>
            </>
          )}
        </Form>
      </Modal>

      {/* View Box Details Modal */}
      <Modal
        title={
          <Space>
            <EyeOutlined />
            Box Details - {selectedBox?.boxId}
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
        width={800}
      >
        {selectedBox && (
          <div>
            <Descriptions bordered column={2}>
              <Descriptions.Item label="Box ID">{selectedBox.boxId}</Descriptions.Item>
              <Descriptions.Item label="Barcode">{selectedBox.barcode}</Descriptions.Item>
              <Descriptions.Item label="Supplier">{selectedBox.supplier}</Descriptions.Item>
              <Descriptions.Item label="Status">
                <Badge
                  status={getStatusColor(selectedBox.status) as any}
                  text={selectedBox.status}
                />
              </Descriptions.Item>
              <Descriptions.Item label="Fuel Type">
                <Tag color={selectedBox.fuelType === 'PETROL' ? 'blue' : 'green'}>
                  {selectedBox.fuelType}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Coupon Amount">{selectedBox.couponAmount} Litres</Descriptions.Item>
              <Descriptions.Item label="Number of Books">{selectedBox.numberOfBooks}</Descriptions.Item>
              <Descriptions.Item label="Total Litres">{(selectedBox.totalLitres || 0).toLocaleString()}L</Descriptions.Item>
              <Descriptions.Item label="Price per Litre">ZWG {selectedBox.fuelPricePerLitre || 0}</Descriptions.Item>
              <Descriptions.Item label="Total Value">ZWG {(selectedBox.monetaryValue || 0).toLocaleString()}</Descriptions.Item>
              <Descriptions.Item label="First Coupon ID">{selectedBox.firstCouponId}</Descriptions.Item>
              <Descriptions.Item label="Last Coupon ID">{selectedBox.lastCouponId}</Descriptions.Item>
              <Descriptions.Item label="Received By">{selectedBox.receivedBy}</Descriptions.Item>
              <Descriptions.Item label="Received Date">{selectedBox.receivedDate} {selectedBox.receivedTime}</Descriptions.Item>
              {selectedBox.verificationNotes && (
                <Descriptions.Item label="Verification Notes" span={2}>
                  {selectedBox.verificationNotes}
                </Descriptions.Item>
              )}
              {selectedBox.notes && (
                <Descriptions.Item label="Notes" span={2}>
                  {selectedBox.notes}
                </Descriptions.Item>
              )}
            </Descriptions>

            {selectedBox.qrCodeData && (
              <div style={{ marginTop: 24, textAlign: 'center' }}>
                <Title level={5}>QR Code</Title>
                <QRCode value={selectedBox.qrCodeData} />
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Verification Modal */}
      <Modal
        title={
          <Space>
            <CheckOutlined />
            Verify Box - {selectedBox?.boxId}
          </Space>
        }
        open={verifyModalVisible}
        onCancel={() => setVerifyModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setVerifyModalVisible(false)}>
            Cancel
          </Button>,
          <Button
            key="verify"
            type="primary"
            onClick={handleConfirmVerification}
          >
            Confirm Verification
          </Button>,
        ]}
      >
        <Form form={verifyForm} layout="vertical">
          <Alert
            message="Box Verification"
            description="Please verify the box contents, seal integrity, and barcode before confirming."
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />

          <Form.Item
            label="Box ID"
            name="boxId"
          >
            <Input disabled />
          </Form.Item>

          <Form.Item
            label="Verification Checklist"
          >
            <Checkbox.Group style={{ width: '100%' }}>
              <Row>
                <Col span={24}>
                  <Checkbox value="seal">Box seal is intact</Checkbox>
                </Col>
                <Col span={24}>
                  <Checkbox value="books">All 20 books are present</Checkbox>
                </Col>
                <Col span={24}>
                  <Checkbox value="barcode">Barcode scanned successfully</Checkbox>
                </Col>
                <Col span={24}>
                  <Checkbox value="damage">No visible damage</Checkbox>
                </Col>
              </Row>
            </Checkbox.Group>
          </Form.Item>

          <Form.Item
            label="Verification Notes"
            name="verificationNotes"
            rules={[{ required: true, message: 'Please enter verification notes' }]}
          >
            <TextArea
              rows={4}
              placeholder="Enter detailed verification notes..."
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Archive Modal */}
      <Modal
        title={
          <Space>
            <FolderOutlined />
            Archive Box - {selectedBox?.boxId}
          </Space>
        }
        open={archiveModalVisible}
        onCancel={() => setArchiveModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setArchiveModalVisible(false)}>
            Cancel
          </Button>,
          <Button
            key="archive"
            type="primary"
            onClick={handleConfirmArchive}
          >
            Confirm Archive
          </Button>,
        ]}
      >
        <Form form={archiveForm} layout="vertical">
          <Form.Item
            label="Reason for Archiving"
            name="reason"
            rules={[{ required: true, message: 'Please enter a reason' }]}
          >
            <TextArea
              rows={4}
              placeholder="Enter reason for archiving this box"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default BoxReceiptManagement;
