// src/pages/inventory/LocalInventory.tsx
import { useState, useEffect } from 'react';
import type { FC } from 'react';
import { Card, Table, Button, Space, Statistic, Row, Col, Tag, Alert, Spin, Typography, Progress } from 'antd';
import { PlusOutlined, SyncOutlined, WarningOutlined, CheckCircleOutlined } from '@ant-design/icons';
import apiClient from '../../api/index';
import type { Book, Box, SubCenter } from '../../types/models';

const { Title } = Typography;

interface InventoryItem {
  id: string;
  type: 'box' | 'book';
  identifier: string;
  status: string;
  capacity: number;
  used: number;
  remaining: number;
  dateReceived: string;
  subCenter?: SubCenter;
}

interface InventoryStats {
  totalBoxes: number;
  activeBoxes: number;
  totalBooks: number;
  activeBooks: number;
  totalCoupons: number;
  usedCoupons: number;
  lowStockAlerts: number;
}

const LocalInventory: FC = () => {
  const [loading, setLoading] = useState(true);
  const [inventoryData, setInventoryData] = useState<InventoryItem[]>([]);
  const [stats, setStats] = useState<InventoryStats>({
    totalBoxes: 0,
    activeBoxes: 0,
    totalBooks: 0,
    activeBooks: 0,
    totalCoupons: 0,
    usedCoupons: 0,
    lowStockAlerts: 0
  });

  useEffect(() => {
    loadInventoryData();
  }, []);

  const loadInventoryData = async () => {
    try {
      setLoading(true);
      const [boxesResponse, booksResponse] = await Promise.all([
        apiClient.get('/boxes/'),
        apiClient.get('/books/')
      ]);

      const boxes: Box[] = boxesResponse.data.results || boxesResponse.data;
      const books: Book[] = booksResponse.data.results || booksResponse.data;

      // Transform data for display
      const inventoryItems: InventoryItem[] = [
        ...boxes.map(box => ({
          id: String(box.id),
          type: 'box' as const,
          identifier: box.box_code,
          status: 'active', // Default status since not in type
          capacity: 50, // Default - should calculate from coupon range
          used: 0, // Would calculate from distributed books
          remaining: 50, // Would calculate
          dateReceived: box.received_at,
          subCenter: box.assigned_to
        })),
        ...books.map(book => ({
          id: String(book.id),
          type: 'book' as const,
          identifier: book.book_number,
          status: book.is_assigned ? 'assigned' : 'available',
          capacity: 10, // Default - should calculate from coupon range
          used: 0, // Would calculate from used coupons
          remaining: 10, // Would calculate
          dateReceived: boxes.find(b => b.id === book.box.id)?.received_at || ''
        }))
      ];

      setInventoryData(inventoryItems);

      // Calculate stats
      const newStats: InventoryStats = {
        totalBoxes: boxes.length,
        activeBoxes: boxes.length, // All boxes are considered active since status not in type
        totalBooks: books.length,
        activeBooks: books.filter(book => !book.is_assigned).length, // Available books
        totalCoupons: books.length * 10, // Estimate 10 coupons per book
        usedCoupons: books.filter(book => book.is_assigned).length * 10, // Estimate
        lowStockAlerts: inventoryItems.filter(item => (item.remaining / item.capacity) < 0.2).length
      };

      setStats(newStats);
    } catch (error) {
      console.error('Error loading inventory data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'active': 'green',
      'dispatched': 'blue',
      'completed': 'gray',
      'inactive': 'red'
    };
    return colors[status] || 'default';
  };

  const getStockLevel = (used: number, capacity: number) => {
    const percentage = (used / capacity) * 100;
    if (percentage >= 80) return { color: 'red', level: 'Critical' };
    if (percentage >= 60) return { color: 'orange', level: 'Low' };
    return { color: 'green', level: 'Good' };
  };

  const columns = [
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag color={type === 'box' ? 'blue' : 'green'}>
          {type.toUpperCase()}
        </Tag>
      )
    },
    {
      title: 'Identifier',
      dataIndex: 'identifier',
      key: 'identifier'
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>
          {status.toUpperCase()}
        </Tag>
      )
    },
    {
      title: 'Capacity',
      dataIndex: 'capacity',
      key: 'capacity'
    },
    {
      title: 'Used',
      dataIndex: 'used',
      key: 'used'
    },
    {
      title: 'Remaining',
      dataIndex: 'remaining',
      key: 'remaining'
    },
    {
      title: 'Stock Level',
      key: 'stockLevel',
      render: (_: any, record: InventoryItem) => {
        const stock = getStockLevel(record.used, record.capacity);
        const percentage = (record.used / record.capacity) * 100;
        return (
          <Space direction="vertical" size="small">
            <Progress 
              percent={percentage} 
              size="small" 
              strokeColor={stock.color}
              showInfo={false}
            />
            <Tag color={stock.color}>{stock.level}</Tag>
          </Space>
        );
      }
    },
    {
      title: 'Date Received',
      dataIndex: 'dateReceived',
      key: 'dateReceived',
      render: (date: string) => new Date(date).toLocaleDateString()
    },
    {
      title: 'Sub Center',
      dataIndex: 'subCenter',
      key: 'subCenter',
      render: (subCenter: SubCenter) => subCenter?.name || 'Main Center'
    }
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <p>Loading inventory data...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', fontFamily: 'Rockwell, serif' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ fontFamily: 'Rockwell, serif', fontSize: '18px', margin: 0 }}>
          Local Inventory Management
        </Title>
        <p style={{ color: '#666', margin: '8px 0 0 0', fontSize: '16px' }}>
          Monitor and manage local inventory levels for boxes, books, and coupons
        </p>
      </div>

      {/* Stats Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Boxes"
              value={stats.totalBoxes}
              suffix={`(${stats.activeBoxes} active)`}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Books"
              value={stats.totalBooks}
              suffix={`(${stats.activeBooks} active)`}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Coupon Usage"
              value={stats.usedCoupons}
              suffix={`/ ${stats.totalCoupons}`}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Low Stock Alerts"
              value={stats.lowStockAlerts}
              valueStyle={{ color: stats.lowStockAlerts > 0 ? '#ff4d4f' : '#52c41a' }}
              prefix={stats.lowStockAlerts > 0 ? <WarningOutlined /> : <CheckCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Alerts */}
      {stats.lowStockAlerts > 0 && (
        <Alert
          message="Low Stock Alert"
          description={`${stats.lowStockAlerts} item(s) are running low on stock. Please consider restocking soon.`}
          type="warning"
          showIcon
          style={{ marginBottom: '16px' }}
        />
      )}

      {/* Inventory Table */}
      <Card>
        <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={4} style={{ fontFamily: 'Rockwell, serif', fontSize: '16px', margin: 0 }}>
            Inventory Items
          </Title>
          <Space>
            <Button icon={<SyncOutlined />} onClick={loadInventoryData}>
              Refresh
            </Button>
            <Button type="primary" icon={<PlusOutlined />}>
              Request Stock
            </Button>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={inventoryData}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`
          }}
          scroll={{ x: 1200 }}
        />
      </Card>
    </div>
  );
};

export default LocalInventory;
