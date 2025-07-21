// src/components/coupons/CouponAllocationForm.tsx
import { useForm } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { Button, TextField, Select, MenuItem, FormControl, InputLabel, Box } from '@mui/material';
import { UserService, type User } from '../../api/users';
import { CouponService } from '../../api/coupons';

interface FormData {
  coupon_numbers: string[];
  beneficiary_id: number;
}

export function CouponAllocationForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>();
  const { data: beneficiaries } = useQuery({
    queryKey: ['beneficiaries'],
    queryFn: () => UserService.getUsersByRole('BENEFICIARY'),
  });

  const onSubmit = async (data: FormData) => {
    try {
      await CouponService.bulkAllocate(data);
      // Show success notification
    } catch (error) {
      // Handle error
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <TextField
        fullWidth
        label="Coupon Numbers (comma separated)"
        multiline
        rows={3}
        {...register('coupon_numbers', { required: true })}
        error={!!errors.coupon_numbers}
        helperText={errors.coupon_numbers ? 'This field is required' : ''}
      />
      
      <FormControl fullWidth error={!!errors.beneficiary_id}>
        <InputLabel>Beneficiary</InputLabel>
        <Select
          {...register('beneficiary_id', { required: true })}
          label="Beneficiary"
        >
          {beneficiaries?.map((user: User) => (
            <MenuItem key={user.id} value={user.id}>
              {user.username} - {user.email}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      
      <Button type="submit" variant="contained" fullWidth>
        Allocate Coupons
      </Button>
    </Box>
  );
}
