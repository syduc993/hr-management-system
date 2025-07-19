// server/controllers/dashboardController.js (MỚI)
import larkServiceManager from '../services/lark-service-manager.js';
import { formatResponse } from '../services/utils/response-formatter.js';

export const getDashboardStats = async (req, res) => {
    try {
        console.log('📊 GETTING DASHBOARD STATS...');
        
        const employeeService = larkServiceManager.getService('employee');
        const attendanceService = larkServiceManager.getService('attendance');
        
        // ✅ Tách riêng, handle error độc lập
        let employeeStats = {
            totalEmployees: 0,
            activeEmployees: 0,
            error: null
        };
        
        let attendanceStats = {
            totalAttendanceLogs: 0,
            todayLogs: 0,
            error: null
        };
        
        // Get employee stats
        try {
            const employees = await employeeService.getAllEmployees();
            employeeStats = {
                totalEmployees: employees.length,
                activeEmployees: employees.filter(emp => emp.status === 'active').length,
                error: null
            };
        } catch (error) {
            console.error('❌ Employee stats error:', error);
            employeeStats.error = 'Không thể tải thống kê nhân viên';
        }
        
        // Get attendance stats
        try {
            const logs = await attendanceService.getAttendanceLogs();
            const today = new Date().toISOString().split('T')[0];
            attendanceStats = {
                totalAttendanceLogs: logs.length,
                todayLogs: logs.filter(log => log.date === today).length,
                error: null
            };
        } catch (error) {
            console.error('❌ Attendance stats error:', error);
            attendanceStats.error = 'Không thể tải thống kê chấm công';
        }
        
        const dashboardData = {
            employee: employeeStats,
            attendance: attendanceStats,
            timestamp: new Date().toISOString()
        };
        
        res.json(formatResponse(true, 'Lấy thống kê dashboard thành công', dashboardData));
        
    } catch (error) {
        console.error('❌ Dashboard stats error:', error);
        res.status(500).json(formatResponse(
            false, 
            `Lỗi hệ thống: ${error.message}`, 
            null, 
            'DASHBOARD_STATS_ERROR'
        ));
    }
};
