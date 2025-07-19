// src/pages/DashboardPage.jsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth.js';
import Dashboard from '../components/dashboard/Dashboard.jsx';
import { ApiClient } from '../services/api.js'; // Import ApiClient
import { useNotification } from '../hooks/useNotification';
import Loading from '../components/common/Loading.jsx';

const DashboardPage = () => {
  const { user } = useAuth();
  const { showNotification } = useNotification();

  // State để lưu trữ stats và trạng thái loading
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeEmployees: 0,
    inactiveEmployees: 0
  });
  const [loading, setLoading] = useState(true);

  // Dùng useEffect để gọi API khi component được mount
  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        console.log('📊 DashboardPage: Fetching employee stats...');
        // Gọi trực tiếp API để lấy stats
        const response = await ApiClient.get('/api/employees/stats');
        
        if (response.success && response.data) {
          setStats(response.data);
        } else {
          showNotification('Không thể tải dữ liệu thống kê dashboard.', 'warning');
        }
      } catch (error) {
        console.error('❌ DashboardPage: Error fetching stats:', error);
        showNotification('Lỗi khi tải dữ liệu thống kê.', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []); // Mảng rỗng đảm bảo useEffect chỉ chạy 1 lần

  return (
    <div className="dashboard-page">
      {/* 
        Truyền stats và loading xuống component Dashboard.
        Component Dashboard sẽ hiển thị Loading hoặc dữ liệu tùy trạng thái.
      */}
      <Dashboard 
        user={user} 
        employeeStats={stats}
        loading={loading}
      />
    </div>
  );
};

export default DashboardPage;
