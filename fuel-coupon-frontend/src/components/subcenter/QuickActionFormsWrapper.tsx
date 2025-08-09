// src/components/subcenter/QuickActionFormsWrapper.tsx
import React, { useState } from 'react';
import {
  Card,
  Button,
  Row,
  Col,
  Typography,
  Space,
} from 'antd';
import {
  BookOutlined,
  CarOutlined,
  CheckCircleOutlined,
  AlertOutlined,
  ToolOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import QuickActionForms from './QuickActionForms';

const { Title } = Typography;

const QuickActionFormsWrapper: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [actionType, setActionType] = useState<'request_books' | 'distribute_coupons' | 'process_handover' | 'emergency_request' | 'maintenance_report' | 'inventory_update' | null>(null);

  const handleActionClick = (type: typeof actionType) => {
    setActionType(type);
    setVisible(true);
  };

  const handleClose = () => {
    setVisible(false);
    setActionType(null);
  };

  const handleSubmit = async (data: any) => {
    console.log('Quick action submitted:', data);
    handleClose();
  };

  const actions = [
    {
      key: 'request_books',
      title: 'Request Books',
      description: 'Request additional coupon books from main center',
      icon: <BookOutlined />,
      color: '#1890ff',
    },
    {
      key: 'distribute_coupons',
      title: 'Distribute Coupons',
      description: 'Record coupon distribution to beneficiaries',
      icon: <CarOutlined />,
      color: '#52c41a',
    },
    {
      key: 'process_handover',
      title: 'Process Handover',
      description: 'Process handover of fuel allocations',
      icon: <CheckCircleOutlined />,
      color: '#722ed1',
    },
    {
      key: 'emergency_request',
      title: 'Emergency Request',
      description: 'Submit urgent fuel allocation request',
      icon: <AlertOutlined />,
      color: '#ff4d4f',
    },
    {
      key: 'maintenance_report',
      title: 'Maintenance Report',
      description: 'Report system or vehicle maintenance issues',
      icon: <ToolOutlined />,
      color: '#fa8c16',
    },
    {
      key: 'inventory_update',
      title: 'Inventory Update',
      description: 'Update current inventory status',
      icon: <FileTextOutlined />,
      color: '#13c2c2',
    },
  ];

  return (
    <div>
      <Title level={4} style={{ marginBottom: 24 }}>
        Quick Actions
      </Title>
      
      <Row gutter={[16, 16]}>
        {actions.map((action) => (
          <Col xs={24} sm={12} md={8} key={action.key}>
            <Card
              hoverable
              style={{ height: '100%' }}
              onClick={() => handleActionClick(action.key as any)}
            >
              <Space direction="vertical" style={{ width: '100%' }}>
                <div style={{ fontSize: '24px', color: action.color }}>
                  {action.icon}
                </div>
                <Title level={5} style={{ margin: 0 }}>
                  {action.title}
                </Title>
                <div style={{ color: '#666', fontSize: '14px' }}>
                  {action.description}
                </div>
              </Space>
            </Card>
          </Col>
        ))}
      </Row>

      {visible && actionType && (
        <QuickActionForms
          visible={visible}
          actionType={actionType}
          onClose={handleClose}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
};

export default QuickActionFormsWrapper;
