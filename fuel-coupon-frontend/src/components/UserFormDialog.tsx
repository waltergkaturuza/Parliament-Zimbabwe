import React, { useEffect, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, MenuItem, Switch, FormControlLabel
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { UserService, type User, type CreateUserData, type UpdateUserData } from '@/api/users';
import { toast } from 'react-toastify';
import LoadingSpinner from './LoadingSpinner';

interface Props {
  open: boolean;
  onClose: () => void;
  user: User | null;
}

const defaultValues = {
  username: '',
  email: '',
  first_name: '',
  last_name: '',
  role: 'BENEFICIARY' as 'SUPERUSER' | 'ADMIN' | 'MAIN_CENTER' | 'SUB_CENTER' | 'BENEFICIARY' | 'AUDITOR' | 'MAIN_CENTER_APPROVER' | 'SUB_CENTER_APPROVER',
  is_active: true,
  password: '',
};

const UserFormDialog: React.FC<Props> = ({ open, onClose, user }) => {
  const queryClient = useQueryClient();
  const isEdit = !!user;
  const [formData, setFormData] = useState(defaultValues);

  const mutation = useMutation({
    mutationFn: async () => {
      if (isEdit && user) {
        const updateData: UpdateUserData = {
          username: formData.username,
          email: formData.email,
          first_name: formData.first_name,
          last_name: formData.last_name,
          role: formData.role,
          is_active: formData.is_active
        };
        return UserService.updateUser(user.id, updateData);
      } else {
        const createData: CreateUserData = {
          username: formData.username,
          email: formData.email,
          first_name: formData.first_name,
          last_name: formData.last_name,
          role: formData.role,
          is_active: formData.is_active,
          password: formData.password
        };
        return UserService.createUser(createData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success(`User ${isEdit ? 'updated' : 'created'} successfully`);
      onClose();
    },
    onError: (error: any) => {
      toast.error(`Failed to ${isEdit ? 'update' : 'create'} user: ${error.message}`);
    }
  });

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        email: user.email || '',
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        role: user.role || 'BENEFICIARY',
        is_active: user.is_active ?? true,
        password: '',
      });
    } else {
      setFormData(defaultValues);
    }
  }, [user, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate();
  };

  const handleInputChange = (field: keyof typeof formData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  const handleSwitchChange = (field: keyof typeof formData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.checked
    }));
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>{isEdit ? 'Edit User' : 'Create User'}</DialogTitle>
        <DialogContent className="space-y-4">
          <TextField
            fullWidth
            label="Username"
            value={formData.username}
            onChange={handleInputChange('username')}
            required
            margin="normal"
          />
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={formData.email}
            onChange={handleInputChange('email')}
            required
            margin="normal"
          />
          <TextField
            fullWidth
            label="First Name"
            value={formData.first_name}
            onChange={handleInputChange('first_name')}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Last Name"
            value={formData.last_name}
            onChange={handleInputChange('last_name')}
            margin="normal"
          />
          <TextField
            fullWidth
            select
            label="Role"
            value={formData.role}
            onChange={handleInputChange('role')}
            margin="normal"
            required
          >
            <MenuItem value="SUPERUSER">Super User</MenuItem>
            <MenuItem value="ADMIN">Admin</MenuItem>
            <MenuItem value="MAIN_CENTER">Main Center</MenuItem>
            <MenuItem value="SUB_CENTER">Sub Center</MenuItem>
            <MenuItem value="MAIN_CENTER_APPROVER">Main Center Approver</MenuItem>
            <MenuItem value="SUB_CENTER_APPROVER">Sub Center Approver</MenuItem>
            <MenuItem value="BENEFICIARY">Beneficiary</MenuItem>
            <MenuItem value="AUDITOR">Auditor</MenuItem>
          </TextField>
          {!isEdit && (
            <TextField
              fullWidth
              label="Password"
              type="password"
              value={formData.password}
              onChange={handleInputChange('password')}
              required
              margin="normal"
            />
          )}
          <FormControlLabel
            control={
              <Switch
                checked={formData.is_active}
                onChange={handleSwitchChange('is_active')}
              />
            }
            label="Active"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? <LoadingSpinner /> : (isEdit ? 'Update' : 'Create')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default UserFormDialog;
