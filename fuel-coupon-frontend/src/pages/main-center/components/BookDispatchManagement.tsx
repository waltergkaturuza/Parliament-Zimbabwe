// src/pages/main-center/components/BookDispatchManagement.tsx
import { useState, useEffect } from 'react';
import type { FC } from 'react';
import { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import apiClient from '../../../api/index';
import { useAuth } from '../../../contexts/AuthContext';
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
  Radio,
  Drawer,
  List,
  Dropdown,
} from 'antd';
import {
  EnvironmentOutlined,
  BookOutlined,
  ClockCircleOutlined,
  SendOutlined,
  InboxOutlined,
  CheckOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
  EditOutlined,
  DownloadOutlined,
  PrinterOutlined,
  UserOutlined,
  DeleteOutlined,
  PlusOutlined,
  FileTextOutlined,
  EllipsisOutlined,
  ReloadOutlined,
  DollarCircleOutlined,
} from '@ant-design/icons';

// NOTE: A previous corruption placed a `const columns: ColumnsType<BookDispatch> = [...]` inside the import block.
// That caused the production esbuild error: "Expected 'as' but found 'columns'". The valid columns definition is
// located later in the file (around line ~1170). This comment documents the fix to prevent reintroduction.
// Interface definitions (restored)
interface BookDispatch {
  id?: string | number;
  dispatchId: string;
  mainCenterDispatchNumber?: string;
  subCenterId?: string | number;
  subCenterName?: string;
  dispatchedBy: string;
  dispatchedDate?: string;
  dispatchedTime?: string;
  books?: any[];
  totalBooks?: number;
  totalCoupons?: number;
  totalLitres?: number;
  totalValueUsd?: number;
  totalValue?: number;
  status?: string;
  trackingNumber?: string;
  notes?: string;
  receptionConfirmed?: boolean;
  receivedBy?: string;
  receivedDate?: string;
  receivedTime?: string;
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
  status: string;
  serialRange: string;
  bookNumber?: number;
  isVerified?: boolean;
  verifiedAt?: string;
  couponPages?: any[];
  boxInfo?: any;
  createdAt?: string;
  isGenerated?: boolean;
}

