/**
 * @file Dịch vụ này chịu trách nhiệm quản lý tất cả các hoạt động liên quan đến
 * Lịch sử Công tác của Nhân viên (Work History).
 * Nó bao gồm các chức năng CRUD (Tạo, Đọc, Cập nhật, Xóa) dữ liệu từ
 * Lark Bitable, cũng như các logic xác thực và biến đổi dữ liệu phức tạp.
 * Dịch vụ sử dụng cache để tối ưu hóa hiệu suất cho các hoạt động đọc dữ liệu.
 */

import BaseService from '../core/base-service.js';
import LarkClient from '../core/lark-client.js';
import CacheService from '../core/cache-service.js';
import TimezoneService from '../core/timezone-service.js';

// =================================================================
// LỚP DỊCH VỤ (SERVICE CLASS)
// =================================================================

class WorkHistoryService extends BaseService {
    constructor() {
        super();
        this.baseId = process.env.LARK_BASE_ID;
        this.tableId = process.env.LARK_WORK_HISTORY_TABLE_ID;
        this.salaryTableId = process.env.LARK_SALARY_TABLE_ID || 'tblLdJp61bLeK3MG';
    }

    async initializeService() {
        console.log('Initializing Work History Service...');
    }

    // =================================================================
    // CÁC HÀM CÔNG KHAI - PUBLIC API (MAIN METHODS)
    // =================================================================

    async getAllWorkHistory() {
        const cacheKey = 'work_history_all';

        try {
            const response = await LarkClient.getAllRecords(
                `/bitable/v1/apps/${this.baseId}/tables/${this.tableId}/records`
            );

            const salaryData = await this.getSalaryData();

            const history = this.transformWorkHistoryDataWithSalary(response.data?.items || [], salaryData);
            CacheService.set(cacheKey, history, 300000);

            return history;
        } catch (error) {
            console.error('❌ Đã xảy ra lỗi khi lấy lịch sử công tác:', error);
            return [];
        }
    }

    async getWorkHistoryByEmployee(employeeId) {
        try {
            const response = await LarkClient.get(`/bitable/v1/apps/${this.baseId}/tables/${this.tableId}/records`, {
                filter: `AND(CurrentValue.[Mã nhân viên] = "${employeeId}")`
            });

            const workHistoryData = response.data?.items || [];
            const salaryData = await this.getSalaryData();

            return this.transformWorkHistoryDataWithSalary(workHistoryData, salaryData);
        } catch (error) {
            console.error('Error fetching work history:', error);
            return [];
        }
    }

    async getWorkHistoryById(id) {
        try {
            console.log('🔍 WORK HISTORY SERVICE: Getting work history by ID:', id);
            
            const response = await LarkClient.get(`/bitable/v1/apps/${this.baseId}/tables/${this.tableId}/records/${id}`);
            
            if (response.data && response.data.record) {
                const salaryData = await this.getSalaryData();
                return this.transformWorkHistoryDataWithSalary([response.data.record], salaryData)[0];
            }
            
            return null;
            
        } catch (error) {
            console.error('❌ Error getting work history by ID:', error);
            return null;
        }
    }

    async addWorkHistory(workHistoryData, recruitmentService) {
        try {
            const { employeeId, requestNo, fromDate, toDate, hourlyRate } = workHistoryData;

            console.log('📥 WORK HISTORY SERVICE: Processing new work history:', { employeeId, requestNo, fromDate, toDate, hourlyRate });

            const recruitmentDetails = await recruitmentService.getRequestByNo(requestNo);

            if (!recruitmentDetails) {
                throw new Error(`Không tìm thấy đề xuất tuyển dụng với mã: ${requestNo}`);
            }

            this.validateWorkHistoryFields(workHistoryData, recruitmentDetails);
            await this.validateWorkHistoryDateOverlap(employeeId, workHistoryData, recruitmentService);
            const transformedData = this.transformWorkHistoryForLark(workHistoryData);
            
            console.log('📤 WORK HISTORY SERVICE: Sending data to Lark:', transformedData);
            
            const response = await LarkClient.post(`/bitable/v1/apps/${this.baseId}/tables/${this.tableId}/records`, {
                fields: transformedData
            });

            console.log('📥 WORK HISTORY SERVICE: Raw Lark response:', response);

            if (response.code !== 0) {
                throw new Error(`Lỗi từ Lark API khi thêm: ${response.msg} (code: ${response.code})`);
            }

            CacheService.delete('work_history_all');
            CacheService.delete('salary_data_all');

            return {
                success: true,
                ...workHistoryData,
                larkResponse: response
            };
            
        } catch (error) {
            console.error('❌ WORK HISTORY SERVICE: Full error:', error);
            await this.handleError(error, 'addWorkHistory');
            throw error;
        }
    }

