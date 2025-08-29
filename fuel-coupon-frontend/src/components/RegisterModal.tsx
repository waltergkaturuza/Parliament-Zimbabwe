// src/components/RegisterModal.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Modal,
  Form,
  Input,
  Button,
  Typography,
  Alert,
  Divider,
  Select,
  Space,
  notification,
  Row,
  Col,
} from 'antd';
import {
  UserOutlined,
  LockOutlined,
  MailOutlined,
  PhoneOutlined,
  BankOutlined,
  IdcardOutlined,
  UserAddOutlined,
  EyeInvisibleOutlined,
  EyeTwoTone,
} from '@ant-design/icons';
import { motion } from 'framer-motion';

const { Title, Text } = Typography;
const { Option } = Select;

interface RegisterModalProps {
  open: boolean;
  onClose: () => void;
  onSwitchToLogin?: () => void;
}

interface RegisterForm {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  phone: string;
  nationalId: string;
  role: string;
  centerId?: string;
}

const RegisterModal: React.FC<RegisterModalProps> = ({ open, onClose, onSwitchToLogin }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const navigate = useNavigate();

  const handleRegister = async (values: RegisterForm) => {
    setLoading(true);
    setError('');

    try {
      // Here you would implement the actual registration API call
      // For now, we'll simulate the registration process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      notification.success({
        message: 'Registration Submitted',
        description: 'Your registration has been submitted for approval. You will be notified once approved.',
        duration: 6,
        placement: 'topRight',
      });
      
      handleCancel();
    } catch (err: any) {
      const errorMessage = 
        err.response?.data?.detail ||
        err.response?.data?.message ||
        err.message ||
        'Registration failed. Please try again.';
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setError('');
    setSelectedRole('');
    onClose();
  };

  const handleRoleChange = (value: string) => {
    setSelectedRole(value);
    // Clear center ID when role changes
    form.setFieldValue('centerId', undefined);
  };

  const roleOptions = [
    { value: 'BENEFICIARY', label: '🏛️ Parliament Member' },
    { value: 'SUB_CENTER', label: '🌍 Sub Center Manager' },
    { value: 'MAIN_CENTER', label: '🏢 Main Center Manager' },
  ];

  return (
    <Modal
      open={open}
      onCancel={handleCancel}
      footer={null}
      width={960}
      centered
      destroyOnClose
      className="login-modal"
      styles={{
        mask: {
          backdropFilter: 'blur(8px)',
          backgroundColor: 'rgba(0, 0, 0, 0.6)'
        }
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.3 }}
        className="p-12"
        style={{ 
          paddingLeft: '10mm', 
          paddingRight: '10mm', 
          paddingBottom: '10mm' 
        }}
      >
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-8">
            <img 
              src="/logo.webp" 
              alt="Parliament of Zimbabwe Logo" 
              style={{ 
                width: 'auto',
                height: '140px',
                objectFit: 'contain',
                filter: 'drop-shadow(0 4px 16px rgba(0,0,0,0.15))'
              }}
            />
          </div>
          <Title level={2} className="mb-4 text-gray-800">
            Register Account
          </Title>
          <Text type="secondary" className="text-lg">
            Join Parliament of Zimbabwe Fuel Coupon System
          </Text>
        </div>

        {/* Error Alert */}
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-8"
          >
            <Alert
              message="Registration Failed"
              description={error}
              type="error"
              showIcon
              closable
              onClose={() => setError('')}
              className="text-base"
            />
          </motion.div>
        )}

        {/* Registration Form */}
        <div className="max-w-3xl mx-auto">
          <Form
            form={form}
            name="registerModal"
            layout="vertical"
            onFinish={handleRegister}
            autoComplete="off"
            size="large"
            disabled={loading}
          >
            {/* Personal Information Row */}
            <Row gutter={16}>
              <Col xs={24} md={8}>
                <Form.Item
                  name="firstName"
                  label={<span className="text-base font-medium">First Name</span>}
                  rules={[
                    { required: true, message: 'Please enter your first name' },
                    { min: 2, message: 'First name must be at least 2 characters' },
                  ]}
                >
                  <Input
                    prefix={<UserOutlined className="text-gray-400" />}
                    placeholder="Enter your first name"
                    className="rounded-lg h-14 text-base"
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={8}>
                <Form.Item
                  name="lastName"
                  label={<span className="text-base font-medium">Last Name</span>}
                  rules={[
                    { required: true, message: 'Please enter your last name' },
                    { min: 2, message: 'Last name must be at least 2 characters' },
                  ]}
                >
                  <Input
                    prefix={<UserOutlined className="text-gray-400" />}
                    placeholder="Enter your last name"
                    className="rounded-lg h-14 text-base"
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={8}>
                <Form.Item
                  name="nationalId"
                  label={<span className="text-base font-medium">National ID</span>}
                  rules={[
                    { required: true, message: 'Please enter your national ID' },
                    { pattern: /^[0-9]{2}-[0-9]{6,7}[A-Z][0-9]{2}$/, message: 'Please enter a valid Zimbabwean National ID (e.g., 63-123456A23)' },
                  ]}
                >
                  <Input
                    prefix={<IdcardOutlined className="text-gray-400" />}
                    placeholder="e.g., 63-123456A23"
                    className="rounded-lg h-14 text-base"
                  />
                </Form.Item>
              </Col>
            </Row>

            {/* Contact Information Row */}
            <Row gutter={16}>
              <Col xs={24} md={8}>
                <Form.Item
                  name="email"
                  label={<span className="text-base font-medium">Email Address</span>}
                  rules={[
                    { required: true, message: 'Please enter your email' },
                    { type: 'email', message: 'Please enter a valid email address' },
                  ]}
                >
                  <Input
                    prefix={<MailOutlined className="text-gray-400" />}
                    placeholder="Enter your email address"
                    className="rounded-lg h-14 text-base"
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={8}>
                <Form.Item
                  name="phone"
                  label={<span className="text-base font-medium">Phone Number</span>}
                  rules={[
                    { required: true, message: 'Please enter your phone number' },
                    { pattern: /^[\+]?[0-9\s\-\(\)]+$/, message: 'Please enter a valid phone number' },
                  ]}
                >
                  <Input
                    prefix={<PhoneOutlined className="text-gray-400" />}
                    placeholder="Enter your phone number"
                    className="rounded-lg h-14 text-base"
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={8}>
                <Form.Item
                  name="username"
                  label={<span className="text-base font-medium">Username</span>}
                  rules={[
                    { required: true, message: 'Please enter a username' },
                    { min: 3, message: 'Username must be at least 3 characters' },
                    { pattern: /^[a-zA-Z0-9_]+$/, message: 'Username can only contain letters, numbers, and underscores' },
                  ]}
                >
                  <Input
                    prefix={<UserOutlined className="text-gray-400" />}
                    placeholder="Choose a username"
                    className="rounded-lg h-14 text-base"
                  />
                </Form.Item>
              </Col>
            </Row>

            {/* Role and Center Row */}
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="role"
                  label={<span className="text-base font-medium">Role</span>}
                  rules={[
                    { required: true, message: 'Please select your role' },
                  ]}
                >
                  <Select
                    placeholder="Select your role"
                    className="h-14"
                    onChange={handleRoleChange}
                  >
                    {roleOptions.map(option => (
                      <Option key={option.value} value={option.value}>
                        {option.label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>

              {(selectedRole === 'SUB_CENTER' || selectedRole === 'MAIN_CENTER') && (
                <Col xs={24} md={12}>
                  <Form.Item
                    name="centerId"
                    label={<span className="text-base font-medium">Center ID</span>}
                    rules={[
                      { required: true, message: 'Please enter your center ID' },
                    ]}
                  >
                    <Input
                      prefix={<BankOutlined className="text-gray-400" />}
                      placeholder="Enter your center ID"
                      className="rounded-lg h-14 text-base"
                    />
                  </Form.Item>
                </Col>
              )}
            </Row>

            {/* Password Row */}
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="password"
                  label={<span className="text-base font-medium">Password</span>}
                  rules={[
                    { required: true, message: 'Please enter a password' },
                    { min: 8, message: 'Password must be at least 8 characters' },
                    { pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, message: 'Password must contain at least one uppercase, one lowercase, and one number' },
                  ]}
                >
                  <Input.Password
                    prefix={<LockOutlined className="text-gray-400" />}
                    placeholder="Create a password"
                    iconRender={(visible: boolean) =>
                      visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
                    }
                    className="rounded-lg h-14 text-base"
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  name="confirmPassword"
                  label={<span className="text-base font-medium">Confirm Password</span>}
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
                    prefix={<LockOutlined className="text-gray-400" />}
                    placeholder="Confirm your password"
                    iconRender={(visible: boolean) =>
                      visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
                    }
                    className="rounded-lg h-14 text-base"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item className="mb-6 mt-6">
              <Button
                type="primary"
                htmlType="submit"
                icon={<UserAddOutlined />}
                loading={loading}
                className="w-full h-14 rounded-lg font-semibold text-lg"
                style={{
                  background: 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)',
                  border: 'none',
                }}
              >
                {loading ? 'Submitting Registration...' : 'Register Account'}
              </Button>
            </Form.Item>
          </Form>

          <Divider>
            <Text type="secondary" className="text-base">or</Text>
          </Divider>

          <div className="text-center">
            <Text type="secondary" className="text-base">
              Already have an account?{' '}
              <Button 
                type="link" 
                className="p-0 text-blue-600 hover:text-blue-800 font-medium text-base"
                onClick={() => {
                  handleCancel();
                  onSwitchToLogin?.();
                }}
              >
                Sign In
              </Button>
            </Text>
          </div>
        </div>
      </motion.div>
    </Modal>
  );
};

export default RegisterModal;