const BookDispatchManagement: FC = () => {
  const { user } = useAuth();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedDispatch, setSelectedDispatch] = useState<BookDispatch | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm(); // form for edit drawer
  // --- state & helper sections continue below ---
  const [dispatches, setDispatches] = useState<BookDispatch[]>([]);
  const [subCenters, setSubCenters] = useState<SubCenter[]>([]);
  const [availableBooks, setAvailableBooks] = useState<any[]>([]);
  const [selectedBoxCode, setSelectedBoxCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedBooks, setSelectedBooks] = useState<any[]>([]);
  const [dispatchType, setDispatchType] = useState<'BOOK' | 'PAGE'>('BOOK');
  const [partialCoupons, setPartialCoupons] = useState<Record<string, number>>({});
  const [nextDispatchNumber, setNextDispatchNumber] = useState<string>('');
  const [boxes, setBoxes] = useState<any[]>([]);
  const [bookDetailConfirmations, setBookDetailConfirmations] = useState<Record<string, boolean>>({});
  const { Title, Text } = Typography;
  const { Step } = Steps;
  const { Option } = Select;
  const { TextArea } = Input;
  const [selectedBookForDetails, setSelectedBookForDetails] = useState<AvailableBook | null>(null);
  const [bookDetailsModalVisible, setBookDetailsModalVisible] = useState(false);

  // Reconstructed loadDispatches (original block was corrupted during previous edit)
  const loadDispatches = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/dispatches/');
      const data = response.data.results || response.data || [];
      console.log('📦 Raw dispatch data from API:', data);
      console.log('🏢 Available sub-centers for name resolution:', subCenters);

      const mappedDispatches: BookDispatch[] = data.map((d: any) => {
        const books = Array.isArray(d.books) ? d.books : Array.isArray(d.book_set) ? d.book_set : Array.isArray(d.dispatched_books) ? d.dispatched_books : [];
        const apiTotalBooks = d.totalBooks || d.total_books || d.book_count;
        const apiTotalCoupons = d.totalCoupons || d.total_coupons || d.coupon_count;
        const calculatedBooks = books.length;
        const calculatedCoupons = books.reduce((sum: number, book: any) => sum + (book.numberOfCoupons || book.number_of_coupons || book.coupon_count || 0), 0);
        const totalBooks = apiTotalBooks || calculatedBooks;
        const totalCoupons = apiTotalCoupons || calculatedCoupons;
        const subCenterId = d.subCenterId || d.sub_center_id;
        const subCenterName = subCenters.find(sc => sc.id === String(subCenterId))?.name || d.subCenterName || d.sub_center_name || d.to_center?.name || (subCenterId ? `Sub-Center-${subCenterId}` : 'Unknown Sub-Center');
        let dispatcherRaw = d.dispatchedBy || d.dispatched_by || d.dispatcher || d.user;
        if (dispatcherRaw && typeof dispatcherRaw === 'object') {
          dispatcherRaw = [dispatcherRaw.first_name, dispatcherRaw.last_name].filter(Boolean).join(' ').trim() || dispatcherRaw.username || dispatcherRaw.name || `User-${dispatcherRaw.id || 'unknown'}`;
        }
        return {
          id: d.id,
          dispatchId: d.dispatchId || d.dispatch_id,
          mainCenterDispatchNumber: d.main_center_dispatch_number || d.mainCenterDispatchNumber,
          subCenterId,
            subCenterName,
          dispatchedBy: dispatcherRaw || 'Unknown',
          dispatchedDate: d.dispatchedDate || d.dispatched_date,
          dispatchedTime: d.dispatchedTime || d.dispatched_time,
          books,
          totalBooks,
          totalCoupons,
          totalLitres: d.total_litres || d.totalLitres,
          totalValueUsd: d.total_value_usd || d.totalValueUsd,
          totalValue: d.totalValue || d.total_value || 0,
          status: d.status || 'DISPATCHED',
          trackingNumber: d.trackingNumber || d.tracking_number,
          notes: d.notes || d.dispatch_notes,
          receptionConfirmed: d.receptionConfirmed || false,
        };
      });
      console.log('✅ Mapped dispatches:', mappedDispatches);
      setDispatches(mappedDispatches);
    } catch (error) {
      console.error('❌ Error loading dispatches:', error);
      message.warning('Using local dispatch data (API unavailable)');
    } finally {
      setLoading(false);
    }
  };
        

  const loadAvailableBooks = async () => {
    try {
      setLoading(true);
      
      // Build query parameters for enhanced filtering
      const params: any = { 
        ordering: '-created_at',
        page_size: 500, // Increased page size
      };
      
      // Add batch filter if selected
      if (selectedBoxCode) {
        params.box_code = selectedBoxCode;
      }

      // Try production endpoints in priority order
      let response;
      const endpoints = [
        '/books/available_for_dispatch/',       // Primary production endpoint
        '/books/',                              // Fallback with filtering
      ];

      for (const endpoint of endpoints) {
        try {
          console.log(`📚 Attempting to load books from: ${endpoint}`);
          
          const requestParams = endpoint.includes('/books/') && !endpoint.includes('available_for_dispatch') 
            ? { ...params, is_verified: true, status: 'AVAILABLE' }
            : params;
            
          response = await apiClient.get(endpoint, { params: requestParams });
          
          if (response.data && (response.data.results || response.data.length > 0 || Array.isArray(response.data))) {
            console.log(`✅ Successfully loaded books from: ${endpoint}`);
            break;
          }
        } catch (error) {
          console.warn(`❌ Failed to load from ${endpoint}:`, error);
          continue;
        }
      }

      if (!response) {
        throw new Error('All book endpoints failed');
      }

      const payload = response.data || {};
      const data = payload.results || payload || [];
      
      console.log('📚 Raw books data:', data.length, 'books loaded');

      const mapped: AvailableBook[] = (Array.isArray(data) ? data : []).map((b: any) => ({
        key: String(b.id ?? b.bookId ?? b.bookCode ?? Math.random()),
        bookId: String(b.bookCode ?? b.bookId ?? b.book_id ?? b.id ?? ''),
        boxId: String(b.boxId ?? b.box_code ?? b.boxCode ?? 'Unknown'),
        fuelType: (String(b.fuelType || b.fuel_type || '').toUpperCase() === 'PETROL' ? 'PETROL' : 'DIESEL') as 'PETROL' | 'DIESEL',
        couponAmount: (b.denomination ?? b.coupon_amount ?? 20) as 5 | 20,
        firstCouponId: String(b.firstCouponNumber ?? b.first_coupon_number ?? b.first_coupon_serial ?? b.firstCouponId ?? ''),
        lastCouponId: String(b.lastCouponNumber ?? b.last_coupon_number ?? b.last_coupon_serial ?? b.lastCouponId ?? ''),
        numberOfCoupons: Number(b.numberOfCoupons ?? b.number_of_coupons ?? b.total_coupons ?? 100),
        value: Number(b.estimatedValue ?? b.estimated_value ?? b.value ?? (Number(b.numberOfCoupons ?? 100) * Number(b.denomination ?? 20))),
        pricePerLitre: Number(b.pricePerLitre ?? b.price_per_litre ?? 1.50),
        status: 'AVAILABLE',
        // Enhanced metadata from backend
        serialRange: String(b.serialRange ?? `${b.firstCouponNumber ?? 'N/A'}-${b.lastCouponNumber ?? 'N/A'}`),
        bookNumber: Number(b.bookNumber ?? b.book_number),
        isVerified: Boolean(b.isVerified ?? b.is_verified ?? false),
        verifiedAt: b.verifiedAt ?? b.verified_at,
        couponPages: Array.isArray(b.couponPages) ? b.couponPages : [],
        boxInfo: b.boxInfo ? {
          id: b.boxInfo.id,
          code: b.boxInfo.code,
          supplier: b.boxInfo.supplier,
          receivedDate: b.boxInfo.receivedDate
        } : undefined,
        // Additional metadata for enhanced display
        createdAt: b.created_at ?? b.createdAt,
        isGenerated: Boolean(b.is_generated ?? b.isGenerated ?? false),
      }));

      console.log('📊 Books summary:', {
        total: mapped.length,
        petrol: mapped.filter(b => b.fuelType === 'PETROL').length,
        diesel: mapped.filter(b => b.fuelType === 'DIESEL').length,
        totalValue: mapped.reduce((sum, b) => sum + b.value, 0),
        totalCoupons: mapped.reduce((sum, b) => sum + b.numberOfCoupons, 0),
        fiveL: mapped.filter(b => b.couponAmount === 5).length,
        twentyL: mapped.filter(b => b.couponAmount === 20).length,
      });

      setAvailableBooks(mapped);

      // Success feedback with intelligent information
      if (mapped.length > 0) {
        const totalCoupons = mapped.reduce((sum, b) => sum + b.numberOfCoupons, 0);
        const totalValue = mapped.reduce((sum, b) => sum + b.value, 0);
        
        // Intelligent box-specific messaging
        if (selectedBoxCode) {
          const boxBooks = mapped.filter(b => b.boxId === selectedBoxCode);
          message.success(
            `📦 Box ${selectedBoxCode}: Found ${boxBooks.length} books with ${totalCoupons.toLocaleString()} coupons (ZWG ${totalValue.toLocaleString()} total value)`
          );
          
          // Show additional box insights
          if (boxBooks.length > 0) {
            const firstBook = boxBooks[0];
            const lastBook = boxBooks[boxBooks.length - 1];
            console.log(`📋 Box ${selectedBoxCode} Summary:`, {
              'First Book': `${firstBook.bookId} (${firstBook.firstCouponId}-${firstBook.lastCouponId})`,
              'Last Book': `${lastBook.bookId} (${lastBook.firstCouponId}-${lastBook.lastCouponId})`,
              'Fuel Type': firstBook.fuelType,
              'Denomination': `${firstBook.couponAmount}L`,
              'Total Books': boxBooks.length,
              'Total Coupons': totalCoupons,
              'Estimated Value': `ZWG ${totalValue.toLocaleString()}`
            });
          }
        } else {
          message.success(
            `✅ Loaded ${mapped.length} books from all boxes with ${totalCoupons.toLocaleString()} coupons (ZWG ${totalValue.toLocaleString()} total value)`
          );
        }
      } else {
        if (selectedBoxCode) {
          message.warning(`📦 Batch ${selectedBoxCode}: No available books found. All books may be already dispatched.`);
        } else {
          message.warning('⚠️ No available books found in any batch. Check filters or verify books first.');
        }
      }

    } catch (error) {
      console.error('❌ Error loading available books:', error);
      message.error('Failed to load available books from backend');
      setAvailableBooks([]);
    } finally {
      setLoading(false);
    }
  };

  const loadBoxes = async () => {
    try {
      // Try production endpoints in order
      const endpoints = [
        '/boxes/',          // Primary production endpoint
        '/box/',            // Alternative endpoint (if there's an alias)
      ];
      
      let response;
      for (const endpoint of endpoints) {
        try {
          console.log(`📦 Attempting to load boxes from: ${endpoint}`);
          response = await apiClient.get(endpoint, { 
            params: { 
              is_received: true, 
              ordering: '-box_code', 
              page_size: 200,
              status: 'VERIFIED'
            }
          });
          
          if (response.data && (response.data.results || response.data.length > 0 || Array.isArray(response.data))) {
            console.log(`✅ Successfully loaded boxes from: ${endpoint}`);
            break;
          }
        } catch (error) {
          console.warn(`❌ Failed to load from ${endpoint}:`, error);
          continue;
        }
      }

      if (!response) {
        console.warn('All box endpoints failed, using empty array');
        setBoxes([]);
        return;
      }

      const results = response.data?.results || response.data || [];
      const mapped = (Array.isArray(results) ? results : []).map((b: any) => ({
        box_code: String(b.box_code || b.boxCode || b.boxId || b.code || ''),
        id: String(b.id || ''),
        status: String(b.status || 'UNKNOWN'),
        numberOfBooks: Number(b.numberOfBooks || b.number_of_books || b.total_books || 0),
      }));
      
      console.log('📦 Mapped boxes:', mapped.length);
      setBoxes(mapped.filter(box => box.box_code && box.numberOfBooks >= 0));
    } catch (err) {
      console.error('Error loading boxes:', err);
      // Silent; filter will just not render options
      setBoxes([]);
    }
  };

  // Reload available books when box filter changes
  useEffect(() => {
    loadAvailableBooks();
  }, [selectedBoxCode]);

  const loadSubCenters = async () => {
    try {
      // Try production endpoints in order
      const endpoints = [
        '/subcenters/',         // Primary production endpoint
        '/sub-centers/',        // Alternative format (fuel app uses this as alias)
      ];
      
      let data = [];
      for (const endpoint of endpoints) {
        try {
          console.log(`🏢 Attempting to load sub-centers from: ${endpoint}`);
          const response = await apiClient.get(endpoint, {
            params: {
              ordering: 'name',
              page_size: 200,
              status: 'ACTIVE'
            }
          });
          
          const results = response.data?.results || response.data || [];
          if (Array.isArray(results) && results.length > 0) {
            console.log(`✅ Successfully loaded ${results.length} sub-centers from: ${endpoint}`);
            data = results;
            break;
          }
        } catch (error) {
          console.warn(`❌ Failed to load from ${endpoint}:`, error);
          continue;
        }
      }

      const mapped = (Array.isArray(data) ? data : []).map((subcenter: any) => ({
        id: String(subcenter.id),
        name: subcenter.name || 'Unknown Center',
        location: subcenter.location || subcenter.address || 'Unknown Location',
        officerName: subcenter.officer_in_charge?.first_name && subcenter.officer_in_charge?.last_name
          ? `${subcenter.officer_in_charge.first_name} ${subcenter.officer_in_charge.last_name}`
          : (subcenter.officerName || subcenter.officer_name || 'Unknown Officer'),
        phone: subcenter.contact_phone || subcenter.phone || subcenter.contact_number || '',
        email: subcenter.contact_email || subcenter.email || '',
        status: 'ACTIVE' as const,
      }));
      
      console.log('🏢 Mapped sub-centers:', mapped.length);
      setSubCenters(mapped);
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

  // Maintain per-book partial coupon defaults in PAGE mode
  useEffect(() => {
    if (dispatchType !== 'PAGE') return;
    setPartialCoupons(prev => {
      const next: Record<string, number> = { ...prev };
      // Ensure defaults for selected
      selectedBooks.forEach(key => {
        if (!next[key]) {
          const book = availableBooks.find(b => b.key === key);
          // Default to full available coupons for the selected book
          next[key] = Math.max(1, book?.numberOfCoupons || 100);
        }
      });
      // Remove for deselected
      Object.keys(next).forEach(key => {
        if (!selectedBooks.includes(key)) delete next[key];
      });
      return next;
    });
  }, [dispatchType, selectedBooks, availableBooks]);

  // Helper function to reset form and state when modal closes
  const handleModalClose = () => {
    setIsModalVisible(false);
    setCurrentStep(0);
    setSelectedBooks([]);
    setBookDetailConfirmations({});
    form.resetFields();
  };

  // PDF Generation Functions
  const generateDispatchPDF = (dispatch: BookDispatch) => {
    if (!dispatch) return;
    
    // Get current user name for "Received by"
    const currentUserName = user ? `${user.name || `${user.username}`}` : 'Administrator';
    
    // Create a new window for printing the Dispatch Note
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      message.error('Unable to open print window. Please check your browser settings.');
      return;
    }

    const reportHtml = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Dispatch Note - ${dispatch.dispatchId}</title>
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
            .books-table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 15px;
            }
            .books-table th,
            .books-table td {
                border: 1px solid #d9d9d9;
                padding: 8px;
                text-align: left;
            }
            .books-table th {
                background-color: #f5f5f5;
                font-weight: bold;
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
                grid-template-columns: 1fr 1fr;
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
            <div class="subtitle">Book Dispatch Note</div>
        </div>

        <div class="section">
            <div class="section-title">Dispatch Information</div>
            <div class="info-grid">
                <div>
                    <div class="info-item">
                        <span class="info-label">Dispatch ID:</span>
                        <span class="info-value">${dispatch.dispatchId}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Tracking Number:</span>
                        <span class="info-value">${dispatch.trackingNumber || 'N/A'}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Destination:</span>
                        <span class="info-value">${dispatch.subCenterName}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Status:</span>
                        <span class="status-badge">${dispatch.status}</span>
                    </div>
                </div>
                <div>
                    <div class="info-item">
                        <span class="info-label">Dispatch Date:</span>
                        <span class="info-value">${dispatch.dispatchedDate}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Dispatch Time:</span>
                        <span class="info-value">${dispatch.dispatchedTime}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Dispatched By:</span>
                        <span class="info-value">${dispatch.dispatchedBy}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Received By:</span>
                        <span class="info-value">${currentUserName}</span>
                    </div>
                </div>
            </div>
        </div>

        <div class="section">
            <div class="section-title">Sub-Center Reception</div>
            <div class="info-grid">
                <div>
                    <div class="info-item">
                        <span class="info-label">Sub-Center:</span>
                        <span class="info-value">${dispatch.subCenterName}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Reception Status:</span>
                        <span class="info-value">${dispatch.status === 'CONFIRMED' ? '✓ Confirmed' : dispatch.status === 'RECEIVED' ? 'Pending Confirmation' : 'Not Received'}</span>
                    </div>
                </div>
                <div>
                    <div class="info-item">
                        <span class="info-label">Tracking Number:</span>
                        <span class="info-value">${dispatch.trackingNumber || 'N/A'}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Dispatch Notes:</span>
                        <span class="info-value">${dispatch.notes || 'N/A'}</span>
                    </div>
                </div>
            </div>
        </div>

        <div class="section">
            <div class="section-title">Summary</div>
            <div class="info-grid">
                <div>
                    <div class="info-item">
                        <span class="info-label">Total Books:</span>
                        <span class="info-value">${dispatch.totalBooks}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Total Coupons:</span>
                        <span class="info-value">${dispatch.totalCoupons}</span>
                    </div>
                </div>
                <div>
                    <div class="info-item">
                        <span class="info-label">Total Value:</span>
                        <span class="info-value">ZWG ${(dispatch.totalValue ?? 0).toLocaleString()}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Report Generated:</span>
                        <span class="info-value">${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</span>
                    </div>
                </div>
            </div>
        </div>

        <div class="section">
            <div class="section-title">Dispatched Books</div>
            <table class="books-table">
                <thead>
                    <tr>
                        <th>Book ID</th>
                        <th>Box ID</th>
                        <th>Fuel Type</th>
                        <th>Amount</th>
                        <th>Coupons</th>
                        <th>Value</th>
                        <th>Coupon Range</th>
                    </tr>
                </thead>
                <tbody>
                    ${dispatch.books?.map(book => `
                        <tr>
                            <td>${book.bookId}</td>
                            <td>${book.boxId}</td>
                            <td>${book.fuelType}</td>
                            <td>${book.couponAmount}L</td>
                            <td>${book.numberOfCoupons}</td>
                            <td>ZWG ${book.value.toLocaleString()}</td>
                            <td>${book.firstCouponId} - ${book.lastCouponId}</td>
                        </tr>
                    `).join('') || '<tr><td colspan="7">No books available</td></tr>'}
                </tbody>
            </table>
        </div>

        ${dispatch.notes ? `
        <div class="section">
            <div class="section-title">Notes</div>
            <div style="border: 1px solid #d9d9d9; padding: 10px; border-radius: 4px; background-color: #fafafa;">
                ${dispatch.notes}
            </div>
        </div>
        ` : ''}

        <div class="signature-section">
            <div class="signature-box">
                <strong>Dispatched By</strong><br>
                ${dispatch.dispatchedBy}<br>
                Date: ${dispatch.dispatchedDate}
            </div>
            <div class="signature-box">
                <strong>Received By</strong><br>
                ${currentUserName}<br>
                Date: _________________
            </div>
        </div>

        <div class="footer">
            <p>Parliament of Zimbabwe - Fuel Coupon Management System</p>
            <p>This is an official dispatch note generated on ${new Date().toLocaleDateString()}</p>
            <p>For queries, contact the Main Center at +263 4 796006</p>
        </div>
    </body>
    </html>
    `;

    printWindow.document.write(reportHtml);
    printWindow.document.close();
    
    // Wait for content to load then trigger print
    printWindow.onload = () => {
      printWindow.print();
    };
  };

  // Normalize backend status to our strict union type
  const mapBackendStatus = (status: unknown): BookDispatch['status'] => {
    const s = String(status || '').toUpperCase();
    switch (s) {
      case 'PENDING':
      case 'DISPATCHED':
      case 'RECEIVED':
      case 'CONFIRMED':
      case 'CANCELLED':
        return s as BookDispatch['status'];
      default:
        return 'PENDING';
    }
  };

  const downloadDispatchPDF = (dispatch: BookDispatch) => {
    if (!dispatch) return;
    
    // For now, use browser's print to PDF functionality
    message.success('Use browser Print → Save as PDF to download the dispatch note');
    generateDispatchPDF(dispatch);
  };

  // Generate next dispatch number
  const generateNextDispatchNumber = () => {
    try {
      const year = new Date().getFullYear();
      const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
      const existingNumbers = dispatches
        .map(d => d.dispatchId)
        .filter(id => id.startsWith(`DSP-${year}-${month}`))
        .map(id => parseInt(id.split('-').pop() || '0'))
        .filter(num => !isNaN(num));
      
      const nextNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;
      const nextDispatchId = `DSP-${year}-${month}-${nextNumber.toString().padStart(4, '0')}`;
      
      console.log('📋 Generated dispatch number:', nextDispatchId);
      setNextDispatchNumber(nextDispatchId);
      return nextDispatchId;
    } catch (error) {
      console.error('Error generating dispatch number:', error);
      const fallback = `DSP-${new Date().getFullYear()}-${(new Date().getMonth() + 1).toString().padStart(2, '0')}-0001`;
      setNextDispatchNumber(fallback);
      return fallback;
    }
  };

  // Form handlers
  const handleAddDispatch = () => {
    try {
      console.log('🚀 Add New Dispatch button clicked');
      console.log('📊 Current state:', {
        availableBooks: availableBooks.length,
        subCenters: subCenters.length,
        user: user?.username,
        isModalVisible
      });
      
      setCurrentStep(0);
      form.resetFields();
      setSelectedBooks([]);
      setDispatchType('BOOK');
      setPartialCoupons({});
      
      try {
        generateNextDispatchNumber();
      } catch (error) {
        console.warn('Error generating dispatch number:', error);
        setNextDispatchNumber('DSP-2025-09-NEW');
      }
      
      // Auto-fill dispatched by with current user's name
      const currentUserName = user ? `${user.name || user.username}` : 'Administrator';
      
      try {
        form.setFieldsValue({
          dispatchedBy: currentUserName,
          dispatchedDate: dayjs(),
          dispatchedTime: dayjs(),
        });
      } catch (error) {
        console.warn('Error setting form values:', error);
      }
      
      console.log('✅ Opening modal with form values:', {
        dispatchedBy: currentUserName,
        nextDispatchNumber,
        beforeSetModal: isModalVisible
      });
      
      setIsModalVisible(true);
      
      console.log('✅ Modal state set to true');
      
    } catch (error) {
      console.error('❌ Error in handleAddDispatch:', error);
      alert('Error opening dispatch form. Check console for details.');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const selectedBookDetails = availableBooks.filter(book => 
        selectedBooks.includes(book.key)
      );

      // Validation: Ensure books are selected
      if (selectedBookDetails.length === 0) {
        message.error('Please select at least one book to dispatch');
        setLoading(false);
        return;
      }

      const totalBooks = selectedBookDetails.length;
      const totalCoupons = dispatchType === 'PAGE'
        ? selectedBookDetails.reduce((sum, book) => sum + Math.min(partialCoupons[book.key] || 0, book.numberOfCoupons), 0)
        : selectedBookDetails.reduce((sum, book) => sum + book.numberOfCoupons, 0);
      const totalValue = dispatchType === 'PAGE'
        ? selectedBookDetails.reduce((sum, book) => {
            const count = Math.min(partialCoupons[book.key] || 0, book.numberOfCoupons);
            const unit = (book.value / Math.max(book.numberOfCoupons, 1)) || 0;
            return sum + count * unit;
          }, 0)
        : selectedBookDetails.reduce((sum, book) => sum + book.value, 0);

      // Validation: Ensure totals are positive
      if (totalBooks === 0 || totalCoupons === 0) {
        message.error('Invalid dispatch data - no books or coupons selected');
        setLoading(false);
        return;
      }

      // Get sub-center name with fallback
      const subCenterName = subCenters.find(sc => sc.id === values.subCenterId)?.name || `Sub-Center-${values.subCenterId}`;
      
      console.log('📦 Creating dispatch with:', {
        totalBooks,
        totalCoupons,
        totalValue,
        subCenterName,
        selectedBookDetails: selectedBookDetails.length
      });

      // Local representation used for optimistic UI update
      const newDispatch: BookDispatch = {
        id: Date.now().toString(),
        dispatchId: nextDispatchNumber,
        subCenterId: values.subCenterId,
        subCenterName: subCenters.find(sc => sc.id === values.subCenterId)?.name || '',
        dispatchedBy: user ? `${user.name || user.username}` : values.dispatchedBy || 'Administrator',
        dispatchedDate: values.dispatchedDate?.format('YYYY-MM-DD') || new Date().toISOString().split('T')[0],
        dispatchedTime: values.dispatchedTime?.format('HH:mm') || new Date().toTimeString().slice(0, 5),
        books: selectedBookDetails.map(book => {
          if (dispatchType === 'PAGE') {
            const count = Math.min(partialCoupons[book.key] || 0, book.numberOfCoupons);
            const unit = (book.value / Math.max(book.numberOfCoupons, 1)) || 0;
            // derive last coupon based on count for preview/report
            const serials = generateCouponSerials(book.firstCouponId, Math.max(count, 1));
            const last = serials.length > 0 ? serials[serials.length - 1] : book.firstCouponId;
            return {
              id: book.key,
              bookId: book.bookId,
              boxId: book.boxId,
              fuelType: book.fuelType,
              couponAmount: book.couponAmount,
              firstCouponId: book.firstCouponId,
              lastCouponId: last,
              numberOfCoupons: count,
              value: count * unit,
              pricePerLitre: book.pricePerLitre,
            };
          }
          return {
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
          };
        }),
        totalBooks,
        totalCoupons,
        totalValue,
        status: 'DISPATCHED',
        receptionConfirmed: false, // Sub-center reception status
        notes: dispatchType === 'PAGE'
          ? `${values.notes || ''}\n[PAGE_DISPATCH] Per-book coupon counts: ${JSON.stringify(selectedBookDetails.map(b => ({ bookId: b.bookId, coupons: Math.min(partialCoupons[b.key] || 0, b.numberOfCoupons) })))}\n(Temporary until backend page-dispatch endpoint)`
          : values.notes,
        trackingNumber: `TRK-${new Date().getFullYear()}-${(new Date().getMonth() + 1).toString().padStart(2, '0')}${Date.now().toString().slice(-4)}`,
      };

      // Build backend payload (align with BookDispatchSerializer expectations)
      const backendPayload: any = {
        to_center: values.subCenterId, // FK id for subcenter
        status: 'DISPATCHED',
        tracking_number: `TRK-${new Date().getFullYear()}-${(new Date().getMonth() + 1).toString().padStart(2, '0')}${Date.now().toString().slice(-4)}`,
        notes: values.notes || '',
        // Pass book ids through context-friendly field (backend serializer uses context for books_data if provided)
        books_data: selectedBookDetails.map(b => ({ id: b.id || b.bookId || b.key })),
      };

      console.log('🛰️ POST /dispatches/ payload:', backendPayload);

      try {
        const response = await apiClient.post('/dispatches/', backendPayload);

        if (response.status === 200 || response.status === 201) {
          const saved = response.data;
          console.log('✅ Saved dispatch response:', saved);
          // Map response into local shape
          const mapped: BookDispatch = {
            id: saved.id,
            dispatchId: saved.dispatch_id || newDispatch.dispatchId,
            subCenterId: saved.to_center || saved.to_center_id || newDispatch.subCenterId,
            subCenterName: saved.subcenter_name || newDispatch.subCenterName,
            dispatchedBy: saved.dispatched_by?.username || newDispatch.dispatchedBy,
            dispatchedDate: saved.dispatched_date || newDispatch.dispatchedDate,
            dispatchedTime: saved.dispatched_time || newDispatch.dispatchedTime,
            books: newDispatch.books, // could re-fetch later for accuracy
            totalBooks: saved.total_books || newDispatch.totalBooks,
            totalCoupons: saved.total_coupons || newDispatch.totalCoupons,
            totalValue: saved.total_value || newDispatch.totalValue,
            status: saved.status || 'DISPATCHED',
            trackingNumber: saved.tracking_number || backendPayload.tracking_number,
            notes: saved.notes || backendPayload.notes,
            receptionConfirmed: false,
          };
          setDispatches((prev: BookDispatch[]) => [mapped, ...prev]);
          // Remove dispatched books from available books
          setAvailableBooks(prev => prev.filter(book => !selectedBooks.includes(book.key)));
          message.success('Books dispatched successfully!');
        } else {
          throw new Error('API call failed');
        }
      } catch (apiError) {
        console.error('Failed to save dispatch to backend:', apiError);
        message.error('Failed to save dispatch. Please try again.');
        return;
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

  // Delete dispatch handler for admin/superuser
  const handleDeleteDispatch = async (dispatch: BookDispatch) => {
    try {
      console.log('🗑️ Deleting dispatch:', dispatch.dispatchId);
      
      // Try API call first
      try {
        await apiClient.delete(`/dispatches/${dispatch.id}/`);
        // Remove from local state only after successful API call
        setDispatches((prev: BookDispatch[]) => prev.filter(d => d.id !== dispatch.id));
        message.success('Dispatch deleted successfully!');
      } catch (apiError) {
        console.error('Failed to delete dispatch from backend:', apiError);
        message.error('Failed to delete dispatch. Please try again.');
        return;
      }
      
      // Optionally restore books to available if needed
      if (dispatch.books && dispatch.books.length > 0) {
        console.log('📚 Restoring books to available inventory');
        // Note: In production, this should be handled by the backend
      }
      
    } catch (error) {
      console.error('Error deleting dispatch:', error);
      message.error('Failed to delete dispatch');
    }
  };

  // Check if user is admin or superuser
  const isAdminUser = () => {
    if (!user) return false;
    const role = (user as any).role || '';
    return (
      role === 'admin' ||
      role === 'superuser' ||
      (user as any).is_superuser === true ||
      user.username === 'admin' ||
      user.username === 'walter'
    );
  };

  const getStatusColor = (status: BookDispatch['status']) => {
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

  // Build row action menu items
  const getActionMenuItems = (record: BookDispatch) => {
    const items: any[] = [
      {
        key: 'view',
        label: 'View Details',
        icon: <EyeOutlined />,
        onClick: () => { setSelectedDispatch(record); setViewModalVisible(true); },
      },
      {
        key: 'edit',
        label: 'Edit Dispatch',
        icon: <EditOutlined />,
        onClick: () => { setSelectedDispatch(record); setEditModalVisible(true); },
      },
    ];
    if (record.status === 'RECEIVED') {
      items.push({
        key: 'confirm',
        label: 'Confirm Receipt',
        icon: <CheckOutlined />,
        onClick: () => handleConfirmReceipt(record),
      });
    }
    items.push(
      {
        key: 'download',
        label: 'Download PDF',
        icon: <DownloadOutlined />,
        onClick: () => downloadDispatchPDF(record),
      },
      {
        key: 'print',
        label: 'Print Dispatch Note',
        icon: <PrinterOutlined />,
        onClick: () => generateDispatchPDF(record),
      },
    );
    if (record.status === 'PENDING') {
      items.push({
        key: 'cancel',
        label: 'Cancel Dispatch',
        icon: <DeleteOutlined />,
        danger: true,
        onClick: () => {
          Modal.confirm({
            title: `Cancel dispatch ${record.dispatchId}?`,
            okText: 'Cancel Dispatch',
            okButtonProps: { danger: true },
            onOk: () => {
              setDispatches(prev => prev.filter(d => d.id !== record.id));
              message.success('Dispatch cancelled');
            },
          });
        },
      });
    }
    if (isAdminUser()) {
      items.push({
        type: 'divider',
      } as any);
      items.push({
        key: 'delete',
        label: 'Delete Permanently',
        icon: <DeleteOutlined style={{ color: '#ff4d4f' }} />,
        danger: true,
        onClick: () => {
          Modal.confirm({
            title: `Delete dispatch ${record.dispatchId}?`,
            content: 'This action cannot be undone.',
            okText: 'Delete',
            okButtonProps: { danger: true },
            onOk: () => handleDeleteDispatch(record),
          });
        },
      });
    }
    return items;
  };

  const columns: ColumnsType<BookDispatch> = [
    // 1. Dispatch ID
    {
      title: 'Dispatch ID',
      dataIndex: 'dispatchId',
      key: 'dispatchId',
      fixed: 'left',
      width: 160,
      render: (text, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{text}</Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>{record.trackingNumber}</Text>
          {record.mainCenterDispatchNumber && (
            <Text type="secondary" style={{ fontSize: '11px' }}>#{record.mainCenterDispatchNumber}</Text>
          )}
        </Space>
      ),
    },
    // 2. Books & Coupons
    {
      title: 'Books & Coupons',
      key: 'inventory',
      width: 155,
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text><BookOutlined /> {record.totalBooks || 0} Books</Text>
          <Text style={{ fontSize: '12px' }}>{record.totalCoupons || 0} Coupons</Text>
        </Space>
      ),
    },
    // 3. Sub Center
    {
      title: 'Sub Center',
      key: 'subCenter',
      width: 190,
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{record.subCenterName}</Text>
          <Text type="secondary" style={{ fontSize: '12px' }}><EnvironmentOutlined /> {record.subCenterId}</Text>
        </Space>
      ),
    },
    // 4. Dispatch Details
    {
      title: 'Dispatch Details',
      key: 'dispatchDetails',
      width: 180,
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text style={{ fontSize: '12px' }}><UserOutlined /> {typeof record.dispatchedBy === 'object' ? '[object]' : (record.dispatchedBy || 'N/A')}</Text>
          <Text style={{ fontSize: '12px' }}><ClockCircleOutlined /> {record.dispatchedDate} {record.dispatchedTime}</Text>
        </Space>
      ),
    },
    // 5. Litres
    {
      title: 'Litres',
      key: 'totalLitres',
      width: 95,
      align: 'right',
      render: (_, record) => <Text>{record.totalLitres ?? 0} L</Text>,
    },
    // 6. USD Value
    {
      title: 'Value (USD)',
      key: 'totalValueUsd',
      width: 120,
      align: 'right',
      render: (_, record) => (
        <Text strong>${(record.totalValueUsd ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
      ),
    },
    // 7. ZW Value
    {
      title: 'Value (ZWG)',
      dataIndex: 'totalValue',
      key: 'totalValue',
      width: 120,
      align: 'right',
      render: (value) => <Text strong>ZWG {(value || 0).toLocaleString()}</Text>,
    },
    // 8. Reception Status (absorbs overall status)
    {
      title: 'Reception Status',
      key: 'reception',
      width: 170,
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Badge
            status={record.status === 'CONFIRMED' ? 'success' : record.status === 'RECEIVED' ? 'processing' : record.status === 'DISPATCHED' ? 'warning' : 'default'}
            text={
              record.status === 'CONFIRMED'
                ? 'Confirmed'
                : record.status === 'RECEIVED'
                  ? 'Pending Confirmation'
                  : record.status === 'DISPATCHED'
                    ? 'Dispatched'
                    : 'Not Received'
            }
          />
          {record.status === 'CONFIRMED' && (
            <Text style={{ fontSize: '11px', color: '#52c41a' }}>✓ Sub-Center Confirmed</Text>
          )}
        </Space>
      ),
    },
    // 9. Actions (compact dropdown)
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 70,
      render: (_, record) => (
        <Dropdown
          menu={{
            items: getActionMenuItems(record).map(item => ({
              key: item.key || Math.random().toString(),
              icon: item.icon,
              danger: item.danger,
              type: item.type,
              label: (
                <span onClick={(e) => { e.preventDefault(); item.onClick && item.onClick(); }}>
                  {item.label}
                </span>
              ),
            })),
          }}
          trigger={['click']}
        >
          <Button size="small" icon={<EllipsisOutlined />} />
        </Dropdown>
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
              value={dispatches.filter(d => 
                d.status === 'DISPATCHED' || d.status === 'RECEIVED' || !d.receptionConfirmed
              ).length}
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
      <Card 
        title="Dispatch History"
        extra={
          <Button 
            onClick={() => {
              console.log('🔄 Manual refresh triggered for dispatches');
              loadDispatches();
            }}
            loading={loading}
            icon={<ReloadOutlined />}
            size="small"
          >
            Refresh
          </Button>
        }
      >
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
            {dispatchType === 'BOOK' ? <SendOutlined /> : <span>📄</span>}
            {dispatchType === 'BOOK' ? 'New Book Dispatch' : 'New Page Dispatch'}
          </Space>
        }
        open={isModalVisible}
        onCancel={handleModalClose}
        footer={null}
        width="99vw"
        style={{ top: 4 }}
        styles={{ 
          body: {
            maxHeight: '92vh', 
            overflow: 'auto',
            padding: '32px',
            minHeight: '650px'
          }
        }}
        destroyOnHidden
      >
        <div style={{ minHeight: '75vh', padding: '0 16px' }}>
          <Steps current={currentStep} style={{ marginBottom: 32 }}>
            <Step title="Sub Center" icon={<EnvironmentOutlined />} />
            <Step 
              title={dispatchType === 'PAGE' ? 'Select Source Books' : 'Select Books'} 
              icon={dispatchType === 'PAGE' ? <span>📚</span> : <BookOutlined />} 
            />
            <Step 
              title={dispatchType === 'PAGE' ? 'Pages Details' : 'Books Details'} 
              icon={dispatchType === 'PAGE' ? <span>📄</span> : <FileTextOutlined />} 
            />
            <Step title="Confirmation" icon={<CheckOutlined />} />
          </Steps>

          <Form
            form={form}
            layout="vertical"
            style={{ minHeight: '500px' }}
          >
            {currentStep === 0 && (
              <div style={{ minHeight: '400px' }}>
                {/* Dispatch Type Selection */}
                <Card 
                  size="small" 
                  style={{ 
                    marginBottom: 24, 
                    backgroundColor: dispatchType === 'PAGE' ? '#fff7e6' : '#f6ffed', 
                    border: dispatchType === 'PAGE' ? '1px solid #ffd591' : '1px solid #b7eb8f',
                    borderRadius: '8px'
                  }}
                >
                  <Space direction="vertical" style={{ width: '100%' }} size={16}>
                    <Title level={4} style={{ 
                      color: dispatchType === 'PAGE' ? '#fa8c16' : '#52c41a',
                      margin: 0
                    }}>
                      {dispatchType === 'PAGE' ? '📄 Dispatch Type - Page Mode' : '📚 Dispatch Type - Book Mode'}
                    </Title>
                    
                    <Radio.Group 
                      value={dispatchType} 
                      onChange={(e) => setDispatchType(e.target.value)} 
                      optionType="button"
                      size="large"
                    >
                      <Radio.Button value="BOOK" style={{ minWidth: '140px' }}>
                        📚 Full Book
                      </Radio.Button>
                      <Radio.Button value="PAGE" style={{ minWidth: '140px' }}>
                        📄 Coupon Pages
                      </Radio.Button>
                    </Radio.Group>
                    
                    {dispatchType === 'PAGE' && (
                      <Alert 
                        type="warning" 
                        showIcon 
                        message="Page-level dispatch (beta)" 
                        description="Select source books, then specify number of coupons to dispatch from each. The details will be saved in notes until a dedicated endpoint is added." 
                      />
                    )}
                    {dispatchType === 'BOOK' && (
                      <Alert 
                        type="info" 
                        showIcon 
                        message="Book-level dispatch" 
                        description="Select complete books to dispatch to the sub-center. All coupons in each book will be transferred." 
                      />
                    )}
                  </Space>
                </Card>

                {/* Form Fields */}
                <Row gutter={[32, 24]}>
                  <Col xs={24} sm={24} md={12} lg={8} xl={8}>
                    <Form.Item
                      label={
                        <Text strong style={{ fontSize: '15px' }}>
                          {dispatchType === 'PAGE' ? 'Page Dispatch ID' : 'Book Dispatch ID'}
                        </Text>
                      }
                      name="dispatchId"
                      initialValue={nextDispatchNumber}
                    >
                      <Input 
                        disabled 
                        size="large"
                        style={{ 
                          backgroundColor: '#f5f5f5',
                          borderColor: '#d9d9d9',
                          color: '#595959',
                          width: '100%',
                          minWidth: '200px'
                        }}
                      />
                    </Form.Item>
                  </Col>
                  
                  <Col xs={24} sm={24} md={12} lg={8} xl={8}>
                    <Form.Item
                      label={<Text strong style={{ fontSize: '15px' }}>Dispatched By</Text>}
                      name="dispatchedBy"
                      rules={[{ required: true, message: 'Please enter dispatcher name' }]}
                    >
                      <Input 
                        placeholder={`Enter ${dispatchType.toLowerCase()} dispatcher name`}
                        size="large"
                        style={{ 
                          width: '100%',
                          minWidth: '200px'
                        }}
                      />
                    </Form.Item>
                  </Col>

                  <Col xs={24} sm={24} md={12} lg={8} xl={8}>
                    <Form.Item
                      label={<Text strong style={{ fontSize: '15px' }}>Dispatch Date</Text>}
                      name="dispatchedDate"
                      initialValue={dayjs()}
                      rules={[{ required: true, message: 'Please select date' }]}
                    >
                      <DatePicker 
                        style={{ 
                          width: '100%',
                          minWidth: '200px'
                        }}
                        size="large"
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={[32, 24]}>
                  <Col xs={24} sm={24} md={12} lg={8} xl={8}>
                    <Form.Item
                      label={<Text strong style={{ fontSize: '15px' }}>Dispatch Time</Text>}
                      name="dispatchedTime"
                      initialValue={dayjs()}
                      rules={[{ required: true, message: 'Please select time' }]}
                    >
                      <TimePicker 
                        style={{ 
                          width: '100%',
                          minWidth: '200px'
                        }}
                        format="HH:mm"
                        size="large"
                      />
                    </Form.Item>
                  </Col>

                  <Col xs={24} sm={24} md={24} lg={16} xl={16}>
                    <Form.Item
                      label={
                        <Text strong style={{ fontSize: '15px' }}>
                          {dispatchType === 'PAGE' ? 'Destination Sub Center (for pages)' : 'Destination Sub Center (for books)'}
                        </Text>
                      }
                      name="subCenterId"
                      rules={[{ required: true, message: 'Please select sub center' }]}
                    >
                      <Select 
                        placeholder={`Select destination sub center for ${dispatchType.toLowerCase()} dispatch`}
                        size="large"
                        showSearch
                        style={{ 
                          width: '100%',
                          minWidth: '300px'
                        }}
                        filterOption={(input, option) =>
                          (option?.children as unknown as string)
                            ?.toLowerCase()
                            ?.includes(input.toLowerCase())
                        }
                      >
                        {subCenters.map(sc => (
                          <Option key={sc.id} value={sc.id}>
                            <div style={{ padding: '6px 0' }}>
                              <div style={{ fontWeight: 600, fontSize: '15px' }}>
                                {sc.name}
                              </div>
                              <div style={{ 
                                fontSize: '13px', 
                                color: '#8c8c8c',
                                marginTop: '3px'
                              }}>
                                📍 {sc.location} • 👤 {sc.officerName}
                              </div>
                            </div>
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>

                {/* Action Buttons */}
                <div style={{ 
                  textAlign: 'right', 
                  marginTop: 32,
                  paddingTop: 16,
                  borderTop: '1px solid #f0f0f0'
                }}>
                  <Button
                    type="primary"
                    size="large"
                    onClick={() => setCurrentStep(1)}
                    style={{ minWidth: '180px' }}
                  >
                    {dispatchType === 'PAGE' ? 'Next: Select Source Books' : 'Next: Select Books'} →
                  </Button>
                </div>
              </div>
            )}

            {currentStep === 1 && (
              <div style={{ minHeight: '500px' }}>
                <Alert
                  message={dispatchType === 'PAGE' ? 'Select Source Books for Page Dispatch' : 'Select Books for Dispatch'}
                  description={dispatchType === 'PAGE' ? 'Choose the verified books to dispatch from. You will enter coupon counts in the next step.' : 'Choose the verified books to dispatch to the selected sub-center.'}
                  type="info"
                  showIcon
                  style={{ marginBottom: 24 }}
                />

                {/* Enhanced Filters */}
                <Card 
                  title={
                    <Space>
                      <BookOutlined />
                      <Text strong>Available Books & Filters</Text>
                    </Space>
                  }
                  size="small"
                  style={{ marginBottom: 24 }}
                >
                  <Row gutter={[16, 16]}>
                    <Col xs={24} sm={8} lg={6}>
                      <Text strong>Filter by Batch:</Text>
                      <Select
                        allowClear
                        placeholder="All Batches"
                        value={selectedBoxCode}
                        onChange={(val) => {
                          setSelectedBoxCode(val);
                          if (val) {
                            // Intelligent loading: automatically show all books in the selected box
                            message.info(`🔍 Loading all books in batch ${val}...`);
                            // The loadAvailableBooks will be called by useEffect when selectedBoxCode changes
                          } else {
                            message.info('📚 Showing all available books from all batches');
                          }
                        }}
                        style={{ width: '100%', marginTop: 4 }}
                        size="large"
                      >
                        {boxes.map(b => (
                          <Option key={b.box_code} value={b.box_code}>
                            📦 {b.box_code}
                          </Option>
                        ))}
                      </Select>
                    </Col>
                    
                    <Col xs={24} sm={8} lg={6}>
                      <Text strong>Filter by Fuel Type:</Text>
                      <Select
                        allowClear
                        placeholder="All Fuel Types"
                        style={{ width: '100%', marginTop: 4 }}
                        size="large"
                        onChange={(val) => {
                          // Add fuel type filter logic here
                        }}
                      >
                        <Option value="PETROL">⛽ Petrol</Option>
                        <Option value="DIESEL">🚛 Diesel</Option>
                      </Select>
                    </Col>

                    <Col xs={24} sm={8} lg={6}>
                      <Text strong>Filter by Amount:</Text>
                      <Select
                        allowClear
                        placeholder="All Amounts"
                        style={{ width: '100%', marginTop: 4 }}
                        size="large"
                        onChange={(val) => {
                          // Add amount filter logic here
                        }}
                      >
                        <Option value="5">💧 5L Coupons</Option>
                        <Option value="20">🛢️ 20L Coupons</Option>
                      </Select>
                    </Col>

                    <Col xs={24} sm={24} lg={6}>
                      <div style={{ display: 'flex', alignItems: 'flex-end', height: '100%' }}>
                        <Button 
                          type="default" 
                          onClick={loadAvailableBooks}
                          style={{ marginTop: 20 }}
                          loading={loading}
                          size="large"
                        >
                          🔄 Refresh Books
                        </Button>
                      </div>
                    </Col>
                  </Row>

                  {/* Stats Cards */}
                  <Row gutter={16} style={{ marginTop: 16 }}>
                    <Col xs={12} sm={6}>
                      <Statistic
                        title="Total Available"
                        value={availableBooks.length}
                        prefix={<BookOutlined style={{ color: '#1890ff' }} />}
                        valueStyle={{ color: '#1890ff', fontSize: '18px' }}
                      />
                    </Col>
                    <Col xs={12} sm={6}>
                      <Statistic
                        title="Selected"
                        value={selectedBooks.length}
                        prefix={<CheckOutlined style={{ color: '#52c41a' }} />}
                        valueStyle={{ color: '#52c41a', fontSize: '18px' }}
                      />
                    </Col>
                    <Col xs={12} sm={6}>
                      <Statistic
                        title="Available Coupons"
                        value={availableBooks.reduce((sum, book) => sum + book.numberOfCoupons, 0)}
                        valueStyle={{ color: '#fa8c16', fontSize: '18px' }}
                      />
                    </Col>
                    <Col xs={12} sm={6}>
                      <Statistic
                        title="Total Value"
                        value={availableBooks.reduce((sum, book) => sum + book.value, 0)}
                        formatter={(value) => `ZWG ${value?.toLocaleString()}`}
                        valueStyle={{ color: '#722ed1', fontSize: '18px' }}
                      />
                    </Col>
                  </Row>
                </Card>

                {/* Enhanced Transfer Component */}
                <div style={{ backgroundColor: '#fafafa', padding: '16px', borderRadius: '8px' }}>
                  <Transfer
                    dataSource={availableBooks}
                    targetKeys={selectedBooks}
                    onChange={(nextTargetKeys) => setSelectedBooks(nextTargetKeys as string[])}
                    rowKey={(item) => item.key}
                    showSearch
                    filterOption={(inputValue, item) => 
                      item.bookId.toLowerCase().includes(inputValue.toLowerCase()) ||
                      item.boxId.toLowerCase().includes(inputValue.toLowerCase()) ||
                      item.fuelType.toLowerCase().includes(inputValue.toLowerCase())
                    }
                    listStyle={{ 
                      width: '48%', 
                      height: 500,
                      backgroundColor: 'white',
                      borderRadius: '6px',
                      border: '1px solid #d9d9d9'
                    }}
                    render={(item) => (
                      <div style={{ padding: '8px 0' }}>
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          marginBottom: '4px'
                        }}>
                          <div style={{ fontWeight: 600, color: '#1890ff' }}>
                            📖 {item.bookId}
                          </div>
                          <Button 
                            type="link" 
                            size="small"
                            icon={<EyeOutlined />}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedBookForDetails(item);
                              setBookDetailsModalVisible(true);
                            }}
                            title="View book details and coupon pages"
                          >
                            Details
                          </Button>
                        </div>
                        <div style={{ fontSize: '12px', color: '#8c8c8c', marginTop: '2px' }}>
                          📦 Box: <strong>{item.boxId}</strong> • {item.fuelType === 'PETROL' ? '⛽' : '🚛'} <strong>{item.fuelType}</strong>
                        </div>
                        <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
                          💧 <strong>{item.couponAmount}L</strong> × <strong>{item.numberOfCoupons}</strong> coupons = <strong style={{ color: '#52c41a' }}>ZWG {item.value.toLocaleString()}</strong>
                        </div>
                        <div style={{ fontSize: '11px', color: '#1890ff', marginTop: '4px', fontFamily: 'monospace' }}>
                          🎫 <strong>{item.firstCouponId}</strong> → <strong>{item.lastCouponId}</strong>
                        </div>
                        {/* Show box info if available */}
                        {selectedBoxCode && (
                          <div style={{ fontSize: '10px', color: '#fa8c16', marginTop: '2px' }}>
                            📋 Smart Selection: Box {selectedBoxCode}
                          </div>
                        )}
                      </div>
                    )}
                    titles={[
                      <span key="available">
                        📚 Available Books ({availableBooks.length})
                      </span>, 
                      <span key="selected">
                        ✅ Selected Books ({selectedBooks.length})
                      </span>
                    ]}
                    operations={['Add →', '← Remove']}
                  />
                </div>

                {/* Selection Summary */}
                {selectedBooks.length > 0 && (
                  <Card 
                    size="small" 
                    title={
                      <Space>
                        <CheckOutlined style={{ color: '#52c41a' }} />
                        <Text strong>Dispatch Summary</Text>
                      </Space>
                    }
                    style={{ marginTop: 24 }}
                  >
                    <Row gutter={16}>
                      <Col xs={12} sm={6}>
                        <Statistic
                          title="Selected Books"
                          value={selectedBooks.length}
                          prefix={<BookOutlined style={{ color: '#1890ff' }} />}
                          valueStyle={{ color: '#1890ff' }}
                        />
                      </Col>
                      <Col xs={12} sm={6}>
                        <Statistic
                          title="Total Coupons"
                          value={availableBooks
                            .filter(book => selectedBooks.includes(book.key))
                            .reduce((sum, book) => sum + (dispatchType === 'PAGE' ? Math.min(partialCoupons[book.key] || 0, book.numberOfCoupons) : book.numberOfCoupons), 0)
                          }
                          valueStyle={{ color: '#fa8c16' }}
                        />
                      </Col>
                      <Col xs={12} sm={6}>
                        <Statistic
                          title="Total Value"
                          value={availableBooks
                            .filter(book => selectedBooks.includes(book.key))
                            .reduce((sum, book) => {
                              if (dispatchType === 'PAGE') {
                                const cnt = Math.min(partialCoupons[book.key] || 0, book.numberOfCoupons);
                                const unit = (book.value / Math.max(book.numberOfCoupons, 1)) || 0;
                                return sum + cnt * unit;
                              }
                              return sum + book.value;
                            }, 0)
                          }
                          formatter={(value) => `ZWG ${value?.toLocaleString()}`}
                          valueStyle={{ color: '#52c41a' }}
                        />
                      </Col>
                      <Col xs={12} sm={6}>
                        <Statistic
                          title="Avg. Value/Book"
                          value={selectedBooks.length > 0 ? (
                            availableBooks
                              .filter(book => selectedBooks.includes(book.key))
                              .reduce((sum, book) => sum + book.value, 0) / selectedBooks.length
                          ) : 0}
                          formatter={(value) => `ZWG ${value?.toLocaleString()}`}
                          valueStyle={{ color: '#722ed1' }}
                        />
                      </Col>
                    </Row>
                  </Card>
                )}

                {/* Action Buttons */}
                <div style={{ 
                  textAlign: 'right', 
                  marginTop: 32,
                  paddingTop: 16,
                  borderTop: '1px solid #f0f0f0'
                }}>
                  <Space size={16}>
                    <Button 
                      onClick={() => setCurrentStep(0)}
                      size="large"
                      style={{ minWidth: '120px' }}
                    >
                      ← Previous
                    </Button>
                    <Button
                      type="primary"
                      size="large"
                      onClick={() => setCurrentStep(2)}
                      disabled={selectedBooks.length === 0}
                      style={{ minWidth: '180px' }}
                    >
                      {dispatchType === 'PAGE' ? 'Next: Pages Details' : 'Next: Books Details'} →
                    </Button>
                  </Space>
                </div>
              </div>
            )}

      {currentStep === 2 && (
            <>
              <Alert
        message={dispatchType === 'PAGE' ? 'Specify Page/Coupon Details' : 'Review Books Details'}
        description={dispatchType === 'PAGE' ? 'For each selected book, enter number of coupons to dispatch. Last coupon will be derived for reporting.' : "Review each book's serial number range and confirm the details before proceeding to dispatch."}
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
                  dispatchType === 'PAGE'
                    ? {
                        title: 'Coupons (Selected / Total)',
                        key: 'selectedCoupons',
                        render: (_: any, record: any) => (
                          <Space>
                            <InputNumber
                              min={1}
                              max={record.numberOfCoupons}
                              value={Math.min(partialCoupons[record.key] || 1, record.numberOfCoupons)}
                              onChange={(val) => setPartialCoupons(pc => ({ ...pc, [record.key]: Number(val || 1) }))}
                              size="small"
                            />
                            <Text type="secondary">/ {record.numberOfCoupons}</Text>
                          </Space>
                        ),
                      }
                    : {
                        title: 'Total Coupons',
                        dataIndex: 'numberOfCoupons',
                        key: 'numberOfCoupons',
                        render: (count: number) => (
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
                          <strong>Last:</strong> {dispatchType === 'PAGE' ? (() => {
                            const cnt = Math.min(partialCoupons[record.key] || 1, record.numberOfCoupons);
                            const serials = generateCouponSerials(record.firstCouponId, Math.max(cnt, 1));
                            return serials.length > 0 ? serials[serials.length - 1] : record.lastCouponId;
                          })() : record.lastCouponId}
                        </Text>
                      </Space>
                    ),
                  },
                  {
                    title: 'Value',
                    dataIndex: 'value',
                    key: 'value',
                    render: (value: number, record: any) => {
                      if (dispatchType === 'PAGE') {
                        const cnt = Math.min(partialCoupons[record.key] || 0, record.numberOfCoupons);
                        const unit = (record.value / Math.max(record.numberOfCoupons, 1)) || 0;
                        return <Text strong>ZWG {(cnt * unit).toLocaleString()}</Text>;
                      }
                      return <Text strong>ZWG {value.toLocaleString()}</Text>;
                    },
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
                        .reduce((sum, book) => sum + (dispatchType === 'PAGE' ? Math.min(partialCoupons[book.key] || 0, book.numberOfCoupons) : book.numberOfCoupons), 0)
                      }
                    />
                  </Col>
                  <Col span={6}>
                    <Statistic
                      title="Total Value"
                      value={availableBooks
                        .filter(book => selectedBooks.includes(book.key))
                        .reduce((sum, book) => {
                          if (dispatchType === 'PAGE') {
                            const cnt = Math.min(partialCoupons[book.key] || 0, book.numberOfCoupons);
                            const unit = (book.value / Math.max(book.numberOfCoupons, 1)) || 0;
                            return sum + cnt * unit;
                          }
                          return sum + book.value;
                        }, 0)
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
                    .reduce((sum, book) => sum + (dispatchType === 'PAGE' ? Math.min(partialCoupons[book.key] || 0, book.numberOfCoupons) : book.numberOfCoupons), 0)
                  }
                </Descriptions.Item>
                <Descriptions.Item label="Total Value">
                  ZWG {availableBooks
                    .filter(book => selectedBooks.includes(book.key))
                    .reduce((sum, book) => {
                      if (dispatchType === 'PAGE') {
                        const cnt = Math.min(partialCoupons[book.key] || 0, book.numberOfCoupons);
                        const unit = (book.value / Math.max(book.numberOfCoupons, 1)) || 0;
                        return sum + cnt * unit;
                      }
                      return sum + book.value;
                    }, 0).toLocaleString()}
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
                  <Button type="primary" loading={loading} onClick={handleSubmit}>
                    Confirm {dispatchType === 'PAGE' ? 'Page' : 'Book'} Dispatch
                  </Button>
                </Space>
              </div>
            </>
          )}
        </Form>
        </div>
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
            key="download"
            icon={<DownloadOutlined />}
            onClick={() => selectedDispatch && downloadDispatchPDF(selectedDispatch)}
          >
            Download PDF
          </Button>,
          <Button
            key="print"
            type="primary"
            icon={<PrinterOutlined />}
            onClick={() => selectedDispatch && generateDispatchPDF(selectedDispatch)}
          >
            Print
          </Button>,
        ]}
  width="90vw"
  style={{ top: 24 }}
  styles={{ body: { maxHeight: '80vh', overflow: 'auto' } }}
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
              <Descriptions.Item label="Total Value">ZWG {(selectedDispatch.totalValue ?? 0).toLocaleString()}</Descriptions.Item>
              <Descriptions.Item label="Reception Status">
                <Badge
                  status={selectedDispatch.status === 'CONFIRMED' ? 'success' : selectedDispatch.status === 'RECEIVED' ? 'processing' : 'default'}
                  text={
                    selectedDispatch.status === 'CONFIRMED' ? 'Confirmed by Sub-Center' : 
                    selectedDispatch.status === 'RECEIVED' ? 'Pending Confirmation' :
                    'Not Received'
                  }
                />
              </Descriptions.Item>
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
                  title: 'Batch ID',
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

      {/* Enhanced Edit Drawer */}
      <Drawer
        title={<Space><EditOutlined /> Edit Dispatch - {selectedDispatch?.dispatchId}</Space>}
        placement="right"
        width={640}
        open={editModalVisible}
        onClose={() => setEditModalVisible(false)}
        extra={
          <Space>
            <Button onClick={() => setEditModalVisible(false)}>Cancel</Button>
            <Button type="primary" onClick={async () => {
              if (!selectedDispatch) return;
              try {
                const formValues = await editForm.validateFields();
                const payload: any = {
                  tracking_number: formValues.trackingNumber,
                  status: formValues.status,
                  notes: formValues.notes || '',
                  to_center: formValues.subCenterId,
                };
                console.log('🛠️ PATCH /dispatches/:', selectedDispatch.id, payload);
                await apiClient.patch(`/dispatches/${selectedDispatch.id}/`, payload);
                message.success('Dispatch updated');
                setEditModalVisible(false);
                loadDispatches();
              } catch (e) {
                console.error('Edit save error', e);
                message.error('Failed to save changes');
              }
            }}>Save</Button>
          </Space>
        }
      >
        {selectedDispatch && (
          <Form layout="vertical" form={editForm} initialValues={{
            trackingNumber: selectedDispatch.trackingNumber,
            status: selectedDispatch.status,
            notes: selectedDispatch.notes,
            subCenterId: selectedDispatch.subCenterId,
          }}>
            <Alert type="info" showIcon style={{ marginBottom: 16 }}
              message="Update sub-center, status, or tracking number. Books editing coming soon. Values auto-calculate." />
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 16,
              marginBottom: 8
            }}>
              <div>
                <Form.Item label="Main Center Dispatch #">
                  <Input value={selectedDispatch.mainCenterDispatchNumber || 'Auto'} disabled />
                </Form.Item>
              </div>
              <div>
                <Form.Item label="Dispatch ID">
                  <Input value={selectedDispatch.dispatchId} disabled />
                </Form.Item>
              </div>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: 16,
              marginBottom: 8
            }}>
              <Form.Item label="Total Books">
                <Input value={selectedDispatch.totalBooks ?? 0} disabled />
              </Form.Item>
              <Form.Item label="Total Litres">
                <Input value={selectedDispatch.totalLitres ?? 0} disabled />
              </Form.Item>
              <Form.Item label="Value (USD)">
                <Input value={(selectedDispatch.totalValueUsd ?? 0).toLocaleString(undefined,{minimumFractionDigits:2, maximumFractionDigits:2})} disabled />
              </Form.Item>
            </div>
            <Form.Item name="subCenterId" label="Receiving Sub-Center" rules={[{ required: true, message: 'Select sub-center'}]}>
              <Select placeholder="Select sub-center">
                {subCenters.map(sc => <Option key={sc.id} value={sc.id}>{sc.name}</Option>)}
              </Select>
            </Form.Item>
            <Form.Item name="trackingNumber" label="Tracking Number" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item name="status" label="Status" rules={[{ required: true }]}>
              <Select>
                <Option value="DISPATCHED">Dispatched</Option>
                <Option value="IN_TRANSIT">In Transit</Option>
                <Option value="RECEIVED">Received</Option>
                <Option value="CONFIRMED">Confirmed</Option>
              </Select>
            </Form.Item>
            <Form.Item name="notes" label="Notes">
              <TextArea rows={4} />
            </Form.Item>
            <Divider orientation="left" plain>Books ({selectedDispatch.books?.length || 0})</Divider>
            <List
              size="small"
              bordered
              dataSource={selectedDispatch.books || []}
              renderItem={(b: any) => <List.Item>{b.bookId || b.book_number} - {b.numberOfCoupons || b.number_of_coupons || 100} coupons</List.Item>}
              style={{ maxHeight: 160, overflow: 'auto' }}
            />
          </Form>
        )}
      </Drawer>

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
  width="85vw"
  style={{ top: 24 }}
  styles={{ body: { maxHeight: '80vh', overflow: 'auto' } }}
      >
        {selectedBookForDetails && (
          <div>
            <Descriptions bordered column={2} style={{ marginBottom: 16 }}>
              <Descriptions.Item label="Book ID">{selectedBookForDetails.bookId}</Descriptions.Item>
              <Descriptions.Item label="Batch ID">
                <Tag color="blue">{selectedBookForDetails.boxId}</Tag>
                {selectedBoxCode && (
                  <Tag color="orange" style={{ marginLeft: 8 }}>📋 Smart Selected</Tag>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Fuel Type">
                <Tag color={selectedBookForDetails.fuelType === 'PETROL' ? 'blue' : 'green'}>
                  {selectedBookForDetails.fuelType === 'PETROL' ? '⛽ PETROL' : '🚛 DIESEL'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Coupon Amount">{selectedBookForDetails.couponAmount}L per coupon</Descriptions.Item>
              <Descriptions.Item label="Total Coupons">
                <Badge count={selectedBookForDetails.numberOfCoupons} showZero style={{ backgroundColor: '#52c41a' }} />
              </Descriptions.Item>
              <Descriptions.Item label="Total Value">
                <Text strong style={{ color: '#52c41a' }}>ZWG {selectedBookForDetails.value.toLocaleString()}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Serial Range">
                <Text code style={{ color: '#1890ff' }}>
                  {selectedBookForDetails.serialRange || `${selectedBookForDetails.firstCouponId} → ${selectedBookForDetails.lastCouponId}`}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Verification Status">
                {selectedBookForDetails.isVerified ? (
                  <Tag color="green" icon={<CheckOutlined />}>Verified</Tag>
                ) : (
                  <Tag color="orange" icon={<ClockCircleOutlined />}>Pending Verification</Tag>
                )}
              </Descriptions.Item>
            </Descriptions>

            {/* Show Box Information if available */}
            {selectedBookForDetails.boxInfo && (
              <>
                <Divider>📦 Box Information</Divider>
                <Descriptions bordered column={3} size="small" style={{ marginBottom: 16 }}>
                  <Descriptions.Item label="Batch Code">{selectedBookForDetails.boxInfo.code}</Descriptions.Item>
                  <Descriptions.Item label="Supplier">{selectedBookForDetails.boxInfo.supplier || 'N/A'}</Descriptions.Item>
                  <Descriptions.Item label="Received Date">
                    {selectedBookForDetails.boxInfo.receivedDate 
                      ? new Date(selectedBookForDetails.boxInfo.receivedDate).toLocaleDateString()
                      : 'N/A'
                    }
                  </Descriptions.Item>
                </Descriptions>
              </>
            )}

            <Divider>📄 Coupon Pages for Verification</Divider>
            
            <Alert
              message="Intelligent Coupon Page Breakdown"
              description={`This book is organized into ${selectedBookForDetails.couponPages?.length || 0} pages with 10 coupons per page for easy verification and dispatch management.${selectedBookForDetails.couponPages?.length === 0 ? ' Coupon page information is being generated...' : ''}`}
              type={(selectedBookForDetails?.couponPages?.length ?? 0) > 0 ? "info" : "warning"}
              showIcon
              style={{ marginBottom: 16 }}
            />

            {/* Show Coupon Pages instead of individual serials */}
            {selectedBookForDetails.couponPages && selectedBookForDetails.couponPages.length > 0 ? (
              <div style={{ 
                maxHeight: '400px', 
                overflowY: 'auto', 
                border: '1px solid #d9d9d9', 
                borderRadius: '6px',
                padding: '16px',
                backgroundColor: '#fafafa'
              }}>
                <Row gutter={[12, 12]}>
                  {selectedBookForDetails.couponPages.map((page) => (
                    <Col span={8} key={page.pageNumber}>
                      <Card 
                        size="small" 
                        style={{ 
                          textAlign: 'center',
                          borderColor: '#1890ff',
                          backgroundColor: '#f6ffed'
                        }}
                        title={
                          <Space>
                            <FileTextOutlined style={{ color: '#1890ff' }} />
                            <Text strong>Page {page.pageNumber}</Text>
                          </Space>
                        }
                      >
                        <Space direction="vertical" size="small" style={{ width: '100%' }}>
                          <Text strong style={{ color: '#1890ff' }}>
                            📍 {page.firstCoupon}
                          </Text>
                          <Text type="secondary">to</Text>
                          <Text strong style={{ color: '#1890ff' }}>
                            📍 {page.lastCoupon}
                          </Text>
                          <Divider style={{ margin: '8px 0' }} />
                          <Space>
                            <Badge count={page.couponsInPage} color="blue" />
                            <Text style={{ fontSize: '11px' }}>coupons</Text>
                          </Space>
                          <Text strong style={{ color: '#52c41a', fontSize: '12px' }}>
                            ZWG {page.pageValue.toLocaleString()}
                          </Text>
                        </Space>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </div>
            ) : (
              // Fallback: Show book summary if coupon pages not available
              <div style={{ 
                maxHeight: '300px', 
                overflowY: 'auto', 
                border: '1px solid #d9d9d9', 
                borderRadius: '6px',
                padding: '16px',
                backgroundColor: '#fff2e8'
              }}>
                <Alert
                  message="📋 Individual Coupon Information"
                  description="Coupon page breakdown not available. Showing book summary:"
                  type="warning"
                  showIcon
                  style={{ marginBottom: 16 }}
                />
                
                <Descriptions bordered size="small">
                  <Descriptions.Item label="Serial Range" span={3}>
                    <Text code>{selectedBookForDetails.firstCouponId} → {selectedBookForDetails.lastCouponId}</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Total Coupons" span={3}>
                    <Badge count={selectedBookForDetails.numberOfCoupons} style={{ backgroundColor: '#1890ff' }} />
                  </Descriptions.Item>
                  <Descriptions.Item label="Estimated Pages" span={3}>
                    <Text strong>{Math.ceil(selectedBookForDetails.numberOfCoupons / 10)} pages (10 coupons per page)</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Total Value" span={3}>
                    <Text strong style={{ color: '#52c41a' }}>ZWG {selectedBookForDetails.value.toLocaleString()}</Text>
                  </Descriptions.Item>
                </Descriptions>
              </div>
            )}

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
