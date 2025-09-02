import * as React from 'react';
import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  Layout, 
  Menu, 
  Avatar, 
  Dropdown, 
  Button,
  Badge,
  Space,
  Typography,
  theme,
  Drawer,
  Grid,
  Tag,
  Divider,
  notification,
  Switch,
  Tooltip
} from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  DashboardOutlined,
  LogoutOutlined,
  SwapOutlined,
  FileTextOutlined,
  AppstoreOutlined,
  ContainerOutlined,
  HomeOutlined,
  SettingOutlined,
  BellOutlined,
  CarOutlined,
  TeamOutlined,
  BarChartOutlined,
  SafetyCertificateOutlined,
  BookOutlined,
  GiftOutlined,
  AuditOutlined,
  SecurityScanOutlined,
  CrownOutlined,
  UserSwitchOutlined,
  MonitorOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined,
  SendOutlined,
  HistoryOutlined,
  CalculatorOutlined,
  CalendarOutlined,
  BankOutlined,
} from '@ant-design/icons';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import ParliamentLogo from '@/components/ParliamentLogo';
import NotificationBell from '@/components/notifications/NotificationBell';
import { NotificationProvider } from '@/contexts/NotificationContext';
import useIdleLogout from '@/hooks/useIdleLogout';

const { Header, Sider, Content } = Layout;
const { Text, Title } = Typography;
const { useBreakpoint } = Grid;

type Role = 'SUPERUSER' | 'ADMIN' | 'MAIN_CENTER' | 'SUB_CENTER' | 'BENEFICIARY' | 'AUDITOR' | 'MAIN_CENTER_APPROVER' | 'SUB_CENTER_APPROVER' | 'SERGEANT_OF_ARMS';

interface MenuItem {
  key: string;
  icon: React.ReactNode;
  label: string;
  path: string;
  roles?: Role[];
  badge?: string | number;
  type?: 'item' | 'group' | 'divider';
  children?: MenuItem[];
}

const UnifiedLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileDrawerVisible, setMobileDrawerVisible] = useState(false);
  const { user, logout, hasRole, isSuperAdmin, isMainCenter, isSubCenter, isBeneficiary, isAuditor } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const screens = useBreakpoint();
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  // Initialize idle logout functionality (30 minutes idle, 5 minutes warning)
  useIdleLogout({
    idleTimeLimit: 30 * 60 * 1000, // 30 minutes
    warningTime: 5 * 60 * 1000 // 5 minutes warning
  });

  // Auto-collapse sidebar on mobile
  useEffect(() => {
    if (!screens.lg) {
      setCollapsed(true);
    }
  }, [screens.lg]);

  // Define comprehensive navigation menu items based on roles and centers
  const getMenuItems = (): MenuItem[] => {
    const items: MenuItem[] = [];

    // Main Dashboard Entry Point (exclude SUB_CENTER users who have their own dashboard)
    if (!hasRole(['SUB_CENTER'])) {
      items.push(
        {
          key: 'dashboard',
          icon: <DashboardOutlined />,
          label: 'Dashboard Overview',
          path: '/dashboard',
        }
      );
    }

    // SUB_CENTER Dashboard Entry Point
    if (hasRole(['SUB_CENTER'])) {
      items.push(
        {
          key: 'subcenter-dashboard',
          icon: <DashboardOutlined />,
          label: 'Sub Center Dashboard',
          path: '/dashboard/sub-center',
        }
      );
    }

    // MAIN CENTER OPERATIONS
    if (hasRole(['SUPERUSER', 'ADMIN', 'MAIN_CENTER'])) {
      items.push(
        { type: 'divider' } as MenuItem,
        {
          key: 'main-center-group',
          label: 'MAIN CENTER OPERATIONS',
          type: 'group',
          icon: <HomeOutlined />,
          path: '',
        },
        {
          key: 'inventory-overview',
          icon: <AppstoreOutlined />,
          label: 'Inventory Overview',
          path: '/dashboard/inventory-overview',
        },
        {
          key: 'inventory-management',
          icon: <ContainerOutlined />,
          label: 'Inventory Management',
          path: '/dashboard/inventory-management',
        },
        {
          key: 'box-receipt',
          icon: <GiftOutlined />,
          label: 'Box Receipt Management',
          path: '/dashboard/box-receipt',
        },
        {
          key: 'box-verification',
          icon: <AuditOutlined />,
          label: 'Box & Coupon Verification',
          path: '/dashboard/box-verification',
        },
        {
          key: 'book-dispatch',
          icon: <SwapOutlined />,
          label: 'Book Dispatch',
          path: '/dashboard/book-dispatch',
        },
        {
          key: 'fuel-pricing',
          icon: <CarOutlined />,
          label: 'Fuel Price Management',
          path: '/dashboard/fuel-pricing',
        },
        {
          key: 'sub-center-monitoring',
          icon: <MonitorOutlined />,
          label: 'Sub Center Monitoring',
          path: '/dashboard/sub-center-monitoring',
        },
        {
          key: 'analytics-finance',
          icon: <BarChartOutlined />,
          label: 'Analytics & Finance',
          path: '/dashboard/analytics-finance',
        }
      );
    }

    // SUB CENTER OPERATIONS (Simplified - only working features)
    if (hasRole(['SUB_CENTER', 'SUPERUSER', 'ADMIN']) || (user?.centerId && isSubCenter())) {
      items.push(
        { type: 'divider' } as MenuItem,
        {
          key: 'sub-center-group',
          label: 'SUB CENTER OPERATIONS',
          type: 'group',
          icon: <EnvironmentOutlined />,
          path: '',
        },
        // Commented out until endpoints are fixed
        // {
        //   key: 'center-overview',
        //   icon: <MonitorOutlined />,
        //   label: 'Center Overview',
        //   path: '/dashboard/center-overview',
        // },
        {
          key: 'handovers',
          icon: <SwapOutlined />,
          label: 'Book Handovers',
          path: '/dashboard/handovers',
          badge: 0, // TODO: Get actual pending handovers count from API
        },
        {
          key: 'fuel-distribution',
          icon: <FileTextOutlined />,
          label: 'Fuel Distribution',
          path: '/dashboard/fuel-distribution',
        },
        // Commented out until inventory endpoints are working
        // {
        //   key: 'local-inventory',
        //   icon: <AppstoreOutlined />,
        //   label: 'Local Inventory',
        //   path: '/dashboard/local-inventory',
        // },
        // {
        //   key: 'subcenter-inventory',
        //   icon: <ContainerOutlined />,
        //   label: 'Inventory Management',
        //   path: '/dashboard/subcenter-inventory',
        // },
        {
          key: 'parliament-operations',
          icon: <HomeOutlined />,
          label: 'Parliament Operations',
          path: '/dashboard/parliament-operations',
        }
      );
    }

    // PARLIAMENT OPERATIONS MANAGEMENT (SUB_CENTER ONLY)
    // Beneficiaries are coupon recipients, not parliament operations managers
    // Main Center provides oversight, SUB_CENTER manages operations
    if (hasRole(['SUPERUSER', 'ADMIN', 'SUB_CENTER'])) {
      items.push(
        { type: 'divider' } as MenuItem,
        {
          key: 'parliament-group',
          label: 'PARLIAMENT OPERATIONS',
          type: 'group',
          icon: <CrownOutlined />,
          path: '',
        },
        {
          key: 'beneficiaries',
          icon: <TeamOutlined />,
          label: 'Members Management',
          path: '/dashboard/beneficiaries',
        },
        {
          key: 'sessions',
          icon: <BookOutlined />,
          label: 'Parliament Sessions',
          path: '/dashboard/sessions',
        },
        {
          key: 'programs',
          icon: <AppstoreOutlined />,
          label: 'Programs',
          path: '/dashboard/programs',
        },
        {
          key: 'attendance',
          icon: <ClockCircleOutlined />,
          label: 'Attendance Tracking',
          path: '/dashboard/attendance',
        },
        {
          key: 'constituencies',
          icon: <EnvironmentOutlined />,
          label: 'Constituencies',
          path: '/dashboard/constituencies',
        },
        {
          key: 'political-parties',
          icon: <BankOutlined />,
          label: 'Political Parties',
          path: '/dashboard/political-parties',
        },
        {
          key: 'fuel-allocations',
          icon: <CarOutlined />,
          label: 'Fuel Allocations',
          path: '/dashboard/fuel-allocations',
        },
        {
          key: 'fuel-entitlements',
          icon: <FileTextOutlined />,
          label: 'Fuel Entitlements',
          path: '/dashboard/fuel-entitlements',
        },
        {
          key: 'dynamic-allocations',
          icon: <CalculatorOutlined />,
          label: 'Dynamic Allocations',
          path: '/dashboard/dynamic-allocations',
        }
      );
    }

    // BENEFICIARY PERSONAL ACCOUNT (Individual coupon recipients only)
    if (hasRole(['BENEFICIARY'])) {
      items.push(
        { type: 'divider' } as MenuItem,
        {
          key: 'personal-account-group',
          label: 'MY ACCOUNT',
          type: 'group',
          icon: <UserOutlined />,
          path: '',
        },
        {
          key: 'my-allocations',
          icon: <CarOutlined />,
          label: 'My Fuel Allocations',
          path: '/dashboard/my-allocations',
        },
        {
          key: 'my-transactions',
          icon: <HistoryOutlined />,
          label: 'My Transaction History',
          path: '/dashboard/my-transactions',
        },
        {
          key: 'my-profile',
          icon: <UserOutlined />,
          label: 'My Profile',
          path: '/dashboard/my-profile',
        }
      );
    }

    // PARLIAMENT OVERSIGHT (MAIN_CENTER - Monitoring & Coordination)
    if (hasRole(['MAIN_CENTER'])) {
      items.push(
        { type: 'divider' } as MenuItem,
        {
          key: 'parliament-oversight-group',
          label: 'PARLIAMENT OVERSIGHT',
          type: 'group',
          icon: <MonitorOutlined />,
          path: '',
        },
        {
          key: 'parliament-reports',
          icon: <FileTextOutlined />,
          label: 'Parliament Reports',
          path: '/dashboard/parliament-reports',
        },
        {
          key: 'subcenter-parliament-activity',
          icon: <TeamOutlined />,
          label: 'SubCenter Activities',
          path: '/dashboard/subcenter-activities',
        },
        {
          key: 'system-parliament-analytics',
          icon: <BarChartOutlined />,
          label: 'System Analytics',
          path: '/dashboard/system-analytics',
        }
      );
    }

    // SERGEANT OF ARMS (Parliamentary Attendance Management)
  if (hasRole(['SERGEANT_OF_ARMS', 'SUPERUSER', 'ADMIN'])) {
      items.push(
        { type: 'divider' } as MenuItem,
        {
          key: 'sergeant-group',
          label: 'ATTENDANCE MANAGEMENT',
          type: 'group',
          icon: <TeamOutlined />,
          path: '',
        },
        {
          key: 'attendance-registries',
          icon: <CalendarOutlined />,
          label: 'Attendance Registries',
          path: '/sergeant-of-arms/attendance',
        },
        {
          key: 'attendance-corrections',
          icon: <HistoryOutlined />,
          label: 'Attendance Corrections',
          path: '/sergeant-of-arms/corrections',
        }
      );
    }

    // ANALYTICS & FINANCE (Main Center, Admin, Auditor only - not for Sub Centers)
    if (hasRole(['SUPERUSER', 'ADMIN', 'MAIN_CENTER', 'AUDITOR'])) {
      items.push(
        { type: 'divider' } as MenuItem,
        {
          key: 'analytics-group',
          label: 'ANALYTICS & FINANCE',
          type: 'group',
          icon: <BarChartOutlined />,
          path: '',
        },
        {
          key: 'financial-reports',
          icon: <BarChartOutlined />,
          label: 'Financial Reports',
          path: '/dashboard/main-center?tab=analytics',
        },
        {
          key: 'usage-analytics',
          icon: <AuditOutlined />,
          label: 'Usage Analytics',
          path: '/dashboard/analytics',
        }
      );
    }

    // SYSTEM ADMINISTRATION
    if (isSuperAdmin() || hasRole(['SUPERUSER', 'ADMIN'])) {
      items.push(
        { type: 'divider' } as MenuItem,
        {
          key: 'admin-group',
          label: 'SYSTEM ADMINISTRATION',
          type: 'group',
          icon: <SecurityScanOutlined />,
          path: '',
        },
        {
          key: 'users',
          icon: <UserSwitchOutlined />,
          label: 'User Management',
          path: '/admin/users',
          badge: '3', // pending approvals
        },
        {
          key: 'alerts',
          icon: <BellOutlined />,
          label: 'System Alerts',
          path: '/admin/alerts',
        },
        {
          key: 'subcenters',
          icon: <EnvironmentOutlined />,
          label: 'Sub Centers Config',
          path: '/dashboard/subcenters',
        },
        {
          key: 'subcenter-management',
          icon: <BankOutlined />,
          label: 'SubCenter Management',
          path: '/dashboard/subcenter-management',
        },
        {
          key: 'system-settings',
          icon: <SettingOutlined />,
          label: 'System Settings',
          path: '/admin/settings',
        },
        {
          key: 'reports',
          icon: <BarChartOutlined />,
          label: 'Reports & Analytics',
          path: '/admin/reports',
        },
        {
          key: 'audit-logs',
          icon: <SecurityScanOutlined />,
          label: 'Security Audit',
          path: '/admin/audit-logs',
        }
      );
    }

    // AUDIT & COMPLIANCE (dedicated section for auditors)
    if (hasRole(['AUDITOR', 'SUPERUSER', 'ADMIN'])) {
      items.push(
        { type: 'divider' } as MenuItem,
        {
          key: 'audit-group',
          label: 'AUDIT & COMPLIANCE',
          type: 'group',
          icon: <AuditOutlined />,
          path: '',
        },
        {
          key: 'audit-dashboard',
          icon: <AuditOutlined />,
          label: 'Audit Dashboard',
          path: '/dashboard/audit-logs',
        },
        {
          key: 'compliance-reports',
          icon: <FileTextOutlined />,
          label: 'Compliance Reports',
          path: '/dashboard/compliance',
        },
        {
          key: 'transaction-audit',
          icon: <SecurityScanOutlined />,
          label: 'Transaction Audit',
          path: '/dashboard/transaction-audit',
        }
      );
    }

    return items.filter(item => item.type === 'divider' || item.type === 'group' || !item.roles || hasRole(item.roles as Role[]));
  };

  const menuItems = getMenuItems();

  // Get selected keys based on current path
  const getSelectedKeys = () => {
    const path = location.pathname;
    
    // Direct route matching for main center operations
    if (path.includes('/box-receipt')) return ['box-receipt'];
    if (path.includes('/box-verification')) return ['box-verification'];
    if (path.includes('/book-dispatch')) return ['book-dispatch'];
    if (path.includes('/fuel-pricing')) return ['fuel-pricing'];
    if (path.includes('/inventory-overview')) return ['inventory-overview'];
    if (path.includes('/inventory-management')) return ['inventory-management'];
    if (path.includes('/sub-center-monitoring')) return ['sub-center-monitoring'];
    if (path.includes('/analytics-finance')) return ['analytics-finance'];
    
    // Main Center dashboard (overview)
    if (path.includes('/main-center')) return ['dashboard'];
    
    // Other routes
    if (path.includes('/users')) return ['users'];
    if (path.includes('/subcenters')) return ['subcenters'];
    if (path.includes('/subcenter-management')) return ['subcenter-management'];
    if (path.includes('/settings')) return ['system-settings'];
    if (path.includes('/audit-logs')) return ['audit-logs'];
    if (path.includes('/beneficiaries')) return ['beneficiaries'];
    if (path.includes('/sessions')) return ['sessions'];
    if (path.includes('/attendance')) return ['attendance'];
    if (path.includes('/handovers')) return ['handovers'];
    if (path.includes('/center-overview')) return ['center-overview'];
    if (path.includes('/fuel-distribution')) return ['fuel-distribution'];
    if (path.includes('/local-inventory')) return ['local-inventory'];
    if (path.includes('/subcenter-inventory')) return ['subcenter-inventory'];
    if (path.includes('/fuel-allocations')) return ['fuel-allocations'];
    if (path.includes('/fuel-entitlements')) return ['fuel-entitlements'];
    if (path.includes('/dynamic-allocations')) return ['dynamic-allocations'];
    if (path.includes('/analytics')) return ['usage-analytics'];
    
    // Sergeant of Arms routes
    if (path.includes('/sergeant-of-arms/corrections')) return ['attendance-corrections'];
    if (path.includes('/sergeant-of-arms/attendance')) return ['attendance-registries'];
    if (path.includes('/sergeant-of-arms')) return ['attendance-registries']; // Default to registries instead of dashboard
    
    return ['dashboard'];
  };

  // Handle menu click
  const handleMenuClick = ({ key }: { key: string }) => {
    const findItem = (items: MenuItem[], targetKey: string): MenuItem | null => {
      for (const item of items) {
        if (item.key === targetKey) return item;
        if (item.children) {
          const found = findItem(item.children, targetKey);
          if (found) return found;
        }
      }
      return null;
    };

    const item = findItem(menuItems, key);
    if (item?.path) {
      navigate(item.path);
    }
  };

  // Header user menu
  const userMenuItems = [
    {
      key: 'profile',
      label: 'Profile Settings',
      icon: <UserOutlined />,
      onClick: () => navigate('/dashboard/profile'),
    },
    {
      key: 'preferences',
      label: 'Preferences',
      icon: <SettingOutlined />,
      onClick: () => navigate('/dashboard/preferences'),
    },
    { 
      type: 'divider' as const
    },
    {
      key: 'logout',
      label: 'Logout',
      icon: <LogoutOutlined />,
      onClick: () => {
        logout();
        navigate('/');
        notification.success({
          message: 'Logged out successfully',
          description: 'You have been securely logged out of the system.',
        });
      },
      danger: true,
    },
  ];

  // Render menu items with proper grouping
  const renderMenuItems = (items: MenuItem[]) => {
    return items.map((item) => {
      if (item.type === 'divider') {
        return <Menu.Divider key={`divider-${Math.random()}`} />;
      }
      
      if (item.type === 'group') {
        return (
          <Menu.ItemGroup key={item.key} title={item.label}>
            {/* Group items will be rendered after this */}
          </Menu.ItemGroup>
        );
      }

      if (item.children) {
        return (
          <Menu.SubMenu
            key={item.key}
            icon={item.icon}
            title={
              <span>
                {item.label}
                {item.badge && (
                  <Badge count={item.badge} size="small" style={{ marginLeft: 8 }} />
                )}
              </span>
            }
          >
            {item.children.map(child => (
              <Menu.Item key={child.key} icon={child.icon}>
                {child.label}
              </Menu.Item>
            ))}
          </Menu.SubMenu>
        );
      }

      return (
        <Menu.Item key={item.key} icon={item.icon}>
          <span>
            {item.label}
            {item.badge && (
              <Badge count={item.badge} size="small" style={{ marginLeft: 8 }} />
            )}
          </span>
        </Menu.Item>
      );
    });
  };

  // Sidebar component
  const Sidebar = () => (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={setCollapsed}
      width={280}
      collapsedWidth={80}
      theme="light"
      style={{
        background: 'linear-gradient(135deg, #f6f9fc 0%, #ffffff 100%)',
        borderRight: '1px solid #f0f0f0',
        boxShadow: '2px 0 8px rgba(0,0,0,0.05)',
      }}
      trigger={null}
    >
      {/* Logo section - TEMPORARILY HIDDEN */}
      <div 
        className={`flex items-center ${collapsed ? 'justify-center p-3' : 'justify-start p-4'} border-b border-gray-100`}
        style={{ height: 64 }}
      >
        {/* <ParliamentLogo size="small" /> */}
        {collapsed ? (
          <Tooltip title={`${user?.role === 'MAIN_CENTER' ? 'Main Center' : user?.role === 'SUB_CENTER' ? 'Sub Center' : 'Admin'} - ${user?.name}`} placement="right">
            <Avatar 
              size="default" 
              icon={
                user?.role === 'SUPERUSER' || user?.role === 'ADMIN' ? <SecurityScanOutlined /> :
                user?.role === 'MAIN_CENTER' ? <HomeOutlined /> : 
                user?.role === 'SUB_CENTER' ? <EnvironmentOutlined /> : <UserOutlined />
              } 
              style={{ 
                backgroundColor: user?.role === 'SUPERUSER' || user?.role === 'ADMIN' ? '#722ed1' : 
                                user?.role === 'MAIN_CENTER' ? '#1890ff' : 
                                user?.role === 'SUB_CENTER' ? '#52c41a' : '#faad14',
                border: '2px solid #fff',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}
            />
          </Tooltip>
        ) : (
          <div className="ml-3">
            <Title level={5} className="mb-0">
              Fuel Coupon System
            </Title>
            <Text type="secondary" className="text-xs">
              Parliament of Zimbabwe
            </Text>
          </div>
        )}
      </div>

      {/* User info section */}
      {!collapsed && (
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <Avatar 
              size="small" 
              icon={<UserOutlined />} 
              style={{ 
                backgroundColor: user?.role === 'SUPERUSER' || user?.role === 'ADMIN' ? '#722ed1' : 
                                user?.role === 'MAIN_CENTER' ? '#1890ff' : 
                                user?.role === 'SUB_CENTER' ? '#52c41a' : '#faad14' 
              }}
            />
            <div className="flex-1 min-w-0">
              <Text strong className="block text-sm truncate">
                {user?.name || 'User'}
              </Text>
              <div className="flex flex-col gap-1 mt-1">
                <Tag 
                  color={
                    user?.role === 'SUPERUSER' || user?.role === 'ADMIN' ? 'purple' : 
                    user?.role === 'MAIN_CENTER' ? 'blue' : 
                    user?.role === 'SUB_CENTER' ? 'green' : 'orange'
                  } 
                  className="text-xs w-fit"
                >
                  {user?.role === 'SUPERUSER' || user?.role === 'ADMIN' ? 'System Admin' :
                   user?.role === 'MAIN_CENTER' ? 'Main Center' :
                   user?.role === 'SUB_CENTER' ? 'Sub Center' :
                   user?.role === 'BENEFICIARY' ? 'Parliament Member' :
                   user?.role === 'AUDITOR' ? 'Auditor' : user?.role}
                </Tag>
                {user?.centerId && (
                  <Text type="secondary" className="block text-xs">
                    📍 {user.centerId}
                  </Text>
                )}
                {user?.role === 'MAIN_CENTER' && (
                  <Text type="secondary" className="block text-xs">
                    🏢 Central Operations
                  </Text>
                )}
                {user?.role === 'SUB_CENTER' && (
                  <Text type="secondary" className="block text-xs">
                    🌍 Regional Office
                  </Text>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Stats for collapsed view */}
      {collapsed && user?.role === 'MAIN_CENTER' && (
        <div className="p-2 border-b border-gray-100">
          <div className="text-center">
            <Tooltip title="Active Boxes" placement="right">
              <div className="mb-2">
                <Text strong style={{ fontSize: '12px', color: '#1890ff' }}>245</Text>
                <div style={{ fontSize: '10px', color: '#8c8c8c' }}>Boxes</div>
              </div>
            </Tooltip>
            <Tooltip title="Pending Actions" placement="right">
              <div>
                <Badge count={12} size="small">
                  <Avatar size="small" style={{ backgroundColor: '#52c41a' }}>
                    <SwapOutlined style={{ fontSize: '12px' }} />
                  </Avatar>
                </Badge>
              </div>
            </Tooltip>
          </div>
        </div>
      )}

      {collapsed && user?.role === 'SUB_CENTER' && (
        <div className="p-2 border-b border-gray-100">
          <div className="text-center">
            <Tooltip title="Local Inventory" placement="right">
              <div className="mb-2">
                <Text strong style={{ fontSize: '12px', color: '#52c41a' }}>18</Text>
                <div style={{ fontSize: '10px', color: '#8c8c8c' }}>Books</div>
              </div>
            </Tooltip>
            <Tooltip title="Pending Handovers" placement="right">
              <div>
                <Badge count={3} size="small">
                  <Avatar size="small" style={{ backgroundColor: '#faad14' }}>
                    <SendOutlined style={{ fontSize: '12px' }} />
                  </Avatar>
                </Badge>
              </div>
            </Tooltip>
          </div>
        </div>
      )}

      {/* Navigation menu */}
      <Menu
        mode="inline"
        selectedKeys={getSelectedKeys()}
        onClick={handleMenuClick}
        style={{ 
          borderRight: 'none',
          background: 'transparent',
          padding: '8px 0',
        }}
        theme="light"
        items={menuItems.map(item => {
          if (item.type === 'divider') {
            return { type: 'divider', key: `divider-${Math.random()}` };
          }
          
          if (item.type === 'group') {
            return {
              type: 'group',
              key: item.key,
              label: (
                <Text 
                  strong 
                  style={{ 
                    fontSize: '11px', 
                    color: '#8c8c8c',
                    letterSpacing: '0.5px',
                  }}
                >
                  {item.label}
                </Text>
              ),
            };
          }

          if (item.children) {
            return {
              key: item.key,
              icon: React.cloneElement(item.icon as React.ReactElement, {
                className: 'sidebar-icon'
              }),
              label: (
                <span>
                  {item.label}
                  {item.badge && (
                    <Badge 
                      count={item.badge} 
                      size="small" 
                      style={{ 
                        marginLeft: 8,
                        backgroundColor: '#ff4d4f',
                        boxShadow: '0 0 0 1px #d9d9d9 inset'
                      }} 
                    />
                  )}
                </span>
              ),
              children: item.children.map(child => ({
                key: child.key,
                icon: React.cloneElement(child.icon as React.ReactElement, {
                  className: 'sidebar-icon-child'
                }),
                label: <span>{child.label}</span>,
              })),
            };
          }

          return {
            key: item.key,
            icon: React.cloneElement(item.icon as React.ReactElement, {
              className: 'sidebar-icon'
            }),
            label: (
              <span>
                {item.label}
                {item.badge && (
                  <Badge 
                    count={item.badge} 
                    size="small" 
                    style={{ 
                      marginLeft: 8,
                      backgroundColor: item.key.includes('handover') ? '#52c41a' : '#ff4d4f',
                      boxShadow: '0 0 0 1px #d9d9d9 inset'
                    }} 
                  />
                )}
              </span>
            ),
          };
        })}
      />
    </Sider>
  );

  return (
    <NotificationProvider
      userRole={user?.role as 'MAIN_CENTER' | 'SUB_CENTER' | 'BENEFICIARY'}
      userId={user?.id?.toString() || ''}
    >
      <Layout style={{ minHeight: '100vh' }}>
        {/* Desktop Sidebar */}
        {screens.lg ? (
          <Sidebar />
        ) : (
          /* Mobile Drawer */
          <Drawer
            title={
              <div className="flex items-center gap-2">
                {/* <ParliamentLogo size="small" /> */}
                <span>Fuel Coupon System</span>
              </div>
            }
            placement="left"
            onClose={() => setMobileDrawerVisible(false)}
            open={mobileDrawerVisible}
            styles={{ body: { padding: 0 } }}
            width={280}
          >
            <Sidebar />
          </Drawer>
        )}

        <Layout>
          {/* Top Header */}
          <Header
            style={{
              background: '#1877F2', // Facebook blue
              padding: '0 16px',
              borderBottom: '1px solid #1565C0',
              boxShadow: '0 2px 8px rgba(24,119,242,0.15)',
              height: 64,
              lineHeight: '64px',
            }}
          >
            <div className="flex items-center justify-between h-full">
              {/* Left section */}
              <div className="flex items-center gap-4">
                <Button
                  type="text"
                  icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                  onClick={() => {
                    if (screens.lg) {
                      setCollapsed(!collapsed);
                    } else {
                      setMobileDrawerVisible(true);
                    }
                  }}
                  style={{
                    color: 'white',
                    borderColor: 'transparent'
                  }}
                />
                
                <div className="flex items-center gap-3">
                  <div>
                    <Text strong style={{ fontSize: '16px', color: 'white' }}>
                      Fuel Coupon System
                    </Text>
                    {user?.role && (
                      <div className="flex items-center gap-2 mt-1">
                        <Tag 
                          color={
                            user?.role === 'SUPERUSER' || user?.role === 'ADMIN' ? 'purple' : 
                            user?.role === 'MAIN_CENTER' ? 'blue' : 
                            user?.role === 'SUB_CENTER' ? 'green' : 'orange'
                          } 
                          style={{ margin: 0, fontSize: '11px' }}
                        >
                          {user?.role === 'MAIN_CENTER' ? '🏢 Main Center' :
                           user?.role === 'SUB_CENTER' ? '🌍 Sub Center' :
                           user?.role === 'SUPERUSER' || user?.role === 'ADMIN' ? '⚡ System Admin' :
                           user?.role === 'BENEFICIARY' ? '🏛️ Parliament' : user?.role}
                        </Tag>
                        {user?.centerId && (
                          <Text type="secondary" style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>
                            • {user.centerId}
                          </Text>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right section */}
              <Space size="middle">
                {/* Import and use the NotificationBell component */}
                <NotificationBell
                  userRole={user?.role as 'MAIN_CENTER' | 'SUB_CENTER' | 'BENEFICIARY'}
                  userId={user?.id?.toString() || ''}
                />

                <Dropdown
                  menu={{ items: userMenuItems }}
                  placement="bottomRight"
                  trigger={['click']}
                >
                  <Button type="text" className="flex items-center gap-2" style={{ color: 'white' }}>
                    <Avatar size="small" icon={<UserOutlined />} />
                    {screens.sm && (
                      <span>{user?.name || 'User'}</span>
                    )}
                  </Button>
                </Dropdown>
              </Space>
            </div>
          </Header>

          {/* Main Content */}
          <Content
            style={{
              margin: '16px',
              padding: '24px',
              background: colorBgContainer,
              borderRadius: borderRadiusLG,
              minHeight: 'calc(100vh - 112px)',
            }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </Content>
        </Layout>
      </Layout>
    </NotificationProvider>
  );
};

export default UnifiedLayout;
