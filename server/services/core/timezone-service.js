// server/services/core/timezone-service.js

/**
 * @file TimezoneService - Service tập trung xử lý timezone cho toàn bộ ứng dụng
 * @description Chuẩn hóa việc xử lý thời gian về GMT+7 (Vietnam timezone)
 * để đảm bảo consistency và tránh code trùng lặp
 */

class TimezoneService {
    // Constants
    static VIETNAM_OFFSET_MS = 7 * 60 * 60 * 1000; // GMT+7 offset in milliseconds
    static VIETNAM_TIMEZONE = 'Asia/Ho_Chi_Minh';
    
    // =================================================================
    // CORE CONVERSION METHODS - CÁC HÀM CHUYỂN ĐỔI CƠ BẢN
    // =================================================================

    /**
     * Chuyển đổi bất kỳ giá trị thời gian nào về Date object với GMT+7
     * @param {Date|string|number} dateValue - Giá trị thời gian cần chuyển đổi
     * @returns {Date} Date object đã được điều chỉnh về GMT+7
     */
    static toVietnamTime(dateValue) {
        if (!dateValue) {
            console.warn('⚠️ TimezoneService: dateValue is null/undefined');
            return new Date();
        }

        let date;
        
        try {
            // Handle different input types
            if (dateValue instanceof Date) {
                date = new Date(dateValue);
            } else if (typeof dateValue === 'number') {
                // Assume timestamp in milliseconds
                date = new Date(dateValue);
            } else if (typeof dateValue === 'string') {
                date = new Date(dateValue);
            } else {
                console.warn('⚠️ TimezoneService: Unknown dateValue type:', typeof dateValue);
                return new Date();
            }

            // Validate date
            if (isNaN(date.getTime())) {
                console.warn('⚠️ TimezoneService: Invalid date created from:', dateValue);
                return new Date();
            }

            // Apply Vietnam timezone offset
            return new Date(date.getTime() + this.VIETNAM_OFFSET_MS);
            
        } catch (error) {
            console.error('❌ TimezoneService: Error in toVietnamTime:', error);
            return new Date();
        }
    }

    /**
     * Tạo Date object với timezone GMT+7 từ date string YYYY-MM-DD
     * @param {string} dateString - Chuỗi ngày YYYY-MM-DD
     * @returns {Date} Date object với GMT+7
     */
    static createVietnamDate(dateString) {
        if (!dateString) return new Date();
        
        try {
            const date = new Date(dateString + 'T00:00:00.000Z'); // Parse as UTC
            return new Date(date.getTime() + this.VIETNAM_OFFSET_MS);
        } catch (error) {
            console.error('❌ TimezoneService: Error in createVietnamDate:', error);
            return new Date();
        }
    }

    // =================================================================
    // FORMATTING METHODS - CÁC HÀM ĐỊNH DẠNG
    // =================================================================

    /**
     * Format ngày thành DD/MM/YYYY với timezone GMT+7
     * @param {Date|string|number} dateValue - Giá trị ngày cần format
     * @returns {string} Chuỗi ngày định dạng DD/MM/YYYY hoặc 'N/A'
     */
    static formatDate(dateValue) {
        if (!dateValue) return 'N/A';
        
        try {
            const vietnamDate = this.toVietnamTime(dateValue);
            
            const day = String(vietnamDate.getUTCDate()).padStart(2, '0');
            const month = String(vietnamDate.getUTCMonth() + 1).padStart(2, '0');
            const year = vietnamDate.getUTCFullYear();
            
            return `${day}/${month}/${year}`;
        } catch (error) {
            console.error('❌ TimezoneService: Error formatting date:', error);
            return 'Ngày không hợp lệ';
        }
    }

    /**
     * Format thời gian thành HH:MM với timezone GMT+7
     * @param {Date|string|number} timeValue - Giá trị thời gian cần format
     * @returns {string} Chuỗi thời gian định dạng HH:MM hoặc 'N/A'
     */
    static formatTime(timeValue) {
        if (!timeValue) return 'N/A';
        
        try {
            const vietnamDate = this.toVietnamTime(timeValue);
            
            const hours = String(vietnamDate.getUTCHours()).padStart(2, '0');
            const minutes = String(vietnamDate.getUTCMinutes()).padStart(2, '0');
            
            return `${hours}:${minutes}`;
        } catch (error) {
            console.error('❌ TimezoneService: Error formatting time:', error);
            return 'Giờ không hợp lệ';
        }
    }

