// src/pages/dashboard/MainDashboard.tsx
import React, { useEffect } from 'react';
import { Row as AntdRow, Col as AntdCol } from 'antd';
import { Box, Typography, Alert, Button, Divider, Paper } from '@mui/material';
import CircularProgress from '@mui/material/CircularProgress';
import DownloadIcon from '@mui/icons-material/Download';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import CustomLayout from '../../layouts/CustomLayout';
import AntdStatsCard from '@/components/shared/AntdStatsCard';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { getDashboardData } from '../../api/dashboard';

// Import your charts and forms
import AllocationChart from '../../components/charts/AllocationChart';
import BalanceTrendChart from '../../components/charts/BalanceTrendChart';
import FuelAllocationForm from '../../components/forms/FuelAllocationForm';
import FuelUsageForm from '../../components/forms/FuelUsageForm';
import AttendanceForm from '../../components/forms/AttendanceForm';

// --- DEBUG LOGS ---
console.log("MainDashboard: File Loaded");

// MainDashboard Component
const MainDashboard = () => {
  // Auth context
  const { user, accessToken, isAuthLoading } = useAuth();
  console.log("MainDashboard mounted/rendered", { user, accessToken, isAuthLoading });

  // Query to fetch dashboard data
  const {
    data,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['dashboardStatistics', user?.id],
    queryFn: async () => {
      console.log("Calling getDashboardData() in useQuery!");
      return getDashboardData();
    },
    enabled: !!user && !!accessToken && !isAuthLoading,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    // Test if AuthContext and API token are alive at mount
    console.log("useEffect: user, accessToken, isAuthLoading", { user, accessToken, isAuthLoading });

    // Try a manual call to the backend
    if (!!user && !!accessToken) {
      getDashboardData()
        .then((data) => {
          console.log("Manual dashboard data fetch (inside useEffect):", data);
        })
        .catch((err) => {
          console.error("Manual dashboard data fetch ERROR (inside useEffect):", err);
        });
    } else {
      console.log("Skipping manual fetch: Missing user or token");
    }

    // Print axios API base URL
    import('../api/index').then((module) => {
      console.log("Axios API baseURL is:", module.default.defaults.baseURL);
    });

    // Print localStorage token for debugging
    console.log("Token in localStorage is:", localStorage.getItem('authToken'));
  }, [user, accessToken, isAuthLoading]);

  // Loading state
  if (isAuthLoading || isLoading || isFetching) {
    console.log("Dashboard loading...", { isAuthLoading, isLoading, isFetching });
    return (
      <CustomLayout title="Loading Dashboard...">
        <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="60vh">
          <CircularProgress />
          <Typography sx={{ mt: 2 }}>Loading Dashboard Data...</Typography>
        </Box>
      </CustomLayout>
    );
  }

  // Error state
  if (error) {
    console.error("Dashboard error", error);
    return (
      <CustomLayout title="Dashboard Error">
        <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="60vh">
          <Alert severity="error" sx={{ mb: 2 }}>
            Failed to load dashboard data.<br />
            {(error as Error).message}
          </Alert>
          <Button onClick={() => refetch()} variant="contained" color="primary">
            Retry
          </Button>
        </Box>
      </CustomLayout>
    );
  }

  // No data (should never happen, but log it!)
  if (!data || !user) {
    console.warn("No dashboard data or user present", { data, user });
    return (
      <CustomLayout title="Dashboard">
        <Box minHeight="60vh" display="flex" alignItems="center" justifyContent="center">
          <Typography>No data available.</Typography>
        </Box>
      </CustomLayout>
    );
  }

  // Excel/PDF export handlers
  const handleDownloadExcel = () => {
    if (!data) return;
    const worksheet = XLSX.utils.json_to_sheet([data.coupon_stats]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Stats');
    XLSX.writeFile(workbook, 'dashboard-stats.xlsx');
  };
  const handleExportPDF = () => {
    if (!data) return;
    const doc = new jsPDF();
    doc.text('Fuel Coupon Dashboard Report', 10, 10);
    doc.save('dashboard-report.pdf');
  };

  // ---- Render the dashboard ----
  return (
    <CustomLayout title="Main Dashboard">
      <Box sx={{ p: 2 }}>
        <Typography variant="h4" mb={2}>Main Dashboard</Typography>
        <AntdRow gutter={[24, 24]} style={{ marginBottom: 32 }}>
          <AntdCol xs={24} sm={12} md={6}>
            <AntdStatsCard title="Total Coupons" value={data.coupon_stats.total_coupons} />
          </AntdCol>
          <AntdCol xs={24} sm={12} md={6}>
            <AntdStatsCard title="Fuel Available (L)" value={data.coupon_stats.total_fuel_volume_available} />
          </AntdCol>
          <AntdCol xs={24} sm={12} md={6}>
            <AntdStatsCard title="Fuel Consumed (L)" value={data.coupon_stats.total_fuel_volume_consumed} />
          </AntdCol>
          <AntdCol xs={24} sm={12} md={6}>
            <AntdStatsCard title="Available Coupons" value={data.coupon_stats.total_coupons_available} />
          </AntdCol>
        </AntdRow>
        <Box display="flex" alignItems="center" mb={2} gap={2}>
          <Button startIcon={<DownloadIcon />} onClick={handleDownloadExcel}>Excel Report</Button>
          <Button startIcon={<PictureAsPdfIcon />} color="primary" variant="contained" onClick={handleExportPDF}>
            Export PDF
          </Button>
        </Box>
        <Divider sx={{ my: 2 }} />

        <AntdRow gutter={[24, 24]} style={{ marginBottom: 32 }}>
          <AntdCol xs={24} sm={24} md={12} lg={8}>
            <Paper sx={{ p: 2, borderRadius: 2, height: 320 }}>
              <Typography variant="subtitle1" mb={1}>Allocation per SubCenter</Typography>
              <AllocationChart data={
                (data.coupons_per_subcenter_chart || []).map((item: any) => ({
                  name: item.name || item.label || 'Unknown',
                  count: item.count || item.value || 0
                }))
              } />
            </Paper>
          </AntdCol>
          <AntdCol xs={24} sm={24} md={12} lg={8}>
            <Paper sx={{ p: 2, borderRadius: 2, height: 320 }}>
              <Typography variant="subtitle1" mb={1}>Fuel Consumed Trend</Typography>
              <BalanceTrendChart data={
                (data.fuel_consumed_per_day_chart || []).map((item: any) => ({
                  date: item.date || item.x || 'Unknown',
                  total_litres: item.total_litres || item.y || item.value || 0
                }))
              } />
            </Paper>
          </AntdCol>
        </AntdRow>

        <Divider sx={{ my: 2 }} />

        {['MAIN_CENTER', 'SUB_CENTER', 'AUDITOR'].includes(user.role) && (
          <AntdRow gutter={[24, 24]} style={{ marginBottom: 32 }}>
            <AntdCol xs={24} md={8}>
              <Paper sx={{ p: 2, borderRadius: 2 }}>
                <Typography variant="subtitle1" mb={1}>Fuel Allocation</Typography>
                <FuelAllocationForm />
              </Paper>
            </AntdCol>
            <AntdCol xs={24} md={8}>
              <Paper sx={{ p: 2, borderRadius: 2 }}>
                <Typography variant="subtitle1" mb={1}>Fuel Usage</Typography>
                <FuelUsageForm />
              </Paper>
            </AntdCol>
            <AntdCol xs={24} md={8}>
              <Paper sx={{ p: 2, borderRadius: 2 }}>
                <Typography variant="subtitle1" mb={1}>Attendance</Typography>
                <AttendanceForm />
              </Paper>
            </AntdCol>
          </AntdRow>
        )}

        <Divider sx={{ my: 2 }} />
        <Paper sx={{ p: 2, borderRadius: 2, mb: 2 }}>
          <Typography variant="h6" mb={1}>Reports & Activity</Typography>
          <Box sx={{ height: 180, bgcolor: 'grey.100', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography color="text.secondary">Recent Activity Table Placeholder</Typography>
          </Box>
        </Paper>
        <Paper sx={{ p: 2, borderRadius: 2 }}>
          <Typography variant="h6" mb={1}>Embedded Power BI Report</Typography>
          <iframe
            title="Power BI Report"
            width="100%"
            height="400"
            src="https://app.powerbi.com/view?r=YOUR_REPORT_ID"
            frameBorder="0"
            allowFullScreen
            style={{ borderRadius: 8 }}
          />
        </Paper>
      </Box>
    </CustomLayout>
  );
};

export default MainDashboard;
