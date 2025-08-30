import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Typography,
  Space,
  Tag,
  Avatar,
  Tooltip,
  Row,
  Col,
  Statistic,
  Progress,
  Alert,
  Modal,
  Input,
  message,
  Breadcrumb,
  Descriptions,
  Divider,
  Select,
  Spin,
  Radio,
  Badge
} from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  UserOutlined,
  SaveOutlined,
  SendOutlined,
  EditOutlined,
  HistoryOutlined,
  CommentOutlined,
  HomeOutlined,
  TeamOutlined,
  CalendarOutlined
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/api';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

interface AttendanceRegistry {
  id: number;
  title: string;
  attendance_date: string;
  status: string;
  session_details?: {
    id: number;
    title: string;
    session_type: string;
    venue: string;
    start_time: string;
    end_time: string;
    session_number: number;
  };
  program_details?: {
    id: number;
    title: string;
    program_type: string;
    description: string;
  };
  managing_subcenter_name: string;
  total_expected: number;
  total_present: number;
  total_absent: number;
  total_excused: number;
  total_late: number;
  attendance_percentage: number;
  published_date: string;
  submitted_date?: string;
  notes?: string;
  can_mark_attendance: boolean;
  can_submit: boolean;
}

interface AttendanceMember {
  id: number;
  member_details: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
    constituency?: string;
    party_affiliation?: string;
    profile_picture?: string;
  };
  attendance_status: 'PRESENT' | 'ABSENT' | 'EXCUSED' | 'LATE' | null;
  marked_at?: string;
  notes?: string;
  excuse_reason?: string;
  arrival_time?: string;
}

