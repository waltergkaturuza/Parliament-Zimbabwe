// src/components/CentralizedBookGenerator.tsx
import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  InputNumber,
  Button,
  Alert,
  Steps,
  Table,
  Space,
  Tag,
  message,
  Modal,
  Descriptions,
  Divider,
  Row,
  Col,
  Checkbox
} from 'antd';
import {
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  LoadingOutlined,
  BookOutlined,
  SafetyOutlined
} from '@ant-design/icons';
import { bookGenerationAPI, type BookGenerationRequest, type ValidationResult, type GenerationResult } from '../api/bookGeneration';
import { validateSerial, calculateBookRanges, validateContinuity } from '../utils/petrotradeSerials';

const { Step } = Steps;

interface CentralizedBookGeneratorProps {
  boxId: number;
  onSuccess?: (result: GenerationResult) => void;
  onClose?: () => void;
}

const CentralizedBookGenerator: React.FC<CentralizedBookGeneratorProps> = ({
  boxId,
  onSuccess,
  onClose
}) => {
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [generationResult, setGenerationResult] = useState<GenerationResult | null>(null);

  // Form data
  const [formData, setFormData] = useState<BookGenerationRequest>({
    box_id: boxId,
    first_serial: '',
    last_serial: '',
    books_per_box: 10,
    coupons_per_book: 100,
    force: false
  });

  // Step 1: Validate the generation request
  const handleValidate = async () => {
    try {
      setLoading(true);
      
      // Validate form
      const values = await form.validateFields();
      const requestData = {
        ...formData,
        ...values,
        box_id: boxId
      };

      // Frontend validation first
      if (!validateSerial(requestData.first_serial)) {
        message.error('Invalid first serial format. Expected format: PU006H1355101');
        return;
      }

      if (!validateSerial(requestData.last_serial)) {
        message.error('Invalid last serial format. Expected format: PU006H1356100');
        return;
      }

      // Call backend validation
      const validationResult = await bookGenerationAPI.validateRequest(requestData);
      setValidation(validationResult);
      setFormData(requestData);

      if (validationResult.valid) {
        setCurrentStep(1);
        message.success('Validation successful! Review the plan below.');
      } else {
        message.error('Validation failed. Please check the errors below.');
      }

    } catch (error: any) {
      console.error('Validation error:', error);
      message.error('Validation failed: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Generate books and coupons
  const handleGenerate = async () => {
    if (!validation?.valid) {
      message.error('Please validate the request first');
      return;
    }

    Modal.confirm({
      title: 'Confirm Book Generation',
      content: (
        <div>
          <p><strong>⚠️ IMPORTANT:</strong> This is the SINGLE SOURCE OF TRUTH for book generation.</p>
          <p>This will create:</p>
          <ul>
            <li><strong>{validation.plan.total_books}</strong> books</li>
            <li><strong>{validation.plan.total_coupons}</strong> coupons</li>
            <li>Serial range: <strong>{formData.first_serial}</strong> to <strong>{formData.last_serial}</strong></li>
          </ul>
          <p>Are you sure you want to proceed?</p>
        </div>
      ),
      onOk: async () => {
        try {
          setLoading(true);
          
          const result = await bookGenerationAPI.generateBooks(formData);
          setGenerationResult(result);

          if (result.success) {
            setCurrentStep(2);
            message.success('Books generated successfully!');
            onSuccess?.(result);
          } else {
            message.error('Generation failed: ' + result.message);
          }

        } catch (error: any) {
          console.error('Generation error:', error);
          message.error('Generation failed: ' + (error.response?.data?.message || error.message));
        } finally {
          setLoading(false);
        }
      }
    });
  };

  // Render validation results
  const renderValidationResults = () => {
    if (!validation) return null;

    return (
      <div>
        {/* Validation Status */}
        <Alert
          message={validation.valid ? 'Validation Successful' : 'Validation Failed'}
          type={validation.valid ? 'success' : 'error'}
          showIcon
          style={{ marginBottom: 16 }}
        />

        {/* Errors */}
        {validation.errors.length > 0 && (
          <Alert
            message="Validation Errors"
            description={
              <ul>
                {validation.errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            }
            type="error"
            style={{ marginBottom: 16 }}
          />
        )}

        {/* Warnings */}
        {validation.warnings.length > 0 && (
          <Alert
            message="Warnings"
            description={
              <ul>
                {validation.warnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            }
            type="warning"
            style={{ marginBottom: 16 }}
          />
        )}

        {/* Generation Plan */}
        {validation.valid && validation.plan && (
          <Card title="📋 Generation Plan" style={{ marginBottom: 16 }}>
            <Descriptions column={2} bordered>
              <Descriptions.Item label="Box Code">{validation.plan.box.box_code}</Descriptions.Item>
              <Descriptions.Item label="Fuel Type">{validation.plan.box.fuel_type}</Descriptions.Item>
              <Descriptions.Item label="Denomination">${validation.plan.box.denomination}</Descriptions.Item>
              <Descriptions.Item label="Total Books">{validation.plan.total_books}</Descriptions.Item>
              <Descriptions.Item label="Total Coupons">{validation.plan.total_coupons}</Descriptions.Item>
              <Descriptions.Item label="Expected Coupons">{validation.plan.expected_coupons}</Descriptions.Item>
            </Descriptions>

            <Divider orientation="left">Book Breakdown</Divider>
            <Table
              dataSource={validation.plan.book_ranges}
              pagination={false}
              size="small"
              columns={[
                {
                  title: 'Book #',
                  dataIndex: 'book_number',
                  key: 'book_number',
                  render: (num) => <Tag color="blue">Book {num}</Tag>
                },
                {
                  title: 'First Coupon',
                  dataIndex: 'first_coupon',
                  key: 'first_coupon',
                  render: (serial) => <code>{serial}</code>
                },
                {
                  title: 'Last Coupon',
                  dataIndex: 'last_coupon',
                  key: 'last_coupon',
                  render: (serial) => <code>{serial}</code>
                },
                {
                  title: 'Coupons',
                  dataIndex: 'coupon_count',
                  key: 'coupon_count',
                  render: (count) => <Tag color="green">{count} coupons</Tag>
                }
              ]}
            />
          </Card>
        )}
      </div>
    );
  };

  // Render generation results
  const renderGenerationResults = () => {
    if (!generationResult) return null;

    return (
      <div>
        <Alert
          message={generationResult.success ? 'Generation Successful!' : 'Generation Failed'}
          description={generationResult.message}
          type={generationResult.success ? 'success' : 'error'}
          showIcon
          style={{ marginBottom: 16 }}
        />

        {generationResult.success && generationResult.data && (
          <Card title="🎉 Generation Results">
            <Descriptions column={2} bordered>
              <Descriptions.Item label="Box Code">{generationResult.data.box_code}</Descriptions.Item>
              <Descriptions.Item label="Books Created">{generationResult.data.books_created}</Descriptions.Item>
              <Descriptions.Item label="Coupons Created">{generationResult.data.coupons_created}</Descriptions.Item>
              <Descriptions.Item label="Serial Range">
                {generationResult.data.serial_range.first} - {generationResult.data.serial_range.last}
              </Descriptions.Item>
            </Descriptions>

            <Divider orientation="left">Created Books</Divider>
            <Table
              dataSource={generationResult.data.book_details}
              pagination={false}
              size="small"
              columns={[
                {
                  title: 'Book #',
                  dataIndex: 'book_number',
                  key: 'book_number',
                  render: (num) => <Tag color="blue">Book {num}</Tag>
                },
                {
                  title: 'First Coupon',
                  dataIndex: 'first_coupon',
                  key: 'first_coupon',
                  render: (serial) => <code>{serial}</code>
                },
                {
                  title: 'Last Coupon',
                  dataIndex: 'last_coupon',
                  key: 'last_coupon',
                  render: (serial) => <code>{serial}</code>
                },
                {
                  title: 'Total Coupons',
                  dataIndex: 'total_coupons',
                  key: 'total_coupons',
                  render: (count) => <Tag color="green">{count} coupons</Tag>
                }
              ]}
            />
          </Card>
        )}

        {generationResult.errors && generationResult.errors.length > 0 && (
          <Alert
            message="Generation Errors"
            description={
              <ul>
                {generationResult.errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            }
            type="error"
            style={{ marginTop: 16 }}
          />
        )}
      </div>
    );
  };

  return (
    <Card title="📚 Centralized Book Generator" extra={onClose && <Button onClick={onClose}>Close</Button>}>
      <Alert
        message="⚠️ SINGLE SOURCE OF TRUTH"
        description="This is the centralized book generation system. All book generation MUST go through this service to prevent mismatches with real physical coupons."
        type="warning"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Steps current={currentStep} style={{ marginBottom: 24 }}>
        <Step 
          title="Configure & Validate" 
          icon={currentStep === 0 && loading ? <LoadingOutlined /> : <SafetyOutlined />}
        />
        <Step 
          title="Review & Generate" 
          icon={currentStep === 1 && loading ? <LoadingOutlined /> : <BookOutlined />}
        />
        <Step 
          title="Complete" 
          icon={<CheckCircleOutlined />}
        />
      </Steps>

      {/* Step 0: Configuration */}
      {currentStep === 0 && (
        <Form
          form={form}
          layout="vertical"
          initialValues={formData}
          onValuesChange={(_, allValues) => setFormData({ ...formData, ...allValues })}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="First Serial Number"
                name="first_serial"
                rules={[
                  { required: true, message: 'Please enter the first serial number' },
                  {
                    validator: (_, value) => {
                      if (value && !validateSerial(value)) {
                        return Promise.reject('Invalid serial format. Expected: PU006H1355101');
                      }
                      return Promise.resolve();
                    }
                  }
                ]}
              >
                <Input placeholder="PU006H1355101" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Last Serial Number"
                name="last_serial"
                rules={[
                  { required: true, message: 'Please enter the last serial number' },
                  {
                    validator: (_, value) => {
                      if (value && !validateSerial(value)) {
                        return Promise.reject('Invalid serial format. Expected: PU006H1356100');
                      }
                      return Promise.resolve();
                    }
                  }
                ]}
              >
                <Input placeholder="PU006H1356100" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="Books per Box"
                name="books_per_box"
                rules={[{ required: true, message: 'Please enter books per box' }]}
              >
                <InputNumber min={1} max={50} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Coupons per Book"
                name="coupons_per_book"
                rules={[{ required: true, message: 'Please enter coupons per book' }]}
              >
                <InputNumber min={1} max={1000} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="force" valuePropName="checked">
                <Checkbox>Force regeneration (delete existing books)</Checkbox>
              </Form.Item>
            </Col>
          </Row>

          <Space>
            <Button type="primary" onClick={handleValidate} loading={loading}>
              Validate Configuration
            </Button>
          </Space>
        </Form>
      )}

      {/* Step 1: Validation Results */}
      {currentStep === 1 && (
        <div>
          {renderValidationResults()}
          
          {validation?.valid && (
            <div style={{ marginTop: 16, textAlign: 'center' }}>
              <Space>
                <Button onClick={() => setCurrentStep(0)}>Back to Configuration</Button>
                <Button type="primary" onClick={handleGenerate} loading={loading}>
                  Generate Books & Coupons
                </Button>
              </Space>
            </div>
          )}
        </div>
      )}

      {/* Step 2: Generation Results */}
      {currentStep === 2 && (
        <div>
          {renderGenerationResults()}
          
          <div style={{ marginTop: 16, textAlign: 'center' }}>
            <Space>
              <Button onClick={() => { setCurrentStep(0); setValidation(null); setGenerationResult(null); }}>
                Generate Another Box
              </Button>
              {onClose && (
                <Button type="primary" onClick={onClose}>
                  Close
                </Button>
              )}
            </Space>
          </div>
        </div>
      )}
    </Card>
  );
};

export default CentralizedBookGenerator;
