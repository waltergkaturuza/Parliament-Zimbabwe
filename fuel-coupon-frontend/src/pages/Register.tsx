// src/pages/Register.tsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Form,
  Input,
  Button,
  Card,
  Typography,
  Row,
  Col,
  Select,
  message,
  Steps,
  Result,
  Alert,
  Space,
  Divider,
  Avatar
} from 'antd';
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  LockOutlined,
  SafetyCertificateOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  BankOutlined
} from '@ant-design/icons';
import { motion } from 'framer-motion';
import ParliamentLogo from '@/components/ParliamentLogo';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface RegisterFormData {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  password: string;
  confirm_password: string;
  role: string;
  department?: string;
  employee_id?: string;
  justification?: string;
}

const Register = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [formValues, setFormValues] = useState<RegisterFormData>({} as RegisterFormData);
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const navigate = useNavigate();

  const steps = [
    {
      title: 'Personal Information',
      description: 'Basic details',
      icon: <UserOutlined />
    },
    {
      title: 'Account Security',
      description: 'Login credentials',
      icon: <LockOutlined />
    },
    {
      title: 'Role & Justification',
      description: 'Access requirements',
      icon: <SafetyCertificateOutlined />
    },
    {
      title: 'Review & Submit',
      description: 'Final confirmation',
      icon: <CheckCircleOutlined />
    }
  ];

  const handleSubmit = async (values: RegisterFormData) => {
    if (values.password !== values.confirm_password) {
      message.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      // Prepare registration data for backend
      const registrationData = {
        username: values.username,
        email: values.email,
        first_name: values.first_name,
        last_name: values.last_name,
        phone: values.phone,
        password: values.password,
        password2: values.confirm_password,
        role: values.role,
        sub_center: values.department, // Map department to sub_center if needed
        registration_justification: values.justification
      };

      console.log('Registration data:', registrationData);
      
      // Call the registration API
      const response = await fetch('/api/v1/auth/register/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registrationData),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Registration successful:', result);
        setRegistrationComplete(true);
        message.success('Registration submitted successfully! Your account is pending approval.');
      } else {
        const errorData = await response.json();
        console.error('Registration failed:', errorData);
        
        // Handle specific field errors
        if (errorData.username) {
          message.error(`Username: ${errorData.username[0]}`);
        } else if (errorData.email) {
          message.error(`Email: ${errorData.email[0]}`);
        } else if (errorData.password) {
          message.error(`Password: ${errorData.password[0]}`);
        } else {
          message.error('Registration failed. Please check your information and try again.');
        }
      }
    } catch (error) {
      console.error('Registration error:', error);
      message.error('Registration failed. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    form.validateFields().then(() => {
      setCurrentStep(currentStep + 1);
    }).catch(() => {
      message.error('Please fill in all required fields');
    });
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const onValuesChange = (changedValues: any, allValues: RegisterFormData) => {
    setFormValues(allValues);
  };

  if (registrationComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-2xl"
        >
          <Card className="shadow-xl border-0">
            <Result
              status="success"
              title="Registration Submitted Successfully!"
              subTitle="Your registration has been submitted for approval. You will receive an email notification once your account is reviewed and approved by our administrators."
              extra={[
                <Button type="primary" key="login" onClick={() => navigate('/login')}>
                  Go to Login
                </Button>,
                <Button key="home" onClick={() => navigate('/')}>
                  Back to Home
                </Button>,
              ]}
            />
            <Alert
              message="What happens next?"
              description="Your registration will be reviewed by system administrators. You will receive an email notification once your account is approved."
              type="info"
              showIcon
              className="mt-4"
            />
          </Card>
        </motion.div>
      </div>
    );
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-4">
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="first_name"
                  label="First Name"
                  rules={[{ required: true, message: 'Please enter your first name' }]}
                >
                  <Input 
                    prefix={<UserOutlined />}
                    placeholder="Enter your first name"
                    size="large"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="last_name"
                  label="Last Name"
                  rules={[{ required: true, message: 'Please enter your last name' }]}
                >
                  <Input 
                    prefix={<UserOutlined />}
                    placeholder="Enter your last name"
                    size="large"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="email"
              label="Email Address"
              rules={[
                { required: true, message: 'Please enter your email' },
                { type: 'email', message: 'Please enter a valid email' }
              ]}
            >
              <Input 
                prefix={<MailOutlined />}
                placeholder="Enter your email address"
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="phone"
              label="Phone Number"
              rules={[{ required: true, message: 'Please enter your phone number' }]}
            >
              <Input 
                prefix={<PhoneOutlined />}
                placeholder="Enter your phone number"
                size="large"
              />
            </Form.Item>
          </div>
        );

      case 1:
        return (
          <div className="space-y-4">
            <Form.Item
              name="username"
              label="Username"
              rules={[
                { required: true, message: 'Please enter a username' },
                { min: 3, message: 'Username must be at least 3 characters' }
              ]}
            >
              <Input 
                prefix={<UserOutlined />}
                placeholder="Choose a username"
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="password"
              label="Password"
              rules={[
                { required: true, message: 'Please enter a password' },
                { min: 8, message: 'Password must be at least 8 characters' }
              ]}
            >
              <Input.Password 
                prefix={<LockOutlined />}
                placeholder="Enter your password"
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="confirm_password"
              label="Confirm Password"
              dependencies={['password']}
              rules={[
                { required: true, message: 'Please confirm your password' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('Passwords do not match'));
                  },
                }),
              ]}
            >
              <Input.Password 
                prefix={<LockOutlined />}
                placeholder="Confirm your password"
                size="large"
              />
            </Form.Item>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <Form.Item
              name="role"
              label="Requested Role"
              rules={[{ required: true, message: 'Please select a role' }]}
            >
              <Select placeholder="Select your role" size="large">
                <Option value="BENEFICIARY">Beneficiary</Option>
                <Option value="SUB_CENTER">Sub Center Officer</Option>
                <Option value="MAIN_CENTER">Main Center Officer</Option>
                <Option value="AUDITOR">Auditor</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="department"
              label="Department/Sub Center (if applicable)"
            >
              <Input 
                placeholder="Enter your department or sub center"
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="employee_id"
              label="Employee ID (if applicable)"
            >
              <Input 
                placeholder="Enter your employee ID"
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="justification"
              label="Justification for Access"
              rules={[{ required: true, message: 'Please provide justification' }]}
            >
              <TextArea
                rows={4}
                placeholder="Please provide a detailed justification for why you need access to this system..."
                maxLength={500}
                showCount
              />
            </Form.Item>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <Alert
              message="Review Your Information"
              description="Please review all the information below before submitting your registration."
              type="info"
              showIcon
              className="mb-6"
            />
            
            <div className="bg-gray-50 p-6 rounded-lg space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Text strong>Full Name:</Text>
                  <br />
                  <Text>{formValues.first_name} {formValues.last_name}</Text>
                </div>
                <div>
                  <Text strong>Username:</Text>
                  <br />
                  <Text>{formValues.username}</Text>
                </div>
                <div>
                  <Text strong>Email:</Text>
                  <br />
                  <Text>{formValues.email}</Text>
                </div>
                <div>
                  <Text strong>Phone:</Text>
                  <br />
                  <Text>{formValues.phone}</Text>
                </div>
                <div>
                  <Text strong>Role:</Text>
                  <br />
                  <Text>{formValues.role}</Text>
                </div>
                <div>
                  <Text strong>Department:</Text>
                  <br />
                  <Text>{formValues.department || 'Not specified'}</Text>
                </div>
              </div>
              
              <div>
                <Text strong>Justification:</Text>
                <br />
                <Text>{formValues.justification}</Text>
              </div>
            </div>

            <Alert
              message="Important Notice"
              description="Your registration will be reviewed by system administrators. You will receive an email notification once your account is approved."
              type="warning"
              showIcon
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50 flex items-center justify-center p-4 relative">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-4xl"
      >
        <Card className="shadow-xl border-0">
          {/* Header */}
          <div className="text-center mb-8">
            {/* Parliament Logo */}
            <div className="flex justify-center mb-6">
              <img 
                src="/logo.webp" 
                alt="Parliament of Zimbabwe Logo" 
                style={{ 
                  width: 'auto',
                  height: '160px', // Make it bigger
                  objectFit: 'contain', // Maintain natural oval/egg shape
                  filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.2))'
                }}
              />
            </div>
            
            <div>
              <Title level={2} className="mb-0">Register for Access</Title>
              <Text type="secondary">Parliament of Zimbabwe Fuel Coupon System</Text>
            </div>
          </div>

          {/* Steps */}
          <Steps 
            current={currentStep} 
            className="mb-8"
            items={steps}
          />

          {/* Form */}
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            onValuesChange={onValuesChange}
            className="max-w-2xl mx-auto"
          >
            {renderStepContent()}

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center mt-8 pt-6 border-t">
              <div>
                {currentStep > 0 && (
                  <Button size="large" onClick={prevStep}>
                    Previous
                  </Button>
                )}
              </div>
              
              <div className="flex gap-3">
                {currentStep < steps.length - 1 ? (
                  <Button type="primary" size="large" onClick={nextStep}>
                    Next
                  </Button>
                ) : (
                  <Button 
                    type="primary" 
                    size="large" 
                    htmlType="submit"
                    loading={loading}
                    icon={<CheckCircleOutlined />}
                  >
                    Submit Registration
                  </Button>
                )}
              </div>
            </div>
          </Form>

          <Divider />

          <div className="text-center">
            <Text type="secondary">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-600 hover:text-blue-800">
                Sign in here
              </Link>
            </Text>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default Register;
