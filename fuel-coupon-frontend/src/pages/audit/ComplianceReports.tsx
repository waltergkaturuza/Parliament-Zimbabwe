// src/pages/audit/ComplianceReports.tsx
import { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  DatePicker,
  Select,
  Row,
  Col,
  Statistic,
  Progress,
  Alert,
  Typography,
  Spin,
  message,
} from 'antd';
import {
  FileTextOutlined,
  DownloadOutlined,
  EyeOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import apiClient from '../../api/apiClient';
import type { ComplianceReport } from '../../types';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const ComplianceReports: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [reports, setReports] = useState<ComplianceReport[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('month');
  const [complianceStats, setComplianceStats] = useState({
    totalChecks: 0,
    compliant: 0,
    nonCompliant: 0,
    pending: 0,
    complianceRate: 0,
  });

  useEffect(() => {
    fetchComplianceReports();
    fetchComplianceStats();
  }, [selectedPeriod]);

  const fetchComplianceReports = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get(`/audit/compliance-reports/?period=${selectedPeriod}`);
      setReports(response.data?.results || []);
    } catch (error) {
      console.error('Failed to fetch compliance reports:', error);
      message.error('Failed to load compliance reports');
    } finally {
      setLoading(false);
    }
  };

  const fetchComplianceStats = async () => {
    try {
      const response = await apiClient.get(`/audit/compliance-stats/?period=${selectedPeriod}`);
      setComplianceStats(response.data || {});
    } catch (error) {
      console.error('Failed to fetch compliance stats:', error);
    }
  };

  const generateReport = async (type: string) => {
    try {
      setLoading(true);
      const response = await apiClient.post('/api/v1/audit/generate-compliance-report/', {
        type,
        period: selectedPeriod,
      });
      message.success('Compliance report generated successfully');
      fetchComplianceReports();
    } catch (error) {
      console.error('Failed to generate report:', error);
      message.error('Failed to generate compliance report');
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = async (reportId: string) => {
    try {
      const response = await apiClient.get(`/audit/compliance-reports/${reportId}/download/`, {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `compliance-report-${reportId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download report:', error);
      message.error('Failed to download report');
    }
  };

  const getStatusTag = (status: string) => {
    const statusConfig = {
      compliant: { color: 'green', icon: <CheckCircleOutlined /> },
      non_compliant: { color: 'red', icon: <ExclamationCircleOutlined /> },
      pending: { color: 'orange', icon: <ClockCircleOutlined /> },
      warning: { color: 'gold', icon: <WarningOutlined /> },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || { color: 'default', icon: null };
    
    return (
      <Tag color={config.color} icon={config.icon}>
        {status.replace('_', ' ').toUpperCase()}
      </Tag>
    );
  };

  const columns = [
    {
      title: 'Report ID',
      dataIndex: 'id',
      key: 'id',
      width: 120,
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag color="blue">{type.replace('_', ' ').toUpperCase()}</Tag>
      ),
    },
    {
      title: 'Period',
      dataIndex: 'period',
      key: 'period',
      render: (period: string) => (
        <Text>{period}</Text>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getStatusTag(status),
    },
    {
      title: 'Compliance Score',
      dataIndex: 'compliance_score',
      key: 'compliance_score',
      render: (score: number) => (
        <Progress
          percent={score}
          size="small"
          status={score >= 80 ? 'success' : score >= 60 ? 'normal' : 'exception'}
        />
      ),
    },
    {
      title: 'Generated',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: ComplianceReport) => (
        <Space>
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => window.open(`/audit/compliance-reports/${record.id}`, '_blank')}
          >
            View
          </Button>
          <Button
            type="text"
            icon={<DownloadOutlined />}
            onClick={() => downloadReport(record.id)}
          >
            Download
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <Title level={2} className="mb-0">Compliance Reports</Title>
          <Text type="secondary">Monitor and manage compliance across all operations</Text>
        </div>
        <Space>
          <Select
            value={selectedPeriod}
            onChange={setSelectedPeriod}
            style={{ width: 120 }}
          >
            <Option value="week">This Week</Option>
            <Option value="month">This Month</Option>
            <Option value="quarter">This Quarter</Option>
            <Option value="year">This Year</Option>
          </Select>
          <Button
            type="primary"
            icon={<FileTextOutlined />}
            onClick={() => generateReport('comprehensive')}
            loading={loading}
          >
            Generate Report
          </Button>
        </Space>
      </div>

      {/* Compliance Statistics */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Checks"
              value={complianceStats.totalChecks}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Compliant"
              value={complianceStats.compliant}
              valueStyle={{ color: '#3f8600' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Non-Compliant"
              value={complianceStats.nonCompliant}
              valueStyle={{ color: '#cf1322' }}
              prefix={<ExclamationCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Compliance Rate"
              value={complianceStats.complianceRate}
              precision={1}
              suffix="%"
              valueStyle={{
                color: complianceStats.complianceRate >= 80 ? '#3f8600' : 
                       complianceStats.complianceRate >= 60 ? '#faad14' : '#cf1322'
              }}
            />
          </Card>
        </Col>
      </Row>

      {/* Compliance Alert */}
      {complianceStats.complianceRate < 70 && (
        <Alert
          message="Low Compliance Rate Detected"
          description="The current compliance rate is below the recommended threshold. Please review non-compliant items and take corrective action."
          type="warning"
          showIcon
          closable
        />
      )}

      {/* Reports Table */}
      <Card title="Compliance Reports History">
        <Table
          dataSource={reports}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{
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

export default ComplianceReports;
