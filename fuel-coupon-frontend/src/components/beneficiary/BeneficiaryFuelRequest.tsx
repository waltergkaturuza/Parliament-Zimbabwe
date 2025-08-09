// src/components/beneficiary/BeneficiaryFuelRequest.tsx
import React from 'react';
import { Card, Typography, Alert } from 'antd';

const { Title } = Typography;

const BeneficiaryFuelRequest: React.FC = () => {
  return (
    <Card>
      <Title level={3}>Fuel Request Service</Title>
      <Alert
        message="Feature Coming Soon"
        description="The beneficiary fuel request functionality is currently under development."
        type="info"
        showIcon
      />
    </Card>
  );
};

export default BeneficiaryFuelRequest;
