import React, { useState, useEffect } from 'react';
import { ApiClient } from '../../services/api';
import { useNotification } from '../../hooks/useNotification';
import EmployeeTable from './EmployeeTable';
import Loading from '../common/Loading';

const EmployeeList = () => {
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const { showNotification } = useNotification();

  useEffect(() => {
    loadEmployees();
  }, []);

  useEffect(() => {
    filterEmployees();
  }, [employees, searchTerm, statusFilter]);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      console.log('🔍 FRONTEND: Starting loadEmployees...');
      
      const response = await ApiClient.get('/api/employees');
      
      // 🚨 DEBUG: In ra toàn bộ response để xem cấu trúc
      console.log('🔍 RAW RESPONSE FROM BACKEND:', response);
      console.log('🔍 Response type:', typeof response);
      console.log('🔍 Response keys:', Object.keys(response || {}));
      
      // Kiểm tra từng thuộc tính
      if (response?.data) {
        console.log('🔍 response.data:', response.data);
        console.log('🔍 response.data type:', typeof response.data);
        console.log('🔍 response.data is Array:', Array.isArray(response.data));
        
        if (Array.isArray(response.data) && response.data.length > 0) {
          console.log('🔍 First employee in response.data:', response.data[0]);
          console.log('🔍 First employee keys:', Object.keys(response.data[0] || {}));
        }
      }
      
      if (response?.success) {
        console.log('🔍 response.success:', response.success);
      }
      
      // Xử lý dữ liệu dựa trên cấu trúc response
      let employeeData = [];
      
      if (response && response.success && Array.isArray(response.data)) {
        // Trường hợp API trả về { success: true, data: [...] }
        employeeData = response.data;
        console.log('✅ Using response.data (structured format)');
      } else if (Array.isArray(response)) {
        // Trường hợp API trả về trực tiếp array
        employeeData = response;
        console.log('✅ Using response directly (array format)');
      } else if (response && Array.isArray(response.employees)) {
        // Trường hợp API trả về { employees: [...] }
        employeeData = response.employees;
        console.log('✅ Using response.employees');
      } else {
        console.warn('⚠️ Unknown response format, using empty array');
        employeeData = [];
      }
      
      console.log('🔍 Final employeeData to set:', employeeData);
      console.log('🔍 Final employeeData length:', employeeData.length);
      
      setEmployees(employeeData);
      
    } catch (error) {
      console.error('❌ Error loading employees:', error);
      console.error('❌ Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      // Set empty array on error
      setEmployees([]);
      showNotification('Lỗi khi tải danh sách nhân viên', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filterEmployees = () => {
    // Đảm bảo employees luôn là array trước khi filter
    const safeEmployees = Array.isArray(employees) ? employees : [];
    let filtered = safeEmployees;

    if (searchTerm) {
      filtered = filtered.filter(employee => {
        // Safe check cho từng property
        const fullName = employee?.fullName || '';
        const employeeId = employee?.employeeId || '';
        const phoneNumber = employee?.phoneNumber || '';
        
        return (
          fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
          phoneNumber.includes(searchTerm)
        );
      });
    }

    if (statusFilter) {
      filtered = filtered.filter(employee => employee?.status === statusFilter);
    }

    setFilteredEmployees(filtered);
  };

  const handleEdit = async (employeeId) => {
    // TODO: Implement edit functionality
    console.log('Edit employee:', employeeId);
    showNotification('Chức năng chỉnh sửa đang được phát triển', 'info');
  };

  const handleDelete = async (employeeId) => {
    const employee = employees.find(emp => emp?.id === employeeId);
    if (!employee) return;

    const confirmed = window.confirm(`Bạn có chắc chắn muốn xóa nhân viên "${employee.fullName || 'N/A'}"?`);
    if (!confirmed) return;

    try {
      await ApiClient.delete(`/api/employees/${employeeId}`);
      
      // Remove from local state
      setEmployees(employees.filter(emp => emp?.id !== employeeId));
      showNotification('Xóa nhân viên thành công', 'success');
      
    } catch (error) {
      console.error('Error deleting employee:', error);
      showNotification('Lỗi khi xóa nhân viên', 'error');
    }
  };

  const handleAddWorkHistory = (employeeId, employeeName) => {
    // TODO: Implement add work history functionality
    console.log('Add work history for:', employeeId, employeeName);
    showNotification('Chức năng thêm work history đang được phát triển', 'info');
  };

  const handleViewWorkHistory = (employeeId) => {
    // TODO: Implement view work history functionality
    console.log('View work history for:', employeeId);
    showNotification('Chức năng xem work history đang được phát triển', 'info');
  };

  const handleRefresh = async () => {
    await loadEmployees();
    showNotification('Đã làm mới danh sách nhân viên', 'success');
  };

  if (loading) {
    return <Loading text="Đang tải danh sách nhân viên..." />;
  }

  return (
    <div className="employee-list">
      {/* Search and Filter Controls */}
      <div className="row mb-3">
        <div className="col-md-8">
          <input
            type="text"
            className="form-control"
            placeholder="Tìm kiếm nhân viên (tên, mã NV, số ĐT)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            id="employeeSearch"
          />
        </div>
        <div className="col-md-3">
          <select
            className="form-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            id="employeeStatusFilter"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="active">Hoạt động</option>
            <option value="inactive">Ngưng hoạt động</option>
          </select>
        </div>
        <div className="col-md-1">
          <button 
            className="btn btn-outline-secondary"
            onClick={handleRefresh}
            title="Làm mới"
          >
            <i className="fas fa-sync-alt"></i>
          </button>
        </div>
      </div>

      {/* Employee Count */}
      <div className="mb-3">
        <small className="text-muted">
          Hiển thị {filteredEmployees.length} / {employees.length} nhân viên
        </small>
      </div>

      {/* Debug Info - Remove this in production */}
      <div className="mb-3 p-2 bg-light border rounded">
        <small className="text-muted">
          <strong>DEBUG:</strong> employees type: {typeof employees}, isArray: {Array.isArray(employees).toString()}, length: {Array.isArray(employees) ? employees.length : 'N/A'}
        </small>
      </div>

      {/* Employee Table */}
      <EmployeeTable
        employees={filteredEmployees}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onAddWorkHistory={handleAddWorkHistory}
        onViewWorkHistory={handleViewWorkHistory}
      />
    </div>
  );
};

export default EmployeeList;
