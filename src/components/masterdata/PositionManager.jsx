import React, { useState, useEffect } from 'react';
import { ApiClient } from '../../services/api';
import { useNotification } from '../../hooks/useNotification';
import Loading from '../common/Loading';

const PositionManager = () => {
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    positionName: '',
    description: ''
  });
  const [editingPosition, setEditingPosition] = useState(null);
  const { showNotification } = useNotification();

  useEffect(() => {
    loadPositions();
  }, []);

  const loadPositions = async () => {
    try {
      setLoading(true);
      const data = await ApiClient.get('/api/employees/positions');
      setPositions(data);
    } catch (error) {
      console.error('Error loading positions:', error);
      showNotification('Lỗi khi tải danh sách vị trí', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.positionName.trim()) {
      showNotification('Vui lòng nhập tên vị trí!', 'error');
      return;
    }

    try {
      if (editingPosition) {
        await ApiClient.put(`/api/employees/positions/${editingPosition.id}`, formData);
        showNotification('Cập nhật vị trí thành công', 'success');
      } else {
        await ApiClient.post('/api/employees/positions', formData);
        showNotification('Thêm vị trí thành công', 'success');
      }
      
      setFormData({ positionName: '', description: '' });
      setEditingPosition(null);
      await loadPositions();
    } catch (error) {
      console.error('Error saving position:', error);
      showNotification('Lỗi khi lưu vị trí', 'error');
    }
  };

  const handleEdit = (position) => {
    setEditingPosition(position);
    setFormData({
      positionName: position.positionName,
      description: position.description || ''
    });
  };

  const handleDelete = async (position) => {
    const confirmed = window.confirm(`Bạn có chắc chắn muốn xóa vị trí "${position.positionName}"?`);
    if (!confirmed) return;

    try {
      await ApiClient.delete(`/api/employees/positions/${position.id}`);
      showNotification('Xóa vị trí thành công', 'success');
      await loadPositions();
    } catch (error) {
      console.error('Error deleting position:', error);
      showNotification('Lỗi khi xóa vị trí', 'error');
    }
  };

  const handleCancel = () => {
    setEditingPosition(null);
    setFormData({ positionName: '', description: '' });
  };

  if (loading) {
    return <Loading text="Đang tải danh sách vị trí..." />;
  }

  return (
    <div className="position-manager">
      <div className="row">
        <div className="col-md-4">
          <div className="card">
            <div className="card-header">
              <h5>{editingPosition ? 'Chỉnh sửa' : 'Thêm'} vị trí</h5>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label">
                    Tên vị trí <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    name="positionName"
                    value={formData.positionName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="mb-3">
                  <label className="form-label">Mô tả</label>
                  <textarea
                    className="form-control"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="3"
                    placeholder="Mô tả về vị trí công việc..."
                  />
                </div>
                
                <div className="d-grid gap-2">
                  <button type="submit" className="btn btn-primary">
                    {editingPosition ? 'Cập nhật' : 'Thêm'} vị trí
                  </button>
                  {editingPosition && (
                    <button 
                      type="button" 
                      className="btn btn-secondary"
                      onClick={handleCancel}
                    >
                      Hủy
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
        
        <div className="col-md-8">
          <div className="card">
            <div className="card-header">
              <h5>Danh sách vị trí</h5>
            </div>
            <div className="card-body">
              {positions.length === 0 ? (
                <div className="text-center py-4">
                  <i className="fas fa-briefcase fa-3x text-muted mb-3"></i>
                  <p className="text-muted">Chưa có vị trí nào</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-striped table-hover">
                    <thead className="table-dark">
                      <tr>
                        <th>Tên vị trí</th>
                        <th>Mô tả</th>
                        <th>Trạng thái</th>
                        <th>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {positions.map(position => (
                        <tr key={position.id}>
                          <td>
                            <strong>{position.positionName}</strong>
                          </td>
                          <td>
                            <span className="text-muted">
                              {position.description || 'Không có mô tả'}
                            </span>
                          </td>
                          <td>
                            <span className={`badge ${
                              position.status === 'active' 
                                ? 'bg-success' 
                                : 'bg-secondary'
                            }`}>
                              {position.status === 'active' 
                                ? 'Hoạt động' 
                                : 'Ngưng hoạt động'
                              }
                            </span>
                          </td>
                          <td>
                            <div className="btn-group" role="group">
                              <button
                                className="btn btn-sm btn-primary"
                                onClick={() => handleEdit(position)}
                                title="Chỉnh sửa"
                              >
                                <i className="fas fa-edit"></i>
                              </button>
                              <button
                                className="btn btn-sm btn-danger"
                                onClick={() => handleDelete(position)}
                                title="Xóa"
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
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PositionManager;
