// src/pages/Coupons/CouponList.tsx
import React, { useState, useEffect } from 'react';
import { fetchCoupons } from '@/api/coupons';
import { Coupon } from '@/types/models';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import styles from './CouponList.module.css'; // Import CSS Module

function CouponList() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const loadCoupons = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchCoupons();
        setCoupons(data);
      } catch (err: any) {
        setError('Failed to load coupons.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadCoupons();
  }, []);

  const handleViewDetails = (id: number) => {
    navigate(`/coupons/${id}`);
  };

  const handleAllocateCoupon = (id: number) => {
    // Implement allocation logic here (show modal, form, API call)
    console.log(`Allocate coupon with ID: ${id}`);
  };

  const handleMarkAsUsed = (id: number) => {
    // Implement mark as used logic here (show modal, form, API call)
    console.log(`Mark coupon with ID: ${id} as used`);
  };

  const handleDeleteCoupon = (id: number) => {
    // Implement delete logic here (confirmation, API call)
    console.log(`Delete coupon with ID: ${id}`);
  };

  if (loading) {
    return <div>Loading coupons...</div>;
  }

  if (error) {
    return <div className={styles.error}>Error: {error}</div>;
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Coupon List</h1>
      {coupons.length > 0 ? (
        <div className={styles.tableWrapper}>
          <table className={styles.couponTable}>
            <thead>
              <tr>
                <th>Coupon Number</th>
                <th>Book Number</th>
                <th>Box Code</th>
                <th>Litres</th>
                <th>Status</th>
                <th>Allocated To</th>
                <th>Allocated Date</th>
                <th>Used Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((coupon) => (
                <tr key={coupon.id}>
                  <td>{coupon.coupon_number}</td>
                  <td>{coupon.book_number}</td>
                  <td>{coupon.box_code}</td>
                  <td>{coupon.litres}</td>
                  <td>{coupon.status_display}</td>
                  <td>{coupon.allocated_to_name || 'N/A'}</td>
                  <td>{coupon.allocated_date || 'N/A'}</td>
                  <td>{coupon.used_date || 'N/A'}</td>
                  <td>
                    <button onClick={() => handleViewDetails(coupon.id)} className={styles.viewButton}>
                      View
                    </button>
                    {user?.role === 'SUB_CENTER' && (
                      <button onClick={() => handleAllocateCoupon(coupon.id)} className={styles.allocateButton}>
                        Allocate
                      </button>
                    )}
                    {/* You might want to restrict marking as used based on a specific role */}
                    {(user?.role === 'SUB_CENTER' || user?.role === 'MAIN_CENTER') && coupon.status !== 'USED' && (
                      <button onClick={() => handleMarkAsUsed(coupon.id)} className={styles.useButton}>
                        Mark Used
                      </button>
                    )}
                    {user?.role === 'MAIN_CENTER' && (
                      <button onClick={() => handleDeleteCoupon(coupon.id)} className={styles.deleteButton}>
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className={styles.noCoupons}>No coupons found.</p>
      )}
    </div>
  );
}

export default CouponList;
