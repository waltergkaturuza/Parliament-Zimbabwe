// src/pages/components/forms/FuelAllocationForm.tsx
import React, { useState } from 'react';
import { Box, Typography, TextField, Button, Paper } from '@mui/material';
// Import API client (e.g., axios) or custom hook here
// import api from '../../../api/api'; // Example API client

interface FuelAllocationFormProps {
  // You might pass props like available programs, beneficiaries, etc.
}

const FuelAllocationForm: React.FC<FuelAllocationFormProps> = () => {
  const [couponNumbers, setCouponNumbers] = useState(''); // Comma-separated list of coupon numbers
  const [beneficiaryId, setBeneficiaryId] = useState('');
  const [programId, setProgramId] = useState(''); // Optional

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    console.log('Allocating coupons:', { couponNumbers, beneficiaryId, programId });

    // Split coupon numbers string into an array, trim whitespace
    const couponNumbersArray = couponNumbers.split(',').map(num => num.trim()).filter(num => num);

    // Prepare data for the API call
    const formData = {
      coupon_numbers: couponNumbersArray,
      beneficiary_id: parseInt(beneficiaryId, 10), // Ensure beneficiary_id is an integer
      program_id: programId ? parseInt(programId, 10) : null, // Ensure program_id is integer or null
    };

    console.log('API Payload:', formData);

    // --- Add your API call logic here ---
    /*
    try {
      const response = await api.post('/api/v1/coupons/bulk_allocate/', formData); // Example API endpoint
      console.log('Allocation successful:', response.data);
      // Handle success (e.g., show a success message, clear form)
      setCouponNumbers('');
      setBeneficiaryId('');
      setProgramId('');
    } catch (error) {
      console.error('Allocation failed:', error);
      // Handle error (e.g., show an error message)
    }
    */
    // --- End API call logic ---
  };

  return (
    <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
      <Typography variant="h6" gutterBottom>Bulk Coupon Allocation</Typography>
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <TextField
            fullWidth
            label="Coupon Numbers (comma-separated)"
            value={couponNumbers}
            onChange={(e) => setCouponNumbers(e.target.value)}
            required
            helperText="e.g., 1001, 1002, 1005"
          />
          <TextField
            fullWidth
            label="Beneficiary ID"
            value={beneficiaryId}
            onChange={(e) => setBeneficiaryId(e.target.value)}
            type="number"
            required
          />
          <TextField
            fullWidth
            label="Program ID (Optional)"
            value={programId}
            onChange={(e) => setProgramId(e.target.value)}
            type="number"
          />
          <Button type="submit" variant="contained" color="primary" fullWidth>
            Allocate Coupons
          </Button>
        </div>
      </form>
    </Paper>
  );
};

export default FuelAllocationForm;