    async updateWorkHistory(id, workHistoryData) {
        try {
            const { employeeId, requestNo, fromDate, toDate, hourlyRate } = workHistoryData;

            console.log('📝 WORK HISTORY SERVICE: Updating work history:', { id, ...workHistoryData });

            const currentWorkHistory = await this.getWorkHistoryById(id);
            if (!currentWorkHistory) {
                throw new Error(`Không tìm thấy lịch sử công việc với ID: ${id}`);
            }

            if (!employeeId || !requestNo) {
                throw new Error('Mã nhân viên và Request No. là bắt buộc');
            }

            const transformedData = this.transformWorkHistoryForLark(workHistoryData);
            
            console.log('📤 WORK HISTORY SERVICE: Updating data in Lark:', transformedData);
            
            const response = await LarkClient.put(`/bitable/v1/apps/${this.baseId}/tables/${this.tableId}/records/${id}`, {
                fields: transformedData
            });

            console.log('📥 WORK HISTORY SERVICE: Update response:', response);

            if (response.code !== 0) {
                throw new Error(`Lỗi từ Lark API khi cập nhật: ${response.msg} (code: ${response.code})`);
            }

            CacheService.delete('work_history_all');
            CacheService.delete('salary_data_all');
            CacheService.clear();

            return {
                success: true,
                id: id,
                ...workHistoryData,
                larkResponse: response
            };
            
        } catch (error) {
            console.error('❌ WORK HISTORY SERVICE: Update error:', error);
            await this.handleError(error, 'updateWorkHistory');
            throw error;
        }
    }

    async deleteWorkHistory(id) {
        try {
            console.log('🗑️ WORK HISTORY SERVICE: Deleting work history:', id);

            const currentWorkHistory = await this.getWorkHistoryById(id);
            if (!currentWorkHistory) {
                throw new Error(`Không tìm thấy lịch sử công việc với ID: ${id}`);
            }

            const response = await LarkClient.delete(`/bitable/v1/apps/${this.baseId}/tables/${this.tableId}/records/${id}`);
            
            if (response.code !== 0) {
                throw new Error(`Lỗi từ Lark API khi xóa: ${response.msg} (code: ${response.code})`);
            }

            console.log('✅ WORK HISTORY SERVICE: Work history deleted successfully');

            CacheService.delete('work_history_all');
            CacheService.delete('salary_data_all');
            CacheService.clear();
            
            return {
                success: true,
                message: 'Xóa lịch sử công việc thành công'
            };
            
        } catch (error) {
            console.error('❌ WORK HISTORY SERVICE: Delete error:', error);
            await this.handleError(error, 'deleteWorkHistory');
            throw error;
        }
    }

    async deleteAllWorkHistoryByEmployee(employeeId) {
        try {
            console.log(`🗑️ Deleting all work history for employee: ${employeeId}`);
            
            const workHistories = await this.getWorkHistoryByEmployee(employeeId);
            
            if (workHistories.length === 0) {
                console.log('ℹ️ No work history to delete for this employee');
                return { success: true, deletedCount: 0 };
            }
            
            const deletePromises = workHistories.map(wh => 
                this.deleteWorkHistory(wh.id)
            );
            
            const results = await Promise.allSettled(deletePromises);
            
            const successful = results.filter(r => r.status === 'fulfilled').length;
            const failed = results.filter(r => r.status === 'rejected').length;
            
            if (failed > 0) {
                throw new Error(`Failed to delete ${failed} out of ${workHistories.length} work history records`);
            }
            
            console.log(`✅ Successfully deleted ${successful} work history records`);
            
            return {
                success: true,
                deletedCount: successful,
                originalCount: workHistories.length
            };
            
        } catch (error) {
            console.error('❌ Error deleting work history by employee:', error);
            throw error;
        }
    }

