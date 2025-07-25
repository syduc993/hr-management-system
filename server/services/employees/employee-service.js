// Employee management service
import BaseService from '../core/base-service.js';
import LarkClient from '../core/lark-client.js';
import CacheService from '../core/cache-service.js';

class EmployeeService extends BaseService {
    constructor() {
        super();
        this.tableName = 'employees';
        this.baseId = process.env.LARK_BASE_ID;
        this.tableId = process.env.LARK_EMPLOYEE_TABLE_ID;
    }

    async initializeService() {
        // Initialize Lark Base connection
        console.log('Initializing Employee Service...');
    }

    async getAllEmployees() {
        const cacheKey = 'employees_all';
        let employees = CacheService.get(cacheKey);

        if (employees) {
            console.log(`✅ EMPLOYEE: Loaded ${employees.length} employees from cache.`);
            return employees;
        }

        try {
            console.log('📡 EMPLOYEE: Fetching all employees from Lark API...');
            
            // ✅ Sử dụng getAllRecords để lấy toàn bộ dữ liệu, không bị giới hạn trang
            const response = await LarkClient.getAllRecords(
                `/bitable/v1/apps/${this.baseId}/tables/${this.tableId}/records`
            );
            
            employees = this.transformEmployeeData(response.data?.items || []);
            console.log(`✅ EMPLOYEE: Transformed ${employees.length} total employees.`);
            
            CacheService.set(cacheKey, employees, 300000); // Cache trong 5 phút
            console.log(`✅ EMPLOYEE: Cached ${employees.length} employees.`);
            
            return employees;
        } catch (error) {
            console.error('❌ EMPLOYEE: Error fetching employees from Lark:', error.message);
            throw error;
        }
    }

    generateEmployeeId(fullName, phoneNumber) {
        return `${fullName} - ${phoneNumber}`;
    }


    async addEmployee(employeeData) {
        try {
            const transformedData = this.transformEmployeeForLark(employeeData);
            
            console.log('📤 EMPLOYEE SERVICE: Sending data to Lark:', transformedData);
            console.log('🔍 EMPLOYEE SERVICE: Base ID:', this.baseId);
            console.log('🔍 EMPLOYEE SERVICE: Table ID:', this.tableId);
            console.log('🔍 EMPLOYEE SERVICE: URL will be:', `/bitable/v1/apps/${this.baseId}/tables/${this.tableId}/records`);
            
            const response = await LarkClient.post(`/bitable/v1/apps/${this.baseId}/tables/${this.tableId}/records`, {
                fields: transformedData
            });

            console.log('📥 EMPLOYEE SERVICE: Raw Lark response:', response);
            console.log('📥 EMPLOYEE SERVICE: Response status:', response?.status);
            console.log('📥 EMPLOYEE SERVICE: Response data:', response?.data);

            // Clear cache
            CacheService.delete('employees_all');
            
            return {
                success: true,
                employeeId: employeeData.employeeId,
                larkResponse: response  // ✅ THÊM: Debug response
            };
            
        } catch (error) {
            console.error('❌ EMPLOYEE SERVICE: Full error:', error);
            console.error('❌ EMPLOYEE SERVICE: Error message:', error.message);
            console.error('❌ EMPLOYEE SERVICE: Error stack:', error.stack);
            await this.handleError(error, 'addEmployee');
            throw error;
        }
    }



    async updateEmployee(id, employeeData) {
        try {
            const transformedData = this.transformEmployeeForLark(employeeData);
            
            const response = await LarkClient.put(`/bitable/v1/apps/${this.baseId}/tables/${this.tableId}/records/${id}`, {
                fields: transformedData
            });

            // Clear cache
            CacheService.delete('employees_all');
            
            return this.transformEmployeeData([response.data])[0];
        } catch (error) {
            await this.handleError(error, 'updateEmployee');
            throw error;
        }
    }

    async deleteEmployee(id) {
        try {
            await LarkClient.delete(`/bitable/v1/apps/${this.baseId}/tables/${this.tableId}/records/${id}`);
            
            // Clear cache
            CacheService.delete('employees_all');
            
            return true;
        } catch (error) {
            await this.handleError(error, 'deleteEmployee');
            throw error;
        }
    }

