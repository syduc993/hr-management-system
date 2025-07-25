//hr-management-system\server\services\recruitment\recruitment-service.js

// Recruitment service
import BaseService from '../core/base-service.js';
import LarkClient from '../core/lark-client.js';
import CacheService from '../core/cache-service.js';
import larkServiceManager from '../lark-service-manager.js';
import { larkConfig } from '../../config/lark-config.js';

// **HÀM TIỆN ÍCH ĐỊNH DẠNG NGÀY**
const formatDate = (dateValue) => {
    if (!dateValue) return null;
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return null;

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
};

class RecruitmentService extends BaseService {
    constructor() {
        super();
        this.baseId = process.env.LARK_BASE_ID;
        this.tableId = process.env.LARK_RECRUITMENT_TABLE_ID;
        this.hoursSummaryTableId = process.env.LARK_HOURS_SUMMARY_TABLE_ID;
    }

    async initializeService() {
        console.log('Initializing Recruitment Service...');
    }

    async getRecruitmentRequests(filters = {}) {
        const cacheKey = `recruitment_requests_${JSON.stringify(filters)}`;
        let requests = CacheService.get(cacheKey);

        if (requests) {
            console.log(`✅ RECRUITMENT: Loaded ${requests.length} requests from cache.`);
            return requests;
        }

        try {
            console.log('📡 RECRUITMENT: Fetching all recruitment requests from Lark...');

            const params = {};
            const filterClauses = [];

            if (filters.status) {
                filterClauses.push(`CurrentValue.[Status] = "${filters.status}"`);
            }
            if (filters.department) {
                filterClauses.push(`CurrentValue.[Details_Phòng ban] = "${filters.department}"`);
            }

            if (filterClauses.length > 0) {
                params.filter = `AND(${filterClauses.join(', ')})`;
            }

            const response = await LarkClient.getAllRecords(
                `/bitable/v1/apps/${this.baseId}/tables/${this.tableId}/records`,
                params
            );

            requests = this.transformRecruitmentData(response.data?.items || []);
            console.log(`✅ RECRUITMENT: Transformed ${requests.length} total records from Lark.`);

            CacheService.set(cacheKey, requests, 300000);
            console.log(`✅ RECRUITMENT: Cached ${requests.length} records.`);

        } catch (error) {
            console.error('❌ Error fetching recruitment requests:', error);
            requests = [];
            throw error;
        }

        return requests;
    }

    async addRecruitmentRequest(requestData) {
        // Giữ nguyên logic
    }

    async updateRecruitmentRequest(id, requestData) {
        // Giữ nguyên logic
    }

    async getRequestByNo(requestNo) {
        // Giữ nguyên logic
    }

    // ✅ THAY ĐỔI LOGIC CỐT LÕI TẠI ĐÂY
    async getRecruitmentHoursSummary() {
        try {
            console.log('📊 Getting recruitment hours summary with NEW logic...');

            // 1. Lấy tất cả recruitment requests
            const recruitmentRequests = await this.getRecruitmentRequests();
            console.log('📋 RECRUITMENT REQUESTS:', recruitmentRequests.length, 'requests found');

            // 2. Lấy services cần thiết
            const employeeService = larkServiceManager.getService('employee');

            // 3. Lấy dữ liệu cần thiết để mapping
            const allWorkHistory = await this.getAllWorkHistory();
            const allEmployees = await employeeService.getAllEmployees();
            console.log('📚 WORK HISTORY:', allWorkHistory.length, 'records');
            console.log('👥 EMPLOYEES:', allEmployees.length, 'employees');

            // ✅ MỚI: Lấy dữ liệu từ bảng tổng hợp giờ công
            const employeeHoursMap = await this.getEmployeeHoursFromSummaryTable();
            console.log('⏰ EMPLOYEE HOURS MAP:', employeeHoursMap.size, 'entries');
            console.log('🗺️ HOURS MAP CONTENT:', Array.from(employeeHoursMap.entries()));

            // 4. Tạo map để lookup nhanh
            const employeeMap = new Map(allEmployees.map(emp => [emp.employeeId, emp]));
            console.log('👤 EMPLOYEE MAP:', employeeMap.size, 'entries');

            // 5. Xử lý từng recruitment request
            const hoursSummary = [];
            let totalCalculatedHours = 0; // ✅ THÊM: Tracking tổng giờ

            for (const request of recruitmentRequests) {
                console.log(`\n🔄 Processing request: ${request.requestNo}`);
                
                const requestSummary = await this.calculateRequestHours(
                    request,
                    allWorkHistory,
                    employeeMap,
                    employeeHoursMap
                );

                console.log(`📊 Request ${request.requestNo} summary:`, {
                    totalEmployees: requestSummary.totalEmployees,
                    totalHoursNumeric: requestSummary.totalHoursNumeric,
                    employees: requestSummary.employees.map(e => ({ 
                        id: e.employeeId, 
                        hours: e.totalHoursNumeric 
                    }))
                });

                totalCalculatedHours += requestSummary.totalHoursNumeric; // ✅ THÊM

                if (requestSummary.employees.length > 0) {
                    hoursSummary.push(requestSummary);
                }
            }

            console.log(`\n📊 FINAL CALCULATION RESULT:`);
            console.log(`- Processed requests: ${hoursSummary.length}`);
            console.log(`- Total calculated hours: ${totalCalculatedHours}`);
            console.log(`- Hours summary:`, hoursSummary);

            return hoursSummary;

        } catch (error) {
            console.error('❌ Error getting recruitment hours summary:', error);
            throw error;
        }
    }