    // =================================================================
    // HÀM TIỆN ÍCH NỘI BỘ - INTERNAL HELPERS
    // =================================================================

    async getSalaryData() {
        const cacheKey = 'salary_data_all';
        let salaryData = CacheService.get(cacheKey);

        if (salaryData) {
            console.log(`✅ SALARY: Loaded ${salaryData.length} records from cache.`);
            return salaryData;
        }

        try {
            console.log('📡 SALARY: Fetching salary data from Lark...');
            const response = await LarkClient.getAllRecords(
                `/bitable/v1/apps/${this.baseId}/tables/${this.salaryTableId}/records`
            );

            salaryData = this.transformSalaryData(response.data?.items || []);
            console.log(`✅ SALARY: Transformed ${salaryData.length} total records.`);

            CacheService.set(cacheKey, salaryData, 300000);
            return salaryData;
        } catch (error) {
            console.error('❌ Error getting salary data:', error);
            return [];
        }
    }

    validateWorkHistoryFields(workHistoryData, recruitmentDetails) {
        const { fromDate, toDate, hourlyRate } = workHistoryData;
        
        if (!fromDate || !toDate) {
            throw new Error('Từ ngày và Đến ngày là bắt buộc.');
        }

        // ✅ SỬA: Sử dụng TimezoneService thay vì tự tạo date
        if (!TimezoneService.isValidDate(fromDate) || !TimezoneService.isValidDate(toDate)) {
            throw new Error('Định dạng ngày không hợp lệ.');
        }

        // ✅ SỬA: Sử dụng TimezoneService để so sánh ngày
        if (!TimezoneService.isDateBefore(fromDate, toDate) && !TimezoneService.isDateAfter(fromDate, toDate)) {
            // Nếu không phải before và không phải after thì có thể bằng nhau, điều này OK
        } else if (TimezoneService.isDateAfter(fromDate, toDate)) {
            throw new Error('Đến ngày phải lớn hơn hoặc bằng Từ ngày.');
        }

        if (recruitmentDetails && recruitmentDetails.fromDate && recruitmentDetails.toDate) {
            // ✅ SỬA: Sử dụng TimezoneService để kiểm tra khoảng ngày có nằm trong recruitment không
            const workStartVietnam = TimezoneService.toVietnamTime(fromDate);
            const workEndVietnam = TimezoneService.toVietnamTime(toDate);
            const recruitmentStartVietnam = TimezoneService.toVietnamTime(recruitmentDetails.fromDate);
            const recruitmentEndVietnam = TimezoneService.toVietnamTime(recruitmentDetails.toDate);

            // Normalize về đầu ngày và cuối ngày
            workStartVietnam.setUTCHours(0, 0, 0, 0);
            workEndVietnam.setUTCHours(23, 59, 59, 999);
            recruitmentStartVietnam.setUTCHours(0, 0, 0, 0);
            recruitmentEndVietnam.setUTCHours(23, 59, 59, 999);

            if (workStartVietnam < recruitmentStartVietnam || workEndVietnam > recruitmentEndVietnam) {
                throw new Error(
                    `Khoảng ngày làm việc (${TimezoneService.formatDate(fromDate)} - ${TimezoneService.formatDate(toDate)}) phải nằm trong khoảng ngày của đề xuất tuyển dụng (${TimezoneService.formatDate(recruitmentDetails.fromDate)} - ${TimezoneService.formatDate(recruitmentDetails.toDate)}).`
                );
            }
        }

        if (hourlyRate !== undefined && (isNaN(hourlyRate) || hourlyRate < 0)) {
            throw new Error('Mức lương/giờ phải là số và không được âm.');
        }
    }

