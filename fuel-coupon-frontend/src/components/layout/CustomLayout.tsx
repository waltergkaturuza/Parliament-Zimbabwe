// src/components/layout/CustomLayout.tsx
import React, { ReactNode } from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  Box, AppBar, Toolbar, Typography, Drawer, List, ListItem, ListItemButton,
  ListItemText, CssBaseline, useTheme, useMediaQuery, IconButton, Button, Divider, Tooltip, ListItemIcon
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';
import AccountCircle from '@mui/icons-material/AccountCircle';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import StoreIcon from '@mui/icons-material/Store';
import LocalGasStationIcon from '@mui/icons-material/LocalGasStation';
import InventoryIcon from '@mui/icons-material/Inventory';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import DescriptionIcon from '@mui/icons-material/Description';

import { useAuth } from '../../contexts/AuthContext';

const drawerWidthExpanded = 240;
const drawerWidthCollapsed = 60;
const topbarHeight = 64;

interface CustomLayoutProps {
  children: ReactNode;
  title?: string;
}

const navItems = [
  { path: '/dashboard', text: 'Dashboard', icon: <DashboardIcon />, roles: ['SUPER_ADMIN', 'MAIN_CENTER', 'SUB_CENTER', 'BENEFICIARY', 'AUDITOR'] },
  { path: '/users', text: 'User Management', icon: <PeopleIcon />, roles: ['SUPER_ADMIN', 'MAIN_CENTER'] },
  { path: '/subcenters', text: 'Sub Centers', icon: <StoreIcon />, roles: ['SUPER_ADMIN', 'MAIN_CENTER', 'AUDITOR'] },
  { path: '/coupons', text: 'Coupons', icon: <LocalGasStationIcon />, roles: ['SUPER_ADMIN', 'MAIN_CENTER', 'SUB_CENTER', 'AUDITOR'] },
  { path: '/boxes', text: 'Boxes', icon: <InventoryIcon />, roles: ['SUPER_ADMIN', 'MAIN_CENTER', 'AUDITOR'] },
  { path: '/books', text: 'Books', icon: <InventoryIcon />, roles: ['SUPER_ADMIN', 'MAIN_CENTER', 'AUDITOR'] },
  { path: '/handovers', text: 'Handovers', icon: <SwapHorizIcon />, roles: ['SUPER_ADMIN', 'MAIN_CENTER', 'SUB_CENTER', 'AUDITOR'] },
  { path: '/fuel-transactions', text: 'Fuel Transactions', icon: <LocalGasStationIcon />, roles: ['SUPER_ADMIN', 'MAIN_CENTER', 'SUB_CENTER', 'AUDITOR', 'BENEFICIARY'] },
  // { path: '/reports', text: 'Reports', icon: <DescriptionIcon />, roles: ['SUPER_ADMIN', 'MAIN_CENTER', 'AUDITOR'] },
];

