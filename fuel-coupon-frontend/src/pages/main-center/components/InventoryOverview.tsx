// src/pages/main-center/components/InventoryOverview.tsx
import { useState, useEffect } from 'react';
import type { FC } from 'react';
import { useNavigate } from 'react-router-dom';
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
  SendOutlined,
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
  monetaryValueUSD: number;
  status: 'FULL' | 'PARTIAL' | 'EMPTY' | 'LOW_STOCK';
  lastUpdated: string;
  location: string;
}

const InventoryOverview: FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [inventoryData, setInventoryData] = useState<InventoryItem[]>([]);
  const [searchText, setSearchText] = useState('');
  const [filterFuelType, setFilterFuelType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Action handlers
  const handleViewDetails = (record: InventoryItem) => {
    console.log('Viewing details for box:', record.boxId);
    // TODO: Navigate to box details page or open modal
    alert(`Viewing details for Batch ${record.boxId}\n\nTotal Books: ${record.totalBooks}\nBooks Remaining: ${record.booksRemaining}\nTotal Coupons: ${record.totalCoupons.toLocaleString()}\nCoupons Remaining: ${record.couponsRemaining.toLocaleString()}\nValue (ZWG): ${record.monetaryValue.toLocaleString()}\nValue (USD): $${record.monetaryValueUSD.toLocaleString()}\nLocation: ${record.location}`);
  };

  const handleDispatchBooks = (record: InventoryItem) => {
    console.log('Dispatching books from box:', record.boxId);
    // Navigate to the book dispatch page with the box ID as a query parameter
    navigate(`/main-center/book-dispatch?boxId=${record.id}&boxCode=${record.boxId}`);
  };

  // Export function
  const handleExportInventory = () => {
    try {
      const headers = ['Batch ID', 'Fuel Type', 'Coupon Amount', 'Total Books', 'Books Remaining', 'Total Coupons', 'Coupons Remaining', 'Total Litres', 'Litres Remaining', 'Monetary Value', 'Status', 'Location'];
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
      const response = await apiClient.get('/boxes/');
      const data = response.data;
      
      // Handle both paginated and direct array responses
      const boxes = data.results || data;
      
      if (Array.isArray(boxes)) {
        // Map backend data to frontend format
        const mappedInventory = boxes.map((box: any) => {
          // Use backend calculated values if available, otherwise calculate locally
          const totalBooks = box.number_of_books || 0;
          const booksDispatched = box.books_dispatched || box.booksDispatched || 0;
          const booksRemaining = box.booksRemaining !== undefined ? box.booksRemaining : (totalBooks - booksDispatched);
          const couponsPerBook = box.coupons_per_book || 100;
          const totalCoupons = box.total_coupons_calculated || box.totalCoupons || (totalBooks * couponsPerBook);
          const couponsUsed = box.coupons_used || box.couponsUsed || 0;
          const couponsRemaining = box.couponsRemaining !== undefined ? box.couponsRemaining : (totalCoupons - couponsUsed);
          const totalLitres = parseFloat(box.total_litres || 0);
          const litresUsed = parseFloat(box.litres_used || box.litresUsed || 0);
          const litresRemaining = box.litresRemaining !== undefined ? parseFloat(box.litresRemaining) : (totalLitres - litresUsed);
          
          // Determine status based on remaining resources
          let status: 'FULL' | 'PARTIAL' | 'EMPTY' | 'LOW_STOCK' = 'FULL';
          if (booksRemaining === 0) status = 'EMPTY';
          else if (booksRemaining < 3) status = 'LOW_STOCK';
          else if (booksRemaining < totalBooks) status = 'PARTIAL';
          
          const mappedItem = {
            id: String(box.id),
            boxId: box.box_code || `FCB-${String(box.id).padStart(4, '0')}`,
            fuelType: (box.fuel_type || 'DIESEL') as 'PETROL' | 'DIESEL',
            couponAmount: (box.denomination || 20) as 5 | 20,
            totalBooks,
            booksDispatched,
            booksRemaining,
            totalCoupons,
            couponsUsed,
            couponsRemaining,
            totalLitres,
            litresUsed,
            litresRemaining,
            monetaryValue: parseFloat(box.monetaryValue || box.total_value_zwg || 0) || (totalLitres * 37.95),
            monetaryValueUSD: parseFloat(box.total_value_usd || 0) || (totalLitres * 1.40),
            status,
            lastUpdated: box.received_at || box.modified || new Date().toISOString(),
            location: box.location || 'Main Warehouse',
          };
          
          return mappedItem;
        });
        
        setInventoryData(mappedInventory);
      } else {
        console.warn('No inventory data received from API');
        setInventoryData([]);
      }
    } catch (error: any) {
      console.error('Error loading inventory data:', error);
      // If it's an auth error, show a different message
      if (error.response?.status === 401) {
        console.log('Authentication required for inventory data');
      }
      setInventoryData([]);
    } finally {
      setLoading(false);
    }
  };

  // Table columns definition
  const columns: ColumnsType<InventoryItem> = [
    {
      title: 'Batch ID',
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
            percent={record.totalBooks > 0 ? (record.booksRemaining / record.totalBooks) * 100 : 0}
            size="small"
            status={record.booksRemaining < 3 ? 'exception' : 'active'}
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
            percent={record.totalCoupons > 0 ? (record.couponsRemaining / record.totalCoupons) * 100 : 0}
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
      key: 'valueZWG',
      width: 120,
      render: (_, record) => {
        const remainingValue = (record.litresRemaining / record.totalLitres) * record.monetaryValue;
        return <Text>{remainingValue.toLocaleString()} ZWG</Text>;
      },
    },
    {
      title: 'Value (USD)',
      key: 'valueUSD',
      width: 120,
      render: (_, record) => {
        const remainingValueUSD = (record.litresRemaining / record.totalLitres) * record.monetaryValueUSD;
        return <Text>${remainingValueUSD.toLocaleString()}</Text>;
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
      width: 120,
      render: (_, record) => (
        <Space>
          <Tooltip title="View Details">
            <Button 
              type="link" 
              icon={<EyeOutlined />} 
              size="small"
              onClick={() => handleViewDetails(record)}
            />
          </Tooltip>
          <Tooltip title="Dispatch Books">
            <Button 
              type="link" 
              icon={<SendOutlined />} 
              size="small"
              disabled={record.booksRemaining === 0}
              onClick={() => handleDispatchBooks(record)}
              style={{ color: record.booksRemaining === 0 ? '#d9d9d9' : '#1890ff' }}
            />
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
  const lowStockBoxes = inventoryData.filter(item => item.status === 'LOW_STOCK' || item.booksRemaining < 3).length;

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
              title="Total Batches"
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
              percent={totalBooks > 0 ? (booksRemaining / totalBooks) * 100 : 0} 
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
              percent={totalLitres > 0 ? (litresRemaining / totalLitres) * 100 : 0} 
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
                    value={inventoryData.reduce((sum, item) => sum + (item.totalLitres > 0 ? (item.litresRemaining / item.totalLitres) * item.monetaryValue : 0), 0)}
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
              placeholder="Search by Batch ID or Location"
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