    /**
     * Format ngày giờ đầy đủ với timezone GMT+7
     * @param {Date|string|number} dateTimeValue - Giá trị ngày giờ cần format
     * @returns {string} Chuỗi ngày giờ định dạng DD/MM/YYYY HH:MM
     */
    static formatDateTime(dateTimeValue) {
        if (!dateTimeValue) return 'N/A';
        
        const formattedDate = this.formatDate(dateTimeValue);
        const formattedTime = this.formatTime(dateTimeValue);
        
        if (formattedDate === 'N/A' || formattedTime === 'N/A') {
            return 'Ngày giờ không hợp lệ';
        }
        
        return `${formattedDate} ${formattedTime}`;
    }

    // =================================================================
    // CONVERSION TO DATABASE - CHUYỂN ĐỔI ĐỂ LUU DATABASE
    // =================================================================

    /**
     * Chuyển đổi date string thành timestamp để lưu vào Lark
     * @param {string} dateString - Chuỗi ngày YYYY-MM-DD
     * @returns {number} Timestamp với GMT+7 correction
     */
    static dateStringToLarkTimestamp(dateString) {
        if (!dateString) return Date.now();
        
        try {
            const date = new Date(dateString + 'T00:00:00.000Z'); // Parse as UTC
            const vietnamTimestamp = date.getTime() + this.VIETNAM_OFFSET_MS;
            return vietnamTimestamp;
        } catch (error) {
            console.error('❌ TimezoneService: Error converting to Lark timestamp:', error);
            return Date.now();
        }
    }

    /**
     * Chuyển đổi timestamp từ Lark thành date string YYYY-MM-DD
     * @param {number} timestamp - Timestamp từ Lark
     * @returns {string} Date string YYYY-MM-DD hoặc null
     */
    static larkTimestampToDateString(timestamp) {
        if (!timestamp || typeof timestamp !== 'number') return null;
        
        try {
            const vietnamDate = this.toVietnamTime(timestamp);
            return vietnamDate.toISOString().split('T')[0]; // YYYY-MM-DD format
        } catch (error) {
            console.error('❌ TimezoneService: Error converting from Lark timestamp:', error);
            return null;
        }
    }

    // =================================================================
    // VALIDATION METHODS - CÁC HÀM KIỂM TRA
    // =================================================================

    /**
     * Kiểm tra xem ngày có hợp lệ không
     * @param {any} dateValue - Giá trị cần kiểm tra
     * @returns {boolean} True nếu hợp lệ
     */
    static isValidDate(dateValue) {
        if (!dateValue) return false;
        
        try {
            const date = new Date(dateValue);
            return !isNaN(date.getTime()) && date.getFullYear() > 1900 && date.getFullYear() < 2100;
        } catch (error) {
            return false;
        }
    }

    /**
     * Kiểm tra ngày A có trước ngày B không (với GMT+7)
     * @param {Date|string|number} dateA - Ngày A
     * @param {Date|string|number} dateB - Ngày B
     * @returns {boolean} True nếu dateA < dateB
     */
    static isDateBefore(dateA, dateB) {
        if (!this.isValidDate(dateA) || !this.isValidDate(dateB)) return false;
        
        try {
            const vietnamDateA = this.toVietnamTime(dateA);
            const vietnamDateB = this.toVietnamTime(dateB);
            
            // Reset time to 00:00:00 for date comparison
            vietnamDateA.setUTCHours(0, 0, 0, 0);
            vietnamDateB.setUTCHours(0, 0, 0, 0);
            
            return vietnamDateA.getTime() < vietnamDateB.getTime();
        } catch (error) {
            console.error('❌ TimezoneService: Error in isDateBefore:', error);
            return false;
        }
    }

    /**
     * Kiểm tra ngày A có sau ngày B không (với GMT+7)
     * @param {Date|string|number} dateA - Ngày A
     * @param {Date|string|number} dateB - Ngày B
     * @returns {boolean} True nếu dateA > dateB
     */
    static isDateAfter(dateA, dateB) {
        return this.isDateBefore(dateB, dateA);
    }

