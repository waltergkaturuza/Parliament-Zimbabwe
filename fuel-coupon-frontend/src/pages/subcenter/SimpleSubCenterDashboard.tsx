// src/pages/subcenter/SimpleSubCenterDashboard.tsx
import React from 'react';
import {
  Typography, Container, Card, CardContent, Box, Grid, Button
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
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
    boxShadow: theme.shadows[4],
  },
}));

const StyledCardContent = styled(CardContent)(({ theme }) => ({
  padding: theme.spacing(3),
  textAlign: 'center',
}));

const DashboardTitle = styled(Typography)(({ theme }) => ({
  fontSize: 28,
  fontWeight: 600,
  marginBottom: theme.spacing(3),
  color: theme.palette.primary.main,
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

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Welcome Section */}
      <WelcomeCard>
        <CardContent sx={{ p: 4 }}>
          <DashboardTitle variant="h4">
            Welcome to Sub Center Operations
          </DashboardTitle>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Hello, {user?.name || user?.first_name || 'Sub Center Manager'}!
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.9 }}>
            Manage your sub center operations, beneficiaries, and fuel distributions from this dashboard.
          </Typography>
        </CardContent>
      </WelcomeCard>

      {/* Quick Actions Grid */}
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={4}>
          <ActionCard
            title="Beneficiary Management"
            description="View and manage beneficiaries in your sub center"
            icon={<TeamOutlined />}
            path="/parliament/beneficiary-management"
            color="#52c41a"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <ActionCard
            title="Add New Beneficiary"
            description="Register a new beneficiary to the system"
            icon={<PlusOutlined />}
            path="/parliament/beneficiary-management"
            color="#1890ff"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <ActionCard
            title="Inventory Overview"
            description="Check available fuel coupons and inventory status"
            icon={<CopyOutlined />}
            path="/subcenter/inventory"
            color="#faad14"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <ActionCard
            title="Allocation Tracking"
            description="Track fuel allocations and distributions"
            icon={<CheckCircleOutlined />}
            path="/subcenter/allocations"
            color="#722ed1"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <ActionCard
            title="Reports & Records"
            description="Access reports and transaction records"
            icon={<FileTextOutlined />}
            path="/reports"
            color="#f5222d"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <ActionCard
            title="Center Settings"
            description="Manage sub center settings and configuration"
            icon={<SettingOutlined />}
            path="/subcenter/settings"
            color="#13c2c2"
          />
        </Grid>
      </Grid>

      {/* Status Information */}
      <Box sx={{ mt: 4 }}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              System Status
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Sub Center ID: {user?.centerId || 'Not assigned'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Role: {user?.role}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Last Login: {new Date().toLocaleDateString()}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Help Section */}
      <Box sx={{ mt: 3 }}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Need Help?
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              If you need assistance with any sub center operations, please contact your main center administrator or system support.
            </Typography>
            <Button 
              variant="outlined" 
              onClick={() => navigate('/help')}
              sx={{ mr: 2 }}
            >
              Help Documentation
            </Button>
            <Button 
              variant="outlined" 
              onClick={() => navigate('/contact')}
            >
              Contact Support
            </Button>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};

export default SimpleSubCenterDashboard;
