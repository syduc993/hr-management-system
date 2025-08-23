// server/services/attendance/attendance-service.js
import BaseService from '../core/base-service.js';
import LarkClient from '../core/lark-client.js';
import CacheService from '../core/cache-service.js';
import TimezoneService from '../core/timezone-service.js'; // ✅ THÊM: Import TimezoneService

/**
 * @class AttendanceService
 * @description Quản lý tất cả các nghiệp vụ liên quan đến chấm công,
 * bao gồm lấy dữ liệu từ Lark Base, thêm bản ghi mới, và tính toán giờ làm.
 */
class AttendanceService extends BaseService {
    constructor() {
        super();
        this.baseId = process.env.LARK_BASE_ID;
        this.tableId = process.env.LARK_ATTENDANCE_TABLE_ID;
    }

    async initializeService() {
        console.log('Initializing Attendance Service...');
    }

    // =================================================================
    //  PUBLIC API METHODS - CÁC HÀM CUNG CẤP RA BÊN NGOÀI
    // =================================================================

    /** Lấy danh sách bản ghi chấm công từ Lark Bitable, có hỗ trợ cache và bộ lọc.
     * @param {object} [filters={}] - Các bộ lọc để truy vấn.
     * @param {string} [filters.employeeId] - Lọc theo Mã nhân viên.
     * @param {string} [filters.dateFrom] - Lọc từ ngày (YYYY-MM-DD).
     * @param {string} [filters.dateTo] - Lọc đến ngày (YYYY-MM-DD).
     * @returns {Promise<Array<object>>} - Mảng các bản ghi chấm công đã được chuyển đổi.
     */
    async getAttendanceLogs(filters = {}) {
        const cacheKey = `attendance_logs_${JSON.stringify(filters)}`;
        let logs = CacheService.get(cacheKey);
        
        if (logs) {
            console.log(`✅ ATTENDANCE: Loaded ${logs.length} records from cache.`);
            return logs;
        }

        try {
            
            // Xây dựng các tham số cho API
            const params = {};
            if (filters.employeeId) {
                // Lark filter syntax: CurrentValue.[Tên cột] = "Giá trị"
                params.filter = `CurrentValue.[Mã nhân viên] = "${filters.employeeId}"`;
            }
            
            // Gọi phương thức mới để lấy tất cả các trang dữ liệu
            const response = await LarkClient.getAllRecords(
                `/bitable/v1/apps/${this.baseId}/tables/${this.tableId}/records`,
                params
            );

            logs = this.transformAttendanceData(response.data?.items || []);

            
            // Lọc theo ngày (sau khi đã lấy hết dữ liệu)
            if (filters.dateFrom || filters.dateTo) {
                logs = this.filterByDateRange(logs, filters.dateFrom, filters.dateTo);

            }
            
            CacheService.set(cacheKey, logs, 300000); // Cache trong 5 phút

        } catch (error) {
            console.error('❌ Error fetching attendance logs:', error);
            logs = []; // Trả về mảng rỗng nếu có lỗi
        }
        
        return logs;
    }

    /** Thêm một bản ghi chấm công mới vào Lark Bitable.
     * @param {object} attendanceData - Dữ liệu chấm công cần thêm.
     * @returns {Promise<object>} - Bản ghi chấm công đã được tạo và chuyển đổi.
     */
    async addAttendanceLog(attendanceData) {
        try {
            const transformedData = this.transformAttendanceForLark(attendanceData);
            
            const response = await LarkClient.post(`/bitable/v1/apps/${this.baseId}/tables/${this.tableId}/records`, {
                fields: transformedData
            });

            // Clear cache
            CacheService.clear();
            
            return this.transformAttendanceData([response.data])[0];
        } catch (error) {
            await this.handleError(error, 'addAttendanceLog');
            throw error;
        }
    }

