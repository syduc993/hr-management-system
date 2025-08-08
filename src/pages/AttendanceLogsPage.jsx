import { formatDateTimeForCSV, formatTimeForCSV } from '../utils/dateUtils';
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
  const [loadingRecruitment, setLoadingRecruitment] = useState(false);
  const { showNotification } = useNotification();

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (activeTab === 'recruitment') {
      console.log('📊 Tab recruitment được chọn, đang refresh data...');
      loadRecruitmentHours(true);
    }
  }, [activeTab]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadEmployees(),
        loadAttendanceLogs(),
        loadStores(),
        loadRecruitmentRequests(),
        loadRecruitmentHours(true)
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

  const loadRecruitmentHours = async (forceRefresh = true) => {
    try {
      setLoadingRecruitment(true);
      
      console.log('🔄 Loading recruitment hours with force refresh:', forceRefresh);
      
      const params = { refresh: 'true' };
      const response = await ApiClient.get('/api/recruitment/hours-summary', params);
      
      setRecruitmentHours(Array.isArray(response?.data?.summary) ? response.data.summary : []);
      
      console.log('✅ Recruitment hours loaded successfully:', response?.data?.summary?.length || 0, 'records');
      
    } catch (error) {
      setRecruitmentHours([]);
      console.error('Error loading recruitment hours:', error);
      showNotification('Lỗi khi tải tổng hợp giờ công theo tuyển dụng', 'error');
    } finally {
      setLoadingRecruitment(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadEmployees(),
        loadAttendanceLogs(),
        loadStores(),
        loadRecruitmentRequests(),
        loadRecruitmentHours(true)
      ]);
      showNotification('Đã cập nhật dữ liệu', 'success');
    } catch (error) {
      console.error('Error loading initial data:', error);
      showNotification('Lỗi khi tải dữ liệu chấm công', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tabName) => {
    console.log('🔄 Switching to tab:', tabName);
    setActiveTab(tabName);
    
    if (tabName === 'recruitment') {
      showNotification('Đang cập nhật dữ liệu realtime...', 'info');
    }
  };

  // Thay thế hoàn toàn hàm exportToExcel cũ bằng hàm này

  const exportToExcel = async (request) => {
      try {
          setLoadingRecruitment(true);
          showNotification('Đang chuẩn bị báo cáo...', 'info');

          // ==================================================================
          // PHẦN 1: LẤY DỮ LIỆU CHI TIẾT (GIỮ NGUYÊN)
          // ==================================================================
          const detailResponse = await ApiClient.get(`/api/recruitment/detailed-hours/${request.requestNo}`);
          const detailedRecords = Array.isArray(detailResponse?.data?.records) ? detailResponse.data.records : [];
          
          if (!detailResponse?.success) {
              showNotification('Không thể tải dữ liệu chi tiết.', 'warning');
              setLoadingRecruitment(false);
              return;
          }

          const totalSalary = detailedRecords.reduce((sum, record) => sum + (record?.totalSalary || 0), 0);
          const sheet1Data = [
              ['BẢNG CHI TIẾT CHẤM CÔNG'],
              [],
              ['Request No:', request?.requestNo || 'N/A'],
              ['Phòng ban:', request?.department || 'N/A'],
              ['Thời gian kế hoạch:', `${request?.fromDate || 'N/A'} - ${request?.toDate || 'N/A'}`],
              ['Tổng bản ghi chấm công:', detailedRecords.length],
              ['Tổng lương:', `${totalSalary.toLocaleString('vi-VN')} VNĐ`],
              ['Trạng thái:', request?.status || 'N/A'],
              [],
              ['CHI TIẾT THEO NGÀY'],
              ['STT', 'Mã nhân viên', 'Ngày chấm công', 'Thời gian vào', 'Thời gian ra', 'Tổng giờ làm', 'Lương/giờ (VNĐ)', 'Tổng lương (VNĐ)'],
              ...detailedRecords.map((record, index) => [
                  index + 1,
                  record?.employeeId || 'N/A',
                  typeof record?.workDate === 'number'
                      ? formatDateTimeForCSV(record.workDate)
                      : (record?.workDate || 'N/A'),
                  typeof record?.checkInTime === 'number'
                      ? formatTimeForCSV(record.checkInTime)
                      : (record?.checkInTime || 'N/A'),
                  typeof record?.checkOutTime === 'number'
                      ? formatTimeForCSV(record.checkOutTime)
                      : (record?.checkOutTime || 'N/A'),
                  record?.totalHours || 0,
                  record?.hourlyRate || 0,
                  record?.totalSalary || 0,
              ])
          ];

          // ==================================================================
          // PHẦN 2: LẤY VÀ XỬ LÝ DỮ LIỆU SO SÁNH (ĐÃ CHỈNH SỬA)
          // ==================================================================
          const comparisonResponse = await ApiClient.get(`/api/recruitment/daily-comparison/${request.requestNo}`);
          const comparisonData = Array.isArray(comparisonResponse?.data?.dailyComparison) ? comparisonResponse.data.dailyComparison : [];

          // ✅ SỬA: Headers mới đã được rút gọn
          const comparisonHeaders = [
              'Ngày', 
              'Thứ', 
              'Số người được phê duyệt', 
              'Số người thực tế chấm công', 
              'Chênh lệch (Thực tế - Phê duyệt)', 
              'Tỷ lệ thực hiện (%)'
          ];

          // ✅ SỬA: Tạo các dòng dữ liệu phù hợp với headers mới
          const comparisonRows = (comparisonData || []).map(day => {
              const approvedCount = day?.approvedCount ?? 0;
              const actualCount = day?.actualCount ?? 0;
              const variance = day?.variance ?? (actualCount - approvedCount);
              // Sử dụng toFixed(1) để làm tròn đến 1 chữ số thập phân
              const utilizationRate = `${(parseFloat(day?.utilizationRate || 0)).toFixed(1)}%`;

              return [
                  day?.date || 'N/A',
                  day?.dayName || '',
                  approvedCount,
                  actualCount,
                  variance,
                  utilizationRate
              ];
          });
          
          // ✅ SỬA: Loại bỏ hoàn toàn phần "THỐNG KÊ TỔNG QUAN" và các tính toán liên quan
          const sheet2Data = [
              ['BẢNG SO SÁNH KẾ HOẠCH VS THỰC TẾ'],
              [],
              ['Request No:', request?.requestNo || 'N/A'],
              ['Phòng ban:', request?.department || 'N/A'],
              ['Thời gian:', `${request?.fromDate || 'N/A'} - ${request?.toDate || 'N/A'}`],
              [],
              ['CHI TIẾT THEO NGÀY'],
              comparisonHeaders,
              ...comparisonRows
          ];

          // ==================================================================
          // PHẦN 3: TẠO FILE CSV (GIỮ NGUYÊN)
          // ==================================================================
          const separatorLine = Array(80).fill('=').join('');
          const combinedData = [
              ...sheet1Data,
              [], [],
              [separatorLine],
              [], [],
              ...sheet2Data
          ];

          const csvContent = combinedData.map(row =>
              row.map(cell => {
                  const cellStr = String(cell ?? '');
                  if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
                      return `"${cellStr.replace(/"/g, '""')}"`;
                  }
                  return cellStr;
              }).join(',')
          ).join('\n');

          const BOM = '\uFEFF';
          const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
          const link = document.createElement('a');
          link.href = URL.createObjectURL(blob);
          link.download = `bao_cao_chi_tiet_${request?.requestNo || 'unknown'}_${new Date().toISOString().split('T')[0]}.csv`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(link.href);

          showNotification(`Đã xuất báo cáo chi tiết cho ${request?.requestNo}`, 'success');

      } catch (error) {
          console.error('Lỗi khi xuất báo cáo chi tiết:', error);
          showNotification('Lỗi khi xuất báo cáo chi tiết', 'error');
      } finally {
          setLoadingRecruitment(false);
      }
  };




  // const exportToExcel = async (request) => {
  //     try {
  //         setLoadingRecruitment(true);
  //         showNotification('Đang tải chi tiết dữ liệu...', 'info');
          
  //         const response = await ApiClient.get(`/api/recruitment/detailed-hours/${request.requestNo}`);
          
  //         if (!response.success || !response.data.records.length) {
  //             showNotification('Không có dữ liệu chi tiết để xuất', 'warning');
  //             return;
  //         }
          
  //         const detailedRecords = response.data.records;
          
  //         // ✅ SỬA: Áp dụng conversion cho các trường thời gian
  //         const worksheetData = [
  //             ['STT', 'Mã nhân viên', 'Ngày chấm công', 'Thời gian vào', 'Thời gian ra', 'Tổng giờ làm', 'Lương/giờ (VNĐ)', 'Tổng lương (VNĐ)'],
  //             ...detailedRecords.map((record, index) => [
  //                 index + 1,
  //                 record.employeeId || 'N/A',
  //                 // ✅ CHUYỂN ĐỔI: workDate nếu là serial number
  //                 typeof record.workDate === 'number' ? 
  //                     formatDateTimeForCSV(record.workDate) : 
  //                     record.workDate || 'N/A',
  //                 // ✅ CHUYỂN ĐỔI: checkInTime nếu là serial number
  //                 typeof record.checkInTime === 'number' ? 
  //                     formatTimeForCSV(record.checkInTime) : 
  //                     record.checkInTime || 'N/A',
  //                 // ✅ CHUYỂN ĐỔI: checkOutTime nếu là serial number
  //                 typeof record.checkOutTime === 'number' ? 
  //                     formatTimeForCSV(record.checkOutTime) : 
  //                     record.checkOutTime || 'N/A',
  //                 record.totalHours || 0,
  //                 record.hourlyRate || 0,
  //                 record.totalSalary || 0 
  //             ])
  //         ];

  //         // Phần còn lại giữ nguyên
  //         const totalSalary = detailedRecords.reduce((sum, record) => sum + (record.totalSalary || 0), 0);
          
  //         const summaryData = [
  //             [],
  //             ['THÔNG TIN TỔNG HỢP'],
  //             ['Request No:', request.requestNo],
  //             ['Phòng ban:', request.department],
  //             ['Thời gian:', `${request.fromDate || 'N/A'} - ${request.toDate || 'N/A'}`],
  //             ['Tổng bản ghi:', detailedRecords.length],
  //             ['Tổng lương:', `${totalSalary.toLocaleString('vi-VN')} VNĐ`],
  //             ['Trạng thái:', request.status],
  //             [],
  //             ['CHI TIẾT CHẤM CÔNG THEO NGÀY'],
  //             ...worksheetData
  //         ];

  //         const csvContent = summaryData.map(row => 
  //             row.map(cell => {
  //                 const cellStr = String(cell || '');
  //                 if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
  //                     return `"${cellStr.replace(/"/g, '""')}"`;
  //                 }
  //                 return cellStr;
  //             }).join(',')
  //         ).join('\n');

  //         const BOM = '\uFEFF';
  //         const blob = new Blob([BOM + csvContent], { 
  //             type: 'text/csv;charset=utf-8;' 
  //         });

  //         const link = document.createElement('a');
  //         link.href = URL.createObjectURL(blob);
  //         link.download = `chi_tiet_cham_cong_${request.requestNo}_${new Date().toISOString().split('T')[0]}.csv`;
          
  //         document.body.appendChild(link);
  //         link.click();
  //         document.body.removeChild(link);
  //         URL.revokeObjectURL(link.href);
          
  //         showNotification(`Đã xuất file chi tiết cho ${request.requestNo}`, 'success');
          
  //     } catch (error) {
  //         console.error('Error exporting detailed Excel:', error);
  //         showNotification('Lỗi khi xuất file Excel chi tiết', 'error');
  //     } finally {
  //         setLoadingRecruitment(false);
  //     }
  // };


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
        <li className="nav-item">
          <a
            className={`nav-link${activeTab === 'logs' ? ' active' : ''}`}
            onClick={() => handleTabChange('logs')}
            role="button"
          >
            <i className="fas fa-list me-2"></i>
            Bản ghi chấm công
          </a>
        </li>
        <li className="nav-item">
          <a
            className={`nav-link${activeTab === 'hours' ? ' active' : ''}`}
            onClick={() => handleTabChange('hours')}
            role="button"
          >
            <i className="fas fa-clock me-2"></i>
            Tổng giờ công
          </a>
        </li>
        <li className="nav-item">
          <a
            className={`nav-link${activeTab === 'recruitment' ? ' active' : ''}`}
            onClick={() => handleTabChange('recruitment')}
            role="button"
          >
            <i className="fas fa-users me-2"></i>
            Tổng hợp giờ công theo tuyển dụng
            {loadingRecruitment && (
              <span className="spinner-border spinner-border-sm ms-2" role="status" aria-hidden="true"></span>
            )}
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

        {/* Tab Recruitment */}
        {activeTab === 'recruitment' && (
          <div className="tab-pane fade show active" id="recruitment-tab">
            <div className="card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <div>
                  <h5 className="mb-0">Tổng hợp giờ công theo kế hoạch tuyển dụng</h5>
                  <small className="text-muted">
                    Dữ liệu realtime - Click nút download để xuất file Excel chi tiết
                    {loadingRecruitment && (
                      <span className="text-info ms-2">
                        <i className="fas fa-sync fa-spin"></i> Đang cập nhật...
                      </span>
                    )}
                  </small>
                </div>
                <button
                  className="btn btn-sm btn-outline-primary"
                  onClick={() => loadRecruitmentHours(true)}
                  disabled={loadingRecruitment}
                >
                  <i className={`fas fa-sync ${loadingRecruitment ? 'fa-spin' : ''} me-1`}></i>
                  Làm mới ngay
                </button>
              </div>
              <div className="card-body">
                {loadingRecruitment && (
                  <div className="text-center py-4">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-2 text-muted">Đang tải dữ liệu mới nhất...</p>
                  </div>
                )}
                
                {!loadingRecruitment && (
                  <div className="table-responsive">
                    <table className="table table-striped table-hover">
                      <thead>
                        <tr>
                          <th>Request No.</th>
                          <th>Phòng ban</th>
                          <th>Thời gian</th>
                          <th>Nhân viên</th>
                          <th>Tổng giờ công</th>
                          <th>Tổng lương</th>
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
                                <strong className="text-warning">{request.totalSalary || '0 ₫'}</strong>
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
                                  className="btn btn-sm btn-success"
                                  onClick={() => exportToExcel(request)}
                                  title="Xuất Excel chi tiết"
                                  disabled={!request.employees || request.employees.length === 0}
                                >
                                  <i className="fas fa-file-excel"></i>
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="8" className="text-center text-muted py-4">
                              <i className="fas fa-inbox fa-2x mb-2"></i>
                              <br />
                              Chưa có dữ liệu tổng hợp giờ công theo tuyển dụng
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Thống kê tổng quan */}
                {!loadingRecruitment && recruitmentHours.length > 0 && (
                  <div className="row mt-4">
                    <div className="col-md-3">
                      <div className="card text-center bg-light">
                        <div className="card-body">
                          <h4 className="text-primary">{recruitmentHours.length}</h4>
                          <p className="mb-0">Tổng số đề xuất</p>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="card text-center bg-light">
                        <div className="card-body">
                          <h4 className="text-success">
                            {recruitmentHours.reduce((sum, req) => sum + req.totalEmployees, 0)}
                          </h4>
                          <p className="mb-0">Tổng nhân viên</p>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="card text-center bg-light">
                        <div className="card-body">
                          <h4 className="text-warning">
                            {recruitmentHours.reduce((sum, req) => sum + (req.totalHoursNumeric || 0), 0).toFixed(1)} giờ
                          </h4>
                          <p className="mb-0">Tổng giờ công</p>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="card text-center bg-light">
                        <div className="card-body">
                          <h4 className="text-danger">
                            {new Intl.NumberFormat('vi-VN', { 
                              style: 'currency', 
                              currency: 'VND' 
                            }).format(recruitmentHours.reduce((sum, req) => sum + (req.totalSalaryNumeric || 0), 0))}
                          </h4>
                          <p className="mb-0">Tổng lương</p>
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
