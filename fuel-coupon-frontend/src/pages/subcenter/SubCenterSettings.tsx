// src/pages/subcenter/SubCenterSettings.tsx
import { useState, useEffect } from 'react';
import type { FC } from 'react';
import { Card, Form, Input, Button, Select, Switch, message, Spin, Typography, Row, Col, Divider, Space, Modal } from 'antd';
import { SaveOutlined, ReloadOutlined, SettingOutlined, UserOutlined, HomeOutlined } from '@ant-design/icons';
import apiClient from '@/api/apiClient';
import type { SubCenter, User } from '../../types';

const { Title, Text } = Typography;
const { Option } = Select;

interface SubCenterConfig {
  allowCouponDistribution: boolean;
  requireApprovalForLargeOrders: boolean;
  largeOrderThreshold: number;
  enableAutomaticReporting: boolean;
  reportingFrequency: string;
  operatingHours: {
    start: string;
    end: string;
  };
  contactSettings: {
    primaryContact: string;
    emergencyContact: string;
    email: string;
  };
}

const SubCenterSettings: FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [subCenter, setSubCenter] = useState<SubCenter | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [config, setConfig] = useState<SubCenterConfig>({
    allowCouponDistribution: true,
    requireApprovalForLargeOrders: true,
    largeOrderThreshold: 100,
    enableAutomaticReporting: true,
    reportingFrequency: 'daily',
    operatingHours: {
      start: '08:00',
      end: '17:00'
    },
    contactSettings: {
      primaryContact: '',
      emergencyContact: '',
      email: ''
    }
  });
  const [form] = Form.useForm();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Get current user's sub center
      const userResponse = await apiClient.get('/api/v1/users/me/');
      const currentUser = userResponse.data;
      
      if (currentUser.sub_center) {
        const subCenterResponse = await apiClient.get(`/subcenters/${currentUser.sub_center}/`);
        const subCenterData = subCenterResponse.data;
        setSubCenter(subCenterData);

        // Load sub center users
        const usersResponse = await apiClient.get('/api/v1/users/', {
          params: { sub_center: currentUser.sub_center }
        });
        const userData = usersResponse.data.results || usersResponse.data;
        setUsers(userData);

        // Set form values
        form.setFieldsValue({
          name: subCenterData.name,
          location: subCenterData.location,
          contact_person: subCenterData.contact_person,
          phone: subCenterData.phone,
          email: subCenterData.email,
          status: subCenterData.status,
          allowCouponDistribution: config.allowCouponDistribution,
          requireApprovalForLargeOrders: config.requireApprovalForLargeOrders,
          largeOrderThreshold: config.largeOrderThreshold,
          enableAutomaticReporting: config.enableAutomaticReporting,
          reportingFrequency: config.reportingFrequency,
          operatingStart: config.operatingHours.start,
          operatingEnd: config.operatingHours.end,
          primaryContact: config.contactSettings.primaryContact,
          emergencyContact: config.contactSettings.emergencyContact,
          contactEmail: config.contactSettings.email
        });
      }
    } catch (error) {
      console.error('Error loading sub center data:', error);
      message.error('Failed to load sub center settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: any) => {
    if (!subCenter) return;

    try {
      setSaving(true);

      // Update basic sub center info
      const subCenterData = {
        name: values.name,
        location: values.location,
        contact_person: values.contact_person,
        phone: values.phone,
        email: values.email,
        status: values.status
      };

      await apiClient.put(`/subcenters/${subCenter.id}/`, subCenterData);

      // Update configuration (this would typically be stored in a separate settings model)
      const newConfig: SubCenterConfig = {
        allowCouponDistribution: values.allowCouponDistribution,
        requireApprovalForLargeOrders: values.requireApprovalForLargeOrders,
        largeOrderThreshold: values.largeOrderThreshold,
        enableAutomaticReporting: values.enableAutomaticReporting,
        reportingFrequency: values.reportingFrequency,
        operatingHours: {
          start: values.operatingStart,
          end: values.operatingEnd
        },
        contactSettings: {
          primaryContact: values.primaryContact,
          emergencyContact: values.emergencyContact,
          email: values.contactEmail
        }
      };

      setConfig(newConfig);
      message.success('Sub center settings updated successfully');
    } catch (error) {
      console.error('Error updating sub center settings:', error);
      message.error('Failed to update sub center settings');
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = () => {
    Modal.confirm({
      title: 'Reset to Default Settings',
      content: 'Are you sure you want to reset all configuration settings to their default values?',
      okText: 'Yes, Reset',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: () => {
        const defaultConfig: SubCenterConfig = {
          allowCouponDistribution: true,
          requireApprovalForLargeOrders: true,
          largeOrderThreshold: 100,
          enableAutomaticReporting: true,
          reportingFrequency: 'daily',
          operatingHours: {
            start: '08:00',
            end: '17:00'
          },
          contactSettings: {
            primaryContact: '',
            emergencyContact: '',
            email: ''
          }
        };

        setConfig(defaultConfig);
        form.setFieldsValue({
          allowCouponDistribution: defaultConfig.allowCouponDistribution,
          requireApprovalForLargeOrders: defaultConfig.requireApprovalForLargeOrders,
          largeOrderThreshold: defaultConfig.largeOrderThreshold,
          enableAutomaticReporting: defaultConfig.enableAutomaticReporting,
          reportingFrequency: defaultConfig.reportingFrequency,
          operatingStart: defaultConfig.operatingHours.start,
          operatingEnd: defaultConfig.operatingHours.end,
          primaryContact: defaultConfig.contactSettings.primaryContact,
          emergencyContact: defaultConfig.contactSettings.emergencyContact,
          contactEmail: defaultConfig.contactSettings.email
        });

        message.success('Settings reset to defaults');
      }
    });
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <p>Loading sub center settings...</p>
      </div>
    );
  }

  if (!subCenter) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Text type="secondary">No sub center assigned to your account</Text>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', fontFamily: 'Rockwell, serif' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ fontFamily: 'Rockwell, serif', fontSize: '18px', margin: 0 }}>
          Sub Center Settings
        </Title>
        <p style={{ color: '#666', margin: '8px 0 0 0', fontSize: '16px' }}>
          Configure settings and preferences for {subCenter.name}
        </p>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        style={{ fontFamily: 'Rockwell, serif' }}
      >
        <Row gutter={[24, 0]}>
          {/* Basic Information */}
          <Col xs={24} lg={12}>
            <Card>
              <Title level={4} style={{ fontFamily: 'Rockwell, serif', fontSize: '16px', marginBottom: '16px' }}>
                <HomeOutlined /> Basic Information
              </Title>

              <Form.Item
                name="name"
                label="Sub Center Name"
                rules={[{ required: true, message: 'Please enter sub center name' }]}
              >
                <Input placeholder="Enter sub center name" />
              </Form.Item>

              <Form.Item
                name="location"
                label="Location"
                rules={[{ required: true, message: 'Please enter location' }]}
              >
                <Input placeholder="Enter location address" />
              </Form.Item>

              <Form.Item
                name="contact_person"
                label="Contact Person"
              >
                <Input placeholder="Enter contact person name" />
              </Form.Item>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="phone"
                    label="Phone"
                  >
                    <Input placeholder="Enter phone number" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="email"
                    label="Email"
                  >
                    <Input type="email" placeholder="Enter email address" />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="status"
                label="Status"
              >
                <Select placeholder="Select status">
                  <Option value="active">Active</Option>
                  <Option value="inactive">Inactive</Option>
                  <Option value="maintenance">Under Maintenance</Option>
                </Select>
              </Form.Item>
            </Card>
          </Col>

          {/* Configuration Settings */}
          <Col xs={24} lg={12}>
            <Card>
              <Title level={4} style={{ fontFamily: 'Rockwell, serif', fontSize: '16px', marginBottom: '16px' }}>
                <SettingOutlined /> Configuration
              </Title>

              <Form.Item
                name="allowCouponDistribution"
                label="Allow Coupon Distribution"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>

              <Form.Item
                name="requireApprovalForLargeOrders"
                label="Require Approval for Large Orders"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>

              <Form.Item
                name="largeOrderThreshold"
                label="Large Order Threshold (number of coupons)"
              >
                <Input type="number" placeholder="e.g., 100" />
              </Form.Item>

              <Form.Item
                name="enableAutomaticReporting"
                label="Enable Automatic Reporting"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>

              <Form.Item
                name="reportingFrequency"
                label="Reporting Frequency"
              >
                <Select placeholder="Select frequency">
                  <Option value="daily">Daily</Option>
                  <Option value="weekly">Weekly</Option>
                  <Option value="monthly">Monthly</Option>
                </Select>
              </Form.Item>

              <Divider />

              <Title level={5} style={{ fontFamily: 'Rockwell, serif', fontSize: '14px', marginBottom: '16px' }}>
                Operating Hours
              </Title>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="operatingStart"
                    label="Start Time"
                  >
                    <Input type="time" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="operatingEnd"
                    label="End Time"
                  >
                    <Input type="time" />
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>

        {/* Contact Settings */}
        <Row gutter={[24, 0]} style={{ marginTop: '24px' }}>
          <Col span={24}>
            <Card>
              <Title level={4} style={{ fontFamily: 'Rockwell, serif', fontSize: '16px', marginBottom: '16px' }}>
                <UserOutlined /> Contact Settings
              </Title>

              <Row gutter={16}>
                <Col xs={24} md={8}>
                  <Form.Item
                    name="primaryContact"
                    label="Primary Contact"
                  >
                    <Select placeholder="Select primary contact">
                      {users.map((user) => (
                        <Option key={user.id} value={user.id}>
                          {user.first_name} {user.last_name}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item
                    name="emergencyContact"
                    label="Emergency Contact"
                  >
                    <Select placeholder="Select emergency contact">
                      {users.map((user) => (
                        <Option key={user.id} value={user.id}>
                          {user.first_name} {user.last_name}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item
                    name="contactEmail"
                    label="Contact Email"
                  >
                    <Input type="email" placeholder="Enter contact email" />
                  </Form.Item>
                </Col>
              </Row>
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
                >
                  Save Settings
                </Button>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={loadData}
                >
                  Refresh
                </Button>
                <Button
                  danger
                  onClick={resetToDefaults}
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

export default SubCenterSettings;
