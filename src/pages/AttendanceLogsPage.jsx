import React, { useState, useEffect } from 'react';
import { ApiClient } from '../services/api';
import { useNotification } from '../hooks/useNotification';
import Loading from '../components/common/Loading';
import AttendanceFilters from '../components/attendance/AttendanceFilters';
import AttendanceLogs from '../components/attendance/AttendanceLogs';
import EmployeeHours from '../components/attendance/EmployeeHours';

const AttendanceLogsPage = () => {
  const [employees, setEmployees] = useState([]);
  const [logs, setLogs] = useState([]);
  const [employeeHours, setEmployeeHours] = useState({});
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({});
  const { showNotification } = useNotification();

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadEmployees(),
        loadAttendanceLogs(),
        loadEmployeeHours()
      ]);
    } catch (error) {
      console.error('Error loading initial data:', error);
      showNotification('Lỗi khi tải dữ liệu chấm công', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadEmployees = async () => {
    try {
      const data = await ApiClient.get('/api/employees');
      setEmployees(data);
    } catch (error) {
      console.error('Error loading employees:', error);
      showNotification('Lỗi khi tải danh sách nhân viên', 'error');
    }
  };

  const loadAttendanceLogs = async (filterParams = {}) => {
    try {
      const data = await ApiClient.get('/api/attendance/logs', filterParams);
      setLogs(data);
    } catch (error) {
      console.error('Error loading attendance logs:', error);
      showNotification('Lỗi khi tải bản ghi chấm công', 'error');
    }
  };

  const loadEmployeeHours = async () => {
    try {
      const data = await ApiClient.get('/api/attendance/employee-hours');
      setEmployeeHours(data);
    } catch (error) {
      console.error('Error loading employee hours:', error);
      showNotification('Lỗi khi tải tổng giờ công', 'error');
    }
  };

  const handleFilterChange = async (newFilters) => {
    setFilters(newFilters);
    await loadAttendanceLogs(newFilters);
  };

  const handleClearFilters = async () => {
    setFilters({});
    await loadAttendanceLogs();
  };

  const handleRefresh = async () => {
    await loadInitialData();
    showNotification('Đã cập nhật dữ liệu chấm công', 'success');
  };

  if (loading) {
    return <Loading fullScreen text="Đang tải dữ liệu chấm công..." />;
  }

  return (
    <div className="attendance-logs-page">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1>Bản ghi chấm công</h1>
          <p className="text-muted mb-0">Xem và quản lý bản ghi chấm công của nhân viên</p>
        </div>
        <button 
          className="btn btn-outline-primary"
          onClick={handleRefresh}
        >
          <i className="fas fa-sync-alt me-2"></i>
          Làm mới
        </button>
      </div>

      {/* Filters */}
      <div className="card mb-4">
        <div className="card-header">
          <h5 className="mb-0">Bộ lọc</h5>
        </div>
        <div className="card-body">
          <AttendanceFilters
            employees={employees}
            filters={filters}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
          />
        </div>
      </div>

      {/* Statistics */}
      <div className="row mb-4">
        <div className="col-md-4">
          <div className="card text-center bg-primary text-white">
            <div className="card-body">
              <h3 id="logCount">{logs.length}</h3>
              <p className="mb-0">Tổng bản ghi</p>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card text-center bg-success text-white">
            <div className="card-body">
              <h3>{employees.filter(emp => emp.status === 'active').length}</h3>
              <p className="mb-0">Nhân viên hoạt động</p>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card text-center bg-info text-white">
            <div className="card-body">
              <h3>{Object.keys(employeeHours).length}</h3>
              <p className="mb-0">Nhân viên có giờ công</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content Tabs */}
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <a className="nav-link active" data-bs-toggle="tab" href="#logs-tab">
            <i className="fas fa-list me-2"></i>
            Bản ghi chấm công
          </a>
        </li>
        <li className="nav-item">
          <a className="nav-link" data-bs-toggle="tab" href="#hours-tab">
            <i className="fas fa-clock me-2"></i>
            Tổng giờ công
          </a>
        </li>
      </ul>

      <div className="tab-content">
        {/* Attendance Logs Tab */}
        <div className="tab-pane fade show active" id="logs-tab">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Chi tiết bản ghi chấm công</h5>
            </div>
            <div className="card-body">
              <AttendanceLogs logs={logs} />
            </div>
          </div>
        </div>

        {/* Employee Hours Tab */}
        <div className="tab-pane fade" id="hours-tab">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Tổng giờ công theo nhân viên</h5>
            </div>
            <div className="card-body">
              <EmployeeHours 
                employees={employees}
                employeeHours={employeeHours}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceLogsPage;
