import React, { useState } from 'react';

// Import các thành phần và services cần thiết
import Modal from '../common/Modal.jsx';
import RecruitmentModal from './RecruitmentModal.jsx';
import { ButtonLoading } from '../common/Loading.jsx';
import { useNotification } from '../../hooks/useNotification';
import { addWorkHistory } from '../../services/employee.js';

/**
 * Modal để thêm một bản ghi Lịch sử công việc cho nhân viên.
 * Nó cho phép người dùng chọn một "Đề xuất tuyển dụng" đã có sẵn.
 * Logic được điều chỉnh để luôn làm việc với một mảng các đề xuất,
 * nhưng RecruitmentModal được cấu hình để chỉ cho phép chọn một.
 *
 * @param {object} props
 * @param {boolean} props.isOpen - Cờ để điều khiển việc hiển thị modal.
 * @param {Function} props.onClose - Hàm để đóng modal.
 * @param {object} props.employee - Đối tượng nhân viên đang được thêm lịch sử.
 * @param {Function} props.onSave - Hàm callback được gọi sau khi lưu thành công.
 */
const AddWorkHistoryModal = ({ isOpen, onClose, employee, onSave }) => {
  // Nếu không có thông tin nhân viên, không render gì cả để tránh lỗi.
  if (!employee) return null;

  // State quản lý đề xuất dưới dạng MẢNG để đồng nhất logic.
  const [selectedRecruitments, setSelectedRecruitments] = useState([]);
  const [isRecruitmentModalOpen, setIsRecruitmentModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { showNotification } = useNotification();

  /**
   * Xử lý khi người dùng chọn một đề xuất từ RecruitmentModal.
   * Dù RecruitmentModal có singleSelect=true, nó vẫn được thiết kế để trả về một mảng.
   * @param {Array<object>} recruitmentObject - Mảng chứa đề xuất đã chọn.
   */
  const handleRecruitmentSelect = (recruitmentObject) => {
    // Luôn nhận về một mảng, kể cả khi chỉ có một lựa chọn.
    setSelectedRecruitments(recruitmentObject ? [recruitmentObject] : []);
    //setSelectedRecruitments(recruitments || []);
    setIsRecruitmentModalOpen(false);
  };

  /**
   * Xử lý khi người dùng nhấn nút "Lưu" để gửi form.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Kiểm tra xem mảng selectedRecruitments có phần tử nào không.
    if (selectedRecruitments.length === 0) {
      showNotification('Vui lòng chọn một đề xuất tuyển dụng.', 'warning');
      return;
    }

    if (isLoading) return;
    setIsLoading(true);

    try {
      // API `addWorkHistory` chỉ cần employeeId và requestNo.
      const workHistoryPayload = {
        employeeId: employee.employeeId,
        // Lấy requestNo từ phần tử đầu tiên của mảng.
        requestNo: selectedRecruitments[0].requestNo,
      };

      const response = await addWorkHistory(workHistoryPayload);

      if (response.success) {
        showNotification('Thêm lịch sử công việc thành công!', 'success');
        if (onSave) {
          onSave(); // Gọi callback để đóng modal và refresh dữ liệu bên ngoài.
        }
      } else {
        showNotification(response.message || 'Thêm lịch sử công việc thất bại.', 'error');
      }
    } catch (error) {
      console.error('Lỗi khi thêm lịch sử công việc:', error);
      showNotification(error.message || 'Lỗi hệ thống, vui lòng thử lại.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Modal chính để thêm Work History */}
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={`Thêm Lịch sử cho: ${employee.fullName}`}
        size="md"
      >
        <form onSubmit={handleSubmit}>
          {/* Trường hiển thị mã nhân viên (không cho sửa) */}
          <div className="mb-3">
            <label htmlFor="employeeIdDisplay" className="form-label">Mã nhân viên</label>
            <input
              id="employeeIdDisplay"
              type="text"
              className="form-control"
              value={employee.employeeId}
              disabled
            />
          </div>

          {/* Khu vực chọn Đề xuất tuyển dụng */}
          <div className="mb-4">
            <label className="form-label d-block">Đề xuất tuyển dụng <span className="text-danger">*</span></label>
            
            {/* Hiển thị thông tin đề xuất nếu đã chọn */}
            {selectedRecruitments.length > 0 ? (
              <div className="card mt-2 border-success bg-light">
                <div className="card-body p-2">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <strong className="d-block">Mã ĐX: {selectedRecruitments[0].requestNo}</strong>
                      <small className="text-muted">
                        Vị trí: {selectedRecruitments[0].position} • Phòng ban: {selectedRecruitments[0].department}
                      </small>
                    </div>
                    <div className="d-flex align-items-center gap-1">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary border-0"
                        title="Thay đổi lựa chọn"
                        onClick={() => setIsRecruitmentModalOpen(true)}
                      >
                        <i className="bi bi-pencil-square"></i>
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger border-0"
                        title="Bỏ chọn"
                        onClick={() => setSelectedRecruitments([])} // Reset mảng về rỗng
                      >
                        <i className="bi bi-x-lg"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // Hiển thị nút chọn nếu chưa có đề xuất nào
              <div className="d-flex align-items-center gap-2 mt-2">
                <button
                  type="button"
                  className="btn btn-outline-primary"
                  onClick={() => setIsRecruitmentModalOpen(true)}
                >
                  <i className="bi bi-search me-2"></i>
                  Chọn đề xuất
                </button>
              </div>
            )}
          </div>

          {/* Các nút hành động ở chân modal */}
          <div className="modal-footer px-0 pb-0 border-0">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isLoading}>
              Hủy
            </button>
            <ButtonLoading
              type="submit"
              className="btn btn-primary"
              loading={isLoading}
              // Nút Lưu bị vô hiệu hóa khi đang tải hoặc chưa chọn đề xuất
              disabled={isLoading || selectedRecruitments.length === 0}
            >
              Thêm Lịch sử
            </ButtonLoading>
          </div>
        </form>
      </Modal>

      {/* Modal phụ để chọn Đề xuất tuyển dụng, chỉ hiện khi cần */}
      {isRecruitmentModalOpen && (
        <RecruitmentModal
          isOpen={isRecruitmentModalOpen}
          onClose={() => setIsRecruitmentModalOpen(false)}
          onRecruitmentSelected={handleRecruitmentSelect}
          // Truyền mảng đã chọn vào để modal biết lựa chọn hiện tại
          selectedRecruitments={selectedRecruitments}
          // Luôn giữ singleSelect=true để đảm bảo người dùng chỉ chọn 1
          singleSelect={true}
        />
      )}
    </>
  );
};

export default AddWorkHistoryModal;
