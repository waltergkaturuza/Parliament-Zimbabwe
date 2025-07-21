// src/pages/parliament/SubCenterParliamentActivityTest.tsx
import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Typography,
  Row,
  Col,
  Statistic,
  Select,
  DatePicker,
  Spin,
  Badge,
  Tag,
  Progress,
  Timeline,
  Alert,
  Button,
  Space,
  Tooltip,
  App
} from 'antd';
import type { RangePickerProps } from 'antd/es/date-picker';
import {
  TeamOutlined,
  CalendarOutlined,
  CarOutlined,
  BarChartOutlined,
  EyeOutlined,
  EnvironmentOutlined,
  UserOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

interface SubCenterActivity {
  id: string;
  subcenter: {
    name: string;
    code: string;
    location: string;
    manager: string;
  };
  sessions_this_month: number;
  programs_organized: number;
  total_attendance: number;
  fuel_allocated: number;
  last_activity: string;
  status: 'active' | 'inactive' | 'pending';
  compliance_score: number;
  recent_activities: {
    date: string;
    activity: string;
    type: 'session' | 'program' | 'allocation';
  }[];
}

const SubCenterParliamentActivityTest: React.FC = () => {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<SubCenterActivity[]>([]);
  const [stats, setStats] = useState({
    totalSubcenters: 0,
    activeSubcenters: 0,
    totalSessions: 0,
    totalPrograms: 0,
    averageCompliance: 0,
    totalFuelAllocated: 0
  });
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<RangePickerProps['value']>(null);

  useEffect(() => {
    loadTestData();
  }, []);

  const loadTestData = async () => {
    try {
      setLoading(true);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data for subcenter activities
      const mockActivities: SubCenterActivity[] = [
        {
          id: '1',
          subcenter: {
            name: 'Harare Central SubCenter',
            code: 'HAR001',
            location: 'Harare, Zimbabwe',
            manager: 'John Mukamuri'
          },
          sessions_this_month: 12,
          programs_organized: 5,
          total_attendance: 245,
          fuel_allocated: 8750,
          last_activity: '2024-12-28T14:30:00Z',
          status: 'active',
          compliance_score: 94,
          recent_activities: [
            {
              date: '2024-12-28T14:30:00Z',
              activity: 'Parliament Session: Budget Review',
              type: 'session'
            },
            {
              date: '2024-12-27T10:15:00Z',
              activity: 'Fuel Allocation: 450L distributed',
              type: 'allocation'
            }
          ]
        },
        {
          id: '2',
          subcenter: {
            name: 'Bulawayo SubCenter',
            code: 'BUL001',
            location: 'Bulawayo, Zimbabwe',
            manager: 'Mary Chigwamba'
          },
          sessions_this_month: 8,
          programs_organized: 3,
          total_attendance: 156,
          fuel_allocated: 5420,
          last_activity: '2024-12-26T16:45:00Z',
          status: 'active',
          compliance_score: 89,
          recent_activities: [
            {
              date: '2024-12-26T16:45:00Z',
              activity: 'Parliament Session: Provincial Matters',
              type: 'session'
            }
          ]
        }
      ];

      setActivities(mockActivities);
      setStats({
        totalSubcenters: 4,
        activeSubcenters: 3,
        totalSessions: 28,
        totalPrograms: 11,
        averageCompliance: 87,
        totalFuelAllocated: 18920
      });
    } catch (error) {
      console.error('Error loading test data:', error);
      message.error('Failed to load test data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge status="success" text="Active" />;
      case 'pending':
        return <Badge status="warning" text="Pending" />;
      case 'inactive':
        return <Badge status="error" text="Inactive" />;
      default:
        return <Badge status="default" text="Unknown" />;
    }
  };

  const getComplianceColor = (score: number) => {
    if (score >= 90) return '#52c41a';
    if (score >= 75) return '#faad14';
    return '#ff4d4f';
  };

  const columns = [
    {
      title: 'SubCenter',
      dataIndex: 'subcenter',
      key: 'subcenter',
      render: (subcenter: any) => (
        <div>
          <Text strong>{subcenter.name}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            <EnvironmentOutlined /> {subcenter.location}
          </Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            <UserOutlined /> {subcenter.manager}
          </Text>
        </div>
      ),
    },
    {
      title: 'Sessions',
      dataIndex: 'sessions_this_month',
      key: 'sessions',
      align: 'center' as const,
      render: (count: number) => (
        <Statistic value={count} valueStyle={{ fontSize: '14px' }} />
      ),
    },
    {
      title: 'Programs',
      dataIndex: 'programs_organized',
      key: 'programs',
      align: 'center' as const,
      render: (count: number) => (
        <Statistic value={count} valueStyle={{ fontSize: '14px' }} />
      ),
    },
    {
      title: 'Compliance',
      dataIndex: 'compliance_score',
      key: 'compliance',
      align: 'center' as const,
      render: (score: number) => (
        <Progress
          type="circle"
          size={50}
          percent={score}
          strokeColor={getComplianceColor(score)}
          format={(percent) => `${percent}%`}
        />
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      align: 'center' as const,
      render: (status: string) => getStatusBadge(status),
    }
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>Loading subcenter activities...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>
          <TeamOutlined /> SubCenter Parliament Activities (TEST)
        </Title>
        <Text type="secondary">
          Monitor and coordinate parliament operations across all subcenters
        </Text>
      </div>

      <Alert
        message="✅ TEST MODE: Component is working!"
        description="This is a test version of the SubCenter Activities page to verify functionality."
        type="success"
        showIcon
        style={{ marginBottom: '24px' }}
      />

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card>
            <Statistic
              title="Total SubCenters"
              value={stats.totalSubcenters}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card>
            <Statistic
              title="Active SubCenters"
              value={stats.activeSubcenters}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card>
            <Statistic
              title="Total Sessions"
              value={stats.totalSessions}
              prefix={<CalendarOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card>
            <Statistic
              title="Programs"
              value={stats.totalPrograms}
              prefix={<BarChartOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Activities Table */}
      <Card title="SubCenter Activities Overview">
        <Table
          columns={columns}
          dataSource={activities}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          scroll={{ x: 800 }}
        />
      </Card>
    </div>
  );
};

export default SubCenterParliamentActivityTest;
