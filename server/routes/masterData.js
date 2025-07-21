// server/routes/masterData.js
import express from 'express';
import { authenticateUser, authorizeRoles } from '../middleware/auth.js';
import { getStores, addStore, updateStore, deleteStore } from '../controllers/storeController.js';
import { getPositions, addPosition, updatePosition, deletePosition } from '../controllers/positionController.js';
import ValidationMiddleware from '../middleware/validation.js';

const router = express.Router();

// ==================== STORE ROUTES ====================
router.get('/stores', authenticateUser, getStores);
router.post('/stores', authenticateUser, authorizeRoles('hr', 'admin'), ValidationMiddleware.validateStore, addStore);
router.put('/stores/:id', authenticateUser, authorizeRoles('hr', 'admin'), ValidationMiddleware.validateStore, updateStore);
router.delete('/stores/:id', authenticateUser, authorizeRoles('hr', 'admin'), deleteStore);

// ==================== POSITION ROUTES ====================
router.get('/positions', authenticateUser, getPositions);
router.post('/positions', authenticateUser, authorizeRoles('hr', 'admin'), ValidationMiddleware.validatePosition, addPosition);
router.put('/positions/:id', authenticateUser, authorizeRoles('hr', 'admin'), ValidationMiddleware.validatePosition, updatePosition);
router.delete('/positions/:id', authenticateUser, authorizeRoles('hr', 'admin'), deletePosition);

export default router;
