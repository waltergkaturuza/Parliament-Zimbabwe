// src/components/subcenter/BidirectionalCouponAllocation.tsx
import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  Button,
  Row,
  Col,
  Card,
  Alert,
  Space,
  Typography,
  Divider,
  Statistic,
  Tag,
  Switch,
  Radio,
  message,
  Tooltip,
} from 'antd';
import {
  CalculatorOutlined,
  SwapOutlined,
  InfoCircleOutlined,
  BookOutlined,
  FileTextOutlined,
  ThunderboltOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import apiClient from '@/api/index';

const { Text, Title } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface BidirectionalCouponAllocationProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  beneficiaries: any[];
  subCenterId?: string;
}

interface CalculationResult {
  calculated_number_of_books?: number;
  calculated_coupons_per_book?: number;
  calculated_last_serial?: string;
  calculated_total_coupons?: number;
  calculation_mode_display?: string;
  detailed_book_breakdown?: any[];
}

const BidirectionalCouponAllocation: React.FC<BidirectionalCouponAllocationProps> = ({
  visible,
  onCancel,
  onSuccess,
  beneficiaries,
  subCenterId
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [calculationMode, setCalculationMode] = useState<'first-last' | 'first-count'>('first-last');
  const [calculationResult, setCalculationResult] = useState<CalculationResult | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [realTimeCalculation, setRealTimeCalculation] = useState(true);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!visible) {
      form.resetFields();
      setCalculationResult(null);
      setPreviewMode(false);
    }
  }, [visible, form]);

  // Real-time calculation when form values change
  const handleFormValuesChange = async (changedValues: any, allValues: any) => {
    if (!realTimeCalculation) return;

    const { first_coupon_serial, last_coupon_serial, number_of_books, coupons_per_book, denomination } = allValues;

    // Only calculate if we have sufficient data
    const hasFirstLastData = first_coupon_serial && last_coupon_serial;
    const hasFirstCountData = first_coupon_serial && number_of_books && coupons_per_book;

    if (!hasFirstLastData && !hasFirstCountData) {
      setCalculationResult(null);
      return;
    }

    try {
      const calculationData: any = {
        denomination: denomination || 20,
        fuel_type: 'PETROL', // Default, could be made configurable
        fuel_price_per_litre_usd: '1.40',
        exchange_rate_zwg_usd: '27.50',
      };

      if (hasFirstLastData) {
        calculationData.first_coupon_serial = first_coupon_serial;
        calculationData.last_coupon_serial = last_coupon_serial;
      } else if (hasFirstCountData) {
        calculationData.first_coupon_serial = first_coupon_serial;
        calculationData.number_of_books = number_of_books;
        calculationData.coupons_per_book = coupons_per_book;
      }

      // Test calculation using the enhanced serializer (without actually creating a box)
      const response = await apiClient.post('/boxes/calculate/', calculationData);
      setCalculationResult(response.data);
    } catch (error) {
      console.error('Calculation error:', error);
      // Don't show error messages for real-time calculations to avoid spam
    }
  };

  const handleManualCalculate = async () => {
    const values = await form.validateFields([
      'first_coupon_serial',
      calculationMode === 'first-last' ? 'last_coupon_serial' : 'number_of_books',
      calculationMode === 'first-count' ? 'coupons_per_book' : null,
      'denomination'
    ].filter(Boolean));

    setLoading(true);
    try {
      await handleFormValuesChange({}, { ...values, ...form.getFieldsValue() });
      message.success('Calculation completed successfully!');
    } catch (error) {
      message.error('Failed to calculate. Please check your inputs.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      // Create the allocation record using the enhanced API
      const allocationData = {
        beneficiary_id: values.beneficiary_id,
        sub_center_id: subCenterId,
        session_name: values.session_name,
        program_name: values.program_name,
        notes: values.notes,
        allocation_method: calculationMode === 'first-last' ? 'SERIAL_RANGE' : 'BOOK_COUNT',
        ...values,
        // Include calculation results
        calculated_books: calculationResult?.calculated_number_of_books,
        calculated_coupons_per_book: calculationResult?.calculated_coupons_per_book,
        calculated_total_coupons: calculationResult?.calculated_total_coupons,
        calculation_mode: calculationResult?.calculation_mode_display,
      };

      await apiClient.post('/coupon-allocations/', allocationData);
      message.success('Coupon allocation created successfully!');
      onSuccess();
      onCancel();
    } catch (error: any) {
      console.error('Allocation error:', error);
      message.error(error.response?.data?.message || 'Failed to create allocation');
    } finally {
      setLoading(false);
    }
  };

  const renderCalculationModeSelector = () => (
    <Card size="small" title="Calculation Mode" style={{ marginBottom: 16 }}>
      <Radio.Group 
        value={calculationMode} 
        onChange={(e) => {
          setCalculationMode(e.target.value);
          setCalculationResult(null);
          // Clear mode-specific fields
          if (e.target.value === 'first-last') {
            form.setFieldsValue({ number_of_books: undefined, coupons_per_book: undefined });
          } else {
            form.setFieldsValue({ last_coupon_serial: undefined });
          }
        }}
        style={{ width: '100%' }}
      >
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Radio value="first-last">
            <Space>
              <SwapOutlined />
              <div>
                <Text strong>Serial Range Mode</Text>
                <br />
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  Enter first and last serial → Calculate books and coupons per book
                </Text>
              </div>
            </Space>
          </Radio>
          <Radio value="first-count">
            <Space>
              <CalculatorOutlined />
              <div>
                <Text strong>Book Count Mode</Text>
                <br />
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  Enter first serial + book structure → Calculate last serial
                </Text>
              </div>
            </Space>
          </Radio>
        </Space>
      </Radio.Group>
    </Card>
  );

  const renderFirstLastMode = () => (
    <>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            label="First Coupon Serial"
            name="first_coupon_serial"
            rules={[{ required: true, message: 'Please enter first serial' }]}
          >
            <Input 
              placeholder="e.g., PU006H1355101"
              onChange={() => realTimeCalculation && setTimeout(() => form.submit(), 100)}
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label="Last Coupon Serial"
            name="last_coupon_serial"
            rules={[{ required: true, message: 'Please enter last serial' }]}
          >
            <Input 
              placeholder="e.g., PU006H1356100"
              onChange={() => realTimeCalculation && setTimeout(() => form.submit(), 100)}
            />
          </Form.Item>
        </Col>
      </Row>
    </>
  );

  const renderFirstCountMode = () => (
    <>
      <Row gutter={16}>
        <Col span={8}>
          <Form.Item
            label="First Coupon Serial"
            name="first_coupon_serial"
            rules={[{ required: true, message: 'Please enter first serial' }]}
          >
            <Input 
              placeholder="e.g., PU006H1355101"
              onChange={() => realTimeCalculation && setTimeout(() => form.submit(), 100)}
            />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            label="Number of Books"
            name="number_of_books"
            rules={[
              { required: true, message: 'Please enter number of books' },
              { type: 'number', min: 1, max: 100, message: 'Must be between 1 and 100' }
            ]}
          >
            <InputNumber 
              min={1}
              max={100}
              style={{ width: '100%' }}
              placeholder="e.g., 10"
              onChange={() => realTimeCalculation && setTimeout(() => form.submit(), 100)}
            />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            label="Coupons per Book"
            name="coupons_per_book"
            rules={[
              { required: true, message: 'Please enter coupons per book' },
              { type: 'number', min: 1, max: 100, message: 'Must be between 1 and 100' }
            ]}
          >
            <InputNumber 
              min={1}
              max={100}
              style={{ width: '100%' }}
              placeholder="e.g., 100"
              onChange={() => realTimeCalculation && setTimeout(() => form.submit(), 100)}
            />
          </Form.Item>
        </Col>
      </Row>
    </>
  );

  const renderCalculationResults = () => {
    if (!calculationResult) return null;

    return (
      <Card 
        size="small" 
        title={
          <Space>
            <CheckCircleOutlined style={{ color: '#52c41a' }} />
            Calculation Results
            <Tag color="blue">{calculationResult.calculation_mode_display}</Tag>
          </Space>
        }
        style={{ marginBottom: 16, backgroundColor: '#f6ffed', borderColor: '#52c41a' }}
      >
        <Row gutter={16}>
          <Col span={6}>
            <Statistic
              title="Total Coupons"
              value={calculationResult.calculated_total_coupons || 0}
              prefix={<FileTextOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Number of Books"
              value={calculationResult.calculated_number_of_books || 0}
              prefix={<BookOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Coupons per Book"
              value={calculationResult.calculated_coupons_per_book || 0}
            />
          </Col>
          <Col span={6}>
            {calculationResult.calculated_last_serial && (
              <div>
                <Text type="secondary">Last Serial:</Text>
                <br />
                <Text strong style={{ fontSize: '12px' }}>
                  {calculationResult.calculated_last_serial}
                </Text>
              </div>
            )}
          </Col>
        </Row>

        {calculationResult.detailed_book_breakdown && calculationResult.detailed_book_breakdown.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <Button 
              size="small" 
              type="link" 
              onClick={() => setPreviewMode(!previewMode)}
            >
              {previewMode ? 'Hide' : 'Show'} Book Breakdown
            </Button>
            {previewMode && (
              <div style={{ marginTop: 8, maxHeight: 200, overflowY: 'auto' }}>
                {calculationResult.detailed_book_breakdown.map((book: any, index: number) => (
                  <div key={index} style={{ 
                    padding: '8px', 
                    backgroundColor: '#fff', 
                    marginBottom: '4px', 
                    borderRadius: '4px',
                    fontSize: '12px'
                  }}>
                    <Text strong>Book {book.book_number}:</Text> {book.first_coupon_serial} - {book.last_coupon_serial} 
                    ({book.number_of_coupons} coupons)
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Card>
    );
  };

  return (
    <Modal
      title={
        <Space>
          <ThunderboltOutlined />
          Bidirectional Coupon Allocation
          <Tag color="gold">Enhanced</Tag>
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={800}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        onValuesChange={handleFormValuesChange}
      >
        <Alert
          message="Enhanced Bidirectional Allocation"
          description="This form supports dynamic calculation in both directions. Enter data the way that's most convenient for you!"
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        {/* Real-time calculation toggle */}
        <div style={{ marginBottom: 16, textAlign: 'right' }}>
          <Space>
            <Text type="secondary">Real-time calculation:</Text>
            <Switch 
              checked={realTimeCalculation}
              onChange={setRealTimeCalculation}
              size="small"
            />
            {!realTimeCalculation && (
              <Button 
                size="small" 
                icon={<CalculatorOutlined />}
                onClick={handleManualCalculate}
                loading={loading}
              >
                Calculate
              </Button>
            )}
          </Space>
        </div>

        {/* Basic allocation details */}
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Beneficiary"
              name="beneficiary_id"
              rules={[{ required: true, message: 'Please select a beneficiary' }]}
            >
              <Select placeholder="Select beneficiary" showSearch>
                {beneficiaries.map(beneficiary => (
                  <Option key={beneficiary.id} value={beneficiary.id}>
                    <Space direction="vertical" size={0}>
                      <Text strong>{beneficiary.name || 'Unknown Name'}</Text>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        {beneficiary.position} - {beneficiary.department}
                      </Text>
                    </Space>
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label={
                <Space>
                  Denomination (Litres)
                  <Tooltip title="Fuel amount per coupon">
                    <InfoCircleOutlined />
                  </Tooltip>
                </Space>
              }
              name="denomination"
              initialValue={20}
              rules={[{ required: true, message: 'Please enter denomination' }]}
            >
              <Select>
                <Option value={5}>5 Litres</Option>
                <Option value={10}>10 Litres</Option>
                <Option value={20}>20 Litres</Option>
                <Option value={25}>25 Litres</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        {/* Calculation mode selector */}
        {renderCalculationModeSelector()}

        {/* Dynamic input fields based on mode */}
        {calculationMode === 'first-last' ? renderFirstLastMode() : renderFirstCountMode()}

        {/* Calculation results */}
        {renderCalculationResults()}

        <Divider />

        {/* Session and program details */}
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Session Name"
              name="session_name"
              rules={[{ required: true, message: 'Please enter session name' }]}
            >
              <Input placeholder="e.g., Morning Session" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Program Name"
              name="program_name"
              rules={[{ required: true, message: 'Please enter program name' }]}
            >
              <Input placeholder="e.g., Committee Meeting" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          label="Allocation Notes"
          name="notes"
        >
          <TextArea 
            rows={3} 
            placeholder="Additional notes about this allocation..."
          />
        </Form.Item>

        {/* Submit buttons */}
        <div style={{ textAlign: 'right', marginTop: 24 }}>
          <Space>
            <Button onClick={onCancel}>
              Cancel
            </Button>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              disabled={!calculationResult}
              icon={<CheckCircleOutlined />}
            >
              Create Allocation
            </Button>
          </Space>
        </div>
      </Form>
    </Modal>
  );
};

export default BidirectionalCouponAllocation;