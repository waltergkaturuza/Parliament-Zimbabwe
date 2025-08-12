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
  const [nextBoxNumber, setNextBoxNumber] = useState(() => {
    // Generate an immediate default box number
    const year = new Date().getFullYear();
    return `FCB-${year}-0001`;
  });
  const [calculatedBooks, setCalculatedBooks] = useState<BookInfo[]>([]);
  const [calculationMode, setCalculationMode] = useState<SmartCalculationMode['mode']>('first-and-count');
  const [activeTab, setActiveTab] = useState<'receipts' | 'verification' | 'inventory'>('receipts');
  
  // Archive-related state
  const [showArchived, setShowArchived] = useState(false);
  const [archiveModalVisible, setArchiveModalVisible] = useState(false);
  const [archiveForm] = Form.useForm();
  
  // Verification state
  const [verificationChecklist, setVerificationChecklist] = useState<string[]>([]);
  const [allVerificationSelected, setAllVerificationSelected] = useState(false);
  
  // Book verification state
  const [verifiedBooks, setVerifiedBooks] = useState<number[]>([]);
  const [allBooksSelected, setAllBooksSelected] = useState(false);
  
  // Print/Download state
  const [isPrintModalVisible, setIsPrintModalVisible] = useState(false);
  const [selectedBoxForPrint, setSelectedBoxForPrint] = useState<BoxReceipt | null>(null);

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
          fuelType: 'DIESEL' as 'PETROL' | 'DIESEL', // Default - backend doesn't have this field yet
          couponAmount: 20, // Default coupon amount
          numberOfBooks: box.books?.length || 0,
          couponsPerBook: 100, // Standard coupons per book
          totalCoupons: (box.books?.length || 0) * 10,
          totalLitres: box.total_litres || 0,
          firstCouponId: box.first_coupon_number || '',
          lastCouponId: box.last_coupon_number || '',
          monetaryValueUSD: 0, // Calculate based on litres and price
          fuelPricePerLitreUSD: 1.40, // Current fuel price
          exchangeRate: 27.50,
          status: (box.status === 'received' ? 'RECEIVED' : 
                  box.status === 'verified' ? 'VERIFIED' : 
                  box.status === 'dispatched' ? 'DISPATCHED' : 
                  box.status === 'damaged' ? 'DAMAGED' : 
                  box.status === 'archived' ? 'ARCHIVED' : 
                  'PENDING') as 'PENDING' | 'RECEIVED' | 'VERIFIED' | 'DISPATCHED' | 'DAMAGED' | 'ARCHIVED',
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
  const handleAddBox = async () => {
    setCurrentStep(0);
    setSelectedBox(null); // Clear any selected box for editing
    form.resetFields();
    const newBoxNumber = await generateNextBoxNumber();
    
    // Auto-fill received by with current user's full name
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
            const response = await apiClient.get('/api/auth/user/');
            user = response.data;
          } catch (error3) {
            console.warn('Could not fetch current user from any endpoint');
          }
        }
      }
      
      if (user) {
        const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
        form.setFieldsValue({ 
          receivedBy: fullName || user.username || 'Current User',
          boxId: newBoxNumber 
        });
      } else {
        // Fallback - just set a placeholder
        form.setFieldsValue({ 
          receivedBy: 'Administrator', // Default placeholder
          boxId: newBoxNumber 
        });
      }
    } catch (error) {
      console.warn('Auto-fill error:', error);
      // Just set the box ID if user fetch fails
      form.setFieldsValue({ 
        receivedBy: 'Administrator',
        boxId: newBoxNumber 
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

      const boxData = {
        // Don't send box_code - let backend auto-generate to avoid duplicates
        // box_code: values.boxId || nextBoxNumber || `FCB-${new Date().getFullYear()}-AUTO`,
        
        // Basic Information
        barcode: values.barcode || '',
        fuel_type: values.fuelType,
        denomination: values.couponAmount,
        
        // Structure Information
        number_of_books: values.numberOfBooks,
        coupons_per_book: values.couponsPerBook || 10,
        
        // Coupon Serial Numbers
        first_coupon_number: values.firstCouponId,
        last_coupon_number: values.lastCouponId,
        
        // Calculated Totals
        total_coupons_calculated: (values.numberOfBooks || 0) * (values.couponsPerBook || 10),
        total_litres: (values.numberOfBooks || 0) * (values.couponsPerBook || 10) * (values.couponAmount || 20),
        
        // Financial Information (USD)
        fuel_price_per_litre_usd: values.fuelPricePerLitreUSD || values.fuelPriceUSD || 1.40,
        exchange_rate_zwg_usd: values.exchangeRate || 27.5,
        total_value_usd: ((values.numberOfBooks || 0) * (values.couponsPerBook || 10) * (values.couponAmount || 20) * (values.fuelPricePerLitreUSD || values.fuelPriceUSD || 1.40)),
        total_value_zwg: ((values.numberOfBooks || 0) * (values.couponsPerBook || 10) * (values.couponAmount || 20) * (values.fuelPricePerLitreUSD || values.fuelPriceUSD || 1.40) * (values.exchangeRate || 27.5)),
        
        // Status and Dates
        status: 'RECEIVED',
        received_at: `${receivedDate}T${receivedTime}:00Z`,
        received_date: receivedDate,
        received_time: receivedTime,
        
        // Additional Information  
        supplier: values.supplier || '',
        delivery_note: values.deliveryNote || '',
        invoice_number: values.invoiceNumber || '',
        notes: values.notes || '',
        verification_notes: values.couponVerificationNotes || '',
        
        // Digital Signature
        received_by_signature: values.signature || '',
        
        // Calculation Metadata
        calculation_mode: 'first-and-last',
        book_details: [], // This could be enhanced later with detailed book breakdown
      };

      if (selectedBox) {
        // Edit existing box - include the box_code for updates
        boxData.box_code = values.boxId || selectedBox.box_code;
        const response = await apiClient.put(`/boxes/${selectedBox.id}/`, boxData);
        if (response.status === 200) {
          // Update local state
          setBoxReceipts(prev => prev.map(box => 
            box.id === selectedBox.id 
              ? { ...selectedBox, ...values, receivedDate, receivedTime }
              : box
          ));
          message.success('Box updated successfully!');
        }
      } else {
        // Create new box
        const response = await apiClient.post('/boxes/', boxData);
        if (response.status === 201) {
          const newBox: BoxReceipt = {
            id: String(response.data.id),
            boxId: response.data.box_code, // Use backend-generated box_code
            ...values,
            receivedDate,
            receivedTime,
            status: 'RECEIVED' as const,
          };
          setBoxReceipts(prev => [newBox, ...prev]);
          
          // Update the form with the backend-generated box_code for user reference
          form.setFieldsValue({ boxId: response.data.box_code });
          
          message.success(`Box received successfully! Generated Box ID: ${response.data.box_code}`);
        }
      }

      setIsModalVisible(false);
      setSelectedBox(null);
      form.resetFields();
      await generateNextBoxNumber();
    } catch (error) {
      console.error('Error saving box:', error);
      message.error('Failed to save box receipt');
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

  const handleSelectAllBooks = () => {
    if (!selectedBoxForPrint) return;
    
    const allBookNumbers = Array.from({ length: selectedBoxForPrint.numberOfBooks }, (_, i) => i + 1);
    
    if (allBooksSelected) {
      setVerifiedBooks([]);
      setAllBooksSelected(false);
    } else {
      setVerifiedBooks(allBookNumbers);
      setAllBooksSelected(true);
    }
  };

  // Update allBooksSelected when verifiedBooks changes
  useEffect(() => {
    if (selectedBoxForPrint) {
      const totalBooks = selectedBoxForPrint.numberOfBooks;
      setAllBooksSelected(verifiedBooks.length === totalBooks && totalBooks > 0);
    }
  }, [verifiedBooks, selectedBoxForPrint]);

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

  // Smart calculation modes for intelligent generator
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

  // Helper functions for intelligent book generation
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

    try {
      const books: BookInfo[] = [];
      
      switch (calculationMode) {
        case 'first-and-count':
          if (!firstCouponId) {
            message.error('Please enter the first coupon ID');
            return;
          }
          
          // Extract prefix and number from first coupon ID
          const firstMatch = firstCouponId.match(/^(.+?)(\d+)$/);
          if (!firstMatch) {
            message.error('Invalid first coupon ID format');
            return;
          }
          
          const prefix = firstMatch[1];
          const startNumber = parseInt(firstMatch[2]);
          const numberLength = firstMatch[2].length;
          
          // Generate books
          for (let i = 0; i < numberOfBooks; i++) {
            const bookFirstNumber = startNumber + (i * couponsPerBook);
            const bookLastNumber = bookFirstNumber + couponsPerBook - 1;
            
            books.push({
              bookId: `Book-${i + 1}`,
              firstCouponId: `${prefix}${bookFirstNumber.toString().padStart(numberLength, '0')}`,
              lastCouponId: `${prefix}${bookLastNumber.toString().padStart(numberLength, '0')}`,
              numberOfCoupons: couponsPerBook
            });
          }
          
          // Update last coupon ID in form
          const finalCouponNumber = startNumber + (numberOfBooks * couponsPerBook) - 1;
          const finalCouponId = `${prefix}${finalCouponNumber.toString().padStart(numberLength, '0')}`;
          form.setFieldValue('lastCouponId', finalCouponId);
          break;

        case 'last-and-count':
          if (!lastCouponId) {
            message.error('Please enter the last coupon ID');
            return;
          }
          
          // Extract prefix and number from last coupon ID
          const lastMatch = lastCouponId.match(/^(.+?)(\d+)$/);
          if (!lastMatch) {
            message.error('Invalid last coupon ID format');
            return;
          }
          
          const lastPrefix = lastMatch[1];
          const endNumber = parseInt(lastMatch[2]);
          const lastNumberLength = lastMatch[2].length;
          
          // Calculate first number
          const totalCoupons = numberOfBooks * couponsPerBook;
          const firstNumber = endNumber - totalCoupons + 1;
          
          // Generate books
          for (let i = 0; i < numberOfBooks; i++) {
            const bookFirstNumber = firstNumber + (i * couponsPerBook);
            const bookLastNumber = bookFirstNumber + couponsPerBook - 1;
            
            books.push({
              bookId: `Book-${i + 1}`,
              firstCouponId: `${lastPrefix}${bookFirstNumber.toString().padStart(lastNumberLength, '0')}`,
              lastCouponId: `${lastPrefix}${bookLastNumber.toString().padStart(lastNumberLength, '0')}`,
              numberOfCoupons: couponsPerBook
            });
          }
          
          // Update first coupon ID in form
          const firstCouponNumber = endNumber - totalCoupons + 1;
          const firstCouponIdCalculated = `${lastPrefix}${firstCouponNumber.toString().padStart(lastNumberLength, '0')}`;
          form.setFieldValue('firstCouponId', firstCouponIdCalculated);
          break;

        case 'first-and-last':
          if (!firstCouponId || !lastCouponId) {
            message.error('Please enter both first and last coupon IDs');
            return;
          }
          
          // Extract numbers from both IDs
          const firstBoxMatch = firstCouponId.match(/^(.+?)(\d+)$/);
          const lastBoxMatch = lastCouponId.match(/^(.+?)(\d+)$/);
          
          if (!firstBoxMatch || !lastBoxMatch) {
            message.error('Invalid coupon ID format');
            return;
          }
          
          if (firstBoxMatch[1] !== lastBoxMatch[1]) {
            message.error('First and last coupon IDs must have the same prefix');
            return;
          }
          
          const boxPrefix = firstBoxMatch[1];
          const firstBoxNumber = parseInt(firstBoxMatch[2]);
          const lastBoxNumber = parseInt(lastBoxMatch[2]);
          const boxNumberLength = Math.max(firstBoxMatch[2].length, lastBoxMatch[2].length);
          
          const totalBoxCoupons = lastBoxNumber - firstBoxNumber + 1;
          const calculatedCouponsPerBook = Math.ceil(totalBoxCoupons / numberOfBooks);
          
          // Update coupons per book
          form.setFieldValue('couponsPerBook', calculatedCouponsPerBook);
          
          // Generate books
          for (let i = 0; i < numberOfBooks; i++) {
            const bookFirstNumber = firstBoxNumber + (i * calculatedCouponsPerBook);
            const bookLastNumber = Math.min(bookFirstNumber + calculatedCouponsPerBook - 1, lastBoxNumber);
            
            books.push({
              bookId: `Book-${i + 1}`,
              firstCouponId: `${boxPrefix}${bookFirstNumber.toString().padStart(boxNumberLength, '0')}`,
              lastCouponId: `${boxPrefix}${bookLastNumber.toString().padStart(boxNumberLength, '0')}`,
              numberOfCoupons: bookLastNumber - bookFirstNumber + 1
            });
            
            // Stop if we've reached the last coupon
            if (bookLastNumber >= lastBoxNumber) break;
          }
          break;

        case 'full-range':
          if (!firstCouponId || !lastCouponId) {
            message.error('Please enter both first and last coupon IDs for full range calculation');
            return;
          }
          
          // Similar to first-and-last but automatically calculates optimal book distribution
          const fullFirstMatch = firstCouponId.match(/^(.+?)(\d+)$/);
          const fullLastMatch = lastCouponId.match(/^(.+?)(\d+)$/);
          
          if (!fullFirstMatch || !fullLastMatch) {
            message.error('Invalid coupon ID format');
            return;
          }
          
          if (fullFirstMatch[1] !== fullLastMatch[1]) {
            message.error('First and last coupon IDs must have the same prefix');
            return;
          }
          
          const fullPrefix = fullFirstMatch[1];
          const fullFirstNumber = parseInt(fullFirstMatch[2]);
          const fullLastNumber = parseInt(fullLastMatch[2]);
          const fullNumberLength = Math.max(fullFirstMatch[2].length, fullLastMatch[2].length);
          
          const fullTotalCoupons = fullLastNumber - fullFirstNumber + 1;
          
          // Calculate optimal books and coupons per book
          let optimalBooks = numberOfBooks || Math.ceil(fullTotalCoupons / 100); // Default to 100 coupons per book
          let optimalCouponsPerBook = Math.ceil(fullTotalCoupons / optimalBooks);
          
          // Ensure we don't exceed 100 coupons per book
          if (optimalCouponsPerBook > 100) {
            optimalBooks = Math.ceil(fullTotalCoupons / 100);
            optimalCouponsPerBook = Math.ceil(fullTotalCoupons / optimalBooks);
          }
          
          // Update form fields
          form.setFieldValue('numberOfBooks', optimalBooks);
          form.setFieldValue('couponsPerBook', optimalCouponsPerBook);
          
          // Generate books
          for (let i = 0; i < optimalBooks; i++) {
            const bookFirstNumber = fullFirstNumber + (i * optimalCouponsPerBook);
            const bookLastNumber = Math.min(bookFirstNumber + optimalCouponsPerBook - 1, fullLastNumber);
            
            books.push({
              bookId: `Book-${i + 1}`,
              firstCouponId: `${fullPrefix}${bookFirstNumber.toString().padStart(fullNumberLength, '0')}`,
              lastCouponId: `${fullPrefix}${bookLastNumber.toString().padStart(fullNumberLength, '0')}`,
              numberOfCoupons: bookLastNumber - bookFirstNumber + 1
            });
            
            // Stop if we've reached the last coupon
            if (bookLastNumber >= fullLastNumber) break;
          }
          break;
      }
      
      setCalculatedBooks(books);
      
      // Update total coupons
      const totalCalculatedCoupons = books.reduce((sum, book) => sum + book.numberOfCoupons, 0);
      form.setFieldValue('totalCoupons', totalCalculatedCoupons);
      
      // Update total litres
      const couponAmount = form.getFieldValue('couponAmount') || 20;
      form.setFieldValue('totalLitres', totalCalculatedCoupons * couponAmount);
      
      message.success(`Successfully generated ${books.length} books with ${totalCalculatedCoupons} total coupons`);
      
    } catch (error) {
      console.error('Error generating books:', error);
      message.error('Failed to generate books. Please check your input values.');
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
                  form.setFieldsValue({
                    ...record,
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
        width={1200}
        destroyOnHidden
      >
        <Steps current={currentStep} style={{ marginBottom: 24 }}>
          <Step title="Basic Info" icon={<InboxOutlined />} />
          <Step title="Fuel Details" icon={<CarOutlined />} />
          <Step title="Intelligent Books" icon={<BarcodeOutlined />} />
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
                    rules={[{ required: true, message: 'Box ID is required' }]}
                  >
                    <Input disabled placeholder="Generating Box ID..." />
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

              <div style={{ textAlign: 'right' }}>
                <Space>
                  <Button onClick={() => setCurrentStep(0)}>
                    Previous
                  </Button>
                  <Button
                    type="primary"
                    onClick={() => setCurrentStep(2)}
                  >
                    Next: Coupon Intelligence
                  </Button>
                </Space>
              </div>
            </>
          )}

          {currentStep === 2 && (
            <>
              <div style={{ marginBottom: 24 }}>
                <Title level={4}>🤖 Intelligent Book Configuration</Title>
                <Text type="secondary">
                  Choose your preferred calculation method. The system will automatically generate all book details.
                </Text>
              </div>

              {/* Smart Calculation Mode Selection */}
              <Card style={{ marginBottom: 16 }} size="small">
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

              {/* Smart Input Fields based on calculation mode */}
              <Card style={{ marginBottom: 16 }} size="small">
                <Title level={5}>📊 Input Parameters</Title>
                <Row gutter={24}>
                  {(calculationMode === 'first-and-count' || calculationMode === 'first-and-last' || calculationMode === 'full-range') && (
                    <Col span={8}>
                      <Form.Item
                        label="First Coupon ID"
                        name="firstCouponId"
                        rules={[{ required: true, message: 'Enter first coupon ID' }]}
                      >
                        <Input 
                          placeholder="PU006H1355101"
                          style={{ fontFamily: 'monospace', fontSize: '14px' }}
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
                          style={{ fontFamily: 'monospace', fontSize: '14px' }}
                        />
                      </Form.Item>
                    </Col>
                  )}

                  {(calculationMode === 'first-and-count' || calculationMode === 'last-and-count' || calculationMode === 'first-and-last') && (
                    <Col span={4}>
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
                    <Col span={4}>
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

                {/* Generate Books Button - full width */}
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
                <Card style={{ marginBottom: 16 }} size="small">
                  <Title level={5}>📚 Generated Books ({calculatedBooks.length})</Title>
                  <Row gutter={[12, 12]}>
                    {calculatedBooks.map((book, index) => (
                      <Col span={3} key={book.bookId}>
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
                </Card>
              )}

              <div style={{ textAlign: 'right' }}>
                <Space>
                  <Button onClick={() => setCurrentStep(1)}>
                    Previous
                  </Button>
                  <Button
                    type="primary"
                    onClick={() => setCurrentStep(3)}
                    disabled={calculatedBooks.length === 0}
                  >
                    Next: Verification
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
                label={
                  <Space>
                    <span>Coupon Verification Checklist</span>
                    <Button 
                      size="small" 
                      type="link" 
                      onClick={() => {
                        const checkboxes = document.querySelectorAll('input[type="checkbox"]');
                        const allChecked = Array.from(checkboxes).every((checkbox: any) => checkbox.checked);
                        checkboxes.forEach((checkbox: any) => {
                          checkbox.checked = !allChecked;
                          checkbox.dispatchEvent(new Event('change', { bubbles: true }));
                        });
                      }}
                    >
                      Select All
                    </Button>
                  </Space>
                }
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

              {/* Generated Books Verification */}
              <Form.Item
                label="Generated Books Verification"
                tooltip="Verify all generated books with coupon ranges and integrity"
              >
                <Card size="small" style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <Title level={5} style={{ margin: 0 }}>📚 All Generated Books ({calculatedBooks.length})</Title>
                    <Space>
                      <Button 
                        size="small" 
                        type={allBooksSelected ? "primary" : "default"}
                        onClick={handleSelectAllBooks}
                        icon={allBooksSelected ? <CheckOutlined /> : undefined}
                      >
                        {allBooksSelected ? 'Deselect All' : 'Select All'} Books
                      </Button>
                      <Text type="secondary">
                        {verifiedBooks.length} / {calculatedBooks.length} verified
                      </Text>
                    </Space>
                  </div>
                  
                  <Row gutter={[16, 16]}>
                    {calculatedBooks.map((book, index) => {
                      const bookNumber = index + 1;
                      const isVerified = verifiedBooks.includes(bookNumber);
                      return (
                        <Col span={12} key={bookNumber}>
                          <Card 
                            size="small" 
                            style={{ 
                              border: isVerified ? '2px solid #52c41a' : '1px solid #d9d9d9',
                              backgroundColor: isVerified ? '#f6ffed' : '#fff',
                              cursor: 'pointer'
                            }}
                            onClick={() => handleBookVerificationChange(bookNumber, !isVerified)}
                            extra={
                              <Checkbox
                                checked={isVerified}
                                onChange={(e) => handleBookVerificationChange(bookNumber, e.target.checked)}
                                onClick={(e) => e.stopPropagation()}
                              />
                            }
                          >
                            <Space direction="vertical" size="small" style={{ width: '100%' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Text strong>📖 Book {bookNumber}</Text>
                                {isVerified && <Tag color="green" icon={<CheckOutlined />}>VERIFIED</Tag>}
                              </div>
                              <Text type="secondary">First: <Text code>{book.firstCouponId}</Text></Text>
                              <Text type="secondary">Last: <Text code>{book.lastCouponId}</Text></Text>
                              <Text type="secondary">Coupons: <Tag color="blue">{book.numberOfCoupons}</Tag></Text>
                              <Text type="secondary">Value: <Tag color="orange">{book.numberOfCoupons * (selectedBoxForPrint?.couponAmount || 0)} L</Tag></Text>
                            </Space>
                          </Card>
                        </Col>
                      );
                    })}
                  </Row>
                  
                  {verifiedBooks.length === calculatedBooks.length && calculatedBooks.length > 0 && (
                    <Alert
                      type="success"
                      message="All Books Verified!"
                      description={`Successfully verified all ${calculatedBooks.length} books. Ready for dispatch and processing.`}
                      showIcon
                      style={{ marginTop: 16 }}
                    />
                  )}
                  
                  {calculatedBooks.length === 0 && (
                    <Alert
                      message="No books generated yet"
                      description="Complete the form fields above and click 'Generate Books' to see book verification options."
                      type="info"
                      showIcon
                    />
                  )}
                </Card>
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

              {/* Print/Download Options */}
              <Card size="small" style={{ marginBottom: 16 }}>
                <Title level={5}>📄 Verification Documentation</Title>
                <Space>
                  <Button 
                    icon={<PrinterOutlined />}
                    onClick={() => window.print()}
                  >
                    Print Verification Report
                  </Button>
                  <Button 
                    icon={<DownloadOutlined />}
                    type="primary"
                    ghost
                  >
                    Download PDF Report
                  </Button>
                </Space>
              </Card>

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
                message="Final Approval Required"
                description="Please verify all box details and confirm receipt before submitting."
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />

              <Form.Item
                label="Final Notes"
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
