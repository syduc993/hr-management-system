// server/routes/employees.js
import express from 'express';
import { 
    getAllEmployees, 
    addEmployee, 
    updateEmployee, 
    deleteEmployee, 
    getEmployeeStats, 
    searchEmployees, 
    getRecruitmentRequests, 
    getEmployeeWorkHistory, 
    addWorkHistory, 
    getStores, 
    addStore, 
    updateStore, 
    deleteStore, 
    getPositions, 
    addPosition, 
    updatePosition, 
    deletePosition 
} from '../controllers/employeeController.js';
import { authenticateUser, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

// ==================== EMPLOYEE ROUTES ====================
// GET routes should come before parameterized routes
router.get('/stats', authenticateUser, getEmployeeStats);
router.get('/search', authenticateUser, searchEmployees);
router.get('/', authenticateUser, getAllEmployees);

// Employee CRUD operations
router.post('/', authenticateUser, authorizeRoles('hr', 'admin'), addEmployee);
router.put('/:id', authenticateUser, authorizeRoles('hr', 'admin'), updateEmployee);
router.delete('/:id', authenticateUser, authorizeRoles('hr', 'admin'), deleteEmployee);

// ==================== WORK HISTORY ROUTES ====================
// Work history routes - SỬA ĐỂ TƯƠNG THÍCH VỚI CLIENT
router.get('/:employeeId/work-history', authenticateUser, getEmployeeWorkHistory);
router.post('/work-history', authenticateUser, authorizeRoles('hr', 'admin'), addWorkHistory);

// ==================== RECRUITMENT ROUTES ====================
// Recruitment requests route - moved up to avoid conflicts
router.get('/recruitment-requests', authenticateUser, getRecruitmentRequests);

// ==================== STORE ROUTES ====================
// Store management routes
router.get('/stores', authenticateUser, getStores);
router.post('/stores', authenticateUser, authorizeRoles('hr', 'admin'), addStore);
router.put('/stores/:id', authenticateUser, authorizeRoles('hr', 'admin'), updateStore);
router.delete('/stores/:id', authenticateUser, authorizeRoles('hr', 'admin'), deleteStore);

// ==================== POSITION ROUTES ====================
// Position management routes
router.get('/positions', authenticateUser, getPositions);
router.post('/positions', authenticateUser, authorizeRoles('hr', 'admin'), addPosition);
router.put('/positions/:id', authenticateUser, authorizeRoles('hr', 'admin'), updatePosition);
router.delete('/positions/:id', authenticateUser, authorizeRoles('hr', 'admin'), deletePosition);

// ==================== ERROR HANDLING ====================
// Handle 404 for unmatched routes
router.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Route not found',
        path: req.originalUrl
    });
});

export default router;
