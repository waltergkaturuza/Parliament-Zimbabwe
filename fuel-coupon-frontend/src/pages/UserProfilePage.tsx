import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Avatar,
  Button,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Card,
  CardContent,
  LinearProgress,
  IconButton,
} from '@mui/material';
import {
  Person as PersonIcon,
  Edit as EditIcon,
  PhotoCamera as PhotoCameraIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Work as WorkIcon,
  DateRange as DateRangeIcon,
  Security as SecurityIcon,
  Notifications as NotificationsIcon,
  Timeline as TimelineIcon,
  Assessment as AssessmentIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { userProfileService } from '../services/userProfileService';
import {
  ProfileEditDialog,
  AvatarUploadDialog,
  NotificationSettings,
  PasswordChangeDialog,
  RecentActivity,
} from '../components/profile';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index, ...other }: TabPanelProps) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const UserProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  
  // Dialog states
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false);
  const [notificationDialogOpen, setNotificationDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);

  useEffect(() => {
    loadProfile();
    loadStats();
  }, []);

  const loadProfile = async () => {
    try {
      const profileData = await userProfileService.getCurrentUserProfile();
      setProfile(profileData);
    } catch (err: any) {
      setError(err.message || 'Failed to load profile');
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await userProfileService.getProfileStats();
      setStats(statsData.stats);
    } catch (err: any) {
      console.error('Failed to load stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleProfileUpdate = (updatedProfile: any) => {
    setProfile(updatedProfile);
    setEditDialogOpen(false);
  };

  const handleAvatarUpdate = (updatedProfile: any) => {
    setProfile(updatedProfile);
    setAvatarDialogOpen(false);
  };

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      SUPERUSER: 'error',
      ADMIN: 'error',
      MAIN_CENTER: 'warning',
      SUB_CENTER: 'info',
      BENEFICIARY: 'success',
      AUDITOR: 'secondary',
      MAIN_CENTER_APPROVER: 'warning',
      SUB_CENTER_APPROVER: 'info',
    };
    return colors[role] || 'default';
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Profile Header */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item>
            <Box position="relative">
              <Avatar
                src={profile?.profile_picture_url}
                sx={{ width: 120, height: 120 }}
              >
                {profile?.display_name?.charAt(0)}
              </Avatar>
              <IconButton
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  backgroundColor: 'primary.main',
                  color: 'white',
                  '&:hover': { backgroundColor: 'primary.dark' },
                }}
                size="small"
                onClick={() => setAvatarDialogOpen(true)}
              >
                <PhotoCameraIcon fontSize="small" />
              </IconButton>
            </Box>
          </Grid>
          <Grid item xs>
            <Typography variant="h4" gutterBottom>
              {profile?.display_name}
            </Typography>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              @{profile?.username}
            </Typography>
            <Box display="flex" gap={1} alignItems="center" mb={2}>
              <Chip
                label={profile?.role}
                color={getRoleColor(profile?.role) as any}
                size="small"
              />
              {profile?.is_approved && (
                <Chip label="Verified" color="success" size="small" />
              )}
              {profile?.sub_center_name && (
                <Chip label={profile.sub_center_name} variant="outlined" size="small" />
              )}
            </Box>
            <Box display="flex" gap={1}>
              <Button
                variant="contained"
                startIcon={<EditIcon />}
                onClick={() => setEditDialogOpen(true)}
              >
                Edit Profile
              </Button>
              <Button
                variant="outlined"
                startIcon={<SecurityIcon />}
                onClick={() => setPasswordDialogOpen(true)}
              >
                Change Password
              </Button>
            </Box>
          </Grid>
          {stats && (
            <Grid item>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Profile Completion
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1}>
                    <LinearProgress
                      variant="determinate"
                      value={stats.profile_completion}
                      sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
                    />
                    <Typography variant="body2" color="text.secondary">
                      {stats.profile_completion}%
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      </Paper>

      {/* Profile Tabs */}
      <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab icon={<PersonIcon />} label="Overview" />
          <Tab icon={<NotificationsIcon />} label="Notifications" />
          <Tab icon={<TimelineIcon />} label="Activity" />
          <Tab icon={<AssessmentIcon />} label="Statistics" />
        </Tabs>

        {/* Overview Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Typography variant="h6" gutterBottom>
                Personal Information
              </Typography>
              <List>
                {profile?.email && (
                  <ListItem>
                    <ListItemIcon>
                      <EmailIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary="Email"
                      secondary={profile.email}
                    />
                  </ListItem>
                )}
                {profile?.phone && (
                  <ListItem>
                    <ListItemIcon>
                      <PhoneIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary="Phone"
                      secondary={profile.phone}
                    />
                  </ListItem>
                )}
                {profile?.address && (
                  <ListItem>
                    <ListItemIcon>
                      <LocationIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary="Address"
                      secondary={profile.address}
                    />
                  </ListItem>
                )}
                {profile?.date_of_birth && (
                  <ListItem>
                    <ListItemIcon>
                      <DateRangeIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary="Date of Birth"
                      secondary={new Date(profile.date_of_birth).toLocaleDateString()}
                    />
                  </ListItem>
                )}
              </List>

              {(profile?.department || profile?.position) && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Work Information
                  </Typography>
                  <List>
                    {profile?.department && (
                      <ListItem>
                        <ListItemIcon>
                          <WorkIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary="Department"
                          secondary={profile.department}
                        />
                      </ListItem>
                    )}
                    {profile?.position && (
                      <ListItem>
                        <ListItemIcon>
                          <WorkIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary="Position"
                          secondary={profile.position}
                        />
                      </ListItem>
                    )}
                    {profile?.employee_id && (
                      <ListItem>
                        <ListItemIcon>
                          <WorkIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary="Employee ID"
                          secondary={profile.employee_id}
                        />
                      </ListItem>
                    )}
                  </List>
                </>
              )}

              {profile?.bio && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    About
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {profile.bio}
                  </Typography>
                </>
              )}
            </Grid>

            <Grid item xs={12} md={4}>
              {stats && (
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Account Information
                    </Typography>
                    <List dense>
                      <ListItem>
                        <ListItemText
                          primary="Member Since"
                          secondary={new Date(profile?.date_joined).toLocaleDateString()}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary="Last Activity"
                          secondary={new Date(profile?.last_activity).toLocaleString()}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary="Account Age"
                          secondary={`${stats.account_age_days} days`}
                        />
                      </ListItem>
                      {stats.total_distributions && (
                        <ListItem>
                          <ListItemText
                            primary="Total Distributions"
                            secondary={stats.total_distributions}
                          />
                        </ListItem>
                      )}
                      {stats.total_transactions && (
                        <ListItem>
                          <ListItemText
                            primary="Total Transactions"
                            secondary={stats.total_transactions}
                          />
                        </ListItem>
                      )}
                    </List>
                  </CardContent>
                </Card>
              )}
            </Grid>
          </Grid>
        </TabPanel>

        {/* Notifications Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box>
            <Typography variant="h6" gutterBottom>
              Notification Preferences
            </Typography>
            <Typography variant="body2" color="textSecondary" paragraph>
              Manage how you receive notifications about fuel allocations, system updates, and more.
            </Typography>
            <Button
              variant="contained"
              startIcon={<SettingsIcon />}
              onClick={() => setNotificationDialogOpen(true)}
            >
              Configure Notifications
            </Button>
          </Box>
        </TabPanel>

        {/* Activity Tab */}
        <TabPanel value={tabValue} index={2}>
          <RecentActivity />
        </TabPanel>

        {/* Statistics Tab */}
        <TabPanel value={tabValue} index={3}>
          {stats && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Profile Stats
                    </Typography>
                    <List dense>
                      <ListItem>
                        <ListItemText
                          primary="Profile Completion"
                          secondary={`${stats.profile_completion}%`}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary="Role"
                          secondary={stats.role}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary="Account Status"
                          secondary={stats.is_approved ? 'Approved' : 'Pending Approval'}
                        />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </TabPanel>
      </Paper>

      {/* Dialogs */}
      <ProfileEditDialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        profile={profile}
        onProfileUpdate={handleProfileUpdate}
      />

      <AvatarUploadDialog
        open={avatarDialogOpen}
        onClose={() => setAvatarDialogOpen(false)}
        profile={profile}
        onAvatarUpdate={handleAvatarUpdate}
      />

      <NotificationSettings
        open={notificationDialogOpen}
        onClose={() => setNotificationDialogOpen(false)}
      />

      <PasswordChangeDialog
        open={passwordDialogOpen}
        onClose={() => setPasswordDialogOpen(false)}
      />
    </Container>
  );
};

export default UserProfilePage;
