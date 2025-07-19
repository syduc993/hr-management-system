// server/routes/recruitment.js
import express from 'express';
import { getRecruitmentRequests } from '../controllers/recruitmentController.js';
import { authenticateUser } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateUser, getRecruitmentRequests);

export default router;
