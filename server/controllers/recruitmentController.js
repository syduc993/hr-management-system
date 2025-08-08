// import larkServiceManager from '../services/lark-service-manager.js';
// import { formatResponse } from '../services/utils/response-formatter.js';
// import CacheService from '../services/core/cache-service.js';
// import LarkClient from '../services/core/lark-client.js';




// // =================================================================
// // HÀM PHỤ TRỢ (HELPER FUNCTIONS)
// // =================================================================


// export const getRecruitmentRequests = async (req, res) => {
//     try {
//         const filters = req.query;
//         const recruitmentService = larkServiceManager.getService('recruitment');
//         const requests = await recruitmentService.getRecruitmentRequests(filters);

//         res.json(formatResponse(true, 'Lấy danh sách đề xuất thành công', requests));
//     } catch (error) {
//         console.error('❌ Controller: getRecruitmentRequests failed:', error);
//         res.status(500).json(formatResponse(
//             false, 
//             `Lỗi khi lấy danh sách đề xuất: ${error.message}`, 
//             null, 
//             'RECRUITMENT_LOAD_FAILED'
//         ));
//     }
// };

// export const getRecruitmentHoursSummary = async (req, res) => {
//     try {
        
//         // ✅ SỬA: Luôn clear cache để đảm bảo realtime data

//         CacheService.delete('hours_summary_table_data');
//         CacheService.delete('work_history_all');
//         CacheService.delete('recruitment_requests_{}'); // Clear recruitment cache nếu có
        
//         const recruitmentService = larkServiceManager.getService('recruitment');
//         const hoursSummary = await recruitmentService.getRecruitmentHoursSummary();


//         res.json(formatResponse(true, 'Lấy tổng hợp giờ công theo tuyển dụng thành công', {
//             summary: hoursSummary,
//             totalRequests: hoursSummary.length,
//             totalEmployees: hoursSummary.reduce((sum, req) => sum + req.totalEmployees, 0),
//             totalHours: hoursSummary.reduce((sum, req) => sum + req.totalHoursNumeric, 0),
//             timestamp: new Date().toISOString() // ✅ THÊM: Timestamp để track khi nào data được load
//         }));
//     } catch (error) {
//         console.error('❌ Controller: getRecruitmentHoursSummary failed:', error);
//         res.status(500).json(formatResponse(
//             false, 
//             `Lỗi khi lấy tổng hợp giờ công: ${error.message}`, 
//             null, 
//             'RECRUITMENT_HOURS_LOAD_FAILED'
//         ));
//     }
// };



// export const getDetailedHoursForRequest = async (req, res) => {
//     try {
//         const { requestNo } = req.params;
        
//         const recruitmentService = larkServiceManager.getService('recruitment');
        
//         // ✅ THÊM: Lấy cả thông tin lương
//         const detailedRecords = await recruitmentService.getDetailedHoursForRequest(requestNo);
        
//         // ✅ THÊM: Lấy thông tin lương từ salary map
//         const mapsResult = await recruitmentService.getEmployeeHoursFromSummaryTable();
//         const employeeSalaryMap = mapsResult.salaryMap;
//         const employeeHourlyRateMap = mapsResult.hourlyRateMap;
        
//         // ✅ THÊM: Enriched data với thông tin lương
//         const enrichedRecords = detailedRecords.map(record => ({
//             ...record,
//             hourlyRate: employeeHourlyRateMap.get(record.employeeId) || 0,
//             totalSalary: (record.totalHours || 0) * (employeeHourlyRateMap.get(record.employeeId) || 0)
//         }));
        
//         res.json(formatResponse(true, 'Lấy chi tiết giờ công thành công', {
//             requestNo,
//             records: enrichedRecords, // ✅ SỬA: Trả về enriched data
//             totalRecords: enrichedRecords.length
//         }));
        
//     } catch (error) {
//         console.error('❌ Controller: getDetailedHoursForRequest failed:', error);
//         res.status(500).json(formatResponse(
//             false, 
//             `Lỗi khi lấy chi tiết giờ công: ${error.message}`, 
//             null, 
//             'DETAILED_HOURS_LOAD_FAILED'
//         ));
//     }
// };


// // File: server/controllers/recruitmentController.js

// export const getDailyComparisonForRequest = async (req, res) => {
//     try {
//         const { requestNo } = req.params;
//         const recruitmentService = larkServiceManager.getService('recruitment');

