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

// Extend dayjs with isBetween plugin
dayjs.extend(isBetween);

const { Title, Text } = Typography;
const { Search } = Input;
const { RangePicker } = DatePicker;

interface Program {
  id: string;
  title: string;
  program_type: 'TRAINING' | 'DISTRIBUTION' | 'MEETING' | 'ACTIVITY';
  scheduled_date: string;
  end_date?: string;
  description: string;
  location: string;
  organizer: {
    id: string;
    username: string;
    first_name: string;
    last_name: string;
  };
  is_active: boolean;
  sub_center?: {
    id: string;
    name: string;
  };
  attendees_count?: number;
  completion_percentage?: number;
  created: string;
  modified: string;
}

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
          title: 'Parliamentary Orientation Training',
          program_type: 'TRAINING',
          scheduled_date: '2024-07-15T09:00:00Z',
          end_date: '2024-07-15T17:00:00Z',
          description: 'Comprehensive training on parliamentary procedures and fuel coupon allocation',
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
          title: 'Monthly Coupon Distribution',
          program_type: 'DISTRIBUTION',
          scheduled_date: '2024-07-20T08:00:00Z',
          end_date: '2024-07-20T16:00:00Z',
          description: 'Monthly distribution of fuel coupons to registered beneficiaries',
          location: 'Sub-Center Office',
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
          title: 'Community Feedback Meeting',
          program_type: 'MEETING',
          scheduled_date: '2024-07-25T14:00:00Z',
          end_date: '2024-07-25T16:00:00Z',
          description: 'Gathering feedback from community on fuel coupon program effectiveness',
          location: 'Community Center',
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
    TRAINING: '#1890ff',
    DISTRIBUTION: '#52c41a',
    MEETING: '#faad14',
    ACTIVITY: '#722ed1'
  };

  const programTypeIcons = {
    TRAINING: <TeamOutlined />,
    DISTRIBUTION: <ExportOutlined />,
    MEETING: <UserOutlined />,
    ACTIVITY: <CalendarOutlined />
  };

  const getStatusTag = (program: Program) => {
    const now = dayjs();
    const scheduledDate = dayjs(program.scheduled_date);
    const endDate = program.end_date ? dayjs(program.end_date) : scheduledDate;

    if (!program.is_active) {
      return <Tag color="red">Inactive</Tag>;
    }
    
    if (now.isBefore(scheduledDate)) {
      return <Tag color="blue">Upcoming</Tag>;
    } else if (now.isBetween(scheduledDate, endDate)) {
      return <Tag color="orange">In Progress</Tag>;
    } else {
      return <Tag color="green">Completed</Tag>;
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
          {type.replace('_', ' ')}
        </Tag>
      ),
      filters: [
        { text: 'Training', value: 'TRAINING' },
        { text: 'Distribution', value: 'DISTRIBUTION' },
        { text: 'Meeting', value: 'MEETING' },
        { text: 'Activity', value: 'ACTIVITY' },
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
              {record.organizer.first_name} {record.organizer.last_name}
            </Text>
          </div>
          {record.sub_center && (
            <Badge 
              count={record.sub_center.name} 
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

  const handleDelete = (id: string) => {
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
                         program.description.toLowerCase().includes(searchText.toLowerCase()) ||
                         program.location.toLowerCase().includes(searchText.toLowerCase());
    
    const matchesType = !selectedType || program.program_type === selectedType;
    
    let matchesStatus = true;
    if (selectedStatus) {
      const now = dayjs();
      const scheduledDate = dayjs(program.scheduled_date);
      const endDate = program.end_date ? dayjs(program.end_date) : scheduledDate;
      
      switch (selectedStatus) {
        case 'upcoming':
          matchesStatus = now.isBefore(scheduledDate) && program.is_active;
          break;
        case 'active':
          matchesStatus = now.isBetween(scheduledDate, endDate) && program.is_active;
          break;
        case 'completed':
          matchesStatus = now.isAfter(endDate) && program.is_active;
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
    upcoming: programs.filter(p => dayjs().isBefore(dayjs(p.scheduled_date)) && p.is_active).length,
    active: programs.filter(p => {
      const now = dayjs();
      const start = dayjs(p.scheduled_date);
      const end = p.end_date ? dayjs(p.end_date) : start;
      return now.isBetween(start, end) && p.is_active;
    }).length,
    completed: programs.filter(p => {
      const end = p.end_date ? dayjs(p.end_date) : dayjs(p.scheduled_date);
      return dayjs().isAfter(end) && p.is_active;
    }).length,
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
              <Select.Option value="TRAINING">Training</Select.Option>
              <Select.Option value="DISTRIBUTION">Distribution</Select.Option>
              <Select.Option value="MEETING">Meeting</Select.Option>
              <Select.Option value="ACTIVITY">Activity</Select.Option>
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
                  <Select.Option value="TRAINING">Training</Select.Option>
                  <Select.Option value="DISTRIBUTION">Distribution</Select.Option>
                  <Select.Option value="MEETING">Meeting</Select.Option>
                  <Select.Option value="ACTIVITY">Activity</Select.Option>
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
