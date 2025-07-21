// src/pages/main-center/AnalyticsFinancePage.tsx
import React from 'react';
import { Typography, Breadcrumb } from 'antd';
import { HomeOutlined, BarChartOutlined } from '@ant-design/icons';
import AnalyticsFinance from './components/AnalyticsFinance';

const { Title } = Typography;

const AnalyticsFinancePage: React.FC = () => {
  return (
    <div style={{ padding: '24px' }}>
      {/* Breadcrumb Navigation */}
      <Breadcrumb style={{ marginBottom: '16px' }}>
        <Breadcrumb.Item href="/dashboard">
          <HomeOutlined />
        </Breadcrumb.Item>
        <Breadcrumb.Item>Main Center</Breadcrumb.Item>
        <Breadcrumb.Item>
          <BarChartOutlined />
          Analytics & Finance
        </Breadcrumb.Item>
      </Breadcrumb>

      {/* Page Header */}
      <div style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ margin: 0 }}>
          Analytics & Finance
        </Title>
        <Typography.Text type="secondary">
          Financial reports, analytics, and performance metrics for the fuel coupon system
        </Typography.Text>
      </div>

      {/* Main Content */}
      <AnalyticsFinance />
    </div>
  );
};

export default AnalyticsFinancePage;
