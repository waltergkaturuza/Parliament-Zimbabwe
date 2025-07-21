// src/components/dashboard/FuelStatsCard.tsx
import React from 'react';

const FuelStatsCard = ({ fuelStats }: { fuelStats: any }) => (
  <div className="bg-white shadow-md rounded-lg p-6 mb-6">
    <h2 className="text-xl font-semibold text-gray-700 mb-4">Fuel Statistics</h2>
    <p className="text-gray-600">Petrol Price: US${fuelStats.petrol_price}</p>
    <p className="text-gray-600">Diesel Price: US${fuelStats.diesel_price}</p>
    <p className="text-gray-500 text-sm">Last updated: {new Date(fuelStats.timestamp).toLocaleString()}</p>
  </div>
);

export default FuelStatsCard;
