import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import ResponsiveNavigation from './ResponsiveNavigation';

const Layout = () => {
  const { user } = useAuth();
  const location = useLocation();

  useEffect(() => {
    // Initialize tooltips when location changes
    if (typeof window !== 'undefined' && window.bootstrap) {
      const tooltipTriggerList = [].slice.call(
        document.querySelectorAll('[data-bs-toggle="tooltip"]')
      );
      tooltipTriggerList.map(tooltipTriggerEl => {
        return new window.bootstrap.Tooltip(tooltipTriggerEl);
      });
    }
  }, [location]);

  if (!user) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex">
      <ResponsiveNavigation />
      
      {/* Main content */}
      <div className="flex-grow-1">
        <main className="container-fluid py-4">
          <Outlet />
        </main>
      </div>

      {/* Alert container for notifications */}
      <div id="alert-container" className="position-fixed" style={{
        top: '20px',
        right: '20px',
        zIndex: 1055,
        minWidth: '300px'
      }}></div>
    </div>
  );
};

export default Layout;
