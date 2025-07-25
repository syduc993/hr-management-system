// src/components/attendance/AttendanceLogs.jsx
import React, { useState } from 'react';

const AttendanceLogs = ({ logs, employees }) => {
  const [sortField, setSortField] = useState('timestamp');
  const [sortDirection, setSortDirection] = useState('desc');
  const [positionFilter, setPositionFilter] = useState('');

  // ✅ THÊM: Hàm sắp xếp logs
  const sortedLogs = [...logs].sort((a, b) => {
    let aValue = a[sortField];
    let bValue = b[sortField];
    
    if (sortField === 'timestamp') {
      aValue = new Date(aValue);
      bValue = new Date(bValue);
    }
    
    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  // ✅ THÊM: Lọc theo vị trí
  const filteredLogs = positionFilter 
    ? sortedLogs.filter(log => log.position === positionFilter)
    : sortedLogs;

  // ✅ THÊM: Lấy danh sách vị trí unique
  const positions = [...new Set(logs.map(log => log.position))].filter(Boolean);

  // ✅ THÊM: Hàm lấy tên nhân viên từ mã
  const getEmployeeName = (employeeId) => {
    const employee = employees?.find(emp => emp.employeeId === employeeId);
    return employee?.fullName || employeeId;
  };

  // ✅ THÊM: Hàm format timestamp Unix
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleString('vi-VN');
  };

  // ✅ THÊM: Hàm lấy icon cho loại chấm công
  const getTypeIcon = (type) => {
    return type === 'Checkin' 
      ? <i className="fas fa-sign-in-alt text-success"></i>
      : <i className="fas fa-sign-out-alt text-danger"></i>;
  };

  // ✅ THÊM: Hàm lấy badge color cho vị trí
  const getPositionBadgeClass = (position) => {
    switch (position) {
      case 'Nhân viên Mascot': return 'bg-info text-dark';
      case 'Nhân viên Bán hàng': return 'bg-success';
      case 'Nhân viên Thu ngân': return 'bg-primary';
      case 'Nhân viên Tiếp đón': return 'bg-secondary';
      default: return 'bg-light text-dark';
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  if (!logs || logs.length === 0) {
    return (
      <div className="text-center py-5">
        <i className="fas fa-calendar-times fa-3x text-muted mb-3"></i>
        <h5 className="text-muted">Không có bản ghi chấm công nào</h5>
        <p className="text-muted">Dữ liệu chấm công sẽ hiển thị ở đây khi có nhân viên thực hiện chấm công.</p>
      </div>
    );
  }

  return (
    <div className="attendance-logs">
      {/* ✅ THÊM: Bộ lọc và controls */}
      <div className="row mb-3">
        <div className="col-md-4">
          <select
            className="form-select form-select-sm"
            value={positionFilter}
            onChange={(e) => setPositionFilter(e.target.value)}
          >
            <option value="">Tất cả vị trí</option>
            {positions.map(position => (
              <option key={position} value={position}>
                {position}
              </option>
            ))}
          </select>
        </div>
        <div className="col-md-8 text-end">
          <small className="text-muted">
            Hiển thị {filteredLogs.length} / {logs.length} bản ghi
          </small>
        </div>
      </div>

      {/* ✅ CẬP NHẬT: Bảng với cấu trúc mới */}
      <div className="table-responsive">
        <table className="table table-striped table-hover align-middle">
          <thead className="table-dark">
            <tr>
              <th 
                style={{ cursor: 'pointer' }}
                onClick={() => handleSort('employeeId')}
              >
                Mã NV
                {sortField === 'employeeId' && (
                  <i className={`fas fa-sort-${sortDirection === 'asc' ? 'up' : 'down'} ms-1`}></i>
                )}
              </th>
              <th>Họ tên</th>
              <th 
                style={{ cursor: 'pointer' }}
                onClick={() => handleSort('type')}
              >
                Loại
                {sortField === 'type' && (
                  <i className={`fas fa-sort-${sortDirection === 'asc' ? 'up' : 'down'} ms-1`}></i>
                )}
              </th>
              <th 
                style={{ cursor: 'pointer' }}
                onClick={() => handleSort('position')}
              >
                Vị trí
                {sortField === 'position' && (
                  <i className={`fas fa-sort-${sortDirection === 'asc' ? 'up' : 'down'} ms-1`}></i>
                )}
              </th>
              <th 
                style={{ cursor: 'pointer' }}
                onClick={() => handleSort('timestamp')}
              >
                Thời gian chấm công
                {sortField === 'timestamp' && (
                  <i className={`fas fa-sort-${sortDirection === 'asc' ? 'up' : 'down'} ms-1`}></i>
                )}
              </th>
              <th>Ghi chú</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.map((log, index) => (
              <tr key={log.id || index}>
                <td>
                  <span className="fw-bold text-primary">{log.employeeId}</span>
                </td>
                <td>
                  <div className="fw-semibold">{getEmployeeName(log.employeeId)}</div>
                </td>
                <td>
                  <div className="d-flex align-items-center">
                    {getTypeIcon(log.type)}
                    <span className="ms-2">{log.type}</span>
                  </div>
                </td>
                <td>
                  <span className={`badge ${getPositionBadgeClass(log.position)}`}>
                    {log.position || 'N/A'}
                  </span>
                </td>
                <td>
                  <div className="text-nowrap">
                    <div className="fw-semibold">{formatTimestamp(log.timestamp).split(' ')[1]}</div>
                    <small className="text-muted">{formatTimestamp(log.timestamp).split(' ')[0]}</small>
                  </div>
                </td>
                <td>
                  <span className="text-muted">{log.notes || '-'}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ✅ THÊM: Thống kê nhanh */}
      <div className="row mt-4">
        <div className="col-12">
          <div className="card bg-light">
            <div className="card-body">
              <h6 className="card-title">📊 Thống kê nhanh</h6>
              <div className="row text-center">
                <div className="col-md-3">
                  <div className="h5 text-success mb-0">
                    {filteredLogs.filter(log => log.type === 'Checkin').length}
                  </div>
                  <small className="text-muted">Check-in</small>
                </div>
                <div className="col-md-3">
                  <div className="h5 text-danger mb-0">
                    {filteredLogs.filter(log => log.type === 'Checkout').length}
                  </div>
                  <small className="text-muted">Check-out</small>
                </div>
                <div className="col-md-3">
                  <div className="h5 text-primary mb-0">
                    {new Set(filteredLogs.map(log => log.employeeId)).size}
                  </div>
                  <small className="text-muted">Nhân viên</small>
                </div>
                <div className="col-md-3">
                  <div className="h5 text-info mb-0">
                    {new Set(filteredLogs.map(log => log.date)).size}
                  </div>
                  <small className="text-muted">Ngày</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceLogs;
