import React, { useState, useEffect } from 'react';
import {
  Card,
  Steps,
  Form,
  Input,
  Select,
  Button,
  Table,
  Tag,
  Space,
  Modal,
  Checkbox,
  InputNumber,
  DatePicker,
  TimePicker,
  Row,
  Col,
  Statistic,
  Alert,
  Divider,
  Typography,
  List,
  Badge,
  Descriptions,
  Upload,
  message,
  Tabs,
  Radio,
  AutoComplete,
  Tooltip,
  Progress,
  Result,
  Spin
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  PrinterOutlined,
  DownloadOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  UserOutlined,
  CarOutlined,
  FileTextOutlined,
  QrcodeOutlined,
  BarcodeOutlined,
  SignatureOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  TagsOutlined,
  DollarOutlined,
  ThunderboltOutlined,
  SafetyCertificateOutlined,
  GiftOutlined,
  DeliveredProcedureOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Step } = Steps;
const { TabPane } = Tabs;
const { TextArea } = Input;
const { Option } = Select;

// Enhanced interfaces for Coupon Handover
interface CouponHandoverEnhanced {
  id: number;
  handoverId: string;
  beneficiary: BeneficiaryProfile;
  handoverMode: 'entitlement-based' | 'serial-range' | 'quantity-based' | 'emergency-allocation';
  selectedCoupons: HandoverCoupon[];
  status: 'PENDING' | 'CONFIGURED' | 'VERIFIED' | 'HANDED_OVER' | 'RECEIVED' | 'CONFIRMED' | 'CANCELLED';
  
  // Handover method
  handoverMethod: 'DIRECT_PICKUP' | 'OFFICE_DELIVERY' | 'COURIER' | 'REPRESENTATIVE';
  
  // Representative details (if applicable)
  representativeName?: string;
  representativeId?: string;
  representativePhone?: string;
  authorizationLetter?: string;
  
  // Handover logistics
  scheduledDate?: string;
  scheduledTime?: string;
  handoverLocation?: string;
  specialInstructions?: string;
  
  // User tracking
  handedOverBy?: string;
  handedOverDate?: string;
  handedOverTime?: string;
  receivedBy?: string;
  receivedDate?: string;
  receivedTime?: string;
  
  // Verification and confirmation
  beneficiarySignature?: string;
  representativeSignature?: string;
  witnessSignature?: string;
  witnessName?: string;
  verificationChecks: string[];
  verificationNotes?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  
  // Documentation
  handoverDocument?: string;
  receiptGenerated?: boolean;
  deliveryNote?: string;
  handoverNotes?: string;
  
  // Summary calculations
  totalCoupons: number;
  totalLitres: number;
  totalValue: number;
  firstSerial?: string;
  lastSerial?: string;
}

interface HandoverCoupon {
  couponId: string;
  couponNumber: string;
  bookId: string;
  bookNumber: string;
  boxCode: string;
  fuelType: 'PETROL' | 'DIESEL';
  denomination: 5 | 10 | 20 | 50;
  status: 'AVAILABLE' | 'SELECTED' | 'VERIFIED';
  serialNumber: string;
  isSelected: boolean;
  litres: number;
  value: number;
}

interface BeneficiaryProfile {
  id: number;
  name: string;
  employeeId: string;
  role: string;
  category: string;
  constituency?: string;
  department?: string;
  contactInfo: {
    email: string;
    phone: string;
    office: string;
  };
  vehicleInfo: {
    make: string;
    model: string;
    year: number;
    engine_size: string;
    registration: string;
    fuel_type: 'PETROL' | 'DIESEL';
  };
  entitlementProfile: {
    monthlyEntitlement: number;
    currentBalance: number;
    usedThisMonth: number;
    lastHandoverDate?: string;
  };
}

interface IntelligentHandoverConfig {
  mode: 'entitlement-based' | 'serial-range' | 'quantity-based' | 'emergency-allocation';
  
  // Entitlement-based configuration
  useMonthlyEntitlement?: boolean;
  customAmount?: number;
  respectBalance?: boolean;
  
  // Serial range configuration
  startSerial?: string;
  endSerial?: string;
  validateSequence?: boolean;
  
  // Quantity-based configuration
  requestedQuantity?: number;
  preferredFuelType?: 'PETROL' | 'DIESEL';
  preferredDenomination?: number;
  allowMixed?: boolean;
  
  // Emergency allocation
  emergencyReason?: string;
  approvedBy?: string;
  overrideEntitlement?: boolean;
}

