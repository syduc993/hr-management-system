// server/controllers/attendanceController.js
import larkServiceManager from '../services/lark-service-manager.js';
import { formatResponse } from '../services/utils/response-formatter.js';

export const getAttendanceLogs = async (req, res) => {
    try {
        const filters = req.query;
        const logs = await larkServiceManager.getAttendanceLogs(filters);
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
        const result = await larkServiceManager.addAttendanceLog(attendanceData);
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

export const getEmployeeHours = async (req, res) => {
    try {
        const employeeHours = await larkServiceManager.getEmployeeHours();
        res.json(formatResponse(true, 'Lấy tổng giờ công thành công', employeeHours));
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

// server/controllers/attendanceController.js
export const getAttendanceStats = async (req, res) => {
    try {
        console.log('📊 GETTING ATTENDANCE STATS...');
        
        const attendanceService = larkServiceManager.getService('attendance');
        
        console.log('⏰ Getting attendance logs...');
        const attendanceLogs = await attendanceService.getAttendanceLogs();
        console.log('✅ Attendance logs fetched:', attendanceLogs.length);
        
        const stats = {
            totalAttendanceLogs: attendanceLogs.length,
            todayLogs: attendanceLogs.filter(log => {
                const today = new Date().toISOString().split('T')[0];
                return log.date === today;
            }).length,
            thisWeekLogs: attendanceLogs.filter(log => {
                const logDate = new Date(log.date);
                const today = new Date();
                const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
                return logDate >= weekAgo && logDate <= today;
            }).length
        };
        
        console.log('📊 Attendance stats calculated:', stats);
        
        res.json(formatResponse(true, 'Lấy thống kê chấm công thành công', stats));
        
    } catch (error) {
        console.error('❌ Controller: getAttendanceStats failed:', error);
        res.status(500).json(formatResponse(
            false, 
            `Không thể lấy thống kê chấm công: ${error.message}`, 
            null, 
            'ATTENDANCE_STATS_LOAD_FAILED'
        ));
    }
};
