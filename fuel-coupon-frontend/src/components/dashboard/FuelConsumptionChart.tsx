// src/components/dashboard/FuelConsumptionChart.tsx
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface FuelConsumptionData {
  month: string;
  petrolConsumed: number;
  dieselConsumed: number;
}

interface FuelConsumptionChartProps {
  data: FuelConsumptionData[];
}

const FuelConsumptionChart: React.FC<FuelConsumptionChartProps> = ({ data }) => (
  <BarChart
    width={500}
    height={300}
    data={data}
    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
  >
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="month" />
    <YAxis yAxisId="left" label={{ value: 'Litres (Petrol)', angle: -90, position: 'left' }} />
    <YAxis yAxisId="right" orientation="right" label={{ value: 'Litres (Diesel)', angle: -90, position: 'right' }} />
    <Tooltip />
    <Legend />
    <Bar yAxisId="left" dataKey="petrolConsumed" fill="#0088FE" name="Petrol Consumed" />
    <Bar yAxisId="right" dataKey="dieselConsumed" fill="#00C49F" name="Diesel Consumed" />
  </BarChart>
);

export default FuelConsumptionChart;