    async validateWorkHistoryDateOverlap(employeeId, workHistoryData, recruitmentService) {
        console.log(`🔍 VALIDATING DATE OVERLAP: Employee ${employeeId}, New work period: ${workHistoryData.fromDate} - ${workHistoryData.toDate}`);

        // ✅ BƯỚC 1: Validate khoảng ngày có nằm trong đề xuất tuyển dụng không
        const recruitmentDetails = await recruitmentService.getRequestByNo(workHistoryData.requestNo);
        if (recruitmentDetails && recruitmentDetails.fromDate && recruitmentDetails.toDate) {
            // ✅ SỬA: Sử dụng TimezoneService thay vì tự tạo date
            const workStartVietnam = TimezoneService.toVietnamTime(workHistoryData.fromDate);
            const workEndVietnam = TimezoneService.toVietnamTime(workHistoryData.toDate);
            const recruitmentStartVietnam = TimezoneService.toVietnamTime(recruitmentDetails.fromDate);
            const recruitmentEndVietnam = TimezoneService.toVietnamTime(recruitmentDetails.toDate);

            // Normalize về đầu ngày và cuối ngày
            workStartVietnam.setUTCHours(0, 0, 0, 0);
            workEndVietnam.setUTCHours(23, 59, 59, 999);
            recruitmentStartVietnam.setUTCHours(0, 0, 0, 0);
            recruitmentEndVietnam.setUTCHours(23, 59, 59, 999);

            if (workStartVietnam < recruitmentStartVietnam || workEndVietnam > recruitmentEndVietnam) {
                throw new Error(
                    `Khoảng ngày làm việc (${TimezoneService.formatDate(workHistoryData.fromDate)} - ${TimezoneService.formatDate(workHistoryData.toDate)}) phải nằm trong khoảng ngày của đề xuất tuyển dụng (${TimezoneService.formatDate(recruitmentDetails.fromDate)} - ${TimezoneService.formatDate(recruitmentDetails.toDate)}).`
                );
            }
        }

        // ✅ BƯỚC 2: Kiểm tra trùng lặp với work history cũ (ngày thực tế làm việc)
        const existingHistories = await this.getWorkHistoryByEmployee(employeeId);
        if (existingHistories.length === 0) {
            console.log('✅ Không có lịch sử cũ, không cần kiểm tra overlap.');
            return;
        }

        for (const oldHistory of existingHistories) {
            if (!oldHistory.fromDate || !oldHistory.toDate) {
                continue;
            }

            // ✅ SỬA: Sử dụng TimezoneService để kiểm tra overlap
            if (TimezoneService.dateRangesOverlap(
                workHistoryData.fromDate, 
                workHistoryData.toDate, 
                oldHistory.fromDate, 
                oldHistory.toDate
            )) {
                const formattedNewStart = TimezoneService.formatDate(workHistoryData.fromDate);
                const formattedNewEnd = TimezoneService.formatDate(workHistoryData.toDate);
                const formattedOldStart = TimezoneService.formatDate(oldHistory.fromDate);
                const formattedOldEnd = TimezoneService.formatDate(oldHistory.toDate);

                throw new Error(`Khoảng thời gian làm việc từ ${formattedNewStart} đến ${formattedNewEnd} bị trùng với lịch sử làm việc cũ (từ ${formattedOldStart} đến ${formattedOldEnd}, mã đề xuất ${oldHistory.requestNo}).`);
            }
        }
        
        console.log('✅ Kiểm tra trùng lặp ngày thành công, không có chồng chéo.');
    }

    async checkWorkHistoryExists(employeeId, requestNo) {
        try {
            console.log(`🔍 WORK HISTORY: Checking duplicate (${employeeId}, ${requestNo})`);
            
            const response = await LarkClient.get(`/bitable/v1/apps/${this.baseId}/tables/${this.tableId}/records`);
            
            const records = response.data?.items || [];
            console.log(`📋 WORK HISTORY: Found ${records.length} total records`);
            
            const exists = records.some(record => {
                const fields = record.fields || {};
                const recordEmployeeId = fields['Mã nhân viên'];
                const recordRequestNo = fields['Request No.'];
                
                const isMatch = recordEmployeeId === employeeId && recordRequestNo === requestNo;
                
                if (isMatch) {
                    console.log(`❌ WORK HISTORY: Found duplicate - ${recordEmployeeId} / ${recordRequestNo}`);
                }
                
                return isMatch;
            });
            
            console.log(`✅ WORK HISTORY: Duplicate check result: ${exists ? 'EXISTS' : 'NOT_EXISTS'}`);
            return exists;
            
        } catch (error) {
            console.error('❌ Error checking work history exists:', error);
            return false;
        }
    }

