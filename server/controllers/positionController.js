// server/controllers/positionController.js
import larkServiceManager from '../services/lark-service-manager.js';
import { formatResponse } from '../services/utils/response-formatter.js';
import TimezoneService from '../services/core/timezone-service.js';


/* ======================= LẤY DANH SÁCH VỊ TRÍ ======================= */
/**
 * Lấy danh sách tất cả các vị trí từ Lark Service
 * 
 * @description Truy xuất toàn bộ danh sách vị trí có sẵn trong hệ thống
 * @route GET /api/positions
 * @returns {Object} Response chứa danh sách vị trí hoặc thông báo lỗi
 * 
 * Logic flow:
 * 1. Gọi larkServiceManager để lấy danh sách vị trí
 * 2. Format response thành công với dữ liệu vị trí
 * 3. Xử lý lỗi nếu có vấn đề trong quá trình truy xuất
 */
export const getPositions = async (req, res) => {
    try {
        // ✅ STEP 1: Truy xuất danh sách vị trí từ Lark Service
        const positions = await larkServiceManager.getAllPositions();
        
        // ✅ STEP 2: Trả về response thành công với dữ liệu vị trí
        res.json(formatResponse(true, 'Lấy danh sách vị trí thành công', positions));
    } catch (error) {
        // ❌ ERROR HANDLING: Log lỗi chi tiết và trả về response lỗi server
        console.error('❌ Controller: getPositions failed:', error);
        res.status(500).json(formatResponse(false, `Lỗi khi tải danh sách vị trí: ${error.message}`, null, 'POSITION_LOAD_FAILED'));
    }
};

/* ======================= THÊM VỊ TRÍ MỚI ======================= */
/**
 * Thêm vị trí mới vào hệ thống
 * 
 * @description Tạo một vị trí mới với thông tin từ request body
 * @route POST /api/positions
 * @param {string} positionName - Tên vị trí (bắt buộc)
 * @param {string} description - Mô tả vị trí (tùy chọn)
 * @returns {Object} Response chứa thông tin vị trí vừa tạo hoặc thông báo lỗi
 * 
 * Logic flow:
 * 1. Extract dữ liệu từ request body
 * 2. Tạo object vị trí với timestamp hiện tại (múi giờ VN)
 * 3. Gọi service để thêm vị trí vào Lark
 * 4. Trả về response thành công với dữ liệu vị trí mới
 */
export const addPosition = async (req, res) => {
    try {
        // ✅ STEP 1: Extract dữ liệu từ request body
        const { positionName, description } = req.body;
        
        // (Validation sẽ được thêm vào ở bước sau) - TODO: Thêm validation cho positionName
        
        // ✅ STEP 2: Tạo object vị trí mới với metadata đầy đủ
        const position = {
            positionName,
            description: description || '', // Sử dụng empty string nếu không có description
            status: 'active', // Mặc định vị trí mới sẽ có trạng thái active
            // Sử dụng múi giờ Vietnam thay vì UTC
            createdAt: TimezoneService.getCurrentVietnamDate().toISOString()
        };
        
        // ✅ STEP 3: Gọi Lark Service để thêm vị trí vào hệ thống
        const result = await larkServiceManager.addPosition(position);
        
        // ✅ STEP 4: Trả về response thành công với dữ liệu vị trí vừa tạo
        res.json(formatResponse(true, 'Thêm vị trí thành công', { position: result }));
    } catch (error) {
        // ❌ ERROR HANDLING: Log lỗi chi tiết và trả về response lỗi với mã lỗi cụ thể
        console.error('❌ Controller: addPosition failed:', error);
        res.status(500).json(formatResponse(false, `Lỗi khi thêm vị trí: ${error.message}`, null, 'POSITION_ADD_FAILED'));
    }
};

/* ======================= CẬP NHẬT VỊ TRÍ ======================= */
/**
 * Cập nhật thông tin vị trí hiện có
 * 
 * @description Cập nhật thông tin của một vị trí dựa trên ID
 * @route PUT /api/positions/:id
 * @param {string} id - ID của vị trí cần cập nhật (từ URL params)
 * @param {Object} req.body - Dữ liệu cập nhật (positionName, description, status, etc.)
 * @returns {Object} Response chứa thông tin vị trí đã cập nhật hoặc thông báo lỗi
 * 
 * Logic flow:
 * 1. Lấy ID vị trí từ URL parameters
 * 2. Merge dữ liệu cập nhật với timestamp hiện tại
 * 3. Gọi service để cập nhật vị trí trong Lark
 * 4. Trả về response thành công với dữ liệu đã cập nhật
 */
export const updatePosition = async (req, res) => {
    try {
        // ✅ STEP 1: Lấy ID vị trí từ URL parameters
        const { id } = req.params;
        
        // ✅ STEP 2: Merge dữ liệu từ request body với timestamp cập nhật (múi giờ VN)
        const updatedData = { 
            ...req.body, 
            updatedAt: TimezoneService.getCurrentVietnamDate().toISOString() 
        };
        
        // ✅ STEP 3: Gọi Lark Service để cập nhật vị trí
        const result = await larkServiceManager.updatePosition(id, updatedData);
        
        // ✅ STEP 4: Trả về response thành công với dữ liệu vị trí đã cập nhật
        res.json(formatResponse(true, 'Cập nhật vị trí thành công', { position: result }));
    } catch (error) {
        // ❌ ERROR HANDLING: Log lỗi và trả về response lỗi với thông tin chi tiết
        console.error('❌ Controller: updatePosition failed:', error);
        res.status(500).json(formatResponse(false, `Lỗi khi cập nhật vị trí: ${error.message}`, null, 'POSITION_UPDATE_FAILED'));
    }
};

/* ======================= XÓA VỊ TRÍ ======================= */
/**
 * Xóa vị trí khỏi hệ thống
 * 
 * @description Xóa một vị trí dựa trên ID được cung cấp
 * @route DELETE /api/positions/:id
 * @param {string} id - ID của vị trí cần xóa (từ URL params)
 * @returns {Object} Response xác nhận xóa thành công hoặc thông báo lỗi
 * 
 * Logic flow:
 * 1. Lấy ID vị trí từ URL parameters
 * 2. Gọi service để xóa vị trí khỏi Lark
 * 3. Trả về response xác nhận xóa thành công
 * 
 * Note: Cần cân nhắc soft delete thay vì hard delete để tránh mất dữ liệu quan trọng
 */
export const deletePosition = async (req, res) => {
    try {
        // ✅ STEP 1: Lấy ID vị trí từ URL parameters
        const { id } = req.params;
        
        // ✅ STEP 2: Gọi Lark Service để xóa vị trí khỏi hệ thống
        await larkServiceManager.deletePosition(id);
        
        // ✅ STEP 3: Trả về response xác nhận xóa thành công (không cần trả data)
        res.json(formatResponse(true, 'Xóa vị trí thành công'));
    } catch (error) {
        // ❌ ERROR HANDLING: Log lỗi và trả về response lỗi khi không thể xóa vị trí
        // Có thể do: vị trí không tồn tại, vị trí đang được sử dụng, lỗi kết nối Lark, etc.
        console.error('❌ Controller: deletePosition failed:', error);
        res.status(500).json(formatResponse(false, `Lỗi khi xóa vị trí: ${error.message}`, null, 'POSITION_DELETE_FAILED'));
    }
};
