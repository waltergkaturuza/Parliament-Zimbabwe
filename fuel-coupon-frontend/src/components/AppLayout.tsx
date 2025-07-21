// src/components/AppLayout.tsx
import { Outlet } from 'react-router-dom';
import NavBar from './NavBar';
import { useAuth } from '../contexts/AuthContext';

const AppLayout = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-gray-100">
      {isAuthenticated && <NavBar />}
      <main className="container mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;
