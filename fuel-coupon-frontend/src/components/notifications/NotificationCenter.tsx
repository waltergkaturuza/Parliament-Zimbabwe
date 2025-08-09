// src/components/notifications/NotificationCenter.tsx
import React, { useState, useEffect } from 'react';
import {
  Drawer,
  List,
  Badge,
  Button,
  Typography,
  Space,
  Tag,
  Avatar,
  Empty,
  Divider,
  message,
  Popconfirm,
  Tooltip,
  Row,
  Col,
  Card,
  Alert,
  Input,
  Select,
} from 'antd';
import {
  BellOutlined,
  CheckOutlined,
  DeleteOutlined,
  EyeOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  UserOutlined,
  BankOutlined,
  CarOutlined,
  BookOutlined,
  AlertOutlined,
  ToolOutlined,
  FileTextOutlined,
  ClearOutlined,
  FilterOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import apiClient from '@/api/index';

dayjs.extend(relativeTime);

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

interface Notification {
  id: string;
  title: string;
  message: string;
  message_type: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
  is_read: boolean;
  created_at: string;
  sender_type: 'BENEFICIARY' | 'SUBCENTER' | 'MAIN_CENTER' | 'SYSTEM';
  sender_name?: string;
  data?: any;
  action_required?: boolean;
  action_url?: string;
}

interface NotificationCenterProps {
  visible: boolean;
  onClose: () => void;
  userRole: 'MAIN_CENTER' | 'SUB_CENTER' | 'BENEFICIARY';
  userId: string;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({
  visible,
  onClose,
  userRole,
  userId
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'priority'>('all');
  const [searchText, setSearchText] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');

  useEffect(() => {
    if (visible) {
      loadNotifications();
    }
  }, [visible, filter]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const params: any = {
        recipient_type: userRole,
        recipient_id: userId
      };

      if (filter === 'unread') {
        params.is_read = false;
      } else if (filter === 'priority') {
        params.priority = 'HIGH,CRITICAL';
      }

      if (selectedType !== 'all') {
        params.message_type = selectedType;
      }

      const response = await apiClient.get('/notifications/', { params });
      setNotifications(response.data.results || response.data || []);
    } catch (error) {
      console.error('Error loading notifications:', error);
      message.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await apiClient.patch(`/notifications/${notificationId}/`, {
        is_read: true
      });
      
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId ? { ...notif, is_read: true } : notif
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await apiClient.post('/notifications/mark-all-read/', {
        recipient_type: userRole,
        recipient_id: userId
      });
      
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, is_read: true }))
      );
      
      message.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all as read:', error);
      message.error('Failed to mark all as read');
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await apiClient.delete(`/notifications/${notificationId}/`);
      setNotifications(prev =>
        prev.filter(notif => notif.id !== notificationId)
      );
      message.success('Notification deleted');
    } catch (error) {
      console.error('Error deleting notification:', error);
      message.error('Failed to delete notification');
    }
  };

  const clearAllNotifications = async () => {
    try {
      await apiClient.post('/notifications/clear-all/', {
        recipient_type: userRole,
        recipient_id: userId
      });
      
      setNotifications([]);
      message.success('All notifications cleared');
    } catch (error) {
      console.error('Error clearing notifications:', error);
      message.error('Failed to clear notifications');
    }
  };

  const handleNotificationAction = async (notification: Notification) => {
    try {
      // Mark as read first
      if (!notification.is_read) {
        await markAsRead(notification.id);
      }

      // Handle specific actions based on notification type
      switch (notification.message_type) {
        case 'FUEL_REQUEST':
          // Navigate to fuel request approval page
          message.info('Opening fuel request for review...');
          break;
        case 'BOOK_REQUEST':
          // Navigate to book request page
          message.info('Opening book request for review...');
          break;
        case 'EMERGENCY_REQUEST':
          // Navigate to emergency response page
          message.info('Opening emergency request...');
          break;
        default:
          // Just mark as read
          message.info('Notification viewed');
      }

      // Close notification center if action performed
      // onClose();
    } catch (error) {
      console.error('Error handling notification action:', error);
      message.error('Failed to process notification action');
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'FUEL_REQUEST':
        return <CarOutlined style={{ color: '#52c41a' }} />;
      case 'BOOK_REQUEST':
        return <BookOutlined style={{ color: '#1890ff' }} />;
      case 'EMERGENCY_REQUEST':
        return <AlertOutlined style={{ color: '#ff4d4f' }} />;
      case 'MAINTENANCE_REPORT':
        return <ToolOutlined style={{ color: '#fa8c16' }} />;
      case 'INVENTORY_UPDATE':
        return <FileTextOutlined style={{ color: '#722ed1' }} />;
      case 'DISTRIBUTION_REPORT':
        return <CarOutlined style={{ color: '#13c2c2' }} />;
      case 'HANDOVER_PROCESS':
        return <CheckOutlined style={{ color: '#52c41a' }} />;
      default:
        return <BellOutlined style={{ color: '#d9d9d9' }} />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
        return 'red';
      case 'HIGH':
        return 'orange';
      case 'NORMAL':
        return 'blue';
      case 'LOW':
        return 'default';
      default:
        return 'default';
    }
  };

  const getSenderIcon = (senderType: string) => {
    switch (senderType) {
      case 'BENEFICIARY':
        return <UserOutlined />;
      case 'SUBCENTER':
        return <BankOutlined />;
      case 'MAIN_CENTER':
        return <BankOutlined />;
      default:
        return <UserOutlined />;
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = notification.title.toLowerCase().includes(searchText.toLowerCase()) ||
                         notification.message.toLowerCase().includes(searchText.toLowerCase());
    return matchesSearch;
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const priorityCount = notifications.filter(n => ['HIGH', 'CRITICAL'].includes(n.priority)).length;

  return (
    <Drawer
      title={
        <Space>
          <BellOutlined />
          Notification Center
          {unreadCount > 0 && (
            <Badge count={unreadCount} size="small" />
          )}
        </Space>
      }
      width={480}
      onClose={onClose}
      open={visible}
      extra={
        <Space>
          <Button
            type="text"
            icon={<CheckOutlined />}
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
          >
            Mark All Read
          </Button>
          <Popconfirm
            title="Clear all notifications?"
            description="This action cannot be undone."
            onConfirm={clearAllNotifications}
            okText="Yes"
            cancelText="No"
            okType="danger"
          >
            <Button
              type="text"
              icon={<ClearOutlined />}
              danger
              disabled={notifications.length === 0}
            >
              Clear All
            </Button>
          </Popconfirm>
        </Space>
      }
    >
      {/* Summary Cards */}
      <Row gutter={8} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Card size="small">
            <div style={{ textAlign: 'center' }}>
              <Text type="secondary">Unread</Text>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1890ff' }}>
                {unreadCount}
              </div>
            </div>
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small">
            <div style={{ textAlign: 'center' }}>
              <Text type="secondary">Priority</Text>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#ff4d4f' }}>
                {priorityCount}
              </div>
            </div>
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small">
            <div style={{ textAlign: 'center' }}>
              <Text type="secondary">Total</Text>
              <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
                {notifications.length}
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Space style={{ width: '100%', marginBottom: 16 }} direction="vertical">
        <Search
          placeholder="Search notifications..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: '100%' }}
        />
        
        <Row gutter={8}>
          <Col span={12}>
            <Select
              value={filter}
              onChange={setFilter}
              style={{ width: '100%' }}
              size="small"
            >
              <Option value="all">All Notifications</Option>
              <Option value="unread">Unread Only</Option>
              <Option value="priority">Priority Only</Option>
            </Select>
          </Col>
          <Col span={12}>
            <Select
              value={selectedType}
              onChange={setSelectedType}
              style={{ width: '100%' }}
              size="small"
            >
              <Option value="all">All Types</Option>
              <Option value="FUEL_REQUEST">Fuel Requests</Option>
              <Option value="BOOK_REQUEST">Book Requests</Option>
              <Option value="EMERGENCY_REQUEST">Emergency</Option>
              <Option value="MAINTENANCE_REPORT">Maintenance</Option>
              <Option value="INVENTORY_UPDATE">Inventory</Option>
            </Select>
          </Col>
        </Row>
      </Space>

      {/* Priority Alerts */}
      {priorityCount > 0 && (
        <Alert
          message={`${priorityCount} high priority notification(s) require attention`}
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          action={
            <Button size="small" onClick={() => setFilter('priority')}>
              View
            </Button>
          }
        />
      )}

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <Empty
          description="No notifications found"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      ) : (
        <List
          loading={loading}
          dataSource={filteredNotifications}
          renderItem={(notification) => (
            <List.Item
              key={notification.id}
              style={{
                padding: '12px',
                backgroundColor: notification.is_read ? 'transparent' : '#f6ffed',
                border: notification.is_read ? '1px solid #f0f0f0' : '1px solid #b7eb8f',
                borderRadius: '6px',
                marginBottom: '8px'
              }}
            >
              <List.Item.Meta
                avatar={
                  <Badge dot={!notification.is_read}>
                    <Avatar icon={getNotificationIcon(notification.message_type)} />
                  </Badge>
                }
                title={
                  <Row justify="space-between" align="middle">
                    <Col flex="auto">
                      <Space>
                        <Text strong={!notification.is_read}>
                          {notification.title}
                        </Text>
                        <Tag color={getPriorityColor(notification.priority)} size="small">
                          {notification.priority}
                        </Tag>
                      </Space>
                    </Col>
                    <Col>
                      <Space>
                        {notification.action_required && (
                          <Tooltip title="Action Required">
                            <Button
                              type="primary"
                              size="small"
                              icon={<EyeOutlined />}
                              onClick={() => handleNotificationAction(notification)}
                            >
                              Review
                            </Button>
                          </Tooltip>
                        )}
                        <Tooltip title="Mark as Read">
                          <Button
                            type="text"
                            size="small"
                            icon={<CheckOutlined />}
                            onClick={() => markAsRead(notification.id)}
                            disabled={notification.is_read}
                          />
                        </Tooltip>
                        <Popconfirm
                          title="Delete this notification?"
                          onConfirm={() => deleteNotification(notification.id)}
                          okText="Yes"
                          cancelText="No"
                          okType="danger"
                        >
                          <Button
                            type="text"
                            size="small"
                            icon={<DeleteOutlined />}
                            danger
                          />
                        </Popconfirm>
                      </Space>
                    </Col>
                  </Row>
                }
                description={
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Text>{notification.message}</Text>
                    <Row justify="space-between" align="middle">
                      <Col>
                        <Space size="small">
                          {getSenderIcon(notification.sender_type)}
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            {notification.sender_name || notification.sender_type}
                          </Text>
                        </Space>
                      </Col>
                      <Col>
                        <Space size="small">
                          <ClockCircleOutlined style={{ fontSize: '12px', color: '#999' }} />
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            {dayjs(notification.created_at).fromNow()}
                          </Text>
                        </Space>
                      </Col>
                    </Row>
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      )}
    </Drawer>
  );
};

export default NotificationCenter;
