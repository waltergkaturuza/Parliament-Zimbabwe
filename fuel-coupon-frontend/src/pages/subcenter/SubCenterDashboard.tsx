// src/pages/subcenter/SubCenterDashboard.tsx
import React, { useState } from 'react';
import {
  Typography, Container, Card, CardContent, Button, Box, Tabs, Tab
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { SubCenterService } from "../../api/subcenters";
import { RecentActivityService } from "../../api/recentActivity";
import QuickActionFormsWrapper from '@/components/subcenter/QuickActionFormsWrapper';
import BeneficiaryFuelRequest from '@/components/beneficiary/BeneficiaryFuelRequest';
import {
  PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend
} from 'recharts';

// Styled components
const StyledCard = styled(Card)(({ theme }) => ({
  boxShadow: theme.shadows[2],
}));

const StyledCardContent = styled(CardContent)(({ theme }) => ({
  padding: theme.spacing(3),
}));

const DashboardTitle = styled(Typography)(({ theme }) => ({
  fontSize: 24,
  fontWeight: 500,
  marginBottom: theme.spacing(3),
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
  fontSize: 18,
  fontWeight: 500,
  marginBottom: theme.spacing(2),
  color: theme.palette.text.secondary,
}));

const StatValue = styled(Typography)(({ theme }) => ({
  fontSize: 20,
  fontWeight: 700,
}));

const StatLabel = styled(Typography)(({ theme }) => ({
  fontSize: 14,
  color: theme.palette.text.secondary,
}));

// Interfaces
interface SubCenterStats {
  total_coupons_assigned: number | null;
  available_coupons: number | null;
  recently_distributed: number | null;
}

interface ActivityItem {
  id: number;
  action: string;
  timestamp: string;
  user: string;
}

// Main component
const SubCenterDashboard: React.FC = () => {
  const { user } = useAuth();
  const subCenterId = user?.centerId?.toString();
  const [activeTab, setActiveTab] = useState(0);

  // Show error if no subcenter ID is available
  if (!subCenterId) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Card>
          <StyledCardContent>
            <Typography variant="h6" color="error">
              Unable to load SubCenter Dashboard
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Your account is not associated with a subcenter. Please contact your administrator.
            </Typography>
          </StyledCardContent>
        </Card>
      </Container>
    );
  }

  const { data: stats, isLoading, isError } = useQuery<SubCenterStats>({
    queryKey: ['subcenter-dashboard-stats', subCenterId],
    queryFn: () => SubCenterService.getSubCenterStatistics(subCenterId),
    enabled: !!subCenterId,
    refetchInterval: 60000,
  });

  const { data: recentActivities } = useQuery<ActivityItem[]>({
    queryKey: ['recent-activity', subCenterId],
    queryFn: () => RecentActivityService.getSubCenterActivity(subCenterId),
    enabled: !!subCenterId,
  });

  const chartData = [
    { name: 'Assigned', value: stats?.total_coupons_assigned || 0 },
    { name: 'Available', value: stats?.available_coupons || 0 },
    { name: 'Distributed', value: stats?.recently_distributed || 0 },
  ];

  const barChartData = [
    { month: 'Jan', distributed: 400 },
    { month: 'Feb', distributed: 300 },
    { month: 'Mar', distributed: 500 },
    { month: 'Apr', distributed: 200 },
  ];

  if (isLoading) return <Container><Typography>Loading...</Typography></Container>;
  if (isError) return <Container><Typography color="error">Error loading dashboard.</Typography></Container>;

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <Container maxWidth="lg">
      <DashboardTitle variant="h4" gutterBottom>Sub-Center Dashboard</DashboardTitle>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange} aria-label="dashboard tabs">
          <Tab label="Overview" />
          <Tab label="Quick Actions" />
          <Tab label="Beneficiary Services" />
        </Tabs>
      </Box>

      {activeTab === 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Stats Cards */}
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 2 }}>
            {[
              { label: 'Total Coupons Assigned', value: stats?.total_coupons_assigned },
              { label: 'Available Coupons', value: stats?.available_coupons },
              { label: 'Recently Distributed', value: stats?.recently_distributed }
            ].map(({ label, value }) => (
              <StyledCard key={label}>
                <StyledCardContent>
                  <StatValue>{value !== null && value !== undefined ? value : 'N/A'}</StatValue>
                  <StatLabel>{label}</StatLabel>
                </StyledCardContent>
              </StyledCard>
            ))}
          </Box>

          {/* Actions */}
          <Box>
            <SectionTitle variant="h6">Actions</SectionTitle>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 1 }}>
              {[
                { label: 'Allocate Coupons', to: '/subcenter/allocate-coupons' },
                { label: 'View Inventory', to: '/subcenter/view-inventory' },
                { label: 'Record Distribution', to: '/subcenter/record-distribution' }
              ].map(({ label, to }) => (
                <Button 
                  key={label}
                  component={Link} 
                  to={to} 
                  variant={label === 'Allocate Coupons' ? 'contained' : 'outlined'} 
                  color="primary"
                >
                  {label}
                </Button>
              ))}
            </Box>
          </Box>

          {/* Recent Activity */}
          <Box>
            <SectionTitle variant="h6">Recent Activity</SectionTitle>
            {recentActivities?.length ? (
              recentActivities.map((activity) => (
                <Typography key={activity.id} variant="body2">
                  [{activity.timestamp}] {activity.user}: {activity.action}
                </Typography>
              ))
            ) : (
              <Typography variant="body2">No recent activity to display.</Typography>
            )}
          </Box>

          {/* Charts */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
            <Box>
              <SectionTitle variant="h6">Coupon Stats Overview</SectionTitle>
              <PieChart width={300} height={250}>
                <Pie data={chartData} dataKey="value" cx="50%" cy="50%" outerRadius={70} label>
                  {chartData.map((entry, index) => (
                    <Cell key={index} fill={['#8884d8', '#82ca9d', '#ffc658'][index % 3]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </Box>

            <Box>
              <SectionTitle variant="h6">Monthly Distribution Trend</SectionTitle>
              <BarChart width={500} height={250} data={barChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="distributed" fill="#8884d8" />
              </BarChart>
            </Box>
          </Box>
        </Box>
      )}

      {activeTab === 1 && (
        <Box>
          <QuickActionFormsWrapper />
        </Box>
      )}

      {activeTab === 2 && (
        <Box>
          <BeneficiaryFuelRequest />
        </Box>
      )}
    </Container>
  );
};

export default SubCenterDashboard;
