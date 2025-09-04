// src/components/fuel/dynamic/AllocationCalculator.tsx
// Dynamic Fuel Allocation Calculator Component

import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Select,
  InputNumber,
  Button,
  Space,
  Row,
  Col,
  Divider,
  Alert,
  message,
  Spin,
  Table,
  Tag,
  Tooltip,
  Switch,
  Radio
} from 'antd';
import {
  CalculatorOutlined,
  UserOutlined,
  CarOutlined,
  EnvironmentOutlined,
  DollarOutlined,
  EyeOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

// API and Types
import dynamicAllocationApi from '../../../api/dynamicAllocation';
import type {
  AllocationCalculationRequest,
  AllocationPreviewRequest,
  AllocationPreviewResult,
  FuelAllocationRule,
  FuelPrice,
  EnhancedBeneficiaryProfile,
  EnhancedParliamentSession
} from '../../../types/dynamicAllocation';

const { Option } = Select;

interface AllocationCalculatorProps {
  onPreviewGenerated: (data: AllocationPreviewResult[]) => void;
}

interface CalculationMode {
  type: 'single' | 'bulk';
  label: string;
}

const AllocationCalculator: React.FC<AllocationCalculatorProps> = ({
  onPreviewGenerated
}) => {
  // Form instance
  const [form] = Form.useForm();

  // State
  const [loading, setLoading] = useState<boolean>(false);
  const [calculating, setCalculating] = useState<boolean>(false);
  const [mode, setMode] = useState<'single' | 'bulk'>('single');
  const [beneficiaries, setBeneficiaries] = useState<EnhancedBeneficiaryProfile[]>([]);
  const [sessions, setSessions] = useState<EnhancedParliamentSession[]>([]);
  const [rules, setRules] = useState<FuelAllocationRule[]>([]);
  const [prices, setPrices] = useState<FuelPrice[]>([]);
  const [previewResults, setPreviewResults] = useState<AllocationPreviewResult[]>([]);

  // Calculation modes
  const calculationModes: CalculationMode[] = [
    { type: 'single', label: 'Single Beneficiary' },
    { type: 'bulk', label: 'Bulk Calculation' }
  ];

  // Load initial data
  const loadData = async () => {
    try {
      setLoading(true);
      
      const [
        beneficiariesRes,
        sessionsRes,
        rulesRes,
        pricesRes
      ] = await Promise.all([
        dynamicAllocationApi.enhancedBeneficiaries.getAll({
          has_engine_data: true,
          has_distance_data: true
        }),
        dynamicAllocationApi.enhancedSessions.getAll({ is_active: true }),
        dynamicAllocationApi.allocationRules.getAll(),
        dynamicAllocationApi.fuelPrices.getAll()
      ]);

      setBeneficiaries(beneficiariesRes.results || []);
      setSessions(sessionsRes.results || []);
      setRules(rulesRes.results || []);
      setPrices(pricesRes.results || []);
    } catch (error: any) {
      console.error('Failed to load data:', error);
      message.error('Failed to load calculation data');
    } finally {
      setLoading(false);
    }
  };

  // Calculate single allocation
  const calculateSingle = async () => {
    try {
      const values = await form.validateFields();
      setCalculating(true);

      const request: AllocationCalculationRequest = {
        beneficiary_id: values.beneficiary_id,
        session_id: values.parliament_session_id,
        allocation_rule_id: values.fuel_allocation_rule_id
      };

      const result = await dynamicAllocationApi.dynamicAllocations.calculate(request);
      setPreviewResults([result]);
      
      message.success('Allocation calculated successfully');
    } catch (error: any) {
      console.error('Calculation failed:', error);
      message.error('Failed to calculate allocation');
    } finally {
      setCalculating(false);
    }
  };

  // Calculate bulk allocations
  const calculateBulk = async () => {
    try {
      const values = await form.validateFields();
      setCalculating(true);

      const request: AllocationPreviewRequest = {
        beneficiary_ids: values.beneficiary_ids || [],
        session_id: values.parliament_session_id,
        allocation_rule_id: values.fuel_allocation_rule_id
      };

      const results = await dynamicAllocationApi.dynamicAllocations.preview(request);
      setPreviewResults(results);
      
      message.success(`${results.length} allocations calculated successfully`);
    } catch (error: any) {
      console.error('Bulk calculation failed:', error);
      message.error('Failed to calculate bulk allocations');
    } finally {
      setCalculating(false);
    }
  };

  // Send to preview
  const sendToPreview = () => {
    if (previewResults.length > 0) {
      onPreviewGenerated(previewResults);
      message.success(`${previewResults.length} allocations sent to preview`);
    }
  };

  // Table columns for preview results
  const previewColumns: ColumnsType<AllocationPreviewResult> = [
    {
      title: 'Beneficiary',
      key: 'beneficiary',
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <strong>{record.beneficiary_name}</strong>
          <Tag color="blue">{record.constituency_name}</Tag>
        </Space>
      )
    },
    {
      title: 'Vehicle Info',
      key: 'vehicle',
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <span><CarOutlined /> {record.engine_capacity_cc}cc</span>
          <span><EnvironmentOutlined /> {record.distance_from_parliament_km}km</span>
        </Space>
      )
    },
    {
      title: 'Calculation',
      key: 'calculation',
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <span>Base: {record.base_allocation_litres.toFixed(2)}L</span>
          <span>Factor: {record.engine_constant}</span>
        </Space>
      )
    },
    {
      title: 'Final Allocation',
      key: 'final',
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <strong style={{ color: '#1890ff' }}>
            {record.final_allocation_litres.toFixed(2)}L
          </strong>
          <span style={{ color: '#52c41a' }}>
            ${record.final_allocation_usd.toFixed(2)}
          </span>
        </Space>
      )
    },
    {
      title: 'Status',
      dataIndex: 'is_valid',
      key: 'status',
      render: (isValid: boolean, record) => (
        <Space direction="vertical" size="small">
          <Tag color={isValid ? 'green' : 'red'}>
            {isValid ? 'Valid' : 'Invalid'}
          </Tag>
          {record.validation_errors && record.validation_errors.length > 0 && (
            <Tooltip title={record.validation_errors.join(', ')}>
              <Tag color="orange">Issues</Tag>
            </Tooltip>
          )}
        </Space>
      )
    }
  ];

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  return (
    <div>
      {/* Mode Selection */}
      <Card size="small" style={{ marginBottom: '16px' }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Radio.Group
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              buttonStyle="solid"
            >
              {calculationModes.map(modeItem => (
                <Radio.Button key={modeItem.type} value={modeItem.type}>
                  {modeItem.label}
                </Radio.Button>
              ))}
            </Radio.Group>
          </Col>
          <Col>
            <Button
              icon={<ReloadOutlined />}
              onClick={loadData}
              loading={loading}
              type="text"
            >
              Refresh Data
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Calculation Form */}
      <Card 
        title={
          <Space>
            <CalculatorOutlined />
            {mode === 'single' ? 'Single Allocation Calculator' : 'Bulk Allocation Calculator'}
          </Space>
        }
        loading={loading}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={mode === 'single' ? calculateSingle : calculateBulk}
        >
          <Row gutter={16}>
            {/* Parliament Session */}
            <Col xs={24} md={12}>
              <Form.Item
                name="parliament_session_id"
                label="Parliament Session"
                rules={[{ required: true, message: 'Please select a session' }]}
              >
                <Select
                  placeholder="Select parliament session"
                  showSearch
                  optionFilterProp="children"
                >
                  {sessions.map(session => (
                    <Option key={session.id} value={session.id}>
                      {session.name} ({session.start_date} - {session.end_date})
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            {/* Fuel Allocation Rule */}
            <Col xs={24} md={12}>
              <Form.Item
                name="fuel_allocation_rule_id"
                label="Allocation Rule"
                rules={[{ required: true, message: 'Please select a rule' }]}
              >
                <Select
                  placeholder="Select allocation rule"
                  showSearch
                  optionFilterProp="children"
                >
                  {rules.map(rule => (
                    <Option key={rule.id} value={rule.id}>
                      {rule.rule_name} - {rule.description}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            {/* Fuel Price */}
            <Col xs={24} md={12}>
              <Form.Item
                name="fuel_price_id"
                label="Fuel Price"
                rules={[{ required: true, message: 'Please select fuel price' }]}
              >
                <Select
                  placeholder="Select fuel price"
                  showSearch
                  optionFilterProp="children"
                >
                  {prices.map(price => (
                    <Option key={price.id} value={price.id}>
                      {price.fuel_type} - ${price.price_usd_per_litre}/L
                      {price.is_current && <Tag color="green" style={{ marginLeft: '8px' }}>Active</Tag>}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            {/* Single Mode: Beneficiary Selection */}
            {mode === 'single' && (
              <Col xs={24} md={12}>
                <Form.Item
                  name="beneficiary_id"
                  label="Beneficiary"
                  rules={[{ required: true, message: 'Please select a beneficiary' }]}
                >
                  <Select
                    placeholder="Select beneficiary"
                    showSearch
                    optionFilterProp="children"
                    filterOption={(input, option) =>
                      option?.children?.toString().toLowerCase().includes(input.toLowerCase()) ?? false
                    }
                  >
                    {beneficiaries.map(beneficiary => {
                      const displayName = beneficiary.constituency_name || 'Unknown Name';
                      return (
                        <Option key={beneficiary.id} value={beneficiary.id}>
                          <Space>
                            <UserOutlined />
                            {displayName}
                            <Tag color="blue">{beneficiary.constituency_name}</Tag>
                            <Tag color="green">{beneficiary.engine_capacity_cc}cc</Tag>
                          </Space>
                        </Option>
                      );
                    })}
                  </Select>
                </Form.Item>
              </Col>
            )}

            {/* Bulk Mode: Filter Options */}
            {mode === 'bulk' && (
              <>
                <Col xs={24} md={8}>
                  <Form.Item
                    name="beneficiary_ids"
                    label="Specific Beneficiaries (Optional)"
                  >
                    <Select
                      mode="multiple"
                      placeholder="Select specific beneficiaries"
                      showSearch
                      optionFilterProp="children"
                      maxTagCount={3}
                    >
                      {beneficiaries.map(beneficiary => {
                        const displayName = beneficiary.constituency_name || 'Unknown Name';
                        return (
                          <Option key={beneficiary.id} value={beneficiary.id}>
                            {displayName} - {beneficiary.constituency_name}
                          </Option>
                        );
                      })}
                    </Select>
                  </Form.Item>
                </Col>

                <Col xs={24} md={8}>
                  <Form.Item
                    name="constituency_id"
                    label="Filter by Constituency (Optional)"
                  >
                    <Select
                      placeholder="Select constituency"
                      allowClear
                      showSearch
                      optionFilterProp="children"
                    >
                      {[...new Set(beneficiaries.map(b => b.constituency_name))]
                        .map((constituency, index) => (
                        <Option key={index} value={constituency}>
                          {constituency}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>

                <Col xs={24} md={8}>
                  <Form.Item
                    name="category_id"
                    label="Filter by Category (Optional)"
                  >
                    <Select
                      placeholder="Select category"
                      allowClear
                      showSearch
                      optionFilterProp="children"
                    >
                      {[...new Set(beneficiaries.map(b => b.category_name))]
                        .map((category, index) => (
                        <Option key={index} value={category}>
                          {category}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </>
            )}
          </Row>

          <Divider />

          {/* Action Buttons */}
          <Row justify="center">
            <Space size="large">
              <Button
                type="primary"
                htmlType="submit"
                loading={calculating}
                icon={<CalculatorOutlined />}
                size="large"
              >
                {mode === 'single' ? 'Calculate Allocation' : 'Calculate Bulk Allocations'}
              </Button>
              
              {previewResults.length > 0 && (
                <Button
                  type="default"
                  onClick={sendToPreview}
                  icon={<EyeOutlined />}
                  size="large"
                >
                  Send to Preview ({previewResults.length})
                </Button>
              )}
            </Space>
          </Row>
        </Form>
      </Card>

      {/* Preview Results */}
      {previewResults.length > 0 && (
        <Card 
          title={`Calculation Results (${previewResults.length})`}
          style={{ marginTop: '16px' }}
        >
          <Alert
            message="Calculation Complete"
            description={`Successfully calculated ${previewResults.length} allocation(s). Review the results below and send to preview when ready.`}
            type="success"
            showIcon
            style={{ marginBottom: '16px' }}
          />
          
          <Table
            columns={previewColumns}
            dataSource={previewResults}
            rowKey="beneficiary_id"
            size="small"
            scroll={{ x: 800 }}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `Total ${total} allocations`
            }}
          />
        </Card>
      )}
    </div>
  );
};

export default AllocationCalculator;
