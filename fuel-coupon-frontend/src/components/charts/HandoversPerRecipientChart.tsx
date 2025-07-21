// src/components/charts/HandoversPerRecipientChart.tsx
import React from 'react';
import { Box, Typography, Paper, useTheme } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface HandoverUserData {
  user_name: string; // Recipient user's name
  count: number; // Number of handovers received
}

interface HandoversPerRecipientChartProps {
  data?: HandoverUserData[];
}

const HandoversPerRecipientChart: React.FC<HandoversPerRecipientChartProps> = ({ data }) => {
  const theme = useTheme();
  const chartData = data || [];

  return (
    <Paper elevation={3} sx={{ p: 2, height: '100%' }}>
      <Typography variant="h6" gutterBottom align="center">Handovers Per Recipient</Typography>
      <Box sx={{ height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <XAxis dataKey="user_name" angle={-45} textAnchor="end" height={80} interval={0} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="count" fill={theme.palette.success.main} name="Handovers Received" />
          </BarChart>
        </ResponsiveContainer>
      </Box>
       {chartData.length === 0 && (
           <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 2 }}>
               No handovers per recipient data available.
           </Typography>
       )}
    </Paper>
  );
};

export default HandoversPerRecipientChart;
