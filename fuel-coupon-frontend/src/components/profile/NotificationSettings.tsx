// src/components/profile/NotificationSettings.tsx
import React from 'react';
import { Card, Form, Switch, Button, Divider, Typography, Row, Col } from 'antd';
import { BellOutlined, MailOutlined, MessageOutlined, SaveOutlined } from '@ant-design/icons';

const { Title } = Typography;

interface NotificationSettingsProps {
  initialValues?: any;
  onSubmit: (values: any) => void;
  loading?: boolean;
}

const NotificationSettings: React.FC<NotificationSettingsProps> = ({
  initialValues,
  onSubmit,
  loading = false
}) => {
  const [form] = Form.useForm();

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      onSubmit(values);
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  return (
    <Card title={
      <span>
        <BellOutlined style={{ marginRight: 8 }} />
        Notification Settings
      </span>
    }>
      <Form
        form={form}
        layout="vertical"
        initialValues={initialValues}
        onFinish={onSubmit}
      >
        <Row gutter={[24, 24]}>
          <Col xs={24} md={12}>
            <Title level={5}>
              <MailOutlined style={{ marginRight: 8 }} />
              Email Notifications
            </Title>
            
            <Form.Item name="email_alerts" valuePropName="checked">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
                <span>Email Alerts</span>
                <Switch />
              </div>
            </Form.Item>

            <Form.Item name="fuel_price_updates" valuePropName="checked">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
                <span>Fuel Price Updates</span>
                <Switch />
              </div>
            </Form.Item>

            <Form.Item name="dispatch_notifications" valuePropName="checked">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
                <span>Dispatch Notifications</span>
                <Switch />
              </div>
            </Form.Item>

            <Form.Item name="system_maintenance" valuePropName="checked">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
                <span>System Maintenance</span>
                <Switch />
              </div>
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Title level={5}>
              <MessageOutlined style={{ marginRight: 8 }} />
              System Notifications
            </Title>

            <Form.Item name="sms_alerts" valuePropName="checked">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
                <span>SMS Alerts</span>
                <Switch />
              </div>
            </Form.Item>

            <Form.Item name="low_stock_alerts" valuePropName="checked">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
                <span>Low Stock Alerts</span>
                <Switch />
              </div>
            </Form.Item>

            <Form.Item name="urgent_updates" valuePropName="checked">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
                <span>Urgent Updates</span>
                <Switch />
              </div>
            </Form.Item>

            <Form.Item name="weekly_summary" valuePropName="checked">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
                <span>Weekly Summary</span>
                <Switch />
              </div>
            </Form.Item>
          </Col>
        </Row>

        <Divider />

        <Button
          type="primary"
          icon={<SaveOutlined />}
          onClick={handleSubmit}
          loading={loading}
          size="large"
        >
          Save Notification Preferences
        </Button>
      </Form>
    </Card>
  );
};

export default NotificationSettings;
