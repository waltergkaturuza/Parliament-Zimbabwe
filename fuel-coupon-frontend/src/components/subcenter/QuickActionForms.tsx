// src/components/subcenter/QuickActionForms.tsx
import React, { useState } from 'react';
import {
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  DatePicker,
  Button,
  Space,
  Row,
  Col,
  Card,
  Alert,
  message,
  Divider,
  Typography,
  Upload,
  Checkbox,
  TimePicker,
  Radio,
} from 'antd';
import {
  BookOutlined,
  CarOutlined,
  CheckCircleOutlined,
  UploadOutlined,
  UserOutlined,
  AlertOutlined,
  SendOutlined,
  PhoneOutlined,
  FileTextOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import apiClient from '@/api/index';

const { TextArea } = Input;
const { Option } = Select;
const { Title, Text } = Typography;

interface QuickActionFormsProps {
  visible: boolean;
  actionType: 'request_books' | 'distribute_coupons' | 'process_handover' | 'emergency_request' | 'maintenance_report' | 'inventory_update' | null;
  onClose: () => void;
  onSubmit: (data: any) => void;
  subCenterId?: string;
}

const QuickActionForms: React.FC<QuickActionFormsProps> = ({
  visible,
  actionType,
  onClose,
  onSubmit,
  subCenterId
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);
      
      const requestData = {
        ...values,
        action_type: actionType,
        subcenter_id: subCenterId,
        requested_at: new Date().toISOString(),
        status: 'PENDING',
        priority: values.priority || 'NORMAL'
      };

      // Call API to create request and send notification
      const response = await apiClient.post('/subcenter/quick-actions/', requestData);
      
      if (response.status === 201) {
        message.success('Request submitted successfully! Main center has been notified.');
        
        // Send notification to main center
        await apiClient.post('/notifications/send/', {
          recipient_type: 'MAIN_CENTER',
          message_type: actionType?.toUpperCase(),
          title: getNotificationTitle(actionType),
          message: getNotificationMessage(actionType, values),
          data: requestData,
          priority: values.priority || 'NORMAL'
        });
        
        onSubmit(requestData);
        form.resetFields();
        onClose();
      }
    } catch (error) {
      console.error('Error submitting request:', error);
      message.error('Failed to submit request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getNotificationTitle = (type: string | null) => {
    switch (type) {
      case 'request_books':
        return 'Book Request from SubCenter';
      case 'distribute_coupons':
        return 'Coupon Distribution Report';
      case 'process_handover':
        return 'Handover Process Initiated';
      case 'emergency_request':
        return '🚨 Emergency Request';
      case 'maintenance_report':
        return 'Maintenance Report Submitted';
      case 'inventory_update':
        return 'Inventory Update Report';
      default:
        return 'SubCenter Action Required';
    }
  };

  const getNotificationMessage = (type: string | null, values: any) => {
    const subCenterName = 'SubCenter'; // You can get this from context
    switch (type) {
      case 'request_books':
        return `${subCenterName} is requesting ${values.quantity} books of ${values.fuel_type} for ${values.purpose}`;
      case 'distribute_coupons':
        return `${subCenterName} has distributed ${values.coupons_distributed} coupons to ${values.beneficiary_count} beneficiaries`;
      case 'emergency_request':
        return `${subCenterName} has submitted an emergency request: ${values.emergency_type}`;
      default:
        return `${subCenterName} has submitted a ${type?.replace('_', ' ')} request`;
    }
  };

  const renderFormContent = () => {
    switch (actionType) {
      case 'request_books':
        return (
          <>
            <Alert
              message="Book Request Form"
              description="Submit a request for fuel coupon books to main center"
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="fuel_type"
                  label="Fuel Type"
                  rules={[{ required: true, message: 'Please select fuel type' }]}
                >
                  <Select placeholder="Select fuel type">
                    <Option value="PETROL">Petrol</Option>
                    <Option value="DIESEL">Diesel</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="quantity"
                  label="Number of Books"
                  rules={[{ required: true, message: 'Please enter quantity' }]}
                >
                  <InputNumber
                    min={1}
                    max={100}
                    style={{ width: '100%' }}
                    placeholder="e.g., 20"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="coupon_amount"
                  label="Coupon Denomination"
                  rules={[{ required: true, message: 'Please select denomination' }]}
                >
                  <Select placeholder="Select denomination">
                    <Option value="5">5 Litres</Option>
                    <Option value="20">20 Litres</Option>
                    <Option value="50">50 Litres</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="urgency"
                  label="Urgency Level"
                  rules={[{ required: true, message: 'Please select urgency' }]}
                >
                  <Select placeholder="Select urgency">
                    <Option value="LOW">Low - Normal Request</Option>
                    <Option value="NORMAL">Normal - Standard Processing</Option>
                    <Option value="HIGH">High - Urgent Need</Option>
                    <Option value="CRITICAL">Critical - Emergency</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="purpose"
              label="Purpose/Justification"
              rules={[{ required: true, message: 'Please provide purpose' }]}
            >
              <TextArea
                rows={3}
                placeholder="Explain the purpose for this request (e.g., increased demand, upcoming session)"
              />
            </Form.Item>

            <Form.Item
              name="required_by"
              label="Required By Date"
              rules={[{ required: true, message: 'Please select required date' }]}
            >
              <DatePicker 
                style={{ width: '100%' }}
                disabledDate={(current) => current && current < dayjs().endOf('day')}
              />
            </Form.Item>
          </>
        );

      case 'distribute_coupons':
        return (
          <>
            <Alert
              message="Coupon Distribution Report"
              description="Report coupon distribution to beneficiaries"
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="session_name"
                  label="Session/Program Name"
                  rules={[{ required: true, message: 'Please enter session name' }]}
                >
                  <Input placeholder="e.g., Morning Session 1" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="beneficiary_count"
                  label="Number of Beneficiaries"
                  rules={[{ required: true, message: 'Please enter beneficiary count' }]}
                >
                  <InputNumber
                    min={1}
                    style={{ width: '100%' }}
                    placeholder="Total beneficiaries served"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="coupons_distributed"
                  label="Total Coupons Distributed"
                  rules={[{ required: true, message: 'Please enter coupon count' }]}
                >
                  <InputNumber
                    min={1}
                    style={{ width: '100%' }}
                    placeholder="Total coupons given out"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="fuel_type_distributed"
                  label="Fuel Type Distributed"
                  rules={[{ required: true, message: 'Please select fuel type' }]}
                >
                  <Select placeholder="Select fuel type">
                    <Option value="PETROL">Petrol</Option>
                    <Option value="DIESEL">Diesel</Option>
                    <Option value="BOTH">Both Petrol & Diesel</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="distribution_notes"
              label="Distribution Notes"
            >
              <TextArea
                rows={3}
                placeholder="Any issues, observations, or special notes about this distribution..."
              />
            </Form.Item>

            <Form.Item name="issues_encountered" valuePropName="checked">
              <Checkbox>There were issues during distribution</Checkbox>
            </Form.Item>
          </>
        );

      case 'process_handover':
        return (
          <>
            <Alert
              message="Handover Process"
              description="Initiate handover process to main center"
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
            />
            
            <Form.Item
              name="handover_type"
              label="Handover Type"
              rules={[{ required: true, message: 'Please select handover type' }]}
            >
              <Radio.Group>
                <Radio value="REMAINING_STOCK">Remaining Stock Handover</Radio>
                <Radio value="END_OF_SESSION">End of Session Handover</Radio>
                <Radio value="EMERGENCY_HANDOVER">Emergency Handover</Radio>
                <Radio value="ROUTINE_HANDOVER">Routine Handover</Radio>
              </Radio.Group>
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="remaining_books"
                  label="Remaining Books"
                  rules={[{ required: true, message: 'Please enter remaining books' }]}
                >
                  <InputNumber
                    min={0}
                    style={{ width: '100%' }}
                    placeholder="Number of books remaining"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="remaining_coupons"
                  label="Remaining Loose Coupons"
                  rules={[{ required: true, message: 'Please enter remaining coupons' }]}
                >
                  <InputNumber
                    min={0}
                    style={{ width: '100%' }}
                    placeholder="Number of loose coupons"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="handover_reason"
              label="Reason for Handover"
              rules={[{ required: true, message: 'Please provide handover reason' }]}
            >
              <TextArea
                rows={3}
                placeholder="Explain why you are initiating this handover..."
              />
            </Form.Item>

            <Form.Item
              name="pickup_time_preference"
              label="Preferred Pickup Time"
            >
              <TimePicker style={{ width: '100%' }} format="HH:mm" />
            </Form.Item>
          </>
        );

      case 'emergency_request':
        return (
          <>
            <Alert
              message="🚨 Emergency Request"
              description="Submit urgent requests that require immediate attention"
              type="error"
              showIcon
              style={{ marginBottom: 16 }}
            />
            
            <Form.Item
              name="emergency_type"
              label="Emergency Type"
              rules={[{ required: true, message: 'Please select emergency type' }]}
            >
              <Select placeholder="Select emergency type">
                <Option value="SECURITY_INCIDENT">Security Incident</Option>
                <Option value="MEDICAL_EMERGENCY">Medical Emergency</Option>
                <Option value="SYSTEM_FAILURE">System/Equipment Failure</Option>
                <Option value="STOCK_SHORTAGE">Critical Stock Shortage</Option>
                <Option value="TRANSPORT_BREAKDOWN">Transport Breakdown</Option>
                <Option value="OTHER">Other Emergency</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="emergency_description"
              label="Emergency Description"
              rules={[{ required: true, message: 'Please describe the emergency' }]}
            >
              <TextArea
                rows={4}
                placeholder="Describe the emergency situation in detail..."
              />
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="contact_person"
                  label="Contact Person"
                  rules={[{ required: true, message: 'Please enter contact person' }]}
                >
                  <Input placeholder="Person to contact" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="contact_phone"
                  label="Contact Phone"
                  rules={[{ required: true, message: 'Please enter contact phone' }]}
                >
                  <Input placeholder="+263..." />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="immediate_action_required"
              label="Immediate Action Required"
            >
              <TextArea
                rows={2}
                placeholder="What immediate action is needed from main center?"
              />
            </Form.Item>
          </>
        );

      case 'maintenance_report':
        return (
          <>
            <Alert
              message="Maintenance Report"
              description="Report equipment or facility maintenance issues"
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
            />
            
            <Form.Item
              name="equipment_type"
              label="Equipment/Facility Type"
              rules={[{ required: true, message: 'Please select equipment type' }]}
            >
              <Select placeholder="Select equipment type">
                <Option value="COMPUTER_SYSTEM">Computer/IT System</Option>
                <Option value="PRINTER_SCANNER">Printer/Scanner</Option>
                <Option value="VEHICLE">Vehicle</Option>
                <Option value="BUILDING_FACILITY">Building/Facility</Option>
                <Option value="FURNITURE">Furniture</Option>
                <Option value="OTHER">Other Equipment</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="issue_description"
              label="Issue Description"
              rules={[{ required: true, message: 'Please describe the issue' }]}
            >
              <TextArea
                rows={3}
                placeholder="Describe the maintenance issue in detail..."
              />
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="severity"
                  label="Severity Level"
                  rules={[{ required: true, message: 'Please select severity' }]}
                >
                  <Select placeholder="Select severity">
                    <Option value="LOW">Low - Can wait</Option>
                    <Option value="MEDIUM">Medium - Should be fixed soon</Option>
                    <Option value="HIGH">High - Affecting operations</Option>
                    <Option value="CRITICAL">Critical - Operations stopped</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="estimated_cost"
                  label="Estimated Cost (USD)"
                >
                  <InputNumber
                    min={0}
                    style={{ width: '100%' }}
                    placeholder="Estimated repair cost"
                    precision={2}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="photo_evidence"
              label="Photo Evidence"
            >
              <Upload
                listType="picture-card"
                beforeUpload={() => false}
                multiple
              >
                <div>
                  <UploadOutlined />
                  <div style={{ marginTop: 8 }}>Upload Photos</div>
                </div>
              </Upload>
            </Form.Item>
          </>
        );

      case 'inventory_update':
        return (
          <>
            <Alert
              message="Inventory Update Report"
              description="Report current inventory status and discrepancies"
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="books_in_stock"
                  label="Books in Stock"
                  rules={[{ required: true, message: 'Please enter books count' }]}
                >
                  <InputNumber
                    min={0}
                    style={{ width: '100%' }}
                    placeholder="Current book count"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="loose_coupons"
                  label="Loose Coupons"
                  rules={[{ required: true, message: 'Please enter coupon count' }]}
                >
                  <InputNumber
                    min={0}
                    style={{ width: '100%' }}
                    placeholder="Loose coupon count"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="discrepancies_found"
              label="Discrepancies Found"
            >
              <TextArea
                rows={3}
                placeholder="Report any discrepancies between expected and actual inventory..."
              />
            </Form.Item>

            <Form.Item
              name="last_audit_date"
              label="Last Audit Date"
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item name="request_audit" valuePropName="checked">
              <Checkbox>Request formal audit from main center</Checkbox>
            </Form.Item>
          </>
        );

      default:
        return (
          <Alert
            message="Invalid Action"
            description="Please select a valid quick action"
            type="error"
            showIcon
          />
        );
    }
  };

  const getModalTitle = () => {
    switch (actionType) {
      case 'request_books':
        return <><BookOutlined /> Request Books</>;
      case 'distribute_coupons':
        return <><CarOutlined /> Report Distribution</>;
      case 'process_handover':
        return <><CheckCircleOutlined /> Process Handover</>;
      case 'emergency_request':
        return <><AlertOutlined /> Emergency Request</>;
      case 'maintenance_report':
        return <><FileTextOutlined /> Maintenance Report</>;
      case 'inventory_update':
        return <><UserOutlined /> Inventory Update</>;
      default:
        return 'Quick Action';
    }
  };

  return (
    <Modal
      title={getModalTitle()}
      open={visible}
      onCancel={onClose}
      footer={null}
      width={800}
      destroyOnHidden
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
      >
        {renderFormContent()}
        
        <Divider />
        
        <Row justify="end">
          <Space>
            <Button onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              icon={<SendOutlined />}
            >
              Submit Request
            </Button>
          </Space>
        </Row>
      </Form>
    </Modal>
  );
};

export default QuickActionForms;
