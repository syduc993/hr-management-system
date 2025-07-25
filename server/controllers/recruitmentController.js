import larkServiceManager from '../services/lark-service-manager.js';
import { formatResponse } from '../services/utils/response-formatter.js';

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
        
        const recruitmentService = larkServiceManager.getService('recruitment');
        const hoursSummary = await recruitmentService.getRecruitmentHoursSummary();

        res.json(formatResponse(true, 'Lấy tổng hợp giờ công theo tuyển dụng thành công', {
            summary: hoursSummary,
            totalRequests: hoursSummary.length,
            totalEmployees: hoursSummary.reduce((sum, req) => sum + req.totalEmployees, 0),
            totalHours: hoursSummary.reduce((sum, req) => sum + req.totalHoursNumeric, 0)
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
