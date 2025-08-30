import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Calendar,
  Badge,
  Modal,
  Button,
  Space,
  Typography,
  Tag,
  Radio,
  Spin,
  Alert,
  message
} from 'antd';
import {
  CalendarOutlined,
  TeamOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';

const { Title, Text } = Typography;

interface ProgramSession {
  id: number;
  title: string;
  date: string;
  time: string;
  type: 'Parliamentary' | 'Committee' | 'Special' | 'Public';
  venue: string;
  status: 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled';
  expected_attendance: number;
  actual_attendance?: number;
  attendance_marked: boolean;
}

interface CalendarStats {
  total_sessions_this_month: number;
  completed_sessions: number;
  pending_attendance: number;
  upcoming_sessions: number;
}

const SergeantOfArmsDashboard: React.FC = () => {
  const [sessions, setSessions] = useState<ProgramSession[]>([]);
  const [stats, setStats] = useState<CalendarStats | null>(null);
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [selectedSession, setSelectedSession] = useState<ProgramSession | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCalendarData();
  }, [selectedDate]);

  const fetchCalendarData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Mock data for parliamentary sessions - replace with actual API calls
      const mockSessions: ProgramSession[] = [
        {
          id: 1,
          title: 'Morning Parliamentary Session',
          date: '2024-01-15',
          time: '09:00',
          type: 'Parliamentary',
          venue: 'Main Chamber',
          status: 'Scheduled',
          expected_attendance: 150,
          attendance_marked: false
        },
        {
          id: 2,
          title: 'Finance Committee Meeting',
          date: '2024-01-16',
          time: '14:00',
          type: 'Committee',
          venue: 'Committee Room A',
          status: 'Scheduled',
          expected_attendance: 25,
          attendance_marked: false
        },
        {
          id: 3,
          title: 'Budget Review Session',
          date: '2024-01-18',
          time: '10:30',
          type: 'Special',
          venue: 'Main Chamber',
          status: 'Completed',
          expected_attendance: 120,
          actual_attendance: 115,
          attendance_marked: true
        },
        {
          id: 4,
          title: 'Public Hearing - Education Bill',
          date: '2024-01-20',
          time: '15:00',
          type: 'Public',
          venue: 'Public Gallery',
          status: 'Scheduled',
          expected_attendance: 80,
          attendance_marked: false
        }
      ];

      const mockStats: CalendarStats = {
        total_sessions_this_month: 12,
        completed_sessions: 8,
        pending_attendance: 4,
        upcoming_sessions: 6
      };
      
      setSessions(mockSessions);
      setStats(mockStats);
    } catch (err: any) {
      console.error('Error fetching calendar data:', err);
      setError(err.response?.data?.error || 'Failed to load calendar data');
    } finally {
      setLoading(false);
    }
  };

  const getSessionsForDate = (date: Dayjs): ProgramSession[] => {
    return sessions.filter(session => dayjs(session.date).isSame(date, 'day'));
  };

  // AntD v5: use cellRender instead of deprecated dateCellRender
  const renderDateCell = (value: Dayjs) => {
    const sessionsForDate = getSessionsForDate(value);
    
    if (sessionsForDate.length === 0) return null;

    return (
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {sessionsForDate.map(session => (
          <li key={session.id}>
            <Badge 
              status={getSessionStatusColor(session.status)} 
              text={
                <span 
                  style={{ fontSize: '11px', cursor: 'pointer' }}
                  onClick={() => {
                    setSelectedSession(session);
                    setModalVisible(true);
                  }}
                >
                  {session.title.substring(0, 20)}...
                </span>
              }
            />
          </li>
        ))}
      </ul>
    );
  };

  const getSessionStatusColor = (status: string) => {
    switch (status) {
      case 'Scheduled':
        return 'processing';
      case 'In Progress':
        return 'warning';
      case 'Completed':
        return 'success';
      case 'Cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const getSessionTypeColor = (type: string) => {
    switch (type) {
      case 'Parliamentary':
        return '#1890ff';
      case 'Committee':
        return '#52c41a';
      case 'Special':
        return '#fa8c16';
      case 'Public':
        return '#722ed1';
      default:
        return '#d9d9d9';
    }
  };

  const handleMarkAttendance = (sessionId: number) => {
    // Navigate to attendance marking page
    window.location.href = `/sergeant-of-arms/attendance/mark/${sessionId}`;
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        message="Error"
        description={error}
        type="error"
        showIcon
        action={
          <Button onClick={fetchCalendarData}>
            Retry
          </Button>
        }
      />
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>
          <CalendarOutlined style={{ marginRight: '8px' }} />
          Parliamentary Calendar
        </Title>
        <Text type="secondary">
          Manage attendance for parliamentary sessions and programs
        </Text>
      </div>

      {/* Quick Stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="This Month"
              value={stats?.total_sessions_this_month || 0}
              prefix={<CalendarOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Completed"
              value={stats?.completed_sessions || 0}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Pending Attendance"
              value={stats?.pending_attendance || 0}
              prefix={<ClockCircleOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Upcoming"
              value={stats?.upcoming_sessions || 0}
              prefix={<TeamOutlined style={{ color: '#722ed1' }} />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Calendar */}
      <Card 
        title="Parliamentary Sessions Calendar"
        extra={
          <Space>
            <Button onClick={fetchCalendarData}>
              Refresh
            </Button>
            <Button type="primary" href="/sergeant-of-arms/attendance">
              Manage Attendance
            </Button>
          </Space>
        }
      >
        <Calendar
          value={selectedDate}
          onChange={setSelectedDate}
          cellRender={(current, info) => info.type === 'date' ? (renderDateCell(current as Dayjs) as any) : info.originNode}
          headerRender={({ value, type, onChange, onTypeChange }) => (
            <div style={{ padding: 8 }}>
              <Row justify="space-between" align="middle">
                <Col>
                  <Radio.Group
                    size="small"
                    value={type}
                    onChange={(e) => onTypeChange(e.target.value)}
                  >
                    <Radio.Button value="month">Month</Radio.Button>
                    <Radio.Button value="year">Year</Radio.Button>
                  </Radio.Group>
                </Col>
                <Col>
                  <Space>
                    <Button
                      size="small"
                      onClick={() => onChange(value.clone().subtract(1, type))}
                    >
                      Previous
                    </Button>
                    <span style={{ margin: '0 16px' }}>
                      {value.format(type === 'month' ? 'MMMM YYYY' : 'YYYY')}
                    </span>
                    <Button
                      size="small"
                      onClick={() => onChange(value.clone().add(1, type))}
                    >
                      Next
                    </Button>
                  </Space>
                </Col>
              </Row>
            </div>
          )}
        />
      </Card>

      {/* Session Details Modal */}
      <Modal
        title="Session Details"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setModalVisible(false)}>
            Close
          </Button>,
          selectedSession && !selectedSession.attendance_marked && (
            <Button
              key="mark"
              type="primary"
              onClick={() => handleMarkAttendance(selectedSession.id)}
            >
              Mark Attendance
            </Button>
          )
        ]}
      >
        {selectedSession && (
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <div>
              <Text strong>Title: </Text>
              <Text>{selectedSession.title}</Text>
            </div>
            <div>
              <Text strong>Date & Time: </Text>
              <Text>{dayjs(selectedSession.date).format('MMMM DD, YYYY')} at {selectedSession.time}</Text>
            </div>
            <div>
              <Text strong>Type: </Text>
              <Tag color={getSessionTypeColor(selectedSession.type)}>
                {selectedSession.type}
              </Tag>
            </div>
            <div>
              <Text strong>Venue: </Text>
              <Text>{selectedSession.venue}</Text>
            </div>
            <div>
              <Text strong>Status: </Text>
              <Badge 
                status={getSessionStatusColor(selectedSession.status)} 
                text={selectedSession.status} 
              />
            </div>
            <div>
              <Text strong>Expected Attendance: </Text>
              <Text>{selectedSession.expected_attendance}</Text>
            </div>
            {selectedSession.actual_attendance && (
              <div>
                <Text strong>Actual Attendance: </Text>
                <Text>{selectedSession.actual_attendance}</Text>
              </div>
            )}
            <div>
              <Text strong>Attendance Marked: </Text>
              <Tag color={selectedSession.attendance_marked ? 'green' : 'orange'}>
                {selectedSession.attendance_marked ? 'Yes' : 'No'}
              </Tag>
            </div>
          </Space>
        )}
      </Modal>
    </div>
  );
};

export default SergeantOfArmsDashboard;
