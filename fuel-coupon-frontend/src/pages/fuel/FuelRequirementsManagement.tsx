import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Button, 
  Form, 
  Modal, 
  Select, 
  InputNumber, 
  DatePicker, 
  Switch, 
  Input, 
  message, 
  Divider, 
  Row, 
  Col, 
  Statistic,
  Tag
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SettingOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '@/api';

const { Option } = Select;
const { TextArea } = Input;

interface FuelRequirement {
  id: number;
  fuel_type: 'PETROL' | 'DIESEL';
  period: 'DAILY' | 'WEEKLY';
  required_litres: string;
  litres_per_coupon: string;
  effective_from: string;
  is_active: boolean;
  notes: string;
  created_at: string;
  created_by: number;
  required_coupons: number;
  estimated_cost_usd: string;
  books_needed: number;
}

interface CurrentRequirements {
  daily: {
    petrol: FuelRequirement | null;
    diesel: FuelRequirement | null;
  };
  weekly: {
    petrol: FuelRequirement | null;
    diesel: FuelRequirement | null;
  };
  effective_date: string;
}

const FuelRequirementsManagement: React.FC = () => {
  const [requirements, setRequirements] = useState<FuelRequirement[]>([]);
  const [currentRequirements, setCurrentRequirements] = useState<CurrentRequirements | null>(null);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRequirement, setEditingRequirement] = useState<FuelRequirement | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchRequirements();
    fetchCurrentRequirements();
  }, []);

  const fetchRequirements = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/fuel-requirements/');
      setRequirements(response.data.results || response.data);
    } catch (error) {
      message.error('Failed to fetch fuel requirements');
    }
    setLoading(false);
  };

  const fetchCurrentRequirements = async () => {
    try {
      const response = await apiClient.get('/fuel-requirements/current_requirements/');
      setCurrentRequirements(response.data);
    } catch (error) {
      message.error('Failed to fetch current requirements');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      const payload = {
        ...values,
        effective_from: values.effective_from.format('YYYY-MM-DD'),
      };

      if (editingRequirement) {
        await apiClient.put(`/fuel-requirements/${editingRequirement.id}/`, payload);
        message.success('Fuel requirement updated successfully');
      } else {
        await apiClient.post('/fuel-requirements/', payload);
        message.success('Fuel requirement created successfully');
      }

      setModalVisible(false);
      setEditingRequirement(null);
      form.resetFields();
      fetchRequirements();
      fetchCurrentRequirements();
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to save fuel requirement';
      message.error(errorMessage);
    }
  };

  const handleEdit = (requirement: FuelRequirement) => {
    setEditingRequirement(requirement);
    form.setFieldsValue({
      ...requirement,
      effective_from: dayjs(requirement.effective_from),
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await apiClient.delete(`/fuel-requirements/${id}/`);
      message.success('Fuel requirement deleted successfully');
      fetchRequirements();
      fetchCurrentRequirements();
    } catch (error) {
      message.error('Failed to delete fuel requirement');
    }
  };

  const columns = [
    {
      title: 'Fuel Type',
      dataIndex: 'fuel_type',
      render: (type: string) => (
        <Tag color={type === 'PETROL' ? 'green' : 'blue'}>{type}</Tag>
      ),
    },
    {
      title: 'Period',
      dataIndex: 'period',
      render: (period: string) => (
        <Tag color={period === 'DAILY' ? 'orange' : 'purple'}>{period}</Tag>
      ),
    },
    {
      title: 'Required Litres',
      dataIndex: 'required_litres',
      render: (litres: string) => `${parseFloat(litres).toLocaleString()} L`,
    },
    {
      title: 'Litres/Coupon',
      dataIndex: 'litres_per_coupon',
      render: (litres: string) => `${litres} L`,
    },
    {
      title: 'Required Coupons',
      dataIndex: 'required_coupons',
      render: (coupons: number) => coupons.toLocaleString(),
    },
    {
      title: 'Books Needed',
      dataIndex: 'books_needed',
      render: (books: number) => books.toLocaleString(),
    },
    {
      title: 'Estimated Cost',
      dataIndex: 'estimated_cost_usd',
      render: (cost: string) => `$${parseFloat(cost).toLocaleString()}`,
    },
    {
      title: 'Effective From',
      dataIndex: 'effective_from',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      render: (active: boolean) => (
        <Tag color={active ? 'success' : 'default'}>
          {active ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      render: (record: FuelRequirement) => (
        <div>
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
        </div>
      ),
    },
  ];

  const renderCurrentRequirements = () => {
    if (!currentRequirements) return null;

    return (
      <Card title="Current Fuel Requirements" style={{ marginBottom: 24 }}>
        <Row gutter={16}>
          <Col span={12}>
            <Card title="Daily Requirements" size="small">
              <Row gutter={16}>
                <Col span={12}>
                  <Statistic
                    title="Petrol"
                    value={currentRequirements.daily.petrol?.required_litres || 0}
                    suffix="L"
                    precision={2}
                  />
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    {currentRequirements.daily.petrol?.required_coupons || 0} coupons
                  </div>
                </Col>
                <Col span={12}>
                  <Statistic
                    title="Diesel"
                    value={currentRequirements.daily.diesel?.required_litres || 0}
                    suffix="L"
                    precision={2}
                  />
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    {currentRequirements.daily.diesel?.required_coupons || 0} coupons
                  </div>
                </Col>
              </Row>
            </Card>
          </Col>
          <Col span={12}>
            <Card title="Weekly Requirements" size="small">
              <Row gutter={16}>
                <Col span={12}>
                  <Statistic
                    title="Petrol"
                    value={currentRequirements.weekly.petrol?.required_litres || 0}
                    suffix="L"
                    precision={2}
                  />
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    {currentRequirements.weekly.petrol?.required_coupons || 0} coupons
                  </div>
                </Col>
                <Col span={12}>
                  <Statistic
                    title="Diesel"
                    value={currentRequirements.weekly.diesel?.required_litres || 0}
                    suffix="L"
                    precision={2}
                  />
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    {currentRequirements.weekly.diesel?.required_coupons || 0} coupons
                  </div>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
      </Card>
    );
  };

  return (
    <div style={{ padding: '24px' }}>
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <SettingOutlined style={{ marginRight: '8px' }} />
            Fuel Requirements Management
          </div>
        }
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingRequirement(null);
              form.resetFields();
              setModalVisible(true);
            }}
          >
            Add Requirement
          </Button>
        }
      >
        {renderCurrentRequirements()}

        <Table
          columns={columns}
          dataSource={requirements}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
          }}
        />
      </Card>

      <Modal
        title={editingRequirement ? 'Edit Fuel Requirement' : 'Add Fuel Requirement'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingRequirement(null);
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
            litres_per_coupon: 5,
            is_active: true,
            effective_from: dayjs(),
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="fuel_type"
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
                name="period"
                label="Period"
                rules={[{ required: true, message: 'Please select period' }]}
              >
                <Select placeholder="Select period">
                  <Option value="DAILY">Daily</Option>
                  <Option value="WEEKLY">Weekly</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="required_litres"
                label="Required Litres"
                rules={[
                  { required: true, message: 'Please enter required litres' },
                  { type: 'number', min: 0.01, message: 'Must be greater than 0' },
                ]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="Enter required litres"
                  precision={2}
                  min={0.01}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="litres_per_coupon"
                label="Litres per Coupon"
                rules={[
                  { required: true, message: 'Please enter litres per coupon' },
                  { type: 'number', min: 0.01, message: 'Must be greater than 0' },
                ]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="Enter litres per coupon"
                  precision={2}
                  min={0.01}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="effective_from"
                label="Effective From"
                rules={[{ required: true, message: 'Please select effective date' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="is_active" label="Status" valuePropName="checked">
                <Switch
                  checkedChildren="Active"
                  unCheckedChildren="Inactive"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="notes" label="Notes">
            <TextArea
              rows={3}
              placeholder="Additional notes about this requirement configuration"
            />
          </Form.Item>

          <Form.Item>
            <div style={{ textAlign: 'right' }}>
              <Button
                onClick={() => {
                  setModalVisible(false);
                  setEditingRequirement(null);
                  form.resetFields();
                }}
                style={{ marginRight: 8 }}
              >
                Cancel
              </Button>
              <Button type="primary" htmlType="submit">
                {editingRequirement ? 'Update' : 'Create'}
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default FuelRequirementsManagement;
