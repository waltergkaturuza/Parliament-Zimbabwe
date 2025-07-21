// src/components/charts/AttendancePerProgramChart.tsx
import React from 'react';
import { Box, Typography, Paper, useTheme } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface AttendanceData {
  program_name: string; // Name of the program
  count: number; // Number of attendances
}

interface AttendancePerProgramChartProps {
  data?: AttendanceData[];
}

const AttendancePerProgramChart: React.FC<AttendancePerProgramChartProps> = ({ data }) => {
  const theme = useTheme();
  const chartData = data || [];

  return (
    <Paper elevation={3} sx={{ p: 2, height: '100%' }}>
      <Typography variant="h6" gutterBottom align="center">Attendance Per Program</Typography>
      <Box sx={{ height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <XAxis dataKey="program_name" angle={-45} textAnchor="end" height={80} interval={0} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="count" fill={theme.palette.info.main} name="Attendances" />
          </BarChart>
        </ResponsiveContainer>
      </Box>
       {chartData.length === 0 && (
           <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 2 }}>
               No attendance per program data available.
           </Typography>
       )}
    </Paper>
  );
};

export default AttendancePerProgramChart;
