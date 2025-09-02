import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Switch,
  message,
  Space,
  Popconfirm,
  Tag,
  Tooltip,
  Row,
  Col,
  Statistic,
  Typography,
  Badge,
  Divider,
  InputNumber,
  Alert
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  CrownOutlined,
  TeamOutlined,
  BankOutlined,
  ReloadOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import apiClient from '@/api';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface PoliticalParty {
  id: number;
  name: string;
  short_name: string;
  abbreviation?: string;
  party_type: string;
  status: string;
  headquarters_address?: string;
  contact_phone?: string;
  contact_email?: string;
  website?: string;
  leader_name?: string;
  leader_title?: string;
  founded_date?: string;
  description?: string;
  is_government_party: boolean;
  is_parliamentary_party: boolean;
  display_order: number;
  primary_color?: string;
  secondary_color?: string;
  created_at: string;
  updated_at: string;
  display_name: string;
  member_count: number;
}

interface PartyStatistics {
  total_parties: number;
  active_parties: number;
  parliamentary_parties: number;
  government_party: string;
  total_members: number;
  party_breakdown: Array<{
    id: number;
    name: string;
    short_name: string;
    member_count: number;
    is_government_party: boolean;
    primary_color?: string;
  }>;
}

const PoliticalPartiesManagement: React.FC = () => {
  const [parties, setParties] = useState<PoliticalParty[]>([]);
  const [statistics, setStatistics] = useState<PartyStatistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingParty, setEditingParty] = useState<PoliticalParty | null>(null);
  const [form] = Form.useForm();

  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [partyTypeFilter, setPartyTypeFilter] = useState<string>('');
  const [parliamentaryFilter, setParliamentaryFilter] = useState<string>('');

  useEffect(() => {
    loadParties();
    loadStatistics();
  }, [statusFilter, partyTypeFilter, parliamentaryFilter]);

  const loadParties = async () => {
    try {
      setLoading(true);
      const params: any = {};
      
      if (statusFilter) params.status = statusFilter;
      if (partyTypeFilter) params.party_type = partyTypeFilter;
      if (parliamentaryFilter) params.parliamentary = parliamentaryFilter;

      const response = await apiClient.get('/political-parties/', { params });
      setParties(response.data.results || response.data);
    } catch (error) {
      console.error('Error loading political parties:', error);
      message.error('Failed to load political parties');
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const response = await apiClient.get('/political-parties/statistics/');
      setStatistics(response.data);
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  };

  const handleCreate = () => {
    setEditingParty(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (party: PoliticalParty) => {
    setEditingParty(party);
    form.setFieldsValue({
      ...party,
      founded_date: party.founded_date ? dayjs(party.founded_date) : null
    });
    setModalVisible(true);
  };

  const handleSubmit = async (values: any) => {
    try {
      const formData = {
        ...values,
        founded_date: values.founded_date ? values.founded_date.format('YYYY-MM-DD') : null
      };

      if (editingParty) {
        await apiClient.put(`/political-parties/${editingParty.id}/`, formData);
        message.success('Political party updated successfully');
      } else {
        await apiClient.post('/political-parties/', formData);
        message.success('Political party created successfully');
      }

      setModalVisible(false);
      form.resetFields();
      loadParties();
      loadStatistics();
    } catch (error: any) {
      console.error('Error saving political party:', error);
      if (error.response?.data) {
        Object.keys(error.response.data).forEach(key => {
          message.error(`${key}: ${error.response.data[key]}`);
        });
      } else {
        message.error('Failed to save political party');
      }
    }
  };

  const handleDelete = async (party: PoliticalParty) => {
    try {
      await apiClient.delete(`/political-parties/${party.id}/`);
      message.success('Political party disbanded successfully');
      loadParties();
      loadStatistics();
    } catch (error: any) {
      console.error('Error disbanding party:', error);
      if (error.response?.data?.error) {
        message.error(error.response.data.error);
      } else {
        message.error('Failed to disband party');
      }
    }
  };

  const handleSetGovernmentParty = async (party: PoliticalParty) => {
    try {
      await apiClient.post(`/political-parties/${party.id}/set_as_government_party/`);
      message.success(`${party.short_name} has been set as the government party`);
      loadParties();
      loadStatistics();
    } catch (error: any) {
      console.error('Error setting government party:', error);
      message.error('Failed to set government party');
    }
  };

  const handleSeedDefaultParties = async () => {
    try {
      const response = await apiClient.post('/political-parties/seed_default_parties/');
      message.success(response.data.message);
      loadParties();
      loadStatistics();
    } catch (error: any) {
      console.error('Error seeding parties:', error);
      if (error.response?.data?.error) {
        message.error(error.response.data.error);
      } else {
        message.error('Failed to seed default parties');
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'green';
      case 'INACTIVE': return 'orange';
      case 'DISBANDED': return 'red';
      case 'SUSPENDED': return 'volcano';
      default: return 'default';
    }
  };

  const getPartyTypeColor = (type: string) => {
    switch (type) {
      case 'POLITICAL': return 'blue';
      case 'COALITION': return 'purple';
      case 'ALLIANCE': return 'cyan';
      case 'INDEPENDENT': return 'gray';
      default: return 'default';
    }
  };

  const columns: ColumnsType<PoliticalParty> = [
    {
      title: 'Party',
      key: 'party',
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <Space>
            {record.primary_color && (
              <div
                style={{
                  width: 16,
                  height: 16,
                  backgroundColor: record.primary_color,
                  borderRadius: '50%',
                  border: '1px solid #d9d9d9'
                }}
              />
            )}
            <Text strong>{record.short_name}</Text>
            {record.is_government_party && (
              <Tag color="gold" icon={<CrownOutlined />}>
                Government
              </Tag>
            )}
          </Space>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.name}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'party_type',
      key: 'party_type',
      render: (type: string) => (
        <Tag color={getPartyTypeColor(type)}>
          {(type || '').replace('_', ' ')}
        </Tag>
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
    },
    {
      title: 'Leader',
      key: 'leader',
      render: (_, record) => (
        <Space direction="vertical" size="small">
          {record.leader_name && (
            <Text>{record.leader_name}</Text>
          )}
          {record.leader_title && (
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.leader_title}
            </Text>
          )}
        </Space>
      ),
    },
    {
      title: 'Members',
      dataIndex: 'member_count',
      key: 'member_count',
      render: (count: number) => (
        <Badge count={count} showZero color="#52c41a" />
      ),
      sorter: (a, b) => a.member_count - b.member_count,
    },
    {
      title: 'Parliamentary',
      dataIndex: 'is_parliamentary_party',
      key: 'is_parliamentary_party',
      render: (isParliamentary: boolean) => (
        <Tag color={isParliamentary ? 'green' : 'default'}>
          {isParliamentary ? 'Yes' : 'No'}
        </Tag>
      ),
    },
    {
      title: 'Founded',
      dataIndex: 'founded_date',
      key: 'founded_date',
      render: (date: string) => (
        date ? dayjs(date).format('MMM YYYY') : '-'
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Tooltip title="Edit Party">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          
          {!record.is_government_party && record.status === 'ACTIVE' && (
            <Tooltip title="Set as Government Party">
              <Popconfirm
                title="Set as Government Party"
                description={`Are you sure you want to set ${record.short_name} as the government party?`}
                onConfirm={() => handleSetGovernmentParty(record)}
                okText="Yes"
                cancelText="No"
              >
                <Button
                  type="text"
                  icon={<CrownOutlined />}
                  style={{ color: '#faad14' }}
                />
              </Popconfirm>
            </Tooltip>
          )}

          <Tooltip title="View Members">
            <Button
              type="text"
              icon={<UserOutlined />}
              onClick={() => {
                message.info(`View ${record.member_count} members of ${record.short_name}`);
              }}
            />
          </Tooltip>

          {record.member_count === 0 && (
            <Tooltip title="Disband Party">
              <Popconfirm
                title="Disband Party"
                description={`Are you sure you want to disband ${record.short_name}? This action cannot be undone.`}
                onConfirm={() => handleDelete(record)}
                okText="Yes"
                cancelText="No"
              >
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                />
              </Popconfirm>
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={3}>
            <BankOutlined /> Political Parties Management
          </Title>
          <Text type="secondary">
            Manage political parties and their affiliations - Subcenter Access
          </Text>
        </Col>
        <Col>
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => {
                loadParties();
                loadStatistics();
              }}
            >
              Refresh
            </Button>
            <Button
              type="default"
              icon={<TeamOutlined />}
              onClick={handleSeedDefaultParties}
            >
              Seed Default Parties
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreate}
            >
              Add Political Party
            </Button>
          </Space>
        </Col>
      </Row>

      {/* Access Notice */}
      <Alert
        message="Subcenter Management Access"
        description="You have access to manage political parties as a subcenter, superuser, or system administrator. Changes affect the entire system."
        type="info"
        showIcon
        icon={<ExclamationCircleOutlined />}
        style={{ marginBottom: 16 }}
      />

      {/* Statistics Cards */}
      {statistics && (
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={6}>
            <Card>
              <Statistic
                title="Total Parties"
                value={statistics.total_parties}
                prefix={<BankOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card>
              <Statistic
                title="Active Parties"
                value={statistics.active_parties}
                prefix={<TeamOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card>
              <Statistic
                title="Parliamentary Parties"
                value={statistics.parliamentary_parties}
                prefix={<BankOutlined />}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card>
              <Statistic
                title="Total Members"
                value={statistics.total_members}
                prefix={<UserOutlined />}
                valueStyle={{ color: '#f5222d' }}
              />
            </Card>
          </Col>
        </Row>
      )}

      {statistics?.government_party && (
        <Card style={{ marginBottom: 24, background: '#fffbf0', border: '1px solid #ffe58f' }}>
          <Space>
            <CrownOutlined style={{ color: '#faad14', fontSize: '20px' }} />
            <Text strong>Current Government Party: </Text>
            <Tag color="gold" style={{ fontSize: '14px' }}>
              {statistics.government_party}
            </Tag>
          </Space>
        </Card>
      )}

      {/* Filters */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col xs={24} sm={8}>
            <Select
              style={{ width: '100%' }}
              placeholder="Filter by Status"
              allowClear
              value={statusFilter}
              onChange={setStatusFilter}
            >
              <Option value="ACTIVE">Active</Option>
              <Option value="INACTIVE">Inactive</Option>
              <Option value="DISBANDED">Disbanded</Option>
              <Option value="SUSPENDED">Suspended</Option>
            </Select>
          </Col>
          <Col xs={24} sm={8}>
            <Select
              style={{ width: '100%' }}
              placeholder="Filter by Type"
              allowClear
              value={partyTypeFilter}
              onChange={setPartyTypeFilter}
            >
              <Option value="POLITICAL">Political</Option>
              <Option value="COALITION">Coalition</Option>
              <Option value="ALLIANCE">Alliance</Option>
              <Option value="INDEPENDENT">Independent</Option>
              <Option value="OTHER">Other</Option>
            </Select>
          </Col>
          <Col xs={24} sm={8}>
            <Select
              style={{ width: '100%' }}
              placeholder="Filter by Parliamentary Status"
              allowClear
              value={parliamentaryFilter}
              onChange={setParliamentaryFilter}
            >
              <Option value="true">Parliamentary</Option>
              <Option value="false">Non-Parliamentary</Option>
            </Select>
          </Col>
        </Row>
      </Card>

      {/* Main Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={parties}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} parties`,
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        title={
          <Space style={{ fontSize: '20px', fontWeight: 'bold' }}>
            <BankOutlined />
            {editingParty ? 'Edit Political Party' : 'Create Political Party'}
          </Space>
        }
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        width={1200}
        confirmLoading={loading}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="name"
                label={<span style={{ fontSize: '16px', fontWeight: 600 }}>Full Party Name</span>}
                rules={[{ required: true, message: 'Please enter party name' }]}
              >
                <Input placeholder="e.g., Zimbabwe African National Union - Patriotic Front" size="large" style={{ fontSize: '16px', minHeight: '40px' }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="short_name"
                label={<span style={{ fontSize: '16px', fontWeight: 600 }}>Short Name/Acronym</span>}
                rules={[{ required: true, message: 'Please enter short name' }]}
              >
                <Input placeholder="e.g., ZANU-PF" size="large" style={{ fontSize: '16px', minHeight: '40px' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item
                name="party_type"
                label={<span style={{ fontSize: '16px', fontWeight: 600 }}>Party Type</span>}
                rules={[{ required: true, message: 'Please select party type' }]}
              >
                <Select placeholder="Select party type" size="large" style={{ fontSize: '16px', minHeight: '40px' }}>
                  <Option value="POLITICAL">Political Party</Option>
                  <Option value="COALITION">Coalition</Option>
                  <Option value="ALLIANCE">Alliance</Option>
                  <Option value="INDEPENDENT">Independent</Option>
                  <Option value="OTHER">Other</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name="status"
                label={<span style={{ fontSize: '16px', fontWeight: 600 }}>Status</span>}
                rules={[{ required: true, message: 'Please select status' }]}
              >
                <Select placeholder="Select status" size="large" style={{ fontSize: '16px', minHeight: '40px' }}>
                  <Option value="ACTIVE">Active</Option>
                  <Option value="INACTIVE">Inactive</Option>
                  <Option value="SUSPENDED">Suspended</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name="display_order"
                label={<span style={{ fontSize: '16px', fontWeight: 600 }}>Display Order</span>}
                initialValue={100}
              >
                <InputNumber min={1} max={999} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="leader_name"
                label="Party Leader"
              >
                <Input placeholder="Current party leader name" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="leader_title"
                label="Leader Title"
              >
                <Input placeholder="e.g., President, Chairperson" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item
                name="founded_date"
                label="Founded Date"
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name="primary_color"
                label="Primary Color"
              >
                <Input
                  placeholder="#FF0000"
                  addonBefore={
                    <div
                      style={{
                        width: 20,
                        height: 20,
                        backgroundColor: form.getFieldValue('primary_color') || '#cccccc',
                        border: '1px solid #d9d9d9'
                      }}
                    />
                  }
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name="abbreviation"
                label="Alternative Abbreviation"
              >
                <Input placeholder="Optional abbreviation" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="contact_email"
                label="Contact Email"
                rules={[{ type: 'email', message: 'Invalid email format' }]}
              >
                <Input placeholder="party@example.com" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="contact_phone"
                label="Contact Phone"
              >
                <Input placeholder="+263 xxx xxx xxx" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="website"
            label="Website"
            rules={[{ type: 'url', message: 'Invalid website URL' }]}
          >
            <Input placeholder="https://www.party-website.com" />
          </Form.Item>

          <Form.Item
            name="headquarters_address"
            label="Headquarters Address"
          >
            <TextArea rows={2} placeholder="Party headquarters address" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
          >
            <TextArea rows={3} placeholder="Brief description of the party" />
          </Form.Item>

          <Divider />

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="is_parliamentary_party"
                label="Parliamentary Party"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                Does this party have parliamentary representation?
              </Text>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="is_government_party"
                label="Government Party"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                Is this currently the ruling party?
              </Text>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default PoliticalPartiesManagement;
