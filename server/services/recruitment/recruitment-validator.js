// Recruitment validation service
class RecruitmentValidator {
    static validateRecruitmentData(requestData) {
        const errors = [];

        // Required fields validation
        if (!requestData.requestNo) {
            errors.push('Request No là bắt buộc');
        }

        if (!requestData.requester) {
            errors.push('Requester là bắt buộc');
        }

        if (!requestData.department) {
            errors.push('Department là bắt buộc');
        }

        if (!requestData.quantity || requestData.quantity <= 0) {
            errors.push('Quantity phải lớn hơn 0');
        }

        if (!requestData.gender) {
            errors.push('Gender là bắt buộc');
        }

        if (!requestData.fromDate) {
            errors.push('From Date là bắt buộc');
        } else if (!this.isValidDate(requestData.fromDate)) {
            errors.push('From Date không hợp lệ');
        }

        if (!requestData.toDate) {
            errors.push('To Date là bắt buộc');
        } else if (!this.isValidDate(requestData.toDate)) {
            errors.push('To Date không hợp lệ');
        }

        // Check if toDate is after fromDate
        if (requestData.fromDate && requestData.toDate) {
            if (!this.isToDateAfterFromDate(requestData.fromDate, requestData.toDate)) {
                errors.push('To Date phải sau From Date');
            }
        }

        return errors;
    }

    static isValidDate(dateString) {
        const date = new Date(dateString);
        return date instanceof Date && !isNaN(date);
    }

    static isToDateAfterFromDate(fromDate, toDate) {
        const from = new Date(fromDate);
        const to = new Date(toDate);
        return to >= from;
    }
}

export default RecruitmentValidator;
