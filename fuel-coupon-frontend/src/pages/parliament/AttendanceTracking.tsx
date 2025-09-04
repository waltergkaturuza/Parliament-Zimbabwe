// src/pages/parliament/AttendanceTracking.tsx
import { useState, useEffect } from 'react';
import type { FC } from 'react';
import { Card, Table, Button, Space, Form, Select, DatePicker, Modal, Tag, Spin, Typography, Row, Col, Statistic, Input, App } from 'antd';
import { PlusOutlined, EditOutlined, UserOutlined, CalendarOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import apiClient from '@/api/index';
import type { SessionAttendance, ParliamentSession, BeneficiaryProfile } from '../../types';
import dayjs from 'dayjs';

const { Title } = Typography;
const { Option } = Select;

interface AttendanceStats {
  totalRecords: number;
  presentToday: number;
  absentToday: number;
  attendanceRate: number;
}

const AttendanceTracking: FC = () => {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(true);
  const [attendanceRecords, setAttendanceRecords] = useState<SessionAttendance[]>([]);
  const [sessions, setSessions] = useState<ParliamentSession[]>([]);
  const [beneficiaries, setBeneficiaries] = useState<BeneficiaryProfile[]>([]);
  const [stats, setStats] = useState<AttendanceStats>({
    totalRecords: 0,
    presentToday: 0,
    absentToday: 0,
    attendanceRate: 0
  });
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<SessionAttendance | null>(null);
  const [selectedSession, setSelectedSession] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs>(dayjs());
  const [form] = Form.useForm();

  // --- Category filter and multi-select logic ---
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  const [selectedBeneficiaryIds, setSelectedBeneficiaryIds] = useState<string[]>([]);

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
    loadData();
  }, []);

  useEffect(() => {
    if (selectedSession && selectedDate) {
      loadAttendanceRecords();
    }
  }, [selectedSession, selectedDate]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [sessionsResponse, beneficiariesResponse] = await Promise.all([
        apiClient.get('/parliament-sessions/'),
        apiClient.get('/beneficiary-profiles/', { params: { page_size: 500 } })
      ]);

      const sessionData = sessionsResponse.data.results || sessionsResponse.data;
      const beneficiaryData = beneficiariesResponse.data.results || beneficiariesResponse.data;

      setSessions(sessionData);
      setBeneficiaries(beneficiaryData);

      // Set default session to the first active session
      const activeSession = sessionData.find((s: ParliamentSession) => s.status === 'active');
      if (activeSession) {
        setSelectedSession(activeSession.id);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      message.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadAttendanceRecords = async () => {
    if (!selectedSession || !selectedDate) return;

    try {
      const response = await apiClient.get('/session-attendances/', {
        params: {
          session: selectedSession,
          date: selectedDate.format('YYYY-MM-DD')
        }
      });
      
      const attendanceData = response.data.results || response.data;
      setAttendanceRecords(attendanceData);

      // Calculate stats
      const today = dayjs().format('YYYY-MM-DD');
      const todayRecords = attendanceData.filter((record: SessionAttendance) => 
        dayjs(record.date).format('YYYY-MM-DD') === today
      );

      const presentToday = todayRecords.filter((record: SessionAttendance) => record.status === 'present').length;
      const absentToday = todayRecords.filter((record: SessionAttendance) => record.status === 'absent').length;
      const totalToday = presentToday + absentToday;

      const newStats: AttendanceStats = {
        totalRecords: attendanceData.length,
        presentToday,
        absentToday,
        attendanceRate: totalToday > 0 ? Math.round((presentToday / totalToday) * 100) : 0
      };
      setStats(newStats);
    } catch (error) {
      console.error('Error loading attendance records:', error);
      message.error('Failed to load attendance records');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      const attendanceData = {
        session: values.session,
        beneficiary: values.beneficiary,
        date: values.date.format('YYYY-MM-DD'),
        status_write: values.status, // Use status_write field for backend
        notes: values.notes || ''
      };

      if (editingRecord) {
        await apiClient.put(`/session-attendances/${editingRecord.id}/`, attendanceData);
        message.success('Attendance record updated successfully');
      } else {
        await apiClient.post('/session-attendances/', attendanceData);
        message.success('Attendance record created successfully');
      }

      setModalVisible(false);
      setEditingRecord(null);
      form.resetFields();
      loadAttendanceRecords();
    } catch (error) {
      console.error('Error saving attendance record:', error);
      message.error('Failed to save attendance record');
    }
  };

  const handleEdit = (record: SessionAttendance) => {
    setEditingRecord(record);
    form.setFieldsValue({
      session: record.session?.id,
      beneficiary: record.beneficiary?.id,
      date: dayjs(record.date),
      status: record.status,
      notes: record.notes
    });
    setModalVisible(true);
  };

  const markAttendance = async (beneficiaryId: string, status: 'present' | 'absent') => {
    try {
      const attendanceData = {
        session: selectedSession,
        beneficiary: beneficiaryId,
        date: selectedDate.format('YYYY-MM-DD'),
        status_write: status // Use status_write field for backend
      };

      await apiClient.post('/session-attendances/', attendanceData);
      message.success(`Marked ${status}`);
      loadAttendanceRecords();
    } catch (error) {
      console.error('Error marking attendance:', error);
      message.error('Failed to mark attendance');
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'present': 'green',
      'absent': 'red',
      'excused': 'orange',
      'late': 'yellow'
    };
    return colors[status] || 'default';
  };

  const columns = [
    {
      title: 'Beneficiary',
      key: 'beneficiary',
      render: (_: any, record: SessionAttendance) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>
            {record.beneficiary?.user?.first_name} {record.beneficiary?.user?.last_name}
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {record.beneficiary?.constituency?.name}
          </div>
        </div>
      )
    },
    {
      title: 'Session',
      dataIndex: ['session', 'name'],
      key: 'session'
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => dayjs(date).format('DD/MM/YYYY')
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
      title: 'Notes',
      dataIndex: 'notes',
      key: 'notes',
      ellipsis: true
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: SessionAttendance) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button>
        </Space>
      )
    }
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <p>Loading attendance data...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', fontFamily: 'Rockwell, serif' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ fontFamily: 'Rockwell, serif', fontSize: '18px', margin: 0 }}>
          Parliament Attendance Tracking
        </Title>
        <p style={{ color: '#666', margin: '8px 0 0 0', fontSize: '16px' }}>
          Track and manage parliament member attendance for fuel allocation
        </p>
      </div>

      {/* Stats Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Records"
              value={stats.totalRecords}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Present Today"
              value={stats.presentToday}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Absent Today"
              value={stats.absentToday}
              prefix={<CloseCircleOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Attendance Rate"
              value={stats.attendanceRate}
              suffix="%"
              valueStyle={{ color: stats.attendanceRate >= 80 ? '#52c41a' : stats.attendanceRate >= 60 ? '#fa8c16' : '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card style={{ marginBottom: '16px' }}>
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
                {beneficiaryCategories.map((cat) => (
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
                {filteredBeneficiaries.map((b) => {
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
      </Card>
      <Card style={{ marginBottom: '16px' }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={8}>
            <Space>
              <span>Session:</span>
              <Select
                style={{ width: 200 }}
                value={selectedSession}
                onChange={setSelectedSession}
                placeholder="Select session"
              >
                {sessions.map((session) => (
                  <Option key={session.id} value={session.id}>
                    {session.name}
                  </Option>
                ))}
              </Select>
            </Space>
          </Col>
          <Col xs={24} sm={8}>
            <Space>
              <span>Date:</span>
              <DatePicker
                value={selectedDate}
                onChange={(date) => date && setSelectedDate(date)}
              />
            </Space>
          </Col>
          <Col xs={24} sm={8}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditingRecord(null);
                form.resetFields();
                form.setFieldsValue({
                  session: selectedSession,
                  date: selectedDate
                });
                setModalVisible(true);
              }}
            >
              Mark Attendance
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Quick Attendance Marking */}
      {selectedSession && (
        <Card style={{ marginBottom: '16px' }}>
          <Title level={4} style={{ fontFamily: 'Rockwell, serif', fontSize: '16px', marginBottom: '16px' }}>
            Quick Attendance Marking for {selectedDate.format('DD/MM/YYYY')}
          </Title>
          <Row gutter={[16, 16]}>
            {beneficiaries.map((beneficiary) => {
              const displayName = beneficiary.user
                ? `${beneficiary.user.first_name || ''} ${beneficiary.user.last_name || ''}`.trim()
                : (beneficiary.constituency?.name || 'Unknown Name');
              return (
                <Col xs={24} sm={12} md={8} lg={6} key={beneficiary.id}>
                  <Card size="small">
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                        {displayName}
                      </div>
                      <Space>
                        <Button
                          size="small"
                          type="primary"
                          icon={<CheckCircleOutlined />}
                          onClick={() => markAttendance(beneficiary.id, 'present')}
                        >
                          Present
                        </Button>
                        <Button
                          size="small"
                          danger
                          icon={<CloseCircleOutlined />}
                          onClick={() => markAttendance(beneficiary.id, 'absent')}
                        >
                          Absent
                        </Button>
                      </Space>
                    </div>
                  </Card>
                </Col>
              );
            })}
          </Row>
        </Card>
      )}

      {/* Attendance Records Table */}
      <Card>
        <div style={{ marginBottom: '16px' }}>
          <Title level={4} style={{ fontFamily: 'Rockwell, serif', fontSize: '16px', margin: 0 }}>
            Attendance Records
          </Title>
        </div>

        <Table
          columns={columns}
          dataSource={attendanceRecords}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} records`
          }}
        />
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        title={editingRecord ? 'Edit Attendance Record' : 'Mark Attendance'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingRecord(null);
          form.resetFields();
        }}
        footer={null}
        width={500}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          style={{ fontFamily: 'Rockwell, serif' }}
        >
          <Form.Item
            name="session"
            label="Session"
            rules={[{ required: true, message: 'Please select session' }]}
          >
            <Select placeholder="Select session">
              {sessions.map((session) => (
                <Option key={session.id} value={session.id}>
                  {session.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="beneficiary"
            label="Beneficiary"
            rules={[{ required: true, message: 'Please select beneficiary' }]}
          >
            <Select placeholder="Select beneficiary" showSearch>
              {beneficiaries.map((beneficiary) => {
                const displayName = beneficiary.user
                  ? `${beneficiary.user.first_name || ''} ${beneficiary.user.last_name || ''}`.trim()
                  : (beneficiary.constituency?.name || 'Unknown Name');
                return (
                  <Option key={beneficiary.id} value={beneficiary.id}>
                    {displayName}
                  </Option>
                );
              })}
            </Select>
          </Form.Item>

          <Form.Item
            name="date"
            label="Date"
            rules={[{ required: true, message: 'Please select date' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="status"
            label="Status"
            rules={[{ required: true, message: 'Please select status' }]}
          >
            <Select placeholder="Select status">
              <Option value="present">Present</Option>
              <Option value="absent">Absent</Option>
              <Option value="excused">Excused</Option>
              <Option value="late">Late</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="notes"
            label="Notes"
          >
            <Input.TextArea 
              rows={3} 
              placeholder="Additional notes (optional)"
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit">
                {editingRecord ? 'Update Record' : 'Mark Attendance'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AttendanceTracking;
