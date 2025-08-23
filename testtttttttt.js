// server/controllers/attendanceController.js
import larkServiceManager from '../services/lark-service-manager.js';
import { formatResponse } from '../services/utils/response-formatter.js';


/* ======================= Lấy danh sách bản ghi chấm công ======================= */
/**
 * GET: Lấy danh sách các bản ghi chấm công (attendance logs) dựa trên filter từ query parameters.
 * - Trả về data bản ghi chấm công dạng list.
 * - Xử lý lỗi và gửi error message nếu có vấn đề.
 */
export const getAttendanceLogs = async (req, res) => {
    try {
        const filters = req.query;
        const attendanceService = larkServiceManager.getService('attendance');
        const logs = await attendanceService.getAttendanceLogs(filters);
        
        res.json(formatResponse(true, 'Lấy bản ghi chấm công thành công', logs));
    } catch (error) {
        console.error('❌ Controller: getAttendanceLogs failed:', error);
        res.status(500).json(formatResponse(
            false, 
            `Lỗi khi lấy bản ghi chấm công: ${error.message}`, 
            null, 
            'ATTENDANCE_LOAD_FAILED'
        ));
    }
};


/* ======================= Thêm bản ghi chấm công mới ======================= */
/**
 * POST: Thêm một bản ghi chấm công mới cho nhân viên.
 * - Nhận attendanceData từ body request (employeeId, type, position).
 * - Validate dữ liệu (đầy đủ, hợp lệ).
 * - Gọi service để lưu bản ghi mới vào hệ thống.
 * - Trả kết quả thành công/thất bại cho client.
 */
export const addAttendanceLog = async (req, res) => {
    try {
        const attendanceData = req.body;
        
        // Validate required fields
        if (!attendanceData.employeeId || !attendanceData.type || !attendanceData.position) {
            return res.status(400).json(formatResponse(
                false, 
                'Thiếu thông tin bắt buộc: employeeId, type (Checkin/Checkout), position', 
                null, 
                'VALIDATION_ERROR'
            ));
        }

        // Validate position values
        const validPositions = ['Nhân viên Bán hàng', 'Nhân viên Thu ngân', 'Nhân viên Tiếp đón', 'Nhân viên Mascot'];
        if (!validPositions.includes(attendanceData.position)) {
            return res.status(400).json(formatResponse(
                false, 
                `Vị trí không hợp lệ. Phải là một trong: ${validPositions.join(', ')}`, 
                null, 
                'INVALID_POSITION'
            ));
        }

        // Validate type values
        if (!['Checkin', 'Checkout'].includes(attendanceData.type)) {
            return res.status(400).json(formatResponse(
                false, 
                'Phân loại phải là "Checkin" hoặc "Checkout"', 
                null, 
                'INVALID_TYPE'
            ));
        }

        const attendanceService = larkServiceManager.getService('attendance');
        const result = await attendanceService.addAttendanceLog(attendanceData);
        
        res.json(formatResponse(true, 'Thêm bản ghi chấm công thành công', result));
    } catch (error) {
        console.error('❌ Controller: addAttendanceLog failed:', error);
        res.status(500).json(formatResponse(
            false, 
            `Lỗi khi thêm bản ghi chấm công: ${error.message}`, 
            null, 
            'ATTENDANCE_ADD_FAILED'
        ));
    }
};


/* ======================= Tính tổng giờ công tất cả nhân viên ======================= */
/**
 * GET: Lấy tổng hợp giờ công cho tất cả nhân viên (theo từng ngày).
 * - Lấy dữ liệu giờ công từ service.
 * - Gắn thêm thông tin nhân viên (tên, position, ...) vào mỗi record.
 * - Trả về list tổng hợp theo ngày + một số summary.
 */


