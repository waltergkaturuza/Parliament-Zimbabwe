// src/pages/membership/BeneficiaryFormsPage.tsx
import React, { useState } from 'react';
import {
  Card,
  Form,
  Input,
  Select,
  Button,
  Row,
  Col,
  Typography,
  Space,
  Divider,
  DatePicker,
  InputNumber,
  Upload,
  message,
  Steps,
  Tag,
  Alert,
  Badge,
  Avatar,
  Tabs,
} from 'antd';
import {
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
  HomeOutlined,
  CarOutlined,
  IdcardOutlined,
  SaveOutlined,
  PlusOutlined,
  UploadOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
  FormOutlined,
} from '@ant-design/icons';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { TabPane } = Tabs;
const { Step } = Steps;

interface BeneficiaryFormData {
  // Personal Information
  firstName: string;
  lastName: string;
  title: string;
  email: string;
  phone: string;
  nationalId: string;
  dateOfBirth: string;
  address: string;
  
  // Parliament Information
  category: string;
  customCategory?: string;
  position: string;
  department: string;
  constituency?: string;
  party?: string;
  employeeId: string;
  officeLocation: string;
  
  // Vehicle Information
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: number;
  engineSize: string;
  registrationNumber: string;
  fuelType: string;
  
  // Allocation Information
  monthlyEntitlement: number;
  baseAllocation: number;
  categoryMultiplier: number;
  engineMultiplier: number;
}

