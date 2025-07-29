// server/controllers/employeeController.js
import larkServiceManager from '../services/lark-service-manager.js';
import { formatResponse } from '../services/utils/response-formatter.js';

class EmployeeController {
    /**
     * Get all employees
     * @route GET /api/employees
     */
    async getAllEmployees(req, res) {
        try {
            console.log('CONTROLLER: Yêu cầu lấy danh sách nhân viên...');
            const employeeService = larkServiceManager.getService('employee');
            const employees = await employeeService.getAllEmployees();

            res.json(formatResponse(true, 'Lấy danh sách nhân viên thành công', employees));
        } catch (error) {
            console.error('❌ CONTROLLER: Lỗi khi lấy danh sách nhân viên:', error);
            res.status(500).json(formatResponse(
                false, 
                `Không thể tải danh sách nhân viên: ${error.message}`, 
                null, 
                'EMPLOYEE_LOAD_FAILED'
            ));
        }
    }

    /**
     * Add new employee with work history support
     * @route POST /api/employees
     */
    async addEmployee(req, res) {
        try {
            const { fullName, phoneNumber, gender, bankAccount, bankName, workHistoryData } = req.body;
            const employeeId = larkServiceManager.getService('employee').generateEmployeeId(fullName, phoneNumber);
            const employeeService = larkServiceManager.getService('employee');
            const isDuplicate = await employeeService.checkEmployeeIdExists(employeeId);
            if (isDuplicate) {
                return res.status(409).json(formatResponse(
                    false, 
                    'Mã nhân viên đã tồn tại trong hệ thống', 
                    null, 
                    'DUPLICATE_EMPLOYEE_ID'
                ));
            }
            
            const employeeData = {
                employeeId,
                fullName,
                phoneNumber,
                gender,
                bankAccount,
                bankName,
                recruitmentLink: workHistoryData.map(item => item.requestNo).join(', '),
                status: 'active',
                createdAt: new Date().toISOString()
            };

            const employee = await larkServiceManager.addEmployee(employeeData);
            
            const workHistoryResults = [];
            for (const historyEntry of workHistoryData) {
                const workHistoryExists = await larkServiceManager.checkWorkHistoryExists(employeeId, historyEntry.requestNo);
                if (workHistoryExists) {
                    return res.status(409).json(formatResponse(
                        false, 
                        `Work History đã tồn tại: ${employeeId} - ${historyEntry.requestNo}`, 
                        null, 
                        'DUPLICATE_WORK_HISTORY'
                    ));
                }
                
                const workHistory = await larkServiceManager.addWorkHistory({
                    employeeId,
                    requestNo: historyEntry.requestNo,
                    fromDate: historyEntry.fromDate,
                    toDate: historyEntry.toDate,
                    hourlyRate: historyEntry.hourlyRate
                });
                workHistoryResults.push(workHistory);
            }

            console.log('✅ CONTROLLER: Employee added successfully, clearing cache...');
            
            res.json(formatResponse(true, 'Thêm nhân viên thành công', {
                employee,
                workHistory: workHistoryResults
            }));
            
        } catch (error) {
            console.error('❌ Controller: addEmployee failed:', error);
            res.status(500).json(formatResponse(
                false, 
                `Lỗi hệ thống khi thêm nhân viên: ${error.message}`, 
                null, 
                'EMPLOYEE_ADD_FAILED'
            ));
        }
    }

    /**
     * Update employee
     * @route PUT /api/employees/:id
     */
    async updateEmployee(req, res) {
        try {
            const { id } = req.params;
            const { fullName, phoneNumber, gender, bankAccount, bankName, recruitmentLink, status } = req.body;
            
            const employeeId = larkServiceManager.getService('employee').generateEmployeeId(fullName, phoneNumber);
            const updatedData = {
                employeeId,
                fullName,
                phoneNumber,
                gender,
                bankAccount,
                bankName,
                recruitmentLink: recruitmentLink || '',
                status,
                updatedAt: new Date().toISOString()
            };
            
            const employee = await larkServiceManager.updateEmployee(id, updatedData);
            
            console.log('✅ CONTROLLER: Employee updated successfully, clearing cache...');
            
            res.json(formatResponse(true, 'Cập nhật nhân viên thành công', { employee }));
            
        } catch (error) {
            console.error('❌ Controller: updateEmployee failed:', error);
            res.status(500).json(formatResponse(
                false, 
                `Lỗi khi cập nhật nhân viên: ${error.message}`, 
                null, 
                'EMPLOYEE_UPDATE_FAILED'
            ));
        }
    }

