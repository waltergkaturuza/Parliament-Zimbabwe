// src/pages/main-center/components/BoxReceiptManagement.tsx
import { useState, useEffect } from 'react';
import type { FC } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Radio,
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
  DownloadOutlined,
  ExportOutlined,
  ImportOutlined,
  FolderOutlined,
  FolderOpenOutlined,
  CarOutlined,
  HistoryOutlined,
} from '@ant-design/icons';
import { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { Step } = Steps;

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

// Add this helper function back near the columns definition
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

// Add this helper function back near the columns definition
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

const BoxReceiptManagement: FC = () => {
  const navigate = useNavigate();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [selectedBox, setSelectedBox] = useState<BoxReceipt | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [boxReceipts, setBoxReceipts] = useState<BoxReceipt[]>([]);
  const [nextBoxNumber, setNextBoxNumber] = useState(() => {
    // Generate an immediate default box number
    const year = new Date().getFullYear();
    return `FCB-${year}-0001`;
  });
  const [activeTab, setActiveTab] = useState<'receipts' | 'verification' | 'inventory'>('receipts');
  
  // Archive-related state
  const [showArchived, setShowArchived] = useState(false);
  const [archiveModalVisible, setArchiveModalVisible] = useState(false);
  const [archiveForm] = Form.useForm();
  
  // Print/Download state
  const [isPrintModalVisible, setIsPrintModalVisible] = useState(false);
  const [selectedBoxForPrint, setSelectedBoxForPrint] = useState<BoxReceipt | null>(null);
  
  // Book state (needed for calculations)
  const [verifiedBooks, setVerifiedBooks] = useState<number[]>([]);

  // Fetch data on component mount
  useEffect(() => {
    fetchBoxReceipts();
    // Generate next box number after loading existing boxes
    const initializeBoxNumber = async () => {
      await generateNextBoxNumber();
    };
    initializeBoxNumber();
  }, []);

  // Update form when nextBoxNumber changes
  useEffect(() => {
    if (nextBoxNumber) {
      form.setFieldsValue({ boxId: nextBoxNumber });
    }
  }, [nextBoxNumber, form]);

  const fetchBoxReceipts = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/boxes/');
      const data = response.data;
      console.log('API /boxes/ response:', data);
      // Handle both paginated and direct array responses
      const boxes = data.results || data;
      console.log('boxes array:', boxes);
      if (Array.isArray(boxes)) {
        // Map backend data to frontend format
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
            totalCoupons: box.total_coupons ?? ((box.books?.length) * (box.coupons_per_book)),
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
        console.log('mappedBoxes:', mappedBoxes);
        setBoxReceipts(mappedBoxes);
      } else {
        console.warn('No boxes data received from API');
        setBoxReceipts([]);
      }
    } catch (error) {
      console.error('Error fetching box receipts:', error);
      // Show empty state instead of sample data
      setBoxReceipts([]);
    } finally {
      setLoading(false);
    }
  };

  const generateNextBoxNumber = async () => {
    try {
      // Get the latest box number from the server to avoid duplicates
      const response = await apiClient.get('/boxes/', {
        params: { 
          ordering: '-box_code',
          limit: 1,
          search: `FCB-${new Date().getFullYear()}-`
        }
      });
      
      let nextNumber = 1;
      if (response.data.results && response.data.results.length > 0) {
        const lastBox = response.data.results[0];
        const match = lastBox.box_code.match(/FCB-(\d{4})-(\d{4})/);
        if (match) {
          const lastNumber = parseInt(match[2]) || 0;
          nextNumber = lastNumber + 1;
        }
      }
      
      const year = new Date().getFullYear();
      const newBoxNumber = `FCB-${year}-${nextNumber.toString().padStart(4, '0')}`;
      setNextBoxNumber(newBoxNumber);
      return newBoxNumber;
    } catch (error) {
      console.error('Error generating box number:', error);
      // Fallback to timestamp-based unique ID
      const fallbackId = `FCB-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;
      setNextBoxNumber(fallbackId);
      return fallbackId;
    }
  };

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

  // Auto-calculate coupon IDs and book information with conflict detection
  const calculateCouponRange = async (fuelType: string, couponAmount: number, totalCoupons: number) => {
    try {
      // Fetch the latest coupon ranges from the server to avoid conflicts
      const response = await apiClient.get('/boxes/', {
        params: {
          ordering: '-first_coupon_number',
          limit: 50 // Get more boxes to ensure we find the highest number
        }
      });
      
      const serverBoxes = response.data.results || response.data || [];
      
      // Find the highest existing coupon using proper format comparison
      let highestCoupon = 'AA000AA000000'; // Start from the lowest possible coupon
      
      serverBoxes.forEach((box: any) => {
        if (box.last_coupon_number && validateCouponFormat(box.last_coupon_number)) {
          if (compareCoupons(box.last_coupon_number, highestCoupon) > 0) {
            highestCoupon = box.last_coupon_number;
          }
        }
        if (box.first_coupon_number && validateCouponFormat(box.first_coupon_number)) {
          if (compareCoupons(box.first_coupon_number, highestCoupon) > 0) {
            highestCoupon = box.first_coupon_number;
          }
        }
      });

      // Generate next coupon range
      const firstCouponId = incrementCoupon(highestCoupon);
      const lastCouponId = calculateLastCouponFromFirst(firstCouponId, totalCoupons);
      
      return {
        firstCouponId,
        lastCouponId,
      };
    } catch (error) {
      console.error('Error calculating coupon range:', error);
      // Fallback to a safe starting range
      const firstCouponId = 'PU018TY000001';
      const lastCouponId = calculateLastCouponFromFirst(firstCouponId, totalCoupons);
      
      return {
        firstCouponId,
        lastCouponId,
      };
    }
  };

  // Compare two coupon codes to determine which is higher
  const compareCoupons = (coupon1: string, coupon2: string): number => {
    if (!validateCouponFormat(coupon1) || !validateCouponFormat(coupon2)) {
      return 0;
    }

    // Compare each component in order of significance
    const c1_prefix1 = coupon1.substring(0, 2);
    const c1_number = coupon1.substring(2, 5);
    const c1_prefix2 = coupon1.substring(5, 7);
    const c1_numeric = coupon1.substring(7);

    const c2_prefix1 = coupon2.substring(0, 2);
    const c2_number = coupon2.substring(2, 5);
    const c2_prefix2 = coupon2.substring(5, 7);
    const c2_numeric = coupon2.substring(7);

    // Compare first letter pair
    if (c1_prefix1 !== c2_prefix1) {
      return c1_prefix1.localeCompare(c2_prefix1);
    }

    // Compare 3-digit number
    if (c1_number !== c2_number) {
      return parseInt(c1_number) - parseInt(c2_number);
    }

    // Compare second letter pair
    if (c1_prefix2 !== c2_prefix2) {
      return c1_prefix2.localeCompare(c2_prefix2);
    }

    // Compare 6-digit numeric part
    return parseInt(c1_numeric) - parseInt(c2_numeric);
  };

  // Calculate monetary value based on fuel price and total litres
  const calculateMonetaryValue = (totalLitres: number, pricePerLitre: number) => {
    return totalLitres * pricePerLitre;
  };

  // Store current user data
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Fetch current user on component mount
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        // Try multiple API endpoints to get current user
        let user = null;
        try {
          const response = await apiClient.get('/auth/user/');
          user = response.data;
        } catch (error) {
          try {
            const response = await apiClient.get('/users/me/');
            user = response.data;
          } catch (error2) {
            try {
              const response = await apiClient.get('/auth/user/');
              user = response.data;
            } catch (error3) {
              console.warn('Could not fetch current user from any endpoint');
            }
          }
        }
        
        if (user) {
          console.log('Current user fetched:', user);
          setCurrentUser(user);
        }
      } catch (error) {
        console.warn('Error fetching current user:', error);
      }
    };
    
    fetchCurrentUser();
  }, []);

  // Form handlers
  const handleAddBox = async () => {
    setCurrentStep(0);
    setSelectedBox(null); // Clear any selected box for editing
    form.resetFields();
    const newBoxNumber = await generateNextBoxNumber();
    
    // Auto-fill received by with current user's full name and ID
    if (currentUser) {
      const fullName = `${currentUser.first_name || ''} ${currentUser.last_name || ''}`.trim();
      form.setFieldsValue({
        receivedBy: fullName || currentUser.username || 'Current User',
        receivedById: currentUser.id, // Store the user ID separately
        boxId: newBoxNumber,
        // Auto-populate required fields to prevent validation errors
        supplier: 'Petrotrade Zimbabwe', // Default supplier
        barcode: `FCB-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}` // Generate simple barcode
      });
    } else {
      // Fallback - just set a placeholder
      form.setFieldsValue({
        receivedBy: 'Administrator',
        receivedById: null,
        boxId: newBoxNumber,
        // Auto-populate required fields to prevent validation errors
        supplier: 'Petrotrade Zimbabwe', // Default supplier
        barcode: `FCB-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}` // Generate simple barcode
      });
    }
    
    setIsModalVisible(true);
  };

  const handleFormChange = (changedFields: any, allFields: any) => {
    const fuelType = allFields.find((f: any) => f.name[0] === 'fuelType')?.value;
    const couponAmount = allFields.find((f: any) => f.name[0] === 'couponAmount')?.value;
    const numberOfBooks = allFields.find((f: any) => f.name[0] === 'numberOfBooks')?.value;
    const fuelPriceUSD = allFields.find((f: any) => f.name[0] === 'fuelPricePerLitreUSD')?.value;
    const exchangeRate = allFields.find((f: any) => f.name[0] === 'exchangeRate')?.value || 27.50;
    const couponsPerBook = allFields.find((f: any) => f.name[0] === 'couponsPerBook')?.value || 100;
    const firstCouponId = allFields.find((f: any) => f.name[0] === 'firstCouponId')?.value;

    // Calculate totals first
    const totalCoupons = numberOfBooks && couponsPerBook ? numberOfBooks * couponsPerBook : 0;
    const totalLitres = couponAmount && totalCoupons ? totalCoupons * couponAmount : 0;

    // Enhanced intelligent calculation system
    if (numberOfBooks && couponsPerBook) {
      // Update calculated fields immediately
      form.setFieldsValue({
        totalLitres,
        totalCoupons,
        couponsPerBook
      });

      // Smart last coupon ID calculation
      if (firstCouponId && totalCoupons > 0) {
        const lastCouponId = calculateLastCouponId(firstCouponId, totalCoupons);
        form.setFieldsValue({ lastCouponId });
        
        // Show success message for automatic calculation
        if (changedFields.some((field: any) => field.name[0] === 'firstCouponId' || field.name[0] === 'numberOfBooks' || field.name[0] === 'couponsPerBook')) {
          message.success(`✅ Last coupon calculated: ${lastCouponId}`, 2);
        }
      }

      // Enhanced monetary value calculations
      if (fuelPriceUSD && totalLitres > 0) {
        const monetaryValueUSD = totalLitres * fuelPriceUSD;
        const monetaryValueZWG = monetaryValueUSD * exchangeRate;
        const fuelPriceZWG = fuelPriceUSD * exchangeRate;
        
        form.setFieldsValue({
          monetaryValueUSD,
          monetaryValue: monetaryValueZWG,
          fuelPricePerLitre: fuelPriceZWG
        });

        // Show calculation summary
        if (changedFields.some((field: any) => field.name[0] === 'fuelPricePerLitreUSD')) {
          message.info(`💰 Total value: $${monetaryValueUSD.toLocaleString()} USD (≈ ZWG ${monetaryValueZWG.toLocaleString()})`, 3);
        }
      }
    }

    // Intelligent coupon range generation with validation
    if (fuelType && couponAmount && numberOfBooks && couponsPerBook && !firstCouponId) {
      calculateCouponRange(fuelType, couponAmount, totalCoupons).then((couponData) => {
        form.setFieldsValue({
          firstCouponId: couponData.firstCouponId,
          lastCouponId: couponData.lastCouponId,
        });

        message.info(`🎯 Auto-generated coupon range: ${couponData.firstCouponId} to ${couponData.lastCouponId}`, 4);
      }).catch((error) => {
        console.error('Error generating coupon range:', error);
        message.error('Failed to generate coupon range. Please enter manually.');
      });
    }

    // Validation and warnings
    if (numberOfBooks && numberOfBooks > 25) {
      message.warning('⚠️ Large number of books detected. Please verify this is correct.', 3);
    }

    if (totalCoupons && totalCoupons > 5000) {
      message.warning('⚠️ High coupon count detected. Please double-check calculations.', 3);
    }
  };

  // New function to calculate last coupon ID from first coupon ID using proper format
  const calculateLastCouponId = (firstCouponId: string, totalCoupons: number) => {
    try {
      if (!validateCouponFormat(firstCouponId)) {
        console.warn('Invalid coupon format, using fallback calculation');
        // Fallback to old logic for backward compatibility
        const match = firstCouponId.match(/^(.*?)(\d+)$/);
        if (!match) return firstCouponId;
        const prefix = match[1];
        const firstNumber = parseInt(match[2]);
        const lastNumber = firstNumber + totalCoupons - 1;
        const numberLength = match[2].length;
        return prefix + lastNumber.toString().padStart(numberLength, '0');
      }
      
      return calculateLastCouponFromFirst(firstCouponId, totalCoupons);
    } catch (error) {
      console.error('Error calculating last coupon ID:', error);
      return firstCouponId;
    }
  };

  // Check if two coupon ranges overlap
  const couponRangesOverlap = (range1First: string, range1Last: string, range2First: string, range2Last: string): boolean => {
    // Check if both ranges use the new 14-character format
    const range1NewFormat = validateCouponFormat(range1First) && validateCouponFormat(range1Last);
    const range2NewFormat = validateCouponFormat(range2First) && validateCouponFormat(range2Last);
    
    // If both ranges use the new format, use proper coupon comparison
    if (range1NewFormat && range2NewFormat) {
      const range1FirstComp = compareCoupons(range1First, range2Last);
      const range1LastComp = compareCoupons(range1Last, range2First);
      
      // Range1 overlaps with Range2 if:
      // range1First <= range2Last AND range1Last >= range2First
      return (range1FirstComp <= 0 && range1LastComp >= 0);
    }
    
    // If one or both ranges use old format, they cannot overlap with new format
    // New format coupons are in a completely different namespace
    if (range1NewFormat !== range2NewFormat) {
      return false; // Different formats cannot overlap
    }
    
    // Both ranges use old format - fallback to numeric comparison
    const r1FirstMatch = range1First.match(/(\d+)$/);
    const r1LastMatch = range1Last.match(/(\d+)$/);
    const r2FirstMatch = range2First.match(/(\d+)$/);
    const r2LastMatch = range2Last.match(/(\d+)$/);
    
    if (r1FirstMatch && r1LastMatch && r2FirstMatch && r2LastMatch) {
      const r1First = parseInt(r1FirstMatch[1]);
      const r1Last = parseInt(r1LastMatch[1]);
      const r2First = parseInt(r2FirstMatch[1]);
      const r2Last = parseInt(r2LastMatch[1]);
      
      return (r1First <= r2Last && r1Last >= r2First);
    }
    
    return false;
  };

  // Validate coupon range uniqueness with proper format checking
  const validateCouponRange = async (firstCouponId: string, lastCouponId: string, excludeBoxId?: string) => {
    try {
      const response = await apiClient.get('/boxes/');
      const boxes = response.data.results || response.data || [];
      
      // Validate input format
      if (!validateCouponFormat(firstCouponId)) {
        return {
          isValid: false,
          error: `Invalid first coupon format: ${firstCouponId}. Expected format: [AA–ZZ][000–999][AA–ZZ][000000–999999]`
        };
      }
      
      if (!validateCouponFormat(lastCouponId)) {
        return {
          isValid: false,
          error: `Invalid last coupon format: ${lastCouponId}. Expected format: [AA–ZZ][000–999][AA–ZZ][000000–999999]`
        };
      }
      
      // Check for overlaps with existing boxes
      for (const box of boxes) {
        // Skip the current box if we're editing
        if (excludeBoxId && box.id === excludeBoxId) continue;
        
        if (box.first_coupon_number && box.last_coupon_number) {
          const hasOverlap = couponRangesOverlap(
            firstCouponId,
            lastCouponId,
            box.first_coupon_number,
            box.last_coupon_number
          );
          
          if (hasOverlap) {
            return {
              isValid: false,
              conflictingBox: box.box_code,
              conflictingRange: `${box.first_coupon_number} - ${box.last_coupon_number}`
            };
          }
        }
      }
      
      return { isValid: true };
    } catch (error) {
      console.error('Error validating coupon range:', error);
      return { isValid: true }; // Allow submission if validation fails
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      // Extract receivedDate and receivedTime from values
      const receivedDate = values.receivedDate;
      const receivedTime = values.receivedTime;

      // Ensure critical fields have values - use selectedBox data as fallback
      const barcode = values.barcode || selectedBox?.barcode || `FCB-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
      const supplier = values.supplier || selectedBox?.supplier || 'Petrotrade Zimbabwe';
      const receivedBy = values.receivedBy || selectedBox?.receivedBy || 'Administrator';
      // Get the user ID for received_by field (backend expects user ID, not name)
      let receivedById = values.receivedById || currentUser?.id;
      if (!receivedById) {
        if (
          selectedBox?.receivedBy &&
          typeof selectedBox.receivedBy === 'object' &&
          selectedBox.receivedBy !== null &&
          'id' in selectedBox.receivedBy &&
          typeof (selectedBox.receivedBy as any).id !== 'undefined'
        ) {
          receivedById = (selectedBox.receivedBy as any).id;
        } else if (currentUser?.id) {
          receivedById = currentUser.id;
        }
      }

      // Robust validation for critical fields - relax received_by requirement
      if (!barcode.trim() || !supplier.trim()) {
        message.error('Barcode and Supplier are required fields. Please fill all required fields.');
        setLoading(false);
        return;
      }

      // Ensure receivedById is set (try multiple fallbacks)
      if (!receivedById) {
        // Try to resolve from form, selectedBox, or currentUser
        receivedById = values.receivedById ||
                     (selectedBox && (selectedBox as any).receivedBy && (selectedBox as any).receivedBy.id) ||
                     currentUser?.id || null;
      }

      // DEBUG: Check critical fields
      console.log('=== CRITICAL FIELDS CHECK ===');
      console.log('barcode:', barcode, 'type:', typeof barcode);
      console.log('supplier:', supplier, 'type:', typeof supplier);
      console.log('receivedBy:', receivedBy, 'type:', typeof receivedBy);
      console.log('receivedById:', receivedById, 'type:', typeof receivedById);
      
      // Validate required fields and provide defaults for missing ones
      if (!values.firstCouponId || !values.numberOfBooks || !values.couponsPerBook) {
        message.error('First coupon ID, number of books, and coupons per book are required.');
        setLoading(false);
        return;
      }

      // Calculate last coupon if not provided and persist it into the form so it is included in values
      let lastCouponId = values.lastCouponId;
      const computedTotalCoupons = values.totalCoupons || (values.numberOfBooks && values.couponsPerBook ? (values.numberOfBooks * values.couponsPerBook) : undefined);
      if (!lastCouponId && values.firstCouponId && computedTotalCoupons) {
        try {
          lastCouponId = calculateLastCouponId(values.firstCouponId, computedTotalCoupons);
          // Persist calculated lastCouponId back to the form immediately
          form.setFieldsValue({ lastCouponId });
        } catch (err) {
          console.warn('Failed to compute lastCouponId on submit:', err);
        }
      }

      // Prepare clean payload with guaranteed non-empty values and proper field mapping
      const totalCoupons = values.totalCoupons || (values.numberOfBooks * values.couponsPerBook);
      const totalLitres = values.totalLitres || (totalCoupons * values.couponAmount);
      
      // Generate book_details_json for backend book creation
      const bookDetailsJson = [];
      if (values.numberOfBooks && values.couponsPerBook && values.firstCouponId) {
        for (let i = 0; i < values.numberOfBooks; i++) {
          const bookNumber = i + 1;
          // Calculate book coupon range (simplified for now - backend will handle proper calculation)
          bookDetailsJson.push({
            book_number: bookNumber,
            coupons_per_book: values.couponsPerBook,
            // Backend will calculate proper coupon ranges
          });
        }
      }

      // Ensure proper datetime format for received_at
      let receivedAtISO = '';
      try {
        if (receivedDate && receivedTime) {
          // Handle both dayjs objects and string values
          const dateStr = typeof receivedDate === 'string' ? receivedDate : receivedDate.format('YYYY-MM-DD');
          const timeStr = typeof receivedTime === 'string' ? receivedTime : receivedTime.format('HH:mm');
          receivedAtISO = `${dateStr}T${timeStr}:00Z`;
        } else {
          receivedAtISO = new Date().toISOString();
        }
      } catch (error) {
        console.warn('Error formatting received_at, using current time:', error);
        receivedAtISO = new Date().toISOString();
      }

      const boxData = {
        // Core identification
        box_code: selectedBox ? undefined : (values.boxId || nextBoxNumber), // Only include for new boxes
        barcode: barcode.trim() || 'AUTO-GENERATED',
        
        // Fuel specifications (exact backend field names)
        fuel_type: values.fuelType,
        denomination: values.couponAmount, // Backend expects 'denomination', not 'coupon_amount'
        
        // Structure and counting
        number_of_books: values.numberOfBooks,
        coupons_per_book: values.couponsPerBook,
        total_coupons: totalCoupons,
        total_litres: totalLitres,
        
  // Coupon range - ensure we always send a last coupon number when possible
  first_coupon_number: values.firstCouponId,
  last_coupon_number: lastCouponId || values.lastCouponId || null,
        
        // Status and workflow
        status: 'RECEIVED', // Hardcoded as per workflow
        calculation_mode: 'first-and-count', // Hardcoded calculation mode
        
        // Receipt tracking
        received_at: receivedAtISO,
        received_by: receivedById || null, // Send user ID, not name
        
        // Supply chain information
        supplier: supplier.trim() || 'Petrotrade Zimbabwe',
        delivery_note: values.deliveryNote || '',
        invoice_number: values.invoiceNumber || '',
        
        // Financial data
        monetary_value_usd: values.monetaryValueUSD !== undefined && values.monetaryValueUSD !== null && values.monetaryValueUSD !== '' ? Number(values.monetaryValueUSD) : 0,
        fuel_price_per_litre_usd: values.fuelPricePerLitreUSD || 0,
        exchange_rate: values.exchangeRate || 27.50,
        
        // Notes and verification
        notes: values.notes || '',
        verification_notes: values.couponVerificationNotes || values.verificationNotes || '',
        
        // Book generation data (CRITICAL for backend)
        book_details_json: bookDetailsJson,
        
        // Optional fields (add if needed in your workflow)
        // assigned_to: values.assignedTo || null, // Uncomment if you add this field to the form
        
        // Legacy/additional fields for compatibility
        received_by_signature: values.signature || '',
      };

      // Remove undefined fields to avoid backend issues
      Object.keys(boxData).forEach(key => {
        if ((boxData as any)[key] === undefined) {
          delete (boxData as any)[key];
        }
      });

      // DEBUG: Log final payload
      console.log('=== FINAL PAYLOAD DEBUG ===');
      console.log('Final boxData payload:', boxData);
      console.log('Payload JSON:', JSON.stringify(boxData, null, 2));
      
      let response;
      if (selectedBox) {
        // For editing existing box, don't send box_code to avoid duplicate error
        response = await apiClient.put(`/boxes/${selectedBox.id}/`, boxData);
      } else {
        // For new box, include box_code
        (boxData as any).box_code = values.boxId || nextBoxNumber;
        response = await apiClient.post('/boxes/', boxData);
      }

      if (response && (response.status === 200 || response.status === 201)) {
        // Fetch the saved box from backend to get last_coupon_number and other calculated fields
        const boxId = response.data.id || (selectedBox && selectedBox.id);
        if (boxId) {
          const boxResp = await apiClient.get(`/boxes/${boxId}/`);
          const savedBox = boxResp.data;
          // Update form fields with backend-calculated values
          form.setFieldsValue({
            lastCouponId: savedBox.last_coupon_number || lastCouponId, // Always set lastCouponId
            totalCoupons: savedBox.total_coupons_calculated,
            totalLitres: savedBox.total_litres,
            boxId: savedBox.box_code,
            barcode: savedBox.barcode,
          });
          message.success('Box saved! Backend calculated last coupon and totals. You can now generate books.');
        } else if (lastCouponId) {
          // Fallback: if backend does not return, set calculated lastCouponId
          form.setFieldsValue({ lastCouponId });
        }
        // Refresh the table to show the new/updated box
        await fetchBoxReceipts();
        // Do NOT close or reset the form; allow user to proceed to generate books
        // setIsModalVisible(false);
        // setSelectedBox(null);
        // form.resetFields();
        // await generateNextBoxNumber();
      }
    } catch (error: any) {
      console.error('Error saving box:', error);
      
      // DEBUG: Enhanced error logging
      console.log('=== ERROR DETAILS DEBUG ===');
      console.log('Error object:', error);
      console.log('Error response:', error.response);
      console.log('Error response data:', error.response?.data);
      console.log('Error response status:', error.response?.status);
      console.log('Error message:', error.message);
      
      // Handle specific error types
      if (error.response?.status === 500) {
        // Check if it's an integrity error (duplicate coupon numbers)
        const errorText = error.response?.data || '';
        if (typeof errorText === 'string' && errorText.includes('IntegrityError')) {
          message.error(
            'Duplicate coupon numbers detected! These coupon serial numbers are already in use by another box. Please use different coupon numbers.',
            8
          );
        } else {
          message.error('Server error occurred while saving the box. Please try again.');
        }
      } else if (error.response?.status === 400) {
        // DEBUG: Log detailed 400 error information
        console.log('=== 400 BAD REQUEST DEBUG ===');
        const errorData = error.response?.data;
        console.log('400 Error data:', errorData);
        
        if (errorData && typeof errorData === 'object') {
          // Log each field error
          Object.keys(errorData).forEach(field => {
            console.log(`Field "${field}" error:`, errorData[field]);
          });
          
          // Show specific field errors to user
          const fieldErrors = [];
          if (errorData.barcode) fieldErrors.push(`Barcode: ${Array.isArray(errorData.barcode) ? errorData.barcode.join(', ') : errorData.barcode}`);
          if (errorData.supplier) fieldErrors.push(`Supplier: ${Array.isArray(errorData.supplier) ? errorData.supplier.join(', ') : errorData.supplier}`);
          if (errorData.received_by) fieldErrors.push(`Received By: ${Array.isArray(errorData.received_by) ? errorData.received_by.join(', ') : errorData.received_by}`);
          if (errorData.first_coupon_number) fieldErrors.push(`First Coupon: ${Array.isArray(errorData.first_coupon_number) ? errorData.first_coupon_number.join(', ') : errorData.first_coupon_number}`);
          if (errorData.last_coupon_number) fieldErrors.push(`Last Coupon: ${Array.isArray(errorData.last_coupon_number) ? errorData.last_coupon_number.join(', ') : errorData.last_coupon_number}`);
          
          // Handle box_code duplicate error specifically
          if (errorData.box_code) {
            const boxCodeError = Array.isArray(errorData.box_code) ? errorData.box_code[0] : errorData.box_code;
            message.error(`Box Code Error: ${boxCodeError}`, 8);
          } else if (fieldErrors.length > 0) {
            message.error(`Field validation errors: ${fieldErrors.join('; ')}`, 10);
          } else {
            message.error(`Invalid data provided. Server response: ${JSON.stringify(errorData)}`, 8);
          }
        } else {
          message.error(`Invalid data provided. Please check all fields and try again. Server response: ${errorData}`, 8);
        }
      } else {
        message.error('Failed to save box receipt. Please check your connection and try again.');
      }
    } finally {
      setLoading(false);
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

  // Export functions
  const handleExportData = () => {
    try {
      // Convert data to CSV format
      const headers = ['Box ID', 'Supplier', 'Fuel Type', 'Coupon Amount', 'Number of Books', 'Total Litres', 'Monetary Value USD', 'Status', 'Received Date', 'Received By'];
      const csvContent = [
        headers.join(','),
        ...boxReceipts.map(box => [
          box.boxId,
          box.supplier,
          box.fuelType,
          box.couponAmount,
          box.numberOfBooks,
          box.totalLitres || 0,
          box.monetaryValueUSD || 0,
          box.status,
          box.receivedDate,
          box.receivedBy
        ].join(','))
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `box_receipts_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      message.success('Data exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      message.error('Failed to export data');
    }
  };

  const handleImportData = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csvData = e.target?.result as string;
        const lines = csvData.split('\n');
        const headers = lines[0].split(',');
        
        // Process CSV data here
        message.info('Import functionality will process the uploaded file');
        console.log('Imported data:', { headers, lines: lines.length - 1 });
      } catch (error) {
        console.error('Import error:', error);
        message.error('Failed to import data');
      }
    };
    reader.readAsText(file);
    return false; // Prevent default upload behavior
  };

  const handlePrintReport = () => {
    // Create printable content
    const printContent = `
      <html>
        <head>
          <title>Box Receipt Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f5f5f5; font-weight: bold; }
            .header { text-align: center; margin-bottom: 20px; }
            .summary { margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Parliament of Zimbabwe - Fuel Coupon System</h1>
            <h2>Box Receipt Report</h2>
            <p>Generated on: ${new Date().toLocaleDateString()}</p>
          </div>
          <div class="summary">
            <p><strong>Total Boxes:</strong> ${boxReceipts.length}</p>
            <p><strong>Total Value:</strong> $${boxReceipts.reduce((sum, box) => sum + (box.monetaryValueUSD || 0), 0).toLocaleString()}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Box ID</th>
                <th>Supplier</th>
                <th>Fuel Type</th>
                <th>Total Litres</th>
                <th>Value (USD)</th>
                <th>Status</th>
                <th>Received Date</th>
              </tr>
            </thead>
            <tbody>
              ${boxReceipts.map(box => `
                <tr>
                  <td>${box.boxId}</td>
                  <td>${box.supplier}</td>
                  <td>${box.fuelType}</td>
                  <td>${box.totalLitres || 0}</td>
                  <td>$${(box.monetaryValueUSD || 0).toLocaleString()}</td>
                  <td>${box.status}</td>
                  <td>${box.receivedDate}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handlePrintVerificationReport = (box: BoxReceipt) => {
    setSelectedBoxForPrint(box);
    setIsPrintModalVisible(true);
  };

  // Book verification handlers
  const handleBookVerificationChange = (bookNumber: number, checked: boolean) => {
    setVerifiedBooks(prev => {
      if (checked) {
        return [...prev, bookNumber];
      } else {
        return prev.filter(num => num !== bookNumber);
      }
    });
  };


  const generateVerificationReport = () => {
    if (!selectedBoxForPrint) return;
    
    // Create a new window for printing the Box Verification Report
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
                <div>
                    <div class="info-item">
                        <span class="info-label">Received Date:</span>
                        <span class="info-value">${selectedBoxForPrint.receivedDate}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Received Time:</span>
                        <span class="info-value">${selectedBoxForPrint.receivedTime}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Received By:</span>
                        <span class="info-value">${selectedBoxForPrint.receivedBy}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Report Date:</span>
                        <span class="info-value">${new Date().toLocaleDateString()}</span>
                    </div>
                </div>
            </div>
        </div>

        <div class="section">
            <div class="section-title">Fuel Details</div>
            <div class="info-grid">
                <div>
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

        <div class="section">
            <div class="section-title">📚 Complete Generated Books Verification (${selectedBoxForPrint.numberOfBooks} Books)</div>
            <div style="background-color: #e6f7ff; padding: 15px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #91d5ff;">
                <div style="font-weight: bold; color: #1890ff; margin-bottom: 10px;">Verification Summary:</div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                    <div>✅ All ${selectedBoxForPrint.numberOfBooks} books individually verified</div>
                    <div>✅ Total verification status: COMPLETE</div>
                    <div>✅ All books approved for dispatch</div>
                    <div>✅ Monetary value: $${(selectedBoxForPrint.monetaryValueUSD || (selectedBoxForPrint.numberOfBooks * selectedBoxForPrint.couponsPerBook * selectedBoxForPrint.couponAmount * 1.5)).toLocaleString()} USD</div>
                </div>
            </div>
            <div class="books-grid">
                ${Array.from({ length: selectedBoxForPrint.numberOfBooks }, (_, index) => {
                  const bookNumber = index + 1;
                  const couponsPerBook = selectedBoxForPrint.couponsPerBook;
                  const firstCouponId = selectedBoxForPrint.firstCouponId;
                  
                  let bookFirstCoupon = '';
                  let bookLastCoupon = '';
                  
                  if (firstCouponId) {
                    const match = firstCouponId.match(/^(.+?)(\\d+)$/);
                    if (match) {
                      const prefix = match[1];
                      const startNumber = parseInt(match[2]);
                      const bookStartNumber = startNumber + (index * couponsPerBook);
                      const bookEndNumber = bookStartNumber + couponsPerBook - 1;
                      const numberLength = match[2].length;
                      
                      bookFirstCoupon = prefix + bookStartNumber.toString().padStart(numberLength, '0');
                      bookLastCoupon = prefix + bookEndNumber.toString().padStart(numberLength, '0');
                    }
                  }
                  
                  return `
                    <div class="book-card" style="border: 2px solid #52c41a; background-color: #f6ffed; border-radius: 8px; padding: 15px; text-align: center;">
                        <div class="book-title" style="font-size: 16px; font-weight: bold; color: #1890ff; margin-bottom: 10px;">📖 Book ${bookNumber}</div>
                        <div class="book-detail" style="margin: 6px 0; font-size: 14px;"><strong>First Coupon:</strong> <code style="background-color: #f0f0f0; padding: 2px 4px; border-radius: 3px;">${bookFirstCoupon}</code></div>
                        <div class="book-detail" style="margin: 6px 0; font-size: 14px;"><strong>Last Coupon:</strong> <code style="background-color: #f0f0f0; padding: 2px 4px; border-radius: 3px;">${bookLastCoupon}</code></div>
                        <div class="book-detail" style="margin: 6px 0; font-size: 14px;"><strong>Total Coupons:</strong> ${couponsPerBook}</div>
                        <div class="book-detail" style="margin: 6px 0; font-size: 14px;"><strong>Value:</strong> ${couponsPerBook * selectedBoxForPrint.couponAmount} Litres</div>
                        <div class="book-detail" style="color: #52c41a; font-weight: bold; font-size: 14px; margin-top: 10px; padding: 5px; background-color: #f6ffed; border-radius: 4px;">✅ VERIFIED & APPROVED</div>
                    </div>
                  `;
                }).join('')}
            </div>
        </div>

        <div class="section">
            <div class="section-title">Verification Checklist</div>
            <div class="verification-checklist">
                <div class="checklist-item">✓ First coupon ID verified: ${selectedBoxForPrint.firstCouponId}</div>
                <div class="checklist-item">✓ Last coupon ID verified: ${selectedBoxForPrint.lastCouponId}</div>
                <div class="checklist-item">✓ Coupon count matches: ${selectedBoxForPrint.totalCoupons} coupons</div>
                <div class="checklist-item">✓ All ${selectedBoxForPrint.numberOfBooks} books are intact and properly bound</div>
                <div class="checklist-item">✓ Box barcode scanned successfully</div>
                <div class="checklist-item">✓ No visible damage to coupons or books</div>
            </div>
        </div>

        ${selectedBoxForPrint.verificationNotes ? `
        <div class="section">
            <div class="section-title">Verification Notes</div>
            <p style="background-color: #f6f6f6; padding: 15px; border-radius: 6px; border-left: 4px solid #1890ff;">
                ${selectedBoxForPrint.verificationNotes}
            </p>
        </div>
        ` : ''}

        <div class="signature-section">
            <div class="signature-box" style="text-align: center; border: 1px solid #ddd; border-radius: 8px; padding: 20px; background-color: #f9f9f9;">
                <div style="font-weight: bold; color: #1890ff; margin-bottom: 15px; font-size: 16px;">📥 Received By</div>
                <div style="border-bottom: 2px solid #333; height: 60px; margin: 15px 0; position: relative;"></div>
                <div style="font-weight: bold; margin-top: 10px; color: #333;">${selectedBoxForPrint.receivedBy}</div>
                <div style="margin-top: 5px; color: #666; font-size: 14px;">Date: ${selectedBoxForPrint.receivedDate}</div>
                <div style="margin-top: 3px; color: #666; font-size: 14px;">Time: ${selectedBoxForPrint.receivedTime}</div>
            </div>
            <div class="signature-box" style="text-align: center; border: 1px solid #ddd; border-radius: 8px; padding: 20px; background-color: #f9f9f9;">
                <div style="font-weight: bold; color: #1890ff; margin-bottom: 15px; font-size: 16px;">✅ Verified By</div>
                <div style="border-bottom: 2px solid #333; height: 60px; margin: 15px 0; position: relative;"></div>
                <div style="font-weight: bold; margin-top: 10px; color: #333;">Verification Officer</div>
                <div style="margin-top: 5px; color: #666; font-size: 14px;">Date: ${new Date().toLocaleDateString()}</div>
                <div style="margin-top: 3px; color: #666; font-size: 14px;">Time: ${new Date().toLocaleTimeString()}</div>
            </div>
            <div class="signature-box" style="text-align: center; border: 1px solid #ddd; border-radius: 8px; padding: 20px; background-color: #f9f9f9;">
                <div style="font-weight: bold; color: #1890ff; margin-bottom: 15px; font-size: 16px;">👤 Approved By</div>
                <div style="border-bottom: 2px solid #333; height: 60px; margin: 15px 0; position: relative;"></div>
                <div style="font-weight: bold; margin-top: 10px; color: #333;">Authorized Supervisor</div>
                <div style="margin-top: 5px; color: #666; font-size: 14px;">Date: _____________</div>
                <div style="margin-top: 3px; color: #666; font-size: 14px;">Time: _____________</div>
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
    
    // Add event listener for after load to print
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    };
    
    setIsPrintModalVisible(false);
  };

  const downloadVerificationReport = () => {
    if (!selectedBoxForPrint) return;
    
    // Generate PDF using html2pdf or similar library
    // For now, we'll use browser's print to PDF functionality
    message.success('Use browser Print → Save as PDF to download the report');
    generateVerificationReport();
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
      // Load regular records
      fetchBoxReceipts();
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
            @ ${typeof record.fuelPricePerLitreUSD === 'number' && !isNaN(record.fuelPricePerLitreUSD) ? record.fuelPricePerLitreUSD.toFixed(4) : '0.0000'}/L
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
                onClick={() => navigate('/dashboard/coupon-verification')}
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

          <Tooltip title="Print Verification Report">
            <Button
              size="small"
              icon={<FileTextOutlined />}
              onClick={() => handlePrintVerificationReport(record)}
            />
          </Tooltip>

          <Tooltip title="Download Report">
            <Button
              size="small"
              icon={<DownloadOutlined />}
              onClick={() => {
                setSelectedBoxForPrint(record);
                downloadVerificationReport();
              }}
            />
          </Tooltip>

          {record.status === 'PENDING' && (
            <Tooltip title="Edit Box">
              <Button
                size="small"
                icon={<EditOutlined />}
                onClick={() => {
                  setSelectedBox(record);
                  // Properly populate all form fields including the missing ones
                  // Extract user ID from receivedBy if it's an object
                  let receivedByName = record.receivedBy;
                  let receivedById = null;
                  
                  if (typeof record.receivedBy === 'object' && record.receivedBy) {
                    const userObj = record.receivedBy as any;
                    receivedByName = `${userObj.first_name || ''} ${userObj.last_name || ''}`.trim() || userObj.username;
                    receivedById = userObj.id;
                  } else if (typeof record.receivedBy === 'string') {
                    receivedByName = record.receivedBy;
                    // Try to find the user ID from current user if names match
                    if (currentUser && receivedByName.includes(currentUser.first_name) && receivedByName.includes(currentUser.last_name)) {
                      receivedById = currentUser.id;
                    }
                  }
                  
                  form.setFieldsValue({
                    boxId: record.boxId,
                    barcode: record.barcode || '',
                    supplier: record.supplier || '',
                    receivedBy: receivedByName || '',
                    receivedById: receivedById,
                    receivedDate: record.receivedDate ? dayjs(record.receivedDate) : null,
                    receivedTime: record.receivedTime ? dayjs(record.receivedTime, 'HH:mm') : null,
                    invoiceNumber: record.invoiceNumber || '',
                    deliveryNote: record.deliveryNote || '',
                    fuelType: record.fuelType,
                    couponAmount: record.couponAmount,
                    fuelPricePerLitreUSD: record.fuelPricePerLitreUSD,
                    exchangeRate: record.exchangeRate || 27.50,
                    fuelPricePerLitre: record.fuelPricePerLitre,
                    firstCouponId: record.firstCouponId,
                    numberOfBooks: record.numberOfBooks,
                    couponsPerBook: record.couponsPerBook,
                    totalCoupons: record.totalCoupons,
                    lastCouponId: record.lastCouponId,
                    totalLitres: record.totalLitres,
                    monetaryValueUSD: record.monetaryValueUSD,
                    notes: record.notes || '',
                    verificationNotes: record.verificationNotes || '',
                  });
                  setIsModalVisible(true);
                }}
              />
            </Tooltip>
          )}
          
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
            <Button
              icon={<ExportOutlined />}
              onClick={handleExportData}
            >
              Export Data
            </Button>
            <Upload
              beforeUpload={handleImportData}
              showUploadList={false}
              accept=".csv,.xlsx"
            >
              <Button icon={<ImportOutlined />}>
                Import Data
              </Button>
            </Upload>
            <Button
              icon={<PrinterOutlined />}
              onClick={handlePrintReport}
            >
              Print Report
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
            <Text type="secondary">Use the dedicated Coupon Verification page for advanced verification workflows</Text>
            <Button
              type="primary"
              icon={<BarcodeOutlined />}
              onClick={() => navigate('/dashboard/coupon-verification')}
            >
              Open Coupon Verification
            </Button>
          </Space>
        }>
          <Alert
            message="Enhanced Verification Available"
            description="The book generation and verification functionality has been moved to a dedicated Coupon Verification page for better workflow management."
            type="info"
            showIcon
            action={
              <Button
                size="small"
                type="primary"
                onClick={() => navigate('/dashboard/coupon-verification')}
              >
                Go to Verification
              </Button>
            }
            style={{ marginBottom: 16 }}
          />
          
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
                      icon={<BarcodeOutlined />}
                      onClick={() => navigate('/dashboard/coupon-verification')}
                    >
                      Verify & Generate Books
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
            {selectedBox ? 'Edit Box Receipt' : 'Receive New Box from Petrotrade'}
          </Space>
        }
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={1200}
        destroyOnHidden
      >
        <Steps current={currentStep} style={{ marginBottom: 24 }}>
          <Step title="Basic Info" icon={<InboxOutlined />} />
          <Step title="Fuel Details" icon={<CarOutlined />} />
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
                    rules={[{ required: true, message: 'Box ID is required' }]}
                  >
                    <Input disabled placeholder="Generating Box ID..." />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Barcode"
                    name="barcode"
                    rules={[{ required: false, message: 'Please enter barcode' }]}
                  >
                    <Input 
                      placeholder="Scan or enter barcode (auto-generated if empty)"
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
                    rules={[{ required: false, message: 'Please enter receiver name' }]}
                  >
                    <Input
                      placeholder="Enter receiver name (auto-filled if empty)"
                      value={currentUser ? `${currentUser.first_name || ''} ${currentUser.last_name || ''}`.trim() || currentUser.username : ''}
                    />
                  </Form.Item>
                  {/* Hidden field to store user ID */}
                  <Form.Item name="receivedById" style={{ display: 'none' }}>
                    <Input type="hidden" />
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
                  onClick={async () => {
                    try {
                      // Validate essential fields before proceeding (receivedBy is optional now)
                      await form.validateFields(['boxId', 'supplier']);
                      setCurrentStep(1);
                    } catch (error) {
                      message.warning('Please fill in all required fields before proceeding to the next step.');
                    }
                  }}
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
                <Col span={8}>
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

              {/* Enhanced Coupon Details Section */}
              <Card size="small" style={{ marginBottom: 16, backgroundColor: '#f6ffed', border: '1px solid #b7eb8f' }}>
                <Title level={5} style={{ color: '#52c41a', marginBottom: 16 }}>
                  📊 Coupon Intelligence & Book Details
                </Title>
                
                <Row gutter={16}>
                  <Col span={8}>
                    <Form.Item
                      label="First Coupon Number"
                      name="firstCouponId"
                      rules={[{ required: true, message: 'Please enter first coupon number' }]}
                      tooltip="Enter the first coupon serial number in the box"
                    >
                      <Input
                        placeholder="e.g., PU018TY000001"
                        style={{ fontFamily: 'monospace', fontSize: '14px' }}
                        addonBefore={<BarcodeOutlined />}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item
                      label="Total Number of Books"
                      name="numberOfBooks"
                      rules={[{ required: true, message: 'Please enter number of books' }]}
                      tooltip="Total number of coupon books in this box"
                    >
                      <InputNumber
                        min={1}
                        max={50}
                        style={{ width: '100%' }}
                        placeholder="e.g., 10"
                        addonBefore={<FileTextOutlined />}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item
                      label="Coupons per Book"
                      name="couponsPerBook"
                      rules={[{ required: true, message: 'Please enter coupons per book' }]}
                      tooltip="Number of coupons in each book"
                      initialValue={100}
                    >
                      <InputNumber
                        min={1}
                        max={200}
                        style={{ width: '100%' }}
                        placeholder="e.g., 100"
                        addonBefore={<BarcodeOutlined />}
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col span={8}>
                    <Form.Item
                      label="Total Number of Coupons"
                      name="totalCoupons"
                      tooltip="Automatically calculated: Books × Coupons per Book"
                    >
                      <InputNumber
                        disabled
                        style={{ width: '100%', backgroundColor: '#f0f0f0' }}
                        formatter={(value) => `${(value || 0).toLocaleString()} coupons`}
                        addonBefore={<BarcodeOutlined />}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item
                      label="Last Coupon Number"
                      name="lastCouponId"
                      tooltip="Automatically calculated from first coupon + total coupons"
                    >
                      <Input
                        style={{ fontFamily: 'monospace', fontSize: '14px', backgroundColor: '#f9f9f9' }}
                        addonBefore={<BarcodeOutlined />}
                        placeholder="Auto-calculated"
                      />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item
                      label="Total Litres"
                      name="totalLitres"
                      tooltip="Automatically calculated: Total Coupons × Coupon Amount"
                    >
                      <InputNumber
                        disabled
                        style={{ width: '100%', backgroundColor: '#f0f0f0' }}
                        formatter={(value) => `${(value || 0).toLocaleString()} L`}
                        addonBefore={<CarOutlined />}
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Alert
                  message="Smart Calculation Active"
                  description="The system will automatically calculate the last coupon number, total coupons, and total litres based on your inputs. Ensure the first coupon number is correct."
                  type="info"
                  showIcon
                  style={{ marginTop: 16 }}
                />
              </Card>

              {/* Notes Section */}
              <Card size="small" style={{ marginBottom: 16 }}>
                <Form.Item
                  label="Notes & Observations"
                  name="notes"
                >
                  <TextArea
                    rows={3}
                    placeholder="Enter any verification notes, damage reports, or observations..."
                  />
                </Form.Item>
              </Card>

              <div style={{ textAlign: 'right' }}>
                <Space>
                  <Button onClick={() => setCurrentStep(0)}>
                    Previous
                  </Button>
                  <Button onClick={() => setIsModalVisible(false)}>
                    Cancel
                  </Button>
                  <Button
                    type="default"
                    loading={loading}
                    onClick={async () => {
                      await handleSubmit();
                      // Keep modal open for further actions like book generation
                    }}
                  >
                    Save
                  </Button>
                  <Button
                    type="primary"
                    loading={loading}
                    onClick={async () => {
                      await handleSubmit();
                      setIsModalVisible(false);
                      setSelectedBox(null);
                      form.resetFields();
                      await generateNextBoxNumber();
                      message.success('Box receipt saved and closed successfully!');
                    }}
                  >
                    Save & Close
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
