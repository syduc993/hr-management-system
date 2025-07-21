// server/middleware/validation.js
import { formatResponse } from '../services/utils/response-formatter.js';
import { EmployeeValidator } from '../services/employees/index.js';
import { MasterDataValidator } from '../services/master-data/index.js';

class ValidationMiddleware {
    // Middleware để validate dữ liệu nhân viên mới
    static validateAddEmployee(req, res, next) {
        // Kiểm tra dữ liệu nhân viên
        const employeeErrors = EmployeeValidator.validateEmployeeData(req.body);
        if (employeeErrors.length > 0) {
            return res.status(400).json(formatResponse(false, employeeErrors.join(', '), null, 'VALIDATION_ERROR'));
        }

        // Kiểm tra dữ liệu work history
        const workHistoryErrors = EmployeeValidator.validateWorkHistoryData(req.body.workHistoryData || []);
        if (workHistoryErrors.length > 0) {
            return res.status(400).json(formatResponse(false, workHistoryErrors.join(', '), null, 'VALIDATION_ERROR'));
        }
        
        next();
    }

    // Middleware để validate dữ liệu khi cập nhật nhân viên (có thể khác với khi thêm mới)
    static validateUpdateEmployee(req, res, next) {
        const errors = EmployeeValidator.validateEmployeeData(req.body);
        if (errors.length > 0) {
            return res.status(400).json(formatResponse(false, errors.join(', '), null, 'VALIDATION_ERROR'));
        }
        next();
    }
    
    // Middleware để validate dữ liệu cửa hàng
    static validateStore(req, res, next) {
        const errors = MasterDataValidator.validateStoreData(req.body);
         if (errors.length > 0) {
            return res.status(400).json(formatResponse(false, errors.join(', '), null, 'VALIDATION_ERROR'));
        }
        next();
    }
    
    // Middleware để validate dữ liệu vị trí
    static validatePosition(req, res, next) {
        const errors = MasterDataValidator.validatePositionData(req.body);
         if (errors.length > 0) {
            return res.status(400).json(formatResponse(false, errors.join(', '), null, 'VALIDATION_ERROR'));
        }
        next();
    }
}

export default ValidationMiddleware;
