// src/components/employee/RecruitmentModal.jsx
import React, { useState, useEffect } from 'react';
import { employeeService } from '../../services/employee';
import { useNotification } from '../../hooks/useNotification';
import Loading from '../common/Loading';

const RecruitmentModal = ({ isOpen, onClose, onRecruitmentSelected, selectedRecruitment = null }) => {
  const [recruitmentRequests, setRecruitmentRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { showNotification } = useNotification();

  useEffect(() => {
    if (isOpen) {
      loadRecruitmentRequests();
      // Set selected item từ props
      setSelectedItem(selectedRecruitment);
    }
  }, [isOpen, selectedRecruitment]);

  // ✅ THÊM: Helper function để extract requestNo từ structure phức tạp
  const extractRequestNo = (requestNoData) => {
    if (!requestNoData) return '';
    
    console.log('🔍 RECRUITMENT MODAL: extractRequestNo input:', requestNoData);
    console.log('🔍 RECRUITMENT MODAL: requestNoData type:', typeof requestNoData);
    
    // Nếu là object với structure { "link": "...", "text": "202507140017" }
    if (typeof requestNoData === 'object' && requestNoData !== null) {
      if (requestNoData.text) {
        console.log('🔍 RECRUITMENT MODAL: Found text property:', requestNoData.text);
        return requestNoData.text;
      }
      
      // Nếu là object nhưng có key khác
      if (requestNoData.value) {
        console.log('🔍 RECRUITMENT MODAL: Found value property:', requestNoData.value);
        return requestNoData.value;
      }
      
      // Nếu object có toString() method
      console.log('🔍 RECRUITMENT MODAL: Converting object to string');
      return requestNoData.toString();
    }
    
    // Nếu là string trực tiếp
    if (typeof requestNoData === 'string') {
      console.log('🔍 RECRUITMENT MODAL: Direct string:', requestNoData);
      return requestNoData;
    }
    
    // Fallback
    console.log('🔍 RECRUITMENT MODAL: Using fallback conversion');
    return requestNoData?.toString() || '';
  };

  // ✅ THÊM: Helper function để extract tên người yêu cầu
  const extractRequesterName = (requesterData) => {
    if (!requesterData) return '';
    
    console.log('🔍 RECRUITMENT MODAL: extractRequesterName input:', requesterData);
    
    // Nếu là array [{ "name": "236LH.Nguyễn Huy Thành", ... }]
    if (Array.isArray(requesterData)) {
      return requesterData.map(user => 
        user.name || user.en_name || user.id || 'Unknown'
      ).join(', ');
    }
    
    // Nếu là object { "name": "236LH.Nguyễn Huy Thành", ... }
    if (typeof requesterData === 'object' && requesterData !== null) {
      return requesterData.name || requesterData.en_name || requesterData.id || 'Unknown';
    }
    
    // Nếu là string trực tiếp
    return requesterData.toString();
  };

  const loadRecruitmentRequests = async () => {
    try {
      setLoading(true);
      console.log('🔍 RECRUITMENT MODAL: Loading recruitment requests...');
      
      const response = await employeeService.getApprovedRecruitmentRequests();
      console.log('🔍 RECRUITMENT MODAL: Raw API response:', response);
      
      if (response.success && Array.isArray(response.data)) {
        // ✅ THÊM: Process data để extract requestNo và requester đúng cách
        const processedData = response.data.map((item, index) => {
          console.log(`🔍 RECRUITMENT MODAL: Processing item ${index}:`, item);
          
          const processedItem = {
            ...item,
            requestNo: extractRequestNo(item.requestNo),
            requester: extractRequesterName(item.requester)
          };
          
          console.log(`🔍 RECRUITMENT MODAL: Processed item ${index}:`, processedItem);
          return processedItem;
        });
        
        console.log('🔍 RECRUITMENT MODAL: Final processed data:', processedData);
        setRecruitmentRequests(processedData);
        
        // Debug first item
        if (processedData.length > 0) {
          console.log('🔍 RECRUITMENT MODAL: First item structure:', processedData[0]);
          console.log('🔍 RECRUITMENT MODAL: First item requestNo type:', typeof processedData[0].requestNo);
          console.log('🔍 RECRUITMENT MODAL: First item requestNo value:', processedData[0].requestNo);
        }
        
      } else {
        throw new Error(response.message || 'Lỗi khi tải dữ liệu');
      }
    } catch (error) {
      console.error('❌ RECRUITMENT MODAL: Error loading recruitment requests:', error);
      showNotification('Lỗi khi tải dữ liệu tuyển dụng. Sử dụng dữ liệu mẫu.', 'warning');
      setRecruitmentRequests(getMockData());
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

  const filteredData = recruitmentRequests.filter(item =>
    item.requestNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.requester?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.position?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle single selection
  const handleItemSelect = (item) => {
    console.log('🔍 RECRUITMENT MODAL: handleItemSelect called with:', item);
    setSelectedItem(selectedItem?.requestNo === item.requestNo ? null : item);
  };

  const handleConfirm = () => {
    if (!selectedItem) {
      showNotification('Vui lòng chọn một đề xuất tuyển dụng', 'warning');
      return;
    }
    
    console.log('🔍 RECRUITMENT MODAL: selectedItem before confirm:', selectedItem);
    console.log('🔍 RECRUITMENT MODAL: selectedItem.requestNo:', selectedItem.requestNo);
    console.log('🔍 RECRUITMENT MODAL: typeof selectedItem.requestNo:', typeof selectedItem.requestNo);
    
    // ✅ SỬA: Kiểm tra requestNo có hợp lệ không
    if (!selectedItem.requestNo || selectedItem.requestNo === 'undefined') {
      console.error('❌ RECRUITMENT MODAL: Invalid requestNo:', selectedItem.requestNo);
      showNotification('Đề xuất tuyển dụng không hợp lệ. Vui lòng chọn lại.', 'error');
      return;
    }
    
    // ✅ SỬA: Tạo object với requestNo đã được extract
    const processedItem = {
      ...selectedItem,
      requestNo: selectedItem.requestNo // Đã được extract trong loadRecruitmentRequests
    };
    
    console.log('🔍 RECRUITMENT MODAL: Final processed item for callback:', processedItem);
    
    // Gửi về component cha
    onRecruitmentSelected(processedItem); // ✅ SỬA: Gửi object thay vì array
    onClose();
  };

  const handleCancel = () => {
    setSelectedItem(selectedRecruitment);
    setSearchTerm(''); // Clear search term
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
                  {searchTerm && (
                    <button
                      className="btn btn-outline-secondary"
                      type="button"
                      onClick={() => setSearchTerm('')}
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  )}
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
              disabled={!selectedItem || loading}
            >
              <i className="fas fa-check me-2"></i>
              Xác nhận{selectedItem ? ` (${selectedItem.requestNo})` : ''}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecruitmentModal;
