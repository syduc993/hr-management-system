// Centralized error handling utilities
import ResponseFormatter from './response-formatter.js';

class ErrorHandler {
    static handleLarkError(error) {
        if (error.response?.data?.code) {
            const larkCode = error.response.data.code;
            const larkMessage = error.response.data.msg || 'Lark API Error';
            
            switch (larkCode) {
                case 99991663:
                    return ResponseFormatter.formatError('App access token invalid', 'LARK_AUTH_ERROR');
                case 99991664:
                    return ResponseFormatter.formatError('Tenant access token invalid', 'LARK_AUTH_ERROR');
                case 99991665:
                    return ResponseFormatter.formatError('User access token invalid', 'LARK_AUTH_ERROR');
                case 230002:
                    return ResponseFormatter.formatError('Base not found', 'LARK_BASE_NOT_FOUND');
                case 230003:
                    return ResponseFormatter.formatError('Table not found', 'LARK_TABLE_NOT_FOUND');
                case 230004:
                    return ResponseFormatter.formatError('Record not found', 'LARK_RECORD_NOT_FOUND');
                case 1254006:
                    return ResponseFormatter.formatError('Rate limit exceeded', 'LARK_RATE_LIMIT');
                default:
                    return ResponseFormatter.formatError(`Lark API Error: ${larkMessage}`, 'LARK_API_ERROR');
            }
        }
        
        return ResponseFormatter.formatError('Unknown Lark API error', 'LARK_UNKNOWN_ERROR');
    }

    static handleValidationError(errors) {
        const message = Array.isArray(errors) ? errors.join(', ') : errors;
        return ResponseFormatter.formatError(message, 'VALIDATION_ERROR');
    }

    static handleDatabaseError(error) {
        console.error('Database error:', error);
        
        if (error.code === 'ECONNREFUSED') {
            return ResponseFormatter.formatError('Database connection failed', 'DATABASE_CONNECTION_ERROR');
        }
        
        if (error.code === 'ER_DUP_ENTRY') {
            return ResponseFormatter.formatError('Duplicate entry', 'DUPLICATE_ENTRY');
        }
        
        return ResponseFormatter.formatError('Database operation failed', 'DATABASE_ERROR');
    }

    static handleNetworkError(error) {
        console.error('Network error:', error);
        
        if (error.code === 'ENOTFOUND') {
            return ResponseFormatter.formatError('Service not found', 'SERVICE_NOT_FOUND');
        }
        
        if (error.code === 'ECONNRESET') {
            return ResponseFormatter.formatError('Connection reset', 'CONNECTION_RESET');
        }
        
        if (error.code === 'ETIMEDOUT') {
            return ResponseFormatter.formatError('Request timeout', 'REQUEST_TIMEOUT');
        }
        
        return ResponseFormatter.formatError('Network error', 'NETWORK_ERROR');
    }

    static handleGenericError(error, operation = 'operation') {
        console.error(`Error in ${operation}:`, error);
        
        // Check for specific error types
        if (error.isAxiosError) {
            if (error.response?.status === 401) {
                return ResponseFormatter.formatUnauthorized('Authentication required');
            }
            
            if (error.response?.status === 403) {
                return ResponseFormatter.formatForbidden('Access forbidden');
            }
            
            if (error.response?.status === 404) {
                return ResponseFormatter.formatNotFound('Resource');
            }
            
            if (error.response?.status >= 500) {
                return ResponseFormatter.formatServerError('External service error');
            }
            
            return this.handleLarkError(error);
        }
        
        // Check for validation errors
        if (error.name === 'ValidationError') {
            return this.handleValidationError(error.message);
        }
        
        // Check for database errors
        if (error.code && error.code.startsWith('ER_')) {
            return this.handleDatabaseError(error);
        }
        
        // Check for network errors
        if (error.code && ['ENOTFOUND', 'ECONNRESET', 'ETIMEDOUT'].includes(error.code)) {
            return this.handleNetworkError(error);
        }
        
        // Default generic error
        return ResponseFormatter.formatServerError(`Error in ${operation}: ${error.message}`);
    }

    static async wrapAsync(fn, operation = 'operation') {
        try {
            return await fn();
        } catch (error) {
            throw this.handleGenericError(error, operation);
        }
    }

    static logError(error, context = {}) {
        const errorInfo = {
            message: error.message,
            stack: error.stack,
            context,
            timestamp: new Date().toISOString()
        };
        
        console.error('Error logged:', JSON.stringify(errorInfo, null, 2));
        
        // In production, you might want to send this to a logging service
        // like Winston, Sentry, or CloudWatch
    }
}

export default ErrorHandler;
