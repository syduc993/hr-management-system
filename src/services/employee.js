import { ApiClient } from './api.js';

/**
 * Service layer để quản lý các API liên quan đến Nhân viên.
 */
export const employeeService = {
  /**
   * Lấy danh sách tất cả nhân viên.
   * @returns {Promise<object>} Response từ API.
   */
  getAll() {
    console.log('SERVICE (FE): Gọi API lấy danh sách nhân viên...');
    return ApiClient.get('/api/employees');
  },

  /**
   * Thêm một nhân viên mới.
   * @param {object} employeeData - Dữ liệu của nhân viên mới.
   * @returns {Promise<object>} Response từ API.
   */
  create(employeeData) {
    console.log('SERVICE (FE): Gọi API thêm nhân viên mới...', employeeData);
    return ApiClient.post('/api/employees', employeeData);
  },

  /**
   * Cập nhật thông tin một nhân viên.
   * @param {string} id - ID của nhân viên (record_id từ Lark).
   * @param {object} employeeData - Dữ liệu cần cập nhật.
   * @returns {Promise<object>} Response từ API.
   */
  update(id, employeeData) {
    console.log(`SERVICE (FE): Gọi API cập nhật nhân viên ID: ${id}...`, employeeData);
    return ApiClient.put(`/api/employees/${id}`, employeeData);
  },

  /**
   * Xóa một nhân viên.
   * @param {string} id - ID của nhân viên (record_id từ Lark).
   * @returns {Promise<object>} Response từ API.
   */
  remove(id) {
    console.log(`SERVICE (FE): Gọi API xóa nhân viên ID: ${id}...`);
    return ApiClient.delete(`/api/employees/${id}`);
  },

  /**
   * Lấy danh sách các đề xuất tuyển dụng đã được duyệt.
   * @returns {Promise<object>} Response từ API.
   */
  getApprovedRecruitmentRequests() {
    console.log('SERVICE (FE): Gọi API lấy danh sách đề xuất tuyển dụng...');
    
    return ApiClient.get('/api/recruitment', {
      params: {
        status: 'Đang tuyển dụng'
      }
    });
  }
};
