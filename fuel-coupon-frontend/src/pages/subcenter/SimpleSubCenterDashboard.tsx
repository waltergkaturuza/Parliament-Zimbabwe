// src/pages/subcenter/SimpleSubCenterDashboard.tsx
import React from 'react';
import {
  Typography, Container, Card, CardContent, Box, Button
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { SubCenterService } from "../../api/subcenters";
import { RecentActivityService } from "../../api/recentActivity";
import {
  UserOutlined, TeamOutlined, FileTextOutlined, SettingOutlined,
  PlusOutlined, CopyOutlined, CheckCircleOutlined
} from '@ant-design/icons';

// Styled components
const StyledCard = styled(Card)(({ theme }) => ({
  boxShadow: theme.shadows[2],
  height: '100%',
  cursor: 'pointer',
  transition: 'transform 0.2s ease-in-out',
  '&:hover': {
    transform: 'translateY(-4px)',
  },
}));

// Enhanced styled components for stats
const StatCard = styled(Card)(({ theme }) => ({
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  color: 'white',
  height: '100%',
  transition: 'transform 0.2s ease-in-out',
  '&:hover': {
    transform: 'translateY(-4px)',
  },
}));

const StatValue = styled(Typography)(({ theme }) => ({
  fontSize: '2.5rem',
  fontWeight: 'bold',
  marginBottom: theme.spacing(1),
}));

const StatLabel = styled(Typography)(({ theme }) => ({
  fontSize: '0.875rem',
  opacity: 0.9,
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  marginBottom: theme.spacing(2),
  color: theme.palette.primary.main,
}));

// Interface definitions
interface SubCenterStats {
  total_coupons_assigned: number;
  available_coupons: number;
  recently_distributed: number;
}

interface ActivityItem {
  id: string;
  action: string;
  timestamp: string;
  user: string;
}

const StyledCardContent = styled(CardContent)(({ theme }) => ({
  padding: theme.spacing(3),
  textAlign: 'center',
}));

const DashboardTitle = styled(Typography)(({ theme }) => ({
  fontSize: 28,
  fontWeight: 'bold',
  color: 'white',
  marginBottom: theme.spacing(1),
}));

const WelcomeCard = styled(Card)(({ theme }) => ({
  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
  color: 'white',
  marginBottom: theme.spacing(4),
}));

const ActionCard = ({ 
  title, 
  description, 
  icon, 
  path, 
  color = '#1976d2',
  onClick 
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  path?: string;
  color?: string;
  onClick?: () => void;
}) => {
  const navigate = useNavigate();
  
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (path) {
      navigate(path);
    }
  };

  return (
    <StyledCard onClick={handleClick}>
      <StyledCardContent>
        <Box sx={{ fontSize: 48, color, mb: 2 }}>
          {icon}
        </Box>
        <Typography variant="h6" component="h3" gutterBottom>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
      </StyledCardContent>
    </StyledCard>
  );
};

const SimpleSubCenterDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const subCenterId = user?.centerId?.toString();

  // Show error if no subcenter ID is available
  if (!subCenterId) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Card>
          <CardContent>
            <Typography variant="h6" color="error">
              Unable to load SubCenter Dashboard
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Your account is not associated with a subcenter. Please contact your administrator.
            </Typography>
          </CardContent>
        </Card>
      </Container>
    );
  }

  // Fetch subcenter statistics
  const { data: stats, isLoading, isError } = useQuery<SubCenterStats>({
    queryKey: ['subcenter-dashboard-stats', subCenterId],
    queryFn: () => SubCenterService.getSubCenterStatistics(subCenterId),
    enabled: !!subCenterId,
    refetchInterval: 60000, // Refresh every minute
  });

  // Fetch recent activities
  const { data: recentActivities } = useQuery<ActivityItem[]>({
    queryKey: ['recent-activity', subCenterId],
    queryFn: () => RecentActivityService.getSubCenterActivity(subCenterId),
    enabled: !!subCenterId,
  });

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Welcome Section */}
      <WelcomeCard>
        <CardContent sx={{ p: 4 }}>
          <DashboardTitle variant="h4">
            Welcome to Sub Center Operations
          </DashboardTitle>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Hello, {user?.name || user?.username || 'Sub Center Manager'}!
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.9 }}>
            Manage fuel distribution, inventory, and beneficiary services from your centralized dashboard.
          </Typography>
        </CardContent>
      </WelcomeCard>

      {/* Real-time Statistics */}
      <Box sx={{ mb: 4 }}>
        <SectionTitle variant="h5">
          Current Statistics
        </SectionTitle>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 2 }}>
          {[
            { label: 'Total Coupons Assigned', value: stats?.total_coupons_assigned },
            { label: 'Available Coupons', value: stats?.available_coupons },
            { label: 'Recently Distributed', value: stats?.recently_distributed }
          ].map(({ label, value }) => (
            <StatCard key={label}>
              <CardContent>
                <StatValue>
                  {isLoading ? '...' : (value !== null && value !== undefined ? value : 'N/A')}
                </StatValue>
                <StatLabel>{label}</StatLabel>
              </CardContent>
            </StatCard>
          ))}
        </Box>
      </Box>

      {/* Recent Activity */}
      <Box sx={{ mb: 4 }}>
        <SectionTitle variant="h5">
          Recent Activity
        </SectionTitle>
        <Card>
          <CardContent>
            {recentActivities?.length ? (
              <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                {recentActivities.map((activity) => (
                  <Box key={activity.id} sx={{ mb: 2, pb: 2, borderBottom: '1px solid #f0f0f0' }}>
                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                      <strong>{activity.user}</strong>: {activity.action}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {activity.timestamp}
                    </Typography>
                  </Box>
                ))}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No recent activity to display.
              </Typography>
            )}
          </CardContent>
        </Card>
      </Box>

      {/* Quick Actions Grid */}
      <Box sx={{ mb: 4 }}>
        <SectionTitle variant="h5">
          Quick Actions
        </SectionTitle>
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { 
            xs: '1fr', 
            sm: 'repeat(2, 1fr)', 
            md: 'repeat(3, 1fr)' 
          }, 
          gap: 3 
        }}>
          <ActionCard
            title="Beneficiary Management"
            description="View and manage beneficiaries in your sub center"
            icon={<TeamOutlined />}
            path="/dashboard/beneficiaries"
            color="#52c41a"
          />

          <ActionCard
            title="Add New Beneficiary"
            description="Register a new beneficiary to the system"
            icon={<PlusOutlined />}
            path="/dashboard/beneficiaries"
            color="#1890ff"
          />

          <ActionCard
            title="Inventory Overview"
            description="Check available fuel coupons and inventory status"
            icon={<CopyOutlined />}
            path="/dashboard/subcenter-inventory"
            color="#faad14"
          />

          <ActionCard
            title="Allocation Tracking"
            description="Track fuel allocations and distributions"
            icon={<CheckCircleOutlined />}
            path="/dashboard/fuel-allocations"
            color="#722ed1"
          />

          <ActionCard
            title="Reports & Records"
            description="Access reports and transaction records"
            icon={<FileTextOutlined />}
            path="/dashboard/analytics"
            color="#f5222d"
          />

          <ActionCard
            title="Center Settings"
            description="Configure sub center settings and preferences"
            icon={<SettingOutlined />}
            path="/dashboard/settings"
            color="#13c2c2"
          />
        </Box>
      </Box>

      {/* Help & Support */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Need Help?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Access documentation, tutorials, and support resources.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button 
              variant="outlined" 
              onClick={() => window.open('https://help.parliament.gov.zw', '_blank')}
            >
              Documentation
            </Button>
            <Button 
              variant="outlined" 
              onClick={() => window.open('https://support.parliament.gov.zw', '_blank')}
            >
              Contact Support
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
};

export default SimpleSubCenterDashboard;
