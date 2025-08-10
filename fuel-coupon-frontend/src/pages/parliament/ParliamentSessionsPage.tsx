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
  App
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
  const { message } = App.useApp();
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

  useEffect(() => {
    loadSessions();
    loadUsers();
    loadSubcenters();
  }, []);

  const loadSessions = async () => {
    try {
      setLoading(true);
            const response = await apiClient.get('/subcenters/');
      const sessionData = response.data.results || response.data;
      setSessions(sessionData);

      // Calculate stats
      const now = dayjs();
      const newStats: SessionStats = {
        totalSessions: sessionData.length,
        activeSessions: sessionData.filter((s: ParliamentSession) => 
          dayjs(s.start_date).isBefore(now) && dayjs(s.end_date).isAfter(now)
        ).length,
        completedSessions: sessionData.filter((s: ParliamentSession) => 
          dayjs(s.end_date).isBefore(now)
        ).length,
        upcomingSessions: sessionData.filter((s: ParliamentSession) => 
          dayjs(s.start_date).isAfter(now)
        ).length,
        totalAttendees: sessionData.reduce((sum: number, session: ParliamentSession) => 
          sum + (session.attendees?.length || 0), 0
        ),
        totalFuelEntitlement: sessionData.reduce((sum: number, session: ParliamentSession) => 
          sum + parseFloat(session.fuel_entitlement_litres || '0'), 0
        )
      };
      setStats(newStats);
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
      const response = await apiClient.get('/api/v1/users/?role=MAIN_CENTER,SUB_CENTER');
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

  const handleCreate = () => {
    setEditingSession(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (session: ParliamentSession) => {
    setEditingSession(session);
    form.setFieldsValue({
      title: session.title,
      session_type: session.session_type,
      start_date: dayjs(session.start_date),
      end_date: dayjs(session.end_date),
      venue: session.venue,
      fuel_entitlement_litres: parseFloat(session.fuel_entitlement_litres || '0'),
      is_mandatory: session.is_mandatory,
      is_active: session.is_active,
      session_manager: session.session_manager,
      managing_subcenter: session.managing_subcenter
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
        session_type: values.session_type,
        start_date: values.start_date.toISOString(),
        end_date: values.end_date.toISOString(),
        venue: values.venue || 'Parliament Building',
        fuel_entitlement_litres: values.fuel_entitlement_litres || 0,
        is_mandatory: values.is_mandatory || false,
        is_active: values.is_active !== false
      };

      if (editingSession) {
        await apiClient.put(`/parliament-sessions/${editingSession.id}/`, payload);
        message.success('Parliament session updated successfully');
      } else {
        await apiClient.post('/parliament-sessions/', payload);
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
    const now = dayjs();
    const start = dayjs(session.start_date);
    const end = dayjs(session.end_date);

    if (!session.is_active) {
      return <Tag color="default">Inactive</Tag>;
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
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      sorter: (a: ParliamentSession, b: ParliamentSession) => a.title.localeCompare(b.title),
      render: (text: string, record: ParliamentSession) => (
        <div>
          <Text strong>{text}</Text>
          <br />
          <Text type="secondary" className="text-xs">
            {record.session_type && record.session_type.replace('_', ' ')}
          </Text>
        </div>
      ),
    },
    {
      title: 'Date & Time',
      key: 'dates',
      sorter: (a: ParliamentSession, b: ParliamentSession) => 
        dayjs(a.start_date).unix() - dayjs(b.start_date).unix(),
      render: (_: any, record: ParliamentSession) => (
        <div>
          <div><CalendarOutlined /> {dayjs(record.start_date).format('MMM DD, YYYY')}</div>
          <div className="text-xs text-gray-500">
            {dayjs(record.start_date).format('HH:mm')} - {dayjs(record.end_date).format('HH:mm')}
          </div>
        </div>
      ),
    },
    {
      title: 'Venue',
      dataIndex: 'venue',
      key: 'venue',
      render: (venue: string) => (
        <span>
          <EnvironmentOutlined /> {venue}
        </span>
      ),
    },
    {
      title: 'Session Manager',
      key: 'session_manager',
      render: (_: any, record: ParliamentSession) => {
        if (record.session_manager_details) {
          return (
            <div>
              <div><UserOutlined /> {record.session_manager_details.username}</div>
              <div className="text-xs text-gray-500">
                {record.session_manager_details.first_name} {record.session_manager_details.last_name}
              </div>
            </div>
          );
        }
        return <Text type="secondary">Not assigned</Text>;
      },
    },
    {
      title: 'Fuel Entitlement',
      dataIndex: 'fuel_entitlement_litres',
      key: 'fuel_entitlement_litres',
      align: 'center' as const,
      render: (litres: number) => (
        <Tag color="orange">
          {litres ? `${litres}L` : '0L'}
        </Tag>
      ),
    },
    {
      title: 'Mandatory',
      dataIndex: 'is_mandatory',
      key: 'is_mandatory',
      align: 'center' as const,
      render: (mandatory: boolean) => (
        mandatory ? <CheckOutlined style={{ color: 'green' }} /> : <CloseOutlined style={{ color: 'red' }} />
      ),
    },
    {
      title: 'Status',
      key: 'status',
      align: 'center' as const,
      render: (_: any, record: ParliamentSession) => getSessionStatus(record),
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
        title={editingSession ? 'Edit Parliament Session' : 'Create Parliament Session'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            venue: 'Parliament Building',
            fuel_entitlement_litres: 0,
            is_mandatory: false,
            is_active: true
          }}
        >
          <Form.Item
            name="title"
            label="Session Title"
            rules={[{ required: true, message: 'Please enter session title' }]}
          >
            <Input placeholder="Enter session title" />
          </Form.Item>

          <Form.Item
            name="session_type"
            label="Session Type"
            rules={[{ required: true, message: 'Please select session type' }]}
          >
            <Select placeholder="Select session type">
              <Option value="SITTING">Parliament Sitting</Option>
              <Option value="COMMITTEE">Committee Meeting</Option>
              <Option value="NATIONAL_EVENT">National Event</Option>
              <Option value="SPECIAL_SESSION">Special Session</Option>
            </Select>
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="start_date"
                label="Start Date & Time"
                rules={[{ required: true, message: 'Please select start date' }]}
              >
                <DatePicker
                  showTime
                  format="YYYY-MM-DD HH:mm"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="end_date"
                label="End Date & Time"
                rules={[{ required: true, message: 'Please select end date' }]}
              >
                <DatePicker
                  showTime
                  format="YYYY-MM-DD HH:mm"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="venue"
            label="Venue"
          >
            <Input placeholder="Enter venue (default: Parliament Building)" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="session_manager"
                label="Session Manager"
                tooltip="Officer responsible for managing this parliament session"
              >
                <Select
                  placeholder="Select session manager"
                  loading={usersLoading}
                  allowClear
                  showSearch
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
                label="Managing SubCenter"
                tooltip="SubCenter responsible for managing this session (optional)"
              >
                <Select
                  placeholder="Select managing subcenter"
                  loading={subcentersLoading}
                  allowClear
                  showSearch
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
            name="fuel_entitlement_litres"
            label="Fuel Entitlement (Litres)"
            tooltip="Additional fuel entitlement for attending this session"
          >
            <InputNumber
              min={0}
              max={1000}
              step={5}
              style={{ width: '100%' }}
              placeholder="Enter fuel entitlement in litres"
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="is_mandatory"
                label="Mandatory Attendance"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="is_active"
                label="Active"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
          </Row>

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
                {viewingSession.session_type?.replace('_', ' ')}
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
              {viewingSession.session_manager_details ? (
                <div>
                  <UserOutlined /> {viewingSession.session_manager_details.username}
                  <br />
                  <Text type="secondary" className="text-sm">
                    {viewingSession.session_manager_details.first_name} {viewingSession.session_manager_details.last_name}
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
