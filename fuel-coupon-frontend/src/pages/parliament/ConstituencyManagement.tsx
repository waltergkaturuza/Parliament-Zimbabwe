// src/pages/parliament/ConstituencyManagement.tsx
import React, { useMemo, useState } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  Switch,
  message,
  Tooltip,
  Tag,
  Row,
  Col,
  Divider,
  Typography,
  Badge
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  InfoCircleOutlined,
  ExportOutlined,
  SearchOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ColumnsType } from 'antd/es/table';
import apiClient from '@/api';

const { Title } = Typography;
const { Option } = Select;

// Types
interface Constituency {
  id: number;
  name: string;
  province: string;
  district?: string;
  distance_from_parliament_km: number;
  population?: number;
  is_active: boolean;
  created: string;
  modified: string;
}

interface ConstituencyFormData {
  name: string;
  province: string;
  district?: string;
  distance_from_parliament_km: number;
  population?: number;
  is_active: boolean;
}

// Zimbabwe Provinces and Districts  
// Complete official list based on Zimbabwe National Statistics Agency 
// and Ministry of Local Government (2025)
const ZIMBABWE_PROVINCES = {
  'Harare': ['Harare', 'Chitungwiza', 'Epworth'],
  'Bulawayo': ['Bulawayo'],
  'Manicaland': ['Mutare','Mutare Rural', 'Makoni', 'Mutare Urban', 'Chipinge', 'Rusape', 'Chimanimani', 'Buhera', 'Nyanga', 'Mutasa'],
  'Mashonaland Central': ['Bindura', 'Mazowe', 'Mt Darwin', 'Guruve', 'Mbire', 'Rushinga', 'Shamva'],
  'Mashonaland East': ['Marondera', 'Murehwa', 'Mutoko', 'Seke', 'Goromonzi', 'Wedza (Hwedza)', 'Chikomba', 'Uzumba-Maramba-Pfungwe (UMP)'],
  'Mashonaland West': ['Chinhoyi', 'Chegutu', 'Hurungwe', 'Zvimba', 'Makonde', 'Kariba', 'Kadoma','Sanyati', 'Mhondoro-Ngezi'],
  'Masvingo': ['Masvingo', 'Chivi', 'Mwenezi', 'Gutu', 'Bikita', 'Zaka', 'Chiredzi'],
  'Midlands': ['Gweru', 'Kwekwe', 'Mvuma (Chirumhanzu)', 'Shurugwi', 'Zvishavane', 'Gokwe North', 'Gokwe South', 'Mberengwa'],
  'Matabeleland North': ['Lupane', 'Hwange', 'Binga', 'Bubi', 'Nkayi', 'Tsholotsho', 'Umguza'],
  'Matabeleland South': ['Gwanda', 'Beitbridge', 'Matobo', 'Insiza', 'Bulilima', 'Mangwe', 'Umzingwane']
};

// API Service
const ConstituencyService = {
  async getConstituencies(page: number, pageSize: number): Promise<{ results: Constituency[]; total: number }> {
    const response = await apiClient.get(`/constituencies/?page=${page}&page_size=${pageSize}`);
    const data = response.data;
    // Support both paginated response and direct array
    if (Array.isArray(data)) {
      return { results: data, total: data.length };
    }
    return { results: data.results || [], total: data.count ?? (data.results?.length || 0) };
  },

  async createConstituency(data: ConstituencyFormData): Promise<Constituency> {
    const response = await apiClient.post('/constituencies/', data);
    return response.data;
  },

  async updateConstituency(id: number, data: Partial<ConstituencyFormData>): Promise<Constituency> {
    const response = await apiClient.patch(`/constituencies/${id}/`, data);
    return response.data;
  },

  async deleteConstituency(id: number): Promise<void> {
    await apiClient.delete(`/constituencies/${id}/`);
  },
};

