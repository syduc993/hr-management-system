// src/components/employee/EmployeeEditModal.jsx
import React, { useState, useEffect } from 'react';
import { updateEmployee } from '../../services/employee.js';
import { useNotification } from '../../hooks/useNotification';
import { ButtonLoading } from '../common/Loading';
import Modal from '../common/Modal';

const EmployeeEditModal = ({ isOpen, onClose, employee, onEmployeeUpdated }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    gender: '',
    hourlyRate: '',
    bankAccount: '',
    bankName: '',
    status: 'active'
  });
  const [formErrors, setFormErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { showNotification } = useNotification();

  // Load employee data when modal opens
  useEffect(() => {
    if (employee && isOpen) {
      setFormData({
        fullName: employee.fullName || '',
        phoneNumber: employee.phoneNumber || '',
        gender: employee.gender || '',
        hourlyRate: employee.hourlyRate || '',
        bankAccount: employee.bankAccount || '',
        bankName: employee.bankName || '',
        status: employee.status || 'active'
      });
      setFormErrors({});
    }
  }, [employee, isOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Họ tên là bắt buộc';
    }
    
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Số điện thoại là bắt buộc';
    } else if (!/^\d{10,11}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Số điện thoại không hợp lệ';
    }
    
    if (!formData.gender) {
      newErrors.gender = 'Giới tính là bắt buộc';
    }
    
    if (!formData.hourlyRate || parseFloat(formData.hourlyRate) <= 0) {
      newErrors.hourlyRate = 'Mức lương/giờ phải lớn hơn 0';
    }
    
    if (!formData.bankAccount.trim()) {
      newErrors.bankAccount = 'Số tài khoản là bắt buộc';
    }
    
    if (!formData.bankName.trim()) {
      newErrors.bankName = 'Ngân hàng là bắt buộc';
    }

    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showNotification('Vui lòng kiểm tra lại thông tin!', 'error');
      return;
    }

    setLoading(true);
    
    try {
      const updateData = {
        ...formData,
        hourlyRate: parseFloat(formData.hourlyRate)
      };

      const response = await updateEmployee(employee.id, updateData);
      
      if (response.success) {
        showNotification('Cập nhật nhân viên thành công!', 'success');
        onEmployeeUpdated?.();
        onClose();
      } else {
        showNotification(response.message || 'Lỗi khi cập nhật nhân viên', 'error');
      }
      
    } catch (error) {
      console.error('❌ Error updating employee:', error);
      showNotification(error.message || 'Lỗi kết nối đến server. Vui lòng thử lại.', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      title={`Chỉnh sửa nhân viên: ${employee?.fullName || ''}`}
      size="lg"
    >
      <form onSubmit={handleSubmit}>
        <div className="row">
          <div className="col-md-6">
            <div className="mb-3">
              <label className="form-label">Họ tên *</label>
              <input
                type="text"
                className={`form-control ${formErrors.fullName ? 'is-invalid' : ''}`}
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
              />
              {formErrors.fullName && <div className="invalid-feedback">{formErrors.fullName}</div>}
            </div>
          </div>
          
          <div className="col-md-6">
            <div className="mb-3">
              <label className="form-label">Số điện thoại *</label>
              <input
                type="tel"
                className={`form-control ${formErrors.phoneNumber ? 'is-invalid' : ''}`}
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
              />
              {formErrors.phoneNumber && <div className="invalid-feedback">{formErrors.phoneNumber}</div>}
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col-md-6">
            <div className="mb-3">
              <label className="form-label">Giới tính *</label>
              <select
                className={`form-select ${formErrors.gender ? 'is-invalid' : ''}`}
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
              >
                <option value="">Chọn giới tính</option>
                <option value="Nam">Nam</option>
                <option value="Nữ">Nữ</option>
              </select>
              {formErrors.gender && <div className="invalid-feedback">{formErrors.gender}</div>}
            </div>
          </div>
          
          <div className="col-md-6">
            <div className="mb-3">
              <label className="form-label">Mức lương/giờ (VNĐ) *</label>
              <input
                type="number"
                className={`form-control ${formErrors.hourlyRate ? 'is-invalid' : ''}`}
                name="hourlyRate"
                value={formData.hourlyRate}
                onChange={handleInputChange}
                min="0"
                step="1000"
              />
              {formErrors.hourlyRate && <div className="invalid-feedback">{formErrors.hourlyRate}</div>}
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col-md-6">
            <div className="mb-3">
              <label className="form-label">Số tài khoản *</label>
              <input
                type="text"
                className={`form-control ${formErrors.bankAccount ? 'is-invalid' : ''}`}
                name="bankAccount"
                value={formData.bankAccount}
                onChange={handleInputChange}
              />
              {formErrors.bankAccount && <div className="invalid-feedback">{formErrors.bankAccount}</div>}
            </div>
          </div>
          
          <div className="col-md-6">
            <div className="mb-3">
              <label className="form-label">Ngân hàng *</label>
              <input
                type="text"
                className={`form-control ${formErrors.bankName ? 'is-invalid' : ''}`}
                name="bankName"
                value={formData.bankName}
                onChange={handleInputChange}
              />
              {formErrors.bankName && <div className="invalid-feedback">{formErrors.bankName}</div>}
            </div>
          </div>
        </div>

        <div className="mb-3">
          <label className="form-label">Trạng thái</label>
          <select
            className="form-select"
            name="status"
            value={formData.status}
            onChange={handleInputChange}
          >
            <option value="active">Hoạt động</option>
            <option value="inactive">Ngưng hoạt động</option>
          </select>
        </div>

        <div className="d-flex gap-2 justify-content-end">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Hủy
          </button>
          <ButtonLoading
            type="submit"
            className="btn btn-primary"
            loading={loading}
            disabled={loading}
          >
            {loading ? 'Đang cập nhật...' : 'Cập nhật'}
          </ButtonLoading>
        </div>
      </form>
    </Modal>
  );
};

export default EmployeeEditModal;
