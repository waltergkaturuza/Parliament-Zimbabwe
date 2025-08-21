// src/pages/Coupons/CouponVerification.tsx
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
  InputNumber,
  Space,
  Tag,
  Row,
  Col,
  Typography,
  Alert,
  Descriptions,
  message,
  Steps,
  Radio,
  Badge,
  Statistic,
  Tabs,
  Checkbox,
  Tooltip,
  Popconfirm,
  Drawer,
  Collapse
} from 'antd';
import {
  BarcodeOutlined,
  CheckOutlined,
  EyeOutlined,
  PrinterOutlined,
  DownloadOutlined,
  FileTextOutlined,
  UserOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  InboxOutlined,
  CarOutlined,
  SendOutlined,
  AlertOutlined,
  FolderOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  BookOutlined,
  FilePdfOutlined,
  SettingOutlined,
  CloseOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;
const { Panel } = Collapse;

interface BoxReceipt {
  // Core identification - harmonized with backend
  id: string;
  boxId: string;          // Maps to box_code in backend
  barcode: string;
  
  // Supply chain information
  supplier: string;
  deliveryNote?: string;
  invoiceNumber?: string;
  
  // Receipt tracking - separate date/time fields
  receivedDate: string;
  receivedTime: string;
  receivedBy: string;
  receivedBySignature?: string;
  
  // Fuel specifications
  fuelType: 'PETROL' | 'DIESEL';
  couponAmount: number; // Denomination in litres (5, 10, 20, 50)
  
  // Structure and counting
  numberOfBooks: number;
  couponsPerBook: number;
  totalCoupons: number;
  totalLitres: number;
  
  // Coupon serial numbers
  firstCouponId: string;
  lastCouponId: string;
  
  // Financial calculations
  monetaryValueUSD: number; // Value in USD
  fuelPricePerLitreUSD: number; // Price per litre in USD
  exchangeRate?: number; // USD to ZWG exchange rate for reference
  
  // Status workflow - harmonized with backend choices
  status: 'PENDING' | 'RECEIVED' | 'VERIFIED' | 'DISPATCHED' | 'DAMAGED' | 'ARCHIVED';
  
  // Quality and verification
  verificationNotes?: string;
  damageReport?: string;
  
  // Generated data
  booksGenerated?: BookInfo[];
  qrCodeData?: string;
  
  // General notes
  notes?: string;
  
  // Legacy compatibility
  monetaryValue?: number; // For backward compatibility (ZWG)
  fuelPricePerLitre?: number; // For backward compatibility (ZWG)
}

interface BookInfo {
  bookId: string;
  firstCouponId: string;
  lastCouponId: string;
  numberOfCoupons: number;
}

interface SmartCalculationMode {
  mode: 'first-and-count' | 'last-and-count' | 'first-and-last' | 'full-range';
  label: string;
  description: string;
}

interface GeneratorFields {
  calculationMode: string;
  firstCouponId: string;
  lastCouponId: string;
  numberOfBooks: number;
  couponsPerBook: number;
}

// Coupon format validation regex: [AA–ZZ][000–999][AA–ZZ][000000–999999]
const COUPON_FORMAT_REGEX = /^[A-Z]{2}[0-9]{3}[A-Z]{2}[0-9]{6}$/;

// Validate coupon format
const validateCouponFormat = (couponId: string): boolean => {
  return COUPON_FORMAT_REGEX.test(couponId);
};

// Increment coupon code using odometer-style logic
const incrementCoupon = (code: string): string => {
  if (!validateCouponFormat(code)) {
    throw new Error('Invalid coupon format');
  }

  // Split the code into components
  const prefixLetters = code.substring(0, 2);       // First 2 letters (AA–ZZ)
  const prefixNumber = parseInt(code.substring(2, 5)); // 3-digit number (000–999)
  const seriesLetters = code.substring(5, 7);       // Second 2 letters (AA–ZZ)
  const numericPart = parseInt(code.substring(7));  // Last 6-digit number (000000–999999)

  // Increment numeric part (last 6 digits)
  let newNumericPart = numericPart + 1;
  let newSeriesLetters = seriesLetters;
  let newPrefixNumber = prefixNumber;
  let newPrefixLetters = prefixLetters;

  if (newNumericPart > 999999) {
    newNumericPart = 0;
    // Increment second letter pair
    newSeriesLetters = incrementLetters(seriesLetters);
    if (newSeriesLetters === "AA") { // rolled over
      // Increment 3-digit number
      newPrefixNumber += 1;
      if (newPrefixNumber > 999) {
        newPrefixNumber = 0;
        // Increment first letter pair
        newPrefixLetters = incrementLetters(prefixLetters);
      }
    }
  }

  // Rebuild the code with proper zero-padding
  return `${newPrefixLetters}${newPrefixNumber.toString().padStart(3, '0')}${newSeriesLetters}${newNumericPart.toString().padStart(6, '0')}`;
};

// Increment a 2-letter uppercase code (AA–ZZ)
const incrementLetters = (pair: string): string => {
  const first = pair[0];
  const second = pair[1];

  // Convert to numeric 0–25
  let f = first.charCodeAt(0) - 'A'.charCodeAt(0);
  let s = second.charCodeAt(0) - 'A'.charCodeAt(0);

  // Increment like base-26
  s += 1;
  if (s > 25) {
    s = 0;
    f += 1;
    if (f > 25) {
      f = 0; // rollover from ZZ → AA
    }
  }

  return String.fromCharCode(f + 'A'.charCodeAt(0)) + String.fromCharCode(s + 'A'.charCodeAt(0));
};

// Calculate last coupon ID from first coupon ID using proper increment logic
const calculateLastCouponFromFirst = (firstCouponId: string, totalCoupons: number): string => {
  if (!validateCouponFormat(firstCouponId)) {
    throw new Error('Invalid first coupon format');
  }

  let currentCoupon = firstCouponId;
  for (let i = 1; i < totalCoupons; i++) {
    currentCoupon = incrementCoupon(currentCoupon);
  }
  return currentCoupon;
};

// Helper functions
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

const CouponVerification: FC = () => {
  // State for box data and selection
  const [boxReceipts, setBoxReceipts] = useState<BoxReceipt[]>([]);
  const [selectedBox, setSelectedBox] = useState<BoxReceipt | null>(null);
  const [loading, setLoading] = useState(false);
  
  // State for book generation
  const [calculatedBooks, setCalculatedBooks] = useState<any[]>([]);
  const [generatedBooks, setGeneratedBooks] = useState<any[]>([]);
  const [generatorFields, setGeneratorFields] = useState<GeneratorFields>({
    calculationMode: 'first-and-count',
    firstCouponId: '',
    lastCouponId: '',
    numberOfBooks: 1,
    couponsPerBook: 100,
  });
  const [calculationMode, setCalculationMode] = useState<string>('first-and-count');
  
  // State for verification reports
  const [isPrintModalVisible, setIsPrintModalVisible] = useState(false);
  const [selectedBoxForPrint, setSelectedBoxForPrint] = useState<BoxReceipt | null>(null);
  
  // State for UI
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('verification');
  
  // State for coupon generation tab
  const [generationBoxes, setGenerationBoxes] = useState<BoxReceipt[]>([]);
  const [selectedGenerationBox, setSelectedGenerationBox] = useState<BoxReceipt | null>(null);
  const [generationLoading, setGenerationLoading] = useState(false);
  
  // New state for enhanced verification
  const [wideVerificationVisible, setWideVerificationVisible] = useState(false);
  const [selectedVerificationBox, setSelectedVerificationBox] = useState<BoxReceipt | null>(null);
  const [booksVerificationStatus, setBooksVerificationStatus] = useState<{[key: string]: boolean}>({});
  const [selectAllChecked, setSelectAllChecked] = useState(false);
  const [autoCompleteLoading, setAutoCompleteLoading] = useState(false);
  
  // State for coupon book viewer
  const [couponBookViewerVisible, setCouponBookViewerVisible] = useState(false);
  const [selectedBookForViewing, setSelectedBookForViewing] = useState<any>(null);
  const [currentBookPage, setCurrentBookPage] = useState(1);
  
  // Calculation modes configuration
  const calculationModes: SmartCalculationMode[] = [
    {
      mode: 'first-and-count',
      label: '🎯 First Serial + Count',
      description: 'Enter first coupon ID, number of books, and coupons per book'
    },
    {
      mode: 'last-and-count',
      label: '🔄 Last Serial + Count',
      description: 'Enter last coupon ID, number of books, and coupons per book'
    },
    {
      mode: 'first-and-last',
      label: '📏 First & Last Range',
      description: 'Enter first and last coupon IDs, system calculates books'
    },
    {
      mode: 'full-range',
      label: '🎛️ Full Range Analysis',
      description: 'Enter complete range, system auto-detects all parameters'
    }
  ];

  // Fetch box receipts on component mount
  useEffect(() => {
    fetchBoxReceipts();
    fetchBoxesForGeneration();
  }, []);

  // Force refresh function to get latest data from backend
  const forceRefresh = async () => {
    setLoading(true);
    setGenerationLoading(true);
    message.info('🔄 Refreshing data from server...');
    
    try {
      await Promise.all([
        fetchBoxReceipts(),
        fetchBoxesForGeneration()
      ]);
      message.success('✅ Data refreshed successfully');
    } catch (error) {
      console.error('Error refreshing data:', error);
      message.error('Failed to refresh data from server');
    } finally {
      setLoading(false);
      setGenerationLoading(false);
    }
  };

  const fetchBoxReceipts = async () => {
    setLoading(true);
    // Clear existing data to ensure fresh fetch
    setBoxReceipts([]);
    
    try {
      // Add timestamp to prevent caching
      const timestamp = new Date().getTime();
      const response = await apiClient.get(`/boxes/?t=${timestamp}`);
      const data = response.data;
      console.log('API /boxes/ response:', data);
      
      const boxes = data.results || data;
      if (Array.isArray(boxes)) {
        const mappedBoxes = boxes.map((box: any) => {
          let firstCouponId = box.first_coupon_number;
          let lastCouponId = box.last_coupon_number;
          if (box.coupon_range && typeof box.coupon_range === 'string') {
            const parts = box.coupon_range.split(' ');
            firstCouponId = parts[0] || '';
            lastCouponId = parts[1] || '';
          }
          return {
            id: String(box.id),
            boxId: box.box_code,
            barcode: box.barcode,
            supplier: box.supplier,
            receivedDate: box.received_at ? new Date(box.received_at).toISOString().split('T')[0] : '',
            receivedTime: box.received_at ? new Date(box.received_at).toTimeString().split(' ')[0] : '',
            receivedBy: box.received_by?.first_name && box.received_by?.last_name 
              ? `${box.received_by.first_name} ${box.received_by.last_name}` 
              : box.received_by?.username,
            fuelType: box.fuel_type,
            couponAmount: box.coupon_amount,
            numberOfBooks: box.number_of_books ?? (box.books?.length),
            couponsPerBook: box.coupons_per_book,
            totalCoupons: box.totalCoupons ?? box.total_coupons ?? ((box.books?.length) * (box.coupons_per_book)),
            totalLitres: box.total_litres,
            firstCouponId,
            lastCouponId,
            monetaryValueUSD: box.monetary_value_usd,
            fuelPricePerLitreUSD: box.fuel_price_per_litre_usd,
            exchangeRate: box.exchange_rate,
            status: (box.status === 'received' ? 'RECEIVED' : 
                    box.status === 'verified' ? 'VERIFIED' : 
                    box.status === 'dispatched' ? 'DISPATCHED' : 
                    box.status === 'damaged' ? 'DAMAGED' : 
                    box.status === 'archived' ? 'ARCHIVED' : 
                    'PENDING') as 'PENDING' | 'RECEIVED' | 'VERIFIED' | 'DISPATCHED' | 'DAMAGED' | 'ARCHIVED',
            verificationNotes: box.verification_notes,
            invoiceNumber: box.invoice_number,
            deliveryNote: box.delivery_note,
            notes: box.notes,
          };
        });
        setBoxReceipts(mappedBoxes);
      } else {
        console.warn('No boxes data received from API');
        setBoxReceipts([]);
      }
    } catch (error) {
      console.error('Error fetching box receipts:', error);
      setBoxReceipts([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch boxes for coupon generation
  const fetchBoxesForGeneration = async () => {
    setGenerationLoading(true);
    // Clear existing data to ensure fresh fetch
    setGenerationBoxes([]);
    
    try {
      // Add timestamp to prevent caching
      const timestamp = new Date().getTime();
      const response = await apiClient.get(`/boxes/?t=${timestamp}`, {
        params: {
          status: 'received', // Only get received boxes that need coupon generation
          ordering: '-received_at'
        }
      });
      const data = response.data;
      const boxes = data.results || data;
      
      if (Array.isArray(boxes)) {
        const mappedBoxes = boxes.map((box: any) => {
          let firstCouponId = box.first_coupon_number;
          let lastCouponId = box.last_coupon_number;
          if (box.coupon_range && typeof box.coupon_range === 'string') {
            const parts = box.coupon_range.split(' ');
            firstCouponId = parts[0] || '';
            lastCouponId = parts[1] || '';
          }
          return {
            id: String(box.id),
            boxId: box.box_code,
            barcode: box.barcode,
            supplier: box.supplier,
            receivedDate: box.received_at ? new Date(box.received_at).toISOString().split('T')[0] : '',
            receivedTime: box.received_at ? new Date(box.received_at).toTimeString().split(' ')[0] : '',
            receivedBy: box.received_by?.first_name && box.received_by?.last_name
              ? `${box.received_by.first_name} ${box.received_by.last_name}`
              : box.received_by?.username,
            fuelType: box.fuel_type,
            couponAmount: box.coupon_amount,
            numberOfBooks: box.number_of_books ?? (box.books?.length),
            couponsPerBook: box.coupons_per_book,
            totalCoupons: box.totalCoupons ?? box.total_coupons ?? ((box.books?.length) * (box.coupons_per_book)),
            totalLitres: box.total_litres,
            firstCouponId,
            lastCouponId,
            monetaryValueUSD: box.monetary_value_usd,
            fuelPricePerLitreUSD: box.fuel_price_per_litre_usd,
            exchangeRate: box.exchange_rate,
            status: 'RECEIVED' as const,
            verificationNotes: box.verification_notes,
            invoiceNumber: box.invoice_number,
            deliveryNote: box.delivery_note,
            notes: box.notes,
          };
        });
        setGenerationBoxes(mappedBoxes);
      }
    } catch (error) {
      console.error('Error fetching boxes for generation:', error);
      message.error('Failed to fetch boxes for coupon generation');
    } finally {
      setGenerationLoading(false);
    }
  };

  // Auto-complete missing data function
  const autoCompleteMissingData = async (box: BoxReceipt) => {
    setAutoCompleteLoading(true);
    try {
      // Use the coupon ranges preview endpoint to calculate missing details
      const response = await apiClient.get(`/boxes/${box.id}/coupon_ranges_preview/`);
      const previewData = response.data;
      
      if (previewData.valid) {
        // Save the auto-completed data to the backend
        const updateData = {
          last_coupon_number: previewData.box_summary.last_coupon,
          number_of_books: previewData.box_summary.total_books,
          total_coupons: previewData.box_summary.total_coupons
        };
        
        // Update the box in the backend
        const updateResponse = await apiClient.patch(`/boxes/${box.id}/`, updateData);
        
        if (updateResponse.status === 200) {
          message.success(`✅ Auto-completed and saved missing details for Box ${box.boxId}`);
          
          // Force refresh the data from server to ensure we have the latest state
          await forceRefresh();
        } else {
          message.error('Failed to save auto-completed data to server');
        }
      } else {
        message.error(`Cannot auto-complete: ${previewData.error}`);
      }
    } catch (error: any) {
      console.error('Error auto-completing data:', error);
      message.error(error.response?.data?.error || 'Failed to auto-complete and save missing data');
    } finally {
      setAutoCompleteLoading(false);
    }
  };

  // Handle edit box (for boxes with missing data)
  const handleEditBox = (box: BoxReceipt) => {
    Modal.confirm({
      title: `📝 Edit Box ${box.boxId}`,
      content: (
        <div>
          <p>This box has incomplete data. You can:</p>
          <ul>
            <li><strong>Auto-complete:</strong> Calculate missing details automatically</li>
            <li><strong>Manual edit:</strong> Enter the missing information manually</li>
            <li><strong>Delete:</strong> Remove this box if it's invalid</li>
          </ul>
          <p>What would you like to do?</p>
        </div>
      ),
      onOk: () => autoCompleteMissingData(box),
      okText: 'Auto-complete',
      cancelText: 'Manual Edit',
      onCancel: () => {
        // Open manual edit modal
        message.info('Manual edit functionality - redirect to box creation form');
      }
    });
  };

  // Handle delete box
  const handleDeleteBox = async (box: BoxReceipt) => {
    Modal.confirm({
      title: `🗑️ Delete Box ${box.boxId}?`,
      content: (
        <div>
          <Alert
            message="Permanent Deletion"
            description="This action cannot be undone. The box and all its data will be permanently removed."
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />
          <p><strong>Box ID:</strong> {box.boxId}</p>
          <p><strong>Status:</strong> {box.status}</p>
          <p><strong>Reason:</strong> Incomplete or invalid data</p>
        </div>
      ),
      onOk: async () => {
        try {
          await apiClient.delete(`/boxes/${box.id}/`);
          message.success(`Box ${box.boxId} deleted successfully`);
          // Refresh data
          await fetchBoxReceipts();
          await fetchBoxesForGeneration();
        } catch (error: any) {
          console.error('Error deleting box:', error);
          message.error(error.response?.data?.error || 'Failed to delete box');
        }
      },
      okText: 'Delete Permanently',
      okType: 'danger',
      cancelText: 'Cancel'
    });
  };

  // Generate coupons from selected box data
  const handleGenerateCouponsFromBox = async (box: BoxReceipt) => {
    if (!box.firstCouponId || !box.numberOfBooks || !box.couponsPerBook) {
      message.error('Box data incomplete. Please ensure first coupon ID, number of books, and coupons per book are available.');
      return;
    }

    try {
      setGenerationLoading(true);
      
      // Validate coupon format first
      if (!validateCouponFormat(box.firstCouponId)) {
        message.error(`Invalid coupon format: ${box.firstCouponId}. Expected format: [AA–ZZ][000–999][AA–ZZ][000000–999999]`);
        return;
      }
      
      // Use the proper book generation logic
      const books = [];
      const { firstCouponId, numberOfBooks, couponsPerBook } = box;
      
      let currentCoupon = firstCouponId;
      
      for (let i = 0; i < numberOfBooks; i++) {
        const bookFirstCoupon = currentCoupon;
        
        // Calculate last coupon for this book
        let bookLastCoupon = currentCoupon;
        for (let j = 1; j < couponsPerBook; j++) {
          bookLastCoupon = incrementCoupon(bookLastCoupon);
        }
        
        books.push({
          bookId: `Book ${i + 1}`,
          firstCouponId: bookFirstCoupon,
          lastCouponId: bookLastCoupon,
          numberOfCoupons: couponsPerBook,
        });
        
        // Set next book's first coupon
        if (i < numberOfBooks - 1) {
          currentCoupon = incrementCoupon(bookLastCoupon);
        }
      }
      
      // Save generated books to backend
      const response = await apiClient.post(`/boxes/${box.id}/generate-coupons/`, {
        books: books
      });
      
      if (response.status === 200) {
        message.success(`Successfully generated ${books.length} books for Box ${box.boxId}!`);
        
        // Update the box status to verified
        await apiClient.patch(`/boxes/${box.id}/`, {
          status: 'verified',
          verification_notes: `Coupons generated on ${new Date().toLocaleDateString()} with ${books.length} books.`,
          verified_at: new Date().toISOString()
        });
        
        // Refresh the generation boxes list
        await fetchBoxesForGeneration();
        
        // Show success modal with details
        Modal.success({
          title: '🎉 Coupon Generation Complete!',
          content: (
            <div>
              <p>Successfully generated coupons for Box <strong>{box.boxId}</strong>:</p>
              <ul>
                <li>{books.length} books created</li>
                <li>{box.totalCoupons} total coupons</li>
                <li>{box.totalLitres}L total fuel value</li>
                <li>First coupon: {box.firstCouponId}</li>
                <li>Last coupon: {books[books.length - 1]?.lastCouponId}</li>
              </ul>
            </div>
          ),
        });
      }
    } catch (error) {
      console.error('Error generating coupons:', error);
      message.error('Failed to generate coupons');
    } finally {
      setGenerationLoading(false);
    }
  };

  // Generator field change handler
  const handleGeneratorFieldChange = (field: keyof GeneratorFields, value: any) => {
    setGeneratorFields(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Generate books from range
  const generateBooksFromRange = () => {
    if (!generatorFields.firstCouponId || !generatorFields.numberOfBooks || !generatorFields.couponsPerBook) {
      message.error('Please fill in all required fields');
      return;
    }

    const { firstCouponId, numberOfBooks, couponsPerBook } = generatorFields;
    
    // Validate coupon format first
    if (!validateCouponFormat(firstCouponId)) {
      message.error(`Invalid coupon format: ${firstCouponId}. Expected format: [AA–ZZ][000–999][AA–ZZ][000000–999999]`);
      return;
    }
    
    try {
      const books = [];
      let currentCoupon = firstCouponId;
      
      for (let i = 0; i < numberOfBooks; i++) {
        const bookFirstCoupon = currentCoupon;
        
        // Calculate last coupon for this book
        let bookLastCoupon = currentCoupon;
        for (let j = 1; j < couponsPerBook; j++) {
          bookLastCoupon = incrementCoupon(bookLastCoupon);
        }
        
        books.push({
          bookId: `Book ${i + 1}`,
          firstCouponId: bookFirstCoupon,
          lastCouponId: bookLastCoupon,
          numberOfCoupons: couponsPerBook,
        });
        
        // Set next book's first coupon
        if (i < numberOfBooks - 1) {
          currentCoupon = incrementCoupon(bookLastCoupon);
        }
      }
      
      setCalculatedBooks(books);
      message.success(`Generated ${books.length} books successfully!`);
    } catch (error) {
      console.error('Error generating books:', error);
      message.error('Failed to generate books. Please check the coupon format.');
    }
  };

  // Handle generate books (for compatibility)
  const handleGenerateBooks = () => {
    generateBooksFromRange();
  };

  // Save generated books to backend
  const handleSaveGeneratedBooks = async () => {
    if (!selectedBox || calculatedBooks.length === 0) {
      message.error('No books to save');
      return;
    }

    try {
      setLoading(true);
      const response = await apiClient.post(`/boxes/${selectedBox.id}/generate-coupons/`, {
        books: calculatedBooks
      });
      
      if (response.status === 200) {
        message.success('Books saved to backend successfully!');
        await fetchBoxReceipts(); // Refresh data
      }
    } catch (error) {
      console.error('Error saving books:', error);
      message.error('Failed to save books to backend');
    } finally {
      setLoading(false);
    }
  };

  // Handle verify and confirm
  const handleVerifyAndConfirm = async (box: BoxReceipt) => {
    try {
      setLoading(true);
      
      // Update box status to verified
      const response = await apiClient.patch(`/boxes/${box.id}/`, {
        status: 'verified',
        verification_notes: `Verified on ${new Date().toLocaleDateString()} with ${calculatedBooks.length} books generated.`,
        verified_at: new Date().toISOString(),
        verified_by: 'Current User' // This should be the actual user
      });

      if (response.status === 200) {
        message.success(`✅ Box ${box.boxId} verified and confirmed successfully!`);
        await fetchBoxReceipts(); // Refresh data
        
        // Show confirmation modal
        Modal.confirm({
          title: '🎉 Verification Complete!',
          content: (
            <div>
              <p>Box <strong>{box.boxId}</strong> has been successfully verified with:</p>
              <ul>
                <li>{calculatedBooks.length} books generated</li>
                <li>{box.totalCoupons} total coupons</li>
                <li>{box.totalLitres}L total fuel value</li>
              </ul>
              <p>Would you like to print the verification report now?</p>
            </div>
          ),
          onOk: () => handlePrintVerificationReport(box),
          okText: 'Print Report',
          cancelText: 'Later'
        });
      }
    } catch (error) {
      console.error('Error verifying box:', error);
      message.error('Failed to verify box');
    } finally {
      setLoading(false);
    }
  };

  // Handle archive box
  const handleArchiveBox = async (box: BoxReceipt) => {
    Modal.confirm({
      title: `📁 Archive Box ${box.boxId}?`,
      content: (
        <div>
          <p>Are you sure you want to archive this box?</p>
          <p><strong>Box:</strong> {box.boxId}</p>
          <p><strong>Status:</strong> {box.status}</p>
          <p><strong>Books:</strong> {box.numberOfBooks}</p>
          <p>This action will move the box to archived records.</p>
        </div>
      ),
      onOk: async () => {
        try {
          setLoading(true);
          const response = await apiClient.patch(`/boxes/${box.id}/`, {
            status: 'archived',
            archived_at: new Date().toISOString(),
            archive_reason: 'Archived after verification completion'
          });

          if (response.status === 200) {
            message.success(`📁 Box ${box.boxId} archived successfully!`);
            await fetchBoxReceipts(); // Refresh data
          }
        } catch (error) {
          console.error('Error archiving box:', error);
          message.error('Failed to archive box');
        } finally {
          setLoading(false);
        }
      },
      okText: 'Archive',
      cancelText: 'Cancel',
      okType: 'default'
    });
  };

  // Handle final confirmation
  const handleFinalConfirmation = async (box: BoxReceipt) => {
    Modal.confirm({
      title: '🏁 Final Confirmation',
      content: (
        <div>
          <Alert
            message="Complete Verification Process"
            description="This will mark the box as fully processed and ready for dispatch."
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
          <p><strong>Box ID:</strong> {box.boxId}</p>
          <p><strong>Books Generated:</strong> {calculatedBooks.length}</p>
          <p><strong>Total Coupons:</strong> {box.totalCoupons}</p>
          <p><strong>Status:</strong> Will be updated to DISPATCHED</p>
        </div>
      ),
      onOk: async () => {
        try {
          setLoading(true);
          const response = await apiClient.patch(`/boxes/${box.id}/`, {
            status: 'dispatched',
            dispatched_at: new Date().toISOString(),
            final_confirmation: true,
            confirmation_notes: `Final confirmation completed on ${new Date().toLocaleDateString()}`
          });

          if (response.status === 200) {
            message.success(`🏁 Box ${box.boxId} final confirmation completed!`);
            await fetchBoxReceipts(); // Refresh data
            
            // Auto-generate and download final report
            setTimeout(() => {
              setSelectedBoxForPrint(box);
              downloadVerificationReport();
            }, 1000);
          }
        } catch (error) {
          console.error('Error completing final confirmation:', error);
          message.error('Failed to complete final confirmation');
        } finally {
          setLoading(false);
        }
      },
      okText: 'Complete Process',
      cancelText: 'Cancel',
      okType: 'primary'
    });
  };

  // Generate verification report
  const generateVerificationReport = () => {
    if (!selectedBoxForPrint) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      message.error('Unable to open print window. Please check your browser settings.');
      return;
    }

    const reportHtml = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Box Verification Report - ${selectedBoxForPrint.boxId}</title>
        <style>
            @page {
                margin: 20mm;
                size: A4;
            }
            body {
                font-family: Arial, sans-serif;
                line-height: 1.4;
                color: #333;
                margin: 0;
                padding: 0;
            }
            .header {
                text-align: center;
                border-bottom: 2px solid #1890ff;
                padding-bottom: 20px;
                margin-bottom: 30px;
            }
            .logo {
                max-height: 80px;
                margin-bottom: 10px;
            }
            .title {
                font-size: 24px;
                font-weight: bold;
                color: #1890ff;
                margin: 10px 0;
            }
            .subtitle {
                font-size: 16px;
                color: #666;
                margin-bottom: 5px;
            }
            .section {
                margin-bottom: 25px;
            }
            .section-title {
                font-size: 18px;
                font-weight: bold;
                color: #1890ff;
                border-bottom: 1px solid #e8e8e8;
                padding-bottom: 5px;
                margin-bottom: 15px;
            }
            .info-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 15px;
                margin-bottom: 20px;
            }
            .info-item {
                display: flex;
                margin-bottom: 8px;
            }
            .info-label {
                font-weight: bold;
                min-width: 150px;
                color: #666;
            }
            .info-value {
                flex: 1;
                color: #333;
            }
            .books-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 15px;
                margin-top: 15px;
            }
            .book-card {
                border: 1px solid #d9d9d9;
                border-radius: 6px;
                padding: 12px;
                background-color: #fafafa;
            }
            .book-title {
                font-weight: bold;
                color: #1890ff;
                margin-bottom: 8px;
            }
            .book-detail {
                font-size: 12px;
                margin-bottom: 4px;
                color: #666;
            }
            .verification-checklist {
                margin-top: 20px;
            }
            .checklist-item {
                margin-bottom: 8px;
                padding: 5px 0;
                border-bottom: 1px dotted #ccc;
            }
            .status-badge {
                display: inline-block;
                padding: 2px 8px;
                border-radius: 4px;
                font-size: 12px;
                font-weight: bold;
                color: white;
                background-color: #52c41a;
            }
            .footer {
                margin-top: 40px;
                padding-top: 20px;
                border-top: 1px solid #e8e8e8;
                text-align: center;
                font-size: 12px;
                color: #666;
            }
            .signature-section {
                margin-top: 40px;
                display: grid;
                grid-template-columns: 1fr 1fr 1fr;
                gap: 40px;
            }
            .signature-box {
                text-align: center;
                border-top: 1px solid #333;
                padding-top: 10px;
                margin-top: 40px;
                font-size: 12px;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <img src="/logo.webp" alt="Parliament of Zimbabwe Logo" class="logo" />
            <div class="title">PARLIAMENT OF ZIMBABWE</div>
            <div class="subtitle">Fuel Coupon Management System</div>
            <div class="subtitle">Box Verification Report</div>
        </div>

        <div class="section">
            <div class="section-title">Box Information</div>
            <div class="info-grid">
                <div>
                    <div class="info-item">
                        <span class="info-label">Box ID:</span>
                        <span class="info-value">${selectedBoxForPrint.boxId}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Barcode:</span>
                        <span class="info-value">${selectedBoxForPrint.barcode || 'N/A'}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Supplier:</span>
                        <span class="info-value">${selectedBoxForPrint.supplier}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Status:</span>
                        <span class="status-badge">${selectedBoxForPrint.status}</span>
                    </div>
                </div>
                    <div class="info-item">
                        <span class="info-label">Fuel Type:</span>
                        <span class="info-value">${selectedBoxForPrint.fuelType}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Denomination:</span>
                        <span class="info-value">${selectedBoxForPrint.couponAmount} Litres</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Number of Books:</span>
                        <span class="info-value">${selectedBoxForPrint.numberOfBooks}</span>
                    </div>
                </div>
                <div>
                    <div class="info-item">
                        <span class="info-label">Coupons per Book:</span>
                        <span class="info-value">${selectedBoxForPrint.couponsPerBook}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Total Coupons:</span>
                        <span class="info-value">${selectedBoxForPrint.totalCoupons}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Total Litres:</span>
                        <span class="info-value">${selectedBoxForPrint.totalLitres} L</span>
                    </div>
                </div>
            </div>
        </div>

        <div class="section">
            <div class="section-title">Coupon Range</div>
            <div class="info-grid">
                <div>
                    <div class="info-item">
                        <span class="info-label">First Coupon ID:</span>
                        <span class="info-value" style="font-family: monospace;">${selectedBoxForPrint.firstCouponId}</span>
                    </div>
                </div>
                <div>
                    <div class="info-item">
                        <span class="info-label">Last Coupon ID:</span>
                        <span class="info-value" style="font-family: monospace;">${selectedBoxForPrint.lastCouponId}</span>
                    </div>
                </div>
            </div>
        </div>

        <div class="footer">
            <p>This report was generated by the Parliament of Zimbabwe Fuel Coupon Management System</p>
            <p>Generated on: ${new Date().toLocaleString()}</p>
        </div>
    </body>
    </html>
    `;

    printWindow.document.write(reportHtml);
    printWindow.document.close();
    
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    };
    
    setIsPrintModalVisible(false);
  };

  // Download verification report
  const downloadVerificationReport = () => {
    if (!selectedBoxForPrint) return;
    
    message.success('Use browser Print → Save as PDF to download the report');
    generateVerificationReport();
  };

  // Enhanced verification functions
  const handleWideVerification = async (box: BoxReceipt) => {
    setSelectedVerificationBox(box);
    setWideVerificationVisible(true);
    
    // Initialize verification status
    const initialStatus: {[key: string]: boolean} = {};
    for (let i = 1; i <= box.numberOfBooks; i++) {
      initialStatus[`book-${i}`] = false;
    }
    setBooksVerificationStatus(initialStatus);
    setSelectAllChecked(false);
    
    // Load detailed verification data
    try {
      const response = await apiClient.get(`/boxes/${box.id}/verification_details/`);
      const detailsData = response.data;
      
      // Update verification status from backend
      if (detailsData.books) {
        const backendStatus: {[key: string]: boolean} = {};
        detailsData.books.forEach((book: any, index: number) => {
          backendStatus[`book-${index + 1}`] = book.is_verified || false;
        });
        setBooksVerificationStatus(backendStatus);
        
        // Check if all books are verified
        const allVerified = Object.values(backendStatus).every(Boolean);
        setSelectAllChecked(allVerified);
      }
    } catch (error) {
      console.error('Error loading verification details:', error);
      message.error('Failed to load verification details');
    }
  };

  // Handle select all verification
  const handleSelectAllVerification = (checked: boolean) => {
    setSelectAllChecked(checked);
    
    if (!selectedVerificationBox) return;
    
    const newStatus: {[key: string]: boolean} = {};
    for (let i = 1; i <= selectedVerificationBox.numberOfBooks; i++) {
      newStatus[`book-${i}`] = checked;
    }
    setBooksVerificationStatus(newStatus);
  };

  // Handle individual book verification
  const handleIndividualBookVerification = async (bookIndex: number, verified: boolean) => {
    if (!selectedVerificationBox) return;
    
    try {
      const bookKey = `book-${bookIndex}`;
      
      // Update local state immediately for better UX
      setBooksVerificationStatus(prev => ({
        ...prev,
        [bookKey]: verified
      }));
      
      // Make API call to verify/unverify the book
      if (verified) {
        await apiClient.post(`/boxes/${selectedVerificationBox.id}/verify_book/${bookIndex}/`, {
          verification_notes: `Book ${bookIndex} verified during wide verification process`,
          verification_checks: [
            'Coupon sequence check',
            'Print quality check', 
            'Serial number validation'
          ]
        });
        message.success(`✅ Book ${bookIndex} verified`);
      } else {
        await apiClient.post(`/boxes/${selectedVerificationBox.id}/verify_book/${bookIndex}/`, {
          verified: false,
          verification_notes: `Book ${bookIndex} unverified during wide verification process`,
          verification_checks: []
        });
        message.info(`Book ${bookIndex} unverified`);
      }
      
      // Update select all status
      // Re-fetch verification details to sync state with backend
      try {
        const detailsResp = await apiClient.get(`/boxes/${selectedVerificationBox.id}/verification_details/`);
        const detailsData = detailsResp.data;
        if (detailsData.books) {
          const backendStatus: {[key: string]: boolean} = {};
          detailsData.books.forEach((book: any, index: number) => {
            backendStatus[`book-${index + 1}`] = book.is_verified || false;
          });
          setBooksVerificationStatus(backendStatus);
          const allVerified = Object.values(backendStatus).every(Boolean);
          setSelectAllChecked(allVerified);
        }
      } catch (e) {
        // Fall back to local state update if refresh fails
        const updatedStatus = {
          ...booksVerificationStatus,
          [bookKey]: verified
        };
        const allVerified = Object.values(updatedStatus).every(Boolean);
        setSelectAllChecked(allVerified);
      }
      
    } catch (error: any) {
      console.error('Error updating book verification:', error);
      message.error(error.response?.data?.error || 'Failed to update book verification');
      
      // Revert local state on error
      setBooksVerificationStatus(prev => ({
        ...prev,
        [`book-${bookIndex}`]: !verified
      }));
    }
  };

  // Handle coupon book viewer
  const handleViewCouponBook = async (box: BoxReceipt, bookIndex?: number) => {
    setSelectedBookForViewing({ 
      ...box, 
      selectedBookIndex: bookIndex || 1,
      totalPages: Math.ceil(box.couponsPerBook / 10) // 10 coupons per page
    });
    setCouponBookViewerVisible(true);
    setCurrentBookPage(1);
  };

  // Generate PDF for coupon book
  const generateCouponBookPDF = () => {
    if (!selectedBookForViewing) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      message.error('Unable to open print window. Please check your browser settings.');
      return;
    }

    const bookIndex = selectedBookForViewing.selectedBookIndex || 1;
    const startCouponNumber = selectedBookForViewing.firstCouponId ? 
      parseInt(selectedBookForViewing.firstCouponId.slice(-6)) + ((bookIndex - 1) * selectedBookForViewing.couponsPerBook) : 
      0;

    let couponsHtml = '';
    for (let i = 0; i < selectedBookForViewing.couponsPerBook; i++) {
      const couponNumber = startCouponNumber + i;
      const prefix = selectedBookForViewing.firstCouponId ? selectedBookForViewing.firstCouponId.slice(0, -6) : 'FC';
      const couponId = `${prefix}${couponNumber.toString().padStart(6, '0')}`;
      
      couponsHtml += `
        <div class="coupon" style="
          border: 2px solid #1890ff;
          border-radius: 8px;
          padding: 20px;
          margin: 10px;
          width: 300px;
          height: 200px;
          display: inline-block;
          vertical-align: top;
          position: relative;
          background: linear-gradient(135deg, #f0f8ff 0%, #e6f7ff 100%);
        ">
          <div style="text-align: center; border-bottom: 1px dashed #1890ff; padding-bottom: 10px; margin-bottom: 10px;">
            <strong style="font-size: 16px; color: #1890ff;">PARLIAMENT OF ZIMBABWE</strong><br>
            <span style="font-size: 12px; color: #666;">Fuel Coupon</span>
          </div>
          
          <div style="font-size: 24px; font-weight: bold; text-align: center; margin: 15px 0; font-family: monospace;">
            ${couponId}
          </div>
          
          <div style="font-size: 14px; margin: 10px 0;">
            <strong>Fuel Type:</strong> ${selectedBookForViewing.fuelType}<br>
            <strong>Amount:</strong> ${selectedBookForViewing.couponAmount} Litres<br>
            <strong>Book:</strong> ${bookIndex} / Coupon: ${i + 1}
          </div>
          
          <div style="position: absolute; bottom: 10px; right: 10px; font-size: 10px; color: #999;">
            ${new Date().toLocaleDateString()}
          </div>
        </div>
      `;
    }

    const reportHtml = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Coupon Book ${bookIndex} - ${selectedBookForViewing.boxId}</title>
        <style>
            @page { margin: 15mm; size: A4; }
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #1890ff; padding-bottom: 20px; }
            .coupon { page-break-inside: avoid; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1 style="margin: 0; color: #1890ff;">PARLIAMENT OF ZIMBABWE</h1>
            <h2 style="margin: 10px 0; color: #666;">Fuel Coupon Book ${bookIndex}</h2>
            <p style="margin: 5px 0;"><strong>Box ID:</strong> ${selectedBookForViewing.boxId}</p>
            <p style="margin: 5px 0;"><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
        </div>
        
        <div style="text-align: center;">
          ${couponsHtml}
        </div>
    </body>
    </html>
    `;

    printWindow.document.write(reportHtml);
    printWindow.document.close();
    
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
      }, 500);
    };
  };

  // Handle print verification report
  const handlePrintVerificationReport = (box: BoxReceipt) => {
    setSelectedBoxForPrint(box);
    setIsPrintModalVisible(true);
  };

  // Handle view box details
  const handleViewBox = (box: BoxReceipt) => {
    setSelectedBox(box);
    setViewModalVisible(true);
  };

  // Table columns for box selection
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
        </Space>
      ),
    },
    {
      title: 'Coupon Range',
      key: 'couponRange',
      width: 200,
      render: (_, record) => {
        const hasIncompleteData = !record.firstCouponId || !record.lastCouponId || !record.numberOfBooks;
        
        return (
          <Space direction="vertical" size={4} style={{ width: '100%' }}>
            {record.firstCouponId ? (
              <Text style={{ fontSize: '11px', fontFamily: 'monospace' }}>
                <strong>First:</strong> {record.firstCouponId}
              </Text>
            ) : (
              <Text type="secondary" style={{ fontSize: '11px' }}>
                <WarningOutlined style={{ color: '#faad14' }} /> First: Missing
              </Text>
            )}
            
            {record.lastCouponId ? (
              <Text style={{ fontSize: '11px', fontFamily: 'monospace' }}>
                <strong>Last:</strong> {record.lastCouponId}
              </Text>
            ) : (
              <Text type="secondary" style={{ fontSize: '11px' }}>
                <WarningOutlined style={{ color: '#faad14' }} /> Last: Missing
              </Text>
            )}
            
            {record.numberOfBooks ? (
              <Text style={{ fontSize: '11px' }}>
                <strong>Books:</strong> {record.numberOfBooks}
              </Text>
            ) : (
              <Text type="secondary" style={{ fontSize: '11px' }}>
                <WarningOutlined style={{ color: '#faad14' }} /> Books: Missing
              </Text>
            )}
            
            {hasIncompleteData && (
              <Space size={4}>
                <Button
                  type="link"
                  size="small"
                  icon={<ReloadOutlined />}
                  onClick={() => autoCompleteMissingData(record)}
                  loading={autoCompleteLoading}
                  style={{ 
                    padding: '0 4px', 
                    height: '20px',
                    fontSize: '10px',
                    color: '#1890ff'
                  }}
                >
                  Auto-fill
                </Button>
                <Button
                  type="link"
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => handleEditBox(record)}
                  style={{ 
                    padding: '0 4px', 
                    height: '20px',
                    fontSize: '10px',
                    color: '#52c41a'
                  }}
                >
                  Edit
                </Button>
              </Space>
            )}
          </Space>
        );
      },
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
      width: 280,
      render: (_, record) => (
        <Space wrap>
          <Button
            type="primary"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewBox(record)}
          >
            View
          </Button>
          <Button
            size="small"
            icon={<BarcodeOutlined />}
            onClick={() => {
              setSelectedBox(record);
              setGeneratorFields({
                calculationMode: 'first-and-count',
                firstCouponId: record.firstCouponId,
                lastCouponId: record.lastCouponId,
                numberOfBooks: record.numberOfBooks,
                couponsPerBook: record.couponsPerBook,
              });
            }}
          >
            Generate Books
          </Button>
          <Button
            type="default"
            size="small"
            icon={<SettingOutlined />}
            onClick={() => handleWideVerification(record)}
            style={{ borderColor: '#1890ff', color: '#1890ff' }}
          >
            Wide Verify
          </Button>
          <Button
            size="small"
            icon={<PrinterOutlined />}
            onClick={() => handlePrintVerificationReport(record)}
          >
            Print Report
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      {/* Header */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Title level={4}>🔍 Advanced Coupon Verification & Book Generation</Title>
          <Text type="secondary">Intelligent generation, verification, print, archive, download PDF and confirmation</Text>
        </Col>
        <Col>
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={forceRefresh}
              loading={loading}
              title="Refresh data from server"
            >
              Refresh
            </Button>
            <Button
              type="primary"
              icon={<BarcodeOutlined />}
              onClick={() => message.info('Bulk verification feature available')}
            >
              Bulk Verify
            </Button>
            <Button
              icon={<PrinterOutlined />}
              onClick={() => message.info('Batch print feature available')}
            >
              Batch Print
            </Button>
            <Button
              icon={<DownloadOutlined />}
              onClick={() => message.info('Export all reports feature available')}
            >
              Export All
            </Button>
          </Space>
        </Col>
      </Row>

      {/* Main Tabs */}
      <Tabs activeKey={activeTab} onChange={setActiveTab} style={{ marginBottom: 16 }}>
        <TabPane tab={
          <span>
            <CheckOutlined />
            Box Verification
          </span>
        } key="verification">
          {/* Quick Stats */}
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col xs={24} sm={8}>
              <Card size="small">
                <Statistic
                  title="Total Boxes"
                  value={boxReceipts.length}
                  prefix={<InboxOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card size="small">
                <Statistic
                  title="Received Boxes"
                  value={boxReceipts.filter(box => box.status === 'RECEIVED').length}
                  prefix={<ClockCircleOutlined />}
                  valueStyle={{ color: '#faad14' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card size="small">
                <Statistic
                  title="Verified Boxes"
                  value={boxReceipts.filter(box => box.status === 'VERIFIED').length}
                  prefix={<CheckOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
          </Row>

          {/* Box Selection Table */}
          <Card title="Select Box for Verification" style={{ marginBottom: 16 }}>
            <Table
              columns={columns}
              dataSource={boxReceipts}
              rowKey="id"
              loading={loading}
              scroll={{ x: 800 }}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} of ${total} boxes`,
              }}
            />
          </Card>

          {/* Enhanced Book Generator Section */}
          {selectedBox && (
            <Card
              title={
                <Space>
                  <BarcodeOutlined />
                  {`Intelligent Book Generator - ${selectedBox.boxId}`}
                </Space>
              }
              style={{ marginBottom: 16 }}
              extra={
                <Space>
                  <Tag color="blue">{selectedBox.fuelType}</Tag>
                  <Tag color="green">{selectedBox.couponAmount}L</Tag>
                  <Badge
                    status={selectedBox.status === 'VERIFIED' ? 'success' : 'processing'}
                    text={selectedBox.status}
                  />
                </Space>
              }
            >
              <Alert
                message="Book Generation Workflow"
                description="Configure the calculation method and generate coupon books for verification."
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />

              {/* Calculation Mode Selection */}
              <Card size="small" style={{ marginBottom: 16 }}>
                <Title level={5}>🔧 Calculation Mode</Title>
                <Radio.Group
                  value={calculationMode}
                  onChange={(e) => setCalculationMode(e.target.value)}
                  style={{ width: '100%' }}
                >
                  <Row gutter={[16, 16]}>
                    {calculationModes.map((mode) => (
                      <Col span={12} key={mode.mode}>
                        <Radio.Button
                          value={mode.mode}
                          style={{ width: '100%', height: 'auto', padding: '8px 12px' }}
                        >
                          <div>
                            <div style={{ fontWeight: 'bold' }}>{mode.label}</div>
                            <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                              {mode.description}
                            </div>
                          </div>
                        </Radio.Button>
                      </Col>
                    ))}
                  </Row>
                </Radio.Group>
              </Card>

              {/* Input Parameters */}
              <Card size="small" style={{ marginBottom: 16 }}>
                <Title level={5}>📊 Input Parameters</Title>
                <Row gutter={24}>
                  {(calculationMode === 'first-and-count' || calculationMode === 'first-and-last' || calculationMode === 'full-range') && (
                    <Col span={8}>
                      <Input
                        value={generatorFields.firstCouponId}
                        onChange={e => handleGeneratorFieldChange('firstCouponId', e.target.value)}
                        placeholder="First Coupon ID"
                        addonBefore="First Coupon"
                        style={{ fontFamily: 'monospace', fontSize: '14px' }}
                      />
                    </Col>
                  )}

                  {(calculationMode === 'last-and-count' || calculationMode === 'first-and-last' || calculationMode === 'full-range') && (
                    <Col span={8}>
                      <Input
                        value={generatorFields.lastCouponId}
                        onChange={e => handleGeneratorFieldChange('lastCouponId', e.target.value)}
                        placeholder="Last Coupon ID"
                        addonBefore="Last Coupon"
                        style={{ fontFamily: 'monospace', fontSize: '14px' }}
                      />
                    </Col>
                  )}

                  {(calculationMode === 'first-and-count' || calculationMode === 'last-and-count' || calculationMode === 'first-and-last') && (
                    <Col span={4}>
                      <InputNumber
                        min={1}
                        max={25}
                        value={generatorFields.numberOfBooks}
                        onChange={val => handleGeneratorFieldChange('numberOfBooks', val)}
                        placeholder="Books"
                        addonBefore="Books"
                        style={{ width: '100%' }}
                      />
                    </Col>
                  )}

                  {(calculationMode === 'first-and-count' || calculationMode === 'last-and-count') && (
                    <Col span={4}>
                      <InputNumber
                        min={1}
                        max={100}
                        value={generatorFields.couponsPerBook}
                        onChange={val => handleGeneratorFieldChange('couponsPerBook', val)}
                        placeholder="Coupons"
                        addonBefore="Coupons"
                        style={{ width: '100%' }}
                      />
                    </Col>
                  )}
                </Row>

                <Row style={{ marginTop: 16 }}>
                  <Col span={24} style={{ textAlign: 'center' }}>
                    <Button
                      type="primary"
                      size="large"
                      icon={<BarcodeOutlined />}
                      onClick={generateBooksFromRange}
                      style={{
                        borderRadius: '8px',
                        width: '300px',
                        height: '50px',
                        fontSize: '16px',
                        fontWeight: 'bold'
                      }}
                    >
                      🚀 Generate Books
                    </Button>
                  </Col>
                </Row>

                <Alert
                  type="info"
                  showIcon
                  message={calculationModes.find(m => m.mode === calculationMode)?.description}
                  style={{ marginTop: 16 }}
                />
              </Card>

              {/* Generated Books Display */}
              {calculatedBooks.length > 0 && (
                <Card size="small" style={{ marginBottom: 16 }}>
                  <Title level={5}>📚 Generated Books ({calculatedBooks.length})</Title>
                  <Row gutter={[12, 12]}>
                    {calculatedBooks.map((book, index) => (
                      <Col span={6} key={book.bookId}>
                        <Card
                          size="small"
                          style={{
                            textAlign: 'center',
                            backgroundColor: '#f6f8ff',
                            minHeight: '120px',
                            borderRadius: '8px'
                          }}
                        >
                          <div style={{
                            fontWeight: 'bold',
                            color: '#1890ff',
                            fontSize: '13px',
                            marginBottom: '6px'
                          }}>
                            {book.bookId}
                          </div>
                          <div style={{
                            fontSize: '11px',
                            fontFamily: 'Consolas, Monaco, monospace',
                            lineHeight: '1.1',
                            color: '#333',
                            wordBreak: 'break-all',
                            marginBottom: '2px'
                          }}>
                            {book.firstCouponId}
                          </div>
                          <div style={{ fontSize: '9px', color: '#999', margin: '2px 0' }}>to</div>
                          <div style={{
                            fontSize: '11px',
                            fontFamily: 'Consolas, Monaco, monospace',
                            lineHeight: '1.1',
                            color: '#333',
                            wordBreak: 'break-all',
                            marginBottom: '4px'
                          }}>
                            {book.lastCouponId}
                          </div>
                          <div style={{
                            fontSize: '10px',
                            color: '#52c41a',
                            fontWeight: '500'
                          }}>
                            {book.numberOfCoupons} coupons
                          </div>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                  
                  <Row style={{ marginTop: 16 }}>
                    <Col span={24} style={{ textAlign: 'center' }}>
                      <Space size="large">
                        <Button
                          type="primary"
                          size="large"
                          onClick={handleSaveGeneratedBooks}
                          loading={loading}
                          style={{
                            borderRadius: '8px',
                            width: '200px',
                            height: '50px',
                            fontSize: '16px',
                            fontWeight: 'bold'
                          }}
                        >
                          💾 Save Books
                        </Button>
                        <Button
                          type="default"
                          size="large"
                          icon={<CheckOutlined />}
                          onClick={() => {
                            if (selectedBox) {
                              handleVerifyAndConfirm(selectedBox);
                            }
                          }}
                          style={{
                            borderRadius: '8px',
                            width: '200px',
                            height: '50px',
                            fontSize: '16px',
                            fontWeight: 'bold',
                            borderColor: '#52c41a',
                            color: '#52c41a'
                          }}
                        >
                          ✅ Verify & Confirm
                        </Button>
                        <Button
                          type="default"
                          size="large"
                          icon={<FolderOutlined />}
                          onClick={() => {
                            if (selectedBox) {
                              handleArchiveBox(selectedBox);
                            }
                          }}
                          style={{
                            borderRadius: '8px',
                            width: '150px',
                            height: '50px',
                            fontSize: '16px',
                            fontWeight: 'bold'
                          }}
                        >
                          📁 Archive
                        </Button>
                      </Space>
                    </Col>
                  </Row>
                </Card>
              )}
            </Card>
          )}
        </TabPane>

        <TabPane tab={
          <span>
            <BarcodeOutlined />
            Coupon Generation
          </span>
        } key="generation">
          <Alert
            message="Automated Coupon Generation"
            description="Generate coupons from previously received boxes. This tab fetches first and last coupon numbers and book counts from received boxes."
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />

          {/* Generation Stats */}
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col xs={24} sm={8}>
              <Card size="small">
                <Statistic
                  title="Boxes Ready for Generation"
                  value={generationBoxes.length}
                  prefix={<InboxOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card size="small">
                <Statistic
                  title="Total Books to Generate"
                  value={generationBoxes.reduce((sum, box) => sum + box.numberOfBooks, 0)}
                  prefix={<FileTextOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card size="small">
                <Statistic
                  title="Total Coupons"
                  value={generationBoxes.reduce((sum, box) => sum + box.totalCoupons, 0)}
                  prefix={<BarcodeOutlined />}
                  valueStyle={{ color: '#faad14' }}
                />
              </Card>
            </Col>
          </Row>

          {/* Generation Boxes Table */}
          <Card title="Boxes Ready for Coupon Generation" loading={generationLoading}>
            {generationBoxes.length > 0 ? (
              <Row gutter={[16, 16]}>
                {generationBoxes.map((box) => (
                  <Col span={12} key={box.id}>
                    <Card
                      size="small"
                      title={
                        <Space>
                          <Tag color="blue">{box.fuelType}</Tag>
                          <Text strong>{box.boxId}</Text>
                        </Space>
                      }
                      extra={
                        <Button
                          type="primary"
                          size="small"
                          icon={<BarcodeOutlined />}
                          onClick={() => handleGenerateCouponsFromBox(box)}
                          loading={generationLoading}
                        >
                          Generate
                        </Button>
                      }
                      style={{ borderLeft: '4px solid #1890ff' }}
                    >
                      <Row gutter={16}>
                        <Col span={12}>
                          <Space direction="vertical" size={4}>
                            <Text type="secondary">First Coupon:</Text>
                            <Text code style={{ fontSize: '12px' }}>{box.firstCouponId}</Text>
                            <Text type="secondary">Last Coupon:</Text>
                            <Text code style={{ fontSize: '12px' }}>{box.lastCouponId}</Text>
                          </Space>
                        </Col>
                        <Col span={12}>
                          <Space direction="vertical" size={4}>
                            <Text type="secondary">Books: <Text strong>{box.numberOfBooks}</Text></Text>
                            <Text type="secondary">Coupons/Book: <Text strong>{box.couponsPerBook}</Text></Text>
                            <Text type="secondary">Total Coupons: <Text strong>{box.totalCoupons}</Text></Text>
                            <Text type="secondary">Total Litres: <Text strong>{box.totalLitres}L</Text></Text>
                          </Space>
                        </Col>
                      </Row>
                      <div style={{ marginTop: 12, padding: '8px', backgroundColor: '#f6f6f6', borderRadius: '4px' }}>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          Received: {box.receivedDate} by {box.receivedBy}
                        </Text>
                      </div>
                    </Card>
                  </Col>
                ))}
              </Row>
            ) : (
              <Alert
                message="No boxes ready for generation"
                description="All received boxes have been processed or there are no received boxes available."
                type="info"
                showIcon
              />
            )}
          </Card>
        </TabPane>
      </Tabs>

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
              <Descriptions.Item label="First Coupon ID">{selectedBox.firstCouponId}</Descriptions.Item>
              <Descriptions.Item label="Last Coupon ID">{selectedBox.lastCouponId}</Descriptions.Item>
              <Descriptions.Item label="Received By">{selectedBox.receivedBy}</Descriptions.Item>
              <Descriptions.Item label="Received Date">{selectedBox.receivedDate} {selectedBox.receivedTime}</Descriptions.Item>
              {selectedBox.verificationNotes && (
                <Descriptions.Item label="Verification Notes" span={2}>
                  {selectedBox.verificationNotes}
                </Descriptions.Item>
              )}
            </Descriptions>
          </div>
        )}
      </Modal>

      {/* Print Verification Report Modal */}
      <Modal
        title={
          <Space>
            <PrinterOutlined />
            Print Verification Report - {selectedBoxForPrint?.boxId}
          </Space>
        }
        open={isPrintModalVisible}
        onCancel={() => setIsPrintModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setIsPrintModalVisible(false)}>
            Cancel
          </Button>,
          <Button
            key="download"
            icon={<DownloadOutlined />}
            onClick={downloadVerificationReport}
          >
            Download PDF
          </Button>,
          <Button
            key="print"
            type="primary"
            icon={<PrinterOutlined />}
            onClick={generateVerificationReport}
          >
            Print Report
          </Button>,
        ]}
        width={600}
      >
        {selectedBoxForPrint && (
          <div>
            <Alert
              message="Box Verification Report"
              description="This will generate a professional verification report with the Parliament of Zimbabwe logo. You can print it directly or download as PDF."
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="Box ID">{selectedBoxForPrint.boxId}</Descriptions.Item>
              <Descriptions.Item label="Supplier">{selectedBoxForPrint.supplier}</Descriptions.Item>
              <Descriptions.Item label="Fuel Type">{selectedBoxForPrint.fuelType}</Descriptions.Item>
              <Descriptions.Item label="Total Books">{selectedBoxForPrint.numberOfBooks}</Descriptions.Item>
              <Descriptions.Item label="Coupon Amount">{selectedBoxForPrint.couponAmount} Litres</Descriptions.Item>
              <Descriptions.Item label="Total Litres">{selectedBoxForPrint.totalLitres}L</Descriptions.Item>
              <Descriptions.Item label="First Coupon">{selectedBoxForPrint.firstCouponId}</Descriptions.Item>
              <Descriptions.Item label="Last Coupon">{selectedBoxForPrint.lastCouponId}</Descriptions.Item>
            </Descriptions>

            <div style={{ marginTop: 16, textAlign: 'center' }}>
              <Text type="secondary">
                The report will include the Parliament of Zimbabwe logo and professional formatting
              </Text>
            </div>
          </div>
        )}
      </Modal>

      {/* Wide Verification Modal */}
      <Modal
        title={
          <Space>
            <SettingOutlined />
            Wide Verification - {selectedVerificationBox?.boxId}
          </Space>
        }
        open={wideVerificationVisible}
        onCancel={() => setWideVerificationVisible(false)}
        width="90%"
        style={{ top: 20 }}
        footer={[
          <Button key="cancel" onClick={() => setWideVerificationVisible(false)}>
            Close
          </Button>,
          <Button
            key="view-coupons"
            icon={<BookOutlined />}
            onClick={() => selectedVerificationBox && handleViewCouponBook(selectedVerificationBox)}
          >
            View Coupon Book
          </Button>,
          <Button
            key="verify-all"
            type="primary"
            icon={<CheckOutlined />}
            onClick={() => handleSelectAllVerification(!selectAllChecked)}
          >
            {selectAllChecked ? 'Unselect All' : 'Verify All Books'}
          </Button>,
        ]}
      >
        {selectedVerificationBox && (
          <div>
            <Alert
              message="Book-by-Book Verification"
              description={`Verify each book individually for Box ${selectedVerificationBox.boxId}. Check each book thoroughly before marking as verified.`}
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={12}>
                <Descriptions bordered column={1} size="small">
                  <Descriptions.Item label="Box ID">{selectedVerificationBox.boxId}</Descriptions.Item>
                  <Descriptions.Item label="Supplier">{selectedVerificationBox.supplier}</Descriptions.Item>
                  <Descriptions.Item label="Total Books">{selectedVerificationBox.numberOfBooks}</Descriptions.Item>
                  <Descriptions.Item label="Coupons per Book">{selectedVerificationBox.couponsPerBook}</Descriptions.Item>
                </Descriptions>
              </Col>
              <Col span={12}>
                <Card title="Verification Progress" size="small">
                  <Statistic
                    title="Books Verified"
                    value={Object.values(booksVerificationStatus).filter(Boolean).length}
                    suffix={`/ ${selectedVerificationBox.numberOfBooks}`}
                    valueStyle={{ 
                      color: Object.values(booksVerificationStatus).filter(Boolean).length === selectedVerificationBox.numberOfBooks ? '#52c41a' : '#faad14'
                    }}
                  />
                </Card>
              </Col>
            </Row>

            {/* Select All Checkbox */}
            <div style={{ marginBottom: 16, textAlign: 'center' }}>
              <Checkbox
                checked={selectAllChecked}
                onChange={(e) => handleSelectAllVerification(e.target.checked)}
                style={{ fontSize: '16px', fontWeight: 'bold' }}
              >
                Select All Books for Verification
              </Checkbox>
            </div>

            {/* Individual Book Verification */}
            <Row gutter={[16, 16]}>
              {Array.from({ length: selectedVerificationBox.numberOfBooks }, (_, index) => {
                const bookIndex = index + 1;
                const bookKey = `book-${bookIndex}`;
                const isVerified = booksVerificationStatus[bookKey] || false;
                
                return (
                  <Col key={bookIndex} xs={24} sm={12} md={8} lg={6}>
                    <Card
                      size="small"
                      title={`Book ${bookIndex}`}
                      extra={
                        <Badge 
                          status={isVerified ? "success" : "default"} 
                          text={isVerified ? "Verified" : "Pending"}
                        />
                      }
                      style={{
                        borderColor: isVerified ? '#52c41a' : '#d9d9d9',
                        backgroundColor: isVerified ? '#f6ffed' : '#ffffff'
                      }}
                    >
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <Text strong>Book {bookIndex}</Text>
                        <Text type="secondary">
                          {selectedVerificationBox.couponsPerBook} coupons
                        </Text>
                        
                        <Button
                          type={isVerified ? "default" : "primary"}
                          size="small"
                          icon={isVerified ? <CloseOutlined /> : <CheckOutlined />}
                          onClick={() => handleIndividualBookVerification(bookIndex, !isVerified)}
                          style={{ width: '100%' }}
                          danger={isVerified}
                        >
                          {isVerified ? 'Unverify' : 'Verify Book'}
                        </Button>
                        
                        <Button
                          size="small"
                          icon={<BookOutlined />}
                          onClick={() => handleViewCouponBook(selectedVerificationBox, bookIndex)}
                          style={{ width: '100%' }}
                        >
                          View Coupons
                        </Button>
                      </Space>
                    </Card>
                  </Col>
                );
              })}
            </Row>
          </div>
        )}
      </Modal>

      {/* Coupon Book Viewer Modal */}
      <Modal
        title={
          <Space>
            <BookOutlined />
            Coupon Book Viewer - Book {selectedBookForViewing?.selectedBookIndex} of {selectedBookForViewing?.boxId}
          </Space>
        }
        open={couponBookViewerVisible}
        onCancel={() => setCouponBookViewerVisible(false)}
        width="95%"
        style={{ top: 20 }}
        footer={[
          <Button key="cancel" onClick={() => setCouponBookViewerVisible(false)}>
            Close
          </Button>,
          <Button
            key="print"
            icon={<PrinterOutlined />}
            onClick={generateCouponBookPDF}
          >
            Print Book
          </Button>,
          <Button
            key="download"
            type="primary"
            icon={<FilePdfOutlined />}
            onClick={generateCouponBookPDF}
          >
            Download PDF
          </Button>,
        ]}
      >
        {selectedBookForViewing && (
          <div>
            <Alert
              message="Coupon Book Preview"
              description={`Preview of all coupons in Book ${selectedBookForViewing.selectedBookIndex}. You can print or download this book as PDF.`}
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            
            <Descriptions bordered column={4} size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="Box ID">{selectedBookForViewing.boxId}</Descriptions.Item>
              <Descriptions.Item label="Book Number">{selectedBookForViewing.selectedBookIndex}</Descriptions.Item>
              <Descriptions.Item label="Coupons per Book">{selectedBookForViewing.couponsPerBook}</Descriptions.Item>
              <Descriptions.Item label="Fuel Type">{selectedBookForViewing.fuelType}</Descriptions.Item>
            </Descriptions>

            {/* Coupon Preview Grid */}
            <div style={{ 
              maxHeight: '60vh', 
              overflowY: 'auto',
              border: '1px solid #d9d9d9',
              borderRadius: '8px',
              padding: '16px',
              backgroundColor: '#fafafa'
            }}>
              <Row gutter={[16, 16]}>
                {Array.from({ length: selectedBookForViewing.couponsPerBook }, (_, index) => {
                  const couponIndex = index + 1;
                  const bookIndex = selectedBookForViewing.selectedBookIndex || 1;
                  const startCouponNumber = selectedBookForViewing.firstCouponId ? 
                    parseInt(selectedBookForViewing.firstCouponId.slice(-6)) + ((bookIndex - 1) * selectedBookForViewing.couponsPerBook) : 
                    0;
                  const couponNumber = startCouponNumber + index;
                  const prefix = selectedBookForViewing.firstCouponId ? selectedBookForViewing.firstCouponId.slice(0, -6) : 'FC';
                  const couponId = `${prefix}${couponNumber.toString().padStart(6, '0')}`;
                  
                  return (
                    <Col key={couponIndex} xs={24} sm={12} md={8} lg={6}>
                      <Card
                        size="small"
                        style={{
                          border: '2px solid #1890ff',
                          borderRadius: '8px',
                          background: 'linear-gradient(135deg, #f0f8ff 0%, #e6f7ff 100%)',
                          textAlign: 'center'
                        }}
                      >
                        <div style={{ borderBottom: '1px dashed #1890ff', paddingBottom: '8px', marginBottom: '8px' }}>
                          <Text strong style={{ color: '#1890ff', fontSize: '12px' }}>
                            PARLIAMENT OF ZIMBABWE
                          </Text>
                          <br />
                          <Text type="secondary" style={{ fontSize: '10px' }}>
                            Fuel Coupon
                          </Text>
                        </div>
                        
                        <Text strong style={{ 
                          fontSize: '16px', 
                          fontFamily: 'monospace',
                          color: '#1890ff'
                        }}>
                          {couponId}
                        </Text>
                        
                        <div style={{ marginTop: '8px', fontSize: '11px' }}>
                          <Text>
                            <strong>Type:</strong> {selectedBookForViewing.fuelType}
                          </Text>
                          <br />
                          <Text>
                            <strong>Amount:</strong> {selectedBookForViewing.couponAmount}L
                          </Text>
                          <br />
                          <Text type="secondary">
                            Book {bookIndex} / Coupon {couponIndex}
                          </Text>
                        </div>
                        
                        <div style={{ 
                          marginTop: '8px', 
                          fontSize: '8px', 
                          color: '#999',
                          textAlign: 'right'
                        }}>
                          {new Date().toLocaleDateString()}
                        </div>
                      </Card>
                    </Col>
                  );
                })}
              </Row>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CouponVerification;
                    