    /**
     * Delete employee
     * @route DELETE /api/employees/:id
     */
    async deleteEmployee(req, res) {
        try {
            const { id } = req.params;
            await larkServiceManager.deleteEmployee(id);
            
            console.log('✅ CONTROLLER: Employee deleted successfully, clearing cache...');
            
            res.json(formatResponse(true, 'Xóa nhân viên thành công'));
        } catch (error) {
            console.error('❌ Controller: deleteEmployee failed:', error);
            res.status(500).json(formatResponse(
                false, 
                `Lỗi khi xóa nhân viên: ${error.message}`, 
                null, 
                'EMPLOYEE_DELETE_FAILED'
            ));
        }
    }

    /**
     * Search employees
     * @route GET /api/employees/search
     */
    async searchEmployees(req, res) {
        try {
            const { q } = req.query;
            const employees = await larkServiceManager.searchEmployees(q);
            res.json(formatResponse(true, 'Tìm kiếm thành công', employees));
        } catch (error) {
            console.error('❌ Controller: searchEmployees failed:', error);
            res.status(500).json(formatResponse(
                false, 
                `Lỗi khi tìm kiếm nhân viên: ${error.message}`, 
                null, 
                'EMPLOYEE_SEARCH_FAILED'
            ));
        }
    }

    /**
     * Get employee work history
     * @route GET /api/employees/:employeeId/work-history
     */
    async getEmployeeWorkHistory(req, res) {
        try {
            const { employeeId } = req.params;
            const workHistory = await larkServiceManager.getWorkHistoryByEmployee(employeeId);
            res.json(formatResponse(true, 'Lấy lịch sử làm việc thành công', workHistory));
        } catch (error) {
            console.error('❌ Controller: getEmployeeWorkHistory failed:', error);
            res.status(500).json(formatResponse(
                false, 
                `Lỗi khi lấy lịch sử làm việc: ${error.message}`, 
                null, 
                'WORK_HISTORY_LOAD_FAILED'
            ));
        }
    }

    /**
     * Add work history for employee
     * @route POST /api/employees/work-history
     */
    async addWorkHistory(req, res) {
        try {
            // ✅ CẬP NHẬT: Nhận thêm các trường mới từ request body
            const { employeeId, requestNo, fromDate, toDate, hourlyRate } = req.body;
            
            if (!employeeId || !requestNo) {
                return res.status(400).json(formatResponse(
                    false, 
                    'Thiếu thông tin bắt buộc: employeeId và requestNo', 
                    null, 
                    'VALIDATION_ERROR'
                ));
            }
            
            // ✅ CẬP NHẬT: Truyền tất cả các trường vào addWorkHistory
            const workHistory = await larkServiceManager.addWorkHistory({
                employeeId,
                requestNo,
                fromDate,      // ✅ THÊM
                toDate,        // ✅ THÊM
                hourlyRate     // ✅ THÊM
            });
            
            res.json(formatResponse(true, 'Thêm work history thành công', { workHistory }));
            
        } catch (error) {
            console.error('❌ Controller: addWorkHistory failed:', error);

            // ✅ CẬP NHẬT: Xử lý các loại lỗi cụ thể từ validation mới
            if (error.message.includes('bị trùng với lịch sử làm việc cũ')) {
                return res.status(409).json(formatResponse(
                    false,
                    error.message,
                    null,
                    'DATE_OVERLAP_CONFLICT'
                ));
            }

            if (error.message.includes('phải nằm trong khoảng ngày của đề xuất tuyển dụng')) {
                return res.status(400).json(formatResponse(
                    false,
                    error.message,
                    null,
                    'INVALID_DATE_RANGE'
                ));
            }

            if (error.message.includes('Từ ngày và Đến ngày là bắt buộc') || 
                error.message.includes('Đến ngày phải lớn hơn hoặc bằng Từ ngày')) {
                return res.status(400).json(formatResponse(
                    false,
                    error.message,
                    null,
                    'VALIDATION_ERROR'
                ));
            }

            res.status(500).json(formatResponse(
                false, 
                `Lỗi khi thêm work history: ${error.message}`, 
                null, 
                'WORK_HISTORY_ADD_FAILED'
            ));
        }
    }

