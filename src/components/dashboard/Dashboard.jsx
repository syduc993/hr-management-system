// // src/components/dashboard/Dashboard.jsx
// import React, { useState, useEffect } from 'react';
// import { useAuth } from '../../hooks/useAuth';
// import { ApiClient } from '../../services/api';
// import Loading from '../common/Loading';
// import { useNotification } from '../../hooks/useNotification';

// const Dashboard = () => {
//   const [stats, setStats] = useState({});
//   const [loading, setLoading] = useState(true);
//   const { user } = useAuth();
//   const { showNotification } = useNotification();

//   useEffect(() => {
//     loadStats();
    
//     // Auto refresh every 5 minutes
//     const interval = setInterval(loadStats, 5 * 60 * 1000);
//     return () => clearInterval(interval);
//   }, []);

//   const loadStats = async () => {
//     try {
//       console.log('🔍 Dashboard: Loading stats...');
//       const response = await ApiClient.get('/api/employees/stats');
      
//       console.log('📨 Dashboard: Raw response:', response);
//       console.log('✅ Dashboard: Response success:', response.success);
//       console.log('📊 Dashboard: Response data:', response.data);
      
//       // ✅ FIX: Sử dụng response.data thay vì response
//       if (response.success && response.data) {
//         console.log('✅ Dashboard: Setting stats to:', response.data);
//         setStats(response.data);
//       } else {
//         console.warn('⚠️ Dashboard: API returned success: false');
//         showNotification('Không thể tải dữ liệu thống kê', 'warning');
//       }
      
//     } catch (error) {
//       console.error('❌ Dashboard: Error loading stats:', error);
//       showNotification('Lỗi khi tải thống kê dashboard', 'error');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleRefresh = async () => {
//     setLoading(true);
//     await loadStats();
//     showNotification('Đã cập nhật dữ liệu dashboard', 'success');
//   };

//   // ✅ DEBUG: Log current stats state
//   console.log('🎯 Dashboard render - Current stats:', stats);
//   console.log('🎯 Dashboard render - Loading:', loading);

//   if (loading) {
//     return <Loading fullScreen text="Đang tải dashboard..." />;
//   }

//   return (
//     <div className="dashboard-page">
//       {/* ✅ DEBUG INFO - Remove this after fixing */}
//       <div style={{ 
//         background: '#f8f9fa', 
//         border: '1px solid #dee2e6', 
//         borderRadius: '0.25rem', 
//         padding: '1rem', 
//         marginBottom: '1rem' 
//       }}>
//         <h6 className="text-muted mb-2">🐛 DEBUG INFO:</h6>
//         <small className="d-block">Raw stats: {JSON.stringify(stats)}</small>
//         <small className="d-block">Total Employees: {stats.totalEmployees}</small>
//         <small className="d-block">Active Employees: {stats.activeEmployees}</small>
//         <small className="d-block">Inactive Employees: {stats.inactiveEmployees}</small>
//       </div>

//       {/* Header */}
//       <div className="d-flex justify-content-between align-items-center mb-4">
//         <div>
//           <h1>Dashboard</h1>
//           <p className="text-muted mb-0">Chào mừng trở lại, {user?.fullName}!</p>
//         </div>
//         <button 
//           className="btn btn-outline-primary"
//           onClick={handleRefresh}
//           disabled={loading}
//         >
//           <i className={`fas fa-sync-alt me-2 ${loading ? 'fa-spin' : ''}`}></i>
//           Làm mới
//         </button>
//       </div>

//       {/* Stats Cards */}
//       <div className="row mb-4">
//         <div className="col-md-4 mb-3">
//           <div className="card text-center bg-primary text-white h-100">
//             <div className="card-body">
//               <i className="fas fa-users fa-3x mb-3"></i>
//               <h2 className="card-title" id="totalEmployees">
//                 {stats.totalEmployees || 0}
//               </h2>
//               <p className="card-text">Tổng nhân viên</p>
//             </div>
//           </div>
//         </div>

//         <div className="col-md-4 mb-3">
//           <div className="card text-center bg-success text-white h-100">
//             <div className="card-body">
//               <i className="fas fa-user-check fa-3x mb-3"></i>
//               <h2 className="card-title" id="activeEmployees">
//                 {stats.activeEmployees || 0}
//               </h2>
//               <p className="card-text">Nhân viên hoạt động</p>
//             </div>
//           </div>
//         </div>

//         <div className="col-md-4 mb-3">
//           <div className="card text-center bg-info text-white h-100">
//             <div className="card-body">
//               <i className="fas fa-user-times fa-3x mb-3"></i>
//               <h2 className="card-title" id="inactiveEmployees">
//                 {stats.inactiveEmployees || 0}
//               </h2>
//               <p className="card-text">Nhân viên không hoạt động</p>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Quick Actions */}
//       <div className="row">
//         <div className="col-12">
//           <div className="card">
//             <div className="card-header">
//               <h5 className="card-title mb-0">Truy cập nhanh</h5>
//             </div>
//             <div className="card-body">
//               <div className="row">
//                 <div className="col-md-4 mb-3">
//                   <a href="/attendance-logs" className="btn btn-outline-info w-100 h-100 d-flex flex-column justify-content-center">
//                     <i className="fas fa-clock fa-2x mb-2"></i>
//                     <span>Xem chấm công</span>
//                   </a>
//                 </div>

//                 {(user?.role === 'hr' || user?.role === 'admin') && (
//                   <>
//                     <div className="col-md-4 mb-3">
//                       <a href="/employee-management" className="btn btn-outline-primary w-100 h-100 d-flex flex-column justify-content-center">
//                         <i className="fas fa-users-cog fa-2x mb-2"></i>
//                         <span>Quản lý nhân viên</span>
//                       </a>
//                     </div>
                    
//                     <div className="col-md-4 mb-3">
//                       <a href="/hr-dashboard" className="btn btn-outline-success w-100 h-100 d-flex flex-column justify-content-center">
//                         <i className="fas fa-chart-bar fa-2x mb-2"></i>
//                         <span>HR Dashboard</span>
//                       </a>
//                     </div>
//                   </>
//                 )}
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* HR Functions */}
//       {(user?.role === 'hr' || user?.role === 'admin') && (
//         <div className="row mt-4">
//           <div className="col-12">
//             <div className="card">
//               <div className="card-body text-center">
//                 <h5>Chức năng HR</h5>
//                 <p className="text-muted">Truy cập các công cụ dành cho HR</p>
//                 <a 
//                   href="https://forms.google.com/your-form-url" 
//                   target="_blank"
//                   rel="noopener noreferrer"
//                   className="btn btn-outline-success me-2"
//                 >
//                   <i className="fas fa-external-link-alt me-2"></i>
//                   Mở Google Form tuyển dụng
//                 </a>
//                 <a 
//                   href="/hr-dashboard" 
//                   className="btn btn-primary"
//                 >
//                   <i className="fas fa-chart-line me-2"></i>
//                   Xem báo cáo HR
//                 </a>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default Dashboard;
