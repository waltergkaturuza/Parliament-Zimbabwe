// src/components/charts/AllocationChart.tsx
import React from 'react';
import { Box, Typography, Paper, useTheme } from '@mui/material'; // Added useTheme
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts'; // Import Recharts components

// Define the expected data structure for this chart
interface AllocationData {
  name: string; // e.g., Sub Center Name
  count: number; // e.g., Number of Coupons
}

interface AllocationChartProps {
  data?: AllocationData[]; // Expects an array of AllocationData objects
}

const AllocationChart: React.FC<AllocationChartProps> = ({ data }) => {
  const theme = useTheme(); // Access theme for colors

  // Use provided data or an empty array if null/undefined
  const chartData = data || [];

  return (
    <Paper elevation={3} sx={{ p: 2, height: '100%' }}>
      <Typography variant="h6" gutterBottom align="center">Allocation Summary (e.g., Per Sub Center)</Typography> {/* Added align center */}
      <Box sx={{ height: 300 }}> {/* Set a fixed height for the chart container */}
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            {/* XAxis: Typically displays categories (like subcenter names) */}
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} interval={0} /> {/* Adjust angle and height for labels */}
            {/* YAxis: Typically displays numerical values (like counts) */}
            <YAxis />
            {/* Tooltip: Shows data details when hovering over a bar */}
            <Tooltip />
            {/* Legend: Explains what the bars represent */}
            <Legend />
            {/* Bar: Represents the data values */}
            {/* dataKey should match the key in your data objects for the bar value (e.g., 'count') */}
            <Bar dataKey="count" fill={theme.palette.primary.main} name="Allocated Coupons" /> {/* Use theme color */}
            {/* Add more <Bar /> components if you have multiple values per category */}
          </BarChart>
        </ResponsiveContainer>
      </Box>
       {/* Optional: Display a message if no data */}
       {chartData.length === 0 && !data && ( // Check if data prop was initially empty/null
           <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 2 }}>
               No allocation data available.
           </Typography>
       )}
    </Paper>
  );
};

export default AllocationChart;