//         // BƯỚC 1: Lấy tất cả các dòng đề xuất có cùng requestNo
//         const allRequests = await recruitmentService.getRecruitmentRequests();
//         const relevantRequests = allRequests.filter(r => r.requestNo === requestNo);

//         if (relevantRequests.length === 0) {
//             return res.status(404).json(formatResponse(false, 'Không tìm thấy đề xuất tuyển dụng.'));
//         }

//         // BƯỚC 2: Xác định khoảng thời gian tổng thể (từ ngày nhỏ nhất đến ngày lớn nhất)
//         const fromDates = relevantRequests.map(r => new Date(r.fromDate)).filter(d => !isNaN(d));
//         const toDates = relevantRequests.map(r => new Date(r.toDate)).filter(d => !isNaN(d));
        
//         if (fromDates.length === 0 || toDates.length === 0) {
//             return res.status(400).json(formatResponse(false, 'Đề xuất tuyển dụng thiếu thông tin ngày bắt đầu hoặc kết thúc.'));
//         }

//         const overallFromDate = new Date(Math.min(...fromDates));
//         const overallToDate = new Date(Math.max(...toDates));
        
//         const requestDetails = {
//             ...relevantRequests[0], // Lấy thông tin chung từ dòng đầu tiên
//             fromDate: overallFromDate.toISOString().split('T')[0],
//             toDate: overallToDate.toISOString().split('T')[0]
//         };

//         // BƯỚC 3: Lấy số nhân viên thực tế đã chấm công (paid) theo ngày
//         const actualByDate = await getActualPaidEmployeesByDate(
//             requestNo,
//             requestDetails.fromDate,
//             requestDetails.toDate
//         );
        
//         // BƯỚC 4: Lặp qua từng ngày, tính toán kế hoạch và so sánh
//         const dailyComparison = [];
//         for (let date = new Date(overallFromDate); date <= overallToDate; date.setDate(date.getDate() + 1)) {
            
//             // ✅ SỬA LỖI MÚI GIỜ: Tạo chuỗi ngày YYYY-MM-DD từ múi giờ của server
//             const year = date.getFullYear();
//             const month = String(date.getMonth() + 1).padStart(2, '0');
//             const day = String(date.getDate()).padStart(2, '0');
//             const dateStr = `${year}-${month}-${day}`;

//             // ✅ LOGIC MỚI: Tính số lượng phê duyệt lớn nhất cho ngày hiện tại
//             const currentDate = new Date(dateStr + "T00:00:00"); // Dùng T00:00:00 để so sánh chính xác
            
//             // Tìm tất cả các dòng đề xuất có hiệu lực trong `currentDate`
//             const activeRequestsForDay = relevantRequests.filter(r => {
//                 const rFrom = new Date(r.fromDate);
//                 const rTo = new Date(r.toDate);
//                 return currentDate >= rFrom && currentDate <= rTo;
//             });
            
//             // Lấy số lượng (quantity) lớn nhất từ các dòng có hiệu lực
//             const planned = Math.max(0, ...activeRequestsForDay.map(r => parseInt(r.quantity) || 0));
//             const actual = actualByDate.get(dateStr) || 0;
            
//             dailyComparison.push({
//                 date: dateStr,
//                 dayName: date.toLocaleDateString('vi-VN', { weekday: 'long' }),
//                 approvedCount: planned,
//                 actualCount: actual,
//                 variance: actual - planned,
//                 utilizationRate: planned > 0 ? ((actual / planned) * 100).toFixed(1) : '0'
//             });
//         }
        
//         res.json(formatResponse(true, 'So sánh thành công', {
//             requestNo,
//             requestDetails,
//             dailyComparison
//         }));
        
//     } catch (error) {
//         console.error('❌ Error in daily comparison:', error);
//         res.status(500).json(formatResponse(false, error.message));
//     }
// };



// async function getActualPaidEmployeesByDate(requestNo, fromDate, toDate) {
//     const hoursSummaryTableId = process.env.LARK_HOURS_SUMMARY_TABLE_ID;
//     const baseId = process.env.LARK_BASE_ID;

//     const extractFieldValue = (field) => {
//         if (!field) return '';
//         if (Array.isArray(field) && field.length > 0) {
//             return field[0]?.text || '';
//         }
//         if (typeof field === 'string') {
//             return field;
//         }
//         return String(field);
//     };

//     try {
//         const response = await LarkClient.getAllRecords(
//             `/bitable/v1/apps/${baseId}/tables/${hoursSummaryTableId}/records`
//         );
        
//         const actualByDate = new Map();
        