export const getEmployeeHours = async (req, res) => {
    try {
        
        const attendanceService = larkServiceManager.getService('attendance');
        const employeeService = larkServiceManager.getService('employee');
        
        // Lấy dữ liệu giờ công từ service
        const employeeHours = await attendanceService.getEmployeeHours();
        
        // Lấy thông tin chi tiết nhân viên để hiển thị tên
        const employees = await employeeService.getAllEmployees();
        const employeeMap = new Map(employees.map(emp => [emp.employeeId, emp]));
        
        // Transform data để phù hợp với frontend
        const transformedData = [];
        
        for (const [employeeId, dailyHours] of Object.entries(employeeHours)) {
            const employee = employeeMap.get(employeeId);
            
            if (!employee) {
                console.warn(`⚠️ Employee not found: ${employeeId}`);
                continue;
            }
            
            // Thêm thông tin nhân viên vào từng ngày
            dailyHours.forEach(dayData => {
                transformedData.push({
                    employeeId: employeeId,
                    fullName: employee.fullName,
                    date: dayData.date,
                    position: dayData.position,
                    totalHours: dayData.totalHours,
                    warnings: dayData.warnings || [],
                    hasError: false
                });
            });
        }
        
        // Sắp xếp theo tên nhân viên và ngày
        transformedData.sort((a, b) => {
            if (a.fullName !== b.fullName) {
                return a.fullName.localeCompare(b.fullName);
            }
            return new Date(b.date) - new Date(a.date); // Ngày mới nhất trước
        });
        
        console.log(`✅ Controller: Processed ${transformedData.length} employee hour records`);
        
        res.json(formatResponse(true, 'Lấy tổng giờ công thành công', {
            employeeHours: transformedData,
            summary: {
                totalEmployees: new Set(transformedData.map(d => d.employeeId)).size,
                totalRecords: transformedData.length,
                recordsWithErrors: transformedData.filter(d => d.hasError).length,
                recordsWithWarnings: transformedData.filter(d => d.warnings.length > 0).length
            }
        }));
        
    } catch (error) {
        console.error('❌ Controller: getEmployeeHours failed:', error);
        res.status(500).json(formatResponse(
            false, 
            `Lỗi khi lấy tổng giờ công: ${error.message}`, 
            null, 
            'EMPLOYEE_HOURS_LOAD_FAILED'
        ));
    }
};


/* ======================= Thống kê tổng hợp chấm công ======================= */
/**
 * GET: Lấy thống kê tổng hợp chấm công trong khoảng thời gian (ngày bắt đầu/kết thúc).
 * - Tổng số lượt chấm công (totalLogs).
 * - Số nhân viên duy nhất (uniqueEmployees).
 * - Thống kê theo loại (Checkin/Checkout) và theo vị trí.
 */
export const getAttendanceStats = async (req, res) => {
    try {
        const { dateFrom, dateTo } = req.query;
        
        const attendanceService = larkServiceManager.getService('attendance');
        const filters = {};
        
        if (dateFrom) filters.dateFrom = dateFrom;
        if (dateTo) filters.dateTo = dateTo;
        
        const logs = await attendanceService.getAttendanceLogs(filters);
        
        // Tính toán thống kê
        const stats = {
            totalLogs: logs.length,
            uniqueEmployees: new Set(logs.map(log => log.employeeId)).size,
            logsByType: {
                checkin: logs.filter(log => log.type === 'Checkin').length,
                checkout: logs.filter(log => log.type === 'Checkout').length
            },
            logsByPosition: {}
        };
        
        // Đếm theo vị trí
        logs.forEach(log => {
            if (log.position) {
                stats.logsByPosition[log.position] = (stats.logsByPosition[log.position] || 0) + 1;
            }
        });
        
        res.json(formatResponse(true, 'Lấy thống kê chấm công thành công', stats));
        
    } catch (error) {
        console.error('❌ Controller: getAttendanceStats failed:', error);
        res.status(500).json(formatResponse(
            false, 
            `Lỗi khi lấy thống kê chấm công: ${error.message}`, 
            null, 
            'ATTENDANCE_STATS_FAILED'
        ));
    }
};


