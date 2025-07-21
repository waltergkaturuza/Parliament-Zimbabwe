// src/components/charts/BalanceTrendChart.tsx
import React from 'react';
import { Box, Typography, Paper, useTheme } from '@mui/material'; // Added useTheme
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts'; // Import Recharts components

// Define the expected data structure for this chart
interface TrendData {
  date: string; // e.g., 'YYYY-MM-DD'
  total_litres: number; // e.g., Fuel consumed on that date
}

interface BalanceTrendChartProps {
  data?: TrendData[]; // Expects an array of TrendData objects
}

const BalanceTrendChart: React.FC<BalanceTrendChartProps> = ({ data }) => {
  const theme = useTheme(); // Access theme for colors

  // Use provided data or an empty array if null/undefined
  const chartData = data || [];

  return (
    <Paper elevation={3} sx={{ p: 2, height: '100%' }}>
      <Typography variant="h6" gutterBottom align="center">Fuel Consumption Trend (Daily)</Typography> {/* Added align center */}
      <Box sx={{ height: 300 }}> {/* Set a fixed height for the chart container */}
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            {/* XAxis: Typically displays time series data */}
            <XAxis dataKey="date" />
            {/* YAxis: Typically displays numerical values */}
            <YAxis />
            {/* Tooltip: Shows data details on hover */}
            <Tooltip />
            {/* Legend: Explains what the lines represent */}
            <Legend />
            {/* Line: Represents the data points and trend */}
            {/* dataKey should match the key in your data objects for the line value (e.g., 'total_litres') */}
            <Line type="monotone" dataKey="total_litres" stroke={theme.palette.secondary.main} name="Litres Consumed" activeDot={{ r: 8 }} /> {/* Use theme color */}
            {/* Add more <Line /> components if you have multiple trend lines */}
          </LineChart>
        </ResponsiveContainer>
      </Box>
      {/* Optional: Display a message if no data */}
      {chartData.length === 0 && !data && (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 2 }}>
              No fuel consumption trend data available.
          </Typography>
      )}
    </Paper>
  );
};

export default BalanceTrendChart;