    /**
     * Lấy và tổng hợp giờ làm cho tất cả nhân viên có phát sinh chấm công.
     * @returns {Promise<object>} - Một đối tượng với key là employeeId và value là mảng các ngày công.
     * Ví dụ: { "NV001": [{ date: "2025-08-08", totalHours: "8 giờ 0 phút", ... }] }
     */
    async getEmployeeHours() {
        const logs = await this.getAttendanceLogs();
        console.log('🔍 Total attendance logs:', logs.length);

        const employeeHours = {};

        // Group logs by employee and date
        const groupedLogs = this.groupLogsByEmployeeAndDate(logs);

        // Lấy tất cả employeeId thực tế có phát sinh log
        const allEmployeeIds = [...new Set(logs.map(log => log.employeeId))].filter(id => id);
        console.log('🔍 All employee IDs found in logs:', allEmployeeIds);

        // Chỉ tổng hợp các ngày nhân viên có chấm công
        for (const employeeId of allEmployeeIds) {
            if (!employeeId) continue;
            employeeHours[employeeId] = [];
            const employeeDateGroups = groupedLogs[employeeId] || {};

            // Chỉ lặp qua các ngày có log
            for (const date in employeeDateGroups) {
                const dayLogs = employeeDateGroups[date];
                const dailyResult = this.calculateDailyHours(employeeId, date, dayLogs);
                employeeHours[employeeId].push({
                    date,
                    ...dailyResult
                });
            }
        }

        return employeeHours;
    }

    // =================================================================
    //  BUSINESS LOGIC & CALCULATIONS - LOGIC NGHIỆP VỤ & TÍNH TOÁN
    // =================================================================

    /**
     * Gom nhóm các bản ghi chấm công theo mã nhân viên và ngày.
     * @param {Array<object>} logs - Mảng các bản ghi chấm công.
     * @returns {object} - Đối tượng đã được gom nhóm. 
     * Ví dụ: { "NV001": { "2025-08-08": [log1, log2] } }
     */
    groupLogsByEmployeeAndDate(logs) {
        
        const grouped = {};
        
        logs.forEach(log => {
            if (!log.employeeId || !log.date) {
                console.warn('⚠️ Invalid log record:', log);
                return;
            }
            
            if (!grouped[log.employeeId]) {
                grouped[log.employeeId] = {};
            }
            
            if (!grouped[log.employeeId][log.date]) {
                grouped[log.employeeId][log.date] = [];
            }
            
            grouped[log.employeeId][log.date].push(log);
        });
        
        
        return grouped;
    }

    /**
     * Hàm điều phối: Tính toán giờ làm trong một ngày dựa trên chức vụ của nhân viên.
     * @param {string} employeeId - Mã nhân viên.
     * @param {string} date - Ngày tính công (YYYY-MM-DD).
     * @param {Array<object>} dayLogs - Mảng các bản ghi chấm công trong ngày đó.
     * @returns {object} - Kết quả giờ công và các cảnh báo.
     */
    calculateDailyHours(employeeId, date, dayLogs) {
        if (dayLogs.length === 0) {
            return {
                totalHours: '0 giờ 0 phút',
                warnings: ['Không có dữ liệu chấm công'],
                position: 'N/A'
            };
        }

        return this.calculateSimpleHours(dayLogs)
    }

    /**
     * Logic tính giờ mặc định: lấy check-in sớm nhất và check-out muộn nhất trong ngày.
     * Phù hợp cho nhân viên có lịch làm việc linh hoạt hoặc không theo ca cố định.
     * @param {Array<object>} dayLogs - Các log chấm công trong ngày.
     * @returns {object} - Kết quả giờ công.
     */
    calculateSimpleHours(dayLogs) {
        const checkinLogs = dayLogs.filter(log => log.type === 'Checkin');
        const checkoutLogs = dayLogs.filter(log => log.type === 'Checkout');
        
        const warnings = [];
        
        if (checkinLogs.length === 0) {
            warnings.push('Thiếu check in');
        }
        
        if (checkoutLogs.length === 0) {
            warnings.push('Thiếu check out');
        }
        
        if (checkinLogs.length === 0 || checkoutLogs.length === 0) {
            return {
                totalHours: '0 giờ 0 phút',
                warnings,
                position: dayLogs[0]?.position || 'N/A'
            };
        }
        
        // ✅ SỬA: Sử dụng TimezoneService để chuyển đổi timestamp
        const earliestCheckin = checkinLogs.reduce((earliest, current) => {
            const earliestTime = TimezoneService.toVietnamTime(earliest.timestamp);
            const currentTime = TimezoneService.toVietnamTime(current.timestamp);
            return currentTime < earliestTime ? current : earliest;
        });
        
        const latestCheckout = checkoutLogs.reduce((latest, current) => {
            const latestTime = TimezoneService.toVietnamTime(latest.timestamp);
            const currentTime = TimezoneService.toVietnamTime(current.timestamp);
            return currentTime > latestTime ? current : latest;
        });
        
        // ✅ SỬA: Sử dụng TimezoneService để chuyển đổi timestamp
        const checkinTime = TimezoneService.toVietnamTime(earliestCheckin.timestamp);
        const checkoutTime = TimezoneService.toVietnamTime(latestCheckout.timestamp);
        const diffHours = (checkoutTime - checkinTime) / (1000 * 60 * 60);
        
        // ✅ THÊM CẢNH BÁO NẾU CÓ NHIỀU LOGS
        if (dayLogs.length > 2) {
            warnings.push(`Có ${dayLogs.length} lần chấm công trong ngày`);
        }
        
        return {
            totalHours: this.formatHoursDisplay(Math.max(0, diffHours)),
            warnings,
            position: dayLogs[0]?.position || 'N/A'
        };
    }

