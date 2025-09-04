// src/pages/handovers/HandoverManagement.tsx
import { useState, useEffect } from 'react';
import type { FC } from 'react';
import {
  Card,
  Table,
  Button,
  Tag,
  Space,
  Modal,
  Form,
  Input,
  Typography,
  Row,
  Col,
  Statistic,
  Alert,
  Steps,
  Upload,
  message,
} from 'antd';
import {
  SwapOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
  UploadOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import { ColumnsType } from 'antd/es/table';
import apiClient from '@/api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Step } = Steps;

interface HandoverRecord {
  id: string;
  handoverNumber: string;
  fromCenter: string;
  toCenter: string;
  bookCount: number;
  couponCount: number;
  fuelType: 'PETROL' | 'DIESEL';
  status: 'PENDING' | 'DISPATCHED' | 'RECEIVED' | 'CONFIRMED';
  createdDate: string;
  deliveryDate?: string;
  confirmedDate?: string;
  driverName?: string;
  vehicleNumber?: string;
}

const HandoverManagement: FC = () => {
  const [handovers, setHandovers] = useState<HandoverRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [selectedHandover, setSelectedHandover] = useState<HandoverRecord | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchHandovers();
  }, []);

  const fetchHandovers = async () => {
    try {
      setLoading(true);
      // For sub-center users, backend filters /dispatches/ to to_center=current user's subcenter
      // Also fetch from /coupon-distributions/ to get fuel dispatched from main center
      const [dispatchesResp, distributionsResp] = await Promise.all([
        apiClient.get('/dispatches/').catch(() => ({ data: { results: [] } })),
        apiClient.get('/coupon-distributions/').catch(() => ({ data: { results: [] } }))
      ]);

      const dispatchRows = Array.isArray(dispatchesResp.data?.results) ? dispatchesResp.data.results : (Array.isArray(dispatchesResp.data) ? dispatchesResp.data : []);
      const distributionRows = Array.isArray(distributionsResp.data?.results) ? distributionsResp.data.results : (Array.isArray(distributionsResp.data) ? distributionsResp.data : []);

      // Normalize mixed backend shapes: serializer snake_case vs create() camelCase
      const normalize = (d: any, isDistribution: boolean = false): HandoverRecord => {
        const id = String(d.id ?? d.dispatchId ?? d.dispatch_id ?? '');
        const toCenter = d.to_center?.name ?? d.subCenterName ?? d.subcenter_name ?? d.destination?.name ?? '';
        const fromCenter = d.from_center?.name ?? d.fromCenter ?? (isDistribution ? 'Parliament Main Center' : 'Main Center');
        const created = d.dispatch_date ?? d.dispatched_date ?? d.dispatchedDate ?? d.created ?? d.created_date ?? new Date().toISOString();
        // Count books/coupons from payload if present; fall back to totals
        const books = Array.isArray(d.books) ? d.books : [];
        const bookCount = Number(d.total_books ?? d.totalBooks ?? books.length ?? d.book_count ?? 0);
        const couponCount = Number(d.total_coupons ?? d.totalCoupons ?? books.reduce((s: number, b: any) => s + Number(b.numberOfCoupons || b.coupon_count || 0), 0) ?? d.coupon_count ?? 0);
        const fuelType = (books[0]?.fuelType ?? d.fuel_type ?? 'DIESEL') as 'PETROL' | 'DIESEL';
        const status = (d.status ?? 'DISPATCHED') as HandoverRecord['status'];
        return {
          id,
          handoverNumber: (d.dispatchId ?? d.dispatch_id ?? `${isDistribution ? 'DIST' : 'DSP'}-${id}`).toString(),
          fromCenter,
          toCenter,
          bookCount,
          couponCount,
          fuelType,
          status,
          createdDate: dayjs(created).format('YYYY-MM-DD HH:mm'),
        };
      };

      // Combine dispatches and distributions
      const allRows = [
        ...dispatchRows.map((d: any) => normalize(d, false)),
        ...distributionRows.map((d: any) => normalize(d, true))
      ];

      const mapped: HandoverRecord[] = allRows
        .filter((h: HandoverRecord) => ['DISPATCHED', 'PENDING', 'RECEIVED', 'CONFIRMED', 'IN_TRANSIT'].includes(h.status))
        .sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime()); // Sort by newest first
      
      setHandovers(mapped);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching handovers:', error);
      message.error('Failed to load incoming handovers');
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'orange';
      case 'IN_TRANSIT': return 'blue';
      case 'DELIVERED': return 'purple';
      case 'CONFIRMED': return 'green';
      default: return 'default';
    }
  };

  const getStatusStep = (status: string) => {
    switch (status) {
      case 'PENDING': return 0;
      case 'IN_TRANSIT': return 1;
      case 'DELIVERED': return 2;
      case 'CONFIRMED': return 3;
      default: return 0;
    }
  };

  const columns: ColumnsType<HandoverRecord> = [
    {
      title: 'Handover #',
      dataIndex: 'handoverNumber',
      key: 'handoverNumber',
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: 'From → To',
      key: 'centers',
      render: (_, record) => (
        <div>
          <Text>{record.fromCenter}</Text>
          <br />
          <SwapOutlined style={{ color: '#1890ff' }} />
          <br />
          <Text>{record.toCenter}</Text>
        </div>
      ),
    },
    {
      title: 'Fuel Type',
      dataIndex: 'fuelType',
      key: 'fuelType',
      render: (type) => (
        <Tag color={type === 'PETROL' ? 'blue' : 'orange'}>
          {type}
        </Tag>
      ),
    },
    {
      title: 'Books/Coupons',
      key: 'quantity',
      render: (_, record) => (
        <div>
          <Text strong>{record.bookCount}</Text> books
          <br />
          <Text type="secondary">({record.couponCount} coupons)</Text>
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {status.replace('_', ' ')}
        </Tag>
      ),
    },
    // Removed Driver & Vehicle column for sub-center acceptance flow
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button type="link" icon={<EyeOutlined />} size="small" onClick={() => viewHandover(record)}>View</Button>
          {record.status === 'DISPATCHED' && (
            <Button type="primary" size="small" onClick={() => acceptHandover(record)}>Accept / Confirm Received</Button>
          )}
        </Space>
      ),
    },
  ];

  const viewHandover = (handover: HandoverRecord) => {
    setSelectedHandover(handover);
    // Open view modal or navigate to details page
  };

  const confirmHandover = (handover: HandoverRecord) => {
    setSelectedHandover(handover);
    setConfirmModalVisible(true);
  };

  const acceptHandover = async (handover: HandoverRecord) => {
    try {
      // Update status to RECEIVED; backend also assigns received_by when supported
      await apiClient.patch(`/dispatches/${handover.id}/`, { status: 'RECEIVED' });
      message.success('Handover accepted');
      fetchHandovers();
    } catch (e: any) {
      console.error('Accept error', e);
      message.error(e?.response?.data?.detail || 'Failed to accept handover');
    }
  };

  const handleConfirmSubmit = async (values: any) => {
    try {
      // API call to confirm handover
      message.success('Handover confirmed successfully');
      setConfirmModalVisible(false);
      fetchHandovers(); // Refresh data
    } catch (error) {
      message.error('Failed to confirm handover');
    }
  };

  const pendingCount = handovers.filter(h => h.status === 'PENDING' || h.status === 'DISPATCHED').length;

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0, color: '#1890ff' }}>
          <SwapOutlined /> Handover Management
        </Title>
        <Text type="secondary">Manage book handovers between centers</Text>
      </div>

      {/* Quick Stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Pending Actions"
              value={pendingCount}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: pendingCount > 0 ? '#ff4d4f' : '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Total Handovers"
              value={handovers.length}
              prefix={<SwapOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Completed Today"
              value={handovers.filter(h => 
                h.status === 'CONFIRMED' && 
                h.confirmedDate === new Date().toISOString().split('T')[0]
              ).length}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Pending Alert */}
      {pendingCount > 0 && (
        <Alert
          message="Pending Handovers"
          description={`You have ${pendingCount} handovers requiring your attention.`}
          type="warning"
          showIcon
          style={{ marginBottom: 24 }}
        />
      )}

      {/* Handovers Table */}
      <Card title="Book Handovers">
        <Table
          columns={columns}
          dataSource={handovers}
          rowKey="id"
          loading={loading}
          scroll={{ x: 800 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
          }}
        />
      </Card>

      {/* Confirm Handover Modal */}
      <Modal
        title="Confirm Handover Receipt"
        open={confirmModalVisible}
        onCancel={() => setConfirmModalVisible(false)}
        footer={null}
        width={600}
      >
        {selectedHandover && (
          <div>
            <Steps current={getStatusStep(selectedHandover.status)} style={{ marginBottom: 24 }}>
              <Step title="Created" icon={<CheckCircleOutlined />} />
              <Step title="In Transit" icon={<ClockCircleOutlined />} />
              <Step title="Delivered" icon={<ExclamationCircleOutlined />} />
              <Step title="Confirmed" icon={<CheckCircleOutlined />} />
            </Steps>

            <Form
              form={form}
              layout="vertical"
              onFinish={handleConfirmSubmit}
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="Handover Number">
                    <Input value={selectedHandover.handoverNumber} disabled />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Books Received">
                    <Input value={selectedHandover.bookCount} disabled />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="receivedQuantity"
                label="Actual Quantity Received"
                rules={[{ required: true, message: 'Please confirm received quantity' }]}
              >
                <Input placeholder="Enter actual quantity received" />
              </Form.Item>

              <Form.Item
                name="notes"
                label="Notes"
              >
                <Input.TextArea
                  rows={3}
                  placeholder="Any notes or discrepancies..."
                />
              </Form.Item>

              <Form.Item
                name="signature"
                label="Digital Signature"
              >
                <Upload>
                  <Button icon={<UploadOutlined />}>Upload Signature</Button>
                </Upload>
              </Form.Item>

              <Form.Item>
                <Space>
                  <Button type="primary" htmlType="submit">
                    Confirm Receipt
                  </Button>
                  <Button onClick={() => setConfirmModalVisible(false)}>
                    Cancel
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

export default HandoverManagement;
