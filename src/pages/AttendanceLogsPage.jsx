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

  const exportToPDF = async (request) => {
      try {
          setLoadingRecruitment(true);
          showNotification('Đang chuẩn bị báo cáo PDF...', 'info');

          // ==================================================================
          // BƯỚC 1: LẤY DỮ LIỆU (Giữ nguyên)
          // ==================================================================
          const detailResponse = await ApiClient.get(`/api/recruitment/detailed-hours/${request.requestNo}`);
          const detailedRecords = Array.isArray(detailResponse?.data?.records) ? detailResponse.data.records : [];
          if (!detailResponse?.success) {
              showNotification('Không thể tải dữ liệu chi tiết.', 'warning');
              return;
          }
          
          const comparisonResponse = await ApiClient.get(`/api/recruitment/daily-comparison/${request.requestNo}`);
          const comparisonData = Array.isArray(comparisonResponse?.data?.dailyComparison) ? comparisonResponse.data.dailyComparison : [];

          // ==================================================================
          // BƯỚC 2: IMPORT THƯ VIỆN & KHỞI TẠO PDF
          // ==================================================================
          const { default: jsPDF } = await import('jspdf');
          const { default: autoTable } = await import('jspdf-autotable');

          const doc = new jsPDF('l', 'mm', 'a4');
          const pageWidth = doc.internal.pageSize.getWidth();
          const pageHeight = doc.internal.pageSize.getHeight();
          let yPosition = 35;
          
          // ==================================================================
          // BƯỚC 3: TẢI VÀ ĐĂNG KÝ 2 FONT (REGULAR & BOLD)
          // ==================================================================
          
          const loadFont = async (url) => {
              const response = await fetch(url);
              if (!response.ok) {
                  throw new Error(`Không thể tải file font: ${url}. Hãy chắc chắn file tồn tại.`);
              }
              const blob = await response.blob();
              return await new Promise((resolve, reject) => {
                  const reader = new FileReader();
                  reader.onloadend = () => resolve(reader.result.split(',')[1]);
                  reader.onerror = reject;
                  reader.readAsDataURL(blob);
              });
          };

          const robotoRegularBase64 = await loadFont('/fonts/Roboto-Regular.ttf');
          const robotoBoldBase64 = await loadFont('/fonts/Roboto-Bold.ttf');

          doc.addFileToVFS('Roboto-Regular.ttf', robotoRegularBase64);
          doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');

          doc.addFileToVFS('Roboto-Bold.ttf', robotoBoldBase64);
          doc.addFont('Roboto-Bold.ttf', 'Roboto', 'bold');
          
          // ==================================================================
          // BƯỚC 4: CÁC HÀM HELPER (Tối ưu và nhất quán)
          // ==================================================================
          
          const createInfoTable = (doc, request, detailedRecords, yPosition) => {
              const infoData = [
                  ['Request No:', request?.requestNo || 'N/A'],
                  ['Phòng ban:', request?.department || 'N/A'],
                  ['Thời gian kế hoạch:', `${request?.fromDate || 'N/A'} - ${request?.toDate || 'N/A'}`],
                  ['Tổng bản ghi chấm công:', detailedRecords.length.toString()],
                  ['Tổng lương:', `${detailedRecords.reduce((sum, record) => sum + (record?.totalSalary || 0), 0).toLocaleString('vi-VN')} VNĐ`],
                  ['Trạng thái:', request?.status || 'N/A']
              ];

              autoTable(doc, {
                  startY: yPosition,
                  head: [['Thông tin', 'Giá trị']],
                  body: infoData,
                  theme: 'grid',
                  styles: { font: 'Roboto', fontStyle: 'normal', fontSize: 10, cellPadding: 3 },
                  headStyles: { font: 'Roboto', fontStyle: 'bold', fillColor: [41, 128, 185], textColor: 255 },
                  columnStyles: {
                      0: { fontStyle: 'bold', cellWidth: 60 },
                      1: { cellWidth: 80 }
                  },
                  margin: { left: 20 }
              });

              return doc.lastAutoTable.finalY + 15;
          };
          
          const drawTableTitle = (doc, title, yPosition) => {
              doc.setFont('Roboto', 'bold');
              doc.setFontSize(14);
              doc.setTextColor(40, 40, 40);
              doc.text(title, 20, yPosition);
              return yPosition + 10;
          };

          const createDetailTable = (doc, detailedRecords, yPosition, pageHeight) => {
              if (yPosition > pageHeight - 100) { doc.addPage(); yPosition = 20; }
              yPosition = drawTableTitle(doc, 'CHI TIẾT CHẤM CÔNG THEO NGÀY', yPosition);
              
              // ✅ ĐÃ SỬA: Điền lại logic map dữ liệu chi tiết
              const detailTableData = detailedRecords.map((record, index) => [
                  (index + 1).toString(),
                  record?.employeeId || 'N/A',
                  typeof record?.workDate === 'number' ? formatDateTimeForCSV(record.workDate) : (record?.workDate || 'N/A'),
                  typeof record?.checkInTime === 'number' ? formatTimeForCSV(record.checkInTime) : (record?.checkInTime || 'N/A'),
                  typeof record?.checkOutTime === 'number' ? formatTimeForCSV(record.checkOutTime) : (record?.checkOutTime || 'N/A'),
                  (record?.totalHours || 0).toString(),
                  (record?.hourlyRate || 0).toLocaleString('vi-VN'),
                  (record?.totalSalary || 0).toLocaleString('vi-VN')
              ]);
              
              autoTable(doc, {
                  startY: yPosition,
                  head: [['STT', 'Mã NV', 'Ngày', 'Giờ vào', 'Giờ ra', 'Tổng giờ', 'Lương/giờ', 'Tổng lương']],
                  body: detailTableData,
                  theme: 'striped',
                  styles: { font: 'Roboto', fontStyle: 'normal', fontSize: 8, cellPadding: 2 },
                  headStyles: { font: 'Roboto', fontStyle: 'bold', fillColor: [46, 204, 113], textColor: 255, fontSize: 9 },
                  columnStyles: {
                      0: { cellWidth: 15, halign: 'center' }, 1: { cellWidth: 25 }, 2: { cellWidth: 25 },
                      3: { cellWidth: 20, halign: 'center' }, 4: { cellWidth: 20, halign: 'center' },
                      5: { cellWidth: 20, halign: 'center' }, 6: { cellWidth: 25, halign: 'right' },
                      7: { cellWidth: 30, halign: 'right' }
                  },
                  margin: { left: 20, right: 20 }
              });

              return doc.lastAutoTable.finalY + 15;
          };

          const createComparisonTable = (doc, comparisonData, yPosition, pageHeight) => {
              if (yPosition > pageHeight - 80) { doc.addPage(); yPosition = 20; }
              yPosition = drawTableTitle(doc, 'SO SÁNH KẾ HOẠCH VS THỰC TẾ', yPosition);
                
              // ✅ ĐÃ SỬA: Điền lại logic map dữ liệu so sánh
              const comparisonTableData = comparisonData.map(day => [
                  day?.date || 'N/A',
                  day?.dayName || '',
                  (day?.approvedCount ?? 0).toString(),
                  (day?.actualCount ?? 0).toString(),
                  (day?.variance ?? 0).toString(),
                  `${(parseFloat(day?.utilizationRate || 0)).toFixed(1)}%`
              ]);
              
              autoTable(doc, {
                  startY: yPosition,
                  head: [['Ngày', 'Thứ', 'KH Phê duyệt', 'Thực tế', 'Chênh lệch', 'Tỷ lệ (%)']],
                  body: comparisonTableData,
                  theme: 'striped',
                  styles: { font: 'Roboto', fontStyle: 'normal', fontSize: 9, cellPadding: 3 },
                  headStyles: { font: 'Roboto', fontStyle: 'bold', fillColor: [231, 76, 60], textColor: 255 },
                  columnStyles: {
                      0: { cellWidth: 30 }, 1: { cellWidth: 25 },
                      2: { cellWidth: 30, halign: 'center' }, 3: { cellWidth: 25, halign: 'center' },
                      4: { cellWidth: 25, halign: 'center' }, 5: { cellWidth: 25, halign: 'center' }
                  },
                  margin: { left: 20 }
              });
              
              return doc.lastAutoTable.finalY + 15;
          };
          
          const addFooter = (doc, pageWidth, pageHeight) => {
              const totalPages = doc.internal.getNumberOfPages();
              for (let i = 1; i <= totalPages; i++) {
                  doc.setPage(i);
                  doc.setFont('Roboto', 'normal');
                  doc.setFontSize(8);
                  doc.setTextColor(128, 128, 128);
                  doc.text(
                      `Tạo lúc: ${new Date().toLocaleString('vi-VN')} | Trang ${i}/${totalPages}`,
                      pageWidth - 20, pageHeight - 10, { align: 'right' }
                  );
              }
          };

          // ==================================================================
          // BƯỚC 5: TẠO NỘI DUNG PDF
          // ==================================================================
          
          doc.setFont('Roboto', 'bold');
          doc.setFontSize(20);
          doc.setTextColor(40, 40, 40);
          doc.text('BÁO CÁO CHI TIẾT CHẤM CÔNG', pageWidth / 2, 20, { align: 'center' });
          
          yPosition = createInfoTable(doc, request, detailedRecords, yPosition);
          if (detailedRecords.length > 0) { yPosition = createDetailTable(doc, detailedRecords, yPosition, pageHeight); }
          if (comparisonData.length > 0) { yPosition = createComparisonTable(doc, comparisonData, yPosition, pageHeight); }
          
          addFooter(doc, pageWidth, pageHeight);

          // ==================================================================
          // BƯỚC 6: LƯU FILE
          // ==================================================================
          const fileName = `bao_cao_${request?.requestNo || 'unknown'}_${new Date().toISOString().split('T')[0]}.pdf`;
          doc.save(fileName);

          showNotification(`Đã xuất báo cáo PDF: ${fileName}`, 'success');

      } catch (error) {
          console.error('Lỗi khi xuất PDF:', error);
          showNotification(`Lỗi xuất PDF: ${error.message}`, 'error');
      } finally {
          setLoadingRecruitment(false);
      }
  };


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
                                  onClick={() => exportToPDF(request)}
                                  title="Xuất PDF chi tiết"
                                  disabled={!request.employees || request.employees.length === 0}
                                >
                                  <i className="fas fa-file-pdf"></i>
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