//         response.data?.items?.forEach(record => {
//             const fields = record.fields;
//             const workDate = fields['Ngày chấm công'];
//             const salary = fields['Lương'] || 0;

//             const employeeId = extractFieldValue(fields['Mã nhân viên']);
//             const requestNoFromRecord = extractFieldValue(fields['Request No.'] || fields['Mã đề xuất']);
            
//             if (salary > 0 && 
//                 workDate && 
//                 employeeId && 
//                 requestNoFromRecord === requestNo) { 
                
//                 // ✅ SỬA LỖI MÚI GIỜ: Tạo chuỗi ngày một cách an toàn
//                 const dateObj = new Date(workDate);
//                 const year = dateObj.getFullYear();
//                 const month = String(dateObj.getMonth() + 1).padStart(2, '0');
//                 const day = String(dateObj.getDate()).padStart(2, '0');
//                 const dateStr = `${year}-${month}-${day}`;

//                 const overallFrom = new Date(fromDate);
//                 const overallTo = new Date(toDate);

//                 if (dateObj >= overallFrom && dateObj <= overallTo) {
//                     if (!actualByDate.has(dateStr)) {
//                         actualByDate.set(dateStr, new Set());
//                     }
//                     actualByDate.get(dateStr).add(employeeId);
//                 }
//             }
//         });
        
//         const result = new Map();
//         for (const [date, employeeSet] of actualByDate.entries()) {
//             result.set(date, employeeSet.size);
//         }
        
//         console.log(`[getActualPaidEmployeesByDate] Final counts for request ${requestNo}:`, result);
//         return result;
        
//     } catch (error) {
//         console.error('❌ Error in getActualPaidEmployeesByDate:', error);
//         return new Map();
//     }
// }


/**
 * @file server/controllers/recruitmentController.js
 * @description Controller để xử lý các yêu cầu API liên quan đến tuyển dụng,
 * bao gồm lấy danh sách đề xuất, tổng hợp giờ công, chi tiết giờ công,
 * và so sánh kế hoạch với thực tế.
 */

import larkServiceManager from '../services/lark-service-manager.js';
import { formatResponse } from '../services/utils/response-formatter.js';
import CacheService from '../services/core/cache-service.js';
import LarkClient from '../services/core/lark-client.js';

// =================================================================
// HÀM PHỤ TRỢ (HELPER FUNCTIONS)
// =================================================================

/**
 * Trích xuất giá trị text từ một trường dữ liệu của Lark Base.
 * Xử lý trường hợp giá trị là một mảng hoặc chuỗi.
 * @param {Array|string|any} field - Trường dữ liệu từ Lark.
 * @returns {string} Giá trị text của trường.
 */
const extractFieldValue = (field) => {
    if (!field) return '';
    if (Array.isArray(field) && field.length > 0) {
        // Thường là trường lookup hoặc formula trả về mảng
        return field[0]?.text || '';
    }
    if (typeof field === 'string') {
        return field;
    }
    return String(field);
};


/**
 * Lấy số lượng nhân viên thực tế đã được trả lương theo từng ngày cho một mã đề xuất cụ thể.
 * Hàm này đọc dữ liệu từ bảng "Tổng hợp giờ công" trên Lark.
 * @param {string} requestNo - Mã đề xuất tuyển dụng (Request No.).
 * @param {string} fromDate - Ngày bắt đầu (định dạng YYYY-MM-DD).
 * @param {string} toDate - Ngày kết thúc (định dạng YYYY-MM-DD).
 * @returns {Promise<Map<string, number>>} - Một Map với key là ngày (YYYY-MM-DD) và value là số lượng nhân viên duy nhất.
 */
