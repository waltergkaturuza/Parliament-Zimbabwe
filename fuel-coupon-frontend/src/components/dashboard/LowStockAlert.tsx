// src/components/dashboard/LowStockAlert.tsx
import React from 'react';

const LowStockAlert = ({ message }: { message: string }) => (
  <div className="bg-white shadow-md rounded-lg p-6 mb-6">
    <h2 className="text-xl font-semibold text-gray-700 mb-4">Low Coupon Stock Alert</h2>
    <p className={`font-semibold ${message.includes('Low') ? 'text-red-500' : 'text-green-500'}`}>
      {message}
    </p>
  </div>
);

export default LowStockAlert;
