// src/services/employee.js

import { ApiClient } from './api.js';

const handleError = (error, context) => {
    const message = error.response?.data?.message || error.message || `Lỗi không xác định khi ${context}.`;
    console.error(`❌ Lỗi Service API (${context}):`, message);
    throw new Error(message);
};

export const getEmployees = async () => {
    try {
        console.log('📡 SERVICE (FE): Gọi API lấy danh sách nhân viên...');
        const response = await ApiClient.get('/api/employees');
        
        // ✅ SỬA: Debug chi tiết response structure
        console.log('🔍 EMPLOYEE SERVICE: Raw axios response:', response);
        console.log('🔍 EMPLOYEE SERVICE: Response data type:', typeof response.data);
        console.log('🔍 EMPLOYEE SERVICE: Response data keys:', response.data ? Object.keys(response.data) : 'NULL');
        console.log('🔍 EMPLOYEE SERVICE: Response data:', response.data);
        
        if (!response.data) {
            throw new Error('Server không trả về dữ liệu');
        }
        
        // ✅ SỬA: Xử lý cả 2 trường hợp response structure
        
        // Trường hợp 1: Standard structure {success, data, message}
        if (typeof response.data.success !== 'undefined') {
            console.log('✅ EMPLOYEE SERVICE: Found standard structure');
            console.log('  - success:', response.data.success);
            console.log('  - message:', response.data.message);
            console.log('  - data type:', Array.isArray(response.data.data) ? 'array' : typeof response.data.data);
            console.log('  - data length:', response.data.data?.length);
            
            if (!response.data.success) {
                throw new Error(response.data.message || 'Server trả về lỗi');
            }
            
            return response.data; // Trả về {success: true, data: [...], message: "..."}
        }
        
        // Trường hợp 2: Backend trả về array trực tiếp
        if (Array.isArray(response.data)) {
            console.log('✅ EMPLOYEE SERVICE: Response is direct array, converting to standard structure');
            console.log('  - data length:', response.data.length);
            
            // Wrap array vào standard structure
            return {
                success: true,
                data: response.data,
                message: 'Lấy danh sách nhân viên thành công'
            };
        }
        
        // Trường hợp 3: Unknown structure
        console.warn('⚠️ EMPLOYEE SERVICE: Unknown response structure, trying to extract data');
        
        // Thử tìm array trong các keys của response
        const possibleArrays = Object.values(response.data).filter(val => Array.isArray(val));
        if (possibleArrays.length > 0) {
            console.log('✅ EMPLOYEE SERVICE: Found array in response, using it as data');
            return {
                success: true,
                data: possibleArrays[0],
                message: 'Lấy danh sách nhân viên thành công'
            };
        }
        
        throw new Error('Server trả về dữ liệu không đúng định dạng');
        
    } catch (error) {
        console.error('❌ EMPLOYEE SERVICE: Full error:', error);
        handleError(error, 'lấy danh sách nhân viên');
    }
};

// Giữ nguyên các functions khác...
export const addEmployee = async (employeeData) => {
    try {
        console.log('📡 SERVICE (FE): Gọi API thêm nhân viên mới...', employeeData);
        const response = await ApiClient.post('/api/employees', employeeData);
        
        // ✅ THÊM: Debug và handle response structure
        console.log('🔍 ADD EMPLOYEE SERVICE: Response:', response);
        
        if (!response) {
            throw new Error('Server không trả về dữ liệu khi thêm nhân viên');
        }
        
        // Handle different response structures
        if (typeof response.success !== 'undefined') {
            return response;
        }
        
        // Fallback: assume success if we got a response
        return {
            success: true,
            data: response,
            message: 'Thêm nhân viên thành công'
        };
        
    } catch (error) {
        handleError(error, 'thêm nhân viên mới');
    }
};

export const updateEmployee = async (id, employeeData) => {
    try {
        console.log(`📡 SERVICE (FE): Gọi API cập nhật nhân viên ID: ${id}...`, employeeData);
        const response = await ApiClient.put(`/api/employees/${id}`, employeeData);
        
        console.log('🔍 DEBUG: PUT Response Status:', response.status);
        console.log('🔍 DEBUG: PUT Response Headers:', response.headers);
        console.log('🔍 DEBUG: PUT Response Data:', response.data);
        console.log('🔍 DEBUG: PUT Response Full:', response);

        console.log('🔍 UPDATE EMPLOYEE SERVICE: Response:', response);
        
        // Handle different response structures
        if (typeof response.success !== 'undefined') {
            return response;
        }
        
        return {
            success: true,
            data: response,
            message: 'Cập nhật nhân viên thành công'
        };
        
    } catch (error) {
        handleError(error, 'cập nhật nhân viên');
    }
};

// export const deleteEmployee = async (id) => {
//     try {
//         console.log(`📡 SERVICE (FE): Gọi API xóa nhân viên ID: ${id}...`);
//         const response = await ApiClient.delete(`/api/employees/${id}`);
        
