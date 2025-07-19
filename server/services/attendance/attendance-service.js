// Attendance service
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
        
        if (!logs) {
            try {
                let filterString = '';
                if (filters.employeeId) {
                    filterString = `AND(CurrentValue.[Employee ID] = "${filters.employeeId}")`;
                }
                
                const response = await LarkClient.get(`/bitable/v1/apps/${this.baseId}/tables/${this.tableId}/records`, {
                    filter: filterString
                });

                logs = this.transformAttendanceData(response.data?.items || []);
                
                // Apply date filters if provided
                if (filters.dateFrom || filters.dateTo) {
                    logs = this.filterByDateRange(logs, filters.dateFrom, filters.dateTo);
                }
                
                CacheService.set(cacheKey, logs, 300000); // 5 minutes
            } catch (error) {
                console.error('Error fetching attendance logs:', error);
                logs = this.getMockAttendanceLogs();
            }
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

    async getEmployeeHours() {
        const logs = await this.getAttendanceLogs();
        const employeeHours = {};
        
        logs.forEach(log => {
            if (!employeeHours[log.employeeId]) {
                employeeHours[log.employeeId] = {
                    totalHours: 0,
                    totalDays: 0
                };
            }
            
            employeeHours[log.employeeId].totalHours += log.totalHours || 0;
            employeeHours[log.employeeId].totalDays += 1;
        });
        
        return employeeHours;
    }

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

    calculateTotalHours(timeIn, timeOut) {
        if (!timeIn || !timeOut) return 0;
        
        const inTime = new Date(`1970-01-01T${timeIn}`);
        const outTime = new Date(`1970-01-01T${timeOut}`);
        
        const diffMs = outTime - inTime;
        return Math.max(0, diffMs / (1000 * 60 * 60)); // Convert to hours
    }

    transformAttendanceData(larkData) {
        return larkData.map(record => {
            const timeIn = record.fields['Time In'] || '';
            const timeOut = record.fields['Time Out'] || '';
            const totalHours = this.calculateTotalHours(timeIn, timeOut);
            
            return {
                id: record.record_id,
                employeeId: record.fields['Employee ID'] || '',
                date: record.fields['Date'] || '',
                timeIn: timeIn,
                timeOut: timeOut,
                totalHours: totalHours,
                notes: record.fields['Notes'] || '',
                createdAt: record.fields['Created At'] || new Date().toISOString()
            };
        });
    }

    transformAttendanceForLark(attendanceData) {
        return {
            'Employee ID': attendanceData.employeeId,
            'Date': attendanceData.date,
            'Time In': attendanceData.timeIn,
            'Time Out': attendanceData.timeOut,
            'Notes': attendanceData.notes || '',
            'Created At': new Date().toISOString()
        };
    }

    getMockAttendanceLogs() {
        return [
            {
                id: 'att_001',
                employeeId: 'Nguyễn Văn A - 0123456789',
                date: '2025-01-15',
                timeIn: '08:00',
                timeOut: '17:00',
                totalHours: 8,
                notes: 'Làm việc bình thường',
                createdAt: new Date().toISOString()
            }
        ];
    }
}

export default AttendanceService;
