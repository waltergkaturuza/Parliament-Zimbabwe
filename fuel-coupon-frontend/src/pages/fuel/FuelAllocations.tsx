// src/pages/fuel/FuelAllocations.tsx
import { useState, useEffect } from 'react';
import type { FC } from 'react';
import { Card, Table, Button, Space, Form, Input, Select, Modal, Tag, message, Spin, Typography, Row, Col, Statistic, InputNumber } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, DollarOutlined, BarChartOutlined } from '@ant-design/icons';
import apiClient from '@/api/index';
import type { FuelEntitlement, BeneficiaryProfile, VehicleCategory } from '../../types';

const { Title } = Typography;
const { Option } = Select;

interface AllocationStats {
  totalEntitlements: number;
  activeEntitlements: number;
  totalMonthlyAllocation: number;
  totalYearlyAllocation: number;
}

const FuelAllocations: FC = () => {
  const [loading, setLoading] = useState(true);
  const [entitlements, setEntitlements] = useState<FuelEntitlement[]>([]);
  const [beneficiaries, setBeneficiaries] = useState<BeneficiaryProfile[]>([]);
  const [vehicleCategories, setVehicleCategories] = useState<VehicleCategory[]>([]);
  const [stats, setStats] = useState<AllocationStats>({
    totalEntitlements: 0,
    activeEntitlements: 0,
    totalMonthlyAllocation: 0,
    totalYearlyAllocation: 0
  });
  const [modalVisible, setModalVisible] = useState(false);
  const [editingEntitlement, setEditingEntitlement] = useState<FuelEntitlement | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [entitlementsResponse, beneficiariesResponse, vehicleCategoriesResponse] = await Promise.all([
        apiClient.get('/fuel-entitlements/'),
        apiClient.get('/beneficiary-profiles/'),
        apiClient.get('/vehicle-categories/')
      ]);

      const entitlementData = entitlementsResponse.data.results || entitlementsResponse.data;
      const beneficiaryData = beneficiariesResponse.data.results || beneficiariesResponse.data;
      const vehicleCategoryData = vehicleCategoriesResponse.data.results || vehicleCategoriesResponse.data;

      setEntitlements(entitlementData);
      setBeneficiaries(beneficiaryData);
      setVehicleCategories(vehicleCategoryData);

      // Calculate stats
      const newStats: AllocationStats = {
        totalEntitlements: entitlementData.length,
        activeEntitlements: entitlementData.filter((e: FuelEntitlement) => e.status === 'active').length,
        totalMonthlyAllocation: entitlementData.reduce((sum: number, e: FuelEntitlement) => 
          sum + (e.monthly_allocation || 0), 0),
        totalYearlyAllocation: entitlementData.reduce((sum: number, e: FuelEntitlement) => 
          sum + (e.yearly_allocation || 0), 0)
      };
      setStats(newStats);
    } catch (error) {
      console.error('Error loading data:', error);
      message.error('Failed to load fuel allocation data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      const entitlementData = {
        beneficiary: values.beneficiary,
        vehicle_category: values.vehicle_category,
        monthly_allocation: values.monthly_allocation,
        yearly_allocation: values.yearly_allocation,
        status: values.status || 'active',
        effective_from: values.effective_from,
        notes: values.notes || ''
      };

      if (editingEntitlement) {
        await apiClient.put(`/fuel-entitlements/${editingEntitlement.id}/`, entitlementData);
        message.success('Fuel entitlement updated successfully');
      } else {
        await apiClient.post('/fuel-entitlements/', entitlementData);
        message.success('Fuel entitlement created successfully');
      }

      setModalVisible(false);
      setEditingEntitlement(null);
      form.resetFields();
      loadData();
    } catch (error) {
      console.error('Error saving fuel entitlement:', error);
      message.error('Failed to save fuel entitlement');
    }
  };

  const handleEdit = (entitlement: FuelEntitlement) => {
    setEditingEntitlement(entitlement);
    form.setFieldsValue({
      beneficiary: entitlement.beneficiary?.id,
      vehicle_category: entitlement.vehicle_category?.id,
      monthly_allocation: entitlement.monthly_allocation,
      yearly_allocation: entitlement.yearly_allocation,
      status: entitlement.status,
      effective_from: entitlement.effective_from,
      notes: entitlement.notes
    });
    setModalVisible(true);
  };

  const handleDelete = async (entitlementId: string) => {
    Modal.confirm({
      title: 'Delete Fuel Entitlement',
      content: 'Are you sure you want to delete this fuel entitlement?',
      okText: 'Yes',
      okType: 'danger',
      cancelText: 'No',
      onOk: async () => {
        try {
          await apiClient.delete(`/fuel-entitlements/${entitlementId}/`);
          message.success('Fuel entitlement deleted successfully');
          loadData();
        } catch (error) {
          console.error('Error deleting fuel entitlement:', error);
          message.error('Failed to delete fuel entitlement');
        }
      }
    });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'active': 'green',
      'suspended': 'orange',
      'expired': 'red',
      'pending': 'blue'
    };
    return colors[status] || 'default';
  };

  const columns = [
    {
      title: 'Beneficiary',
      key: 'beneficiary',
      render: (_: any, record: FuelEntitlement) => (
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
      title: 'Vehicle Category',
      key: 'vehicle_category',
      render: (_: any, record: FuelEntitlement) => (
        <div>
          <div>{record.vehicle_category?.name}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {record.vehicle_category?.description}
          </div>
        </div>
      )
    },
    {
      title: 'Monthly Allocation',
      dataIndex: 'monthly_allocation',
      key: 'monthly_allocation',
      render: (value: number) => `${value} L`
    },
    {
      title: 'Yearly Allocation',
      dataIndex: 'yearly_allocation',
      key: 'yearly_allocation',
      render: (value: number) => `${value} L`
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
      title: 'Effective From',
      dataIndex: 'effective_from',
      key: 'effective_from',
      render: (date: string) => date ? new Date(date).toLocaleDateString() : 'N/A'
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: FuelEntitlement) => (
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
        <p>Loading fuel allocation data...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', fontFamily: 'Rockwell, serif' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ fontFamily: 'Rockwell, serif', fontSize: '18px', margin: 0 }}>
          Fuel Allocation Management
        </Title>
        <p style={{ color: '#666', margin: '8px 0 0 0', fontSize: '16px' }}>
          Manage fuel entitlements and allocations for parliament members
        </p>
      </div>

      {/* Stats Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Entitlements"
              value={stats.totalEntitlements}
              prefix={<BarChartOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Active Entitlements"
              value={stats.activeEntitlements}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Monthly Allocation"
              value={stats.totalMonthlyAllocation}
              suffix="L"
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Yearly Allocation"
              value={stats.totalYearlyAllocation}
              suffix="L"
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Entitlements Table */}
      <Card>
        <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={4} style={{ fontFamily: 'Rockwell, serif', fontSize: '16px', margin: 0 }}>
            Fuel Entitlements
          </Title>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingEntitlement(null);
              form.resetFields();
              setModalVisible(true);
            }}
          >
            Create Entitlement
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={entitlements}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} entitlements`
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        title={<span style={{ fontSize: '20px', fontWeight: 'bold' }}>{editingEntitlement ? 'Edit Fuel Entitlement' : 'Create Fuel Entitlement'}</span>}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingEntitlement(null);
          form.resetFields();
        }}
        footer={null}
        width={900}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          style={{ fontFamily: 'Rockwell, serif' }}
        >
          <Form.Item
            name="beneficiary"
            label={<span style={{ fontSize: '16px', fontWeight: 600 }}>Beneficiary</span>}
            rules={[{ required: true, message: 'Please select beneficiary' }]}
          >
            <Select placeholder="Select beneficiary" showSearch size="large" style={{ fontSize: '16px', minHeight: '40px' }}>
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
            name="vehicle_category"
            label={<span style={{ fontSize: '16px', fontWeight: 600 }}>Vehicle Category</span>}
            rules={[{ required: true, message: 'Please select vehicle category' }]}
          >
            <Select placeholder="Select vehicle category" size="large" style={{ fontSize: '16px', minHeight: '40px' }}>
              {vehicleCategories.map((category) => (
                <Option key={category.id} value={category.id}>
                  {category.name} - {category.description}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="monthly_allocation"
                label={<span style={{ fontSize: '16px', fontWeight: 600 }}>Monthly Allocation (Liters)</span>}
                rules={[{ required: true, message: 'Please enter monthly allocation' }]}
              >
                <InputNumber
                  style={{ width: '100%', fontSize: '16px', minHeight: '40px' }}
                  size="large"
                  min={0}
                  placeholder="e.g., 200"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="yearly_allocation"
                label={<span style={{ fontSize: '16px', fontWeight: 600 }}>Yearly Allocation (Liters)</span>}
                rules={[{ required: true, message: 'Please enter yearly allocation' }]}
              >
                <InputNumber
                  style={{ width: '100%', fontSize: '16px', minHeight: '40px' }}
                  size="large"
                  min={0}
                  placeholder="e.g., 2400"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="status"
                label="Status"
              >
                <Select placeholder="Select status">
                  <Option value="active">Active</Option>
                  <Option value="suspended">Suspended</Option>
                  <Option value="expired">Expired</Option>
                  <Option value="pending">Pending</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="effective_from"
                label="Effective From"
              >
                <Input type="date" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="notes"
            label="Notes"
          >
            <Input.TextArea 
              rows={3} 
              placeholder="Additional notes about this entitlement"
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit">
                {editingEntitlement ? 'Update Entitlement' : 'Create Entitlement'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default FuelAllocations;
