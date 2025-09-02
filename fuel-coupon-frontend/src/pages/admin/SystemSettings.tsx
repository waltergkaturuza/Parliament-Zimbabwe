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
      systemName: '',
      systemDescription: '',
      maintenanceMode: false,
      allowRegistration: true,
      defaultUserRole: 'beneficiary'
    },
    fuel: {
      defaultPetrolPrice: 0,
      defaultDieselPrice: 0,
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
      
      // Real API call to load system settings
      const response = await apiClient.get('/admin/system-settings/');
      const settingsData = response.data;
      
      const loadedConfig: SystemConfig = {
        general: {
          systemName: settingsData.general?.system_name || 'Parliament Fuel Coupon System',
          systemDescription: settingsData.general?.system_description || 'Digital fuel coupon management system for Parliament of Zimbabwe',
          maintenanceMode: settingsData.general?.maintenance_mode || false,
          allowRegistration: settingsData.general?.allow_registration || true,
          defaultUserRole: settingsData.general?.default_user_role || 'beneficiary'
        },
        fuel: {
          defaultPetrolPrice: settingsData.fuel?.default_petrol_price || 1.80,
          defaultDieselPrice: settingsData.fuel?.default_diesel_price || 1.65,
          autoCalculateCosts: settingsData.fuel?.auto_calculate_costs !== false,
          currency: settingsData.fuel?.currency || 'USD',
          priceUpdateNotifications: settingsData.fuel?.price_update_notifications !== false
        },
        security: {
          sessionTimeout: settingsData.security?.session_timeout || 60,
          passwordMinLength: settingsData.security?.password_min_length || 8,
          requirePasswordSpecialChars: settingsData.security?.require_password_special_chars !== false,
          maxLoginAttempts: settingsData.security?.max_login_attempts || 5,
          enableTwoFactorAuth: settingsData.security?.enable_two_factor_auth || false
        },
        notifications: {
          emailNotifications: settingsData.notifications?.email_notifications !== false,
          smsNotifications: settingsData.notifications?.sms_notifications || false,
          lowStockThreshold: settingsData.notifications?.low_stock_threshold || 20,
          reportingSchedule: settingsData.notifications?.reporting_schedule || 'weekly'
        },
        backup: {
          autoBackup: settingsData.backup?.auto_backup !== false,
          backupFrequency: settingsData.backup?.backup_frequency || 'daily',
          retentionPeriod: settingsData.backup?.retention_period || 30
        }
      };
      
      setConfig(loadedConfig);
      
      // Set form values with loaded config
      form.setFieldsValue({
        // General
        systemName: loadedConfig.general.systemName,
        systemDescription: loadedConfig.general.systemDescription,
        maintenanceMode: loadedConfig.general.maintenanceMode,
        allowRegistration: loadedConfig.general.allowRegistration,
        defaultUserRole: loadedConfig.general.defaultUserRole,
        
        // Fuel
        defaultPetrolPrice: loadedConfig.fuel.defaultPetrolPrice,
        defaultDieselPrice: loadedConfig.fuel.defaultDieselPrice,
        autoCalculateCosts: loadedConfig.fuel.autoCalculateCosts,
        currency: loadedConfig.fuel.currency,
        priceUpdateNotifications: loadedConfig.fuel.priceUpdateNotifications,
        
        // Security
        sessionTimeout: loadedConfig.security.sessionTimeout,
        passwordMinLength: loadedConfig.security.passwordMinLength,
        requirePasswordSpecialChars: loadedConfig.security.requirePasswordSpecialChars,
        maxLoginAttempts: loadedConfig.security.maxLoginAttempts,
        enableTwoFactorAuth: loadedConfig.security.enableTwoFactorAuth,
        
        // Notifications
        emailNotifications: loadedConfig.notifications.emailNotifications,
        smsNotifications: loadedConfig.notifications.smsNotifications,
        lowStockThreshold: loadedConfig.notifications.lowStockThreshold,
        reportingSchedule: loadedConfig.notifications.reportingSchedule,
        
        // Backup
        autoBackup: loadedConfig.backup.autoBackup,
        backupFrequency: loadedConfig.backup.backupFrequency,
        retentionPeriod: loadedConfig.backup.retentionPeriod
      });
    } catch (error) {
      console.error('Error loading system settings:', error);
      message.error('Failed to load system settings');
      
      // Use default config on error and set form values
      form.setFieldsValue({
        systemName: config.general.systemName,
        systemDescription: config.general.systemDescription,
        maintenanceMode: config.general.maintenanceMode,
        allowRegistration: config.general.allowRegistration,
        defaultUserRole: config.general.defaultUserRole,
        defaultPetrolPrice: config.fuel.defaultPetrolPrice,
        defaultDieselPrice: config.fuel.defaultDieselPrice,
        autoCalculateCosts: config.fuel.autoCalculateCosts,
        currency: config.fuel.currency,
        priceUpdateNotifications: config.fuel.priceUpdateNotifications,
        sessionTimeout: config.security.sessionTimeout,
        passwordMinLength: config.security.passwordMinLength,
        requirePasswordSpecialChars: config.security.requirePasswordSpecialChars,
        maxLoginAttempts: config.security.maxLoginAttempts,
        enableTwoFactorAuth: config.security.enableTwoFactorAuth,
        emailNotifications: config.notifications.emailNotifications,
        smsNotifications: config.notifications.smsNotifications,
        lowStockThreshold: config.notifications.lowStockThreshold,
        reportingSchedule: config.notifications.reportingSchedule,
        autoBackup: config.backup.autoBackup,
        backupFrequency: config.backup.backupFrequency,
        retentionPeriod: config.backup.retentionPeriod
      });
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

      // Real API call to update system settings
      await apiClient.put('/admin/system-settings/', {
        general: {
          system_name: newConfig.general.systemName,
          system_description: newConfig.general.systemDescription,
          maintenance_mode: newConfig.general.maintenanceMode,
          allow_registration: newConfig.general.allowRegistration,
          default_user_role: newConfig.general.defaultUserRole
        },
        fuel: {
          default_petrol_price: newConfig.fuel.defaultPetrolPrice,
          default_diesel_price: newConfig.fuel.defaultDieselPrice,
          auto_calculate_costs: newConfig.fuel.autoCalculateCosts,
          currency: newConfig.fuel.currency,
          price_update_notifications: newConfig.fuel.priceUpdateNotifications
        },
        security: {
          session_timeout: newConfig.security.sessionTimeout,
          password_min_length: newConfig.security.passwordMinLength,
          require_password_special_chars: newConfig.security.requirePasswordSpecialChars,
          max_login_attempts: newConfig.security.maxLoginAttempts,
          enable_two_factor_auth: newConfig.security.enableTwoFactorAuth
        },
        notifications: {
          email_notifications: newConfig.notifications.emailNotifications,
          sms_notifications: newConfig.notifications.smsNotifications,
          low_stock_threshold: newConfig.notifications.lowStockThreshold,
          reporting_schedule: newConfig.notifications.reportingSchedule
        },
        backup: {
          auto_backup: newConfig.backup.autoBackup,
          backup_frequency: newConfig.backup.backupFrequency,
          retention_period: newConfig.backup.retentionPeriod
        }
      });

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
      message.loading('Creating backup...', 0);
      
      // Real API call to create backup
      const response = await apiClient.post('/admin/backup/create/');
      
      if (response.data.backup_file) {
        // Download the backup file
        const downloadResponse = await apiClient.get(`/admin/backup/download/${response.data.backup_id}/`, {
          responseType: 'blob'
        });
        
        const url = window.URL.createObjectURL(new Blob([downloadResponse.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', response.data.backup_file);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      }
      
      message.destroy();
      message.success('System backup created and downloaded successfully');
    } catch (error) {
      message.destroy();
      console.error('Error creating backup:', error);
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
