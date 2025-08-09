// src/pages/main-center/components/InventoryOverview.tsx
import { useState, useEffect } from 'react';
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
  Spin,
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
import apiClient from '../../../api/index';

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
  const [loading, setLoading] = useState(true);
  const [inventoryData, setInventoryData] = useState<InventoryItem[]>([]);
  const [searchText, setSearchText] = useState('');
  const [filterFuelType, setFilterFuelType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Export function
  const handleExportInventory = () => {
    try {
      const headers = ['Box ID', 'Fuel Type', 'Coupon Amount', 'Total Books', 'Books Remaining', 'Total Coupons', 'Coupons Remaining', 'Total Litres', 'Litres Remaining', 'Monetary Value', 'Status', 'Location'];
      const csvContent = [
        headers.join(','),
        ...inventoryData.map(item => [
          item.boxId,
          item.fuelType,
          item.couponAmount,
          item.totalBooks,
          item.booksRemaining,
          item.totalCoupons,
          item.couponsRemaining,
          item.totalLitres,
          item.litresRemaining,
          item.monetaryValue,
          item.status,
          item.location
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `inventory_report_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Export error:', error);
    }
  };

  useEffect(() => {
    loadInventoryData();
  }, []);

  const loadInventoryData = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/api/v1/boxes/');
      const data = response.data;
      
      // Handle both paginated and direct array responses
      const boxes = data.results || data;
      
      if (Array.isArray(boxes)) {
        // Map backend data to frontend format
        const mappedInventory = boxes.map((box: any) => {
          const totalBooks = box.books?.length || 0;
          const booksDispatched = 0; // Calculate from actual dispatches
          const booksRemaining = totalBooks - booksDispatched;
          const totalCoupons = totalBooks * 10; // Estimate 10 coupons per book
          const couponsUsed = 0; // Calculate from actual usage
          const couponsRemaining = totalCoupons - couponsUsed;
          const totalLitres = box.total_litres || 0;
          const litresUsed = 0; // Calculate from actual usage
          const litresRemaining = totalLitres - litresUsed;
          
          // Determine status based on remaining resources
          let status: 'FULL' | 'PARTIAL' | 'EMPTY' | 'LOW_STOCK' = 'FULL';
          if (booksRemaining === 0) status = 'EMPTY';
          else if (booksRemaining < 5) status = 'LOW_STOCK';
          else if (booksRemaining < totalBooks) status = 'PARTIAL';
          
          return {
            id: String(box.id),
            boxId: box.box_code || `FCB-${String(box.id).padStart(4, '0')}`,
            fuelType: 'DIESEL' as const, // Default - backend doesn't have this field yet
            couponAmount: 20 as const, // Default coupon amount
            totalBooks,
            booksDispatched,
            booksRemaining,
            totalCoupons,
            couponsUsed,
            couponsRemaining,
            totalLitres,
            litresUsed,
            litresRemaining,
            monetaryValue: totalLitres * 37.95, // Calculate based on current fuel price
            status,
            lastUpdated: box.received_at || new Date().toISOString(),
            location: 'Main Warehouse', // Default location
          };
        });
        
        setInventoryData(mappedInventory);
      } else {
        console.warn('No inventory data received from API');
        setInventoryData([]);
      }
    } catch (error) {
      console.error('Error loading inventory data:', error);
      setInventoryData([]);
    } finally {
      setLoading(false);
    }
  };

  // Table columns definition
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

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <p>Loading inventory data...</p>
      </div>
    );
  }

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
              <Button 
                icon={<DownloadOutlined />}
                onClick={handleExportInventory}
              >
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
