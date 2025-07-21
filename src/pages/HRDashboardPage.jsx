import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { ApiClient } from '../services/api';
import { useNotification } from '../hooks/useNotification';
import Loading from '../components/common/Loading';

const HRDashboardPage = () => {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeEmployees: 0,
    inactiveEmployees: 0,
    totalAttendanceLogs: 0,
    todayLogs: 0,
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { showNotification } = useNotification();

  useEffect(() => {
    checkPermissions();
    loadStats();
    // eslint-disable-next-line
  }, []);

  const checkPermissions = () => {
    if (!user || (user.role !== 'hr' && user.role !== 'admin')) {
      showNotification('Bạn không có quyền truy cập trang này', 'error');
      window.location.href = '/dashboard';
    }
  };

  // **Lưu ý QUAN TRỌNG: Phải dùng đúng endpoint `/api/dashboard/stats`**
  const loadStats = async () => {
    setLoading(true);
    try {
      console.log('🔍 HRDashboard: Loading stats...');
      // ĐỔI endpoint
      const response = await ApiClient.get('/api/dashboard/stats');
      console.log('📨 HRDashboard: Raw response:', response);

      if (response.success && response.data) {
        // Gộp stats employee và attendance
        const employee = response.data.employee || {};
        const attendance = response.data.attendance || {};

        const statsObj = {
          totalEmployees: employee.totalEmployees || 0,
          activeEmployees: employee.activeEmployees || 0,
          inactiveEmployees:
            (employee.totalEmployees || 0) - (employee.activeEmployees || 0),
          totalAttendanceLogs: attendance.totalAttendanceLogs || 0,
          todayLogs: attendance.todayLogs || 0,
        };

        console.log('✅ HRDashboard: Setting stats to:', statsObj);
        setStats(statsObj);
      } else {
        showNotification(
          response.message || 'Không thể tải dữ liệu thống kê',
          'warning'
        );
      }
    } catch (error) {
      console.error('❌ HRDashboard: Error loading stats:', error);
      showNotification('Lỗi khi tải thống kê HR', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    await loadStats();
    showNotification('Đã cập nhật dữ liệu HR dashboard', 'success');
  };

  // DEBUG info
  console.log('🎯 HRDashboard render - Current stats:', stats); // eslint-disable-line
  console.log('🎯 HRDashboard render - Loading:', loading); // eslint-disable-line

  if (loading) {
    return <Loading fullScreen text="Đang tải HR dashboard..." />;
  }

  return (
    <div className="hr-dashboard-page">
      {/* DEBUG INFO - Có thể xoá sau */}
      <div
        style={{
          background: '#f8f9fa',
          border: '1px solid #dee2e6',
          borderRadius: '0.25rem',
          padding: '1rem',
          marginBottom: '1rem',
        }}
      >
        <h6 className="text-muted mb-2">🐛 DEBUG INFO (HR Dashboard):</h6>
        <small className="d-block">Raw stats: {JSON.stringify(stats)}</small>
        <small className="d-block">Total Employees: {stats.totalEmployees}</small>
        <small className="d-block">Active Employees: {stats.activeEmployees}</small>
        <small className="d-block">Inactive Employees: {stats.inactiveEmployees}</small>
        <small className="d-block">Total Attendance Logs: {stats.totalAttendanceLogs}</small>
        <small className="d-block">Today Logs: {stats.todayLogs}</small>
      </div>

      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1>HR Dashboard</h1>
          <p className="text-muted mb-0">Dashboard dành cho bộ phận nhân sự</p>
        </div>
        <button
          className="btn btn-outline-primary"
          onClick={handleRefresh}
          disabled={loading}
        >
          <i className={`fas fa-sync-alt me-2 ${loading ? 'fa-spin' : ''}`}></i>
          Làm mới
        </button>
      </div>

      {/* Stats Cards */}
      <div className="row mb-4">
        <div className="col-md-3 mb-3">
          <div className="card text-center bg-primary text-white h-100">
            <div className="card-body">
              <i className="fas fa-users fa-3x mb-3"></i>
              <h2>{stats.totalEmployees}</h2>
              <p className="mb-0">Tổng nhân viên</p>
            </div>
          </div>
        </div>

        <div className="col-md-3 mb-3">
          <div className="card text-center bg-success text-white h-100">
            <div className="card-body">
              <i className="fas fa-user-check fa-3x mb-3"></i>
              <h2>{stats.activeEmployees}</h2>
              <p className="mb-0">Nhân viên hoạt động</p>
            </div>
          </div>
        </div>

        <div className="col-md-3 mb-3">
          <div className="card text-center bg-warning text-white h-100">
            <div className="card-body">
              <i className="fas fa-user-times fa-3x mb-3"></i>
              <h2>{stats.inactiveEmployees}</h2>
              <p className="mb-0">Không hoạt động</p>
            </div>
          </div>
        </div>

        <div className="col-md-3 mb-3">
          <div className="card text-center bg-info text-white h-100">
            <div className="card-body">
              <i className="fas fa-clock fa-3x mb-3"></i>
              <h2>{stats.totalAttendanceLogs}</h2>
              <p className="mb-0">Tổng chấm công</p>
            </div>
          </div>
        </div>
      </div>

      {/* Management Actions */}
      <div className="row mb-4">
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Quản lý nhân sự</h5>
            </div>
            <div className="card-body">
              <div className="d-grid gap-2">
                <a href="/employee-management" className="btn btn-primary">
                  <i className="fas fa-users-cog me-2"></i>
                  Quản lý nhân viên
                </a>
                <a href="/attendance-logs" className="btn btn-info">
                  <i className="fas fa-clock me-2"></i>
                  Xem chấm công
                </a>
                <button className="btn btn-success" onClick={handleRefresh}>
                  <i className="fas fa-sync-alt me-2"></i>
                  Cập nhật dữ liệu
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Công cụ HR</h5>
            </div>
            <div className="card-body">
              <div className="d-grid gap-2">
                <button className="btn btn-outline-primary" disabled>
                  <i className="fas fa-user-plus me-2"></i>
                  Tuyển dụng (Sắp có)
                </button>
                <button className="btn btn-outline-secondary" disabled>
                  <i className="fas fa-file-export me-2"></i>
                  Xuất báo cáo (Sắp có)
                </button>
                <a href="/dashboard" className="btn btn-outline-info">
                  <i className="fas fa-tachometer-alt me-2"></i>
                  Dashboard chính
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* HR Reports Section */}
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Báo cáo HR</h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-4 text-center">
                  <div className="p-3">
                    <i className="fas fa-chart-bar fa-2x text-primary mb-2"></i>
                    <h6>Báo cáo nhân sự</h6>
                    <button className="btn btn-sm btn-primary" disabled>
                      Xem báo cáo (Sắp có)
                    </button>
                  </div>
                </div>
                <div className="col-md-4 text-center">
                  <div className="p-3">
                    <i className="fas fa-chart-line fa-2x text-success mb-2"></i>
                    <h6>Báo cáo chấm công</h6>
                    <button className="btn btn-sm btn-success" disabled>
                      Xem báo cáo (Sắp có)
                    </button>
                  </div>
                </div>
                <div className="col-md-4 text-center">
                  <div className="p-3">
                    <i className="fas fa-chart-pie fa-2x text-info mb-2"></i>
                    <h6>Báo cáo tổng hợp</h6>
                    <button className="btn btn-sm btn-info" disabled>
                      Xem báo cáo (Sắp có)
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HRDashboardPage;
