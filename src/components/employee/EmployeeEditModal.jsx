import React, { useState, useEffect } from 'react';
import { useNotification } from '../../hooks/useNotification';
import Modal from '../common/Modal.jsx';
import { ButtonLoading } from '../common/Loading.jsx';

const EmployeeEditModal = ({ isOpen, onClose, onSave, employee }) => {
    const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    gender: 'Nam',
    bankAccount: '',
    bankName: '',
    status: 'active',
  });
  //const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const { showNotification } = useNotification();

  // Khi modal mở hoặc nhân viên được chọn thay đổi, cập nhật state của form
  useEffect(() => {
    if (employee) {
      setFormData({
        fullName: employee.fullName || '',
        phoneNumber: employee.phoneNumber || '',
        gender: employee.gender || 'Nam',
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
    try {
      // Gọi hàm onSave được truyền từ EmployeeManagementPage. Hàm này sẽ gọi hook useEmployees để thực sự cập nhật dữ liệu.
      const success = await onSave(formData);
      // if (success) {
      //   // Component cha (EmployeeManagementPage) sẽ tự xử lý việc đóng modal.
      // } else {
      //   // Nếu onSave trả về false, hiển thị thông báo lỗi chung.
      //   showNotification('Cập nhật thất bại. Vui lòng thử lại.', 'error');
      // }
    } catch (error) {
      console.error('Lỗi khi submit form sửa nhân viên:', error);
      showNotification(error.message || 'Lỗi hệ thống khi cập nhật.', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !employee) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Chỉnh sửa: ${employee.fullName}`}
    >
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
          {/* <div className="col-md-6 mb-3">
            <label className="form-label">Lương/giờ</label>
            <input type="number" name="hourlyRate" value={formData.hourlyRate} onChange={handleChange} className="form-control" required min="0"/>
          </div> */}
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
        <div className="modal-footer border-0 px-0 pb-0">
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
            Hủy
          </button>
          <ButtonLoading type="submit" className="btn btn-primary" loading={loading}>
            Lưu thay đổi
          </ButtonLoading>
        </div>
      </form>
    </Modal>
  );
};

export default EmployeeEditModal;
