import React from 'react';
import EmployeeTable from './EmployeeTable';

const EmployeeList = ({ employees, onEdit, onDelete, onAddWorkHistory, onViewWorkHistory }) => {
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
        // ✅ THÊM LẠI: Truyền tiếp props xuống EmployeeTable
        onAddWorkHistory={onAddWorkHistory}
        onViewWorkHistory={onViewWorkHistory}
      />
    </div>
  );
};

export default EmployeeList;
