// import React, { useState, useEffect } from 'react';
// import { useAttendance } from '../../hooks/useAttendance';
// import { useNotification } from '../../hooks/useNotification';
// import Loading from '../common/Loading';
// import Alert from '../common/Alert';

// function EmployeeHours() {
//     const [employeeHours, setEmployeeHours] = useState([]);
//     const [filteredData, setFilteredData] = useState([]);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState(null);
//     const [stats, setStats] = useState(null);

//     // Bộ lọc đơn giản, không có "Lỗi" hay "Cảnh báo"
//     const [filters, setFilters] = useState({
//         employeeId: '',
//         position: '',
//         dateFrom: '',
//         dateTo: ''
//     });

//     const { getEmployeeHours } = useAttendance();
//     const { showNotification } = useNotification();

//     useEffect(() => {
//         loadEmployeeHours();
//     }, []);

//     useEffect(() => {
//         applyFilters();
//     }, [employeeHours, filters]);

//     const loadEmployeeHours = async () => {
//         try {
//             setLoading(true);
//             setError(null);
//             const response = await getEmployeeHours();

//             if (response.success) {
//                 setEmployeeHours(response.data.employeeHours || []);
//                 setStats(response.data.summary || null);
//             } else {
//                 throw new Error(response.message || 'Failed to load employee hours');
//             }
//         } catch (err) {
//             setError(err.message);
//             showNotification('Lỗi khi tải dữ liệu giờ công: ' + err.message, 'error');
//         } finally {
//             setLoading(false);
//         }
//     };

//     const applyFilters = () => {
//         let filtered = [...employeeHours];

//         // Tìm kiếm theo mã NV hoặc tên
//         if (filters.employeeId.trim()) {
//             const searchTerm = filters.employeeId.toLowerCase();
//             filtered = filtered.filter(item =>
//                 item.employeeId.toLowerCase().includes(searchTerm) ||
//                 item.fullName.toLowerCase().includes(searchTerm)
//             );
//         }

//         // Theo chức vụ
//         if (filters.position) {
//             filtered = filtered.filter(item => item.position === filters.position);
//         }

//         // Theo khoảng ngày
//         if (filters.dateFrom) {
//             filtered = filtered.filter(item =>
//                 new Date(item.date) >= new Date(filters.dateFrom)
//             );
//         }
//         if (filters.dateTo) {
//             filtered = filtered.filter(item =>
//                 new Date(item.date) <= new Date(filters.dateTo)
//             );
//         }

//         setFilteredData(filtered);
//     };

//     const handleFilterChange = (key, value) => {
//         setFilters(prev => ({
//             ...prev,
//             [key]: value
//         }));
//     };

//     const clearFilters = () => {
//         setFilters({
//             employeeId: '',
//             position: '',
//             dateFrom: '',
//             dateTo: ''
//         });
//     };

//     const exportToCSV = () => {
//         if (filteredData.length === 0) {
//             showNotification('Không có dữ liệu để xuất', 'warning');
//             return;
//         }

//         const headers = [
//             'Mã NV',
//             'Họ tên',
//             'Ngày',
//             'Chức vụ',
//             'Tổng giờ',
//             'Cảnh báo'
//         ];

//         const csvContent = [
//             headers.join(','),
//             ...filteredData.map(item => [
//                 item.employeeId,
//                 `"${item.fullName}"`,
//                 item.date,
//                 `"${item.position}"`,
//                 `"${item.totalHours}"`,
//                 `"${(item.warnings || []).join('; ')}"`
//             ].join(','))
//         ].join('\n');

//         const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
//         const link = document.createElement('a');
//         link.href = URL.createObjectURL(blob);
//         link.download = `employee_hours_${new Date().toISOString().split('T')[0]}.csv`;
//         link.click();

//         showNotification('Xuất file CSV thành công', 'success');
//     };

//     const getPositionOptions = () => {
//         const positions = [...new Set(employeeHours.map(item => item.position))];
//         return positions.filter(Boolean).sort();
//     };

//     const formatDate = (dateString) => {
//         if (!dateString) return '';
//         const date = new Date(dateString);
//         return date.toLocaleDateString('vi-VN');
//     };

//     // Màu dòng nếu có cảnh báo
//     const getRowClassName = (item) => {
//         if (item.warnings && item.warnings.length > 0) return 'table-warning';
//         return '';
//     };

//     if (loading) {
//         return (
//             <div className="container-fluid py-4">
//                 <div className="row">
//                     <div className="col-12">
//                         <div className="card">
//                             <div className="card-header">
//                                 <h5 className="mb-0">📊 Tổng Giờ Công Nhân Viên</h5>
//                             </div>
//                             <div className="card-body">
//                                 <Loading message="Đang tải dữ liệu giờ công..." />
//                             </div>
//                         </div>
//                     </div>
//                 </div>
//             </div>
//         );
//     }

//     if (error) {
//         return (
//             <div className="container-fluid py-4">
//                 <div className="row">
//                     <div className="col-12">
//                         <Alert
//                             type="danger"
//                             message={`Lỗi tải dữ liệu: ${error}`}
//                             onRetry={loadEmployeeHours}
//                         />
//                     </div>
//                 </div>
//             </div>
//         );
//     }