const CouponHandoverManagementEnhanced: React.FC = () => {
  // Core state management
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [handoverForm] = Form.useForm();
  const [verificationForm] = Form.useForm();
  
  // Data state
  const [handovers, setHandovers] = useState<CouponHandoverEnhanced[]>([]);
  const [currentHandover, setCurrentHandover] = useState<CouponHandoverEnhanced | null>(null);
  const [beneficiaries, setBeneficiaries] = useState<BeneficiaryProfile[]>([]);
  const [availableCoupons, setAvailableCoupons] = useState<HandoverCoupon[]>([]);
  const [selectedCoupons, setSelectedCoupons] = useState<HandoverCoupon[]>([]);
  
  // UI state
  const [showHandoverModal, setShowHandoverModal] = useState(false);
  const [handoverMode, setHandoverMode] = useState<string>('entitlement-based');
  const [selectedBeneficiary, setSelectedBeneficiary] = useState<BeneficiaryProfile | null>(null);
  const [intelligentConfig, setIntelligentConfig] = useState<IntelligentHandoverConfig>({
    mode: 'entitlement-based'
  });
  
  // Verification state
  const [verificationChecks, setVerificationChecks] = useState<string[]>([]);
  const [previewMode, setPreviewMode] = useState(false);

  // Sample data - In real app, this would come from API
  useEffect(() => {
    loadSampleData();
  }, []);

  const loadSampleData = () => {
    // Sample beneficiaries
    setBeneficiaries([
      {
        id: 1,
        name: 'Hon. John Mukamuri',
        employeeId: 'MP001',
        role: 'MEMBER_OF_PARLIAMENT',
        category: 'MP',
        constituency: 'Harare East',
        department: 'Transport Committee',
        contactInfo: {
          email: 'j.mukamuri@parliament.gov.zw',
          phone: '+263771234567',
          office: 'Room 201, Parliament Building'
        },
        vehicleInfo: {
          make: 'Toyota',
          model: 'Prado',
          year: 2022,
          engine_size: '3.0L V6',
          registration: 'AFK-8834',
          fuel_type: 'DIESEL'
        },
        entitlementProfile: {
          monthlyEntitlement: 300,
          currentBalance: 120,
          usedThisMonth: 180,
          lastHandoverDate: '2024-08-01'
        }
      },
      {
        id: 2,
        name: 'Sen. Mary Chigumba',
        employeeId: 'SEN002',
        role: 'SENATOR',
        category: 'Senator',
        constituency: 'Manicaland Province',
        department: 'Finance Committee',
        contactInfo: {
          email: 'm.chigumba@parliament.gov.zw',
          phone: '+263772345678',
          office: 'Room 305, Senate Wing'
        },
        vehicleInfo: {
          make: 'Mercedes',
          model: 'C-Class',
          year: 2021,
          engine_size: '2.0L',
          registration: 'AFK-9245',
          fuel_type: 'PETROL'
        },
        entitlementProfile: {
          monthlyEntitlement: 250,
          currentBalance: 200,
          usedThisMonth: 50,
          lastHandoverDate: '2024-07-28'
        }
      }
    ]);

    // Sample available coupons
    setAvailableCoupons([
      {
        couponId: 'C001',
        couponNumber: 'PU006GH355101',
        bookId: 'BOOK001',
        bookNumber: 'Book 01',
        boxCode: 'FCB-2024-0005',
        fuelType: 'DIESEL',
        denomination: 20,
        status: 'AVAILABLE',
        serialNumber: 'PU006GH355101',
        isSelected: false,
        litres: 20,
        value: 28.00
      },
      {
        couponId: 'C002',
        couponNumber: 'PU006GH355102',
        bookId: 'BOOK001',
        bookNumber: 'Book 01',
        boxCode: 'FCB-2024-0005',
        fuelType: 'DIESEL',
        denomination: 20,
        status: 'AVAILABLE',
        serialNumber: 'PU006GH355102',
        isSelected: false,
        litres: 20,
        value: 28.00
      }
    ]);
  };

  // Step configuration
  const steps = [
    {
      title: 'Configuration',
      icon: <UserOutlined />,
      description: 'Select beneficiary and handover mode'
    },
    {
      title: 'Generation',
      icon: <ThunderboltOutlined />,
      description: 'Generate coupon selection intelligently'
    },
    {
      title: 'Verification',
      icon: <SafetyCertificateOutlined />,
      description: 'Verify selection and logistics'
    },
    {
      title: 'Handover',
      icon: <GiftOutlined />,
      description: 'Physical handover and signatures'
    },
    {
      title: 'Confirmation',
      icon: <CheckCircleOutlined />,
      description: 'Final confirmation and documentation'
    }
  ];

  // Intelligent generation modes
  const generationModes = [
    {
      value: 'entitlement-based',
      title: 'Entitlement-Based Handover',
      description: 'Use beneficiary entitlement calculations',
      icon: <DollarOutlined />
    },
    {
      value: 'serial-range',
      title: 'Serial Range Handover',
      description: 'Specify first and last coupon serials',
      icon: <BarcodeOutlined />
    },
    {
      value: 'quantity-based',
      title: 'Quantity-Based Handover',
      description: 'Specify number of coupons needed',
      icon: <TagsOutlined />
    },
    {
      value: 'emergency-allocation',
      title: 'Emergency Allocation',
      description: 'Emergency or special circumstances',
      icon: <ExclamationCircleOutlined />
    }
  ];

  // Handover methods
  const handoverMethods = [
    { value: 'DIRECT_PICKUP', label: 'Direct Pickup', icon: <UserOutlined /> },
    { value: 'OFFICE_DELIVERY', label: 'Office Delivery', icon: <DeliveredProcedureOutlined /> },
    { value: 'COURIER', label: 'Courier Service', icon: <CarOutlined /> },
    { value: 'REPRESENTATIVE', label: 'Authorized Representative', icon: <FileTextOutlined /> }
  ];

  // Verification checklist
  const verificationChecklistItems = [
    'Beneficiary identity verified',
    'Representative authorization confirmed',
    'Coupon serial numbers validated',
    'Entitlement limits checked',
    'Vehicle registration confirmed',
    'Handover documentation complete',
    'Digital signatures obtained',
    'System records updated'
  ];

  // Event handlers
  const handleStartNewHandover = () => {
    setCurrentHandover(null);
    setSelectedBeneficiary(null);
    setSelectedCoupons([]);
    setCurrentStep(0);
    setShowHandoverModal(true);
    handoverForm.resetFields();
  };

  const handleBeneficiarySelect = (beneficiaryId: number) => {
    const beneficiary = beneficiaries.find(b => b.id === beneficiaryId);
    if (beneficiary) {
      setSelectedBeneficiary(beneficiary);
      handoverForm.setFieldsValue({
        beneficiaryId,
        handoverMethod: 'DIRECT_PICKUP',
        scheduledDate: dayjs(),
        scheduledTime: dayjs()
      });
    }
  };

  const handleModeChange = (mode: string) => {
    setHandoverMode(mode);
    setIntelligentConfig({ 
      mode: mode as any,
      useMonthlyEntitlement: mode === 'entitlement-based',
      respectBalance: true,
      validateSequence: mode === 'serial-range',
      allowMixed: mode === 'quantity-based'
    });
  };

  const handleIntelligentGeneration = async () => {
    if (!selectedBeneficiary) {
      message.error('Please select a beneficiary first');
      return;
    }

    setLoading(true);
    try {
      // Simulate intelligent generation based on mode
      let generatedCoupons: HandoverCoupon[] = [];
      
      switch (intelligentConfig.mode) {
        case 'entitlement-based':
          generatedCoupons = generateByEntitlement();
          break;
        case 'serial-range':
          generatedCoupons = generateBySerialRange();
          break;
        case 'quantity-based':
          generatedCoupons = generateByQuantity();
          break;
        case 'emergency-allocation':
          generatedCoupons = generateEmergencyAllocation();
          break;
      }

      setSelectedCoupons(generatedCoupons);
      setCurrentStep(2); // Move to verification
      message.success(`Generated ${generatedCoupons.length} coupons for handover`);
    } catch (error) {
      message.error('Error generating coupon selection');
    } finally {
      setLoading(false);
    }
  };

  const generateByEntitlement = (): HandoverCoupon[] => {
    if (!selectedBeneficiary) return [];
    
    const { currentBalance } = selectedBeneficiary.entitlementProfile;
    const neededLitres = intelligentConfig.useMonthlyEntitlement 
      ? Math.min(currentBalance, intelligentConfig.customAmount || currentBalance)
      : intelligentConfig.customAmount || 100;
    
    // Filter available coupons by fuel type
    let availableFiltered = availableCoupons.filter(c => 
      c.fuelType === selectedBeneficiary.vehicleInfo.fuel_type && 
      c.status === 'AVAILABLE'
    );
    
    let totalLitres = 0;
    const selected: HandoverCoupon[] = [];
    
    for (const coupon of availableFiltered) {
      if (totalLitres >= neededLitres) break;
      selected.push({ ...coupon, isSelected: true, status: 'SELECTED' });
      totalLitres += coupon.litres;
    }
    
    return selected;
  };

  const generateBySerialRange = (): HandoverCoupon[] => {
    const { startSerial, endSerial } = intelligentConfig;
    if (!startSerial || !endSerial) return [];
    
    // Parse serial numbers and generate range
    return availableCoupons.filter(c => 
      c.serialNumber >= startSerial && 
      c.serialNumber <= endSerial
    ).map(c => ({ ...c, isSelected: true, status: 'SELECTED' }));
  };

  const generateByQuantity = (): HandoverCoupon[] => {
    const { requestedQuantity, preferredFuelType, preferredDenomination } = intelligentConfig;
    if (!requestedQuantity) return [];
    
    let filtered = availableCoupons.filter(c => c.status === 'AVAILABLE');
    
    if (preferredFuelType) {
      filtered = filtered.filter(c => c.fuelType === preferredFuelType);
    }
    
    if (preferredDenomination) {
      filtered = filtered.filter(c => c.denomination === preferredDenomination);
    }
    
    return filtered.slice(0, requestedQuantity).map(c => ({ 
      ...c, 
      isSelected: true, 
      status: 'SELECTED' 
    }));
  };

  const generateEmergencyAllocation = (): HandoverCoupon[] => {
    // Emergency allocation logic - could override normal restrictions
    const { requestedQuantity = 10 } = intelligentConfig;
    return availableCoupons.slice(0, requestedQuantity).map(c => ({ 
      ...c, 
      isSelected: true, 
      status: 'SELECTED' 
    }));
  };

  const handleVerificationComplete = async () => {
    try {
      const values = await verificationForm.validateFields();
      setVerificationChecks(values.verificationChecks || []);
      setCurrentStep(3); // Move to handover
      message.success('Verification completed successfully');
    } catch (error) {
      message.error('Please complete all verification checks');
    }
  };

  const handleHandoverComplete = async () => {
    try {
      const values = await handoverForm.validateFields();
      
      // Create handover record
      const newHandover: CouponHandoverEnhanced = {
        id: Date.now(),
        handoverId: `HO-${Date.now()}`,
        beneficiary: selectedBeneficiary!,
        handoverMode: intelligentConfig.mode,
        selectedCoupons,
        status: 'HANDED_OVER',
        handoverMethod: values.handoverMethod,
        representativeName: values.representativeName,
        representativeId: values.representativeId,
        representativePhone: values.representativePhone,
        authorizationLetter: values.authorizationLetter,
        scheduledDate: values.scheduledDate?.format('YYYY-MM-DD'),
        scheduledTime: values.scheduledTime?.format('HH:mm'),
        handoverLocation: values.handoverLocation,
        specialInstructions: values.specialInstructions,
        handedOverBy: 'Current User', // Would be from auth context
        handedOverDate: dayjs().format('YYYY-MM-DD'),
        handedOverTime: dayjs().format('HH:mm'),
        verificationChecks,
        verificationNotes: values.verificationNotes,
        verifiedBy: 'Current User',
        verifiedAt: dayjs().toISOString(),
        deliveryNote: values.deliveryNote,
        handoverNotes: values.handoverNotes,
        totalCoupons: selectedCoupons.length,
        totalLitres: selectedCoupons.reduce((sum, c) => sum + c.litres, 0),
        totalValue: selectedCoupons.reduce((sum, c) => sum + c.value, 0),
        firstSerial: selectedCoupons[0]?.serialNumber,
        lastSerial: selectedCoupons[selectedCoupons.length - 1]?.serialNumber
      };
      
      setHandovers(prev => [newHandover, ...prev]);
      setCurrentStep(4); // Move to confirmation
      message.success('Handover completed successfully');
    } catch (error) {
      message.error('Error completing handover');
    }
  };

  const handleFinalConfirmation = () => {
    setShowHandoverModal(false);
    message.success('Coupon handover process completed successfully');
  };

  const handlePrintReceipt = () => {
    // Print functionality
    message.info('Generating handover receipt...');
  };

  const handleDownloadDocument = () => {
    // Download functionality
    message.info('Downloading handover documentation...');
  };

  // Calculate totals for selected coupons
  const calculateTotals = () => {
    return {
      totalCoupons: selectedCoupons.length,
      totalLitres: selectedCoupons.reduce((sum, c) => sum + c.litres, 0),
      totalValue: selectedCoupons.reduce((sum, c) => sum + c.value, 0)
    };
  };

  // Render configuration step
  const renderConfigurationStep = () => (
    <div className="handover-configuration">
      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Card title="Select Beneficiary" size="small">
            <Select
              style={{ width: '100%' }}
              placeholder="Search and select beneficiary"
              showSearch
              optionFilterProp="children"
              onChange={handleBeneficiarySelect}
              filterOption={(input, option) =>
                option?.children?.toString().toLowerCase().includes(input.toLowerCase()) ?? false
              }
            >
              {beneficiaries.map(beneficiary => (
                <Option key={beneficiary.id} value={beneficiary.id}>
                  {beneficiary.name} ({beneficiary.employeeId})
                </Option>
              ))}
            </Select>
            
            {selectedBeneficiary && (
              <div style={{ marginTop: 16 }}>
                <Descriptions size="small" column={1}>
                  <Descriptions.Item label="Role">{selectedBeneficiary.category}</Descriptions.Item>
                  <Descriptions.Item label="Department">{selectedBeneficiary.department}</Descriptions.Item>
                  <Descriptions.Item label="Vehicle">{selectedBeneficiary.vehicleInfo.make} {selectedBeneficiary.vehicleInfo.model}</Descriptions.Item>
                  <Descriptions.Item label="Fuel Type">{selectedBeneficiary.vehicleInfo.fuel_type}</Descriptions.Item>
                </Descriptions>
              </div>
            )}
          </Card>
        </Col>
        
        <Col span={12}>
          <Card title="Entitlement Summary" size="small">
            {selectedBeneficiary ? (
              <Row gutter={[8, 8]}>
                <Col span={12}>
                  <Statistic
                    title="Monthly Entitlement"
                    value={selectedBeneficiary.entitlementProfile.monthlyEntitlement}
                    suffix="L"
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="Current Balance"
                    value={selectedBeneficiary.entitlementProfile.currentBalance}
                    suffix="L"
                    valueStyle={{ color: '#3f8600' }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="Used This Month"
                    value={selectedBeneficiary.entitlementProfile.usedThisMonth}
                    suffix="L"
                    valueStyle={{ color: '#cf1322' }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="Usage %"
                    value={Math.round((selectedBeneficiary.entitlementProfile.usedThisMonth / selectedBeneficiary.entitlementProfile.monthlyEntitlement) * 100)}
                    suffix="%"
                  />
                </Col>
              </Row>
            ) : (
              <Text type="secondary">Select a beneficiary to view entitlement details</Text>
            )}
          </Card>
        </Col>
      </Row>

      <Card title="Select Handover Mode" style={{ marginTop: 16 }}>
        <Radio.Group 
          value={handoverMode} 
          onChange={(e) => handleModeChange(e.target.value)}
          style={{ width: '100%' }}
        >
          <Row gutter={[16, 16]}>
            {generationModes.map(mode => (
              <Col span={6} key={mode.value}>
                <Radio.Button 
                  value={mode.value} 
                  style={{ 
                    width: '100%', 
                    height: 'auto', 
                    padding: '12px',
                    textAlign: 'center',
                    whiteSpace: 'normal'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>
                      {mode.icon}
                    </div>
                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                      {mode.title}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      {mode.description}
                    </div>
                  </div>
                </Radio.Button>
              </Col>
            ))}
          </Row>
        </Radio.Group>
      </Card>

      <div style={{ textAlign: 'center', marginTop: 24 }}>
        <Button 
          type="primary" 
          size="large"
          disabled={!selectedBeneficiary}
          onClick={() => setCurrentStep(1)}
          icon={<ThunderboltOutlined />}
        >
          Configure Intelligent Generation
        </Button>
      </div>
    </div>
  );

  // Render generation step
  const renderGenerationStep = () => (
    <div className="handover-generation">
      <Card title={`${generationModes.find(m => m.value === handoverMode)?.title} Configuration`}>
        <Row gutter={[16, 16]}>
          {handoverMode === 'entitlement-based' && (
            <>
              <Col span={12}>
                <Checkbox
                  checked={intelligentConfig.useMonthlyEntitlement}
                  onChange={(e) => setIntelligentConfig(prev => ({ 
                    ...prev, 
                    useMonthlyEntitlement: e.target.checked 
                  }))}
                >
                  Use Monthly Entitlement Balance
                </Checkbox>
              </Col>
              <Col span={12}>
                <Checkbox
                  checked={intelligentConfig.respectBalance}
                  onChange={(e) => setIntelligentConfig(prev => ({ 
                    ...prev, 
                    respectBalance: e.target.checked 
                  }))}
                >
                  Respect Entitlement Limits
                </Checkbox>
              </Col>
              {!intelligentConfig.useMonthlyEntitlement && (
                <Col span={24}>
                  <InputNumber
                    style={{ width: '100%' }}
                    placeholder="Custom amount (litres)"
                    value={intelligentConfig.customAmount}
                    onChange={(value) => setIntelligentConfig(prev => ({ 
                      ...prev, 
                      customAmount: value || 0 
                    }))}
                    min={0}
                    max={1000}
                  />
                </Col>
              )}
            </>
          )}

          {handoverMode === 'serial-range' && (
            <>
              <Col span={12}>
                <Input
                  placeholder="Start Serial (e.g., PU006GH355101)"
                  value={intelligentConfig.startSerial}
                  onChange={(e) => setIntelligentConfig(prev => ({ 
                    ...prev, 
                    startSerial: e.target.value 
                  }))}
                />
              </Col>
              <Col span={12}>
                <Input
                  placeholder="End Serial (e.g., PU006GH355150)"
                  value={intelligentConfig.endSerial}
                  onChange={(e) => setIntelligentConfig(prev => ({ 
                    ...prev, 
                    endSerial: e.target.value 
                  }))}
                />
              </Col>
              <Col span={24}>
                <Checkbox
                  checked={intelligentConfig.validateSequence}
                  onChange={(e) => setIntelligentConfig(prev => ({ 
                    ...prev, 
                    validateSequence: e.target.checked 
                  }))}
                >
                  Validate Serial Sequence
                </Checkbox>
              </Col>
            </>
          )}

          {handoverMode === 'quantity-based' && (
            <>
              <Col span={8}>
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="Quantity"
                  value={intelligentConfig.requestedQuantity}
                  onChange={(value) => setIntelligentConfig(prev => ({ 
                    ...prev, 
                    requestedQuantity: value || 1 
                  }))}
                  min={1}
                  max={100}
                />
              </Col>
              <Col span={8}>
                <Select
                  style={{ width: '100%' }}
                  placeholder="Fuel Type"
                  value={intelligentConfig.preferredFuelType}
                  onChange={(value) => setIntelligentConfig(prev => ({ 
                    ...prev, 
                    preferredFuelType: value 
                  }))}
                >
                  <Option value="PETROL">Petrol</Option>
                  <Option value="DIESEL">Diesel</Option>
                </Select>
              </Col>
              <Col span={8}>
                <Select
                  style={{ width: '100%' }}
                  placeholder="Denomination"
                  value={intelligentConfig.preferredDenomination}
                  onChange={(value) => setIntelligentConfig(prev => ({ 
                    ...prev, 
                    preferredDenomination: value 
                  }))}
                >
                  <Option value={5}>5 Litres</Option>
                  <Option value={10}>10 Litres</Option>
                  <Option value={20}>20 Litres</Option>
                  <Option value={50}>50 Litres</Option>
                </Select>
              </Col>
              <Col span={24}>
                <Checkbox
                  checked={intelligentConfig.allowMixed}
                  onChange={(e) => setIntelligentConfig(prev => ({ 
                    ...prev, 
                    allowMixed: e.target.checked 
                  }))}
                >
                  Allow Mixed Denominations
                </Checkbox>
              </Col>
            </>
          )}

          {handoverMode === 'emergency-allocation' && (
            <>
              <Col span={24}>
                <TextArea
                  rows={3}
                  placeholder="Emergency allocation reason"
                  value={intelligentConfig.emergencyReason}
                  onChange={(e) => setIntelligentConfig(prev => ({ 
                    ...prev, 
                    emergencyReason: e.target.value 
                  }))}
                />
              </Col>
              <Col span={12}>
                <Input
                  placeholder="Approved by"
                  value={intelligentConfig.approvedBy}
                  onChange={(e) => setIntelligentConfig(prev => ({ 
                    ...prev, 
                    approvedBy: e.target.value 
                  }))}
                />
              </Col>
              <Col span={12}>
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="Emergency quantity"
                  value={intelligentConfig.requestedQuantity}
                  onChange={(value) => setIntelligentConfig(prev => ({ 
                    ...prev, 
                    requestedQuantity: value || 1 
                  }))}
                  min={1}
                  max={200}
                />
              </Col>
              <Col span={24}>
                <Checkbox
                  checked={intelligentConfig.overrideEntitlement}
                  onChange={(e) => setIntelligentConfig(prev => ({ 
                    ...prev, 
                    overrideEntitlement: e.target.checked 
                  }))}
                >
                  Override Entitlement Limits
                </Checkbox>
              </Col>
            </>
          )}
        </Row>

        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Space>
            <Button onClick={() => setCurrentStep(0)}>
              Back to Configuration
            </Button>
            <Button 
              type="primary" 
              size="large"
              loading={loading}
              onClick={handleIntelligentGeneration}
              icon={<ThunderboltOutlined />}
            >
              Generate Coupon Selection
            </Button>
          </Space>
        </div>
      </Card>
    </div>
  );

  // Render verification step
  const renderVerificationStep = () => {
    const totals = calculateTotals();
    
    return (
      <div className="handover-verification">
        <Row gutter={[16, 16]}>
          <Col span={16}>
            <Card title="Generated Coupon Selection" size="small">
              <Table
                dataSource={selectedCoupons}
                size="small"
                pagination={false}
                scroll={{ y: 300 }}
                columns={[
                  {
                    title: 'Serial Number',
                    dataIndex: 'serialNumber',
                    key: 'serialNumber',
                    width: 150
                  },
                  {
                    title: 'Book',
                    dataIndex: 'bookNumber',
                    key: 'bookNumber',
                    width: 100
                  },
                  {
                    title: 'Box Code',
                    dataIndex: 'boxCode',
                    key: 'boxCode',
                    width: 120
                  },
                  {
                    title: 'Type',
                    dataIndex: 'fuelType',
                    key: 'fuelType',
                    width: 80,
                    render: (type) => (
                      <Tag color={type === 'DIESEL' ? 'blue' : 'green'}>
                        {type}
                      </Tag>
                    )
                  },
                  {
                    title: 'Denomination',
                    dataIndex: 'denomination',
                    key: 'denomination',
                    width: 100,
                    render: (value) => `${value}L`
                  },
                  {
                    title: 'Value',
                    dataIndex: 'value',
                    key: 'value',
                    width: 80,
                    render: (value) => `$${value.toFixed(2)}`
                  }
                ]}
              />
            </Card>
          </Col>
          
          <Col span={8}>
            <Card title="Selection Summary" size="small">
              <Row gutter={[8, 8]}>
                <Col span={24}>
                  <Statistic
                    title="Total Coupons"
                    value={totals.totalCoupons}
                    prefix={<TagsOutlined />}
                  />
                </Col>
                <Col span={24}>
                  <Statistic
                    title="Total Litres"
                    value={totals.totalLitres}
                    suffix="L"
                    prefix={<CarOutlined />}
                  />
                </Col>
                <Col span={24}>
                  <Statistic
                    title="Total Value"
                    value={totals.totalValue}
                    prefix="$"
                    precision={2}
                  />
                </Col>
                {selectedCoupons.length > 0 && (
                  <>
                    <Col span={24}>
                      <Divider style={{ margin: '12px 0' }} />
                    </Col>
                    <Col span={24}>
                      <Text strong>Serial Range:</Text>
                      <br />
                      <Text code>{selectedCoupons[0]?.serialNumber}</Text>
                      <br />
                      to
                      <br />
                      <Text code>{selectedCoupons[selectedCoupons.length - 1]?.serialNumber}</Text>
                    </Col>
                  </>
                )}
              </Row>
            </Card>
          </Col>
        </Row>

        <Card title="Verification Checklist" style={{ marginTop: 16 }}>
          <Form form={verificationForm} layout="vertical">
            <Form.Item
              name="verificationChecks"
              rules={[{ required: true, message: 'Please complete verification checks' }]}
            >
              <Checkbox.Group style={{ width: '100%' }}>
                <Row gutter={[16, 8]}>
                  {verificationChecklistItems.map((item, index) => (
                    <Col span={12} key={index}>
                      <Checkbox value={item}>{item}</Checkbox>
                    </Col>
                  ))}
                </Row>
              </Checkbox.Group>
            </Form.Item>

            <Form.Item
              name="verificationNotes"
              label="Verification Notes"
            >
              <TextArea
                rows={3}
                placeholder="Add any verification notes or observations..."
              />
            </Form.Item>
          </Form>

          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <Space>
              <Button onClick={() => setCurrentStep(1)}>
                Back to Generation
              </Button>
              <Button 
                type="primary" 
                size="large"
                onClick={handleVerificationComplete}
                icon={<SafetyCertificateOutlined />}
              >
                Complete Verification
              </Button>
            </Space>
          </div>
        </Card>
      </div>
    );
  };

  // Render handover step
  const renderHandoverStep = () => (
    <div className="handover-execution">
      <Form form={handoverForm} layout="vertical">
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Card title="Handover Method" size="small">
              <Form.Item
                name="handoverMethod"
                rules={[{ required: true, message: 'Please select handover method' }]}
              >
                <Radio.Group style={{ width: '100%' }}>
                  {handoverMethods.map(method => (
                    <Radio key={method.value} value={method.value} style={{ display: 'block', marginBottom: 8 }}>
                      <Space>
                        {method.icon}
                        {method.label}
                      </Space>
                    </Radio>
                  ))}
                </Radio.Group>
              </Form.Item>
            </Card>
          </Col>
          
          <Col span={12}>
            <Card title="Handover Schedule" size="small">
              <Form.Item
                name="scheduledDate"
                label="Handover Date"
                rules={[{ required: true, message: 'Please select handover date' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
              
              <Form.Item
                name="scheduledTime"
                label="Handover Time"
                rules={[{ required: true, message: 'Please select handover time' }]}
              >
                <TimePicker style={{ width: '100%' }} format="HH:mm" />
              </Form.Item>
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Card title="Representative Details" size="small">
              <Row gutter={[16, 16]}>
                <Col span={8}>
                  <Form.Item
                    name="representativeName"
                    label="Representative Name"
                  >
                    <Input placeholder="If applicable" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name="representativeId"
                    label="Representative ID"
                  >
                    <Input placeholder="ID number" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name="representativePhone"
                    label="Representative Phone"
                  >
                    <Input placeholder="Contact number" />
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Card title="Handover Location" size="small">
              <Form.Item
                name="handoverLocation"
                rules={[{ required: true, message: 'Please specify handover location' }]}
              >
                <Input placeholder="Specify handover location" />
              </Form.Item>
            </Card>
          </Col>
          
          <Col span={12}>
            <Card title="Documentation" size="small">
              <Form.Item
                name="deliveryNote"
                label="Delivery Note"
              >
                <Input placeholder="Delivery note reference" />
              </Form.Item>
            </Card>
          </Col>
        </Row>

        <Card title="Special Instructions & Notes">
          <Form.Item
            name="specialInstructions"
            label="Special Instructions"
          >
            <TextArea
              rows={2}
              placeholder="Any special handling instructions..."
            />
          </Form.Item>
          
          <Form.Item
            name="handoverNotes"
            label="Handover Notes"
          >
            <TextArea
              rows={3}
              placeholder="Additional notes about the handover..."
            />
          </Form.Item>
        </Card>

        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Space>
            <Button onClick={() => setCurrentStep(2)}>
              Back to Verification
            </Button>
            <Button 
              type="primary" 
              size="large"
              onClick={handleHandoverComplete}
              icon={<GiftOutlined />}
            >
              Complete Handover
            </Button>
          </Space>
        </div>
      </Form>
    </div>
  );

  // Render confirmation step
  const renderConfirmationStep = () => {
    const totals = calculateTotals();
    
    return (
      <div className="handover-confirmation">
        <Result
          status="success"
          title="Coupon Handover Completed Successfully!"
          subTitle={`${totals.totalCoupons} coupons (${totals.totalLitres}L) handed over to ${selectedBeneficiary?.name}`}
          extra={[
            <Button 
              type="primary" 
              key="print" 
              icon={<PrinterOutlined />}
              onClick={handlePrintReceipt}
            >
              Print Receipt
            </Button>,
            <Button 
              key="download" 
              icon={<DownloadOutlined />}
              onClick={handleDownloadDocument}
            >
              Download Document
            </Button>,
            <Button 
              key="complete" 
              onClick={handleFinalConfirmation}
            >
              Complete
            </Button>
          ]}
        />

        <Card title="Handover Summary" style={{ marginTop: 16 }}>
          <Descriptions column={2} bordered>
            <Descriptions.Item label="Beneficiary">
              {selectedBeneficiary?.name} ({selectedBeneficiary?.employeeId})
            </Descriptions.Item>
            <Descriptions.Item label="Handover ID">
              HO-{Date.now()}
            </Descriptions.Item>
            <Descriptions.Item label="Date & Time">
              {dayjs().format('YYYY-MM-DD HH:mm')}
            </Descriptions.Item>
            <Descriptions.Item label="Total Coupons">
              {totals.totalCoupons}
            </Descriptions.Item>
            <Descriptions.Item label="Total Litres">
              {totals.totalLitres}L
            </Descriptions.Item>
            <Descriptions.Item label="Total Value">
              ${totals.totalValue.toFixed(2)}
            </Descriptions.Item>
            <Descriptions.Item label="Serial Range" span={2}>
              {selectedCoupons[0]?.serialNumber} - {selectedCoupons[selectedCoupons.length - 1]?.serialNumber}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      </div>
    );
  };

  // Main render method
  return (
    <div className="coupon-handover-management">
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <Title level={3} style={{ margin: 0 }}>
            <GiftOutlined /> Coupon Handover Management
          </Title>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={handleStartNewHandover}
          >
            Start New Handover
          </Button>
        </div>

        <Table
          dataSource={handovers}
          columns={[
            {
              title: 'Handover ID',
              dataIndex: 'handoverId',
              key: 'handoverId'
            },
            {
              title: 'Beneficiary',
              dataIndex: ['beneficiary', 'name'],
              key: 'beneficiary'
            },
            {
              title: 'Date',
              dataIndex: 'handedOverDate',
              key: 'date'
            },
            {
              title: 'Coupons',
              dataIndex: 'totalCoupons',
              key: 'coupons'
            },
            {
              title: 'Litres',
              dataIndex: 'totalLitres',
              key: 'litres',
              render: (value) => `${value}L`
            },
            {
              title: 'Status',
              dataIndex: 'status',
              key: 'status',
              render: (status) => (
                <Tag color={status === 'CONFIRMED' ? 'green' : 'blue'}>
                  {status}
                </Tag>
              )
            }
          ]}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title="Coupon Handover Process"
        open={showHandoverModal}
        onCancel={() => setShowHandoverModal(false)}
        footer={null}
        width="90%"
        style={{ maxWidth: 1200 }}
      >
        <Steps current={currentStep} style={{ marginBottom: 24 }}>
          {steps.map(step => (
            <Step 
              key={step.title}
              title={step.title}
              description={step.description}
              icon={step.icon}
            />
          ))}
        </Steps>

        <div className="step-content">
          {currentStep === 0 && renderConfigurationStep()}
          {currentStep === 1 && renderGenerationStep()}
          {currentStep === 2 && renderVerificationStep()}
          {currentStep === 3 && renderHandoverStep()}
          {currentStep === 4 && renderConfirmationStep()}
        </div>
      </Modal>
    </div>
  );
};

export default CouponHandoverManagementEnhanced;
