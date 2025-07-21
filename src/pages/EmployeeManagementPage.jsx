// src/pages/EmployeeManagementPage.jsx

import React, { useState, useMemo } from 'react';
import { useEmployees } from '../hooks/useEmployees';

// Import các components con
import EmployeeList from '../components/employee/EmployeeList.jsx';
import EmployeeEditModal from '../components/employee/EmployeeEditModal.jsx';
import EmployeeAddForm from '../components/employee/EmployeeAddForm.jsx'; // ✅ Import form mới
import Loading from '../components/common/Loading.jsx';
import { Alert } from '../components/common/Alert.jsx';

const EmployeeManagementPage = () => {
  const {
    employees,
    loading,
    error,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    refreshEmployees, // Lấy hàm refresh từ hook
  } = useEmployees();

  // State cho modal chỉnh sửa và ô tìm kiếm
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // ✅ Logic tìm kiếm được gom về một nơi duy nhất
  const filteredEmployees = useMemo(() => {
    if (!searchTerm) return employees;
    return employees.filter(
      (employee) =>
        employee.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.employeeId.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [employees, searchTerm]);

  // Các hàm xử lý cho Sửa và Xóa (giữ nguyên)
  const handleOpenEditModal = (employee) => {
    setSelectedEmployee(employee);
    setIsEditModalOpen(true);
  };

  const handleUpdateEmployee = async (employeeData) => {
    if (!selectedEmployee) return;
    const success = await updateEmployee(selectedEmployee.id, employeeData);
    if (success) {
      setIsEditModalOpen(false);
      setSelectedEmployee(null);
    }
  };

  const handleDeleteEmployee = async (id) => {
    await deleteEmployee(id);
  };

  // ✅ Hàm xử lý cho Thêm mới, gọi thẳng hàm từ hook
  const handleAddEmployee = async (formData) => {
    // Hook 'addEmployee' đã bao gồm loading, notification và refresh lại list
    await addEmployee(formData);
  };

  return (
    <div className="container-fluid mt-4">
      <div className="page-header d-flex justify-content-between align-items-center mb-3">
        <h2>Quản lý Nhân viên</h2>
        {/* Nút refresh để tải lại dữ liệu khi cần */}
        <button className="btn btn-outline-secondary" onClick={refreshEmployees} disabled={loading}>
          <i className="bi bi-arrow-clockwise me-2"></i>Làm mới
        </button>
      </div>
      
      {/* ✅ Bố cục 2 cột */}
      <div className="row">
        {/* Cột trái: Form thêm nhân viên */}
        <div className="col-lg-5">
          <EmployeeAddForm onSave={handleAddEmployee} isLoading={loading} />
        </div>

        {/* Cột phải: Danh sách và tìm kiếm */}
        <div className="col-lg-7">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">Danh sách nhân viên</h5>
            </div>
            <div className="card-body">
              {/* ✅ Chỉ có một ô tìm kiếm ở đây */}
              <div className="mb-3">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Tìm kiếm theo tên hoặc mã nhân viên..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Hiển thị trạng thái Loading và Error */}
              {loading && !error && <Loading />}
              {error && <Alert message={`Lỗi: ${error}`} type="danger" onRetry={refreshEmployees} />}
              
              {!loading && !error && (
                <EmployeeList
                  employees={filteredEmployees}
                  onEdit={handleOpenEditModal}
                  onDelete={handleDeleteEmployee}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal chỉnh sửa vẫn được giữ lại */}
      {isEditModalOpen && selectedEmployee && (
        <EmployeeEditModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSave={handleUpdateEmployee}
          employee={selectedEmployee}
        />
      )}
    </div>
  );
};

export default EmployeeManagementPage;
