import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { useNotification } from './hooks/useNotification';

// Components
import Layout from './components/layout/Layout';
import Loading from './components/common/Loading';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import EmployeeManagementPage from './pages/EmployeeManagementPage';
import AttendanceLogsPage from './pages/AttendanceLogsPage';
import HRDashboardPage from './pages/HRDashboardPage';


// Global styles
import './styles/globals.css';

const App = () => {
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const { user, checkAuth, loading: authLoading } = useAuth();
  const { showNotification } = useNotification();
  const location = useLocation();

  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('🚀 Starting React app initialization...');
        
        // Initialize global utilities
        initializeGlobalUtilities();
        
        // Check authentication for protected pages
        if (isProtectedPage()) {
          console.log('🔐 Checking authentication...');
          const authUser = await checkAuth();
          if (!authUser && !isPublicPage()) {
            console.log('❌ Authentication failed for protected page');
            return;
          }
          console.log('✅ Authentication check completed');
        }
        
        setInitialized(true);
        console.log('✅ React app initialization completed successfully');
        
      } catch (error) {
        console.error('❌ App initialization error:', error);
        
        // More specific error handling
        if (error.name === 'TypeError') {
          showNotification('Lỗi tải module. Vui lòng refresh trang.', 'error');
        } else if (error.message.includes('fetch')) {
          showNotification('Lỗi kết nối server. Vui lòng kiểm tra mạng.', 'error');
        } else {
          showNotification('Lỗi khởi tạo ứng dụng. Vui lòng refresh trang.', 'error');
        }
      } finally {
        setLoading(false);
      }
    };

    initializeApp();
  }, []);

  const initializeGlobalUtilities = () => {
    try {
      // Initialize tooltips safely
      if (typeof window.bootstrap !== 'undefined') {
        const tooltipTriggerList = [].slice.call(
          document.querySelectorAll('[data-bs-toggle="tooltip"]')
        );
        tooltipTriggerList.map(tooltipTriggerEl => {
          return new window.bootstrap.Tooltip(tooltipTriggerEl);
        });
      }
    } catch (error) {
      console.warn('Error initializing tooltips:', error);
    }
  };

  const isProtectedPage = () => {
    const publicPaths = ['/', '/login'];
    return !publicPaths.includes(location.pathname);
  };

  const isPublicPage = () => {
    const publicPaths = ['/', '/login'];
    return publicPaths.includes(location.pathname);
  };

  // Show loading spinner during initialization
  if (loading || authLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <Loading />
      </div>
    );
  }

  // Show error message if initialization failed
  if (!initialized) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger">
          <h4>Lỗi khởi tạo ứng dụng</h4>
          <p>Không thể khởi tạo ứng dụng. Vui lòng:</p>
          <ul>
            <li>Refresh lại trang (F5)</li>
            <li>Kiểm tra kết nối mạng</li>
            <li>Liên hệ IT support nếu vấn đề vẫn tiếp tục</li>
          </ul>
          <button 
            className="btn btn-primary" 
            onClick={() => window.location.reload()}
          >
            Refresh Trang
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <Routes>
        {/* Public routes */}
        <Route 
          path="/login" 
          element={
            user ? <Navigate to="/dashboard" replace /> : <LoginPage />
          } 
        />
        
        {/* Protected routes with Layout */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          {/* Default redirect */}
          <Route index element={<Navigate to="/dashboard" replace />} />
          
          {/* Dashboard routes */}
          <Route path="dashboard" element={<DashboardPage />} />
          <Route 
            path="hr-dashboard" 
            element={
              <ProtectedRoute requiredRoles={['hr', 'admin']}>
                <HRDashboardPage />
              </ProtectedRoute>
            } 
          />
          
          {/* Employee management routes */}
          <Route 
            path="employee-management" 
            element={
              <ProtectedRoute requiredRoles={['hr', 'admin']}>
                <EmployeeManagementPage />
              </ProtectedRoute>
            } 
          />
          
          {/* Attendance routes */}
          <Route path="attendance-logs" element={<AttendanceLogsPage />} />
        </Route>

        {/* Catch all route */}
        <Route 
          path="*" 
          element={
            user ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />
      </Routes>
    </div>
  );
};

export default App;
