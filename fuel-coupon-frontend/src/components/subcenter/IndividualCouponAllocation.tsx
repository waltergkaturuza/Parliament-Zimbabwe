// src/components/subcenter/IndividualCouponAllocation.tsx
import React, { useState, useEffect } from 'react';
import {
  Modal,
  Card,
  Table,
  Form,
  Select,
  InputNumber,
  Button,
  Space,
  Typography,
  Row,
  Col,
  Tag,
  Alert,
  Statistic,
  Transfer,
  List,
  Checkbox,
  Input,
  Divider,
  message,
  Tooltip,
  Badge,
} from 'antd';
import {
  UserOutlined,
  CheckCircleOutlined,
  SwapOutlined,
  SearchOutlined,
  FilterOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
  SendOutlined,
  BarcodeOutlined,
} from '@ant-design/icons';
import { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import apiClient from '@/api';

const { Title, Text } = Typography;
const { Option } = Select;
const { Search } = Input;

interface AvailableCoupon {
  key: string;
  id: string;
  serial_number: string;
  fuel_type: 'PETROL' | 'DIESEL';
  denomination: 5 | 20;
  book_serial: string;
  received_date: string;
  status: 'RECEIVED' | 'AVAILABLE';
  dispatch_id: string;
  from_center: string;
}

interface Beneficiary {
  id: string;
  name: string;
  position: string;
  department: string;
  fuel_entitlement: number;
  used_fuel: number;
  remaining_entitlement: number;
  last_allocation_date?: string;
}

interface AllocationPreview {
  beneficiary: Beneficiary;
  selected_coupons: AvailableCoupon[];
  total_litres: number;
  total_value: number;
  entitlement_after: number;
  warning_messages: string[];
}

interface IndividualCouponAllocationProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: (allocation: AllocationPreview) => void;
  subCenterId?: string;
  preSelectedBeneficiary?: Beneficiary;
  preSelectedCoupons?: AvailableCoupon[];
}

