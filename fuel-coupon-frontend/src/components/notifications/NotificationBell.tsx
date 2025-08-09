// src/components/notifications/NotificationBell.tsx
import React, { useState } from 'react';
import { Badge, Button, Tooltip } from 'antd';
import { BellOutlined } from '@ant-design/icons';
import { useNotifications } from '@/contexts/NotificationContext';
import NotificationCenter from './NotificationCenter';

interface NotificationBellProps {
  userRole: 'MAIN_CENTER' | 'SUB_CENTER' | 'BENEFICIARY';
  userId: string;
}

const NotificationBell: React.FC<NotificationBellProps> = ({ userRole, userId }) => {
  const [visible, setVisible] = useState(false);
  const { stats } = useNotifications();

  return (
    <>
      <Tooltip title="Notifications">
        <Badge count={stats.unread} size="small" offset={[-2, 2]}>
          <Button
            type="text"
            icon={<BellOutlined />}
            onClick={() => setVisible(true)}
            style={{
              border: 'none',
              boxShadow: 'none',
              fontSize: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: stats.priority > 0 ? '#ff4d4f' : 'inherit'
            }}
          />
        </Badge>
      </Tooltip>
      
      <NotificationCenter
        visible={visible}
        onClose={() => setVisible(false)}
        userRole={userRole}
        userId={userId}
      />
    </>
  );
};

export default NotificationBell;
