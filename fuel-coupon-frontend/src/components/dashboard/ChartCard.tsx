// src/components/dashboard/ChartCard.tsx
import React from 'react';

interface ChartCardProps {
  title: string;
  children: React.ReactNode;
}

const ChartCard = ({ title, children }: ChartCardProps) => (
  <div className="bg-white shadow-md rounded-lg p-6">
    <h2 className="text-xl font-semibold text-gray-700 mb-4">{title}</h2>
    {children}
  </div>
);

export default ChartCard;
