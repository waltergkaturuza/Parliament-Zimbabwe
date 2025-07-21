// src/pages/main-center/SubCenterMonitoringPage.tsx
import React from 'react';
import { Typography, Breadcrumb } from 'antd';
import { HomeOutlined, MonitorOutlined } from '@ant-design/icons';
import SubCenterMonitoring from './components/SubCenterMonitoring';

const { Title } = Typography;

const SubCenterMonitoringPage: React.FC = () => {
  return (
    <div style={{ padding: '24px' }}>
      {/* Breadcrumb Navigation */}
      <Breadcrumb style={{ marginBottom: '16px' }}>
        <Breadcrumb.Item href="/dashboard">
          <HomeOutlined />
        </Breadcrumb.Item>
        <Breadcrumb.Item>Main Center</Breadcrumb.Item>
        <Breadcrumb.Item>
          <MonitorOutlined />
          Sub Center Monitoring
        </Breadcrumb.Item>
      </Breadcrumb>

      {/* Page Header */}
      <div style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ margin: 0 }}>
          Sub Center Monitoring
        </Title>
        <Typography.Text type="secondary">
          Monitor sub-center operations, handovers, and performance metrics
        </Typography.Text>
      </div>

      {/* Main Content */}
      <SubCenterMonitoring />
    </div>
  );
};

export default SubCenterMonitoringPage;
