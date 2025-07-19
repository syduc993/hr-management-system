// server/controllers/recruitmentController.js
import larkServiceManager from '../services/lark-service-manager.js';
import { formatResponse } from '../services/utils/response-formatter.js';

export const getRecruitmentRequests = async (req, res) => {
    try {
        const filters = req.query;
        const requests = await larkServiceManager.getRecruitmentRequests(filters);
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
