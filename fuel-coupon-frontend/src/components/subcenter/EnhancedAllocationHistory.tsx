import React from 'react';
import {
  Card,
  Table,
  Typography,
  Tag,
  Space,
  Progress,
  Tooltip,
  Badge,
  Descriptions,
  Alert,
  Row,
  Col,
  Statistic,
} from 'antd';
import {
  CalendarOutlined,
  UserOutlined,
  FireOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Text, Title } = Typography;

interface AllocationHistoryItem {
  id: string;
  date: string;
  beneficiaryName: string;
  beneficiaryId: string;
  allocationSources: Array<{
    sourceId: string;
    sourceName: string;
    sourceType: 'MONTHLY' | 'SESSION' | 'COMMITTEE' | 'SPECIAL_EVENT' | 'TRAVEL_ALLOWANCE' | 'EMERGENCY' | 'CONSTITUENCY_WORK';
    allocatedLitres: number;
    remainingAfter: number;
  }>;
  totalAllocated: number;
  allocationMessage: string;
  purpose: string;
  notes?: string;
  status: 'ALLOCATED' | 'PARTIALLY_USED' | 'USED' | 'EXPIRED';
  allocatedBy: string;
}

interface EnhancedAllocationHistoryProps {
  data: AllocationHistoryItem[];
  loading?: boolean;
}

