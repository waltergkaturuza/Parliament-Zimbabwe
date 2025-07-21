// src/components/PageHeader.tsx
import { FC } from 'react';
import ParliamentLogo from './ParliamentLogo';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface PageHeaderProps {
  title?: string;
  subtitle?: string;
  showUserInfo?: boolean;
  showLogout?: boolean;
  className?: string;
}

const PageHeader: FC<PageHeaderProps> = ({
  title,
  subtitle,
  showUserInfo = false,
  showLogout = false,
  className = ''
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout(() => navigate('/login'));
  };

  return (
    <header className={`bg-white shadow-sm border-b border-gray-200 py-4 px-6 ${className}`}>
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-6">
          <ParliamentLogo size="xs" showText={true} />
          {title && (
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
              {subtitle && (
                <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
              )}
            </div>
          )}
        </div>

        {(showUserInfo || showLogout) && (
          <div className="flex items-center gap-4">
            {showUserInfo && user && (
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">
                  {user.name || user.username}
                </div>
                <div className="text-xs text-gray-500">
                  {user.role?.replace('_', ' ')}
                </div>
              </div>
            )}
            
            {showLogout && (
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Logout
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default PageHeader;