    /**
     * Logic tính giờ cho Mascot: yêu cầu chấm công 4 lần/ngày (vào/ra ca sáng, vào/ra ca chiều).
     * @param {Array<object>} dayLogs - Các log chấm công trong ngày.
     * @returns {object} - Kết quả giờ công buổi sáng, chiều và tổng cộng.
     */
    calculateMascotHours(dayLogs) {
        // Kiểm tra số lần chấm công
        if (dayLogs.length !== 4) {
            return {
                totalHours: '0 giờ 0 phút',
                morningHours: '0 giờ 0 phút',
                afternoonHours: '0 giờ 0 phút',
                warnings: [`Mascot phải chấm công đúng 4 lần/ngày. Hiện tại: ${dayLogs.length} lần`],
                position: 'Nhân viên Mascot',
                error: true
            };
        }

        // ✅ SỬA: Sử dụng TimezoneService để chia ca theo 13:00
        const morningLogs = dayLogs.filter(log => {
            const vietnamTime = TimezoneService.toVietnamTime(log.timestamp);
            return vietnamTime.getUTCHours() < 13;
        });

        const afternoonLogs = dayLogs.filter(log => {
            const vietnamTime = TimezoneService.toVietnamTime(log.timestamp);
            return vietnamTime.getUTCHours() >= 13;
        });

        const morningResult = this.calculateShiftHours(morningLogs);
        const afternoonResult = this.calculateShiftHours(afternoonLogs);

        const totalHours = morningResult.hours + afternoonResult.hours;

        return {
            morningHours: this.formatHoursDisplay(morningResult.hours),
            afternoonHours: this.formatHoursDisplay(afternoonResult.hours),
            totalHours: this.formatHoursDisplay(totalHours),
            warnings: [...morningResult.warnings, ...afternoonResult.warnings],
            position: 'Nhân viên Mascot'
        };
    }

    /**
     * Logic tính giờ cho nhân viên thời vụ: yêu cầu đúng 1 check-in và 1 check-out.
     * @param {Array<object>} dayLogs - Các log chấm công trong ngày.
     * @returns {object} - Kết quả giờ công.
     */
    calculateRegularHours(dayLogs) {
        const checkinLog = dayLogs.find(log => log.type === 'Checkin');
        const checkoutLog = dayLogs.find(log => log.type === 'Checkout');

        if (!checkinLog || !checkoutLog) {
            return {
                totalHours: '0 giờ 0 phút',
                warnings: [
                    !checkinLog ? 'Thiếu check in' : '',
                    !checkoutLog ? 'Thiếu check out' : ''
                ].filter(Boolean),
                position: dayLogs[0]?.position || 'N/A'
            };
        }

        // ✅ SỬA: Sử dụng TimezoneService để chuyển đổi timestamp
        const checkinTime = TimezoneService.toVietnamTime(checkinLog.timestamp);
        const checkoutTime = TimezoneService.toVietnamTime(checkoutLog.timestamp);
        const diffHours = (checkoutTime - checkinTime) / (1000 * 60 * 60);

        return {
            totalHours: this.formatHoursDisplay(Math.max(0, diffHours)),
            warnings: [],
            position: dayLogs[0]?.position || 'N/A'
        };
    }

