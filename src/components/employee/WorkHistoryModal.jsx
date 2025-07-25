import React, { useState, useEffect } from 'react';
// ✅ SỬA 1: Import đúng tên hàm là 'getWorkHistory'
import { getWorkHistory } from '../../services/employee.js';
import { useNotification } from '../../hooks/useNotification';
import Modal from '../common/Modal.jsx';
import Loading from '../common/Loading.jsx';

const WorkHistoryModal = ({ isOpen, onClose, employeeId, employeeName, workHistory }) => {
  const [workHistoryData, setWorkHistoryData] = useState([]);
  const [loading, setLoading] = useState(false);
  const { showNotification } = useNotification();

  useEffect(() => {
    // Nếu modal mở và có employeeId, và không có dữ liệu lịch sử được truyền sẵn,
    // thì mới gọi API để lấy dữ liệu.
    if (isOpen && employeeId && !workHistory) {
      fetchWorkHistory();
    } else if (workHistory) {
      // Nếu có dữ liệu được truyền sẵn, sử dụng nó luôn.
      setWorkHistoryData(workHistory);
    }
  }, [isOpen, employeeId, workHistory]);

  const fetchWorkHistory = async () => {
    setLoading(true);
    try {
      // ✅ SỬA 2: Gọi đúng hàm đã import
      const response = await getWorkHistory(employeeId);
      // Hàm getWorkHistory đã được thiết kế để luôn trả về một mảng
      setWorkHistoryData(response || []);
    } catch (error) {
      console.error('Lỗi khi tải lịch sử công việc:', error);
      showNotification(error.message || 'Lỗi kết nối đến server', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      title={`Lịch sử làm việc - ${employeeName || employeeId}`}
      size="lg"
    >
      {loading ? (
        <Loading text="Đang tải lịch sử..." />
      ) : (
        <div>
          {workHistoryData.length === 0 ? (
            <div className="text-center py-4">
              <i className="fas fa-history fa-3x text-muted mb-3"></i>
              <p className="text-muted">Nhân viên này chưa có lịch sử làm việc.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-striped table-hover">
                <thead className="table-dark">
                  <tr>
                    <th>Request No.</th>
                    <th>Mã nhân viên</th>
                    <th>Thời gian tạo</th>
                  </tr>
                </thead>
                <tbody>
                  {workHistoryData.map((item, index) => (
                    <tr key={item.id || index}>
                      <td>
                        <span className="badge bg-primary fs-6">{item.requestNo}</span>
                      </td>
                      <td>{item.employeeId}</td>
                      <td>
                        <small className="text-muted">
                          {item.createdAt ? new Date(item.createdAt).toLocaleString('vi-VN') : 'N/A'}
                        </small>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          <div className="modal-footer border-0 px-0 pb-0 mt-3">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Đóng
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default WorkHistoryModal;
