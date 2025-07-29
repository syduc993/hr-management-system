// server/services/attendance/attendance-service.js
import BaseService from '../core/base-service.js';
import LarkClient from '../core/lark-client.js';
import CacheService from '../core/cache-service.js';

class AttendanceService extends BaseService {
    constructor() {
        super();
        this.baseId = process.env.LARK_BASE_ID;
        this.tableId = process.env.LARK_ATTENDANCE_TABLE_ID;
    }

    async initializeService() {
        console.log('Initializing Attendance Service...');
    }

    async getAttendanceLogs(filters = {}) {
        const cacheKey = `attendance_logs_${JSON.stringify(filters)}`;
        let logs = CacheService.get(cacheKey);
        
        if (logs) {
            console.log(`✅ ATTENDANCE: Loaded ${logs.length} records from cache.`);
            return logs;
        }

        try {
            console.log('📡 ATTENDANCE: Fetching all attendance logs from Lark...');
            
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
            console.log(`✅ ATTENDANCE: Transformed ${logs.length} total records from Lark.`);
            
            // Lọc theo ngày (sau khi đã lấy hết dữ liệu)
            if (filters.dateFrom || filters.dateTo) {
                logs = this.filterByDateRange(logs, filters.dateFrom, filters.dateTo);
                console.log(`✅ ATTENDANCE: Filtered by date range, resulting in ${logs.length} records.`);
            }
            
            CacheService.set(cacheKey, logs, 300000); // Cache trong 5 phút
            console.log(`✅ ATTENDANCE: Cached ${logs.length} records.`);

        } catch (error) {
            console.error('❌ Error fetching attendance logs:', error);
            logs = []; // Trả về mảng rỗng nếu có lỗi
        }
        
        return logs;
    }

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

    // ✅ CẬP NHẬT: getEmployeeHours để hiển thị tất cả nhân viên
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


    // ✅ CẬP NHẬT: Thêm more detailed debugging
    groupLogsByEmployeeAndDate(logs) {
        console.log('🔍 DEBUG: Raw logs for grouping:', logs.map(log => ({
            employeeId: log.employeeId,
            date: log.date,
            type: log.type,
            timestamp: log.timestamp
        })));
        
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
        
        console.log('🔍 DEBUG: Grouped logs:', Object.keys(grouped).map(empId => ({
            employeeId: empId,
            dates: Object.keys(grouped[empId]),
            totalRecords: Object.values(grouped[empId]).flat().length
        })));
        
        return grouped;
    }

    // ✅ TÍNH GIỜ CÔNG THEO NGÀY VÀ CHỨC VỤ
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

    // ✅ THÊM: Logic đơn giản cho tất cả nhân viên
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
        
        // ✅ LẤY CHECK IN SỚM NHẤT VÀ CHECK OUT MUỘN NHẤT
        const earliestCheckin = checkinLogs.reduce((earliest, current) => 
            new Date(current.timestamp) < new Date(earliest.timestamp) ? current : earliest
        );
        
        const latestCheckout = checkoutLogs.reduce((latest, current) => 
            new Date(current.timestamp) > new Date(latest.timestamp) ? current : latest
        );
        
        const checkinTime = new Date(earliestCheckin.timestamp);
        const checkoutTime = new Date(latestCheckout.timestamp);
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

    // ✅ TÍNH GIỜ CHO MASCOT (4 lần chấm công/ngày)
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

        // Chia ca theo 13:00
        const morningLogs = dayLogs.filter(log => {
            const hour = new Date(log.timestamp).getHours();
            return hour < 13;
        });

