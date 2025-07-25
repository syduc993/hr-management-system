// src/hooks/useAttendance.js
import { useState, useCallback } from 'react';
import { useNotification } from './useNotification';
import api from '../services/api';

export function useAttendance() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { showNotification } = useNotification();

    // ✅ CẬP NHẬT: Lấy logs chấm công với filters nâng cao
    const getAttendanceLogs = useCallback(async (filters = {}) => {
        try {
            setLoading(true);
            setError(null);
            
            console.log('🔄 useAttendance: Getting attendance logs with filters:', filters);
            
            const response = await api.get('/attendance/logs', {
                params: filters
            });
            
            console.log('✅ useAttendance: Attendance logs loaded:', response.data.data?.length || 0, 'records');
            
            return {
                success: true,
                data: response.data.data || [],
                message: response.data.message
            };
            
        } catch (error) {
            console.error('❌ useAttendance: Error getting attendance logs:', error);
            const errorMessage = error.response?.data?.message || 'Lỗi khi tải logs chấm công';
            setError(errorMessage);
            
            return {
                success: false,
                data: [],
                message: errorMessage
            };
        } finally {
            setLoading(false);
        }
    }, []);

    // ✅ CẬP NHẬT: Lấy tổng giờ công với format mới  
    const getEmployeeHours = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            
            console.log('📊 useAttendance: Getting employee hours...');
            
            const response = await api.get('/api/attendance/employee-hours');
            
            console.log('🔍 useAttendance RAW RESPONSE:', response);
            console.log('🔍 response.data:', response.data);
            console.log('🔍 response.data.data:', response.data.data);
            console.log('🔍 employeeHours array:', response.data.data?.employeeHours);
            console.log('🔍 employeeHours length:', response.data.data?.employeeHours?.length);
            
            return {
                success: true,
                // ✅ SỬA: Thay response.data.data thành response.data
                data: response.data || { employeeHours: [], summary: {} },
                message: response.data.message
            };
            
        } catch (error) {
            // error handling
        } finally {
            setLoading(false);
        }
    }, []);



    // ✅ THÊM MỚI: Lấy thống kê chấm công
    const getAttendanceStats = useCallback(async (filters = {}) => {
        try {
            setLoading(true);
            setError(null);
            
            console.log('📈 useAttendance: Getting attendance stats...');
            
            const response = await api.get('/attendance/stats', {
                params: filters
            });
            
            console.log('✅ useAttendance: Attendance stats loaded:', response.data.data);
            
            return {
                success: true,
                data: response.data.data || {},
                message: response.data.message
            };
            
        } catch (error) {
            console.error('❌ useAttendance: Error getting attendance stats:', error);
            const errorMessage = error.response?.data?.message || 'Lỗi khi tải thống kê chấm công';
            setError(errorMessage);
            
            return {
                success: false,
                data: {},
                message: errorMessage
            };
        } finally {
            setLoading(false);
        }
    }, []);

    // ✅ THÊM MỚI: Lấy giờ công chi tiết của một nhân viên
    const getEmployeeDetailedHours = useCallback(async (employeeId, filters = {}) => {
        try {
            setLoading(true);
            setError(null);
            
            console.log('👤 useAttendance: Getting detailed hours for employee:', employeeId);
            
            const response = await api.get(`/attendance/employee/${employeeId}/detailed`, {
                params: filters
            });
            
            console.log('✅ useAttendance: Employee detailed hours loaded:', response.data.data);
            
            return {
                success: true,
                data: response.data.data || {},
                message: response.data.message
            };
            
        } catch (error) {
            console.error('❌ useAttendance: Error getting employee detailed hours:', error);
            const errorMessage = error.response?.data?.message || 'Lỗi khi tải giờ công chi tiết';
            setError(errorMessage);
            
            return {
                success: false,
                data: {},
                message: errorMessage
            };
        } finally {
            setLoading(false);
        }
    }, []);

    // ✅ CẬP NHẬT: Thêm log chấm công với validation mới
    const addAttendanceLog = useCallback(async (attendanceData) => {
        try {
            setLoading(true);
            setError(null);
            
            // Validate required fields
            const validationErrors = validateAttendanceData(attendanceData);
            if (validationErrors.length > 0) {
                throw new Error(validationErrors.join(', '));
            }
            
            console.log('➕ useAttendance: Adding attendance log:', attendanceData);
            
            const response = await api.post('/attendance/logs', attendanceData);
            
            console.log('✅ useAttendance: Attendance log added successfully');
            showNotification('Thêm bản ghi chấm công thành công', 'success');
            
            return {
                success: true,
                data: response.data.data,
                message: response.data.message
            };
            
        } catch (error) {
            console.error('❌ useAttendance: Error adding attendance log:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Lỗi khi thêm bản ghi chấm công';
            setError(errorMessage);
            showNotification(errorMessage, 'error');
            
            return {
                success: false,
                data: null,
                message: errorMessage
            };
        } finally {
            setLoading(false);
        }
    }, [showNotification]);

    // ✅ THÊM MỚI: Cập nhật log chấm công  
    const updateAttendanceLog = useCallback(async (id, attendanceData) => {
        try {
            setLoading(true);
            setError(null);
            
            console.log('📝 useAttendance: Updating attendance log:', id, attendanceData);
            
            const response = await api.put(`/attendance/logs/${id}`, attendanceData);
            
            console.log('✅ useAttendance: Attendance log updated successfully');
            showNotification('Cập nhật bản ghi chấm công thành công', 'success');
            
            return {
                success: true,
                data: response.data.data,
                message: response.data.message
            };
            
        } catch (error) {
            console.error('❌ useAttendance: Error updating attendance log:', error);
            const errorMessage = error.response?.data?.message || 'Lỗi khi cập nhật bản ghi chấm công';
            setError(errorMessage);
            showNotification(errorMessage, 'error');
            
            return {
                success: false,
                data: null,
                message: errorMessage
            };
        } finally {
            setLoading(false);
        }
    }, [showNotification]);

    // ✅ THÊM MỚI: Xóa log chấm công
    const deleteAttendanceLog = useCallback(async (id) => {
        try {
            setLoading(true);
            setError(null);
            
            console.log('🗑️ useAttendance: Deleting attendance log:', id);
            
            await api.delete(`/attendance/logs/${id}`);
            
            console.log('✅ useAttendance: Attendance log deleted successfully');
            showNotification('Xóa bản ghi chấm công thành công', 'success');
            
            return {
                success: true,
                message: 'Xóa bản ghi chấm công thành công'
            };
            
        } catch (error) {
            console.error('❌ useAttendance: Error deleting attendance log:', error);
            const errorMessage = error.response?.data?.message || 'Lỗi khi xóa bản ghi chấm công';
            setError(errorMessage);
            showNotification(errorMessage, 'error');
            
            return {
                success: false,
                message: errorMessage
            };
        } finally {
            setLoading(false);
        }
    }, [showNotification]);

    // ✅ THÊM MỚI: Refresh cache
    const refreshAttendanceData = useCallback(async () => {
        try {
            setLoading(true);
            console.log('🔄 useAttendance: Refreshing attendance data...');
            
            // Call các API để refresh cache
            await Promise.all([
                getAttendanceLogs(),
                getEmployeeHours()
            ]);
            
            showNotification('Làm mới dữ liệu thành công', 'success');
            
        } catch (error) {
            console.error('❌ useAttendance: Error refreshing data:', error);
            showNotification('Lỗi khi làm mới dữ liệu', 'error');
        } finally {
            setLoading(false);
        }
    }, [getAttendanceLogs, getEmployeeHours, showNotification]);

    // ✅ HELPER: Export dữ liệu ra CSV
    const exportAttendanceToCSV = useCallback((data, filename = 'attendance_export') => {
        try {
            if (!data || data.length === 0) {
                showNotification('Không có dữ liệu để xuất', 'warning');
                return false;
            }

            const headers = Object.keys(data[0]);
            const csvContent = [
                headers.join(','),
                ...data.map(row => 
                    headers.map(header => {
                        const value = row[header];
                        // Escape commas and quotes in CSV
                        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                            return `"${value.replace(/"/g, '""')}"`;
                        }
                        return value || '';
                    }).join(',')
                )
            ].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
            link.click();
            
            showNotification('Xuất file CSV thành công', 'success');
            return true;
            
        } catch (error) {
            console.error('❌ useAttendance: Error exporting CSV:', error);
            showNotification('Lỗi khi xuất file CSV', 'error');
            return false;
        }
    }, [showNotification]);

    return {
        // State
        loading,
        error,
        
        // Main functions
        getAttendanceLogs,
        getEmployeeHours,
        addAttendanceLog,
        updateAttendanceLog,
        deleteAttendanceLog,
        
        // New functions
        getAttendanceStats,
        getEmployeeDetailedHours,
        refreshAttendanceData,
        exportAttendanceToCSV,
        
        // Utility functions
        clearError: () => setError(null)
    };
}

