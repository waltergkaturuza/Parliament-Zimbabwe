import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Alert,
  CircularProgress,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { userProfileService, UserProfile, UserProfileUpdate } from '../../services/userProfileService';

interface ProfileEditDialogProps {
  open: boolean;
  onClose: () => void;
  profile: UserProfile | null;
  onProfileUpdate: (updatedProfile: UserProfile) => void;
}

const ProfileEditDialog: React.FC<ProfileEditDialogProps> = ({
  open,
  onClose,
  profile,
  onProfileUpdate,
}) => {
  const [formData, setFormData] = useState<UserProfileUpdate>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (profile && open) {
      setFormData({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        date_of_birth: profile.date_of_birth || '',
        address: profile.address || '',
        national_id: profile.national_id || '',
        employee_id: profile.employee_id || '',
        department: profile.department || '',
        position: profile.position || '',
        bio: profile.bio || '',
        preferred_language: profile.preferred_language || 'en',
        timezone: profile.timezone || 'Africa/Harare',
        emergency_contact_name: profile.emergency_contact_name || '',
        emergency_contact_phone: profile.emergency_contact_phone || '',
      });
      setError(null);
    }
  }, [profile, open]);

  const handleChange = (field: keyof UserProfileUpdate) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | any
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target ? event.target.value : event,
    }));
  };

  const handleDateChange = (date: Date | null) => {
    setFormData(prev => ({
      ...prev,
      date_of_birth: date ? date.toISOString().split('T')[0] : '',
    }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      // Remove empty fields
      const cleanedData = Object.entries(formData).reduce((acc, [key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          acc[key as keyof UserProfileUpdate] = value;
        }
        return acc;
      }, {} as UserProfileUpdate);

      const updatedProfile = await userProfileService.updateCurrentUserProfile(cleanedData);
      onProfileUpdate(updatedProfile);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Edit Profile</DialogTitle>
      <DialogContent>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <Box sx={{ mt: 2 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Grid container spacing={2}>
              {/* Personal Information */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="First Name"
                  value={formData.first_name || ''}
                  onChange={handleChange('first_name')}
                  disabled={loading}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Last Name"
                  value={formData.last_name || ''}
                  onChange={handleChange('last_name')}
                  disabled={loading}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={formData.email || ''}
                  onChange={handleChange('email')}
                  disabled={loading}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone"
                  value={formData.phone || ''}
                  onChange={handleChange('phone')}
                  disabled={loading}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="Date of Birth"
                  value={formData.date_of_birth ? new Date(formData.date_of_birth) : null}
                  onChange={handleDateChange}
                  disabled={loading}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="National ID"
                  value={formData.national_id || ''}
                  onChange={handleChange('national_id')}
                  disabled={loading}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Address"
                  multiline
                  rows={2}
                  value={formData.address || ''}
                  onChange={handleChange('address')}
                  disabled={loading}
                />
              </Grid>

              {/* Work Information */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Employee ID"
                  value={formData.employee_id || ''}
                  onChange={handleChange('employee_id')}
                  disabled={loading}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Department"
                  value={formData.department || ''}
                  onChange={handleChange('department')}
                  disabled={loading}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Position"
                  value={formData.position || ''}
                  onChange={handleChange('position')}
                  disabled={loading}
                />
              </Grid>

              {/* Preferences */}
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth disabled={loading}>
                  <InputLabel>Preferred Language</InputLabel>
                  <Select
                    value={formData.preferred_language || 'en'}
                    onChange={handleChange('preferred_language')}
                    label="Preferred Language"
                  >
                    <MenuItem value="en">English</MenuItem>
                    <MenuItem value="sn">Shona</MenuItem>
                    <MenuItem value="nd">Ndebele</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth disabled={loading}>
                  <InputLabel>Timezone</InputLabel>
                  <Select
                    value={formData.timezone || 'Africa/Harare'}
                    onChange={handleChange('timezone')}
                    label="Timezone"
                  >
                    <MenuItem value="Africa/Harare">Africa/Harare</MenuItem>
                    <MenuItem value="UTC">UTC</MenuItem>
                    <MenuItem value="Africa/Johannesburg">Africa/Johannesburg</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Emergency Contact */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Emergency Contact Name"
                  value={formData.emergency_contact_name || ''}
                  onChange={handleChange('emergency_contact_name')}
                  disabled={loading}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Emergency Contact Phone"
                  value={formData.emergency_contact_phone || ''}
                  onChange={handleChange('emergency_contact_phone')}
                  disabled={loading}
                />
              </Grid>

              {/* Bio */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Bio"
                  multiline
                  rows={3}
                  value={formData.bio || ''}
                  onChange={handleChange('bio')}
                  disabled={loading}
                  helperText="Tell us a bit about yourself (max 500 characters)"
                  inputProps={{ maxLength: 500 }}
                />
              </Grid>
            </Grid>
          </Box>
        </LocalizationProvider>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProfileEditDialog;
