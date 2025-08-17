// src/pages/admin/UserApprovalDashboard.tsx
import { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Typography,
  Modal,
  Form,
  Input,
  message,
  Badge,
  Descriptions,
  Row,
  Col,
  Alert,
  Spin
} from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  UserOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import apiClient from '@/api';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface PendingUser {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  role_display: string;
  phone?: string;
  registration_justification?: string;
  date_joined: string;
  sub_center_details?: {
    id: number;
    name: string;
    code: string;
  };
}

const UserApprovalDashboard = () => {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<PendingUser | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectionForm] = Form.useForm();
  const [actionLoading, setActionLoading] = useState(false);
  const { accessToken } = useAuth();

  const fetchPendingUsers = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/users/pending_approvals/');
      setPendingUsers(response.data.users || []);
    } catch (error) {
      console.error('Error fetching pending users:', error);
      message.error('Failed to fetch pending users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const handleApprove = async (userId: number) => {
    try {
      setActionLoading(true);
      await apiClient.post(`/users/${userId}/approve_user/`);
      message.success('User approved successfully');
      fetchPendingUsers(); // Refresh the list
    } catch (error) {
      console.error('Error approving user:', error);
      message.error('Failed to approve user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (values: { reason: string }) => {
    if (!selectedUser) return;

    try {
      setActionLoading(true);
      await apiClient.post(`/users/${selectedUser.id}/reject_user/`, {
        reason: values.reason,
      }, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      message.success('User rejected successfully');
      setRejectModalVisible(false);
      setSelectedUser(null);
      rejectionForm.resetFields();
      fetchPendingUsers(); // Refresh the list
    } catch (error) {
      console.error('Error rejecting user:', error);
      message.error('Failed to reject user');
    } finally {
      setActionLoading(false);
    }
  };

  const showUserDetails = (user: PendingUser) => {
    setSelectedUser(user);
    setModalVisible(true);
  };

  const showRejectModal = (user: PendingUser) => {
    setSelectedUser(user);
    setRejectModalVisible(true);
  };

  const columns = [
    {
      title: 'User',
      key: 'user',
      render: (record: PendingUser) => (
        <Space direction="vertical" size="small">
          <Text strong>{record.username}</Text>
          <Text type="secondary">{record.first_name} {record.last_name}</Text>
          <Text type="secondary" className="text-sm">{record.email}</Text>
        </Space>
      ),
    },
    {
      title: 'Role',
      dataIndex: 'role_display',
      key: 'role',
      render: (role: string) => (
        <Tag color="blue">{role}</Tag>
      ),
    },
    {
      title: 'Sub Center',
      key: 'sub_center',
      render: (record: PendingUser) => (
        record.sub_center_details ? (
          <Tag color="green">{record.sub_center_details.name}</Tag>
        ) : (
          <Text type="secondary">N/A</Text>
        )
      ),
    },
    {
      title: 'Registration Date',
      dataIndex: 'date_joined',
      key: 'date_joined',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: PendingUser) => (
        <Space>
          <Button
            icon={<EyeOutlined />}
            size="small"
            onClick={() => showUserDetails(record)}
          >
            View
          </Button>
          <Button
            type="primary"
            icon={<CheckCircleOutlined />}
            size="small"
            loading={actionLoading}
            onClick={() => handleApprove(record.id)}
          >
            Approve
          </Button>
          <Button
            danger
            icon={<CloseCircleOutlined />}
            size="small"
            onClick={() => showRejectModal(record)}
          >
            Reject
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Row gutter={[24, 24]}>
        <Col span={24}>
          <Card>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <UserOutlined className="text-2xl text-blue-500" />
                <div>
                  <Title level={3} className="mb-0">User Approval Dashboard</Title>
                  <Text type="secondary">Review and approve pending user registrations</Text>
                </div>
              </div>
              <Badge count={pendingUsers.length} showZero>
                <Button icon={<ClockCircleOutlined />} onClick={fetchPendingUsers}>
                  Refresh
                </Button>
              </Badge>
            </div>

            {pendingUsers.length === 0 && !loading ? (
              <Alert
                message="No Pending Approvals"
                description="All user registrations have been processed."
                type="info"
                showIcon
              />
            ) : (
              <Table
                columns={columns}
                dataSource={pendingUsers}
                rowKey="id"
                loading={loading}
                pagination={{
                  pageSize: 10,
                  showTotal: (total) => `Total ${total} pending users`,
                }}
              />
            )}
          </Card>
        </Col>
      </Row>

      {/* User Details Modal */}
      <Modal
        title="User Registration Details"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setModalVisible(false)}>
            Close
          </Button>,
          <Button
            key="approve"
            type="primary"
            icon={<CheckCircleOutlined />}
            loading={actionLoading}
            onClick={() => selectedUser && handleApprove(selectedUser.id)}
          >
            Approve User
          </Button>,
          <Button
            key="reject"
            danger
            icon={<CloseCircleOutlined />}
            onClick={() => selectedUser && showRejectModal(selectedUser)}
          >
            Reject User
          </Button>,
        ]}
        width={600}
      >
        {selectedUser && (
          <Descriptions bordered column={1}>
            <Descriptions.Item label="Username">{selectedUser.username}</Descriptions.Item>
            <Descriptions.Item label="Full Name">
              {selectedUser.first_name} {selectedUser.last_name}
            </Descriptions.Item>
            <Descriptions.Item label="Email">{selectedUser.email}</Descriptions.Item>
            <Descriptions.Item label="Phone">{selectedUser.phone || 'Not provided'}</Descriptions.Item>
            <Descriptions.Item label="Requested Role">{selectedUser.role_display}</Descriptions.Item>
            <Descriptions.Item label="Sub Center">
              {selectedUser.sub_center_details?.name || 'Not assigned'}
            </Descriptions.Item>
            <Descriptions.Item label="Registration Date">
              {new Date(selectedUser.date_joined).toLocaleDateString()}
            </Descriptions.Item>
            <Descriptions.Item label="Justification">
              {selectedUser.registration_justification || 'No justification provided'}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

      {/* Rejection Modal */}
      <Modal
        title="Reject User Registration"
        open={rejectModalVisible}
        onCancel={() => {
          setRejectModalVisible(false);
          rejectionForm.resetFields();
        }}
        footer={null}
        width={500}
      >
        <Form
          form={rejectionForm}
          layout="vertical"
          onFinish={handleReject}
        >
          <Form.Item
            label="Rejection Reason"
            name="reason"
            rules={[
              { required: true, message: 'Please provide a reason for rejection' },
              { min: 10, message: 'Reason must be at least 10 characters long' },
            ]}
          >
            <TextArea
              rows={4}
              placeholder="Please provide a detailed reason for rejecting this registration..."
            />
          </Form.Item>
          <Form.Item className="mb-0">
            <Space className="w-full justify-end">
              <Button
                onClick={() => {
                  setRejectModalVisible(false);
                  rejectionForm.resetFields();
                }}
              >
                Cancel
              </Button>
              <Button
                type="primary"
                danger
                htmlType="submit"
                loading={actionLoading}
                icon={<CloseCircleOutlined />}
              >
                Reject User
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </motion.div>
  );
};

export default UserApprovalDashboard;
