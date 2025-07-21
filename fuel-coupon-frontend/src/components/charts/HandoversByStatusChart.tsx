// src/components/charts/HandoversByStatusChart.tsx
import React from 'react';
import { Box, Typography, Paper, useTheme } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface HandoverStatusData {
  status: string; // Handover status (e.g., 'PENDING', 'CONFIRMED')
  count: number; // Count for that status
}

interface HandoversByStatusChartProps {
  data?: HandoverStatusData[];
}

const HandoversByStatusChart: React.FC<HandoversByStatusChartProps> = ({ data }) => {
  const theme = useTheme();
  const chartData = data || [];

  return (
    <Paper elevation={3} sx={{ p: 2, height: '100%' }}>
      <Typography variant="h6" gutterBottom align="center">Handovers By Status</Typography>
      <Box sx={{ height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <XAxis dataKey="status" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="count" fill={theme.palette.grey[600]} name="Count" /> {/* Using grey for status */}
          </BarChart>
        </ResponsiveContainer>
      </Box>
      {chartData.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 2 }}>
              No handovers by status data available.
          </Typography>
      )}
    </Paper>
  );
};

export default HandoversByStatusChart;
