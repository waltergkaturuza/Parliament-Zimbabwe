// src/pages/coupons/CouponDetail.tsx
import React from 'react';
import { useParams } from 'react-router-dom';

function CouponDetail() {
  const { id } = useParams();

  return (
    <div>
      <h1>Coupon Details</h1>
      <p>Coupon ID: {id}</p>
      {/* You will fetch and display detailed coupon information here */}
    </div>
  );
}

export default CouponDetail;
