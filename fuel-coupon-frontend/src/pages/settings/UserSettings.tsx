// src/pages/settings/UserSettings.tsx
import { useState } from 'react';
import {
  Card,
  Row,
  Col,
  Form,
  Input,
  Button,
  Upload,
  Avatar,
  Select,
  Switch,
  Divider,
  Typography,
  Space,
  Alert,
  Modal,
  List,
  Badge,
  Tag,
  Progress,
  Statistic,
  Timeline,
  Table,
  Tooltip,
  message,
  Tabs,
} from 'antd';
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  LockOutlined,
  CameraOutlined,
  EditOutlined,
  SaveOutlined,
  BellOutlined,
  SecurityScanOutlined,
  SettingOutlined,
  EyeOutlined,
  DeleteOutlined,
  DownloadOutlined,
  UploadOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  MobileOutlined,
  DesktopOutlined,
  GlobalOutlined,
} from '@ant-design/icons';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { TextArea } = Input;
const { Password } = Input;

interface UserProfile {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  avatar?: string;
  role: string;
  department: string;
  joinDate: string;
  lastLogin: string;
  isActive: boolean;
  bio?: string;
}

interface SecuritySession {
  id: string;
  device: string;
  location: string;
  ipAddress: string;
  loginTime: string;
  isCurrentSession: boolean;
  browser: string;
  os: string;
}

interface NotificationSetting {
  id: string;
  type: string;
  label: string;
  description: string;
  enabled: boolean;
  methods: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
}

