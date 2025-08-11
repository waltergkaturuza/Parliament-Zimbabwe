// src/components/fuel/dynamic/AllocationCommit.tsx
// Dynamic Fuel Allocation Commit Component

import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Space,
  Row,
  Col,
  Statistic,
  Alert,
  message,
  Steps,
  Table,
  Tag,
  Modal,
  Form,
  Input,
  Checkbox,
  Progress,
  Result,
  Tooltip,
  Typography
} from 'antd';
import {
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  LoadingOutlined,
  SafetyCertificateOutlined,
  FileTextOutlined,
  UserOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

// API and Types
import dynamicAllocationApi from '../../../api/dynamicAllocation';
import type {
  AllocationPreviewResult,
  AllocationCommitResponse
} from '../../../types/dynamicAllocation';

const { Step } = Steps;
const { TextArea } = Input;
const { Text, Title } = Typography;

interface AllocationCommitProps {
  previewData: AllocationPreviewResult[];
  onCommitSuccess: () => void;
}

interface CommitValidation {
  isValid: boolean;
  validCount: number;
  invalidCount: number;
  totalLitres: number;
  totalUSD: number;
  errors: string[];
}

const AllocationCommit: React.FC<AllocationCommitProps> = ({
  previewData,
  onCommitSuccess
}) => {
  // Form instance
  const [form] = Form.useForm();

  // State
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [committing, setCommitting] = useState<boolean>(false);
  const [commitResult, setCommitResult] = useState<AllocationCommitResponse | null>(null);
  const [validation, setValidation] = useState<CommitValidation | null>(null);
  const [confirmModalVisible, setConfirmModalVisible] = useState<boolean>(false);
  const [agreedToTerms, setAgreedToTerms] = useState<boolean>(false);

  // Validate preview data
  const validateData = (): CommitValidation => {
    const validAllocations = previewData.filter(item => item.is_valid);
    const invalidAllocations = previewData.filter(item => !item.is_valid);
    
    const totalLitres = validAllocations.reduce((sum, item) => 
      sum + item.final_allocation_litres, 0
    );
    const totalUSD = validAllocations.reduce((sum, item) => 
      sum + item.final_allocation_usd, 0
    );

    const errors: string[] = [];
    
    // Validation rules
    if (previewData.length === 0) {
      errors.push('No allocations to commit');
    }
    
    if (validAllocations.length === 0) {
      errors.push('No valid allocations found');
    }
    
    if (invalidAllocations.length > 0) {
      errors.push(`${invalidAllocations.length} allocation(s) have validation errors`);
    }

    // Check for duplicates
    const beneficiaryIds = previewData.map(item => item.beneficiary_id);
    const duplicates = beneficiaryIds.filter((id, index) => 
      beneficiaryIds.indexOf(id) !== index
    );
    if (duplicates.length > 0) {
      errors.push('Duplicate beneficiaries found in allocation list');
    }

    return {
      isValid: errors.length === 0,
      validCount: validAllocations.length,
      invalidCount: invalidAllocations.length,
      totalLitres,
      totalUSD,
      errors
    };
  };

  // Start commit process
  const startCommit = () => {
    const val = validateData();
    setValidation(val);
    
    if (val.isValid) {
      setCurrentStep(1);
      setConfirmModalVisible(true);
    } else {
      setCurrentStep(0);
      message.error('Please fix validation errors before committing');
    }
  };

  // Confirm and commit allocations
  const confirmCommit = async () => {
    try {
      const values = await form.validateFields();
      
      if (!agreedToTerms) {
        message.error('Please agree to the terms and conditions');
        return;
      }

      setCommitting(true);
      setConfirmModalVisible(false);
      setCurrentStep(2);

      // Prepare commit data
      const commitData = {
        preview_data: previewData.filter(item => item.is_valid),
        committed_by: 1, // TODO: Get from user context
        comments: values.comments || undefined
      };

      // Commit allocations
      const result = await dynamicAllocationApi.dynamicAllocations.commit(commitData);
      setCommitResult(result);
      setCurrentStep(3);
      
      message.success(`Successfully committed ${result.committed_count} allocations`);
      
      // Call success callback after short delay
      setTimeout(() => {
        onCommitSuccess();
      }, 2000);
      
    } catch (error: any) {
      console.error('Commit failed:', error);
      setCurrentStep(0);
      message.error('Failed to commit allocations: ' + (error.message || 'Unknown error'));
    } finally {
      setCommitting(false);
    }
  };

  // Reset commit process
  const resetCommit = () => {
    setCurrentStep(0);
    setCommitResult(null);
    setValidation(null);
    setConfirmModalVisible(false);
    setAgreedToTerms(false);
    form.resetFields();
  };

  // Summary table columns
  const summaryColumns: ColumnsType<AllocationPreviewResult> = [
    {
      title: 'Beneficiary',
      key: 'beneficiary',
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <strong>{record.beneficiary_name}</strong>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.constituency_name}
          </Text>
        </Space>
      )
    },
    {
      title: 'Allocation',
      key: 'allocation',
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <Text strong style={{ color: '#1890ff' }}>
            {record.final_allocation_litres.toFixed(2)}L
          </Text>
          <Text strong style={{ color: '#52c41a', fontSize: '12px' }}>
            ${record.final_allocation_usd.toFixed(2)}
          </Text>
        </Space>
      )
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => (
        <Tag color={record.is_valid ? 'green' : 'red'} icon={
          record.is_valid ? <CheckCircleOutlined /> : <ExclamationCircleOutlined />
        }>
          {record.is_valid ? 'Valid' : 'Invalid'}
        </Tag>
      )
    }
  ];

  // Initialize validation on mount and data change
  useEffect(() => {
    if (previewData.length > 0) {
      const val = validateData();
      setValidation(val);
    }
  }, [previewData]);

  // Steps configuration
  const steps = [
    {
      title: 'Validation',
      icon: <SafetyCertificateOutlined />,
      description: 'Validate allocation data'
    },
    {
      title: 'Confirmation',
      icon: <FileTextOutlined />,
      description: 'Review and confirm'
    },
    {
      title: 'Processing',
      icon: committing ? <LoadingOutlined /> : <ClockCircleOutlined />,
      description: 'Committing allocations'
    },
    {
      title: 'Complete',
      icon: <CheckCircleOutlined />,
      description: 'Allocations committed'
    }
  ];

  return (
    <div>
      {/* No Data State */}
      {previewData.length === 0 && (
        <Card>
          <Alert
            message="No Allocations to Commit"
            description="Generate allocation previews using the Calculator tab before committing."
            type="info"
            showIcon
            style={{ textAlign: 'center' }}
          />
        </Card>
      )}

      {/* Commit Process */}
      {previewData.length > 0 && (
        <>
          {/* Progress Steps */}
          <Card size="small" style={{ marginBottom: '16px' }}>
            <Steps current={currentStep} status={
              currentStep === 3 ? 'finish' : 
              validation && !validation.isValid ? 'error' : 
              'process'
            }>
              {steps.map(step => (
                <Step 
                  key={step.title}
                  title={step.title}
                  description={step.description}
                  icon={step.icon}
                />
              ))}
            </Steps>
          </Card>

          {/* Step 0: Validation */}
          {currentStep === 0 && validation && (
            <Card title="Allocation Validation">
              <Row gutter={16} style={{ marginBottom: '24px' }}>
                <Col xs={12} sm={6}>
                  <Statistic
                    title="Total Allocations"
                    value={previewData.length}
                    prefix={<FileTextOutlined />}
                  />
                </Col>
                <Col xs={12} sm={6}>
                  <Statistic
                    title="Valid"
                    value={validation.validCount}
                    valueStyle={{ color: '#52c41a' }}
                    prefix={<CheckCircleOutlined />}
                  />
                </Col>
                <Col xs={12} sm={6}>
                  <Statistic
                    title="Total Litres"
                    value={validation.totalLitres}
                    precision={2}
                    suffix="L"
                  />
                </Col>
                <Col xs={12} sm={6}>
                  <Statistic
                    title="Total USD"
                    value={validation.totalUSD}
                    precision={2}
                    prefix="$"
                    valueStyle={{ color: '#cf1322' }}
                  />
                </Col>
              </Row>

              {/* Validation Errors */}
              {validation.errors.length > 0 && (
                <Alert
                  message="Validation Errors"
                  description={
                    <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                      {validation.errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  }
                  type="error"
                  showIcon
                  style={{ marginBottom: '16px' }}
                />
              )}

              {/* Valid Allocations Summary */}
              {validation.validCount > 0 && (
                <Card size="small" title="Allocations Ready for Commit">
                  <Table
                    columns={summaryColumns}
                    dataSource={previewData.filter(item => item.is_valid)}
                    rowKey="beneficiary_id"
                    size="small"
                    pagination={{ pageSize: 5 }}
                  />
                </Card>
              )}

              {/* Action Buttons */}
              <Row justify="center" style={{ marginTop: '24px' }}>
                <Space>
                  <Button
                    type="primary"
                    size="large"
                    onClick={startCommit}
                    disabled={!validation.isValid || validation.validCount === 0}
                    icon={<CheckCircleOutlined />}
                  >
                    Proceed to Commit ({validation.validCount} allocations)
                  </Button>
                  <Button size="large" onClick={resetCommit}>
                    Reset
                  </Button>
                </Space>
              </Row>
            </Card>
          )}

          {/* Step 2: Processing */}
          {currentStep === 2 && (
            <Card title="Committing Allocations">
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <Progress type="circle" percent={committing ? undefined : 100} status={committing ? 'active' : 'success'} />
                <Title level={4} style={{ marginTop: '16px' }}>
                  {committing ? 'Processing allocations...' : 'Allocations committed successfully'}
                </Title>
                <Text type="secondary">
                  {committing ? 'Please wait while we process your allocations.' : 'All allocations have been saved to the system.'}
                </Text>
              </div>
            </Card>
          )}

          {/* Step 3: Complete */}
          {currentStep === 3 && commitResult && (
            <Card>
              <Result
                status="success"
                title="Allocations Committed Successfully"
                subTitle={`${commitResult.committed_count} allocations have been successfully committed to the system.`}
                extra={[
                  <Button type="primary" key="analytics" onClick={() => onCommitSuccess()}>
                    View Analytics
                  </Button>,
                  <Button key="new" onClick={resetCommit}>
                    Create New Allocations
                  </Button>
                ]}
              >
                <Card size="small" style={{ marginTop: '16px' }}>
                  <Row gutter={16}>
                    <Col span={8}>
                      <Statistic
                        title="Committed"
                        value={commitResult.committed_count}
                        prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                      />
                    </Col>
                    <Col span={8}>
                      <Statistic
                        title="Total Litres"
                        value={commitResult.total_litres}
                        precision={2}
                        suffix="L"
                      />
                    </Col>
                    <Col span={8}>
                      <Statistic
                        title="Total USD"
                        value={commitResult.total_usd}
                        precision={2}
                        prefix="$"
                      />
                    </Col>
                  </Row>
                </Card>
              </Result>
            </Card>
          )}
        </>
      )}

      {/* Confirmation Modal */}
      <Modal
        title="Confirm Allocation Commit"
        open={confirmModalVisible}
        onOk={confirmCommit}
        onCancel={() => setConfirmModalVisible(false)}
        okText="Commit Allocations"
        cancelText="Cancel"
        confirmLoading={committing}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Alert
            message="Final Confirmation"
            description={`You are about to commit ${validation?.validCount} fuel allocations totaling ${validation?.totalLitres.toFixed(2)}L (${validation?.totalUSD.toFixed(2)} USD). This action cannot be undone.`}
            type="warning"
            showIcon
            style={{ marginBottom: '16px' }}
          />

          <Form.Item
            name="comments"
            label="Comments (Optional)"
          >
            <TextArea
              rows={3}
              placeholder="Add any comments about this allocation batch..."
            />
          </Form.Item>

          <Form.Item>
            <Checkbox
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
            >
              I confirm that I have reviewed all allocations and agree to commit them to the system. 
              I understand that this action is final and allocations cannot be modified after commitment.
            </Checkbox>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AllocationCommit;
