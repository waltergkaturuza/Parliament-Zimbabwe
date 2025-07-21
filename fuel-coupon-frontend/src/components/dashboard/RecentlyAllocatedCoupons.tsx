// src/components/dashboard/RecentlyAllocatedCoupons.tsx
import React from 'react';

const RecentlyAllocatedCoupons = ({ coupons }: { coupons: any[] }) => (
  <div className="bg-white shadow-md rounded-lg p-6 mb-6">
    <h2 className="text-xl font-semibold text-gray-700 mb-4">Recently Allocated Coupons</h2>
    {coupons.length > 0 ? (
      <ul className="list-disc pl-5">
        {coupons.map(coupon => (
          <li key={coupon.id} className="text-gray-600 py-1">
            Coupon #{coupon.coupon_number} allocated to {coupon.allocated_to_username || 'N/A'} on {new Date(coupon.allocated_date).toLocaleDateString()}
          </li>
        ))}
      </ul>
    ) : (
      <p className="text-gray-500">No recently allocated coupons.</p>
    )}
  </div>
);

export default RecentlyAllocatedCoupons;
