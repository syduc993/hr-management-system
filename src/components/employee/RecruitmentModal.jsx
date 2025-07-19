// src/components/employee/RecruitmentModal.jsx
import React, { useState, useEffect } from 'react';
import { ApiClient } from '../../services/api';
import { useNotification } from '../../hooks/useNotification';
import Loading from '../common/Loading';

const RecruitmentModal = ({ isOpen, onClose, onRecruitmentSelected, selectedRecruitment = null }) => {
  const [recruitmentData, setRecruitmentData] = useState([]);
  const [loading, setLoading] = useState(false);
  // ✅ SỬA: Chỉ cho phép chọn 1 đề xuất
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { showNotification } = useNotification();

  useEffect(() => {
    if (isOpen) {
      loadRecruitmentData();
      // ✅ SỬA: Set selected item từ props
      setSelectedItem(selectedRecruitment);
    }
  }, [isOpen, selectedRecruitment]);

  const loadRecruitmentData = async () => {
    try {
      setLoading(true);
      const response = await ApiClient.get('/api/recruitment');
      
      if (response.success) {
        setRecruitmentData(response.data || []);
      } else {
        throw new Error(response.message || 'Lỗi khi tải dữ liệu');
      }
    } catch (error) {
      console.error('Error loading recruitment data:', error);
      showNotification('Lỗi khi tải dữ liệu tuyển dụng. Sử dụng dữ liệu mẫu.', 'warning');
      setRecruitmentData(getMockData());
    } finally {
      setLoading(false);
    }
  };

  const getMockData = () => {
    return [
      {
        id: '1',
        requestNo: '202507140017',
        requester: '236LH.Nguyễn Huy Thành',
        status: 'Đang tuyển dụng',
        department: '116 Cầu Giấy',
        quantity: '2',
        gender: 'Nam/Nữ',
        fromDate: '2025-07-14',
        toDate: '2025-08-14',
        position: 'Nhân viên bán hàng'
      },
      {
        id: '2',
        requestNo: '202507140018',
        requester: '225VVN.Nguyễn Trọng Hoàng An',
        status: 'Đang tuyển dụng', 
        department: 'Trâm Trỗi',
        quantity: '1',
        gender: 'Nữ',
        fromDate: '2025-07-14',
        toDate: '2025-08-14',
        position: 'Thu ngân'
      }
    ];
  };

  const filteredData = recruitmentData.filter(item =>
    item.requestNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.requester?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.position?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ✅ SỬA: Handle single selection
  const handleItemSelect = (item) => {
    setSelectedItem(selectedItem?.requestNo === item.requestNo ? null : item);
  };

  const handleConfirm = () => {
    if (!selectedItem) {
      showNotification('Vui lòng chọn một đề xuất tuyển dụng', 'warning');
      return;
    }
    
    // ✅ SỬA: Chỉ trả về text của Request No.
    onRecruitmentSelected([selectedItem]);
    onClose();
  };

  const handleCancel = () => {
    setSelectedItem(selectedRecruitment);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
      <div className="modal-dialog modal-xl">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              <i className="fas fa-clipboard-list me-2"></i>
              Chọn đề xuất tuyển dụng
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={handleCancel}
            ></button>
          </div>

          <div className="modal-body">
            {/* Search */}
            <div className="row mb-3">
              <div className="col-12">
                <div className="input-group">
                  <span className="input-group-text">
                    <i className="fas fa-search"></i>
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Tìm kiếm theo Request No, Phòng ban, Người yêu cầu, Vị trí..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Selected Info */}
            {selectedItem && (
              <div className="alert alert-info">
                <i className="fas fa-info-circle me-2"></i>
                Đã chọn: <strong>{selectedItem.requestNo}</strong> - {selectedItem.position} ({selectedItem.department})
              </div>
            )}

            {/* Content */}
            {loading ? (
              <Loading text="Đang tải danh sách đề xuất..." />
            ) : (
              <div className="table-responsive" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                <table className="table table-striped table-hover">
                  <thead className="table-dark sticky-top">
                    <tr>
                      <th width="50">
                        <i className="fas fa-check"></i>
                      </th>
                      <th>Request No.</th>
                      <th>Vị trí tuyển dụng</th>
                      <th>Người yêu cầu</th>
                      <th>Phòng ban</th>
                      <th>Số lượng</th>
                      <th>Giới tính</th>
                      <th>Thời gian</th>
                      <th>Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.map((item) => {
                      const isSelected = selectedItem?.requestNo === item.requestNo;
                      
                      return (
                        <tr 
                          key={item.id || item.requestNo}
                          className={isSelected ? 'table-primary' : ''}
                          style={{ cursor: 'pointer' }}
                          onClick={() => handleItemSelect(item)}
                        >
                          <td>
                            {/* ✅ SỬA: Dùng radio button thay vì checkbox */}
                            <input
                              type="radio"
                              className="form-check-input"
                              checked={isSelected}
                              onChange={() => handleItemSelect(item)}
                            />
                          </td>
                          <td>
                            <strong className="text-primary">{item.requestNo}</strong>
                          </td>
                          <td>
                            <span className="badge bg-info">{item.position || 'N/A'}</span>
                          </td>
                          <td>{item.requester}</td>
                          <td>
                            <span className="badge bg-secondary">{item.department}</span>
                          </td>
                          <td className="text-center">
                            <span className="badge bg-warning text-dark">{item.quantity}</span>
                          </td>
                          <td>
                            <span className="badge bg-light text-dark">{item.gender}</span>
                          </td>
                          <td>
                            <small>
                              {item.fromDate}<br/>
                              đến {item.toDate}
                            </small>
                          </td>
                          <td>
                            <span className={`badge ${
                              item.status === 'Đang tuyển dụng' ? 'bg-success' : 'bg-warning'
                            }`}>
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {filteredData.length === 0 && (
                  <div className="text-center py-4">
                    <i className="fas fa-search fa-3x text-muted mb-3"></i>
                    <p className="text-muted">
                      {searchTerm ? 'Không tìm thấy đề xuất phù hợp' : 'Chưa có đề xuất tuyển dụng nào'}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleCancel}
            >
              <i className="fas fa-times me-2"></i>
              Hủy
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleConfirm}
              disabled={!selectedItem}
            >
              <i className="fas fa-check me-2"></i>
              Xác nhận
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecruitmentModal;
