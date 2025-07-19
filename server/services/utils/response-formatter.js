// Response formatting utilities
class ResponseFormatter {
    static formatResponse(success, message, data = null, errorCode = null) {
        const response = {
            success,
            message,
            timestamp: new Date().toISOString()
        };

        if (success && data) {
            response.data = data;
        }

        if (!success && errorCode) {
            response.errorCode = errorCode;
        }

        return response;
    }

    static formatSuccess(message, data = null) {
        return this.formatResponse(true, message, data);
    }

    static formatError(message, errorCode = null) {
        return this.formatResponse(false, message, null, errorCode);
    }

    static formatValidationError(errors) {
        return this.formatResponse(false, 'Validation failed', null, 'VALIDATION_ERROR');
    }

    static formatNotFound(resource) {
        return this.formatResponse(false, `${resource} not found`, null, 'NOT_FOUND');
    }

    static formatUnauthorized(message = 'Unauthorized access') {
        return this.formatResponse(false, message, null, 'UNAUTHORIZED');
    }

    static formatForbidden(message = 'Forbidden access') {
        return this.formatResponse(false, message, null, 'FORBIDDEN');
    }

    static formatServerError(message = 'Internal server error') {
        return this.formatResponse(false, message, null, 'SERVER_ERROR');
    }

    static formatPaginatedResponse(data, pagination) {
        return this.formatResponse(true, 'Success', {
            items: data,
            pagination: {
                page: pagination.page || 1,
                limit: pagination.limit || 10,
                total: pagination.total || 0,
                pages: Math.ceil((pagination.total || 0) / (pagination.limit || 10))
            }
        });
    }

    static formatBatchResponse(results) {
        const successCount = results.filter(r => r.success).length;
        const failureCount = results.length - successCount;

        return this.formatResponse(
            failureCount === 0,
            `Batch operation completed: ${successCount} successful, ${failureCount} failed`,
            {
                results,
                summary: {
                    total: results.length,
                    successful: successCount,
                    failed: failureCount
                }
            }
        );
    }
}

// Legacy function for backward compatibility
export function formatResponse(success, message, data = null, errorCode = null) {
    return ResponseFormatter.formatResponse(success, message, data, errorCode);
}

export default ResponseFormatter;
