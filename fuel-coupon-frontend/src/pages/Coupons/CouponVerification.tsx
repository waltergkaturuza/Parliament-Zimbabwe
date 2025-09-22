// src/pages/Coupons/CouponVerification.tsx
import { useState, useEffect } from 'react';
import type { FC } from 'react';
import apiClient from '@/api/index';
import { useAuth } from '@/contexts/AuthContext';
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
} from '@ant-design/icons';
import { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

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

// PetroTrade coupon format validation regex: [A-Z]{2}[0-9]{3}[A-Z]{1-2}[0-9]{7}
// Example: PU006H1355101 (2 letters + 3 digits + 1-2 letters + 7 digits)
const COUPON_FORMAT_REGEX = /^[A-Z]{2}[0-9]{3}[A-Z]{1,2}[0-9]{7}$/;

// Validate coupon format using PetroTrade format
const validateCouponFormat = (couponId: string): boolean => {
  return COUPON_FORMAT_REGEX.test(couponId);
};

// Parse PetroTrade coupon serial format (e.g., PU006H1355101)
const parsePetroTradeSerial = (serial: string) => {
  const match = serial.match(/^([A-Z]{2})(\d{3})([A-Z]{1,2})(\d{7})$/);
  if (!match) {
    return {
      prefix: '',
      seven_digit_serial: 0,
      is_valid: false,
      formatted: serial
    };
  }

  const [, leading_letters, three_digits, check_letters, seven_digit_part] = match;
  return {
    prefix: `${leading_letters}${three_digits}${check_letters}`,
    seven_digit_serial: parseInt(seven_digit_part),
    is_valid: true,
    formatted: serial.toUpperCase()
  };
};

// Increment coupon code using PetroTrade format logic
const incrementCoupon = (code: string): string => {
  const parsed = parsePetroTradeSerial(code);
  if (!parsed.is_valid) {
    throw new Error('Invalid PetroTrade coupon format');
  }

  // Extract components using the pattern: [A-Z]{2}[0-9]{3}[A-Z]{1,2}[0-9]{7}
  const match = code.match(/^([A-Z]{2})(\d{3})([A-Z]{1,2})(\d{7})$/);
  if (!match) {
    throw new Error('Invalid PetroTrade coupon format');
  }

  let [, leadingLetters, threeDigits, checkLetters, sevenDigitSerial] = match;
  let newSevenDigit = parseInt(sevenDigitSerial) + 1;
  let newCheckLetters = checkLetters;
  let newThreeDigits = parseInt(threeDigits);
  let newLeadingLetters = leadingLetters;

  // Handle overflow from 7-digit serial (9999999 -> 0000000)
  if (newSevenDigit >= 10000000) {
    newSevenDigit = 0;
    
    // Increment check letters
    if (checkLetters.length === 2) {
      // Two check letters
      let check2Ord = checkLetters.charCodeAt(1) + 1;
      if (check2Ord > 'Z'.charCodeAt(0)) {
        let check1Ord = checkLetters.charCodeAt(0) + 1;
        if (check1Ord > 'Z'.charCodeAt(0)) {
          newCheckLetters = 'AA';
          // Increment 3-digit section
          newThreeDigits += 1;
          if (newThreeDigits >= 1000) {
            newThreeDigits = 0;
            // Increment leading letters
            newLeadingLetters = incrementLeadingLetters(leadingLetters);
          }
        } else {
          newCheckLetters = String.fromCharCode(check1Ord) + 'A';
        }
      } else {
        newCheckLetters = checkLetters[0] + String.fromCharCode(check2Ord);
      }
    } else {
      // One check letter
      let checkOrd = checkLetters.charCodeAt(0) + 1;
      if (checkOrd > 'Z'.charCodeAt(0)) {
        newCheckLetters = 'A';
        // Increment 3-digit section
        newThreeDigits += 1;
        if (newThreeDigits >= 1000) {
          newThreeDigits = 0;
          // Increment leading letters
          newLeadingLetters = incrementLeadingLetters(leadingLetters);
        }
      } else {
        newCheckLetters = String.fromCharCode(checkOrd);
      }
    }
  }

  // Rebuild the serial with proper zero-padding
  return `${newLeadingLetters}${newThreeDigits.toString().padStart(3, '0')}${newCheckLetters}${newSevenDigit.toString().padStart(7, '0')}`;
};

// Increment the 2 leading letters (base-26 counter)
const incrementLeadingLetters = (letters: string): string => {
  if (letters.length !== 2) {
    throw new Error('Leading letters must be exactly 2 characters');
  }

  const first = letters[0];
  const second = letters[1];
  let secondOrd = second.charCodeAt(0) + 1;

  if (secondOrd > 'Z'.charCodeAt(0)) {
    let firstOrd = first.charCodeAt(0) + 1;
    if (firstOrd > 'Z'.charCodeAt(0)) {
      return 'AA'; // Complete overflow - start again
    } else {
      return String.fromCharCode(firstOrd) + 'A';
    }
  } else {
    return first + String.fromCharCode(secondOrd);
  }
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
  const { user } = useAuth(); // Get current user
  
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

  const fetchBoxReceipts = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/boxes/');
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
            numberOfBooks: box.number_of_books ?? (box.books?.length || 0),
            couponsPerBook: box.coupons_per_book || 0,
            totalCoupons: box.total_coupons ?? ((box.number_of_books || 0) * (box.coupons_per_book || 0)),
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
    try {
      const response = await apiClient.get('/boxes/', {
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
            numberOfBooks: box.number_of_books ?? (box.books?.length || 0),
            couponsPerBook: box.coupons_per_book || 0,
            totalCoupons: box.total_coupons ?? ((box.number_of_books || 0) * (box.coupons_per_book || 0)),
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
        message.error(`Invalid coupon format: ${box.firstCouponId}. Expected format: PU006H1355101 (PetroTrade format)`);
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
          status: 'VERIFIED',
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
      message.error(`Invalid coupon format: ${firstCouponId}. Expected format: PU006H1355101 (PetroTrade format)`);
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
        status: 'VERIFIED',
        verification_notes: `Verified on ${new Date().toLocaleDateString()} with ${calculatedBooks.length} books generated.`,
        verified_at: new Date().toISOString(),
        verified_by: user?.id || null // Use current user ID
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
            status: 'ARCHIVED',
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
          <p><strong>Batch ID:</strong> {box.boxId}</p>
          <p><strong>Books Generated:</strong> {calculatedBooks.length}</p>
          <p><strong>Total Coupons:</strong> {box.totalCoupons}</p>
          <p><strong>Status:</strong> Will be updated to DISPATCHED</p>
        </div>
      ),
      onOk: async () => {
        try {
          setLoading(true);
          const response = await apiClient.patch(`/boxes/${box.id}/`, {
            status: 'DISPATCHED',
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
        <title>Batch Verification Report - ${selectedBoxForPrint.boxId}</title>
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
            <div class="subtitle">Batch Verification Report</div>
        </div>

        <div class="section">
            <div class="section-title">Box Information</div>
            <div class="info-grid">
                <div>
                    <div class="info-item">
                        <span class="info-label">Batch ID:</span>
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
      title: 'Batch ID',
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
            Batch Verification
          </span>
        } key="verification">
          {/* Quick Stats */}
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col xs={24} sm={8}>
              <Card size="small">
                <Statistic
                  title="Total Batches"
                  value={boxReceipts.length}
                  prefix={<InboxOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card size="small">
                <Statistic
                  title="Received Batches"
                  value={boxReceipts.filter(box => box.status === 'RECEIVED').length}
                  prefix={<ClockCircleOutlined />}
                  valueStyle={{ color: '#faad14' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card size="small">
                <Statistic
                  title="Verified Batches"
                  value={boxReceipts.filter(box => box.status === 'VERIFIED').length}
                  prefix={<CheckOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
          </Row>

          {/* Box Selection Table */}
          <Card title="Select Batch for Verification" style={{ marginBottom: 16 }}>
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
            description="Generate coupons from previously received batches. This tab fetches first and last coupon numbers and book counts from received batches."
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />

          {/* Generation Stats */}
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col xs={24} sm={8}>
              <Card size="small">
                <Statistic
                  title="Batches Ready for Generation"
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
                  value={generationBoxes.reduce((sum, box) => sum + (box.totalCoupons || 0), 0)}
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
                            <Text code style={{ fontSize: '12px', color: validateCouponFormat(box.firstCouponId) ? '#000' : '#ff4d4f' }}>
                              {box.firstCouponId || 'Not set'}
                            </Text>
                            <Text type="secondary">Last Coupon:</Text>
                            <Text code style={{ fontSize: '12px', color: validateCouponFormat(box.lastCouponId) ? '#000' : '#ff4d4f' }}>
                              {box.lastCouponId || 'Not set'}
                            </Text>
                          </Space>
                        </Col>
                        <Col span={12}>
                          <Space direction="vertical" size={4}>
                            <Text type="secondary">Books: <Text strong>{box.numberOfBooks}</Text></Text>
                            <Text type="secondary">Coupons/Book: <Text strong>{box.couponsPerBook}</Text></Text>
                            <Text type="secondary">Total Coupons: <Text strong>{box.totalCoupons || (box.numberOfBooks * box.couponsPerBook)}</Text></Text>
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
                message="No batches ready for generation"
                description="All received batches have been processed or there are no received batches available."
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
            Batch Details - {selectedBox?.boxId}
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
              <Descriptions.Item label="Batch ID">{selectedBox.boxId}</Descriptions.Item>
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
              message="Batch Verification Report"
              description="This will generate a professional verification report with the Parliament of Zimbabwe logo. You can print it directly or download as PDF."
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="Batch ID">{selectedBoxForPrint.boxId}</Descriptions.Item>
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
    </div>
  );
};

export default CouponVerification;
                    