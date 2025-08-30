import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Typography,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  message,
  Row,
  Col,
  Descriptions,
  Alert,
  Breadcrumb
} from 'antd';
import {
  EditOutlined,
  CheckOutlined,
  CloseOutlined,
  ExclamationCircleOutlined,
  HomeOutlined,
  HistoryOutlined,
  UserOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface AttendanceCorrection {
  id: number;
  registry_details: {
    id: number;
    title: string;
    attendance_date: string;
    session_details?: {
      title: string;
      session_type: string;
    };
  };
  member_details: {
    id: number;
    first_name: string;
    last_name: string;
    constituency?: string;
  };
  original_status: string;
  corrected_status: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  requested_by_name: string;
  requested_date: string;
  reviewed_by_name?: string;
  reviewed_date?: string;
  review_notes?: string;
}

const AttendanceCorrections: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [corrections, setCorrections] = useState<AttendanceCorrection[]>([]);
  const [selectedCorrection, setSelectedCorrection] = useState<AttendanceCorrection | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [reviewForm] = Form.useForm();

  useEffect(() => {
    fetchCorrections();
  }, []);

  const fetchCorrections = async () => {
    try {
      setLoading(true);
  const response = await api.get('/attendance-corrections/');
      setCorrections(response.data.results || response.data);
    } catch (err: any) {
      console.error('Error fetching corrections:', err);
      message.error('Failed to load attendance corrections');
    } finally {
      setLoading(false);
    }
  };

  const handleReviewCorrection = async (correctionId: number, status: string, notes: string) => {
    try {
  await api.post(`/attendance-corrections/${correctionId}/review/`, {
        status,
        review_notes: notes
      });
      
      message.success(`Correction ${status.toLowerCase()}`);
      setReviewModalVisible(false);
      setSelectedCorrection(null);
      reviewForm.resetFields();
      fetchCorrections();
    } catch (err: any) {
      console.error('Error reviewing correction:', err);
      message.error(err.response?.data?.error || 'Failed to review correction');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'orange';
      case 'APPROVED':
        return 'green';
      case 'REJECTED':
        return 'red';
      default:
        return 'default';
    }
  };

  const getAttendanceStatusColor = (status: string) => {
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

  const columns = [
    {
      title: 'Session/Program',
      key: 'session',
      render: (record: AttendanceCorrection) => (
        <Space direction="vertical" size="small">
          <Text strong>{record.registry_details.title}</Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {dayjs(record.registry_details.attendance_date).format('MMM DD, YYYY')}
          </Text>
          {record.registry_details.session_details && (
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.registry_details.session_details.session_type}
            </Text>
          )}
        </Space>
      ),
    },
    {
      title: 'Member',
      key: 'member',
      render: (record: AttendanceCorrection) => (
        <Space direction="vertical" size="small">
          <Text strong>
            {record.member_details.first_name} {record.member_details.last_name}
          </Text>
          {record.member_details.constituency && (
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.member_details.constituency}
            </Text>
          )}
        </Space>
      ),
    },
    {
      title: 'Attendance Change',
      key: 'change',
      render: (record: AttendanceCorrection) => (
        <Space direction="vertical" size="small">
          <div>
            <Text type="secondary">From: </Text>
            <Tag color={getAttendanceStatusColor(record.original_status)}>
              {record.original_status}
            </Tag>
          </div>
          <div>
            <Text type="secondary">To: </Text>
            <Tag color={getAttendanceStatusColor(record.corrected_status)}>
              {record.corrected_status}
            </Tag>
          </div>
        </Space>
      ),
    },
    {
      title: 'Reason',
      dataIndex: 'reason',
      key: 'reason',
      render: (reason: string) => (
        <Text style={{ fontSize: '12px' }}>
          {reason.length > 50 ? `${reason.substring(0, 50)}...` : reason}
        </Text>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>
          {status}
        </Tag>
      ),
      filters: [
        { text: 'Pending', value: 'PENDING' },
        { text: 'Approved', value: 'APPROVED' },
        { text: 'Rejected', value: 'REJECTED' },
      ],
      onFilter: (value: any, record: AttendanceCorrection) => 
        record.status === value,
    },
    {
      title: 'Requested By',
      key: 'requested',
      render: (record: AttendanceCorrection) => (
        <Space direction="vertical" size="small">
          <Text style={{ fontSize: '12px' }}>{record.requested_by_name}</Text>
          <Text type="secondary" style={{ fontSize: '11px' }}>
            {dayjs(record.requested_date).format('MMM DD, HH:mm')}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: AttendanceCorrection) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => {
              setSelectedCorrection(record);
              setModalVisible(true);
            }}
          >
            View
          </Button>
          {record.status === 'PENDING' && (
            <Button
              type="primary"
              size="small"
              onClick={() => {
                setSelectedCorrection(record);
                setReviewModalVisible(true);
              }}
            >
              Review
            </Button>
          )}
        </Space>
      ),
    },
  ];

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
        <Breadcrumb.Item>Attendance Corrections</Breadcrumb.Item>
      </Breadcrumb>

      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>
          <HistoryOutlined style={{ marginRight: '8px' }} />
          Attendance Corrections
        </Title>
        <Text type="secondary">
          Review and approve attendance correction requests
        </Text>
      </div>

      {/* Summary Stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={8} sm={6}>
          <Card size="small">
            <div style={{ textAlign: 'center' }}>
              <Text type="secondary">Total</Text>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1890ff' }}>
                {corrections.length}
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={8} sm={6}>
          <Card size="small">
            <div style={{ textAlign: 'center' }}>
              <Text type="secondary">Pending</Text>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#faad14' }}>
                {corrections.filter(c => c.status === 'PENDING').length}
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={8} sm={6}>
          <Card size="small">
            <div style={{ textAlign: 'center' }}>
              <Text type="secondary">Approved</Text>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a' }}>
                {corrections.filter(c => c.status === 'APPROVED').length}
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={8} sm={6}>
          <Card size="small">
            <div style={{ textAlign: 'center' }}>
              <Text type="secondary">Rejected</Text>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ff4d4f' }}>
                {corrections.filter(c => c.status === 'REJECTED').length}
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Corrections Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={corrections}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} of ${total} corrections`,
          }}
          scroll={{ x: 1000 }}
        />
      </Card>

      {/* Details Modal */}
      <Modal
        title="Correction Details"
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setSelectedCorrection(null);
        }}
        footer={[
          <Button key="close" onClick={() => setModalVisible(false)}>
            Close
          </Button>,
          selectedCorrection?.status === 'PENDING' && (
            <Button
              key="review"
              type="primary"
              onClick={() => {
                setModalVisible(false);
                setReviewModalVisible(true);
              }}
            >
              Review
            </Button>
          ),
        ].filter(Boolean)}
        width={700}
      >
        {selectedCorrection && (
          <Descriptions column={2} bordered>
            <Descriptions.Item label="Session/Program" span={2}>
              {selectedCorrection.registry_details.title}
            </Descriptions.Item>
            <Descriptions.Item label="Date">
              {dayjs(selectedCorrection.registry_details.attendance_date).format('MMMM DD, YYYY')}
            </Descriptions.Item>
            <Descriptions.Item label="Member">
              {selectedCorrection.member_details.first_name} {selectedCorrection.member_details.last_name}
            </Descriptions.Item>
            <Descriptions.Item label="Original Status">
              <Tag color={getAttendanceStatusColor(selectedCorrection.original_status)}>
                {selectedCorrection.original_status}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Corrected Status">
              <Tag color={getAttendanceStatusColor(selectedCorrection.corrected_status)}>
                {selectedCorrection.corrected_status}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Reason" span={2}>
              {selectedCorrection.reason}
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={getStatusColor(selectedCorrection.status)}>
                {selectedCorrection.status}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Requested By">
              {selectedCorrection.requested_by_name}
            </Descriptions.Item>
            <Descriptions.Item label="Request Date">
              {dayjs(selectedCorrection.requested_date).format('MMM DD, YYYY HH:mm')}
            </Descriptions.Item>
            {selectedCorrection.reviewed_by_name && (
              <Descriptions.Item label="Reviewed By">
                {selectedCorrection.reviewed_by_name}
              </Descriptions.Item>
            )}
            {selectedCorrection.reviewed_date && (
              <Descriptions.Item label="Review Date">
                {dayjs(selectedCorrection.reviewed_date).format('MMM DD, YYYY HH:mm')}
              </Descriptions.Item>
            )}
            {selectedCorrection.review_notes && (
              <Descriptions.Item label="Review Notes" span={2}>
                {selectedCorrection.review_notes}
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>

      {/* Review Modal */}
      <Modal
        title="Review Correction Request"
        open={reviewModalVisible}
        onCancel={() => {
          setReviewModalVisible(false);
          setSelectedCorrection(null);
          reviewForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        {selectedCorrection && (
          <div>
            <Alert
              message="Review Required"
              description={`Review the attendance correction request for ${selectedCorrection.member_details.first_name} ${selectedCorrection.member_details.last_name}`}
              type="info"
              showIcon
              style={{ marginBottom: '16px' }}
            />

            <Descriptions bordered style={{ marginBottom: '16px' }}>
              <Descriptions.Item label="Member" span={2}>
                {selectedCorrection.member_details.first_name} {selectedCorrection.member_details.last_name}
              </Descriptions.Item>
              <Descriptions.Item label="From">
                <Tag color={getAttendanceStatusColor(selectedCorrection.original_status)}>
                  {selectedCorrection.original_status}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="To">
                <Tag color={getAttendanceStatusColor(selectedCorrection.corrected_status)}>
                  {selectedCorrection.corrected_status}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Reason" span={2}>
                {selectedCorrection.reason}
              </Descriptions.Item>
            </Descriptions>

            <Form
              form={reviewForm}
              layout="vertical"
              onFinish={(values) => {
                handleReviewCorrection(
                  selectedCorrection.id,
                  values.decision,
                  values.notes || ''
                );
              }}
            >
              <Form.Item
                name="decision"
                label="Decision"
                rules={[{ required: true, message: 'Please select a decision' }]}
              >
                <Select placeholder="Select your decision">
                  <Option value="APPROVED">Approve</Option>
                  <Option value="REJECTED">Reject</Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="notes"
                label="Review Notes (Optional)"
              >
                <TextArea
                  rows={4}
                  placeholder="Add any notes about your decision..."
                />
              </Form.Item>

              <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
                <Space>
                  <Button
                    onClick={() => {
                      setReviewModalVisible(false);
                      setSelectedCorrection(null);
                      reviewForm.resetFields();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="primary"
                    htmlType="submit"
                    icon={<CheckOutlined />}
                  >
                    Submit Review
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AttendanceCorrections;
