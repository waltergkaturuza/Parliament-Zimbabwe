// src/pages/admin/SystemSettings.tsx
import { useState, useEffect } from 'react';
import type { FC } from 'react';
import { Card, Form, Input, Button, Select, Switch, message, Spin, Typography, Row, Col, Divider, Space, Modal, InputNumber, Upload } from 'antd';
import { SaveOutlined, ReloadOutlined, SettingOutlined, SecurityScanOutlined, DollarOutlined, UploadOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import apiClient from '@/api/index';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface SystemConfig {
  general: {
    systemName: string;
    systemDescription: string;
    maintenanceMode: boolean;
    allowRegistration: boolean;
    defaultUserRole: string;
  };
  fuel: {
    defaultPetrolPrice: number;
    defaultDieselPrice: number;
    autoCalculateCosts: boolean;
    currency: string;
    priceUpdateNotifications: boolean;
  };
  security: {
    sessionTimeout: number;
    passwordMinLength: number;
    requirePasswordSpecialChars: boolean;
    maxLoginAttempts: number;
    enableTwoFactorAuth: boolean;
  };
  notifications: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    lowStockThreshold: number;
    reportingSchedule: string;
  };
  backup: {
    autoBackup: boolean;
    backupFrequency: string;
    retentionPeriod: number;
  };
}

