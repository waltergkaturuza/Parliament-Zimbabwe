// src/pages/main-center/components/InventoryOverviewSimple.tsx
import { useState } from 'react';
import type { FC } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Progress,
  Table,
  Tag,
  Space,
  Button,
  Input,
  Select,
  Typography,
  Alert,
  Tooltip,
} from 'antd';
import {
  InboxOutlined,
  BookOutlined,
  CarOutlined,
  WarningOutlined,
  SearchOutlined,
  FilterOutlined,
  DownloadOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { ColumnsType } from 'antd/es/table';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

interface InventoryItem {
  id: string;
  boxId: string;
  fuelType: 'PETROL' | 'DIESEL';
  couponAmount: 5 | 20;
  totalBooks: number;
  booksDispatched: number;
  booksRemaining: number;
  totalCoupons: number;
  couponsUsed: number;
  couponsRemaining: number;
  totalLitres: number;
  litresUsed: number;
  litresRemaining: number;
  monetaryValue: number;
  status: 'FULL' | 'PARTIAL' | 'EMPTY' | 'LOW_STOCK';
  lastUpdated: string;
  location: string;
}

const InventoryOverview: FC = () => {
  const [searchText, setSearchText] = useState('');
  const [filterFuelType, setFilterFuelType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Sample data - replace with API call
  const inventoryData: InventoryItem[] = [
    {
      id: '1',
      boxId: 'BOX-2024-001',
      fuelType: 'PETROL',
      couponAmount: 20,
      totalBooks: 20,
      booksDispatched: 15,
      booksRemaining: 5,
      totalCoupons: 400,
      couponsUsed: 280,
      couponsRemaining: 120,
      totalLitres: 8000,
      litresUsed: 5600,
      litresRemaining: 2400,
      monetaryValue: 1600000,
      status: 'PARTIAL',
      lastUpdated: '2024-07-04 14:30',
      location: 'Warehouse A-1',
    },
    {
      id: '2',
      boxId: 'BOX-2024-002',
      fuelType: 'DIESEL',
      couponAmount: 5,
      totalBooks: 20,
      booksDispatched: 2,
      booksRemaining: 18,
      totalCoupons: 400,
      couponsUsed: 40,
      couponsRemaining: 360,
      totalLitres: 2000,
      litresUsed: 200,
      litresRemaining: 1800,
      monetaryValue: 380000,
      status: 'FULL',
      lastUpdated: '2024-07-04 09:15',
      location: 'Warehouse A-2',
    },
    {
      id: '3',
      boxId: 'BOX-2024-003',
      fuelType: 'PETROL',
      couponAmount: 5,
      totalBooks: 20,
      booksDispatched: 18,
      booksRemaining: 2,
      totalCoupons: 400,
      couponsUsed: 360,
      couponsRemaining: 40,
      totalLitres: 2000,
      litresUsed: 1800,
      litresRemaining: 200,
      monetaryValue: 400000,
      status: 'LOW_STOCK',
      lastUpdated: '2024-07-04 12:45',
      location: 'Warehouse B-1',
    },
  ];

  const columns: ColumnsType<InventoryItem> = [
    {
      title: 'Box ID',
      dataIndex: 'boxId',
      key: 'boxId',
      fixed: 'left',
      width: 120,
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: 'Fuel Type',
      dataIndex: 'fuelType',
      key: 'fuelType',
      width: 100,
      render: (type, record) => (
        <Tag color={type === 'PETROL' ? 'blue' : 'orange'}>
          {type} {record.couponAmount}L
        </Tag>
      ),
    },
    {
      title: 'Books',
      key: 'books',
      width: 120,
      render: (_, record) => (
        <div>
          <Text>
            {record.booksRemaining}/{record.totalBooks}
          </Text>
          <Progress
            percent={(record.booksRemaining / record.totalBooks) * 100}
            size="small"
            status={record.booksRemaining < 5 ? 'exception' : 'active'}
            showInfo={false}
          />
        </div>
      ),
    },
    {
      title: 'Coupons',
      key: 'coupons',
      width: 120,
      render: (_, record) => (
        <div>
          <Text>
            {record.couponsRemaining.toLocaleString()}/{record.totalCoupons.toLocaleString()}
          </Text>
          <Progress
            percent={(record.couponsRemaining / record.totalCoupons) * 100}
            size="small"
            status={record.couponsRemaining < 50 ? 'exception' : 'active'}
            showInfo={false}
          />
        </div>
      ),
    },
    {
      title: 'Litres Remaining',
      dataIndex: 'litresRemaining',
      key: 'litresRemaining',
      width: 120,
      render: (value) => (
        <Text strong style={{ color: value < 1000 ? '#ff4d4f' : '#52c41a' }}>
          {value.toLocaleString()}L
        </Text>
      ),
    },
    {
      title: 'Value (ZWG)',
      key: 'value',
      width: 120,
      render: (_, record) => {
        const remainingValue = (record.litresRemaining / record.totalLitres) * record.monetaryValue;
        return <Text>{remainingValue.toLocaleString()}</Text>;
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => {
        const colors: { [key: string]: string } = {
          FULL: 'green',
          PARTIAL: 'blue',
          LOW_STOCK: 'orange',
          EMPTY: 'red',
        };
        return <Tag color={colors[status] || 'default'}>{status.replace('_', ' ')}</Tag>;
      },
    },
    {
      title: 'Location',
      dataIndex: 'location',
      key: 'location',
      width: 120,
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 100,
      render: (_, record) => (
        <Space>
          <Tooltip title="View Details">
            <Button type="link" icon={<EyeOutlined />} size="small" />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const filteredData = inventoryData.filter((item) => {
    const matchesSearch = item.boxId.toLowerCase().includes(searchText.toLowerCase()) ||
                         item.location.toLowerCase().includes(searchText.toLowerCase());
    const matchesFuelType = filterFuelType === 'all' || item.fuelType === filterFuelType;
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
    
    return matchesSearch && matchesFuelType && matchesStatus;
  });

  // Calculate summary statistics
  const totalBoxes = inventoryData.length;
  const totalBooks = inventoryData.reduce((sum, item) => sum + item.totalBooks, 0);
  const booksRemaining = inventoryData.reduce((sum, item) => sum + item.booksRemaining, 0);
  const totalLitres = inventoryData.reduce((sum, item) => sum + item.totalLitres, 0);
  const litresRemaining = inventoryData.reduce((sum, item) => sum + item.litresRemaining, 0);
  const lowStockBoxes = inventoryData.filter(item => item.status === 'LOW_STOCK' || item.booksRemaining < 5).length;

  return (
    <div>
      {/* Alert for low stock */}
      {lowStockBoxes > 0 && (
        <Alert
          message={`${lowStockBoxes} boxes have low stock levels`}
          type="warning"
          showIcon
          icon={<WarningOutlined />}
          style={{ marginBottom: 24 }}
          action={
            <Button size="small" type="link">
              View Details
            </Button>
          }
        />
      )}

      {/* Summary Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Boxes"
              value={totalBoxes}
              prefix={<InboxOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Books Remaining"
              value={booksRemaining}
              suffix={`/ ${totalBooks}`}
              prefix={<BookOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
            <Progress 
              percent={(booksRemaining / totalBooks) * 100} 
              size="small" 
              showInfo={false}
              style={{ marginTop: 8 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Litres Remaining"
              value={litresRemaining}
              suffix="L"
              prefix={<CarOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
            <Progress 
              percent={(litresRemaining / totalLitres) * 100} 
              size="small" 
              showInfo={false}
              style={{ marginTop: 8 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Low Stock Alerts"
              value={lowStockBoxes}
              prefix={<WarningOutlined />}
              valueStyle={{ color: lowStockBoxes > 0 ? '#ff4d4f' : '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Inventory Summary Card */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24}>
          <Card title="Inventory Summary">
            <Row gutter={16}>
              <Col xs={24} md={8}>
                <Card size="small" style={{ textAlign: 'center' }}>
                  <Title level={4}>Petrol Inventory</Title>
                  <Statistic 
                    value={inventoryData.filter(item => item.fuelType === 'PETROL').reduce((sum, item) => sum + item.litresRemaining, 0)}
                    suffix="L"
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Card>
              </Col>
              <Col xs={24} md={8}>
                <Card size="small" style={{ textAlign: 'center' }}>
                  <Title level={4}>Diesel Inventory</Title>
                  <Statistic 
                    value={inventoryData.filter(item => item.fuelType === 'DIESEL').reduce((sum, item) => sum + item.litresRemaining, 0)}
                    suffix="L"
                    valueStyle={{ color: '#faad14' }}
                  />
                </Card>
              </Col>
              <Col xs={24} md={8}>
                <Card size="small" style={{ textAlign: 'center' }}>
                  <Title level={4}>Total Value</Title>
                  <Statistic 
                    value={inventoryData.reduce((sum, item) => sum + (item.litresRemaining / item.totalLitres) * item.monetaryValue, 0)}
                    formatter={(value) => `ZWG ${value?.toLocaleString()}`}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Card>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* Filters and Search */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col flex="auto">
            <Search
              placeholder="Search by Box ID or Location"
              value={searchText}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchText(e.target.value)}
              style={{ width: 300 }}
              prefix={<SearchOutlined />}
            />
          </Col>
          <Col>
            <Space>
              <Select
                value={filterFuelType}
                onChange={setFilterFuelType}
                style={{ width: 120 }}
                prefix={<FilterOutlined />}
              >
                <Option value="all">All Fuels</Option>
                <Option value="PETROL">Petrol</Option>
                <Option value="DIESEL">Diesel</Option>
              </Select>
              <Select
                value={filterStatus}
                onChange={setFilterStatus}
                style={{ width: 120 }}
              >
                <Option value="all">All Status</Option>
                <Option value="FULL">Full</Option>
                <Option value="PARTIAL">Partial</Option>
                <Option value="LOW_STOCK">Low Stock</Option>
                <Option value="EMPTY">Empty</Option>
              </Select>
              <Button icon={<DownloadOutlined />}>
                Export
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Inventory Table */}
      <Card title={`Inventory Details (${filteredData.length} items)`}>
        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          scroll={{ x: 1200 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
          }}
          rowClassName={(record) => {
            if (record.status === 'LOW_STOCK' || record.booksRemaining < 5) {
              return 'low-stock-row';
            }
            return '';
          }}
        />
      </Card>

      <style>{`
        .low-stock-row {
          background-color: #fff2e8;
        }
        .low-stock-row:hover {
          background-color: #ffe7d3 !important;
        }
      `}</style>
    </div>
  );
};

export default InventoryOverview;
