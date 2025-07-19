// Abstract base class for all services
import { formatResponse } from '../utils/response-formatter.js';

export default class BaseService {
    constructor() {
        this.initialized = false;
        this.cache = new Map();
    }

    async init() {
        if (!this.initialized) {
            await this.initializeService();
            this.initialized = true;
        }
    }

    async initializeService() {
        // Override in subclasses
    }

    formatResponse(success, message, data = null, errorCode = null) {
        return formatResponse(success, message, data, errorCode);
    }

    validateRequired(data, fields) {
        const errors = [];
        fields.forEach(field => {
            if (!data[field]) {
                errors.push(`${field} là bắt buộc`);
            }
        });
        return errors;
    }

    generateId(prefix = '') {
        return `${prefix}${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    async handleError(error, operation) {
        console.error(`Error in ${operation}:`, error);
        throw error;
    }
}
