import React from 'react';

const AttendanceFilters = ({ 
  employees, 
  filters, 
  onFilterChange, 
  onClearFilters 
}) => {
  const handleFilterSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newFilters = {
      employeeId: formData.get('employeeId'),
      dateFrom: formData.get('dateFrom'),
      dateTo: formData.get('dateTo')
    };
    
    // Remove empty filters
    Object.keys(newFilters).forEach(key => {
      if (!newFilters[key]) delete newFilters[key];
    });
    
    onFilterChange(newFilters);
  };

  return (
    <form onSubmit={handleFilterSubmit} id="filterForm">
      <div className="row">
        <div className="col-md-4">
          <label className="form-label">Nhân viên</label>
          <select 
            className="form-select" 
            name="employeeId"
            defaultValue={filters.employeeId || ''}
          >
            <option value="">Tất cả nhân viên</option>
            {employees.map(employee => (
              <option key={employee.id} value={employee.employeeId}>
                {employee.employeeId} - {employee.fullName}
              </option>
            ))}
          </select>
        </div>
        
        <div className="col-md-3">
          <label className="form-label">Từ ngày</label>
          <input 
            type="date" 
            className="form-control" 
            name="dateFrom"
            defaultValue={filters.dateFrom || ''}
          />
        </div>
        
        <div className="col-md-3">
          <label className="form-label">Đến ngày</label>
          <input 
            type="date" 
            className="form-control" 
            name="dateTo"
            defaultValue={filters.dateTo || ''}
          />
        </div>
        
        <div className="col-md-2">
          <label className="form-label">&nbsp;</label>
          <div className="d-grid gap-2">
            <button type="submit" className="btn btn-primary">
              <i className="fas fa-search me-2"></i>
              Lọc
            </button>
            <button 
              type="button" 
              className="btn btn-outline-secondary"
              onClick={onClearFilters}
            >
              <i className="fas fa-times me-2"></i>
              Xóa
            </button>
          </div>
        </div>
      </div>
    </form>
  );
};

export default AttendanceFilters;
