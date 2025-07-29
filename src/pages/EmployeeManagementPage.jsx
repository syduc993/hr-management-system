import React, { useState, useMemo } from 'react';
import { useEmployees } from '../hooks/useEmployees';

// Import các components con
import EmployeeList from '../components/employee/EmployeeList.jsx';
import EmployeeAddForm from '../components/employee/EmployeeAddForm.jsx';
import EmployeeEditModal from '../components/employee/EmployeeEditModal.jsx';
// ✅ THÊM: Import các modal cho Work History
import AddWorkHistoryModal from '../components/employee/AddWorkHistoryModal.jsx';
import WorkHistoryModal from '../components/employee/WorkHistoryModal.jsx';
import Loading from '../components/common/Loading.jsx';
import Alert from '../components/common/Alert.jsx';

const EmployeeManagementPage = () => {
  const {
    employees,
    loading,
    error,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    refreshEmployees,
  } = useEmployees();

  // State cho modal chỉnh sửa
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  // ✅ CẬP NHẬT: State cho các modal Work History
  const [isAddWorkHistoryModalOpen, setAddWorkHistoryModalOpen] = useState(false);
  const [isManageWorkHistoryModalOpen, setManageWorkHistoryModalOpen] = useState(false); // ✅ THAY ĐỔI: Đổi tên từ isViewWorkHistoryModalOpen
  const [employeeForHistory, setEmployeeForHistory] = useState(null);
  
  // State cho tìm kiếm và bộ lọc
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const filteredEmployees = useMemo(() => {
    // ... (Giữ nguyên logic lọc)
    let filtered = employees;
    if (searchTerm) {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (employee) =>
          employee.fullName.toLowerCase().includes(lowerCaseSearchTerm) ||
          employee.employeeId.toLowerCase().includes(lowerCaseSearchTerm) ||
          (employee.phoneNumber && employee.phoneNumber.includes(searchTerm))
      );
    }
    if (statusFilter) {
      filtered = filtered.filter((employee) => employee.status === statusFilter);
    }
    return filtered;
  }, [employees, searchTerm, statusFilter]);

  // Các hàm xử lý sự kiện cho Nhân viên
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

  const handleAddEmployee = async (formData) => {
    return await addEmployee(formData);
  };

  // ✅ CẬP NHẬT: Các hàm xử lý cho Work History
  const handleOpenAddWorkHistoryModal = (employee) => {
    setEmployeeForHistory(employee);
    setAddWorkHistoryModalOpen(true);
  };

  // ✅ THAY ĐỔI: Đổi tên function
  const handleOpenManageWorkHistoryModal = (employee) => {
    setEmployeeForHistory(employee);
    setManageWorkHistoryModalOpen(true); // ✅ THAY ĐỔI: Sử dụng state mới
  };
  

  // ✅ THÊM: Hàm refresh data sau khi sửa work history
  const handleWorkHistoryUpdated = async () => {
    console.log('🔄 Work history updated, refreshing employee data...');
    await refreshEmployees();
  };

  const handleCloseModals = () => {
    setAddWorkHistoryModalOpen(false);
    setManageWorkHistoryModalOpen(false); // ✅ THAY ĐỔI: Cập nhật state mới
    setEmployeeForHistory(null);
  };

  // Hàm này sẽ được gọi khi thêm Work History thành công từ modal
  const handleSaveWorkHistory = () => {
    refreshEmployees(); // Tải lại danh sách để cập nhật (nếu cần)
    handleCloseModals();
  };

  const handleWorkHistoryDataChanged = () => {
    console.log('Work history đã thay đổi, đang refresh...');
    // Gọi lại API để fetch data nhân viên mới
    refreshEmployees(); // Hoặc tên hàm fetch data của bạn
  };


  return (
    <div className="container-fluid mt-4">
      <div className="page-header d-flex justify-content-between align-items-center mb-3">
        <h2>Quản lý Nhân viên</h2>
      </div>
      
      <div className="row">
        <div className="col-lg-5 mb-4">
          <EmployeeAddForm onSave={handleAddEmployee} isLoading={loading} />
        </div>
        <div className="col-lg-7">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">Danh sách nhân viên</h5>
            </div>
            <div className="card-body">
              <div className="row mb-3">
                <div className="col-md-8">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Tìm kiếm theo tên, mã NV, SĐT..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="col-md-4">
                  <select
                    className="form-select"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="">Tất cả trạng thái</option>
                    <option value="active">Hoạt động</option>
                    <option value="inactive">Ngưng hoạt động</option>
                  </select>
                </div>
              </div>

              {loading && !error && <Loading />}
              {error && <Alert message={`Lỗi: ${error}`} type="danger" onRetry={refreshEmployees} />}
              
              {!loading && !error && (
                <EmployeeList
                  employees={filteredEmployees}
                  onEdit={handleOpenEditModal}
                  onDelete={handleDeleteEmployee}
                  // ✅ CẬP NHẬT: Truyền các hàm xử lý Work History với tên mới
                  onAddWorkHistory={handleOpenAddWorkHistoryModal}
                  onManageWorkHistory={handleOpenManageWorkHistoryModal} // ✅ THAY ĐỔI: Đổi tên prop
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal chỉnh sửa nhân viên */}
      {isEditModalOpen && selectedEmployee && (
        <EmployeeEditModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSave={handleUpdateEmployee}
          employee={selectedEmployee}
        />
      )}

      {/* ✅ CẬP NHẬT: Render các modal cho Work History */}
      {isAddWorkHistoryModalOpen && employeeForHistory && (
        <AddWorkHistoryModal
          isOpen={isAddWorkHistoryModalOpen}
          onClose={handleCloseModals}
          onSave={handleSaveWorkHistory}
          employee={employeeForHistory}
        />
      )}
      
      {/* ✅ THAY ĐỔI: Sử dụng WorkHistoryModal CRUD với state và props mới */}
      {isManageWorkHistoryModalOpen && employeeForHistory && (
        <WorkHistoryModal
          isOpen={isManageWorkHistoryModalOpen}
          onClose={handleCloseModals}
          onDataUpdated={handleWorkHistoryUpdated}
          employeeId={employeeForHistory.employeeId}
          employeeName={employeeForHistory.fullName}
          onDataChanged={handleWorkHistoryDataChanged}
        />
      )}
    </div>
  );
};

export default EmployeeManagementPage;
