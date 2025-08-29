// src/components/LoginModal.tsx
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
  Checkbox,
  Space,
  notification,
} from 'antd';
import {
  UserOutlined,
  LockOutlined,
  LoginOutlined,
  EyeInvisibleOutlined,
  EyeTwoTone,
} from '@ant-design/icons';
import { useAuth } from '@/contexts/AuthContext';
import { loginUser } from '@/api/auth';
import { motion } from 'framer-motion';

const { Title, Text } = Typography;

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
  onSwitchToRegister?: () => void;
}

interface LoginForm {
  username: string;
  password: string;
  remember?: boolean;
}

const LoginModal: React.FC<LoginModalProps> = ({ open, onClose, onSwitchToRegister }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (values: LoginForm) => {
    setLoading(true);
    setError('');

    try {
      const response = await loginUser({
        username: values.username,
        password: values.password,
      });

      if (response && response.success && response.access && response.refresh) {
        // Store remember me preference
        if (values.remember) {
          localStorage.setItem('rememberMe', 'true');
          localStorage.setItem('savedUsername', values.username);
        } else {
          localStorage.removeItem('rememberMe');
          localStorage.removeItem('savedUsername');
        }

        await login(
          {
            access: response.access,
            refresh: response.refresh,
          },
          () => {
            onClose(); // Close modal first
            navigate('/dashboard', { replace: true });
          }
        );
      } else {
        setError('Invalid response from server');
      }
    } catch (err: any) {
      const errorMessage = 
        err.response?.data?.detail ||
        err.response?.data?.message ||
        err.message ||
        'Login failed. Please try again.';
      
      // Check if error is due to approval status
      const status = err.response?.data?.status;
      const reason = err.response?.data?.reason;
      
      if (status === 'pending') {
        setError('Your registration is pending approval. Please wait for an administrator to approve your account.');
      } else if (status === 'rejected') {
        setError(`Your registration has been rejected. ${reason ? `Reason: ${reason}` : ''}`);
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    setShowForgotPassword(true);
    setError('');
    
    notification.info({
      message: 'Password Reset',
      description: 'Please contact the system administrator to reset your password.',
      duration: 6,
      placement: 'topRight',
      style: {
        width: 400,
      },
    });
  };

  const handleCancel = () => {
    form.resetFields();
    setError('');
    setShowForgotPassword(false);
    onClose();
  };

  // Load saved username on modal open
  useEffect(() => {
    if (open) {
      const rememberMe = localStorage.getItem('rememberMe') === 'true';
      const savedUsername = localStorage.getItem('savedUsername');
      
      if (rememberMe && savedUsername) {
        form.setFieldsValue({
          username: savedUsername,
          remember: true
        });
      }
    }
  }, [open, form]);

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
            Sign In
          </Title>
          <Text type="secondary" className="text-lg">
            Access Parliament of Zimbabwe Fuel Coupon System
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
              message="Login Failed"
              description={error}
              type="error"
              showIcon
              closable
              onClose={() => setError('')}
              className="text-base"
            />
          </motion.div>
        )}

        {/* Login Form */}
        <div className="max-w-lg mx-auto">
          <Form
            form={form}
            name="loginModal"
            layout="vertical"
            onFinish={handleLogin}
            autoComplete="off"
            size="large"
            disabled={loading}
          >
            <Form.Item
              name="username"
              label={<span className="text-base font-medium">Username</span>}
              rules={[
                { required: true, message: 'Please enter your username' },
                { min: 3, message: 'Username must be at least 3 characters' },
              ]}
            >
              <Input
                prefix={<UserOutlined className="text-gray-400" />}
                placeholder="Enter your username"
                className="rounded-lg h-14 text-base"
              />
            </Form.Item>

            <Form.Item
              name="password"
              label={<span className="text-base font-medium">Password</span>}
              rules={[
                { required: true, message: 'Please enter your password' },
                { min: 6, message: 'Password must be at least 6 characters' },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined className="text-gray-400" />}
                placeholder="Enter your password"
                iconRender={(visible: boolean) =>
                  visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
                }
                className="rounded-lg h-14 text-base"
              />
            </Form.Item>
            
            <Form.Item>
              <div className="flex items-center justify-between">
                <Form.Item name="remember" valuePropName="checked" noStyle>
                  <Checkbox className="text-base">Remember me</Checkbox>
                </Form.Item>
                <Button 
                  type="link" 
                  className="p-0 text-blue-600 hover:text-blue-800 text-base"
                  onClick={handleForgotPassword}
                >
                  Forgot password?
                </Button>
              </div>
            </Form.Item>

            <Form.Item className="mb-6">
              <Button
                type="primary"
                htmlType="submit"
                icon={<LoginOutlined />}
                loading={loading}
                className="w-full h-14 rounded-lg font-semibold text-lg"
                style={{
                  background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
                  border: 'none',
                }}
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </Button>
            </Form.Item>
          </Form>

          <Divider>
            <Text type="secondary" className="text-base">or</Text>
          </Divider>

          <div className="text-center">
            <Text type="secondary" className="text-base">
              Need an account?{' '}
              <Button 
                type="link" 
                className="p-0 text-blue-600 hover:text-blue-800 font-medium text-base"
                onClick={() => {
                  handleCancel();
                  onSwitchToRegister?.();
                }}
              >
                Contact Administrator
              </Button>
            </Text>
          </div>
        </div>
      </motion.div>
    </Modal>
  );
};

export default LoginModal;