async function getActualPaidEmployeesByDate(requestNo, fromDate, toDate) {
    const hoursSummaryTableId = process.env.LARK_HOURS_SUMMARY_TABLE_ID;
    const baseId = process.env.LARK_BASE_ID;

    try {
        // Lấy tất cả bản ghi từ bảng tổng hợp giờ công
        const response = await LarkClient.getAllRecords(
            `/bitable/v1/apps/${baseId}/tables/${hoursSummaryTableId}/records`
        );

        // Dùng Map để lưu trữ các mã nhân viên duy nhất cho mỗi ngày
        const actualByDate = new Map();

        response.data?.items?.forEach(record => {
            const fields = record.fields;
            const workDate = fields['Ngày chấm công'];
            const salary = fields['Lương'] || 0;
            const employeeId = extractFieldValue(fields['Mã nhân viên']);
            const requestNoFromRecord = extractFieldValue(fields['Request No.'] || fields['Mã đề xuất']);

            // Chỉ xử lý các bản ghi có lương > 0, có ngày chấm công, mã nhân viên
            // và thuộc đúng mã đề xuất đang xét
            if (salary > 0 && workDate && employeeId && requestNoFromRecord === requestNo) {
                // Sửa lỗi múi giờ: Chuyển đổi timestamp thành chuỗi ngày YYYY-MM-DD an toàn
                const dateObj = new Date(workDate);
                const year = dateObj.getFullYear();
                const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                const day = String(dateObj.getDate()).padStart(2, '0');
                const dateStr = `${year}-${month}-${day}`;

                const overallFrom = new Date(fromDate);
                const overallTo = new Date(toDate);

                // Kiểm tra xem ngày chấm công có nằm trong khoảng thời gian của đề xuất không
                if (dateObj >= overallFrom && dateObj <= overallTo) {
                    if (!actualByDate.has(dateStr)) {
                        actualByDate.set(dateStr, new Set());
                    }
                    // Thêm mã nhân viên vào Set để đảm bảo tính duy nhất
                    actualByDate.get(dateStr).add(employeeId);
                }
            }
        });

        // Chuyển đổi từ Map<string, Set> sang Map<string, number> để lấy số lượng
        const result = new Map();
        for (const [date, employeeSet] of actualByDate.entries()) {
            result.set(date, employeeSet.size);
        }

        console.log(`[getActualPaidEmployeesByDate] Final counts for request ${requestNo}:`, result);
        return result;

    } catch (error) {
        console.error('❌ Error in getActualPaidEmployeesByDate:', error);
        // Trả về một Map rỗng nếu có lỗi
        return new Map();
    }
}


// =================================================================
// HÀM ĐIỀU KHIỂN CHÍNH (MAIN CONTROLLERS)
// =================================================================

/**
 * [GET] Lấy danh sách các đề xuất tuyển dụng.
 * Hỗ trợ lọc dựa trên các tham số query từ URL.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 */
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


/**
 * [GET] Lấy dữ liệu tổng hợp giờ công cho tất cả các đề xuất.
 * Dữ liệu này được dùng để hiển thị trên dashboard chính.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 */