    /**
     * Tính toán giờ làm cho một ca đơn lẻ (gồm 1 check-in và 1 check-out) (Dùng cho masscot).
     * @param {Array<object>} shiftLogs - Các log trong một ca.
     * @returns {{hours: number, warnings: Array<string>}} - Số giờ và cảnh báo.
     */
    calculateShiftHours(shiftLogs) {
        const checkin = shiftLogs.find(log => log.type === 'Checkin');
        const checkout = shiftLogs.find(log => log.type === 'Checkout');

        if (!checkin || !checkout) {
            return {
                hours: 0,
                warnings: [
                    !checkin ? 'Thiếu check in ca này' : '',
                    !checkout ? 'Thiếu check out ca này' : ''
                ].filter(Boolean)
            };
        }

        // ✅ SỬA: Sử dụng TimezoneService để chuyển đổi timestamp
        const checkinTime = TimezoneService.toVietnamTime(checkin.timestamp);
        const checkoutTime = TimezoneService.toVietnamTime(checkout.timestamp);
        const diffHours = (checkoutTime - checkinTime) / (1000 * 60 * 60);
        
        return {
            hours: Math.max(0, diffHours),
            warnings: []
        };
    }

    // =================================================================
    //  DATA TRANSFORMATION & FILTERING - CHUYỂN ĐỔI & LỌC DỮ LIỆU
    // =================================================================

    /**
     * Chuyển đổi dữ liệu chấm công thô từ Lark Bitable thành một đối tượng có cấu trúc rõ ràng.
     * @param {Array<object>} larkData - Mảng các bản ghi từ API của Lark.
     * @returns {Array<object>} - Mảng các bản ghi đã được chuyển đổi.
     */
    transformAttendanceData(larkData) {
        
        return larkData.map(record => {
            let employeeId = '';
            const employeeIdField = record.fields['Mã nhân viên'];
            
            if (Array.isArray(employeeIdField) && employeeIdField.length > 0) {
                employeeId = employeeIdField[0]?.text || '';
            } else if (typeof employeeIdField === 'string') {
                employeeId = employeeIdField;
            }

            // ✅ SỬA: Sử dụng TimezoneService để convert timestamp
            const convertedTimestamp = this.convertUnixToDateTime(record.fields['Thời gian chấm công']);
            const vietnamTime = TimezoneService.toVietnamTime(convertedTimestamp);
            
            return {
                id: record.record_id,
                employeeId: employeeId,
                type: record.fields['Phân loại'] || '',
                position: record.fields['Vị trí'] || '',
                timestamp: convertedTimestamp,
                date: TimezoneService.larkTimestampToDateString(new Date(convertedTimestamp).getTime()) || vietnamTime.toISOString().split('T')[0],
                time: TimezoneService.formatTime(convertedTimestamp),
                notes: record.fields['Ghi chú'] || '',
                createdAt: record.fields['Created At'] || TimezoneService.getCurrentVietnamDate().toISOString()
            };
        });
    }

    /**
     * Chuyển đổi dữ liệu từ ứng dụng sang định dạng mà API của Lark Bitable yêu cầu.
     * @param {object} attendanceData - Dữ liệu chấm công từ ứng dụng.
     * @returns {object} - Đối tượng `fields` để gửi cho Lark.
     */
    transformAttendanceForLark(attendanceData) {
        // ✅ SỬA: Sử dụng TimezoneService để convert timestamp
        let timestamp;
        if (attendanceData.timestamp) {
            const vietnamTime = TimezoneService.toVietnamTime(attendanceData.timestamp);
            timestamp = Math.floor(vietnamTime.getTime() / 1000);
        } else {
            const currentVietnamTime = TimezoneService.getCurrentVietnamDate();
            timestamp = Math.floor(currentVietnamTime.getTime() / 1000);
        }

        return {
            'Mã nhân viên': attendanceData.employeeId,
            'Phân loại': attendanceData.type,
            'Vị trí': attendanceData.position,
            'Thời gian chấm công': timestamp,
            'Ghi chú': attendanceData.notes || '',
            'Created At': TimezoneService.getCurrentVietnamDate().toISOString()
        };
    }

