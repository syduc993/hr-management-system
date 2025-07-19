import React from 'react';

const EmployeeHours = ({ employees, employeeHours }) => {
  const hoursData = employees
    .map(employee => {
      const hours = employeeHours[employee.employeeId];
      return {
        ...employee,
        totalHours: hours ? hours.totalHours : 0
      };
    })
    .filter(emp => emp.totalHours > 0)
    .sort((a, b) => b.totalHours - a.totalHours);

  if (hoursData.length === 0) {
    return (
      <div className="text-center py-4">
        <i className="fas fa-clock fa-3x text-muted mb-3"></i>
        <p className="text-muted">Không có dữ liệu giờ công</p>
      </div>
    );
  }

  return (
    <div className="table-responsive">
      <table className="table table-striped table-hover">
        <thead className="table-dark">
          <tr>
            <th>Mã nhân viên</th>
            <th>Họ tên</th>
            <th>Tổng giờ công</th>
            <th>Số ngày</th>
            <th>Trung bình/ngày</th>
          </tr>
        </thead>
        <tbody>
          {hoursData.map((employee) => {
            const hours = employeeHours[employee.employeeId];
            const avgHours = hours ? (hours.totalHours / (hours.totalDays || 1)) : 0;
            
            return (
              <tr key={employee.id}>
                <td>{employee.employeeId}</td>
                <td>{employee.fullName}</td>
                <td>
                  <strong className="text-success">
                    {employee.totalHours.toFixed(1)} giờ
                  </strong>
                </td>
                <td>
                  <span className="badge bg-info">
                    {hours ? hours.totalDays : 0} ngày
                  </span>
                </td>
                <td>
                  <span className="text-muted">
                    {avgHours.toFixed(1)} giờ/ngày
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default EmployeeHours;
