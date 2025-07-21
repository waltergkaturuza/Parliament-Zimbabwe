// src/components/charts/CouponsDistributedPerDayChart.tsx
import React from 'react';
import { Box, Typography, Paper, useTheme } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface CouponsTrendData {
  date: string; // Date string
  count: number; // Number of coupons distributed on this date
}

interface CouponsDistributedPerDayChartProps {
  data?: CouponsTrendData[];
}

const CouponsDistributedPerDayChart: React.FC<CouponsDistributedPerDayChartProps> = ({ data }) => {
  const theme = useTheme();
  const chartData = data || [];

  return (
    <Paper elevation={3} sx={{ p: 2, height: '100%' }}>
      <Typography variant="h6" gutterBottom align="center">Coupons Distributed Trend (Daily)</Typography>
      <Box sx={{ height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="count" stroke={theme.palette.secondary.dark} name="Coupons Distributed" activeDot={{ r: 8 }} />
          </LineChart>
        </ResponsiveContainer>
      </Box>
      {chartData.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 2 }}>
              No coupons distributed per day data available.
          </Typography>
      )}
    </Paper>
  );
};

export default CouponsDistributedPerDayChart;
