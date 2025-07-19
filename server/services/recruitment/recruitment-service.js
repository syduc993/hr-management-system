// Recruitment service
import BaseService from '../core/base-service.js';
import LarkClient from '../core/lark-client.js';
import CacheService from '../core/cache-service.js';

class RecruitmentService extends BaseService {
    constructor() {
        super();
        this.baseId = process.env.LARK_BASE_ID;
        this.tableId = process.env.LARK_RECRUITMENT_TABLE_ID;
    }

    async initializeService() {
        console.log('Initializing Recruitment Service...');
    }

    async getRecruitmentRequests(filters = {}) {
        const cacheKey = `recruitment_requests_${JSON.stringify(filters)}`;
        let requests = CacheService.get(cacheKey);
        
        if (!requests) {
            try {
                let filterString = '';
                if (filters.status) {
                    filterString += `AND(CurrentValue.[Status] = "${filters.status}")`;
                }
                if (filters.department) {
                    filterString += `AND(CurrentValue.[Department] = "${filters.department}")`;
                }
                
                const response = await LarkClient.get(`/bitable/v1/apps/${this.baseId}/tables/${this.tableId}/records`, {
                    filter: filterString
                });

                requests = this.transformRecruitmentData(response.data?.items || []);
                CacheService.set(cacheKey, requests, 300000); // 5 minutes
            } catch (error) {
                console.error('Error fetching recruitment requests:', error);
                requests = this.getMockRecruitmentRequests();
            }
        }
        
        return requests;
    }

    async addRecruitmentRequest(requestData) {
        try {
            const transformedData = this.transformRecruitmentForLark(requestData);
            
            const response = await LarkClient.post(`/bitable/v1/apps/${this.baseId}/tables/${this.tableId}/records`, {
                fields: transformedData
            });

            // Clear cache
            CacheService.delete(`recruitment_requests_${JSON.stringify({})}`);
            
            return this.transformRecruitmentData([response.data])[0];
        } catch (error) {
            await this.handleError(error, 'addRecruitmentRequest');
            throw error;
        }
    }

    async updateRecruitmentRequest(id, requestData) {
        try {
            const transformedData = this.transformRecruitmentForLark(requestData);
            
            const response = await LarkClient.put(`/bitable/v1/apps/${this.baseId}/tables/${this.tableId}/records/${id}`, {
                fields: transformedData
            });

            // Clear cache
            CacheService.clear();
            
            return this.transformRecruitmentData([response.data])[0];
        } catch (error) {
            await this.handleError(error, 'updateRecruitmentRequest');
            throw error;
        }
    }


    transformRecruitmentData(larkData) {
        console.log('🔄 RECRUITMENT: Starting transform with data:', larkData);
        
        return larkData.map(record => {
            console.log('🔍 RECRUITMENT: Processing record:', record.fields);
            
            const result = {
                id: record.record_id,
                // ✅ SỬA: Extract Request No từ object structure
                requestNo: this.extractRequestNo(record.fields['Request No.']),
                // ✅ SỬA: Extract Requester từ array structure  
                requester: this.extractRequesterName(record.fields['Requester']),
                status: record.fields['Status'] || '',
                department: record.fields['Details_Phòng ban'] || record.fields['Department'] || '',
                quantity: record.fields['Details_Số lượng cần tuyển'] || record.fields['Quantity'] || '',
                gender: record.fields['Details_Giới tính'] || record.fields['Gender'] || '',
                fromDate: record.fields['Details_Từ ngày'] || record.fields['From Date'] || '',
                toDate: record.fields['Details_Đến ngày'] || record.fields['To Date'] || '',
                position: record.fields['Details_Vị trí'] || record.fields['Position'] || '',
                approvalStatus: record.fields['Status'] || 'pending'
            };
            
            console.log('🔍 RECRUITMENT: Transformed result:', result);
            return result;
        });
    }

    // ✅ THÊM: Method để extract Request No từ object
    extractRequestNo(requestNoData) {
        if (!requestNoData) return '';
        
        // Nếu là object với structure { "link": "...", "text": "202507140017" }
        if (typeof requestNoData === 'object' && requestNoData.text) {
            return requestNoData.text;
        }
        
        // Nếu là string trực tiếp
        if (typeof requestNoData === 'string') {
            return requestNoData;
        }
        
        // Fallback
        return requestNoData.toString();
    }

    // ✅ THÊM: Method để extract Requester từ array
    extractRequesterName(requesterData) {
        if (!requesterData) return '';
        
        // Nếu là array [{ "name": "236LH.Nguyễn Huy Thành", ... }]
        if (Array.isArray(requesterData)) {
            return requesterData.map(user => 
                user.name || user.en_name || user.id || 'Unknown'
            ).join(', ');
        }
        
        // Nếu là object { "name": "236LH.Nguyễn Huy Thành", ... }
        if (typeof requesterData === 'object') {
            return requesterData.name || requesterData.en_name || requesterData.id || 'Unknown';
        }
        
        // Nếu là string trực tiếp
        return requesterData.toString();
    }


    transformRecruitmentForLark(requestData) {
        return {
            'Request No': requestData.requestNo,
            'Requester': requestData.requester,
            'Status': requestData.status,
            'Department': requestData.department,
            'Quantity': requestData.quantity,
            'Gender': requestData.gender,
            'From Date': requestData.fromDate,
            'To Date': requestData.toDate,
            'Approval Status': requestData.approvalStatus || 'pending',
            'Created At': requestData.createdAt || new Date().toISOString()
        };
    }

    getMockRecruitmentRequests() {
        return [
            {
                id: '20250620014',
                requestNo: '20250620014',
                requester: 'Rikkei Test',
                status: 'Đang tuyển dụng',
                department: '116 Cầu Giấy',
                quantity: '2',
                gender: 'Nam/Nữ',
                fromDate: '2025-06-20',
                toDate: '2025-07-20',
                approvalStatus: 'approved',
                createdAt: '2025-06-20T00:00:00.000Z'
            },
            {
                id: '20250620017',
                requestNo: '20250620017',
                requester: 'Rikkei Test',
                status: 'Đang tuyển dụng',
                department: 'Trâm Trỗi',
                quantity: '1',
                gender: 'Nữ',
                fromDate: '2025-06-20',
                toDate: '2025-07-20',
                approvalStatus: 'approved',
                createdAt: '2025-06-20T00:00:00.000Z'
            }
        ];
    }
}

export default RecruitmentService;
