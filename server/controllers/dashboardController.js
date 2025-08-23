// server/controllers/dashboardController.js
import larkServiceManager from '../services/lark-service-manager.js';
import { formatResponse } from '../services/utils/response-formatter.js';
import TimezoneService from '../services/core/timezone-service.js';

/**
 * Controller để lấy dữ liệu thống kê cho dashboard.
 * Hàm này sẽ được gọi khi có request đến endpoint tương ứng.
 * @param {object} req - Đối tượng request của Express.
 * @param {object} res - Đối tượng response của Express.
 */
export const getDashboardStats = async (req, res) => {
    try {
        // Service 'employee' để xử lý các nghiệp vụ liên quan đến nhân viên.
        const employeeService = larkServiceManager.getService('employee');
        // Service 'attendance' để xử lý các nghiệp vụ liên quan đến chấm công.
        const attendanceService = larkServiceManager.getService('attendance');

        // Khởi tạo đối tượng để lưu trữ thống kê nhân viên với giá trị mặc định. Việc này đảm bảo rằng dù có lỗi xảy ra, cấu trúc dữ liệu trả về vẫn nhất quán.
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

        // --- Bắt đầu lấy thống kê nhân viên ---
        try {
            // Gọi hàm từ service để lấy danh sách tất cả nhân viên. 'await' được sử dụng vì đây là một thao tác bất đồng bộ.
            const employees = await employeeService.getAllEmployees();

            // Tính toán và cập nhật các số liệu thống kê.
            employeeStats = {
                totalEmployees: employees.length,
                activeEmployees: employees.filter(emp => emp.status === 'active').length,
                error: null
            };
        } catch (error) {
            console.error('❌ Employee stats error:', error);
            employeeStats.error = 'Không thể tải thống kê nhân viên';
        }

        // --- Bắt đầu lấy thống kê chấm công ---
        try {
            const logs = await attendanceService.getAttendanceLogs();
            //const today = new Date().toISOString().split('T')[0];
            const today = TimezoneService.getCurrentDateString();
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