// src/components/employee/EmployeeForm.jsx
import React, { useState, useEffect } from 'react';
import { addEmployee } from '../../services/employee.js';
import { useNotification } from '../../hooks/useNotification';
import { ButtonLoading } from '../common/Loading';
import RecruitmentModal from './RecruitmentModal';

const EmployeeForm = ({ onEmployeeAdded }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    gender: '',
    hourlyRate: '',
    bankAccount: '',
    bankName: ''
  });
  const [selectedRecruitments, setSelectedRecruitments] = useState([]);
  const [showRecruitmentModal, setShowRecruitmentModal] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { showNotification } = useNotification();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleRecruitmentSelect = (recruitments) => {
    setSelectedRecruitments(recruitments);
    // Clear work history error when recruitment is selected
    if (formErrors.workHistoryData) {
      setFormErrors(prev => ({
        ...prev,
        workHistoryData: ''
      }));
    }
  };

  const removeRecruitment = (requestNoToRemove) => {
    const updated = selectedRecruitments.filter(r => r.requestNo !== requestNoToRemove);
    setSelectedRecruitments(updated);
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Họ tên là bắt buộc';
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Họ tên phải có ít nhất 2 ký tự';
    }
    
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Số điện thoại là bắt buộc';
    } else if (!/^\d{10,11}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Số điện thoại không hợp lệ';
    }
    
    if (!formData.gender) {
      newErrors.gender = 'Giới tính là bắt buộc';
    }
    
    if (!formData.hourlyRate) {
      newErrors.hourlyRate = 'Mức lương/giờ là bắt buộc';
    } else if (isNaN(formData.hourlyRate) || parseFloat(formData.hourlyRate) <= 0) {
      newErrors.hourlyRate = 'Mức lương/giờ phải là số dương';
    }
    
    if (!formData.bankAccount.trim()) {
      newErrors.bankAccount = 'Số tài khoản là bắt buộc';
    }
    
    if (!formData.bankName.trim()) {
      newErrors.bankName = 'Ngân hàng là bắt buộc';
    }

    // Validate recruitment selection
    if (selectedRecruitments.length === 0) {
      newErrors.workHistoryData = 'Vui lòng chọn ít nhất một đề xuất tuyển dụng';
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
      const employeeData = {
        ...formData,
        hourlyRate: parseFloat(formData.hourlyRate),
        workHistoryData: selectedRecruitments.map(r => ({ requestNo: r.requestNo }))
      };

      console.log('📤 Sending employee data:', employeeData);

      // ✅ SỬA: Gọi qua service
      const response = await addEmployee(employeeData);
      
      if (response.success) {
        showNotification('Thêm nhân viên thành công!', 'success');
        
        // Reset form
        setFormData({
          fullName: '',
          phoneNumber: '',
          gender: '',
          hourlyRate: '',
          bankAccount: '',
          bankName: ''
        });
        setSelectedRecruitments([]);
        setFormErrors({});
        
        // Callback to parent
        if (onEmployeeAdded) {
          onEmployeeAdded(response);
        }
      } else {
        handleFormError(response);
      }
      
    } catch (error) {
      console.error('❌ Error adding employee:', error);
      showNotification(error.message || 'Lỗi kết nối đến server. Vui lòng thử lại.', 'error');
    } finally {
      setLoading(false);
    }
  };


  const handleFormError = (response) => {
    if (response.errorCode === 'DUPLICATE_EMPLOYEE_ID') {
      showNotification(
        '⚠️ Mã nhân viên đã tồn tại!\n\n' +
        'Nhân viên với tên và số điện thoại này đã có trong hệ thống.\n' +
        'Vui lòng kiểm tra lại hoặc sử dụng thông tin khác.', 
        'error'
      );
      
      setFormErrors({
        fullName: 'Tên đã tồn tại',
        phoneNumber: 'Số điện thoại đã tồn tại'
      });
    } else if (response.errorCode === 'DUPLICATE_REQUEST_NO') {
      showNotification('Không được trùng lặp Request No. trong work history!', 'error');
      setFormErrors({ workHistoryData: 'Request No. bị trùng lặp' });
    } else if (response.errorCode === 'WORK_HISTORY_REQUIRED') {
      showNotification('Vui lòng chọn ít nhất một đề xuất tuyển dụng', 'error');
      setFormErrors({ workHistoryData: 'Vui lòng chọn ít nhất một đề xuất tuyển dụng' });
    } else {
      showNotification(response.message || 'Lỗi khi thêm nhân viên', 'error');
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} id="employeeForm">
        {/* Basic Information */}
        <div className="mb-3">
          <label htmlFor="fullName" className="form-label">
            Họ tên <span className="text-danger">*</span>
          </label>
          <input
            type="text"
            className={`form-control ${formErrors.fullName ? 'is-invalid' : ''}`}
            id="fullName"
            name="fullName"
            value={formData.fullName}
            onChange={handleInputChange}
            required
          />
          {formErrors.fullName && (
            <div className="invalid-feedback">{formErrors.fullName}</div>
          )}
        </div>

        <div className="mb-3">
          <label htmlFor="phoneNumber" className="form-label">
            Số điện thoại <span className="text-danger">*</span>
          </label>
          <input
            type="tel"
            className={`form-control ${formErrors.phoneNumber ? 'is-invalid' : ''}`}
            id="phoneNumber"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleInputChange}
            required
          />
          {formErrors.phoneNumber && (
            <div className="invalid-feedback">{formErrors.phoneNumber}</div>
          )}
        </div>

        <div className="mb-3">
          <label htmlFor="gender" className="form-label">
            Giới tính <span className="text-danger">*</span>
          </label>
          <select
            className={`form-select ${formErrors.gender ? 'is-invalid' : ''}`}
            id="gender"
            name="gender"
            value={formData.gender}
            onChange={handleInputChange}
            required
          >
            <option value="">Chọn giới tính</option>
            <option value="Nam">Nam</option>
            <option value="Nữ">Nữ</option>
          </select>
          {formErrors.gender && (
            <div className="invalid-feedback">{formErrors.gender}</div>
          )}
        </div>

        <div className="mb-3">
          <label htmlFor="hourlyRate" className="form-label">
            Mức lương/giờ (VNĐ) <span className="text-danger">*</span>
          </label>
          <input
            type="number"
            className={`form-control ${formErrors.hourlyRate ? 'is-invalid' : ''}`}
            id="hourlyRate"
            name="hourlyRate"
            value={formData.hourlyRate}
            onChange={handleInputChange}
            min="0"
            step="1000"
            required
          />
          {formErrors.hourlyRate && (
            <div className="invalid-feedback">{formErrors.hourlyRate}</div>
          )}
        </div>

        <div className="mb-3">
          <label htmlFor="bankAccount" className="form-label">
            Số tài khoản <span className="text-danger">*</span>
          </label>
          <input
            type="text"
            className={`form-control ${formErrors.bankAccount ? 'is-invalid' : ''}`}
            id="bankAccount"
            name="bankAccount"
            value={formData.bankAccount}
            onChange={handleInputChange}
            required
          />
          {formErrors.bankAccount && (
            <div className="invalid-feedback">{formErrors.bankAccount}</div>
          )}
        </div>

        <div className="mb-3">
          <label htmlFor="bankName" className="form-label">
            Ngân hàng <span className="text-danger">*</span>
          </label>
          <input
            type="text"
            className={`form-control ${formErrors.bankName ? 'is-invalid' : ''}`}
            id="bankName"
            name="bankName"
            value={formData.bankName}
            onChange={handleInputChange}
            required
          />
          {formErrors.bankName && (
            <div className="invalid-feedback">{formErrors.bankName}</div>
          )}
        </div>

        {/* Recruitment Selection Section */}
        <div className="mb-3">
          <label className="form-label">
            Đề xuất tuyển dụng <span className="text-danger">*</span>
            <span className="text-muted ms-2">(Chọn từ danh sách có sẵn)</span>
          </label>
          
          <div className="d-flex align-items-center gap-2 mb-2">
            <button
              type="button"
              className="btn btn-outline-primary"
              onClick={() => setShowRecruitmentModal(true)}
            >
              <i className="fas fa-plus me-2"></i>
              Chọn đề xuất tuyển dụng
            </button>
            
            {selectedRecruitments.length > 0 && (
              <span className="badge bg-success">
                <i className="fas fa-check me-1"></i>
                Đã chọn {selectedRecruitments.length} đề xuất
              </span>
            )}
          </div>

          {/* Display Selected Recruitments */}
          {selectedRecruitments.length > 0 && (
            <div className="mt-2">
              <small className="text-muted">Đề xuất đã chọn:</small>
              <div className="mt-1">
                {selectedRecruitments.map((recruitment, index) => (
                  <div key={recruitment.requestNo} className="d-inline-block me-2 mb-1">
                    <span className="badge bg-info d-flex align-items-center">
                      <i className="fas fa-clipboard-list me-1"></i>
                      <span className="me-2">
                        <strong>{recruitment.requestNo}</strong> - {recruitment.department}
                        <br />
                        <small>
                          {recruitment.quantity} người • {recruitment.gender}
                        </small>
                      </span>
                      <button
                        type="button"
                        className="btn-close btn-close-white"
                        style={{ fontSize: '0.6rem' }}
                        onClick={() => removeRecruitment(recruitment.requestNo)}
                        title="Xóa đề xuất này"
                      ></button>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {formErrors.workHistoryData && (
            <div className="text-danger small mt-1">{formErrors.workHistoryData}</div>
          )}
        </div>

        <ButtonLoading
          type="submit"
          className="btn btn-primary w-100"
          loading={loading}
          disabled={loading}
        >
          {loading ? 'Đang thêm nhân viên...' : 'Thêm nhân viên'}
        </ButtonLoading>
      </form>

      {/* Recruitment Selection Modal */}
      {showRecruitmentModal && (
        <RecruitmentModal
          isOpen={showRecruitmentModal}
          onClose={() => setShowRecruitmentModal(false)}
          onRecruitmentSelected={handleRecruitmentSelect}
          selectedRecruitment={selectedRecruitments[0] || null}
        />
      )}
    </>
  );
};

export default EmployeeForm;
