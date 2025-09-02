// src/pages/parliament/ParliamentSessionsPage.tsx
import { useState, useEffect } from 'react';
import type { FC } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Form,
  Input,
  DatePicker,
  Select,
  Modal,
  Tag,
  Spin,
  Typography,
  Row,
  Col,
  Statistic,
  Popconfirm,
  Tooltip,
  InputNumber,
  Switch,
  Descriptions,
  Badge,
  Alert,
  App,
  message,
  TimePicker
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CalendarOutlined,
  UserOutlined,
  EnvironmentOutlined,
  EyeOutlined,
  CheckOutlined,
  CloseOutlined,
  CarOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import apiClient from '@/api/index';
import { SessionService } from '../../api/sessions';
import type { ParliamentSession } from '../../types';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { TextArea } = Input;

interface SessionStats {
  totalSessions: number;
  activeSessions: number;
  completedSessions: number;
  upcomingSessions: number;
  totalAttendees: number;
  totalFuelEntitlement: number;
}

const ParliamentSessionsPage: FC = () => {
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<ParliamentSession[]>([]);
  const [stats, setStats] = useState<SessionStats>({
    totalSessions: 0,
    activeSessions: 0,
    completedSessions: 0,
    upcomingSessions: 0,
    totalAttendees: 0,
    totalFuelEntitlement: 0
  });
  const [modalVisible, setModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [editingSession, setEditingSession] = useState<ParliamentSession | null>(null);
  const [viewingSession, setViewingSession] = useState<ParliamentSession | null>(null);
  const [form] = Form.useForm();
  const [tableLoading, setTableLoading] = useState(false);
  
  // New state for session managers and subcenters
  const [users, setUsers] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [subcenters, setSubcenters] = useState<any[]>([]);
  const [subcentersLoading, setSubcentersLoading] = useState(false);
  const [programs, setPrograms] = useState<any[]>([]);
  const [programsLoading, setProgramsLoading] = useState(false);
  const [beneficiaries, setBeneficiaries] = useState<any[]>([]);
  const [beneficiariesLoading, setBeneficiariesLoading] = useState(false);

  useEffect(() => {
    loadSessions();
    loadUsers();
    loadSubcenters();
    loadPrograms();
    loadBeneficiaries();
  }, []);

  const loadSessions = async () => {
    try {
      setLoading(true);
      
      // Load sessions and stats in parallel
      const [sessionsResponse, statsResponse] = await Promise.allSettled([
        SessionService.getSessions(),
        SessionService.getStats()
      ]);

      // Handle sessions data
      if (sessionsResponse.status === 'fulfilled') {
        const sessionData = sessionsResponse.value.results || [];
        setSessions(sessionData);
      } else {
        console.error('Failed to load sessions:', sessionsResponse.reason);
        message.error('Failed to load parliament sessions');
      }

      // Handle stats data
      if (statsResponse.status === 'fulfilled') {
        const statsData = statsResponse.value;
        setStats({
          totalSessions: statsData.total_sessions,
          activeSessions: statsData.active_sessions,
          completedSessions: statsData.completed_sessions,
          upcomingSessions: statsData.upcoming_sessions,
          totalAttendees: 0, // Will be calculated from session data
          totalFuelEntitlement: 0 // Will be calculated from session data
        });
      } else {
        console.warn('Failed to load stats, using fallback calculation:', statsResponse.reason);
        // Fallback: calculate stats from sessions if available
        if (sessionsResponse.status === 'fulfilled') {
          const sessionData = sessionsResponse.value.results || [];
          const now = dayjs();
          setStats({
            totalSessions: sessionData.length,
            activeSessions: sessionData.filter((s: ParliamentSession) => s.status === 'active').length,
            completedSessions: sessionData.filter((s: ParliamentSession) => s.status === 'completed').length,
            upcomingSessions: sessionData.filter((s: ParliamentSession) => s.status === 'upcoming').length,
            totalAttendees: sessionData.reduce((sum: number, session: ParliamentSession) => 
              sum + (session.attendees_count || session.attendees?.length || 0), 0
            ),
            totalFuelEntitlement: sessionData.reduce((sum: number, session: ParliamentSession) => 
              sum + (session.fuel_top_up_litres || parseFloat(session.fuel_entitlement_litres || '0')), 0
            )
          });
        }
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
      message.error('Failed to load parliament sessions');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      setUsersLoading(true);
      const response = await apiClient.get('/users/?role=MAIN_CENTER,SUB_CENTER');
      setUsers(response.data.results || response.data);
    } catch (error) {
      console.error('Error loading users:', error);
      message.error('Failed to load users for session management');
    } finally {
      setUsersLoading(false);
    }
  };

  const loadSubcenters = async () => {
    try {
      setSubcentersLoading(true);
      const response = await apiClient.get('/subcenters/');
      setSubcenters(response.data.results || response.data);
    } catch (error) {
      console.error('Error loading subcenters:', error);
      message.error('Failed to load subcenters');
    } finally {
      setSubcentersLoading(false);
    }
  };

  const loadPrograms = async () => {
    try {
      setProgramsLoading(true);
      const response = await apiClient.get('/programs/');
      const programData = response.data.results || response.data;
      setPrograms(programData);
    } catch (error) {
      console.error('Error loading programs:', error);
    } finally {
      setProgramsLoading(false);
    }
  };

  const loadBeneficiaries = async () => {
    try {
      setBeneficiariesLoading(true);
      const response = await apiClient.get('/beneficiary-profiles/');
      const beneficiaryData = response.data.results || response.data;
      setBeneficiaries(beneficiaryData);
    } catch (error) {
      console.error('Error loading beneficiaries:', error);
    } finally {
      setBeneficiariesLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingSession(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (session: ParliamentSession) => {
    setEditingSession(session);
    form.setFieldsValue({
      title: session.title,
      description: session.description,
      session_type: session.session_type,
      start_date: dayjs(session.start_date),
      end_date: dayjs(session.end_date),
      start_time: session.start_time ? dayjs(session.start_time, 'HH:mm:ss') : dayjs('09:00', 'HH:mm'),
      end_time: session.end_time ? dayjs(session.end_time, 'HH:mm:ss') : dayjs('17:00', 'HH:mm'),
      venue: session.venue,
      fuel_top_up_litres: session.fuel_top_up_litres,
      fuel_top_up_percentage: session.fuel_top_up_percentage,
      expected_attendance: session.expected_attendance,
      attendance_tracked: session.attendance_tracked,
      is_active: session.is_active,
      is_mandatory: session.is_mandatory,
      organizer: session.organizer,
      managing_subcenter: session.managing_subcenter,
      program: session.program,
      assigned_attendees: (session.assigned_attendees || []).map((id: string | number) => typeof id === 'string' ? parseInt(id, 10) : id)
    });
    setModalVisible(true);
  };

  const handleView = (session: ParliamentSession) => {
    setViewingSession(session);
    setDetailModalVisible(true);
  };

  const handleDelete = async (sessionId: string) => {
    try {
      setTableLoading(true);
      await apiClient.delete(`/parliament-sessions/${sessionId}/`);
      message.success('Parliament session deleted successfully');
      loadSessions();
    } catch (error) {
      console.error('Error deleting session:', error);
      message.error('Failed to delete parliament session');
    } finally {
      setTableLoading(false);
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      setTableLoading(true);
      const payload = {
        title: values.title,
        description: values.description || '',
        session_type: values.session_type,
        start_date: values.start_date.format('YYYY-MM-DD'),
        end_date: values.end_date.format('YYYY-MM-DD'),
        start_time: values.start_time.format('HH:mm:ss'),
        end_time: values.end_time.format('HH:mm:ss'),
        venue: values.venue || 'Parliament Building',
        is_active: values.is_active !== false,
        fuel_top_up_litres: parseFloat(values.fuel_top_up_litres || '0'),
        fuel_top_up_percentage: parseFloat(values.fuel_top_up_percentage || '0'),
        expected_attendance: parseInt(values.expected_attendance || '0'),
        attendance_tracked: values.attendance_tracked || false,
        is_mandatory: values.is_mandatory || false,
        organizer: values.organizer || null,
        managing_subcenter: values.managing_subcenter || null,
        program: values.program || null,
        assigned_attendees_input: (values.assigned_attendees || []).map((id: string | number) => typeof id === 'string' ? parseInt(id, 10) : id),
      };

      if (editingSession) {
        await SessionService.updateSession(editingSession.id, payload);
        message.success('Parliament session updated successfully');
      } else {
        await SessionService.createSession(payload);
        message.success('Parliament session created successfully');
      }

      setModalVisible(false);
      form.resetFields();
      loadSessions();
    } catch (error: any) {
      console.error('Error saving session:', error);
      message.error(error.response?.data?.detail || 'Failed to save parliament session');
    } finally {
      setTableLoading(false);
    }
  };

  const getSessionStatus = (session: ParliamentSession) => {
    // Use the backend-calculated status if available
    if (session.status) {
      switch (session.status) {
        case 'active':
          return <Tag color="green">Active</Tag>;
        case 'upcoming':
          return <Tag color="blue">Upcoming</Tag>;
        case 'completed':
          return <Tag color="default">Completed</Tag>;
        case 'inactive':
          return <Tag color="red">Inactive</Tag>;
        default:
          return <Tag color="default">{session.status}</Tag>;
      }
    }

    // Fallback to client-side calculation
    const now = dayjs();
    const start = dayjs(session.start_date);
    const end = dayjs(session.end_date);

    if (!session.is_active) {
      return <Tag color="red">Inactive</Tag>;
    }

    if (start.isAfter(now)) {
      return <Tag color="blue">Upcoming</Tag>;
    } else if (start.isBefore(now) && end.isAfter(now)) {
      return <Tag color="green">Active</Tag>;
    } else {
      return <Tag color="default">Completed</Tag>;
    }
  };

  const columns = [
    {
      title: 'Session Title',
      dataIndex: 'title',
      key: 'title',
      render: (title: string) => title,
    },
    {
      title: 'Program',
      key: 'program',
      render: (_: any, record: ParliamentSession) => record.program_details?.name || 'N/A',
    },
    {
      title: 'Session Manager',
      key: 'session_manager',
      render: (_: any, record: ParliamentSession) =>
        record.organizer_name ||
        (record.organizer_details ? `${record.organizer_details.first_name ?? ''} ${record.organizer_details.last_name ?? ''}`.trim() : 'N/A'),
    },
    {
      title: 'Fuel Entitlement',
      key: 'fuel_entitlement',
      render: (_: any, record: ParliamentSession) => (
        <span>
          {record.fuel_top_up_litres ? `${record.fuel_top_up_litres} L` : ''}
          {record.fuel_top_up_percentage ? ` (+${record.fuel_top_up_percentage}%)` : ''}
        </span>
      ),
    },
    {
      title: 'Mandatory',
      dataIndex: 'is_mandatory',
      key: 'is_mandatory',
      align: 'center' as const,
      render: (mandatory: boolean) =>
        mandatory ? <Tag color="red">Yes</Tag> : <Tag color="blue">No</Tag>,
    },
    {
      title: 'Status',
      key: 'status',
      align: 'center' as const,
      render: (_: any, record: ParliamentSession) => {
        let color = 'default';
        if (record.status === 'completed') color = 'green';
        else if (record.status === 'active') color = 'blue';
        else if (record.status === 'upcoming') color = 'gold';
        else if (record.status === 'inactive') color = 'red';
        return <Tag color={color}>{record.status?.charAt(0).toUpperCase() + (record.status?.slice(1) || '')}</Tag>;
      },
    },
    {
      title: 'Date & Time',
      key: 'datetime',
      render: (_: any, record: ParliamentSession) => (
        <div>
          <div>
            <CalendarOutlined />{' '}
            {dayjs(record.start_date).format('YYYY-MM-DD')}
            {record.start_time && (
              <> {dayjs(record.start_time, 'HH:mm:ss').format('HH:mm')}</>
            )}
          </div>
          <div>
            <CalendarOutlined />{' '}
            {dayjs(record.end_date).format('YYYY-MM-DD')}
            {record.end_time && (
              <> {dayjs(record.end_time, 'HH:mm:ss').format('HH:mm')}</>
            )}
          </div>
        </div>
      ),
    },
    {
      title: 'Venue',
      dataIndex: 'venue',
      key: 'venue',
      render: (venue?: string) => (
        <span>
          <EnvironmentOutlined /> {venue ?? ''}
        </span>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'center' as const,
      render: (_: any, record: ParliamentSession) => (
        <Space size="small">
          <Tooltip title="View Details">
            <Button 
              type="text" 
              icon={<EyeOutlined />} 
              onClick={() => handleView(record)}
            />
          </Tooltip>
          <Tooltip title="Edit">
            <Button 
              type="text" 
              icon={<EditOutlined />} 
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Delete Session"
            description="Are you sure you want to delete this parliament session?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Tooltip title="Delete">
              <Button 
                type="text" 
                danger 
                icon={<DeleteOutlined />}
              />
            </Tooltip>
          </Popconfirm>
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
      {/* Header */}
      <div className="mb-6">
        <Title level={2}>Parliament Sessions Management</Title>
        <Text type="secondary">
          Manage parliament sessions, committee meetings, and special events
        </Text>
      </div>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Sessions"
              value={stats.totalSessions}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Active Sessions"
              value={stats.activeSessions}
              prefix={<Badge status="processing" />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Upcoming Sessions"
              value={stats.upcomingSessions}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Fuel Entitlement"
              value={stats.totalFuelEntitlement}
              suffix="L"
              prefix={<CarOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Main Content */}
      <Card>
        <div className="flex justify-between items-center mb-4">
          <Text strong>Parliament Sessions</Text>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreate}
          >
            New Session
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={sessions}
          rowKey="id"
          loading={tableLoading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} sessions`,
          }}
          scroll={{ x: 800 }}
        />
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        title={<span style={{ fontSize: '20px', fontWeight: 'bold' }}>{editingSession ? 'Edit Parliament Session' : 'Create Parliament Session'}</span>}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={1400}
        centered
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            venue: 'Parliament Building',
            fuel_top_up_litres: 0,
            fuel_top_up_percentage: 0,
            expected_attendance: 50,
            attendance_tracked: false,
            is_active: true,
            is_mandatory: false,
            start_time: dayjs('09:00', 'HH:mm'),
            end_time: dayjs('17:00', 'HH:mm')
          }}
          className="space-y-4"
        >
          <Form.Item
            name="title"
            label={<span style={{ fontSize: '16px', fontWeight: 600 }}>Session Title</span>}
            rules={[{ required: true, message: 'Please enter session title' }]}
          >
            <Input placeholder="Enter session title" size="large" style={{ fontSize: '16px', minHeight: '40px' }} />
          </Form.Item>

          <Form.Item
            name="session_type"
            label={<span style={{ fontSize: '16px', fontWeight: 600 }}>Session Type</span>}
            rules={[{ required: true, message: 'Please select session type' }]}
          >
            <Select placeholder="Select session type" size="large" style={{ fontSize: '16px', minHeight: '40px' }}>
              <Option value="REGULAR">Regular Session</Option>
              <Option value="SPECIAL">Special Session</Option>
              <Option value="COMMITTEE">Committee Session</Option>
              <Option value="BUDGET">Budget Session</Option>
              <Option value="EMERGENCY">Emergency Session</Option>
            </Select>
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="start_date"
                label={<span style={{ fontSize: '16px', fontWeight: 600 }}>Start Date</span>}
                rules={[{ required: true, message: 'Please select start date' }]}
              >
                <DatePicker
                  format="YYYY-MM-DD"
                  style={{ width: '100%', fontSize: '16px', minHeight: '40px' }}
                  size="large"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="end_date"
                label={<span style={{ fontSize: '16px', fontWeight: 600 }}>End Date</span>}
                rules={[{ required: true, message: 'Please select end date' }]}
              >
                <DatePicker
                  format="YYYY-MM-DD"
                  style={{ width: '100%', fontSize: '16px', minHeight: '40px' }}
                  size="large"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="start_time"
                label={<span style={{ fontSize: '16px', fontWeight: 600 }}>Start Time</span>}
                rules={[{ required: true, message: 'Please select start time' }]}
              >
                <TimePicker
                  format="HH:mm"
                  style={{ width: '100%', fontSize: '16px', minHeight: '40px' }}
                  size="large"
                  placeholder="Select start time"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="end_time"
                label={<span style={{ fontSize: '16px', fontWeight: 600 }}>End Time</span>}
                rules={[{ required: true, message: 'Please select end time' }]}
              >
                <TimePicker
                  format="HH:mm"
                  style={{ width: '100%', fontSize: '16px', minHeight: '40px' }}
                  size="large"
                  placeholder="Select end time"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="venue"
            label={<span style={{ fontSize: '16px', fontWeight: 600 }}>Venue</span>}
          >
            <Input placeholder="Enter venue (default: Parliament Building)" size="large" style={{ fontSize: '16px', minHeight: '40px' }} />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="organizer"
                label={<span style={{ fontSize: '16px', fontWeight: 600 }}>Session Organizer</span>}
                tooltip="Officer responsible for organizing this parliament session"
              >
                <Select
                  placeholder="Select session organizer"
                  loading={usersLoading}
                  allowClear
                  showSearch
                  size="large"
                  style={{ fontSize: '16px', minHeight: '40px' }}
                  optionFilterProp="children"
                  filterOption={(input, option) =>
                    (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
                  }
                >
                  {users.map((user) => (
                    <Option key={user.id} value={user.id}>
                      {user.username} ({user.first_name} {user.last_name}) - {user.role}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="managing_subcenter"
                label={<span style={{ fontSize: '16px', fontWeight: 600 }}>Managing SubCenter</span>}
                tooltip="SubCenter responsible for managing this session (optional)"
              >
                <Select
                  placeholder="Select managing subcenter"
                  loading={subcentersLoading}
                  allowClear
                  showSearch
                  size="large"
                  style={{ fontSize: '16px', minHeight: '40px' }}
                  optionFilterProp="children"
                  filterOption={(input, option) =>
                    (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
                  }
                >
                  {subcenters.map((subcenter) => (
                    <Option key={subcenter.id} value={subcenter.id}>
                      {subcenter.name} ({subcenter.code})
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="program"
            label={<span style={{ fontSize: '16px', fontWeight: 600 }}>Related Program</span>}
            tooltip="Program this session belongs to (optional)"
          >
            <Select
              placeholder="Select program (optional)"
              loading={programsLoading}
              allowClear
              showSearch
              size="large"
              style={{ fontSize: '16px', minHeight: '40px' }}
              optionFilterProp="children"
              filterOption={(input, option) =>
                (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
              }
            >
              {programs.map((program) => (
                <Option key={program.id} value={program.id}>
                  {program.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="description"
            label={<span style={{ fontSize: '16px', fontWeight: 600 }}>Description</span>}
          >
            <Input.TextArea
              rows={3}
              placeholder="Describe the purpose and agenda of this session"
              style={{ fontSize: '16px' }}
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="fuel_top_up_litres"
                label={<span style={{ fontSize: '16px', fontWeight: 600 }}>Fuel Top-up (Litres)</span>}
                tooltip="Additional fuel litres for session attendees"
              >
                <InputNumber
                  min={0}
                  max={1000}
                  step={5}
                  style={{ width: '100%', fontSize: '16px', minHeight: '40px' }}
                  size="large"
                  placeholder="Enter additional fuel litres"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="fuel_top_up_percentage"
                label={<span style={{ fontSize: '16px', fontWeight: 600 }}>Fuel Top-up (%)</span>}
                tooltip="Percentage-based fuel increase for attendees"
              >
                <InputNumber
                  min={0}
                  max={100}
                  step={5}
                  style={{ width: '100%', fontSize: '16px', minHeight: '40px' }}
                  size="large"
                  placeholder="Enter percentage increase"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="expected_attendance"
                label={<span style={{ fontSize: '16px', fontWeight: 600 }}>Expected Attendance</span>}
                tooltip="Expected number of attendees"
              >
                <InputNumber
                  min={0}
                  max={500}
                  style={{ width: '100%', fontSize: '16px', minHeight: '40px' }}
                  size="large"
                  placeholder="Number of expected attendees"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="attendance_tracked"
                label="Track Attendance"
                valuePropName="checked"
                tooltip="Enable attendance tracking for this session"
              >
                <Switch />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="is_mandatory"
                label="Mandatory Attendance"
                valuePropName="checked"
                tooltip="Whether attendance at this session is mandatory for all members"
              >
                <Switch />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="is_active"
                label="Active Session"
                valuePropName="checked"
                tooltip="Whether this session is active and accepting attendees"
              >
                <Switch />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="assigned_attendees"
            label="Assigned Attendees"
            tooltip="Select beneficiaries who should attend this session"
          >
            <Select
              mode="multiple"
              placeholder="Select attendees (optional)"
              loading={beneficiariesLoading}
              allowClear
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) =>
                (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
              }
              style={{ width: '100%' }}
            >
              {beneficiaries.map((beneficiary) => {
                const id = parseInt(beneficiary.id.toString(), 10);
                return (
                  <Option key={id} value={id}>
                    {beneficiary.name || `${beneficiary.user?.first_name} ${beneficiary.user?.last_name}` || beneficiary.employee_id}
                    {beneficiary.category?.name && ` (${beneficiary.category.name})`}
                  </Option>
                );
              })}
            </Select>
          </Form.Item>

          <Form.Item className="mb-0">
            <Space className="w-full justify-end">
              <Button onClick={() => {
                setModalVisible(false);
                form.resetFields();
              }}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit" loading={tableLoading}>
                {editingSession ? 'Update' : 'Create'} Session
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Detail View Modal */}
      <Modal
        title="Parliament Session Details"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            Close
          </Button>,
          <Button 
            key="edit" 
            type="primary" 
            onClick={() => {
              setDetailModalVisible(false);
              if (viewingSession) handleEdit(viewingSession);
            }}
          >
            Edit Session
          </Button>
        ]}
        width={700}
      >
        {viewingSession && (
          <Descriptions bordered column={2}>
            <Descriptions.Item label="Title" span={2}>
              {viewingSession.title}
            </Descriptions.Item>
            <Descriptions.Item label="Type">
                <Tag color="blue">
                {(viewingSession.session_type || '').replace('_', ' ')}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              {getSessionStatus(viewingSession)}
            </Descriptions.Item>
            <Descriptions.Item label="Start Date">
              {dayjs(viewingSession.start_date).format('MMMM DD, YYYY HH:mm')}
            </Descriptions.Item>
            <Descriptions.Item label="End Date">
              {dayjs(viewingSession.end_date).format('MMMM DD, YYYY HH:mm')}
            </Descriptions.Item>
            <Descriptions.Item label="Venue" span={2}>
              <EnvironmentOutlined /> {viewingSession.venue}
            </Descriptions.Item>
            <Descriptions.Item label="Session Manager">
              {viewingSession.organizer_details ? (
                <div>
                  <UserOutlined /> {viewingSession.organizer_details.username}
                  <br />
                  <Text type="secondary" className="text-sm">
                    {viewingSession.organizer_details.first_name} {viewingSession.organizer_details.last_name}
                  </Text>
                </div>
              ) : (
                <Text type="secondary">Not assigned</Text>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Managing SubCenter">
              {viewingSession.managing_subcenter_details ? (
                <div>
                  {viewingSession.managing_subcenter_details.name}
                  <br />
                  <Text type="secondary" className="text-sm">
                    Code: {viewingSession.managing_subcenter_details.code}
                  </Text>
                </div>
              ) : (
                <Text type="secondary">None</Text>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Fuel Entitlement">
              {viewingSession.fuel_entitlement_litres || 0} Litres
            </Descriptions.Item>
            <Descriptions.Item label="Mandatory">
              {viewingSession.is_mandatory ? (
                <Badge status="success" text="Yes" />
              ) : (
                <Badge status="default" text="No" />
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Duration">
              {dayjs(viewingSession.end_date).diff(dayjs(viewingSession.start_date), 'hours')} hours
            </Descriptions.Item>
            <Descriptions.Item label="Active">
              {viewingSession.is_active ? (
                <Badge status="success" text="Active" />
              ) : (
                <Badge status="error" text="Inactive" />
              )}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default ParliamentSessionsPage;