const AttendanceMarkingPage: React.FC = () => {
  const { registryId } = useParams<{ registryId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [registry, setRegistry] = useState<AttendanceRegistry | null>(null);
  const [members, setMembers] = useState<AttendanceMember[]>([]);
  const [selectedMember, setSelectedMember] = useState<AttendanceMember | null>(null);
  const [markingModalVisible, setMarkingModalVisible] = useState(false);
  const [submitModalVisible, setSubmitModalVisible] = useState(false);
  const [submitNotes, setSubmitNotes] = useState('');
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    if (registryId) {
      fetchRegistryDetails();
      fetchMembers();
    }
  }, [registryId]);

  const fetchRegistryDetails = async () => {
    try {
  const response = await api.get(`/attendance-registries/${registryId}/`);
      setRegistry(response.data);
    } catch (err: any) {
      console.error('Error fetching registry:', err);
      message.error('Failed to load attendance registry');
    }
  };

  const fetchMembers = async () => {
    try {
      setLoading(true);
  const response = await api.get(`/attendance-registries/${registryId}/members/`);
      setMembers(response.data.results || response.data);
    } catch (err: any) {
      console.error('Error fetching members:', err);
      message.error('Failed to load attendance members');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAttendance = async (memberId: number, status: string, notes?: string, excuseReason?: string) => {
    try {
  const endpoint = `/attendance-members/${memberId}/mark_${status.toLowerCase()}/`;
      await api.post(endpoint, {
        notes,
        excuse_reason: excuseReason,
        arrival_time: status === 'LATE' ? dayjs().format('HH:mm:ss') : undefined
      });
      
      message.success(`Member marked as ${status.toLowerCase()}`);
      fetchMembers();
      fetchRegistryDetails();
      setMarkingModalVisible(false);
      setSelectedMember(null);
    } catch (err: any) {
      console.error('Error marking attendance:', err);
      message.error(err.response?.data?.error || 'Failed to mark attendance');
    }
  };

  const handleSubmitAttendance = async () => {
    try {
      setSubmitting(true);
  await api.post(`/attendance-registries/${registryId}/submit_attendance/`, {
        notes: submitNotes
      });
      
      message.success('Attendance submitted for review');
      setSubmitModalVisible(false);
      fetchRegistryDetails();
      navigate('/sergeant-of-arms/attendance');
    } catch (err: any) {
      console.error('Error submitting attendance:', err);
      message.error(err.response?.data?.error || 'Failed to submit attendance');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'PRESENT':
        return 'success';
      case 'ABSENT':
        return 'error';
      case 'EXCUSED':
        return 'warning';
      case 'LATE':
        return 'processing';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case 'PRESENT':
        return <CheckCircleOutlined />;
      case 'ABSENT':
        return <CloseCircleOutlined />;
      case 'EXCUSED':
        return <ExclamationCircleOutlined />;
      case 'LATE':
        return <ClockCircleOutlined />;
      default:
        return <UserOutlined />;
    }
  };

  const filteredMembers = members.filter(member => {
    const matchesSearch = searchText === '' || 
      `${member.member_details.first_name} ${member.member_details.last_name}`
        .toLowerCase()
        .includes(searchText.toLowerCase()) ||
      member.member_details.constituency?.toLowerCase().includes(searchText.toLowerCase());
    
    const matchesStatus = statusFilter === '' || 
      (statusFilter === 'UNMARKED' && !member.attendance_status) ||
      member.attendance_status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const columns = [
    {
      title: 'Member',
      key: 'member',
      render: (record: AttendanceMember) => (
        <Space>
          <Avatar 
            src={record.member_details.profile_picture}
            icon={<UserOutlined />}
            size="large"
          />
          <div>
            <div>
              <Text strong>
                {record.member_details.first_name} {record.member_details.last_name}
              </Text>
            </div>
            {record.member_details.constituency && (
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {record.member_details.constituency}
              </Text>
            )}
            {record.member_details.party_affiliation && (
              <div>
                <Tag color="blue">
                  {record.member_details.party_affiliation}
                </Tag>
              </div>
            )}
          </div>
        </Space>
      ),
    },
    {
      title: 'Contact',
      key: 'contact',
      render: (record: AttendanceMember) => (
        <Space direction="vertical" size="small">
          <Text style={{ fontSize: '12px' }}>{record.member_details.email}</Text>
          <Text style={{ fontSize: '12px' }}>{record.member_details.phone_number}</Text>
        </Space>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      render: (record: AttendanceMember) => {
        if (!record.attendance_status) {
          return <Tag color="default">Not Marked</Tag>;
        }
        
        return (
          <Space direction="vertical" size="small">
            <Tag color={getStatusColor(record.attendance_status)} icon={getStatusIcon(record.attendance_status)}>
              {record.attendance_status}
            </Tag>
            {record.marked_at && (
              <Text type="secondary" style={{ fontSize: '11px' }}>
                {dayjs(record.marked_at).format('HH:mm')}
              </Text>
            )}
            {record.arrival_time && record.attendance_status === 'LATE' && (
              <Text type="secondary" style={{ fontSize: '11px' }}>
                Arrived: {record.arrival_time}
              </Text>
            )}
          </Space>
        );
      },
      filters: [
        { text: 'Not Marked', value: 'UNMARKED' },
        { text: 'Present', value: 'PRESENT' },
        { text: 'Absent', value: 'ABSENT' },
        { text: 'Excused', value: 'EXCUSED' },
        { text: 'Late', value: 'LATE' },
      ],
      onFilter: (value: any, record: AttendanceMember) => {
        if (value === 'UNMARKED') return !record.attendance_status;
        return record.attendance_status === value;
      },
    },
    {
      title: 'Notes',
      key: 'notes',
      render: (record: AttendanceMember) => (
        <Space direction="vertical" size="small">
          {record.notes && (
            <Text style={{ fontSize: '12px' }}>
              <CommentOutlined /> {record.notes}
            </Text>
          )}
          {record.excuse_reason && (
            <Text type="secondary" style={{ fontSize: '12px' }}>
              Excuse: {record.excuse_reason}
            </Text>
          )}
        </Space>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: AttendanceMember) => {
        if (registry?.status !== 'IN_PROGRESS' && registry?.status !== 'PUBLISHED') {
          return <Text type="secondary">View Only</Text>;
        }
        
        return (
          <Space wrap>
            <Button
              type="primary"
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={() => handleMarkAttendance(record.id, 'PRESENT')}
              disabled={record.attendance_status === 'PRESENT'}
            >
              Present
            </Button>
            <Button
              size="small"
              icon={<CloseCircleOutlined />}
              onClick={() => handleMarkAttendance(record.id, 'ABSENT')}
              disabled={record.attendance_status === 'ABSENT'}
            >
              Absent
            </Button>
            <Button
              size="small"
              icon={<ExclamationCircleOutlined />}
              onClick={() => {
                setSelectedMember(record);
                setMarkingModalVisible(true);
              }}
            >
              Excused/Late
            </Button>
            {record.attendance_status && (
              <Button
                type="text"
                size="small"
                icon={<EditOutlined />}
                onClick={() => {
                  setSelectedMember(record);
                  setMarkingModalVisible(true);
                }}
              >
                Edit
              </Button>
            )}
          </Space>
        );
      },
    },
  ];

  if (loading || !registry) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      {/* Breadcrumb */}
      <Breadcrumb style={{ marginBottom: '24px' }}>
        <Breadcrumb.Item>
          <HomeOutlined />
        </Breadcrumb.Item>
        <Breadcrumb.Item>
          <Button type="link" onClick={() => navigate('/sergeant-of-arms')}>
            Sergeant of Arms
          </Button>
        </Breadcrumb.Item>
        <Breadcrumb.Item>
          <Button type="link" onClick={() => navigate('/sergeant-of-arms/attendance')}>
            Attendance Registries
          </Button>
        </Breadcrumb.Item>
        <Breadcrumb.Item>Attendance Marking</Breadcrumb.Item>
      </Breadcrumb>

      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>
          <TeamOutlined style={{ marginRight: '8px' }} />
          {registry.title}
        </Title>
        <Space direction="vertical" size="small">
          <Text type="secondary">
            <CalendarOutlined /> {dayjs(registry.attendance_date).format('MMMM DD, YYYY')}
            {registry.session_details && (
              <> • Session {registry.session_details.session_number} • {registry.session_details.venue}</>
            )}
          </Text>
          <Tag color={registry.status === 'IN_PROGRESS' ? 'orange' : 'blue'}>
            {registry.status === 'IN_PROGRESS' ? 'Marking in Progress' : registry.status}
          </Tag>
        </Space>
      </div>

      {/* Stats Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="Expected"
              value={registry.total_expected}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="Present"
              value={registry.total_present}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="Absent"
              value={registry.total_absent}
              prefix={<CloseCircleOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="Others"
              value={registry.total_excused + registry.total_late}
              prefix={<ExclamationCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Progress Bar */}
      <Card style={{ marginBottom: '24px' }}>
        <Row align="middle" gutter={16}>
          <Col flex="auto">
            <div style={{ marginBottom: '8px' }}>
              <Text strong>Attendance Progress</Text>
              <Text type="secondary" style={{ float: 'right' }}>
                {registry.total_present + registry.total_absent + registry.total_excused + registry.total_late}/{registry.total_expected} marked
              </Text>
            </div>
            <Progress
              percent={registry.attendance_percentage}
              strokeColor={{
                '0%': '#108ee9',
                '100%': '#87d068',
              }}
              trailColor="#f0f0f0"
            />
          </Col>
          {registry.can_submit && (
            <Col>
              <Button
                type="primary"
                size="large"
                icon={<SendOutlined />}
                onClick={() => setSubmitModalVisible(true)}
                disabled={registry.attendance_percentage < 100}
              >
                Submit Attendance
              </Button>
            </Col>
          )}
        </Row>
      </Card>

      {/* Filters */}
      <Card style={{ marginBottom: '24px' }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Input
              placeholder="Search members..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              prefix={<UserOutlined />}
            />
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Select
              placeholder="Filter by status"
              value={statusFilter}
              onChange={setStatusFilter}
              allowClear
              style={{ width: '100%' }}
            >
              <Select.Option value="UNMARKED">Not Marked</Select.Option>
              <Select.Option value="PRESENT">Present</Select.Option>
              <Select.Option value="ABSENT">Absent</Select.Option>
              <Select.Option value="EXCUSED">Excused</Select.Option>
              <Select.Option value="LATE">Late</Select.Option>
            </Select>
          </Col>
          <Col xs={24} sm={24} md={8}>
            <Space>
              <Text type="secondary">
                Showing {filteredMembers.length} of {members.length} members
              </Text>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Members Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={filteredMembers}
          rowKey="id"
          pagination={{
            pageSize: 50,
            showSizeChanger: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} of ${total} members`,
          }}
          scroll={{ x: 800 }}
        />
      </Card>

      {/* Attendance Marking Modal */}
      <Modal
        title={`Mark Attendance - ${selectedMember?.member_details.first_name} ${selectedMember?.member_details.last_name}`}
        open={markingModalVisible}
        onCancel={() => {
          setMarkingModalVisible(false);
          setSelectedMember(null);
        }}
        footer={null}
        width={600}
      >
        {selectedMember && (
          <AttendanceMarkingForm
            member={selectedMember}
            onSubmit={handleMarkAttendance}
            onCancel={() => {
              setMarkingModalVisible(false);
              setSelectedMember(null);
            }}
          />
        )}
      </Modal>

      {/* Submit Attendance Modal */}
      <Modal
        title="Submit Attendance for Review"
        open={submitModalVisible}
        onOk={handleSubmitAttendance}
        onCancel={() => setSubmitModalVisible(false)}
        confirmLoading={submitting}
        okText="Submit"
        okButtonProps={{ 
          disabled: registry.attendance_percentage < 100,
          icon: <SendOutlined />
        }}
      >
        <Alert
          message="Ready to Submit"
          description={`All ${registry.total_expected} members have been marked. The attendance will be submitted for final review and approval.`}
          type="success"
          showIcon
          style={{ marginBottom: '16px' }}
        />
        
        <div style={{ marginBottom: '16px' }}>
          <Text strong>Attendance Summary:</Text>
          <ul style={{ marginTop: '8px' }}>
            <li>Present: {registry.total_present}</li>
            <li>Absent: {registry.total_absent}</li>
            <li>Excused: {registry.total_excused}</li>
            <li>Late: {registry.total_late}</li>
          </ul>
        </div>

        <div>
          <Text strong>Additional Notes (Optional):</Text>
          <TextArea
            value={submitNotes}
            onChange={(e) => setSubmitNotes(e.target.value)}
            placeholder="Add any additional notes about this attendance session..."
            rows={4}
            style={{ marginTop: '8px' }}
          />
        </div>
      </Modal>
    </div>
  );
};

// Attendance Marking Form Component
const AttendanceMarkingForm: React.FC<{
  member: AttendanceMember;
  onSubmit: (memberId: number, status: string, notes?: string, excuseReason?: string) => void;
  onCancel: () => void;
}> = ({ member, onSubmit, onCancel }) => {
  const [status, setStatus] = useState<string>(member.attendance_status || 'PRESENT');
  const [notes, setNotes] = useState(member.notes || '');
  const [excuseReason, setExcuseReason] = useState(member.excuse_reason || '');

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'PRESENT':
        return 'success';
      case 'ABSENT':
        return 'error';
      case 'EXCUSED':
        return 'warning';
      case 'LATE':
        return 'processing';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case 'PRESENT':
        return <CheckCircleOutlined />;
      case 'ABSENT':
        return <CloseCircleOutlined />;
      case 'EXCUSED':
        return <ExclamationCircleOutlined />;
      case 'LATE':
        return <ClockCircleOutlined />;
      default:
        return <UserOutlined />;
    }
  };

  const handleSubmit = () => {
    onSubmit(member.id, status, notes, excuseReason);
  };

  return (
    <div>
      <Descriptions bordered style={{ marginBottom: '16px' }}>
        <Descriptions.Item label="Name" span={2}>
          {member.member_details.first_name} {member.member_details.last_name}
        </Descriptions.Item>
        <Descriptions.Item label="Constituency">
          {member.member_details.constituency || 'N/A'}
        </Descriptions.Item>
        <Descriptions.Item label="Party">
          {member.member_details.party_affiliation || 'N/A'}
        </Descriptions.Item>
        <Descriptions.Item label="Current Status">
          {member.attendance_status ? (
            <Tag color={getStatusColor(member.attendance_status)} icon={getStatusIcon(member.attendance_status)}>
              {member.attendance_status}
            </Tag>
          ) : (
            <Tag color="default">Not Marked</Tag>
          )}
        </Descriptions.Item>
      </Descriptions>

      <Divider />

      <div style={{ marginBottom: '16px' }}>
        <Text strong>Attendance Status:</Text>
        <Radio.Group
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          style={{ marginTop: '8px', width: '100%' }}
        >
          <Space direction="vertical">
            <Radio value="PRESENT">
              <Badge status="success" /> Present
            </Radio>
            <Radio value="ABSENT">
              <Badge status="error" /> Absent
            </Radio>
            <Radio value="EXCUSED">
              <Badge status="warning" /> Excused
            </Radio>
            <Radio value="LATE">
              <Badge status="processing" /> Late
            </Radio>
          </Space>
        </Radio.Group>
      </div>

      {status === 'EXCUSED' && (
        <div style={{ marginBottom: '16px' }}>
          <Text strong>Excuse Reason:</Text>
          <Input
            value={excuseReason}
            onChange={(e) => setExcuseReason(e.target.value)}
            placeholder="Enter reason for excuse..."
            style={{ marginTop: '8px' }}
          />
        </div>
      )}

      <div style={{ marginBottom: '24px' }}>
        <Text strong>Notes (Optional):</Text>
        <TextArea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add any additional notes..."
          rows={3}
          style={{ marginTop: '8px' }}
        />
      </div>

      <div style={{ textAlign: 'right' }}>
        <Space>
          <Button onClick={onCancel}>
            Cancel
          </Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleSubmit}
          >
            Mark Attendance
          </Button>
        </Space>
      </div>
    </div>
  );
};

export default AttendanceMarkingPage;
