// src/pages/fuel/CouponManagement.tsx
import { useState, useCallback } from 'react';
import {
  Table,
  Card,
  Button,
  Space,
  Tag,
  Input,
  Select,
  DatePicker,
  Modal,
  Form,
  Upload,
  Progress,
  Statistic,
  Row,
  Col,
  Tooltip,
  Popconfirm,
  message,
  Drawer,
  Typography,
  Badge,
  Avatar,
  Divider,
  Alert,
  Empty,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  FilterOutlined,
  DownloadOutlined,
  UploadOutlined,
  QrcodeOutlined,
  BarcodeOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  PrinterOutlined,
  ReloadOutlined,
  ExportOutlined,
  ImportOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import QRCode from 'qrcode.react';
import JsBarcode from 'jsbarcode';
import { format } from 'date-fns';

const { Search } = Input;
const { RangePicker } = DatePicker;
const { Title, Text } = Typography;
const { TextArea } = Input;

interface Coupon {
  id: string;
  serialNumber: string;
  barcode: string;
  qrCode: string;
  fuelType: 'PETROL' | 'DIESEL';
  denomination: number;
  status: 'ACTIVE' | 'USED' | 'EXPIRED' | 'CANCELLED';
  beneficiary?: {
    id: string;
    name: string;
    category: string;
  };
  issuedDate: string;
  expiryDate: string;
  usedDate?: string;
  allocation?: {
    id: string;
    name: string;
  };
  createdBy: string;
  lastModified: string;
}

interface CouponFilters {
  search?: string;
  status?: string;
  fuelType?: string;
  beneficiaryCategory?: string;
  dateRange?: [string, string];
  denomination?: number[];
}

const CouponManagement = () => {
  const [filters, setFilters] = useState<CouponFilters>({});
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [bulkActionType, setBulkActionType] = useState<string>('');
  const [createForm] = Form.useForm();
  const queryClient = useQueryClient();

  // Fetch coupons data
  const { data: coupons, isLoading, refetch } = useQuery<Coupon[]>({
    queryKey: ['coupons', filters],
    queryFn: async () => {
      // Simulated data - replace with actual API call
      return Array.from({ length: 50 }, (_, i) => ({
        id: `coup_${i + 1}`,
        serialNumber: `SN${String(i + 1).padStart(6, '0')}`,
        barcode: `123456789${String(i + 1).padStart(3, '0')}`,
        qrCode: `QR${String(i + 1).padStart(8, '0')}`,
        fuelType: Math.random() > 0.5 ? 'PETROL' : 'DIESEL',
        denomination: [50, 100, 200, 500][Math.floor(Math.random() * 4)],
        status: ['ACTIVE', 'USED', 'EXPIRED', 'CANCELLED'][Math.floor(Math.random() * 4)] as any,
        beneficiary: Math.random() > 0.3 ? {
          id: `ben_${i + 1}`,
          name: `Hon. Beneficiary ${i + 1}`,
          category: ['MP', 'SENATOR', 'STAFF'][Math.floor(Math.random() * 3)],
        } : undefined,
        issuedDate: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
        expiryDate: new Date(Date.now() + Math.random() * 180 * 24 * 60 * 60 * 1000).toISOString(),
        usedDate: Math.random() > 0.7 ? new Date().toISOString() : undefined,
        allocation: {
          id: `alloc_${Math.floor(i / 10) + 1}`,
          name: `Monthly Allocation ${Math.floor(i / 10) + 1}`,
        },
        createdBy: 'System Admin',
        lastModified: new Date().toISOString(),
      }));
    },
  });

  // Create coupon mutation
  const createCouponMutation = useMutation({
    mutationFn: async (data: any) => {
      // Simulated API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      return data;
    },
    onSuccess: () => {
      message.success('Coupon created successfully');
      setIsCreateModalOpen(false);
      createForm.resetFields();
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
    },
    onError: () => {
      message.error('Failed to create coupon');
    },
  });

  // Bulk actions mutation
  const bulkActionMutation = useMutation({
    mutationFn: async ({ action, couponIds }: { action: string; couponIds: string[] }) => {
      // Simulated API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      return { action, couponIds };
    },
    onSuccess: (data) => {
      message.success(`Successfully ${data.action} ${data.couponIds.length} coupons`);
      setSelectedRowKeys([]);
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
    },
    onError: () => {
      message.error('Bulk action failed');
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'success';
      case 'USED': return 'default';
      case 'EXPIRED': return 'warning';
      case 'CANCELLED': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE': return <CheckCircleOutlined />;
      case 'USED': return <CloseCircleOutlined />;
      case 'EXPIRED': return <ClockCircleOutlined />;
      case 'CANCELLED': return <WarningOutlined />;
      default: return null;
    }
  };

  const handleBulkAction = (action: string) => {
    if (selectedRowKeys.length === 0) {
      message.warning('Please select coupons first');
      return;
    }

    Modal.confirm({
      title: `${action.charAt(0).toUpperCase() + action.slice(1)} Selected Coupons`,
      content: `Are you sure you want to ${action.toLowerCase()} ${selectedRowKeys.length} coupon(s)?`,
      onOk: () => {
        bulkActionMutation.mutate({ action, couponIds: selectedRowKeys });
      },
    });
  };

  const handlePrintCoupon = (coupon: Coupon) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Coupon - ${coupon.serialNumber}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              .coupon { border: 2px solid #000; padding: 20px; margin: 20px; }
              .header { text-align: center; margin-bottom: 20px; }
              .details { margin: 10px 0; }
              .qr-code { text-align: center; margin: 20px 0; }
            </style>
          </head>
          <body>
            <div class="coupon">
              <div class="header">
                <h2>Parliament of Zimbabwe</h2>
                <h3>Fuel Coupon</h3>
              </div>
              <div class="details">
                <p><strong>Serial Number:</strong> ${coupon.serialNumber}</p>
                <p><strong>Fuel Type:</strong> ${coupon.fuelType}</p>
                <p><strong>Denomination:</strong> $${coupon.denomination}</p>
                <p><strong>Issued Date:</strong> ${format(new Date(coupon.issuedDate), 'yyyy-MM-dd')}</p>
                <p><strong>Expiry Date:</strong> ${format(new Date(coupon.expiryDate), 'yyyy-MM-dd')}</p>
              </div>
              <div class="qr-code">
                <canvas id="qr-code"></canvas>
                <p>QR Code: ${coupon.qrCode}</p>
              </div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const columns = [
    {
      title: 'Serial Number',
      dataIndex: 'serialNumber',
      key: 'serialNumber',
      sorter: true,
      render: (text: string, record: Coupon) => (
        <div className="flex items-center gap-2">
          <Text strong>{text}</Text>
          <div className="flex gap-1">
            <Tooltip title="View QR Code">
              <Button
                type="text"
                size="small"
                icon={<QrcodeOutlined />}
                onClick={() => {
                  setSelectedCoupon(record);
                  setIsDetailDrawerOpen(true);
                }}
              />
            </Tooltip>
            <Tooltip title="Print">
              <Button
                type="text"
                size="small"
                icon={<PrinterOutlined />}
                onClick={() => handlePrintCoupon(record)}
              />
            </Tooltip>
          </div>
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      filters: [
        { text: 'Active', value: 'ACTIVE' },
        { text: 'Used', value: 'USED' },
        { text: 'Expired', value: 'EXPIRED' },
        { text: 'Cancelled', value: 'CANCELLED' },
      ],
      render: (status: string) => (
        <Tag color={getStatusColor(status)} icon={getStatusIcon(status)}>
          {status}
        </Tag>
      ),
    },
    {
      title: 'Fuel Type',
      dataIndex: 'fuelType',
      key: 'fuelType',
      filters: [
        { text: 'Petrol', value: 'PETROL' },
        { text: 'Diesel', value: 'DIESEL' },
      ],
      render: (type: string) => (
        <Tag color={type === 'PETROL' ? 'blue' : 'orange'}>{type}</Tag>
      ),
    },
    {
      title: 'Denomination',
      dataIndex: 'denomination',
      key: 'denomination',
      sorter: true,
      render: (amount: number) => `$${amount}`,
    },
    {
      title: 'Beneficiary',
      key: 'beneficiary',
      render: (record: Coupon) => {
        if (!record.beneficiary) {
          return <Text type="secondary">Unassigned</Text>;
        }
        return (
          <div className="flex items-center gap-2">
            <Avatar size="small" icon={<div>{record.beneficiary.name.charAt(0)}</div>} />
            <div>
              <div>{record.beneficiary.name}</div>
              <Tag>{record.beneficiary.category}</Tag>
            </div>
          </div>
        );
      },
    },
    {
      title: 'Issued Date',
      dataIndex: 'issuedDate',
      key: 'issuedDate',
      sorter: true,
      render: (date: string) => format(new Date(date), 'yyyy-MM-dd'),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (record: Coupon) => (
        <Space size="small">
          <Tooltip title="View Details">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => {
                setSelectedCoupon(record);
                setIsDetailDrawerOpen(true);
              }}
            />
          </Tooltip>
          <Tooltip title="Edit">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              disabled={record.status === 'USED'}
            />
          </Tooltip>
          <Popconfirm
            title="Are you sure you want to cancel this coupon?"
            onConfirm={() => handleBulkAction('cancel')}
            disabled={record.status !== 'ACTIVE'}
          >
            <Tooltip title="Cancel">
              <Button
                type="text"
                size="small"
                icon={<DeleteOutlined />}
                disabled={record.status !== 'ACTIVE'}
                danger
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: React.Key[]) => setSelectedRowKeys(keys as string[]),
    getCheckboxProps: (record: Coupon) => ({
      disabled: record.status === 'USED',
    }),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Title level={2}>Coupon Management</Title>
          <Text type="secondary">
            Manage fuel coupons, track usage, and monitor distribution
          </Text>
        </div>
        <Space>
          <Button icon={<ImportOutlined />}>Import</Button>
          <Button icon={<ExportOutlined />}>Export</Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsCreateModalOpen(true)}
          >
            Create Coupon
          </Button>
        </Space>
      </div>

      {/* Statistics */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Total Coupons"
              value={coupons?.length || 0}
              prefix={<FileTextOutlined className="text-blue-600" />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Active"
              value={coupons?.filter(c => c.status === 'ACTIVE').length || 0}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Used"
              value={coupons?.filter(c => c.status === 'USED').length || 0}
              valueStyle={{ color: '#1890ff' }}
              prefix={<CloseCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Total Value"
              value={coupons?.reduce((sum, c) => sum + c.denomination, 0) || 0}
              prefix="$"
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card>
        <div className="flex flex-wrap gap-4 items-center">
          <Search
            placeholder="Search by serial number or beneficiary"
            style={{ width: 250 }}
            onSearch={(value: string) => setFilters({ ...filters, search: value })}
          />
          <Select
            placeholder="Status"
            style={{ width: 120 }}
            allowClear
            onChange={(value) => setFilters({ ...filters, status: value })}
            options={[
              { label: 'Active', value: 'ACTIVE' },
              { label: 'Used', value: 'USED' },
              { label: 'Expired', value: 'EXPIRED' },
              { label: 'Cancelled', value: 'CANCELLED' },
            ]}
          />
          <Select
            placeholder="Fuel Type"
            style={{ width: 120 }}
            allowClear
            onChange={(value) => setFilters({ ...filters, fuelType: value })}
            options={[
              { label: 'Petrol', value: 'PETROL' },
              { label: 'Diesel', value: 'DIESEL' },
            ]}
          />
          <RangePicker
            onChange={(dates) => 
              setFilters({
                ...filters,
                dateRange: dates ? [dates[0]!.toISOString(), dates[1]!.toISOString()] : undefined
              })
            }
          />
          <Button icon={<ReloadOutlined />} onClick={() => refetch()}>
            Refresh
          </Button>
        </div>
      </Card>

      {/* Bulk Actions */}
      {selectedRowKeys.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Alert
            message={
              <div className="flex items-center justify-between">
                <span>{selectedRowKeys.length} coupon(s) selected</span>
                <Space>
                  <Button size="small" onClick={() => handleBulkAction('activate')}>
                    Activate
                  </Button>
                  <Button size="small" onClick={() => handleBulkAction('cancel')}>
                    Cancel
                  </Button>
                  <Button size="small" onClick={() => handleBulkAction('export')}>
                    Export
                  </Button>
                </Space>
              </div>
            }
            type="info"
            closable
            onClose={() => setSelectedRowKeys([])}
          />
        </motion.div>
      )}

      {/* Main Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={coupons}
          rowKey="id"
          rowSelection={rowSelection}
          loading={isLoading}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} of ${total} coupons`,
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* Create Coupon Modal */}
      <Modal
        title="Create New Coupon"
        open={isCreateModalOpen}
        onCancel={() => setIsCreateModalOpen(false)}
        footer={null}
        width={600}
      >
        <Form
          form={createForm}
          layout="vertical"
          onFinish={(values) => createCouponMutation.mutate(values)}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="fuelType"
                label="Fuel Type"
                rules={[{ required: true }]}
              >
                <Select
                  options={[
                    { label: 'Petrol', value: 'PETROL' },
                    { label: 'Diesel', value: 'DIESEL' },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="denomination"
                label="Denomination ($)"
                rules={[{ required: true }]}
              >
                <Select
                  options={[
                    { label: '$50', value: 50 },
                    { label: '$100', value: 100 },
                    { label: '$200', value: 200 },
                    { label: '$500', value: 500 },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="quantity"
                label="Quantity"
                rules={[{ required: true }]}
              >
                <Input type="number" min={1} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="expiryMonths"
                label="Expiry (Months)"
                rules={[{ required: true }]}
              >
                <Select
                  options={[
                    { label: '3 Months', value: 3 },
                    { label: '6 Months', value: 6 },
                    { label: '12 Months', value: 12 },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="notes" label="Notes">
            <TextArea rows={3} />
          </Form.Item>
          <div className="flex justify-end gap-2">
            <Button onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={createCouponMutation.isPending}
            >
              Create Coupons
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Coupon Detail Drawer */}
      <Drawer
        title="Coupon Details"
        open={isDetailDrawerOpen}
        onClose={() => setIsDetailDrawerOpen(false)}
        width={600}
      >
        {selectedCoupon && (
          <div className="space-y-6">
            <div className="text-center">
              <Title level={4}>{selectedCoupon.serialNumber}</Title>
              <Tag color={getStatusColor(selectedCoupon.status)}>
                {selectedCoupon.status}
              </Tag>
            </div>

            <Divider />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Text type="secondary">Fuel Type</Text>
                <div><Tag color={selectedCoupon.fuelType === 'PETROL' ? 'blue' : 'orange'}>{selectedCoupon.fuelType}</Tag></div>
              </div>
              <div>
                <Text type="secondary">Denomination</Text>
                <div><Text strong>${selectedCoupon.denomination}</Text></div>
              </div>
              <div>
                <Text type="secondary">Issued Date</Text>
                <div>{format(new Date(selectedCoupon.issuedDate), 'yyyy-MM-dd HH:mm')}</div>
              </div>
              <div>
                <Text type="secondary">Expiry Date</Text>
                <div>{format(new Date(selectedCoupon.expiryDate), 'yyyy-MM-dd HH:mm')}</div>
              </div>
            </div>

            {selectedCoupon.beneficiary && (
              <>
                <Divider>Beneficiary Information</Divider>
                <div className="flex items-center gap-4">
                  <Avatar size="large">{selectedCoupon.beneficiary.name.charAt(0)}</Avatar>
                  <div>
                    <div><Text strong>{selectedCoupon.beneficiary.name}</Text></div>
                    <Tag>{selectedCoupon.beneficiary.category}</Tag>
                  </div>
                </div>
              </>
            )}

            <Divider>QR Code & Barcode</Divider>
            <div className="text-center space-y-4">
              <div>
                <QRCode value={selectedCoupon.qrCode} size={200} />
                <div className="mt-2"><Text type="secondary">{selectedCoupon.qrCode}</Text></div>
              </div>
              <div>
                <canvas 
                  ref={(canvas) => {
                    if (canvas) {
                      JsBarcode(canvas, selectedCoupon.barcode, { format: 'CODE128' });
                    }
                  }}
                />
                <div className="mt-2"><Text type="secondary">{selectedCoupon.barcode}</Text></div>
              </div>
            </div>

            <div className="flex justify-center gap-2 mt-6">
              <Button icon={<PrinterOutlined />} onClick={() => handlePrintCoupon(selectedCoupon)}>
                Print
              </Button>
              <Button icon={<DownloadOutlined />}>
                Download
              </Button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default CouponManagement;
