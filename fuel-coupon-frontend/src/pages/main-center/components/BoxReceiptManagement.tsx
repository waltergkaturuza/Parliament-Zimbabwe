// src/pages/main-center/components/BoxReceiptManagementSimplified.tsx
// Simplified version with only 3 steps as per requirements
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
  message,
  Steps,
  TimePicker,
} from 'antd';
import {
  PlusOutlined,
  EyeOutlined,
  PrinterOutlined,
  InboxOutlined,
  CarOutlined,
  DollarOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  ClockCircleOutlined,
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
  monetaryValue: number;    // Value in ZWG
  fuelPricePerLitre: number;
  
  // Status and workflow
  status: 'PENDING' | 'RECEIVED' | 'VERIFIED' | 'ARCHIVED';
  verificationNotes?: string;
  notes?: string;
  
  // Audit trail
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy?: string;
}

const BoxReceiptManagementSimplified: FC = () => {
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

  // Fetch data on component mount
  useEffect(() => {
    fetchBoxReceipts();
    generateNextBoxNumber();
  }, []);

  // Update form when nextBoxNumber changes
  useEffect(() => {
    if (nextBoxNumber) {
      form.setFieldsValue({ boxId: nextBoxNumber });
    }
  }, [nextBoxNumber, form]);

  const fetchBoxReceipts = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/boxes/');
      setBoxReceipts(response.data || []);
    } catch (error) {
      console.error('Error fetching box receipts:', error);
      message.error('Failed to fetch box receipts');
    } finally {
      setLoading(false);
    }
  };

  const generateNextBoxNumber = async () => {
    try {
      const response = await apiClient.get('/boxes/next-number/');
      const nextNumber = response.data?.nextBoxNumber;
      if (nextNumber) {
        setNextBoxNumber(nextNumber);
        return nextNumber;
      }
    } catch (error) {
      console.error('Error generating box number:', error);
    }
    
    // Fallback to timestamp-based unique ID
    const fallbackId = `FCB-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;
    setNextBoxNumber(fallbackId);
    return fallbackId;
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();
      
      // Prepare data for submission
      const boxData = {
        ...values,
        boxId: values.boxId || nextBoxNumber,
        receivedDate: values.receivedDate?.format('YYYY-MM-DD'),
        receivedTime: values.receivedTime?.format('HH:mm:ss'),
      };

      const response = await apiClient.post('/boxes/', boxData);
      
      if (response.status === 201) {
        message.success('Box receipt saved successfully!');
        setIsModalVisible(false);
        setCurrentStep(0);
        form.resetFields();
        await fetchBoxReceipts();
        await generateNextBoxNumber();
      }
    } catch (error) {
      console.error('Error submitting box receipt:', error);
      message.error('Failed to save box receipt');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (record: BoxReceipt) => {
    setSelectedBox(record);
    form.setFieldsValue({
      ...record,
      receivedDate: record.receivedDate ? dayjs(record.receivedDate) : null,
      receivedTime: record.receivedTime ? dayjs(record.receivedTime, 'HH:mm:ss') : null,
    });
    setCurrentStep(0);
    setIsModalVisible(true);
  };

  const handleView = (record: BoxReceipt) => {
    setSelectedBox(record);
    setViewModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await apiClient.delete(`/boxes/${id}/`);
      message.success('Box receipt deleted successfully');
      fetchBoxReceipts();
    } catch (error) {
      console.error('Error deleting box receipt:', error);
      message.error('Failed to delete box receipt');
    }
  };

  const columns: ColumnsType<BoxReceipt> = [
    {
      title: 'Box ID',
      dataIndex: 'boxId',
      key: 'boxId',
      render: (text) => <Text code>{text}</Text>
    },
    {
      title: 'Supplier',
      dataIndex: 'supplier',
      key: 'supplier',
    },
    {
      title: 'Fuel Type',
      dataIndex: 'fuelType',
      key: 'fuelType',
      render: (text) => (
        <Tag color={text === 'PETROL' ? 'blue' : 'green'}>{text}</Tag>
      )
    },
    {
      title: 'Amount',
      dataIndex: 'couponAmount',
      key: 'couponAmount',
      render: (text) => `${text}L`
    },
    {
      title: 'Total Coupons',
      dataIndex: 'totalCoupons',
      key: 'totalCoupons',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const color = status === 'VERIFIED' ? 'green' : status === 'RECEIVED' ? 'blue' : 'orange';
        return <Tag color={color}>{status}</Tag>;
      }
    },
    {
      title: 'Received Date',
      dataIndex: 'receivedDate',
      key: 'receivedDate',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          <Button
            icon={<EyeOutlined />}
            size="small"
            onClick={() => handleView(record)}
          >
            View
          </Button>
          <Button
            icon={<EditOutlined />}
            size="small"
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button>
          <Button
            icon={<PrinterOutlined />}
            size="small"
            onClick={() => window.print()}
          >
            Print
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card>
        <div style={{ marginBottom: 16 }}>
          <Title level={4}>Box Receipt Management</Title>
          <Text type="secondary">
            Simplified 3-step process for receiving fuel coupon boxes
          </Text>
        </div>

        <div style={{ marginBottom: 16 }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setIsModalVisible(true);
              setCurrentStep(0);
              setSelectedBox(null);
              form.resetFields();
            }}
          >
            New Box Receipt
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={boxReceipts}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* Box Receipt Modal - 3 Steps */}
      <Modal
        title={
          <Space>
            <InboxOutlined />
            {selectedBox ? `Edit Box Receipt - ${selectedBox.boxId}` : 'New Box Receipt'}
          </Space>
        }
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          setCurrentStep(0);
          form.resetFields();
        }}
        footer={null}
        width={800}
        destroyOnClose
      >
        <Steps current={currentStep} style={{ marginBottom: 24 }}>
          <Step title="Basic Info" icon={<InboxOutlined />} />
          <Step title="Fuel Details" icon={<CarOutlined />} />
          <Step title="Final Calculation" icon={<DollarOutlined />} />
        </Steps>

        <Form
          form={form}
          layout="vertical"
        >
          {/* Step 0: Basic Info */}
          {currentStep === 0 && (
            <>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="Box ID"
                    name="boxId"
                    rules={[{ required: true, message: 'Box ID is required' }]}
                  >
                    <Input
                      prefix={<InboxOutlined />}
                      placeholder="Auto-generated"
                      style={{ fontFamily: 'monospace' }}
                    />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item
                    label="Supplier"
                    name="supplier"
                    rules={[{ required: true, message: 'Please enter supplier name' }]}
                  >
                    <Input placeholder="Enter supplier name" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item
                    label="Received Date"
                    name="receivedDate"
                    rules={[{ required: true, message: 'Please select received date' }]}
                  >
                    <DatePicker
                      style={{ width: '100%' }}
                      defaultValue={dayjs()}
                    />
                  </Form.Item>
                </Col>

                <Col span={8}>
                  <Form.Item
                    label="Received Time"
                    name="receivedTime"
                    rules={[{ required: true, message: 'Please select received time' }]}
                  >
                    <TimePicker
                      style={{ width: '100%' }}
                      defaultValue={dayjs()}
                    />
                  </Form.Item>
                </Col>

                <Col span={8}>
                  <Form.Item
                    label="Received By"
                    name="receivedBy"
                    rules={[{ required: true, message: 'Please enter received by' }]}
                  >
                    <Input
                      prefix={<UserOutlined />}
                      placeholder="Enter name"
                    />
                  </Form.Item>
                </Col>
              </Row>

              <div style={{ textAlign: 'right' }}>
                <Space>
                  <Button onClick={() => setIsModalVisible(false)}>
                    Cancel
                  </Button>
                  <Button
                    type="primary"
                    onClick={() => setCurrentStep(1)}
                  >
                    Next: Fuel Details
                  </Button>
                </Space>
              </div>
            </>
          )}

          {/* Step 1: Fuel Details */}
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
                    <Select placeholder="Select amount">
                      <Option value={5}>5 Litres</Option>
                      <Option value={20}>20 Litres</Option>
                      <Option value={50}>50 Litres</Option>
                    </Select>
                  </Form.Item>
                </Col>

                <Col span={8}>
                  <Form.Item
                    label="Fuel Price per Litre (USD)"
                    name="fuelPricePerLitre"
                    rules={[{ required: true, message: 'Please enter fuel price' }]}
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      placeholder="Enter price in USD"
                      min={0}
                      step={0.01}
                      precision={2}
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
                    Next: Final Calculation
                  </Button>
                </Space>
              </div>
            </>
          )}

          {/* Step 2: Final Calculation */}
          {currentStep === 2 && (
            <>
              <div style={{ marginBottom: 24 }}>
                <Title level={4}>💰 Final Calculation</Title>
                <Text type="secondary">
                  Enter coupon details and the system will auto-calculate the last coupon number and monetary values.
                </Text>
              </div>

              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item
                    label="First Coupon Number"
                    name="firstCouponId"
                    rules={[{ required: true, message: 'Enter first coupon number' }]}
                  >
                    <Input 
                      placeholder="PU00GH355101"
                      style={{ fontFamily: 'monospace', fontSize: '14px' }}
                      onChange={(e) => {
                        const firstId = e.target.value;
                        const totalCoupons = form.getFieldValue('totalCoupons');
                        
                        if (firstId && totalCoupons) {
                          // Auto-calculate last coupon ID
                          const match = firstId.match(/([A-Z]+)(\d+)$/);
                          if (match) {
                            const prefix = match[1];
                            const firstNumber = parseInt(match[2]);
                            const lastNumber = firstNumber + totalCoupons - 1;
                            const numberLength = match[2].length;
                            const lastCouponId = `${prefix}${lastNumber.toString().padStart(numberLength, '0')}`;
                            form.setFieldValue('lastCouponId', lastCouponId);
                          }
                        }
                      }}
                    />
                  </Form.Item>
                </Col>

                <Col span={8}>
                  <Form.Item
                    label="Number of Books"
                    name="numberOfBooks"
                    rules={[{ required: true, message: 'Enter number of books' }]}
                  >
                    <InputNumber
                      min={1}
                      max={50}
                      style={{ width: '100%' }}
                      placeholder="1-50 books"
                    />
                  </Form.Item>
                </Col>

                <Col span={8}>
                  <Form.Item
                    label="Total Number of Coupons"
                    name="totalCoupons"
                    rules={[{ required: true, message: 'Enter total coupons' }]}
                  >
                    <InputNumber
                      min={1}
                      style={{ width: '100%' }}
                      placeholder="Total coupons"
                      onChange={(value) => {
                        // Auto-calculate last coupon ID when total changes
                        const firstId = form.getFieldValue('firstCouponId');
                        
                        if (firstId && value) {
                          const match = firstId.match(/([A-Z]+)(\d+)$/);
                          if (match) {
                            const prefix = match[1];
                            const firstNumber = parseInt(match[2]);
                            const lastNumber = firstNumber + value - 1;
                            const numberLength = match[2].length;
                            const lastCouponId = `${prefix}${lastNumber.toString().padStart(numberLength, '0')}`;
                            form.setFieldValue('lastCouponId', lastCouponId);
                          }
                        }

                        // Auto-calculate monetary values
                        const couponAmount = form.getFieldValue('couponAmount');
                        const fuelPricePerLitre = form.getFieldValue('fuelPricePerLitre');
                        
                        if (value && couponAmount && fuelPricePerLitre) {
                          const totalLitres = value * couponAmount;
                          const monetaryValueUSD = totalLitres * fuelPricePerLitre;
                          const monetaryValue = monetaryValueUSD * 25000; // ZWG conversion
                          
                          form.setFieldsValue({
                            totalLitres,
                            monetaryValueUSD,
                            monetaryValue
                          });
                        }
                      }}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="Last Coupon Number (Auto-calculated)"
                    name="lastCouponId"
                  >
                    <Input 
                      placeholder="Will be auto-calculated"
                      style={{ fontFamily: 'monospace', fontSize: '14px', backgroundColor: '#f5f5f5' }}
                      readOnly
                    />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item
                    label="Total Litres (Auto-calculated)"
                    name="totalLitres"
                  >
                    <InputNumber
                      style={{ width: '100%', backgroundColor: '#f5f5f5' }}
                      readOnly
                      formatter={value => `${value} L`}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="Monetary Value USD (Auto-calculated)"
                    name="monetaryValueUSD"
                  >
                    <InputNumber
                      style={{ width: '100%', backgroundColor: '#f5f5f5' }}
                      readOnly
                      formatter={value => `$ ${value}`}
                    />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item
                    label="Monetary Value ZWG (Auto-calculated)"
                    name="monetaryValue"
                  >
                    <InputNumber
                      style={{ width: '100%', backgroundColor: '#f5f5f5' }}
                      readOnly
                      formatter={value => `ZWG ${value?.toLocaleString()}`}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                label="Receipt Notes"
                name="notes"
              >
                <TextArea
                  rows={3}
                  placeholder="Enter any notes about the box receipt..."
                />
              </Form.Item>

              <div style={{ textAlign: 'right' }}>
                <Space>
                  <Button onClick={() => setCurrentStep(1)}>
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
                    Save Box Receipt
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
          <Descriptions bordered column={2}>
            <Descriptions.Item label="Box ID">{selectedBox.boxId}</Descriptions.Item>
            <Descriptions.Item label="Supplier">{selectedBox.supplier}</Descriptions.Item>
            <Descriptions.Item label="Fuel Type">
              <Tag color={selectedBox.fuelType === 'PETROL' ? 'blue' : 'green'}>
                {selectedBox.fuelType}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Coupon Amount">{selectedBox.couponAmount} Litres</Descriptions.Item>
            <Descriptions.Item label="Number of Books">{selectedBox.numberOfBooks}</Descriptions.Item>
            <Descriptions.Item label="Total Coupons">{selectedBox.totalCoupons}</Descriptions.Item>
            <Descriptions.Item label="Total Litres">{selectedBox.totalLitres}L</Descriptions.Item>
            <Descriptions.Item label="Price per Litre">${selectedBox.fuelPricePerLitre}</Descriptions.Item>
            <Descriptions.Item label="Value (USD)">${selectedBox.monetaryValueUSD}</Descriptions.Item>
            <Descriptions.Item label="Value (ZWG)">ZWG {selectedBox.monetaryValue?.toLocaleString()}</Descriptions.Item>
            <Descriptions.Item label="First Coupon ID">{selectedBox.firstCouponId}</Descriptions.Item>
            <Descriptions.Item label="Last Coupon ID">{selectedBox.lastCouponId}</Descriptions.Item>
            <Descriptions.Item label="Received By">{selectedBox.receivedBy}</Descriptions.Item>
            <Descriptions.Item label="Received Date">{selectedBox.receivedDate} {selectedBox.receivedTime}</Descriptions.Item>
            {selectedBox.notes && (
              <Descriptions.Item label="Notes" span={2}>
                {selectedBox.notes}
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default BoxReceiptManagementSimplified;