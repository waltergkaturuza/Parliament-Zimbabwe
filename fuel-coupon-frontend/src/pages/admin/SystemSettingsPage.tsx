// src/pages/admin/SystemSettingsPage.tsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  Row,
  Col,
  Form,
  Input,
  Button,
  Switch,
  Select,
  InputNumber,
  message,
  Tabs,
  Typography,
  Space,
  Divider,
  Alert,
  Modal,
  Table,
  Tag,
  Tooltip
} from 'antd';
import {
  SettingOutlined,
  SecurityScanOutlined,
  DatabaseOutlined,
  GlobalOutlined,
  MailOutlined,
  PhoneOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  SaveOutlined,
  ReloadOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { motion } from 'framer-motion';
import { adminService } from '@/api/admin';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface SystemSettings {
  general: {
    system_name: string;
    maintenance_mode: boolean;
    timezone: string;
    default_language: string;
  };
  fuel: {
    petrol_price_usd: number;
    diesel_price_usd: number;
    usd_to_zwg_rate: number;
    price_update_frequency: number;
  };
  notifications: {
    email_enabled: boolean;
    sms_enabled: boolean;
    alert_thresholds: {
      low_stock: number;
      critical_stock: number;
    };
  };
  security: {
    session_timeout: number;
    max_login_attempts: number;
    password_expiry_days: number;
    require_2fa: boolean;
  };
}

const SystemSettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  // Fetch system settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ['system-settings'],
    queryFn: async () => {
      // Mock data for now - replace with actual API call
      return {
        general: {
          system_name: 'Parliament of Zimbabwe Fuel Coupon System',
          maintenance_mode: false,
          timezone: 'Africa/Harare',
          default_language: 'en'
        },
        fuel: {
          petrol_price_usd: 1.42,
          diesel_price_usd: 1.38,
          usd_to_zwg_rate: 27.50,
          price_update_frequency: 24
        },
        notifications: {
          email_enabled: true,
          sms_enabled: false,
          alert_thresholds: {
            low_stock: 100,
            critical_stock: 50
          }
        },
        security: {
          session_timeout: 30,
          max_login_attempts: 5,
          password_expiry_days: 90,
          require_2fa: false
        }
      } as SystemSettings;
    }
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (values: Partial<SystemSettings>) => {
      // Mock API call - replace with actual endpoint
      await new Promise(resolve => setTimeout(resolve, 1000));
      return values;
    },
    onSuccess: () => {
      message.success('Settings updated successfully');
      queryClient.invalidateQueries({ queryKey: ['system-settings'] });
    },
    onError: () => {
      message.error('Failed to update settings');
    }
  });

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      updateSettingsMutation.mutate(values);
    } catch (error) {
      message.error('Please fix form errors before saving');
    }
  };

  const confirmMaintenanceMode = (checked: boolean) => {
    if (checked) {
      Modal.confirm({
        title: 'Enable Maintenance Mode',
        icon: <ExclamationCircleOutlined />,
        content: 'This will temporarily disable access for all users except administrators. Continue?',
        onOk: () => {
          form.setFieldValue(['general', 'maintenance_mode'], true);
        }
      });
    } else {
      form.setFieldValue(['general', 'maintenance_mode'], false);
    }
  };

  const tabItems = [
    {
      key: 'general',
      label: (
        <span>
          <SettingOutlined />
          General
        </span>
      ),
      children: (
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={12}>
            <Card title="System Configuration" size="small">
              <Form.Item
                name={['general', 'system_name']}
                label="System Name"
                rules={[{ required: true, message: 'System name is required' }]}
              >
                <Input placeholder="Enter system name" />
              </Form.Item>
              
              <Form.Item
                name={['general', 'timezone']}
                label="Timezone"
                rules={[{ required: true }]}
              >
                <Select>
                  <Option value="Africa/Harare">Africa/Harare (CAT)</Option>
                  <Option value="UTC">UTC</Option>
                  <Option value="Africa/Johannesburg">Africa/Johannesburg (SAST)</Option>
                </Select>
              </Form.Item>
              
              <Form.Item
                name={['general', 'default_language']}
                label="Default Language"
              >
                <Select>
                  <Option value="en">English</Option>
                  <Option value="sn">Shona</Option>
                  <Option value="nd">Ndebele</Option>
                </Select>
              </Form.Item>
            </Card>
          </Col>
          
          <Col xs={24} lg={12}>
            <Card title="System Status" size="small">
              <Alert
                message="System Status"
                description="All systems operational"
                type="success"
                showIcon
                className="mb-4"
              />
              
              <Form.Item
                name={['general', 'maintenance_mode']}
                label="Maintenance Mode"
                valuePropName="checked"
              >
                <Switch
                  checkedChildren="ON"
                  unCheckedChildren="OFF"
                  onChange={confirmMaintenanceMode}
                />
              </Form.Item>
              
              <Text type="secondary">
                Enable maintenance mode to temporarily restrict system access
              </Text>
            </Card>
          </Col>
        </Row>
      )
    },
    {
      key: 'fuel',
      label: (
        <span>
          <DollarOutlined />
          Fuel Pricing
        </span>
      ),
      children: (
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={12}>
            <Card title="Fuel Prices (USD)" size="small">
              <Form.Item
                name={['fuel', 'petrol_price_usd']}
                label="Petrol Price (USD/L)"
                rules={[{ required: true }]}
              >
                <InputNumber
                  prefix="$"
                  min={0}
                  step={0.01}
                  precision={2}
                  className="w-full"
                />
              </Form.Item>
              
              <Form.Item
                name={['fuel', 'diesel_price_usd']}
                label="Diesel Price (USD/L)"
                rules={[{ required: true }]}
              >
                <InputNumber
                  prefix="$"
                  min={0}
                  step={0.01}
                  precision={2}
                  className="w-full"
                />
              </Form.Item>
            </Card>
          </Col>
          
          <Col xs={24} lg={12}>
            <Card title="Exchange Rate" size="small">
              <Form.Item
                name={['fuel', 'usd_to_zwg_rate']}
                label="USD to ZWG Exchange Rate"
                rules={[{ required: true }]}
              >
                <InputNumber
                  min={0}
                  step={0.01}
                  precision={2}
                  className="w-full"
                  addonAfter="ZWG"
                />
              </Form.Item>
              
              <Form.Item
                name={['fuel', 'price_update_frequency']}
                label="Auto-Update Frequency (hours)"
              >
                <InputNumber
                  min={1}
                  max={168}
                  className="w-full"
                />
              </Form.Item>
              
              <Alert
                message="Exchange Rate Update"
                description="Current rate will be used for all new transactions"
                type="info"
                showIcon
              />
            </Card>
          </Col>
        </Row>
      )
    },
    {
      key: 'notifications',
      label: (
        <span>
          <MailOutlined />
          Notifications
        </span>
      ),
      children: (
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={12}>
            <Card title="Notification Channels" size="small">
              <Form.Item
                name={['notifications', 'email_enabled']}
                label="Email Notifications"
                valuePropName="checked"
              >
                <Switch checkedChildren="ON" unCheckedChildren="OFF" />
              </Form.Item>
              
              <Form.Item
                name={['notifications', 'sms_enabled']}
                label="SMS Notifications"
                valuePropName="checked"
              >
                <Switch checkedChildren="ON" unCheckedChildren="OFF" />
              </Form.Item>
            </Card>
          </Col>
          
          <Col xs={24} lg={12}>
            <Card title="Alert Thresholds" size="small">
              <Form.Item
                name={['notifications', 'alert_thresholds', 'low_stock']}
                label="Low Stock Alert (coupons)"
              >
                <InputNumber min={1} className="w-full" />
              </Form.Item>
              
              <Form.Item
                name={['notifications', 'alert_thresholds', 'critical_stock']}
                label="Critical Stock Alert (coupons)"
              >
                <InputNumber min={1} className="w-full" />
              </Form.Item>
            </Card>
          </Col>
        </Row>
      )
    },
    {
      key: 'security',
      label: (
        <span>
          <SecurityScanOutlined />
          Security
        </span>
      ),
      children: (
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={12}>
            <Card title="Authentication" size="small">
              <Form.Item
                name={['security', 'session_timeout']}
                label="Session Timeout (minutes)"
                rules={[{ required: true }]}
              >
                <InputNumber min={5} max={480} className="w-full" />
              </Form.Item>
              
              <Form.Item
                name={['security', 'max_login_attempts']}
                label="Max Login Attempts"
                rules={[{ required: true }]}
              >
                <InputNumber min={3} max={10} className="w-full" />
              </Form.Item>
              
              <Form.Item
                name={['security', 'require_2fa']}
                label="Require Two-Factor Authentication"
                valuePropName="checked"
              >
                <Switch checkedChildren="ON" unCheckedChildren="OFF" />
              </Form.Item>
            </Card>
          </Col>
          
          <Col xs={24} lg={12}>
            <Card title="Password Policy" size="small">
              <Form.Item
                name={['security', 'password_expiry_days']}
                label="Password Expiry (days)"
                rules={[{ required: true }]}
              >
                <InputNumber min={30} max={365} className="w-full" />
              </Form.Item>
              
              <Alert
                message="Security Notice"
                description="Strong password policies help protect the system"
                type="warning"
                showIcon
              />
            </Card>
          </Col>
        </Row>
      )
    }
  ];

  return (
    <div className="p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex justify-between items-center mb-6">
          <div>
            <Title level={2} className="!mb-0">System Settings</Title>
            <Text type="secondary">Configure system-wide settings and preferences</Text>
          </div>
          <Space>
            <Button 
              icon={<ReloadOutlined />}
              onClick={() => queryClient.invalidateQueries({ queryKey: ['system-settings'] })}
            >
              Refresh
            </Button>
            <Button 
              type="primary" 
              icon={<SaveOutlined />}
              loading={updateSettingsMutation.isPending}
              onClick={handleSave}
            >
              Save Changes
            </Button>
          </Space>
        </div>

        <Form
          form={form}
          layout="vertical"
          initialValues={settings}
          key={JSON.stringify(settings)} // Force re-render when data changes
        >
          <Card>
            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              items={tabItems}
              size="large"
            />
          </Card>
        </Form>
      </motion.div>
    </div>
  );
};

export default SystemSettingsPage;
