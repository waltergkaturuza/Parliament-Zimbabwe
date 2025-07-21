// src/pages/main-center/BookDispatchPage.tsx
import React from 'react';
import { Typography, Breadcrumb } from 'antd';
import { HomeOutlined, SwapOutlined } from '@ant-design/icons';
import BookDispatchManagement from './components/BookDispatchManagement';

const { Title } = Typography;

const BookDispatchPage: React.FC = () => {
  return (
    <div style={{ padding: '24px' }}>
      {/* Breadcrumb Navigation */}
      <Breadcrumb style={{ marginBottom: '16px' }}>
        <Breadcrumb.Item href="/dashboard">
          <HomeOutlined />
        </Breadcrumb.Item>
        <Breadcrumb.Item>Main Center</Breadcrumb.Item>
        <Breadcrumb.Item>
          <SwapOutlined />
          Book Dispatch Management
        </Breadcrumb.Item>
      </Breadcrumb>

      {/* Page Header */}
      <div style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ margin: 0 }}>
          Book Dispatch Management
        </Title>
        <Typography.Text type="secondary">
          Dispatch coupon books to sub-centers across Zimbabwe
        </Typography.Text>
      </div>

      {/* Main Content */}
      <BookDispatchManagement />
    </div>
  );
};

export default BookDispatchPage;
