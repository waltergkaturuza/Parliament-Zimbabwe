// src/pages/test/EnhancedFuelAllocationTest.tsx
import React from 'react';
import { Card, Space, Typography, Divider, Row, Col } from 'antd';
import { FireOutlined, ThunderboltOutlined, UserOutlined } from '@ant-design/icons';
import EnhancedAllocationModal from '../../components/subcenter/EnhancedAllocationModal';
import EnhancedAllocationHistory from '../../components/subcenter/EnhancedAllocationHistory';
import BeneficiaryEntitlementDashboard, { demoBeneficiaryEntitlements } from '../../components/subcenter/BeneficiaryEntitlementDashboard';

const { Title, Text, Paragraph } = Typography;

const EnhancedFuelAllocationTest: React.FC = () => {
  const [allocationModalVisible, setAllocationModalVisible] = React.useState(false);
  const [selectedBeneficiary, setSelectedBeneficiary] = React.useState<any>(null);

  const handleAllocation = (beneficiary: any) => {
    setSelectedBeneficiary(beneficiary);
    setAllocationModalVisible(true);
  };

  const handleAllocationSubmit = async (values: any) => {
    console.log('Allocation submitted:', values);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setAllocationModalVisible(false);
    // Refresh data would happen here
  };

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ textAlign: 'center' }}>
            <Title level={2}>
              <FireOutlined style={{ color: '#1890ff' }} /> Enhanced Fuel Allocation System
            </Title>
            <Paragraph type="secondary">
              Complete fuel allocation system with entitlement tracking, source breakdown, and allocation history
            </Paragraph>
          </div>

          <Divider orientation="left">
            <Space>
              <UserOutlined />
              Beneficiary Entitlement Dashboard
            </Space>
          </Divider>
          
          <Text type="secondary">
            This dashboard shows all beneficiaries with their current entitlement status, 
            remaining balances from different sources (monthly, sessions, special events, etc.), 
            and utilization rates. Staff can easily see who has allocations available and from which sources.
          </Text>

          <Card style={{ backgroundColor: '#fafafa' }}>
            <BeneficiaryEntitlementDashboard
              data={demoBeneficiaryEntitlements}
              loading={false}
              onAllocate={handleAllocation}
            />
          </Card>

          <Divider orientation="left">
            <Space>
              <ThunderboltOutlined />
              Enhanced Allocation History
            </Space>
          </Divider>
          
          <Text type="secondary">
            Complete allocation history with source breakdown showing exactly which entitlements 
            were used for each allocation. Includes summary statistics and detailed allocation messages.
          </Text>

          <Card style={{ backgroundColor: '#fafafa' }}>
            <EnhancedAllocationHistory />
          </Card>

          <Divider orientation="left">System Features</Divider>
          
          <Row gutter={16}>
            <Col span={8}>
              <Card size="small" title="Clear Entitlement Tracking">
                <ul style={{ paddingLeft: '16px', fontSize: '13px' }}>
                  <li>Shows exact source of each allocation</li>
                  <li>"40L from monthly entitlement"</li>
                  <li>"50L from National Heroes Day event"</li>
                  <li>Real-time balance updates</li>
                </ul>
              </Card>
            </Col>
            <Col span={8}>
              <Card size="small" title="Multi-Source Allocation">
                <ul style={{ paddingLeft: '16px', fontSize: '13px' }}>
                  <li>Monthly entitlements</li>
                  <li>Session allowances</li>
                  <li>Committee allocations</li>
                  <li>Special event bonuses</li>
                  <li>Emergency allocations</li>
                </ul>
              </Card>
            </Col>
            <Col span={8}>
              <Card size="small" title="User-Friendly Interface">
                <ul style={{ paddingLeft: '16px', fontSize: '13px' }}>
                  <li>Allocation preview before confirmation</li>
                  <li>Detailed entitlement breakdown</li>
                  <li>Status indicators and warnings</li>
                  <li>Comprehensive history tracking</li>
                </ul>
              </Card>
            </Col>
          </Row>
        </Space>
      </Card>

      {/* Enhanced Allocation Modal */}
      <EnhancedAllocationModal
        visible={allocationModalVisible}
        onCancel={() => setAllocationModalVisible(false)}
        onSubmit={handleAllocationSubmit}
        beneficiary={selectedBeneficiary}
        loading={false}
      />
    </div>
  );
};

export default EnhancedFuelAllocationTest;