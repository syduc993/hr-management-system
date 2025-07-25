// src/pages/AttendanceLogsPage.jsx

import React, { useState, useEffect } from 'react';
import { ApiClient } from '../services/api';
import { useNotification } from '../hooks/useNotification';
import Loading from '../components/common/Loading';

const LARK_LOGS_URL = "https://atino-vietnam.sg.larksuite.com/base/Ey3EbVD9vacAHvs8cVvlHxkKg2r?table=tblU9YY1t4TwxXLh&view=vewpWpbNQv";
const LARK_HOURS_URL = "https://atino-vietnam.sg.larksuite.com/base/Ey3EbVD9vacAHvs8cVvlHxkKg2r?table=tblV2dGhT2O7w30b&view=vewDULr7HU";

const AttendanceLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [stores, setStores] = useState([]);
  const [recruitmentRequests, setRecruitmentRequests] = useState([]);
  const [recruitmentHours, setRecruitmentHours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('logs');
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
        loadStores(),
        loadRecruitmentRequests(),
        loadRecruitmentHours()
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
      const response = await ApiClient.get('/api/employees');
      setEmployees(Array.isArray(response?.data) ? response.data : response || []);
    } catch (error) {
      setEmployees([]);
      showNotification('Lỗi khi tải danh sách nhân viên', 'error');
    }
  };

  const loadAttendanceLogs = async () => {
    try {
      const response = await ApiClient.get('/api/attendance/logs');
      setLogs(Array.isArray(response?.data) ? response.data : response || []);
    } catch (error) {
      setLogs([]);
      showNotification('Lỗi khi tải bản ghi chấm công', 'error');
    }
  };

  const loadStores = async () => {
    try {
      const response = await ApiClient.get('/api/master-data/stores');
      setStores(Array.isArray(response?.data) ? response.data : response || []);
    } catch (error) {
      setStores([]);
    }
  };

  const loadRecruitmentRequests = async () => {
    try {
      const response = await ApiClient.get('/api/recruitment');
      setRecruitmentRequests(Array.isArray(response?.data) ? response.data : response || []);
    } catch (error) {
      setRecruitmentRequests([]);
    }
  };

  const loadRecruitmentHours = async () => {
    try {
      const response = await ApiClient.get('/api/recruitment/hours-summary');
      setRecruitmentHours(Array.isArray(response?.data?.summary) ? response.data.summary : []);
    } catch (error) {
      setRecruitmentHours([]);
      console.error('Error loading recruitment hours:', error);
    }
  };

  const handleRefresh = async () => {
    await loadInitialData();
    showNotification('Đã cập nhật dữ liệu', 'success');
  };

  // ✅ SỬA: Bỏ `totalDays` vì không còn dữ liệu này từ backend
  const showEmployeeDetails = (request) => {
    if (!request.employees || request.employees.length === 0) {
      showNotification('Không có dữ liệu nhân viên cho đề xuất này', 'warning');
      return;
    }

    const employeeList = request.employees.map(emp =>
      `• ${emp.fullName} (${emp.employeeId}): ${emp.totalHours}`
    ).join('\n');

    alert(`Chi tiết nhân viên - ${request.requestNo}:\n\n${employeeList}`);
  };

  const totalEmployees = Array.isArray(employees) ? employees.length : 0;
  const totalStores = Array.isArray(stores) ? stores.length : 0;
  const activeRecruitmentRequests = Array.isArray(recruitmentRequests)
    ? recruitmentRequests.filter(req => req.status === 'Đang tuyển dụng').length
    : 0;

  if (loading) {
    return <Loading fullScreen text="Đang tải dữ liệu..." />;
  }

  return (
    <div className="attendance-logs-page">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1>Quản lý Chấm công & Tuyển dụng</h1>
          <p className="text-muted mb-0">Xem và quản lý các hoạt động nhân sự</p>
        </div>
        <button
          className="btn btn-outline-primary"
          onClick={handleRefresh}
        >
          <i className="fas fa-sync-alt me-2"></i>
          Làm mới
        </button>
      </div>

      {/* Statistics */}
      <div className="row mb-4">
        {/* ... (Các thẻ thống kê giữ nguyên) ... */}
        <div className="col-md-3">
          <div className="card text-center bg-primary text-white">
            <div className="card-body">
              <h3 id="logCount">{Array.isArray(logs) ? logs.length : 0}</h3>
              <p className="mb-0">Tổng bản ghi chấm công</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-center bg-success text-white">
            <div className="card-body">
              <h3>{totalEmployees}</h3>
              <p className="mb-0">Tổng nhân viên</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-center bg-info text-white">
            <div className="card-body">
              <h3>{totalStores}</h3>
              <p className="mb-0">Cửa hàng</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-center bg-warning text-white">
            <div className="card-body">
              <h3>{activeRecruitmentRequests}</h3>
              <p className="mb-0">Đang tuyển dụng</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <ul className="nav nav-tabs mb-4">
        {/* ... (Các thẻ nav-item giữ nguyên) ... */}
        <li className="nav-item">
          <a
            className={`nav-link${activeTab === 'logs' ? ' active' : ''}`}
            onClick={() => setActiveTab('logs')}
            role="button"
          >
            <i className="fas fa-list me-2"></i>
            Bản ghi chấm công
          </a>
        </li>
        <li className="nav-item">
          <a
            className={`nav-link${activeTab === 'hours' ? ' active' : ''}`}
            onClick={() => setActiveTab('hours')}
            role="button"
          >
            <i className="fas fa-clock me-2"></i>
            Tổng giờ công
          </a>
        </li>
        <li className="nav-item">
          <a
            className={`nav-link${activeTab === 'recruitment' ? ' active' : ''}`}
            onClick={() => setActiveTab('recruitment')}
            role="button"
          >
            <i className="fas fa-users me-2"></i>
            Tổng hợp giờ công theo tuyển dụng
          </a>
        </li>
      </ul>

      {/* Tab Content */}
      <div className="tab-content">
        {/* Tab Logs (iframe) */}
        <div
          className="iframe-tab-container"
          style={{
            display: activeTab === 'logs' ? 'block' : 'none',
            width: '100%',
            height: 'calc(100vh - 450px)',
            minHeight: '500px'
          }}
        >
          {/* ... (Nội dung iframe logs giữ nguyên) ... */}
            <div className="card h-100">
                <div className="card-header">
                    <h5 className="mb-0">Chi tiết bản ghi chấm công (Dữ liệu trực tiếp từ Lark)</h5>
                </div>
                <div className="card-body p-0 h-100">
                    <iframe
                        src={LARK_LOGS_URL}
                        title="Bảng Chấm Công từ Lark Base"
                        style={{ width: '100%', height: '100%', border: 'none' }}
                        loading="lazy"
                        allow="fullscreen"
                    >
                        Trình duyệt của bạn không hỗ trợ iframe.
                    </iframe>
                </div>
            </div>
        </div>

        {/* Tab Hours (iframe) */}
        <div
          className="iframe-tab-container"
          style={{
            display: activeTab === 'hours' ? 'block' : 'none',
            width: '100%',
            height: 'calc(100vh - 450px)',
            minHeight: '500px'
          }}
        >
          {/* ... (Nội dung iframe hours giữ nguyên) ... */}
            <div className="card h-100">
                <div className="card-header">
                    <h5 className="mb-0">Tổng giờ công (Dữ liệu trực tiếp từ Lark)</h5>
                </div>
                <div className="card-body p-0 h-100">
                    <iframe
                        src={LARK_HOURS_URL}
                        title="Tổng Giờ Công từ Lark Base"
                        style={{ width: '100%', height: '100%', border: 'none' }}
                        loading="lazy"
                        allow="fullscreen"
                    >
                        Trình duyệt của bạn không hỗ trợ iframe.
                    </iframe>
                </div>
            </div>
        </div>

        {/* ✅ Tab Recruitment: Đã sửa bảng */}
        {activeTab === 'recruitment' && (
          <div className="tab-pane fade show active" id="recruitment-tab">
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">Tổng hợp giờ công theo kế hoạch tuyển dụng</h5>
                <small className="text-muted">Giờ công của nhân viên theo từng đề xuất tuyển dụng</small>
              </div>
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table table-striped table-hover">
                    <thead>
                      <tr>
                        <th>Request No.</th>
                        <th>Phòng ban</th>
                        {/* ❌ BỎ CỘT VỊ TRÍ */}
                        <th>Thời gian</th>
                        <th>Nhân viên</th>
                        <th>Tổng giờ công</th>
                        <th>Trạng thái</th>
                        <th>Chi tiết</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.isArray(recruitmentHours) && recruitmentHours.length > 0 ? (
                        recruitmentHours.map((request, index) => (
                          <tr key={request.requestNo || index}>
                            <td>
                              <strong className="text-primary">{request.requestNo || 'N/A'}</strong>
                            </td>
                            <td>{request.department || 'N/A'}</td>
                            {/* ❌ BỎ CỘT VỊ TRÍ */}
                            <td>
                              <small>
                                {request.fromDate && request.toDate ?
                                  `${request.fromDate} - ${request.toDate}` :
                                  'N/A'
                                }
                              </small>
                            </td>
                            <td>
                              <span className="badge bg-info">
                                {request.totalEmployees} người
                              </span>
                            </td>
                            <td>
                              <strong className="text-success">{request.totalHours || '0 giờ'}</strong>
                            </td>
                            <td>
                              <span className={`badge ${
                                request.status === 'Đang tuyển dụng' ? 'bg-success' :
                                  request.status === 'Đã hoàn thành' ? 'bg-primary' : 'bg-secondary'
                                }`}>
                                {request.status || 'N/A'}
                              </span>
                            </td>
                            <td>
                              <button
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => showEmployeeDetails(request)}
                                title="Xem chi tiết nhân viên"
                              >
                                <i className="fas fa-eye"></i>
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          {/* ✅ Sửa colSpan từ 8 thành 7 */}
                          <td colSpan="7" className="text-center text-muted py-4">
                            <i className="fas fa-inbox fa-2x mb-2"></i>
                            <br />
                            Chưa có dữ liệu tổng hợp giờ công theo tuyển dụng
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Thống kê tổng quan (giữ nguyên) */}
                {recruitmentHours.length > 0 && (
                  <div className="row mt-4">
                    {/* ... (Các thẻ thống kê giữ nguyên) ... */}
                    <div className="col-md-4">
                      <div className="card text-center bg-light">
                        <div className="card-body">
                          <h4 className="text-primary">{recruitmentHours.length}</h4>
                          <p className="mb-0">Tổng số đề xuất</p>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="card text-center bg-light">
                        <div className="card-body">
                          <h4 className="text-success">
                            {recruitmentHours.reduce((sum, req) => sum + req.totalEmployees, 0)}
                          </h4>
                          <p className="mb-0">Tổng nhân viên</p>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="card text-center bg-light">
                        <div className="card-body">
                          <h4 className="text-warning">
                            {recruitmentHours.reduce((sum, req) => sum + (req.totalHoursNumeric || 0), 0).toFixed(1)} giờ
                          </h4>
                          <p className="mb-0">Tổng giờ công</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceLogsPage;
