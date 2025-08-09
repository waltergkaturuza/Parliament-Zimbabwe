// src/pages/auth/Login.tsx
import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Form,
  Input,
  Button,
  Card,
  Typography,
  Alert,
  Space,
  Divider,
  Checkbox,
  Row,
  Col,
  Spin,
} from 'antd';
import {
  UserOutlined,
  LockOutlined,
  LoginOutlined,
  EyeInvisibleOutlined,
  EyeTwoTone,
  SafetyOutlined,
  CarOutlined,
} from '@ant-design/icons';
import { useAuth } from '@/contexts/AuthContext';
import { loginUser } from '@/api/auth';
import { motion } from 'framer-motion';

const { Title, Text } = Typography;

interface LoginForm {
  username: string;
  password: string;
  remember?: boolean;
}

const Login = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  useEffect(() => {
    if (isAuthenticated) {
      // Always redirect to /dashboard to trigger role-based routing
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = async (values: LoginForm) => {
    setLoading(true);
    setError('');

    try {
      const response = await loginUser({
        username: values.username,
        password: values.password,
      });

      if (response && response.success && response.access && response.refresh) {
        await login(
          {
            access: response.access,
            refresh: response.refresh,
          },
          () => {
            // Always redirect to /dashboard to trigger role-based routing
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50 flex flex-col">
      {/* Header with Logo */}
      <div className="absolute top-4 right-4 z-10">
        <img 
          src="/logo.webp" 
          alt="Parliament Logo" 
          className="h-12 w-auto"
          style={{ maxHeight: '48px' }}
        />
      </div>
      
      <div className="flex-1 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-6xl"
        >
        <Row gutter={[32, 32]} align="middle" className="min-h-[600px]">
          {/* Left Panel - Branding */}
          <Col xs={24} lg={12} className="text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-center lg:justify-start gap-4 mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg">
                  <CarOutlined className="text-white text-2xl" />
                </div>
                <div>
                  <Title level={2} className="mb-0 text-gray-800">
                    Parliament of Zimbabwe
                  </Title>
                  <Text type="secondary" className="text-base">
                    Fuel Coupon Management System
                  </Text>
                </div>
              </div>

              <div className="space-y-6">
                <div className="text-center lg:text-left">
                  <Title level={2} className="text-gray-800 mb-4">
                    Fuel Coupon Management
                  </Title>
                  <Text className="text-lg text-gray-600">
                    Secure access to Parliament of Zimbabwe's fuel distribution system.
                  </Text>
                </div>

                <div className="mt-8 p-6 bg-white rounded-xl shadow-md border border-gray-100">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <SafetyOutlined className="text-blue-600 text-xl" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800">Secure & Efficient</div>
                      <Text type="secondary" className="text-sm">
                        Advanced tracking and role-based access control
                      </Text>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </Col>

          {/* Right Panel - Login Form */}
          <Col xs={24} lg={12}>
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Card className="shadow-2xl border-0 rounded-2xl overflow-hidden">
                <div className="p-8">
                  <div className="text-center mb-8">
                    <Title level={3} className="mb-2">
                      Sign In
                    </Title>
                    <Text type="secondary">
                      Enter your credentials to access your account
                    </Text>
                  </div>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="mb-6"
                    >
                      <Alert
                        message="Login Failed"
                        description={error}
                        type="error"
                        showIcon
                        closable
                        onClose={() => setError('')}
                      />
                    </motion.div>
                  )}

                  <Form
                    form={form}
                    name="login"
                    layout="vertical"
                    onFinish={handleLogin}
                    autoComplete="off"
                    size="large"
                    disabled={loading}
                  >
                    <Form.Item
                      name="username"
                      label="Username"
                      rules={[
                        { required: true, message: 'Please enter your username' },
                        { min: 3, message: 'Username must be at least 3 characters' },
                      ]}
                    >
                      <Input
                        prefix={<UserOutlined className="text-gray-400" />}
                        placeholder="Enter your username"
                        className="rounded-lg"
                      />
                    </Form.Item>

                    <Form.Item
                      name="password"
                      label="Password"
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
                        className="rounded-lg"
                      />
                    </Form.Item>

                    <Form.Item>
                      <div className="flex items-center justify-between">
                        <Form.Item name="remember" valuePropName="checked" noStyle>
                          <Checkbox>Remember me</Checkbox>
                        </Form.Item>
                        <Link to="/forgot-password" className="text-blue-600 hover:text-blue-800">
                          Forgot password?
                        </Link>
                      </div>
                    </Form.Item>

                    <Form.Item className="mb-0">
                      <Button
                        type="primary"
                        htmlType="submit"
                        icon={<LoginOutlined />}
                        loading={loading}
                        className="w-full h-12 rounded-lg font-semibold text-lg"
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
                    <Text type="secondary">or</Text>
                  </Divider>

                  <div className="text-center">
                    <Text type="secondary">
                      Need an account?{' '}
                      <Link to="/register" className="text-blue-600 hover:text-blue-800 font-medium">
                        Contact Administrator
                      </Link>
                    </Text>
                  </div>
                </div>
              </Card>
            </motion.div>
          </Col>
        </Row>
        </motion.div>
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-2xl shadow-2xl text-center">
            <Spin size="large" />
            <div className="mt-4 text-lg font-medium">Signing you in...</div>
            <Text type="secondary">Please wait while we verify your credentials</Text>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
