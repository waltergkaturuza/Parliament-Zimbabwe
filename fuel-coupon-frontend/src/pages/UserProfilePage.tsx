// src/pages/UserProfilePage.tsx
import React, { useState } from 'react';
import {
  Container,
  Card,
  CardContent,
  Typography,
  Box,
  Avatar,
  Button,
  TextField,
  Grid,
  Divider,
  Chip,
  Alert,
  Paper,
  Tab,
  Tabs
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useAuth } from '@/contexts/AuthContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { ProfileService, ProfileUpdateData } from '@/api/profile';
import {
  PersonOutlined,
  EmailOutlined,
  PhoneOutlined,
  LocationOnOutlined,
  BusinessOutlined,
  EditOutlined,
  SaveOutlined,
  CancelOutlined,
  SecurityOutlined,
  NotificationsOutlined
} from '@mui/icons-material';

// Styled components
const ProfileHeader = styled(Card)(({ theme }) => ({
  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
  color: 'white',
  marginBottom: theme.spacing(3),
}));

const ProfileAvatar = styled(Avatar)(({ theme }) => ({
  width: 120,
  height: 120,
  fontSize: '3rem',
  border: `4px solid ${theme.palette.common.white}`,
  boxShadow: theme.shadows[4],
}));

const InfoCard = styled(Card)(({ theme }) => ({
  height: '100%',
  transition: 'transform 0.2s ease-in-out',
  '&:hover': {
    transform: 'translateY(-2px)',
  },
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  marginBottom: theme.spacing(2),
  color: theme.palette.primary.main,
}));

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const UserProfilePage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    address: '',
    department: '',
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: (data: ProfileUpdateData) => ProfileService.updateProfile(data),
    onSuccess: (data) => {
      // Handle successful update
      setIsEditing(false);
      toast.success('Profile updated successfully');
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
    },
    onError: (error: any) => {
      toast.error(`Failed to update profile: ${error.message}`);
    },
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleInputChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleSave = () => {
    updateProfileMutation.mutate(formData);
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      phone: '',
      address: '',
      department: '',
    });
    setIsEditing(false);
  };

  const getUserInitials = () => {
    if (user?.name) {
      return user.name.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    return user?.username?.[0]?.toUpperCase() || 'U';
  };

  const getRoleColor = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'admin': return 'error';
      case 'manager': return 'warning';
      case 'operator': return 'info';
      case 'beneficiary': return 'success';
      default: return 'default';
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Profile Header */}
      <ProfileHeader>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <ProfileAvatar>
              {getUserInitials()}
            </ProfileAvatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h4" gutterBottom>
                {user?.name || user?.username || 'User Profile'}
              </Typography>
              <Typography variant="h6" sx={{ opacity: 0.9, mb: 1 }}>
                {user?.email}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip 
                  label={user?.role || 'User'} 
                  color={getRoleColor(user?.role || '')}
                  variant="outlined"
                  sx={{ color: 'white', borderColor: 'white' }}
                />
                {user?.centerId && (
                  <Chip 
                    label={`Center ID: ${user.centerId}`}
                    variant="outlined"
                    sx={{ color: 'white', borderColor: 'white' }}
                  />
                )}
              </Box>
            </Box>
            <Button
              variant="outlined"
              startIcon={isEditing ? <CancelOutlined /> : <EditOutlined />}
              onClick={isEditing ? handleCancel : () => setIsEditing(true)}
              sx={{ 
                color: 'white', 
                borderColor: 'white',
                '&:hover': {
                  borderColor: 'white',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)'
                }
              }}
            >
              {isEditing ? 'Cancel' : 'Edit Profile'}
            </Button>
          </Box>
        </CardContent>
      </ProfileHeader>

      {/* Alert for unsaved changes */}
      {isEditing && (
        <Alert severity="info" sx={{ mb: 3 }}>
          You are in edit mode. Make your changes and click "Save Changes" to update your profile.
        </Alert>
      )}

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          aria-label="profile tabs"
          variant="fullWidth"
        >
          <Tab 
            icon={<PersonOutlined />} 
            label="Personal Info" 
            id="profile-tab-0"
            aria-controls="profile-tabpanel-0"
          />
          <Tab 
            icon={<SecurityOutlined />} 
            label="Security" 
            id="profile-tab-1"
            aria-controls="profile-tabpanel-1"
          />
          <Tab 
            icon={<NotificationsOutlined />} 
            label="Preferences" 
            id="profile-tab-2"
            aria-controls="profile-tabpanel-2"
          />
        </Tabs>
      </Paper>

      {/* Tab Panels */}
      <TabPanel value={activeTab} index={0}>
        {/* Personal Information */}
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, 
          gap: 3 
        }}>
          <InfoCard>
            <CardContent>
              <SectionTitle variant="h6">
                Personal Information
              </SectionTitle>
              
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, 
                gap: 3 
              }}>
                <TextField
                  fullWidth
                  label="Full Name"
                  value={formData.name}
                  onChange={handleInputChange('name')}
                  disabled={!isEditing}
                  InputProps={{
                    startAdornment: <PersonOutlined sx={{ mr: 1, color: 'action.active' }} />
                  }}
                />
                
                <TextField
                  fullWidth
                  label="Email Address"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange('email')}
                  disabled={!isEditing}
                  InputProps={{
                    startAdornment: <EmailOutlined sx={{ mr: 1, color: 'action.active' }} />
                  }}
                />
                
                <TextField
                  fullWidth
                  label="Phone Number"
                  value={formData.phone}
                  onChange={handleInputChange('phone')}
                  disabled={!isEditing}
                  InputProps={{
                    startAdornment: <PhoneOutlined sx={{ mr: 1, color: 'action.active' }} />
                  }}
                />
                
                <TextField
                  fullWidth
                  label="Department"
                  value={formData.department}
                  onChange={handleInputChange('department')}
                  disabled={!isEditing}
                  InputProps={{
                    startAdornment: <BusinessOutlined sx={{ mr: 1, color: 'action.active' }} />
                  }}
                />
              </Box>
              
              <Box sx={{ mt: 3 }}>
                <TextField
                  fullWidth
                  label="Address"
                  multiline
                  rows={2}
                  value={formData.address}
                  onChange={handleInputChange('address')}
                  disabled={!isEditing}
                  InputProps={{
                    startAdornment: <LocationOnOutlined sx={{ mr: 1, color: 'action.active', alignSelf: 'flex-start', mt: 1 }} />
                  }}
                />
              </Box>

              {isEditing && (
                <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                  <Button
                    variant="contained"
                    startIcon={<SaveOutlined />}
                    onClick={handleSave}
                    disabled={updateProfileMutation.isPending}
                  >
                    {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<CancelOutlined />}
                    onClick={handleCancel}
                  >
                    Cancel
                  </Button>
                </Box>
              )}
            </CardContent>
          </InfoCard>

          <InfoCard>
            <CardContent>
              <SectionTitle variant="h6">
                Account Status
              </SectionTitle>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">Status:</Typography>
                  <Chip 
                    label="Active" 
                    color="success"
                    size="small"
                  />
                </Box>
                
                <Divider />
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">Role:</Typography>
                  <Chip 
                    label={user?.role || 'User'} 
                    color={getRoleColor(user?.role || '')}
                    size="small"
                  />
                </Box>
                
                <Divider />
                <Box>
                  <Typography variant="body2" color="text.secondary">User ID:</Typography>
                  <Typography variant="body2">
                    {user?.id || 'N/A'}
                  </Typography>
                </Box>
                
                {user?.centerId && (
                  <>
                    <Divider />
                    <Box>
                      <Typography variant="body2" color="text.secondary">Center ID:</Typography>
                      <Typography variant="body2">
                        {user.centerId}
                      </Typography>
                    </Box>
                  </>
                )}
              </Box>
            </CardContent>
          </InfoCard>
        </Box>
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        {/* Security Settings */}
        <InfoCard>
          <CardContent>
            <SectionTitle variant="h6">
              Security Settings
            </SectionTitle>
            
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, 
              gap: 3 
            }}>
              <Button
                variant="outlined"
                fullWidth
                sx={{ py: 2 }}
                onClick={() => {
                  // Handle change password
                  console.log('Change password clicked');
                }}
              >
                Change Password
              </Button>
              
              <Button
                variant="outlined"
                fullWidth
                sx={{ py: 2 }}
                onClick={() => {
                  // Handle 2FA setup
                  console.log('Setup 2FA clicked');
                }}
              >
                Setup Two-Factor Auth
              </Button>
            </Box>
            
            <Box sx={{ mt: 3 }}>
              <Typography variant="body2" color="text.secondary">
                Keep your account secure by using a strong password and enabling two-factor authentication.
              </Typography>
            </Box>
          </CardContent>
        </InfoCard>
      </TabPanel>

      <TabPanel value={activeTab} index={2}>
        {/* Preferences */}
        <InfoCard>
          <CardContent>
            <SectionTitle variant="h6">
              Notification Preferences
            </SectionTitle>
            
            <Typography variant="body2" color="text.secondary">
              Notification preferences will be available in a future update.
            </Typography>
          </CardContent>
        </InfoCard>
      </TabPanel>
    </Container>
  );
};

export default UserProfilePage;
