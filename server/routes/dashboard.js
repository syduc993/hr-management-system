import express from 'express';
import { getDashboardStats } from '../controllers/dashboardController.js';
import { authenticateUser } from '../middleware/auth.js';

const router = express.Router();

router.get('/stats', authenticateUser, getDashboardStats);

export default router;
