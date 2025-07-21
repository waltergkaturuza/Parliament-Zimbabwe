import { useState } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Button, IconButton, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserService, type User } from '@/api/users';
import { toast } from 'react-toastify';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorPage from '@/pages/ErrorPage';
import UserFormDialog from '@/components/UserFormDialog';
import ParliamentLogo from '@/components/ParliamentLogo';

const UserManagement = () => {
  const queryClient = useQueryClient();
  const [openForm, setOpenForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean, user: User | null }>({ open: false, user: null });

  const { data: usersResponse, isLoading, isError, error } = useQuery({
    queryKey: ['users'],
    queryFn: () => UserService.getUsers(),
  });

  // Handle the response data structure
  const users: User[] = usersResponse?.results || usersResponse || [];

  const deleteMutation = useMutation({
    mutationFn: UserService.deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User deleted.');
      setDeleteConfirm({ open: false, user: null });
    },
    onError: (err: any) => toast.error(`Delete failed: ${err.message}`),
  });

  const handleOpenForm = (user?: User) => {
    setEditingUser(user || null);
    setOpenForm(true);
  };

  const handleCloseForm = () => {
    setOpenForm(false);
    setEditingUser(null);
  };

  const handleDelete = () => {
    if (deleteConfirm.user) {
      deleteMutation.mutate(deleteConfirm.user.id);
    }
  };

  if (isLoading) return <LoadingSpinner />;
  if (isError) return <ErrorPage />;

  return (
    <div>
      {/* Header with Parliament Logo */}
      <div className="flex items-center gap-4 mb-6 pb-4 border-b">
        <ParliamentLogo size="xs" showText={true} />
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
      </div>
      
      <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={() => handleOpenForm()}>
        Add New User
      </Button>

      <TableContainer component={Paper} sx={{ mt: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Username</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>First Name</TableCell>
              <TableCell>Last Name</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Active</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users?.map((user: User) => (
              <TableRow key={user.id}>
                <TableCell>{user.id}</TableCell>
                <TableCell>{user.username}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.first_name}</TableCell>
                <TableCell>{user.last_name}</TableCell>
                <TableCell>{user.role}</TableCell>
                <TableCell>{user.is_active ? 'Yes' : 'No'}</TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => handleOpenForm(user)}><EditIcon /></IconButton>
                  <IconButton color="error" onClick={() => setDeleteConfirm({ open: true, user })}><DeleteIcon /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <UserFormDialog open={openForm} onClose={handleCloseForm} user={editingUser} />

      <Dialog open={deleteConfirm.open} onClose={() => setDeleteConfirm({ open: false, user: null })}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>Are you sure you want to delete <b>{deleteConfirm.user?.username}</b>?</DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm({ open: false, user: null })}>Cancel</Button>
          <Button color="error" onClick={handleDelete} disabled={deleteMutation.isPending}>
            {deleteMutation.isPending ? <LoadingSpinner /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default UserManagement;
