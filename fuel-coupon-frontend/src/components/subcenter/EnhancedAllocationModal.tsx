import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Select,
  InputNumber,
  Input,
  Button,
  Typography,
  Card,
  Row,
  Col,
  Statistic,
  Alert,
  Progress,
  Space,
  Tag,
  Divider,
  message,
} from 'antd';
import {
  UserOutlined,
  CarOutlined,
  CalendarOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { BeneficiaryProfile } from '@/types';

const { Text, Title } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface EntitlementSource {
  id: string;
  type: 'MONTHLY' | 'SESSION' | 'COMMITTEE' | 'SPECIAL_EVENT' | 'TRAVEL_ALLOWANCE' | 'EMERGENCY' | 'CONSTITUENCY_WORK';
  name: string;
  totalLitres: number;
  usedLitres: number;
  remainingLitres: number;
  period: string;
  status: 'ACTIVE' | 'EXPIRED' | 'USED_UP';
  priority: number; // For ordering sources
  description?: string;
  sessionId?: string;
  programId?: string;
}

interface AllocationPreview {
  selectedSources: Array<{
    sourceId: string;
    sourceName: string;
    allocatedLitres: number;
    remainingAfter: number;
  }>;
  totalAllocated: number;
  allocationMessage: string;
  warningMessage?: string;
}

interface EnhancedAllocationModalProps {
  visible: boolean;
  onCancel: () => void;
  onSubmit: (values: any) => void;
  beneficiary: BeneficiaryProfile | any | null; // Accept any beneficiary-like object
  loading?: boolean;
}

const EnhancedAllocationModal: React.FC<EnhancedAllocationModalProps> = ({
  visible,
  onCancel,
  onSubmit,
  beneficiary,
  loading = false,
}) => {
  const [form] = Form.useForm();
  const [entitlementSources, setEntitlementSources] = useState<EntitlementSource[]>([]);
  const [requestedLitres, setRequestedLitres] = useState<number>(0);
  const [allocationPreview, setAllocationPreview] = useState<AllocationPreview | null>(null);
  const [loadingEntitlements, setLoadingEntitlements] = useState(false);

  useEffect(() => {
    if (visible && beneficiary) {
      loadBeneficiaryEntitlements();
    }
  }, [visible, beneficiary]);

  useEffect(() => {
    if (requestedLitres > 0 && entitlementSources.length > 0) {
      calculateAllocationPreview();
    } else {
      setAllocationPreview(null);
    }
  }, [requestedLitres, entitlementSources]);

  const loadBeneficiaryEntitlements = async () => {
    if (!beneficiary) return;

    setLoadingEntitlements(true);
    try {
      // Mock data - in real implementation, fetch from API
      const mockEntitlements: EntitlementSource[] = [
        {
          id: '1',
          type: 'MONTHLY',
          name: 'Monthly Entitlement - September 2025',
          totalLitres: 300,
          usedLitres: 180,
          remainingLitres: 120,
          period: 'Sep 2025',
          status: 'ACTIVE',
          priority: 1,
          description: 'Regular monthly fuel allocation',
        },
        {
          id: '2',
          type: 'SESSION',
          name: 'National Heroes Day Special Session',
          totalLitres: 80,
          usedLitres: 0,
          remainingLitres: 80,
          period: 'Aug 11-15, 2025',
          status: 'ACTIVE',
          priority: 2,
          description: 'Special allocation for National Heroes Day parliamentary session',
          sessionId: 'session-001',
        },
        {
          id: '3',
          type: 'COMMITTEE',
          name: 'Budget Committee Meetings',
          totalLitres: 50,
          usedLitres: 20,
          remainingLitres: 30,
          period: 'Aug-Sep 2025',
          status: 'ACTIVE',
          priority: 3,
          description: 'Additional allocation for budget committee participation',
        },
        {
          id: '4',
          type: 'TRAVEL_ALLOWANCE',
          name: 'Constituency Work Travel',
          totalLitres: 100,
          usedLitres: 40,
          remainingLitres: 60,
          period: 'Q3 2025',
          status: 'ACTIVE',
          priority: 4,
          description: 'Travel allowance for constituency work',
        },
      ];

      setEntitlementSources(mockEntitlements);
    } catch (error) {
      console.error('Error loading entitlements:', error);
      message.error('Failed to load beneficiary entitlements');
    } finally {
      setLoadingEntitlements(false);
    }
  };

  const calculateAllocationPreview = () => {
    if (!requestedLitres || requestedLitres <= 0) {
      setAllocationPreview(null);
      return;
    }

    // Sort sources by priority (monthly first, then special allocations)
    const availableSources = entitlementSources
      .filter(source => source.remainingLitres > 0 && source.status === 'ACTIVE')
      .sort((a, b) => a.priority - b.priority);

    let remainingToAllocate = requestedLitres;
    const selectedSources: AllocationPreview['selectedSources'] = [];
    let allocationMessage = '';
    let warningMessage = '';

    for (const source of availableSources) {
      if (remainingToAllocate <= 0) break;

      const canAllocateFromSource = Math.min(remainingToAllocate, source.remainingLitres);
      
      if (canAllocateFromSource > 0) {
        selectedSources.push({
          sourceId: source.id,
          sourceName: source.name,
          allocatedLitres: canAllocateFromSource,
          remainingAfter: source.remainingLitres - canAllocateFromSource,
        });
        remainingToAllocate -= canAllocateFromSource;
      }
    }

    // Generate allocation message
    if (selectedSources.length === 1) {
      const source = selectedSources[0];
      allocationMessage = `Allocating ${source.allocatedLitres}L from "${source.sourceName}". Remaining balance: ${source.remainingAfter}L`;
    } else if (selectedSources.length > 1) {
      const sourceDetails = selectedSources.map(s => 
        `${s.allocatedLitres}L from "${s.sourceName}" (${s.remainingAfter}L remaining)`
      ).join('; ');
      allocationMessage = `Allocating from multiple sources: ${sourceDetails}`;
    }

    // Check for warnings
    if (remainingToAllocate > 0) {
      warningMessage = `Insufficient entitlement! Can only allocate ${requestedLitres - remainingToAllocate}L out of ${requestedLitres}L requested. Shortfall: ${remainingToAllocate}L`;
    }

    // Check if using priority allocations (non-monthly)
    const nonMonthlyAllocation = selectedSources.filter(s => 
      !entitlementSources.find(es => es.id === s.sourceId)?.type.includes('MONTHLY')
    );
    
    if (nonMonthlyAllocation.length > 0 && !warningMessage) {
      const specialSources = nonMonthlyAllocation.map(s => s.sourceName).join(', ');
      warningMessage = `Note: Using special allocations (${specialSources}). Consider using monthly entitlement first if available.`;
    }

    setAllocationPreview({
      selectedSources,
      totalAllocated: requestedLitres - remainingToAllocate,
      allocationMessage,
      warningMessage,
    });
  };

  const handleLitresChange = (value: number | null) => {
    setRequestedLitres(value || 0);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      if (!allocationPreview || allocationPreview.totalAllocated === 0) {
        message.error('Please enter a valid allocation amount');
        return;
      }

      // Include allocation preview in submission
      const submissionData = {
        ...values,
        beneficiaryId: beneficiary?.id,
        litresRequested: requestedLitres,
        allocationSources: allocationPreview.selectedSources,
        allocationMessage: allocationPreview.allocationMessage,
        totalAllocated: allocationPreview.totalAllocated,
      };

      await onSubmit(submissionData);
    } catch (error) {
      console.error('Form validation failed:', error);
    }
  };

  const getSourceTypeColor = (type: EntitlementSource['type']) => {
    switch (type) {
      case 'MONTHLY': return 'blue';
      case 'SESSION': return 'green';
      case 'COMMITTEE': return 'orange';
      case 'SPECIAL_EVENT': return 'purple';
      case 'TRAVEL_ALLOWANCE': return 'cyan';
      case 'EMERGENCY': return 'red';
      case 'CONSTITUENCY_WORK': return 'magenta';
      default: return 'default';
    }
  };

  const getSourceTypeLabel = (type: EntitlementSource['type']) => {
    switch (type) {
      case 'MONTHLY': return 'Monthly';
      case 'SESSION': return 'Session';
      case 'COMMITTEE': return 'Committee';
      case 'SPECIAL_EVENT': return 'Special Event';
      case 'TRAVEL_ALLOWANCE': return 'Travel';
      case 'EMERGENCY': return 'Emergency';
      case 'CONSTITUENCY_WORK': return 'Constituency';
      default: return type;
    }
  };

  return (
    <Modal
      title={
        <Space>
          <UserOutlined />
          Enhanced Fuel Allocation
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      width={800}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Cancel
        </Button>,
        <Button
          key="submit"
          type="primary"
          onClick={handleSubmit}
          loading={loading}
          disabled={!allocationPreview || allocationPreview.totalAllocated === 0}
        >
          Allocate Fuel
        </Button>,
      ]}
    >
      {beneficiary && (
        <>
          {/* Beneficiary Info */}
          <Card size="small" style={{ marginBottom: 16 }}>
            <Row gutter={16}>
              <Col span={12}>
                <Statistic
                  title="Beneficiary"
                  value={beneficiary.name || `${beneficiary.user?.first_name || ''} ${beneficiary.user?.last_name || ''}`.trim() || 'Unknown'}
                  prefix={<UserOutlined />}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Position"
                  value={beneficiary.position || beneficiary.vehicle_registration || 'N/A'}
                  prefix={<CarOutlined />}
                />
              </Col>
            </Row>
          </Card>

          {/* Available Entitlements */}
          <Card 
            title={
              <Space>
                <CalendarOutlined />
                Available Entitlements
              </Space>
            }
            size="small"
            style={{ marginBottom: 16 }}
            loading={loadingEntitlements}
          >
            {entitlementSources.length === 0 ? (
              <Alert
                message="No Active Entitlements"
                description="This beneficiary has no active fuel entitlements available."
                type="warning"
                showIcon
              />
            ) : (
              <Space direction="vertical" style={{ width: '100%' }} size="small">
                {entitlementSources.map((source) => (
                  <Card key={source.id} size="small" style={{ backgroundColor: '#fafafa' }}>
                    <Row gutter={16} align="middle">
                      <Col span={12}>
                        <Space direction="vertical" size={0}>
                          <Space>
                            <Tag color={getSourceTypeColor(source.type)}>
                              {getSourceTypeLabel(source.type)}
                            </Tag>
                            <Text strong>{source.name}</Text>
                          </Space>
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            {source.description}
                          </Text>
                          <Text type="secondary" style={{ fontSize: '11px' }}>
                            Period: {source.period}
                          </Text>
                        </Space>
                      </Col>
                      <Col span={8}>
                        <Space direction="vertical" size={0} style={{ width: '100%' }}>
                          <Text style={{ fontSize: '12px' }}>
                            Used: {source.usedLitres}L / {source.totalLitres}L
                          </Text>
                          <Progress 
                            percent={(source.usedLitres / source.totalLitres) * 100}
                            size="small"
                            status={source.remainingLitres === 0 ? 'exception' : 'normal'}
                          />
                        </Space>
                      </Col>
                      <Col span={4}>
                        <Statistic
                          title="Available"
                          value={source.remainingLitres}
                          suffix="L"
                          valueStyle={{ 
                            fontSize: '16px',
                            color: source.remainingLitres > 0 ? '#52c41a' : '#ff4d4f'
                          }}
                        />
                      </Col>
                    </Row>
                  </Card>
                ))}
              </Space>
            )}
          </Card>

          {/* Allocation Form */}
          <Form form={form} layout="vertical">
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="litres"
                  label="Fuel Amount (Litres)"
                  rules={[
                    { required: true, message: 'Please enter fuel amount' },
                    { min: 1, type: 'number', message: 'Amount must be greater than 0' },
                  ]}
                >
                  <InputNumber
                    min={1}
                    max={500}
                    placeholder="Enter litres"
                    style={{ width: '100%' }}
                    onChange={handleLitresChange}
                    addonAfter="L"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="purpose"
                  label="Allocation Purpose"
                  rules={[{ required: true, message: 'Please select purpose' }]}
                >
                  <Select placeholder="Select purpose">
                    <Option value="MONTHLY_USAGE">Monthly Usage</Option>
                    <Option value="SESSION_ATTENDANCE">Session Attendance</Option>
                    <Option value="COMMITTEE_MEETING">Committee Meeting</Option>
                    <Option value="CONSTITUENCY_WORK">Constituency Work</Option>
                    <Option value="EMERGENCY">Emergency</Option>
                    <Option value="OTHER">Other</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="notes"
              label="Notes"
            >
              <TextArea
                rows={2}
                placeholder="Additional notes about this allocation..."
              />
            </Form.Item>
          </Form>

          {/* Allocation Preview */}
          {allocationPreview && (
            <Card 
              title={
                <Space>
                  <InfoCircleOutlined />
                  Allocation Preview
                </Space>
              }
              size="small"
              style={{ marginTop: 16 }}
            >
              {allocationPreview.warningMessage && (
                <Alert
                  message={allocationPreview.warningMessage}
                  type={allocationPreview.warningMessage.includes('Insufficient') ? 'error' : 'warning'}
                  showIcon
                  style={{ marginBottom: 12 }}
                />
              )}
              
              <Alert
                message="Allocation Summary"
                description={allocationPreview.allocationMessage}
                type="info"
                showIcon
                icon={<CheckCircleOutlined />}
              />

              {allocationPreview.selectedSources.length > 1 && (
                <div style={{ marginTop: 12 }}>
                  <Title level={5}>Source Breakdown:</Title>
                  {allocationPreview.selectedSources.map((source, index) => (
                    <div key={index} style={{ marginLeft: 16, marginBottom: 4 }}>
                      <Text style={{ fontSize: '12px' }}>
                        • {source.allocatedLitres}L from "{source.sourceName}" 
                        <Text type="secondary"> (remaining: {source.remainingAfter}L)</Text>
                      </Text>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}
        </>
      )}
    </Modal>
  );
};

export default EnhancedAllocationModal;