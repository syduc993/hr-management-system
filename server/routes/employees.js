// server/routes/employees.js
import express from 'express';
import { 
    getAllEmployees, 
    addEmployee, 
    updateEmployee, 
    deleteEmployee, 
    searchEmployees, 
    getEmployeeWorkHistory, 
    addWorkHistory,
    updateWorkHistory,
    deleteWorkHistory
} from '../controllers/employeeController.js';
import { authenticateUser, authorizeRoles } from '../middleware/auth.js';
import ValidationMiddleware from '../middleware/validation.js';

const router = express.Router();

// ==================== EMPLOYEE ROUTES ====================
// GET routes should come before parameterized routes
router.get('/search', authenticateUser, searchEmployees);
router.get('/', authenticateUser, getAllEmployees);

// Employee CRUD operations
router.post('/', authenticateUser, authorizeRoles('hr', 'admin'), ValidationMiddleware.validateAddEmployee, addEmployee);
router.put('/:id', authenticateUser, authorizeRoles('hr', 'admin'), ValidationMiddleware.validateUpdateEmployee, updateEmployee);
router.delete('/:id', authenticateUser, authorizeRoles('hr', 'admin'), deleteEmployee);

// ==================== WORK HISTORY ROUTES ====================
// Work history routes - SỬA ĐỂ TƯƠNG THÍCH VỚI CLIENT
router.get('/:employeeId/work-history', authenticateUser, getEmployeeWorkHistory);
router.post('/work-history', authenticateUser, authorizeRoles('hr', 'admin'), addWorkHistory);

// ✅ THÊM MỚI: Routes cho sửa và xóa work history
router.put('/work-history/:id', authenticateUser, authorizeRoles('hr', 'admin'), updateWorkHistory);
router.delete('/work-history/:id', authenticateUser, authorizeRoles('hr', 'admin'), deleteWorkHistory);

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
