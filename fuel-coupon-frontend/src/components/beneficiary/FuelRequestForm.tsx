// src/components/beneficiary/FuelRequestForm.tsx
import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  DatePicker,
  Button,
  Space,
  Row,
  Col,
  Card,
  Alert,
  message,
  Divider,
  Typography,
  Radio,
  Checkbox,
  Steps,
  Tag,
  Avatar,
  Progress,
} from 'antd';
import {
  CarOutlined,
  UserOutlined,
  FileTextOutlined,
  SendOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import apiClient from '@/api/index';

const { TextArea } = Input;
const { Option } = Select;
const { Title, Text } = Typography;
const { Step } = Steps;

interface BeneficiaryFuelRequestProps {
  visible: boolean;
  onClose: () => void;
  beneficiaryProfile?: any;
  subCenterId?: string;
}

interface VehicleInfo {
  registration_number: string;
  make: string;
  model: string;
  year: number;
  engine_size: string;
  fuel_type: 'PETROL' | 'DIESEL';
  current_mileage?: number;
}

const BeneficiaryFuelRequest: React.FC<BeneficiaryFuelRequestProps> = ({
  visible,
  onClose,
  beneficiaryProfile,
  subCenterId
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [vehicleInfo, setVehicleInfo] = useState<VehicleInfo | null>(null);
  const [allocationsRemaining, setAllocationsRemaining] = useState(0);
  const [lastRequestDate, setLastRequestDate] = useState<string | null>(null);
  const [eligibilityStatus, setEligibilityStatus] = useState<'ELIGIBLE' | 'NOT_ELIGIBLE' | 'PENDING'>('ELIGIBLE');

  useEffect(() => {
    if (visible && beneficiaryProfile) {
      loadBeneficiaryData();
    }
  }, [visible, beneficiaryProfile]);

  const loadBeneficiaryData = async () => {
    try {
      // Load beneficiary allocation status
      const allocationResponse = await apiClient.get(`/beneficiaries/${beneficiaryProfile.id}/allocations/current/`);
      const currentAllocation = allocationResponse.data;
      
      setAllocationsRemaining(currentAllocation.coupons_remaining || 0);
      setLastRequestDate(currentAllocation.last_request_date);
      
      // Load vehicle information
      if (beneficiaryProfile.vehicle_registration) {
        setVehicleInfo({
          registration_number: beneficiaryProfile.vehicle_registration,
          make: beneficiaryProfile.vehicle_make,
          model: beneficiaryProfile.vehicle_model,
          year: beneficiaryProfile.vehicle_year,
          engine_size: beneficiaryProfile.engine_size,
          fuel_type: beneficiaryProfile.fuel_type,
          current_mileage: beneficiaryProfile.current_mileage
        });
      }
      
      // Check eligibility
      checkEligibility();
      
    } catch (error) {
      console.error('Error loading beneficiary data:', error);
      message.error('Failed to load beneficiary information');
    }
  };

  const checkEligibility = () => {
    // Basic eligibility checks
    if (!beneficiaryProfile?.is_active) {
      setEligibilityStatus('NOT_ELIGIBLE');
      return;
    }
    
    if (allocationsRemaining <= 0) {
      setEligibilityStatus('NOT_ELIGIBLE');
      return;
    }
    
    // Check if last request was too recent (e.g., within 24 hours)
    if (lastRequestDate) {
      const lastRequest = dayjs(lastRequestDate);
      const hoursSinceLastRequest = dayjs().diff(lastRequest, 'hours');
      
      if (hoursSinceLastRequest < 24) {
        setEligibilityStatus('NOT_ELIGIBLE');
        return;
      }
    }
    
    setEligibilityStatus('ELIGIBLE');
  };

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);
      
      const requestData = {
        ...values,
        beneficiary_id: beneficiaryProfile.id,
        subcenter_id: subCenterId,
        vehicle_info: vehicleInfo,
        requested_at: new Date().toISOString(),
        status: 'PENDING_SUBCENTER_APPROVAL',
        priority: calculatePriority(values),
        request_type: 'FUEL_ALLOCATION'
      };

      // Submit fuel request
      const response = await apiClient.post('/beneficiaries/fuel-requests/', requestData);
      
      if (response.status === 201) {
        message.success('Fuel request submitted successfully! You will be notified when approved.');
        
        // Send notification to subcenter
        await apiClient.post('/notifications/send/', {
          recipient_type: 'SUBCENTER',
          recipient_id: subCenterId,
          message_type: 'FUEL_REQUEST',
          title: 'New Fuel Request from Beneficiary',
          message: `${beneficiaryProfile.first_name} ${beneficiaryProfile.last_name} has requested ${values.requested_amount} litres of ${values.fuel_type}`,
          data: requestData,
          priority: requestData.priority
        });
        
        form.resetFields();
        setCurrentStep(0);
        onClose();
      }
    } catch (error) {
      console.error('Error submitting fuel request:', error);
      message.error('Failed to submit fuel request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const calculatePriority = (values: any) => {
    let priority = 'NORMAL';
    
    if (values.urgency_reason === 'EMERGENCY') {
      priority = 'HIGH';
    } else if (values.requested_amount > 50) {
      priority = 'HIGH';
    } else if (allocationsRemaining < 20) {
      priority = 'LOW';
    }
    
    return priority;
  };

  const nextStep = async () => {
    try {
      const values = await form.validateFields();
      if (currentStep === 0) {
        // Validate step 1 fields
        const requiredFields = ['requested_amount', 'fuel_type', 'urgency_reason'];
        const stepValues = {};
        requiredFields.forEach(field => {
          if (values[field]) stepValues[field] = values[field];
        });
        
        if (Object.keys(stepValues).length === requiredFields.length) {
          setCurrentStep(1);
        }
      } else if (currentStep === 1) {
        setCurrentStep(2);
      }
    } catch (error) {
      console.log('Validation failed:', error);
    }
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const renderEligibilityStatus = () => {
    if (eligibilityStatus === 'NOT_ELIGIBLE') {
      return (
        <Alert
          message="Not Eligible for Fuel Request"
          description={
            <div>
              <p>You are not currently eligible to request fuel. Possible reasons:</p>
              <ul>
                <li>Your account is not active</li>
                <li>No remaining fuel allocations for this period</li>
                <li>Recent request submitted (must wait 24 hours between requests)</li>
              </ul>
            </div>
          }
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
        />
      );
    }
    
    return (
      <Alert
        message="Eligible for Fuel Request"
        description={`You have ${allocationsRemaining} litres remaining in your current allocation.`}
        type="success"
        showIcon
        style={{ marginBottom: 16 }}
      />
    );
  };

  const renderBeneficiaryInfo = () => (
    <Card title="Beneficiary Information" style={{ marginBottom: 16 }}>
      <Row gutter={16}>
        <Col span={4}>
          <Avatar size={64} icon={<UserOutlined />} />
        </Col>
        <Col span={20}>
          <Space direction="vertical">
            <Title level={4} style={{ margin: 0 }}>
              {beneficiaryProfile?.first_name} {beneficiaryProfile?.last_name}
            </Title>
            <Text type="secondary">ID: {beneficiaryProfile?.beneficiary_id}</Text>
            <Text type="secondary">
              <EnvironmentOutlined /> {beneficiaryProfile?.constituency}
            </Text>
            <Text type="secondary">
              <PhoneOutlined /> {beneficiaryProfile?.phone_number}
            </Text>
          </Space>
        </Col>
      </Row>
      
      <Divider />
      
      <Row gutter={16}>
        <Col span={8}>
          <Text strong>Remaining Allocation</Text>
          <div>
            <Progress
              percent={(allocationsRemaining / (beneficiaryProfile?.base_allocation || 100)) * 100}
              format={() => `${allocationsRemaining}L`}
              status={allocationsRemaining > 20 ? 'active' : 'exception'}
            />
          </div>
        </Col>
        <Col span={8}>
          <Text strong>Category</Text>
          <div>
            <Tag color="blue">{beneficiaryProfile?.category?.name}</Tag>
          </div>
        </Col>
        <Col span={8}>
          <Text strong>Last Request</Text>
          <div>
            <Text type="secondary">
              {lastRequestDate ? dayjs(lastRequestDate).format('MMM DD, YYYY') : 'No previous requests'}
            </Text>
          </div>
        </Col>
      </Row>
    </Card>
  );

  const renderVehicleInfo = () => {
    if (!vehicleInfo) {
      return (
        <Alert
          message="No Vehicle Information"
          description="Please update your vehicle information in your profile before requesting fuel."
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
      );
    }

    return (
      <Card title="Vehicle Information" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={6}>
            <Text strong>Registration</Text>
            <div>{vehicleInfo.registration_number}</div>
          </Col>
          <Col span={6}>
            <Text strong>Make & Model</Text>
            <div>{vehicleInfo.make} {vehicleInfo.model}</div>
          </Col>
          <Col span={6}>
            <Text strong>Year</Text>
            <div>{vehicleInfo.year}</div>
          </Col>
          <Col span={6}>
            <Text strong>Fuel Type</Text>
            <div>
              <Tag color={vehicleInfo.fuel_type === 'PETROL' ? 'green' : 'blue'}>
                {vehicleInfo.fuel_type}
              </Tag>
            </div>
          </Col>
        </Row>
      </Card>
    );
  };

  const renderStep1 = () => (
    <>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="requested_amount"
            label="Requested Amount (Litres)"
            rules={[
              { required: true, message: 'Please enter requested amount' },
              { type: 'number', min: 1, max: allocationsRemaining, message: `Amount must be between 1 and ${allocationsRemaining} litres` }
            ]}
          >
            <InputNumber
              min={1}
              max={allocationsRemaining}
              style={{ width: '100%' }}
              placeholder="Enter litres needed"
              addonAfter="Litres"
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="fuel_type"
            label="Fuel Type"
            rules={[{ required: true, message: 'Please select fuel type' }]}
            initialValue={vehicleInfo?.fuel_type}
          >
            <Select placeholder="Select fuel type" disabled={!!vehicleInfo?.fuel_type}>
              <Option value="PETROL">Petrol</Option>
              <Option value="DIESEL">Diesel</Option>
            </Select>
          </Form.Item>
        </Col>
      </Row>

      <Form.Item
        name="urgency_reason"
        label="Urgency Level"
        rules={[{ required: true, message: 'Please select urgency level' }]}
      >
        <Radio.Group>
          <Space direction="vertical">
            <Radio value="ROUTINE">Routine - Normal fuel needs</Radio>
            <Radio value="PRIORITY">Priority - Important travel/work</Radio>
            <Radio value="EMERGENCY">Emergency - Critical need</Radio>
          </Space>
        </Radio.Group>
      </Form.Item>

      <Form.Item
        name="purpose"
        label="Purpose of Travel"
        rules={[{ required: true, message: 'Please describe the purpose' }]}
      >
        <TextArea
          rows={3}
          placeholder="Describe why you need the fuel (e.g., attending committee meeting, constituency work, etc.)"
        />
      </Form.Item>
    </>
  );

  const renderStep2 = () => (
    <>
      <Form.Item
        name="travel_destination"
        label="Travel Destination"
        rules={[{ required: true, message: 'Please enter destination' }]}
      >
        <Input placeholder="Where are you traveling to?" />
      </Form.Item>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="estimated_distance"
            label="Estimated Distance (KM)"
            rules={[{ required: true, message: 'Please enter estimated distance' }]}
          >
            <InputNumber
              min={1}
              style={{ width: '100%' }}
              placeholder="Total distance for trip"
              addonAfter="KM"
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="travel_date"
            label="Travel Date"
            rules={[{ required: true, message: 'Please select travel date' }]}
          >
            <DatePicker
              style={{ width: '100%' }}
              disabledDate={(current) => current && current < dayjs().startOf('day')}
            />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item
        name="additional_passengers"
        label="Additional Passengers"
      >
        <InputNumber
          min={0}
          max={8}
          style={{ width: '100%' }}
          placeholder="Number of additional passengers"
        />
      </Form.Item>

      <Form.Item name="return_trip" valuePropName="checked">
        <Checkbox>This is a return trip (multiply distance by 2)</Checkbox>
      </Form.Item>
    </>
  );

  const renderStep3 = () => (
    <>
      <Alert
        message="Review Your Request"
        description="Please review all information before submitting your fuel request."
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Card title="Request Summary" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={12}>
            <Text strong>Requested Amount:</Text>
            <div>{form.getFieldValue('requested_amount')} Litres</div>
          </Col>
          <Col span={12}>
            <Text strong>Fuel Type:</Text>
            <div>{form.getFieldValue('fuel_type')}</div>
          </Col>
          <Col span={12}>
            <Text strong>Urgency:</Text>
            <div>{form.getFieldValue('urgency_reason')}</div>
          </Col>
          <Col span={12}>
            <Text strong>Travel Date:</Text>
            <div>{form.getFieldValue('travel_date')?.format('MMM DD, YYYY')}</div>
          </Col>
        </Row>
      </Card>

      <Form.Item
        name="additional_notes"
        label="Additional Notes (Optional)"
      >
        <TextArea
          rows={3}
          placeholder="Any additional information or special requests..."
        />
      </Form.Item>

      <Form.Item name="acknowledge_terms" valuePropName="checked" rules={[
        { required: true, message: 'You must acknowledge the terms' }
      ]}>
        <Checkbox>
          I acknowledge that this fuel request is for official parliamentary business and I will use the fuel responsibly.
        </Checkbox>
      </Form.Item>
    </>
  );

  if (eligibilityStatus === 'NOT_ELIGIBLE') {
    return (
      <Modal
        title={<><UserOutlined /> Fuel Request</>}
        open={visible}
        onCancel={onClose}
        footer={[
          <Button key="close" onClick={onClose}>
            Close
          </Button>
        ]}
        width={600}
      >
        {renderEligibilityStatus()}
      </Modal>
    );
  }

  return (
    <Modal
      title={<><CarOutlined /> Request Fuel Allocation</>}
      open={visible}
      onCancel={onClose}
      footer={null}
      width={800}
      destroyOnHidden
    >
      {renderEligibilityStatus()}
      {renderBeneficiaryInfo()}
      {renderVehicleInfo()}

      <Steps current={currentStep} style={{ marginBottom: 24 }}>
        <Step title="Fuel Request" icon={<CarOutlined />} />
        <Step title="Travel Details" icon={<EnvironmentOutlined />} />
        <Step title="Review & Submit" icon={<CheckCircleOutlined />} />
      </Steps>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
      >
        {currentStep === 0 && renderStep1()}
        {currentStep === 1 && renderStep2()}
        {currentStep === 2 && renderStep3()}
        
        <Divider />
        
        <Row justify="space-between">
          <Col>
            {currentStep > 0 && (
              <Button onClick={prevStep}>
                Previous
              </Button>
            )}
          </Col>
          <Col>
            <Space>
              <Button onClick={onClose}>
                Cancel
              </Button>
              {currentStep < 2 ? (
                <Button type="primary" onClick={nextStep}>
                  Next
                </Button>
              ) : (
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  icon={<SendOutlined />}
                >
                  Submit Request
                </Button>
              )}
            </Space>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};

export default BeneficiaryFuelRequest;