const BeneficiaryFormsPage: React.FC = () => {
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<BeneficiaryFormData>>({});
  const [activeTab, setActiveTab] = useState('new-form');
  const { user } = useAuth();

  const beneficiaryCategories = [
    { value: 'MP', label: 'Member of Parliament (MP)', multiplier: 1.5, color: 'blue' },
    { value: 'SENATOR', label: 'Senator', multiplier: 1.4, color: 'green' },
    { value: 'GOVERNOR', label: 'Governor', multiplier: 1.8, color: 'purple' },
    { value: 'PRESIDENT', label: 'President', multiplier: 2.0, color: 'gold' },
    { value: 'STAFF', label: 'Parliament Staff', multiplier: 1.0, color: 'default' },
    { value: 'DRIVER', label: 'Official Driver', multiplier: 1.2, color: 'orange' },
    { value: 'CONSULTANT', label: 'Consultant', multiplier: 0.8, color: 'cyan' },
    { value: 'OTHER', label: 'Other (Specify)', multiplier: 1.0, color: 'default' },
  ];

  const fuelTypes = [
    { value: 'DIESEL', label: 'Diesel' },
    { value: 'PETROL', label: 'Petrol' },
  ];

  const constituencies = [
    'Harare East', 'Harare West', 'Harare North', 'Harare South',
    'Bulawayo Central', 'Bulawayo North', 'Bulawayo South',
    'Mutare North', 'Mutare South', 'Marondera',
  ];

  const politicalParties = [
    'ZANU-PF', 'MDC Alliance', 'MDC-T', 'CCC', 'NPP', 'Independent'
  ];

  const steps = [
    {
      title: 'Personal Info',
      description: 'Basic personal details',
      icon: <UserOutlined />,
    },
    {
      title: 'Parliament Info',
      description: 'Position and category',
      icon: <IdcardOutlined />,
    },
    {
      title: 'Vehicle Info',
      description: 'Vehicle details',
      icon: <CarOutlined />,
    },
    {
      title: 'Review',
      description: 'Review and submit',
      icon: <CheckCircleOutlined />,
    },
  ];

  const calculateAllocation = (category: string, engineSize: string, baseAllocation = 200) => {
    const categoryData = beneficiaryCategories.find(c => c.value === category);
    const categoryMultiplier = categoryData ? categoryData.multiplier : 1.0;
    
    // Engine size multiplier calculation
    let engineMultiplier = 1.0;
    if (engineSize) {
      const size = parseFloat(engineSize.replace(/[^\d.]/g, ''));
      if (size >= 3.0) engineMultiplier = 1.3;
      else if (size >= 2.5) engineMultiplier = 1.2;
      else if (size >= 2.0) engineMultiplier = 1.1;
    }
    
    return Math.round(baseAllocation * categoryMultiplier * engineMultiplier);
  };

  const handleNext = () => {
    form.validateFields().then(() => {
      setCurrentStep(currentStep + 1);
    }).catch(() => {
      message.error('Please fill in all required fields');
    });
  };

  const handlePrev = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async (values: BeneficiaryFormData) => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Calculate final allocation
      const finalAllocation = calculateAllocation(
        values.category, 
        values.engineSize, 
        values.baseAllocation || 200
      );
      
      message.success(`Beneficiary form submitted successfully! Monthly allocation: ${finalAllocation}L`);
      form.resetFields();
      setCurrentStep(0);
      setActiveTab('pending-forms');
    } catch (error) {
      message.error('Failed to submit form');
    } finally {
      setLoading(false);
    }
  };

  const renderPersonalInfoStep = () => (
    <Row gutter={[16, 16]}>
      <Col xs={24} md={12}>
        <Form.Item
          name="title"
          label="Title"
          rules={[{ required: true, message: 'Please select title' }]}
        >
          <Select placeholder="Select title">
            <Option value="Hon.">Hon.</Option>
            <Option value="Dr.">Dr.</Option>
            <Option value="Prof.">Prof.</Option>
            <Option value="Mr.">Mr.</Option>
            <Option value="Mrs.">Mrs.</Option>
            <Option value="Ms.">Ms.</Option>
          </Select>
        </Form.Item>
      </Col>
      <Col xs={24} md={12}>
        <Form.Item
          name="firstName"
          label="First Name"
          rules={[{ required: true, message: 'Please enter first name' }]}
        >
          <Input prefix={<UserOutlined />} placeholder="Enter first name" />
        </Form.Item>
      </Col>
      <Col xs={24} md={12}>
        <Form.Item
          name="lastName"
          label="Last Name"
          rules={[{ required: true, message: 'Please enter last name' }]}
        >
          <Input prefix={<UserOutlined />} placeholder="Enter last name" />
        </Form.Item>
      </Col>
      <Col xs={24} md={12}>
        <Form.Item
          name="nationalId"
          label="National ID"
          rules={[{ required: true, message: 'Please enter national ID' }]}
        >
          <Input prefix={<IdcardOutlined />} placeholder="Enter national ID" />
        </Form.Item>
      </Col>
      <Col xs={24} md={12}>
        <Form.Item
          name="email"
          label="Email"
          rules={[
            { required: true, message: 'Please enter email' },
            { type: 'email', message: 'Please enter valid email' }
          ]}
        >
          <Input prefix={<MailOutlined />} placeholder="Enter email address" />
        </Form.Item>
      </Col>
      <Col xs={24} md={12}>
        <Form.Item
          name="phone"
          label="Phone Number"
          rules={[{ required: true, message: 'Please enter phone number' }]}
        >
          <Input prefix={<PhoneOutlined />} placeholder="Enter phone number" />
        </Form.Item>
      </Col>
      <Col xs={24} md={12}>
        <Form.Item
          name="dateOfBirth"
          label="Date of Birth"
          rules={[{ required: true, message: 'Please select date of birth' }]}
        >
          <DatePicker style={{ width: '100%' }} placeholder="Select date of birth" />
        </Form.Item>
      </Col>
      <Col xs={24}>
        <Form.Item
          name="address"
          label="Address"
          rules={[{ required: true, message: 'Please enter address' }]}
        >
          <TextArea rows={3} placeholder="Enter full address" />
        </Form.Item>
      </Col>
    </Row>
  );

  const renderParliamentInfoStep = () => (
    <Row gutter={[16, 16]}>
      <Col xs={24} md={12}>
        <Form.Item
          name="category"
          label="Category"
          rules={[{ required: true, message: 'Please select category' }]}
        >
          <Select 
            placeholder="Select beneficiary category"
            onChange={(value) => {
              const category = beneficiaryCategories.find(c => c.value === value);
              if (category) {
                form.setFieldsValue({ categoryMultiplier: category.multiplier });
              }
            }}
          >
            {beneficiaryCategories.map(category => (
              <Option key={category.value} value={category.value}>
                <Space>
                  <Tag color={category.color}>{category.label}</Tag>
                  <Badge count={`${category.multiplier}x`} color="blue" />
                </Space>
              </Option>
            ))}
          </Select>
        </Form.Item>
      </Col>
      
      <Col xs={24} md={12}>
        <Form.Item noStyle shouldUpdate={(prevValues, currentValues) => prevValues.category !== currentValues.category}>
          {({ getFieldValue }) => (
            getFieldValue('category') === 'OTHER' ? (
              <Form.Item
                name="customCategory"
                label="Custom Category"
                rules={[{ required: true, message: 'Please specify category' }]}
              >
                <Input placeholder="Specify custom category" />
              </Form.Item>
            ) : (
              <div style={{ height: '32px' }} />
            )
          )}
        </Form.Item>
      </Col>

      <Col xs={24} md={12}>
        <Form.Item
          name="position"
          label="Position"
          rules={[{ required: true, message: 'Please enter position' }]}
        >
          <Input placeholder="Enter position/job title" />
        </Form.Item>
      </Col>
      <Col xs={24} md={12}>
        <Form.Item
          name="department"
          label="Department"
          rules={[{ required: true, message: 'Please enter department' }]}
        >
          <Input placeholder="Enter department" />
        </Form.Item>
      </Col>
      <Col xs={24} md={12}>
        <Form.Item name="constituency" label="Constituency">
          <Select placeholder="Select constituency (if applicable)" allowClear>
            {constituencies.map(constituency => (
              <Option key={constituency} value={constituency}>{constituency}</Option>
            ))}
          </Select>
        </Form.Item>
      </Col>
      <Col xs={24} md={12}>
        <Form.Item name="party" label="Political Party">
          <Select placeholder="Select political party (if applicable)" allowClear>
            {politicalParties.map(party => (
              <Option key={party} value={party}>{party}</Option>
            ))}
          </Select>
        </Form.Item>
      </Col>
      <Col xs={24} md={12}>
        <Form.Item
          name="employeeId"
          label="Employee ID"
          rules={[{ required: true, message: 'Please enter employee ID' }]}
        >
          <Input placeholder="Enter employee ID" />
        </Form.Item>
      </Col>
      <Col xs={24} md={12}>
        <Form.Item name="officeLocation" label="Office Location">
          <Input placeholder="Enter office location/room number" />
        </Form.Item>
      </Col>
    </Row>
  );

  const renderVehicleInfoStep = () => (
    <Row gutter={[16, 16]}>
      <Col xs={24} md={12}>
        <Form.Item
          name="vehicleMake"
          label="Vehicle Make"
          rules={[{ required: true, message: 'Please enter vehicle make' }]}
        >
          <Input prefix={<CarOutlined />} placeholder="e.g., Toyota, Mercedes" />
        </Form.Item>
      </Col>
      <Col xs={24} md={12}>
        <Form.Item
          name="vehicleModel"
          label="Vehicle Model"
          rules={[{ required: true, message: 'Please enter vehicle model' }]}
        >
          <Input placeholder="e.g., Prado, C-Class" />
        </Form.Item>
      </Col>
      <Col xs={24} md={12}>
        <Form.Item
          name="vehicleYear"
          label="Year of Manufacture"
          rules={[{ required: true, message: 'Please enter year' }]}
        >
          <InputNumber
            min={1990}
            max={new Date().getFullYear()}
            style={{ width: '100%' }}
            placeholder="Enter year"
          />
        </Form.Item>
      </Col>
      <Col xs={24} md={12}>
        <Form.Item
          name="engineSize"
          label="Engine Size"
          rules={[{ required: true, message: 'Please enter engine size' }]}
        >
          <Input 
            placeholder="e.g., 2.0L, 3.0L V6" 
            onChange={(e) => {
              const category = form.getFieldValue('category');
              if (category) {
                const allocation = calculateAllocation(category, e.target.value);
                form.setFieldsValue({ monthlyEntitlement: allocation });
              }
            }}
          />
        </Form.Item>
      </Col>
      <Col xs={24} md={12}>
        <Form.Item
          name="registrationNumber"
          label="Registration Number"
          rules={[{ required: true, message: 'Please enter registration number' }]}
        >
          <Input placeholder="Enter vehicle registration" />
        </Form.Item>
      </Col>
      <Col xs={24} md={12}>
        <Form.Item
          name="fuelType"
          label="Fuel Type"
          rules={[{ required: true, message: 'Please select fuel type' }]}
        >
          <Select placeholder="Select fuel type">
            {fuelTypes.map(fuel => (
              <Option key={fuel.value} value={fuel.value}>{fuel.label}</Option>
            ))}
          </Select>
        </Form.Item>
      </Col>
      
      <Col xs={24}>
        <Alert
          message="Allocation Preview"
          description={
            <Form.Item noStyle shouldUpdate>
              {({ getFieldValue }) => {
                const category = getFieldValue('category');
                const engineSize = getFieldValue('engineSize');
                if (category && engineSize) {
                  const allocation = calculateAllocation(category, engineSize);
                  return `Estimated monthly allocation: ${allocation} litres`;
                }
                return 'Fill in category and engine size to see allocation preview';
              }}
            </Form.Item>
          }
          type="info"
          showIcon
        />
      </Col>
    </Row>
  );

  const renderReviewStep = () => (
    <Form.Item noStyle shouldUpdate>
      {({ getFieldsValue }) => {
        const values = getFieldsValue();
        return (
          <Card>
            <Title level={4}>Review Beneficiary Information</Title>
            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <Card size="small" title="Personal Information">
                  <p><strong>Name:</strong> {values.title} {values.firstName} {values.lastName}</p>
                  <p><strong>National ID:</strong> {values.nationalId}</p>
                  <p><strong>Email:</strong> {values.email}</p>
                  <p><strong>Phone:</strong> {values.phone}</p>
                </Card>
              </Col>
              <Col xs={24} md={12}>
                <Card size="small" title="Parliament Information">
                  <p><strong>Category:</strong> {values.category}</p>
                  <p><strong>Position:</strong> {values.position}</p>
                  <p><strong>Department:</strong> {values.department}</p>
                  <p><strong>Employee ID:</strong> {values.employeeId}</p>
                </Card>
              </Col>
              <Col xs={24} md={12}>
                <Card size="small" title="Vehicle Information">
                  <p><strong>Vehicle:</strong> {values.vehicleMake} {values.vehicleModel} ({values.vehicleYear})</p>
                  <p><strong>Engine Size:</strong> {values.engineSize}</p>
                  <p><strong>Registration:</strong> {values.registrationNumber}</p>
                  <p><strong>Fuel Type:</strong> {values.fuelType}</p>
                </Card>
              </Col>
              <Col xs={24} md={12}>
                <Card size="small" title="Allocation Summary">
                  <p><strong>Monthly Allocation:</strong> {calculateAllocation(values.category, values.engineSize)}L</p>
                  <p><strong>Processed By:</strong> {user?.username}</p>
                  <p><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
                </Card>
              </Col>
            </Row>
          </Card>
        );
      }}
    </Form.Item>
  );

  const renderPendingForms = () => (
    <div className="space-y-4">
      <Alert
        message="Pending Forms"
        description="Forms submitted but awaiting approval"
        type="warning"
        showIcon
      />
      {/* This would be populated with actual pending forms from API */}
      <Card>
        <Text type="secondary">No pending forms at the moment</Text>
      </Card>
    </div>
  );

  const renderApprovedForms = () => (
    <div className="space-y-4">
      <Alert
        message="Approved Forms"
        description="Successfully processed beneficiary registrations"
        type="success"
        showIcon
      />
      {/* This would be populated with actual approved forms from API */}
      <Card>
        <Text type="secondary">No approved forms to display</Text>
      </Card>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <Title level={2}>
              <FormOutlined className="mr-2" />
              Beneficiary Forms Management
            </Title>
            <Text type="secondary">
              Manage beneficiary registration forms and membership applications
            </Text>
          </div>

          <Tabs activeKey={activeTab} onChange={setActiveTab}>
            <TabPane tab="New Beneficiary Form" key="new-form">
              <Card>
                <Steps current={currentStep} className="mb-8">
                  {steps.map((step, index) => (
                    <Step
                      key={index}
                      title={step.title}
                      description={step.description}
                      icon={step.icon}
                    />
                  ))}
                </Steps>

                <Form
                  form={form}
                  layout="vertical"
                  onFinish={handleSubmit}
                  initialValues={{
                    baseAllocation: 200,
                    categoryMultiplier: 1.0,
                    engineMultiplier: 1.0,
                  }}
                >
                  {currentStep === 0 && renderPersonalInfoStep()}
                  {currentStep === 1 && renderParliamentInfoStep()}
                  {currentStep === 2 && renderVehicleInfoStep()}
                  {currentStep === 3 && renderReviewStep()}

                  <Divider />

                  <div className="flex justify-between">
                    <Button
                      disabled={currentStep === 0}
                      onClick={handlePrev}
                    >
                      Previous
                    </Button>
                    <Space>
                      {currentStep < steps.length - 1 && (
                        <Button type="primary" onClick={handleNext}>
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
                          Submit Form
                        </Button>
                      )}
                    </Space>
                  </div>
                </Form>
              </Card>
            </TabPane>

            <TabPane tab="Pending Forms" key="pending-forms">
              {renderPendingForms()}
            </TabPane>

            <TabPane tab="Approved Forms" key="approved-forms">
              {renderApprovedForms()}
            </TabPane>
          </Tabs>
        </div>
      </div>
    </motion.div>
  );
};

export default BeneficiaryFormsPage;
