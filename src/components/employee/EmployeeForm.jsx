// src/components/employee/EmployeeForm.jsx

import React, { useState, useEffect } from 'react';

const EmployeeForm = ({ initialData, onSubmit, onCancel, isLoading }) => {
  const [formData, setFormData] = useState(initialData);

  useEffect(() => {
    setFormData(initialData);
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="row">
        <div className="col-md-6 mb-3">
          <label className="form-label">Họ tên</label>
          <input name="fullName" value={formData.fullName} onChange={handleChange} className="form-control" required />
        </div>
        <div className="col-md-6 mb-3">
          <label className="form-label">Số điện thoại</label>
          <input name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} className="form-control" required />
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
          <input type="number" name="hourlyRate" value={formData.hourlyRate} onChange={handleChange} className="form-control" required />
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
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={isLoading}>Hủy</button>
        <button type="submit" className="btn btn-primary" disabled={isLoading}>
          {isLoading ? 'Đang lưu...' : 'Lưu'}
        </button>
      </div>
    </form>
  );
};

export default EmployeeForm;
