// src/pages/coupons/AllocateCoupon.tsx
import React from 'react';
import { useParams } from 'react-router-dom';

function AllocateCoupon() {
  const { id } = useParams();

  return (
    <div>
      <h1>Allocate Coupon</h1>
      <p>Allocating coupon with ID: {id}</p>
      {/* You will implement the allocation form and logic here */}
    </div>
  );
}

export default AllocateCoupon;
