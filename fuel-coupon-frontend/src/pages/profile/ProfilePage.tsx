// src/pages/profile/ProfilePage.tsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  Row,
  Col,
  Form,
  Input,
  Button,
  message,
  Typography,
  Space,
  Avatar,
  Tabs,
  Switch,
  Select,
  Divider,
  Alert,
  Upload,
  Tag,
  Descriptions,
  Modal
} from 'antd';
import {
  UserOutlined,
  EditOutlined,
  SafetyCertificateOutlined,
  BellOutlined,
  LockOutlined,
  CameraOutlined,
  PhoneOutlined,
  MailOutlined,
  EnvironmentOutlined,
  SaveOutlined,
  LoadingOutlined
} from '@ant-design/icons';
import { motion } from 'framer-motion';
import { userProfileService } from '@/services/userProfileService';
import { useAuth } from '@/contexts/AuthContext';
import apiClient from '@/api';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface NotificationSettings {
  email_alerts: boolean;
  sms_alerts: boolean;
  system_notifications: boolean;
  fuel_price_updates: boolean;
  dispatch_notifications: boolean;
  low_stock_alerts: boolean;
}

const ProfilePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [notificationForm] = Form.useForm();
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch user profile
  const { data: profile, isLoading } = useQuery({
    queryKey: ['user-profile'],
    queryFn: userProfileService.getCurrentProfile,
    enabled: !!user
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: userProfileService.updateProfile,
    onSuccess: () => {
      message.success('Profile updated successfully');
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
    },
    onError: (error: any) => {
      message.error(`Failed to update profile: ${error.message}`);
    }
  });

  // Update password mutation
  const updatePasswordMutation = useMutation({
    mutationFn: async (data: { current_password: string; new_password: string }) => {
      const response = await apiClient.post('/auth/change-password/', data);
      return response.data;
    },
    onSuccess: () => {
      message.success('Password changed successfully');
      passwordForm.resetFields();
    },
    onError: (error: any) => {
      message.error(`Failed to change password: ${error.response?.data?.message || error.message}`);
    }
  });

  // Update notification preferences mutation
  const updateNotificationsMutation = useMutation({
    mutationFn: userProfileService.updateNotificationPreferences,
    onSuccess: () => {
      message.success('Notification preferences updated');
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
    },
    onError: (error: any) => {
      message.error(`Failed to update preferences: ${error.message}`);
    }
  });

  // Upload profile picture mutation
  const uploadPictureMutation = useMutation({
    mutationFn: userProfileService.uploadProfilePicture,
    onSuccess: () => {
      message.success('Profile picture updated successfully');
      setUploading(false);
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
    },
    onError: (error: any) => {
      message.error(`Failed to upload picture: ${error.message}`);
      setUploading(false);
    }
  });

  const handleProfileSubmit = (values: any) => {
    updateProfileMutation.mutate(values);
  };

  const handlePasswordSubmit = (values: any) => {
    if (values.new_password !== values.confirm_password) {
      message.error('New passwords do not match');
      return;
    }
    updatePasswordMutation.mutate({
      current_password: values.current_password,
      new_password: values.new_password
    });
  };

  const handleNotificationSubmit = (values: NotificationSettings) => {
    updateNotificationsMutation.mutate(values);
  };

  const handleAvatarUpload = (file: File) => {
    setUploading(true);
    uploadPictureMutation.mutate(file);
    return false; // Prevent default upload
  };

  const getRoleColor = (role: string) => {
    const colors = {
      'SUPER_ADMIN': '#f5222d',
      'ADMIN': '#fa8c16',
      'MAIN_CENTER': '#1890ff',
      'SUB_CENTER': '#52c41a',
      'MAIN_CENTER_APPROVER': '#13c2c2',
      'SUB_CENTER_APPROVER': '#eb2f96',
      'AUDITOR': '#722ed1',
      'BENEFICIARY': '#fadb14'
    };
    return colors[role as keyof typeof colors] || '#666';
  };

  if (isLoading || !profile) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <LoadingOutlined style={{ fontSize: 24 }} spin />
        <div style={{ marginTop: 16 }}>Loading profile...</div>
      </div>
    );
  }

  const ProfileContent = () => (
    <Form
      form={profileForm}
      layout="vertical"
      onFinish={handleProfileSubmit}
      initialValues={profile}
      disabled={!isEditing}
    >
      <Row gutter={[24, 24]}>
        <Col xs={24} md={8}>
          <Card>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <Avatar
                  size={120}
                  src={profile.profile_picture}
                  icon={<UserOutlined />}
                  style={{ border: '4px solid #f0f0f0' }}
                />
                {isEditing && (
                  <Upload
                    accept="image/*"
                    showUploadList={false}
                    beforeUpload={handleAvatarUpload}
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      right: 0
                    }}
                  >
                    <Button
                      shape="circle"
                      icon={uploading ? <LoadingOutlined /> : <CameraOutlined />}
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        right: 0,
                        zIndex: 1
                      }}
                      loading={uploading}
                    />
                  </Upload>
                )}
              </div>
              <div style={{ marginTop: 16 }}>
                <Title level={4} style={{ margin: 0 }}>
                  {profile.first_name} {profile.last_name}
                </Title>
                <Text type="secondary">@{profile.username}</Text>
                <div style={{ marginTop: 8 }}>
                  <Tag color={getRoleColor(profile.role)}>{profile.role}</Tag>
                  {profile.is_approved && (
                    <Tag color="green">
                      <SafetyCertificateOutlined /> Approved
                    </Tag>
                  )}
                </div>
              </div>
            </div>

            <Descriptions column={1} size="small">
              <Descriptions.Item label="Member Since">
                {new Date(profile.date_joined).toLocaleDateString()}
              </Descriptions.Item>
              <Descriptions.Item label="Last Login">
                {profile.last_login ? new Date(profile.last_login).toLocaleDateString() : 'Never'}
              </Descriptions.Item>
              {profile.sub_center && (
                <Descriptions.Item label="Sub Center">
                  {profile.sub_center.name}
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>
        </Col>

        <Col xs={24} md={16}>
          <Card
            title="Profile Information"
            extra={
              <Button
                type={isEditing ? 'primary' : 'default'}
                icon={isEditing ? <SaveOutlined /> : <EditOutlined />}
                onClick={() => {
                  if (isEditing) {
                    profileForm.submit();
                  } else {
                    setIsEditing(true);
                  }
                }}
                loading={updateProfileMutation.isPending}
              >
                {isEditing ? 'Save Changes' : 'Edit Profile'}
              </Button>
            }
          >
            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <Form.Item
                  label="First Name"
                  name="first_name"
                  rules={[{ required: true, message: 'Please enter your first name' }]}
                >
                  <Input prefix={<UserOutlined />} />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  label="Last Name"
                  name="last_name"
                  rules={[{ required: true, message: 'Please enter your last name' }]}
                >
                  <Input prefix={<UserOutlined />} />
                </Form.Item>
              </Col>
              <Col xs={24}>
                <Form.Item
                  label="Email"
                  name="email"
                  rules={[
                    { required: true, message: 'Please enter your email' },
                    { type: 'email', message: 'Please enter a valid email' }
                  ]}
                >
                  <Input prefix={<MailOutlined />} />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item label="Phone Number" name="phone">
                  <Input prefix={<PhoneOutlined />} />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item label="Department" name="department">
                  <Input />
                </Form.Item>
              </Col>
              <Col xs={24}>
                <Form.Item label="Address" name="address">
                  <TextArea rows={3} prefix={<EnvironmentOutlined />} />
                </Form.Item>
              </Col>
              <Col xs={24}>
                <Form.Item label="Bio" name="bio">
                  <TextArea rows={4} placeholder="Tell us about yourself..." />
                </Form.Item>
              </Col>
            </Row>

            {isEditing && (
              <>
                <Divider />
                <Space>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={updateProfileMutation.isPending}
                    icon={<SaveOutlined />}
                  >
                    Save Changes
                  </Button>
                  <Button
                    onClick={() => {
                      setIsEditing(false);
                      profileForm.resetFields();
                    }}
                  >
                    Cancel
                  </Button>
                </Space>
              </>
            )}
          </Card>
        </Col>
      </Row>
    </Form>
  );

  const SecurityContent = () => (
    <Row gutter={[24, 24]}>
      <Col xs={24} md={12}>
        <Card title="Change Password" extra={<LockOutlined />}>
          <Form
            form={passwordForm}
            layout="vertical"
            onFinish={handlePasswordSubmit}
          >
            <Form.Item
              label="Current Password"
              name="current_password"
              rules={[{ required: true, message: 'Please enter your current password' }]}
            >
              <Input.Password />
            </Form.Item>
            <Form.Item
              label="New Password"
              name="new_password"
              rules={[
                { required: true, message: 'Please enter a new password' },
                { min: 8, message: 'Password must be at least 8 characters' }
              ]}
            >
              <Input.Password />
            </Form.Item>
            <Form.Item
              label="Confirm New Password"
              name="confirm_password"
              rules={[{ required: true, message: 'Please confirm your new password' }]}
            >
              <Input.Password />
            </Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={updatePasswordMutation.isPending}
              block
            >
              Change Password
            </Button>
          </Form>
        </Card>
      </Col>
      <Col xs={24} md={12}>
        <Card title="Security Settings">
          <Alert
            message="Two-Factor Authentication"
            description="Enable 2FA for enhanced security (Coming Soon)"
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
          <Alert
            message="Login Activity"
            description="Monitor your account for suspicious activity"
            type="warning"
            showIcon
          />
        </Card>
      </Col>
    </Row>
  );

  const NotificationContent = () => (
    <Card title="Notification Preferences" extra={<BellOutlined />}>
      <Form
        form={notificationForm}
        layout="vertical"
        onFinish={handleNotificationSubmit}
        initialValues={profile.notification_preferences || {}}
      >
        <Row gutter={[24, 24]}>
          <Col xs={24} md={12}>
            <Title level={5}>General Notifications</Title>
            <Form.Item name="email_alerts" valuePropName="checked">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Email Alerts</span>
                <Switch />
              </div>
            </Form.Item>
            <Form.Item name="sms_alerts" valuePropName="checked">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>SMS Alerts</span>
                <Switch />
              </div>
            </Form.Item>
            <Form.Item name="system_notifications" valuePropName="checked">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>System Notifications</span>
                <Switch />
              </div>
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Title level={5}>Fuel System Alerts</Title>
            <Form.Item name="fuel_price_updates" valuePropName="checked">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Fuel Price Updates</span>
                <Switch />
              </div>
            </Form.Item>
            <Form.Item name="dispatch_notifications" valuePropName="checked">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Dispatch Notifications</span>
                <Switch />
              </div>
            </Form.Item>
            <Form.Item name="low_stock_alerts" valuePropName="checked">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Low Stock Alerts</span>
                <Switch />
              </div>
            </Form.Item>
          </Col>
        </Row>
        <Divider />
        <Button
          type="primary"
          htmlType="submit"
          loading={updateNotificationsMutation.isPending}
          icon={<SaveOutlined />}
        >
          Save Notification Preferences
        </Button>
      </Form>
    </Card>
  );

  const tabItems = [
    {
      key: 'profile',
      label: (
        <span>
          <UserOutlined />
          Profile
        </span>
      ),
      children: <ProfileContent />
    },
    {
      key: 'security',
      label: (
        <span>
          <LockOutlined />
          Security
        </span>
      ),
      children: <SecurityContent />
    },
    {
      key: 'notifications',
      label: (
        <span>
          <BellOutlined />
          Notifications
        </span>
      ),
      children: <NotificationContent />
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{ padding: '24px' }}
    >
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>
          My Profile
        </Title>
        <Text type="secondary">
          Manage your account settings and preferences
        </Text>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
        size="large"
      />
    </motion.div>
  );
};

export default ProfilePage;
