import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Badge,
  Typography,
  Space,
  Input,
  Select,
  DatePicker,
  Row,
  Col,
  Tag,
  Tooltip,
  Progress,
  message,
  Modal,
  Descriptions,
  Alert,
  Spin
} from 'antd';
import {
  SearchOutlined,
  FilterOutlined,
  EyeOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined,
  CalendarOutlined,
  TeamOutlined,
  FileTextOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

interface AttendanceRegistry {
  id: number;
  title: string;
  attendance_date: string;
  status: string;
  session_details?: {
    id: number;
    title: string;
    session_type: string;
    venue: string;
    start_time: string;
    end_time: string;
    session_number: number;
  };
  program_details?: {
    id: number;
    title: string;
    program_type: string;
    description: string;
  };
  managing_subcenter_name: string;
  total_expected: number;
  total_marked: number;
  completion_percentage: number;
  published_date: string;
  submitted_date?: string;
  notes?: string;
  created_by_name: string;
}

const AttendanceRegistryList: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [registries, setRegistries] = useState<AttendanceRegistry[]>([]);
  const [selectedRegistry, setSelectedRegistry] = useState<AttendanceRegistry | null>(null);
  const [detailsVisible, setDetailsVisible] = useState(false);
  
  // Filters
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [subcenterFilter, setSubcenterFilter] = useState<string>('');

  useEffect(() => {
    fetchRegistries();
  }, []);

  const fetchRegistries = async () => {
    try {
      setLoading(true);
  const response = await api.get('/attendance-registries/', {
        params: {
          search: searchText,
          status: statusFilter,
          start_date: dateRange?.[0]?.format('YYYY-MM-DD'),
          end_date: dateRange?.[1]?.format('YYYY-MM-DD'),
          managing_subcenter: subcenterFilter,
        }
      });
      setRegistries(response.data.results || response.data);
    } catch (err: any) {
      console.error('Error fetching registries:', err);
      message.error('Failed to load attendance registries');
    } finally {
      setLoading(false);
    }
  };

  const handleStartMarking = async (registryId: number) => {
    try {
  await api.post(`/attendance-registries/${registryId}/start_marking/`);
      message.success('Attendance marking started');
      fetchRegistries(); // Refresh data
      navigate(`/sergeant-of-arms/attendance/${registryId}`);
    } catch (err: any) {
      console.error('Error starting attendance marking:', err);
      message.error(err.response?.data?.error || 'Failed to start marking');
    }
  };

  const handleViewDetails = (registry: AttendanceRegistry) => {
    setSelectedRegistry(registry);
    setDetailsVisible(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return 'blue';
      case 'IN_PROGRESS':
        return 'orange';
      case 'SUBMITTED':
        return 'green';
      case 'APPROVED':
        return 'green';
      default:
        return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return 'Ready to Mark';
      case 'IN_PROGRESS':
        return 'Marking in Progress';
      case 'SUBMITTED':
        return 'Submitted for Review';
      case 'APPROVED':
        return 'Approved';
      default:
        return status;
    }
  };

  const columns = [
    {
      title: 'Session/Program',
      key: 'title',
      render: (record: AttendanceRegistry) => (
        <Space direction="vertical" size="small">
          <Text strong>{record.title}</Text>
          {record.session_details && (
            <div>
              <Tag color="blue">
                <CalendarOutlined /> Session {record.session_details.session_number}
              </Tag>
              <Text type="secondary" style={{ fontSize: '12px', display: 'block' }}>
                {record.session_details.session_type} - {record.session_details.venue}
              </Text>
            </div>
          )}
          {record.program_details && (
            <div>
              <Tag color="purple">
                <FileTextOutlined /> {record.program_details.program_type}
              </Tag>
            </div>
          )}
        </Space>
      ),
    },
    {
      title: 'Date',
      dataIndex: 'attendance_date',
      key: 'attendance_date',
      render: (date: string) => (
        <Space direction="vertical" size="small">
          <Text>{dayjs(date).format('MMM DD, YYYY')}</Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {dayjs(date).format('dddd')}
          </Text>
        </Space>
      ),
      sorter: (a: AttendanceRegistry, b: AttendanceRegistry) => 
        dayjs(a.attendance_date).unix() - dayjs(b.attendance_date).unix(),
    },
    {
      title: 'Sub-Center',
      dataIndex: 'managing_subcenter_name',
      key: 'managing_subcenter_name',
      filters: [...new Set(registries.map(r => r.managing_subcenter_name))].map(name => ({
        text: name,
        value: name,
      })),
      onFilter: (value: any, record: AttendanceRegistry) => 
        record.managing_subcenter_name === value,
    },
    {
      title: 'Expected Members',
      dataIndex: 'total_expected',
      key: 'total_expected',
      render: (count: number) => (
        <Badge count={count} style={{ backgroundColor: '#1890ff' }} />
      ),
      sorter: (a: AttendanceRegistry, b: AttendanceRegistry) => 
        a.total_expected - b.total_expected,
    },
    {
      title: 'Progress',
      key: 'progress',
      render: (record: AttendanceRegistry) => {
        const percentage = record.completion_percentage || 0;
        return (
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <Progress percent={percentage} size="small" strokeColor={
              percentage === 100 ? '#52c41a' : percentage > 50 ? '#1890ff' : '#faad14'
            } />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.total_marked}/{record.total_expected} marked
            </Text>
          </Space>
        );
      },
      sorter: (a: AttendanceRegistry, b: AttendanceRegistry) => 
        (a.completion_percentage || 0) - (b.completion_percentage || 0),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>
          {getStatusText(status)}
        </Tag>
      ),
      filters: [
        { text: 'Ready to Mark', value: 'PUBLISHED' },
        { text: 'In Progress', value: 'IN_PROGRESS' },
        { text: 'Submitted', value: 'SUBMITTED' },
        { text: 'Approved', value: 'APPROVED' },
      ],
      onFilter: (value: any, record: AttendanceRegistry) => 
        record.status === value,
    },
    {
      title: 'Created By',
      dataIndex: 'created_by_name',
      key: 'created_by_name',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: AttendanceRegistry) => (
        <Space>
          <Tooltip title="View Details">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => handleViewDetails(record)}
            />
          </Tooltip>
          
          {record.status === 'PUBLISHED' && (
            <Button
              type="primary"
              size="small"
              icon={<PlayCircleOutlined />}
              onClick={() => handleStartMarking(record.id)}
            >
              Start
            </Button>
          )}
          
          {record.status === 'IN_PROGRESS' && (
            <Button
              type="default"
              size="small"
              onClick={() => navigate(`/sergeant-of-arms/attendance/${record.id}`)}
            >
              Continue
            </Button>
          )}
          
          {(record.status === 'SUBMITTED' || record.status === 'APPROVED') && (
            <Button
              type="link"
              size="small"
              onClick={() => navigate(`/sergeant-of-arms/attendance/${record.id}`)}
            >
              View
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>
          <TeamOutlined style={{ marginRight: '8px' }} />
          Attendance Registries
        </Title>
        <Text type="secondary">
          Manage attendance marking for all parliamentary sessions and programs
        </Text>
      </div>

      {/* Filters */}
      <Card style={{ marginBottom: '24px' }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Input
              placeholder="Search sessions/programs..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onPressEnter={fetchRegistries}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="Filter by status"
              value={statusFilter}
              onChange={setStatusFilter}
              allowClear
              style={{ width: '100%' }}
            >
              <Option value="PUBLISHED">Ready to Mark</Option>
              <Option value="IN_PROGRESS">In Progress</Option>
              <Option value="SUBMITTED">Submitted</Option>
              <Option value="APPROVED">Approved</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <RangePicker
              value={dateRange}
              onChange={(dates) => setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)}
              style={{ width: '100%' }}
              placeholder={['Start Date', 'End Date']}
            />
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Space>
              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={fetchRegistries}
              >
                Search
              </Button>
              <Button
                icon={<FilterOutlined />}
                onClick={() => {
                  setSearchText('');
                  setStatusFilter('');
                  setDateRange(null);
                  setSubcenterFilter('');
                  fetchRegistries();
                }}
              >
                Clear
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Summary Stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={12} sm={6}>
          <Card size="small">
            <div style={{ textAlign: 'center' }}>
              <Text type="secondary">Total</Text>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1890ff' }}>
                {registries.length}
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <div style={{ textAlign: 'center' }}>
              <Text type="secondary">Pending</Text>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#faad14' }}>
                {registries.filter(r => r.status === 'PUBLISHED').length}
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <div style={{ textAlign: 'center' }}>
              <Text type="secondary">In Progress</Text>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ff7a45' }}>
                {registries.filter(r => r.status === 'IN_PROGRESS').length}
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <div style={{ textAlign: 'center' }}>
              <Text type="secondary">Completed</Text>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a' }}>
                {registries.filter(r => ['SUBMITTED', 'APPROVED'].includes(r.status)).length}
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Main Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={registries}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} of ${total} registries`,
          }}
          scroll={{ x: 1200 }}
          rowClassName={(record) => {
            if (record.status === 'PUBLISHED') return 'registry-pending';
            if (record.status === 'IN_PROGRESS') return 'registry-in-progress';
            return '';
          }}
        />
      </Card>

      {/* Details Modal */}
      <Modal
        title="Registry Details"
        open={detailsVisible}
        onCancel={() => setDetailsVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailsVisible(false)}>
            Close
          </Button>,
          selectedRegistry?.status === 'PUBLISHED' && (
            <Button
              key="start"
              type="primary"
              icon={<PlayCircleOutlined />}
              onClick={() => {
                setDetailsVisible(false);
                handleStartMarking(selectedRegistry.id);
              }}
            >
              Start Marking
            </Button>
          ),
          (selectedRegistry?.status === 'IN_PROGRESS' || 
           selectedRegistry?.status === 'SUBMITTED' || 
           selectedRegistry?.status === 'APPROVED') && (
            <Button
              key="view"
              type="primary"
              onClick={() => {
                setDetailsVisible(false);
                navigate(`/sergeant-of-arms/attendance/${selectedRegistry.id}`);
              }}
            >
              View Attendance
            </Button>
          ),
        ].filter(Boolean)}
        width={800}
      >
        {selectedRegistry && (
          <Descriptions column={2} bordered>
            <Descriptions.Item label="Title" span={2}>
              {selectedRegistry.title}
            </Descriptions.Item>
            
            {selectedRegistry.session_details && (
              <>
                <Descriptions.Item label="Session Type">
                  {selectedRegistry.session_details.session_type}
                </Descriptions.Item>
                <Descriptions.Item label="Session Number">
                  {selectedRegistry.session_details.session_number}
                </Descriptions.Item>
                <Descriptions.Item label="Venue">
                  {selectedRegistry.session_details.venue}
                </Descriptions.Item>
                <Descriptions.Item label="Time">
                  {dayjs(selectedRegistry.session_details.start_time).format('HH:mm')} - 
                  {dayjs(selectedRegistry.session_details.end_time).format('HH:mm')}
                </Descriptions.Item>
              </>
            )}
            
            {selectedRegistry.program_details && (
              <>
                <Descriptions.Item label="Program Type">
                  {selectedRegistry.program_details.program_type}
                </Descriptions.Item>
                <Descriptions.Item label="Description" span={2}>
                  {selectedRegistry.program_details.description}
                </Descriptions.Item>
              </>
            )}
            
            <Descriptions.Item label="Attendance Date">
              {dayjs(selectedRegistry.attendance_date).format('MMMM DD, YYYY')}
            </Descriptions.Item>
            <Descriptions.Item label="Sub-Center">
              {selectedRegistry.managing_subcenter_name}
            </Descriptions.Item>
            
            <Descriptions.Item label="Expected Members">
              {selectedRegistry.total_expected}
            </Descriptions.Item>
            <Descriptions.Item label="Marked Members">
              {selectedRegistry.total_marked}
            </Descriptions.Item>
            
            <Descriptions.Item label="Completion">
              <Progress 
                percent={selectedRegistry.completion_percentage || 0} 
                size="small"
                strokeColor={
                  (selectedRegistry.completion_percentage || 0) === 100 ? '#52c41a' : '#1890ff'
                }
              />
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={getStatusColor(selectedRegistry.status)}>
                {getStatusText(selectedRegistry.status)}
              </Tag>
            </Descriptions.Item>
            
            <Descriptions.Item label="Published Date">
              {dayjs(selectedRegistry.published_date).format('MMM DD, YYYY HH:mm')}
            </Descriptions.Item>
            {selectedRegistry.submitted_date && (
              <Descriptions.Item label="Submitted Date">
                {dayjs(selectedRegistry.submitted_date).format('MMM DD, YYYY HH:mm')}
              </Descriptions.Item>
            )}
            
            <Descriptions.Item label="Created By">
              {selectedRegistry.created_by_name}
            </Descriptions.Item>
            
            {selectedRegistry.notes && (
              <Descriptions.Item label="Notes" span={2}>
                {selectedRegistry.notes}
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>

      <style>{`
        .registry-pending {
          background-color: #e6f7ff;
        }
        .registry-in-progress {
          background-color: #fff7e6;
        }
      `}</style>
    </div>
  );
};

export default AttendanceRegistryList;
