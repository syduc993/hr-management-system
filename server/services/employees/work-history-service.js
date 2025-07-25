// Work history service
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
    // Trùng lặp khi khoảng bắt đầu của cái này trước khi khoảng kết thúc của cái kia
    // và khoảng kết thúc của cái này sau khi khoảng bắt đầu của cái kia.
    return s1 <= e2 && e1 >= s2;
};





class WorkHistoryService extends BaseService {
    constructor() {
        super();
        this.baseId = process.env.LARK_BASE_ID;
        this.tableId = process.env.LARK_WORK_HISTORY_TABLE_ID;
    }


    async initializeService() {
        console.log('Initializing Work History Service...');
    }


    async getWorkHistoryByEmployee(employeeId) {
        try {
            const response = await LarkClient.get(`/bitable/v1/apps/${this.baseId}/tables/${this.tableId}/records`, {
                filter: `AND(CurrentValue.[Mã nhân viên] = "${employeeId}")`
            });


            return this.transformWorkHistoryData(response.data?.items || []);
        } catch (error) {
            console.error('Error fetching work history:', error);
            return [];
        }
    }


    // ✅ THÊM METHOD MỚI
    async checkWorkHistoryExists(employeeId, requestNo) {
        try {
            console.log(`🔍 WORK HISTORY: Checking duplicate (${employeeId}, ${requestNo})`);
            
            const response = await LarkClient.get(`/bitable/v1/apps/${this.baseId}/tables/${this.tableId}/records`);
            
            const records = response.data?.items || [];
            console.log(`📋 WORK HISTORY: Found ${records.length} total records`);
            
            // Check xem có record nào match (employeeId, requestNo) không
            const exists = records.some(record => {
                const fields = record.fields || {};
                const recordEmployeeId = fields['Employee ID'];
                const recordRequestNo = fields['Request No'];
                
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
            return false; // Safe fallback - cho phép thêm nếu không check được
        }
    }


    async validateWorkHistoryDateOverlap(employeeId, newRequestNo, recruitmentService) {
        console.log(`🔍 VALIDATING DATE OVERLAP: Employee ${employeeId}, Request ${newRequestNo}`);

        // 1. Lấy khoảng ngày của lịch sử làm việc MỚI
        const newRequestDetails = await recruitmentService.getRequestByNo(newRequestNo);
        if (!newRequestDetails.fromDate || !newRequestDetails.toDate) {
            // Nếu không có ngày, bỏ qua kiểm tra
            console.warn(`⚠️  Không tìm thấy ngày cho Request No. ${newRequestNo}, bỏ qua kiểm tra trùng lặp.`);
            return;
        }
        const newStartDate = newRequestDetails.fromDate;
        const newEndDate = newRequestDetails.toDate;

        // 2. Lấy tất cả lịch sử làm việc HIỆN TẠI của nhân viên
        const existingHistories = await this.getWorkHistoryByEmployee(employeeId);
        if (existingHistories.length === 0) {
            console.log('✅  Không có lịch sử cũ, không cần kiểm tra.');
            return; // Không có gì để so sánh, hợp lệ
        }

        // 3. Lặp qua từng lịch sử cũ và so sánh
        for (const oldHistory of existingHistories) {
            const oldRequestDetails = await recruitmentService.getRequestByNo(oldHistory.requestNo);
            if (!oldRequestDetails || !oldRequestDetails.fromDate || !oldRequestDetails.toDate) {
                continue; // Bỏ qua nếu lịch sử cũ không có dữ liệu ngày
            }

            const oldStartDate = oldRequestDetails.fromDate;
            const oldEndDate = oldRequestDetails.toDate;

            // Kiểm tra trùng lặp
            if (dateRangesOverlap(newStartDate, newEndDate, oldStartDate, oldEndDate)) {

                const formattedNewStart = formatDate(newStartDate);
                const formattedNewEnd = formatDate(newEndDate);
                const formattedOldStart = formatDate(oldStartDate);
                const formattedOldEnd = formatDate(oldEndDate);

                const errorMessage = `Khoảng thời gian từ ${formattedNewStart} đến ${formattedNewEnd} bị trùng với lịch sử làm việc cũ (từ ${formattedOldStart} đến ${formattedOldEnd}, mã đề xuất ${oldHistory.requestNo}).`;
                console.error(`❌  DATE OVERLAP DETECTED: ${errorMessage}`);
                throw new Error(errorMessage);
            }
        }
        
        console.log('✅  Kiểm tra trùng lặp ngày thành công, không có chồng chéo.');
    }


    async addWorkHistory(workHistoryData, recruitmentService) {
        // **Thêm recruitmentService làm tham số**
        try {
            const { employeeId, requestNo } = workHistoryData;

            // **GỌI HÀM VALIDATE Ở ĐÂY**
            await this.validateWorkHistoryDateOverlap(employeeId, requestNo, recruitmentService);

            const transformedData = this.transformWorkHistoryForLark(workHistoryData);
            
            console.log('📤 WORK HISTORY SERVICE: Sending data to Lark:', transformedData);
            
            const response = await LarkClient.post(`/bitable/v1/apps/${this.baseId}/tables/${this.tableId}/records`, {
                fields: transformedData
            });

            console.log('📥 WORK HISTORY SERVICE: Raw Lark response:', response);

            return {
                success: true,
                employeeId: workHistoryData.employeeId,
                requestNo: workHistoryData.requestNo,
                larkResponse: response
            };
            
        } catch (error) {
            console.error('❌ WORK HISTORY SERVICE: Full error:', error);
            await this.handleError(error, 'addWorkHistory');
            throw error; // Ném lỗi để controller bắt được
        }
    }


    // async addWorkHistory(workHistoryData) {
    //     try {
    //         const transformedData = this.transformWorkHistoryForLark(workHistoryData);
            
    //         console.log('📤 WORK HISTORY SERVICE: Sending data to Lark:', transformedData);
    //         console.log('🔍 WORK HISTORY SERVICE: Base ID:', this.baseId);
    //         console.log('🔍 WORK HISTORY SERVICE: Table ID:', this.tableId);
    //         console.log('🔍 WORK HISTORY SERVICE: URL will be:', `/bitable/v1/apps/${this.baseId}/tables/${this.tableId}/records`);
            
    //         const response = await LarkClient.post(`/bitable/v1/apps/${this.baseId}/tables/${this.tableId}/records`, {
    //             fields: transformedData
    //         });

    //         console.log('📥 WORK HISTORY SERVICE: Raw Lark response:', response);
    //         console.log('📥 WORK HISTORY SERVICE: Response status:', response?.status);
    //         console.log('📥 WORK HISTORY SERVICE: Response data:', response?.data);

    //         return {
    //             success: true,
    //             employeeId: workHistoryData.employeeId,
    //             requestNo: workHistoryData.requestNo,
    //             larkResponse: response  // ✅ THÊM: Debug response
    //         };
            
    //     } catch (error) {
    //         console.error('❌ WORK HISTORY SERVICE: Full error:', error);
    //         console.error('❌ WORK HISTORY SERVICE: Error message:', error.message);
    //         console.error('❌ WORK HISTORY SERVICE: Error stack:', error.stack);
    //         await this.handleError(error, 'addWorkHistory');
    //         throw error;
    //     }
    // }


    // Thêm method này vào class WorkHistoryService
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

            history = this.transformWorkHistoryData(response.data?.items || []);
            console.log(`✅ WORK HISTORY: Transformed ${history.length} total records.`);

            CacheService.set(cacheKey, history, 300000);
            return history;
        } catch (error) {
            console.error('❌ Error getting all work history:', error);
            return [];
        }
    }



    async deleteWorkHistory(id) {
        try {
            await LarkClient.delete(`/bitable/v1/apps/${this.baseId}/tables/${this.tableId}/records/${id}`);
            return true;
        } catch (error) {
            await this.handleError(error, 'deleteWorkHistory');
            throw error;
        }
    }


    transformWorkHistoryData(larkData) {
        return larkData.map(record => ({
            id: record.record_id,
            employeeId: record.fields['Mã nhân viên'] || '',
            requestNo: record.fields['Request No.'] || ''
        }));
    }


    transformWorkHistoryForLark(workHistoryData) {
        return {
            'Mã nhân viên': workHistoryData.employeeId,
            'Request No.': workHistoryData.requestNo
        };
    }
}


export default WorkHistoryService;
