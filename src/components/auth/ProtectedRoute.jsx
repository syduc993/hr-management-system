import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Loading from '../common/Loading';

const ProtectedRoute = ({ children, requiredRoles = [] }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <Loading fullScreen text="Đang kiểm tra quyền truy cập..." />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role-based access
  if (requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger">
          <h4>Không có quyền truy cập</h4>
          <p>Bạn không có quyền truy cập vào trang này.</p>
          <button 
            className="btn btn-primary" 
            onClick={() => window.history.back()}
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
