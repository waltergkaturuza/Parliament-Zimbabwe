// src/components/fuel/dynamic/AllocationHistory.tsx
// Dynamic Fuel Allocation History Component

import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  DatePicker,
  Select,
  Input,
  Tag,
  Tooltip,
  Row,
  Col,
  Alert,
  message,
  Typography,
  Statistic,
  Modal,
  Descriptions
} from 'antd';
import {
  HistoryOutlined,
  SearchOutlined,
  ReloadOutlined,
  ExportOutlined,
  InfoCircleOutlined,
  CalendarOutlined,
  UserOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { RangePickerProps } from 'antd/es/date-picker';
import dayjs from 'dayjs';

// API and Types
import dynamicAllocationApi from '../../../api/dynamicAllocation';
import type {
  DynamicAllocation,
  EnhancedBeneficiaryProfile,
  EnhancedParliamentSession
} from '../../../types/dynamicAllocation';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { Search } = Input;
const { Text } = Typography;

interface HistoryFilter {
  dateRange: [string, string] | null;
  sessionId: number | undefined;
  beneficiaryId: number | undefined;
  isCommitted: boolean | undefined;
  search: string;
}

const AllocationHistory: React.FC = () => {
  // State
  const [loading, setLoading] = useState<boolean>(true);
  const [allocations, setAllocations] = useState<DynamicAllocation[]>([]);
  const [beneficiaries, setBeneficiaries] = useState<EnhancedBeneficiaryProfile[]>([]);
  const [sessions, setSessions] = useState<EnhancedParliamentSession[]>([]);
  const [filters, setFilters] = useState<HistoryFilter>({
    dateRange: null,
    sessionId: undefined,
    beneficiaryId: undefined,
    isCommitted: undefined,
    search: ''
  });
  const [detailModalVisible, setDetailModalVisible] = useState<boolean>(false);
  const [selectedAllocation, setSelectedAllocation] = useState<DynamicAllocation | null>(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0
  });

  // Load allocation history
  const loadHistory = async (page = 1, pageSize = 20) => {
    try {
      setLoading(true);

      // Prepare API parameters
      const params: any = {
        page,
        page_size: pageSize
      };

      if (filters.sessionId) {
        params.session = filters.sessionId;
      }
      if (filters.beneficiaryId) {
        params.beneficiary = filters.beneficiaryId;
      }
      if (filters.isCommitted !== undefined) {
        params.is_committed = filters.isCommitted;
      }
      if (filters.search) {
        params.search = filters.search;
      }

      const [allocationsRes, beneficiariesRes, sessionsRes] = await Promise.all([
        dynamicAllocationApi.dynamicAllocations.getAll(params),
        beneficiaries.length === 0 ? dynamicAllocationApi.enhancedBeneficiaries.getAll() : Promise.resolve({ results: beneficiaries }),
        sessions.length === 0 ? dynamicAllocationApi.enhancedSessions.getAll() : Promise.resolve({ results: sessions })
      ]);

      setAllocations(allocationsRes.results || []);
      setBeneficiaries(beneficiariesRes.results || []);
      setSessions(sessionsRes.results || []);
      
      setPagination({
        current: page,
        pageSize,
        total: allocationsRes.count || 0
      });
    } catch (error: any) {
      console.error('Failed to load history:', error);
      message.error('Failed to load allocation history');
    } finally {
      setLoading(false);
    }
  };

  // Handle filter changes
  const handleFilterChange = (key: keyof HistoryFilter, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Handle date range change
  const handleDateRangeChange: RangePickerProps['onChange'] = (dates) => {
    if (dates && dates[0] && dates[1]) {
      setFilters(prev => ({
        ...prev,
        dateRange: [dates[0]!.format('YYYY-MM-DD'), dates[1]!.format('YYYY-MM-DD')]
      }));
    } else {
      setFilters(prev => ({ ...prev, dateRange: null }));
    }
  };

  // Show allocation details
  const showDetails = (allocation: DynamicAllocation) => {
    setSelectedAllocation(allocation);
    setDetailModalVisible(true);
  };

  // Export history
  const exportHistory = async () => {
    try {
      const params: any = { format: 'csv' };
      if (filters.dateRange) {
        params.start_date = filters.dateRange[0];
        params.end_date = filters.dateRange[1];
      }
      if (filters.sessionId) {
        params.session_id = filters.sessionId;
      }

      const blob = await dynamicAllocationApi.analytics.exportAllocations(params);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `allocation_history_${dayjs().format('YYYY-MM-DD')}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      
      message.success('History exported successfully');
    } catch (error: any) {
      console.error('Export failed:', error);
      message.error('Failed to export history');
    }
  };

  // Handle table change (pagination, sorting, filtering)
  const handleTableChange = (paginationConfig: any) => {
    loadHistory(paginationConfig.current, paginationConfig.pageSize);
  };

  // Table columns
  const columns: ColumnsType<DynamicAllocation> = [
    {
      title: 'Date',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 120,
      render: (date: string) => (
        <Space direction="vertical" size="small">
          <Text style={{ fontSize: '12px' }}>
            {dayjs(date).format('MMM DD, YYYY')}
          </Text>
          <Text style={{ fontSize: '11px', color: '#666' }}>
            {dayjs(date).format('HH:mm')}
          </Text>
        </Space>
      ),
      sorter: true
    },
    {
      title: 'Beneficiary',
      key: 'beneficiary',
      width: 200,
      render: (_, record) => {
        const beneficiary = beneficiaries.find(b => b.id === record.beneficiary);
        return (
          <Space direction="vertical" size="small">
            <strong>{beneficiary?.constituency_name || record.beneficiary_name || 'Unknown'}</strong>
            <Tag color="blue">
              {beneficiary?.constituency_name || record.constituency_name || 'Unknown'}
            </Tag>
          </Space>
        );
      }
    },
    {
      title: 'Session',
      key: 'session',
      width: 150,
      render: (_, record) => {
        const session = sessions.find(s => s.id === record.session);
        return (
          <Space direction="vertical" size="small">
            <Text style={{ fontSize: '12px', fontWeight: 'bold' }}>
              {session?.name || record.session_name || 'Unknown'}
            </Text>
            <Text style={{ fontSize: '11px', color: '#666' }}>
              {session?.start_date} - {session?.end_date}
            </Text>
          </Space>
        );
      }
    },
    {
      title: 'Vehicle',
      key: 'vehicle',
      width: 120,
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <Text style={{ fontSize: '12px' }}>
            {record.calculation_details?.engine_capacity_cc || 0}cc
          </Text>
          <Text style={{ fontSize: '11px', color: '#666' }}>
            {record.calculation_details?.distance_from_parliament_km || 0}km
          </Text>
        </Space>
      )
    },
    {
      title: 'Calculation',
      key: 'calculation',
      width: 150,
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <Text style={{ fontSize: '12px' }}>
            Base: {record.calculated_allocation_litres?.toFixed(2) || '0.00'}L
          </Text>
          <Text style={{ fontSize: '11px', color: '#666' }}>
            Factor: {record.calculation_details?.engine_constant || 0}
          </Text>
        </Space>
      )
    },
    {
      title: 'Final Allocation',
      key: 'final',
      width: 140,
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <Text strong style={{ color: '#1890ff', fontSize: '13px' }}>
            {record.final_allocation_litres.toFixed(2)}L
          </Text>
          <Text strong style={{ color: '#52c41a', fontSize: '12px' }}>
            ${record.calculated_allocation_usd?.toFixed(2) || '0.00'}
          </Text>
        </Space>
      )
    },
    {
      title: 'Status',
      key: 'status',
      width: 100,
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <Tag color={record.is_committed ? 'green' : 'orange'} icon={
            record.is_committed ? <CheckCircleOutlined /> : <CalendarOutlined />
          }>
            {record.is_committed ? 'Committed' : 'Pending'}
          </Tag>
          {record.committed_date && (
            <Text style={{ fontSize: '10px', color: '#666' }}>
              {dayjs(record.committed_date).format('MMM DD')}
            </Text>
          )}
        </Space>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 80,
      render: (_, record) => (
        <Tooltip title="View Details">
          <Button
            type="text"
            size="small"
            icon={<InfoCircleOutlined />}
            onClick={() => showDetails(record)}
          />
        </Tooltip>
      )
    }
  ];

  // Calculate summary statistics
  const calculateSummary = () => {
    const totalLitres = allocations.reduce((sum, alloc) => sum + alloc.final_allocation_litres, 0);
    const totalUSD = allocations.reduce((sum, alloc) => sum + (alloc.calculated_allocation_usd || 0), 0);
    const committedCount = allocations.filter(alloc => alloc.is_committed).length;
    
    return { totalLitres, totalUSD, committedCount };
  };

  const summary = calculateSummary();

  // Load data on mount and filter changes
  useEffect(() => {
    loadHistory();
  }, [filters]);

  return (
    <div>
      {/* Header */}
      <Row justify="space-between" align="middle" style={{ marginBottom: '16px' }}>
        <Col>
          <Space>
            <HistoryOutlined style={{ fontSize: '20px', color: '#1890ff' }} />
            <span style={{ fontSize: '16px', fontWeight: 'bold' }}>
              Allocation History
            </span>
          </Space>
        </Col>
        <Col>
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => loadHistory(pagination.current, pagination.pageSize)}
              loading={loading}
            >
              Refresh
            </Button>
            <Button
              icon={<ExportOutlined />}
              onClick={exportHistory}
            >
              Export
            </Button>
          </Space>
        </Col>
      </Row>

      {/* Summary Statistics */}
      <Card size="small" style={{ marginBottom: '16px' }}>
        <Row gutter={16}>
          <Col xs={12} sm={6}>
            <Statistic
              title="Total Records"
              value={pagination.total}
              prefix={<HistoryOutlined />}
            />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic
              title="Committed"
              value={summary.committedCount}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined />}
            />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic
              title="Total Litres"
              value={summary.totalLitres}
              precision={2}
              suffix="L"
            />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic
              title="Total USD"
              value={summary.totalUSD}
              precision={2}
              prefix="$"
              valueStyle={{ color: '#cf1322' }}
            />
          </Col>
        </Row>
      </Card>

      {/* Filters */}
      <Card size="small" style={{ marginBottom: '16px' }}>
        <Row gutter={16} align="middle">
          <Col xs={24} sm={8} md={6}>
            <RangePicker
              onChange={handleDateRangeChange}
              style={{ width: '100%' }}
              placeholder={['Start Date', 'End Date']}
            />
          </Col>
          <Col xs={24} sm={8} md={4}>
            <Select
              placeholder="Session"
              value={filters.sessionId}
              onChange={(value) => handleFilterChange('sessionId', value)}
              allowClear
              style={{ width: '100%' }}
            >
              {sessions.map(session => (
                <Option key={session.id} value={session.id}>
                  {session.name}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={8} md={4}>
            <Select
              placeholder="Beneficiary"
              value={filters.beneficiaryId}
              onChange={(value) => handleFilterChange('beneficiaryId', value)}
              allowClear
              showSearch
              optionFilterProp="children"
              style={{ width: '100%' }}
            >
              {beneficiaries.map(beneficiary => {
                const displayName = beneficiary.constituency_name || 'Unknown Name';
                return (
                  <Option key={beneficiary.id} value={beneficiary.id}>
                    {displayName}
                  </Option>
                );
              })}
            </Select>
          </Col>
          <Col xs={24} sm={8} md={4}>
            <Select
              placeholder="Status"
              value={filters.isCommitted}
              onChange={(value) => handleFilterChange('isCommitted', value)}
              allowClear
              style={{ width: '100%' }}
            >
              <Option value={true}>Committed</Option>
              <Option value={false}>Pending</Option>
            </Select>
          </Col>
          <Col xs={24} sm={8} md={6}>
            <Search
              placeholder="Search allocations"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              allowClear
            />
          </Col>
        </Row>
      </Card>

      {/* History Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={allocations}
          rowKey="id"
          loading={loading}
          size="small"
          scroll={{ x: 1000 }}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} of ${total} allocations`
          }}
          onChange={handleTableChange}
        />
      </Card>

      {/* Detail Modal */}
      <Modal
        title="Allocation Details"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={700}
      >
        {selectedAllocation && (
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="ID" span={2}>
              {selectedAllocation.id}
            </Descriptions.Item>
            <Descriptions.Item label="Beneficiary">
              {beneficiaries.find(b => b.id === selectedAllocation.beneficiary)?.constituency_name || selectedAllocation.beneficiary_name || 'Unknown'}
            </Descriptions.Item>
            <Descriptions.Item label="Constituency">
              {beneficiaries.find(b => b.id === selectedAllocation.beneficiary)?.constituency_name || selectedAllocation.constituency_name || 'Unknown'}
            </Descriptions.Item>
            <Descriptions.Item label="Parliament Session">
              {sessions.find(s => s.id === selectedAllocation.session)?.name || selectedAllocation.session_name || 'Unknown'}
            </Descriptions.Item>
            <Descriptions.Item label="Rule">
              {selectedAllocation.rule_name}
            </Descriptions.Item>
            <Descriptions.Item label="Engine Capacity">
              {selectedAllocation.calculation_details?.engine_capacity_cc || 0}cc
            </Descriptions.Item>
            <Descriptions.Item label="Distance">
              {selectedAllocation.calculation_details?.distance_from_parliament_km || 0}km
            </Descriptions.Item>
            <Descriptions.Item label="Engine Constant">
              {selectedAllocation.calculation_details?.engine_constant || 0}
            </Descriptions.Item>
            <Descriptions.Item label="Base Allocation">
              {selectedAllocation.calculated_allocation_litres?.toFixed(2) || '0.00'}L
            </Descriptions.Item>
            <Descriptions.Item label="Final Allocation">
              <strong style={{ color: '#1890ff' }}>
                {selectedAllocation.final_allocation_litres.toFixed(2)}L
              </strong>
            </Descriptions.Item>
            <Descriptions.Item label="USD Value">
              <strong style={{ color: '#52c41a' }}>
                ${selectedAllocation.calculated_allocation_usd?.toFixed(2) || '0.00'}
              </strong>
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={selectedAllocation.is_committed ? 'green' : 'orange'} icon={
                selectedAllocation.is_committed ? <CheckCircleOutlined /> : <CalendarOutlined />
              }>
                {selectedAllocation.is_committed ? 'Committed' : 'Pending'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Created">
              {dayjs(selectedAllocation.created_date).format('MMMM DD, YYYY HH:mm')}
            </Descriptions.Item>
            {selectedAllocation.committed_date && (
              <Descriptions.Item label="Committed">
                {dayjs(selectedAllocation.committed_date).format('MMMM DD, YYYY HH:mm')}
              </Descriptions.Item>
            )}
            {selectedAllocation.committed_by && (
              <Descriptions.Item label="Committed By" span={2}>
                {selectedAllocation.committed_by}
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default AllocationHistory;
