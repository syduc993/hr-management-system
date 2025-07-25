// src/components/employee/EmployeeAddForm.jsx

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// Đã bỏ import employeeService vì không còn gọi API trực tiếp ở đây
// import { employeeService } from '../../services/employee'; 
import { useNotification } from '../../hooks/useNotification';
import RecruitmentModal from './RecruitmentModal';


const EmployeeAddForm = ({ onSave, isLoading: externalLoading }) => {
    const navigate = useNavigate();
    const { showNotification } = useNotification();
    const fullNameInputRef = useRef(null);


    // State cho việc xử lý bất đồng bộ nội bộ của form
    // Giữ lại để có thể vô hiệu hóa form ngay lập tức khi submit
    const [isSubmitting, setIsSubmitting] = useState(false); 
    
    // State cho việc chọn đề xuất tuyển dụng
    const [selectedRecruitment, setSelectedRecruitment] = useState(null); 
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // State khởi tạo cho form để dễ dàng reset
    const initialFormData = {
        fullName: '',
        phoneNumber: '',
        gender: 'Nam',
        hourlyRate: '',
        bankAccount: '',
        bankName: '',
    };
    
    // State cho dữ liệu form
    const [formData, setFormData] = useState(initialFormData);


    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };


    // Hàm reset form về trạng thái ban đầu
    const resetForm = () => {
        setFormData(initialFormData);
        setSelectedRecruitment(null);
        fullNameInputRef.current?.focus();
    };


    // Xử lý khi chọn một đề xuất tuyển dụng từ modal
    const handleSelectRecruitment = (request) => {
        setSelectedRecruitment(request);
        setIsModalOpen(false);
    };


    // Xóa đề xuất tuyển dụng đã chọn
    const handleRemoveRecruitment = () => {
        setSelectedRecruitment(null);
    };


    // ✅ SỬA: Xử lý khi submit form - chỉ chuẩn bị payload và gọi onSave
    const handleSubmit = async (e) => {
        e.preventDefault(); // Ngăn chặn hành vi submit mặc định của form
        
        if (!selectedRecruitment) {
            showNotification('Vui lòng chọn một đề xuất tuyển dụng.', 'warning');
            return;
        }


        setIsSubmitting(true); // Bắt đầu trạng thái đang submit


        const payload = {
            ...formData,
            hourlyRate: parseFloat(formData.hourlyRate) || 0,
            workHistoryData: [{
                requestNo: selectedRecruitment.requestNo
            }]
        };


        try {
            // ✅ SỬA LỚN: KHÔNG GỌI API TRỰC TIẾP Ở ĐÂY NỮA
            // const response = await employeeService.create(payload); 
            
            // Gọi hàm onSave được truyền từ component cha
            // Hàm onSave sẽ chịu trách nhiệm gọi API và trả về kết quả thành công/thất bại
            if (onSave && typeof onSave === 'function') {
                const success = await onSave(payload); // onSave sẽ là handleAddEmployee từ parent
                if (success) { // Nếu hàm onSave báo là thành công
                    showNotification('Thêm nhân viên mới thành công!', 'success');
                    resetForm(); // Reset form sau khi thành công
                } else {
                    // Nếu onSave trả về false (do lỗi từ API hoặc logic của parent)
                    showNotification('Có lỗi xảy ra, không thể thêm nhân viên.', 'error');
                }
            }
        } catch (error) {
            // Lỗi từ onSave (nếu onSave ném lỗi) sẽ được bắt ở đây
            const errorMessage = error.response?.data?.message || 'Lỗi hệ thống, vui lòng thử lại.';
            showNotification(errorMessage, 'error');
            console.error('❌ Lỗi khi thêm nhân viên:', error);
        } finally {
            setIsSubmitting(false); // Kết thúc trạng thái đang submit
        }
    };
    
    // Tự động focus vào trường họ tên khi component được mount lần đầu
    useEffect(() => {
        fullNameInputRef.current?.focus();
    }, []);


    // ✅ SỬA: Sử dụng loading state từ props hoặc internal state
    // currentLoading sẽ là true nếu parent đang loading HOẶC form này đang trong quá trình submit
    const currentLoading = externalLoading || isSubmitting;


    return (
        <div className="card">
            <div className="card-header">
                <h4 className="card-title mb-0">Thêm Nhân viên Mới</h4>
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
                                ref={fullNameInputRef}
                                disabled={currentLoading} // Vô hiệu hóa khi đang tải hoặc submit
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
                                disabled={currentLoading}
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
                                disabled={currentLoading}
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
                                disabled={currentLoading}
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
                                disabled={currentLoading}
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
                                disabled={currentLoading}
                            />
                        </div>
                    </div>


                    <hr className="my-4" />
                    
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
                                disabled={currentLoading}
                            ></button>
                        </div>
                    ) : (
                        <div className="alert alert-warning">
                            <i className="fas fa-exclamation-triangle me-2"></i>
                            Chưa chọn đề xuất tuyển dụng.
                        </div>
                    )}


                    <button
                        type="button"
                        className={`btn ${selectedRecruitment ? 'btn-secondary' : 'btn-primary'}`}
                        onClick={() => setIsModalOpen(true)}
                        disabled={!!selectedRecruitment || currentLoading}
                    >
                        <i className="fas fa-search me-2"></i>
                        {selectedRecruitment ? 'Thay đổi Đề xuất' : 'Chọn Đề xuất Tuyển dụng'}
                    </button>
                    
                    {/* CÁC NÚT HÀNH ĐỘNG */}
                    <div className="mt-4 d-flex justify-content-end gap-2">
                        {/* Nút "Quay về danh sách" đã được xóa theo yêu cầu */}
                        <button 
                            type="button" 
                            className="btn btn-outline-secondary" 
                            onClick={resetForm}
                            disabled={currentLoading}
                        >
                            <i className="fas fa-sync-alt me-2"></i>
                            Làm mới Form
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={currentLoading}>
                            {currentLoading ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
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