    async checkEmployeeIdExists(employeeId) {
        try {
            console.log(`🔍 EMPLOYEE: Checking for duplicate ID: ${employeeId}`);
            
            // ✅ Sử dụng getAllRecords để đảm bảo kiểm tra trên toàn bộ nhân viên
            const response = await LarkClient.getAllRecords(
                `/bitable/v1/apps/${this.baseId}/tables/${this.tableId}/records`
            );
            const allEmployees = this.transformEmployeeData(response.data?.items || []);
            
            const exists = allEmployees.some(emp => emp.employeeId === employeeId);
            console.log(`✅ EMPLOYEE: Duplicate check result: ${exists ? 'EXISTS' : 'NOT_EXISTS'}`);
            
            return exists;
        } catch (error) {
            console.error('❌ EMPLOYEE: Error checking for duplicate employee ID:', error);
            // An toàn nhất là trả về false để không chặn việc thêm nhân viên nếu API lỗi
            return false;
        }
    }


    async searchEmployees(query) {
        const employees = await this.getAllEmployees();
        
        if (!query) return employees;
        
        const searchTerm = query.toLowerCase();
        return employees.filter(emp => 
            emp.fullName.toLowerCase().includes(searchTerm) ||
            emp.employeeId.toLowerCase().includes(searchTerm) ||
            emp.phoneNumber.includes(searchTerm)
        );
    }

    //generateEmployeeId(fullName, phoneNumber) {
    //    return `${fullName} - ${phoneNumber}`;
    //}

    transformEmployeeData(larkData) {
        
        if (!Array.isArray(larkData)) {
            console.warn('⚠️ SERVICE: larkData is not an array:', typeof larkData);
            return [];
        }
        
        const transformed = larkData.map((record, index) => {

            const result = {
                id: record.record_id,
                // ✅ SỬA: Sử dụng tên cột tiếng Việt từ Larkbase
                employeeId: record.fields['Mã nhân viên'] || '',
                fullName: record.fields['Họ tên'] || '',
                phoneNumber: record.fields['Số điện thoại'] || '',
                gender: record.fields['Giới tính'] || '',
                position: record.fields['Vị trí'] || '',
                hourlyRate: record.fields['Mức lương/giờ'] || 0,
                bankAccount: record.fields['Số tài khoản'] || '',
                bankName: record.fields['Ngân hàng'] || '',
                recruitmentLink: record.fields['Link đề xuất tuyển dụng'] || '',
                status: record.fields['Trạng thái'] || 'active',
                createdAt: record.fields['Created At'] || new Date().toISOString(),
                updatedAt: record.fields['Updated At'] || new Date().toISOString()
            };
            
            return result;
        });
        
        return transformed;
    }

    transformEmployeeForLark(employeeData) {
        return {
            'Mã nhân viên': employeeData.employeeId,
            'Họ tên': employeeData.fullName,
            'Số điện thoại': employeeData.phoneNumber,
            'Giới tính': employeeData.gender,
            'Vị trí': employeeData.position || '',
            'Mức lương/giờ': employeeData.hourlyRate,
            'Số tài khoản': employeeData.bankAccount,
            'Ngân hàng': employeeData.bankName,
            'Link đề xuất tuyển dụng': employeeData.recruitmentLink || '',
            'Trạng thái': employeeData.status || 'active'
        };
    }

    // getMockEmployees() {
    //     return [
    //         {
    //             id: 'emp_001',
    //             employeeId: 'Nguyễn Văn A - 0123456789',
    //             fullName: 'Nguyễn Văn A',
    //             phoneNumber: '0123456789',
    //             gender: 'Nam',
    //             position: 'Nhân viên bán hàng',
    //             hourlyRate: 50000,
    //             bankAccount: '123456789',
    //             bankName: 'Vietcombank',
    //             recruitmentLink: '20250620014',
    //             status: 'active',
    //             createdAt: new Date().toISOString(),
    //             updatedAt: new Date().toISOString()
    //         },
    //         {
    //             id: 'emp_002',
    //             employeeId: 'Trần Thị B - 0987654321',
    //             fullName: 'Trần Thị B',
    //             phoneNumber: '0987654321',
    //             gender: 'Nữ',
    //             position: 'Thu ngân',
    //             hourlyRate: 45000,
    //             bankAccount: '987654321',
    //             bankName: 'Techcombank',
    //             recruitmentLink: '20250620017',
    //             status: 'active',
    //             createdAt: new Date().toISOString(),
    //             updatedAt: new Date().toISOString()
    //         }
    //     ];
    // }
}

export default EmployeeService;
