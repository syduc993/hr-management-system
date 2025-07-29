// src/components/employee/EmployeeAddForm.jsx

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../../hooks/useNotification';
import RecruitmentModal from './RecruitmentModal';

const EmployeeAddForm = ({ onSave, isLoading: externalLoading }) => {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const fullNameInputRef = useRef(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedRecruitment, setSelectedRecruitment] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const initialFormData = {
    fullName: '',
    phoneNumber: '',
    gender: 'Nam',
    bankAccount: '',
    bankName: '',
  };

  const initialWorkHistoryData = {
    fromDate: '',
    toDate: '',
    hourlyRate: ''
  };

  const [formData, setFormData] = useState(initialFormData);
  const [workHistoryData, setWorkHistoryData] = useState(initialWorkHistoryData);

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleWorkHistoryChange = e => {
    const { name, value } = e.target;
    setWorkHistoryData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setWorkHistoryData(initialWorkHistoryData);
    setSelectedRecruitment(null);
    fullNameInputRef.current?.focus();
  };

  const handleSelectRecruitment = request => {
    setSelectedRecruitment(request);
    setIsModalOpen(false);
  };

  const handleRemoveRecruitment = () => {
    setSelectedRecruitment(null);
    setWorkHistoryData(initialWorkHistoryData);
  };

  const validateWorkHistory = () => {
    const errors = [];
    if (!workHistoryData.fromDate) errors.push('Từ ngày là bắt buộc');
    if (!workHistoryData.toDate) errors.push('Đến ngày là bắt buộc');

    if (workHistoryData.fromDate && workHistoryData.toDate) {

      const from = new Date(workHistoryData.fromDate);
      from.setHours(0, 0, 0, 0);
      const to = new Date(workHistoryData.toDate);
      to.setHours(0, 0, 0, 0);

      if (to < from) errors.push('Đến ngày phải lớn hơn hoặc bằng Từ ngày');
      // ✅ VALIDATION  - Kiểm tra khoảng ngày
      if (selectedRecruitment) {
        const start = new Date(selectedRecruitment.fromDate);
        const end = new Date(selectedRecruitment.toDate);

        if (from < start || to > end) {
          errors.push(`Khoảng thời gian phải nằm trong (${selectedRecruitment.fromDateFormatted} - ${selectedRecruitment.toDateFormatted})`);
        }
      }
    }
    // Validation mức lương/giờ
    if (workHistoryData.hourlyRate && (isNaN(workHistoryData.hourlyRate) || parseFloat(workHistoryData.hourlyRate) < 0)) {
      errors.push('Mức lương/giờ phải là số và không âm');
    }
    return errors;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!selectedRecruitment) {
      showNotification('Vui lòng chọn một đề xuất tuyển dụng.', 'warning');
      return;
    }
    const errors = validateWorkHistory();
    if (errors.length) {
      showNotification(errors.join('. '), 'warning');
      return;
    }
    if (isSubmitting) return;
    setIsSubmitting(true);

    const payload = {
      ...formData,
      workHistoryData: [{
        requestNo: selectedRecruitment.requestNo,
        fromDate: workHistoryData.fromDate,
        toDate: workHistoryData.toDate,
        hourlyRate: workHistoryData.hourlyRate
          ? parseFloat(workHistoryData.hourlyRate)
          : undefined
      }]
    };

    try {
      const success = await onSave(payload);
      if (success) {
        showNotification('Thêm nhân viên thành công!', 'success');
        resetForm();
      } else {
        showNotification('Thêm nhân viên thất bại.', 'error');
      }
    } catch (err) {
      showNotification(err.response?.data?.message || 'Lỗi hệ thống', 'error');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    fullNameInputRef.current?.focus();
  }, []);

  const loading = externalLoading || isSubmitting;

  return (
    <div className="card">
      <div className="card-header">
        <h4 className="card-title mb-0">Thêm Nhân viên Mới</h4>
      </div>
      <div className="card-body">
        <form onSubmit={handleSubmit}>
          {/* Thông tin Cá nhân */}
          <h5 className="mb-3">Thông tin Cá nhân</h5>
          <div className="row">
            <div className="col-md-6 mb-3">
              <label htmlFor="fullName" className="form-label">
                Họ tên <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                className="form-control"
                placeholder="Nhập họ tên"
                value={formData.fullName}
                onChange={handleChange}
                required
                disabled={loading}
                ref={fullNameInputRef}
              />
            </div>
            <div className="col-md-6 mb-3">
              <label htmlFor="phoneNumber" className="form-label">
                Số điện thoại <span className="text-danger">*</span>
              </label>
              <input
                type="tel"
                id="phoneNumber"
                name="phoneNumber"
                className="form-control"
                placeholder="Ví dụ: 0123456789"
                value={formData.phoneNumber}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>
          </div>
          <div className="row">
            <div className="col-md-6 mb-3">
              <label htmlFor="gender" className="form-label">
                Giới tính <span className="text-danger">*</span>
              </label>
              <select
                id="gender"
                name="gender"
                className="form-select"
                value={formData.gender}
                onChange={handleChange}
                required
                disabled={loading}
              >
                <option value="Nam">Nam</option>
                <option value="Nữ">Nữ</option>
              </select>
            </div>
            {/* Phần Mức lương/giờ mặc định đã được loại bỏ */}
          </div>

          {/* Thông tin Ngân hàng */}
          <h5 className="mb-3 mt-4">Thông tin Ngân hàng</h5>
          <div className="row">
            <div className="col-md-6 mb-3">
              <label htmlFor="bankAccount" className="form-label">
                Số tài khoản <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                id="bankAccount"
                name="bankAccount"
                className="form-control"
                placeholder="Nhập số tài khoản"
                value={formData.bankAccount}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>
            <div className="col-md-6 mb-3">
              <label htmlFor="bankName" className="form-label">
                Tên ngân hàng <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                id="bankName"
                name="bankName"
                className="form-control"
                placeholder="Ví dụ: Vietcombank"
                value={formData.bankName}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>
          </div>

          <hr className="my-4" />

          {/* Thông tin Tuyển dụng */}
          <h5 className="mb-3">Thông tin Tuyển dụng</h5>
          {selectedRecruitment ? (
            <div className="alert alert-info d-flex justify-content-between align-items-center">
              <div>
                <strong>Đề xuất:</strong> {selectedRecruitment.requestNo}<br/>
                <small className="text-muted">
                  {selectedRecruitment.department} – {selectedRecruitment.position}
                </small><br/>
                <small className="text-info">
                  {selectedRecruitment.fromDateFormatted} – {selectedRecruitment.toDateFormatted}
                </small>
              </div>
              <button
                type="button"
                className="btn-close"
                onClick={handleRemoveRecruitment}
                disabled={loading}
              />
            </div>
          ) : (
            <div className="alert alert-warning">
              <i className="fas fa-exclamation-triangle me-2"></i>
              Chưa chọn đề xuất tuyển dụng.
            </div>
          )}

          <button
            type="button"
            className={`btn ${selectedRecruitment ? 'btn-secondary' : 'btn-primary'} mb-4`}
            onClick={() => setIsModalOpen(true)}
            disabled={!!selectedRecruitment || loading}
          >
            <i className="fas fa-search me-2"></i>
            {selectedRecruitment ? 'Thay đổi Đề xuất' : 'Chọn Đề xuất Tuyển dụng'}
          </button>

          {/* Chi tiết Thời gian & Lương */}
          {selectedRecruitment && (
            <>
              <h6 className="mb-3">Chi tiết Thời gian &amp; Lương</h6>
              <div className="row mb-3">
                <div className="col-md-6">
                  <label htmlFor="fromDate" className="form-label">
                    Từ ngày <span className="text-danger">*</span>
                  </label>
                  <input
                    type="date"
                    id="fromDate"
                    name="fromDate"
                    className="form-control"
                    value={workHistoryData.fromDate}
                    onChange={handleWorkHistoryChange}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="col-md-6">
                  <label htmlFor="toDate" className="form-label">
                    Đến ngày <span className="text-danger">*</span>
                  </label>
                  <input
                    type="date"
                    id="toDate"
                    name="toDate"
                    className="form-control"
                    value={workHistoryData.toDate}
                    onChange={handleWorkHistoryChange}
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="mb-3">
                <label htmlFor="workHistoryHourlyRate" className="form-label">
                  Mức lương/giờ (VNĐ)
                </label>
                <input
                  type="number"
                  id="workHistoryHourlyRate"
                  name="hourlyRate"
                  className="form-control"
                  placeholder="Ví dụ: 30000"
                  min="0"
                  step="1000"
                  value={workHistoryData.hourlyRate}
                  onChange={handleWorkHistoryChange}
                  disabled={loading}
                />
                <small className="form-text text-muted">
                  Để trống nếu dùng mức lương mặc định, nhập số để ghi đè.
                </small>
              </div>

              { (workHistoryData.fromDate || workHistoryData.toDate) && (
                <div className="alert alert-info small">
                  <i className="fas fa-info-circle me-2"></i>
                  Khoảng thời gian phải nằm trong ({selectedRecruitment.fromDateFormatted} – {selectedRecruitment.toDateFormatted}).
                </div>
              )}
            </>
          )}

          {/* Nút hành động cuối */}
          <div className="mt-4 d-flex justify-content-end gap-2">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={resetForm}
              disabled={loading}
            >
              <i className="fas fa-sync-alt me-2"></i>Làm mới Form
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !selectedRecruitment || !workHistoryData.fromDate || !workHistoryData.toDate}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                  Đang lưu...
                </>
              ) : (
                <>
                  <i className="fas fa-save me-2"></i>
                  Lưu Nhân viên
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Modal chọn Đề xuất Tuyển dụng */}
      <RecruitmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onRecruitmentSelected={handleSelectRecruitment}
      />
    </div>
  );
};

export default EmployeeAddForm;
