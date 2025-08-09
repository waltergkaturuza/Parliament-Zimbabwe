// src/pages/parliament/ParliamentReports.tsx
import React, { useState, useEffect } from 'react';
import type { FC } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Typography,
  Row,
  Col,
  Statistic,
  Select,
  DatePicker,
  Spin,
  Badge,
  Tag,
  Tooltip,
  Progress,
  Alert,
  App
} from 'antd';
import {
  FileTextOutlined,
  DownloadOutlined,
  EyeOutlined,
  CalendarOutlined,
  TeamOutlined,
  CarOutlined,
  BarChartOutlined,
  PrinterOutlined,
  ExportOutlined
} from '@ant-design/icons';
import apiClient from '@/api/index';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

interface ReportData {
  id: string;
  title: string;
  type: 'session' | 'attendance' | 'fuel' | 'compliance';
  subcenter: string;
  period: string;
  generated_date: string;
  status: 'ready' | 'generating' | 'failed';
  file_size?: string;
  sessions_count?: number;
  attendance_rate?: number;
  fuel_allocated?: number;
}

const ParliamentReports: FC = () => {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<ReportData[]>([]);
  const [stats, setStats] = useState({
    totalReports: 0,
    recentReports: 0,
    totalSessions: 0,
    averageAttendance: 0,
    totalFuelAllocated: 0,
    activeSubcenters: 0
  });
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);

  useEffect(() => {
    loadReports();
    loadStats();
  }, [selectedType, selectedPeriod]);

  const loadReports = async () => {
    try {
      setLoading(true);
      
      // Fetch reports from backend
      const response = await apiClient.get('/parliament/reports/', {
        params: {
          type: selectedType !== 'all' ? selectedType : undefined
        }
      });
      
      const reportsData = response.data.results || response.data;
      
      if (Array.isArray(reportsData)) {
        const mappedReports = reportsData.map((item: any) => ({
          id: String(item.id),
          title: item.title || 'Parliament Report',
          type: item.report_type || 'session',
          subcenter: item.subcenter_name || 'Unknown SubCenter',
          period: item.period || 'Current Period',
          generated_date: item.created_at || new Date().toISOString(),
          status: item.status || 'ready',
          file_size: item.file_size || 'N/A',
          sessions_count: item.sessions_count || 0,
          attendance_rate: item.attendance_rate || 0,
          fuel_allocated: item.fuel_allocated || 0
        }));

        setReports(mappedReports);
      } else {
        console.warn('Expected array but got:', reportsData);
        setReports([]);
      }
    } catch (error) {
      console.error('Error loading reports:', error);
      message.error('Failed to load parliament reports');
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      // Mock statistics data
      setStats({
        totalReports: 45,
        recentReports: 12,
        totalSessions: 234,
        averageAttendance: 87.5,
        totalFuelAllocated: 156780,
        activeSubcenters: 8
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleDownload = async (reportId: string) => {
    try {
      message.success(`Downloading report ${reportId}...`);
      // In real implementation, this would download the actual file
    } catch (error) {
      message.error('Failed to download report');
    }
  };

  const handleGenerateReport = () => {
    message.info('Report generation feature will be implemented soon');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ready':
        return <Badge status="success" text="Ready" />;
      case 'generating':
        return <Badge status="processing" text="Generating..." />;
      case 'failed':
        return <Badge status="error" text="Failed" />;
      default:
        return <Badge status="default" text="Unknown" />;
    }
  };

  const getTypeTag = (type: string) => {
    const colors = {
      session: 'blue',
      attendance: 'green',
      fuel: 'orange',
      compliance: 'purple'
    };
    return <Tag color={colors[type as keyof typeof colors]}>{type.toUpperCase()}</Tag>;
  };

  const columns = [
    {
      title: 'Report',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: ReportData) => (
        <div>
          <Text strong>{text}</Text>
          <br />
          <Text type="secondary" className="text-xs">
            {getTypeTag(record.type)} {record.subcenter}
          </Text>
        </div>
      ),
    },
    {
      title: 'Period',
      dataIndex: 'period',
      key: 'period',
      render: (period: string) => (
        <span>
          <CalendarOutlined /> {period}
        </span>
      ),
    },
    {
      title: 'Sessions',
      dataIndex: 'sessions_count',
      key: 'sessions_count',
      align: 'center' as const,
      render: (count: number) => (
        <Statistic value={count} valueStyle={{ fontSize: '14px' }} />
      ),
    },
    {
      title: 'Attendance',
      dataIndex: 'attendance_rate',
      key: 'attendance_rate',
      align: 'center' as const,
      render: (rate: number) => (
        <Progress
          type="circle"
          size={40}
          percent={rate}
          format={(percent) => `${percent}%`}
        />
      ),
    },
    {
      title: 'Fuel (L)',
      dataIndex: 'fuel_allocated',
      key: 'fuel_allocated',
      align: 'center' as const,
      render: (litres: number) => (
        <Tag color="orange">
          <CarOutlined /> {litres?.toLocaleString()}L
        </Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      align: 'center' as const,
      render: (status: string) => getStatusBadge(status),
    },
    {
      title: 'Generated',
      dataIndex: 'generated_date',
      key: 'generated_date',
      render: (date: string) => (
        <div>
          <div>{dayjs(date).format('MMM DD, YYYY')}</div>
          <div className="text-xs text-gray-500">{dayjs(date).format('HH:mm')}</div>
        </div>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'center' as const,
      render: (_: any, record: ReportData) => (
        <Space size="small">
          <Tooltip title="View Report">
            <Button 
              type="text" 
              icon={<EyeOutlined />} 
              onClick={() => message.info('View report feature coming soon')}
              disabled={record.status !== 'ready'}
            />
          </Tooltip>
          <Tooltip title="Download">
            <Button 
              type="text" 
              icon={<DownloadOutlined />} 
              onClick={() => handleDownload(record.id)}
              disabled={record.status !== 'ready'}
            />
          </Tooltip>
          <Tooltip title="Print">
            <Button 
              type="text" 
              icon={<PrinterOutlined />} 
              onClick={() => message.info('Print feature coming soon')}
              disabled={record.status !== 'ready'}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <Title level={2}>
          <FileTextOutlined /> Parliament Reports
        </Title>
        <Text type="secondary">
          System-wide parliament session reports and analytics for oversight and compliance
        </Text>
      </div>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card>
            <Statistic
              title="Total Reports"
              value={stats.totalReports}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card>
            <Statistic
              title="Recent Reports"
              value={stats.recentReports}
              prefix={<CalendarOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card>
            <Statistic
              title="Total Sessions"
              value={stats.totalSessions}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card>
            <Statistic
              title="Avg Attendance"
              value={stats.averageAttendance}
              suffix="%"
              prefix={<BarChartOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card>
            <Statistic
              title="Fuel Allocated"
              value={stats.totalFuelAllocated}
              suffix="L"
              prefix={<CarOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card>
            <Statistic
              title="Active SubCenters"
              value={stats.activeSubcenters}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters and Actions */}
      <Card className="mb-6">
        <Row gutter={16} align="middle">
          <Col xs={24} sm={12} md={6}>
            <Select
              style={{ width: '100%' }}
              placeholder="Filter by type"
              value={selectedType}
              onChange={setSelectedType}
            >
              <Option value="all">All Reports</Option>
              <Option value="session">Session Reports</Option>
              <Option value="attendance">Attendance Reports</Option>
              <Option value="fuel">Fuel Reports</Option>
              <Option value="compliance">Compliance Reports</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <RangePicker
              style={{ width: '100%' }}
              value={selectedPeriod}
              onChange={(dates) => setSelectedPeriod(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)}
              placeholder={['Start Date', 'End Date']}
            />
          </Col>
          <Col xs={24} md={10}>
            <Space>
              <Button 
                type="primary" 
                icon={<ExportOutlined />}
                onClick={handleGenerateReport}
              >
                Generate New Report
              </Button>
              <Button icon={<DownloadOutlined />}>
                Export All
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Alert for MAIN_CENTER oversight role */}
      <Alert
        message="Parliament Oversight Dashboard"
        description="As a MAIN_CENTER officer, you have oversight access to monitor parliament operations across all subcenters. Use these reports for system-wide coordination and compliance monitoring."
        type="info"
        showIcon
        className="mb-6"
      />

      {/* Reports Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={reports}
          rowKey="id"
          loading={loading}
          pagination={{
            total: reports.length,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} of ${total} reports`,
          }}
        />
      </Card>
    </div>
  );
};

export default ParliamentReports;
