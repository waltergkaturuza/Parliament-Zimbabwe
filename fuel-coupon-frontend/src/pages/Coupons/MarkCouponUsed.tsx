// src/pages/coupons/MarkCouponUsed.tsx
import React from 'react';
import { useParams } from 'react-router-dom';

function MarkCouponUsed() {
  const { id } = useParams();

  return (
    <div>
      <h1>Mark Coupon as Used</h1>
      <p>Marking coupon with ID: {id} as used</p>
      {/* You will implement the form and logic to mark as used here */}
    </div>
  );
}

export default MarkCouponUsed;