    // ✅ HÀM MỚI: Lấy dữ liệu từ bảng tổng hợp giờ công
    async getEmployeeHoursFromSummaryTable() {
        console.log('📡 Fetching data from hours summary table...');
        const cacheKey = 'hours_summary_table_data';
        let cachedData = CacheService.get(cacheKey);
        if (cachedData) {
            console.log('✅ Loaded hours summary from cache.');
            console.log('🗂️ CACHED HOURS MAP:', Array.from(cachedData.entries()));
            return cachedData;
        }

        try {
            const response = await LarkClient.getAllRecords(
                `/bitable/v1/apps/${this.baseId}/tables/${this.hoursSummaryTableId}/records`
            );
            const records = response.data?.items || [];
            console.log('📄 RAW HOURS SUMMARY RECORDS:', records.length, 'records');

            const employeeHoursMap = new Map();
            records.forEach((record, index) => {
                const fields = record.fields;
                console.log(`\n📝 Record #${index + 1} FULL FIELDS:`, fields);
                
                const employeeIdField = fields['Mã nhân viên'];
                console.log(`Record #${index + 1} - Mã nhân viên:`, employeeIdField, '| Type:', typeof employeeIdField);
                
                let employeeId = '';
                if (Array.isArray(employeeIdField) && employeeIdField.length > 0) {
                    employeeId = employeeIdField[0]?.text;
                } else if (typeof employeeIdField === 'string') {
                    employeeId = employeeIdField;
                }

                const totalHours = fields['Tổng số giờ làm'] || 0;
                console.log(`📊 Record #${index + 1} - Employee: "${employeeId}", Hours: ${totalHours} (type: ${typeof totalHours})`);

                if (employeeId) {
                    // ✅ CỘNG DỒN THAY VÌ GHI ĐÈ
                    const currentHours = employeeHoursMap.get(employeeId) || 0;
                    const newTotalHours = currentHours + totalHours;
                    employeeHoursMap.set(employeeId, newTotalHours);
                    
                    console.log(`✅ Updated map: "${employeeId}" -> ${currentHours} + ${totalHours} = ${newTotalHours}`);
                } else {
                    console.log(`⚠️ Skipped record #${index + 1} - No valid employeeId`);
                }
            });

            console.log(`\n🗺️ FINAL EMPLOYEE HOURS MAP:`, Array.from(employeeHoursMap.entries()));
            
            CacheService.set(cacheKey, employeeHoursMap, 300000);
            console.log(`✅ Created employee hours map with ${employeeHoursMap.size} entries.`);
            return employeeHoursMap;
        } catch (error) {
            console.error('❌ Error fetching from hours summary table:', error);
            return new Map();
        }
    }


