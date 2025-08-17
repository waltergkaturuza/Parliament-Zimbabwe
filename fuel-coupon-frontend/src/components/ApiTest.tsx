// src/components/ApiTest.tsx
import { useState } from 'react';
import { Button, Card, Typography, Space, Input } from 'antd';
import apiClient from '@/api';

const { Title, Text } = Typography;

const ApiTest = () => {
  const [response, setResponse] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testDirectAPICall = async () => {
    setLoading(true);
    setResponse('');
    
    try {
      console.log('Making API call with apiClient...');
      
      const result = await apiClient.post('/auth/login/', {
        username: 'superuser',
        password: 'admin123'
      });
      
      console.log('API result:', result);
      setResponse(`SUCCESS: ${JSON.stringify(result.data, null, 2)}`);
    } catch (error: any) {
      console.error('API error:', error);
      setResponse(`API ERROR: ${error.message} - Status: ${error.response?.status}`);
    }
    
    setLoading(false);
  };

  const testAlternativeCall = async () => {
    setLoading(true);
    setResponse('');
    
    try {
      console.log('Making alternative API call...');
      
      const result = await apiClient.get('/users/');
      
      console.log('Alternative result:', result);
      setResponse(`SUCCESS: ${JSON.stringify(result.data, null, 2)}`);
    } catch (error: any) {
      console.error('Alternative error:', error);
      setResponse(`ALTERNATIVE ERROR: ${error.message} - Status: ${error.response?.status}`);
    }
    
    setLoading(false);
  };

  return (
    <Card title="API Test Component" style={{ margin: '20px' }}>
      <Space direction="vertical" style={{ width: '100%' }}>
        <Title level={4}>Test Login API</Title>
        
        <Space>
          <Button
            type="primary"
            onClick={testDirectAPICall}
            loading={loading}
          >
            Test Login API
          </Button>
          
          <Button
            onClick={testAlternativeCall}
            loading={loading}
          >
            Test Users API
          </Button>
        </Space>
        
        {response && (
          <div>
            <Title level={5}>Response:</Title>
            <Input.TextArea 
              value={response} 
              rows={10} 
              readOnly 
              style={{ fontFamily: 'monospace' }}
            />
          </div>
        )}
      </Space>
    </Card>
  );
};

export default ApiTest;
