// src/pages/EmployeeManagementPage.jsx - REFACTORED VERSION
import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNotification } from '../hooks/useNotification';
import { useEmployees } from '../hooks/useEmployees';

// ===== SỬA: Import đúng components =====
import EmployeeTable from '../components/employee/EmployeeTable';  // ✅ SỬA: Table thay vì List
import EmployeeForm from '../components/employee/EmployeeForm';
import StoreManager from '../components/masterdata/StoreManager';
import PositionManager from '../components/masterdata/PositionManager';
import Loading from '../components/common/Loading';

// ===== THÊM: Import modal components =====
import EmployeeEditModal from '../components/employee/EmployeeEditModal';
import WorkHistoryModal from '../components/employee/WorkHistoryModal';
import AddWorkHistoryModal from '../components/employee/AddWorkHistoryModal';
import RecruitmentModal from '../components/employee/RecruitmentModal';

const EmployeeManagementPage = () => {
  const [activeTab, setActiveTab] = useState('employees');
  const [loading, setLoading] = useState(true);
  
  // ===== THÊM: Modal states =====
  const [showEditModal, setShowEditModal] = useState(false);
  const [showWorkHistoryModal, setShowWorkHistoryModal] = useState(false);
  const [showAddWorkHistoryModal, setShowAddWorkHistoryModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedEmployeeForHistory, setSelectedEmployeeForHistory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // ===== SỬA: Sử dụng hooks =====
  const { user } = useAuth();
  const { showNotification } = useNotification();
  
  // ✅ SỬA: Sử dụng useEmployees hook theo service layer pattern
  const {
    employees,
    loading: employeesLoading,
    error,
    fetchEmployees,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    searchEmployees,
    getWorkHistory,
    addWorkHistory
  } = useEmployees();

  useEffect(() => {
    checkPermissions();
    setLoading(false);
  }, []);

  const checkPermissions = () => {
    if (!user || (user.role !== 'hr' && user.role !== 'admin')) {
      showNotification('Bạn không có quyền truy cập trang này', 'error');
      window.location.href = '/dashboard';
      return;
    }
  };

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
  };

  // ===== THÊM: Employee handlers theo service layer pattern =====
  const handleDeleteEmployee = async (employeeId) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa nhân viên này?')) {
      try {
        await deleteEmployee(employeeId);
        // Success notification đã được handle trong hook
      } catch (error) {
        console.error('Delete employee error:', error);
        // Error notification đã được handle trong hook
      }
    }
  };

  const handleEditEmployee = (employeeId) => {
    const employee = employees.find(emp => emp.id === employeeId);
    if (employee) {
      setSelectedEmployee(employee);
      setShowEditModal(true);
    } else {
      showNotification('Không tìm thấy thông tin nhân viên', 'error');
    }
  };

  const handleEmployeeUpdated = async () => {
    setShowEditModal(false);
    setSelectedEmployee(null);
    // employees sẽ được tự động refresh bởi hook
  };

  const handleViewWorkHistory = async (employeeId) => {
    const employee = employees.find(emp => emp.employeeId === employeeId);
    if (!employee) {
      showNotification('Không tìm thấy thông tin nhân viên', 'error');
      return;
    }

    setSelectedEmployeeForHistory({ 
      employeeId, 
      name: employee.fullName,
      workHistory: null 
    });
    
    try {
      const workHistory = await getWorkHistory(employeeId);
      setSelectedEmployeeForHistory(prev => ({ 
        ...prev, 
        workHistory 
      }));
    } catch (error) {
      console.error('Error loading work history:', error);
      // Error đã được handle trong hook
    }
    
    setShowWorkHistoryModal(true);
  };

  const handleAddWorkHistory = (employeeId, employeeName) => {
    setSelectedEmployeeForHistory({ 
      employeeId, 
      name: employeeName 
    });
    setShowAddWorkHistoryModal(true);
  };

  const handleWorkHistoryAdded = async () => {
    setShowAddWorkHistoryModal(false);
    setSelectedEmployeeForHistory(null);
    // Refresh employees nếu cần
    await fetchEmployees();
  };

  const handleEmployeeAdded = (response) => {
    console.log('Employee added successfully:', response);
    // employees sẽ được tự động refresh bởi hook
  };

  // ===== THÊM: Search handlers =====
  const handleSearch = async (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      await searchEmployees(searchQuery);
    } else {
      await fetchEmployees();
    }
  };

  const handleSearchInputChange = (e) => {
    setSearchQuery(e.target.value);
    if (e.target.value === '') {
      fetchEmployees();
    }
  };

  const handleRefresh = () => {
    fetchEmployees();
    showNotification('Đã làm mới dữ liệu', 'success');
  };

  if (loading) {
    return <Loading fullScreen text="Đang tải trang quản lý nhân viên..." />;
  }

  return (
    <div className="employee-management-page">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1>Quản lý nhân viên</h1>
          <p className="text-muted mb-0">Quản lý thông tin nhân viên, cửa hàng và vị trí</p>
        </div>
        <div>
          <button 
            className="btn btn-outline-primary me-2"
            onClick={handleRefresh}
            disabled={employeesLoading}
          >
            <i className={`fas fa-sync-alt me-2 ${employeesLoading ? 'fa-spin' : ''}`}></i>
            Làm mới
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'employees' ? 'active' : ''}`}
            onClick={() => handleTabClick('employees')}
          >
            <i className="fas fa-users me-2"></i>
            Nhân viên
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'stores' ? 'active' : ''}`}
            onClick={() => handleTabClick('stores')}
          >
            <i className="fas fa-store me-2"></i>
            Cửa hàng
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'positions' ? 'active' : ''}`}
            onClick={() => handleTabClick('positions')}
          >
            <i className="fas fa-briefcase me-2"></i>
            Vị trí
          </button>
        </li>
      </ul>

      {/* Tab Content */}
      <div className="tab-content">
        {/* Employees Tab */}
        {activeTab === 'employees' && (
          <div className="tab-pane fade show active">
            {/* ===== THÊM: Search Section ===== */}
            <div className="row mb-4">
              <div className="col-12">
                <div className="card">
                  <div className="card-body">
                    <form onSubmit={handleSearch} className="d-flex gap-2">
                      <div className="flex-grow-1">
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Tìm kiếm nhân viên theo tên, mã nhân viên, số điện thoại..."
                          value={searchQuery}
                          onChange={handleSearchInputChange}
                        />
                      </div>
                      <button 
                        type="submit" 
                        className="btn btn-outline-primary"
                        disabled={employeesLoading}
                      >
                        <i className="fas fa-search"></i>
                      </button>
                      <button 
                        type="button" 
                        className="btn btn-outline-secondary"
                        onClick={() => {
                          setSearchQuery('');
                          fetchEmployees();
                        }}
                        disabled={employeesLoading}
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-md-4">
                <div className="card">
                  <div className="card-header">
                    <h5>Thêm nhân viên mới</h5>
                  </div>
                  <div className="card-body">
                    <EmployeeForm onEmployeeAdded={handleEmployeeAdded} />
                  </div>
                </div>
              </div>
              <div className="col-md-8">
                <div className="card">
                  <div className="card-header d-flex justify-content-between align-items-center">
                    <h5>Danh sách nhân viên</h5>
                    {employees.length > 0 && (
                      <span className="badge bg-primary">
                        {employees.length} nhân viên
                      </span>
                    )}
                  </div>
                  <div className="card-body">
                    {/* ===== SỬA: Hiển thị loading và error states ===== */}
                    {employeesLoading ? (
                      <div className="text-center py-4">
                        <div className="spinner-border" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                        <p className="mt-2 text-muted">Đang tải danh sách nhân viên...</p>
                      </div>
                    ) : error ? (
                      <div className="alert alert-danger" role="alert">
                        <i className="fas fa-exclamation-triangle me-2"></i>
                        {error}
                        <button 
                          className="btn btn-sm btn-outline-danger ms-2"
                          onClick={fetchEmployees}
                        >
                          <i className="fas fa-redo me-1"></i>
                          Thử lại
                        </button>
                      </div>
                    ) : (
                      /* ===== SỬA: Sử dụng EmployeeTable với handlers ===== */
                      <EmployeeTable
                        employees={employees}
                        onEdit={handleEditEmployee}
                        onDelete={handleDeleteEmployee}
                        onAddWorkHistory={handleAddWorkHistory}
                        onViewWorkHistory={handleViewWorkHistory}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stores Tab */}
        {activeTab === 'stores' && (
          <div className="tab-pane fade show active">
            <StoreManager />
          </div>
        )}

        {/* Positions Tab */}
        {activeTab === 'positions' && (
          <div className="tab-pane fade show active">
            <PositionManager />
          </div>
        )}
      </div>

      {/* ===== THÊM: Modal Components ===== */}
      {/* Employee Edit Modal */}
      {showEditModal && selectedEmployee && (
        <EmployeeEditModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedEmployee(null);
          }}
          employee={selectedEmployee}
          onEmployeeUpdated={handleEmployeeUpdated}
        />
      )}

      {/* Work History View Modal */}
      {showWorkHistoryModal && selectedEmployeeForHistory && (
        <WorkHistoryModal
          isOpen={showWorkHistoryModal}
          onClose={() => {
            setShowWorkHistoryModal(false);
            setSelectedEmployeeForHistory(null);
          }}
          employeeId={selectedEmployeeForHistory.employeeId}
          employeeName={selectedEmployeeForHistory.name}
          workHistory={selectedEmployeeForHistory.workHistory}
        />
      )}

      {/* Add Work History Modal */}
      {showAddWorkHistoryModal && selectedEmployeeForHistory && (
        <AddWorkHistoryModal
          isOpen={showAddWorkHistoryModal}
          onClose={() => {
            setShowAddWorkHistoryModal(false);
            setSelectedEmployeeForHistory(null);
          }}
          employeeId={selectedEmployeeForHistory.employeeId}
          employeeName={selectedEmployeeForHistory.name}
          onWorkHistoryAdded={handleWorkHistoryAdded}
        />
      )}
    </div>
  );
};

export default EmployeeManagementPage;
