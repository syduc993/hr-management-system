// // src/hooks/useEmployees.js
// import { useState, useCallback } from 'react';
// import api from '../services/api.js';

// export const useEmployeeStats = () => {
//     const [stats, setStats] = useState({
//         totalEmployees: 0,
//         activeEmployees: 0,
//         inactiveEmployees: 0
//     });
//     const [loading, setLoading] = useState(false);
    
//     // ✅ Wrap fetchStats với useCallback để tránh re-creation
//     const fetchStats = useCallback(async () => {
//         console.log('\n🔍 FRONTEND: useEmployeeStats.fetchStats() called');
//         setLoading(true);
        
//         try {
//             console.log('📡 Making API request to /employees/stats...');
//             const response = await api.get('/employees/stats');
            
//             console.log('📨 Full API Response:', response);
//             console.log('✅ Success check:', response.data.success);
//             console.log('📊 Stats data:', response.data.data);
            
//             if (response.data.success) {
//                 console.log('✅ Setting stats to:', response.data.data);
//                 setStats(response.data.data);
//             } else {
//                 console.warn('⚠️ API returned success: false');
//             }
            
//         } catch (error) {
//             console.error('❌ Error in fetchStats:', error);
//         } finally {
//             setLoading(false);
//             console.log('🏁 fetchStats completed');
//         }
//     }, []); // ← ✅ Empty deps để tránh re-creation
    
//     return { stats, loading, fetchStats };
// };

// src/hooks/useEmployees.js
// src/hooks/useEmployees.js
// src/hooks/useEmployees.js




// --------------------------------------- v2 ---------------------------------------
// import { useState, useCallback } from 'react';
// import api from '../services/api.js';

// export const useEmployeeStats = () => {
//     const [stats, setStats] = useState({
//         totalEmployees: 0,
//         activeEmployees: 0,
//         inactiveEmployees: 0
//     });
//     const [loading, setLoading] = useState(false);
    
//     const fetchStats = useCallback(async () => {
//         console.log('🔍 FRONTEND: fetchStats called');
//         setLoading(true);
        
//         try {
//             // ✅ THÊM PREFIX /api vào đây
//             const response = await api.get('/api/employees/stats');
            
//             console.log('📨 API Response:', response);
            
//             if (response.success) {
//                 console.log('✅ Setting stats:', response.data);
//                 setStats(response.data);
//             } else {
//                 console.warn('⚠️ API returned success: false');
//             }
            
//         } catch (error) {
//             console.error('❌ Error in fetchStats:', error);
//         } finally {
//             setLoading(false);
//         }
//     }, []);
    
//     return { stats, loading, fetchStats };
// };


import { useState, useEffect } from 'react';
import * as employeeService from '../services/employee.js';
import { useNotification } from './useNotification';

export const useEmployees = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { showNotification } = useNotification();

  // Fetch all employees
  const fetchEmployees = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await employeeService.getAllEmployees();
      setEmployees(response.data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
      setError(error.message);
      showNotification(error.message, 'error');
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  // Add employee
  const addEmployeeHandler = async (employeeData) => {
    try {
      const response = await employeeService.addEmployee(employeeData);
      showNotification('Thêm nhân viên thành công!', 'success');
      await fetchEmployees(); // Refresh list
      return response;
    } catch (error) {
      console.error('Error adding employee:', error);
      throw error; // Re-throw để component handle
    }
  };

  // Update employee
  const updateEmployeeHandler = async (employeeId, employeeData) => {
    try {
      const response = await employeeService.updateEmployee(employeeId, employeeData);
      showNotification('Cập nhật nhân viên thành công!', 'success');
      await fetchEmployees(); // Refresh list
      return response;
    } catch (error) {
      console.error('Error updating employee:', error);
      throw error;
    }
  };

  // Delete employee
  const deleteEmployeeHandler = async (employeeId) => {
    try {
      await employeeService.deleteEmployee(employeeId);
      showNotification('Xóa nhân viên thành công!', 'success');
      await fetchEmployees(); // Refresh list
    } catch (error) {
      console.error('Error deleting employee:', error);
      showNotification(error.message, 'error');
      throw error;
    }
  };

  // Search employees
  const searchEmployees = async (query) => {
    setLoading(true);
    try {
      const response = await employeeService.searchEmployees(query);
      setEmployees(response.data || []);
    } catch (error) {
      console.error('Error searching employees:', error);
      showNotification(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Get work history
  const getWorkHistory = async (employeeId) => {
    try {
      const response = await employeeService.getEmployeeWorkHistory(employeeId);
      return response.data || [];
    } catch (error) {
      console.error('Error fetching work history:', error);
      showNotification(error.message, 'error');
      return [];
    }
  };

  // Add work history
  const addWorkHistoryHandler = async (workHistoryData) => {
    try {
      const response = await employeeService.addWorkHistory(workHistoryData);
      showNotification('Thêm work history thành công!', 'success');
      return response;
    } catch (error) {
      console.error('Error adding work history:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  return {
    employees,
    loading,
    error,
    fetchEmployees,
    addEmployee: addEmployeeHandler,
    updateEmployee: updateEmployeeHandler,
    deleteEmployee: deleteEmployeeHandler,
    searchEmployees,
    getWorkHistory,
    addWorkHistory: addWorkHistoryHandler
  };
};
