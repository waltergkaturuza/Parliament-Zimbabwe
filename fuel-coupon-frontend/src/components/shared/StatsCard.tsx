// src/components/shared/StatsCard.tsx
import React from 'react';

interface StatsCardProps {
  title: string;
  value: number | string | undefined | null;
  trend?: 'up' | 'down';
  percentage?: number | string | undefined | null;
}

export const StatsCard: React.FC<StatsCardProps> = ({ title, value, trend, percentage }) => {
  return (
    <div className="bg-white shadow rounded-lg p-4">
      <h3 className="text-sm font-medium text-gray-500 truncate">{title}</h3>
      <div className="mt-2 flex items-baseline text-base font-semibold text-gray-900">
        {value !== undefined && value !== null ? value : 'N/A'}
        {percentage !== undefined && percentage !== null && (
          <div className={`ml-2 text-sm font-medium ${trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : 'text-gray-500'}`}>
            {trend && (trend === 'up' ? '+' : trend === 'down' ? '-' : '')}
            {percentage}%
          </div>
        )}
      </div>
      {trend && (
        <p className={`mt-1 text-sm text-${trend === 'up' ? 'green-500' : 'red-500'}`}>
          <svg className={`inline w-4 h-4 mr-1 fill-current`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d={trend === 'up' ? 'M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z' : 'M3 3a1 1 0 001 1h12a1 1 0 100-2H4a1 1 0 00-1 1zm3.293 7.707a1 1 0 001.414 0l4 4a1 1 0 001.414-1.414l-4-4a1 1 0 00-1.414 0l-4 4a1 1 0 101.414 1.414z'} clipRule="evenodd" />
          </svg>
          {trend === 'up' ? 'Increased' : 'Decreased'}
        </p>
      )}
    </div>
  );
};
