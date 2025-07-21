// src/components/employee/EmployeeAddForm.jsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// ✅ SỬA: Import employeeService thay vì api trực tiếp
import { employeeService } from '../../services/employee';
import { useNotification } from '../../hooks/useNotification';
import RecruitmentModal from './RecruitmentModal';

const EmployeeAddForm = () => {
    const navigate = useNavigate();
    const { showNotification } = useNotification();
    
    // State cho đề xuất tuyển dụng (chỉ một đề xuất duy nhất)
    const [selectedRecruitment, setSelectedRecruitment] = useState(null); 
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // ✅ THÊM: Initial form state để có thể reset
    const initialFormData = {
        fullName: '',
        phoneNumber: '',
        gender: 'Nam',
        hourlyRate: '',
        bankAccount: '',
        bankName: '',
    };
    
    // State cho form data nhân viên
    const [formData, setFormData] = useState(initialFormData);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // ✅ THÊM: Hàm reset form
    const resetForm = () => {
        setFormData(initialFormData);
        setSelectedRecruitment(null);
    };

    // Xử lý khi chọn đề xuất tuyển dụng
    const handleSelectRecruitment = (request) => {
        setSelectedRecruitment(request); // Ghi đè lên lựa chọn cũ
        setIsModalOpen(false);
    };

    // Xóa đề xuất đã chọn
    const handleRemoveRecruitment = () => {
        setSelectedRecruitment(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!selectedRecruitment) {
            showNotification('Vui lòng chọn một đề xuất tuyển dụng.', 'warning');
            return;
        }

        const payload = {
            ...formData,
            hourlyRate: parseFloat(formData.hourlyRate),
            // Backend yêu cầu workHistoryData là một mảng
            workHistoryData: [{
                requestNo: selectedRecruitment.requestNo
            }]
        };

        try {
            console.log('🔍 COMPONENT: Calling employeeService.create with:', payload);
            
            // ✅ SỬA: Sử dụng employeeService.create thay vì api.post
            const response = await employeeService.create(payload);
            
            console.log('✅ COMPONENT: Response received:', response);
            
            if (response.success) {
                showNotification('Thêm nhân viên mới thành công! Bạn có thể tiếp tục thêm nhân viên khác.', 'success');
                
                // ✅ SỬA: Reset form thay vì navigate
                resetForm();
                
                // ✅ THÊM: Focus vào trường đầu tiên để tiếp tục nhập
                setTimeout(() => {
                    document.getElementById('fullName')?.focus();
                }, 100);
                
            } else {
                showNotification(response.message || 'Có lỗi xảy ra.', 'error');
            }
        } catch (error) {
            console.error('❌ COMPONENT: Error:', error);
            const errorMessage = error.response?.data?.message || 'Lỗi hệ thống, không thể thêm nhân viên.';
            showNotification(errorMessage, 'error');
        }
    };

    return (
        <div className="card">
            <div className="card-header">
                <h4 className="card-title">Thêm Nhân viên Mới</h4>
            </div>
            <div className="card-body">
                <form onSubmit={handleSubmit}>
                    {/* PHẦN THÔNG TIN CÁ NHÂN */}
                    <h5 className="mb-3">Thông tin Cá nhân</h5>
                    <div className="row">
                        <div className="col-md-6 mb-3">
                            <label htmlFor="fullName" className="form-label">
                                Họ tên <span className="text-danger">*</span>
                            </label>
                            <input 
                                type="text" 
                                className="form-control" 
                                id="fullName" 
                                name="fullName" 
                                value={formData.fullName} 
                                onChange={handleChange} 
                                required 
                                placeholder="Nhập họ tên đầy đủ"
                            />
                        </div>
                        <div className="col-md-6 mb-3">
                            <label htmlFor="phoneNumber" className="form-label">
                                Số điện thoại <span className="text-danger">*</span>
                            </label>
                            <input 
                                type="tel" 
                                className="form-control" 
                                id="phoneNumber" 
                                name="phoneNumber" 
                                value={formData.phoneNumber} 
                                onChange={handleChange} 
                                required 
                                placeholder="Ví dụ: 0123456789"
                            />
                        </div>
                    </div>
                    
                    <div className="row">
                        <div className="col-md-6 mb-3">
                            <label htmlFor="gender" className="form-label">
                                Giới tính <span className="text-danger">*</span>
                            </label>
                            <select 
                                className="form-select" 
                                id="gender" 
                                name="gender" 
                                value={formData.gender} 
                                onChange={handleChange} 
                                required
                            >
                                <option value="Nam">Nam</option>
                                <option value="Nữ">Nữ</option>
                            </select>
                        </div>
                        <div className="col-md-6 mb-3">
                            <label htmlFor="hourlyRate" className="form-label">
                                Mức lương/giờ (VNĐ) <span className="text-danger">*</span>
                            </label>
                            <input 
                                type="number" 
                                className="form-control" 
                                id="hourlyRate" 
                                name="hourlyRate" 
                                value={formData.hourlyRate} 
                                onChange={handleChange} 
                                required 
                                min="0" 
                                step="1000"
                                placeholder="Ví dụ: 50000"
                            />
                        </div>
                    </div>

                    {/* PHẦN THÔNG TIN NGÂN HÀNG */}
                    <h5 className="mb-3 mt-4">Thông tin Ngân hàng</h5>
                    <div className="row">
                        <div className="col-md-6 mb-3">
                            <label htmlFor="bankAccount" className="form-label">
                                Số tài khoản <span className="text-danger">*</span>
                            </label>
                            <input 
                                type="text" 
                                className="form-control" 
                                id="bankAccount" 
                                name="bankAccount" 
                                value={formData.bankAccount} 
                                onChange={handleChange} 
                                required 
                                placeholder="Nhập số tài khoản ngân hàng"
                            />
                        </div>
                        <div className="col-md-6 mb-3">
                            <label htmlFor="bankName" className="form-label">
                                Tên ngân hàng <span className="text-danger">*</span>
                            </label>
                            <input 
                                type="text" 
                                className="form-control" 
                                id="bankName" 
                                name="bankName" 
                                value={formData.bankName} 
                                onChange={handleChange} 
                                required 
                                placeholder="Ví dụ: Vietcombank, Techcombank..."
                            />
                        </div>
                    </div>

                    <hr />
                    
                    {/* PHẦN ĐỀ XUẤT TUYỂN DỤNG */}
                    <h5 className="mb-3">Thông tin Tuyển dụng</h5>
                    
                    {selectedRecruitment ? (
                        <div className="alert alert-info d-flex justify-content-between align-items-center">
                            <div>
                                <strong>Đề xuất đã chọn:</strong> {selectedRecruitment.requestNo} <br />
                                <small className="text-muted">
                                    Phòng ban: {selectedRecruitment.department} - Vị trí: {selectedRecruitment.position || 'Chưa xác định'}
                                </small>
                            </div>
                            <button 
                                type="button" 
                                className="btn-close" 
                                onClick={handleRemoveRecruitment} 
                                aria-label="Xóa"
                                title="Xóa đề xuất đã chọn"
                            ></button>
                        </div>
                    ) : (
                        <div className="alert alert-warning">
                            <i className="fas fa-exclamation-triangle me-2"></i>
                            Chưa chọn đề xuất tuyển dụng. Vui lòng chọn một đề xuất.
                        </div>
                    )}

                    <button
                        type="button"
                        className={`btn ${selectedRecruitment ? 'btn-outline-secondary' : 'btn-outline-primary'}`}
                        onClick={() => setIsModalOpen(true)}
                        disabled={!!selectedRecruitment}
                    >
                        <i className="fas fa-search me-2"></i>
                        {selectedRecruitment ? 'Đã chọn đề xuất' : 'Chọn Đề xuất Tuyển dụng'}
                    </button>
                    
                    {/* BUTTONS */}
                    <div className="mt-4 d-flex gap-2">
                        <button type="submit" className="btn btn-primary">
                            <i className="fas fa-save me-2"></i>
                            Lưu Nhân viên
                        </button>
                        {/* ✅ THÊM: Nút reset form */}
                        <button 
                            type="button" 
                            className="btn btn-outline-secondary" 
                            onClick={resetForm}
                        >
                            <i className="fas fa-refresh me-2"></i>
                            Xóa Form
                        </button>
                        <button 
                            type="button" 
                            className="btn btn-light" 
                            onClick={() => navigate('/employees')}
                        >
                            <i className="fas fa-times me-2"></i>
                            Hủy
                        </button>
                    </div>
                </form>
            </div>

            {/* MODAL CHỌN ĐỀ XUẤT */}
            <RecruitmentModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onRecruitmentSelected={handleSelectRecruitment}
            />
        </div>
    );
};

export default EmployeeAddForm;
