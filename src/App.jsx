import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { useNotification } from './hooks/useNotification';

// Components - Thành phần giao diện
import Layout from './components/layout/Layout';
import Loading from './components/common/Loading';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Pages - Các trang chính
import LoginPage from './pages/LoginPage';
import EmployeeManagementPage from './pages/EmployeeManagementPage';
import AttendanceLogsPage from './pages/AttendanceLogsPage';
import HRDashboardPage from './pages/HRDashboardPage';

// Global styles - Styles toàn cục
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
      console.log('🚀 Bắt đầu khởi tạo ứng dụng React...');
      
      initializeGlobalUtilities();
      
      if (isProtectedPage()) {
        console.log('🔐 Đang kiểm tra xác thực...');
        const authUser = await checkAuth();
        if (!authUser && !isPublicPage()) {
          console.log('❌ Xác thực thất bại cho trang được bảo vệ');
          // ✅ SỬA: Đặt initialized = true để redirect về login
          setInitialized(true);
          return;
        }
        console.log('✅ Hoàn thành kiểm tra xác thực');
      }
      
      setInitialized(true);
      console.log('✅ Khởi tạo ứng dụng React thành công');
      
    } catch (error) {
      console.error('❌ Lỗi khởi tạo ứng dụng:', error);
      
      // ✅ SỬA: Luôn set initialized = true để cho phép render Routes
      setInitialized(true);
      
      // Chỉ hiện notification, không chặn ứng dụng
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


    // const initializeApp = async () => {
    //   try {
    //     console.log('🚀 Bắt đầu khởi tạo ứng dụng React...');
        
    //     initializeGlobalUtilities();
        
    //     if (isProtectedPage()) {
    //       console.log('🔐 Đang kiểm tra xác thực...');
    //       const authUser = await checkAuth();
    //       if (!authUser && !isPublicPage()) {
    //         console.log('❌ Xác thực thất bại cho trang được bảo vệ');
    //         return;
    //       }
    //       console.log('✅ Hoàn thành kiểm tra xác thực');
    //     }
        
    //     setInitialized(true);
    //     console.log('✅ Khởi tạo ứng dụng React thành công');
        
    //   } catch (error) {
    //     console.error('❌ Lỗi khởi tạo ứng dụng:', error);
        
    //     if (error.name === 'TypeError') {
    //       showNotification('Lỗi tải module. Vui lòng refresh trang.', 'error');
    //     } else if (error.message.includes('fetch')) {
    //       showNotification('Lỗi kết nối server. Vui lòng kiểm tra mạng.', 'error');
    //     } else {
    //       showNotification('Lỗi khởi tạo ứng dụng. Vui lòng refresh trang.', 'error');
    //     }
    //   } finally {
    //     setLoading(false);
    //   }
    // };

    initializeApp();
  }, []);

  const initializeGlobalUtilities = () => {
    try {
      if (typeof window.bootstrap !== 'undefined') {
        const tooltipTriggerList = [].slice.call(
          document.querySelectorAll('[data-bs-toggle="tooltip"]')
        );
        tooltipTriggerList.map(tooltipTriggerEl => {
          return new window.bootstrap.Tooltip(tooltipTriggerEl);
        });
      }
    } catch (error) {
      console.warn('Lỗi khởi tạo tooltips:', error);
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

  // Helper function để redirect theo role
  const getDefaultRedirectPath = (userRole) => {
    if (userRole === 'sales') {
      return '/attendance-logs';
    } else {
      return '/employee-management';
    }
  };

  if (loading || authLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <Loading />
      </div>
    );
  }

  if (!initialized) {
    // Redirect về login khi có lỗi khởi tạo
    return <Navigate to="/login" replace />;
  }


  // if (!initialized) {
  //   return (
  //     <div className="container mt-5">
  //       <div className="alert alert-danger">
  //         <h4>Lỗi khởi tạo ứng dụng</h4>
  //         <p>Không thể khởi tạo ứng dụng. Vui lòng:</p>
  //         <ul>
  //           <li>Refresh lại trang (F5)</li>
  //           <li>Kiểm tra kết nối mạng</li>
  //           <li>Liên hệ IT support nếu vấn đề vẫn tiếp tục</li>
  //         </ul>
  //         <button 
  //           className="btn btn-primary" 
  //           onClick={() => window.location.reload()}
  //         >
  //           Refresh Trang
  //         </button>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <div className="App">
      {/* ✅ BƯỚC 1: Thêm container cho thông báo tại đây */}
      <div id="alert-container" style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 1055,
        minWidth: '300px'
      }}></div>

      <Routes>
        {/* Các route công khai */}
        <Route 
          path="/login" 
          element={
            // ✅ SỬA: Không tự động redirect, để LoginPage tự handle
            user ? (
              <Navigate to={getDefaultRedirectPath(user.role)} replace />
            ) : (
              <LoginPage />
            )
          } 
        />
        
        {/* Các route được bảo vệ với Layout */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          {/* ✅ SỬA: Redirect mặc định theo role */}
          <Route 
            index 
            element={
              <Navigate 
                to={user ? getDefaultRedirectPath(user.role) : '/login'} 
                replace 
              />
            } 
          />
          
          <Route path="dashboard" element={<HRDashboardPage />} />
          
          {/* Route quản lý nhân viên */}
          <Route 
            path="employee-management" 
            element={
              <ProtectedRoute requiredRoles={['hr', 'admin']}>
                <EmployeeManagementPage />
              </ProtectedRoute>
            } 
          />
          
          {/* Route nhật ký chấm công */}
          <Route path="attendance-logs" element={<AttendanceLogsPage />} />
        </Route>

        {/* ✅ SỬA: Route bắt tất cả cũng theo role */}
        <Route 
          path="*" 
          element={
            user ? (
              <Navigate to={getDefaultRedirectPath(user.role)} replace />
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
