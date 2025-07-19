// Work history service
import BaseService from '../core/base-service.js';
import LarkClient from '../core/lark-client.js';


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
                filter: `AND(CurrentValue.[Employee ID] = "${employeeId}")`
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

    async addWorkHistory(workHistoryData) {
        try {
            const transformedData = this.transformWorkHistoryForLark(workHistoryData);
            
            console.log('📤 WORK HISTORY SERVICE: Sending data to Lark:', transformedData);
            console.log('🔍 WORK HISTORY SERVICE: Base ID:', this.baseId);
            console.log('🔍 WORK HISTORY SERVICE: Table ID:', this.tableId);
            console.log('🔍 WORK HISTORY SERVICE: URL will be:', `/bitable/v1/apps/${this.baseId}/tables/${this.tableId}/records`);
            
            const response = await LarkClient.post(`/bitable/v1/apps/${this.baseId}/tables/${this.tableId}/records`, {
                fields: transformedData
            });

            console.log('📥 WORK HISTORY SERVICE: Raw Lark response:', response);
            console.log('📥 WORK HISTORY SERVICE: Response status:', response?.status);
            console.log('📥 WORK HISTORY SERVICE: Response data:', response?.data);

            return {
                success: true,
                employeeId: workHistoryData.employeeId,
                requestNo: workHistoryData.requestNo,
                larkResponse: response  // ✅ THÊM: Debug response
            };
            
        } catch (error) {
            console.error('❌ WORK HISTORY SERVICE: Full error:', error);
            console.error('❌ WORK HISTORY SERVICE: Error message:', error.message);
            console.error('❌ WORK HISTORY SERVICE: Error stack:', error.stack);
            await this.handleError(error, 'addWorkHistory');
            throw error;
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
