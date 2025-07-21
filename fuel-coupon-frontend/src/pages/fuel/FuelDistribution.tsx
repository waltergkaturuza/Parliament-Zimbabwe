// src/pages/fuel/FuelDistribution.tsx
import { useState, useEffect } from 'react';
import type { FC } from 'react';
import {
  Card,
  Table,
  Button,
  Form,
  Modal,
  Input,
  Select,
  Typography,
  Row,
  Col,
  Statistic,
  Tag,
  Space,
  DatePicker,
  InputNumber,
  message,
  Descriptions,
} from 'antd';
import {
  CarOutlined,
  UserOutlined,
  FileTextOutlined,
  PlusOutlined,
  EyeOutlined,
  PrinterOutlined,
} from '@ant-design/icons';
import { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

interface DistributionRecord {
  id: string;
  couponNumber: string;
  beneficiaryName: string;
  beneficiaryId: string;
  fuelType: 'PETROL' | 'DIESEL';
  litres: number;
  distributionDate: string;
  status: 'DISTRIBUTED' | 'USED' | 'EXPIRED';
  issuedBy: string;
}

interface Beneficiary {
  id: string;
  name: string;
  parliamentId: string;
  constituency: string;
  allocatedLitres: number;
  usedLitres: number;
}

const FuelDistribution: FC = () => {
  const [distributions, setDistributions] = useState<DistributionRecord[]>([]);
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchDistributions();
    fetchBeneficiaries();
  }, []);

  const fetchDistributions = async () => {
    try {
      // Replace with actual API call
      const mockData: DistributionRecord[] = [
        {
          id: '1',
          couponNumber: 'CP-2024-001',
          beneficiaryName: 'Hon. John Mukamuri',
          beneficiaryId: 'MP-001',
          fuelType: 'PETROL',
          litres: 20,
          distributionDate: '2024-07-04',
          status: 'DISTRIBUTED',
          issuedBy: 'Sub Center Officer',
        },
        {
          id: '2',
          couponNumber: 'CP-2024-002',
          beneficiaryName: 'Hon. Mary Chivanga',
          beneficiaryId: 'MP-002',
          fuelType: 'DIESEL',
          litres: 5,
          distributionDate: '2024-07-03',
          status: 'USED',
          issuedBy: 'Sub Center Officer',
        },
      ];
      setDistributions(mockData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching distributions:', error);
      setLoading(false);
    }
  };

  const fetchBeneficiaries = async () => {
    try {
      // Replace with actual API call
      const mockData: Beneficiary[] = [
        {
          id: 'MP-001',
          name: 'Hon. John Mukamuri',
          parliamentId: 'MP-001',
          constituency: 'Harare South',
          allocatedLitres: 100,
          usedLitres: 40,
        },
        {
          id: 'MP-002',
          name: 'Hon. Mary Chivanga',
          parliamentId: 'MP-002',
          constituency: 'Harare North',
          allocatedLitres: 80,
          usedLitres: 25,
        },
      ];
      setBeneficiaries(mockData);
    } catch (error) {
      console.error('Error fetching beneficiaries:', error);
    }
  };

  const columns: ColumnsType<DistributionRecord> = [
    {
      title: 'Coupon Number',
      dataIndex: 'couponNumber',
      key: 'couponNumber',
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: 'Beneficiary',
      key: 'beneficiary',
      render: (_, record) => (
        <div>
          <Text>{record.beneficiaryName}</Text>
          <br />
          <Text type="secondary">{record.beneficiaryId}</Text>
        </div>
      ),
    },
    {
      title: 'Fuel Type',
      dataIndex: 'fuelType',
      key: 'fuelType',
      render: (type) => (
        <Tag color={type === 'PETROL' ? 'blue' : 'orange'} icon={<CarOutlined />}>
          {type}
        </Tag>
      ),
    },
    {
      title: 'Litres',
      dataIndex: 'litres',
      key: 'litres',
      render: (litres) => <Text strong>{litres}L</Text>,
    },
    {
      title: 'Distribution Date',
      dataIndex: 'distributionDate',
      key: 'distributionDate',
      render: (date) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const colors = {
          DISTRIBUTED: 'blue',
          USED: 'green',
          EXPIRED: 'red',
        };
        return <Tag color={colors[status as keyof typeof colors]}>{status}</Tag>;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button 
            type="link" 
            icon={<EyeOutlined />} 
            size="small"
          >
            View
          </Button>
          <Button 
            type="link" 
            icon={<PrinterOutlined />} 
            size="small"
          >
            Print
          </Button>
        </Space>
      ),
    },
  ];

  const handleDistribute = async (values: any) => {
    try {
      // API call to distribute fuel
      message.success('Fuel coupon distributed successfully');
      setModalVisible(false);
      form.resetFields();
      fetchDistributions(); // Refresh data
    } catch (error) {
      message.error('Failed to distribute fuel coupon');
    }
  };

  const todayDistributions = distributions.filter(d => 
    d.distributionDate === new Date().toISOString().split('T')[0]
  ).length;

  const totalLitresDistributed = distributions.reduce((sum, d) => sum + d.litres, 0);

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0, color: '#1890ff' }}>
          <CarOutlined /> Fuel Distribution
        </Title>
        <Text type="secondary">Distribute fuel coupons to parliament members</Text>
      </div>

      {/* Quick Stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Today's Distributions"
              value={todayDistributions}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Total Litres Distributed"
              value={totalLitresDistributed}
              suffix="L"
              prefix={<CarOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Active Beneficiaries"
              value={beneficiaries.length}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        {/* Distribution History */}
        <Col xs={24} lg={16}>
          <Card 
            title="Distribution History" 
            extra={
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={() => setModalVisible(true)}
              >
                New Distribution
              </Button>
            }
          >
            <Table
              columns={columns}
              dataSource={distributions}
              rowKey="id"
              loading={loading}
              scroll={{ x: 800 }}
              pagination={{
                pageSize: 8,
                showSizeChanger: false,
                showQuickJumper: true,
              }}
            />
          </Card>
        </Col>

        {/* Beneficiary Summary */}
        <Col xs={24} lg={8}>
          <Card title="Beneficiary Summary">
            {beneficiaries.map(beneficiary => (
              <Card key={beneficiary.id} size="small" style={{ marginBottom: 8 }}>
                <Descriptions size="small" column={1}>
                  <Descriptions.Item label="Name">{beneficiary.name}</Descriptions.Item>
                  <Descriptions.Item label="ID">{beneficiary.parliamentId}</Descriptions.Item>
                  <Descriptions.Item label="Constituency">{beneficiary.constituency}</Descriptions.Item>
                  <Descriptions.Item label="Usage">
                    {beneficiary.usedLitres}L / {beneficiary.allocatedLitres}L
                    <div style={{ marginTop: 4 }}>
                      <div 
                        style={{
                          width: '100%',
                          height: '6px',
                          backgroundColor: '#f0f0f0',
                          borderRadius: '3px',
                          overflow: 'hidden',
                        }}
                      >
                        <div 
                          style={{
                            width: `${(beneficiary.usedLitres / beneficiary.allocatedLitres) * 100}%`,
                            height: '100%',
                            backgroundColor: '#1890ff',
                          }}
                        />
                      </div>
                    </div>
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            ))}
          </Card>
        </Col>
      </Row>

      {/* Distribution Modal */}
      <Modal
        title="Distribute Fuel Coupon"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleDistribute}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="beneficiaryId"
                label="Beneficiary"
                rules={[{ required: true, message: 'Please select beneficiary' }]}
              >
                <Select placeholder="Select beneficiary">
                  {beneficiaries.map(b => (
                    <Option key={b.id} value={b.id}>
                      {b.name} ({b.parliamentId})
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="fuelType"
                label="Fuel Type"
                rules={[{ required: true, message: 'Please select fuel type' }]}
              >
                <Select placeholder="Select fuel type">
                  <Option value="PETROL">Petrol</Option>
                  <Option value="DIESEL">Diesel</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="litres"
                label="Litres"
                rules={[{ required: true, message: 'Please enter litres' }]}
              >
                <InputNumber
                  min={1}
                  max={20}
                  style={{ width: '100%' }}
                  placeholder="Enter litres"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="distributionDate"
                label="Distribution Date"
                rules={[{ required: true, message: 'Please select date' }]}
              >
                <DatePicker
                  style={{ width: '100%' }}
                  defaultValue={dayjs()}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="notes"
            label="Notes"
          >
            <Input.TextArea
              rows={3}
              placeholder="Any additional notes..."
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Distribute Coupon
              </Button>
              <Button onClick={() => setModalVisible(false)}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default FuelDistribution;
