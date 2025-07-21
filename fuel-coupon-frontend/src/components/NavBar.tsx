import { useState, memo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Menu } from '@headlessui/react';
import {
  ChartBarIcon,
  UserGroupIcon,
  DocumentTextIcon,
  TicketIcon,
  ShieldCheckIcon,
  CogIcon,
  ArrowLeftOnRectangleIcon,
  ChevronDownIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { ClipboardDocumentCheckIcon } from '@heroicons/react/24/solid';

const NavBar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const commonLinks = [
    {
      path: '/dashboard',
      label: 'Dashboard',
      icon: <ChartBarIcon className="h-5 w-5 flex-shrink-0" />,
      roles: ['MAIN_CENTER', 'SUB_CENTER', 'BENEFICIARY', 'AUDITOR']
    }
  ];

  const roleBasedLinks = [
    {
      path: '/users',
      label: 'User Management',
      icon: <UserGroupIcon className="h-5 w-5 flex-shrink-0" />,
      roles: ['MAIN_CENTER']
    },
    {
      path: '/programs',
      label: 'Programs',
      icon: <DocumentTextIcon className="h-5 w-5 flex-shrink-0" />,
      roles: ['MAIN_CENTER']
    },
    {
      path: '/coupons',
      label: 'Coupons',
      icon: <TicketIcon className="h-5 w-5 flex-shrink-0" />,
      roles: ['MAIN_CENTER', 'SUB_CENTER']
    },
    {
      path: '/attendance',
      label: 'Attendance',
      icon: <ClipboardDocumentCheckIcon className="h-5 w-5 flex-shrink-0" />,
      roles: ['SUB_CENTER']
    },
    {
      path: '/audit',
      label: 'Audit Logs',
      icon: <ShieldCheckIcon className="h-5 w-5 flex-shrink-0" />,
      roles: ['AUDITOR']
    },
    {
      path: '/my-coupons',
      label: 'My Coupons',
      icon: <TicketIcon className="h-5 w-5 flex-shrink-0" />,
      roles: ['BENEFICIARY']
    }
  ];

  const adminDropdownItems = [
    {
      path: '/settings',
      label: 'System Settings',
      icon: <CogIcon className="h-5 w-5 flex-shrink-0" />
    },
    {
      path: '/reports',
      label: 'Advanced Reports',
      icon: <ChartBarIcon className="h-5 w-5 flex-shrink-0" />
    }
  ];

  const getAllowedLinks = () => {
    if (!user?.role) return [];
    return [...commonLinks, ...roleBasedLinks].filter(link =>
      link.roles.includes(user.role)
    );
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  const allowedLinks = getAllowedLinks();

  return (
    <nav className="bg-gray-800 shadow-md fixed top-0 left-0 w-full z-50 h-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-gray-400 hover:text-white"
          >
            {mobileMenuOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
          </button>
          <Link to="/dashboard" className="ml-4 text-white font-semibold text-lg">
            FuelCoupon
          </Link>
        </div>

        <div className="hidden md:flex space-x-6">
          {allowedLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`flex items-center px-3 py-2 rounded-md text-sm font-medium min-w-[120px] transition-colors duration-150 ${
                isActive(link.path) ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <span className="mr-2 w-5">{link.icon}</span>
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden md:block">
          <Menu as="div" className="relative">
            <Menu.Button className="flex items-center text-white">
              {user?.username} ({user?.role})
              <ChevronDownIcon className="ml-1 h-4 w-4" />
            </Menu.Button>
            <Menu.Items className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-50 py-1">
              {user?.role === 'MAIN_CENTER' && adminDropdownItems.map(item => (
                <Menu.Item key={item.path}>
                  {({ active }) => (
                    <Link
                      to={item.path}
                      className={`flex items-center px-4 py-2 text-sm text-gray-700 ${active ? 'bg-gray-100' : ''}`}
                    >
                      <span className="mr-2 w-5">{item.icon}</span>
                      {item.label}
                    </Link>
                  )}
                </Menu.Item>
              ))}
              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={handleLogout}
                    className={`w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 ${active ? 'bg-gray-100' : ''}`}
                  >
                    <ArrowLeftOnRectangleIcon className="h-5 w-5 mr-2" />
                    Sign out
                  </button>
                )}
              </Menu.Item>
            </Menu.Items>
          </Menu>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 w-full bg-gray-800 z-40 p-4">
          {allowedLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-4 py-2 rounded text-sm ${
                isActive(link.path) ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              {link.label}
            </Link>
          ))}
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              handleLogout();
            }}
            className="w-full text-left text-sm text-gray-300 hover:bg-gray-700 hover:text-white px-4 py-2 mt-2"
          >
            Sign out
          </button>
        </div>
      )}
    </nav>
  );
};

export default memo(NavBar);
