// src/components/employee/AddWorkHistoryModal.jsx
import React, { useState } from 'react';
import { addWorkHistory } from '../../services/employee.js';
import { useNotification } from '../../hooks/useNotification';
import { ButtonLoading } from '../common/Loading';
import Modal from '../common/Modal';
import RecruitmentModal from './RecruitmentModal';

const AddWorkHistoryModal = ({ isOpen, onClose, employeeId, employeeName, onWorkHistoryAdded }) => {
  const [selectedRecruitment, setSelectedRecruitment] = useState(null);
  const [showRecruitmentModal, setShowRecruitmentModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const { showNotification } = useNotification();

  const handleRecruitmentSelect = (recruitments) => {
    if (recruitments && recruitments.length > 0) {
      setSelectedRecruitment(recruitments[0]); // Chỉ chọn 1
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedRecruitment) {
      showNotification('Vui lòng chọn đề xuất tuyển dụng', 'error');
      return;
    }

    setLoading(true);
    
    try {
      const workHistoryData = {
        employeeId: employeeId,
        requestNo: selectedRecruitment.requestNo
      };

      const response = await addWorkHistory(workHistoryData);
      
      if (response.success) {
        showNotification('Thêm work history thành công!', 'success');
        onWorkHistoryAdded?.();
        onClose();
        setSelectedRecruitment(null);
      } else {
        showNotification(response.message || 'Lỗi khi thêm work history', 'error');
      }
      
    } catch (error) {
      console.error('❌ Error adding work history:', error);
      showNotification(error.message || 'Lỗi kết nối đến server. Vui lòng thử lại.', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <Modal 
        isOpen={isOpen} 
        onClose={onClose}
        title={`Thêm Work History - ${employeeName || employeeId}`}
        size="md"
      >
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Mã nhân viên</label>
            <input
              type="text"
              className="form-control"
              value={employeeId}
              disabled
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Đề xuất tuyển dụng *</label>
            
            <div className="d-flex align-items-center gap-2 mb-2">
              <button
                type="button"
                className="btn btn-outline-primary"
                onClick={() => setShowRecruitmentModal(true)}
              >
                <i className="fas fa-plus me-2"></i>
                Chọn đề xuất
              </button>
              
              {selectedRecruitment && (
                <span className="badge bg-success">
                  <i className="fas fa-check me-1"></i>
                  Đã chọn
                </span>
              )}
            </div>

            {selectedRecruitment && (
              <div className="mt-2">
                <div className="card">
                  <div className="card-body py-2">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <strong>{selectedRecruitment.requestNo}</strong> - {selectedRecruitment.department}
                        <br />
                        <small className="text-muted">
                          {selectedRecruitment.quantity} người • {selectedRecruitment.gender}
                        </small>
                      </div>
                      <button
                        type="button"
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => setSelectedRecruitment(null)}
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="d-flex gap-2 justify-content-end">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Hủy
            </button>
            <ButtonLoading
              type="submit"
              className="btn btn-primary"
              loading={loading}
              disabled={loading || !selectedRecruitment}
            >
              {loading ? 'Đang thêm...' : 'Thêm Work History'}
            </ButtonLoading>
          </div>
        </form>
      </Modal>

      {showRecruitmentModal && (
        <RecruitmentModal
          isOpen={showRecruitmentModal}
          onClose={() => setShowRecruitmentModal(false)}
          onRecruitmentSelected={handleRecruitmentSelect}
          selectedRecruitment={selectedRecruitment}
          singleSelect={true}
        />
      )}
    </>
  );
};

export default AddWorkHistoryModal;
