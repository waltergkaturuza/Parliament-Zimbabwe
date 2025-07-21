// src/pages/users/UserList.tsx
import { useQuery } from '@tanstack/react-query';
import { UserService } from '../../api/users';
import { DataTable } from '../../components/shared/DataTable';
import { useAuth } from '../../contexts/AuthContext';

export default function UserList() {
  const { user: currentUser } = useAuth();
  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => UserService.getUsers(),
    enabled: currentUser?.role === 'MAIN_CENTER',
  });

  const columns = [
    { header: 'Username', accessor: 'username' },
    { header: 'Email', accessor: 'email' },
    { header: 'Role', accessor: 'role' },
    { header: 'Sub Center', accessor: (user: any) => user.sub_center?.name || 'N/A' },
  ];

  if (!currentUser || currentUser.role !== 'MAIN_CENTER') {
    return <div>Unauthorized</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">User Management</h1>
      <DataTable 
        data={users || []} 
        columns={columns} 
        isLoading={isLoading}
      />
    </div>
  );
}
