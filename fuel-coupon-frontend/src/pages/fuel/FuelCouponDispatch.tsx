// src/pages/fuel/FuelCouponDispatch.tsx
import { useState, useEffect } from 'react';
import type { FC } from 'react';
import { 
  Card, 
  Table, 
  Button, 
  Space, 
  Form, 
  Input, 
  Select, 
  Modal, 
  Tag, 
  message, 
  Spin, 
  Typography, 
  Row, 
  Col, 
  Statistic, 
  InputNumber,
  Alert,
  Divider,
  Tabs,
  Steps,
  Descriptions
} from 'antd';
import { 
  ThunderboltOutlined, 
  PrinterOutlined, 
  CheckCircleOutlined, 
  FireOutlined, 
  BarChartOutlined,
  UserOutlined,
  CalculatorOutlined,
  PlusOutlined,
  SendOutlined,
  BookOutlined,
  FileTextOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import apiClient from '@/api/index';
import type { FuelEntitlement, BeneficiaryProfile, VehicleCategory } from '../../types';
import { useAuth } from '@/contexts/AuthContext';
import { useFuelDispatch } from '@/hooks/useFuelDispatch';
import type { DispatchRequest } from '@/services/fuelDispatchHandler';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;
const { TextArea } = Input;

// New Beneficiary Dispatch Component - Similar to main center but for individual coupons
const NewDispatchComponent: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [dispatchForm] = Form.useForm();
  
  // Data states
  const [beneficiaries, setBeneficiaries] = useState<any[]>([]);
  const [availableBooks, setAvailableBooks] = useState<any[]>([]);
  const [selectedBeneficiary, setSelectedBeneficiary] = useState<any>(null);
  const [selectedCoupons, setSelectedCoupons] = useState<any[]>([]);
  
  // Filter states
  const [batchFilter, setBatchFilter] = useState<string>('');
  const [fuelTypeFilter, setFuelTypeFilter] = useState<string>('');
  const [amountFilter, setAmountFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Dispatch configuration
  const [dispatchConfig, setDispatchConfig] = useState({
    dispatchId: `DSP-${dayjs().format('YYYY-MM')}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
    dispatchDate: dayjs(),
    dispatchTime: dayjs(),
    dispatchedBy: 'Current User' // Should come from auth context
  });

  useEffect(() => {
    loadBeneficiaries();
    loadAvailableBooks();
  }, []);

  const loadBeneficiaries = async () => {
    try {
      // Prefer the beneficiaries endpoint which includes top-level first_name/last_name
      const response = await apiClient.get('/beneficiaries/?page_size=1000');
      setBeneficiaries(response.data.results || response.data || []);
    } catch (error) {
      console.error('Error loading beneficiaries:', error);
    }
  };

  const loadAvailableBooks = async () => {
    try {
      const response = await apiClient.get('/books/?status=AVAILABLE&has_available_coupons=true');
      setAvailableBooks(response.data.results || response.data || []);
    } catch (error) {
      console.error('Error loading available books:', error);
    }
  };

  // Filter available books based on filters
  const filteredBooks = availableBooks.filter(book => {
    if (batchFilter && book.batch_code !== batchFilter) return false;
    if (fuelTypeFilter && book.fuel_type !== fuelTypeFilter) return false;
    if (amountFilter && book.coupon_amount.toString() !== amountFilter) return false;
    if (searchTerm && !book.book_number?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  // Get available coupons from selected books
  const getAvailableCoupons = () => {
    return filteredBooks.flatMap(book => 
      Array.from({ length: book.available_coupons || 0 }, (_, index) => ({
        id: `${book.id}-coupon-${index + 1}`,
        bookId: book.id,
        bookNumber: book.book_number,
        couponSerial: `${book.first_coupon_serial?.replace(/\d+$/, '')}${String(index + 1).padStart(6, '0')}`,
        fuelType: book.fuel_type,
        couponAmount: book.coupon_amount,
        batch: book.batch_code,
        available: true
      }))
    );
  };

  const availableCoupons = getAvailableCoupons();

  const handleCouponSelection = (couponIds: string[]) => {
    const selected = availableCoupons.filter(coupon => couponIds.includes(coupon.id));
    setSelectedCoupons(selected);
  };

  const handleCreateDispatch = async () => {
    if (!selectedBeneficiary || selectedCoupons.length === 0) {
      message.error('Please select a beneficiary and at least one coupon');
      return;
    }

    try {
      setLoading(true);
      
      const dispatchData = {
        beneficiary_id: selectedBeneficiary.id,
        coupon_dispatches: selectedCoupons.map(coupon => ({
          coupon_serial: coupon.couponSerial,
          book_id: coupon.bookId,
          fuel_type: coupon.fuelType,
          coupon_amount: coupon.couponAmount
        })),
        total_coupons: selectedCoupons.length,
        total_liters: selectedCoupons.reduce((sum, coupon) => sum + coupon.couponAmount, 0),
        dispatch_id: dispatchConfig.dispatchId,
        dispatch_date: dispatchConfig.dispatchDate.toISOString(),
        dispatched_by: dispatchConfig.dispatchedBy,
        status: 'DISPATCHED'
      };

      console.log('Creating beneficiary dispatch:', dispatchData);
      
      const response = await apiClient.post('/coupon-dispatches/', dispatchData);
      
      const beneficiaryName = [
        (selectedBeneficiary as any)?.first_name,
        (selectedBeneficiary as any)?.last_name
      ].filter(Boolean).join(' ').trim() ||
        (selectedBeneficiary?.user ? [`${selectedBeneficiary?.user?.first_name || ''}`, `${selectedBeneficiary?.user?.last_name || ''}`].join(' ').trim() : '') ||
        (selectedBeneficiary?.constituency?.name || 'beneficiary');

      message.success({
        content: (
          <div>
            <div><strong>Coupon dispatch created successfully!</strong></div>
            <div style={{ fontSize: '12px', marginTop: '4px', color: '#666' }}>
              📦 {selectedCoupons.length} coupons dispatched to {beneficiaryName}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              ⛽ Total: {selectedCoupons.reduce((sum, coupon) => sum + coupon.couponAmount, 0)}L
            </div>
          </div>
        ),
        duration: 8
      });

      // Reset states
      setCurrentStep(0);
      setSelectedBeneficiary(null);
      setSelectedCoupons([]);
      dispatchForm.resetFields();
      loadAvailableBooks();
      
    } catch (error) {
      console.error('Error creating dispatch:', error);
      message.error('Failed to create dispatch. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotals = () => {
    const totalCoupons = selectedCoupons.length;
    const totalLiters = selectedCoupons.reduce((sum, coupon) => sum + coupon.couponAmount, 0);
    const totalValue = selectedCoupons.reduce((sum, coupon) => {
      const pricePerLiter = coupon.fuelType === 'PETROL' ? 1.45 : 1.38;
      return sum + (coupon.couponAmount * pricePerLiter);
    }, 0);

    return { totalCoupons, totalLiters, totalValue };
  };

  const totals = calculateTotals();

  // Get unique values for filters
  const uniqueBatches = Array.from(new Set(availableBooks.map(book => book.batch_code).filter(Boolean)));
  const uniqueFuelTypes = Array.from(new Set(availableBooks.map(book => book.fuel_type)));
  const uniqueAmounts = Array.from(new Set(availableBooks.map(book => book.coupon_amount)));

  const steps = [
    { title: 'Select Beneficiary', icon: <UserOutlined /> },
    { title: 'Select Coupons', icon: <BookOutlined /> },
    { title: 'Coupon Details', icon: <FileTextOutlined /> },
    { title: 'Confirmation', icon: <CheckCircleOutlined /> }
  ];

  return (
    <div>
      {/* Dispatch Header - Similar to main center */}
      <Card style={{ marginBottom: '24px' }}>
        <div style={{ marginBottom: '16px' }}>
          <Title level={3}>
            <SendOutlined /> New Beneficiary Dispatch
          </Title>
          <Text type="secondary">
            Dispatch individual coupons to beneficiaries. Select complete books to dispatch to the selected beneficiary.
          </Text>
        </div>

        {/* Steps */}
        <Steps current={currentStep} items={steps} style={{ marginBottom: '24px' }} />

        {/* Dispatch Configuration */}
        <div style={{ background: '#f8f9fa', padding: '16px', borderRadius: '6px' }}>
          <Row gutter={[16, 16]}>
            <Col xs={12} md={6}>
              <Text strong>Dispatch ID</Text>
              <br />
              <Text code>{dispatchConfig.dispatchId}</Text>
            </Col>
            <Col xs={12} md={6}>
              <Text strong>Dispatched By</Text>
              <br />
              <Text>{dispatchConfig.dispatchedBy}</Text>
            </Col>
            <Col xs={12} md={6}>
              <Text strong>Dispatch Date</Text>
              <br />
              <Text>{dispatchConfig.dispatchDate.format('YYYY-MM-DD')}</Text>
            </Col>
            <Col xs={12} md={6}>
              <Text strong>Dispatch Time</Text>
              <br />
              <Text>{dispatchConfig.dispatchTime.format('HH:mm')}</Text>
            </Col>
          </Row>
        </div>
      </Card>

      {/* Step Content */}
      {currentStep === 0 && (
        <Card title="Select Beneficiary">
          <Text type="secondary" style={{ display: 'block', marginBottom: '16px' }}>
            Choose the beneficiary to receive the fuel coupons.
          </Text>
          
          <Select
            showSearch
            style={{ width: '100%', marginBottom: '16px' }}
            placeholder="Search and select beneficiary"
            optionFilterProp="children"
            value={selectedBeneficiary?.id}
            onChange={(value) => {
              const beneficiary = beneficiaries.find(b => b.id === value);
              setSelectedBeneficiary(beneficiary);
            }}
            filterOption={(input, option) =>
              (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
            }
          >
            {beneficiaries.map(beneficiary => {
              const displayName = [
                // Prefer top-level names if API provides them
                (beneficiary as any)?.first_name,
                (beneficiary as any)?.last_name
              ].filter(Boolean).join(' ').trim()
                || (beneficiary?.user ? [`${beneficiary?.user?.first_name || ''}`, `${beneficiary?.user?.last_name || ''}`].join(' ').trim() : '')
                || (beneficiary?.constituency?.name || 'Unknown Name');
              
              return (
                <Option key={beneficiary.id} value={beneficiary.id}>
                  <div>
                    <strong>{displayName}</strong>
                    <br />
                    <Text type="secondary">
                      {beneficiary.constituency?.name} - {beneficiary.category?.name || 'Category not specified'}
                    </Text>
                  </div>
                </Option>
              );
            })}
          </Select>

          {selectedBeneficiary && (
            <Card size="small" style={{ background: '#f0f9ff' }}>
              <Descriptions size="small" column={2}>
                <Descriptions.Item label="Name">
                  {(() => {
                    const b: any = selectedBeneficiary;
                    const name = [b?.first_name, b?.last_name].filter(Boolean).join(' ').trim() ||
                      (b?.user ? [`${b?.user?.first_name || ''}`, `${b?.user?.last_name || ''}`].join(' ').trim() : '') ||
                      (b?.constituency?.name || 'Unknown Name');
                    return name;
                  })()}
                </Descriptions.Item>
                <Descriptions.Item label="Constituency">
                  {selectedBeneficiary.constituency?.name}
                </Descriptions.Item>
                <Descriptions.Item label="Category">
                  {selectedBeneficiary.category?.name}
                </Descriptions.Item>
                <Descriptions.Item label="Member ID">
                  {selectedBeneficiary?.user?.username || 'N/A'}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          )}

          <div style={{ marginTop: '24px', textAlign: 'right' }}>
            <Button 
              type="primary" 
              disabled={!selectedBeneficiary}
              onClick={() => setCurrentStep(1)}
            >
              Next: Select Coupons
            </Button>
          </div>
        </Card>
      )}

      {currentStep === 1 && (
        <Card>
          <div style={{ marginBottom: '16px' }}>
            <Title level={4}>
              <BookOutlined /> Select Coupons for Dispatch
            </Title>
            <Text type="secondary">
              Choose the verified coupons to dispatch to the selected beneficiary.
            </Text>
          </div>

          {/* Filters - Similar to main center */}
          <Card size="small" style={{ marginBottom: '16px' }}>
            <Title level={5}>📋 Available Coupons & Filters</Title>
            <Row gutter={[16, 16]}>
              <Col xs={24} md={6}>
                <Text strong>Filter by Batch:</Text>
                <Select 
                  style={{ width: '100%' }} 
                  placeholder="All Batches"
                  allowClear
                  value={batchFilter || undefined}
                  onChange={setBatchFilter}
                >
                  {uniqueBatches.map(batch => (
                    <Option key={batch} value={batch}>{batch}</Option>
                  ))}
                </Select>
              </Col>
              <Col xs={24} md={6}>
                <Text strong>Filter by Fuel Type:</Text>
                <Select 
                  style={{ width: '100%' }} 
                  placeholder="All Fuel Types"
                  allowClear
                  value={fuelTypeFilter || undefined}
                  onChange={setFuelTypeFilter}
                >
                  {uniqueFuelTypes.map(type => (
                    <Option key={type} value={type}>{type}</Option>
                  ))}
                </Select>
              </Col>
              <Col xs={24} md={6}>
                <Text strong>Filter by Amount:</Text>
                <Select 
                  style={{ width: '100%' }} 
                  placeholder="All Amounts"
                  allowClear
                  value={amountFilter || undefined}
                  onChange={setAmountFilter}
                >
                  {uniqueAmounts.map(amount => (
                    <Option key={amount} value={amount.toString()}>{amount}L</Option>
                  ))}
                </Select>
              </Col>
              <Col xs={24} md={6}>
                <Button type="primary" icon={<ReloadOutlined />} onClick={loadAvailableBooks}>
                  Refresh Coupons
                </Button>
              </Col>
            </Row>

            {/* Totals Display */}
            <Row gutter={[16, 16]} style={{ marginTop: '12px' }}>
              <Col xs={6}>
                <Text strong>Total Available:</Text>
                <br />
                <Text style={{ color: '#1890ff' }}>{availableCoupons.length}</Text>
              </Col>
              <Col xs={6}>
                <Text strong>Selected:</Text>
                <br />
                <Text style={{ color: '#52c41a' }}>{selectedCoupons.length}</Text>
              </Col>
              <Col xs={6}>
                <Text strong>Available Liters:</Text>
                <br />
                <Text style={{ color: '#fa8c16' }}>{availableCoupons.reduce((sum, c) => sum + c.couponAmount, 0)}L</Text>
              </Col>
              <Col xs={6}>
                <Text strong>Total Value:</Text>
                <br />
                <Text style={{ color: '#722ed1' }}>ZWG {totals.totalValue.toFixed(2)}</Text>
              </Col>
            </Row>
          </Card>

          {/* Coupon Selection */}
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Card size="small" title={`📚 Available Coupons (${availableCoupons.length})`}>
                <Select
                  mode="multiple"
                  style={{ width: '100%', marginBottom: '12px' }}
                  placeholder="Select coupons to dispatch"
                  value={selectedCoupons.map(c => c.id)}
                  onChange={handleCouponSelection}
                  optionLabelProp="label"
                  maxTagCount="responsive"
                >
                  {availableCoupons.map(coupon => (
                    <Option 
                      key={coupon.id} 
                      value={coupon.id}
                      label={`${coupon.couponSerial} (${coupon.couponAmount}L)`}
                    >
                      <div>
                        <strong>{coupon.couponSerial}</strong>
                        <br />
                        <Text type="secondary">
                          {coupon.fuelType} - {coupon.couponAmount}L - Book: {coupon.bookNumber}
                        </Text>
                      </div>
                    </Option>
                  ))}
                </Select>
                
                {availableCoupons.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '20px' }}>
                    <Text type="secondary">No coupons available</Text>
                  </div>
                )}
              </Card>
            </Col>
            
            <Col xs={24} md={12}>
              <Card size="small" title={`✅ Selected Coupons (${selectedCoupons.length})`}>
                {selectedCoupons.length > 0 ? (
                  <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {selectedCoupons.map(coupon => (
                      <div key={coupon.id} style={{ padding: '8px', border: '1px solid #d9d9d9', marginBottom: '4px', borderRadius: '4px' }}>
                        <Text strong>{coupon.couponSerial}</Text>
                        <br />
                        <Text type="secondary">{coupon.fuelType} - {coupon.couponAmount}L</Text>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '20px' }}>
                    <Text type="secondary">No coupons selected</Text>
                  </div>
                )}
              </Card>
            </Col>
          </Row>

          {selectedCoupons.length > 0 && (
            <Card size="small" style={{ backgroundColor: '#f0f2f5', marginTop: '16px' }}>
              <Title level={5}>Dispatch Summary</Title>
              <Row gutter={[16, 16]}>
                <Col xs={8}>
                  <Statistic title="Total Coupons" value={totals.totalCoupons} />
                </Col>
                <Col xs={8}>
                  <Statistic title="Total Liters" value={totals.totalLiters} suffix="L" />
                </Col>
                <Col xs={8}>
                  <Statistic title="Total Value" value={totals.totalValue} precision={2} prefix="ZWG" />
                </Col>
              </Row>
            </Card>
          )}

          <div style={{ marginTop: '24px', textAlign: 'right' }}>
            <Button onClick={() => setCurrentStep(0)} style={{ marginRight: '8px' }}>
              Back
            </Button>
            <Button 
              type="primary" 
              disabled={selectedCoupons.length === 0}
              onClick={() => setCurrentStep(2)}
            >
              Next: Coupon Details
            </Button>
          </div>
        </Card>
      )}

      {currentStep === 2 && (
        <Card title="Coupon Details">
          <Text type="secondary" style={{ display: 'block', marginBottom: '16px' }}>
            Review the selected coupons and add any additional details.
          </Text>

          <Table
            dataSource={selectedCoupons}
            rowKey="id"
            size="small"
            pagination={false}
            columns={[
              {
                title: 'Serial Number',
                dataIndex: 'couponSerial',
                key: 'couponSerial',
                render: (text) => <Text code>{text}</Text>
              },
              {
                title: 'Book Number',
                dataIndex: 'bookNumber',
                key: 'bookNumber'
              },
              {
                title: 'Fuel Type',
                dataIndex: 'fuelType',
                key: 'fuelType',
                render: (type) => <Tag color={type === 'PETROL' ? 'blue' : 'green'}>{type}</Tag>
              },
              {
                title: 'Amount',
                dataIndex: 'couponAmount',
                key: 'couponAmount',
                render: (amount) => `${amount}L`
              },
              {
                title: 'Batch',
                dataIndex: 'batch',
                key: 'batch'
              }
            ]}
          />

          <Form form={dispatchForm} layout="vertical" style={{ marginTop: '16px' }}>
            <Form.Item name="notes" label="Dispatch Notes">
              <TextArea rows={3} placeholder="Enter any special instructions or notes for this dispatch" />
            </Form.Item>
          </Form>

          <div style={{ marginTop: '24px', textAlign: 'right' }}>
            <Button onClick={() => setCurrentStep(1)} style={{ marginRight: '8px' }}>
              Back
            </Button>
            <Button 
              type="primary" 
              onClick={() => setCurrentStep(3)}
            >
              Next: Confirmation
            </Button>
          </div>
        </Card>
      )}

      {currentStep === 3 && (
        <Card title="Confirmation">
          <Alert
            message="Review Dispatch Details"
            description="Please review all dispatch details before confirming."
            type="info"
            showIcon
            style={{ marginBottom: '16px' }}
          />

          <Descriptions bordered column={2}>
            <Descriptions.Item label="Beneficiary">
              {(() => {
                const b: any = selectedBeneficiary;
                const name = [b?.first_name, b?.last_name].filter(Boolean).join(' ').trim() ||
                  (b?.user ? [`${b?.user?.first_name || ''}`, `${b?.user?.last_name || ''}`].join(' ').trim() : '') ||
                  (b?.constituency?.name || 'Unknown Name');
                return name;
              })()}
            </Descriptions.Item>
            <Descriptions.Item label="Constituency">
              {selectedBeneficiary?.constituency?.name}
            </Descriptions.Item>
            <Descriptions.Item label="Total Coupons">
              {totals.totalCoupons}
            </Descriptions.Item>
            <Descriptions.Item label="Total Liters">
              {totals.totalLiters}L
            </Descriptions.Item>
            <Descriptions.Item label="Total Value">
              ZWG {totals.totalValue.toFixed(2)}
            </Descriptions.Item>
            <Descriptions.Item label="Dispatch ID">
              {dispatchConfig.dispatchId}
            </Descriptions.Item>
          </Descriptions>

          <div style={{ marginTop: '24px', textAlign: 'right' }}>
            <Button onClick={() => setCurrentStep(2)} style={{ marginRight: '8px' }}>
              Back
            </Button>
            <Button 
              type="primary" 
              loading={loading}
              icon={<SendOutlined />}
              onClick={handleCreateDispatch}
            >
              Confirm Dispatch
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};

interface DispatchStats {
  totalDispatched: number;
  todayDispatches: number;
  pendingDispatches: number;
  availableStock: number;
}

interface CouponDispatch {
  id: string;
  beneficiary: BeneficiaryProfile;
  litersDispensed: number;
  entitlementSource: string;
  remainingEntitlement: number;
  couponNumber: string;
  dispatchDate: string;
  status: 'DISPATCHED' | 'PENDING' | 'COLLECTED';
  subcenterStock: number;
}

const FuelCouponDispatch: FC = () => {
  const { user, isAuthLoading } = useAuth();
  if (isAuthLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <Spin size="large" />
      </div>
    );
  }
  if (!user) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <Alert type="warning" message="Authentication required. Please log in." />
      </div>
    );
  }
  // Use the fuel dispatch hook
  const {
    loading: dispatchLoading,
    currentStock,
    dispatchHistory,
    stats: dispatchStats,
    calculateDispatch,
    dispatchFuel,
    refreshData,
    getAvailableStock,
    getBeneficiaryEntitlement
  } = useFuelDispatch();

  // State declarations
  const [loading, setLoading] = useState(true);
  const [beneficiaries, setBeneficiaries] = useState<BeneficiaryProfile[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedBeneficiary, setSelectedBeneficiary] = useState<BeneficiaryProfile | null>(null);
  const [form] = Form.useForm();

  // Bidirectional calculator states
  const [requestedLiters, setRequestedLiters] = useState<number | null>(null);
  const [calculationResult, setCalculationResult] = useState<any>(null);

  // Filter states
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Extract unique categories from beneficiaries
  const beneficiaryCategories = Array.from(new Set(beneficiaries.map((b: any) => 
    typeof b.category === 'object' ? b.category?.name : b.category).filter(Boolean)));

  // Filter beneficiaries
  const filteredBeneficiaries = beneficiaries.filter((b: any) => {
    const matchesCategory = !selectedCategory || 
      (typeof b.category === 'object' ? b.category?.name : b.category) === selectedCategory;
    
    const displayName = [
      (b as any)?.first_name,
      (b as any)?.last_name
    ].filter(Boolean).join(' ').trim() ||
      (b?.user ? [`${b?.user?.first_name || ''}`, `${b?.user?.last_name || ''}`].join(' ').trim() : '') ||
      (b?.constituency?.name || 'Unknown Name');
    
    const matchesSearch = !searchTerm || displayName.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesCategory && matchesSearch;
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Fetch beneficiaries
  const beneficiariesResponse = await apiClient.get('/beneficiaries/?page_size=1000');
      let beneficiaryData = beneficiariesResponse.data.results || beneficiariesResponse.data;

      // Handle pagination for beneficiaries
      if (beneficiariesResponse.data.next) {
        const allBeneficiaries = [...beneficiaryData];
        let nextUrl = beneficiariesResponse.data.next;
        
        while (nextUrl) {
          const nextResponse = await apiClient.get(nextUrl.replace(apiClient.defaults.baseURL, ''));
          const nextData = nextResponse.data.results || nextResponse.data;
          allBeneficiaries.push(...nextData);
          nextUrl = nextResponse.data.next;
        }
        
        beneficiaryData = allBeneficiaries;
      }

      setBeneficiaries(beneficiaryData);
      
      // Refresh dispatch handler data
      await refreshData();
      
    } catch (error) {
      console.error('Error loading dispatch data:', error);
      message.error('Failed to load fuel dispatch data');
    } finally {
      setLoading(false);
    }
  };

  // Calculate dispatch using the dispatch handler service
  const calculateDispatchLocal = async (beneficiary: BeneficiaryProfile, requestedAmount: number) => {
    try {
      const result = await calculateDispatch(beneficiary.id, requestedAmount);
      return result;
    } catch (error) {
      console.error('Error calculating dispatch:', error);
      return {
        canDispatch: false,
        actualDispatch: 0,
        entitlementUsed: 0,
        stockRemaining: 0,
        entitlementRemaining: 0,
        message: "Error calculating dispatch"
      };
    }
  };

  const handleBeneficiarySelect = (beneficiary: BeneficiaryProfile) => {
    setSelectedBeneficiary(beneficiary);
    form.setFieldsValue({
      beneficiary: beneficiary.id,
      requested_liters: null
    });
    setRequestedLiters(null);
    setCalculationResult(null);
    setModalVisible(true);
  };

  const handleLitersChange = async (value: number | null) => {
    setRequestedLiters(value);
    if (value && selectedBeneficiary) {
      const result = await calculateDispatchLocal(selectedBeneficiary, value);
      setCalculationResult(result);
    } else {
      setCalculationResult(null);
    }
  };

  const handleDispatchSubmit = async (values: any) => {
    try {
      if (!selectedBeneficiary || !calculationResult?.canDispatch) {
        message.error('Cannot dispatch: invalid calculation result');
        return;
      }

      const dispatchRequest = {
        beneficiaryId: selectedBeneficiary.id,
        requestedLiters: calculationResult.actualDispatch,
        fuelType: values.fuel_type || 'PETROL' as 'PETROL' | 'DIESEL',
        entitlementSource: 'MONTHLY' as 'MONTHLY' | 'SESSION' | 'COMMITTEE' | 'SPECIAL_EVENT' | 'TRAVEL_ALLOWANCE' | 'EMERGENCY' | 'CONSTITUENCY_WORK',
        priority: 'NORMAL' as 'NORMAL' | 'HIGH' | 'URGENT',
        notes: values.notes || ''
      };

      const result = await dispatchFuel(dispatchRequest);
      
      if (result.success) {
        const sb: any = selectedBeneficiary;
        const name = [sb?.first_name, sb?.last_name].filter(Boolean).join(' ').trim() ||
          (sb?.user ? [`${sb?.user?.first_name || ''}`, `${sb?.user?.last_name || ''}`].join(' ').trim() : '') ||
          (sb?.constituency?.name || 'beneficiary');
        message.success(`Successfully dispatched ${result.actualLitersDispatched}L to ${name}`);
        setModalVisible(false);
        setSelectedBeneficiary(null);
        form.resetFields();
        setCalculationResult(null);
        await refreshData(); // Refresh data
      } else {
        message.error(`Dispatch failed: ${result.message}`);
      }
    } catch (error) {
      console.error('Error dispatching fuel:', error);
      message.error('Failed to dispatch fuel coupon');
    }
  };

  const dispatchColumns = [
    {
      title: 'Beneficiary',
      key: 'beneficiary',
      render: (_: any, record: CouponDispatch) => {
        const ben: any = record?.beneficiary;
        const name = [ben?.first_name, ben?.last_name].filter(Boolean).join(' ').trim() ||
          (ben?.user ? [`${ben?.user?.first_name || ''}`, `${ben?.user?.last_name || ''}`].join(' ').trim() : '') ||
          (ben?.constituency?.name || (typeof ben === 'string' || typeof ben === 'number' ? `ID: ${ben}` : 'Unknown'));
        const constituency = ben?.constituency?.name || ben?.constituency || '';
        return (
          <Space>
            <UserOutlined />
            <div>
              <div>{name}</div>
              {constituency ? (
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  {constituency}
                </Text>
              ) : null}
            </div>
          </Space>
        );
      }
    },
    {
      title: 'Liters Dispatched',
      dataIndex: 'litersDispensed',
      key: 'litersDispensed',
      render: (value: number) => (
        <Tag color="blue" icon={<FireOutlined />}>
          {value}L
        </Tag>
      )
    },
    {
      title: 'Coupon Number',
      dataIndex: 'couponNumber',
      key: 'couponNumber',
      render: (value: string) => (
        <Text code>{value}</Text>
      )
    },
    {
      title: 'Entitlement Source',
      dataIndex: 'entitlementSource',
      key: 'entitlementSource'
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'DISPATCHED' ? 'green' : status === 'PENDING' ? 'orange' : 'blue'}>
          {status}
        </Tag>
      )
    },
    {
      title: 'Dispatch Date',
      dataIndex: 'dispatchDate',
      key: 'dispatchDate',
      render: (date: string) => date ? dayjs(date).format('YYYY-MM-DD') : '-'
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: CouponDispatch) => (
        <Space>
          <Button 
            type="link" 
            icon={<PrinterOutlined />}
            onClick={() => message.info('Print coupon functionality')}
          >
            Print
          </Button>
        </Space>
      )
    }
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <p>Loading fuel dispatch data...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>
          <ThunderboltOutlined /> Fuel Coupon Dispatch
        </Title>
        <Text type="secondary">
          Dispatch physical fuel coupons to beneficiaries using entitlement data and stock levels
        </Text>
      </div>

      {/* Flow Information Card */}
      <Alert
        message="Intelligent Stock Management Flow"
        description={
          <div>
            <Text strong>Complete Flow:</Text> Main Center Dispatch → Dispatch Table → Subcenter Handover → Intelligent Stock → Beneficiary Dispatch
            <br />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              • New dispatches from main center are saved to dispatch table
              • Subcenters fetch handovers from dispatch table (filtered by to_center)
              • When handovers are marked as 'RECEIVED', they become available stock
              • Available stock = Received handovers - Beneficiary dispatches
            </Text>
          </div>
        }
        type="info"
        showIcon
        style={{ marginBottom: '24px' }}
      />

      <Tabs defaultActiveKey="dispatch" type="card">
        <TabPane tab={<span><ThunderboltOutlined />Dispatch Coupons</span>} key="dispatch">
          {/* Stats Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Available Stock"
              value={currentStock.reduce((sum, stock) => sum + stock.availableLiters, 0)}
              suffix="L"
              prefix={<FireOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
            <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
              📦 From handover receipts minus dispatches
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Today's Dispatches"
              value={dispatchStats.todayDispatches}
              prefix={<ThunderboltOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Dispatched"
              value={dispatchStats.todayLiters}
              suffix="L"
              prefix={<BarChartOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Pending Dispatches"
              value={dispatchStats.pendingDispatches}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Beneficiary Selection for Dispatch */}
      <Card style={{ marginBottom: '24px' }}>
        <Title level={4}>Select Beneficiary for Dispatch</Title>
        
        <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
          <Col xs={24} sm={8}>
            <Text strong>Filter by Category:</Text>
            <Select
              style={{ width: '100%', marginTop: 8 }}
              value={selectedCategory}
              onChange={setSelectedCategory}
              placeholder="All categories"
              allowClear
            >
              {beneficiaryCategories.map((cat) => (
                <Option key={cat} value={cat}>{cat}</Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={16}>
            <Text strong>Search Beneficiaries:</Text>
            <Input.Search
              style={{ marginTop: 8 }}
              placeholder="Search by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              allowClear
            />
          </Col>
        </Row>

        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
          <Row gutter={[16, 16]}>
            {filteredBeneficiaries.slice(0, 12).map((beneficiary: any) => {
              const displayName = [
                (beneficiary as any)?.first_name,
                (beneficiary as any)?.last_name
              ].filter(Boolean).join(' ').trim()
                || (beneficiary?.user ? [`${beneficiary?.user?.first_name || ''}`, `${beneficiary?.user?.last_name || ''}`].join(' ').trim() : '')
                || (beneficiary?.constituency?.name || 'Unknown Name');
              
              // Entitlement info will be loaded when dispatch modal opens
              
              return (
                <Col xs={24} sm={12} md={8} lg={6} key={beneficiary.id}>
                  <Card 
                    size="small" 
                    hoverable
                    onClick={() => handleBeneficiarySelect(beneficiary)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div style={{ textAlign: 'center' }}>
                      <UserOutlined style={{ fontSize: '24px', marginBottom: '8px' }} />
                      <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                        {displayName}
                      </div>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        {beneficiary.constituency?.name}
                      </Text>
                      <br />
                      <Tag color="blue" style={{ marginTop: '4px' }}>
                        Click to dispatch
                      </Tag>
                    </div>
                  </Card>
                </Col>
              );
            })}
          </Row>
        </div>
      </Card>

      {/* Recent Dispatches */}
      <Card>
        <Title level={4}>Recent Dispatches</Title>
        <Table
          columns={dispatchColumns}
          dataSource={dispatchHistory}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} dispatches`
          }}
        />
      </Card>

      {/* Dispatch Modal with Bidirectional Calculator */}
      <Modal
        title={
          <Space>
            <CalculatorOutlined />
            Dispatch Fuel Coupon
            {selectedBeneficiary && (
              <Text type="secondary">
                - {selectedBeneficiary?.user?.first_name} {selectedBeneficiary?.user?.last_name}
              </Text>
            )}
          </Space>
        }
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setSelectedBeneficiary(null);
          form.resetFields();
          setCalculationResult(null);
        }}
        footer={null}
        width={700}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleDispatchSubmit}
        >
          <Alert
            message="Bidirectional Calculator"
            description="Enter the requested liters to see if dispatch is possible based on entitlement and stock levels"
            type="info"
            showIcon
            style={{ marginBottom: '16px' }}
          />

          <Form.Item
            name="requested_liters"
            label="Requested Liters"
            rules={[{ required: true, message: 'Please enter requested liters' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="Enter liters requested"
              min={1}
              max={1000}
              onChange={handleLitersChange}
            />
          </Form.Item>

          {calculationResult && (
            <Card 
              size="small" 
              style={{ marginBottom: '16px' }}
              className={calculationResult.canDispatch ? 'success-card' : 'error-card'}
            >
              <div style={{ marginBottom: '12px' }}>
                <Text strong>{calculationResult.message}</Text>
              </div>
              
              <Row gutter={16}>
                <Col span={12}>
                  <Statistic
                    title="Can Dispatch"
                    value={calculationResult.actualDispatch}
                    suffix="L"
                    valueStyle={{ 
                      color: calculationResult.canDispatch ? '#52c41a' : '#ff4d4f',
                      fontSize: '16px'
                    }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="Entitlement Remaining"
                    value={calculationResult.entitlementRemaining}
                    suffix="L"
                    valueStyle={{ fontSize: '16px' }}
                  />
                </Col>
              </Row>
            </Card>
          )}

          <Form.Item
            name="notes"
            label="Notes (Optional)"
          >
            <Input.TextArea 
              rows={3} 
              placeholder="Additional notes about this dispatch"
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>
                Cancel
              </Button>
              <Button 
                type="primary" 
                htmlType="submit"
                disabled={!calculationResult?.canDispatch}
                icon={<ThunderboltOutlined />}
              >
                Dispatch Coupon
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <style>{`
        .success-card {
          border-color: #52c41a;
          background-color: #f6ffed;
        }
        .error-card {
          border-color: #ff4d4f;
          background-color: #fff2f0;
        }
      `}</style>
        </TabPane>

        <TabPane tab={<span><PlusOutlined />New Dispatch</span>} key="new-dispatch">
          <NewDispatchComponent />
        </TabPane>
      </Tabs>
    </div>
  );
};

export default FuelCouponDispatch;