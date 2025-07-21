// src/pages/main-center/BoxReceiptPage.tsx
import React from 'react';
import { Typography, Breadcrumb } from 'antd';
import { HomeOutlined, GiftOutlined } from '@ant-design/icons';
import BoxReceiptManagement from './components/BoxReceiptManagement';

const { Title } = Typography;

const BoxReceiptPage: React.FC = () => {
  return (
    <div style={{ padding: '24px' }}>
      {/* Breadcrumb Navigation */}
      <Breadcrumb style={{ marginBottom: '16px' }}>
        <Breadcrumb.Item href="/dashboard">
          <HomeOutlined />
        </Breadcrumb.Item>
        <Breadcrumb.Item>Main Center</Breadcrumb.Item>
        <Breadcrumb.Item>
          <GiftOutlined />
          Box Receipt Management
        </Breadcrumb.Item>
      </Breadcrumb>

      {/* Page Header */}
      <div style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ margin: 0 }}>
          Box Receipt Management
        </Title>
        <Typography.Text type="secondary">
          Receive and manage coupon boxes from Petrotrade Zimbabwe
        </Typography.Text>
      </div>

      {/* Main Content */}
      <BoxReceiptManagement />
    </div>
  );
};

export default BoxReceiptPage;