const UserSettings = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();

  // Mock data - replace with actual API calls
  const [profile, setProfile] = useState<UserProfile>({
    id: user?.id?.toString() || '1',
    username: user?.username || 'testuser',
    email: user?.email || 'test@test.com',
    firstName: 'John',
    lastName: 'Doe',
    phoneNumber: '+263 777 123 456',
    avatar: undefined,
    role: user?.role || 'ADMIN',
    department: 'Fuel Management',
    joinDate: '2024-01-15',
    lastLogin: new Date().toISOString(),
    isActive: true,
    bio: 'Experienced fuel management administrator with expertise in parliamentary operations.',
  });

  const [securitySessions] = useState<SecuritySession[]>([
    {
      id: '1',
      device: 'Windows PC',
      location: 'Harare, Zimbabwe',
      ipAddress: '192.168.1.100',
      loginTime: new Date().toISOString(),
      isCurrentSession: true,
      browser: 'Chrome 120',
      os: 'Windows 11',
    },
    {
      id: '2',
      device: 'Mobile Device',
      location: 'Harare, Zimbabwe',
      ipAddress: '192.168.1.105',
      loginTime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      isCurrentSession: false,
      browser: 'Safari Mobile',
      os: 'iOS 17',
    },
  ]);

  const [notificationSettings, setNotificationSettings] = useState<NotificationSetting[]>([
    {
      id: '1',
      type: 'fuel_allocation',
      label: 'Fuel Allocations',
      description: 'Notifications about new fuel allocations and approvals',
      enabled: true,
      methods: { email: true, push: true, sms: false },
    },
    {
      id: '2',
      type: 'system_alerts',
      label: 'System Alerts',
      description: 'Important system maintenance and security alerts',
      enabled: true,
      methods: { email: true, push: true, sms: true },
    },
    {
      id: '3',
      type: 'reports',
      label: 'Reports',
      description: 'Weekly and monthly fuel consumption reports',
      enabled: false,
      methods: { email: true, push: false, sms: false },
    },
  ]);

  const handleProfileUpdate = async (values: any) => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setProfile({ ...profile, ...values });
      setIsEditing(false);
      message.success('Profile updated successfully');
    } catch (error) {
      message.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (values: any) => {
    if (values.newPassword !== values.confirmPassword) {
      message.error('New passwords do not match');
      return;
    }

    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      message.success('Password changed successfully');
      passwordForm.resetFields();
    } catch (error) {
      message.error('Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationToggle = (settingId: string, field: string, value: boolean) => {
    setNotificationSettings(prev => 
      prev.map(setting => 
        setting.id === settingId 
          ? { ...setting, [field]: value }
          : setting
      )
    );
  };

  const handleSessionTerminate = (sessionId: string) => {
    Modal.confirm({
      title: 'Terminate Session',
      content: 'Are you sure you want to terminate this session?',
      onOk: () => {
        message.success('Session terminated successfully');
      },
    });
  };

  const securityColumns = [
    {
      title: 'Device & Browser',
      key: 'device',
      render: (record: SecuritySession) => (
        <div className="flex items-center gap-3">
          <div className="text-2xl">
            {record.device.includes('Mobile') ? <MobileOutlined /> : <DesktopOutlined />}
          </div>
          <div>
            <div className="font-medium">{record.device}</div>
            <Text type="secondary">{record.browser} on {record.os}</Text>
          </div>
        </div>
      ),
    },
    {
      title: 'Location',
      key: 'location',
      render: (record: SecuritySession) => (
        <div>
          <div className="flex items-center gap-2">
            <GlobalOutlined />
            <span>{record.location}</span>
          </div>
          <Text type="secondary">{record.ipAddress}</Text>
        </div>
      ),
    },
    {
      title: 'Login Time',
      dataIndex: 'loginTime',
      key: 'loginTime',
      render: (time: string) => (
        <div>
          <div>{format(new Date(time), 'MMM dd, yyyy')}</div>
          <Text type="secondary">{format(new Date(time), 'HH:mm')}</Text>
        </div>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      render: (record: SecuritySession) => (
        <div>
          {record.isCurrentSession ? (
            <Tag color="green" icon={<CheckCircleOutlined />}>
              Current Session
            </Tag>
          ) : (
            <Tag color="default">
              Inactive
            </Tag>
          )}
        </div>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: SecuritySession) => (
        <Space size="small">
          {!record.isCurrentSession && (
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleSessionTerminate(record.id)}
            >
              Terminate
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Title level={2}>Settings</Title>
          <Text type="secondary">
            Manage your account settings and preferences
          </Text>
        </div>
        <Space>
          <Button icon={<DownloadOutlined />}>Export Data</Button>
          <Button icon={<UploadOutlined />}>Import Settings</Button>
        </Space>
      </div>

      <Tabs activeKey={activeTab} onChange={setActiveTab} type="card">
        {/* Profile Tab */}
        <TabPane tab="Profile" key="profile">
          <Row gutter={[24, 24]}>
            <Col xs={24} lg={8}>
              <Card>
                <div className="text-center space-y-4">
                  <div className="relative inline-block">
                    <Avatar
                      size={120}
                      src={profile.avatar}
                      icon={<UserOutlined />}
                    />
                    <Button
                      type="primary"
                      shape="circle"
                      icon={<CameraOutlined />}
                      size="small"
                      className="absolute bottom-0 right-0"
                    />
                  </div>
                  <div>
                    <Title level={4} className="mb-0">
                      {profile.firstName} {profile.lastName}
                    </Title>
                    <Text type="secondary">@{profile.username}</Text>
                  </div>
                  <div className="space-y-2">
                    <Tag color="blue">{profile.role}</Tag>
                    <div className="text-sm text-gray-600">{profile.department}</div>
                  </div>
                  <Divider />
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-lg font-semibold">2.5k</div>
                      <Text type="secondary">Coupons Managed</Text>
                    </div>
                    <div>
                      <div className="text-lg font-semibold">98%</div>
                      <Text type="secondary">Efficiency Rate</Text>
                    </div>
                  </div>
                </div>
              </Card>
            </Col>

            <Col xs={24} lg={16}>
              <Card
                title="Personal Information"
                extra={
                  <Button
                    type={isEditing ? 'primary' : 'default'}
                    icon={isEditing ? <SaveOutlined /> : <EditOutlined />}
                    onClick={() => {
                      if (isEditing) {
                        form.submit();
                      } else {
                        setIsEditing(true);
                        form.setFieldsValue(profile);
                      }
                    }}
                    loading={loading}
                  >
                    {isEditing ? 'Save Changes' : 'Edit Profile'}
                  </Button>
                }
              >
                <Form
                  form={form}
                  layout="vertical"
                  onFinish={handleProfileUpdate}
                  disabled={!isEditing}
                >
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        name="firstName"
                        label="First Name"
                        rules={[{ required: true, message: 'Please enter your first name' }]}
                      >
                        <Input prefix={<UserOutlined />} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="lastName"
                        label="Last Name"
                        rules={[{ required: true, message: 'Please enter your last name' }]}
                      >
                        <Input prefix={<UserOutlined />} />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        name="email"
                        label="Email Address"
                        rules={[
                          { required: true, message: 'Please enter your email' },
                          { type: 'email', message: 'Please enter a valid email' },
                        ]}
                      >
                        <Input prefix={<MailOutlined />} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="phoneNumber"
                        label="Phone Number"
                        rules={[{ required: true, message: 'Please enter your phone number' }]}
                      >
                        <Input prefix={<PhoneOutlined />} />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Form.Item
                    name="bio"
                    label="Bio"
                  >
                    <TextArea rows={4} placeholder="Tell us about yourself..." />
                  </Form.Item>

                  {!isEditing && (
                    <div className="space-y-4">
                      <Divider />
                      <Row gutter={16}>
                        <Col span={12}>
                          <div>
                            <Text type="secondary">Member Since</Text>
                            <div className="font-medium">
                              {format(new Date(profile.joinDate), 'MMMM dd, yyyy')}
                            </div>
                          </div>
                        </Col>
                        <Col span={12}>
                          <div>
                            <Text type="secondary">Last Login</Text>
                            <div className="font-medium">
                              {format(new Date(profile.lastLogin), 'MMM dd, yyyy HH:mm')}
                            </div>
                          </div>
                        </Col>
                      </Row>
                    </div>
                  )}
                </Form>
              </Card>
            </Col>
          </Row>
        </TabPane>

        {/* Security Tab */}
        <TabPane tab="Security" key="security">
          <div className="space-y-6">
            {/* Password Change */}
            <Card title="Change Password">
              <Form
                form={passwordForm}
                layout="vertical"
                onFinish={handlePasswordChange}
                className="max-w-md"
              >
                <Form.Item
                  name="currentPassword"
                  label="Current Password"
                  rules={[{ required: true, message: 'Please enter your current password' }]}
                >
                  <Password prefix={<LockOutlined />} />
                </Form.Item>
                <Form.Item
                  name="newPassword"
                  label="New Password"
                  rules={[
                    { required: true, message: 'Please enter a new password' },
                    { min: 8, message: 'Password must be at least 8 characters' },
                  ]}
                >
                  <Password prefix={<LockOutlined />} />
                </Form.Item>
                <Form.Item
                  name="confirmPassword"
                  label="Confirm New Password"
                  rules={[{ required: true, message: 'Please confirm your new password' }]}
                >
                  <Password prefix={<LockOutlined />} />
                </Form.Item>
                <Form.Item>
                  <Button type="primary" htmlType="submit" loading={loading}>
                    Update Password
                  </Button>
                </Form.Item>
              </Form>
            </Card>

            {/* Two-Factor Authentication */}
            <Card title="Two-Factor Authentication">
              <div className="space-y-4">
                <Alert
                  message="Two-Factor Authentication"
                  description="Add an extra layer of security to your account by enabling 2FA."
                  type="info"
                  showIcon
                />
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Authenticator App</div>
                    <Text type="secondary">Use an authenticator app to generate codes</Text>
                  </div>
                  <Switch disabled />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">SMS Authentication</div>
                    <Text type="secondary">Receive codes via SMS</Text>
                  </div>
                  <Switch disabled />
                </div>
              </div>
            </Card>

            {/* Active Sessions */}
            <Card title="Active Sessions">
              <div className="mb-4">
                <Alert
                  message="Security Notice"
                  description="If you notice any suspicious activity, terminate the session immediately and change your password."
                  type="warning"
                  showIcon
                />
              </div>
              <Table
                columns={securityColumns}
                dataSource={securitySessions}
                pagination={false}
                rowKey="id"
              />
            </Card>
          </div>
        </TabPane>

        {/* Notifications Tab */}
        <TabPane tab="Notifications" key="notifications">
          <Card title="Notification Preferences">
            <div className="space-y-6">
              {notificationSettings.map((setting) => (
                <div key={setting.id} className="border-b border-gray-200 pb-4 last:border-b-0">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="font-medium">{setting.label}</div>
                      <Text type="secondary">{setting.description}</Text>
                    </div>
                    <Switch
                      checked={setting.enabled}
                      onChange={(checked) => handleNotificationToggle(setting.id, 'enabled', checked)}
                    />
                  </div>
                  
                  {setting.enabled && (
                    <div className="ml-4 space-y-2">
                      <Text type="secondary" className="text-sm">Delivery Methods:</Text>
                      <div className="flex gap-4">
                        <div className="flex items-center gap-2">
                          <Switch
                            size="small"
                            checked={setting.methods.email}
                            onChange={(checked) => {
                              const newSettings = notificationSettings.map(s => 
                                s.id === setting.id 
                                  ? { ...s, methods: { ...s.methods, email: checked } }
                                  : s
                              );
                              setNotificationSettings(newSettings);
                            }}
                          />
                          <span className="text-sm">Email</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            size="small"
                            checked={setting.methods.push}
                            onChange={(checked) => {
                              const newSettings = notificationSettings.map(s => 
                                s.id === setting.id 
                                  ? { ...s, methods: { ...s.methods, push: checked } }
                                  : s
                              );
                              setNotificationSettings(newSettings);
                            }}
                          />
                          <span className="text-sm">Push</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            size="small"
                            checked={setting.methods.sms}
                            onChange={(checked) => {
                              const newSettings = notificationSettings.map(s => 
                                s.id === setting.id 
                                  ? { ...s, methods: { ...s.methods, sms: checked } }
                                  : s
                              );
                              setNotificationSettings(newSettings);
                            }}
                          />
                          <span className="text-sm">SMS</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              
              <div className="pt-4">
                <Button type="primary" icon={<SaveOutlined />}>
                  Save Notification Settings
                </Button>
              </div>
            </div>
          </Card>
        </TabPane>

        {/* System Tab */}
        <TabPane tab="System" key="system">
          <div className="space-y-6">
            {/* Account Status */}
            <Card title="Account Status">
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={8}>
                  <Statistic
                    title="Account Status"
                    value="Active"
                    valueStyle={{ color: '#52c41a' }}
                    prefix={<CheckCircleOutlined />}
                  />
                </Col>
                <Col xs={24} sm={8}>
                  <Statistic
                    title="Login Sessions"
                    value={securitySessions.length}
                    prefix={<SecurityScanOutlined />}
                  />
                </Col>
                <Col xs={24} sm={8}>
                  <Statistic
                    title="Data Usage"
                    value={87}
                    suffix="MB"
                    prefix={<DownloadOutlined />}
                  />
                </Col>
              </Row>
            </Card>

            {/* Data Export */}
            <Card title="Data Management">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Export Account Data</div>
                    <Text type="secondary">Download a copy of your account data</Text>
                  </div>
                  <Button icon={<DownloadOutlined />}>Export Data</Button>
                </div>
                <Divider />
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-red-600">Delete Account</div>
                    <Text type="secondary">Permanently delete your account and all data</Text>
                  </div>
                  <Button danger icon={<DeleteOutlined />}>Delete Account</Button>
                </div>
              </div>
            </Card>

            {/* System Information */}
            <Card title="System Information">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Text type="secondary">Browser:</Text>
                  <div>Chrome 120.0.0</div>
                </div>
                <div>
                  <Text type="secondary">Operating System:</Text>
                  <div>Windows 11</div>
                </div>
                <div>
                  <Text type="secondary">Screen Resolution:</Text>
                  <div>1920 x 1080</div>
                </div>
                <div>
                  <Text type="secondary">Timezone:</Text>
                  <div>CAT (UTC+2)</div>
                </div>
              </div>
            </Card>
          </div>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default UserSettings;
