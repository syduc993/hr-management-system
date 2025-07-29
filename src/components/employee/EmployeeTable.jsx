import React from 'react';

const EmployeeTable = ({ 
  employees, 
  onEdit, 
  onDelete, 
  onAddWorkHistory, 
  onManageWorkHistory
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
            <th>Tài khoản</th>
            <th>Ngân hàng</th>
            <th>Trạng thái</th>
            <th className="text-center" style={{ minWidth: '180px' }}>Thao tác</th> {/* ✅ TĂNG chiều rộng cho thêm nút */}
          </tr>
        </thead>
        <tbody>
          {employees.map((employee) => (
            <tr key={employee.id}>
              <td>{employee.employeeId || 'N/A'}</td>
              <td>{employee.fullName || 'N/A'}</td>
              <td>{employee.phoneNumber || 'N/A'}</td>
              <td>{employee.gender || 'N/A'}</td>
              <td>{employee.bankAccount || 'N/A'}</td>
              <td>{employee.bankName || 'N/A'}</td>
              <td>
                <span className={`badge ${employee.status === 'active' ? 'bg-success' : 'bg-secondary'}`}>
                  {employee.status === 'active' ? 'Hoạt động' : 'Ngưng'}
                </span>
              </td>
              <td className="text-center">
                <div className="btn-group" role="group">
                  {/* ✅ GIỮ LẠI: Nút Thêm Work History */}
                  {onAddWorkHistory && (
                    <button
                      className="btn btn-sm btn-success"
                      title="Thêm Lịch sử công việc"
                      onClick={() => onAddWorkHistory(employee)}
                    >
                      <i className="fas fa-plus-circle"></i>
                    </button>
                  )}
                  
                  {/* ✅ THAY ĐỔI: Nút Quản lý Work History (thay thế nút Xem) */}
                  {onManageWorkHistory && (
                    <button
                      className="btn btn-sm btn-primary" // ✅ THAY ĐỔI: Đổi màu từ info sang primary
                      title="Quản lý Lịch sử công việc" // ✅ THAY ĐỔI: Đổi tooltip
                      onClick={() => onManageWorkHistory(employee)}
                    >
                      <i className="fas fa-cogs"></i> {/* ✅ THAY ĐỔI: Đổi icon từ history sang cogs */}
                    </button>
                  )}
                  
                  {/* ✅ GIỮ LẠI: Nút Sửa */}
                  {onEdit && (
                     <button
                      className="btn btn-sm btn-warning" // ✅ THAY ĐỔI: Đổi màu từ primary sang warning để phân biệt
                      title="Sửa thông tin"
                      onClick={() => onEdit(employee)}
                    >
                      <i className="fas fa-pencil-alt"></i>
                    </button>
                  )}
                  
                  {/* ✅ GIỮ LẠI: Nút Xóa */}
                  {onDelete && (
                    <button
                      className="btn btn-sm btn-danger"
                      title="Xóa nhân viên"
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
