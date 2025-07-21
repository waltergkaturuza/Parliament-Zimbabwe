// src/pages/main-center/FuelPricingPage.tsx
import React from 'react';
import { Typography, Breadcrumb } from 'antd';
import { HomeOutlined, CarOutlined } from '@ant-design/icons';
import FuelPriceManagement from './components/FuelPriceManagement';

const { Title } = Typography;

const FuelPricingPage: React.FC = () => {
  return (
    <div style={{ padding: '24px' }}>
      {/* Breadcrumb Navigation */}
      <Breadcrumb style={{ marginBottom: '16px' }}>
        <Breadcrumb.Item href="/dashboard">
          <HomeOutlined />
        </Breadcrumb.Item>
        <Breadcrumb.Item>Main Center</Breadcrumb.Item>
        <Breadcrumb.Item>
          <CarOutlined />
          Fuel Price Management
        </Breadcrumb.Item>
      </Breadcrumb>

      {/* Page Header */}
      <div style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ margin: 0 }}>
          Fuel Price Management
        </Title>
        <Typography.Text type="secondary">
          Manage fuel prices for petrol and diesel in USD and ZWG
        </Typography.Text>
      </div>

      {/* Main Content */}
      <FuelPriceManagement />
    </div>
  );
};

export default FuelPricingPage;
