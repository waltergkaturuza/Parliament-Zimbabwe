import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  FormGroup,
  FormControlLabel,
  Switch,
  Divider,
  Alert,
  CircularProgress,
  Chip,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Email as EmailIcon,
  Sms as SmsIcon,
  Security as SecurityIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';
import { userProfileService, NotificationPreferences } from '../../services/userProfileService';

interface NotificationItem {
  key: keyof NotificationPreferences;
  label: string;
  description: string;
  icon?: React.ReactElement;
  recommended?: boolean;
}

interface NotificationSection {
  title: string;
  icon: React.ReactElement;
  items: NotificationItem[];
}

interface NotificationSettingsProps {
  open: boolean;
  onClose: () => void;
  userId?: string;
}
  open,
  onClose,
  userId,
const NotificationSettings: React.FC<NotificationSettingsProps> = ({
  open,
  onClose,
  userId,
}) => {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    email_notifications: true,
    sms_notifications: false,
    push_notifications: true,
    coupon_alerts: true,
    system_alerts: true,
    fuel_price_updates: true,
    account_updates: true,
    security_alerts: true,
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (open) {
      loadNotificationPreferences();
    }
  }, [open, userId]);

  const loadNotificationPreferences = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await userProfileService.getNotificationPreferences();
      setPreferences(response.preferences);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to load notification preferences');
      console.error('Failed to load notification preferences:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePreferenceChange = (key: keyof NotificationPreferences) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setPreferences(prev => ({
      ...prev,
      [key]: event.target.checked,
    }));
    setSuccess(false);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      
      await userProfileService.updateNotificationPreferences(preferences);
      setSuccess(true);
      
      // Auto-close after showing success message
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to update notification preferences');
      console.error('Failed to update notification preferences:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (!saving && !loading) {
      setSuccess(false);
      setError(null);
      onClose();
    }
  };

  const notificationSections: NotificationSection[] = [
    {
      title: 'Communication Channels',
      icon: <NotificationsIcon />,
      items: [
        {
          key: 'email_notifications',
          label: 'Email Notifications',
          description: 'Receive notifications via email',
          icon: <EmailIcon fontSize="small" />,
        },
        {
          key: 'sms_notifications',
          label: 'SMS Notifications',
          description: 'Receive notifications via SMS (charges may apply)',
          icon: <SmsIcon fontSize="small" />,
        },
        {
          key: 'push_notifications',
          label: 'Push Notifications',
          description: 'Receive browser/app push notifications',
          icon: <NotificationsIcon fontSize="small" />,
        },
      ],
    },
    {
      title: 'Fuel & Coupon Alerts',
      icon: <BusinessIcon />,
      items: [
        {
          key: 'fuel_price_updates',
          label: 'Fuel Price Updates',
          description: 'Price changes, availability updates, delivery schedules',
          recommended: true,
        },
        {
          key: 'coupon_alerts',
          label: 'Coupon Alerts',
          description: 'New distributions, expiration reminders, usage updates',
          recommended: true,
        },
      ],
    },
    {
      title: 'System & Security',
      icon: <SecurityIcon />,
      items: [
        {
          key: 'system_alerts',
          label: 'System Alerts',
          description: 'Scheduled maintenance, downtime notifications',
        },
        {
          key: 'security_alerts',
          label: 'Security Alerts',
          description: 'Login attempts, password changes, account activity',
          recommended: true,
        },
      ],
    },
    {
      title: 'Account Updates',
      icon: <BusinessIcon />,
      items: [
        {
          key: 'account_updates',
          label: 'Account Updates',
          description: 'Profile changes, account status updates',
        },
      ],
    },
  ];

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <NotificationsIcon />
          Notification Settings
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 1 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Notification preferences updated successfully!
            </Alert>
          )}

          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" py={4}>
              <CircularProgress />
              <Typography sx={{ ml: 2 }}>Loading preferences...</Typography>
            </Box>
          ) : (
            <Box>
              {notificationSections.map((section, sectionIndex) => (
                <Box key={section.title} sx={{ mb: 3 }}>
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    {section.icon}
                    <Typography variant="h6">{section.title}</Typography>
                  </Box>

                  <FormGroup>
                    {section.items.map((item) => (
                      <Box key={item.key} sx={{ mb: 1 }}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={preferences[item.key]}
                              onChange={handlePreferenceChange(item.key)}
                              disabled={saving}
                            />
                          }
                          label={
                            <Box display="flex" alignItems="center" gap={1}>
                              {item.icon && item.icon}
                              <Box>
                                <Box display="flex" alignItems="center" gap={1}>
                                  <Typography variant="body1">{item.label}</Typography>
                                  {item.recommended && (
                                    <Chip
                                      label="Recommended"
                                      size="small"
                                      color="primary"
                                      variant="outlined"
                                    />
                                  )}
                                </Box>
                                <Typography variant="body2" color="textSecondary">
                                  {item.description}
                                </Typography>
                              </Box>
                            </Box>
                          }
                        />
                      </Box>
                    ))}
                  </FormGroup>

                  {sectionIndex < notificationSections.length - 1 && (
                    <Divider sx={{ mt: 2 }} />
                  )}
                </Box>
              ))}

              <Box mt={3} p={2} bgcolor="action.hover" borderRadius={1}>
                <Typography variant="body2" color="textSecondary">
                  <strong>Note:</strong> Critical security alerts and system-wide announcements 
                  will always be delivered regardless of your preferences to ensure account safety 
                  and system compliance.
                </Typography>
              </Box>
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={saving || loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={saving || loading}
          startIcon={saving ? <CircularProgress size={20} /> : null}
        >
          {saving ? 'Saving...' : 'Save Preferences'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NotificationSettings;
