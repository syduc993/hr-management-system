// server/services/employees/work-history-service.js
import BaseService from '../core/base-service.js';
import LarkClient from '../core/lark-client.js';
import CacheService from '../core/cache-service.js';


// **HÀM TIỆN ÍCH ĐỊNH DẠNG NGÀY**
const formatDate = (dateValue) => {
    if (!dateValue) return 'N/A';
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return 'Ngày không hợp lệ';
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
};


// Hàm tiện ích để kiểm tra hai khoảng ngày có chồng chéo không
const dateRangesOverlap = (start1, end1, start2, end2) => {
    const s1 = new Date(start1);
    const e1 = new Date(end1);
    const s2 = new Date(start2);
    const e2 = new Date(end2);
    return s1 <= e2 && e1 >= s2;
};


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


            CacheService.set(cacheKey, salaryData, 300000); // Cache 5 phút
            return salaryData;
        } catch (error) {
            console.error('❌ Error getting salary data:', error);
            return [];
        }
    }


    transformSalaryData(larkData) {
        return larkData.map(record => ({
            id: record.record_id,
            employeeId: this.extractEmployeeId(record.fields['Mã nhân viên']),
            hourlyRate: record.fields['Mức lương/giờ'] || null,
        }));
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


    async getWorkHistoryByEmployee(employeeId) {
        try {
            console.log(`🔍 Getting work history for employee: ${employeeId}`);
            
            const response = await LarkClient.get(`/bitable/v1/apps/${this.baseId}/tables/${this.tableId}/records`, {
                filter: `AND(CurrentValue.[Mã nhân viên] = "${employeeId}")`
            });

            const workHistoryData = response.data?.items || [];
            console.log(`📋 Found ${workHistoryData.length} work history records`);

            const salaryData = await this.getSalaryData();
            console.log(`💰 Found ${salaryData.length} salary records`);

            return this.transformWorkHistoryDataWithSalary(workHistoryData, salaryData);
        } catch (error) {
            console.error('Error fetching work history:', error);
            return [];
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
                // SỬA: Lấy giá trị thực từ Lark, không tự tạo mới
                createdAt: record.fields['Created At'] || null, 
                updatedAt: record.fields['Updated At'] || null
            };
        });
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


    async validateWorkHistoryDateOverlap(employeeId, newRequestNo, recruitmentService) {
        console.log(`🔍 VALIDATING DATE OVERLAP: Employee ${employeeId}, Request ${newRequestNo}`);

        const newRequestDetails = await recruitmentService.getRequestByNo(newRequestNo);
        if (!newRequestDetails.fromDate || !newRequestDetails.toDate) {
            console.warn(`⚠️ Không tìm thấy ngày cho Request No. ${newRequestNo}, bỏ qua kiểm tra trùng lặp.`);
            return;
        }
        const newStartDate = newRequestDetails.fromDate;
        const newEndDate = newRequestDetails.toDate;

        const existingHistories = await this.getWorkHistoryByEmployee(employeeId);
        if (existingHistories.length === 0) {
            console.log('✅ Không có lịch sử cũ, không cần kiểm tra.');
            return;
        }

        for (const oldHistory of existingHistories) {
            const oldRequestDetails = await recruitmentService.getRequestByNo(oldHistory.requestNo);
            if (!oldRequestDetails || !oldRequestDetails.fromDate || !oldRequestDetails.toDate) {
                continue;
            }

            const oldStartDate = oldRequestDetails.fromDate;
            const oldEndDate = oldRequestDetails.toDate;

            if (dateRangesOverlap(newStartDate, newEndDate, oldStartDate, oldEndDate)) {
                const formattedNewStart = formatDate(newStartDate);
                const formattedNewEnd = formatDate(newEndDate);
                const formattedOldStart = formatDate(oldStartDate);
                const formattedOldEnd = formatDate(oldEndDate);

                const errorMessage = `Khoảng thời gian từ ${formattedNewStart} đến ${formattedNewEnd} bị trùng với lịch sử làm việc cũ (từ ${formattedOldStart} đến ${formattedOldEnd}, mã đề xuất ${oldHistory.requestNo}).`;
                console.error(`❌ DATE OVERLAP DETECTED: ${errorMessage}`);
                throw new Error(errorMessage);
            }
        }
        
        console.log('✅ Kiểm tra trùng lặp ngày thành công, không có chồng chéo.');
    }


    validateWorkHistoryFields(workHistoryData, recruitmentDetails) {
        const { fromDate, toDate, hourlyRate } = workHistoryData;
        
        if (!fromDate || !toDate) {
            throw new Error('Từ ngày và Đến ngày là bắt buộc.');
        }

        const fromDateObj = new Date(fromDate);
        const toDateObj = new Date(toDate);
        
        if (isNaN(fromDateObj.getTime()) || isNaN(toDateObj.getTime())) {
            throw new Error('Định dạng ngày không hợp lệ.');
        }

        if (toDateObj < fromDateObj) {
            throw new Error('Đến ngày phải lớn hơn hoặc bằng Từ ngày.');
        }

        if (recruitmentDetails && recruitmentDetails.fromDate && recruitmentDetails.toDate) {
            const recruitmentStart = new Date(recruitmentDetails.fromDate);
            const recruitmentEnd = new Date(recruitmentDetails.toDate);

            if (fromDateObj < recruitmentStart || toDateObj > recruitmentEnd) {
                throw new Error(
                    `Khoảng ngày làm việc (${formatDate(fromDate)} - ${formatDate(toDate)}) phải nằm trong khoảng ngày của đề xuất tuyển dụng (${formatDate(recruitmentDetails.fromDate)} - ${formatDate(recruitmentDetails.toDate)}).`
                );
            }
        }

        if (hourlyRate !== undefined && (isNaN(hourlyRate) || hourlyRate < 0)) {
            throw new Error('Mức lương/giờ phải là số và không được âm.');
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
            await this.validateWorkHistoryDateOverlap(employeeId, requestNo, recruitmentService);

            const transformedData = this.transformWorkHistoryForLark(workHistoryData);
            
            console.log('📤 WORK HISTORY SERVICE: Sending data to Lark:', transformedData);
            
            const response = await LarkClient.post(`/bitable/v1/apps/${this.baseId}/tables/${this.tableId}/records`, {
                fields: transformedData
            });

            console.log('📥 WORK HISTORY SERVICE: Raw Lark response:', response);

            // THÊM: Kiểm tra mã lỗi từ Lark API
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

            // SỬA: Loại bỏ hoàn toàn việc ghi đè vào các trường hệ thống
            const transformedData = this.transformWorkHistoryForLark(workHistoryData);
            
            console.log('📤 WORK HISTORY SERVICE: Updating data in Lark:', transformedData);
            
            const response = await LarkClient.put(`/bitable/v1/apps/${this.baseId}/tables/${this.tableId}/records/${id}`, {
                fields: transformedData
            });

            console.log('📥 WORK HISTORY SERVICE: Update response:', response);

            // THÊM: Kiểm tra mã lỗi từ Lark API
            if (response.code !== 0) {
                throw new Error(`Lỗi từ Lark API khi cập nhật: ${response.msg} (code: ${response.code})`);
            }

            // Xóa cache để đảm bảo dữ liệu được làm mới
            CacheService.delete('work_history_all');
            CacheService.delete('salary_data_all');
            CacheService.clear(); // Xóa toàn bộ cache để an toàn

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
            
            // THÊM: Kiểm tra mã lỗi từ Lark API
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


    async getAllWorkHistory() {
        const cacheKey = 'work_history_all';
        let history = CacheService.get(cacheKey);

        if (history) {
            console.log(`✅ WORK HISTORY: Loaded ${history.length} records from cache.`);
            return history;
        }

        try {
            console.log('📡 WORK HISTORY: Fetching all work history from Lark...');
            const response = await LarkClient.getAllRecords(
                `/bitable/v1/apps/${this.baseId}/tables/${this.tableId}/records`
            );

            const salaryData = await this.getSalaryData();
            history = this.transformWorkHistoryDataWithSalary(response.data?.items || [], salaryData);
            console.log(`✅ WORK HISTORY: Transformed ${history.length} total records.`);

            CacheService.set(cacheKey, history, 300000);
            return history;
        } catch (error) {
            console.error('❌ Error getting all work history:', error);
            return [];
        }
    }


    transformWorkHistoryData(larkData) {
        return larkData.map(record => ({
            id: record.record_id,
            employeeId: record.fields['Mã nhân viên'] || '',
            requestNo: record.fields['Request No.'] || '',
            fromDate: record.fields['Từ ngày'] || null,
            toDate: record.fields['Đến ngày'] || null,
            hourlyRate: record.fields['Mức lương/giờ'] || null,
            // SỬA: Lấy giá trị thực từ Lark, không tự tạo mới
            createdAt: record.fields['Created At'] || null,
            updatedAt: record.fields['Updated At'] || null
        }));
    }


    transformWorkHistoryForLark(workHistoryData) {
        const larkData = {
            'Mã nhân viên': workHistoryData.employeeId,
            'Request No.': workHistoryData.requestNo
        };

        if (workHistoryData.fromDate) {
            larkData['Từ ngày'] = workHistoryData.fromDate;
        }

        if (workHistoryData.toDate) {
            larkData['Đến ngày'] = workHistoryData.toDate;
        }

        if (workHistoryData.hourlyRate !== undefined && workHistoryData.hourlyRate !== null) {
            larkData['Mức lương/giờ'] = parseFloat(workHistoryData.hourlyRate);
        }

        return larkData;
    }
}


export default WorkHistoryService;
