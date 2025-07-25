import React from 'react';

const EmployeeTable = ({ 
  employees, 
  onEdit, 
  onDelete, 
  onAddWorkHistory, 
  onViewWorkHistory 
}) => {

  // ✅ Giữ lại phần hiển thị thông báo thân thiện khi không có dữ liệu từ code của bạn.
  if (!employees || employees.length === 0) {
    return (
      <div className="text-center py-5">
        <p className="text-muted">Không có dữ liệu nhân viên để hiển thị.</p>
        <p className="text-muted small">Hãy thử thay đổi bộ lọc hoặc thêm nhân viên mới.</p>
      </div>
    );
  }

  return (
    <div className="table-responsive">
      <table className="table table-hover table-striped align-middle">
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
            <th className="text-center" style={{ minWidth: '160px' }}>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {/* 
            ✅ Không cần 'safeEmployee' nữa. 
            Component cha đảm bảo dữ liệu truyền vào đã sạch.
          */}
          {employees.map((employee) => (
            <tr key={employee.id}>
              <td>{employee.employeeId || 'N/A'}</td>
              <td>{employee.fullName || 'N/A'}</td>
              <td>{employee.phoneNumber || 'N/A'}</td>
              <td>{employee.gender || 'N/A'}</td>
              <td>
                {/* ✅ Giữ lại định dạng tiền tệ, đây là logic hiển thị hợp lệ. */}
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(employee.hourlyRate || 0)}
              </td>
              <td>{employee.bankAccount || 'N/A'}</td>
              <td>{employee.bankName || 'N/A'}</td>
              <td>
                <span className={`badge ${employee.status === 'active' ? 'bg-success' : 'bg-secondary'}`}>
                  {employee.status === 'active' ? 'Hoạt động' : 'Ngưng'}
                </span>
              </td>
              <td className="text-center">
                <div className="btn-group" role="group">
                  {/* Nút Thêm Work History */}
                  {onAddWorkHistory && (
                    <button
                      className="btn btn-sm btn-success"
                      title="Thêm Lịch sử công việc"
                      onClick={() => onAddWorkHistory(employee)} // ✅ Truyền cả object 'employee'
                    >
                      <i className="fas fa-plus-circle"></i>
                    </button>
                  )}
                  {/* Nút Xem Work History */}
                  {onViewWorkHistory && (
                    <button
                      className="btn btn-sm btn-info"
                      title="Xem Lịch sử công việc"
                      onClick={() => onViewWorkHistory(employee)} // ✅ Truyền cả object 'employee'
                    >
                      <i className="fas fa-history"></i>
                    </button>
                  )}
                  {/* Nút Sửa */}
                  {onEdit && (
                     <button
                      className="btn btn-sm btn-primary"
                      title="Sửa thông tin"
                      onClick={() => onEdit(employee)} // ✅ Truyền cả object 'employee'
                    >
                      <i className="fas fa-pencil-alt"></i>
                    </button>
                  )}
                  {/* Nút Xóa */}
                  {onDelete && (
                    <button
                      className="btn btn-sm btn-danger"
                      title="Xóa nhân viên"
                      // ✅ Giữ lại logic confirm ở đây là hợp lý cho hành động nguy hiểm.
                      onClick={() => {
                        if (window.confirm(`Bạn có chắc muốn xóa nhân viên "${employee.fullName}"?`)) {
                          onDelete(employee.id);
                        }
                      }}
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default EmployeeTable;
