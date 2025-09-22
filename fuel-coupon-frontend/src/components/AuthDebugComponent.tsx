// Debug component to check authentication state
import React, { useEffect } from 'react';
import { Card, Button, Typography } from 'antd';
import { useAuth } from '@/contexts/AuthContext';
import apiClient from '@/api';

const { Title, Text, Paragraph } = Typography;

const AuthDebugComponent: React.FC = () => {
  const { user, isAuthenticated, userRole, accessToken } = useAuth();

  const testBoxAPI = async () => {
    try {
      console.log('=== TESTING BOX API ACCESS ===');
      console.log('Current user:', user);
      console.log('User role:', userRole);
      console.log('Access token present:', !!accessToken);
      
      // Test GET request first
      const getResponse = await apiClient.get('/boxes/');
      console.log('GET /boxes/ success:', getResponse.status, getResponse.data);
      
      // Test POST request with minimal data
      const postData = {
        box_code: `TEST_${Date.now()}`,
        supplier: 'Test Supplier',
        received_by: user?.id || 1,
        first_coupon_number: '000001',
        last_coupon_number: '000010',
        fuel_type: 'PETROL',
        denomination: 50
      };
      
      const postResponse = await apiClient.post('/boxes/', postData);
      console.log('POST /boxes/ success:', postResponse.status, postResponse.data);
      
    } catch (error: any) {
      console.error('API Test Error:', error);
      console.log('Error details:', {
        status: error.response?.status,
        data: error.response?.data,
        headers: error.response?.headers
      });
    }
  };

  return (
    <Card title="Authentication Debug" style={{ margin: 20 }}>
      <Title level={4}>Current Authentication State</Title>
      <Paragraph>
        <Text strong>Authenticated:</Text> {isAuthenticated ? 'Yes' : 'No'}<br/>
        <Text strong>User:</Text> {user ? user.username : 'None'}<br/>
        <Text strong>Role:</Text> {userRole || 'None'}<br/>
        <Text strong>User ID:</Text> {user?.id || 'None'}<br/>
        <Text strong>Sub Center ID:</Text> {user?.sub_center_id || 'None'}<br/>
        <Text strong>Access Token:</Text> {accessToken ? `Present (${accessToken.length} chars)` : 'None'}<br/>
      </Paragraph>
      
      <Button type="primary" onClick={testBoxAPI}>
        Test Box API Access
      </Button>
      
      <Paragraph style={{ marginTop: 16 }}>
        <Text type="secondary">Check browser console for detailed results</Text>
      </Paragraph>
    </Card>
  );
};

export default AuthDebugComponent;