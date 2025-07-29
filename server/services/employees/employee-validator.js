// Employee validation service
class EmployeeValidator {
    static validateEmployeeData(employeeData) {
        const errors = [];

        // Required fields validation
        if (!employeeData.fullName || employeeData.fullName.trim().length < 2) {
            errors.push('Họ tên phải có ít nhất 2 ký tự');
        }

        if (!employeeData.phoneNumber || !this.isValidPhoneNumber(employeeData.phoneNumber)) {
            errors.push('Số điện thoại không hợp lệ');
        }

        if (!employeeData.gender || !['Nam', 'Nữ'].includes(employeeData.gender)) {
            errors.push('Giới tính phải là Nam hoặc Nữ');
        }

        if (!employeeData.bankAccount || employeeData.bankAccount.trim().length < 6) {
            errors.push('Số tài khoản phải có ít nhất 6 ký tự');
        }

        if (!employeeData.bankName || employeeData.bankName.trim().length < 2) {
            errors.push('Tên ngân hàng là bắt buộc');
        }

        return errors;
    }

    static isValidPhoneNumber(phoneNumber) {
        const phoneRegex = /^[0-9]{10,11}$/;
        return phoneRegex.test(phoneNumber);
    }

    static validateWorkHistoryData(workHistoryData) {
        const errors = [];

        if (!Array.isArray(workHistoryData) || workHistoryData.length === 0) {
            errors.push('Phải có ít nhất một work history entry');
        }

        const requestNos = workHistoryData.map(item => item.requestNo);
        const uniqueRequestNos = [...new Set(requestNos)];
        
        if (requestNos.length !== uniqueRequestNos.length) {
            errors.push('Không được trùng lặp Request No');
        }

        workHistoryData.forEach((item, index) => {
            if (!item.requestNo || item.requestNo.trim().length === 0) {
                errors.push(`Work history entry ${index + 1}: Request No là bắt buộc`);
            }
        });

        return errors;
    }
}

export default EmployeeValidator;
