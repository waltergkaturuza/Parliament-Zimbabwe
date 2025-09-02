// src/pages/programs/ProgramList.tsx
import { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Input,
  Select,
  Tag,
  Modal,
  Form,
  DatePicker,
  message,
  Tooltip,
  Statistic,
  Row,
  Col,
  Typography,
  Badge,
  Dropdown,
  Popconfirm,
  Avatar,
  Progress
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  UserOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  ExportOutlined,
  FilterOutlined,
  MoreOutlined,
  TeamOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { motion } from 'framer-motion';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import type { ColumnsType } from 'antd/es/table';
import { Program } from '../../types/models'; // Import harmonized Program interface

// Extend dayjs with isBetween plugin
dayjs.extend(isBetween);

const { Title, Text } = Typography;
const { Search } = Input;
const { RangePicker } = DatePicker;

// Remove duplicate Program interface - using harmonized version from types/models

const ProgramList = () => {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  const [form] = Form.useForm();

  // Mock data for demonstration
  useEffect(() => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setPrograms([
        {
          id: '1',
          title: 'Parliamentary Orientation Workshop',
          program_type: 'WORKSHOP',
          scheduled_date: '2024-07-15T09:00:00Z',
          end_date: '2024-07-15T17:00:00Z',
          description: 'Comprehensive workshop on parliamentary procedures and fuel coupon allocation',
          location: 'Parliament Main Hall',
          organizer: {
            id: '1',
            username: 'john.doe',
            first_name: 'John',
            last_name: 'Doe'
          },
          is_active: true,
          sub_center: {
            id: '1',
            name: 'Central Harare'
          },
          attendees_count: 45,
          completion_percentage: 85,
          created: '2024-07-01T10:00:00Z',
          modified: '2024-07-10T14:30:00Z'
        },
        {
          id: '2',
          title: 'Constituency Visit Program',
          program_type: 'CONSTITUENCY',
          scheduled_date: '2024-07-20T08:00:00Z',
          end_date: '2024-07-20T16:00:00Z',
          description: 'MPs visiting their constituencies for community engagement',
          location: 'Various Constituencies',
          organizer: {
            id: '2',
            username: 'jane.smith',
            first_name: 'Jane',
            last_name: 'Smith'
          },
          is_active: true,
          sub_center: {
            id: '2',
            name: 'Chitungwiza'
          },
          attendees_count: 120,
          completion_percentage: 100,
          created: '2024-07-05T09:00:00Z',
          modified: '2024-07-18T11:15:00Z'
        },
        {
          id: '3',
          title: 'Parliamentary Committee Session',
          program_type: 'COMMITTEE',
          scheduled_date: '2024-07-25T14:00:00Z',
          end_date: '2024-07-25T16:00:00Z',
          description: 'Finance Committee session on fuel allocation budget review',
          location: 'Committee Room A',
          organizer: {
            id: '3',
            username: 'mike.wilson',
            first_name: 'Mike',
            last_name: 'Wilson'
          },
          is_active: true,
          attendees_count: 30,
          completion_percentage: 60,
          created: '2024-07-12T16:00:00Z',
          modified: '2024-07-22T10:45:00Z'
        }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const programTypeColors = {
    SESSION: '#1890ff',
    COMMITTEE: '#52c41a', 
    WORKSHOP: '#fa8c16',
    OUTREACH: '#eb2f96',
    CONFERENCE: '#722ed1',
    CEREMONY: '#f5222d',
    INSPECTION: '#faad14',
    CAMPAIGN: '#13c2c2',
    NATIONAL_EVENT: '#ff4d4f',
    CONSTITUENCY: '#1890ff',
    DEBATE: '#52c41a',
    BUDGET_SESSION: '#fa8c16',
    POLICY_MEETING: '#eb2f96',
    PUBLIC_HEARING: '#722ed1',
    DIPLOMATIC: '#f5222d',
    OTHER: '#8c8c8c'
  };

  const programTypeIcons = {
    SESSION: <TeamOutlined />,
    COMMITTEE: <UserOutlined />,
    WORKSHOP: <ExportOutlined />,
    OUTREACH: <CalendarOutlined />,
    CONFERENCE: <TeamOutlined />,
    CEREMONY: <CalendarOutlined />,
    INSPECTION: <ExportOutlined />,
    CAMPAIGN: <UserOutlined />,
    NATIONAL_EVENT: <TeamOutlined />,
    CONSTITUENCY: <CalendarOutlined />,
    DEBATE: <UserOutlined />,
    BUDGET_SESSION: <ExportOutlined />,
    POLICY_MEETING: <TeamOutlined />,
    PUBLIC_HEARING: <CalendarOutlined />,
    DIPLOMATIC: <UserOutlined />,
    OTHER: <ExportOutlined />
  };

  const getStatusTag = (program: Program) => {
    // Use computed status fields from enhanced serializer
    if (!program.is_active) {
      return <Tag color="red">Inactive</Tag>;
    }
    
    // Use computed status fields instead of manual date calculations
    if (program.is_upcoming) {
      return <Tag color="blue">Upcoming</Tag>;
    } else if (program.is_ongoing) {
      return <Tag color="orange">In Progress</Tag>;
    } else if (program.is_completed) {
      return <Tag color="green">Completed</Tag>;
    } else {
      return <Tag color="default">{program.status_display || 'Scheduled'}</Tag>;
    }
  };

  const columns: ColumnsType<Program> = [
    {
      title: 'Program Details',
      key: 'details',
      render: (_, record) => (
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Avatar 
              icon={programTypeIcons[record.program_type]} 
              style={{ backgroundColor: programTypeColors[record.program_type] }}
              size="small"
            />
            <Text strong>{record.title}</Text>
            {getStatusTag(record)}
          </div>
          <Text type="secondary" className="text-xs">
            {record.description.length > 60 
              ? `${record.description.substring(0, 60)}...`
              : record.description
            }
          </Text>
        </div>
      ),
      width: 300,
    },
    {
      title: 'Type',
      dataIndex: 'program_type',
      key: 'program_type',
      render: (type: string) => (
        <Tag 
          color={programTypeColors[type as keyof typeof programTypeColors]}
          icon={programTypeIcons[type as keyof typeof programTypeIcons]}
        >
          {(type || '').replace('_', ' ')}
        </Tag>
      ),
      filters: [
        { text: 'Parliament Session', value: 'SESSION' },
        { text: 'Committee Meeting', value: 'COMMITTEE' },
        { text: 'Workshop/Training', value: 'WORKSHOP' },
        { text: 'Outreach Program', value: 'OUTREACH' },
        { text: 'Conference', value: 'CONFERENCE' },
        { text: 'Official Ceremony', value: 'CEREMONY' },
        { text: 'Site Inspection', value: 'INSPECTION' },
        { text: 'Political Campaign', value: 'CAMPAIGN' },
        { text: 'National Event', value: 'NATIONAL_EVENT' },
        { text: 'Constituency Visit', value: 'CONSTITUENCY' },
        { text: 'Parliamentary Debate', value: 'DEBATE' },
        { text: 'Budget Session', value: 'BUDGET_SESSION' },
        { text: 'Policy Meeting', value: 'POLICY_MEETING' },
        { text: 'Public Hearing', value: 'PUBLIC_HEARING' },
        { text: 'Diplomatic Event', value: 'DIPLOMATIC' },
        { text: 'Other Event', value: 'OTHER' },
      ],
      width: 130,
    },
    {
      title: 'Schedule',
      key: 'schedule',
      render: (_, record) => (
        <div>
          <div className="flex items-center gap-1 mb-1">
            <CalendarOutlined className="text-gray-500" />
            <Text>{dayjs(record.scheduled_date).format('MMM DD, YYYY')}</Text>
          </div>
          <div className="flex items-center gap-1">
            <ClockCircleOutlined className="text-gray-500" />
            <Text type="secondary" className="text-xs">
              {dayjs(record.scheduled_date).format('HH:mm')}
              {record.end_date && ` - ${dayjs(record.end_date).format('HH:mm')}`}
            </Text>
          </div>
        </div>
      ),
      sorter: (a, b) => dayjs(a.scheduled_date).unix() - dayjs(b.scheduled_date).unix(),
      width: 160,
    },
    {
      title: 'Location & Organizer',
      key: 'location',
      render: (_, record) => (
        <div>
          <div className="flex items-center gap-1 mb-1">
            <EnvironmentOutlined className="text-gray-500" />
            <Text className="text-sm">{record.location}</Text>
          </div>
          <div className="flex items-center gap-1">
            <UserOutlined className="text-gray-500" />
            <Text type="secondary" className="text-xs">
              {record.organizer_name || (record.organizer_details ? 
                `${record.organizer_details.first_name} ${record.organizer_details.last_name}` : 
                'No organizer')}
            </Text>
          </div>
          {(record.sub_center_name || record.sub_center_details) && (
            <Badge 
              count={record.sub_center_name || record.sub_center_details?.name} 
              style={{ backgroundColor: '#f0f0f0', color: '#666', fontSize: '10px' }}
              className="mt-1"
            />
          )}
        </div>
      ),
      width: 200,
    },
    {
      title: 'Progress',
      key: 'progress',
      render: (_, record) => (
        <div className="text-center">
          <Progress
            type="circle"
            size={50}
            percent={record.completion_percentage || 0}
            strokeColor={{
              '0%': '#108ee9',
              '100%': '#87d068',
            }}
          />
          <div className="text-xs text-gray-500 mt-1">
            {record.attendees_count || 0} attendees
          </div>
        </div>
      ),
      width: 100,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Dropdown
          menu={{
            items: [
              {
                key: 'view',
                icon: <EyeOutlined />,
                label: 'View Details',
                onClick: () => handleView(record),
              },
              {
                key: 'edit',
                icon: <EditOutlined />,
                label: 'Edit Program',
                onClick: () => handleEdit(record),
              },
              {
                type: 'divider',
              },
              {
                key: 'delete',
                icon: <DeleteOutlined />,
                label: 'Delete',
                danger: true,
                onClick: () => handleDelete(record.id),
              },
            ],
          }}
          trigger={['click']}
        >
          <Button icon={<MoreOutlined />} size="small" />
        </Dropdown>
      ),
      width: 70,
    },
  ];

  const handleView = (program: Program) => {
    // Implement view logic
    message.info(`Viewing details for: ${program.title}`);
  };

  const handleEdit = (program: Program) => {
    setEditingProgram(program);
    form.setFieldsValue({
      ...program,
      scheduled_date: dayjs(program.scheduled_date),
      end_date: program.end_date ? dayjs(program.end_date) : null,
    });
    setIsModalVisible(true);
  };

  const handleDelete = (id: number) => {
    Modal.confirm({
      title: 'Are you sure you want to delete this program?',
      content: 'This action cannot be undone.',
      okText: 'Yes, Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk() {
        setPrograms(programs.filter(p => p.id !== id));
        message.success('Program deleted successfully');
      },
    });
  };

  const handleModalOk = () => {
    form.validateFields().then((values) => {
      const programData = {
        ...values,
        scheduled_date: values.scheduled_date.toISOString(),
        end_date: values.end_date?.toISOString(),
      };
      
      if (editingProgram) {
        // Update existing program
        setPrograms(programs.map(p => 
          p.id === editingProgram.id ? { ...p, ...programData } : p
        ));
        message.success('Program updated successfully');
      } else {
        // Create new program
        const newProgram: Program = {
          id: Date.now().toString(),
          ...programData,
          organizer: {
            id: '1',
            username: 'current.user',
            first_name: 'Current',
            last_name: 'User'
          },
          is_active: true,
          attendees_count: 0,
          completion_percentage: 0,
          created: new Date().toISOString(),
          modified: new Date().toISOString(),
        };
        setPrograms([newProgram, ...programs]);
        message.success('Program created successfully');
      }
      
      setIsModalVisible(false);
      setEditingProgram(null);
      form.resetFields();
    });
  };

  const filteredPrograms = programs.filter(program => {
    const matchesSearch = program.title.toLowerCase().includes(searchText.toLowerCase()) ||
                         (program.description?.toLowerCase().includes(searchText.toLowerCase()) ?? false) ||
                         program.location.toLowerCase().includes(searchText.toLowerCase());
    
    const matchesType = !selectedType || program.program_type === selectedType;
    
    let matchesStatus = true;
    if (selectedStatus) {
      // Use computed status fields instead of manual date calculations
      switch (selectedStatus) {
        case 'upcoming':
          matchesStatus = program.is_upcoming && program.is_active;
          break;
        case 'active':
          matchesStatus = program.is_ongoing && program.is_active;
          break;
        case 'completed':
          matchesStatus = program.is_completed && program.is_active;
          break;
        case 'inactive':
          matchesStatus = !program.is_active;
          break;
      }
    }
    
    let matchesDate = true;
    if (dateRange) {
      const programDate = dayjs(program.scheduled_date);
      matchesDate = programDate.isBetween(dateRange[0], dateRange[1], 'day', '[]');
    }
    
    return matchesSearch && matchesType && matchesStatus && matchesDate;
  });

  const stats = {
    total: programs.length,
    upcoming: programs.filter(p => p.is_upcoming && p.is_active).length,
    active: programs.filter(p => p.is_ongoing && p.is_active).length,
    completed: programs.filter(p => p.is_completed && p.is_active).length,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="p-6"
    >
      <div className="mb-6">
        <Title level={2} className="mb-2">Program Management</Title>
        <Text type="secondary">
          Manage training programs, distribution events, and community meetings
        </Text>
      </div>

      {/* Statistics Cards */}
      <Row gutter={16} className="mb-6">
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Total Programs"
              value={stats.total}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Upcoming"
              value={stats.upcoming}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="In Progress"
              value={stats.active}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Completed"
              value={stats.completed}
              prefix={<ExportOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters and Actions */}
      <Card className="mb-4">
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={8} md={6}>
            <Search
              placeholder="Search programs..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={24} sm={8} md={4}>
            <Select
              placeholder="Program Type"
              value={selectedType}
              onChange={setSelectedType}
              allowClear
              style={{ width: '100%' }}
            >
              <Select.Option value="SESSION">Parliament Session</Select.Option>
              <Select.Option value="COMMITTEE">Committee Meeting</Select.Option>
              <Select.Option value="WORKSHOP">Workshop/Training</Select.Option>
              <Select.Option value="OUTREACH">Outreach Program</Select.Option>
              <Select.Option value="CONFERENCE">Conference</Select.Option>
              <Select.Option value="CEREMONY">Official Ceremony</Select.Option>
              <Select.Option value="INSPECTION">Site Inspection</Select.Option>
              <Select.Option value="CAMPAIGN">Political Campaign</Select.Option>
              <Select.Option value="NATIONAL_EVENT">National Event</Select.Option>
              <Select.Option value="CONSTITUENCY">Constituency Visit</Select.Option>
              <Select.Option value="DEBATE">Parliamentary Debate</Select.Option>
              <Select.Option value="BUDGET_SESSION">Budget Session</Select.Option>
              <Select.Option value="POLICY_MEETING">Policy Meeting</Select.Option>
              <Select.Option value="PUBLIC_HEARING">Public Hearing</Select.Option>
              <Select.Option value="DIPLOMATIC">Diplomatic Event</Select.Option>
              <Select.Option value="OTHER">Other Event</Select.Option>
            </Select>
          </Col>
          <Col xs={24} sm={8} md={4}>
            <Select
              placeholder="Status"
              value={selectedStatus}
              onChange={setSelectedStatus}
              allowClear
              style={{ width: '100%' }}
            >
              <Select.Option value="upcoming">Upcoming</Select.Option>
              <Select.Option value="active">In Progress</Select.Option>
              <Select.Option value="completed">Completed</Select.Option>
              <Select.Option value="inactive">Inactive</Select.Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <RangePicker
              value={dateRange}
              onChange={(dates) => setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)}
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  setEditingProgram(null);
                  form.resetFields();
                  setIsModalVisible(true);
                }}
              >
                New Program
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Programs Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={filteredPrograms}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} of ${total} programs`,
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        title={editingProgram ? 'Edit Program' : 'Create New Program'}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={() => {
          setIsModalVisible(false);
          setEditingProgram(null);
          form.resetFields();
        }}
        width={600}
        okText={editingProgram ? 'Update' : 'Create'}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            program_type: 'DISTRIBUTION',
            is_active: true,
          }}
        >
          <Form.Item
            label="Program Title"
            name="title"
            rules={[{ required: true, message: 'Please enter program title' }]}
          >
            <Input placeholder="Enter program title" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Program Type"
                name="program_type"
                rules={[{ required: true, message: 'Please select program type' }]}
              >
                <Select>
                  <Select.Option value="SESSION">Parliament Session</Select.Option>
                  <Select.Option value="COMMITTEE">Committee Meeting</Select.Option>
                  <Select.Option value="WORKSHOP">Workshop/Training</Select.Option>
                  <Select.Option value="OUTREACH">Outreach Program</Select.Option>
                  <Select.Option value="CONFERENCE">Conference</Select.Option>
                  <Select.Option value="CEREMONY">Official Ceremony</Select.Option>
                  <Select.Option value="INSPECTION">Site Inspection</Select.Option>
                  <Select.Option value="CAMPAIGN">Political Campaign</Select.Option>
                  <Select.Option value="NATIONAL_EVENT">National Event</Select.Option>
                  <Select.Option value="CONSTITUENCY">Constituency Visit</Select.Option>
                  <Select.Option value="DEBATE">Parliamentary Debate</Select.Option>
                  <Select.Option value="BUDGET_SESSION">Budget Session</Select.Option>
                  <Select.Option value="POLICY_MEETING">Policy Meeting</Select.Option>
                  <Select.Option value="PUBLIC_HEARING">Public Hearing</Select.Option>
                  <Select.Option value="DIPLOMATIC">Diplomatic Event</Select.Option>
                  <Select.Option value="OTHER">Other Event</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Location"
                name="location"
                rules={[{ required: true, message: 'Please enter location' }]}
              >
                <Input placeholder="Enter location" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Start Date & Time"
                name="scheduled_date"
                rules={[{ required: true, message: 'Please select start date' }]}
              >
                <DatePicker
                  showTime
                  style={{ width: '100%' }}
                  format="YYYY-MM-DD HH:mm"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="End Date & Time"
                name="end_date"
              >
                <DatePicker
                  showTime
                  style={{ width: '100%' }}
                  format="YYYY-MM-DD HH:mm"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Description"
            name="description"
            rules={[{ required: true, message: 'Please enter description' }]}
          >
            <Input.TextArea
              rows={4}
              placeholder="Enter program description"
            />
          </Form.Item>
        </Form>
      </Modal>
    </motion.div>
  );
};

export default ProgramList;
