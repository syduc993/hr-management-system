// Attendance validation service
class AttendanceValidator {
    static validateAttendanceData(attendanceData) {
        const errors = [];

        // Required fields validation
        if (!attendanceData.employeeId) {
            errors.push('Employee ID là bắt buộc');
        }

        if (!attendanceData.date) {
            errors.push('Ngày là bắt buộc');
        } else if (!this.isValidDate(attendanceData.date)) {
            errors.push('Ngày không hợp lệ');
        }

        if (!attendanceData.timeIn) {
            errors.push('Thời gian vào là bắt buộc');
        } else if (!this.isValidTime(attendanceData.timeIn)) {
            errors.push('Thời gian vào không hợp lệ');
        }

        if (!attendanceData.timeOut) {
            errors.push('Thời gian ra là bắt buộc');
        } else if (!this.isValidTime(attendanceData.timeOut)) {
            errors.push('Thời gian ra không hợp lệ');
        }

        // Check if time out is after time in
        if (attendanceData.timeIn && attendanceData.timeOut) {
            if (!this.isTimeOutAfterTimeIn(attendanceData.timeIn, attendanceData.timeOut)) {
                errors.push('Thời gian ra phải sau thời gian vào');
            }
        }

        return errors;
    }

    static isValidDate(dateString) {
        const date = new Date(dateString);
        return date instanceof Date && !isNaN(date);
    }

    static isValidTime(timeString) {
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        return timeRegex.test(timeString);
    }

    static isTimeOutAfterTimeIn(timeIn, timeOut) {
        const inTime = new Date(`1970-01-01T${timeIn}`);
        const outTime = new Date(`1970-01-01T${timeOut}`);
        return outTime > inTime;
    }
}

export default AttendanceValidator;