const CustomLayout = ({ children, title = 'Fuel Coupon System' }: CustomLayoutProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [desktopOpen, setDesktopOpen] = React.useState(true);

  const { user, logout, isAuthenticated } = useAuth();
  const location = useLocation();

  const handleMobileDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleDesktopDrawerToggle = () => {
    setDesktopOpen(!desktopOpen);
  };

  const filteredNavItems = navItems.filter(item =>
    item.roles.includes(user?.role || 'ANONYMOUS')
  );

  const sidebarContent = (
    <Box sx={{
      width: desktopOpen ? drawerWidthExpanded : drawerWidthCollapsed,
      flexShrink: 0,
      bgcolor: theme.palette.grey[900],
      color: '#fff',
      height: '100%',
      overflowY: 'auto',
      overflowX: 'hidden',
      transition: theme.transitions.create('width', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.enteringScreen,
      }),
    }}>
      <Toolbar sx={{ display: 'flex', alignItems: 'center', justifyContent: desktopOpen ? 'flex-start' : 'center', px: desktopOpen ? 2 : 0 }}>
        {desktopOpen && (
          <Typography variant="h6" noWrap component="div">
            Fuel Admin
          </Typography>
        )}
      </Toolbar>
      <Divider sx={{ borderColor: theme.palette.grey[700] }} />
      <List>
        {filteredNavItems.map((item) => (
          <ListItem key={item.path} disablePadding sx={{ display: 'block' }}>
            <Tooltip title={!desktopOpen ? item.text : ''} placement="right" arrow>
              <ListItemButton
                component={Link}
                to={item.path}
                selected={location.pathname === item.path}
                onClick={isMobile ? handleMobileDrawerToggle : undefined}
                sx={{
                  minHeight: 48,
                  justifyContent: desktopOpen ? 'initial' : 'center',
                  px: 2.5,
                  bgcolor: location.pathname === item.path ? 'rgba(255,255,255,0.1)' : 'transparent',
                  color: location.pathname === item.path ? theme.palette.primary.light : 'inherit',
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.08)',
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: desktopOpen ? 3 : 'auto',
                    justifyContent: 'center',
                    color: location.pathname === item.path ? theme.palette.primary.light : 'inherit',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  sx={{
                    opacity: desktopOpen ? 1 : 0,
                    transition: theme.transitions.create('opacity', {
                      easing: theme.transitions.easing.sharp,
                      duration: theme.transitions.duration.enteringScreen,
                    }),
                  }}
                />
              </ListItemButton>
            </Tooltip>
          </ListItem>
        ))}
      </List>
      <Divider sx={{ borderColor: theme.palette.grey[700] }} />
    </Box>
  );

  if (!isAuthenticated) return null;

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          height: topbarHeight,
          width: { md: `calc(100% - ${desktopOpen ? drawerWidthExpanded : drawerWidthCollapsed}px)` },
          ml: { md: desktopOpen ? drawerWidthExpanded : drawerWidthCollapsed },
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', height: '100%' }}>
          {isMobile ? (
            <IconButton color="inherit" aria-label="open drawer" edge="start" onClick={handleMobileDrawerToggle} sx={{ mr: 2 }}>
              <MenuIcon />
            </IconButton>
          ) : (
            <IconButton color="inherit" onClick={handleDesktopDrawerToggle} edge="start" sx={{ mr: 2 }}>
              {desktopOpen ? <ChevronLeftIcon /> : <ChevronRightIcon />}
            </IconButton>
          )}
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {title}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {user && (
              <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                <AccountCircle sx={{ mr: 0.5 }} />
                <Typography variant="body1" sx={{ mr: 1 }}>{user.username}</Typography>
                {user.role && <Typography variant="body2" color="text.secondary">({user.role.replace('_', ' ')})</Typography>}
              </Box>
            )}
            <Button color="inherit" startIcon={<LogoutIcon />} onClick={() => logout()}>
              Logout
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Sidebar */}
      <Box
        component="nav"
        sx={{
          width: { md: desktopOpen ? drawerWidthExpanded : drawerWidthCollapsed },
          flexShrink: { md: 0 },
        }}
        aria-label="main navigation"
      >
        {/* Mobile Drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleMobileDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidthExpanded,
              top: `${topbarHeight}px`,
              height: `calc(100% - ${topbarHeight}px)`,
              bgcolor: theme.palette.grey[900],
              color: '#fff',
            },
          }}
        >
          {sidebarContent}
        </Drawer>

        {/* Desktop Drawer */}
        <Drawer
          variant="permanent"
          open
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: desktopOpen ? drawerWidthExpanded : drawerWidthCollapsed,
              top: `${topbarHeight}px`,
              height: `calc(100% - ${topbarHeight}px)`,
              bgcolor: theme.palette.grey[900],
              color: '#fff',
              transition: theme.transitions.create('width', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
            },
          }}
        >
          {sidebarContent}
        </Drawer>
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          mt: `${topbarHeight}px`,
          width: { md: `calc(100% - ${desktopOpen ? drawerWidthExpanded : drawerWidthCollapsed}px)` },
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default CustomLayout;
