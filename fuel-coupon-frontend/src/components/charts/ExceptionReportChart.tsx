// src/components/charts/ExceptionReportChart.tsx
import React from 'react';
import { Box, Typography, Paper, useTheme } from '@mui/material'; // Added useTheme
import { PieChart, Pie, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts'; // Import Recharts components

// Define the expected data structure for this chart
interface DistributionData {
  status: string; // e.g., 'AVAILABLE', 'USED'
  count: number; // e.g., Count for that status
}

interface ExceptionReportChartProps {
  data?: DistributionData[]; // Expects an array of DistributionData objects
}

// Define some example colors for the pie chart segments
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A1A1A1']; // Example colors (Blue, Green, Yellow, Orange, Grey)

const ExceptionReportChart: React.FC<ExceptionReportChartProps> = ({ data }) => {
    const theme = useTheme();

    // Use provided data or an empty array if null/undefined
    const chartData = data || [];

    // Filter out data points with count 0 for the pie chart
    const filteredChartData = chartData.filter(item => item.count > 0);


    return (
        <Paper elevation={3} sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom align="center">Coupon Status Distribution</Typography> {/* Added align center */}
            <Box sx={{ height: 300 }}> {/* Set a fixed height for the chart container */}
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        {/* Pie: Represents the pie chart */}
                        {/* dataKey should match the key in your data objects for the slice value (e.g., 'count') */}
                        {/* nameKey should match the key for the slice label (e.g., 'status') */}
                        <Pie
                            data={filteredChartData} // Use filtered data
                            dataKey="count"
                            nameKey="status"
                            cx="50%" // Center x position
                            cy="50%" // Center y position
                            outerRadius={80} // Radius of the outer arc
                            fill="#8884d8" // Default fill color (will be overridden by Cell colors)
                            label // Display labels on slices
                        >
                            {/* Cell: Apply colors to each slice */}
                            {filteredChartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        {/* Tooltip: Shows data details on hover */}
                        <Tooltip />
                        {/* Legend: Explains what the colors represent */}
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            </Box>
            {/* Optional: Display a message if no data (after filtering) */}
            {filteredChartData.length === 0 && !data && ( // Check if data prop was initially empty/null and filtered data is empty
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 2 }}>
                    No coupon status data available for charting.
                </Typography>
            )}
        </Paper>
    );
};

export default ExceptionReportChart;