/* ======================= Giờ công chi tiết 1 nhân viên ======================= */
/**
 * GET: Lấy chi tiết giờ công của một nhân viên (theo employeeId và khoảng ngày).
 * - list bản ghi raw (logs).
 * - bảng tổng hợp giờ công từng ngày (dailyHours).
 * - tổng kết số ngày và tổng số giờ thực tế.
 */
export const getEmployeeDetailedHours = async (req, res) => {
    try {
        const { employeeId } = req.params;
        const { dateFrom, dateTo } = req.query;
        
        if (!employeeId) {
            return res.status(400).json(formatResponse(
                false, 
                'Employee ID là bắt buộc', 
                null, 
                'MISSING_EMPLOYEE_ID'
            ));
        }
        
        const attendanceService = larkServiceManager.getService('attendance');
        const filters = { employeeId };
        
        if (dateFrom) filters.dateFrom = dateFrom;
        if (dateTo) filters.dateTo = dateTo;
        
        const logs = await attendanceService.getAttendanceLogs(filters);
        const employeeHours = await attendanceService.getEmployeeHours();
        
        const employeeData = employeeHours[employeeId] || [];
        
        res.json(formatResponse(true, 'Lấy giờ công chi tiết thành công', {
            employeeId,
            logs,
            dailyHours: employeeData,
            summary: {
                totalDays: employeeData.length,
                totalHours: employeeData.reduce((sum, day) => {
                    // Extract numeric hours from formatted string like "8 giờ 30 phút"
                    const match = day.totalHours.match(/(\d+)\s*giờ(?:\s*(\d+)\s*phút)?/);
                    if (match) {
                        const hours = parseInt(match[1]) || 0;
                        const minutes = parseInt(match[2]) || 0;
                        return sum + hours + (minutes / 60);
                    }
                    return sum;
                }, 0)
            }
        }));
        
    } catch (error) {
        console.error('❌ Controller: getEmployeeDetailedHours failed:', error);
        res.status(500).json(formatResponse(
            false, 
            `Lỗi khi lấy giờ công chi tiết: ${error.message}`, 
            null, 
            'EMPLOYEE_DETAILED_HOURS_FAILED'
        ));
    }
};




// server/controllers/authController.js
import larkServiceManager from '../services/lark-service-manager.js';
import { formatResponse } from '../services/utils/response-formatter.js';

/**
 * Xử lý đăng nhập người dùng.
 * Controller gọi đến AuthService để xác thực.
 * @route POST /api/auth/login
 */
const login = async (req, res) => {
    try {
        const { username, password } = req.body;
        const authService = larkServiceManager.getService('auth');

        // Gọi service để xử lý logic đăng nhập
        const result = await authService.login({ username, password });

        // Nếu service trả về thành công, tạo session
        if (result.success) {
            req.session.user = {
                id: result.user.id,
                username: result.user.username,
                role: result.user.role,
                fullName: result.user.fullName
            };
            
            // Trả về response thành công với thông tin user
            res.json(formatResponse(true, result.message, { user: req.session.user }));
        } else {
            // Trường hợp service xử lý nhưng không thành công (ít xảy ra với logic hiện tại)
             res.status(401).json(formatResponse(false, result.message, null, 'LOGIN_FAILED'));
        }

    } catch (error) {
        // Bắt lỗi do service throw (ví dụ: sai credentials)
        console.error('❌ Controller: login failed:', error.message);
        res.status(401).json(formatResponse(false, 'Tên đăng nhập hoặc mật khẩu không đúng.', null, 'INVALID_CREDENTIALS'));
    }
};

/**
 * Xử lý đăng xuất người dùng.
 * @route POST /api/auth/logout
 */
const logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('❌ Controller: logout failed:', err);
            return res.status(500).json(formatResponse(false, 'Không thể đăng xuất', null, 'LOGOUT_ERROR'));
        }
        res.clearCookie('connect.sid'); // Xóa cookie session phía client
        res.json(formatResponse(true, 'Đăng xuất thành công'));
    });
};

