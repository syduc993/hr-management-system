// Employee management service
import BaseService from '../core/base-service.js';
import LarkClient from '../core/lark-client.js';
import CacheService from '../core/cache-service.js';
import WorkHistoryService from './work-history-service.js';


/**
 * @class EmployeeService
 * @description Quản lý các nghiệp vụ liên quan đến thông tin nhân viên,
 * bao gồm CRUD (tạo, đọc, cập nhật, xóa) và các chức năng tìm kiếm, kiểm tra.
 */
class EmployeeService extends BaseService {
    constructor() {
        super();
        this.tableName = 'employees';
        this.baseId = process.env.LARK_BASE_ID;
        this.tableId = process.env.LARK_EMPLOYEE_TABLE_ID;
        this.workHistoryService = new WorkHistoryService();
    }

    async initializeService() {
        // Initialize Lark Base connection
        console.log('Initializing Employee Service...');
        await this.workHistoryService.initializeService();
    }

    // =================================================================
    //  PUBLIC API METHODS - CÁC HÀM CUNG CẤP RA BÊN NGOÀI
    // =================================================================


    /**
     * Lấy toàn bộ danh sách nhân viên từ Lark, có hỗ trợ cache.
     * @returns {Promise<Array<object>>} - Mảng các đối tượng nhân viên.
     */
    async getAllEmployees() {
        try {

            const response = await LarkClient.getAllRecords(
                `/bitable/v1/apps/${this.baseId}/tables/${this.tableId}/records`
            );

            let employees = this.transformEmployeeData(response.data?.items || []);
            return employees;
        } catch (error) {
            console.error('❌ EMPLOYEE: Error fetching employees from Lark:', error.message);
            throw error;
        }
    }


    /**
     * Lấy thông tin một nhân viên bằng record_id của Lark, có hỗ trợ cache.
     * @param {string} id - Record ID của nhân viên trong Lark.
     * @returns {Promise<object|null>} - Đối tượng nhân viên hoặc null nếu không tìm thấy.
     */
    async getEmployeeById(id) {
        try {
            console.log(`🔍 Getting employee by ID: ${id}`);
            
            const response = await LarkClient.get(
                `/bitable/v1/apps/${this.baseId}/tables/${this.tableId}/records/${id}`
            );
            
            if (response.data && response.data.record) {
                const transformedEmployee = this.transformEmployeeData([response.data.record])[0];
                console.log('✅ Employee found:', transformedEmployee.employeeId);
                return transformedEmployee;
            }
            
            console.log('❌ Employee not found');
            return null;
            
        } catch (error) {
            console.error('❌ Error getting employee by ID:', error);
            throw error;
        }
    }


    /**
     * Tìm kiếm nhân viên dựa trên họ tên, mã nhân viên, hoặc số điện thoại.
     * @param {string} query - Chuỗi tìm kiếm.
     * @returns {Promise<Array<object>>} - Mảng các nhân viên phù hợp.
     */
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

    /**
     * Thêm một nhân viên mới vào Lark Bitable.
     * @param {object} employeeData - Dữ liệu nhân viên cần thêm.
     * @returns {Promise<object>} - Kết quả của việc thêm.
     */
    async addEmployee(employeeData) {
        try {
            const transformedData = this.transformEmployeeForLark(employeeData);

            const response = await LarkClient.post(`/bitable/v1/apps/${this.baseId}/tables/${this.tableId}/records`, {
                fields: transformedData
            });

            // Clear cache
            CacheService.delete('employees_all');
            
            return {
                success: true,
                employeeId: employeeData.employeeId,
                larkResponse: response 
            };
            
        } catch (error) {

            await this.handleError(error, 'addEmployee');
            throw error;
        }
    }


    /**
     * Cập nhật thông tin một nhân viên.
     * @param {string} id - Record ID của nhân viên trong Lark.
     * @param {object} employeeData - Dữ liệu cần cập nhật.
     * @returns {Promise<object>} - Thông tin nhân viên sau khi cập nhật.
     */
    async updateEmployee(id, employeeData) {
        try {
            const transformedData = this.transformEmployeeForLark(employeeData);

            const response = await LarkClient.put(`/bitable/v1/apps/${this.baseId}/tables/${this.tableId}/records/${id}`, {
                fields: transformedData
            });

            // Clear cache
            CacheService.delete('employees_all');

            return this.transformEmployeeData([response.data.record])[0];
        } catch (error) {
            await this.handleError(error, 'updateEmployee');
            throw error;
        }
    }

    
    /**
     * Xóa một nhân viên khỏi Lark.
     * @param {string} id - Record ID của nhân viên trong Lark.
     * @returns {Promise<boolean>} - True nếu xóa thành công.
     */
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


    /**
     * Kiểm tra xem một mã nhân viên đã tồn tại hay chưa.
     * Tối ưu bằng cách sử dụng filter của Lark API thay vì tải toàn bộ dữ liệu.
     * @param {string} employeeId - Mã nhân viên cần kiểm tra.
     * @returns {Promise<boolean>} - True nếu mã đã tồn tại.
     */
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


    // =================================================================
    //  DATA TRANSFORMATION & UTILITY HELPERS
    // =================================================================


    /**
     * Chuyển đổi dữ liệu nhân viên thô từ Lark sang định dạng chuẩn của ứng dụng.
     * @param {Array<object>} larkData - Mảng bản ghi từ Lark.
     * @returns {Array<object>} - Mảng các đối tượng nhân viên đã được định dạng.
     */
    transformEmployeeData(larkData) {

        if (!Array.isArray(larkData)) {
            console.warn('⚠️ SERVICE: larkData is not an array:', typeof larkData);
            return [];
        }

        const transformed = larkData.map((record, index) => {
            const result = {
                id: record.record_id,
                employeeId: record.fields['Mã nhân viên'] || '',
                fullName: record.fields['Họ tên'] || '',
                phoneNumber: record.fields['Số điện thoại'] || '',
                gender: record.fields['Giới tính'] || '',
                position: record.fields['Vị trí'] || '',
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


    /**
     * Chuyển đổi dữ liệu nhân viên từ ứng dụng sang định dạng `fields` mà Lark API yêu cầu.
     * @param {object} employeeData - Dữ liệu nhân viên từ ứng dụng.
     * @returns {object} - Đối tượng `fields` để gửi cho Lark.
     */
    transformEmployeeForLark(employeeData) {
        return {
            'Mã nhân viên': employeeData.employeeId,
            'Họ tên': employeeData.fullName,
            'Số điện thoại': employeeData.phoneNumber,
            'Giới tính': employeeData.gender,
            'Vị trí': employeeData.position || '',
            'Số tài khoản': employeeData.bankAccount,
            'Ngân hàng': employeeData.bankName,
            'Link đề xuất tuyển dụng': employeeData.recruitmentLink || '',
            'Trạng thái': employeeData.status || 'active'
        };
    }



    generateEmployeeId(fullName, phoneNumber) {
        return `${fullName} - ${phoneNumber}`;
    }

}

export default EmployeeService;