    // ✅ THÊM MỚI: Update work history
    /**
     * Update work history entry
     * @route PUT /api/employees/work-history/:id
     */
    async updateWorkHistory(req, res) {
        try {
            const { id } = req.params;
            const { employeeId, requestNo, fromDate, toDate, hourlyRate } = req.body;
            
            if (!employeeId || !requestNo) {
                return res.status(400).json(formatResponse(
                    false, 
                    'Thiếu thông tin bắt buộc: employeeId và requestNo', 
                    null, 
                    'VALIDATION_ERROR'
                ));
            }
            
            console.log(`📝 CONTROLLER: Updating work history ID: ${id}...`);
            
            const workHistoryService = larkServiceManager.getService('workHistory');
            const updatedWorkHistory = await workHistoryService.updateWorkHistory(id, {
                employeeId,
                requestNo,
                fromDate,
                toDate,
                hourlyRate
            });
            
            console.log('✅ CONTROLLER: Work history updated successfully');
            
            res.json(formatResponse(true, 'Cập nhật lịch sử công việc thành công', { workHistory: updatedWorkHistory }));
            
        } catch (error) {
            console.error('❌ Controller: updateWorkHistory failed:', error);

            // Xử lý các loại lỗi cụ thể
            if (error.message.includes('bị trùng với lịch sử làm việc cũ')) {
                return res.status(409).json(formatResponse(
                    false,
                    error.message,
                    null,
                    'DATE_OVERLAP_CONFLICT'
                ));
            }

            if (error.message.includes('phải nằm trong khoảng ngày của đề xuất tuyển dụng')) {
                return res.status(400).json(formatResponse(
                    false,
                    error.message,
                    null,
                    'INVALID_DATE_RANGE'
                ));
            }

            if (error.message.includes('Từ ngày và Đến ngày là bắt buộc') || 
                error.message.includes('Đến ngày phải lớn hơn hoặc bằng Từ ngày')) {
                return res.status(400).json(formatResponse(
                    false,
                    error.message,
                    null,
                    'VALIDATION_ERROR'
                ));
            }

            res.status(500).json(formatResponse(
                false, 
                `Lỗi khi cập nhật work history: ${error.message}`, 
                null, 
                'WORK_HISTORY_UPDATE_FAILED'
            ));
        }
    }

    // ✅ THÊM MỚI: Delete work history
    /**
     * Delete work history entry
     * @route DELETE /api/employees/work-history/:id
     */
    async deleteWorkHistory(req, res) {
        try {
            const { id } = req.params;
            
            console.log(`🗑️ CONTROLLER: Deleting work history ID: ${id}...`);
            
            const workHistoryService = larkServiceManager.getService('workHistory');
            await workHistoryService.deleteWorkHistory(id);
            
            console.log('✅ CONTROLLER: Work history deleted successfully');
            
            res.json(formatResponse(true, 'Xóa lịch sử công việc thành công'));
            
        } catch (error) {
            console.error('❌ Controller: deleteWorkHistory failed:', error);
            res.status(500).json(formatResponse(
                false, 
                `Lỗi khi xóa work history: ${error.message}`, 
                null, 
                'WORK_HISTORY_DELETE_FAILED'
            ));
        }
    }
}

// Export instance methods
const employeeController = new EmployeeController();

export const getAllEmployees = employeeController.getAllEmployees.bind(employeeController);
export const addEmployee = employeeController.addEmployee.bind(employeeController);
export const updateEmployee = employeeController.updateEmployee.bind(employeeController);
export const deleteEmployee = employeeController.deleteEmployee.bind(employeeController);
export const searchEmployees = employeeController.searchEmployees.bind(employeeController);
export const getEmployeeWorkHistory = employeeController.getEmployeeWorkHistory.bind(employeeController);
export const addWorkHistory = employeeController.addWorkHistory.bind(employeeController);
// ✅ THÊM MỚI: Export 2 methods mới
export const updateWorkHistory = employeeController.updateWorkHistory.bind(employeeController);
export const deleteWorkHistory = employeeController.deleteWorkHistory.bind(employeeController);
