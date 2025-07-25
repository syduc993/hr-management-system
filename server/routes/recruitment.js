// server/routes/recruitment.js
import express from 'express';
import { 
    getRecruitmentRequests,
    getRecruitmentHoursSummary,
    getDetailedHoursForRequest  
} from '../controllers/recruitmentController.js';
import { authenticateUser } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateUser, getRecruitmentRequests);
router.get('/hours-summary', authenticateUser, getRecruitmentHoursSummary);
router.get('/detailed-hours/:requestNo', authenticateUser, getDetailedHoursForRequest);

export default router;
