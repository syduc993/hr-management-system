import React from 'react';

const EmployeeTable = ({ 
  employees, 
  onEdit, 
  onDelete, 
  onAddWorkHistory, 
  onViewWorkHistory 
}) => {
  // Kiểm tra và đảm bảo employees luôn là array
  const employeeList = React.useMemo(() => {
    if (!employees) {
      return [];
    }
    
    // Nếu employees là object có data property (từ API response)
    if (employees.data && Array.isArray(employees.data)) {
      return employees.data;
    }
    
    // Nếu employees đã là array
    if (Array.isArray(employees)) {
      return employees;
    }
    
    // Fallback: trả về empty array
    console.warn('EmployeeTable: employees prop is not an array:', typeof employees, employees);
    return [];
  }, [employees]);

  if (!employeeList || employeeList.length === 0) {
    return (
      <div className="text-center py-4">
        <i className="fas fa-users fa-3x text-muted mb-3"></i>
        <p className="text-muted">Không có nhân viên nào</p>
      </div>
    );
  }

  return (
    <div className="table-responsive">
      <table className="table table-striped table-hover">
        <thead className="table-dark">
          <tr>
            <th>Mã NV</th>
            <th>Họ tên</th>
            <th>Số ĐT</th>
            <th>Giới tính</th>
            <th>Lương/giờ</th>
            <th>Tài khoản</th>
            <th>Ngân hàng</th>
            <th>Trạng thái</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody id="employeeTableBody">
          {employeeList.map((employee, index) => {
            // Đảm bảo mỗi employee có đủ thuộc tính
            const safeEmployee = {
              id: employee?.id || `emp_${index}`,
              employeeId: employee?.employeeId || 'N/A',
              fullName: employee?.fullName || 'N/A',
              phoneNumber: employee?.phoneNumber || 'N/A',
              gender: employee?.gender || 'N/A',
              hourlyRate: employee?.hourlyRate || 0,
              bankAccount: employee?.bankAccount || 'N/A',
              bankName: employee?.bankName || 'N/A',
              status: employee?.status || 'inactive'
            };

            return (
              <tr key={safeEmployee.id}>
                <td>{safeEmployee.employeeId}</td>
                <td>{safeEmployee.fullName}</td>
                <td>{safeEmployee.phoneNumber}</td>
                <td>{safeEmployee.gender}</td>
                <td>
                  {safeEmployee.hourlyRate && safeEmployee.hourlyRate > 0
                    ? safeEmployee.hourlyRate.toLocaleString('vi-VN') + ' VNĐ'
                    : 'N/A'
                  }
                </td>
                <td>{safeEmployee.bankAccount}</td>
                <td>{safeEmployee.bankName}</td>
                <td>
                  <span className={`badge ${
                    safeEmployee.status === 'active' 
                      ? 'bg-success' 
                      : 'bg-secondary'
                  }`}>
                    {safeEmployee.status === 'active' 
                      ? 'Hoạt động' 
                      : 'Ngưng hoạt động'
                    }
                  </span>
                </td>
                <td>
                  <div className="btn-group" role="group">
                    {onAddWorkHistory && (
                      <button
                        className="btn btn-sm btn-success"
                        onClick={() => onAddWorkHistory(safeEmployee.employeeId, safeEmployee.fullName)}
                        title="Thêm work history"
                      >
                        <i className="fas fa-plus"></i>
                      </button>
                    )}
                    
                    {onViewWorkHistory && (
                      <button
                        className="btn btn-sm btn-info"
                        onClick={() => onViewWorkHistory(safeEmployee.employeeId)}
                        title="Xem lịch sử"
                      >
                        <i className="fas fa-history"></i>
                      </button>
                    )}
                    
                    {onEdit && (
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => onEdit(safeEmployee.id)}
                        title="Chỉnh sửa"
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                    )}
                    
                    {onDelete && (
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => {
                          if (window.confirm(`Bạn có chắc chắn muốn xóa nhân viên "${safeEmployee.fullName}"?`)) {
                            onDelete(safeEmployee.id);
                          }
                        }}
                        title="Xóa"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default EmployeeTable;
