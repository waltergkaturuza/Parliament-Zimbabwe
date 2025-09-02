// src/pages/parliament/ProgramsPage.tsx
import { useState, useEffect } from 'react';
import type { FC } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Form,
  Input,
  DatePicker,
  Select,
  Modal,
  Tag,
  Spin,
  Typography,
  Row,
  Col,
  Statistic,
  Popconfirm,
  Tooltip,
  Switch,
  Descriptions,
  Badge,
  Alert,
  App,
  message
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CalendarOutlined,
  UserOutlined,
  EnvironmentOutlined,
  AppstoreOutlined,
  EyeOutlined,
  CheckOutlined,
  CloseOutlined,
  TeamOutlined
} from '@ant-design/icons';
import apiClient from '@/api/index';
import type { Program, User } from '../../types';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface ProgramStats {
  totalPrograms: number;
  activePrograms: number;
  completedPrograms: number;
  upcomingPrograms: number;
  totalAttendees: number;
}

interface SubCenter {
  id: string;
  name: string;
  location: string;
}

const ProgramsPage: FC = () => {
  const { message: antMessage } = App.useApp();
  const [loading, setLoading] = useState(true);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [subCenters, setSubCenters] = useState<SubCenter[]>([]);
  const [organizers, setOrganizers] = useState<User[]>([]);
  const [stats, setStats] = useState<ProgramStats>({
    totalPrograms: 0,
    activePrograms: 0,
    completedPrograms: 0,
    upcomingPrograms: 0,
    totalAttendees: 0
  });
  const [modalVisible, setModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  const [viewingProgram, setViewingProgram] = useState<Program | null>(null);
  const [form] = Form.useForm();
  const [tableLoading, setTableLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load programs first
      const programsPromise = apiClient.get('/programs/');

      // Sub-centers endpoint can be either '/sub-centers/' or '/subcenters/' depending on router; try both
      const subCentersPromise = (async () => {
        try {
          return await apiClient.get('/sub-centers/');
        } catch (e: any) {
          console.warn('GET /sub-centers/ failed, trying /subcenters/ instead', e?.response?.status);
          return await apiClient.get('/subcenters/');
        }
      })();

      // Organizers: MAIN_CENTER or SUB_CENTER users
      const organizersPromise = apiClient.get('/users/?role__in=MAIN_CENTER,SUB_CENTER');

      const [programsResponse, subCentersResponse, organizersResponse] = await Promise.all([
        programsPromise,
        subCentersPromise,
        organizersPromise,
      ]);

      const programData = programsResponse.data.results || programsResponse.data;
      setPrograms(programData);

      const subCentersData = subCentersResponse.data?.results ?? subCentersResponse.data ?? [];
      setSubCenters(Array.isArray(subCentersData) ? subCentersData : []);

      const organizersData = organizersResponse.data?.results ?? organizersResponse.data ?? [];
      setOrganizers(Array.isArray(organizersData) ? organizersData : []);

      // Calculate stats
      const now = dayjs();
      const newStats: ProgramStats = {
        totalPrograms: programData.length,
        activePrograms: programData.filter((p: Program) => p.is_active).length,
        completedPrograms: programData.filter((p: Program) => 
          p.end_date && dayjs(p.end_date).isBefore(now)
        ).length,
        upcomingPrograms: programData.filter((p: Program) => 
          dayjs(p.scheduled_date).isAfter(now)
        ).length,
        totalAttendees: programData.reduce((sum: number, program: Program) => 
          sum + (program.attendees?.length || 0), 0
        )
      };
      setStats(newStats);
    } catch (error: any) {
      console.error('Error loading data:', error);
      message.error(error?.response?.data?.detail || 'Failed to load programs data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingProgram(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (program: Program) => {
    setEditingProgram(program);
    form.setFieldsValue({
      title: program.title,
      program_type: program.program_type,
      scheduled_date: dayjs(program.scheduled_date),
      end_date: program.end_date ? dayjs(program.end_date) : null,
      description: program.description,
      location: program.location,
      organizer: typeof program.organizer === 'number' ? program.organizer : program.organizer_details?.id || '',
      sub_center: typeof program.sub_center === 'number' ? program.sub_center : program.sub_center_details?.id || '',
      expected_participants: program.expected_participants ?? program.attendees_count ?? 0,
      fuel_allocation_approved: program.fuel_allocation_approved,
      is_active: program.is_active,
      notes: program.notes,
    });
    setModalVisible(true);
  };

  const handleView = (program: Program) => {
    setViewingProgram(program);
    setDetailModalVisible(true);
  };

  const handleDelete = async (programId: string) => {
    try {
      setTableLoading(true);
      await apiClient.delete(`/programs/${programId}/`);
      message.success('Program deleted successfully');
      loadData();
    } catch (error) {
      console.error('Error deleting program:', error);
      message.error('Failed to delete program');
    } finally {
      setTableLoading(false);
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      setTableLoading(true);
      const payload = {
        title: values.title,
        program_type: values.program_type,
        scheduled_date: values.scheduled_date.toISOString(),
        end_date: values.end_date ? values.end_date.toISOString() : null,
        description: values.description || '',
        location: values.location || '',
        organizer: values.organizer || null,
        sub_center: values.sub_center || null,
        expected_participants: values.expected_participants || 0,
        fuel_allocation_approved: values.fuel_allocation_approved || false,
        is_active: values.is_active !== false,
        notes: values.notes || ''
      };

      if (editingProgram) {
        await apiClient.put(`/programs/${editingProgram.id}/`, payload);
        message.success('Program updated successfully');
      } else {
        await apiClient.post('/programs/', payload);
        message.success('Program created successfully');
      }

      setModalVisible(false);
      form.resetFields();
      loadData();
    } catch (error: any) {
      console.error('Error saving program:', error);
      message.error(error.response?.data?.detail || 'Failed to save program');
    } finally {
      setTableLoading(false);
    }
  };

  const getProgramStatus = (program: Program) => {
    const now = dayjs();
    const scheduled = dayjs(program.scheduled_date);
    const end = program.end_date ? dayjs(program.end_date) : null;

    if (!program.is_active) {
      return <Tag color="default">Inactive</Tag>;
    }

    if (scheduled.isAfter(now)) {
      return <Tag color="blue">Upcoming</Tag>;
    } else if (end && end.isAfter(now)) {
      return <Tag color="green">In Progress</Tag>;
    } else if (end && end.isBefore(now)) {
      return <Tag color="default">Completed</Tag>;
    } else {
      return <Tag color="orange">Ongoing</Tag>;
    }
  };

  const getProgramTypeColor = (type: string) => {
    switch (type) {
      case 'SESSION':
        return 'blue';
      case 'COMMITTEE':
        return 'green';
      case 'WORKSHOP':
        return 'orange';
      case 'OUTREACH':
        return 'purple';
      case 'CONFERENCE':
        return 'cyan';
      case 'CEREMONY':
        return 'red';
      case 'INSPECTION':
        return 'gold';
      case 'CAMPAIGN':
        return 'magenta';
      case 'NATIONAL_EVENT':
        return 'volcano';
      case 'CONSTITUENCY':
        return 'geekblue';
      case 'DEBATE':
        return 'lime';
      case 'BUDGET_SESSION':
        return 'orange';
      case 'POLICY_MEETING':
        return 'purple';
      case 'PUBLIC_HEARING':
        return 'cyan';
      case 'DIPLOMATIC':
        return 'red';
      case 'OTHER':
        return 'default';
      default:
        return 'default';
    }
  };

  const columns = [
    {
      title: 'Program',
      dataIndex: 'title',
      key: 'title',
      sorter: (a: Program, b: Program) => a.title.localeCompare(b.title),
      render: (text: string, record: Program) => (
        <div>
          <Text strong>{text}</Text>
          <br />
          <Tag color={getProgramTypeColor(record.program_type)} className="mt-1">
            {record.program_type?.replace('_', ' ')}
          </Tag>
        </div>
      ),
    },
    {
      title: 'Schedule',
      key: 'schedule',
      sorter: (a: Program, b: Program) => 
        dayjs(a.scheduled_date).unix() - dayjs(b.scheduled_date).unix(),
      render: (_: any, record: Program) => (
        <div>
          <div>
            <CalendarOutlined /> {dayjs(record.scheduled_date).format('MMM DD, YYYY')}
          </div>
          <div className="text-xs text-gray-500">
            {dayjs(record.scheduled_date).format('HH:mm')}
            {record.end_date && ` - ${dayjs(record.end_date).format('HH:mm')}`}
          </div>
        </div>
      ),
    },
    {
      title: 'Location',
      dataIndex: 'location',
      key: 'location',
      render: (location: string) => (
        <span>
          <EnvironmentOutlined /> {location || 'Not specified'}
        </span>
      ),
    },
    {
      title: 'Organizer',
      key: 'organizer',
      render: (_: any, record: Program) => (
        record.organizer_details ? (
          <div>
            <UserOutlined /> {record.organizer_details.first_name} {record.organizer_details.last_name}
            <div className="text-xs text-gray-500">
              {record.organizer_details.role?.replace('_', ' ')}
            </div>
          </div>
        ) : record.organizer ? (
          <span>{record.organizer}</span>
        ) : (
          <Text type="secondary">No organizer</Text>
        )
      ),
    },
    {
      title: 'Sub Center',
      key: 'sub_center',
      render: (_: any, record: Program) => (
        record.sub_center_details ? (
          <Tag color="cyan">{record.sub_center_details.name}</Tag>
        ) : record.sub_center ? (
          <span>{record.sub_center}</span>
        ) : (
          <Text type="secondary">No sub center</Text>
        )
      ),
    },
    {
      title: 'Status',
      key: 'status',
      align: 'center' as const,
      render: (_: any, record: Program) => getProgramStatus(record),
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'center' as const,
      render: (_: any, record: Program) => (
        <Space size="small">
          <Tooltip title="View Details">
            <Button 
              type="text" 
              icon={<EyeOutlined />} 
              onClick={() => handleView(record)}
            />
          </Tooltip>
          <Tooltip title="Edit">
            <Button 
              type="text" 
              icon={<EditOutlined />} 
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Delete Program"
            description="Are you sure you want to delete this program?"
            onConfirm={() => handleDelete(record.id.toString())}
            okText="Yes"
            cancelText="No"
          >
            <Tooltip title="Delete">
              <Button 
                type="text" 
                danger 
                icon={<DeleteOutlined />}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <Title level={2}>Programs Management</Title>
        <Text type="secondary">
          Manage training programs, distribution activities, meetings, and other parliamentary programs
        </Text>
      </div>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Programs"
              value={stats.totalPrograms}
              prefix={<AppstoreOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Active Programs"
              value={stats.activePrograms}
              prefix={<Badge status="processing" />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Upcoming Programs"
              value={stats.upcomingPrograms}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Attendees"
              value={stats.totalAttendees}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Main Content */}
      <Card>
        <div className="flex justify-between items-center mb-4">
          <Text strong>Programs</Text>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreate}
          >
            New Program
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={programs}
          rowKey="id"
          loading={tableLoading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} programs`,
          }}
          scroll={{ x: 1000 }}
        />
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        title={<span style={{ fontSize: '20px', fontWeight: 'bold' }}>{editingProgram ? 'Edit Program' : 'Create Program'}</span>}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={1000}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            is_active: true
          }}
        >
          <Form.Item
            name="title"
            label={<span style={{ fontSize: '16px', fontWeight: 600 }}>Program Title</span>}
            rules={[{ required: true, message: 'Please enter program title' }]}
          >
            <Input placeholder="Enter program title" size="large" style={{ fontSize: '16px', minHeight: '40px' }} />
          </Form.Item>

          <Form.Item
            name="program_type"
            label={<span style={{ fontSize: '16px', fontWeight: 600 }}>Program Type</span>}
            rules={[{ required: true, message: 'Please select program type' }]}
          >
            <Select placeholder="Select program type" size="large" style={{ fontSize: '16px', minHeight: '40px' }}>
              <Option value="SESSION">Parliament Session</Option>
              <Option value="COMMITTEE">Committee Meeting</Option>
              <Option value="WORKSHOP">Workshop/Training</Option>
              <Option value="OUTREACH">Outreach Program</Option>
              <Option value="CONFERENCE">Conference</Option>
              <Option value="CEREMONY">Official Ceremony</Option>
              <Option value="INSPECTION">Site Inspection</Option>
              <Option value="CAMPAIGN">Political Campaign</Option>
              <Option value="NATIONAL_EVENT">National Event</Option>
              <Option value="CONSTITUENCY">Constituency Visit</Option>
              <Option value="DEBATE">Parliamentary Debate</Option>
              <Option value="BUDGET_SESSION">Budget Session</Option>
              <Option value="POLICY_MEETING">Policy Meeting</Option>
              <Option value="PUBLIC_HEARING">Public Hearing</Option>
              <Option value="DIPLOMATIC">Diplomatic Event</Option>
              <Option value="OTHER">Other Event</Option>
            </Select>
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="scheduled_date"
                label={<span style={{ fontSize: '16px', fontWeight: 600 }}>Start Date & Time</span>}
                rules={[{ required: true, message: 'Please select start date' }]}
              >
                <DatePicker
                  showTime
                  format="YYYY-MM-DD HH:mm"
                  style={{ width: '100%', fontSize: '16px', minHeight: '40px' }}
                  size="large"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="end_date"
                label={<span style={{ fontSize: '16px', fontWeight: 600 }}>End Date & Time (Optional)</span>}
              >
                <DatePicker
                  showTime
                  format="YYYY-MM-DD HH:mm"
                  style={{ width: '100%', fontSize: '16px', minHeight: '40px' }}
                  size="large"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="location"
            label={<span style={{ fontSize: '16px', fontWeight: 600 }}>Location</span>}
          >
            <Input placeholder="Enter program location" size="large" style={{ fontSize: '16px', minHeight: '40px' }} />
          </Form.Item>

          <Form.Item
            name="description"
            label={<span style={{ fontSize: '16px', fontWeight: 600 }}>Description</span>}
          >
            <TextArea
              rows={3}
              placeholder="Enter program description"
              style={{ fontSize: '16px' }}
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="organizer"
                label="Organizer"
              >
                <Select 
                  placeholder="Select organizer"
                  allowClear
                >
                  {organizers.map(organizer => (
                    <Option key={organizer.id} value={organizer.id}>
                      {organizer.first_name} {organizer.last_name} ({organizer.role})
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="sub_center"
                label="Sub Center"
              >
                <Select 
                  placeholder="Select sub center"
                  allowClear
                >
                  {subCenters.map(subCenter => (
                    <Option key={subCenter.id} value={subCenter.id}>
                      {subCenter.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="expected_participants"
            label="Expected Participants"
            rules={[{ required: true, message: 'Please enter expected participants' }]}
          >
            <Input type="number" min={0} max={10000} placeholder="Enter expected number of participants" />
          </Form.Item>

          <Form.Item
            name="fuel_allocation_approved"
            label="Fuel Allocation Approved"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            name="is_active"
            label="Active"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item className="mb-0">
            <Space className="w-full justify-end">
              <Button onClick={() => {
                setModalVisible(false);
                form.resetFields();
              }}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit" loading={tableLoading}>
                {editingProgram ? 'Update' : 'Create'} Program
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Detail View Modal */}
      <Modal
        title="Program Details"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            Close
          </Button>,
          <Button 
            key="edit" 
            type="primary" 
            onClick={() => {
              setDetailModalVisible(false);
              if (viewingProgram) handleEdit(viewingProgram);
            }}
          >
            Edit Program
          </Button>
        ]}
        width={700}
      >
        {viewingProgram && (
          <Descriptions bordered column={2}>
            <Descriptions.Item label="Title" span={2}>
              {viewingProgram.title}
            </Descriptions.Item>
            <Descriptions.Item label="Type">
              <Tag color={getProgramTypeColor(viewingProgram.program_type)}>
                {viewingProgram.program_type?.replace('_', ' ')}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              {getProgramStatus(viewingProgram)}
            </Descriptions.Item>
            <Descriptions.Item label="Start Date">
              {dayjs(viewingProgram.scheduled_date).format('MMMM DD, YYYY HH:mm')}
            </Descriptions.Item>
            <Descriptions.Item label="End Date">
              {viewingProgram.end_date 
                ? dayjs(viewingProgram.end_date).format('MMMM DD, YYYY HH:mm')
                : 'Not specified'
              }
            </Descriptions.Item>
            <Descriptions.Item label="Location" span={2}>
              <EnvironmentOutlined /> {viewingProgram.location || 'Not specified'}
            </Descriptions.Item>
            {viewingProgram.description && (
              <Descriptions.Item label="Description" span={2}>
                {viewingProgram.description}
              </Descriptions.Item>
            )}
            <Descriptions.Item label="Organizer">
              {viewingProgram.organizer_details ? (
                <div>
                  <UserOutlined /> {viewingProgram.organizer_details.first_name} {viewingProgram.organizer_details.last_name}
                  <br />
                  <Text type="secondary">{viewingProgram.organizer_details.role?.replace('_', ' ')}</Text>
                </div>
              ) : viewingProgram.organizer ? (
                <span>{String(viewingProgram.organizer)}</span>
              ) : (
                'No organizer assigned'
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Sub Center">
              {viewingProgram.sub_center_details ? (
                <Tag color="cyan">{viewingProgram.sub_center_details.name}</Tag>
              ) : viewingProgram.sub_center ? (
                <span>{String(viewingProgram.sub_center)}</span>
              ) : (
                'No sub center assigned'
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Duration">
              {viewingProgram.end_date 
                ? `${dayjs(viewingProgram.end_date).diff(dayjs(viewingProgram.scheduled_date), 'hours')} hours`
                : 'Not specified'
              }
            </Descriptions.Item>
            <Descriptions.Item label="Active">
              {viewingProgram.is_active ? (
                <Badge status="success" text="Active" />
              ) : (
                <Badge status="error" text="Inactive" />
              )}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default ProgramsPage;
