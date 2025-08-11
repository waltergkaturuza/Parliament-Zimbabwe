// src/pages/membership/BeneficiaryFormsPage.tsx
// MASSIVE BENEFICIARY FORMS - Based on Harmonized System
import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  Button,
  Row,
  Col,
  Typography,
  Space,
  Divider,
  Alert,
  Upload,
  Switch,
  Radio,
  Checkbox,
  Steps,
  message,
  Tabs,
  Descriptions,
  Tag,
  Progress,
  Tooltip,
  Modal,
  Table,
} from 'antd';
import {
  UserOutlined,
  CarOutlined,
  PhoneOutlined,
  MailOutlined,
  HomeOutlined,
  BankOutlined,
  FileTextOutlined,
  SaveOutlined,
  CheckOutlined,
  EyeOutlined,
  PrinterOutlined,
  UploadOutlined,
  InboxOutlined,
  ClearOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { TabPane } = Tabs;
const { Step } = Steps;

interface HarmonizedBeneficiaryProfile {
  // Core Identity Fields (7)
  id?: number;
  parliamentary_id: string;
  employee_id?: string;
  category: number;
  constituency: number;
  position: string;
  parliamentary_role: string;

  // Contact Information Fields (6)
  mobile_phone: string;
  official_email: string;
  personal_email?: string;
  full_address: string;
  postal_address?: string;
  emergency_contact: string;

  // Vehicle Information Fields (6)
  vehicle_make: string;
  vehicle_model: string;
  vehicle_year: number;
  vehicle_registration: string;
  engine_capacity_cc: number;
  distance_from_parliament_km: number;

  // Allocation Profile Fields (6)
  base_allocation: number;
  monthly_entitlement_litres: number;
  current_balance: number;
  pending_allocations: number;
  session_bonus_eligible: boolean;
  special_allocation_notes?: string;

  // Usage Tracking Fields (5)
  used_this_month: number;
  year_to_date_usage: number;
  lifetime_usage: number;
  average_monthly_usage: number;
  last_transaction_date?: string;

  // Status & Control Fields (6)
  is_active: boolean;
  verification_status: string;
  verification_date?: string;
  suspension_reason?: string;
  notes?: string;
  approved_by?: number;
}

const BeneficiaryFormsPage: React.FC = () => {
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState('personal');
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [formData, setFormData] = useState<Partial<HarmonizedBeneficiaryProfile>>({});

  // Form validation and submission
  const handleFormSubmit = async (values: any) => {
    setLoading(true);
    try {
      console.log('Submitting Harmonized Beneficiary Profile:', values);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      message.success('Beneficiary profile created successfully!');
      setFormData(values);
      setPreviewMode(true);
    } catch (error) {
      message.error('Failed to create beneficiary profile');
      console.error('Submission error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFormReset = () => {
    form.resetFields();
    setFormData({});
    setCurrentStep(0);
    setActiveTab('personal');
    setPreviewMode(false);
  };

  const steps = [
    {
      title: 'Personal Info',
      description: 'Identity & Contact',
      icon: <UserOutlined />,
    },
    {
      title: 'Vehicle Details',
      description: 'Vehicle & Distance',
      icon: <CarOutlined />,
    },
    {
      title: 'Allocation Setup',
      description: 'Fuel Entitlements',
      icon: <BankOutlined />,
    },
    {
      title: 'Verification',
      description: 'Review & Submit',
      icon: <CheckOutlined />,
    },
  ];

  const constituencies = [
    'Harare Central', 'Harare North', 'Harare South', 'Harare East', 'Harare West',
    'Bulawayo Central', 'Bulawayo North', 'Bulawayo South', 'Bulawayo East',
    'Mutare Central', 'Mutare North', 'Mutare South', 'Gweru Central', 'Kwekwe Central'
  ];

  const categories = [
    { id: 1, name: 'Member of Parliament', code: 'MP' },
    { id: 2, name: 'Parliamentary Staff', code: 'STAFF' },
    { id: 3, name: 'Committee Member', code: 'COMMITTEE' },
    { id: 4, name: 'Parliamentary Service', code: 'SERVICE' },
  ];

  const vehicleMakes = [
    'Toyota', 'Ford', 'Nissan', 'Honda', 'Volkswagen', 'Mercedes-Benz', 
    'BMW', 'Audi', 'Mazda', 'Subaru', 'Isuzu', 'Mitsubishi'
  ];

  if (previewMode) {
    return (
      <Card title="📋 Beneficiary Profile Preview" extra={
        <Space>
          <Button icon={<PrinterOutlined />} onClick={() => window.print()}>
            Print Profile
          </Button>
          <Button icon={<ClearOutlined />} onClick={handleFormReset}>
            Create New
          </Button>
        </Space>
      }>
        <Descriptions bordered column={2} size="small">
          <Descriptions.Item label="Parliamentary ID">{formData.parliamentary_id}</Descriptions.Item>
          <Descriptions.Item label="Employee ID">{formData.employee_id || 'N/A'}</Descriptions.Item>
          <Descriptions.Item label="Position">{formData.position}</Descriptions.Item>
          <Descriptions.Item label="Parliamentary Role">{formData.parliamentary_role}</Descriptions.Item>
          <Descriptions.Item label="Mobile Phone">{formData.mobile_phone}</Descriptions.Item>
          <Descriptions.Item label="Official Email">{formData.official_email}</Descriptions.Item>
          <Descriptions.Item label="Vehicle Registration">{formData.vehicle_registration}</Descriptions.Item>
          <Descriptions.Item label="Engine Capacity">{formData.engine_capacity_cc} cc</Descriptions.Item>
          <Descriptions.Item label="Distance from Parliament">{formData.distance_from_parliament_km} km</Descriptions.Item>
          <Descriptions.Item label="Monthly Entitlement">{formData.monthly_entitlement_litres} L</Descriptions.Item>
        </Descriptions>
        
        <Alert
          style={{ marginTop: 16 }}
          message="Beneficiary Profile Created Successfully"
          description="The harmonized beneficiary profile has been created and is ready for system integration."
          type="success"
          showIcon
        />
      </Card>
    );
  }

  return (
    <Card 
      title="🏛️ Massive Beneficiary Registration Form - Harmonized System"
      extra={
        <Space>
          <Tag color="blue">Harmonized Model</Tag>
          <Tag color="green">40+ Fields</Tag>
          <Text type="secondary">Step {currentStep + 1} of {steps.length}</Text>
        </Space>
      }
    >
      <Steps current={currentStep} style={{ marginBottom: 24 }}>
        {steps.map((step, index) => (
          <Step
            key={index}
            title={step.title}
            description={step.description}
            icon={step.icon}
            onClick={() => setCurrentStep(index)}
          />
        ))}
      </Steps>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleFormSubmit}
        initialValues={{
          is_active: true,
          session_bonus_eligible: true,
          verification_status: 'PENDING',
        }}
      >
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          {/* PERSONAL INFORMATION TAB */}
          <TabPane tab={<span><UserOutlined />Personal Info</span>} key="personal">
            <Card size="small" title="Core Identity Information" style={{ marginBottom: 16 }}>
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item
                    label="Parliamentary ID"
                    name="parliamentary_id"
                    rules={[{ required: true, message: 'Parliamentary ID is required' }]}
                  >
                    <Input placeholder="e.g., MP-2025-001" prefix={<UserOutlined />} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label="Employee ID"
                    name="employee_id"
                  >
                    <Input placeholder="Legacy employee ID (optional)" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label="Category"
                    name="category"
                    rules={[{ required: true, message: 'Category is required' }]}
                  >
                    <Select placeholder="Select beneficiary category">
                      {categories.map(cat => (
                        <Option key={cat.id} value={cat.id}>{cat.name}</Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item
                    label="Constituency"
                    name="constituency"
                    rules={[{ required: true, message: 'Constituency is required' }]}
                  >
                    <Select placeholder="Select constituency" showSearch>
                      {constituencies.map((const, index) => (
                        <Option key={index} value={index + 1}>{const}</Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label="Position"
                    name="position"
                    rules={[{ required: true, message: 'Position is required' }]}
                  >
                    <Input placeholder="e.g., Member of Parliament" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label="Parliamentary Role"
                    name="parliamentary_role"
                    rules={[{ required: true, message: 'Parliamentary role is required' }]}
                  >
                    <Select placeholder="Select parliamentary role">
                      <Option value="MP">Member of Parliament</Option>
                      <Option value="CHAIRPERSON">Committee Chairperson</Option>
                      <Option value="DEPUTY_CHAIRPERSON">Deputy Chairperson</Option>
                      <Option value="SECRETARY">Committee Secretary</Option>
                      <Option value="MEMBER">Committee Member</Option>
                      <Option value="STAFF">Parliamentary Staff</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            <Card size="small" title="Contact Information" style={{ marginBottom: 16 }}>
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item
                    label="Mobile Phone"
                    name="mobile_phone"
                    rules={[{ required: true, message: 'Mobile phone is required' }]}
                  >
                    <Input placeholder="+263 77 123 4567" prefix={<PhoneOutlined />} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label="Official Email"
                    name="official_email"
                    rules={[
                      { required: true, message: 'Official email is required' },
                      { type: 'email', message: 'Invalid email format' }
                    ]}
                  >
                    <Input placeholder="official@parliament.gov.zw" prefix={<MailOutlined />} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label="Personal Email"
                    name="personal_email"
                    rules={[{ type: 'email', message: 'Invalid email format' }]}
                  >
                    <Input placeholder="personal@example.com" prefix={<MailOutlined />} />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="Full Address"
                    name="full_address"
                    rules={[{ required: true, message: 'Full address is required' }]}
                  >
                    <TextArea rows={3} placeholder="Complete residential address" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Postal Address"
                    name="postal_address"
                  >
                    <TextArea rows={3} placeholder="Postal/mailing address (optional)" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="Emergency Contact"
                    name="emergency_contact"
                    rules={[{ required: true, message: 'Emergency contact is required' }]}
                  >
                    <Input placeholder="Emergency contact person and phone" />
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          </TabPane>

          {/* VEHICLE INFORMATION TAB */}
          <TabPane tab={<span><CarOutlined />Vehicle Details</span>} key="vehicle">
            <Card size="small" title="Vehicle Information" style={{ marginBottom: 16 }}>
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item
                    label="Vehicle Make"
                    name="vehicle_make"
                    rules={[{ required: true, message: 'Vehicle make is required' }]}
                  >
                    <Select placeholder="Select vehicle make" showSearch>
                      {vehicleMakes.map(make => (
                        <Option key={make} value={make}>{make}</Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label="Vehicle Model"
                    name="vehicle_model"
                    rules={[{ required: true, message: 'Vehicle model is required' }]}
                  >
                    <Input placeholder="e.g., Corolla, Ranger, Altima" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label="Vehicle Year"
                    name="vehicle_year"
                    rules={[{ required: true, message: 'Vehicle year is required' }]}
                  >
                    <InputNumber
                      min={1990}
                      max={new Date().getFullYear() + 1}
                      placeholder="e.g., 2020"
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item
                    label="Vehicle Registration"
                    name="vehicle_registration"
                    rules={[{ required: true, message: 'Vehicle registration is required' }]}
                  >
                    <Input placeholder="e.g., ABC-1234" style={{ textTransform: 'uppercase' }} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label="Engine Capacity (cc)"
                    name="engine_capacity_cc"
                    rules={[{ required: true, message: 'Engine capacity is required' }]}
                  >
                    <InputNumber
                      min={800}
                      max={8000}
                      placeholder="e.g., 1800"
                      style={{ width: '100%' }}
                      addonAfter="cc"
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label="Distance from Parliament (km)"
                    name="distance_from_parliament_km"
                    rules={[{ required: true, message: 'Distance is required for allocation calculation' }]}
                  >
                    <InputNumber
                      min={0}
                      max={1000}
                      precision={1}
                      placeholder="e.g., 15.5"
                      style={{ width: '100%' }}
                      addonAfter="km"
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          </TabPane>

          {/* ALLOCATION SETUP TAB */}
          <TabPane tab={<span><BankOutlined />Allocation Setup</span>} key="allocation">
            <Card size="small" title="Fuel Allocation Profile" style={{ marginBottom: 16 }}>
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item
                    label="Base Allocation (Litres)"
                    name="base_allocation"
                    rules={[{ required: true, message: 'Base allocation is required' }]}
                  >
                    <InputNumber
                      min={0}
                      max={1000}
                      precision={2}
                      placeholder="e.g., 200.00"
                      style={{ width: '100%' }}
                      addonAfter="L"
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label="Monthly Entitlement (Litres)"
                    name="monthly_entitlement_litres"
                    rules={[{ required: true, message: 'Monthly entitlement is required' }]}
                  >
                    <InputNumber
                      min={0}
                      max={2000}
                      precision={2}
                      placeholder="e.g., 300.00"
                      style={{ width: '100%' }}
                      addonAfter="L"
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label="Current Balance (Litres)"
                    name="current_balance"
                  >
                    <InputNumber
                      min={0}
                      precision={2}
                      placeholder="Current available balance"
                      style={{ width: '100%' }}
                      addonAfter="L"
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="Session Bonus Eligible"
                    name="session_bonus_eligible"
                    valuePropName="checked"
                  >
                    <Switch checkedChildren="Yes" unCheckedChildren="No" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Special Allocation Notes"
                    name="special_allocation_notes"
                  >
                    <TextArea rows={2} placeholder="Any special allocation considerations..." />
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            <Card size="small" title="Status & Control" style={{ marginBottom: 16 }}>
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item
                    label="Active Status"
                    name="is_active"
                    valuePropName="checked"
                  >
                    <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label="Verification Status"
                    name="verification_status"
                  >
                    <Select placeholder="Select verification status">
                      <Option value="PENDING">Pending Verification</Option>
                      <Option value="VERIFIED">Verified</Option>
                      <Option value="REJECTED">Rejected</Option>
                      <Option value="REQUIRES_UPDATE">Requires Update</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label="Verification Date"
                    name="verification_date"
                  >
                    <DatePicker style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={24}>
                  <Form.Item
                    label="Notes"
                    name="notes"
                  >
                    <TextArea rows={3} placeholder="Additional notes or comments..." />
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          </TabPane>

          {/* VERIFICATION TAB */}
          <TabPane tab={<span><CheckOutlined />Verification</span>} key="verification">
            <Card size="small" title="Form Verification & Review">
              <Alert
                message="Review Harmonized Beneficiary Profile"
                description="Please review all information before submitting. This will create a comprehensive beneficiary profile with 40+ fields for complete parliamentary fuel management."
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />
              
              <Progress 
                percent={85} 
                status="active" 
                strokeColor={{ from: '#108ee9', to: '#87d068' }}
                style={{ marginBottom: 16 }}
              />

              <Descriptions title="Profile Summary" bordered column={1} size="small">
                <Descriptions.Item label="Form Completion">
                  <Tag color="blue">Harmonized Model Ready</Tag>
                  <Tag color="green">40+ Fields Configured</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Integration Status">
                  <Tag color="purple">Frontend Compatible</Tag>
                  <Tag color="orange">API Ready</Tag>
                  <Tag color="cyan">Database Optimized</Tag>
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </TabPane>
        </Tabs>

        <Divider />
        
        <Row justify="space-between">
          <Col>
            <Space>
              <Button icon={<ClearOutlined />} onClick={handleFormReset}>
                Reset Form
              </Button>
              <Button icon={<EyeOutlined />} onClick={() => setPreviewMode(true)}>
                Preview Profile
              </Button>
            </Space>
          </Col>
          <Col>
            <Space>
              {currentStep > 0 && (
                <Button onClick={() => setCurrentStep(currentStep - 1)}>
                  Previous
                </Button>
              )}
              {currentStep < steps.length - 1 && (
                <Button type="primary" onClick={() => setCurrentStep(currentStep + 1)}>
                  Next
                </Button>
              )}
              {currentStep === steps.length - 1 && (
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  loading={loading}
                  icon={<SaveOutlined />}
                >
                  Create Harmonized Profile
                </Button>
              )}
            </Space>
          </Col>
        </Row>
      </Form>
    </Card>
  );
};

export default BeneficiaryFormsPage;
