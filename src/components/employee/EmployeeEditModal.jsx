// src/components/employee/EmployeeEditModal.jsx

import React, { useState, useEffect } from 'react';
// ✅ SỬA 1: Import cả object `employeeService` thay vì từng hàm lẻ
import { employeeService } from '../../services/employee.js';
import { useNotification } from '../../hooks/useNotification';
import Modal from '../common/Modal.jsx';

// Component này chỉ nhận props và gọi hàm `onSave` từ page cha
// Nó không cần biết logic update đến từ đâu
const EmployeeEditModal = ({ isOpen, onClose, onSave, employee }) => {
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const { showNotification } = useNotification();

  useEffect(() => {
    if (employee) {
      setFormData({
        fullName: employee.fullName || '',
        phoneNumber: employee.phoneNumber || '',
        gender: employee.gender || '',
        hourlyRate: employee.hourlyRate || '',
        bankAccount: employee.bankAccount || '',
        bankName: employee.bankName || '',
        status: employee.status || 'active',
      });
    }
  }, [employee]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    // ✅ SỬA 2: Gọi hàm onSave được truyền từ page cha,
    // page cha (EmployeeManagementPage) sẽ gọi hook useEmployees để update
    await onSave(formData);
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Chỉnh sửa: ${employee.fullName}`}
    >
      <form onSubmit={handleSubmit}>
        {/* Các trường input trong form giữ nguyên */}
        <div className="row">
          <div className="col-md-6 mb-3">
            <label className="form-label">Họ tên</label>
            <input name="fullName" value={formData.fullName} onChange={handleChange} className="form-control" />
          </div>
          <div className="col-md-6 mb-3">
            <label className="form-label">Số điện thoại</label>
            <input name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} className="form-control" />
          </div>
        </div>
        <div className="row">
          <div className="col-md-6 mb-3">
            <label className="form-label">Giới tính</label>
            <select name="gender" value={formData.gender} onChange={handleChange} className="form-select">
              <option value="Nam">Nam</option>
              <option value="Nữ">Nữ</option>
            </select>
          </div>
          <div className="col-md-6 mb-3">
            <label className="form-label">Lương/giờ</label>
            <input type="number" name="hourlyRate" value={formData.hourlyRate} onChange={handleChange} className="form-control" />
          </div>
        </div>
        <div className="row">
          <div className="col-md-6 mb-3">
            <label className="form-label">Số tài khoản</label>
            <input name="bankAccount" value={formData.bankAccount} onChange={handleChange} className="form-control" />
          </div>
          <div className="col-md-6 mb-3">
            <label className="form-label">Ngân hàng</label>
            <input name="bankName" value={formData.bankName} onChange={handleChange} className="form-control" />
          </div>
        </div>
        <div className="mb-3">
          <label className="form-label">Trạng thái</label>
          <select name="status" value={formData.status} onChange={handleChange} className="form-select">
            <option value="active">Hoạt động</option>
            <option value="inactive">Ngưng hoạt động</option>
          </select>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Hủy</button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default EmployeeEditModal;
