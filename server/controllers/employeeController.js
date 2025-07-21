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
            const { fullName, phoneNumber, gender, hourlyRate, bankAccount, bankName, workHistoryData } = req.body;

            // Check for duplicate request numbers (phần này vẫn nên giữ lại vì nó là logic nghiệp vụ đặc thù)
            const requestNos = workHistoryData.map(item => item.requestNo);
            const uniqueRequestNos = [...new Set(requestNos)];
            if (requestNos.length !== uniqueRequestNos.length) {
                return res.status(400).json(formatResponse(
                    false, 
                    'Không được trùng lặp Request No.', 
                    null, 
                    'DUPLICATE_REQUEST_NO'
                ));
            }

            // Generate employee ID and check for duplicates (đã chuyển vào service)
            const employeeId = larkServiceManager.getService('employee').generateEmployeeId(fullName, phoneNumber);
            const isDuplicate = await larkServiceManager.checkEmployeeIdExists(employeeId);
            if (isDuplicate) {
                return res.status(409).json(formatResponse(
                    false, 
                    'Mã nhân viên đã tồn tại trong hệ thống', 
                    null, 
                    'DUPLICATE_EMPLOYEE_ID'
                ));
            }
            
            // Prepare employee data
            const employeeData = {
                employeeId,
                fullName,
                phoneNumber,
                gender,
                hourlyRate: parseFloat(hourlyRate),
                bankAccount,
                bankName,
                recruitmentLink: workHistoryData.map(item => item.requestNo).join(', '),
                status: 'active',
                createdAt: new Date().toISOString()
            };

            // Create employee
            const employee = await larkServiceManager.addEmployee(employeeData);
            
            // Add work history entries with duplicate check
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
                    employeeId: employeeId,
                    requestNo: historyEntry.requestNo
                });
                workHistoryResults.push(workHistory);
            }

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
            const { fullName, phoneNumber, gender, hourlyRate, bankAccount, bankName, recruitmentLink, status } = req.body;
            
            // Generate new employee ID with updated info
            const employeeId = larkServiceManager.getService('employee').generateEmployeeId(fullName, phoneNumber);
            const updatedData = {
                employeeId,
                fullName,
                phoneNumber,
                gender,
                hourlyRate: parseFloat(hourlyRate),
                bankAccount,
                bankName,
                recruitmentLink: recruitmentLink || '',
                status,
                updatedAt: new Date().toISOString()
            };
            
            const employee = await larkServiceManager.updateEmployee(id, updatedData);
            
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
            const { employeeId, requestNo } = req.body;
            
            if (!employeeId || !requestNo) {
                return res.status(400).json(formatResponse(
                    false, 
                    'Thiếu thông tin bắt buộc', 
                    null, 
                    'VALIDATION_ERROR'
                ));
            }
            
            const workHistory = await larkServiceManager.addWorkHistory({
                employeeId,
                requestNo
            });
            
            res.json(formatResponse(true, 'Thêm work history thành công', { workHistory }));
            
        } catch (error) {
            console.error('❌ Controller: addWorkHistory failed:', error);
            res.status(500).json(formatResponse(
                false, 
                `Lỗi khi thêm work history: ${error.message}`, 
                null, 
                'WORK_HISTORY_ADD_FAILED'
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

// DÒNG BỊ LỖI ĐÃ ĐƯỢC XÓA BỎ
