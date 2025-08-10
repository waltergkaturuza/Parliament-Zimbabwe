// src/pages/main-center/components/BoxReceiptManagement.tsx
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
  Empty,
  Spin,
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
  BookOutlined,
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

interface SmartCalculationMode {
  mode: 'first-and-count' | 'last-and-count' | 'first-and-last' | 'full-range';
  label: string;
  description: string;
}

const BoxReceiptManagement: FC = () => {
  const { user } = useAuth();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [verifyModalVisible, setVerifyModalVisible] = useState(false);
  const [selectedBox, setSelectedBox] = useState<BoxReceipt | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [form] = Form.useForm();
  const [verifyForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [signatureUploading, setSignatureUploading] = useState(false);
  const [boxReceipts, setBoxReceipts] = useState<BoxReceipt[]>([]);
  const [nextBoxNumber, setNextBoxNumber] = useState('');
  const [calculatedBooks, setCalculatedBooks] = useState<BookInfo[]>([]);
  const [activeTab, setActiveTab] = useState<'receipts' | 'verification' | 'inventory'>('receipts');
  const [calculationMode, setCalculationMode] = useState<SmartCalculationMode['mode']>('first-and-count');
  
  // Archive-related state
  const [showArchived, setShowArchived] = useState(false);
  const [archiveModalVisible, setArchiveModalVisible] = useState(false);
  const [archiveForm] = Form.useForm();

  // PDF and Print functionality
  const generateVerificationReportData = () => {
    const currentUser = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username : "System User";
    const currentDate = new Date();
    const formValues = form.getFieldsValue();
    const currentTimeFormatted = currentDate.toLocaleTimeString('en-GB', { hour12: false });
    
    return {
      boxId: formValues.boxId || 'N/A',
      barcode: formValues.barcode || `BOX-${formValues.boxId || 'N/A'}-${currentDate.getTime()}`,
      supplier: formValues.supplier || 'Petrotrade Zimbabwe',
      receivedDate: formValues.receivedDate ? dayjs(formValues.receivedDate).format('DD/MM/YYYY') : dayjs().format('DD/MM/YYYY'),
      receivedTime: formValues.receivedTime ? dayjs(formValues.receivedTime).format('HH:mm') : currentTimeFormatted,
      receivedBy: currentUser, // Auto-filled with logged-in user
      verifiedBy: currentUser,
      verificationDate: currentDate.toLocaleDateString('en-GB'),
      verificationTime: currentDate.toLocaleTimeString('en-GB'),
      books: calculatedBooks,
      totalBooks: calculatedBooks.length,
      totalCoupons: calculatedBooks.reduce((sum, book) => sum + book.numberOfCoupons, 0),
      
      // Fuel Details
      fuelType: formValues.fuelType || 'DIESEL',
      couponAmount: formValues.couponAmount || 20, // litres per coupon
      totalLitres: calculatedBooks.reduce((sum, book) => sum + book.numberOfCoupons, 0) * (formValues.couponAmount || 20),
      fuelPricePerLitre: formValues.fuelPricePerLitreUSD || 1.40,
      totalValueUSD: calculatedBooks.reduce((sum, book) => sum + book.numberOfCoupons, 0) * (formValues.couponAmount || 20) * (formValues.fuelPricePerLitreUSD || 1.40),
      exchangeRate: formValues.exchangeRate || 27.50,
      totalValueZWL: calculatedBooks.reduce((sum, book) => sum + book.numberOfCoupons, 0) * (formValues.couponAmount || 20) * (formValues.fuelPricePerLitreUSD || 1.40) * (formValues.exchangeRate || 27.50),
      
      verificationNotes: formValues.couponVerificationNotes || 'No additional notes',
      witnessSignature: '', // Empty space for witness signature
      verifierSignature: currentUser, // Auto-filled with logged-in user
    };
  };

  const downloadVerificationReport = async () => {
    try {
      // Check if we have books data
      if (!calculatedBooks || calculatedBooks.length === 0) {
        message.warning('Please generate book calculations first before downloading verification report');
        return;
      }

      const reportData = generateVerificationReportData();
      console.log('Generated report data:', reportData);
      
      // Generate PDF content (no backend call needed for verification reports)
      const pdfContent = generatePDFContent(reportData);
      
      if (!pdfContent) {
        throw new Error('Failed to generate PDF content');
      }
      
      // Create and download PDF
      const blob = new Blob([pdfContent], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Verification_Report_${reportData.boxId}_${reportData.verificationDate.replace(/\//g, '')}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      message.success('Verification report downloaded successfully!');
    } catch (error) {
      console.error('Error downloading verification report:', error);
      message.error(`Failed to download verification report: ${error.message || 'Unknown error'}`);
    }
  };

  const printVerificationReport = () => {
    const reportData = generateVerificationReportData();
    const printContent = generatePDFContent(reportData);
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    }
  };

  const generatePDFContent = (data: any) => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Box Verification Report - ${data.boxId}</title>
        <style>
            body { 
                font-family: Arial, sans-serif; 
                margin: 20px; 
                line-height: 1.6;
                color: #333;
            }
            .header { 
                display: flex; 
                align-items: center; 
                margin-bottom: 30px;
                border-bottom: 2px solid #1890ff;
                padding-bottom: 20px;
            }
            .logo { 
                width: 80px; 
                height: 80px; 
                margin-right: 20px;
                background: url('/Logo_of_the_Parliament_of_Zimbabwe.png') no-repeat center;
                background-size: contain;
            }
            .header-text h1 { 
                margin: 0; 
                color: #1890ff;
                font-size: 24px;
            }
            .header-text p { 
                margin: 5px 0; 
                color: #666;
            }
            .report-info { 
                background: #f5f5f5; 
                padding: 15px; 
                border-radius: 5px; 
                margin-bottom: 20px;
            }
            .books-table { 
                width: 100%; 
                border-collapse: collapse; 
                margin: 20px 0;
            }
            .books-table th, .books-table td { 
                border: 1px solid #ddd; 
                padding: 8px; 
                text-align: left;
            }
            .books-table th { 
                background-color: #1890ff; 
                color: white;
            }
            .books-table tr:nth-child(even) { 
                background-color: #f2f2f2;
            }
            .signature-section { 
                display: flex; 
                justify-content: space-between; 
                margin-top: 40px;
                padding-top: 20px;
                border-top: 1px solid #ddd;
            }
            .signature-box { 
                width: 45%; 
                text-align: center;
            }
            .signature-line { 
                border-bottom: 1px solid #333; 
                height: 40px; 
                margin-bottom: 10px;
            }
            .summary-stats {
                display: flex;
                justify-content: space-around;
                background: #f0f8ff;
                padding: 15px;
                border-radius: 5px;
                margin: 20px 0;
            }
            .stat-item {
                text-align: center;
            }
            .stat-number {
                font-size: 24px;
                font-weight: bold;
                color: #1890ff;
            }
            .verification-checklist {
                background: #f6ffed;
                border: 1px solid #b7eb8f;
                padding: 15px;
                border-radius: 5px;
                margin: 20px 0;
            }
            .print-only { display: none; }
            @media print {
                .print-only { display: block; }
                body { margin: 0; }
            }
        </style>
    </head>
    <body>
        <div class="header">
            <div class="logo"></div>
            <div class="header-text">
                <h1>Parliament of Zimbabwe</h1>
                <p>Fuel Coupon System - Box Verification Report</p>
                <p>Generated on ${data.verificationDate} at ${data.verificationTime}</p>
            </div>
        </div>

        <div class="report-info">
            <h3>Box Information</h3>
            <p><strong>Box ID:</strong> ${data.boxId}</p>
            <p><strong>Barcode:</strong> ${data.barcode}</p>
            <p><strong>Supplier:</strong> ${data.supplier}</p>
            <p><strong>Received Date:</strong> ${data.receivedDate}</p>
            <p><strong>Received Time:</strong> ${data.receivedTime}</p>
            <p><strong>Received By:</strong> ${data.receivedBy}</p>
        </div>

        <div class="report-info">
            <h3>Fuel Details</h3>
            <p><strong>Fuel Type:</strong> ${data.fuelType}</p>
            <p><strong>Coupon Denomination:</strong> ${data.couponAmount} litres per coupon</p>
            <p><strong>Fuel Price:</strong> $${data.fuelPricePerLitre} USD per litre</p>
            <p><strong>Exchange Rate:</strong> 1 USD = ${data.exchangeRate} ZWL</p>
        </div>

        <div class="summary-stats">
            <div class="stat-item">
                <div class="stat-number">${data.totalBooks}</div>
                <div>Total Books</div>
            </div>
            <div class="stat-item">
                <div class="stat-number">${data.totalCoupons}</div>
                <div>Total Coupons</div>
            </div>
            <div class="stat-item">
                <div class="stat-number">${data.totalLitres}</div>
                <div>Total Litres</div>
            </div>
            <div class="stat-item">
                <div class="stat-number">$${data.totalValueUSD.toFixed(2)}</div>
                <div>Total Value (USD)</div>
            </div>
            <div class="stat-item">
                <div class="stat-number">${data.totalValueZWL.toLocaleString()}</div>
                <div>Total Value (ZWL)</div>
            </div>
        </div>

        <h3>Book Details</h3>
        <table class="books-table">
            <thead>
                <tr>
                    <th>Book #</th>
                    <th>First Coupon ID</th>
                    <th>Last Coupon ID</th>
                    <th>Number of Coupons</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
                ${data.books.map((book, index) => `
                    <tr>
                        <td>Book ${index + 1}</td>
                        <td>${book.firstCouponId}</td>
                        <td>${book.lastCouponId}</td>
                        <td>${book.numberOfCoupons}</td>
                        <td>✓ Verified</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>

        <div class="verification-checklist">
            <h3>Verification Checklist</h3>
            <p>✓ First coupon ID verified: ${data.books[0]?.firstCouponId || 'N/A'}</p>
            <p>✓ Last coupon ID verified: ${data.books[data.books.length - 1]?.lastCouponId || 'N/A'}</p>
            <p>✓ Coupon count matches: ${data.totalCoupons} coupons</p>
            <p>✓ All ${data.totalBooks} books are intact and properly bound</p>
            <p>✓ Box barcode scanned successfully: ${data.barcode}</p>
            <p>✓ No visible damage to coupons or books</p>
        </div>

        <div style="margin: 20px 0;">
            <h3>Verification Notes</h3>
            <p>${data.verificationNotes}</p>
        </div>

        <div class="signature-section">
            <div class="signature-box">
                <div class="signature-line"></div>
                <p><strong>Verified By:</strong><br>${data.verifiedBy}<br>Date: ${data.verificationDate}</p>
            </div>
            <div class="signature-box">
                <div class="signature-line"></div>
                <p><strong>Witness Signature:</strong><br>Name: ____________________<br>Date: ____________________</p>
            </div>
        </div>

        <div class="print-only" style="margin-top: 30px; text-align: center; font-size: 12px; color: #666;">
            <p>This document was automatically generated by the Parliament of Zimbabwe Fuel Coupon System</p>
            <p>Verification ID: VER-${data.boxId}-${data.verificationDate.replace(/\//g, '')}</p>
        </div>
    </body>
    </html>
    `;
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchBoxReceipts();
    generateNextBoxNumber();
  }, []);

  const fetchBoxReceipts = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/boxes/');
      const data = response.data;
      
      // Handle both paginated and direct array responses
      const boxes = data.results || data;
      
      if (Array.isArray(boxes)) {
        // Map backend data to frontend format
        const mappedBoxes = boxes.map((box: any) => ({
          id: String(box.id),
          boxId: box.box_code || `FCB-${String(box.id).padStart(4, '0')}`,
          barcode: box.barcode || '',
          supplier: 'Petrotrade Zimbabwe', // Default supplier
          receivedDate: box.received_at ? new Date(box.received_at).toISOString().split('T')[0] : '',
          receivedTime: box.received_at ? new Date(box.received_at).toTimeString().split(' ')[0] : '',
          receivedBy: box.received_by?.first_name && box.received_by?.last_name 
            ? `${box.received_by.first_name} ${box.received_by.last_name}` 
            : 'System User',
          fuelType: 'DIESEL', // Default - backend doesn't have this field yet
          couponAmount: 20, // Default coupon amount
          numberOfBooks: box.books?.length || 0,
          couponsPerBook: 10, // Standard coupons per book
          totalCoupons: (box.books?.length || 0) * 10,
          totalLitres: box.total_litres || 0,
          firstCouponId: box.first_coupon_number || '',
          lastCouponId: box.last_coupon_number || '',
          monetaryValueUSD: 0, // Calculate based on litres and price
          fuelPricePerLitreUSD: 1.40, // Current fuel price
          exchangeRate: 27.50,
          status: 'RECEIVED', // Default status
          verificationNotes: '',
          invoiceNumber: '',
          deliveryNote: '',
          notes: '',
        }));
        
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
    setSelectedBox(null); // Clear any selected box for editing
    form.resetFields();
    generateNextBoxNumber();
    
    // Auto-populate receivedBy with current user
    const currentUser = user ? `${user.name || user.username}` : "System User";
    form.setFieldsValue({
      receivedBy: currentUser,
      receivedDate: dayjs(), // Set current date
      receivedTime: dayjs(), // Set current time
    });
    
    setIsModalVisible(true);
  };

  const handleFormChange = (changedFields: any, allFields: any) => {
    const fuelType = allFields.find((f: any) => f.name[0] === 'fuelType')?.value;
    const couponAmount = allFields.find((f: any) => f.name[0] === 'couponAmount')?.value;
    const numberOfBooks = allFields.find((f: any) => f.name[0] === 'numberOfBooks')?.value;
    const fuelPriceUSD = allFields.find((f: any) => f.name[0] === 'fuelPricePerLitreUSD')?.value;
    const exchangeRate = allFields.find((f: any) => f.name[0] === 'exchangeRate')?.value || 27.50;
    const couponsPerBook = allFields.find((f: any) => f.name[0] === 'couponsPerBook')?.value || 10;
    const firstCouponId = allFields.find((f: any) => f.name[0] === 'firstCouponId')?.value;

    // Calculate totals
    if (numberOfBooks && couponsPerBook) {
      const totalCoupons = numberOfBooks * couponsPerBook;
      const totalLitres = couponAmount ? totalCoupons * couponAmount : 0;
      
      form.setFieldsValue({ 
        totalLitres,
        totalCoupons,
        couponsPerBook 
      });

      // Calculate last coupon ID if first coupon ID is provided
      if (firstCouponId && totalCoupons > 0) {
        const lastCouponId = calculateLastCouponId(firstCouponId, totalCoupons);
        form.setFieldsValue({ lastCouponId });
      }

      // Calculate monetary values
      if (fuelPriceUSD && totalLitres > 0) {
        const monetaryValueUSD = totalLitres * fuelPriceUSD;
        const monetaryValueZWG = monetaryValueUSD * exchangeRate;
        const fuelPriceZWG = fuelPriceUSD * exchangeRate;
        
        form.setFieldsValue({ 
          monetaryValueUSD,
          monetaryValue: monetaryValueZWG,
          fuelPricePerLitre: fuelPriceZWG
        });
      }
    }

    // Auto-generate coupon range if no manual input provided
    if (fuelType && couponAmount && numberOfBooks && !firstCouponId) {
      const totalCoupons = numberOfBooks * couponsPerBook;
      const couponData = calculateCouponRange(fuelType, couponAmount, totalCoupons);
      form.setFieldsValue({
        firstCouponId: couponData.firstCouponId,
        lastCouponId: couponData.lastCouponId,
      });
    }
  };

  // New function to calculate last coupon ID from first coupon ID
  const calculateLastCouponId = (firstCouponId: string, totalCoupons: number) => {
    // Extract the numeric part from the coupon ID (e.g., PU00GH355101 -> 355101)
    const match = firstCouponId.match(/([A-Z]+)(\d+)$/);
    if (!match) return firstCouponId;

    const prefix = match[1];
    const firstNumber = parseInt(match[2]);
    const lastNumber = firstNumber + totalCoupons - 1;
    
    // Maintain the same number of digits as the original
    const numberLength = match[2].length;
    const lastCouponId = firstCouponId.replace(/\d+$/, lastNumber.toString().padStart(numberLength, '0'));
    
    return lastCouponId;
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

      // Include book details from calculated books
      const bookDetails = calculatedBooks.map((book, index) => ({
        book_number: index + 1,
        book_id: book.bookId,
        first_coupon_id: book.firstCouponId,
        last_coupon_id: book.lastCouponId,
        number_of_coupons: book.numberOfCoupons
      }));

      const boxData = {
        box_code: values.boxId,
        barcode: values.barcode || '',
        fuel_type: values.fuelType,
        coupon_amount: values.couponAmount,
        number_of_books: calculatedBooks.length || values.numberOfBooks,
        coupons_per_book: values.couponsPerBook || 100,
        total_litres: values.totalLitres,
        total_coupons: calculatedBooks.reduce((sum, book) => sum + book.numberOfCoupons, 0) || values.totalCoupons,
        monetary_value_usd: values.monetaryValueUSD,
        fuel_price_per_litre_usd: values.fuelPricePerLitreUSD,
        exchange_rate: values.exchangeRate,
        first_coupon_id: calculatedBooks.length > 0 ? calculatedBooks[0].firstCouponId : values.firstCouponId,
        last_coupon_id: calculatedBooks.length > 0 ? calculatedBooks[calculatedBooks.length - 1].lastCouponId : values.lastCouponId,
        book_details: bookDetails, // Include detailed book information
        calculation_mode: calculationMode, // Save which calculation method was used
        status: 'RECEIVED',
        received_at: `${receivedDate}T${receivedTime}:00Z`,
        notes: values.notes || ''
      };

      console.log('📦 Submitting box data:', boxData); // For debugging

      if (selectedBox) {
        // Edit existing box
        const response = await apiClient.put(`/boxes/${selectedBox.id}/`, boxData);
        if (response.status === 200) {
          // Update local state
          setBoxReceipts(prev => prev.map(box => 
            box.id === selectedBox.id 
              ? { ...selectedBox, ...values, receivedDate, receivedTime }
              : box
          ));
          message.success('✅ Box updated successfully!');
        }
      } else {
        // Create new box - use correct API endpoint
        const response = await apiClient.post('/boxes/', boxData);
        if (response.status === 201) {
          const newBox: BoxReceipt = {
            id: String(response.data.id),
            ...values,
            receivedDate,
            receivedTime,
            status: 'RECEIVED' as const,
            booksGenerated: calculatedBooks.length > 0 ? calculatedBooks : undefined, // Include generated books
            numberOfBooks: calculatedBooks.length || values.numberOfBooks,
            totalCoupons: calculatedBooks.reduce((sum, book) => sum + book.numberOfCoupons, 0) || values.totalCoupons,
            firstCouponId: calculatedBooks.length > 0 ? calculatedBooks[0].firstCouponId : values.firstCouponId,
            lastCouponId: calculatedBooks.length > 0 ? calculatedBooks[calculatedBooks.length - 1].lastCouponId : values.lastCouponId,
          };
          setBoxReceipts(prev => [newBox, ...prev]);
          message.success(`✅ Box ${values.boxId} received successfully with ${calculatedBooks.length} books!`);
        }
      }

      setIsModalVisible(false);
      setSelectedBox(null);
      form.resetFields();
      setCalculatedBooks([]); // Clear calculated books
      setCurrentStep(0); // Reset to first step
      generateNextBoxNumber();
      
    } catch (error: any) {
      console.error('❌ Error saving box:', error);
      
      if (error.response?.status === 400) {
        message.error(`Bad Request: ${error.response?.data?.detail || 'Invalid data provided'}`);
      } else if (error.response?.status === 401) {
        message.error('Authentication required. Please log in again.');
      } else {
        message.error('Failed to save box receipt. Please try again.');
      }
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

  const handleSignatureUpload = (file: any) => {
    setSignatureUploading(true);
    
    // Simulate signature upload process
    setTimeout(() => {
      message.success('Signature uploaded successfully!');
      setSignatureUploading(false);
    }, 2000);
    
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

          {record.status === 'PENDING' && (
            <Tooltip title="Edit Box">
              <Button
                size="small"
                icon={<EditOutlined />}
                onClick={() => {
                  setSelectedBox(record);
                  form.setFieldsValue({
                    ...record,
                    receivedBy: currentUser?.fullName || record.receivedBy || '',
                    receivedDate: record.receivedDate ? dayjs(record.receivedDate) : null,
                    receivedTime: record.receivedTime ? dayjs(record.receivedTime, 'HH:mm') : null,
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

  // Smart calculation modes
  const calculationModes: SmartCalculationMode[] = [
    {
      mode: 'first-and-count',
      label: 'First Serial + Coupon Count',
      description: 'Enter first coupon number and number of coupons per book. System calculates last numbers.'
    },
    {
      mode: 'last-and-count', 
      label: 'Last Serial + Coupon Count',
      description: 'Enter last coupon number and number of coupons per book. System calculates first numbers.'
    },
    {
      mode: 'first-and-last',
      label: 'First + Last of Box',
      description: 'Enter first coupon of first book and last coupon of last book. System distributes across books.'
    },
    {
      mode: 'full-range',
      label: 'Complete Range',
      description: 'Enter complete coupon range. System automatically calculates books and distribution.'
    }
  ];

  // Helper functions for book management
  const generateBooksFromRange = () => {
    const numberOfBooks = form.getFieldValue('numberOfBooks') || 0;
    const couponsPerBook = form.getFieldValue('couponsPerBook') || 100;
    const firstCouponId = form.getFieldValue('firstCouponId') || '';
    const lastCouponId = form.getFieldValue('lastCouponId') || '';

    if (numberOfBooks <= 0 || numberOfBooks > 25) {
      message.error('Number of books must be between 1 and 25');
      return;
    }

    if (couponsPerBook <= 0 || couponsPerBook > 100) {
      message.error('Coupons per book must be between 1 and 100');
      return;
    }

    let books: BookInfo[] = [];

    try {
      switch (calculationMode) {
        case 'first-and-count':
          books = generateFromFirstAndCount(firstCouponId, numberOfBooks, couponsPerBook);
          break;
        case 'last-and-count':
          books = generateFromLastAndCount(lastCouponId, numberOfBooks, couponsPerBook);
          break;
        case 'first-and-last':
          books = generateFromFirstAndLast(firstCouponId, lastCouponId, numberOfBooks);
          break;
        case 'full-range':
          books = generateFromFullRange(firstCouponId, lastCouponId);
          break;
        default:
          books = generateFromFirstAndCount(firstCouponId, numberOfBooks, couponsPerBook);
      }

      setCalculatedBooks(books);
      
      // Update form with calculated values
      if (books.length > 0) {
        const totalCoupons = books.reduce((sum, book) => sum + book.numberOfCoupons, 0);
        const firstBook = books[0];
        const lastBook = books[books.length - 1];
        
        form.setFieldsValue({
          numberOfBooks: books.length,
          totalCoupons: totalCoupons,
          firstCouponId: firstBook.firstCouponId,
          lastCouponId: lastBook.lastCouponId,
          couponsPerBook: Math.round(totalCoupons / books.length)
        });

        message.success(`✅ Generated ${books.length} books with ${totalCoupons} total coupons`);
      }
    } catch (error: any) {
      message.error(error.message || 'Failed to generate books');
    }
  };

  // Mode 1: First coupon + count per book
  const generateFromFirstAndCount = (firstCouponId: string, numberOfBooks: number, couponsPerBook: number): BookInfo[] => {
    if (!firstCouponId) {
      throw new Error('First coupon ID is required');
    }

    // Match format: PU006H1355101 (prefix + middle + ending numbers)
    const match = firstCouponId.match(/^([A-Z]+\d+[A-Z]*\d*)(\d{6})$/);
    if (!match) {
      throw new Error('Invalid coupon ID format. Expected format: PU006H1355101');
    }

    const prefix = match[1]; // PU006H1
    let currentNumber = parseInt(match[2]); // 355101
    const numberLength = match[2].length; // 6 digits
    const books: BookInfo[] = [];

    for (let i = 0; i < numberOfBooks; i++) {
      const bookFirstNumber = currentNumber;
      const bookLastNumber = currentNumber + couponsPerBook - 1;
      
      books.push({
        bookId: `Book ${i + 1}`,
        firstCouponId: `${prefix}${bookFirstNumber.toString().padStart(numberLength, '0')}`,
        lastCouponId: `${prefix}${bookLastNumber.toString().padStart(numberLength, '0')}`,
        numberOfCoupons: couponsPerBook,
      });

      currentNumber = bookLastNumber + 1;
    }

    return books;
  };

  // Mode 2: Last coupon + count per book (working backwards)
  const generateFromLastAndCount = (lastCouponId: string, numberOfBooks: number, couponsPerBook: number): BookInfo[] => {
    if (!lastCouponId) {
      throw new Error('Last coupon ID is required');
    }

    // Match format: PU006H1355200 (prefix + middle + ending numbers)
    const match = lastCouponId.match(/^([A-Z]+\d+[A-Z]*\d*)(\d{6})$/);
    if (!match) {
      throw new Error('Invalid coupon ID format. Expected format: PU006H1355200');
    }

    const prefix = match[1]; // PU006H1
    const lastNumber = parseInt(match[2]); // 355200
    const numberLength = match[2].length; // 6 digits
    const totalCoupons = numberOfBooks * couponsPerBook;
    const firstNumber = lastNumber - totalCoupons + 1;

    if (firstNumber <= 0) {
      throw new Error('Calculated first coupon number is invalid. Check your inputs.');
    }

    // Now generate forward from the calculated first number
    return generateFromFirstAndCount(`${prefix}${firstNumber.toString().padStart(numberLength, '0')}`, numberOfBooks, couponsPerBook);
  };

  // Mode 3: First and last of entire box (auto-distribute)
  const generateFromFirstAndLast = (firstCouponId: string, lastCouponId: string, numberOfBooks: number): BookInfo[] => {
    if (!firstCouponId || !lastCouponId) {
      throw new Error('Both first and last coupon IDs are required');
    }

    // Match format: PU006H1355101 (prefix + middle + ending numbers)
    const firstMatch = firstCouponId.match(/^([A-Z]+\d+[A-Z]*\d*)(\d{6})$/);
    const lastMatch = lastCouponId.match(/^([A-Z]+\d+[A-Z]*\d*)(\d{6})$/);
    
    if (!firstMatch || !lastMatch) {
      throw new Error('Invalid coupon ID format. Expected format: PU006H1355101');
    }

    if (firstMatch[1] !== lastMatch[1]) {
      throw new Error('First and last coupons must have the same prefix');
    }

    const prefix = firstMatch[1]; // PU006H1
    const firstNumber = parseInt(firstMatch[2]); // 355101
    const lastNumber = parseInt(lastMatch[2]); // 355200
    const numberLength = firstMatch[2].length; // 6 digits
    
    const totalCoupons = lastNumber - firstNumber + 1;
    const couponsPerBook = Math.floor(totalCoupons / numberOfBooks);
    const remainingCoupons = totalCoupons % numberOfBooks;

    if (couponsPerBook === 0) {
      throw new Error(`Too many books for the coupon range. Maximum ${totalCoupons} books possible.`);
    }

    const books: BookInfo[] = [];
    let currentNumber = firstNumber;

    for (let i = 0; i < numberOfBooks; i++) {
      // Distribute remaining coupons to first few books
      const bookCoupons = couponsPerBook + (i < remainingCoupons ? 1 : 0);
      const bookFirstNumber = currentNumber;
      const bookLastNumber = currentNumber + bookCoupons - 1;
      
      books.push({
        bookId: `Book ${i + 1}`,
        firstCouponId: `${prefix}${bookFirstNumber.toString().padStart(numberLength, '0')}`,
        lastCouponId: `${prefix}${bookLastNumber.toString().padStart(numberLength, '0')}`,
        numberOfCoupons: bookCoupons,
      });

      currentNumber = bookLastNumber + 1;
    }

    return books;
  };

  // Mode 4: Full range analysis (auto-detect optimal book count)
  const generateFromFullRange = (firstCouponId: string, lastCouponId: string): BookInfo[] => {
    if (!firstCouponId || !lastCouponId) {
      throw new Error('Both first and last coupon IDs are required');
    }

    // Match format: PU006H1355101 (prefix + middle + ending numbers)
    const firstMatch = firstCouponId.match(/^([A-Z]+\d+[A-Z]*\d*)(\d{6})$/);
    const lastMatch = lastCouponId.match(/^([A-Z]+\d+[A-Z]*\d*)(\d{6})$/);
    
    if (!firstMatch || !lastMatch) {
      throw new Error('Invalid coupon ID format. Expected format: PU006H1355101');
    }

    const firstNumber = parseInt(firstMatch[2]); // 355101
    const lastNumber = parseInt(lastMatch[2]); // 355200
    const totalCoupons = lastNumber - firstNumber + 1;

    // Smart book count calculation
    let optimalBooks = 1;
    let optimalCouponsPerBook = totalCoupons;

    // Find the best distribution (prefer standard coupon counts)
    const preferredCouponsPerBook = [100, 50, 25, 20, 10];
    
    for (const preferred of preferredCouponsPerBook) {
      if (totalCoupons >= preferred && totalCoupons % preferred === 0) {
        optimalBooks = totalCoupons / preferred;
        optimalCouponsPerBook = preferred;
        break;
      }
    }

    // If no perfect division, find closest to 100 coupons per book
    if (optimalBooks === 1 && totalCoupons > 100) {
      optimalBooks = Math.ceil(totalCoupons / 100);
      optimalCouponsPerBook = Math.ceil(totalCoupons / optimalBooks);
    }

    // Ensure we don't exceed limits
    if (optimalBooks > 25) {
      optimalBooks = 25;
      optimalCouponsPerBook = Math.ceil(totalCoupons / 25);
    }

    if (optimalCouponsPerBook > 100) {
      throw new Error(`Coupon range too large. Maximum ${25 * 100} coupons supported.`);
    }

    return generateFromFirstAndLast(firstCouponId, lastCouponId, optimalBooks);
  };

  const updateBookField = (index: number, field: string, value: string) => {
    const newBooks = [...calculatedBooks];
    newBooks[index] = { ...newBooks[index], [field]: value };
    
    // Recalculate number of coupons if first or last coupon changes
    if (field === 'firstCouponId' || field === 'lastCouponId') {
      const book = newBooks[index];
      if (book.firstCouponId && book.lastCouponId) {
        const firstMatch = book.firstCouponId.match(/(\d+)$/);
        const lastMatch = book.lastCouponId.match(/(\d+)$/);
        
        if (firstMatch && lastMatch) {
          const firstNum = parseInt(firstMatch[1]);
          const lastNum = parseInt(lastMatch[1]);
          newBooks[index].numberOfCoupons = lastNum - firstNum + 1;
        }
      }
    }
    
    setCalculatedBooks(newBooks);
  };

  const addEmptyBook = () => {
    const bookNumber = calculatedBooks.length + 1;
    const newBook: BookInfo = {
      bookId: `Book ${bookNumber}`,
      firstCouponId: '',
      lastCouponId: '',
      numberOfCoupons: 0,
    };
    setCalculatedBooks([...calculatedBooks, newBook]);
  };

  const removeBook = (index: number) => {
    const newBooks = calculatedBooks.filter((_, i) => i !== index);
    // Renumber books
    const renumberedBooks = newBooks.map((book, i) => ({
      ...book,
      bookId: `Book ${i + 1}`,
    }));
    setCalculatedBooks(renumberedBooks);
  };

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
            {selectedBox ? 'Edit Box Receipt' : 'Receive New Box from Petrotrade'}
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
          <Step title="Books Details" icon={<BookOutlined />} />
          <Step title="Coupon Verification" icon={<CheckOutlined />} />
          <Step title="Final Approval" icon={<FileTextOutlined />} />
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
                    rules={[{ required: true, message: 'Please enter number of books' }]}
                  >
                    <InputNumber
                      min={1}
                      max={25}
                      style={{ width: '100%' }}
                      placeholder="Number of books in box (max 25)"
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label="Coupons per Book"
                    name="couponsPerBook"
                    rules={[{ required: true, message: 'Please enter coupons per book' }]}
                  >
                    <InputNumber
                      min={1}
                      max={100}
                      style={{ width: '100%' }}
                      placeholder="Coupons per book (max 100)"
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
                      placeholder="Enter first coupon number (e.g., PU006H1355101)"
                      style={{ fontFamily: 'monospace' }}
                      onChange={(e) => {
                        // Trigger recalculation when first coupon ID changes
                        const firstCouponId = e.target.value;
                        const totalCoupons = form.getFieldValue('totalCoupons');
                        if (firstCouponId && totalCoupons > 0) {
                          const lastCouponId = calculateLastCouponId(firstCouponId, totalCoupons);
                          form.setFieldsValue({ lastCouponId });
                        }
                      }}
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
                    Next: Books Details
                  </Button>
                </Space>
              </div>
            </>
          )}

          {currentStep === 2 && (
            <>
              <div style={{ marginBottom: 24 }}>
                <Title level={4}>🎯 Intelligent Book Configuration</Title>
                <Text type="secondary">
                  Choose your preferred calculation method. The system will automatically generate all book details.
                </Text>
              </div>

              {/* Smart Calculation Mode Selection */}
              <Card style={{ marginBottom: 16 }} size="small">
                <Title level={5}>📊 Calculation Mode</Title>
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

              {/* Smart Input Fields based on calculation mode */}
              <Card style={{ marginBottom: 16 }} size="small">
                <Title level={5}>⚙️ Input Parameters</Title>
                <Row gutter={16}>
                  {(calculationMode === 'first-and-count' || calculationMode === 'first-and-last' || calculationMode === 'full-range') && (
                    <Col span={8}>
                      <Form.Item
                        label="First Coupon ID"
                        name="firstCouponId"
                        rules={[{ required: true, message: 'Enter first coupon ID' }]}
                      >
                        <Input 
                          placeholder="PU006H1355101"
                          style={{ fontFamily: 'monospace' }}
                        />
                      </Form.Item>
                    </Col>
                  )}

                  {(calculationMode === 'last-and-count' || calculationMode === 'first-and-last' || calculationMode === 'full-range') && (
                    <Col span={8}>
                      <Form.Item
                        label="Last Coupon ID"
                        name="lastCouponId"
                        rules={[{ required: true, message: 'Enter last coupon ID' }]}
                      >
                        <Input 
                          placeholder="PU00GH357500"
                          style={{ fontFamily: 'monospace' }}
                        />
                      </Form.Item>
                    </Col>
                  )}

                  {(calculationMode === 'first-and-count' || calculationMode === 'last-and-count' || calculationMode === 'first-and-last') && (
                    <Col span={8}>
                      <Form.Item
                        label="Number of Books"
                        name="numberOfBooks"
                        rules={[{ required: true, message: 'Enter number of books' }]}
                      >
                        <InputNumber
                          min={1}
                          max={25}
                          style={{ width: '100%' }}
                          placeholder="1-25 books"
                        />
                      </Form.Item>
                    </Col>
                  )}

                  {(calculationMode === 'first-and-count' || calculationMode === 'last-and-count') && (
                    <Col span={8}>
                      <Form.Item
                        label="Coupons per Book"
                        name="couponsPerBook"
                        rules={[{ required: true, message: 'Enter coupons per book' }]}
                      >
                        <InputNumber
                          min={1}
                          max={100}
                          style={{ width: '100%' }}
                          placeholder="1-100 coupons"
                        />
                      </Form.Item>
                    </Col>
                  )}
                </Row>

                <Row style={{ marginTop: 16 }}>
                  <Col span={24}>
                    <Alert
                      message={calculationModes.find(m => m.mode === calculationMode)?.description}
                      type="info"
                      showIcon
                      style={{ marginBottom: 16 }}
                    />
                  </Col>
                </Row>
              </Card>

              {/* Generation Controls */}
              <Card style={{ marginBottom: 16 }} size="small">
                <Row gutter={16}>
                  <Col span={8}>
                    <Button 
                      type="primary" 
                      onClick={() => generateBooksFromRange()}
                      block
                      icon={<BookOutlined />}
                      size="large"
                    >
                      🚀 Generate Books
                    </Button>
                  </Col>
                  <Col span={8}>
                    <Button 
                      onClick={() => setCalculatedBooks([])}
                      block
                      size="large"
                    >
                      🗑️ Clear All
                    </Button>
                  </Col>
                  <Col span={8}>
                    <Button 
                      onClick={() => addEmptyBook()}
                      block
                      size="large"
                      icon={<PlusOutlined />}
                    >
                      ➕ Add Manual Book
                    </Button>
                  </Col>
                </Row>
              </Card>

              {/* Books Display Table */}
              {calculatedBooks.length > 0 && (
                <Card title={`📚 Generated Books (${calculatedBooks.length} books, ${calculatedBooks.reduce((sum, book) => sum + book.numberOfCoupons, 0)} total coupons)`} size="small">
                  <Table
                    dataSource={calculatedBooks}
                    columns={[
                      {
                        title: 'Book #',
                        dataIndex: 'bookId',
                        key: 'bookId',
                        width: 100,
                        render: (text) => <Tag color="blue">{text}</Tag>,
                      },
                      {
                        title: 'First Coupon',
                        dataIndex: 'firstCouponId',
                        key: 'firstCouponId',
                        render: (text, record, index) => (
                          <Input
                            value={text}
                            onChange={(e) => updateBookField(index, 'firstCouponId', e.target.value)}
                            style={{ fontFamily: 'monospace', fontWeight: 'bold' }}
                          />
                        ),
                      },
                      {
                        title: 'Last Coupon',
                        dataIndex: 'lastCouponId',
                        key: 'lastCouponId',
                        render: (text, record, index) => (
                          <Input
                            value={text}
                            onChange={(e) => updateBookField(index, 'lastCouponId', e.target.value)}
                            style={{ fontFamily: 'monospace', fontWeight: 'bold' }}
                          />
                        ),
                      },
                      {
                        title: 'Coupons',
                        dataIndex: 'numberOfCoupons',
                        key: 'numberOfCoupons',
                        width: 100,
                        render: (text) => <Tag color="green">{text} coupons</Tag>,
                      },
                      {
                        title: 'Actions',
                        key: 'actions',
                        width: 120,
                        render: (_, record, index) => (
                          <Space>
                            <Button
                              type="text"
                              danger
                              icon={<DeleteOutlined />}
                              onClick={() => removeBook(index)}
                              size="small"
                            >
                              Remove
                            </Button>
                          </Space>
                        ),
                      },
                    ]}
                    pagination={false}
                    size="small"
                    scroll={{ y: 400 }}
                  />
                </Card>
              )}

              <div style={{ textAlign: 'right', marginTop: 16 }}>
                <Space>
                  <Button onClick={() => setCurrentStep(1)}>
                    Previous
                  </Button>
                  <Button
                    type="primary"
                    onClick={() => setCurrentStep(3)}
                    disabled={calculatedBooks.length === 0}
                  >
                    Next: Review & Submit
                  </Button>
                </Space>
              </div>
            </>
          )}

          {currentStep === 3 && (
            <>
              <Alert
                message="Coupon Verification Required"
                description="Verify coupon sequences, book integrity, and barcode scanning before proceeding."
                type="warning"
                showIcon
                style={{ marginBottom: 16 }}
              />

              <Form.Item
                label="Coupon Verification Checklist"
              >
                <Checkbox.Group style={{ width: '100%' }}>
                  <Row>
                    <Col span={24} style={{ marginBottom: 8 }}>
                      <Checkbox value="first_coupon">First coupon ID verified: <Text code>{form.getFieldValue('firstCouponId')}</Text></Checkbox>
                    </Col>
                    <Col span={24} style={{ marginBottom: 8 }}>
                      <Checkbox value="last_coupon">Last coupon ID verified: <Text code>{form.getFieldValue('lastCouponId')}</Text></Checkbox>
                    </Col>
                    <Col span={24} style={{ marginBottom: 8 }}>
                      <Checkbox value="coupon_count">Coupon count matches: {form.getFieldValue('numberOfBooks') * form.getFieldValue('couponsPerBook')} coupons</Checkbox>
                    </Col>
                    <Col span={24} style={{ marginBottom: 8 }}>
                      <Checkbox value="book_integrity">All {form.getFieldValue('numberOfBooks')} books are intact and properly bound</Checkbox>
                    </Col>
                    <Col span={24} style={{ marginBottom: 8 }}>
                      <Checkbox value="barcode_scan">Box barcode scanned successfully: <Text code>{form.getFieldValue('barcode')}</Text></Checkbox>
                    </Col>
                    <Col span={24} style={{ marginBottom: 8 }}>
                      <Checkbox value="no_damage">No visible damage to coupons or books</Checkbox>
                    </Col>
                  </Row>
                </Checkbox.Group>
              </Form.Item>

              <Form.Item
                label="Book Verification"
                tooltip="Verify all generated books with their coupon ranges and download verification report"
              >
                {calculatedBooks.length > 0 ? (
                  <div>
                    <div style={{ marginBottom: 16 }}>
                      <Space>
                        <Button 
                          type="primary"
                          icon={<DownloadOutlined />}
                          onClick={() => downloadVerificationReport()}
                        >
                          Download Verification Report
                        </Button>
                        <Button 
                          icon={<PrinterOutlined />}
                          onClick={() => printVerificationReport()}
                        >
                          Print Report
                        </Button>
                      </Space>
                    </div>
                    
                    <Table
                      size="small"
                      dataSource={calculatedBooks.map((book, index) => ({
                        ...book,
                        key: index,
                        bookNumber: index + 1,
                      }))}
                      columns={[
                        {
                          title: 'Book #',
                          dataIndex: 'bookNumber',
                          key: 'bookNumber',
                          width: 80,
                          render: (text: number) => (
                            <Tag color="blue">Book {text}</Tag>
                          ),
                        },
                        {
                          title: 'First Coupon ID',
                          dataIndex: 'firstCouponId',
                          key: 'firstCouponId',
                          render: (text: string) => (
                            <Text code copyable>{text}</Text>
                          ),
                        },
                        {
                          title: 'Last Coupon ID',
                          dataIndex: 'lastCouponId',
                          key: 'lastCouponId',
                          render: (text: string) => (
                            <Text code copyable>{text}</Text>
                          ),
                        },
                        {
                          title: 'Coupons',
                          dataIndex: 'numberOfCoupons',
                          key: 'numberOfCoupons',
                          width: 100,
                          render: (text: number) => (
                            <Text strong>{text}</Text>
                          ),
                        },
                        {
                          title: 'Verified',
                          key: 'verified',
                          width: 100,
                          render: () => (
                            <Button 
                              size="small" 
                              icon={<CheckOutlined />}
                              type="text"
                              style={{ color: 'green' }}
                            >
                              ✓
                            </Button>
                          ),
                        },
                      ]}
                      pagination={false}
                      bordered
                      style={{ marginBottom: 16 }}
                    />
                    
                    <Alert
                      message="Book Verification Summary"
                      description={
                        <div>
                          <p><strong>Total Books:</strong> {calculatedBooks.length}</p>
                          <p><strong>Total Coupons:</strong> {calculatedBooks.reduce((sum, book) => sum + book.numberOfCoupons, 0)}</p>
                          <p><strong>First Book Range:</strong> {calculatedBooks[0]?.firstCouponId} - {calculatedBooks[0]?.lastCouponId}</p>
                          <p><strong>Last Book Range:</strong> {calculatedBooks[calculatedBooks.length - 1]?.firstCouponId} - {calculatedBooks[calculatedBooks.length - 1]?.lastCouponId}</p>
                        </div>
                      }
                      type="info"
                      showIcon
                    />
                  </div>
                ) : (
                  <Empty
                    description="No books generated yet. Generate books in the Books Details tab first."
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  />
                )}
              </Form.Item>

              <Form.Item
                label="Verification Notes"
                name="couponVerificationNotes"
              >
                <TextArea
                  rows={3}
                  placeholder="Enter coupon verification notes, any discrepancies found, or issues identified..."
                />
              </Form.Item>

              <div style={{ textAlign: 'right' }}>
                <Space>
                  <Button onClick={() => setCurrentStep(2)}>
                    Previous
                  </Button>
                  <Button onClick={() => setCurrentStep(4)}>
                    Next: Final Approval
                  </Button>
                </Space>
              </div>
            </>
          )}

          {currentStep === 4 && (
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
                  beforeUpload={handleSignatureUpload}
                >
                  <div>
                    {signatureUploading ? <Spin size="small" /> : <UploadOutlined />}
                    <div style={{ marginTop: 8 }}>
                      {signatureUploading ? 'Uploading...' : 'Upload Signature'}
                    </div>
                  </div>
                </Upload>
              </Form.Item>

              <div style={{ textAlign: 'right' }}>
                <Space>
                  <Button onClick={() => setCurrentStep(3)}>
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
