// src/pages/Unauthorized.tsx
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/shared/Button';
import { useAuth } from '../contexts/AuthContext';
import ParliamentLogo from '@/components/ParliamentLogo';

export default function Unauthorized() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleGoBack = () => {
    navigate(-1); // Go back to previous page
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 relative">
      {/* Full logo in top-left corner */}
      <div className="absolute top-4 left-4">
        <ParliamentLogo size="xs" showText={true} />
      </div>
      
      <div className="text-center p-8 bg-white rounded-lg shadow-md max-w-md">
        <div className="text-6xl mb-4">🔒</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Unauthorized Access</h1>
        <p className="text-gray-600 mb-6">
          You don't have permission to view this page with your current role.
        </p>
        
        <div className="space-y-3">
          <Button 
            onClick={handleGoBack}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            Go Back
          </Button>
          <Button 
            onClick={handleLogout}
            variant="outline"
            className="w-full border-gray-300 hover:bg-gray-50"
          >
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
}
