// src/hooks/useEmployees.js

import { useState, useEffect, useCallback } from 'react';
import { 
  getEmployees, 
  addEmployee, 
  updateEmployee, 
  deleteEmployee 
} from '../services/employee.js';
import { useNotification } from './useNotification.js';

/**
 * Hook tùy chỉnh để quản lý dữ liệu và logic của Nhân viên.
 * @returns {object} Trạng thái và các hàm xử lý.
 */
export const useEmployees = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { showNotification } = useNotification();

  const fetchEmployees = useCallback(async () => {
    console.log('HOOK: Bắt đầu tải danh sách nhân viên...');
    setLoading(true);
    setError(null);
    try {
      const response = await getEmployees();
      if (response.success) {
        setEmployees(response.data || []);
        console.log('HOOK: Tải danh sách nhân viên thành công.');
      } else {
        // Xử lý trường hợp server trả về success: false nhưng không phải lỗi HTTP
        throw new Error(response.message || 'Lỗi không xác định từ server.');
      }
    } catch (err) {
      // Bắt lỗi được ném từ service (do lỗi mạng, 500, hoặc success: false)
      const errorMessage = err.message || 'Không thể tải danh sách nhân viên.';
      console.error('HOOK: Lỗi khi tải danh sách nhân viên:', errorMessage);

      const userMessage = `Không thể tải dữ liệu. Lỗi: ${errorMessage}. Vui lòng liên hệ phòng CNTT để được hỗ trợ.`;
      
      setError(userMessage);
      showNotification(userMessage, 'error');
      
      // Đảm bảo danh sách nhân viên là mảng rỗng khi có lỗi để tránh crash UI
      setEmployees([]); 
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  // Tự động gọi fetchEmployees khi component được mount
  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // Hàm thêm nhân viên mới
  const handleAddEmployee = async (employeeData) => {
    try {
      const response = await addEmployee(employeeData);
      if (response.success) {
        showNotification('Thêm nhân viên mới thành công!', 'success');
        await fetchEmployees(); // Tải lại danh sách để cập nhật
        return true;
      } else {
        throw new Error(response.message || 'Thêm nhân viên thất bại.');
      }
    } catch (err) {
      console.error('HOOK: Lỗi khi thêm nhân viên:', err);
      // Hiển thị lỗi cụ thể từ server
      showNotification(`Thêm thất bại: ${err.message}`, 'error');
      return false;
    }
  };

  // Hàm cập nhật thông tin nhân viên
  const handleUpdateEmployee = async (id, employeeData) => {
    try {
      const response = await updateEmployee(id, employeeData);
      if (response.success) {
        showNotification('Cập nhật thông tin thành công!', 'success');
        await fetchEmployees();
        return true;
      } else {
        throw new Error(response.message || 'Cập nhật thất bại.');
      }
    } catch (err) {
      console.error('HOOK: Lỗi khi cập nhật nhân viên:', err);
      showNotification(`Cập nhật thất bại: ${err.message}`, 'error');
      return false;
    }
  };

  // Hàm xóa nhân viên
  const handleDeleteEmployee = async (id) => {
    try {
      const response = await deleteEmployee(id);
      if (response.success) {
        showNotification('Xóa nhân viên thành công!', 'success');
        await fetchEmployees(); // Tải lại danh sách
        return true;
      } else {
        throw new Error(response.message || 'Xóa nhân viên thất bại.');
      }
    } catch (err) {
      console.error('HOOK: Lỗi khi xóa nhân viên:', err);
      showNotification(`Xóa thất bại: ${err.message}`, 'error');
      return false;
    }
  };

  // Trả về state và các hàm để component có thể sử dụng
  return {
    employees,
    loading,
    error, // Trạng thái lỗi này có thể được dùng để hiển thị trên UI
    addEmployee: handleAddEmployee,
    updateEmployee: handleUpdateEmployee,
    deleteEmployee: handleDeleteEmployee,
    refreshEmployees: fetchEmployees,
  };
};