    /**
     * Kiểm tra hai khoảng ngày có chồng chéo không
     * @param {Date|string|number} start1 - Ngày bắt đầu khoảng 1
     * @param {Date|string|number} end1 - Ngày kết thúc khoảng 1
     * @param {Date|string|number} start2 - Ngày bắt đầu khoảng 2
     * @param {Date|string|number} end2 - Ngày kết thúc khoảng 2
     * @returns {boolean} True nếu có chồng chéo
     */
    static dateRangesOverlap(start1, end1, start2, end2) {
        if (!this.isValidDate(start1) || !this.isValidDate(end1) || 
            !this.isValidDate(start2) || !this.isValidDate(end2)) {
            return false;
        }
        
        try {
            const s1 = this.toVietnamTime(start1);
            const e1 = this.toVietnamTime(end1);
            const s2 = this.toVietnamTime(start2);
            const e2 = this.toVietnamTime(end2);
            
            // Reset time to compare dates only
            [s1, e1, s2, e2].forEach(date => {
                date.setUTCHours(0, 0, 0, 0);
            });
            
            return s1.getTime() <= e2.getTime() && e1.getTime() >= s2.getTime();
        } catch (error) {
            console.error('❌ TimezoneService: Error in dateRangesOverlap:', error);
            return false;
        }
    }

    // =================================================================
    // UTILITY METHODS - CÁC HÀM TIỆN ÍCH
    // =================================================================

    /**
     * Lấy ngày hiện tại theo GMT+7
     * @returns {Date} Date object của ngày hiện tại với GMT+7
     */
    static getCurrentVietnamDate() {
        return this.toVietnamTime(new Date());
    }

    /**
     * Lấy ngày hiện tại dạng string YYYY-MM-DD theo GMT+7
     * @returns {string} Chuỗi ngày hiện tại YYYY-MM-DD
     */
    static getCurrentDateString() {
        const now = this.getCurrentVietnamDate();
        return now.toISOString().split('T')[0];
    }

    /**
     * Tính số ngày giữa hai ngày (với GMT+7)
     * @param {Date|string|number} startDate - Ngày bắt đầu
     * @param {Date|string|number} endDate - Ngày kết thúc
     * @returns {number} Số ngày chênh lệch (có thể âm)
     */
    static daysBetween(startDate, endDate) {
        if (!this.isValidDate(startDate) || !this.isValidDate(endDate)) return 0;
        
        try {
            const start = this.toVietnamTime(startDate);
            const end = this.toVietnamTime(endDate);
            
            // Reset time for accurate day calculation
            start.setUTCHours(0, 0, 0, 0);
            end.setUTCHours(0, 0, 0, 0);
            
            const diffTime = end.getTime() - start.getTime();
            return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        } catch (error) {
            console.error('❌ TimezoneService: Error in daysBetween:', error);
            return 0;
        }
    }

    // =================================================================
    // DEBUG & LOGGING METHODS - CÁC HÀM DEBUG
    // =================================================================

    /**
     * Log thông tin debug về timezone conversion
     * @param {any} originalValue - Giá trị gốc
     * @param {Date} convertedValue - Giá trị đã convert
     * @param {string} context - Context của conversion
     */
    static logTimezoneConversion(originalValue, convertedValue, context = '') {
        if (process.env.NODE_ENV === 'development') {
            console.log(`🕐 TimezoneService Debug ${context}:`, {
                original: originalValue,
                converted: convertedValue?.toISOString(),
                formatted: this.formatDateTime(convertedValue),
                timezone: 'GMT+7'
            });
        }
    }

    /**
     * Validate và log lỗi nếu có
     * @param {any} value - Giá trị cần validate
     * @param {string} fieldName - Tên field
     * @param {string} context - Context
     * @returns {boolean} True nếu valid
     */
    static validateAndLog(value, fieldName, context = '') {
        const isValid = this.isValidDate(value);
        
        if (!isValid) {
            console.warn(`⚠️ TimezoneService: Invalid ${fieldName} in ${context}:`, value);
        }
        
        return isValid;
    }
}

export default TimezoneService;
