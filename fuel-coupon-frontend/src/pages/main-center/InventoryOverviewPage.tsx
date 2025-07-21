// src/pages/main-center/InventoryOverviewPage.tsx
import React from 'react';
import { Typography, Breadcrumb } from 'antd';
import { HomeOutlined, AppstoreOutlined } from '@ant-design/icons';
import InventoryOverview from './components/InventoryOverview';

const { Title } = Typography;

const InventoryOverviewPage: React.FC = () => {
  return (
    <div style={{ padding: '24px' }}>
      {/* Breadcrumb Navigation */}
      <Breadcrumb style={{ marginBottom: '16px' }}>
        <Breadcrumb.Item href="/dashboard">
          <HomeOutlined />
        </Breadcrumb.Item>
        <Breadcrumb.Item>Main Center</Breadcrumb.Item>
        <Breadcrumb.Item>
          <AppstoreOutlined />
          Inventory Overview
        </Breadcrumb.Item>
      </Breadcrumb>

      {/* Page Header */}
      <div style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ margin: 0 }}>
          Inventory Overview
        </Title>
        <Typography.Text type="secondary">
          Monitor inventory levels, boxes, books, and coupons across the system
        </Typography.Text>
      </div>

      {/* Main Content */}
      <InventoryOverview />
    </div>
  );
};

export default InventoryOverviewPage;