const EnhancedAllocationHistory: React.FC<EnhancedAllocationHistoryProps> = ({
  data,
  loading = false,
}) => {
  const getSourceTypeColor = (type: AllocationHistoryItem['allocationSources'][0]['sourceType']) => {
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

  const getSourceTypeLabel = (type: AllocationHistoryItem['allocationSources'][0]['sourceType']) => {
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

  const getStatusColor = (status: AllocationHistoryItem['status']) => {
    switch (status) {
      case 'ALLOCATED': return 'blue';
      case 'PARTIALLY_USED': return 'orange';
      case 'USED': return 'green';
      case 'EXPIRED': return 'red';
      default: return 'default';
    }
  };

  const columns = [
    {
      title: 'Date & Beneficiary',
      key: 'beneficiary',
      width: 200,
      render: (_, record: AllocationHistoryItem) => (
        <Space direction="vertical" size={0}>
          <Text strong>{record.beneficiaryName}</Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            <CalendarOutlined /> {dayjs(record.date).format('MMM DD, YYYY')}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Allocation Details',
      key: 'allocation',
      render: (_, record: AllocationHistoryItem) => (
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <Alert
            message={`${record.totalAllocated}L allocated`}
            description={record.allocationMessage}
            type="info"
            showIcon
            icon={<FireOutlined />}
            style={{ marginBottom: 8 }}
          />
          
          {record.allocationSources.length > 1 ? (
            <Card size="small" style={{ backgroundColor: '#fafafa' }}>
              <Title level={5} style={{ margin: 0, marginBottom: 8 }}>Source Breakdown:</Title>
              {record.allocationSources.map((source, index) => (
                <div key={index} style={{ marginBottom: 4 }}>
                  <Space>
                    <Tag color={getSourceTypeColor(source.sourceType)}>
                      {getSourceTypeLabel(source.sourceType)}
                    </Tag>
                    <Text style={{ fontSize: '12px' }}>
                      {source.allocatedLitres}L from "{source.sourceName}"
                    </Text>
                    <Text type="secondary" style={{ fontSize: '11px' }}>
                      (remaining: {source.remainingAfter}L)
                    </Text>
                  </Space>
                </div>
              ))}
            </Card>
          ) : record.allocationSources.length === 1 ? (
            <Space>
              <Tag color={getSourceTypeColor(record.allocationSources[0].sourceType)}>
                {getSourceTypeLabel(record.allocationSources[0].sourceType)}
              </Tag>
              <Text style={{ fontSize: '12px' }}>
                from "{record.allocationSources[0].sourceName}"
              </Text>
            </Space>
          ) : null}
        </Space>
      ),
    },
    {
      title: 'Purpose & Status',
      key: 'purpose',
      width: 150,
      render: (_, record: AllocationHistoryItem) => (
        <Space direction="vertical" size={0}>
          <Text style={{ fontSize: '12px' }}>{record.purpose}</Text>
          <Tag color={getStatusColor(record.status)}>
            {record.status.replace('_', ' ')}
          </Tag>
          <Text type="secondary" style={{ fontSize: '11px' }}>
            by {record.allocatedBy}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Usage',
      key: 'usage',
      width: 100,
      render: (_, record: AllocationHistoryItem) => {
        // Mock usage calculation - in real app, this would come from the backend
        const usedPercentage = record.status === 'USED' ? 100 : 
                              record.status === 'PARTIALLY_USED' ? 60 : 0;
        return (
          <Space direction="vertical" size={0}>
            <Progress 
              percent={usedPercentage} 
              size="small" 
              status={record.status === 'EXPIRED' ? 'exception' : 'normal'}
            />
            <Text style={{ fontSize: '11px' }}>
              {usedPercentage}% used
            </Text>
          </Space>
        );
      },
    },
  ];

  // Calculate summary statistics
  const totalAllocations = data.length;
  const totalLitres = data.reduce((sum, item) => sum + item.totalAllocated, 0);
  const monthlyAllocations = data.filter(item => 
    item.allocationSources.some(source => source.sourceType === 'MONTHLY')
  ).length;
  const specialAllocations = totalAllocations - monthlyAllocations;

  return (
    <div>
      {/* Summary Statistics */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="Total Allocations"
              value={totalAllocations}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="Total Litres"
              value={totalLitres}
              suffix="L"
              prefix={<FireOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="Monthly Allocations"
              value={monthlyAllocations}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="Special Allocations"
              value={specialAllocations}
              prefix={<ExclamationCircleOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Allocation History Table */}
      <Card
        title={
          <Space>
            <InfoCircleOutlined />
            Enhanced Allocation History
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
              `${range[0]}-${range[1]} of ${total} enhanced allocations`,
            showSizeChanger: true,
            showQuickJumper: true,
          }}
          expandable={{
            expandedRowRender: (record) => (
              <Card size="small" style={{ backgroundColor: '#f9f9f9' }}>
                <Descriptions size="small" column={2}>
                  <Descriptions.Item label="Allocation ID">
                    {record.id}
                  </Descriptions.Item>
                  <Descriptions.Item label="Total Allocated">
                    {record.totalAllocated}L
                  </Descriptions.Item>
                  <Descriptions.Item label="Purpose">
                    {record.purpose}
                  </Descriptions.Item>
                  <Descriptions.Item label="Status">
                    <Badge 
                      status={getStatusColor(record.status) as any} 
                      text={record.status.replace('_', ' ')} 
                    />
                  </Descriptions.Item>
                  {record.notes && (
                    <Descriptions.Item label="Notes" span={2}>
                      {record.notes}
                    </Descriptions.Item>
                  )}
                </Descriptions>
                
                {record.allocationSources.length > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <Title level={5}>Entitlement Sources Used:</Title>
                    {record.allocationSources.map((source, index) => (
                      <Alert
                        key={index}
                        message={
                          <Space>
                            <Tag color={getSourceTypeColor(source.sourceType)}>
                              {getSourceTypeLabel(source.sourceType)}
                            </Tag>
                            <Text>{source.sourceName}</Text>
                          </Space>
                        }
                        description={
                          <Text>
                            Allocated: {source.allocatedLitres}L | 
                            Remaining after allocation: {source.remainingAfter}L
                          </Text>
                        }
                        type="info"
                        style={{ marginBottom: 8 }}
                      />
                    ))}
                  </div>
                )}
              </Card>
            ),
            rowExpandable: () => true,
          }}
        />
      </Card>
    </div>
  );
};

// Demo data for testing
export const demoAllocationHistory: AllocationHistoryItem[] = [
  {
    id: 'ENHANCED_ALLOC001',
    date: '2025-09-21',
    beneficiaryName: 'Hon. John Mukamuri',
    beneficiaryId: 'MP001',
    allocationSources: [
      {
        sourceId: '1',
        sourceName: 'Monthly Entitlement - September 2025',
        sourceType: 'MONTHLY',
        allocatedLitres: 40,
        remainingAfter: 80,
      },
    ],
    totalAllocated: 40,
    allocationMessage: 'Allocated 40L from "Monthly Entitlement - September 2025". Remaining balance: 80L',
    purpose: 'Monthly Usage',
    notes: 'Regular monthly fuel allocation',
    status: 'ALLOCATED',
    allocatedBy: 'SubCenter Officer',
  },
  {
    id: 'ENHANCED_ALLOC002',
    date: '2025-09-20',
    beneficiaryName: 'Hon. Sarah Chikwanha',
    beneficiaryId: 'MP002',
    allocationSources: [
      {
        sourceId: '2',
        sourceName: 'National Heroes Day Special Session',
        sourceType: 'SESSION',
        allocatedLitres: 50,
        remainingAfter: 30,
      },
    ],
    totalAllocated: 50,
    allocationMessage: 'Allocated 50L from "National Heroes Day Special Session". Remaining balance: 30L',
    purpose: 'Session Attendance',
    notes: 'Special allocation for National Heroes Day parliamentary session',
    status: 'PARTIALLY_USED',
    allocatedBy: 'SubCenter Officer',
  },
  {
    id: 'ENHANCED_ALLOC003',
    date: '2025-09-19',
    beneficiaryName: 'Hon. Peter Mutindi',
    beneficiaryId: 'MP003',
    allocationSources: [
      {
        sourceId: '1',
        sourceName: 'Monthly Entitlement - September 2025',
        sourceType: 'MONTHLY',
        allocatedLitres: 20,
        remainingAfter: 100,
      },
      {
        sourceId: '3',
        sourceName: 'Budget Committee Meetings',
        sourceType: 'COMMITTEE',
        allocatedLitres: 30,
        remainingAfter: 0,
      },
    ],
    totalAllocated: 50,
    allocationMessage: 'Allocated from multiple sources: 20L from "Monthly Entitlement - September 2025" (100L remaining); 30L from "Budget Committee Meetings" (0L remaining)',
    purpose: 'Committee Meeting',
    notes: 'Mixed allocation from monthly and committee entitlements',
    status: 'USED',
    allocatedBy: 'SubCenter Officer',
  },
];

export default EnhancedAllocationHistory;