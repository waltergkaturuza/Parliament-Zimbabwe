// src/layouts/CustomLayout.tsx
import React from 'react';
import { useLocation, Outlet } from 'react-router-dom';
import ParliamentLogo from '@/components/ParliamentLogo';

interface CustomLayoutProps {
  title?: string;
  children?: React.ReactNode;
}

const CustomLayout = ({ title = 'Dashboard', children }: CustomLayoutProps) => {
  const location = useLocation();
  const pathSegments = location.pathname.split('/').filter(Boolean);

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar Placeholder */}
      <aside className="w-64 bg-white shadow-md hidden md:block">
        <div className="p-4">
          <ParliamentLogo size="xs" showText={true} />
        </div>
        {/* Sidebar Links */}
      </aside>

      <div className="flex-1">
        {/* Topbar */}
        <header className="sticky top-0 bg-white z-10 shadow-sm px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Mobile logo */}
            <div className="md:hidden">
              <ParliamentLogo size="xs" showText={true} />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-800">{title}</h1>
              <div className="text-sm text-gray-500">
                {pathSegments.map((seg, idx) => (
                  <span key={idx}>
                    {seg} {idx < pathSegments.length - 1 && '/ '}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </header>

        <main className="p-6">{children || <Outlet />}</main>
      </div>
    </div>
  );
};

export default CustomLayout;
