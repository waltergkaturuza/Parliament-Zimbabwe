// src/pages/test/BookDispatchTest.tsx
import React from 'react';
import { Card, Typography } from 'antd';

const { Title } = Typography;

const BookDispatchTest: React.FC = () => {
  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Title level={2}>Book Dispatch Test Page</Title>
        <p>This is a test page to verify the book dispatch functionality is working.</p>
        <p>If you can see this page, the routing is working correctly.</p>
      </Card>
    </div>
  );
};

export default BookDispatchTest;