const IndividualCouponAllocation: React.FC<IndividualCouponAllocationProps> = ({
  visible,
  onCancel,
  onSuccess,
  subCenterId,
  preSelectedBeneficiary,
  preSelectedCoupons = [],
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState<AvailableCoupon[]>([]);
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [selectedBeneficiary, setSelectedBeneficiary] = useState<Beneficiary | null>(preSelectedBeneficiary || null);
  const [selectedCoupons, setSelectedCoupons] = useState<AvailableCoupon[]>(preSelectedCoupons);
  const [allocationPreview, setAllocationPreview] = useState<AllocationPreview | null>(null);
  const [searchText, setSearchText] = useState('');
  const [fuelTypeFilter, setFuelTypeFilter] = useState<string | undefined>();
  const [denominationFilter, setDenominationFilter] = useState<number | undefined>();

  useEffect(() => {
    if (visible) {
      fetchAvailableCoupons();
      fetchBeneficiaries();
    }
  }, [visible, subCenterId]);

  useEffect(() => {
    if (selectedBeneficiary && selectedCoupons.length > 0) {
      generateAllocationPreview();
    } else {
      setAllocationPreview(null);
    }
  }, [selectedBeneficiary, selectedCoupons]);

  const fetchAvailableCoupons = async () => {
    try {
      console.log('🔍 Fetching available coupons for allocation...');
      
      const params: any = {
        status: 'RECEIVED', // Only show received coupons available for allocation
        sub_center: subCenterId,
        available_only: true // Backend should filter out already allocated coupons
      };
      
      const response = await apiClient.get('/coupons/individual/', { params });
      const coupons = (response.data.results || response.data || []).map((c: any) => ({
        ...c,
        key: c.id
      }));
      
      console.log('📋 Available coupons loaded:', coupons.length);
      setAvailableCoupons(coupons);
      
    } catch (error) {
      console.error('Error fetching available coupons:', error);
      message.error('Failed to load available coupons');
    }
  };

  const fetchBeneficiaries = async () => {
    try {
      console.log('🔍 Fetching beneficiaries...');
      
      const response = await apiClient.get('/beneficiaries/', {
        params: { active_only: true, with_entitlements: true }
      });
      const beneficiaryData = response.data.results || response.data || [];
      
      console.log('👥 Beneficiaries loaded:', beneficiaryData.length);
      setBeneficiaries(beneficiaryData);
      
    } catch (error) {
      console.error('Error fetching beneficiaries:', error);
      message.error('Failed to load beneficiaries');
    }
  };

  const generateAllocationPreview = () => {
    if (!selectedBeneficiary || selectedCoupons.length === 0) return;

    const totalLitres = selectedCoupons.reduce((sum, coupon) => sum + coupon.denomination, 0);
    const totalValue = selectedCoupons.length * 1.40 * 27.50; // Approximate USD to ZWG conversion
    const entitlementAfter = selectedBeneficiary.remaining_entitlement - totalLitres;

    const warningMessages: string[] = [];
    
    if (entitlementAfter < 0) {
      warningMessages.push(`Allocation exceeds remaining entitlement by ${Math.abs(entitlementAfter)} litres`);
    }
    
    if (totalLitres === 0) {
      warningMessages.push('No fuel selected for allocation');
    }

    // Check for mixed fuel types
    const fuelTypes = [...new Set(selectedCoupons.map(c => c.fuel_type))];
    if (fuelTypes.length > 1) {
      warningMessages.push('Selected coupons contain mixed fuel types');
    }

    const preview: AllocationPreview = {
      beneficiary: selectedBeneficiary,
      selected_coupons: selectedCoupons,
      total_litres: totalLitres,
      total_value: totalValue,
      entitlement_after: entitlementAfter,
      warning_messages: warningMessages,
    };

    setAllocationPreview(preview);
  };

  const handleCouponSelection = (selectedRowKeys: React.Key[], selectedRows: AvailableCoupon[]) => {
    setSelectedCoupons(selectedRows);
  };

  const handleQuickSelect = (type: 'all' | 'petrol' | 'diesel' | 'clear') => {
    switch (type) {
      case 'all':
        setSelectedCoupons(getFilteredCoupons());
        break;
      case 'petrol':
        setSelectedCoupons(getFilteredCoupons().filter(c => c.fuel_type === 'PETROL'));
        break;
      case 'diesel':
        setSelectedCoupons(getFilteredCoupons().filter(c => c.fuel_type === 'DIESEL'));
        break;
      case 'clear':
        setSelectedCoupons([]);
        break;
    }
  };

  const getFilteredCoupons = () => {
    return availableCoupons.filter(coupon => {
      const matchesSearch = !searchText || 
        coupon.serial_number.toLowerCase().includes(searchText.toLowerCase()) ||
        coupon.book_serial.toLowerCase().includes(searchText.toLowerCase());
      const matchesFuelType = !fuelTypeFilter || coupon.fuel_type === fuelTypeFilter;
      const matchesDenomination = !denominationFilter || coupon.denomination === denominationFilter;
      
      return matchesSearch && matchesFuelType && matchesDenomination;
    });
  };

  const handleSubmit = async () => {
    if (!selectedBeneficiary || selectedCoupons.length === 0) {
      message.error('Please select a beneficiary and at least one coupon');
      return;
    }

    if (allocationPreview?.warning_messages.some(msg => msg.includes('exceeds'))) {
      message.warning('Allocation exceeds beneficiary entitlement. Please confirm.');
    }

    setLoading(true);
    try {
      console.log('🔄 Submitting individual coupon allocation...');
      
      const allocationData = {
        beneficiary_id: selectedBeneficiary.id,
        coupon_ids: selectedCoupons.map(c => c.id),
        allocation_type: 'INDIVIDUAL_COUPONS',
        sub_center_id: subCenterId,
        total_litres: allocationPreview?.total_litres,
        notes: `Individual coupon allocation: ${selectedCoupons.length} coupons, ${allocationPreview?.total_litres}L`,
      };

      const response = await apiClient.post('/allocations/individual-coupons/', allocationData);
      
      console.log('✅ Individual coupon allocation successful:', response.data);
      
      message.success({
        content: (
          <div>
            <div><strong>Allocation Successful!</strong></div>
            <div style={{ fontSize: '12px', marginTop: '4px', color: '#666' }}>
              🎫 {selectedCoupons.length} coupons allocated to {selectedBeneficiary.name}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              ⛽ {allocationPreview?.total_litres}L total fuel allocated
            </div>
          </div>
        ),
        duration: 6
      });

      onSuccess(allocationPreview!);
      handleReset();
      
    } catch (error: any) {
      console.error('Error submitting allocation:', error);
      message.error(error?.response?.data?.detail || 'Failed to allocate coupons');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    form.resetFields();
    setSelectedBeneficiary(preSelectedBeneficiary || null);
    setSelectedCoupons(preSelectedCoupons);
    setAllocationPreview(null);
    setSearchText('');
    setFuelTypeFilter(undefined);
    setDenominationFilter(undefined);
  };

  const couponColumns: ColumnsType<AvailableCoupon> = [
    {
      title: 'Serial Number',
      dataIndex: 'serial_number',
      key: 'serial_number',
      width: 140,
      render: (text) => (
        <Text strong style={{ fontFamily: 'monospace', fontSize: '11px' }}>
          {text}
        </Text>
      ),
      sorter: (a, b) => a.serial_number.localeCompare(b.serial_number),
    },
    {
      title: 'Fuel',
      key: 'fuel_info',
      width: 100,
      render: (_, record) => (
        <div>
          <Tag color={record.fuel_type === 'PETROL' ? 'blue' : 'orange'}>
            {record.fuel_type}
          </Tag>
          <br />
          <Text type="secondary" style={{ fontSize: '10px' }}>{record.denomination}L</Text>
        </div>
      ),
      filters: [
        { text: 'Petrol', value: 'PETROL' },
        { text: 'Diesel', value: 'DIESEL' },
      ],
      onFilter: (value, record) => record.fuel_type === value,
    },
    {
      title: 'Book Serial',
      dataIndex: 'book_serial',
      key: 'book_serial',
      width: 100,
      render: (text) => (
        <Text style={{ fontFamily: 'monospace', fontSize: '10px' }}>
          {text}
        </Text>
      ),
    },
    {
      title: 'Received',
      dataIndex: 'received_date',
      key: 'received_date',
      width: 100,
      render: (date) => (
        <Text type="secondary" style={{ fontSize: '10px' }}>
          {dayjs(date).format('MMM DD')}
        </Text>
      ),
      sorter: (a, b) => dayjs(a.received_date).unix() - dayjs(b.received_date).unix(),
    },
    {
      title: 'From',
      dataIndex: 'from_center',
      key: 'from_center',
      width: 80,
      render: (text) => (
        <Text type="secondary" style={{ fontSize: '10px' }}>
          {text}
        </Text>
      ),
    },
  ];

  const rowSelection = {
    selectedRowKeys: selectedCoupons.map(c => c.key),
    onChange: handleCouponSelection,
    onSelect: (record: AvailableCoupon, selected: boolean) => {
      if (selected) {
        setSelectedCoupons([...selectedCoupons, record]);
      } else {
        setSelectedCoupons(selectedCoupons.filter(c => c.key !== record.key));
      }
    },
    onSelectAll: (selected: boolean, selectedRows: AvailableCoupon[], changeRows: AvailableCoupon[]) => {
      if (selected) {
        setSelectedCoupons([...selectedCoupons, ...changeRows]);
      } else {
        const changeRowKeys = changeRows.map(r => r.key);
        setSelectedCoupons(selectedCoupons.filter(c => !changeRowKeys.includes(c.key)));
      }
    },
  };

  return (
    <Modal
      title="Individual Coupon Allocation"
      open={visible}
      onCancel={onCancel}
      width={1200}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Cancel
        </Button>,
        <Button key="reset" onClick={handleReset}>
          Reset
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={loading}
          onClick={handleSubmit}
          disabled={!selectedBeneficiary || selectedCoupons.length === 0}
        >
          Allocate {selectedCoupons.length} Coupons
        </Button>,
      ]}
    >
      <div>
        {/* Beneficiary Selection */}
        <Card title="1. Select Beneficiary" size="small" style={{ marginBottom: 16 }}>
          <Form form={form} layout="vertical">
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Form.Item label="Beneficiary" name="beneficiary_id">
                  <Select
                    placeholder="Select beneficiary"
                    value={selectedBeneficiary?.id}
                    onChange={(value) => {
                      const beneficiary = beneficiaries.find(b => b.id === value);
                      setSelectedBeneficiary(beneficiary || null);
                    }}
                    showSearch
                    optionFilterProp="children"
                  >
                    {beneficiaries.map(beneficiary => (
                      <Option key={beneficiary.id} value={beneficiary.id}>
                        <div>
                          <Text strong>{beneficiary.name}</Text>
                          <br />
                          <Text type="secondary" style={{ fontSize: '11px' }}>
                            {beneficiary.position} • {beneficiary.remaining_entitlement}L remaining
                          </Text>
                        </div>
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                {selectedBeneficiary && (
                  <div>
                    <Row gutter={8}>
                      <Col span={8}>
                        <Statistic
                          title="Entitlement"
                          value={selectedBeneficiary.fuel_entitlement}
                          suffix="L"
                          valueStyle={{ fontSize: '14px' }}
                        />
                      </Col>
                      <Col span={8}>
                        <Statistic
                          title="Used"
                          value={selectedBeneficiary.used_fuel}
                          suffix="L"
                          valueStyle={{ fontSize: '14px', color: '#ff4d4f' }}
                        />
                      </Col>
                      <Col span={8}>
                        <Statistic
                          title="Remaining"
                          value={selectedBeneficiary.remaining_entitlement}
                          suffix="L"
                          valueStyle={{ 
                            fontSize: '14px', 
                            color: selectedBeneficiary.remaining_entitlement > 0 ? '#52c41a' : '#ff4d4f' 
                          }}
                        />
                      </Col>
                    </Row>
                  </div>
                )}
              </Col>
            </Row>
          </Form>
        </Card>

        {/* Coupon Selection */}
        <Card 
          title={`2. Select Individual Coupons (${selectedCoupons.length} selected)`}
          size="small" 
          style={{ marginBottom: 16 }}
          extra={
            <Space>
              <Button size="small" onClick={() => handleQuickSelect('all')}>
                Select All Visible
              </Button>
              <Button size="small" onClick={() => handleQuickSelect('petrol')}>
                Select Petrol
              </Button>
              <Button size="small" onClick={() => handleQuickSelect('diesel')}>
                Select Diesel
              </Button>
              <Button size="small" onClick={() => handleQuickSelect('clear')}>
                Clear Selection
              </Button>
            </Space>
          }
        >
          {/* Filters */}
          <Row gutter={[16, 8]} style={{ marginBottom: 12 }}>
            <Col span={8}>
              <Search
                placeholder="Search by serial or book"
                allowClear
                size="small"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </Col>
            <Col span={6}>
              <Select
                placeholder="Filter by fuel type"
                size="small"
                allowClear
                style={{ width: '100%' }}
                value={fuelTypeFilter}
                onChange={setFuelTypeFilter}
              >
                <Option value="PETROL">Petrol</Option>
                <Option value="DIESEL">Diesel</Option>
              </Select>
            </Col>
            <Col span={6}>
              <Select
                placeholder="Filter by denomination"
                size="small"
                allowClear
                style={{ width: '100%' }}
                value={denominationFilter}
                onChange={setDenominationFilter}
              >
                <Option value={5}>5L</Option>
                <Option value={20}>20L</Option>
              </Select>
            </Col>
            <Col span={4}>
              <Text type="secondary" style={{ fontSize: '11px' }}>
                {getFilteredCoupons().length} available
              </Text>
            </Col>
          </Row>

          <Table
            columns={couponColumns}
            dataSource={getFilteredCoupons()}
            rowSelection={rowSelection}
            rowKey="key"
            size="small"
            scroll={{ y: 300 }}
            pagination={{ 
              pageSize: 20, 
              showSizeChanger: false,
              showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}` 
            }}
          />
        </Card>

        {/* Allocation Preview */}
        {allocationPreview && (
          <Card title="3. Allocation Preview" size="small">
            <Row gutter={[16, 16]}>
              <Col span={6}>
                <Statistic
                  title="Total Coupons"
                  value={allocationPreview.selected_coupons.length}
                  prefix={<BarcodeOutlined />}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="Total Litres"
                  value={allocationPreview.total_litres}
                  suffix="L"
                  prefix={<SwapOutlined />}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="Estimated Value"
                  value={allocationPreview.total_value.toFixed(2)}
                  prefix="ZWG$"
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="Entitlement After"
                  value={allocationPreview.entitlement_after}
                  suffix="L"
                  valueStyle={{ 
                    color: allocationPreview.entitlement_after >= 0 ? '#52c41a' : '#ff4d4f' 
                  }}
                />
              </Col>
            </Row>

            {allocationPreview.warning_messages.length > 0 && (
              <Alert
                message="Allocation Warnings"
                description={
                  <ul style={{ margin: 0, paddingLeft: 16 }}>
                    {allocationPreview.warning_messages.map((msg, index) => (
                      <li key={index}>{msg}</li>
                    ))}
                  </ul>
                }
                type="warning"
                showIcon
                style={{ marginTop: 16 }}
              />
            )}

            <Divider style={{ margin: '16px 0' }} />
            
            <div>
              <Text strong>Selected Coupon Summary:</Text>
              <div style={{ marginTop: 8 }}>
                {/* Group by fuel type */}
                {['PETROL', 'DIESEL'].map(fuelType => {
                  const couponsOfType = allocationPreview.selected_coupons.filter(c => c.fuel_type === fuelType);
                  if (couponsOfType.length === 0) return null;
                  
                  const totalLitres = couponsOfType.reduce((sum, c) => sum + c.denomination, 0);
                  return (
                    <div key={fuelType} style={{ marginBottom: 8 }}>
                      <Tag color={fuelType === 'PETROL' ? 'blue' : 'orange'}>
                        {fuelType}: {couponsOfType.length} coupons, {totalLitres}L
                      </Tag>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        )}
      </div>
    </Modal>
  );
};

export default IndividualCouponAllocation;