//     return (
//         <div className="container-fluid py-4">
//             <div className="row">
//                 <div className="col-12">
//                     <div className="card">
//                         <div className="card-header d-flex justify-content-between align-items-center">
//                             <h5 className="mb-0">
//                                 📊 Tổng Giờ Công Nhân Viên
//                                 <small className="text-muted ms-2">
//                                     ({filteredData.length} / {employeeHours.length} bản ghi)
//                                 </small>
//                             </h5>
//                             <div className="d-flex gap-2">
//                                 <button
//                                     className="btn btn-outline-success btn-sm"
//                                     onClick={exportToCSV}
//                                     disabled={filteredData.length === 0}
//                                 >
//                                     <i className="fas fa-download me-1"></i>
//                                     Xuất CSV
//                                 </button>
//                                 <button
//                                     className="btn btn-outline-primary btn-sm"
//                                     onClick={loadEmployeeHours}
//                                 >
//                                     <i className="fas fa-sync-alt me-1"></i>
//                                     Làm mới
//                                 </button>
//                             </div>
//                         </div>

//                         {/* Filters Section (KHÔNG còn Lỗi/Cảnh Báo) */}
//                         <div className="card-body border-bottom">
//                             <div className="row g-3">
//                                 <div className="col-md-3">
//                                     <label className="form-label">Tìm nhân viên</label>
//                                     <input
//                                         type="text"
//                                         className="form-control form-control-sm"
//                                         placeholder="Mã NV hoặc tên..."
//                                         value={filters.employeeId}
//                                         onChange={(e) => handleFilterChange('employeeId', e.target.value)}
//                                     />
//                                 </div>
//                                 <div className="col-md-2">
//                                     <label className="form-label">Chức vụ</label>
//                                     <select
//                                         className="form-select form-select-sm"
//                                         value={filters.position}
//                                         onChange={(e) => handleFilterChange('position', e.target.value)}
//                                     >
//                                         <option value="">Tất cả chức vụ</option>
//                                         {getPositionOptions().map(position => (
//                                             <option key={position} value={position}>
//                                                 {position}
//                                             </option>
//                                         ))}
//                                     </select>
//                                 </div>
//                                 <div className="col-md-2">
//                                     <label className="form-label">Từ ngày</label>
//                                     <input
//                                         type="date"
//                                         className="form-control form-control-sm"
//                                         value={filters.dateFrom}
//                                         onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
//                                     />
//                                 </div>
//                                 <div className="col-md-2">
//                                     <label className="form-label">Đến ngày</label>
//                                     <input
//                                         type="date"
//                                         className="form-control form-control-sm"
//                                         value={filters.dateTo}
//                                         onChange={(e) => handleFilterChange('dateTo', e.target.value)}
//                                     />
//                                 </div>
//                                 <div className="col-md-3 d-flex align-items-end">
//                                     <button
//                                         className="btn btn-outline-secondary btn-sm ms-auto"
//                                         onClick={clearFilters}
//                                         title="Xóa bộ lọc"
//                                     >
//                                         <i className="fas fa-times"></i> Xóa lọc
//                                     </button>
//                                 </div>
//                             </div>
//                         </div>

//                         {/* Table Section */}
//                         <div className="card-body p-0">
//                             <div className="table-responsive">
//                                 <table className="table table-hover mb-0">
//                                     <thead className="table-light">
//                                         <tr>
//                                             <th>Mã NV</th>
//                                             <th>Họ tên</th>
//                                             <th>Ngày</th>
//                                             <th>Chức vụ</th>
//                                             <th className="text-center">Tổng giờ</th>
//                                             <th>Cảnh báo</th>
//                                         </tr>
//                                     </thead>
//                                     <tbody>
//                                         {filteredData.length === 0 ? (
//                                             <tr>
//                                                 <td colSpan="6" className="text-center py-4 text-muted">
//                                                     <i className="fas fa-calendar-times fa-2x mb-2"></i>
//                                                     <div>Không có dữ liệu giờ công</div>
//                                                     <small>Hãy kiểm tra bộ lọc hoặc thêm dữ liệu chấm công</small>
//                                                 </td>
//                                             </tr>
//                                         ) : (
//                                             filteredData.map((item, index) => (
//                                                 <tr key={`${item.employeeId}-${item.date}-${index}`}
//                                                     className={getRowClassName(item)}>
//                                                     <td>
//                                                         <div className="fw-bold">{item.employeeId}</div>
//                                                     </td>
//                                                     <td>
//                                                         <div className="fw-semibold">{item.fullName}</div>
//                                                     </td>
//                                                     <td>
//                                                         <div className="text-nowrap">{formatDate(item.date)}</div>
//                                                     </td>
//                                                     <td>
//                                                         <span className={`badge ${getPositionBadgeClass(item.position)}`}>
//                                                             {item.position}
//                                                         </span>
//                                                     </td>
//                                                     <td className="text-center">
//                                                         <span className="badge bg-primary">
//                                                             {item.totalHours}
//                                                         </span>
//                                                     </td>
//                                                     <td>
//                                                         {(item.warnings && item.warnings.length > 0) ? (
//                                                             <div>
//                                                                 {item.warnings.map((warning, idx) => (
//                                                                     <small key={idx} className="text-warning d-block">
//                                                                         <i className="fas fa-exclamation-triangle me-1"></i>
//                                                                         {warning}
//                                                                     </small>
//                                                                 ))}
//                                                             </div>
//                                                         ) : (
//                                                             <span className="text-success">OK</span>
//                                                         )}
//                                                     </td>
//                                                 </tr>
//                                             ))
//                                         )}
//                                     </tbody>
//                                 </table>
//                             </div>
//                         </div>
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );
// }

// // Helper function màu badge chức vụ
// function getPositionBadgeClass(position) {
//     switch (position) {
//         case 'Nhân viên Mascot':
//             return 'bg-info text-dark';
//         case 'Nhân viên Bán hàng':
//             return 'bg-success';
//         case 'Nhân viên Thu ngân':
//             return 'bg-primary';
//         case 'Nhân viên Tiếp đón':
//             return 'bg-secondary';
//         default:
//             return 'bg-light text-dark';
//     }
// }

// export default EmployeeHours;
