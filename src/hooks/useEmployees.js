// src/hooks/useEmployees.js - ĐÃ REFACTOR

import { useState, useEffect, useCallback } from 'react';
import { employeeService } from '../services/employee.js';
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

  /**
   * Hàm để tải danh sách nhân viên từ server.
   * Sử dụng useCallback để tránh việc tạo lại hàm một cách không cần thiết.
   */
  const fetchEmployees = useCallback(async () => {
    console.log('HOOK: Bắt đầu tải danh sách nhân viên...');
    setLoading(true);
    setError(null);
    try {
      const response = await employeeService.getAll();
      if (response.success) {
        setEmployees(response.data || []);
        console.log('HOOK: Tải danh sách nhân viên thành công.', response.data);
      } else {
        throw new Error(response.message || 'Không thể tải danh sách nhân viên.');
      }
    } catch (err) {
      console.error('HOOK: Lỗi khi tải danh sách nhân viên:', err);
      setError(err.message);
      showNotification(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [showNotification]); // Phụ thuộc vào showNotification

  // Tự động gọi fetchEmployees khi component được mount lần đầu
  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]); // Phụ thuộc vào hàm fetchEmployees đã được useCallback

  /**
   * Hàm để thêm một nhân viên mới.
   */
  const addEmployee = async (employeeData) => {
      try {
          setLoading(true);
          const response = await employeeService.create(employeeData);
          if (response.success) {
              showNotification('Thêm nhân viên mới thành công!', 'success');
              await fetchEmployees(); // fetchEmployees tự handle loading
              return true;
          } else {
              throw new Error(response.message || 'Thêm nhân viên thất bại.');
          }
      } catch (err) {
          console.error('HOOK: Lỗi khi thêm nhân viên:', err);
          showNotification(err.message, 'error');
          setLoading(false); // Chỉ set loading false khi error
          return false;
      }
  };


  /**
   * Hàm để cập nhật thông tin nhân viên.
   */
  const updateEmployee = async (id, employeeData) => {
    setLoading(true);
    try {
      const response = await employeeService.update(id, employeeData);
      if (response.success) {
        showNotification('Cập nhật thông tin nhân viên thành công!', 'success');
        await fetchEmployees(); // Tải lại danh sách
        return true;
      } else {
        throw new Error(response.message || 'Cập nhật thất bại.');
      }
    } catch (err) {
      console.error('HOOK: Lỗi khi cập nhật nhân viên:', err);
      showNotification(err.message, 'error');
      setLoading(false);
      return false;
    }
  };

  /**
   * Hàm để xóa nhân viên.
   */
  const deleteEmployee = async (id) => {
    setLoading(true);
    try {
      const response = await employeeService.remove(id);
      if (response.success) {
        showNotification('Xóa nhân viên thành công!', 'success');
        await fetchEmployees(); // Tải lại danh sách
        return true;
      } else {
        throw new Error(response.message || 'Xóa nhân viên thất bại.');
      }
    } catch (err) {
      console.error('HOOK: Lỗi khi xóa nhân viên:', err);
      showNotification(err.message, 'error');
      setLoading(false);
      return false;
    }
  };

  // Trả về state và các hàm để component có thể sử dụng
  return {
    employees,
    loading,
    error,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    refreshEmployees: fetchEmployees, // Cung cấp hàm để refresh thủ công nếu cần
  };
};
