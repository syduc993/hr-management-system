// server/controllers/employeeController.js
import larkServiceManager from '../services/lark-service-manager.js';
import { formatResponse } from '../services/utils/response-formatter.js';
import { EmployeeValidator } from '../services/employees/index.js';


class EmployeeController {
    /**
     * Get all employees
     * @route GET /api/employees
     */
    async getAllEmployees(req, res) {
        try {
            const employees = await larkServiceManager.getAllEmployees();
            res.json(formatResponse(true, 'Lấy danh sách nhân viên thành công', employees));
        } catch (error) {
            console.error('❌ Controller: getAllEmployees failed:', error);
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
            
            // Validate employee data
            const employeeErrors = EmployeeValidator.validateEmployeeData({
                fullName, phoneNumber, gender, hourlyRate, bankAccount, bankName
            });
            
            if (employeeErrors.length > 0) {
                return res.status(400).json(formatResponse(
                    false, 
                    employeeErrors.join(', '), 
                    null, 
                    'VALIDATION_ERROR'
                ));
            }


            // Validate work history
            if (!workHistoryData || workHistoryData.length === 0) {
                return res.status(400).json(formatResponse(
                    false, 
                    'Vui lòng chọn ít nhất một đề xuất tuyển dụng', 
                    null, 
                    'WORK_HISTORY_REQUIRED'
                ));
            }


            // Check for duplicate request numbers
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


            // Generate employee ID
            const employeeId = this.generateEmployeeId(fullName, phoneNumber);
            
            // Check for duplicate employee ID
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
                // ✅ CHECK DUPLICATE cho từng item
                const workHistoryExists = await larkServiceManager.checkWorkHistoryExists(employeeId, historyEntry.requestNo);
                
                if (workHistoryExists) {
                    return res.status(409).json(formatResponse(
                        false, 
                        `Work History đã tồn tại: ${employeeId} - ${historyEntry.requestNo}`, 
                        null, 
                        'DUPLICATE_WORK_HISTORY'
                    ));
                }
                
                // Nếu không trùng, thêm work history
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
            
            if (error.message.includes('DUPLICATE_EMPLOYEE_ID')) {
                return res.status(409).json(formatResponse(
                    false, 
                    'Mã nhân viên đã tồn tại trong hệ thống', 
                    null, 
                    'DUPLICATE_EMPLOYEE_ID'
                ));
            }
            
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
            const employeeId = this.generateEmployeeId(fullName, phoneNumber);
            
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
     * Get employee statistics for dashboard
     * @route GET /api/employees/stats
     */
    async getEmployeeStats(req, res) {
        try {
            const employeeService = larkServiceManager.getService('employee');
            const employees = await employeeService.getAllEmployees();
            
            const stats = {
                totalEmployees: employees.length,
                activeEmployees: employees.filter(emp => emp.status === 'active').length,
                inactiveEmployees: employees.filter(emp => emp.status === 'inactive').length
            };
            
            res.json(formatResponse(true, 'Lấy thống kê nhân viên thành công', stats));
            
        } catch (error) {
            console.error('❌ Controller: getEmployeeStats failed:', error);
            res.status(500).json(formatResponse(
                false, 
                `Không thể lấy thống kê nhân viên: ${error.message}`, 
                null, 
                'EMPLOYEE_STATS_LOAD_FAILED'
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
     * Get recruitment requests
     * @route GET /api/employees/recruitment-requests
     */
    async getRecruitmentRequests(req, res) {
        try {
            const { status, approvalStatus, requester, department } = req.query;
            
            const filters = {};
            if (status) filters.status = status;
            if (approvalStatus) filters.approvalStatus = approvalStatus;
            if (requester) filters.requester = requester;
            if (department) filters.department = department;
            
            const requests = await larkServiceManager.getRecruitmentRequests(filters);
            res.json(formatResponse(true, 'Lấy danh sách yêu cầu tuyển dụng thành công', requests));
            
        } catch (error) {
            console.error('❌ Controller: getRecruitmentRequests failed:', error);
            res.status(500).json(formatResponse(
                false, 
                `Không thể tải yêu cầu tuyển dụng: ${error.message}`, 
                null, 
                'RECRUITMENT_LOAD_FAILED'
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


    // ==================== STORE MANAGEMENT ====================
    async getStores(req, res) {
        try {
            const stores = await larkServiceManager.getAllStores();
            res.json(formatResponse(true, 'Lấy danh sách cửa hàng thành công', stores));
        } catch (error) {
            console.error('❌ Controller: getStores failed:', error);
            res.status(500).json(formatResponse(
                false, 
                `Lỗi khi tải danh sách cửa hàng: ${error.message}`, 
                null, 
                'STORE_LOAD_FAILED'
            ));
        }
    }


    async addStore(req, res) {
        try {
            const { storeName, address } = req.body;
            
            if (!storeName || !address) {
                return res.status(400).json(formatResponse(
                    false, 
                    'Thiếu thông tin bắt buộc', 
                    null, 
                    'VALIDATION_ERROR'
                ));
            }


            const store = {
                storeName,
                address,
                status: 'active',
                createdAt: new Date().toISOString()
            };
            
            const result = await larkServiceManager.addStore(store);
            res.json(formatResponse(true, 'Thêm cửa hàng thành công', { store: result }));
            
        } catch (error) {
            console.error('❌ Controller: addStore failed:', error);
            res.status(500).json(formatResponse(
                false, 
                `Lỗi khi thêm cửa hàng: ${error.message}`, 
                null, 
                'STORE_ADD_FAILED'
            ));
        }
    }


    async updateStore(req, res) {
        try {
            const { id } = req.params;
            const updatedData = {
                ...req.body,
                updatedAt: new Date().toISOString()
            };
            
            const result = await larkServiceManager.updateStore(id, updatedData);
            res.json(formatResponse(true, 'Cập nhật cửa hàng thành công', { store: result }));
            
        } catch (error) {
            console.error('❌ Controller: updateStore failed:', error);
            res.status(500).json(formatResponse(
                false, 
                `Lỗi khi cập nhật cửa hàng: ${error.message}`, 
                null, 
                'STORE_UPDATE_FAILED'
            ));
        }
    }


    async deleteStore(req, res) {
        try {
            const { id } = req.params;
            await larkServiceManager.deleteStore(id);
            res.json(formatResponse(true, 'Xóa cửa hàng thành công'));
        } catch (error) {
            console.error('❌ Controller: deleteStore failed:', error);
            res.status(500).json(formatResponse(
                false, 
                `Lỗi khi xóa cửa hàng: ${error.message}`, 
                null, 
                'STORE_DELETE_FAILED'
            ));
        }
    }


    // ==================== POSITION MANAGEMENT ====================
    async getPositions(req, res) {
        try {
            const positions = await larkServiceManager.getAllPositions();
            res.json(formatResponse(true, 'Lấy danh sách vị trí thành công', positions));
        } catch (error) {
            console.error('❌ Controller: getPositions failed:', error);
            res.status(500).json(formatResponse(
                false, 
                `Lỗi khi tải danh sách vị trí: ${error.message}`, 
                null, 
                'POSITION_LOAD_FAILED'
            ));
        }
    }


    async addPosition(req, res) {
        try {
            const { positionName, description } = req.body;
            
            if (!positionName) {
                return res.status(400).json(formatResponse(
                    false, 
                    'Thiếu thông tin bắt buộc', 
                    null, 
                    'VALIDATION_ERROR'
                ));
            }


            const position = {
                positionName,
                description: description || '',
                status: 'active',
                createdAt: new Date().toISOString()
            };
            
            const result = await larkServiceManager.addPosition(position);
            res.json(formatResponse(true, 'Thêm vị trí thành công', { position: result }));
            
        } catch (error) {
            console.error('❌ Controller: addPosition failed:', error);
            res.status(500).json(formatResponse(
                false, 
                `Lỗi khi thêm vị trí: ${error.message}`, 
                null, 
                'POSITION_ADD_FAILED'
            ));
        }
    }


    async updatePosition(req, res) {
        try {
            const { id } = req.params;
            const updatedData = {
                ...req.body,
                updatedAt: new Date().toISOString()
            };
            
            const result = await larkServiceManager.updatePosition(id, updatedData);
            res.json(formatResponse(true, 'Cập nhật vị trí thành công', { position: result }));
            
        } catch (error) {
            console.error('❌ Controller: updatePosition failed:', error);
            res.status(500).json(formatResponse(
                false, 
                `Lỗi khi cập nhật vị trí: ${error.message}`, 
                null, 
                'POSITION_UPDATE_FAILED'
            ));
        }
    }


    async deletePosition(req, res) {
        try {
            const { id } = req.params;
            await larkServiceManager.deletePosition(id);
            res.json(formatResponse(true, 'Xóa vị trí thành công'));
        } catch (error) {
            console.error('❌ Controller: deletePosition failed:', error);
            res.status(500).json(formatResponse(
                false, 
                `Lỗi khi xóa vị trí: ${error.message}`, 
                null, 
                'POSITION_DELETE_FAILED'
            ));
        }
    }


    // ==================== HELPER METHODS ====================
    generateEmployeeId(fullName, phoneNumber) {
        return `${fullName} - ${phoneNumber}`;
    }
}


// Export instance methods
const employeeController = new EmployeeController();


export const getAllEmployees = employeeController.getAllEmployees.bind(employeeController);
export const addEmployee = employeeController.addEmployee.bind(employeeController);
export const updateEmployee = employeeController.updateEmployee.bind(employeeController);
export const deleteEmployee = employeeController.deleteEmployee.bind(employeeController);
export const getEmployeeStats = employeeController.getEmployeeStats.bind(employeeController);
export const searchEmployees = employeeController.searchEmployees.bind(employeeController);
export const getRecruitmentRequests = employeeController.getRecruitmentRequests.bind(employeeController);
export const getEmployeeWorkHistory = employeeController.getEmployeeWorkHistory.bind(employeeController);
export const addWorkHistory = employeeController.addWorkHistory.bind(employeeController);


export const getStores = employeeController.getStores.bind(employeeController);
export const addStore = employeeController.addStore.bind(employeeController);
export const updateStore = employeeController.updateStore.bind(employeeController);
export const deleteStore = employeeController.deleteStore.bind(employeeController);


export const getPositions = employeeController.getPositions.bind(employeeController);
export const addPosition = employeeController.addPosition.bind(employeeController);
export const updatePosition = employeeController.updatePosition.bind(employeeController);
export const deletePosition = employeeController.deletePosition.bind(employeeController);


export { EmployeeController };
