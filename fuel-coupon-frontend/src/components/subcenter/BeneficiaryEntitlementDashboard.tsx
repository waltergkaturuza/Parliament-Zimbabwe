import React, { useState } from 'react';
import {
  Card,
  Table,
  Typography,
  Tag,
  Space,
  Progress,
  Button,
  Modal,
  Descriptions,
  Alert,
  Row,
  Col,
  Statistic,
  Tooltip,
  Badge,
} from 'antd';
import {
  UserOutlined,
  FireOutlined,
  CalendarOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
  ThunderboltOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { ColumnsType } from 'antd/es/table';

const { Text, Title } = Typography;

interface EntitlementSource {
  id: string;
  type: 'MONTHLY' | 'SESSION' | 'COMMITTEE' | 'SPECIAL_EVENT' | 'TRAVEL_ALLOWANCE' | 'EMERGENCY' | 'CONSTITUENCY_WORK';
  name: string;
  totalLitres: number;
  usedLitres: number;
  remainingLitres: number;
  period: string;
  status: 'ACTIVE' | 'EXPIRED' | 'USED_UP';
  description?: string;
  expiryDate?: string;
}

interface BeneficiaryEntitlementStatus {
  id: string;
  name: string;
  position: string;
  department: string;
  totalEntitlement: number;
  totalUsed: number;
  totalRemaining: number;
  utilizationRate: number;
  entitlementSources: EntitlementSource[];
  lastAllocation: string;
  status: 'ACTIVE' | 'WARNING' | 'DEPLETED';
}

interface BeneficiaryEntitlementDashboardProps {
  data: BeneficiaryEntitlementStatus[];
  loading?: boolean;
  onAllocate?: (beneficiary: BeneficiaryEntitlementStatus) => void;
}

const BeneficiaryEntitlementDashboard: React.FC<BeneficiaryEntitlementDashboardProps> = ({
  data,
  loading = false,
  onAllocate,
}) => {
  const [selectedBeneficiary, setSelectedBeneficiary] = useState<BeneficiaryEntitlementStatus | null>(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);

  const getSourceTypeColor = (type: EntitlementSource['type']) => {
    switch (type) {
      case 'MONTHLY': return 'blue';
      case 'SESSION': return 'green';
      case 'COMMITTEE': return 'orange';
      case 'SPECIAL_EVENT': return 'purple';
      case 'TRAVEL_ALLOWANCE': return 'cyan';
      case 'EMERGENCY': return 'red';
      case 'CONSTITUENCY_WORK': return 'magenta';
      default: return 'default';
    }
  };

  const getSourceTypeLabel = (type: EntitlementSource['type']) => {
    switch (type) {
      case 'MONTHLY': return 'Monthly';
      case 'SESSION': return 'Session';
      case 'COMMITTEE': return 'Committee';
      case 'SPECIAL_EVENT': return 'Special Event';
      case 'TRAVEL_ALLOWANCE': return 'Travel';
      case 'EMERGENCY': return 'Emergency';
      case 'CONSTITUENCY_WORK': return 'Constituency';
      default: return type;
    }
  };

  const getBeneficiaryStatusColor = (status: BeneficiaryEntitlementStatus['status']) => {
    switch (status) {
      case 'ACTIVE': return 'success';
      case 'WARNING': return 'warning';
      case 'DEPLETED': return 'error';
      default: return 'default';
    }
  };

  const getBeneficiaryStatusIcon = (status: BeneficiaryEntitlementStatus['status']) => {
    switch (status) {
      case 'ACTIVE': return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'WARNING': return <ExclamationCircleOutlined style={{ color: '#faad14' }} />;
      case 'DEPLETED': return <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />;
      default: return <InfoCircleOutlined />;
    }
  };

  const handleViewDetails = (beneficiary: BeneficiaryEntitlementStatus) => {
    setSelectedBeneficiary(beneficiary);
    setDetailsModalVisible(true);
  };

  const columns: ColumnsType<BeneficiaryEntitlementStatus> = [
    {
      title: 'Beneficiary',
      key: 'beneficiary',
      width: 200,
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Space>
            {getBeneficiaryStatusIcon(record.status)}
            <Text strong>{record.name}</Text>
          </Space>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.position}
          </Text>
          <Text type="secondary" style={{ fontSize: '11px' }}>
            {record.department}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Entitlement Summary',
      key: 'summary',
      render: (_, record) => (
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <Row gutter={8}>
            <Col span={8}>
              <Statistic
                title="Total"
                value={record.totalEntitlement}
                suffix="L"
                valueStyle={{ fontSize: '14px', color: '#1890ff' }}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="Used"
                value={record.totalUsed}
                suffix="L"
                valueStyle={{ fontSize: '14px', color: '#ff4d4f' }}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="Remaining"
                value={record.totalRemaining}
                suffix="L"
                valueStyle={{ 
                  fontSize: '14px', 
                  color: record.totalRemaining > 50 ? '#52c41a' : 
                         record.totalRemaining > 20 ? '#faad14' : '#ff4d4f'
                }}
              />
            </Col>
          </Row>
          <Progress 
            percent={record.utilizationRate} 
            size="small"
            status={record.utilizationRate > 90 ? 'exception' : 
                   record.utilizationRate > 70 ? 'active' : 'normal'}
            format={(percent) => `${percent}% used`}
          />
        </Space>
      ),
    },
    {
      title: 'Active Entitlements',
      key: 'entitlements',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          {record.entitlementSources
            .filter(source => source.status === 'ACTIVE' && source.remainingLitres > 0)
            .slice(0, 3)
            .map((source, index) => (
              <Tooltip
                key={index}
                title={`${source.name}: ${source.remainingLitres}L remaining of ${source.totalLitres}L total`}
              >
                <Space size="small">
                  <Tag color={getSourceTypeColor(source.type)}>
                    {getSourceTypeLabel(source.type)}
                  </Tag>
                  <Text style={{ fontSize: '11px' }}>
                    {source.remainingLitres}L
                  </Text>
                </Space>
              </Tooltip>
            ))}
          {record.entitlementSources.filter(s => s.status === 'ACTIVE' && s.remainingLitres > 0).length > 3 && (
            <Text type="secondary" style={{ fontSize: '10px' }}>
              +{record.entitlementSources.filter(s => s.status === 'ACTIVE' && s.remainingLitres > 0).length - 3} more
            </Text>
          )}
        </Space>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      width: 100,
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Badge 
            status={getBeneficiaryStatusColor(record.status)} 
            text={record.status}
          />
          <Text type="secondary" style={{ fontSize: '11px' }}>
            Last: {record.lastAllocation}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <Button
            type="primary"
            size="small"
            icon={<ThunderboltOutlined />}
            onClick={() => onAllocate?.(record)}
            disabled={record.totalRemaining <= 0}
          >
            Allocate
          </Button>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetails(record)}
          >
            Details
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card
        title={
          <Space>
            <UserOutlined />
            Beneficiary Entitlement Status
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} of ${total} beneficiaries`,
            showSizeChanger: true,
            showQuickJumper: true,
          }}
          rowClassName={(record) => {
            if (record.status === 'DEPLETED') return 'row-depleted';
            if (record.status === 'WARNING') return 'row-warning';
            return '';
          }}
        />
      </Card>

      {/* Beneficiary Details Modal */}
      <Modal
        title={
          <Space>
            <UserOutlined />
            Beneficiary Entitlement Details
          </Space>
        }
        open={detailsModalVisible}
        onCancel={() => setDetailsModalVisible(false)}
        width={800}
        footer={[
          <Button key="close" onClick={() => setDetailsModalVisible(false)}>
            Close
          </Button>,
          selectedBeneficiary && selectedBeneficiary.totalRemaining > 0 && (
            <Button
              key="allocate"
              type="primary"
              icon={<ThunderboltOutlined />}
              onClick={() => {
                if (selectedBeneficiary) {
                  onAllocate?.(selectedBeneficiary);
                  setDetailsModalVisible(false);
                }
              }}
            >
              Allocate Fuel
            </Button>
          ),
        ]}
      >
        {selectedBeneficiary && (
          <>
            {/* Beneficiary Overview */}
            <Card size="small" style={{ marginBottom: 16 }}>
              <Descriptions column={2}>
                <Descriptions.Item label="Name">
                  <Space>
                    {getBeneficiaryStatusIcon(selectedBeneficiary.status)}
                    <Text strong>{selectedBeneficiary.name}</Text>
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="Position">
                  {selectedBeneficiary.position}
                </Descriptions.Item>
                <Descriptions.Item label="Department">
                  {selectedBeneficiary.department}
                </Descriptions.Item>
                <Descriptions.Item label="Status">
                  <Badge 
                    status={getBeneficiaryStatusColor(selectedBeneficiary.status)} 
                    text={selectedBeneficiary.status}
                  />
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {/* Entitlement Summary */}
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={6}>
                <Card size="small">
                  <Statistic
                    title="Total Entitlement"
                    value={selectedBeneficiary.totalEntitlement}
                    suffix="L"
                    prefix={<FireOutlined />}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small">
                  <Statistic
                    title="Used"
                    value={selectedBeneficiary.totalUsed}
                    suffix="L"
                    prefix={<CheckCircleOutlined />}
                    valueStyle={{ color: '#ff4d4f' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small">
                  <Statistic
                    title="Remaining"
                    value={selectedBeneficiary.totalRemaining}
                    suffix="L"
                    prefix={<FireOutlined />}
                    valueStyle={{ 
                      color: selectedBeneficiary.totalRemaining > 50 ? '#52c41a' : 
                             selectedBeneficiary.totalRemaining > 20 ? '#faad14' : '#ff4d4f'
                    }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small">
                  <Statistic
                    title="Utilization"
                    value={selectedBeneficiary.utilizationRate}
                    suffix="%"
                    prefix={<CalendarOutlined />}
                    valueStyle={{ 
                      color: selectedBeneficiary.utilizationRate > 90 ? '#ff4d4f' : 
                             selectedBeneficiary.utilizationRate > 70 ? '#faad14' : '#52c41a'
                    }}
                  />
                </Card>
              </Col>
            </Row>

            {/* Detailed Entitlement Sources */}
            <Card
              title="Entitlement Sources"
              size="small"
            >
              <Space direction="vertical" style={{ width: '100%' }} size="small">
                {selectedBeneficiary.entitlementSources.map((source) => (
                  <Card key={source.id} size="small" style={{ backgroundColor: '#fafafa' }}>
                    <Row gutter={16} align="middle">
                      <Col span={14}>
                        <Space direction="vertical" size={0}>
                          <Space>
                            <Tag color={getSourceTypeColor(source.type)}>
                              {getSourceTypeLabel(source.type)}
                            </Tag>
                            <Text strong>{source.name}</Text>
                            <Tag color={source.status === 'ACTIVE' ? 'green' : 
                                      source.status === 'EXPIRED' ? 'red' : 'orange'}>
                              {source.status}
                            </Tag>
                          </Space>
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            {source.description}
                          </Text>
                          <Text type="secondary" style={{ fontSize: '11px' }}>
                            Period: {source.period}
                            {source.expiryDate && ` | Expires: ${source.expiryDate}`}
                          </Text>
                        </Space>
                      </Col>
                      <Col span={6}>
                        <Space direction="vertical" size={0} style={{ width: '100%' }}>
                          <Text style={{ fontSize: '12px' }}>
                            Used: {source.usedLitres}L / {source.totalLitres}L
                          </Text>
                          <Progress 
                            percent={(source.usedLitres / source.totalLitres) * 100}
                            size="small"
                            status={source.status === 'EXPIRED' ? 'exception' : 
                                   source.remainingLitres === 0 ? 'exception' : 'normal'}
                          />
                        </Space>
                      </Col>
                      <Col span={4}>
                        <Statistic
                          title="Available"
                          value={source.remainingLitres}
                          suffix="L"
                          valueStyle={{ 
                            fontSize: '14px',
                            color: source.remainingLitres > 20 ? '#52c41a' : 
                                   source.remainingLitres > 0 ? '#faad14' : '#ff4d4f'
                          }}
                        />
                      </Col>
                    </Row>
                  </Card>
                ))}
              </Space>
            </Card>
          </>
        )}
      </Modal>

      <style>{`
        .row-depleted {
          background-color: #fff2f0 !important;
        }
        .row-warning {
          background-color: #fffbe6 !important;
        }
      `}</style>
    </div>
  );
};

// Demo data for testing
export const demoBeneficiaryEntitlements: BeneficiaryEntitlementStatus[] = [
  {
    id: 'MP001',
    name: 'Hon. John Mukamuri',
    position: 'Member of Parliament',
    department: 'Harare East Constituency',
    totalEntitlement: 380,
    totalUsed: 180,
    totalRemaining: 200,
    utilizationRate: 47,
    lastAllocation: '2025-09-20',
    status: 'ACTIVE',
    entitlementSources: [
      {
        id: '1',
        type: 'MONTHLY',
        name: 'Monthly Entitlement - September 2025',
        totalLitres: 300,
        usedLitres: 180,
        remainingLitres: 120,
        period: 'Sep 2025',
        status: 'ACTIVE',
        description: 'Regular monthly fuel allocation',
      },
      {
        id: '2',
        type: 'SESSION',
        name: 'National Heroes Day Special Session',
        totalLitres: 80,
        usedLitres: 0,
        remainingLitres: 80,
        period: 'Aug 11-15, 2025',
        status: 'ACTIVE',
        description: 'Special allocation for National Heroes Day parliamentary session',
        expiryDate: '2025-12-31',
      },
    ],
  },
  {
    id: 'MP002',
    name: 'Hon. Sarah Chikwanha',
    position: 'Member of Parliament',
    department: 'Bulawayo South Constituency',
    totalEntitlement: 250,
    totalUsed: 200,
    totalRemaining: 50,
    utilizationRate: 80,
    lastAllocation: '2025-09-19',
    status: 'WARNING',
    entitlementSources: [
      {
        id: '3',
        type: 'MONTHLY',
        name: 'Monthly Entitlement - September 2025',
        totalLitres: 200,
        usedLitres: 170,
        remainingLitres: 30,
        period: 'Sep 2025',
        status: 'ACTIVE',
        description: 'Regular monthly fuel allocation',
      },
      {
        id: '4',
        type: 'COMMITTEE',
        name: 'Budget Committee Meetings',
        totalLitres: 50,
        usedLitres: 30,
        remainingLitres: 20,
        period: 'Aug-Sep 2025',
        status: 'ACTIVE',
        description: 'Additional allocation for budget committee participation',
      },
    ],
  },
  {
    id: 'MP003',
    name: 'Hon. Peter Mutindi',
    position: 'Senator',
    department: 'Manicaland Province',
    totalEntitlement: 150,
    totalUsed: 150,
    totalRemaining: 0,
    utilizationRate: 100,
    lastAllocation: '2025-09-18',
    status: 'DEPLETED',
    entitlementSources: [
      {
        id: '5',
        type: 'MONTHLY',
        name: 'Monthly Entitlement - September 2025',
        totalLitres: 150,
        usedLitres: 150,
        remainingLitres: 0,
        period: 'Sep 2025',
        status: 'USED_UP',
        description: 'Regular monthly fuel allocation - fully utilized',
      },
    ],
  },
];

export default BeneficiaryEntitlementDashboard;