import larkServiceManager from '../services/lark-service-manager.js';
import { formatResponse } from '../services/utils/response-formatter.js';
import CacheService from '../services/core/cache-service.js';


export const getRecruitmentRequests = async (req, res) => {
    try {
        const filters = req.query;
        const recruitmentService = larkServiceManager.getService('recruitment');
        const requests = await recruitmentService.getRecruitmentRequests(filters);

        res.json(formatResponse(true, 'Lấy danh sách đề xuất thành công', requests));
    } catch (error) {
        console.error('❌ Controller: getRecruitmentRequests failed:', error);
        res.status(500).json(formatResponse(
            false, 
            `Lỗi khi lấy danh sách đề xuất: ${error.message}`, 
            null, 
            'RECRUITMENT_LOAD_FAILED'
        ));
    }
};

export const getRecruitmentHoursSummary = async (req, res) => {
    try {
        console.log('📊 Controller: Getting recruitment hours summary...');
        
        // ✅ SỬA: Luôn clear cache để đảm bảo realtime data
        console.log('🧹 Clearing cache for realtime data...');
        CacheService.delete('hours_summary_table_data');
        CacheService.delete('work_history_all');
        CacheService.delete('recruitment_requests_{}'); // Clear recruitment cache nếu có
        
        const recruitmentService = larkServiceManager.getService('recruitment');
        const hoursSummary = await recruitmentService.getRecruitmentHoursSummary();

        // ✅ THÊM: Log để debug
        console.log(`✅ Controller: Retrieved ${hoursSummary.length} recruitment hour summaries`);

        res.json(formatResponse(true, 'Lấy tổng hợp giờ công theo tuyển dụng thành công', {
            summary: hoursSummary,
            totalRequests: hoursSummary.length,
            totalEmployees: hoursSummary.reduce((sum, req) => sum + req.totalEmployees, 0),
            totalHours: hoursSummary.reduce((sum, req) => sum + req.totalHoursNumeric, 0),
            timestamp: new Date().toISOString() // ✅ THÊM: Timestamp để track khi nào data được load
        }));
    } catch (error) {
        console.error('❌ Controller: getRecruitmentHoursSummary failed:', error);
        res.status(500).json(formatResponse(
            false, 
            `Lỗi khi lấy tổng hợp giờ công: ${error.message}`, 
            null, 
            'RECRUITMENT_HOURS_LOAD_FAILED'
        ));
    }
};



export const getDetailedHoursForRequest = async (req, res) => {
    try {
        const { requestNo } = req.params;
        
        console.log(`📊 Getting detailed hours for request: ${requestNo}`);
        
        const recruitmentService = larkServiceManager.getService('recruitment');
        
        // ✅ THÊM: Lấy cả thông tin lương
        const detailedRecords = await recruitmentService.getDetailedHoursForRequest(requestNo);
        
        // ✅ THÊM: Lấy thông tin lương từ salary map
        const mapsResult = await recruitmentService.getEmployeeHoursFromSummaryTable();
        const employeeSalaryMap = mapsResult.salaryMap;
        const employeeHourlyRateMap = mapsResult.hourlyRateMap;
        
        // ✅ THÊM: Enriched data với thông tin lương
        const enrichedRecords = detailedRecords.map(record => ({
            ...record,
            hourlyRate: employeeHourlyRateMap.get(record.employeeId) || 0,
            totalSalary: (record.totalHours || 0) * (employeeHourlyRateMap.get(record.employeeId) || 0)
        }));
        
        res.json(formatResponse(true, 'Lấy chi tiết giờ công thành công', {
            requestNo,
            records: enrichedRecords, // ✅ SỬA: Trả về enriched data
            totalRecords: enrichedRecords.length
        }));
        
    } catch (error) {
        console.error('❌ Controller: getDetailedHoursForRequest failed:', error);
        res.status(500).json(formatResponse(
            false, 
            `Lỗi khi lấy chi tiết giờ công: ${error.message}`, 
            null, 
            'DETAILED_HOURS_LOAD_FAILED'
        ));
    }
};

