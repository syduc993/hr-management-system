// src/components/employee/WorkHistoryModal.jsx  
import React, { useState, useEffect } from 'react';
import { getEmployeeWorkHistory } from '../../services/employee.js';
import { useNotification } from '../../hooks/useNotification';
import Modal from '../common/Modal';
import Loading from '../common/Loading';

const WorkHistoryModal = ({ isOpen, onClose, employeeId, employeeName, workHistory }) => {
  const [workHistoryData, setWorkHistoryData] = useState([]);
  const [loading, setLoading] = useState(false);
  const { showNotification } = useNotification();

  useEffect(() => {
    if (isOpen && employeeId && !workHistory) {
      fetchWorkHistory();
    } else if (workHistory) {
      setWorkHistoryData(workHistory);
    }
  }, [isOpen, employeeId, workHistory]);

  const fetchWorkHistory = async () => {
    setLoading(true);
    try {
      const response = await getEmployeeWorkHistory(employeeId);
      
      if (response.success) {
        setWorkHistoryData(response.data || []);
      } else {
        showNotification(response.message || 'Lỗi khi tải work history', 'error');
      }
    } catch (error) {
      console.error('❌ Error fetching work history:', error);
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
        <Loading />
      ) : (
        <div>
          {workHistoryData.length === 0 ? (
            <div className="text-center py-4">
              <i className="fas fa-history fa-3x text-muted mb-3"></i>
              <p className="text-muted">Không có lịch sử làm việc</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-striped">
                <thead className="table-dark">
                  <tr>
                    <th>Request No.</th>
                    <th>Mã nhân viên</th>
                    <th>Thời gian</th>
                  </tr>
                </thead>
                <tbody>
                  {workHistoryData.map((item, index) => (
                    <tr key={item.id || index}>
                      <td>
                        <span className="badge bg-primary">{item.requestNo}</span>
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
          
          <div className="d-flex justify-content-end mt-3">
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