        const afternoonLogs = dayLogs.filter(log => {
            const hour = new Date(log.timestamp).getHours();
            return hour >= 13;
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

    // ✅ TÍNH GIỜ CHO NHÂN VIÊN THỜI VỤ (2 lần chấm công/ngày)
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

        const checkinTime = new Date(checkinLog.timestamp);
        const checkoutTime = new Date(checkoutLog.timestamp);
        const diffHours = (checkoutTime - checkinTime) / (1000 * 60 * 60);

        return {
            totalHours: this.formatHoursDisplay(Math.max(0, diffHours)),
            warnings: [],
            position: dayLogs[0]?.position || 'N/A'
        };
    }

    // ✅ TÍNH GIỜ CHO 1 CA (DÙNG CHO MASCOT)
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

        const diffHours = (new Date(checkout.timestamp) - new Date(checkin.timestamp)) / (1000 * 60 * 60);
        return {
            hours: Math.max(0, diffHours),
            warnings: []
        };
    }

    // ✅ FORMAT HIỂN THỊ GIỜ: "8 giờ 30 phút"
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

    // ✅ FILTER THEO KHOẢNG NGÀY
    filterByDateRange(logs, dateFrom, dateTo) {
        return logs.filter(log => {
            const logDate = new Date(log.date);
            const fromDate = dateFrom ? new Date(dateFrom) : null;
            const toDate = dateTo ? new Date(dateTo) : null;
            
            if (fromDate && logDate < fromDate) return false;
            if (toDate && logDate > toDate) return false;
            
            return true;
        });
    }

    // ✅ SỬA: HELPER FUNCTIONS với timestamp conversion đúng
    convertUnixToDateTime(unixTimestamp) {
        if (!unixTimestamp) return '';
        
        console.log('🔍 Raw timestamp:', unixTimestamp, typeof unixTimestamp);
        
        // Nếu timestamp đã là ISO string
        if (typeof unixTimestamp === 'string' && unixTimestamp.includes('T')) {
            const date = new Date(unixTimestamp);
            if (date.getFullYear() > 2000 && date.getFullYear() < 2100) {
                return unixTimestamp;
            }
        }
        
        // ✅ QUAN TRỌNG: Timestamp từ Lark đã là milliseconds, không nhân 1000
        if (typeof unixTimestamp === 'number') {
            return new Date(unixTimestamp).toISOString();
        }
        
        console.warn('⚠️ Invalid timestamp format:', unixTimestamp);
        return new Date().toISOString();
    }

    // ✅ SỬA: Sử dụng trực tiếp timestamp từ convertUnixToDateTime
    transformAttendanceData(larkData) {
        
        return larkData.map(record => {
            let employeeId = '';
            const employeeIdField = record.fields['Mã nhân viên'];
            
            if (Array.isArray(employeeIdField) && employeeIdField.length > 0) {
                employeeId = employeeIdField[0]?.text || '';
                console.log('🔍 EXTRACTED EMPLOYEE ID:', employeeId);
            } else if (typeof employeeIdField === 'string') {
                employeeId = employeeIdField;
            }

            // ✅ SỬA: Sử dụng timestamp đã convert để extract date và time
            const convertedTimestamp = this.convertUnixToDateTime(record.fields['Thời gian chấm công']);
            const dateObj = new Date(convertedTimestamp);
            
            
            return {
                id: record.record_id,
                employeeId: employeeId,
                type: record.fields['Phân loại'] || '',
                position: record.fields['Vị trí'] || '',
                timestamp: convertedTimestamp,
                date: dateObj.toISOString().split('T')[0],
                time: dateObj.toTimeString().slice(0, 5),
                notes: record.fields['Ghi chú'] || '',
                createdAt: record.fields['Created At'] || new Date().toISOString()
            };
        });
    }

    // ✅ TRANSFORM DỮ LIỆU ĐỂ GỬI VỀ LARKBASE
    transformAttendanceForLark(attendanceData) {
        return {
            'Mã nhân viên': attendanceData.employeeId,
            'Phân loại': attendanceData.type,
            'Vị trí': attendanceData.position,
            'Thời gian chấm công': Math.floor(new Date(attendanceData.timestamp).getTime() / 1000),
            'Ghi chú': attendanceData.notes || '',
            'Created At': new Date().toISOString()
        };
    }

    // ✅ THÊM: Helper method để extract employeeId từ Lark field
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
}

export default AttendanceService;
