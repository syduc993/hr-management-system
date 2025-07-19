// server/middleware/validation.js (MỚI)
//import ResponseFormatter from '../utils/response-formatter.js';
import { formatResponse } from '../services/utils/response-formatter.js';

class ValidationMiddleware {
    static validateEmployee(req, res, next) {
        const { fullName, phoneNumber, gender, hourlyRate, bankAccount, bankName } = req.body;
        
        const errors = [];
        
        if (!fullName || fullName.trim().length < 2) {
            errors.push('Họ tên phải có ít nhất 2 ký tự');
        }
        
        if (!phoneNumber || !/^\d{10,11}$/.test(phoneNumber)) {
            errors.push('Số điện thoại không hợp lệ');
        }
        
        if (errors.length > 0) {
            return res.status(400).json(
                formatResponse(false, errors.join(', '), null, 'VALIDATION_ERROR')
            );
        }
        
        next();
    }
}

export default ValidationMiddleware;
