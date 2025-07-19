// src/services/employee.js - PHIÊN BẢN HOÀN CHỈNH
import api from './api.js';

// ==================== EMPLOYEE CRUD ====================
export const getAllEmployees = async () => {
  try {
    const response = await api.get('/employees');
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Lấy danh sách nhân viên thất bại');
  }
};

export const addEmployee = async (employeeData) => {
  try {
    const response = await api.post('/employees', employeeData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Thêm nhân viên thất bại');
  }
};

export const updateEmployee = async (employeeId, employeeData) => {
  try {
    const response = await api.put(`/employees/${employeeId}`, employeeData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Cập nhật nhân viên thất bại');
  }
};

export const deleteEmployee = async (employeeId) => {
  try {
    const response = await api.delete(`/employees/${employeeId}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Xóa nhân viên thất bại');
  }
};

export const searchEmployees = async (query) => {
  try {
    const response = await api.get(`/employees/search?q=${encodeURIComponent(query)}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Tìm kiếm nhân viên thất bại');
  }
};

// ==================== WORK HISTORY ====================
export const getEmployeeWorkHistory = async (employeeId) => {
  try {
    const response = await api.get(`/employees/${encodeURIComponent(employeeId)}/work-history`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Lấy work history thất bại');
  }
};

export const addWorkHistory = async (workHistoryData) => {
  try {
    const response = await api.post('/employees/work-history', workHistoryData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Thêm work history thất bại');
  }
};

// ==================== RECRUITMENT ====================
export const getRecruitmentRequests = async (filters = {}) => {
  try {
    const params = new URLSearchParams(filters).toString();
    const response = await api.get(`/employees/recruitment-requests?${params}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Lấy danh sách tuyển dụng thất bại');
  }
};

// ==================== STATS ====================
export const getEmployeeStats = async () => {
  try {
    const response = await api.get('/employees/stats');
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Lấy thống kê nhân viên thất bại');
  }
};

// ==================== MASTER DATA ====================
export const getStores = async () => {
  try {
    const response = await api.get('/employees/stores');
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Lấy danh sách cửa hàng thất bại');
  }
};

export const getPositions = async () => {
  try {
    const response = await api.get('/employees/positions');
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Lấy danh sách vị trí thất bại');
  }
};
