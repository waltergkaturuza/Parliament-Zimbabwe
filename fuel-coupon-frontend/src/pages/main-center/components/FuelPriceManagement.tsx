// src/pages/main-center/components/FuelPriceManagement.tsx
import { useState } from 'react';
import type { FC } from 'react';
import {
  Card,
  Table,
  Button,
  Form,
  Modal,
  Input,
  Select,
  DatePicker,
  InputNumber,
  Space,
  Row,
  Col,
  Tag,
  Statistic,
  Alert,
  Typography,
  notification,
} from 'antd';
import {
  EditOutlined,
  PlusOutlined,
  DeleteOutlined,
  HistoryOutlined,
  ExclamationCircleOutlined,
  CarOutlined,
  RiseOutlined,
  FallOutlined,
} from '@ant-design/icons';
import { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

interface PriceHistory {
  id: string;
  fuelType: 'PETROL' | 'DIESEL';
  price: number;
  previousPrice: number;
  changeAmount: number;
  changePercentage: number;
  effectiveDate: string;
  updatedBy: string;
  status: 'ACTIVE' | 'SCHEDULED' | 'EXPIRED';
  reason: string;
}

const FuelPriceManagement: FC = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingPrice, setEditingPrice] = useState<PriceHistory | null>(null);
  const [form] = Form.useForm();

  // Sample data - replace with API call
  const priceHistory: PriceHistory[] = [
    {
      id: '1',
      fuelType: 'PETROL',
      price: 200,
      previousPrice: 180,
      changeAmount: 20,
      changePercentage: 11.11,
      effectiveDate: '2024-07-01',
      updatedBy: 'Admin User',
      status: 'ACTIVE',
      reason: 'Global fuel price increase',
    },
    {
      id: '2',
      fuelType: 'DIESEL',
      price: 180,
      previousPrice: 170,
      changeAmount: 10,
      changePercentage: 5.88,
      effectiveDate: '2024-07-01',
      updatedBy: 'Admin User',
      status: 'ACTIVE',
      reason: 'Market adjustment',
    },
    {
      id: '3',
      fuelType: 'PETROL',
      price: 210,
      previousPrice: 200,
      changeAmount: 10,
      changePercentage: 5.0,
      effectiveDate: '2024-07-15',
      updatedBy: 'Admin User',
      status: 'SCHEDULED',
      reason: 'Scheduled price review',
    },
  ];

  const currentPetrolPrice = priceHistory.find(p => p.fuelType === 'PETROL' && p.status === 'ACTIVE')?.price || 0;
  const currentDieselPrice = priceHistory.find(p => p.fuelType === 'DIESEL' && p.status === 'ACTIVE')?.price || 0;

  const columns: ColumnsType<PriceHistory> = [
    {
      title: 'Fuel Type',
      dataIndex: 'fuelType',
      key: 'fuelType',
      width: 100,
      render: (type) => (
        <Tag color={type === 'PETROL' ? 'blue' : 'orange'} icon={<CarOutlined />}>
          {type}
        </Tag>
      ),
    },
    {
      title: 'Current Price (ZWG)',
      dataIndex: 'price',
      key: 'price',
      width: 120,
      render: (price) => (
        <Text strong style={{ fontSize: '16px' }}>
          {price.toFixed(2)}
        </Text>
      ),
    },
    {
      title: 'Previous Price',
      dataIndex: 'previousPrice',
      key: 'previousPrice',
      width: 120,
      render: (price) => (
        <Text type="secondary">
          {price.toFixed(2)}
        </Text>
      ),
    },
    {
      title: 'Change',
      key: 'change',
      width: 150,
      render: (_, record) => {
        const isIncrease = record.changeAmount > 0;
        return (
          <Space>
            <Text style={{ color: isIncrease ? '#cf1322' : '#52c41a' }}>
              {isIncrease ? '+' : ''}{record.changeAmount.toFixed(2)}
            </Text>
            <Text style={{ color: isIncrease ? '#cf1322' : '#52c41a' }}>
              ({isIncrease ? '+' : ''}{record.changePercentage.toFixed(1)}%)
            </Text>
            {isIncrease ? <RiseOutlined /> : <FallOutlined />}
          </Space>
        );
      },
    },
    {
      title: 'Effective Date',
      dataIndex: 'effectiveDate',
      key: 'effectiveDate',
      width: 120,
      render: (date) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => {
        const colors: { [key: string]: string } = {
          ACTIVE: 'green',
          SCHEDULED: 'blue',
          EXPIRED: 'red',
        };
        return <Tag color={colors[status] || 'default'}>{status}</Tag>;
      },
    },
    {
      title: 'Updated By',
      dataIndex: 'updatedBy',
      key: 'updatedBy',
      width: 120,
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 120,
      render: (_, record) => (
        <Space>
          <Button 
            type="link" 
            icon={<EditOutlined />} 
            size="small"
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button>
          {record.status === 'SCHEDULED' && (
            <Button 
              type="link" 
              danger 
              icon={<DeleteOutlined />} 
              size="small"
              onClick={() => handleDelete(record.id)}
            >
              Cancel
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const handleEdit = (price: PriceHistory) => {
    setEditingPrice(price);
    form.setFieldsValue({
      fuelType: price.fuelType,
      price: price.price,
      effectiveDate: dayjs(price.effectiveDate),
      reason: price.reason,
    });
    setIsModalVisible(true);
  };

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: 'Are you sure you want to cancel this scheduled price change?',
      icon: <ExclamationCircleOutlined />,
      content: 'This action cannot be undone.',
      onOk() {
        // API call to delete
        notification.success({
          message: 'Success',
          description: 'Scheduled price change has been cancelled.',
        });
      },
    });
  };

  const handleSubmit = (values: any) => {
    // API call to create/update price
    notification.success({
      message: 'Success',
      description: editingPrice ? 'Price updated successfully' : 'New price scheduled successfully',
    });
    setIsModalVisible(false);
    setEditingPrice(null);
    form.resetFields();
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setEditingPrice(null);
    form.resetFields();
  };

  return (
    <div>
      {/* Current Prices Summary */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} md={8}>
          <Card>
            <Statistic
              title="Current Petrol Price"
              value={currentPetrolPrice}
              prefix={<CarOutlined />}
              suffix="ZWG/L"
              valueStyle={{ color: '#1890ff', fontSize: '24px' }}
            />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Statistic
              title="Current Diesel Price"
              value={currentDieselPrice}
              prefix={<CarOutlined />}
              suffix="ZWG/L"
              valueStyle={{ color: '#faad14', fontSize: '24px' }}
            />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={() => setIsModalVisible(true)}
                block
              >
                Update Fuel Prices
              </Button>
              <Button 
                icon={<HistoryOutlined />}
                block
              >
                View Full History
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Scheduled Changes Alert */}
      {priceHistory.some(p => p.status === 'SCHEDULED') && (
        <Alert
          message="Scheduled Price Changes"
          description={`You have ${priceHistory.filter(p => p.status === 'SCHEDULED').length} scheduled price changes pending.`}
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
          action={
            <Button size="small" type="link">
              View Details
            </Button>
          }
        />
      )}

      {/* Price History Table */}
      <Card title="Fuel Price Management" extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalVisible(true)}>
          Schedule Price Change
        </Button>
      }>
        <Table
          columns={columns}
          dataSource={priceHistory}
          rowKey="id"
          scroll={{ x: 800 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
          }}
        />
      </Card>

      {/* Price Update Modal */}
      <Modal
        title={editingPrice ? 'Update Fuel Price' : 'Schedule Price Change'}
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="fuelType"
                label="Fuel Type"
                rules={[{ required: true, message: 'Please select fuel type' }]}
              >
                <Select placeholder="Select fuel type">
                  <Option value="PETROL">Petrol</Option>
                  <Option value="DIESEL">Diesel</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="price"
                label="New Price (ZWG/L)"
                rules={[{ required: true, message: 'Please enter price' }]}
              >
                <InputNumber
                  min={0}
                  precision={2}
                  style={{ width: '100%' }}
                  placeholder="Enter price"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="effectiveDate"
            label="Effective Date"
            rules={[{ required: true, message: 'Please select effective date' }]}
          >
            <DatePicker
              style={{ width: '100%' }}
              disabledDate={(current) => current && current < dayjs().startOf('day')}
            />
          </Form.Item>

          <Form.Item
            name="reason"
            label="Reason for Change"
            rules={[{ required: true, message: 'Please provide reason' }]}
          >
            <Input.TextArea
              rows={3}
              placeholder="Enter reason for price change"
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingPrice ? 'Update Price' : 'Schedule Change'}
              </Button>
              <Button onClick={handleCancel}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default FuelPriceManagement;
