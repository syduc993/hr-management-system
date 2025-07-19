import express from 'express';
import { login, logout, getProfile } from '../controllers/authController.js';
import { authenticateUser } from '../middleware/auth.js';

const router = express.Router();

router.post('/login', login);
router.post('/logout', logout);
router.get('/profile', authenticateUser, getProfile);

export default router;
