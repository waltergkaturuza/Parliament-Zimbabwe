// src/pages/components/forms/FuelUsageForm.tsx
import React, { useState } from 'react';
import { Box, Typography, TextField, Button, Paper } from '@mui/material';
// Import API client (e.g., axios) or custom hook here
// import api from '../../../api/api'; // Example API client

interface FuelUsageFormProps {
  // You might pass props like a list of user's allocated coupons
}

const FuelUsageForm: React.FC<FuelUsageFormProps> = (props) => {
  const [couponNumber, setCouponNumber] = useState('');
  const [transactionLocation, setTransactionLocation] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    console.log('Marking coupon as used:', { couponNumber, transactionLocation });

    // You'll likely need to fetch the coupon ID based on the couponNumber first
    // or have the user select from a list of allocated coupons.
    // For this placeholder, let's assume we have the coupon ID.
    // Replace with actual logic to get coupon ID.
    const couponId = 'GET_COUPON_ID_HERE'; // Replace with logic to find coupon ID by number

    if (couponId === 'GET_COUPON_ID_HERE') {
      console.error("Cannot mark used: Coupon ID not determined.");
      // Show error message to user
      return;
    }


    // Prepare data for the API call
    const formData = {
      transaction_location: transactionLocation,
      // The user performing the action is automatically set as recorded_by on the backend
    };

    console.log('API Payload:', formData);

    // --- Add your API call logic here ---
    /*
    try {
      // Use the coupon ID in the API path
      const response = await api.patch(`/coupons/${couponId}/mark_used/`, formData); // Example API endpoint
      console.log('Marked as used successfully:', response.data);
      // Handle success (e.g., show a success message, clear form)
      setCouponNumber('');
      setTransactionLocation('');
    } catch (error) {
      console.error('Marking as used failed:', error);
      // Handle error (e.g., show an error message)
    }
    */
    // --- End API call logic ---
  };

  return (
    <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
      <Typography variant="h6" gutterBottom>Mark Coupon as Used</Typography>
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <TextField
            fullWidth
            label="Coupon Number"
            value={couponNumber}
            onChange={(e) => setCouponNumber(e.target.value)}
            required
            helperText="Enter the number of the coupon being used"
          />
          <TextField
            fullWidth
            label="Transaction Location (Optional)"
            value={transactionLocation}
            onChange={(e) => setTransactionLocation(e.target.value)}
          />
          <Button type="submit" variant="contained" color="secondary" fullWidth>
            Mark Used
          </Button>
        </div>
      </form>
    </Paper>
  );
};

export default FuelUsageForm;
