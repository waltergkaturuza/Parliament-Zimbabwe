// src/components/fuel/dynamic/AllocationRulesManager.tsx
// Dynamic Fuel Allocation Rules Manager Component

import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  InputNumber,
  Switch,
  message,
  Popconfirm,
  Tag,
  Alert,
  Row,
  Col,
  Tooltip,
  Typography
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SettingOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  StopOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

// API and Types
import dynamicAllocationApi from '../../../api/dynamicAllocation';
import type { FuelAllocationRule } from '../../../types/dynamicAllocation';

const { TextArea } = Input;
const { Text } = Typography;

const AllocationRulesManager: React.FC = () => {
  // State
  const [loading, setLoading] = useState<boolean>(true);
  const [rules, setRules] = useState<FuelAllocationRule[]>([]);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [editingRule, setEditingRule] = useState<FuelAllocationRule | null>(null);
  const [form] = Form.useForm();

  // Load rules
  const loadRules = async () => {
    try {
      setLoading(true);
      const response = await dynamicAllocationApi.allocationRules.getAll();
      setRules(response.results || []);
    } catch (error: any) {
      console.error('Failed to load rules:', error);
      message.error('Failed to load allocation rules');
    } finally {
      setLoading(false);
    }
  };

  // Open create modal
  const openCreateModal = () => {
    setEditingRule(null);
    form.resetFields();
    setModalVisible(true);
  };

  // Open edit modal
  const openEditModal = (rule: FuelAllocationRule) => {
    setEditingRule(rule);
    form.setFieldsValue(rule);
    setModalVisible(true);
  };

  // Handle save
  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      
      if (editingRule) {
        // Update existing rule
        await dynamicAllocationApi.allocationRules.update(editingRule.id, values);
        message.success('Allocation rule updated successfully');
      } else {
        // Create new rule
        await dynamicAllocationApi.allocationRules.create(values);
        message.success('Allocation rule created successfully');
      }
      
      setModalVisible(false);
      loadRules();
    } catch (error: any) {
      console.error('Failed to save rule:', error);
      message.error('Failed to save allocation rule');
    }
  };

  // Handle delete
  const handleDelete = async (rule: FuelAllocationRule) => {
    try {
      await dynamicAllocationApi.allocationRules.delete(rule.id);
      message.success('Allocation rule deleted successfully');
      loadRules();
    } catch (error: any) {
      console.error('Failed to delete rule:', error);
      message.error('Failed to delete allocation rule');
    }
  };

  // Table columns
  const columns: ColumnsType<FuelAllocationRule> = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record) => (
        <Space direction="vertical" size="small">
          <strong>{name}</strong>
          <Tag color={record.is_active ? 'green' : 'red'} icon={
            record.is_active ? <CheckCircleOutlined /> : <StopOutlined />
          }>
            {record.is_active ? 'Active' : 'Inactive'}
          </Tag>
        </Space>
      )
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (text: string) => (
        <Tooltip title={text}>
          <Text ellipsis style={{ maxWidth: 200 }}>{text}</Text>
        </Tooltip>
      )
    },
    {
      title: 'Engine Constants',
      key: 'constants',
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <Text style={{ fontSize: '12px' }}>
            Small: {record.small_engine_constant}
          </Text>
          <Text style={{ fontSize: '12px' }}>
            Medium: {record.medium_engine_constant}
          </Text>
          <Text style={{ fontSize: '12px' }}>
            Large: {record.large_engine_constant}
          </Text>
        </Space>
      )
    },
    {
      title: 'Distance Factor',
      dataIndex: 'distance_factor',
      key: 'distance_factor',
      render: (factor: number) => (
        <Tag color="blue">{factor}</Tag>
      )
    },
    {
      title: 'Top-up',
      key: 'topup',
      render: (_, record) => (
        <Space direction="vertical" size="small">
          {record.base_top_up_litres > 0 && (
            <Tag color="orange">+{record.base_top_up_litres}L</Tag>
          )}
          {record.top_up_percentage > 0 && (
            <Tag color="purple">+{record.top_up_percentage}%</Tag>
          )}
          {record.base_top_up_litres === 0 && record.top_up_percentage === 0 && (
            <Tag color="default">No top-up</Tag>
          )}
        </Space>
      )
    },
    {
      title: 'Limits',
      key: 'limits',
      render: (_, record) => (
        <Space direction="vertical" size="small">
          {record.min_allocation_litres > 0 && (
            <Text style={{ fontSize: '12px', color: '#666' }}>
              Min: {record.min_allocation_litres}L
            </Text>
          )}
          {record.max_allocation_litres && (
            <Text style={{ fontSize: '12px', color: '#666' }}>
              Max: {record.max_allocation_litres}L
            </Text>
          )}
        </Space>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 120,
      render: (_, record) => (
        <Space>
          <Tooltip title="Edit Rule">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => openEditModal(record)}
            />
          </Tooltip>
          <Tooltip title="Delete Rule">
            <Popconfirm
              title="Delete this allocation rule?"
              description="This action cannot be undone."
              onConfirm={() => handleDelete(record)}
              okText="Yes"
              cancelText="No"
            >
              <Button
                type="text"
                size="small"
                icon={<DeleteOutlined />}
                danger
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      )
    }
  ];

  // Load data on mount
  useEffect(() => {
    loadRules();
  }, []);

  return (
    <div>
      {/* Header */}
      <Row justify="space-between" align="middle" style={{ marginBottom: '16px' }}>
        <Col>
          <Space>
            <SettingOutlined style={{ fontSize: '20px', color: '#1890ff' }} />
            <span style={{ fontSize: '16px', fontWeight: 'bold' }}>
              Allocation Rules Manager
            </span>
          </Space>
        </Col>
        <Col>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={openCreateModal}
          >
            Create Rule
          </Button>
        </Col>
      </Row>

      {/* Info Alert */}
      <Alert
        message="POZ Parliament Allocation Formula"
        description="Base allocation = Distance × Engine constant × Distance factor + Top-up. Engine constants: Small engines (< 2800cc), Medium engines (2800-3199cc), Large engines (≥ 3200cc)."
        type="info"
        showIcon
        style={{ marginBottom: '16px' }}
        closable
      />

      {/* Rules Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={rules}
          rowKey="id"
          loading={loading}
          size="small"
          scroll={{ x: 1000 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `Total ${total} rules`
          }}
        />
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        title={editingRule ? 'Edit Allocation Rule' : 'Create Allocation Rule'}
        open={modalVisible}
        onOk={handleSave}
        onCancel={() => setModalVisible(false)}
        width={800}
        okText={editingRule ? 'Update' : 'Create'}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            is_active: true,
            small_engine_constant: 0.39,
            medium_engine_constant: 0.43,
            large_engine_constant: 0.56,
            distance_factor: 0.001,
            base_top_up_litres: 0,
            top_up_percentage: 0,
            min_allocation_litres: 0,
            max_allocation_litres: null
          }}
        >
          {/* Basic Information */}
          <Card size="small" title="Basic Information" style={{ marginBottom: '16px' }}>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="name"
                  label="Rule Name"
                  rules={[{ required: true, message: 'Please enter rule name' }]}
                >
                  <Input placeholder="Enter rule name" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="is_active"
                  label="Status"
                  valuePropName="checked"
                >
                  <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item
              name="description"
              label="Description"
              rules={[{ required: true, message: 'Please enter description' }]}
            >
              <TextArea rows={3} placeholder="Enter rule description" />
            </Form.Item>
          </Card>

          {/* Engine Constants */}
          <Card size="small" title="Engine Constants" style={{ marginBottom: '16px' }}>
            <Alert
              message="Engine constants are used in the POZ Parliament formula"
              description="These values are multiplied with distance and distance factor to calculate base allocation."
              type="info"
              showIcon
              style={{ marginBottom: '16px' }}
            />
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  name="small_engine_constant"
                  label="Small Engine (< 2800cc)"
                  rules={[{ required: true, message: 'Required' }]}
                >
                  <InputNumber
                    min={0}
                    max={1}
                    step={0.01}
                    precision={2}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="medium_engine_constant"
                  label="Medium Engine (2800-3199cc)"
                  rules={[{ required: true, message: 'Required' }]}
                >
                  <InputNumber
                    min={0}
                    max={1}
                    step={0.01}
                    precision={2}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="large_engine_constant"
                  label="Large Engine (≥ 3200cc)"
                  rules={[{ required: true, message: 'Required' }]}
                >
                  <InputNumber
                    min={0}
                    max={1}
                    step={0.01}
                    precision={2}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item
              name="distance_factor"
              label="Distance Factor"
              rules={[{ required: true, message: 'Please enter distance factor' }]}
            >
              <InputNumber
                min={0}
                max={1}
                step={0.001}
                precision={3}
                style={{ width: '200px' }}
                addonAfter="per km"
              />
            </Form.Item>
          </Card>

          {/* Top-up Settings */}
          <Card size="small" title="Top-up Settings" style={{ marginBottom: '16px' }}>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="base_top_up_litres"
                  label="Base Top-up (Litres)"
                  help="Fixed litres added to all allocations"
                >
                  <InputNumber
                    min={0}
                    step={1}
                    precision={2}
                    style={{ width: '100%' }}
                    addonAfter="L"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="top_up_percentage"
                  label="Top-up Percentage"
                  help="Percentage increase applied to base allocation"
                >
                  <InputNumber
                    min={0}
                    max={100}
                    step={1}
                    style={{ width: '100%' }}
                    addonAfter="%"
                  />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          {/* Allocation Limits */}
          <Card size="small" title="Allocation Limits">
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="min_allocation_litres"
                  label="Minimum Allocation"
                  help="Minimum litres per allocation (0 = no minimum)"
                >
                  <InputNumber
                    min={0}
                    step={1}
                    precision={2}
                    style={{ width: '100%' }}
                    addonAfter="L"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="max_allocation_litres"
                  label="Maximum Allocation"
                  help="Maximum litres per allocation (empty = no maximum)"
                >
                  <InputNumber
                    min={0}
                    step={1}
                    precision={2}
                    style={{ width: '100%' }}
                    addonAfter="L"
                  />
                </Form.Item>
              </Col>
            </Row>
          </Card>
        </Form>
      </Modal>
    </div>
  );
};

export default AllocationRulesManager;
