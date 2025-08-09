// src/components/profile/RecentActivity.tsx
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  List,
  Avatar,
  Typography,
  Tag,
  Space,
  Empty,
  Spin,
  Button,
  DatePicker,
  Select
} from 'antd';
import {
  UserOutlined,
  ClockCircleOutlined,
  LoginOutlined,
  EditOutlined,
  SafetyCertificateOutlined,
  SettingOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const { Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

interface ActivityItem {
  id: string;
  type: 'login' | 'profile_update' | 'settings_change' | 'password_change' | 'security_update';
  description: string;
  timestamp: string;
  ip_address?: string;
  user_agent?: string;
  status: 'success' | 'failed' | 'warning';
}

interface RecentActivityProps {
  userId?: string;
  limit?: number;
}

const RecentActivity: React.FC<RecentActivityProps> = ({
  userId,
  limit = 10
}) => {
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [activityType, setActivityType] = useState<string>('all');

  // Mock query - replace with actual API call
  const { data: activities = [], isLoading, refetch } = useQuery({
    queryKey: ['user-activity', userId, dateRange, activityType, limit],
    queryFn: async () => {
      // Mock data - replace with actual API call
      return [
        {
          id: '1',
          type: 'login',
          description: 'Successful login from Windows PC',
          timestamp: dayjs().subtract(1, 'hour').toISOString(),
          ip_address: '192.168.1.100',
          user_agent: 'Chrome/91.0.4472.124',
          status: 'success'
        },
        {
          id: '2',
          type: 'profile_update',
          description: 'Updated profile information',
          timestamp: dayjs().subtract(2, 'days').toISOString(),
          status: 'success'
        },
        {
          id: '3',
          type: 'password_change',
          description: 'Password changed successfully',
          timestamp: dayjs().subtract(5, 'days').toISOString(),
          status: 'success'
        },
        {
          id: '4',
          type: 'login',
          description: 'Failed login attempt',
          timestamp: dayjs().subtract(1, 'week').toISOString(),
          ip_address: '10.0.0.1',
          status: 'failed'
        },
        {
          id: '5',
          type: 'settings_change',
          description: 'Updated notification preferences',
          timestamp: dayjs().subtract(2, 'weeks').toISOString(),
          status: 'success'
        }
      ] as ActivityItem[];
    }
  });

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'login':
        return <LoginOutlined />;
      case 'profile_update':
        return <EditOutlined />;
      case 'password_change':
        return <SafetyCertificateOutlined />;
      case 'settings_change':
        return <SettingOutlined />;
      default:
        return <UserOutlined />;
    }
  };

  const getActivityColor = (status: string) => {
    switch (status) {
      case 'success':
        return '#52c41a';
      case 'failed':
        return '#f5222d';
      case 'warning':
        return '#faad14';
      default:
        return '#1890ff';
    }
  };

  const getStatusTag = (status: string) => {
    const colors = {
      success: 'green',
      failed: 'red',
      warning: 'orange'
    };
    return (
      <Tag color={colors[status as keyof typeof colors]}>
        {status.toUpperCase()}
      </Tag>
    );
  };

  const filteredActivities = activities.filter(activity => {
    if (activityType !== 'all' && activity.type !== activityType) {
      return false;
    }
    
    if (dateRange) {
      const activityDate = dayjs(activity.timestamp);
      return activityDate.isAfter(dateRange[0]) && activityDate.isBefore(dateRange[1]);
    }
    
    return true;
  });

  if (isLoading) {
    return (
      <Card title="Recent Activity" extra={<ClockCircleOutlined />}>
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  return (
    <Card
      title="Recent Activity"
      extra={
        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => refetch()}
            size="small"
          >
            Refresh
          </Button>
        </Space>
      }
    >
      <div style={{ marginBottom: 16 }}>
        <Space wrap>
          <Select
            value={activityType}
            onChange={setActivityType}
            style={{ width: 150 }}
            size="small"
          >
            <Option value="all">All Activities</Option>
            <Option value="login">Login</Option>
            <Option value="profile_update">Profile Updates</Option>
            <Option value="password_change">Password Changes</Option>
            <Option value="settings_change">Settings</Option>
          </Select>
          
          <RangePicker
            value={dateRange}
            onChange={(dates) => setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)}
            size="small"
            format="YYYY-MM-DD"
          />
        </Space>
      </div>

      {filteredActivities.length === 0 ? (
        <Empty
          description="No recent activity found"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      ) : (
        <List
          itemLayout="horizontal"
          dataSource={filteredActivities}
          renderItem={(item) => (
            <List.Item>
              <List.Item.Meta
                avatar={
                  <Avatar
                    icon={getActivityIcon(item.type)}
                    style={{ backgroundColor: getActivityColor(item.status) }}
                  />
                }
                title={
                  <Space>
                    <span>{item.description}</span>
                    {getStatusTag(item.status)}
                  </Space>
                }
                description={
                  <Space direction="vertical" size="small">
                    <Text type="secondary">
                      <ClockCircleOutlined style={{ marginRight: 4 }} />
                      {dayjs(item.timestamp).fromNow()} ({dayjs(item.timestamp).format('MMM DD, YYYY HH:mm')})
                    </Text>
                    {item.ip_address && (
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        IP: {item.ip_address}
                        {item.user_agent && ` • ${item.user_agent.split('/')[0]}`}
                      </Text>
                    )}
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      )}
    </Card>
  );
};

export default RecentActivity;