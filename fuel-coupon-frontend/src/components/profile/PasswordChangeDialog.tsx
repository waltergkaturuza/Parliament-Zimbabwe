import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Alert,
  CircularProgress,
  LinearProgress,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Security as SecurityIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import { IconButton, InputAdornment } from '@mui/material';
import { userProfileService, PasswordChangeRequest } from '../../services/userProfileService';

interface PasswordChangeDialogProps {
  open: boolean;
  onClose: () => void;
}

interface PasswordStrength {
  score: number;
  feedback: string[];
  isValid: boolean;
}

const PasswordChangeDialog: React.FC<PasswordChangeDialogProps> = ({
  open,
  onClose,
}) => {
  const [formData, setFormData] = useState<PasswordChangeRequest>({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const validatePassword = (password: string): PasswordStrength => {
    const feedback: string[] = [];
    let score = 0;

    // Length check
    if (password.length >= 8) {
      score += 1;
    } else {
      feedback.push('At least 8 characters long');
    }

    // Uppercase check
    if (/[A-Z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('At least one uppercase letter');
    }

    // Lowercase check
    if (/[a-z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('At least one lowercase letter');
    }

    // Number check
    if (/\d/.test(password)) {
      score += 1;
    } else {
      feedback.push('At least one number');
    }

    // Special character check
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      score += 1;
    } else {
      feedback.push('At least one special character');
    }

    return {
      score,
      feedback,
      isValid: score >= 4,
    };
  };

  const passwordStrength = validatePassword(formData.new_password);
  const passwordsMatch = formData.new_password === formData.confirm_password;

  const getStrengthColor = (score: number) => {
    if (score < 2) return 'error';
    if (score < 4) return 'warning';
    return 'success';
  };

  const getStrengthLabel = (score: number) => {
    if (score < 2) return 'Weak';
    if (score < 4) return 'Medium';
    return 'Strong';
  };

  const handleChange = (field: keyof PasswordChangeRequest) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value,
    }));
    setError(null);
    setSuccess(false);
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.current_password) {
      setError('Current password is required');
      return;
    }

    if (!passwordStrength.isValid) {
      setError('New password does not meet requirements');
      return;
    }

    if (!passwordsMatch) {
      setError('New passwords do not match');
      return;
    }

    if (formData.current_password === formData.new_password) {
      setError('New password must be different from current password');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await userProfileService.changePassword(formData);
      setSuccess(true);

      // Reset form
      setFormData({
        current_password: '',
        new_password: '',
        confirm_password: '',
      });

      // Auto-close after showing success message
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        current_password: '',
        new_password: '',
        confirm_password: '',
      });
      setError(null);
      setSuccess(false);
      onClose();
    }
  };

  const isFormValid = 
    formData.current_password &&
    passwordStrength.isValid &&
    passwordsMatch &&
    formData.current_password !== formData.new_password;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <SecurityIcon />
          Change Password
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Password changed successfully! You will be redirected to login.
            </Alert>
          )}

          {/* Current Password */}
          <TextField
            fullWidth
            label="Current Password"
            type={showPasswords.current ? 'text' : 'password'}
            value={formData.current_password}
            onChange={handleChange('current_password')}
            disabled={loading}
            margin="normal"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => togglePasswordVisibility('current')}
                    edge="end"
                  >
                    {showPasswords.current ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          {/* New Password */}
          <TextField
            fullWidth
            label="New Password"
            type={showPasswords.new ? 'text' : 'password'}
            value={formData.new_password}
            onChange={handleChange('new_password')}
            disabled={loading}
            margin="normal"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => togglePasswordVisibility('new')}
                    edge="end"
                  >
                    {showPasswords.new ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          {/* Password Strength Indicator */}
          {formData.new_password && (
            <Box sx={{ mt: 2, mb: 2 }}>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <Typography variant="body2" color="textSecondary">
                  Password Strength:
                </Typography>
                <Chip
                  label={getStrengthLabel(passwordStrength.score)}
                  color={getStrengthColor(passwordStrength.score)}
                  size="small"
                />
              </Box>
              <LinearProgress
                variant="determinate"
                value={(passwordStrength.score / 5) * 100}
                color={getStrengthColor(passwordStrength.score)}
                sx={{ height: 8, borderRadius: 4 }}
              />
              
              {passwordStrength.feedback.length > 0 && (
                <Box mt={1}>
                  <Typography variant="caption" color="textSecondary">
                    Requirements:
                  </Typography>
                  <List dense>
                    {[
                      'At least 8 characters long',
                      'At least one uppercase letter',
                      'At least one lowercase letter',
                      'At least one number',
                      'At least one special character',
                    ].map((requirement) => {
                      const isMet = !passwordStrength.feedback.includes(requirement);
                      return (
                        <ListItem key={requirement} sx={{ py: 0 }}>
                          <ListItemIcon sx={{ minWidth: 32 }}>
                            {isMet ? (
                              <CheckCircleIcon color="success" fontSize="small" />
                            ) : (
                              <CancelIcon color="error" fontSize="small" />
                            )}
                          </ListItemIcon>
                          <ListItemText
                            primary={requirement}
                            primaryTypographyProps={{
                              variant: 'caption',
                              color: isMet ? 'success.main' : 'error.main',
                            }}
                          />
                        </ListItem>
                      );
                    })}
                  </List>
                </Box>
              )}
            </Box>
          )}

          {/* Confirm Password */}
          <TextField
            fullWidth
            label="Confirm New Password"
            type={showPasswords.confirm ? 'text' : 'password'}
            value={formData.confirm_password}
            onChange={handleChange('confirm_password')}
            disabled={loading}
            margin="normal"
            error={formData.confirm_password && !passwordsMatch}
            helperText={
              formData.confirm_password && !passwordsMatch
                ? 'Passwords do not match'
                : ''
            }
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => togglePasswordVisibility('confirm')}
                    edge="end"
                  >
                    {showPasswords.confirm ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          {/* Security Tips */}
          <Box mt={3} p={2} bgcolor="action.hover" borderRadius={1}>
            <Typography variant="body2" color="textSecondary">
              <strong>Security Tips:</strong>
              <br />
              • Use a unique password that you don't use elsewhere
              <br />
              • Consider using a password manager
              <br />
              • Avoid using personal information like names or dates
              <br />
              • Change your password regularly
            </Typography>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!isFormValid || loading}
          startIcon={loading ? <CircularProgress size={20} /> : <SecurityIcon />}
        >
          {loading ? 'Changing...' : 'Change Password'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PasswordChangeDialog;
