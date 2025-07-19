// server/routes/attendance.js
import express from 'express';
import { 
    getAttendanceLogs, 
    addAttendanceLog, 
    getEmployeeHours,
    getAttendanceStats
} from '../controllers/attendanceController.js';
import { authenticateUser } from '../middleware/auth.js';

const router = express.Router();

router.get('/logs', authenticateUser, getAttendanceLogs);
router.post('/logs', authenticateUser, addAttendanceLog);
router.get('/employee-hours', authenticateUser, getEmployeeHours);
router.get('/stats', authenticateUser, getAttendanceStats);  // ✅ Route mới

export default router;
