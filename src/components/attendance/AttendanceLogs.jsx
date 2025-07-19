import React from 'react';

const AttendanceLogs = ({ logs }) => {
  if (!logs || logs.length === 0) {
    return (
      <div className="text-center py-4">
        <i className="fas fa-calendar-times fa-3x text-muted mb-3"></i>
        <p className="text-muted">Không có bản ghi chấm công nào</p>
      </div>
    );
  }

  return (
    <div className="table-responsive">
      <table className="table table-striped table-hover">
        <thead className="table-dark">
          <tr>
            <th>Mã nhân viên</th>
            <th>Ngày</th>
            <th>Giờ vào</th>
            <th>Giờ ra</th>
            <th>Tổng giờ</th>
            <th>Ghi chú</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log, index) => (
            <tr key={log.id || index}>
              <td>{log.employeeId}</td>
              <td>{log.date}</td>
              <td>{log.timeIn}</td>
              <td>{log.timeOut}</td>
              <td>
                <strong className="text-primary">{log.totalHours}</strong>
              </td>
              <td>{log.notes}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AttendanceLogs;
