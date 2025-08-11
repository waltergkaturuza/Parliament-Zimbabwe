// src/components/fuel/dynamic/AllocationPreview.tsx
// Dynamic Fuel Allocation Preview Component

import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Row,
  Col,
  Statistic,
  Alert,
  message,
  Tag,
  Tooltip,
  Popconfirm,
  Input,
  Select,
  Checkbox,
  Modal,
  Descriptions,
  Progress
} from 'antd';
import {
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  FilterOutlined,
  ExportOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { CheckboxChangeEvent } from 'antd/es/checkbox';

// API and Types
import type {
  AllocationPreviewResult
} from '../../../types/dynamicAllocation';

const { Option } = Select;
const { Search } = Input;

interface AllocationPreviewProps {
  previewData: AllocationPreviewResult[];
  onDataChange: (data: AllocationPreviewResult[]) => void;
}

interface FilterState {
  search: string;
  constituency: string | undefined;
  category: string | undefined;
  validOnly: boolean;
  engineCategory: string | undefined;
}

interface PreviewStats {
  totalAllocations: number;
  validAllocations: number;
  invalidAllocations: number;
  totalLitres: number;
  totalUSD: number;
  averageAllocation: number;
}

const AllocationPreview: React.FC<AllocationPreviewProps> = ({
  previewData,
  onDataChange
}) => {
  // State
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [filteredData, setFilteredData] = useState<AllocationPreviewResult[]>([]);
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    constituency: undefined,
    category: undefined,
    validOnly: false,
    engineCategory: undefined
  });
  const [stats, setStats] = useState<PreviewStats>({
    totalAllocations: 0,
    validAllocations: 0,
    invalidAllocations: 0,
    totalLitres: 0,
    totalUSD: 0,
    averageAllocation: 0
  });
  const [detailModalVisible, setDetailModalVisible] = useState<boolean>(false);
  const [selectedRecord, setSelectedRecord] = useState<AllocationPreviewResult | null>(null);

  // Calculate statistics
  const calculateStats = (data: AllocationPreviewResult[]): PreviewStats => {
    const validData = data.filter(item => item.is_valid);
    const totalLitres = data.reduce((sum, item) => sum + item.final_allocation_litres, 0);
    const totalUSD = data.reduce((sum, item) => sum + item.final_allocation_usd, 0);

    return {
      totalAllocations: data.length,
      validAllocations: validData.length,
      invalidAllocations: data.length - validData.length,
      totalLitres,
      totalUSD,
      averageAllocation: data.length > 0 ? totalLitres / data.length : 0
    };
  };

  // Apply filters
  const applyFilters = (data: AllocationPreviewResult[], filterState: FilterState): AllocationPreviewResult[] => {
    return data.filter(item => {
      // Search filter
      if (filterState.search) {
        const searchLower = filterState.search.toLowerCase();
        if (!item.beneficiary_name.toLowerCase().includes(searchLower) &&
            !item.constituency_name.toLowerCase().includes(searchLower)) {
          return false;
        }
      }

      // Constituency filter
      if (filterState.constituency && item.constituency_name !== filterState.constituency) {
        return false;
      }

      // Category filter
      if (filterState.category && item.category_name !== filterState.category) {
        return false;
      }

      // Valid only filter
      if (filterState.validOnly && !item.is_valid) {
        return false;
      }

      // Engine category filter
      if (filterState.engineCategory) {
        const engineCategory = getEngineCategory(item.engine_capacity_cc);
        if (engineCategory !== filterState.engineCategory) {
          return false;
        }
      }

      return true;
    });
  };

  // Get engine category
  const getEngineCategory = (engineCC: number): string => {
    if (engineCC < 2800) return 'Small (< 2800cc)';
    if (engineCC < 3200) return 'Medium (2800-3199cc)';
    return 'Large (≥ 3200cc)';
  };

  // Handle filter changes
  const handleFilterChange = (key: keyof FilterState, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
  };

  // Remove selected allocations
  const removeSelected = () => {
    const remainingData = previewData.filter(item => 
      !selectedRowKeys.includes(item.beneficiary_id)
    );
    onDataChange(remainingData);
    setSelectedRowKeys([]);
    message.success(`Removed ${selectedRowKeys.length} allocation(s)`);
  };

  // Remove single allocation
  const removeSingle = (beneficiaryId: number) => {
    const remainingData = previewData.filter(item => item.beneficiary_id !== beneficiaryId);
    onDataChange(remainingData);
    message.success('Allocation removed');
  };

  // Show allocation details
  const showDetails = (record: AllocationPreviewResult) => {
    setSelectedRecord(record);
    setDetailModalVisible(true);
  };

  // Export data
  const exportData = () => {
    const csvContent = [
      // Headers
      'Beneficiary,Constituency,Category,Engine CC,Distance KM,Base Allocation L,Engine Constant,Final Allocation L,Final Allocation USD,Valid,Errors',
      // Data rows
      ...filteredData.map(item => [
        item.beneficiary_name,
        item.constituency_name,
        item.category_name,
        item.engine_capacity_cc,
        item.distance_from_parliament_km,
        item.base_allocation_litres.toFixed(2),
        item.engine_constant,
        item.final_allocation_litres.toFixed(2),
        item.final_allocation_usd.toFixed(2),
        item.is_valid ? 'Yes' : 'No',
        item.validation_errors?.join('; ') || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `allocation_preview_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Table columns
  const columns: ColumnsType<AllocationPreviewResult> = [
    {
      title: 'Beneficiary',
      key: 'beneficiary',
      fixed: 'left',
      width: 200,
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <strong>{record.beneficiary_name}</strong>
          <Tag color="blue" size="small">{record.constituency_name}</Tag>
          <Tag color="purple" size="small">{record.category_name}</Tag>
        </Space>
      )
    },
    {
      title: 'Vehicle Info',
      key: 'vehicle',
      width: 150,
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <span>{record.engine_capacity_cc}cc</span>
          <Tag color="orange" size="small">
            {getEngineCategory(record.engine_capacity_cc)}
          </Tag>
          <span>{record.distance_from_parliament_km}km</span>
        </Space>
      )
    },
    {
      title: 'Calculation',
      key: 'calculation',
      width: 150,
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <span>Base: {record.base_allocation_litres.toFixed(2)}L</span>
          <span>Factor: {record.engine_constant}</span>
          <Tooltip title="Base × Engine Constant × Distance Factor">
            <span style={{ color: '#666', fontSize: '12px' }}>
              Formula Applied
            </span>
          </Tooltip>
        </Space>
      )
    },
    {
      title: 'Final Allocation',
      key: 'final',
      width: 150,
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <strong style={{ color: '#1890ff', fontSize: '14px' }}>
            {record.final_allocation_litres.toFixed(2)}L
          </strong>
          <strong style={{ color: '#52c41a', fontSize: '14px' }}>
            ${record.final_allocation_usd.toFixed(2)}
          </strong>
        </Space>
      )
    },
    {
      title: 'Status',
      key: 'status',
      width: 120,
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <Tag color={record.is_valid ? 'green' : 'red'} icon={
            record.is_valid ? <CheckCircleOutlined /> : <ExclamationCircleOutlined />
          }>
            {record.is_valid ? 'Valid' : 'Invalid'}
          </Tag>
          {record.validation_errors && record.validation_errors.length > 0 && (
            <Tooltip title={record.validation_errors.join(', ')}>
              <Tag color="orange" size="small">
                {record.validation_errors.length} Issue(s)
              </Tag>
            </Tooltip>
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
          <Tooltip title="View Details">
            <Button
              type="text"
              size="small"
              icon={<InfoCircleOutlined />}
              onClick={() => showDetails(record)}
            />
          </Tooltip>
          <Tooltip title="Remove">
            <Popconfirm
              title="Remove this allocation?"
              onConfirm={() => removeSingle(record.beneficiary_id)}
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

  // Row selection config
  const rowSelection = {
    selectedRowKeys,
    onChange: setSelectedRowKeys,
    getCheckboxProps: (record: AllocationPreviewResult) => ({
      disabled: false,
      name: record.beneficiary_name,
    }),
  };

  // Update filtered data when preview data or filters change
  useEffect(() => {
    const filtered = applyFilters(previewData, filters);
    setFilteredData(filtered);
    setStats(calculateStats(filtered));
  }, [previewData, filters]);

  // Get unique values for filter options
  const constituencies = [...new Set(previewData.map(item => item.constituency_name))];
  const categories = [...new Set(previewData.map(item => item.category_name))];
  const engineCategories = [...new Set(previewData.map(item => getEngineCategory(item.engine_capacity_cc)))];

  return (
    <div>
      {/* No Data State */}
      {previewData.length === 0 && (
        <Card>
          <Alert
            message="No Preview Data"
            description="Use the Calculator tab to generate allocation previews before reviewing them here."
            type="info"
            showIcon
            style={{ textAlign: 'center' }}
          />
        </Card>
      )}

      {/* Preview Content */}
      {previewData.length > 0 && (
        <>
          {/* Statistics */}
          <Card title="Preview Summary" size="small" style={{ marginBottom: '16px' }}>
            <Row gutter={16}>
              <Col xs={12} sm={6}>
                <Statistic
                  title="Total Allocations"
                  value={stats.totalAllocations}
                  prefix={<EyeOutlined />}
                />
              </Col>
              <Col xs={12} sm={6}>
                <Statistic
                  title="Valid"
                  value={stats.validAllocations}
                  valueStyle={{ color: '#52c41a' }}
                  prefix={<CheckCircleOutlined />}
                />
              </Col>
              <Col xs={12} sm={6}>
                <Statistic
                  title="Total Litres"
                  value={stats.totalLitres}
                  precision={2}
                  suffix="L"
                />
              </Col>
              <Col xs={12} sm={6}>
                <Statistic
                  title="Total USD"
                  value={stats.totalUSD}
                  precision={2}
                  prefix="$"
                  valueStyle={{ color: '#cf1322' }}
                />
              </Col>
            </Row>
            
            {stats.invalidAllocations > 0 && (
              <Alert
                message={`${stats.invalidAllocations} allocation(s) have validation errors`}
                type="warning"
                showIcon
                style={{ marginTop: '16px' }}
              />
            )}
          </Card>

          {/* Filters and Actions */}
          <Card size="small" style={{ marginBottom: '16px' }}>
            <Row gutter={16} align="middle">
              <Col xs={24} sm={8} md={6}>
                <Search
                  placeholder="Search beneficiary or constituency"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  allowClear
                />
              </Col>
              <Col xs={12} sm={8} md={4}>
                <Select
                  placeholder="Constituency"
                  value={filters.constituency}
                  onChange={(value) => handleFilterChange('constituency', value)}
                  allowClear
                  style={{ width: '100%' }}
                >
                  {constituencies.map(constituency => (
                    <Option key={constituency} value={constituency}>{constituency}</Option>
                  ))}
                </Select>
              </Col>
              <Col xs={12} sm={8} md={4}>
                <Select
                  placeholder="Engine Category"
                  value={filters.engineCategory}
                  onChange={(value) => handleFilterChange('engineCategory', value)}
                  allowClear
                  style={{ width: '100%' }}
                >
                  {engineCategories.map(cat => (
                    <Option key={cat} value={cat}>{cat}</Option>
                  ))}
                </Select>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Checkbox
                  checked={filters.validOnly}
                  onChange={(e: CheckboxChangeEvent) => 
                    handleFilterChange('validOnly', e.target.checked)
                  }
                >
                  Valid Only
                </Checkbox>
              </Col>
              <Col xs={24} sm={12} md={4}>
                <Space>
                  <Button
                    type="primary"
                    icon={<ExportOutlined />}
                    onClick={exportData}
                    size="small"
                  >
                    Export
                  </Button>
                  {selectedRowKeys.length > 0 && (
                    <Popconfirm
                      title={`Remove ${selectedRowKeys.length} selected allocation(s)?`}
                      onConfirm={removeSelected}
                      okText="Yes"
                      cancelText="No"
                    >
                      <Button
                        danger
                        icon={<DeleteOutlined />}
                        size="small"
                      >
                        Remove ({selectedRowKeys.length})
                      </Button>
                    </Popconfirm>
                  )}
                </Space>
              </Col>
            </Row>
          </Card>

          {/* Main Table */}
          <Card>
            <Table
              columns={columns}
              dataSource={filteredData}
              rowKey="beneficiary_id"
              rowSelection={rowSelection}
              size="small"
              scroll={{ x: 1000 }}
              pagination={{
                pageSize: 20,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => 
                  `${range[0]}-${range[1]} of ${total} allocations`
              }}
            />
          </Card>
        </>
      )}

      {/* Detail Modal */}
      <Modal
        title="Allocation Details"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={600}
      >
        {selectedRecord && (
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="Beneficiary" span={2}>
              <strong>{selectedRecord.beneficiary_name}</strong>
            </Descriptions.Item>
            <Descriptions.Item label="Constituency">
              {selectedRecord.constituency_name}
            </Descriptions.Item>
            <Descriptions.Item label="Category">
              {selectedRecord.category_name}
            </Descriptions.Item>
            <Descriptions.Item label="Engine Capacity">
              {selectedRecord.engine_capacity_cc}cc
            </Descriptions.Item>
            <Descriptions.Item label="Engine Category">
              {getEngineCategory(selectedRecord.engine_capacity_cc)}
            </Descriptions.Item>
            <Descriptions.Item label="Distance">
              {selectedRecord.distance_from_parliament_km}km
            </Descriptions.Item>
            <Descriptions.Item label="Engine Constant">
              {selectedRecord.engine_constant}
            </Descriptions.Item>
            <Descriptions.Item label="Base Allocation">
              {selectedRecord.base_allocation_litres.toFixed(2)}L
            </Descriptions.Item>
            <Descriptions.Item label="Final Allocation">
              <strong style={{ color: '#1890ff' }}>
                {selectedRecord.final_allocation_litres.toFixed(2)}L
              </strong>
            </Descriptions.Item>
            <Descriptions.Item label="USD Value">
              <strong style={{ color: '#52c41a' }}>
                ${selectedRecord.final_allocation_usd.toFixed(2)}
              </strong>
            </Descriptions.Item>
            <Descriptions.Item label="Status" span={2}>
              <Tag color={selectedRecord.is_valid ? 'green' : 'red'} icon={
                selectedRecord.is_valid ? <CheckCircleOutlined /> : <ExclamationCircleOutlined />
              }>
                {selectedRecord.is_valid ? 'Valid' : 'Invalid'}
              </Tag>
            </Descriptions.Item>
            {selectedRecord.validation_errors && selectedRecord.validation_errors.length > 0 && (
              <Descriptions.Item label="Errors" span={2}>
                <Alert
                  message="Validation Errors"
                  description={
                    <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                      {selectedRecord.validation_errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  }
                  type="error"
                  showIcon
                />
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default AllocationPreview;
