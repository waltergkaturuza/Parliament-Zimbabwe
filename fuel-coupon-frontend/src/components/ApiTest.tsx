// src/components/ApiTest.tsx
import { useState } from 'react';
import { Button, Card, Typography, Space, Input } from 'antd';
import axios from 'axios';

const { Title, Text } = Typography;

const ApiTest = () => {
  const [response, setResponse] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testDirectAPICall = async () => {
    setLoading(true);
    setResponse('');
    
    try {
      console.log('Making direct API call...');
      
  const result = await fetch('/api/v1/auth/login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'superuser',
          password: 'admin123'
        })
      });
      
      console.log('Fetch result:', result);
      
      if (result.ok) {
        const data = await result.json();
        setResponse(`SUCCESS: ${JSON.stringify(data, null, 2)}`);
      } else {
        const errorData = await result.text();
        setResponse(`ERROR (${result.status}): ${errorData}`);
      }
    } catch (error) {
      console.error('Fetch error:', error);
      setResponse(`FETCH ERROR: ${error}`);
    }
    
    setLoading(false);
  };

  const testAxiosCall = async () => {
    setLoading(true);
    setResponse('');
    
    try {
      console.log('Making axios API call...');
      
  const result = await axios.post('/api/v1/auth/login/', {
        username: 'superuser',
        password: 'admin123'
      }, {
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      console.log('Axios result:', result);
      setResponse(`SUCCESS: ${JSON.stringify(result.data, null, 2)}`);
    } catch (error: any) {
      console.error('Axios error:', error);
      setResponse(`AXIOS ERROR: ${error.message} - Status: ${error.response?.status}`);
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
            Test with Fetch
          </Button>
          
          <Button 
            onClick={testAxiosCall} 
            loading={loading}
          >
            Test with Axios
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