export const getRecruitmentHoursSummary = async (req, res) => {
    try {
        // Sửa: Luôn xóa cache trước khi lấy dữ liệu để đảm bảo tính thời gian thực.
        // Điều này quan trọng cho các báo cáo cần số liệu mới nhất.
        CacheService.delete('hours_summary_table_data');
        CacheService.delete('work_history_all');
        CacheService.delete('recruitment_requests_{}');

        const recruitmentService = larkServiceManager.getService('recruitment');
        const hoursSummary = await recruitmentService.getRecruitmentHoursSummary();

        // Định dạng lại phản hồi, thêm các thông tin tổng hợp hữu ích
        res.json(formatResponse(true, 'Lấy tổng hợp giờ công theo tuyển dụng thành công', {
            summary: hoursSummary,
            totalRequests: hoursSummary.length,
            totalEmployees: hoursSummary.reduce((sum, req) => sum + req.totalEmployees, 0),
            totalHours: hoursSummary.reduce((sum, req) => sum + req.totalHoursNumeric, 0),
            timestamp: new Date().toISOString() // Thêm: Dấu thời gian để biết dữ liệu được tải lúc nào
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


/**
 * [GET] Lấy chi tiết giờ công và lương cho một mã đề xuất cụ thể.
 * @param {object} req - Express request object. `req.params.requestNo` chứa mã đề xuất.
 * @param {object} res - Express response object.
 */
export const getDetailedHoursForRequest = async (req, res) => {
    try {
        const { requestNo } = req.params;
        const recruitmentService = larkServiceManager.getService('recruitment');

        // Lấy danh sách chi tiết các ca làm việc cho đề xuất
        const detailedRecords = await recruitmentService.getDetailedHoursForRequest(requestNo);

        // Thêm: Lấy thông tin lương/giờ của nhân viên từ bảng tổng hợp
        const mapsResult = await recruitmentService.getEmployeeHoursFromSummaryTable();
        const employeeHourlyRateMap = mapsResult.hourlyRateMap;

        // Thêm: Làm giàu dữ liệu, thêm thông tin lương vào từng bản ghi
        const enrichedRecords = detailedRecords.map(record => ({
            ...record,
            hourlyRate: employeeHourlyRateMap.get(record.employeeId) || 0,
            totalSalary: (record.totalHours || 0) * (employeeHourlyRateMap.get(record.employeeId) || 0)
        }));

        res.json(formatResponse(true, 'Lấy chi tiết giờ công thành công', {
            requestNo,
            records: enrichedRecords, // Sửa: Trả về dữ liệu đã được làm giàu
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


/**
 * [GET] Lấy dữ liệu so sánh hàng ngày giữa số lượng nhân viên theo kế hoạch và thực tế.
 * @param {object} req - Express request object. `req.params.requestNo` chứa mã đề xuất.
 * @param {object} res - Express response object.
 */
export const getDailyComparisonForRequest = async (req, res) => {
    try {
        const { requestNo } = req.params;
        const recruitmentService = larkServiceManager.getService('recruitment');

        // BƯỚC 1: Lấy tất cả các dòng đề xuất có cùng `requestNo`.
        // Một đề xuất có thể được chia thành nhiều dòng với các khoảng thời gian khác nhau.
        const allRequests = await recruitmentService.getRecruitmentRequests();
        const relevantRequests = allRequests.filter(r => r.requestNo === requestNo);

        if (relevantRequests.length === 0) {
            return res.status(404).json(formatResponse(false, 'Không tìm thấy đề xuất tuyển dụng.'));
        }

        // BƯỚC 2: Xác định khoảng thời gian tổng thể từ ngày bắt đầu sớm nhất đến ngày kết thúc muộn nhất.
        const fromDates = relevantRequests.map(r => new Date(r.fromDate)).filter(d => !isNaN(d));
        const toDates = relevantRequests.map(r => new Date(r.toDate)).filter(d => !isNaN(d));

        if (fromDates.length === 0 || toDates.length === 0) {
            return res.status(400).json(formatResponse(false, 'Đề xuất tuyển dụng thiếu thông tin ngày bắt đầu hoặc kết thúc.'));
        }

        const overallFromDate = new Date(Math.min(...fromDates));
        const overallToDate = new Date(Math.max(...toDates));

        // Tạo một object chứa thông tin chung của đề xuất
        const requestDetails = {
            ...relevantRequests[0], // Lấy thông tin chung từ dòng đầu tiên
            fromDate: overallFromDate.toISOString().split('T')[0],
            toDate: overallToDate.toISOString().split('T')[0]
        };

        // BƯỚC 3: Lấy số nhân viên thực tế đã được trả lương theo ngày bằng hàm phụ trợ.
        const actualByDate = await getActualPaidEmployeesByDate(
            requestNo,
            requestDetails.fromDate,
            requestDetails.toDate
        );

        // BƯỚC 4: Lặp qua từng ngày trong khoảng thời gian tổng thể để tính toán và so sánh.
        const dailyComparison = [];
        for (let date = new Date(overallFromDate); date <= overallToDate; date.setDate(date.getDate() + 1)) {
            // Sửa lỗi múi giờ: Tạo chuỗi ngày YYYY-MM-DD từ múi giờ của server để đảm bảo tính nhất quán.
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const dateStr = `${year}-${month}-${day}`;

            // Logic mới: Tính số lượng phê duyệt (kế hoạch) lớn nhất cho ngày hiện tại.
            const currentDate = new Date(dateStr + "T00:00:00"); // Dùng T00:00:00 để so sánh chính xác

            // Tìm tất cả các dòng đề xuất có hiệu lực trong `currentDate`.
            const activeRequestsForDay = relevantRequests.filter(r => {
                const rFrom = new Date(r.fromDate);
                const rTo = new Date(r.toDate);
                return currentDate >= rFrom && currentDate <= rTo;
            });

            // Lấy số lượng (quantity) lớn nhất từ các dòng có hiệu lực làm kế hoạch.
            const planned = Math.max(0, ...activeRequestsForDay.map(r => parseInt(r.quantity) || 0));
            const actual = actualByDate.get(dateStr) || 0;

            dailyComparison.push({
                date: dateStr,
                dayName: date.toLocaleDateString('vi-VN', { weekday: 'long' }),
                approvedCount: planned,
                actualCount: actual,
                variance: actual - planned,
                utilizationRate: planned > 0 ? ((actual / planned) * 100).toFixed(1) : '0'
            });
        }

        res.json(formatResponse(true, 'So sánh thành công', {
            requestNo,
            requestDetails,
            dailyComparison
        }));

    } catch (error) {
        console.error('❌ Error in daily comparison:', error);
        res.status(500).json(formatResponse(false, error.message));
    }
};