const ConstituencyManagement: React.FC = () => {
  const [form] = Form.useForm();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingConstituency, setEditingConstituency] = useState<Constituency | null>(null);
  const [selectedProvince, setSelectedProvince] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);

  const queryClient = useQueryClient();

  // Fetch constituencies
  const { data: constituenciesData, isLoading, refetch } = useQuery({
    queryKey: ['constituencies', page, pageSize],
    queryFn: () => ConstituencyService.getConstituencies(page, pageSize),
    placeholderData: (prev) => prev,
  });

  // Ensure constituencies is always an array (handle both array and paginated response)
  const constituencies = useMemo(() => {
    if (!constituenciesData) return [] as Constituency[];
    return constituenciesData.results || [];
  }, [constituenciesData]);

  const total = useMemo(() => {
    if (!constituenciesData) return 0;
    return constituenciesData.total ?? 0;
  }, [constituenciesData]);

  // Create constituency mutation
  const createMutation = useMutation({
    mutationFn: ConstituencyService.createConstituency,
    onSuccess: () => {
      message.success('Constituency created successfully!');
      setIsCreateModalOpen(false);
      form.resetFields();
  queryClient.invalidateQueries({ queryKey: ['constituencies'] });
    },
    onError: (error: any) => {
      message.error(`Failed to create constituency: ${error.message}`);
    },
  });

  // Update constituency mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ConstituencyFormData> }) =>
      ConstituencyService.updateConstituency(id, data),
    onSuccess: () => {
      message.success('Constituency updated successfully!');
      setIsEditModalOpen(false);
      setEditingConstituency(null);
      form.resetFields();
  queryClient.invalidateQueries({ queryKey: ['constituencies'] });
    },
    onError: (error: any) => {
      message.error(`Failed to update constituency: ${error.message}`);
    },
  });

  // Delete constituency mutation
  const deleteMutation = useMutation({
    mutationFn: ConstituencyService.deleteConstituency,
    onSuccess: () => {
      message.success('Constituency deleted successfully!');
  queryClient.invalidateQueries({ queryKey: ['constituencies'] });
    },
    onError: (error: any) => {
      message.error(`Failed to delete constituency: ${error.message}`);
    },
  });

  // Handle create
  const handleCreate = async (values: ConstituencyFormData) => {
    createMutation.mutate(values);
  };

  // Handle edit
  const handleEdit = (constituency: Constituency) => {
    setEditingConstituency(constituency);
    setSelectedProvince(constituency.province);
    form.setFieldsValue({
      ...constituency,
    });
    setIsEditModalOpen(true);
  };

  // Handle update
  const handleUpdate = async (values: ConstituencyFormData) => {
    if (!editingConstituency) return;
    updateMutation.mutate({ id: editingConstituency.id, data: values });
  };

  // Handle delete
  const handleDelete = (constituency: Constituency) => {
    Modal.confirm({
      title: 'Delete Constituency',
      content: `Are you sure you want to delete "${constituency.name}"? This action cannot be undone.`,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: () => deleteMutation.mutate(constituency.id),
    });
  };

  // Table columns
  const columns: ColumnsType<Constituency> = [
    {
      title: 'Constituency Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (text: string, record: Constituency) => (
        <div>
          <div className="font-medium">{text}</div>
          <div className="text-xs text-gray-500">ID: {record.id}</div>
        </div>
      ),
    },
    {
      title: 'Province',
      dataIndex: 'province',
      key: 'province',
      sorter: (a, b) => a.province.localeCompare(b.province),
      render: (text: string) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: 'District',
      dataIndex: 'district',
      key: 'district',
      render: (text: string) => text ? <Tag color="green">{text}</Tag> : <span className="text-gray-400">-</span>,
    },
    {
      title: 'Distance (km)',
      dataIndex: 'distance_from_parliament_km',
      key: 'distance',
      sorter: (a, b) => a.distance_from_parliament_km - b.distance_from_parliament_km,
      render: (distance: number) => (
        <div className="text-center">
          <Badge
            count={distance}
            overflowCount={100000}
            color={distance < 50 ? 'green' : distance < 200 ? 'orange' : 'red'}
          />
        </div>
      ),
    },
    {
      title: 'Population',
      dataIndex: 'population',
      key: 'population',
      sorter: (a, b) => (a.population || 0) - (b.population || 0),
      render: (population: number) => 
        population ? population.toLocaleString() : <span className="text-gray-400">-</span>,
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'status',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record: Constituency) => (
        <Space>
          <Tooltip title="Edit Constituency">
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Tooltip title="Delete Constituency">
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <Title level={2}>Constituency Management</Title>
          <p className="text-gray-600">
            Manage constituencies with their districts and provinces for parliamentary operations
          </p>
        </div>
        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => refetch()}
            loading={isLoading}
          >
            Refresh
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsCreateModalOpen(true)}
          >
            Add Constituency
          </Button>
        </Space>
      </div>

      {/* Stats Cards */}
      <Row gutter={16}>
        <Col span={6}>
          <Card>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{constituencies.length}</div>
              <div className="text-gray-600">Total Constituencies</div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {constituencies.filter(c => c.is_active).length}
              </div>
              <div className="text-gray-600">Active</div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {Object.keys(ZIMBABWE_PROVINCES).length}
              </div>
              <div className="text-gray-600">Provinces</div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {constituencies.reduce((sum, c) => sum + (c.population || 0), 0).toLocaleString()}
              </div>
              <div className="text-gray-600">Total Population</div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Main Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={constituencies}
          rowKey="id"
          loading={isLoading}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (t, range) => `${range[0]}-${range[1]} of ${t} constituencies`,
            onChange: (p, ps) => {
              setPage(p);
              if (ps !== pageSize) {
                setPageSize(ps);
                setPage(1); // reset to first page when page size changes
              }
            },
          }}
          scroll={{ x: 1000 }}
        />
      </Card>

      {/* Create Modal */}
      <Modal
        title={<span style={{ fontSize: '20px', fontWeight: 'bold' }}>Add New Constituency</span>}
        open={isCreateModalOpen}
        onCancel={() => {
          setIsCreateModalOpen(false);
          form.resetFields();
          setSelectedProvince('');
        }}
        footer={null}
        width={900}
        destroyOnHidden
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreate}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label={<span style={{ fontSize: '16px', fontWeight: 600 }}>Constituency Name</span>}
                rules={[{ required: true, message: 'Please enter constituency name' }]}
              >
                <Input placeholder="Enter constituency name" size="large" style={{ fontSize: '16px', minHeight: '40px' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="province"
                label={<span style={{ fontSize: '16px', fontWeight: 600 }}>Province</span>}
                rules={[{ required: true, message: 'Please select province' }]}
              >
                <Select
                  placeholder="Select province"
                  size="large"
                  style={{ fontSize: '16px', minHeight: '40px' }}
                  onChange={(value) => {
                    setSelectedProvince(value);
                    form.setFieldValue('district', undefined);
                  }}
                >
                  {Object.keys(ZIMBABWE_PROVINCES).map(province => (
                    <Option key={province} value={province}>{province}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="district"
                label={<span style={{ fontSize: '16px', fontWeight: 600 }}>District (Optional)</span>}
              >
                <Select
                  placeholder="Select district"
                  disabled={!selectedProvince}
                  allowClear
                  size="large"
                  style={{ fontSize: '16px', minHeight: '40px' }}
                >
                  {selectedProvince && ZIMBABWE_PROVINCES[selectedProvince as keyof typeof ZIMBABWE_PROVINCES]?.map(district => (
                    <Option key={district} value={district}>{district}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="distance_from_parliament_km"
                label={<span style={{ fontSize: '16px', fontWeight: 600 }}>Distance from Parliament (km)</span>}
                rules={[{ required: true, message: 'Please enter distance' }]}
                initialValue={0}
              >
                <InputNumber
                  min={0}
                  max={1000}
                  placeholder="Distance in km"
                  style={{ width: '100%', fontSize: '16px', minHeight: '40px' }}
                  size="large"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="population"
                label={<span style={{ fontSize: '16px', fontWeight: 600 }}>Population (Optional)</span>}
              >
                <InputNumber
                  min={0}
                  placeholder="Estimated population"
                  style={{ width: '100%', fontSize: '16px', minHeight: '40px' }}
                  size="large"
                  formatter={(value) => (value ? `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '')}
                  // @ts-ignore AntD typing expects (string|undefined)=>number but is too strict in our setup
                  parser={(value: any) => {
                    if (!value) return 0;
                    const cleaned = String(value || '').replace(/\$\s?|,/g, '');
                    const n = Number.parseInt(cleaned, 10);
                    return Number.isNaN(n) ? 0 : n;
                  }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="is_active"
                label={<span style={{ fontSize: '16px', fontWeight: 600 }}>Status</span>}
                valuePropName="checked"
                initialValue={true}
              >
                <Switch
                  checkedChildren="Active"
                  unCheckedChildren="Inactive"
                />
              </Form.Item>
            </Col>
          </Row>

          <Divider />

          <div className="flex justify-end space-x-2">
            <Button
              onClick={() => {
                setIsCreateModalOpen(false);
                form.resetFields();
                setSelectedProvince('');
              }}
            >
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={createMutation.isPending}
            >
              Create Constituency
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        title="Edit Constituency"
        open={isEditModalOpen}
        onCancel={() => {
          setIsEditModalOpen(false);
          setEditingConstituency(null);
          form.resetFields();
          setSelectedProvince('');
        }}
        footer={null}
        width={600}
        destroyOnHidden
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleUpdate}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="Constituency Name"
                rules={[{ required: true, message: 'Please enter constituency name' }]}
              >
                <Input placeholder="Enter constituency name" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="province"
                label="Province"
                rules={[{ required: true, message: 'Please select province' }]}
              >
                <Select
                  placeholder="Select province"
                  onChange={(value) => {
                    setSelectedProvince(value);
                    form.setFieldValue('district', undefined);
                  }}
                >
                  {Object.keys(ZIMBABWE_PROVINCES).map(province => (
                    <Option key={province} value={province}>{province}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="district"
                label="District (Optional)"
              >
                <Select
                  placeholder="Select district"
                  disabled={!selectedProvince}
                  allowClear
                >
                  {selectedProvince && ZIMBABWE_PROVINCES[selectedProvince as keyof typeof ZIMBABWE_PROVINCES]?.map(district => (
                    <Option key={district} value={district}>{district}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="distance_from_parliament_km"
                label="Distance from Parliament (km)"
                rules={[{ required: true, message: 'Please enter distance' }]}
              >
                <InputNumber
                  min={0}
                  max={1000}
                  placeholder="Distance in km"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="population"
                label="Population (Optional)"
              >
                <InputNumber
                  min={0}
                  placeholder="Estimated population"
                  style={{ width: '100%' }}
                  formatter={(value) => (value ? `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '')}
                  // @ts-ignore AntD typing expects (string|undefined)=>number but is too strict in our setup
                  parser={(value: any) => {
                    if (!value) return 0;
                    const cleaned = String(value).replace(/\$\s?|,/g, '');
                    const n = Number.parseInt(cleaned, 10);
                    return Number.isNaN(n) ? 0 : n;
                  }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="is_active"
                label="Status"
                valuePropName="checked"
              >
                <Switch
                  checkedChildren="Active"
                  unCheckedChildren="Inactive"
                />
              </Form.Item>
            </Col>
          </Row>

          <Divider />

          <div className="flex justify-end space-x-2">
            <Button
              onClick={() => {
                setIsEditModalOpen(false);
                setEditingConstituency(null);
                form.resetFields();
                setSelectedProvince('');
              }}
            >
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={updateMutation.isPending}
            >
              Update Constituency
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default ConstituencyManagement;