// ✅ HELPER: Validate dữ liệu chấm công
function validateAttendanceData(data) {
    const errors = [];
    
    if (!data.employeeId?.trim()) {
        errors.push('Mã nhân viên là bắt buộc');
    }
    
    if (!data.type || !['Checkin', 'Checkout'].includes(data.type)) {
        errors.push('Phân loại phải là Checkin hoặc Checkout');
    }
    
    if (!data.position?.trim()) {
        errors.push('Vị trí là bắt buộc');
    }
    
    // Validate position values
    const validPositions = ['Nhân viên Bán hàng', 'Nhân viên Thu ngân', 'Nhân viên Tiếp đón', 'Nhân viên Mascot'];
    if (data.position && !validPositions.includes(data.position)) {
        errors.push(`Vị trí phải là một trong: ${validPositions.join(', ')}`);
    }
    
    if (!data.timestamp) {
        errors.push('Thời gian chấm công là bắt buộc');
    } else {
        const timestamp = new Date(data.timestamp);
        if (isNaN(timestamp.getTime())) {
            errors.push('Thời gian chấm công không hợp lệ');
        }
    }
    
    return errors;
}

// ✅ HELPER: Format dữ liệu cho API
export function formatAttendanceForAPI(formData) {
    return {
        employeeId: formData.employeeId?.trim() || '',
        type: formData.type || 'Checkin',
        position: formData.position?.trim() || '',
        timestamp: formData.timestamp || new Date().toISOString(),
        notes: formData.notes?.trim() || ''
    };
}

// ✅ HELPER: Parse response từ API
export function parseAttendanceResponse(response) {
    if (!response || !response.data) {
        return { success: false, data: null, message: 'Invalid response' };
    }
    
    return {
        success: response.success || false,
        data: response.data || null,
        message: response.message || '',
        errorCode: response.errorCode || null
    };
}

export default useAttendance;
