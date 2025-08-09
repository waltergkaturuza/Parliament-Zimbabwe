import { useState, useEffect } from 'react';
import type { FC } from 'react';
import { Card, Row, Col, Typography, Statistic, Button, Space, Alert } from 'antd';
import { UserOutlined, CarOutlined, FileTextOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import BeneficiaryAccountDashboard from './components/BeneficiaryAccountDashboard';

const { Title, Text } = Typography;

const BeneficiaryDashboard: FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={1} style={{ marginBottom: 8 }}>
          <UserOutlined style={{ marginRight: 12 }} />
          Beneficiary Account Portal
        </Title>
        <Text type="secondary">
          Welcome back! Manage your fuel allocations, track attendance, and view upcoming events.
        </Text>
      </div>

      <Alert
        message="Account Status: Active"
        description="Your account is active and eligible for fuel allocations. Check your allocations tab for the latest updates."
        type="success"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <BeneficiaryAccountDashboard />
    </div>
  );
};

export default BeneficiaryDashboard;
