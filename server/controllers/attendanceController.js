// server/controllers/attendanceController.js
import larkServiceManager from '../services/lark-service-manager.js';
import { formatResponse } from '../services/utils/response-formatter.js';

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

// ✅ CẬP NHẬT: Method tính tổng giờ công với logic mới
export const getEmployeeHours = async (req, res) => {
    try {
        console.log('📊 Controller: Getting employee hours...');
        
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

// ✅ THÊM: Method lấy tổng hợp thống kê chấm công
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

// ✅ THÊM: Method lấy giờ công chi tiết của một nhân viên
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