    /**
     * Lọc một danh sách các bản ghi chấm công theo khoảng ngày.
     * @param {Array<object>} logs - Mảng các bản ghi chấm công.
     * @param {string} dateFrom - Ngày bắt đầu (YYYY-MM-DD).
     * @param {string} dateTo - Ngày kết thúc (YYYY-MM-DD).
     * @returns {Array<object>} - Mảng các bản ghi đã được lọc.
     */
    filterByDateRange(logs, dateFrom, dateTo) {
        return logs.filter(log => {
            // ✅ SỬA: Sử dụng TimezoneService để so sánh ngày
            if (!TimezoneService.isValidDate(log.date)) return false;
            
            const logVietnamTime = TimezoneService.toVietnamTime(log.date);
            
            if (dateFrom && TimezoneService.isValidDate(dateFrom)) {
                const fromVietnamTime = TimezoneService.toVietnamTime(dateFrom);
                if (TimezoneService.isDateBefore(logVietnamTime, fromVietnamTime)) return false;
            }
            
            if (dateTo && TimezoneService.isValidDate(dateTo)) {
                const toVietnamTime = TimezoneService.toVietnamTime(dateTo);
                if (TimezoneService.isDateAfter(logVietnamTime, toVietnamTime)) return false;
            }
            
            return true;
        });
    }

    // =================================================================
    //  UTILITY HELPERS - CÁC HÀM TIỆN ÍCH
    // =================================================================

    /**
     * Trích xuất mã nhân viên từ trường dữ liệu của Lark (có thể là string hoặc array).
     * @param {string|Array} employeeIdField - Dữ liệu từ cột "Mã nhân viên".
     * @returns {string} - Mã nhân viên dạng chuỗi.
     */
    extractEmployeeId(employeeIdField) {
        if (!employeeIdField) return '';
        
        // Nếu là array (linked record từ Lark)
        if (Array.isArray(employeeIdField) && employeeIdField.length > 0) {
            const firstRecord = employeeIdField[0];
            return firstRecord?.text || firstRecord?.name || '';
        }
        
        // Nếu là string đơn giản
        if (typeof employeeIdField === 'string') {
            return employeeIdField;
        }
        
        // Nếu là object
        if (typeof employeeIdField === 'object' && employeeIdField.text) {
            return employeeIdField.text;
        }
        
        console.warn('⚠️ Unknown employeeId format:', employeeIdField);
        return '';
    }

    /**
     * Chuyển đổi timestamp từ Lark (có thể là Unix milliseconds hoặc ISO string) sang định dạng ISO string.
     * @param {number|string} timestampValue - Giá trị timestamp từ Lark.
     * @returns {string} - Chuỗi ISO 8601 (ví dụ: "2025-08-08T10:00:00.000Z").
     */
    convertUnixToDateTime(unixTimestamp) {
        if (!unixTimestamp) return TimezoneService.getCurrentVietnamDate().toISOString();
        
        // ✅ SỬA: Sử dụng TimezoneService để validate và convert
        if (typeof unixTimestamp === 'string' && unixTimestamp.includes('T')) {
            if (TimezoneService.isValidDate(unixTimestamp)) {
                return TimezoneService.toVietnamTime(unixTimestamp).toISOString();
            }
        }
        
        // ✅ SỬA: Sử dụng TimezoneService để convert timestamp
        if (typeof unixTimestamp === 'number') {
            if (TimezoneService.isValidDate(new Date(unixTimestamp))) {
                return TimezoneService.toVietnamTime(unixTimestamp).toISOString();
            }
        }
        
        console.warn('⚠️ Invalid timestamp format:', unixTimestamp);
        return TimezoneService.getCurrentVietnamDate().toISOString();
    }

    /**
     * Định dạng tổng số giờ sang chuỗi hiển thị "X giờ Y phút".
     * @param {number} totalHours - Tổng số giờ (ví dụ: 8.5).
     * @returns {string} - Chuỗi đã định dạng (ví dụ: "8 giờ 30 phút").
     */
    formatHoursDisplay(totalHours) {
        if (!totalHours || totalHours === 0) return '0 giờ 0 phút';
        
        const hours = Math.floor(totalHours);
        const minutes = Math.round((totalHours - hours) * 60);
        
        if (minutes === 0) {
            return `${hours} giờ`;
        } else if (hours === 0) {
            return `${minutes} phút`;
        } else {
            return `${hours} giờ ${minutes} phút`;
        }
    }
}

export default AttendanceService;
