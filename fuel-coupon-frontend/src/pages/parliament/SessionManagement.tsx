// src/pages/parliament/SessionManagement.tsx
import { useState, useEffect } from 'react';
import type { FC } from 'react';
import { Card, Table, Button, Space, Form, Input, DatePicker, Select, Modal, Tag, message, Spin, Typography, Row, Col, Statistic } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, CalendarOutlined, UserOutlined } from '@ant-design/icons';
import apiClient from '@/api/apiClient';
import type { ParliamentSession, BeneficiaryProfile } from '../../types';
import dayjs from 'dayjs';

const { Title } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

interface SessionStats {
  totalSessions: number;
  activeSessions: number;
  completedSessions: number;
  totalAttendees: number;
}

const SessionManagement: FC = () => {
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<ParliamentSession[]>([]);
  const [stats, setStats] = useState<SessionStats>({
    totalSessions: 0,
    activeSessions: 0,
    completedSessions: 0,
    totalAttendees: 0
  });
  const [modalVisible, setModalVisible] = useState(false);
  const [editingSession, setEditingSession] = useState<ParliamentSession | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/v1/parliament-sessions/');
      const sessionData = response.data.results || response.data;
      setSessions(sessionData);

      // Calculate stats
      const newStats: SessionStats = {
        totalSessions: sessionData.length,
        activeSessions: sessionData.filter((s: ParliamentSession) => s.status === 'active').length,
        completedSessions: sessionData.filter((s: ParliamentSession) => s.status === 'completed').length,
        totalAttendees: sessionData.reduce((sum: number, session: ParliamentSession) => 
          sum + (session.attendances?.length || 0), 0)
      };
      setStats(newStats);
    } catch (error) {
      console.error('Error loading sessions:', error);
      message.error('Failed to load parliament sessions');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      const sessionData = {
        name: values.name,
        description: values.description,
        session_type: values.session_type,
        start_date: values.dateRange[0].format('YYYY-MM-DD'),
        end_date: values.dateRange[1].format('YYYY-MM-DD'),
        status: values.status || 'scheduled'
      };

      if (editingSession) {
        await apiClient.put(`/parliament-sessions/${editingSession.id}/`, sessionData);
        message.success('Session updated successfully');
      } else {
        await apiClient.post('/api/v1/parliament-sessions/', sessionData);
        message.success('Session created successfully');
      }

      setModalVisible(false);
      setEditingSession(null);
      form.resetFields();
      loadSessions();
    } catch (error) {
      console.error('Error saving session:', error);
      message.error('Failed to save session');
    }
  };

  const handleEdit = (session: ParliamentSession) => {
    setEditingSession(session);
    form.setFieldsValue({
      name: session.name,
      description: session.description,
      session_type: session.session_type,
      dateRange: [dayjs(session.start_date), dayjs(session.end_date)],
      status: session.status
    });
    setModalVisible(true);
  };

  const handleDelete = async (sessionId: string) => {
    Modal.confirm({
      title: 'Delete Session',
      content: 'Are you sure you want to delete this parliament session?',
      okText: 'Yes',
      okType: 'danger',
      cancelText: 'No',
      onOk: async () => {
        try {
          await apiClient.delete(`/parliament-sessions/${sessionId}/`);
          message.success('Session deleted successfully');
          loadSessions();
        } catch (error) {
          console.error('Error deleting session:', error);
          message.error('Failed to delete session');
        }
      }
    });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'scheduled': 'blue',
      'active': 'green',
      'completed': 'gray',
      'cancelled': 'red'
    };
    return colors[status] || 'default';
  };

  const columns = [
    {
      title: 'Session Name',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: ParliamentSession) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{text}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {record.session_type?.toUpperCase()}
          </div>
        </div>
      )
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true
    },
    {
      title: 'Start Date',
      dataIndex: 'start_date',
      key: 'start_date',
      render: (date: string) => dayjs(date).format('DD/MM/YYYY')
    },
    {
      title: 'End Date',
      dataIndex: 'end_date',
      key: 'end_date',
      render: (date: string) => dayjs(date).format('DD/MM/YYYY')
    },
    {
      title: 'Duration',
      key: 'duration',
      render: (_: any, record: ParliamentSession) => {
        const days = dayjs(record.end_date).diff(dayjs(record.start_date), 'day') + 1;
        return `${days} day${days !== 1 ? 's' : ''}`;
      }
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>
          {status.toUpperCase()}
        </Tag>
      )
    },
    {
      title: 'Attendees',
      key: 'attendees',
      render: (_: any, record: ParliamentSession) => (
        <div>
          <UserOutlined /> {record.attendances?.length || 0}
        </div>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: ParliamentSession) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          >
            Delete
          </Button>
        </Space>
      )
    }
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <p>Loading parliament sessions...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', fontFamily: 'Rockwell, serif' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ fontFamily: 'Rockwell, serif', fontSize: '18px', margin: 0 }}>
          Parliament Session Management
        </Title>
        <p style={{ color: '#666', margin: '8px 0 0 0', fontSize: '16px' }}>
          Create and manage parliament sessions for fuel allocation tracking
        </p>
      </div>

      {/* Stats Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Sessions"
              value={stats.totalSessions}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Active Sessions"
              value={stats.activeSessions}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Completed Sessions"
              value={stats.completedSessions}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Attendees"
              value={stats.totalAttendees}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Sessions Table */}
      <Card>
        <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={4} style={{ fontFamily: 'Rockwell, serif', fontSize: '16px', margin: 0 }}>
            Parliament Sessions
          </Title>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingSession(null);
              form.resetFields();
              setModalVisible(true);
            }}
          >
            Create Session
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={sessions}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} sessions`
          }}
        />
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        title={editingSession ? 'Edit Parliament Session' : 'Create Parliament Session'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingSession(null);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          style={{ fontFamily: 'Rockwell, serif' }}
        >
          <Form.Item
            name="name"
            label="Session Name"
            rules={[{ required: true, message: 'Please enter session name' }]}
          >
            <Input placeholder="e.g., 2024 Budget Session" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: 'Please enter session description' }]}
          >
            <Input.TextArea 
              rows={3} 
              placeholder="Brief description of the parliament session"
            />
          </Form.Item>

          <Form.Item
            name="session_type"
            label="Session Type"
            rules={[{ required: true, message: 'Please select session type' }]}
          >
            <Select placeholder="Select session type">
              <Option value="budget">Budget Session</Option>
              <Option value="ordinary">Ordinary Session</Option>
              <Option value="special">Special Session</Option>
              <Option value="emergency">Emergency Session</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="dateRange"
            label="Session Period"
            rules={[{ required: true, message: 'Please select session dates' }]}
          >
            <RangePicker style={{ width: '100%' }} />
          </Form.Item>

          {editingSession && (
            <Form.Item
              name="status"
              label="Status"
            >
              <Select placeholder="Select status">
                <Option value="scheduled">Scheduled</Option>
                <Option value="active">Active</Option>
                <Option value="completed">Completed</Option>
                <Option value="cancelled">Cancelled</Option>
              </Select>
            </Form.Item>
          )}

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit">
                {editingSession ? 'Update Session' : 'Create Session'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SessionManagement;
