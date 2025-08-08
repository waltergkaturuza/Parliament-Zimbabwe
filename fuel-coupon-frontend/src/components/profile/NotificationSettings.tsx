import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormGroup,
  FormControlLabel,
  Switch,
  Typography,
  Divider,
  Box,
  Alert,
  Snackbar,
} from '@mui/material';
import { Notifications, Email, Sms, Push } from '@mui/icons-material';

interface NotificationPreferences {
  email_enabled: boolean;
  sms_enabled: boolean;
  push_enabled: boolean;
  email_frequency: 'immediate' | 'daily' | 'weekly';
  notification_types: {
    system_updates: boolean;
    security_alerts: boolean;
    fuel_alerts: boolean;
    approval_requests: boolean;
  };
}

interface NotificationSettingsProps {
  open: boolean;
  onClose: () => void;
  userId: number;
}

const NotificationSettings: React.FC<NotificationSettingsProps> = ({
  open,
  onClose,
  userId,
}) => {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    email_enabled: true,
    sms_enabled: false,
    push_enabled: true,
    email_frequency: 'immediate',
    notification_types: {
      system_updates: true,
      security_alerts: true,
      fuel_alerts: true,
      approval_requests: true,
    },
  });
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && userId) {
      loadPreferences();
    }
  }, [open, userId]);

  const loadPreferences = async () => {
    try {
      // This would typically load from an API
      // For now, we'll use default values
      console.log('Loading notification preferences for user:', userId);
    } catch (err) {
      setError('Failed to load notification preferences');
    }
  };

  const handlePreferenceChange = (key: keyof NotificationPreferences, value: any) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleNotificationTypeChange = (type: keyof NotificationPreferences['notification_types'], value: boolean) => {
    setPreferences(prev => ({
      ...prev,
      notification_types: {
        ...prev.notification_types,
        [type]: value,
      },
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // This would typically save to an API
      console.log('Saving notification preferences:', preferences);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      setError('Failed to save notification preferences');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <Notifications />
            Notification Settings
          </Box>
        </DialogTitle>
        
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Configure how and when you want to receive notifications from the fuel coupon system.
          </Typography>

          {/* Notification Channels */}
          <Typography variant="h6" gutterBottom>
            Notification Channels
          </Typography>
          
          <FormGroup sx={{ mb: 3 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={preferences.email_enabled}
                  onChange={(e) => handlePreferenceChange('email_enabled', e.target.checked)}
                />
              }
              label={
                <Box display="flex" alignItems="center" gap={1}>
                  <Email fontSize="small" />
                  Email Notifications
                </Box>
              }
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={preferences.sms_enabled}
                  onChange={(e) => handlePreferenceChange('sms_enabled', e.target.checked)}
                />
              }
              label={
                <Box display="flex" alignItems="center" gap={1}>
                  <Sms fontSize="small" />
                  SMS Notifications
                </Box>
              }
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={preferences.push_enabled}
                  onChange={(e) => handlePreferenceChange('push_enabled', e.target.checked)}
                />
              }
              label={
                <Box display="flex" alignItems="center" gap={1}>
                  <Push fontSize="small" />
                  Push Notifications
                </Box>
              }
            />
          </FormGroup>

          <Divider sx={{ my: 2 }} />

          {/* Notification Types */}
          <Typography variant="h6" gutterBottom>
            Notification Types
          </Typography>
          
          <FormGroup>
            <FormControlLabel
              control={
                <Switch
                  checked={preferences.notification_types.system_updates}
                  onChange={(e) => handleNotificationTypeChange('system_updates', e.target.checked)}
                />
              }
              label="System Updates"
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={preferences.notification_types.security_alerts}
                  onChange={(e) => handleNotificationTypeChange('security_alerts', e.target.checked)}
                />
              }
              label="Security Alerts"
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={preferences.notification_types.fuel_alerts}
                  onChange={(e) => handleNotificationTypeChange('fuel_alerts', e.target.checked)}
                />
              }
              label="Fuel & Coupon Alerts"
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={preferences.notification_types.approval_requests}
                  onChange={(e) => handleNotificationTypeChange('approval_requests', e.target.checked)}
                />
              }
              label="Approval Requests"
            />
          </FormGroup>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            variant="contained" 
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Settings'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={success}
        autoHideDuration={3000}
        onClose={() => setSuccess(false)}
      >
        <Alert severity="success" onClose={() => setSuccess(false)}>
          Notification settings saved successfully!
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
      >
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>
    </>
  );
};

export default NotificationSettings;
