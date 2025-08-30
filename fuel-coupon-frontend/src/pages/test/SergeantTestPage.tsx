import React from 'react';
import { Button, Card, Space, Typography, message } from 'antd';
import { sergeantOfArmsAPI } from '@/api/sergeantOfArms';

const { Title, Text } = Typography;

const SergeantTestPage: React.FC = () => {
  const testDashboardAPI = async () => {
    try {
      const data = await sergeantOfArmsAPI.getDashboardStats();
      message.success('Dashboard API working!');
      console.log('Dashboard data:', data);
    } catch (error: any) {
      message.error(`Dashboard API failed: ${error.message}`);
      console.error('Dashboard error:', error);
    }
  };

  const testRegistriesAPI = async () => {
    try {
      const data = await sergeantOfArmsAPI.getAttendanceRegistries();
      message.success('Registries API working!');
      console.log('Registries data:', data);
    } catch (error: any) {
      message.error(`Registries API failed: ${error.message}`);
      console.error('Registries error:', error);
    }
  };

  const testCorrectionsAPI = async () => {
    try {
      const data = await sergeantOfArmsAPI.getAttendanceCorrections();
      message.success('Corrections API working!');
      console.log('Corrections data:', data);
    } catch (error: any) {
      message.error(`Corrections API failed: ${error.message}`);
      console.error('Corrections error:', error);
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>Sergeant of Arms API Test</Title>
      
      <Card title="API Endpoint Tests" style={{ marginTop: '16px' }}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div>
            <Text strong>Dashboard API:</Text>
            <br />
            <Button onClick={testDashboardAPI} type="primary">
              Test Dashboard (/api/sergeant-of-arms/dashboard/)
            </Button>
          </div>
          
          <div>
            <Text strong>Registries API:</Text>
            <br />
            <Button onClick={testRegistriesAPI} type="primary">
              Test Registries (/api/attendance-registries/)
            </Button>
          </div>
          
          <div>
            <Text strong>Corrections API:</Text>
            <br />
            <Button onClick={testCorrectionsAPI} type="primary">
              Test Corrections (/api/attendance-corrections/)
            </Button>
          </div>
        </Space>
      </Card>
      
      <Card title="Implementation Status" style={{ marginTop: '16px' }}>
        <Space direction="vertical">
          <Text>✅ SergeantOfArmsDashboard.tsx - Complete</Text>
          <Text>✅ AttendanceRegistryList.tsx - Complete</Text>
          <Text>✅ AttendanceMarkingPage.tsx - Complete</Text>
          <Text>✅ AttendanceCorrections.tsx - Complete</Text>
          <Text>✅ sergeantOfArms.ts API - Complete</Text>
          <Text>✅ Routes and Navigation - Complete</Text>
          <Text>✅ Role Support - Complete</Text>
        </Space>
      </Card>
    </div>
  );
};

export default SergeantTestPage;
