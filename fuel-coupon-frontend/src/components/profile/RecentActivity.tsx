import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Chip,
  Divider,
  CircularProgress,
  Alert,
  Button,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  History as HistoryIcon,
  Login as LoginIcon,
  Logout as LogoutIcon,
  Edit as EditIcon,
  Security as SecurityIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Visibility as ViewIcon,
  Settings as SettingsIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { userProfileService, RecentActivityItem } from '../../services/userProfileService';

interface RecentActivityProps {
  maxItems?: number;
  showHeader?: boolean;
  showRefresh?: boolean;
}

const RecentActivity: React.FC<RecentActivityProps> = ({
  maxItems = 10,
  showHeader = true,
  showRefresh = true,
}) => {
  const [activities, setActivities] = useState<RecentActivityItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await userProfileService.getRecentActivity();
      setActivities(response.activities.slice(0, maxItems));
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to load recent activity');
      console.error('Failed to load recent activity:', err);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action: string) => {
    const iconProps = { fontSize: 'small' as const };
    
    switch (action.toLowerCase()) {
      case 'login':
      case 'signed_in':
        return <LoginIcon {...iconProps} />;
      case 'logout':
      case 'signed_out':
        return <LogoutIcon {...iconProps} />;
      case 'create':
      case 'created':
      case 'add':
      case 'added':
        return <AddIcon {...iconProps} />;
      case 'update':
      case 'updated':
      case 'edit':
      case 'edited':
      case 'modified':
        return <EditIcon {...iconProps} />;
      case 'delete':
      case 'deleted':
      case 'remove':
      case 'removed':
        return <DeleteIcon {...iconProps} />;
      case 'view':
      case 'viewed':
      case 'access':
      case 'accessed':
        return <ViewIcon {...iconProps} />;
      case 'security':
      case 'password_change':
      case 'password_changed':
        return <SecurityIcon {...iconProps} />;
      case 'settings':
      case 'configure':
      case 'configured':
        return <SettingsIcon {...iconProps} />;
      default:
        return <HistoryIcon {...iconProps} />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action.toLowerCase()) {
      case 'login':
      case 'signed_in':
      case 'create':
      case 'created':
      case 'add':
      case 'added':
        return 'success';
      case 'logout':
      case 'signed_out':
      case 'delete':
      case 'deleted':
      case 'remove':
      case 'removed':
        return 'error';
      case 'update':
      case 'updated':
      case 'edit':
      case 'edited':
      case 'modified':
      case 'security':
      case 'password_change':
      case 'password_changed':
        return 'warning';
      case 'view':
      case 'viewed':
      case 'access':
      case 'accessed':
        return 'info';
      default:
        return 'default';
    }
  };

  const formatModel = (model: string) => {
    return model
      .split('.')
      .pop()
      ?.replace(/([A-Z])/g, ' $1')
      .trim() || model;
  };

  const getTimeAgo = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch {
      return 'Unknown time';
    }
  };

  if (loading && activities.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" py={4}>
        <CircularProgress size={24} />
        <Typography sx={{ ml: 2 }}>Loading activity...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {showHeader && (
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Box display="flex" alignItems="center" gap={1}>
            <HistoryIcon />
            <Typography variant="h6">Recent Activity</Typography>
          </Box>
          {showRefresh && (
            <Tooltip title="Refresh">
              <IconButton onClick={loadActivities} disabled={loading} size="small">
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
          <Button onClick={loadActivities} size="small" sx={{ ml: 1 }}>
            Retry
          </Button>
        </Alert>
      )}

      {activities.length === 0 && !loading && !error && (
        <Box textAlign="center" py={4}>
          <HistoryIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="body1" color="textSecondary">
            No recent activity to display
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Your account actions will appear here
          </Typography>
        </Box>
      )}

      {activities.length > 0 && (
        <List sx={{ width: '100%' }}>
          {activities.map((activity, index) => (
            <React.Fragment key={`${activity.timestamp}-${index}`}>
              <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                <ListItemAvatar>
                  <Avatar
                    sx={{
                      bgcolor: `${getActionColor(activity.action)}.main`,
                      width: 36,
                      height: 36,
                    }}
                  >
                    {getActionIcon(activity.action)}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                      <Typography variant="body1" component="span">
                        {activity.description}
                      </Typography>
                      <Chip
                        label={formatModel(activity.model)}
                        size="small"
                        variant="outlined"
                        color={getActionColor(activity.action)}
                      />
                    </Box>
                  }
                  secondary={
                    <Box mt={0.5}>
                      <Typography variant="body2" color="textSecondary" component="span">
                        {getTimeAgo(activity.timestamp)}
                      </Typography>
                      {activity.ip_address && (
                        <Typography
                          variant="caption"
                          color="textSecondary"
                          component="span"
                          sx={{ ml: 2 }}
                        >
                          IP: {activity.ip_address}
                        </Typography>
                      )}
                    </Box>
                  }
                />
              </ListItem>
              {index < activities.length - 1 && <Divider variant="inset" component="li" />}
            </React.Fragment>
          ))}
        </List>
      )}

      {loading && activities.length > 0 && (
        <Box display="flex" justifyContent="center" mt={2}>
          <CircularProgress size={20} />
        </Box>
      )}
    </Box>
  );
};

export default RecentActivity;
