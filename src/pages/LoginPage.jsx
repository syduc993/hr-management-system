// import React, { useState, useEffect } from 'react';
// import { Navigate } from 'react-router-dom';
// import { useAuth } from '../hooks/useAuth';
// import { useNotification } from '../hooks/useNotification';
// import Loading from '../components/common/Loading';

// const LoginPage = () => {
//   const [credentials, setCredentials] = useState({
//     username: '',
//     password: ''
//   });
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [errors, setErrors] = useState({});
  
//   const { user, login, loading } = useAuth();
//   const { showNotification } = useNotification();

//   useEffect(() => {
//     // Clear any existing alerts
//     const alertContainer = document.getElementById('alert-container');
//     if (alertContainer) {
//       alertContainer.innerHTML = '';
//     }
//   }, []);

//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
//     setCredentials(prev => ({
//       ...prev,
//       [name]: value
//     }));
    
//     // Clear error when user starts typing
//     if (errors[name]) {
//       setErrors(prev => ({
//         ...prev,
//         [name]: ''
//       }));
//     }
//   };

//   const validateForm = () => {
//     const newErrors = {};
    
//     if (!credentials.username.trim()) {
//       newErrors.username = 'Vui lòng nhập tên đăng nhập';
//     }
    
//     if (!credentials.password.trim()) {
//       newErrors.password = 'Vui lòng nhập mật khẩu';
//     }
    
//     setErrors(newErrors);
//     return Object.keys(newErrors).length === 0;
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
    
//     if (!validateForm()) {
//       showNotification('Vui lòng điền đầy đủ thông tin!', 'error');
//       return;
//     }

//     setIsSubmitting(true);
    
//     try {
//       const response = await login(credentials);
      
//       showNotification('Đăng nhập thành công!', 'success');
      
//       // Redirect based on role after short delay
//       setTimeout(() => {
//         if (response.user.role === 'hr' || response.user.role === 'admin') {
//           window.location.href = '/hr-dashboard';
//         } else {
//           window.location.href = '/dashboard';
//         }
//       }, 1000);
      
//     } catch (error) {
//       console.error('Login error:', error);
//       showNotification('Tên đăng nhập hoặc mật khẩu không đúng!', 'error');
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   // Redirect if already logged in
//   if (user) {
//     const redirectPath = user.role === 'hr' || user.role === 'admin' ? '/hr-dashboard' : '/dashboard';
//     return <Navigate to={redirectPath} replace />;
//   }

//   // Show loading during auth check
//   if (loading) {
//     return (
//       <div className="d-flex justify-content-center align-items-center min-vh-100">
//         <Loading />
//       </div>
//     );
//   }

//   return (
//     <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
//       <div className="container">
//         <div className="row justify-content-center">
//           <div className="col-md-6 col-lg-4">
//             <div className="card shadow">
//               <div className="card-body p-4">
//                 <div className="text-center mb-4">
//                   <h2 className="card-title">Đăng nhập</h2>
//                   <p className="text-muted">Hệ thống quản lý nhân sự</p>
//                 </div>

//                 <form onSubmit={handleSubmit} noValidate>
//                   <div className="mb-3">
//                     <label htmlFor="username" className="form-label">
//                       Tên đăng nhập <span className="text-danger">*</span>
//                     </label>
//                     <input
//                       type="text"
//                       className={`form-control ${errors.username ? 'is-invalid' : ''}`}
//                       id="username"
//                       name="username"
//                       value={credentials.username}
//                       onChange={handleInputChange}
//                       placeholder="Nhập tên đăng nhập"
//                       disabled={isSubmitting}
//                       required
//                     />
//                     {errors.username && (
//                       <div className="invalid-feedback">
//                         {errors.username}
//                       </div>
//                     )}
//                   </div>

//                   <div className="mb-4">
//                     <label htmlFor="password" className="form-label">
//                       Mật khẩu <span className="text-danger">*</span>
//                     </label>
//                     <input
//                       type="password"
//                       className={`form-control ${errors.password ? 'is-invalid' : ''}`}
//                       id="password"
//                       name="password"
//                       value={credentials.password}
//                       onChange={handleInputChange}
//                       placeholder="Nhập mật khẩu"
//                       disabled={isSubmitting}
//                       required
//                     />
//                     {errors.password && (
//                       <div className="invalid-feedback">
//                         {errors.password}
//                       </div>
//                     )}
//                   </div>

//                   <button
//                     type="submit"
//                     className="btn btn-primary w-100"
//                     disabled={isSubmitting}
//                   >
//                     {isSubmitting ? (
//                       <>
//                         <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
//                         Đang đăng nhập...
//                       </>
//                     ) : (
//                       'Đăng nhập'
//                     )}
//                   </button>
//                 </form>

//                 {/* Demo credentials info */}
//                 <div className="mt-4 p-3 bg-light rounded">
//                   <small className="text-muted">
//                     <strong>Tài khoản demo:</strong><br />
//                     Admin: admin / admin123<br />
//                     HR: hr / hr123<br />
//                     Sales: sales / sales123
//                   </small>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default LoginPage;


import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
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
  
  const { user, login, loading } = useAuth();
  const { showNotification } = useNotification();

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
      
      showNotification('Đăng nhập thành công!', 'success');
      
      // Login bình thường - redirect to employee-management với full quyền
      setTimeout(() => {
        window.location.href = '/employee-management';
      }, 1000);
      
    } catch (error) {
      console.error('Login error:', error);
      showNotification('Tên đăng nhập hoặc mật khẩu không đúng!', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle quick access (truy cập nhanh)
  const handleQuickAccess = async () => {
    setIsSubmitting(true);
    
    try {
      // Auto login với sales role
      const salesCredentials = {
        username: 'sales',
        password: 'sales123'
      };
      
      const response = await login(salesCredentials);
      
      showNotification('Truy cập thành công!', 'success');
      
      // Redirect to attendance-logs với quyền hạn chế
      setTimeout(() => {
        navigate('/attendance-logs', { replace: true });
      }, 1000);
      
    } catch (error) {
      console.error('Quick access error:', error);
      showNotification('Không thể truy cập hệ thống. Vui lòng thử lại!', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Redirect if already logged in
  if (user) {
    // Phân quyền redirect: sales -> attendance-logs, còn lại -> employee-management
    const redirectPath = user.role === 'sales' ? '/attendance-logs' : '/employee-management';
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
                        {isSubmitting ? (
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
                        Truy cập nhanh
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
