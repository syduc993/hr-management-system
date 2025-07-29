import React, { useState, useEffect } from 'react';
import { getWorkHistory, addWorkHistory, updateWorkHistory, deleteWorkHistory } from '../../services/employee.js';
import { useNotification } from '../../hooks/useNotification';
import Modal from '../common/Modal.jsx';
import Loading from '../common/Loading.jsx';
import RecruitmentModal from './RecruitmentModal.jsx';
import { ButtonLoading } from '../common/Loading.jsx';

const WorkHistoryModal = ({ isOpen, onClose, employeeId, employeeName, workHistory,onDataChanged  }) => {
  // ===== STATE MANAGEMENT =====
  const [workHistoryData, setWorkHistoryData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('view'); // 'view' | 'add' | 'edit'
  const [selectedWorkHistory, setSelectedWorkHistory] = useState(null);
  const [isRecruitmentModalOpen, setIsRecruitmentModalOpen] = useState(false);
  const [selectedRecruitment, setSelectedRecruitment] = useState(null);
  const [saving, setSaving] = useState(false);
  
  // Form data cho add/edit
  const [formData, setFormData] = useState({
    fromDate: '',
    toDate: '',
    hourlyRate: ''
  });

  const { showNotification } = useNotification();

  // ===== EFFECTS =====
  useEffect(() => {
    if (isOpen && employeeId && !workHistory) {
      fetchWorkHistory();
    } else if (workHistory) {
      setWorkHistoryData(workHistory);
    }
    // Reset về view mode khi mở modal
    setMode('view');
    resetForm();
  }, [isOpen, employeeId, workHistory]);

  // ===== DATA FETCHING =====
  const fetchWorkHistory = async () => {
    setLoading(true);
    try {
      const response = await getWorkHistory(employeeId);
      setWorkHistoryData(response || []);
    } catch (error) {
      console.error('Lỗi khi tải lịch sử công việc:', error);
      showNotification(error.message || 'Lỗi kết nối đến server', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ===== FORM HANDLING =====
  const resetForm = () => {
    setFormData({
      fromDate: '',
      toDate: '',
      hourlyRate: ''
    });
    setSelectedRecruitment(null);
    setSelectedWorkHistory(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // ===== MODE SWITCHING =====
  const handleAddNew = () => {
    resetForm();
    setMode('add');
  };

  const handleEdit = (item) => {
    setSelectedWorkHistory(item);
    setFormData({
      fromDate: item.fromDate || '',
      toDate: item.toDate || '',
      hourlyRate: item.hourlyRate || ''
    });
    // Tạo mock recruitment object từ requestNo
    setSelectedRecruitment({
      requestNo: item.requestNo,
      position: 'N/A',
      department: 'N/A'
    });
    setMode('edit');
  };

  const handleCancel = () => {
    resetForm();
    setMode('view');
  };

  // ===== RECRUITMENT SELECTION =====
  const handleRecruitmentSelect = (recruitment) => {
    setSelectedRecruitment(recruitment);
    setIsRecruitmentModalOpen(false);
  };

  // ===== VALIDATION =====
  const validateForm = () => {
    const errors = [];

    if (mode === 'add' && !selectedRecruitment) {
      errors.push('Vui lòng chọn một đề xuất tuyển dụng.');
    }

    if (!formData.fromDate) {
      errors.push('Từ ngày là bắt buộc.');
    }

    if (!formData.toDate) {
      errors.push('Đến ngày là bắt buộc.');
    }

    if (formData.fromDate && formData.toDate) {
      const fromDate = new Date(formData.fromDate);
      const toDate = new Date(formData.toDate);
      
      if (toDate < fromDate) {
        errors.push('Đến ngày phải lớn hơn hoặc bằng Từ ngày.');
      }
    }

    if (formData.hourlyRate && (isNaN(formData.hourlyRate) || parseFloat(formData.hourlyRate) < 0)) {
      errors.push('Mức lương/giờ phải là số và không được âm.');
    }

    return errors;
  };

  // ===== CRUD OPERATIONS =====
  const handleSave = async () => {
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      showNotification(validationErrors.join(' '), 'warning');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        employeeId: employeeId,
        requestNo: selectedRecruitment?.requestNo || selectedWorkHistory?.requestNo,
        fromDate: formData.fromDate,
        toDate: formData.toDate,
        hourlyRate: formData.hourlyRate ? parseFloat(formData.hourlyRate) : undefined,
      };

      let response;
      if (mode === 'add') {
        response = await addWorkHistory(payload);
      } else if (mode === 'edit') {
        response = await updateWorkHistory(selectedWorkHistory.id, payload);
      }

      if (response.success) {
        showNotification(
          mode === 'add' ? 'Thêm lịch sử công việc thành công!' : 'Cập nhật lịch sử công việc thành công!', 
          'success'
        );
        await fetchWorkHistory(); // Refresh data
        if (onDataChanged) {
          onDataChanged();
        }
        setMode('view');
        resetForm();
      } else {
        showNotification(response.message || 'Có lỗi xảy ra', 'error');
      }
    } catch (error) {
      console.error('Lỗi khi lưu:', error);
      showNotification(error.message || 'Lỗi hệ thống', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Bạn có chắc muốn xóa lịch sử công việc "${safeRenderRequestNo(item.requestNo)}"?`)) {
      return;
    }

    setSaving(true);
    try {
      const response = await deleteWorkHistory(item.id);
      if (response.success) {
        showNotification('Xóa lịch sử công việc thành công!', 'success');
        await fetchWorkHistory(); // Refresh data
        if (onDataChanged) {
          onDataChanged();
        }
      } else {
        showNotification(response.message || 'Có lỗi xảy ra khi xóa', 'error');
      }
    } catch (error) {
      console.error('Lỗi khi xóa:', error);
      showNotification(error.message || 'Lỗi hệ thống', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ===== HELPER FUNCTIONS =====
  const safeRender = (value, fallback = 'N/A') => {
    if (value === null || value === undefined) return fallback;
    
    if (typeof value === 'object') {
      if (value.text) return value.text;
      if (value.link) return value.link;
      if (Array.isArray(value) && value.length > 0) {
        return safeRender(value[0]);
      }
      return JSON.stringify(value);
    }
    
    return String(value);
  };

  // ✅ SỬA: Hàm riêng để xử lý requestNo (ưu tiên text)
  const safeRenderRequestNo = (requestNo) => {
    if (!requestNo) return 'N/A';
    
    if (typeof requestNo === 'object') {
      // Ưu tiên text trước, sau đó mới đến link
      if (requestNo.text) return requestNo.text;
      if (requestNo.link) return requestNo.link;
      if (Array.isArray(requestNo) && requestNo.length > 0) {
        return safeRenderRequestNo(requestNo[0]);
      }
      return JSON.stringify(requestNo);
    }
    
    return String(requestNo);
  };

  // ✅ SỬA: Hàm format ngày để xử lý array timestamp
  const formatDate = (dateValue) => {
    if (!dateValue) return 'N/A';
    
    try {
      let timestamp = dateValue;
      
      // ✅ SỬA: Xử lý array chứa timestamp
      if (Array.isArray(dateValue) && dateValue.length > 0) {
        timestamp = dateValue[0];
      }
      
      // Chuyển đổi timestamp thành Date object
      const date = new Date(timestamp);
      
      if (isNaN(date.getTime())) return 'N/A';
      
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'N/A';
    }
  };

  const formatCurrency = (amount) => {
    if (!amount || amount === 0) return 'N/A';
    try {
      return new Intl.NumberFormat('vi-VN', { 
        style: 'currency', 
        currency: 'VND' 
      }).format(amount);
    } catch (error) {
      return `${amount} VNĐ`;
    }
  };

  // ===== RENDER FUNCTIONS =====
  const renderViewMode = () => (
    <div>
      {/* Header Actions */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h6 className="mb-0">Danh sách lịch sử công việc</h6>
        <div className="btn-group">
          <button 
            className="btn btn-primary btn-sm" 
            onClick={handleAddNew}
            disabled={loading || saving}
          >
            <i className="fas fa-plus me-2"></i>
            Thêm mới
          </button>
          <button 
            className="btn btn-outline-secondary btn-sm" 
            onClick={fetchWorkHistory}
            disabled={loading || saving}
          >
            <i className={`fas fa-sync-alt me-2 ${loading ? 'fa-spin' : ''}`}></i>
            Làm mới
          </button>
        </div>
      </div>

      {workHistoryData.length === 0 ? (
        <div className="text-center py-4">
          <i className="fas fa-history fa-3x text-muted mb-3"></i>
          <p className="text-muted">Nhân viên này chưa có lịch sử làm việc.</p>
          <button className="btn btn-primary" onClick={handleAddNew}>
            <i className="fas fa-plus me-2"></i>
            Thêm lịch sử đầu tiên
          </button>
        </div>
      ) : (
        <>
          <div className="table-responsive">
            <table className="table table-striped table-hover">
              <thead className="table-dark">
                <tr>
                  <th>Request No.</th>
                  <th>Từ ngày</th>
                  <th>Đến ngày</th>
                  <th>Mức lương/giờ</th>
                  {/* ✅ BỎ: Cột "Thời gian tạo" */}
                  <th className="text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {workHistoryData.map((item, index) => (
                  <tr key={item.id || index}>
                    <td>
                      <span className="badge bg-primary fs-6">
                        {safeRenderRequestNo(item.requestNo)}
                      </span>
                    </td>
                    <td>
                      <span className="text-info">
                        {formatDate(item.fromDate)}
                      </span>
                    </td>
                    <td>
                      <span className="text-info">
                        {formatDate(item.toDate)}
                      </span>
                    </td>
                    <td>
                      {item.hourlyRate ? (
                        <span className="badge bg-success">
                          {formatCurrency(item.hourlyRate)}
                        </span>
                      ) : (
                        <span className="text-muted">Mặc định</span>
                      )}
                    </td>
                    {/* ✅ BỎ: Cột "Thời gian tạo" */}
                    <td className="text-center">
                      <div className="btn-group" role="group">
                        <button
                          className="btn btn-sm btn-warning"
                          title="Sửa"
                          onClick={() => handleEdit(item)}
                          disabled={saving}
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          title="Xóa"
                          onClick={() => handleDelete(item)}
                          disabled={saving}
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ✅ BỎ: Phần thống kê tổng quan */}
        </>
      )}
    </div>
  );

  const renderFormMode = () => (
    <div>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h6 className="mb-0">
          {mode === 'add' ? 'Thêm lịch sử công việc mới' : 'Chỉnh sửa lịch sử công việc'}
        </h6>
        <button 
          className="btn btn-outline-secondary btn-sm" 
          onClick={handleCancel}
          disabled={saving}
        >
          <i className="fas fa-arrow-left me-2"></i>
          Quay lại
        </button>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
        {/* Employee ID (read-only) */}
        <div className="mb-3">
          <label className="form-label">Mã nhân viên</label>
          <input
            type="text"
            className="form-control"
            value={employeeId}
            disabled
          />
        </div>

        {/* Recruitment Selection - chỉ hiện khi add */}
        {mode === 'add' && (
          <div className="mb-4">
            <label className="form-label d-block">
              Đề xuất tuyển dụng <span className="text-danger">*</span>
            </label>
            
            {selectedRecruitment ? (
              <div className="card mt-2 border-success bg-light">
                <div className="card-body p-2">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <strong className="d-block">Mã ĐX: {selectedRecruitment.requestNo}</strong>
                      <small className="text-muted">
                        Vị trí: {selectedRecruitment.position} • Phòng ban: {selectedRecruitment.department}
                      </small>
                    </div>
                    <div className="d-flex align-items-center gap-1">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary border-0"
                        title="Thay đổi lựa chọn"
                        onClick={() => setIsRecruitmentModalOpen(true)}
                        disabled={saving}
                      >
                        <i className="fas fa-pencil-alt"></i>
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger border-0"
                        title="Bỏ chọn"
                        onClick={() => setSelectedRecruitment(null)}
                        disabled={saving}
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="d-flex align-items-center gap-2 mt-2">
                <button
                  type="button"
                  className="btn btn-outline-primary"
                  onClick={() => setIsRecruitmentModalOpen(true)}
                  disabled={saving}
                >
                  <i className="fas fa-search me-2"></i>
                  Chọn đề xuất
                </button>
              </div>
            )}
          </div>
        )}

        {/* Request No - chỉ hiển thị khi edit */}
        {mode === 'edit' && (
          <div className="mb-3">
            <label className="form-label">Request No.</label>
            <input
              type="text"
              className="form-control"
              value={safeRenderRequestNo(selectedWorkHistory?.requestNo) || ''}
              disabled
            />
          </div>
        )}

        {/* Date Range */}
        <div className="row mb-3">
          <div className="col-md-6">
            <label className="form-label">
              Từ ngày <span className="text-danger">*</span>
            </label>
            <input
              type="date"
              className="form-control"
              name="fromDate"
              value={formData.fromDate}
              onChange={handleInputChange}
              disabled={saving}
            />
          </div>
          <div className="col-md-6">
            <label className="form-label">
              Đến ngày <span className="text-danger">*</span>
            </label>
            <input
              type="date"
              className="form-control"
              name="toDate"
              value={formData.toDate}
              onChange={handleInputChange}
              disabled={saving}
            />
          </div>
        </div>

        {/* Hourly Rate */}
        <div className="mb-3">
          <label className="form-label">
            Mức lương/giờ (VNĐ)
          </label>
          <input
            type="number"
            className="form-control"
            name="hourlyRate"
            value={formData.hourlyRate}
            onChange={handleInputChange}
            min="0"
            step="1000"
            placeholder="Ví dụ: 50000"
            disabled={saving}
          />
          <small className="form-text text-muted">
            Để trống nếu sử dụng mức lương mặc định
          </small>
        </div>

        {/* Form Actions */}
        <div className="d-flex justify-content-end gap-2">
          <button 
            type="button"
            className="btn btn-secondary" 
            onClick={handleCancel}
            disabled={saving}
          >
            Hủy
          </button>
          <ButtonLoading
            type="submit"
            className="btn btn-primary"
            loading={saving}
            disabled={saving || (mode === 'add' && !selectedRecruitment)}
          >
            {mode === 'add' ? 'Thêm mới' : 'Cập nhật'}
          </ButtonLoading>
        </div>
      </form>
    </div>
  );

  if (!isOpen) return null;

  return (
    <>
      <Modal 
        isOpen={isOpen} 
        onClose={onClose}
        title={`Quản lý lịch sử làm việc - ${employeeName || employeeId}`}
        size="xl"
      >
        {loading ? (
          <Loading text="Đang tải lịch sử..." />
        ) : (
          <>
            {mode === 'view' ? renderViewMode() : renderFormMode()}
            
            {/* Footer - chỉ hiện khi ở view mode */}
            {mode === 'view' && (
              <div className="modal-footer border-0 px-0 pb-0 mt-3">
                <button type="button" className="btn btn-secondary" onClick={onClose}>
                  Đóng
                </button>
              </div>
            )}
          </>
        )}
      </Modal>

      {/* Recruitment Selection Modal */}
      {isRecruitmentModalOpen && (
        <RecruitmentModal
          isOpen={isRecruitmentModalOpen}
          onClose={() => setIsRecruitmentModalOpen(false)}
          onRecruitmentSelected={handleRecruitmentSelect}
          selectedRecruitment={selectedRecruitment}
          singleSelect={true}
        />
      )}
    </>
  );
};

export default WorkHistoryModal;
