// server/services/employees/work-history-service.js


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


// =================================================================
// HÀM TIỆN ÍCH ĐỘC LẬP (STANDALONE UTILITY FUNCTIONS)
// =================================================================


/**
 * Định dạng một giá trị ngày thành chuỗi 'DD/MM/YYYY'.
 * @param {Date|string|number} dateValue - Giá trị ngày cần định dạng.
 * @returns {string} Chuỗi ngày đã định dạng hoặc 'N/A' nếu không có giá trị, 'Ngày không hợp lệ' nếu sai định dạng.
 */
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


    /**
     * Lấy toàn bộ lịch sử công tác của nhân viên từ Lark Bitable.
     * Hàm này sẽ thực hiện các bước sau:
     * 1. Gọi API để lấy dữ liệu thô từ Lark.
     * 2. Lấy thêm dữ liệu lương để làm giàu thông tin.
     * 3. Biến đổi và kết hợp hai nguồn dữ liệu trên.
     * 4. Lưu kết quả vào cache để tăng tốc cho các lần gọi sau.
     * 5. Xử lý lỗi một cách an toàn.
     *
     * @returns {Promise<Array>} Một mảng chứa các đối tượng lịch sử công tác đã được xử lý,
     *                            hoặc một mảng rỗng nếu có lỗi xảy ra.
     */
    async getAllWorkHistory() {
        // Định danh key cho việc cache dữ liệu. Giúp truy xuất và lưu trữ nhất quán.
        const cacheKey = 'work_history_all';

        try {
            // Gọi API để lấy tất cả bản ghi lịch sử công tác từ Lark Bitable.
            // `await` đảm bảo chương trình sẽ đợi cho đến khi có phản hồi từ server.
            const response = await LarkClient.getAllRecords(
                `/bitable/v1/apps/${this.baseId}/tables/${this.tableId}/records`
            );

            // Lấy dữ liệu lương để kết hợp ở bước sau.
            const salaryData = await this.getSalaryData();

            // Biến đổi dữ liệu thô từ Lark và kết hợp với dữ liệu lương.
            const history = this.transformWorkHistoryDataWithSalary(response.data?.items || [], salaryData);
            CacheService.set(cacheKey, history, 300000);

            // Trả về danh sách lịch sử công tác đã xử lý.
            return history;
        } catch (error) {
            console.error('❌ Đã xảy ra lỗi khi lấy lịch sử công tác:', error);
            // Trả về một mảng rỗng để đảm bảo các phần khác của ứng dụng không bị "crash" khi không nhận được dữ liệu.
            return [];
        }
    }


    /**
     * Lấy lịch sử công tác của một nhân viên cụ thể dựa vào mã nhân viên.
     * @param {string} employeeId - Mã của nhân viên.
     * @returns {Promise<Array<Object>>} Một mảng chứa lịch sử công tác của nhân viên đó.
     */
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


    /**
     * Lấy một bản ghi lịch sử công tác cụ thể bằng ID của bản ghi (record_id).
     * @param {string} id - ID của bản ghi trong Lark Bitable.
     * @returns {Promise<Object|null>} Đối tượng lịch sử công tác hoặc null nếu không tìm thấy.
     */
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


        /**
     * Thêm một bản ghi lịch sử công tác mới.
     * @param {Object} workHistoryData - Dữ liệu về lịch sử công tác cần thêm.
     * @param {Object} recruitmentService - Một instance của RecruitmentService để lấy thông tin đề xuất.
     * @returns {Promise<Object>} Thông tin về bản ghi đã được tạo thành công.
     * @throws {Error} Ném lỗi nếu dữ liệu không hợp lệ hoặc có lỗi từ API.
     */
    async addWorkHistory(workHistoryData, recruitmentService) {
        try {
            const { employeeId, requestNo, fromDate, toDate, hourlyRate } = workHistoryData;

            console.log('📥 WORK HISTORY SERVICE: Processing new work history:', { employeeId, requestNo, fromDate, toDate, hourlyRate });

            const recruitmentDetails = await recruitmentService.getRequestByNo(requestNo);

            if (!recruitmentDetails) {
                throw new Error(`Không tìm thấy đề xuất tuyển dụng với mã: ${requestNo}`);
            }

            this.validateWorkHistoryFields(workHistoryData, recruitmentDetails);
            //await this.validateWorkHistoryDateOverlap(employeeId, requestNo, recruitmentService);
            await this.validateWorkHistoryDateOverlap(employeeId, workHistoryData, recruitmentService);
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


    /**
     * Cập nhật một bản ghi lịch sử công tác đã có.
     * @param {string} id - ID của bản ghi cần cập nhật.
     * @param {Object} workHistoryData - Dữ liệu mới để cập nhật.
     * @returns {Promise<Object>} Thông tin về bản ghi đã được cập nhật.
     * @throws {Error} Ném lỗi nếu không tìm thấy bản ghi hoặc có lỗi từ API.
     */
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

    /**
     * Xóa một bản ghi lịch sử công tác bằng ID.
     * @param {string} id - ID của bản ghi cần xóa.
     * @returns {Promise<Object>} Thông báo thành công.
     * @throws {Error} Ném lỗi nếu không tìm thấy bản ghi hoặc có lỗi từ API.
     */
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

    // ✅ THÊM MỚI: Method để xóa tất cả work history của một employee
    async deleteAllWorkHistoryByEmployee(employeeId) {
        try {
            console.log(`🗑️ Deleting all work history for employee: ${employeeId}`);
            
            // Lấy tất cả work history của employee
            const workHistories = await this.getWorkHistoryByEmployee(employeeId);
            
            if (workHistories.length === 0) {
                console.log('ℹ️ No work history to delete for this employee');
                return { success: true, deletedCount: 0 };
            }
            
            // Xóa từng record
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

    /**
     * Lấy và cache dữ liệu lương từ bảng lương.
     * Dữ liệu này được dùng để làm giàu thông tin cho lịch sử công tác.
     * @returns {Promise<Array<Object>>} Mảng các đối tượng lương đã được xử lý.
     */
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

    /**
     * Xác thực các trường cơ bản của một đối tượng lịch sử công tác.
     * @param {Object} workHistoryData - Dữ liệu lịch sử công tác.
     * @throws {Error} Ném lỗi nếu có trường không hợp lệ.
     */
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

            // ✅ SỬA: Normalize về đầu ngày để tránh lỗi precision
            fromDateObj.setHours(0, 0, 0, 0);
            toDateObj.setHours(23, 59, 59, 999);  // Cuối ngày để inclusive
            recruitmentStart.setHours(0, 0, 0, 0);
            recruitmentEnd.setHours(23, 59, 59, 999);

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


    /**
     * Xác thực khoảng ngày làm việc, đảm bảo không trùng với các lịch sử đã có
     * và phải nằm trong khoảng ngày của đề xuất tuyển dụng liên quan.
     * @param {string} employeeId - Mã nhân viên.
     * @param {Object} workHistoryData - Dữ liệu lịch sử công tác mới.
     * @param {Object} recruitmentService - Instance của RecruitmentService.
     * @throws {Error} Ném lỗi nếu có sự chồng chéo ngày hoặc ngày nằm ngoài đề xuất.
     */
    async validateWorkHistoryDateOverlap(employeeId, workHistoryData, recruitmentService) {
        console.log(`🔍 VALIDATING DATE OVERLAP: Employee ${employeeId}, New work period: ${workHistoryData.fromDate} - ${workHistoryData.toDate}`);

        // ✅ BƯỚC 1: Validate khoảng ngày có nằm trong đề xuất tuyển dụng không
        const recruitmentDetails = await recruitmentService.getRequestByNo(workHistoryData.requestNo);
        if (recruitmentDetails && recruitmentDetails.fromDate && recruitmentDetails.toDate) {
            const workStart = new Date(workHistoryData.fromDate);
            const workEnd = new Date(workHistoryData.toDate);
            const recruitmentStart = new Date(recruitmentDetails.fromDate);
            const recruitmentEnd = new Date(recruitmentDetails.toDate);

            // Normalize về đầu ngày để tránh lỗi precision
            workStart.setHours(0, 0, 0, 0);
            workEnd.setHours(23, 59, 59, 999);
            recruitmentStart.setHours(0, 0, 0, 0);
            recruitmentEnd.setHours(23, 59, 59, 999);

            if (workStart < recruitmentStart || workEnd > recruitmentEnd) {
                throw new Error(
                    `Khoảng ngày làm việc (${formatDate(workHistoryData.fromDate)} - ${formatDate(workHistoryData.toDate)}) phải nằm trong khoảng ngày của đề xuất tuyển dụng (${formatDate(recruitmentDetails.fromDate)} - ${formatDate(recruitmentDetails.toDate)}).`
                );
            }
        }

        // ✅ BƯỚC 2: Kiểm tra trùng lặp với work history cũ (ngày thực tế làm việc)
        const existingHistories = await this.getWorkHistoryByEmployee(employeeId);
        if (existingHistories.length === 0) {
            console.log('✅ Không có lịch sử cũ, không cần kiểm tra overlap.');
            return;
        }

        const newWorkStart = new Date(workHistoryData.fromDate);
        const newWorkEnd = new Date(workHistoryData.toDate);

        for (const oldHistory of existingHistories) {
            // ⚠️ QUAN TRỌNG: So sánh với ngày thực tế làm việc, không phải ngày đề xuất
            if (!oldHistory.fromDate || !oldHistory.toDate) {
                continue; // Skip nếu không có thông tin ngày
            }

            const oldWorkStart = new Date(oldHistory.fromDate);
            const oldWorkEnd = new Date(oldHistory.toDate);

            // Kiểm tra overlap giữa 2 khoảng ngày thực tế làm việc
            if (dateRangesOverlap(newWorkStart, newWorkEnd, oldWorkStart, oldWorkEnd)) {
                const formattedNewStart = formatDate(workHistoryData.fromDate);
                const formattedNewEnd = formatDate(workHistoryData.toDate);
                const formattedOldStart = formatDate(oldHistory.fromDate);
                const formattedOldEnd = formatDate(oldHistory.toDate);

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
                // SỬA: Lấy giá trị thực từ Lark, không tự tạo mới
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

    /**
     * Biến đổi (transform) dữ liệu thô về lịch sử công tác từ Lark Bitable
     * thành một cấu trúc dữ liệu sạch sẽ, chuẩn hóa và dễ sử dụng hơn trong ứng dụng.
     *
     * @param {Array<Object>} larkData - Mảng chứa các bản ghi (record) thô từ API của Lark.
     *                                  Mỗi record chứa một thuộc tính `fields` với dữ liệu thực tế.
     * @returns {Array<Object>} Một mảng mới chứa các đối tượng lịch sử công tác đã được định dạng lại.
     */
    transformWorkHistoryData(larkData) {
        // Sử dụng phương thức `map()` để duyệt qua từng `record` trong mảng `larkData` và trả về một mảng mới chứa các đối tượng đã được định dạng lại.

        return larkData.map(record => {
            // Đối với mỗi record, tạo và trả về một đối tượng mới với cấu trúc đã được chuẩn hóa.
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

    // ✅ THÊM: Helper method
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
            
            if (isNaN(date.getTime())) {
                console.warn('⚠️ Invalid date:', timestamp);
                return null;
            }
            
            return date.toISOString().split('T')[0]; // Return YYYY-MM-DD format
        } catch (error) {
            console.error('❌ Error converting timestamp:', error);
            return null;
        }
    }

    transformWorkHistoryForLark(workHistoryData) {
        const larkData = {
            'Mã nhân viên': workHistoryData.employeeId,
            'Request No.': workHistoryData.requestNo
        };

        // ✅ Convert string date to timestamp
        if (workHistoryData.fromDate) {
            const fromDate = new Date(workHistoryData.fromDate);
            larkData['Từ ngày'] = fromDate.getTime(); // Convert to timestamp
        }

        if (workHistoryData.toDate) {
            const toDate = new Date(workHistoryData.toDate);
            larkData['Đến ngày'] = toDate.getTime(); // Convert to timestamp
        }

        if (workHistoryData.hourlyRate !== undefined && workHistoryData.hourlyRate !== null) {
            larkData['Mức lương/giờ'] = parseFloat(workHistoryData.hourlyRate);
        }

        return larkData;
    }

}


export default WorkHistoryService;