    // ✅ HÀM ĐƯỢC CẬP NHẬT: Thay đổi logic tính toán
    async calculateRequestHours(request, allWorkHistory, employeeMap, employeeHoursMap) {
        console.log(`\n🔍 CALCULATING HOURS FOR REQUEST: ${request.requestNo}`);
        
        // 1. Tìm các nhân viên thuộc request này thông qua bảng Work History
        const requestEmployees = allWorkHistory.filter(wh => wh.requestNo === request.requestNo);
        console.log(`👥 Found ${requestEmployees.length} employees for request ${request.requestNo}:`, 
            requestEmployees.map(re => re.employeeId)); // ✅ THÊM

        // 2. Lấy giờ công cho từng nhân viên từ map đã có
        const employeeDetails = [];

        for (const workHistory of requestEmployees) {
            console.log(`\n🔍 Processing employee: ${workHistory.employeeId}`); // ✅ THÊM
            
            const employee = employeeMap.get(workHistory.employeeId);
            if (!employee) {
                console.log(`❌ Employee not found in map: ${workHistory.employeeId}`); // ✅ THÊM
                continue;
            }
            console.log(`✅ Employee found: ${employee.fullName}`); // ✅ THÊM

            // ✅ THAY ĐỔI: Lấy giờ công từ map thay vì tính toán lại.
            // Logic lọc theo ngày chấm công trong khoảng thời gian đề xuất không còn cần thiết
            // vì ta đang lấy tổng giờ công đã được tính sẵn từ bảng tổng hợp.
            const totalHoursNumeric = employeeHoursMap.get(workHistory.employeeId) || 0;
            console.log(`⏰ Hours for ${workHistory.employeeId}: ${totalHoursNumeric}`); // ✅ THÊM
            console.log(`🗺️ Available keys in hours map:`, Array.from(employeeHoursMap.keys())); // ✅ THÊM

            employeeDetails.push({
                employeeId: workHistory.employeeId,
                fullName: employee.fullName,
                totalHours: this.formatHoursDisplay(totalHoursNumeric),
                totalHoursNumeric: totalHoursNumeric,
            });

            console.log(`✅ Added employee details:`, {
                employeeId: workHistory.employeeId,
                fullName: employee.fullName,
                totalHoursNumeric: totalHoursNumeric
            }); // ✅ THÊM
        }

        // 3. Tính tổng cho cả request
        const totalRequestHours = employeeDetails.reduce((sum, emp) => sum + emp.totalHoursNumeric, 0);
        console.log(`📊 TOTAL REQUEST HOURS: ${totalRequestHours} (from ${employeeDetails.length} employees)`); // ✅ THÊM

        const result = {
            requestNo: request.requestNo,
            department: request.department,
            status: request.status,
            fromDate: request.fromDateFormatted,
            toDate: request.toDateFormatted,
            totalEmployees: employeeDetails.length,
            totalHours: this.formatHoursDisplay(totalRequestHours),
            totalHoursNumeric: totalRequestHours,
            employees: employeeDetails,
            // ❌ BỎ: Không còn trả về cột Vị trí
        };

        console.log(`📤 RETURNING REQUEST SUMMARY:`, result); // ✅ THÊM
        return result;
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
                `/bitable/v1/apps/${process.env.LARK_BASE_ID}/tables/${process.env.LARK_WORK_HISTORY_TABLE_ID}/records`
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

    transformWorkHistoryData(larkData) {
        return larkData.map(record => ({
            id: record.record_id,
            employeeId: record.fields['Mã nhân viên'] || '',
            requestNo: record.fields['Request No.'] || ''
        }));
    }

    transformRecruitmentData(larkData) {
        return larkData.map(record => ({
            id: record.record_id,
            requestNo: this.extractRequestNo(record.fields['Request No.']),
            requester: this.extractRequesterName(record.fields['Requester']),
            status: record.fields['Status'] || '',
            department: record.fields['Details_Phòng ban'] || record.fields['Department'] || '',
            quantity: record.fields['Details_Số lượng cần tuyển'] || record.fields['Quantity'] || '',
            gender: record.fields['Details_Giới tính'] || record.fields['Gender'] || '',
            fromDate: record.fields['Details_Từ ngày'] || record.fields['From Date'] || '',
            toDate: record.fields['Details_Đến ngày'] || record.fields['To Date'] || '',
            fromDateFormatted: formatDate(record.fields['Details_Từ ngày'] || record.fields['From Date'] || ''),
            toDateFormatted: formatDate(record.fields['Details_Đến ngày'] || record.fields['To Date'] || ''),
            position: record.fields['Details_Vị trí'] || record.fields['Position'] || '',
            approvalStatus: record.fields['Status'] || ''
        }));
    }

    extractRequestNo(requestNoData) {
        if (!requestNoData) return '';
        if (typeof requestNoData === 'object' && requestNoData.text) {
            return requestNoData.text;
        }
        if (typeof requestNoData === 'string') {
            return requestNoData;
        }
        return requestNoData.toString();
    }

    extractRequesterName(requesterData) {
        if (!requesterData) return '';
        if (Array.isArray(requesterData)) {
            return requesterData.map(user => user.name || user.en_name || user.id || 'Unknown').join(', ');
        }
        if (typeof requesterData === 'object') {
            return requesterData.name || requesterData.en_name || requesterData.id || 'Unknown';
        }
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

    formatHoursDisplay(totalHours) {
        if (!totalHours || totalHours === 0) return '0 giờ';

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

export default RecruitmentService;