const SystemSettings: FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<SystemConfig>({
    general: {
      systemName: 'Parliament Fuel Coupon System',
      systemDescription: 'Digital fuel coupon management system for Parliament of Zimbabwe',
      maintenanceMode: false,
      allowRegistration: true,
      defaultUserRole: 'beneficiary'
    },
    fuel: {
      defaultPetrolPrice: 1.80,
      defaultDieselPrice: 1.65,
      autoCalculateCosts: true,
      currency: 'USD',
      priceUpdateNotifications: true
    },
    security: {
      sessionTimeout: 60,
      passwordMinLength: 8,
      requirePasswordSpecialChars: true,
      maxLoginAttempts: 5,
      enableTwoFactorAuth: false
    },
    notifications: {
      emailNotifications: true,
      smsNotifications: false,
      lowStockThreshold: 20,
      reportingSchedule: 'weekly'
    },
    backup: {
      autoBackup: true,
      backupFrequency: 'daily',
      retentionPeriod: 30
    }
  });
  const [form] = Form.useForm();

  useEffect(() => {
    loadSystemSettings();
  }, []);

  const loadSystemSettings = async () => {
    try {
      setLoading(true);
      
      // Mock API call - replace with actual endpoint
      // const response = await apiRequest('get', '/api/system-settings/');
      
      // For now, use default config and set form values
      form.setFieldsValue({
        // General
        systemName: config.general.systemName,
        systemDescription: config.general.systemDescription,
        maintenanceMode: config.general.maintenanceMode,
        allowRegistration: config.general.allowRegistration,
        defaultUserRole: config.general.defaultUserRole,
        
        // Fuel
        defaultPetrolPrice: config.fuel.defaultPetrolPrice,
        defaultDieselPrice: config.fuel.defaultDieselPrice,
        autoCalculateCosts: config.fuel.autoCalculateCosts,
        currency: config.fuel.currency,
        priceUpdateNotifications: config.fuel.priceUpdateNotifications,
        
        // Security
        sessionTimeout: config.security.sessionTimeout,
        passwordMinLength: config.security.passwordMinLength,
        requirePasswordSpecialChars: config.security.requirePasswordSpecialChars,
        maxLoginAttempts: config.security.maxLoginAttempts,
        enableTwoFactorAuth: config.security.enableTwoFactorAuth,
        
        // Notifications
        emailNotifications: config.notifications.emailNotifications,
        smsNotifications: config.notifications.smsNotifications,
        lowStockThreshold: config.notifications.lowStockThreshold,
        reportingSchedule: config.notifications.reportingSchedule,
        
        // Backup
        autoBackup: config.backup.autoBackup,
        backupFrequency: config.backup.backupFrequency,
        retentionPeriod: config.backup.retentionPeriod
      });
    } catch (error) {
      console.error('Error loading system settings:', error);
      message.error('Failed to load system settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      setSaving(true);

      const newConfig: SystemConfig = {
        general: {
          systemName: values.systemName,
          systemDescription: values.systemDescription,
          maintenanceMode: values.maintenanceMode,
          allowRegistration: values.allowRegistration,
          defaultUserRole: values.defaultUserRole
        },
        fuel: {
          defaultPetrolPrice: values.defaultPetrolPrice,
          defaultDieselPrice: values.defaultDieselPrice,
          autoCalculateCosts: values.autoCalculateCosts,
          currency: values.currency,
          priceUpdateNotifications: values.priceUpdateNotifications
        },
        security: {
          sessionTimeout: values.sessionTimeout,
          passwordMinLength: values.passwordMinLength,
          requirePasswordSpecialChars: values.requirePasswordSpecialChars,
          maxLoginAttempts: values.maxLoginAttempts,
          enableTwoFactorAuth: values.enableTwoFactorAuth
        },
        notifications: {
          emailNotifications: values.emailNotifications,
          smsNotifications: values.smsNotifications,
          lowStockThreshold: values.lowStockThreshold,
          reportingSchedule: values.reportingSchedule
        },
        backup: {
          autoBackup: values.autoBackup,
          backupFrequency: values.backupFrequency,
          retentionPeriod: values.retentionPeriod
        }
      };

      // Mock API call - replace with actual endpoint
      // await apiRequest('put', '/api/system-settings/', newConfig);

      setConfig(newConfig);
      message.success('System settings updated successfully');
    } catch (error) {
      console.error('Error updating system settings:', error);
      message.error('Failed to update system settings');
    } finally {
      setSaving(false);
    }
  };

  const performBackup = async () => {
    try {
      // Mock backup functionality
      message.loading('Creating backup...', 2);
      setTimeout(() => {
        message.success('System backup created successfully');
      }, 2000);
    } catch (error) {
      message.error('Failed to create backup');
    }
  };

  const resetToDefaults = () => {
    Modal.confirm({
      title: 'Reset System Settings',
      icon: <ExclamationCircleOutlined />,
      content: 'Are you sure you want to reset all system settings to default values? This action cannot be undone.',
      okText: 'Yes, Reset',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: () => {
        const defaultConfig: SystemConfig = {
          general: {
            systemName: 'Parliament Fuel Coupon System',
            systemDescription: 'Digital fuel coupon management system for Parliament of Zimbabwe',
            maintenanceMode: false,
            allowRegistration: true,
            defaultUserRole: 'beneficiary'
          },
          fuel: {
            defaultPetrolPrice: 1.80,
            defaultDieselPrice: 1.65,
            autoCalculateCosts: true,
            currency: 'USD',
            priceUpdateNotifications: true
          },
          security: {
            sessionTimeout: 60,
            passwordMinLength: 8,
            requirePasswordSpecialChars: true,
            maxLoginAttempts: 5,
            enableTwoFactorAuth: false
          },
          notifications: {
            emailNotifications: true,
            smsNotifications: false,
            lowStockThreshold: 20,
            reportingSchedule: 'weekly'
          },
          backup: {
            autoBackup: true,
            backupFrequency: 'daily',
            retentionPeriod: 30
          }
        };

        setConfig(defaultConfig);
        form.resetFields();
        form.setFieldsValue({
          // Set default values in form
          systemName: defaultConfig.general.systemName,
          systemDescription: defaultConfig.general.systemDescription,
          // ... other default values
        });
        
        message.success('System settings reset to defaults');
      }
    });
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <p>Loading system settings...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', fontFamily: 'Rockwell, serif' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ fontFamily: 'Rockwell, serif', fontSize: '18px', margin: 0 }}>
          System Settings
        </Title>
        <p style={{ color: '#666', margin: '8px 0 0 0', fontSize: '16px' }}>
          Configure global system settings and preferences
        </p>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        style={{ fontFamily: 'Rockwell, serif' }}
      >
        <Row gutter={[24, 24]}>
          {/* General Settings */}
          <Col xs={24} lg={12}>
            <Card>
              <Title level={4} style={{ fontFamily: 'Rockwell, serif', fontSize: '16px', marginBottom: '16px' }}>
                <SettingOutlined /> General Settings
              </Title>

              <Form.Item
                name="systemName"
                label="System Name"
                rules={[{ required: true, message: 'Please enter system name' }]}
              >
                <Input placeholder="Enter system name" />
              </Form.Item>

              <Form.Item
                name="systemDescription"
                label="System Description"
              >
                <TextArea rows={3} placeholder="Enter system description" />
              </Form.Item>

              <Form.Item
                name="maintenanceMode"
                label="Maintenance Mode"
                valuePropName="checked"
              >
                <Switch checkedChildren="ON" unCheckedChildren="OFF" />
              </Form.Item>

              <Form.Item
                name="allowRegistration"
                label="Allow User Registration"
                valuePropName="checked"
              >
                <Switch checkedChildren="ON" unCheckedChildren="OFF" />
              </Form.Item>

              <Form.Item
                name="defaultUserRole"
                label="Default User Role"
              >
                <Select placeholder="Select default role">
                  <Option value="beneficiary">Beneficiary</Option>
                  <Option value="subcenter_officer">Sub Center Officer</Option>
                  <Option value="main_center_officer">Main Center Officer</Option>
                </Select>
              </Form.Item>
            </Card>
          </Col>

          {/* Fuel Settings */}
          <Col xs={24} lg={12}>
            <Card>
              <Title level={4} style={{ fontFamily: 'Rockwell, serif', fontSize: '16px', marginBottom: '16px' }}>
                <DollarOutlined /> Fuel Settings
              </Title>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="defaultPetrolPrice"
                    label="Default Petrol Price"
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      min={0}
                      step={0.01}
                      precision={2}
                      addonAfter="per liter"
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="defaultDieselPrice"
                    label="Default Diesel Price"
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      min={0}
                      step={0.01}
                      precision={2}
                      addonAfter="per liter"
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="currency"
                label="Currency"
              >
                <Select placeholder="Select currency">
                  <Option value="USD">USD - US Dollar</Option>
                  <Option value="ZWG">ZWG - Zimbabwe Dollar</Option>
                  <Option value="ZAR">ZAR - South African Rand</Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="autoCalculateCosts"
                label="Auto Calculate Costs"
                valuePropName="checked"
              >
                <Switch checkedChildren="ON" unCheckedChildren="OFF" />
              </Form.Item>

              <Form.Item
                name="priceUpdateNotifications"
                label="Price Update Notifications"
                valuePropName="checked"
              >
                <Switch checkedChildren="ON" unCheckedChildren="OFF" />
              </Form.Item>
            </Card>
          </Col>

          {/* Security Settings */}
          <Col xs={24} lg={12}>
            <Card>
              <Title level={4} style={{ fontFamily: 'Rockwell, serif', fontSize: '16px', marginBottom: '16px' }}>
                <SecurityScanOutlined /> Security Settings
              </Title>

              <Form.Item
                name="sessionTimeout"
                label="Session Timeout (minutes)"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={5}
                  max={480}
                />
              </Form.Item>

              <Form.Item
                name="passwordMinLength"
                label="Minimum Password Length"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={6}
                  max={32}
                />
              </Form.Item>

              <Form.Item
                name="maxLoginAttempts"
                label="Max Login Attempts"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={3}
                  max={10}
                />
              </Form.Item>

              <Form.Item
                name="requirePasswordSpecialChars"
                label="Require Special Characters in Password"
                valuePropName="checked"
              >
                <Switch checkedChildren="ON" unCheckedChildren="OFF" />
              </Form.Item>

              <Form.Item
                name="enableTwoFactorAuth"
                label="Enable Two-Factor Authentication"
                valuePropName="checked"
              >
                <Switch checkedChildren="ON" unCheckedChildren="OFF" />
              </Form.Item>
            </Card>
          </Col>

          {/* Notification Settings */}
          <Col xs={24} lg={12}>
            <Card>
              <Title level={4} style={{ fontFamily: 'Rockwell, serif', fontSize: '16px', marginBottom: '16px' }}>
                Notification Settings
              </Title>

              <Form.Item
                name="emailNotifications"
                label="Email Notifications"
                valuePropName="checked"
              >
                <Switch checkedChildren="ON" unCheckedChildren="OFF" />
              </Form.Item>

              <Form.Item
                name="smsNotifications"
                label="SMS Notifications"
                valuePropName="checked"
              >
                <Switch checkedChildren="ON" unCheckedChildren="OFF" />
              </Form.Item>

              <Form.Item
                name="lowStockThreshold"
                label="Low Stock Alert Threshold (%)"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={1}
                  max={50}
                />
              </Form.Item>

              <Form.Item
                name="reportingSchedule"
                label="Reporting Schedule"
              >
                <Select placeholder="Select schedule">
                  <Option value="daily">Daily</Option>
                  <Option value="weekly">Weekly</Option>
                  <Option value="monthly">Monthly</Option>
                </Select>
              </Form.Item>
            </Card>
          </Col>

          {/* Backup Settings */}
          <Col xs={24}>
            <Card>
              <Title level={4} style={{ fontFamily: 'Rockwell, serif', fontSize: '16px', marginBottom: '16px' }}>
                Backup & Maintenance
              </Title>

              <Row gutter={16}>
                <Col xs={24} md={8}>
                  <Form.Item
                    name="autoBackup"
                    label="Automatic Backup"
                    valuePropName="checked"
                  >
                    <Switch checkedChildren="ON" unCheckedChildren="OFF" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item
                    name="backupFrequency"
                    label="Backup Frequency"
                  >
                    <Select placeholder="Select frequency">
                      <Option value="daily">Daily</Option>
                      <Option value="weekly">Weekly</Option>
                      <Option value="monthly">Monthly</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item
                    name="retentionPeriod"
                    label="Retention Period (days)"
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      min={7}
                      max={365}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Divider />

              <Space>
                <Button
                  type="primary"
                  icon={<UploadOutlined />}
                  onClick={performBackup}
                >
                  Create Backup Now
                </Button>
                <Upload
                  accept=".sql,.backup"
                  showUploadList={false}
                  beforeUpload={() => {
                    message.info('Backup restore functionality coming soon');
                    return false;
                  }}
                >
                  <Button icon={<UploadOutlined />}>
                    Restore Backup
                  </Button>
                </Upload>
              </Space>
            </Card>
          </Col>
        </Row>

        {/* Action Buttons */}
        <Row style={{ marginTop: '24px' }}>
          <Col span={24}>
            <Card>
              <Space>
                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  htmlType="submit"
                  loading={saving}
                  size="large"
                >
                  Save Settings
                </Button>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={loadSystemSettings}
                  size="large"
                >
                  Refresh
                </Button>
                <Button
                  danger
                  onClick={resetToDefaults}
                  size="large"
                >
                  Reset to Defaults
                </Button>
              </Space>
            </Card>
          </Col>
        </Row>
      </Form>
    </div>
  );
};

export default SystemSettings;
