import React, { useState, useEffect } from 'react';
import { ApiClient } from '../../services/api';
import { useNotification } from '../../hooks/useNotification';
import Loading from '../common/Loading';

const StoreManager = () => {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    storeName: '',
    address: ''
  });
  const [editingStore, setEditingStore] = useState(null);
  const { showNotification } = useNotification();

  useEffect(() => {
    loadStores();
  }, []);

  const loadStores = async () => {
    try {
      setLoading(true);
      const data = await ApiClient.get('/api/employees/stores');
      setStores(data);
    } catch (error) {
      console.error('Error loading stores:', error);
      showNotification('Lỗi khi tải danh sách cửa hàng', 'error');
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
    
    if (!formData.storeName.trim() || !formData.address.trim()) {
      showNotification('Vui lòng điền đầy đủ thông tin!', 'error');
      return;
    }

    try {
      if (editingStore) {
        await ApiClient.put(`/api/employees/stores/${editingStore.id}`, formData);
        showNotification('Cập nhật cửa hàng thành công', 'success');
      } else {
        await ApiClient.post('/api/employees/stores', formData);
        showNotification('Thêm cửa hàng thành công', 'success');
      }
      
      setFormData({ storeName: '', address: '' });
      setEditingStore(null);
      await loadStores();
    } catch (error) {
      console.error('Error saving store:', error);
      showNotification('Lỗi khi lưu cửa hàng', 'error');
    }
  };

  const handleEdit = (store) => {
    setEditingStore(store);
    setFormData({
      storeName: store.storeName,
      address: store.address
    });
  };

  const handleDelete = async (store) => {
    const confirmed = window.confirm(`Bạn có chắc chắn muốn xóa cửa hàng "${store.storeName}"?`);
    if (!confirmed) return;

    try {
      await ApiClient.delete(`/api/employees/stores/${store.id}`);
      showNotification('Xóa cửa hàng thành công', 'success');
      await loadStores();
    } catch (error) {
      console.error('Error deleting store:', error);
      showNotification('Lỗi khi xóa cửa hàng', 'error');
    }
  };

  const handleCancel = () => {
    setEditingStore(null);
    setFormData({ storeName: '', address: '' });
  };

  if (loading) {
    return <Loading text="Đang tải danh sách cửa hàng..." />;
  }

  return (
    <div className="store-manager">
      <div className="row">
        <div className="col-md-4">
          <div className="card">
            <div className="card-header">
              <h5>{editingStore ? 'Chỉnh sửa' : 'Thêm'} cửa hàng</h5>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label">
                    Tên cửa hàng <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    name="storeName"
                    value={formData.storeName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="mb-3">
                  <label className="form-label">
                    Địa chỉ <span className="text-danger">*</span>
                  </label>
                  <textarea
                    className="form-control"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    rows="3"
                    required
                  />
                </div>
                
                <div className="d-grid gap-2">
                  <button type="submit" className="btn btn-primary">
                    {editingStore ? 'Cập nhật' : 'Thêm'} cửa hàng
                  </button>
                  {editingStore && (
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
              <h5>Danh sách cửa hàng</h5>
            </div>
            <div className="card-body">
              {stores.length === 0 ? (
                <div className="text-center py-4">
                  <i className="fas fa-store fa-3x text-muted mb-3"></i>
                  <p className="text-muted">Chưa có cửa hàng nào</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-striped table-hover">
                    <thead className="table-dark">
                      <tr>
                        <th>Tên cửa hàng</th>
                        <th>Địa chỉ</th>
                        <th>Trạng thái</th>
                        <th>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stores.map(store => (
                        <tr key={store.id}>
                          <td>{store.storeName}</td>
                          <td>{store.address}</td>
                          <td>
                            <span className={`badge ${
                              store.status === 'active' 
                                ? 'bg-success' 
                                : 'bg-secondary'
                            }`}>
                              {store.status === 'active' 
                                ? 'Hoạt động' 
                                : 'Ngưng hoạt động'
                              }
                            </span>
                          </td>
                          <td>
                            <div className="btn-group" role="group">
                              <button
                                className="btn btn-sm btn-primary"
                                onClick={() => handleEdit(store)}
                                title="Chỉnh sửa"
                              >
                                <i className="fas fa-edit"></i>
                              </button>
                              <button
                                className="btn btn-sm btn-danger"
                                onClick={() => handleDelete(store)}
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

export default StoreManager;
