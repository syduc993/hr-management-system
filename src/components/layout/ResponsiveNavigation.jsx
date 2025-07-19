import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useNotification } from '../../hooks/useNotification';

const ResponsiveNavigation = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  
  const { user, logout } = useAuth();
  const { showNotification } = useNotification();
  const location = useLocation();

  // Detect mobile screen
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Menu items configuration
  const menuItems = [
    {
      path: '/dashboard',
      icon: 'fas fa-tachometer-alt',
      label: 'Dashboard',
      roles: ['admin', 'hr', 'sales_manager', 'finance_manager', 'director']
    },
    {
      path: '/employee-management',
      icon: 'fas fa-users-cog',
      label: 'Quản lý nhân viên',
      roles: ['admin', 'hr']
    },
    {
      path: '/hr-dashboard',
      icon: 'fas fa-chart-bar',
      label: 'HR Dashboard',
      roles: ['admin', 'hr']
    },
    {
      path: '/attendance-logs',
      icon: 'fas fa-clock',
      label: 'Bản ghi chấm công',
      roles: ['admin', 'hr', 'sales_manager', 'finance_manager', 'director']
    }
  ];

  const filteredMenuItems = menuItems.filter(item => 
    item.roles.includes(user?.role)
  );

  const isActiveRoute = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const handleLogout = async () => {
    try {
      await logout();
      showNotification('Đăng xuất thành công!', 'success');
    } catch (error) {
      console.error('Logout error:', error);
      showNotification('Lỗi khi đăng xuất', 'error');
    }
  };

  // Desktop Navigation (Always visible sidebar)
  const DesktopNavigation = () => (
    <div className="d-none d-md-flex">
      {/* Desktop Sidebar */}
      <div className="bg-light border-end" style={{ width: '280px', minHeight: '100vh' }}>
        {/* Brand Header */}
        <div className="p-3 border-bottom">
          <div className="d-flex align-items-center">
            <div className="rounded-circle bg-primary d-flex align-items-center justify-content-center me-2" 
                 style={{ width: '40px', height: '40px' }}>
              <i className="fas fa-user text-white"></i>
            </div>
            <div>
              <div className="fw-semibold">{user?.fullName}</div>
              <small className="text-muted">{getRoleDisplayName(user?.role)}</small>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-grow-1 p-2">
          {filteredMenuItems.map((item, index) => (
            <a
              key={index}
              href={item.path}
              className={`nav-link d-flex align-items-center rounded mb-1 p-3 ${
                isActiveRoute(item.path) ? 'active bg-primary text-white' : 'text-dark'
              }`}
            >
              <i className={`${item.icon} me-2`}></i>
              <span>{item.label}</span>
            </a>
          ))}
        </nav>

        {/* User Actions */}
        <div className="border-top p-3">
          <button 
            className="btn btn-outline-danger w-100"
            onClick={handleLogout}
          >
            <i className="fas fa-sign-out-alt me-2"></i>
            Đăng xuất
          </button>
        </div>
      </div>
    </div>
  );

  // Mobile Navigation (Top navbar + collapsible menu)
  const MobileNavigation = () => (
    <div className="d-md-none">
      {/* Mobile Top Bar */}
      <nav className="navbar navbar-dark bg-dark">
        <div className="container-fluid">
          <a className="navbar-brand" href="/dashboard">
            <i className="fas fa-users me-2"></i>
            HR Management
          </a>
          
          <button
            className="navbar-toggler"
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <span className="navbar-toggler-icon"></span>
          </button>
        </div>
      </nav>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50"
            style={{ zIndex: 1040 }}
            onClick={() => setSidebarOpen(false)}
          ></div>
          
          {/* Mobile Sidebar */}
          <div 
            className="position-fixed top-0 start-0 bg-light h-100"
            style={{ width: '280px', zIndex: 1050 }}
          >
            {/* Mobile Header */}
            <div className="p-3 border-bottom d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center">
                <div className="rounded-circle bg-primary d-flex align-items-center justify-content-center me-2" 
                     style={{ width: '32px', height: '32px' }}>
                  <i className="fas fa-user text-white"></i>
                </div>
                <div>
                  <div className="fw-semibold small">{user?.fullName}</div>
                  <small className="text-muted">{getRoleDisplayName(user?.role)}</small>
                </div>
              </div>
              <button 
                className="btn btn-sm btn-outline-secondary"
                onClick={() => setSidebarOpen(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            {/* Mobile Menu */}
            <nav className="p-2">
              {filteredMenuItems.map((item, index) => (
                <a
                  key={index}
                  href={item.path}
                  className={`nav-link d-flex align-items-center rounded mb-1 p-3 ${
                    isActiveRoute(item.path) ? 'active bg-primary text-white' : 'text-dark'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <i className={`${item.icon} me-2`}></i>
                  <span>{item.label}</span>
                </a>
              ))}
            </nav>

            {/* Mobile User Actions */}
            <div className="position-absolute bottom-0 w-100 border-top p-3">
              <button 
                className="btn btn-outline-danger w-100"
                onClick={handleLogout}
              >
                <i className="fas fa-sign-out-alt me-2"></i>
                Đăng xuất
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );

  const getRoleDisplayName = (role) => {
    const roleMap = {
      'admin': 'Administrator',
      'hr': 'HR Manager',
      'sales_manager': 'Sales Manager',
      'finance_manager': 'Finance Manager',
      'director': 'Director'
    };
    return roleMap[role] || 'Nhân viên';
  };

  if (!user) return null;

  return (
    <>
      <DesktopNavigation />
      <MobileNavigation />
    </>
  );
};

export default ResponsiveNavigation;
