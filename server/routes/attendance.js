// server/routes/attendance.js
import express from 'express';
import { 
    getAttendanceLogs,
    addAttendanceLog,
    getEmployeeHours,
    getAttendanceStats,
    getEmployeeDetailedHours
} from '../controllers/attendanceController.js';
import { authenticateUser } from '../middleware/auth.js';

const router = express.Router();

// ✅ CÁC ENDPOINT HIỆN TẠI
router.get('/logs', authenticateUser, getAttendanceLogs);
router.post('/logs', authenticateUser, addAttendanceLog);
router.get('/employee-hours', authenticateUser, getEmployeeHours);

// ✅ CÁC ENDPOINT MỚI
router.get('/stats', authenticateUser, getAttendanceStats);
router.get('/employee/:employeeId/detailed', authenticateUser, getEmployeeDetailedHours);

export default router;
