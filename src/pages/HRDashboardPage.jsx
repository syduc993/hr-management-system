import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { ApiClient } from '../services/api';
import { useNotification } from '../hooks/useNotification';
import Loading from '../components/common/Loading';

const HRDashboardPage = () => {
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { showNotification } = useNotification();

  useEffect(() => {
    checkPermissions();
    loadStats();
  }, []);

  const checkPermissions = () => {
    if (!user || (user.role !== 'hr' && user.role !== 'admin')) {
      showNotification('Bạn không có quyền truy cập trang này', 'error');
      window.location.href = '/dashboard';
      return;
    }
  };

  const loadStats = async () => {
    try {
      console.log('🔍 HRDashboard: Loading stats...');
      const response = await ApiClient.get('/api/employees/stats');
      
      console.log('📨 HRDashboard: Raw response:', response);
      console.log('✅ HRDashboard: Response success:', response.success);
      console.log('📊 HRDashboard: Response data:', response.data);
      
      // ✅ FIX: Sử dụng response.data thay vì response
      if (response.success && response.data) {
        console.log('✅ HRDashboard: Setting stats to:', response.data);
        setStats(response.data);
      } else {
        console.warn('⚠️ HRDashboard: API returned success: false');
        showNotification('Không thể tải dữ liệu thống kê', 'warning');
      }
      
    } catch (error) {
      console.error('❌ HRDashboard: Error loading stats:', error);
      showNotification('Lỗi khi tải thống kê HR', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    await loadStats();
    showNotification('Đã cập nhật dữ liệu HR dashboard', 'success');
  };

  // ✅ DEBUG: Log current stats state
  console.log('🎯 HRDashboard render - Current stats:', stats);
  console.log('🎯 HRDashboard render - Loading:', loading);

  if (loading) {
    return <Loading fullScreen text="Đang tải HR dashboard..." />;
  }

  return (
    <div className="hr-dashboard-page">
      {/* ✅ DEBUG INFO - Remove this after fixing */}
      <div style={{ 
        background: '#f8f9fa', 
        border: '1px solid #dee2e6', 
        borderRadius: '0.25rem', 
        padding: '1rem', 
        marginBottom: '1rem' 
      }}>
        <h6 className="text-muted mb-2">🐛 DEBUG INFO (HR Dashboard):</h6>
        <small className="d-block">Raw stats: {JSON.stringify(stats)}</small>
        <small className="d-block">Total Employees: {stats.totalEmployees}</small>
        <small className="d-block">Active Employees: {stats.activeEmployees}</small>
        <small className="d-block">Inactive Employees: {stats.inactiveEmployees}</small>
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
              <h2>{stats.totalEmployees || 0}</h2>
              <p className="mb-0">Tổng nhân viên</p>
            </div>
          </div>
        </div>

        <div className="col-md-3 mb-3">
          <div className="card text-center bg-success text-white h-100">
            <div className="card-body">
              <i className="fas fa-user-check fa-3x mb-3"></i>
              <h2>{stats.activeEmployees || 0}</h2>
              <p className="mb-0">Nhân viên hoạt động</p>
            </div>
          </div>
        </div>

        <div className="col-md-3 mb-3">
          <div className="card text-center bg-warning text-white h-100">
            <div className="card-body">
              <i className="fas fa-user-times fa-3x mb-3"></i>
              <h2>{stats.inactiveEmployees || 0}</h2>
              <p className="mb-0">Nhân viên không hoạt động</p>
            </div>
          </div>
        </div>

        <div className="col-md-3 mb-3">
          <div className="card text-center bg-info text-white h-100">
            <div className="card-body">
              <i className="fas fa-clock fa-3x mb-3"></i>
              <h2>0</h2>
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
