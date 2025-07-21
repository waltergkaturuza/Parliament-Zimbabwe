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
  status: 'PENDING' | 'IN_TRANSIT' | 'DELIVERED' | 'CONFIRMED';
  createdDate: string;
  deliveryDate?: string;
  confirmedDate?: string;
  driverName: string;
  vehicleNumber: string;
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
      // Replace with actual API call
      const mockData: HandoverRecord[] = [
        {
          id: '1',
          handoverNumber: 'HO-2024-001',
          fromCenter: 'Main Center',
          toCenter: 'Harare South',
          bookCount: 20,
          couponCount: 400,
          fuelType: 'PETROL',
          status: 'PENDING',
          createdDate: '2024-07-04',
          driverName: 'John Mukamuri',
          vehicleNumber: 'ABC-123Z',
        },
        {
          id: '2',
          handoverNumber: 'HO-2024-002',
          fromCenter: 'Main Center',
          toCenter: 'Harare South',
          bookCount: 15,
          couponCount: 75,
          fuelType: 'DIESEL',
          status: 'DELIVERED',
          createdDate: '2024-07-02',
          deliveryDate: '2024-07-03',
          driverName: 'Peter Chivanga',
          vehicleNumber: 'XYZ-456Z',
        },
      ];
      setHandovers(mockData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching handovers:', error);
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
    {
      title: 'Driver & Vehicle',
      key: 'transport',
      render: (_, record) => (
        <div>
          <Text>{record.driverName}</Text>
          <br />
          <Text type="secondary">{record.vehicleNumber}</Text>
        </div>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button 
            type="link" 
            icon={<EyeOutlined />} 
            size="small"
            onClick={() => viewHandover(record)}
          >
            View
          </Button>
          {record.status === 'DELIVERED' && (
            <Button 
              type="primary" 
              size="small"
              onClick={() => confirmHandover(record)}
            >
              Confirm
            </Button>
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

  const pendingCount = handovers.filter(h => h.status === 'PENDING' || h.status === 'DELIVERED').length;

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
