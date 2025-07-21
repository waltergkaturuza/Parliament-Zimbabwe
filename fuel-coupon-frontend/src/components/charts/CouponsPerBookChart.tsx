// src/components/charts/CouponsPerBookChart.tsx
import React from 'react';
import { Box, Typography, Paper, useTheme } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface CouponsPerBookData {
  book_number: string; // Book number
  count: number; // Number of coupons in the book (or allocated/used from it)
}

interface CouponsPerBookChartProps {
  data?: CouponsPerBookData[];
}

const CouponsPerBookChart: React.FC<CouponsPerBookChartProps> = ({ data }) => {
  const theme = useTheme();
  const chartData = data || [];

  return (
    <Paper elevation={3} sx={{ p: 2, height: '100%' }}>
      <Typography variant="h6" gutterBottom align="center">Coupons Per Book</Typography>
      <Box sx={{ height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <XAxis dataKey="book_number" angle={-45} textAnchor="end" height={80} interval={0} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="count" fill={theme.palette.warning.main} name="Coupons" />
          </BarChart>
        </ResponsiveContainer>
      </Box>
      {chartData.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 2 }}>
              No coupons per book data available.
          </Typography>
      )}
    </Paper>
  );
};

export default CouponsPerBookChart;