/**
 * Lấy thông tin profile của user đang đăng nhập.
 * @route GET /api/auth/profile
 */
const getProfile = (req, res) => {
    // req.user được gán từ middleware `authenticateUser`
    if (req.user) {
        res.json(formatResponse(true, 'Lấy thông tin người dùng thành công', { user: req.user }));
    } else {
        res.status(401).json(formatResponse(false, 'Người dùng chưa được xác thực', null, 'UNAUTHENTICATED'));
    }
};

export {
    login,
    logout,
    getProfile
};


// server/controllers/employeeController.js
import larkServiceManager from '../services/lark-service-manager.js';
import { formatResponse } from '../services/utils/response-formatter.js';
import CacheService from '../services/core/cache-service.js';
class EmployeeController {



    /* =================================================================================== */
    /* ======================= API Chính - Quản lý Nhân viên ======================= */
    /* =================================================================================== */



    /* ======================= Quản lý danh sách nhân viên ======================= */
    /**
     * GET: Lấy danh sách tất cả nhân viên trong hệ thống.
     * - Trả về array chứa thông tin cơ bản của tất cả nhân viên.
     * - Không có filter, pagination (lấy tất cả).
     * @route GET /api/employees
     */
    async getAllEmployees(req, res) {
        try {
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
     * GET: Tìm kiếm nhân viên dựa trên một chuỗi truy vấn.
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


    /* =======================  Thêm nhân viên mới ======================= */
    /**
     * POST: Thêm nhân viên mới kèm theo work history.
     * - Tự động generate employeeId từ tên + SĐT.
     * - Validate duplicate employeeId trước khi tạo.
     * - Validate work history data (ngày tháng, overlap, đề xuất tuyển dụng).
     * - Rollback toàn bộ nếu có lỗi trong quá trình tạo.
     * - Transaction-like behavior: tạo employee trước, sau đó tạo work histories.
     * @route POST /api/employees
     */

    async addEmployee(req, res) {
        let createdEmployee = null;
        let createdWorkHistories = [];
        
        try {
            const { fullName, phoneNumber, gender, bankAccount, bankName, workHistoryData } = req.body;
            const employeeId = larkServiceManager.getService('employee').generateEmployeeId(fullName, phoneNumber);
            
            // ✅ STEP 1: Kiểm tra duplicate trước khi tạo bất kỳ record nào
            const isDuplicate = await larkServiceManager.getService('employee').checkEmployeeIdExists(employeeId);
            if (isDuplicate) {
                return res.status(409).json(formatResponse(
                    false, 
                    'Mã nhân viên đã tồn tại trong hệ thống', 
                    null, 
                    'DUPLICATE_EMPLOYEE_ID'
                ));
            }

            // ✅ STEP 2: Validate work history TRƯỚC KHI tạo employee
            const recruitmentService = larkServiceManager.getService('recruitment');
            const workHistoryService = larkServiceManager.getService('workHistory');
            
            for (const historyEntry of workHistoryData) {
                // Validate work history trước
                const recruitmentDetails = await recruitmentService.getRequestByNo(historyEntry.requestNo);
                if (!recruitmentDetails) {
                    throw new Error(`Không tìm thấy đề xuất tuyển dụng với mã: ${historyEntry.requestNo}`);
                }
                
                // Validate ngày tháng
                workHistoryService.validateWorkHistoryFields({
                    fromDate: historyEntry.fromDate,
                    toDate: historyEntry.toDate,
                    hourlyRate: historyEntry.hourlyRate
                }, recruitmentDetails);
                
                // Validate date overlap
                await workHistoryService.validateWorkHistoryDateOverlap(
                    employeeId, 
                    historyEntry.requestNo, 
                    recruitmentService
                );
            }

            // ✅ STEP 3: Nếu validation pass, mới tạo employee
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

            console.log('✅ All validations passed, creating employee...');
            createdEmployee = await larkServiceManager.addEmployee(employeeData);
            
            // ✅ STEP 4: Tạo work history
            console.log('✅ Employee created, creating work histories...');
            const workHistoryResults = [];
            
            for (const historyEntry of workHistoryData) {
                try {
                    const workHistory = await larkServiceManager.addWorkHistory({
                        employeeId,
                        requestNo: historyEntry.requestNo,
                        fromDate: historyEntry.fromDate,
                        toDate: historyEntry.toDate,
                        hourlyRate: historyEntry.hourlyRate
                    });
                    workHistoryResults.push(workHistory);
                    createdWorkHistories.push(workHistory); // Track for rollback
                } catch (workHistoryError) {
                    console.error('❌ Work history creation failed:', workHistoryError);
                    
                    // ✅ ROLLBACK: Xóa employee và work histories đã tạo
                    await this.rollbackEmployeeCreation(createdEmployee.employee, createdWorkHistories);
                    
                    throw new Error(`Lỗi khi tạo work history: ${workHistoryError.message}`);
                }
            }

            console.log('✅ All work histories created successfully');

            res.json(formatResponse(true, 'Thêm nhân viên thành công', {
                employee: createdEmployee,
                workHistory: workHistoryResults
            }));
            
        } catch (error) {
            console.error('❌ Employee creation failed:', error);
            
            // ✅ ROLLBACK nếu có lỗi
            if (createdEmployee) {
                await this.rollbackEmployeeCreation(createdEmployee.employee, createdWorkHistories);
            }
            
            // Trả về lỗi cụ thể cho frontend
            res.status(500).json(formatResponse(
                false, 
                error.message || 'Lỗi hệ thống khi thêm nhân viên', 
                null, 
                'EMPLOYEE_ADD_FAILED'
            ));
        }
    }


    /* ======================= REGION: Cập nhật thông tin nhân viên ======================= */
    /**
     * PUT: Cập nhật thông tin nhân viên.
     * - Tự động tạo lại employeeId nếu tên/SĐT thay đổi.
     * - Nếu employeeId thay đổi, tự động cập nhật tất cả work history liên quan.
     * - Validate employee tồn tại trước khi update.
     * @route PUT /api/employees/:id
     */

    async updateEmployee(req, res) {
        try {
            const { id } = req.params;
            const { fullName, phoneNumber, gender, bankAccount, bankName, recruitmentLink, status } = req.body;
            
            // ✅ STEP 1: Lấy thông tin employee cũ trước khi update
            console.log('📋 Getting old employee data for comparison...');
            const oldEmployee = await larkServiceManager.getService('employee').getEmployeeById(id);
            if (!oldEmployee) {
                return res.status(404).json(formatResponse(
                    false, 
                    'Không tìm thấy nhân viên cần cập nhật', 
                    null, 
                    'EMPLOYEE_NOT_FOUND'
                ));
            }
            
            const oldEmployeeId = oldEmployee.employeeId;
            
            // ✅ STEP 2: Tạo mã nhân viên mới
            const newEmployeeId = larkServiceManager.getService('employee').generateEmployeeId(fullName, phoneNumber);
            
            console.log('🔍 Comparing employee IDs:', {
                old: oldEmployeeId,
                new: newEmployeeId,
                changed: oldEmployeeId !== newEmployeeId
            });
            
            // ✅ STEP 3: Update employee data
            const updatedData = {
                employeeId: newEmployeeId,
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
            
            // ✅ STEP 4: Nếu mã nhân viên thay đổi, cập nhật work history
            if (oldEmployeeId !== newEmployeeId) {
                console.log('🔄 Employee ID changed, updating work history records...');
                await this.updateWorkHistoryEmployeeId(oldEmployeeId, newEmployeeId);
            }
            
            console.log('✅ Employee updated successfully, clearing cache...');
            
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


    /* ======================= REGION: Xóa nhân viên ======================= */
    /**
     * DELETE: Xóa nhân viên và tất cả work history liên quan.
     * - Validate employee tồn tại trước khi xóa.
     * - Xóa tất cả work history records trước.
     * - Chỉ xóa employee sau khi đã xóa hết work history thành công.
     * - Fail nếu không thể xóa hết work history (để đảm bảo data consistency).
     * @route DELETE /api/employees/:id
     */

    async deleteEmployee(req, res) {
        try {
            const { id } = req.params;
            
            // STEP 1: Lấy thông tin employee trước khi xóa
            console.log(`🔍 Getting employee info before deletion: ${id}`);
            const employee = await larkServiceManager.getService('employee').getEmployeeById(id);
            
            if (!employee) {
                return res.status(404).json(formatResponse(
                    false, 
                    'Không tìm thấy nhân viên cần xóa', 
                    null, 
                    'EMPLOYEE_NOT_FOUND'
                ));
            }
            
            const employeeId = employee.employeeId;
            console.log(`👤 Employee to delete: ${employee.fullName} (${employeeId})`);
            
            // STEP 2: Lấy danh sách work history cần xóa
            const workHistoryService = larkServiceManager.getService('workHistory');
            const workHistories = await workHistoryService.getWorkHistoryByEmployee(employeeId);
            
            console.log(`📋 Found ${workHistories.length} work history records to delete`);
            
            // STEP 3: Xóa tất cả work history trước
            const deleteWorkHistoryPromises = workHistories.map(async (wh) => {
                try {
                    await workHistoryService.deleteWorkHistory(wh.id);
                    console.log(`✅ Deleted work history: ${wh.id} (${wh.requestNo})`);
                    return { success: true, id: wh.id };
                } catch (error) {
                    console.error(`❌ Failed to delete work history ${wh.id}:`, error);
                    return { success: false, id: wh.id, error: error.message };
                }
            });
            
            const workHistoryResults = await Promise.all(deleteWorkHistoryPromises);
            const failedDeletions = workHistoryResults.filter(r => !r.success);
            
            if (failedDeletions.length > 0) {
                console.error(`❌ Failed to delete ${failedDeletions.length} work history records`);
                return res.status(500).json(formatResponse(
                    false,
                    `Không thể xóa hoàn toàn dữ liệu. ${failedDeletions.length} work history records failed to delete.`,
                    { failedDeletions },
                    'WORK_HISTORY_DELETE_FAILED'
                ));
            }
            
            // STEP 4: Xóa employee sau khi đã xóa hết work history
            console.log(`🗑️ All work histories deleted successfully. Now deleting employee...`);
            await larkServiceManager.deleteEmployee(id);
            
            console.log(`✅ Successfully deleted employee ${employee.fullName} and ${workHistories.length} work history records`);
            
            res.json(formatResponse(
                true, 
                `Xóa nhân viên "${employee.fullName}" và ${workHistories.length} bản ghi lịch sử công việc thành công`,
                {
                    deletedEmployee: employee.fullName,
                    deletedWorkHistories: workHistories.length
                }
            ));
            
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


    /* ======================================================================================== */
    /* ======================= REGION: API Chính - Quản lý Lịch sử công việc ======================= */
    /* ======================================================================================== */


    /** Get employee work history
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


    /** Add work history for employee
     * @route POST /api/employees/work-history
     */
    async addWorkHistory(req, res) {
        try {
            
            // ✅ CẬP NHẬT: Nhận thêm các trường mới từ request body
            const { employeeId, requestNo, fromDate, toDate, hourlyRate } = req.body;

            CacheService.clear();

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
                fromDate,
                toDate,
                hourlyRate
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


    // Update work history
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


    // Delete work history
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


    /* =========================================================================== */
    /* ======================= REGION: Hàm phụ trợ (Utilities) ======================= */
    /* =========================================================================== */


    /**
     * UTILITY: Rollback khi tạo nhân viên thất bại.
     * - Xóa các work history records đã tạo thành công.
     * - Xóa employee record nếu đã tạo.
     * - Đảm bảo data consistency khi có lỗi xảy ra.
     */
    async rollbackEmployeeCreation(employee, createdWorkHistories) {
        console.log('🔄 ROLLBACK: Starting cleanup...');
        
        try {
            // Xóa work histories đã tạo
            for (const workHistory of createdWorkHistories) {
                if (workHistory && workHistory.larkResponse && workHistory.larkResponse.data) {
                    try {
                        await larkServiceManager.getService('workHistory').deleteWorkHistory(
                            workHistory.larkResponse.data.record.record_id
                        );
                        console.log('✅ ROLLBACK: Deleted work history', workHistory.larkResponse.data.record.record_id);
                    } catch (whDeleteError) {
                        console.error('❌ ROLLBACK: Failed to delete work history', whDeleteError);
                    }
                }
            }
            
            // Xóa employee
            if (employee && employee.larkResponse && employee.larkResponse.data) {
                try {
                    await larkServiceManager.getService('employee').deleteEmployee(
                        employee.larkResponse.data.record_id
                    );
                    console.log('✅ ROLLBACK: Deleted employee', employee.larkResponse.data.record_id);
                } catch (empDeleteError) {
                    console.error('❌ ROLLBACK: Failed to delete employee', empDeleteError);
                }
            }
            
            console.log('✅ ROLLBACK: Cleanup completed');
        } catch (rollbackError) {
            console.error('❌ ROLLBACK: Critical error during cleanup:', rollbackError);
        }
    }


    /** UTILITY: Cập nhật employeeId trong các work history records.
     * - Được gọi khi employeeId thay đổi sau khi update employee.
     * - Tìm tất cả work history của employee cũ và cập nhật sang ID mới.
     * - Log kết quả nhưng không fail nếu một số records update lỗi.
     */

    async updateWorkHistoryEmployeeId(oldEmployeeId, newEmployeeId) {
        try {
            console.log(`🔄 Updating work history: ${oldEmployeeId} -> ${newEmployeeId}`);
            
            const workHistoryService = larkServiceManager.getService('workHistory');
            
            // Lấy tất cả work history của employee cũ
            const workHistories = await workHistoryService.getWorkHistoryByEmployee(oldEmployeeId);
            
            if (workHistories.length === 0) {
                console.log('ℹ️ No work history records to update');
                return;
            }
            
            console.log(`📋 Found ${workHistories.length} work history records to update`);
            
            // Cập nhật từng record
            const updatePromises = workHistories.map(async (workHistory) => {
                try {
                    await workHistoryService.updateWorkHistory(workHistory.id, {
                        employeeId: newEmployeeId,
                        requestNo: workHistory.requestNo,
                        fromDate: workHistory.fromDate,
                        toDate: workHistory.toDate,
                        hourlyRate: workHistory.hourlyRate
                    });
                    
                    console.log(`✅ Updated work history record: ${workHistory.id}`);
                    return { success: true, id: workHistory.id };
                } catch (updateError) {
                    console.error(`❌ Failed to update work history ${workHistory.id}:`, updateError);
                    return { success: false, id: workHistory.id, error: updateError.message };
                }
            });
            
            const results = await Promise.all(updatePromises);
            
            const successCount = results.filter(r => r.success).length;
            const failedCount = results.length - successCount;
            
            console.log(`📊 Work history update results: ${successCount} success, ${failedCount} failed`);
            
            if (failedCount > 0) {
                const failedIds = results.filter(r => !r.success).map(r => r.id);
                console.warn('⚠️ Some work history records failed to update:', failedIds);
                // Có thể log warning nhưng không throw error để không làm fail employee update
            }
            
        } catch (error) {
            console.error('❌ Critical error updating work history employee IDs:', error);
            // Log error nhưng không throw để không làm fail employee update
        }
    }

}


/* ======================================================================== */
/* ======================= REGION: Khởi tạo và Export ======================= */
/* ======================================================================== */


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
