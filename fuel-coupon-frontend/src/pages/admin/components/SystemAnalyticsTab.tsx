// src/pages/admin/components/SystemAnalyticsTab.tsx
import React from 'react';
import { Card, Row, Col, Statistic, Progress, Typography, Alert } from 'antd';
import {
  BarChartOutlined,
  UserOutlined,
  DashboardOutlined,
  CarOutlined,
  SecurityScanOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;

const SystemAnalyticsTab: React.FC = () => {
  return (
    <div>
      <Alert 
        message="Analytics Dashboard" 
        description="System analytics functionality will be implemented in future releases." 
        type="info" 
        showIcon 
        className="mb-4" 
      />
      
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Users"
              value={156}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="System Uptime"
              value={99.9}
              precision={1}
              suffix="%"
              prefix={<DashboardOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Fuel Consumed"
              value={18420}
              suffix="L"
              prefix={<CarOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Active Alerts"
              value={3}
              prefix={<SecurityScanOutlined />}
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} className="mt-4">
        <Col xs={24} md={12}>
          <Card title="System Health">
            <div className="space-y-4">
              <div>
                <Text strong>Database Connection</Text>
                <Progress percent={100} status="success" />
              </div>
              <div>
                <Text strong>API Response Time</Text>
                <Progress percent={95} status="active" />
              </div>
              <div>
                <Text strong>Memory Usage</Text>
                <Progress percent={75} status="normal" />
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="Recent Activity">
            <div className="space-y-2">
              <div className="flex justify-between">
                <Text>New user registrations</Text>
                <Text strong>5 today</Text>
              </div>
              <div className="flex justify-between">
                <Text>Fuel allocations</Text>
                <Text strong>12 today</Text>
              </div>
              <div className="flex justify-between">
                <Text>System backup</Text>
                <Text strong>Completed</Text>
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default SystemAnalyticsTab;
