import React from 'react';
import EmployeeTable from './EmployeeTable';

const EmployeeList = ({ 
  employees, 
  onEdit, 
  onDelete, 
  onAddWorkHistory, 
  onManageWorkHistory // ✅ THAY ĐỔI: Đổi tên từ onViewWorkHistory thành onManageWorkHistory
}) => {
  return (
    <div className="employee-list">
      <div className="mb-3">
        <small className="text-muted">
          Hiển thị {employees.length} kết quả
        </small>
      </div>
      <EmployeeTable
        employees={employees}
        onEdit={onEdit}
        onDelete={onDelete}
        onAddWorkHistory={onAddWorkHistory}
        onManageWorkHistory={onManageWorkHistory} // ✅ THAY ĐỔI: Truyền prop mới xuống EmployeeTable
      />
    </div>
  );
};

export default EmployeeList;