//         console.log('🔍 DELETE EMPLOYEE SERVICE: Response:', response);
        
//         return {
//             success: true,
//             message: 'Xóa nhân viên thành công'
//         };
//     } catch (error) {
//         handleError(error, 'xóa nhân viên');
//     }
// };


export const deleteEmployee = async (id) => {
    try {
        console.log(`📡 SERVICE (FE): Gọi API xóa nhân viên ID: ${id}...`);
        const response = await ApiClient.delete(`/api/employees/${id}`);
        
        console.log('🔍 DELETE EMPLOYEE SERVICE: Response:', response);
        
        // ✅ THÊM: Hiển thị thông tin chi tiết từ backend
        if (response.data?.deletedWorkHistories > 0) {
            console.log(`✅ Deleted ${response.data.deletedWorkHistories} work history records`);
        }
        
        return {
            success: true,
            message: response.message || 'Xóa nhân viên thành công',
            data: response.data
        };
        
    } catch (error) {
        console.error('❌ Delete employee service error:', error);
        
        // ✅ THÊM: Better error message
        let errorMessage = 'Lỗi khi xóa nhân viên';
        
        try {
            const errorData = JSON.parse(error.message);
            errorMessage = errorData.message || errorMessage;
        } catch (parseError) {
            errorMessage = error.message || errorMessage;
        }
        
        throw new Error(errorMessage);
    }
};



export const getApprovedRecruitmentRequests = async () => {
    try {
        console.log('📡 SERVICE (FE): Gọi API lấy danh sách đề xuất tuyển dụng...');
        //const response = await ApiClient.get('/api/recruitment');

        //Thêm filter theo status
        const response = await ApiClient.get('/api/recruitment', {
            status: 'Approved,Under Review'
        });
        console.log('🔍 RECRUITMENT SERVICE: Response:', response);
        
        // Handle different response structures
        if (typeof response.success !== 'undefined') {
            return response.data || [];
        }
        
        if (Array.isArray(response)) {
            return response;
        }
        
        if (Array.isArray(response.data)) {
            return response.data;
        }
        
        return [];
    } catch (error) {
        console.error('❌ Recruitment service error:', error);
        return []; // Return empty array instead of throwing
    }
};

export const getWorkHistory = async (employeeId) => {
    try {
        console.log(`📡 SERVICE (FE): Gọi API lấy lịch sử công việc: ${employeeId}...`);
        const response = await ApiClient.get(`/api/employees/${employeeId}/work-history`);
        
        console.log('🔍 WORK HISTORY SERVICE: Response:', response);
        
        // Handle different response structures
        if (typeof response.success !== 'undefined') {
            return response.data || [];
        }
        
        if (Array.isArray(response)) {
            return response;
        }
        
        if (Array.isArray(response.data)) {
            return response.data;
        }
        
        return [];
    } catch (error) {
        console.error('❌ Work history service error:', error);
        return [];
    }
};

export const addWorkHistory = async (workHistoryData) => {
    try {
        console.log('📡 SERVICE (FE): Gọi API thêm lịch sử công việc...', workHistoryData);
        const response = await ApiClient.post('/api/employees/work-history', workHistoryData);
        
        console.log('🔍 ADD WORK HISTORY SERVICE: Response:', response);
        
        // Handle different response structures
        if (typeof response.success !== 'undefined') {
            return response;
        }
        
        return {
            success: true,
            data: response,
            message: 'Thêm lịch sử công việc thành công'
        };
    } catch (error) {
        handleError(error, 'thêm lịch sử công việc');
    }
};

// ✅ THÊM MỚI: Update work history
export const updateWorkHistory = async (id, workHistoryData) => {
    try {
        console.log(`📡 SERVICE (FE): Gọi API cập nhật lịch sử công việc ID: ${id}...`, workHistoryData);
        const response = await ApiClient.put(`/api/employees/work-history/${id}`, workHistoryData);
        
        console.log('🔍 UPDATE WORK HISTORY SERVICE: Response:', response);
        
        // Handle different response structures
        if (typeof response.success !== 'undefined') {
            return response;
        }
        
        return {
            success: true,
            data: response,
            message: 'Cập nhật lịch sử công việc thành công'
        };
        
    } catch (error) {
        handleError(error, 'cập nhật lịch sử công việc');
    }
};

// ✅ THÊM MỚI: Delete work history
export const deleteWorkHistory = async (id) => {
    try {
        console.log(`📡 SERVICE (FE): Gọi API xóa lịch sử công việc ID: ${id}...`);
        const response = await ApiClient.delete(`/api/employees/work-history/${id}`);
        
        console.log('🔍 DELETE WORK HISTORY SERVICE: Response:', response);
        
        return {
            success: true,
            message: 'Xóa lịch sử công việc thành công'
        };
        
    } catch (error) {
        handleError(error, 'xóa lịch sử công việc');
    }
};
