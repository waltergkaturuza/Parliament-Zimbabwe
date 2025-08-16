// src/pages/beneficiary/MySessionsPage.tsx
import { useState, useEffect } from 'react';
import type { FC } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Spin,
  Typography,
  Row,
  Col,
  Statistic,
  Alert,
  Tooltip,
  Modal,
  Descriptions,
  Badge
} from 'antd';
import {
  CalendarOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  UserOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import apiClient from '../../api';
import type { ParliamentSession } from '../../types';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

interface SessionStats {
  totalAssigned: number;
  upcomingSessions: number;
  completedSessions: number;
  missedSessions: number;
}

const MySessionsPage: FC = () => {
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<ParliamentSession[]>([]);
  const [stats, setStats] = useState<SessionStats>({
    totalAssigned: 0,
    upcomingSessions: 0,
    completedSessions: 0,
    missedSessions: 0
  });
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [viewingSession, setViewingSession] = useState<ParliamentSession | null>(null);

  useEffect(() => {
    loadMySessions();
  }, []);

  const loadMySessions = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/parliament-sessions/my_sessions/');
      const sessionData = response.data.results || [];
      setSessions(sessionData);

      // Calculate stats
      const now = dayjs();
      const newStats: SessionStats = {
        totalAssigned: sessionData.length,
        upcomingSessions: sessionData.filter((s: ParliamentSession) => 
          dayjs(s.start_date).isAfter(now) && s.is_active
        ).length,
        completedSessions: sessionData.filter((s: ParliamentSession) => 
          dayjs(s.end_date).isBefore(now)
        ).length,
        missedSessions: 0 // Would need attendance tracking to calculate this
      };
      setStats(newStats);
    } catch (error: any) {
      console.error('Error loading my sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (session: ParliamentSession) => {
    setViewingSession(session);
    setDetailModalVisible(true);
  };

  const getSessionStatus = (session: ParliamentSession) => {
    const now = dayjs();
    const start = dayjs(session.start_date);
    const end = dayjs(session.end_date);

    if (!session.is_active) {
      return <Tag color="default">Cancelled</Tag>;
    }

    if (start.isAfter(now)) {
      return <Tag color="blue">Upcoming</Tag>;
    } else if (start.isBefore(now) && end.isAfter(now)) {
      return <Tag color="green">In Progress</Tag>;
    } else {
      return <Tag color="default">Completed</Tag>;
    }
  };

  const getSessionPriority = (session: ParliamentSession) => {
    if (session.is_mandatory) {
      return <Tag color="red" icon={<ExclamationCircleOutlined />}>Mandatory</Tag>;
    }
    return <Tag color="blue">Optional</Tag>;
  };

  const columns = [
    {
      title: 'Session Details',
      key: 'details',
      render: (_: any, record: ParliamentSession) => (
        <div>
          <Text strong className="block">{record.title}</Text>
          <Text type="secondary" className="text-sm block">
            {record.session_type_display || record.session_type}
          </Text>
          <div className="mt-1">
            {getSessionPriority(record)}
          </div>
        </div>
      ),
    },
    {
      title: 'Date & Time',
      key: 'datetime',
      sorter: (a: ParliamentSession, b: ParliamentSession) => 
        dayjs(a.start_date).unix() - dayjs(b.start_date).unix(),
      render: (_: any, record: ParliamentSession) => (
        <div>
          <div className="flex items-center mb-1">
            <CalendarOutlined className="mr-1" />
            <Text>{dayjs(record.start_date).format('MMM DD, YYYY')}</Text>
          </div>
          {record.start_time && record.end_time && (
            <div className="flex items-center">
              <ClockCircleOutlined className="mr-1" />
              <Text type="secondary" className="text-sm">
                {dayjs(record.start_time, 'HH:mm:ss').format('HH:mm')} - {dayjs(record.end_time, 'HH:mm:ss').format('HH:mm')}
              </Text>
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Location',
      dataIndex: 'venue',
      key: 'venue',
      render: (venue: string) => (
        <div className="flex items-center">
          <EnvironmentOutlined className="mr-1" />
          <Text>{venue || 'Parliament Building'}</Text>
        </div>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      filters: [
        { text: 'Upcoming', value: 'upcoming' },
        { text: 'In Progress', value: 'active' },
        { text: 'Completed', value: 'completed' },
        { text: 'Cancelled', value: 'cancelled' },
      ],
      onFilter: (value: any, record: ParliamentSession) => {
        const now = dayjs();
        const start = dayjs(record.start_date);
        const end = dayjs(record.end_date);
        
        if (value === 'upcoming') return start.isAfter(now) && record.is_active;
        if (value === 'active') return start.isBefore(now) && end.isAfter(now) && record.is_active;
        if (value === 'completed') return end.isBefore(now);
        if (value === 'cancelled') return !record.is_active;
        return true;
      },
      render: (_: any, record: ParliamentSession) => getSessionStatus(record),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: ParliamentSession) => (
        <Space>
          <Tooltip title="View Details">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleViewDetails(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <Title level={2} className="mb-6">My Parliament Sessions</Title>

      {/* Statistics Cards */}
      <Row gutter={16} className="mb-6">
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Assigned"
              value={stats.totalAssigned}
              prefix={<CalendarOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Upcoming Sessions"
              value={stats.upcomingSessions}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Completed"
              value={stats.completedSessions}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Attendance Rate"
              value={stats.completedSessions > 0 ? ((stats.completedSessions - stats.missedSessions) / stats.completedSessions * 100).toFixed(1) : 0}
              suffix="%"
              prefix={<UserOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Sessions Table */}
      <Card title="Assigned Sessions" className="mb-6">
        {sessions.length === 0 ? (
          <Alert
            message="No Sessions Assigned"
            description="You have not been assigned to any parliament sessions yet. Check back later or contact your administrator."
            type="info"
            showIcon
          />
        ) : (
          <Table
            columns={columns}
            dataSource={sessions}
            rowKey="id"
            loading={loading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} sessions`,
            }}
          />
        )}
      </Card>

      {/* Session Details Modal */}
      <Modal
        title="Session Details"
        open={detailModalVisible}
        onCancel={() => {
          setDetailModalVisible(false);
          setViewingSession(null);
        }}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            Close
          </Button>
        ]}
        width={800}
      >
        {viewingSession && (
          <div>
            <Descriptions column={2} bordered>
              <Descriptions.Item label="Title" span={2}>
                <Text strong>{viewingSession.title}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Type">
                {viewingSession.session_type_display || viewingSession.session_type}
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                {getSessionStatus(viewingSession)}
              </Descriptions.Item>
              <Descriptions.Item label="Start Date">
                {dayjs(viewingSession.start_date).format('MMMM DD, YYYY')}
              </Descriptions.Item>
              <Descriptions.Item label="End Date">
                {dayjs(viewingSession.end_date).format('MMMM DD, YYYY')}
              </Descriptions.Item>
              {viewingSession.start_time && (
                <Descriptions.Item label="Start Time">
                  {dayjs(viewingSession.start_time, 'HH:mm:ss').format('HH:mm')}
                </Descriptions.Item>
              )}
              {viewingSession.end_time && (
                <Descriptions.Item label="End Time">
                  {dayjs(viewingSession.end_time, 'HH:mm:ss').format('HH:mm')}
                </Descriptions.Item>
              )}
              <Descriptions.Item label="Venue" span={2}>
                {viewingSession.venue || 'Parliament Building'}
              </Descriptions.Item>
              <Descriptions.Item label="Mandatory Attendance">
                {viewingSession.is_mandatory ? (
                  <Badge status="error" text="Yes - Attendance Required" />
                ) : (
                  <Badge status="default" text="No - Optional" />
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Organizer">
                {viewingSession.organizer_name || 'Not specified'}
              </Descriptions.Item>
              {viewingSession.description && (
                <Descriptions.Item label="Description" span={2}>
                  <Text>{viewingSession.description}</Text>
                </Descriptions.Item>
              )}
              {viewingSession.fuel_top_up_litres && viewingSession.fuel_top_up_litres > 0 && (
                <Descriptions.Item label="Fuel Allocation" span={2}>
                  <Text type="success">
                    {viewingSession.fuel_top_up_litres} litres additional fuel allowance for attending this session
                  </Text>
                </Descriptions.Item>
              )}
            </Descriptions>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MySessionsPage;