    transformWorkHistoryDataWithSalary(workHistoryData, salaryData) {
        const salaryMap = new Map();
        salaryData.forEach(salary => {
            if (salary.employeeId) {
                salaryMap.set(salary.employeeId, salary.hourlyRate);
            }
        });

        console.log(`🗺️ Created salary map with ${salaryMap.size} entries`);
        console.log(`🔍 Salary map keys:`, Array.from(salaryMap.keys()));

        return workHistoryData.map(record => {
            const employeeId = record.fields['Mã nhân viên'] || '';
            const hourlyRateFromSalary = salaryMap.get(employeeId);
            
            console.log(`💡 Employee ${employeeId}: Work history hourlyRate = ${record.fields['Mức lương/giờ']}, Salary table hourlyRate = ${hourlyRateFromSalary}`);

            return {
                id: record.record_id,
                employeeId: employeeId,
                requestNo: record.fields['Request No.'] || '',
                fromDate: record.fields['Từ ngày'] || null,
                toDate: record.fields['Đến ngày'] || null,
                hourlyRate: record.fields['Mức lương/giờ'] || hourlyRateFromSalary || null,
                createdAt: record.fields['Created At'] || null, 
                updatedAt: record.fields['Updated At'] || null
            };
        });
    }

    transformSalaryData(larkData) {
        return larkData.map(record => ({
            id: record.record_id,
            employeeId: this.extractEmployeeId(record.fields['Mã nhân viên']),
            hourlyRate: record.fields['Mức lương/giờ'] || null,
        }));
    }

    transformWorkHistoryData(larkData) {
        return larkData.map(record => {
            return {
                id: record.record_id,
                employeeId: record.fields['Mã nhân viên'] || '',
                requestNo: record.fields['Request No.'] || '',
                fromDate: this.convertTimestampToDateString(record.fields['Từ ngày']),
                toDate: this.convertTimestampToDateString(record.fields['Đến ngày']),
                hourlyRate: record.fields['Mức lương/giờ'] || null,
                createdAt: record.fields['Created At'] || null,
                updatedAt: record.fields['Updated At'] || null
            };
        });
    }

    extractEmployeeId(employeeIdField) {
        if (!employeeIdField) return '';
        
        if (Array.isArray(employeeIdField) && employeeIdField.length > 0) {
            const firstRecord = employeeIdField[0];
            return firstRecord?.text || firstRecord?.name || '';
        }
        
        if (typeof employeeIdField === 'string') {
            return employeeIdField;
        }
        
        if (typeof employeeIdField === 'object' && employeeIdField.text) {
            return employeeIdField.text;
        }
        
        return '';
    }

    // ✅ SỬA: Sử dụng TimezoneService để convert timestamp
    convertTimestampToDateString(timestamp) {
        if (!timestamp) return null;
        
        try {
            let date;
            
            if (Array.isArray(timestamp) && timestamp.length > 0) {
                date = new Date(timestamp[0]);
            } else if (typeof timestamp === 'number') {
                date = new Date(timestamp);
            } else if (typeof timestamp === 'string') {
                date = new Date(timestamp);
            } else {
                console.warn('⚠️ Unknown timestamp format:', timestamp);
                return null;
            }
            
            if (!TimezoneService.isValidDate(date)) {
                console.warn('⚠️ Invalid date:', timestamp);
                return null;
            }
            
            // ✅ SỬA: Sử dụng TimezoneService để convert về date string
            return TimezoneService.larkTimestampToDateString(date.getTime());
        } catch (error) {
            console.error('❌ Error converting timestamp:', error);
            return null;
        }
    }

    // ✅ SỬA: Sử dụng TimezoneService để transform cho Lark
    transformWorkHistoryForLark(workHistoryData) {
        const larkData = {
            'Mã nhân viên': workHistoryData.employeeId,
            'Request No.': workHistoryData.requestNo
        };

        // ✅ SỬA: Sử dụng TimezoneService để convert date string thành timestamp
        if (workHistoryData.fromDate) {
            larkData['Từ ngày'] = TimezoneService.dateStringToLarkTimestamp(workHistoryData.fromDate);
        }

        if (workHistoryData.toDate) {
            larkData['Đến ngày'] = TimezoneService.dateStringToLarkTimestamp(workHistoryData.toDate);
        }

        if (workHistoryData.hourlyRate !== undefined && workHistoryData.hourlyRate !== null) {
            larkData['Mức lương/giờ'] = parseFloat(workHistoryData.hourlyRate);
        }

        return larkData;
    }
}

export default WorkHistoryService;
