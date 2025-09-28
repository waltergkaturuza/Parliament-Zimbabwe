// src/components/audit/AuditTrailViewer.tsx
import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Typography,
  Steps,
  Timeline,
  Table,
  Tag,
  Space,
  Button,
  Input,
  Select,
  Statistic,
  Alert,
  Badge,
  Tooltip,
  Collapse,
  Descriptions,
  Progress,
  message,
} from 'antd';
import {
  SearchOutlined,
  SwapOutlined,
  SendOutlined,
  InboxOutlined,
  UserOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
  ReloadOutlined,
  FileTextOutlined,
  BranchesOutlined,
} from '@ant-design/icons';
import { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import apiClient from '@/api';
import CouponTrackingTable from './CouponTrackingTable';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;
const { Panel } = Collapse;
const { Step } = Steps;

interface AuditTrailStep {
  id: string;
  step_type: 'DISPATCH' | 'HANDOVER' | 'ALLOCATION' | 'USAGE';
  title: string;
  description: string;
  timestamp: string;
  status: 'COMPLETED' | 'PENDING' | 'FAILED';
  actor: string;
  location: string;
  coupon_count: number;
  individual_coupons: string[]; // Array of serial numbers
  metadata: {
    dispatch_id?: string;
    handover_id?: string;
    beneficiary_id?: string;
    station_id?: string;
    [key: string]: any;
  };
}

interface FullAuditTrail {
  id: string;
  trail_type: 'DISPATCH_TO_BENEFICIARY' | 'BOOK_LIFECYCLE' | 'COUPON_JOURNEY';
  title: string;
  start_date: string;
  end_date?: string;
  total_coupons: number;
  completed_coupons: number;
  current_status: 'IN_PROGRESS' | 'COMPLETED' | 'PARTIAL' | 'FAILED';
  
  // Chain tracking
  main_center: string;
  sub_center?: string;
  beneficiaries: Array<{
    id: string;
    name: string;
    allocated_coupons: number;
    used_coupons: number;
  }>;
  
  steps: AuditTrailStep[];
  
  // Summary stats
  completion_percentage: number;
  days_elapsed: number;
  bottleneck_step?: string;
}

interface AuditTrailViewerProps {
  trailId?: string;
  filterBy?: {
    center?: string;
    beneficiary?: string;
    dateRange?: [string, string];
  };
  viewMode?: 'timeline' | 'steps' | 'table';
  showCouponDetails?: boolean;
}

const AuditTrailViewer: React.FC<AuditTrailViewerProps> = ({
  trailId,
  filterBy = {},
  viewMode = 'timeline',
  showCouponDetails = true,
}) => {
  const [auditTrails, setAuditTrails] = useState<FullAuditTrail[]>([]);
  const [selectedTrail, setSelectedTrail] = useState<FullAuditTrail | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [activeViewMode, setActiveViewMode] = useState(viewMode);
  const [selectedStep, setSelectedStep] = useState<AuditTrailStep | null>(null);

  useEffect(() => {
    fetchAuditTrails();
  }, [trailId, filterBy]);

  const fetchAuditTrails = async () => {
    setLoading(true);
    try {
      console.log('🔍 Fetching audit trails...');
      
      const params: any = {};
      if (trailId) params.trail_id = trailId;
      if (filterBy.center) params.center = filterBy.center;
      if (filterBy.beneficiary) params.beneficiary = filterBy.beneficiary;
      if (filterBy.dateRange) {
        params.start_date = filterBy.dateRange[0];
        params.end_date = filterBy.dateRange[1];
      }
      
      const response = await apiClient.get('/audit/trails/', { params });
      const trailData = response.data.results || response.data || [];
      
      console.log('📋 Audit trails loaded:', trailData.length);
      setAuditTrails(trailData);
      
      if (trailId && trailData.length > 0) {
        setSelectedTrail(trailData.find((t: FullAuditTrail) => t.id === trailId) || trailData[0]);
      }
      
    } catch (error) {
      console.error('Error fetching audit trails:', error);
      message.error('Failed to load audit trail data');
    } finally {
      setLoading(false);
    }
  };

  const getStepStatus = (step: AuditTrailStep) => {
    switch (step.status) {
      case 'COMPLETED': return 'finish';
      case 'PENDING': return 'process';
      case 'FAILED': return 'error';
      default: return 'wait';
    }
  };

  const getStepIcon = (stepType: string) => {
    switch (stepType) {
      case 'DISPATCH': return <SendOutlined />;
      case 'HANDOVER': return <SwapOutlined />;
      case 'ALLOCATION': return <UserOutlined />;
      case 'USAGE': return <CheckCircleOutlined />;
      default: return <FileTextOutlined />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'success';
      case 'IN_PROGRESS': return 'processing';
      case 'PARTIAL': return 'warning';
      case 'FAILED': return 'error';
      default: return 'default';
    }
  };

  const renderTimelineView = (trail: FullAuditTrail) => {
    return (
      <Card title="Audit Trail Timeline" extra={
        <Space>
          <Badge status={getStatusColor(trail.current_status)} text={trail.current_status} />
          <Text type="secondary">{trail.days_elapsed} days</Text>
        </Space>
      }>
        <Timeline>
          {trail.steps.map((step, index) => (
            <Timeline.Item
              key={step.id}
              dot={getStepIcon(step.step_type)}
              color={step.status === 'COMPLETED' ? 'green' : step.status === 'PENDING' ? 'blue' : 'red'}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <Text strong>{step.title}</Text>
                    <br />
                    <Text type="secondary">{step.description}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {dayjs(step.timestamp).format('MMMM DD, YYYY HH:mm')} • {step.actor} • {step.location}
                    </Text>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <Tag color={step.status === 'COMPLETED' ? 'green' : step.status === 'PENDING' ? 'blue' : 'red'}>
                      {step.status}
                    </Tag>
                    <br />
                    <Text strong style={{ fontSize: '14px' }}>
                      {step.coupon_count.toLocaleString()} coupons
                    </Text>
                  </div>
                </div>
                
                {showCouponDetails && step.individual_coupons.length > 0 && (
                  <div style={{ marginTop: 12, padding: 8, backgroundColor: '#f5f5f5', borderRadius: 4 }}>
                    <Text type="secondary" style={{ fontSize: '11px' }}>
                      Sample serial numbers: {step.individual_coupons.slice(0, 3).join(', ')}
                      {step.individual_coupons.length > 3 && ` ... and ${step.individual_coupons.length - 3} more`}
                    </Text>
                    <br />
                    <Button 
                      type="link" 
                      size="small" 
                      onClick={() => setSelectedStep(step)}
                      style={{ padding: 0, fontSize: '11px' }}
                    >
                      View all {step.coupon_count} coupons
                    </Button>
                  </div>
                )}
              </div>
            </Timeline.Item>
          ))}
        </Timeline>
      </Card>
    );
  };

  const renderStepsView = (trail: FullAuditTrail) => {
    const currentStep = trail.steps.findIndex(step => step.status === 'PENDING');
    
    return (
      <Card title="Process Steps">
        <Steps
          current={currentStep >= 0 ? currentStep : trail.steps.length - 1}
          status={trail.current_status === 'FAILED' ? 'error' : undefined}
        >
          {trail.steps.map((step, index) => (
            <Step
              key={step.id}
              title={step.title}
              description={
                <div>
                  <div>{step.description}</div>
                  <div style={{ fontSize: '12px', color: '#666', marginTop: 4 }}>
                    {step.coupon_count} coupons • {dayjs(step.timestamp).format('MMM DD, HH:mm')}
                  </div>
                </div>
              }
              status={getStepStatus(step)}
              icon={getStepIcon(step.step_type)}
            />
          ))}
        </Steps>
        
        <div style={{ marginTop: 24 }}>
          <Progress 
            percent={trail.completion_percentage} 
            status={trail.current_status === 'FAILED' ? 'exception' : 'normal'}
            format={percent => `${percent}% Complete`}
          />
        </div>
      </Card>
    );
  };

  const renderTableView = (trail: FullAuditTrail) => {
    const columns: ColumnsType<AuditTrailStep> = [
      {
        title: 'Step',
        dataIndex: 'step_type',
        key: 'step_type',
        render: (type, record) => (
          <div>
            <Space>
              {getStepIcon(type)}
              <Text strong>{record.title}</Text>
            </Space>
          </div>
        ),
      },
      {
        title: 'Description',
        dataIndex: 'description',
        key: 'description',
      },
      {
        title: 'Timestamp',
        dataIndex: 'timestamp',
        key: 'timestamp',
        render: (timestamp) => dayjs(timestamp).format('MMM DD, YYYY HH:mm'),
      },
      {
        title: 'Actor/Location',
        key: 'actor_location',
        render: (_, record) => (
          <div>
            <Text>{record.actor}</Text>
            <br />
            <Text type="secondary">{record.location}</Text>
          </div>
        ),
      },
      {
        title: 'Coupons',
        dataIndex: 'coupon_count',
        key: 'coupon_count',
        render: (count) => <Text strong>{count.toLocaleString()}</Text>,
      },
      {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        render: (status) => (
          <Tag color={status === 'COMPLETED' ? 'green' : status === 'PENDING' ? 'blue' : 'red'}>
            {status}
          </Tag>
        ),
      },
      {
        title: 'Actions',
        key: 'actions',
        render: (_, record) => (
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => setSelectedStep(record)}
          >
            Details
          </Button>
        ),
      },
    ];

    return (
      <Card title="Audit Steps Table">
        <Table
          columns={columns}
          dataSource={trail.steps}
          rowKey="id"
          size="small"
          pagination={false}
        />
      </Card>
    );
  };

  const renderTrailSummary = (trail: FullAuditTrail) => {
    return (
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Total Coupons"
              value={trail.total_coupons}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Completed"
              value={trail.completed_coupons}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Progress"
              value={trail.completion_percentage}
              suffix="%"
              prefix={<BranchesOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Days Active"
              value={trail.days_elapsed}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        
        <Col span={24}>
          <Card title="Chain Summary">
            <Descriptions bordered column={3} size="small">
              <Descriptions.Item label="Main Center">{trail.main_center}</Descriptions.Item>
              <Descriptions.Item label="Sub Center">{trail.sub_center || 'N/A'}</Descriptions.Item>
              <Descriptions.Item label="Status">
                <Badge status={getStatusColor(trail.current_status)} text={trail.current_status} />
              </Descriptions.Item>
              <Descriptions.Item label="Start Date">
                {dayjs(trail.start_date).format('MMMM DD, YYYY')}
              </Descriptions.Item>
              <Descriptions.Item label="End Date">
                {trail.end_date ? dayjs(trail.end_date).format('MMMM DD, YYYY') : 'In Progress'}
              </Descriptions.Item>
              <Descriptions.Item label="Beneficiaries">
                {trail.beneficiaries.length} members
              </Descriptions.Item>
            </Descriptions>
            
            {trail.beneficiaries.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <Text strong>Beneficiary Summary:</Text>
                <div style={{ marginTop: 8 }}>
                  {trail.beneficiaries.map(beneficiary => (
                    <Tag key={beneficiary.id} style={{ margin: '2px' }}>
                      {beneficiary.name}: {beneficiary.allocated_coupons} allocated, {beneficiary.used_coupons} used
                    </Tag>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </Col>
      </Row>
    );
  };

  const trailColumns: ColumnsType<FullAuditTrail> = [
    {
      title: 'Trail ID',
      dataIndex: 'id',
      key: 'id',
      render: (id, record) => (
        <div>
          <Text strong>{id}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '11px' }}>{record.trail_type}</Text>
        </div>
      ),
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: 'Chain',
      key: 'chain',
      render: (_, record) => (
        <div>
          <Text>{record.main_center}</Text>
          {record.sub_center && (
            <>
              <br />
              <SwapOutlined style={{ fontSize: '10px', color: '#666' }} />
              <Text type="secondary"> {record.sub_center}</Text>
            </>
          )}
        </div>
      ),
    },
    {
      title: 'Progress',
      key: 'progress',
      render: (_, record) => (
        <div>
          <Progress 
            percent={record.completion_percentage} 
            size="small"
            status={record.current_status === 'FAILED' ? 'exception' : 'normal'}
          />
          <Text type="secondary" style={{ fontSize: '11px' }}>
            {record.completed_coupons}/{record.total_coupons} coupons
          </Text>
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'current_status',
      key: 'current_status',
      render: (status) => (
        <Badge status={getStatusColor(status)} text={status} />
      ),
    },
    {
      title: 'Duration',
      dataIndex: 'days_elapsed',
      key: 'days_elapsed',
      render: (days) => `${days} days`,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          onClick={() => setSelectedTrail(record)}
        >
          View Details
        </Button>
      ),
    },
  ];

  if (!selectedTrail && auditTrails.length === 0) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          {loading ? (
            <div>
              <ClockCircleOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
              <br />
              <Text>Loading audit trails...</Text>
            </div>
          ) : (
            <div>
              <ExclamationCircleOutlined style={{ fontSize: '48px', color: '#faad14' }} />
              <br />
              <Text>No audit trails found</Text>
              <br />
              <Button type="primary" icon={<ReloadOutlined />} onClick={fetchAuditTrails}>
                Refresh
              </Button>
            </div>
          )}
        </div>
      </Card>
    );
  }

  if (!selectedTrail) {
    return (
      <div>
        <Card title="Audit Trails" extra={
          <Space>
            <Search
              placeholder="Search trails..."
              allowClear
              style={{ width: 200 }}
              onChange={(e) => setSearchText(e.target.value)}
            />
            <Button icon={<ReloadOutlined />} onClick={fetchAuditTrails} loading={loading}>
              Refresh
            </Button>
          </Space>
        }>
          <Table
            columns={trailColumns}
            dataSource={auditTrails.filter(trail => 
              !searchText || 
              (trail.title && trail.title.toString().toLowerCase().includes(searchText.toLowerCase())) ||
              (trail.main_center && trail.main_center.toString().toLowerCase().includes(searchText.toLowerCase()))
            )}
            rowKey="id"
            loading={loading}
            size="small"
          />
        </Card>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Title level={4} style={{ margin: 0 }}>{selectedTrail.title}</Title>
            <Text type="secondary">Audit Trail: {selectedTrail.id}</Text>
          </div>
          <Space>
            <Select value={activeViewMode} onChange={setActiveViewMode} style={{ width: 120 }}>
              <Option value="timeline">Timeline</Option>
              <Option value="steps">Steps</Option>
              <Option value="table">Table</Option>
            </Select>
            <Button onClick={() => setSelectedTrail(null)}>Back to List</Button>
            <Button icon={<ReloadOutlined />} onClick={fetchAuditTrails} loading={loading}>
              Refresh
            </Button>
          </Space>
        </div>
      </Card>

      {/* Summary Stats */}
      {renderTrailSummary(selectedTrail)}

      <div style={{ marginTop: 16 }}>
        {/* Main Content */}
        {activeViewMode === 'timeline' && renderTimelineView(selectedTrail)}
        {activeViewMode === 'steps' && renderStepsView(selectedTrail)}
        {activeViewMode === 'table' && renderTableView(selectedTrail)}
      </div>

      {/* Step Details Modal */}
      {selectedStep && (
        <Collapse style={{ marginTop: 16 }} defaultActiveKey={['coupons']}>
          <Panel header={`${selectedStep.title} - Coupon Details`} key="coupons">
            <CouponTrackingTable
              filter={{
                dispatch_id: selectedStep.metadata.dispatch_id,
                status: selectedStep.status === 'COMPLETED' ? 'RECEIVED' : 'DISPATCHED'
              }}
              showStats={false}
              showSearch={true}
              showFilters={false}
              maxHeight={400}
            />
          </Panel>
        </Collapse>
      )}
    </div>
  );
};

export default AuditTrailViewer;