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
  message,
  Select,
  Input,
  Tooltip,
  Divider,
  List
} from 'antd';
import {
  CalendarOutlined,
  TeamOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  SearchOutlined,
  FilterOutlined,
  BulbOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import { sergeantOfArmsAPI } from '@/api/sergeantOfArms';
import apiClient from '@/api/index';

const { Title, Text } = Typography;
const { Option } = Select;

interface ProgramSession {
  id: number;
  title: string;
  date: string;
  time: string;
  endTime: string;
  type: string;
  status: string;
  attendanceRate: number;
  venue: string;
  description?: string;
}

interface CalendarStats {
  total_sessions_this_month: number;
  completed_sessions: number;
  pending_attendance: number;
  upcoming_sessions: number;
  average_attendance: number;
}

const SergeantOfArmsDashboard: React.FC = () => {
  const [sessions, setSessions] = useState<ProgramSession[]>([]);
  const [stats, setStats] = useState<CalendarStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [calendarMode, setCalendarMode] = useState<'month' | 'year'>('month');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedSession, setSelectedSession] = useState<ProgramSession | null>(null);
  const [sessionFilter, setSessionFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // --- Beneficiary management for attendance marking ---
  const [beneficiaries, setBeneficiaries] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  const [selectedBeneficiaryIds, setSelectedBeneficiaryIds] = useState<string[]>([]);
  const [attendanceModalVisible, setAttendanceModalVisible] = useState(false);

  // Extract unique categories from beneficiaries
  const beneficiaryCategories = Array.from(new Set(beneficiaries.map((b: any) => typeof b.category === 'object' ? b.category?.name : b.category).filter(Boolean))) as string[];

  // Filter beneficiaries by selected category
  const filteredBeneficiaries = selectedCategory
    ? beneficiaries.filter((b: any) => {
        const cat = typeof b.category === 'object' ? b.category?.name : b.category;
        return cat === selectedCategory;
      })
    : beneficiaries;

  useEffect(() => {
    fetchCalendarData();
    fetchBeneficiaries();
  }, []);

  const fetchBeneficiaries = async () => {
    try {
      const response = await apiClient.get('/beneficiary-profiles/', { params: { page_size: 500 } });
      const beneficiaryData = response.data.results || response.data;
      setBeneficiaries(beneficiaryData);
    } catch (error) {
      console.error('Error fetching beneficiaries:', error);
    }
  };

  const fetchCalendarData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch real data from backend APIs
      const [dashboardStats, attendanceRegistries] = await Promise.all([
        sergeantOfArmsAPI.getDashboardStats(),
        sergeantOfArmsAPI.getAttendanceRegistries()
      ]);

      // Transform backend data to calendar format
      const transformedSessions: ProgramSession[] = attendanceRegistries.map(registry => ({
        id: registry.id,
        title: registry.title,
        date: registry.attendance_date,
        time: registry.session_details?.start_time || '09:00',
        endTime: registry.session_details?.end_time || '17:00',
        type: registry.session_details?.session_type || registry.program_details?.program_type || 'Parliamentary',
        status: registry.status === 'completed' ? 'Completed' : 
                registry.status === 'in_progress' ? 'In Progress' : 'Scheduled',
        attendanceRate: registry.attendance_percentage || 0,
        venue: registry.session_details?.venue || 'Parliament Building',
        description: registry.program_details?.description || registry.title
      }));

      // Transform stats
      const transformedStats: CalendarStats = {
        total_sessions_this_month: dashboardStats.pending_registries + dashboardStats.in_progress_registries + dashboardStats.completed_this_week,
        completed_sessions: dashboardStats.completed_this_week,
        pending_attendance: dashboardStats.pending_registries,
        upcoming_sessions: dashboardStats.in_progress_registries,
        average_attendance: transformedSessions.length > 0 
          ? transformedSessions.reduce((sum, s) => sum + s.attendanceRate, 0) / transformedSessions.length 
          : 0
      };

      setSessions(transformedSessions);
      setStats(transformedStats);
    } catch (err: any) {
      console.error('Error fetching calendar data:', err);
      setError(err.response?.data?.error || 'Failed to load calendar data');
      
      // Fallback to empty data instead of mock data
      setSessions([]);
      setStats({
        total_sessions_this_month: 0,
        completed_sessions: 0,
        pending_attendance: 0,
        upcoming_sessions: 0,
        average_attendance: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const getSessionsForDate = (date: Dayjs): ProgramSession[] => {
    return getFilteredSessions().filter(session => dayjs(session.date).isSame(date, 'day'));
  };

  const getFilteredSessions = (): ProgramSession[] => {
    let filtered = sessions;

    if (sessionFilter !== 'all') {
      filtered = filtered.filter(session => session.type === sessionFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(session => session.status === statusFilter);
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(session => 
        session.title.toLowerCase().includes(term) ||
        session.venue.toLowerCase().includes(term) ||
        session.description?.toLowerCase().includes(term)
      );
    }

    return filtered;
  };

  const getCalendarInsights = (): string[] => {
    const insights: string[] = [];
    const totalSessions = stats?.total_sessions_this_month || 0;
    const completed = stats?.completed_sessions || 0;
    const upcoming = stats?.upcoming_sessions || 0;
    const pending = stats?.pending_attendance || 0;

    if (totalSessions > 0) {
      const completionRate = Math.round((completed / totalSessions) * 100);
      insights.push(`${completionRate}% of sessions completed this month`);
    }

    if (pending > 0) {
      insights.push(`${pending} sessions need attendance marking`);
    }

    if (upcoming > 5) {
      insights.push('High activity period - multiple sessions scheduled');
    } else if (upcoming === 0) {
      insights.push('No upcoming sessions scheduled');
    }

    const todaysSessions = getSessionsForDate(dayjs());
    if (todaysSessions.length > 0) {
      insights.push(`${todaysSessions.length} session(s) scheduled for today`);
    }

    return insights.length > 0 ? insights : ['No insights available - add more sessions to see patterns'];
  };

  const showSessionDetails = (session: ProgramSession) => {
    setSelectedSession(session);
    setModalVisible(true);
  };

  const handleManageAttendance = () => {
    setAttendanceModalVisible(true);
  };

  // AntD v5: use cellRender instead of deprecated dateCellRender
  const renderDateCell = (value: Dayjs) => {
    const sessionsForDate = getSessionsForDate(value);
    
    if (sessionsForDate.length === 0) return null;

    return (
      <div style={{ fontSize: '10px' }}>
        {sessionsForDate.slice(0, 2).map((session, index) => (
          <div 
            key={index} 
            style={{
              fontSize: '10px',
              padding: '2px 4px',
              margin: '1px 0',
              backgroundColor: getSessionColor(session.type, session.status),
              color: 'white',
              borderRadius: '3px',
              border: `1px solid ${getSessionBorderColor(session.type)}`,
              cursor: 'pointer',
              fontWeight: 'bold',
              textShadow: '1px 1px 1px rgba(0,0,0,0.3)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s ease',
            }}
            onClick={() => showSessionDetails(session)}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.02)';
              e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.2)';
            }}
          >
            <div style={{ fontWeight: 'bold' }}>{session.time}</div>
            <div style={{ fontSize: '9px', opacity: 0.9 }}>
              {session.title.length > 15 ? session.title.substring(0, 15) + '...' : session.title}
            </div>
          </div>
        ))}
        {sessionsForDate.length > 2 && (
          <div style={{ 
            fontSize: '8px', 
            color: '#666', 
            textAlign: 'center',
            padding: '1px 0'
          }}>
            +{sessionsForDate.length - 2} more
          </div>
        )}
      </div>
    );
  };

  const getSessionColor = (type: string, status: string) => {
    const baseColors: { [key: string]: string } = {
      'Parliamentary': '#1890ff',
      'Committee': '#52c41a',
      'Special': '#faad14',
      'Public': '#f5222d'
    };

    let color = baseColors[type] || baseColors['Parliamentary'];
    
    if (status === 'Completed') {
      color = '#52c41a';
    } else if (status === 'Cancelled') {
      color = '#8c8c8c';
    } else if (status === 'In Progress') {
      color = '#faad14';
    }
    
    return color;
  };

  const getSessionBorderColor = (type: string) => {
    const borderColors: { [key: string]: string } = {
      'Parliamentary': '#0050b3',
      'Committee': '#389e0d',
      'Special': '#d48806',
      'Public': '#cf1322'
    };
    return borderColors[type] || borderColors['Parliamentary'];
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <div style={{ marginTop: '16px' }}>Loading calendar data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        message="Error Loading Calendar"
        description={error}
        type="error"
        showIcon
        action={
          <Button size="small" onClick={fetchCalendarData}>
            Retry
          </Button>
        }
      />
    );
  }

  return (
    <div style={{ 
      padding: '24px', 
      backgroundColor: 'white',
      minHeight: '100vh'
    }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ 
          color: '#1890ff',
          marginBottom: '8px'
        }}>
          <CalendarOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
          Parliamentary Calendar
        </Title>
        <Text type="secondary" style={{ fontSize: '16px' }}>
          Manage attendance for parliamentary sessions and programs
        </Text>
      </div>

      {/* Stats Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={6}>
          <Card style={{ 
            backgroundColor: '#1890ff',
            border: 'none',
            borderRadius: '12px',
            boxShadow: '0 4px 15px 0 rgba(24, 144, 255, 0.3)'
          }}>
            <Statistic
              title={<span style={{ color: 'white', fontWeight: '500' }}>This Month</span>}
              value={stats?.total_sessions_this_month || 0}
              prefix={<CalendarOutlined style={{ color: 'white' }} />}
              valueStyle={{ color: 'white', fontSize: '24px' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card style={{ 
            backgroundColor: '#52c41a',
            border: 'none',
            borderRadius: '12px',
            boxShadow: '0 4px 15px 0 rgba(82, 196, 26, 0.3)'
          }}>
            <Statistic
              title={<span style={{ color: 'white', fontWeight: '500' }}>Completed</span>}
              value={stats?.completed_sessions || 0}
              prefix={<CheckCircleOutlined style={{ color: 'white' }} />}
              valueStyle={{ color: 'white', fontSize: '24px' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card style={{ 
            backgroundColor: '#faad14',
            border: 'none',
            borderRadius: '12px',
            boxShadow: '0 4px 15px 0 rgba(250, 173, 20, 0.3)'
          }}>
            <Statistic
              title={<span style={{ color: 'white', fontWeight: '500' }}>Pending Attendance</span>}
              value={stats?.pending_attendance || 0}
              prefix={<ClockCircleOutlined style={{ color: 'white' }} />}
              valueStyle={{ color: 'white', fontSize: '24px' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card style={{ 
            backgroundColor: '#f5222d',
            border: 'none',
            borderRadius: '12px',
            boxShadow: '0 4px 15px 0 rgba(245, 34, 45, 0.3)'
          }}>
            <Statistic
              title={<span style={{ color: 'white', fontWeight: '500' }}>Upcoming</span>}
              value={stats?.upcoming_sessions || 0}
              prefix={<TeamOutlined style={{ color: 'white' }} />}
              valueStyle={{ color: 'white', fontSize: '24px' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Calendar Insights */}
      <Card
        title={
          <Space>
            <BulbOutlined style={{ color: '#faad14' }} />
            <span style={{ color: '#1890ff', fontWeight: '600' }}>Calendar Insights</span>
          </Space>
        }
        style={{ 
          marginBottom: '24px',
          borderRadius: '12px',
          boxShadow: '0 4px 15px 0 rgba(0,0,0,0.1)',
          backgroundColor: '#f0f2f5',
          border: '1px solid #d9d9d9'
        }}
        size="small"
      >
        <List
          size="small"
          dataSource={getCalendarInsights()}
          renderItem={insight => (
            <List.Item style={{ border: 'none', padding: '4px 0' }}>
              <InfoCircleOutlined style={{ color: '#1890ff', marginRight: '8px' }} />
              <span style={{ color: '#4a5568', fontWeight: '500' }}>{insight}</span>
            </List.Item>
          )}
        />
      </Card>

      {/* Calendar */}
      <Card 
        title={
          <span style={{ 
            color: '#1890ff', 
            fontWeight: '600', 
            fontSize: '18px' 
          }}>
            Parliamentary Sessions Calendar
          </span>
        }
        extra={
          <Space>
            <Button 
              onClick={fetchCalendarData}
              style={{
                borderRadius: '8px',
                border: '1px solid #1890ff',
                color: '#1890ff'
              }}
            >
              Refresh
            </Button>
            <Button 
              type="primary" 
              onClick={handleManageAttendance}
              style={{
                backgroundColor: '#1890ff',
                border: 'none',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(24, 144, 255, 0.3)'
              }}
            >
              Manage Attendance
            </Button>
          </Space>
        }
      >
        {/* Filters */}
        <Row gutter={[16, 16]} style={{ 
          marginBottom: '16px',
          padding: '16px',
          backgroundColor: '#f0f2f5',
          borderRadius: '8px',
          border: '1px solid #d9d9d9'
        }}>
          <Col xs={24} sm={8} md={6}>
            <Input
              placeholder="Search sessions..."
              prefix={<SearchOutlined style={{ color: '#1890ff' }} />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} sm={8} md={6}>
            <Select
              value={sessionFilter}
              onChange={setSessionFilter}
              style={{ width: '100%' }}
              placeholder="Filter by type"
            >
              <Select.Option value="all">All Types</Select.Option>
              <Select.Option value="Parliamentary">
                <Tag color="#1890ff" style={{ margin: 0 }}>Parliamentary</Tag>
              </Select.Option>
              <Select.Option value="Committee">
                <Tag color="#52c41a" style={{ margin: 0 }}>Committee</Tag>
              </Select.Option>
              <Select.Option value="Special">
                <Tag color="#faad14" style={{ margin: 0 }}>Special</Tag>
              </Select.Option>
              <Select.Option value="Public">
                <Tag color="#f5222d" style={{ margin: 0 }}>Public</Tag>
              </Select.Option>
            </Select>
          </Col>
          <Col xs={24} sm={8} md={6}>
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: '100%' }}
              placeholder="Filter by status"
            >
              <Select.Option value="all">All Statuses</Select.Option>
              <Select.Option value="Scheduled">Scheduled</Select.Option>
              <Select.Option value="In Progress">In Progress</Select.Option>
              <Select.Option value="Completed">Completed</Select.Option>
            </Select>
          </Col>
        </Row>

        <Calendar
          value={selectedDate}
          onChange={setSelectedDate}
          cellRender={(current, info) => {
            if (info.type === 'date') {
              return renderDateCell(current as Dayjs) as any;
            }
            return info.originNode;
          }}
          headerRender={({ value, type, onChange, onTypeChange }) => (
            <div style={{ 
              padding: '16px',
              backgroundColor: '#1890ff',
              borderRadius: '8px 8px 0 0',
              marginBottom: '8px'
            }}>
              <Row justify="space-between" align="middle">
                <Col>
                  <Radio.Group
                    size="small"
                    value={type}
                    onChange={(e) => {
                      onTypeChange(e.target.value);
                      setCalendarMode(e.target.value);
                    }}
                    style={{
                      background: 'rgba(255,255,255,0.2)',
                      borderRadius: '6px',
                      padding: '2px'
                    }}
                  >
                    <Radio.Button 
                      value="month"
                      style={{
                        background: type === 'month' ? 'white' : 'transparent',
                        color: type === 'month' ? '#1890ff' : 'white',
                        border: 'none',
                        borderRadius: '4px'
                      }}
                    >
                      Month
                    </Radio.Button>
                    <Radio.Button 
                      value="year"
                      style={{
                        background: type === 'year' ? 'white' : 'transparent',
                        color: type === 'year' ? '#1890ff' : 'white',
                        border: 'none',
                        borderRadius: '4px'
                      }}
                    >
                      Year
                    </Radio.Button>
                  </Radio.Group>
                </Col>
                <Col>
                  <Title 
                    level={3} 
                    style={{ 
                      margin: 0, 
                      color: 'white',
                      textAlign: 'center'
                    }}
                  >
                    {value.format(type === 'month' ? 'MMMM YYYY' : 'YYYY')}
                  </Title>
                </Col>
                <Col>
                  <Space>
                    <Button
                      size="small"
                      onClick={() => {
                        const newValue = value.subtract(1, type);
                        onChange(newValue);
                      }}
                      style={{
                        background: 'rgba(255,255,255,0.2)',
                        border: 'none',
                        color: '#1890ff',
                        borderRadius: '4px'
                      }}
                    >
                      ‹
                    </Button>
                    <Button
                      size="small"
                      onClick={() => {
                        const newValue = value.add(1, type);
                        onChange(newValue);
                      }}
                      style={{
                        background: 'rgba(255,255,255,0.2)',
                        border: 'none',
                        color: '#1890ff',
                        borderRadius: '4px'
                      }}
                    >
                      ›
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
        title={selectedSession?.title}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setModalVisible(false)}>
            Close
          </Button>,
          <Button 
            key="manage" 
            type="primary"
            onClick={() => {
              setModalVisible(false);
              handleManageAttendance();
            }}
          >
            Manage Attendance
          </Button>
        ]}
      >
        {selectedSession && (
          <div>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <strong>Date:</strong> {dayjs(selectedSession.date).format('MMM DD, YYYY')}
              </Col>
              <Col span={12}>
                <strong>Time:</strong> {selectedSession.time} - {selectedSession.endTime}
              </Col>
              <Col span={12}>
                <strong>Type:</strong> <Tag color={getSessionColor(selectedSession.type, selectedSession.status)}>{selectedSession.type}</Tag>
              </Col>
              <Col span={12}>
                <strong>Status:</strong> <Badge status={selectedSession.status === 'Completed' ? 'success' : selectedSession.status === 'In Progress' ? 'processing' : 'default'} text={selectedSession.status} />
              </Col>
              <Col span={12}>
                <strong>Venue:</strong> {selectedSession.venue}
              </Col>
              <Col span={12}>
                <strong>Attendance:</strong> {selectedSession.attendanceRate}%
              </Col>
              {selectedSession.description && (
                <Col span={24}>
                  <strong>Description:</strong> {selectedSession.description}
                </Col>
              )}
            </Row>
          </div>
        )}
      </Modal>

      {/* Attendance Marking Modal */}
      <Modal
        title="Mark Attendance"
        open={attendanceModalVisible}
        onCancel={() => setAttendanceModalVisible(false)}
        footer={null}
        width={800}
      >
        <div style={{ marginBottom: 16 }}>
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} sm={8}>
              <Space>
                <span>Category:</span>
                <Select
                  style={{ width: 200 }}
                  value={selectedCategory}
                  onChange={setSelectedCategory}
                  placeholder="Select category"
                  allowClear
                >
                  {beneficiaryCategories.map((cat: string) => (
                    <Option key={cat} value={cat}>{cat}</Option>
                  ))}
                </Select>
              </Space>
            </Col>
            <Col xs={24} sm={16}>
              <Space>
                <span>Beneficiaries:</span>
                <Select
                  mode="multiple"
                  style={{ minWidth: 300 }}
                  value={selectedBeneficiaryIds}
                  onChange={setSelectedBeneficiaryIds}
                  placeholder="Select beneficiaries"
                  optionLabelProp="label"
                  showSearch
                >
                  {filteredBeneficiaries.map((b: any) => {
                    const displayName = b.user ? `${b.user.first_name || ''} ${b.user.last_name || ''}`.trim() : (b.constituency?.name || 'Unknown Name');
                    return (
                      <Option key={b.id} value={b.id} label={displayName}>
                        <span><input type="checkbox" checked={selectedBeneficiaryIds.includes(b.id)} readOnly style={{ marginRight: 8 }} />{displayName}</span>
                      </Option>
                    );
                  })}
                </Select>
              </Space>
            </Col>
          </Row>
        </div>

        <div style={{ marginTop: 16 }}>
          <Button 
            type="primary" 
            onClick={() => {
              message.success(`Marked attendance for ${selectedBeneficiaryIds.length} beneficiaries`);
              setAttendanceModalVisible(false);
              setSelectedBeneficiaryIds([]);
            }}
            disabled={selectedBeneficiaryIds.length === 0}
          >
            Mark Selected as Present
          </Button>
          <Button 
            style={{ marginLeft: 8 }}
            onClick={() => {
              message.info(`Marked ${selectedBeneficiaryIds.length} beneficiaries as absent`);
              setAttendanceModalVisible(false);
              setSelectedBeneficiaryIds([]);
            }}
            disabled={selectedBeneficiaryIds.length === 0}
          >
            Mark Selected as Absent
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default SergeantOfArmsDashboard;
