// server/routes/recruitment.js
import express from 'express';
import { 
    getRecruitmentRequests,
    getRecruitmentHoursSummary,
    getDetailedHoursForRequest,
    getDailyComparisonForRequest    
} from '../controllers/recruitmentController.js';
import { authenticateUser } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateUser, getRecruitmentRequests);
router.get('/hours-summary', authenticateUser, getRecruitmentHoursSummary);
router.get('/detailed-hours/:requestNo', authenticateUser, getDetailedHoursForRequest);
router.get('/daily-comparison/:requestNo', authenticateUser, getDailyComparisonForRequest);

export default router;
