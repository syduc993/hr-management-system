import React, { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useNotification } from '../hooks/useNotification';
import Loading from '../components/common/Loading';

const LoginPage = () => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  
  // ✅ THÊM: State để đánh dấu khi đang thực hiện quick access
  const [isQuickAccess, setIsQuickAccess] = useState(false);
  
  const { user, login, loading } = useAuth();
  const { showNotification } = useNotification();
  const navigate = useNavigate();

  useEffect(() => {
    // Clear any existing alerts
    const alertContainer = document.getElementById('alert-container');
    if (alertContainer) {
      alertContainer.innerHTML = '';
    }
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!credentials.username.trim()) {
      newErrors.username = 'Vui lòng nhập tên đăng nhập';
    }
    
    if (!credentials.password.trim()) {
      newErrors.password = 'Vui lòng nhập mật khẩu';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showNotification('Vui lòng điền đầy đủ thông tin!', 'error');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await login(credentials);
      
      console.log('✅ Regular login response:', response);
      console.log('👤 User role:', response?.data?.user?.role);
      
      showNotification('Đăng nhập thành công!', 'success');
      
      // Login bình thường - redirect to employee-management với full quyền
      setTimeout(() => {
        console.log('🎯 Regular login redirecting to /employee-management');
        navigate('/employee-management', { replace: true });
      }, 1000);
      
    } catch (error) {
      console.error('Login error:', error);
      showNotification('Tên đăng nhập hoặc mật khẩu không đúng!', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ✅ SỬA: Handle quick access với giải pháp 1
  const handleQuickAccess = async () => {
    setIsQuickAccess(true); // ✅ Set flag trước khi login
    setIsSubmitting(true);
    console.log('🚀 Starting quick access with bypass flag...');
    
    try {
      const salesCredentials = {
        username: 'sales',
        password: 'sales123'
      };
      
      console.log('📝 Calling login with sales credentials');
      const response = await login(salesCredentials);
      
      // ✅ Đơn giản hóa logic xử lý response
      if (response && (response.success || response.data?.user || response.user)) {
        const userData = response.data?.user || response.user;
        console.log('👤 User found:', userData);
        console.log('🏷️ User role:', userData?.role);
        
        showNotification('Truy cập thành công!', 'success');
        
        // ✅ Navigate ngay lập tức, không cần setTimeout
        console.log('🎯 Quick access redirecting to /attendance-logs');
        navigate('/attendance-logs', { replace: true });
        
      } else {
        console.error('❌ Login failed - no user data found');
        showNotification('Đăng nhập thất bại!', 'error');
      }
      
    } catch (error) {
      console.error('❌ Quick access error:', error);
      console.error('❌ Error details:', error.message);
      showNotification('Không thể truy cập hệ thống. Vui lòng thử lại!', 'error');
    } finally {
      setIsSubmitting(false);
      setIsQuickAccess(false); // ✅ Reset flag
    }
  };

  // ✅ SỬA: Logic redirect tự động với bypass cho quick access
  if (user && !isQuickAccess) {
    // Phân quyền redirect: sales -> attendance-logs, còn lại -> employee-management
    const redirectPath = user.role === 'sales' ? '/attendance-logs' : '/employee-management';
    console.log('🔄 User already logged in, redirecting to:', redirectPath);
    return <Navigate to={redirectPath} replace />;
  }

  // Show loading during auth check
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <Loading />
      </div>
    );
  }

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-4">
            <div className="card shadow">
              <div className="card-body p-4">
                <div className="text-center mb-4">
                  <h2 className="card-title">Đăng nhập</h2>
                  <p className="text-muted">Hệ thống quản lý nhân sự</p>
                </div>

                <form onSubmit={handleSubmit} noValidate>
                  <div className="mb-3">
                    <label htmlFor="username" className="form-label">
                      Tên đăng nhập <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className={`form-control ${errors.username ? 'is-invalid' : ''}`}
                      id="username"
                      name="username"
                      value={credentials.username}
                      onChange={handleInputChange}
                      placeholder="Nhập tên đăng nhập"
                      disabled={isSubmitting}
                      required
                    />
                    {errors.username && (
                      <div className="invalid-feedback">
                        {errors.username}
                      </div>
                    )}
                  </div>

                  <div className="mb-4">
                    <label htmlFor="password" className="form-label">
                      Mật khẩu <span className="text-danger">*</span>
                    </label>
                    <input
                      type="password"
                      className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                      id="password"
                      name="password"
                      value={credentials.password}
                      onChange={handleInputChange}
                      placeholder="Nhập mật khẩu"
                      disabled={isSubmitting}
                      required
                    />
                    {errors.password && (
                      <div className="invalid-feedback">
                        {errors.password}
                      </div>
                    )}
                  </div>

                  {/* Hai nút: Đăng nhập và Truy cập nhanh */}
                  <div className="row mb-3">
                    <div className="col-6">
                      <button
                        type="submit"
                        className="btn btn-primary w-100"
                        disabled={isSubmitting}
                      >
                        {isSubmitting && !isQuickAccess ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Đang xử lý...
                          </>
                        ) : (
                          'Đăng nhập'
                        )}
                      </button>
                    </div>
                    <div className="col-6">
                      <button
                        type="button"
                        className="btn btn-outline-secondary w-100"
                        onClick={handleQuickAccess}
                        disabled={isSubmitting}
                      >
                        {isSubmitting && isQuickAccess ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Truy cập...
                          </>
                        ) : (
                          'Truy cập nhanh'
                        )}
                      </button>
                    </div>
                  </div>
                </form>

                {/* Ghi chú thông tin */}
                <div className="mt-3 p-3 bg-info bg-opacity-10 rounded">
                  <small className="text-info">
                    <i className="bi bi-info-circle me-1"></i>
                    <strong>Ghi chú:</strong><br />
                    • <strong>Đăng nhập:</strong> Truy cập đầy đủ tính năng quản lý nhân viên<br />
                    • <strong>Truy cập nhanh:</strong> Xem báo cáo chấm công nhanh chóng
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
