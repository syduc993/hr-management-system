// server/controllers/storeController.js
import larkServiceManager from '../services/lark-service-manager.js';
import { formatResponse } from '../services/utils/response-formatter.js';
import TimezoneService from '../services/core/timezone-service.js';


/* ======================= LẤY DANH SÁCH CỬA HÀNG ======================= */
/**
 * Lấy danh sách tất cả các cửa hàng từ Lark Service
 * 
 * @description Truy xuất toàn bộ danh sách cửa hàng có sẵn trong hệ thống
 * @route GET /api/stores
 * @returns {Object} Response chứa danh sách cửa hàng hoặc thông báo lỗi
 * 
 * Logic flow:
 * 1. Gọi larkServiceManager để lấy danh sách cửa hàng
 * 2. Format response thành công với dữ liệu cửa hàng
 * 3. Xử lý lỗi nếu có vấn đề trong quá trình truy xuất
 */
export const getStores = async (req, res) => {
    try {
        // ✅ STEP 1: Truy xuất danh sách cửa hàng từ Lark Service
        const stores = await larkServiceManager.getAllStores();
        
        // ✅ STEP 2: Trả về response thành công với dữ liệu cửa hàng
        res.json(formatResponse(true, 'Lấy danh sách cửa hàng thành công', stores));
    } catch (error) {
        // ❌ ERROR HANDLING: Log lỗi chi tiết và trả về response lỗi server
        console.error('❌ Controller: getStores failed:', error);
        res.status(500).json(formatResponse(false, `Lỗi khi tải danh sách cửa hàng: ${error.message}`, null, 'STORE_LOAD_FAILED'));
    }
};

/* ======================= THÊM CỬA HÀNG MỚI ======================= */
/**
 * Thêm cửa hàng mới vào hệ thống
 * 
 * @description Tạo một cửa hàng mới với thông tin từ request body
 * @route POST /api/stores
 * @param {string} storeName - Tên cửa hàng (bắt buộc)
 * @param {string} address - Địa chỉ cửa hàng (bắt buộc)
 * @returns {Object} Response chứa thông tin cửa hàng vừa tạo hoặc thông báo lỗi
 * 
 * Logic flow:
 * 1. Extract dữ liệu từ request body
 * 2. Tạo object cửa hàng với timestamp hiện tại (múi giờ VN)
 * 3. Gọi service để thêm cửa hàng vào Lark
 * 4. Trả về response thành công với dữ liệu cửa hàng mới
 */
export const addStore = async (req, res) => {
    try {
        // ✅ STEP 1: Extract dữ liệu từ request body
        const { storeName, address } = req.body;
        
        // (Validation sẽ được thêm vào ở bước sau) - TODO: Thêm validation cho storeName và address
        
        // ✅ STEP 2: Tạo object cửa hàng mới với metadata đầy đủ
        const store = {
            storeName,
            address, // Địa chỉ cửa hàng là trường bắt buộc
            status: 'active', // Mặc định cửa hàng mới sẽ có trạng thái active
            // Sử dụng múi giờ Vietnam thay vì UTC
            createdAt: TimezoneService.getCurrentVietnamDate().toISOString()
        };
        
        // ✅ STEP 3: Gọi Lark Service để thêm cửa hàng vào hệ thống
        const result = await larkServiceManager.addStore(store);
        
        // ✅ STEP 4: Trả về response thành công với dữ liệu cửa hàng vừa tạo
        res.json(formatResponse(true, 'Thêm cửa hàng thành công', { store: result }));
    } catch (error) {
        // ❌ ERROR HANDLING: Log lỗi chi tiết và trả về response lỗi với mã lỗi cụ thể
        console.error('❌ Controller: addStore failed:', error);
        res.status(500).json(formatResponse(false, `Lỗi khi thêm cửa hàng: ${error.message}`, null, 'STORE_ADD_FAILED'));
    }
};

/* ======================= CẬP NHẬT CỬA HÀNG ======================= */
/**
 * Cập nhật thông tin cửa hàng hiện có
 * 
 * @description Cập nhật thông tin của một cửa hàng dựa trên ID
 * @route PUT /api/stores/:id
 * @param {string} id - ID của cửa hàng cần cập nhật (từ URL params)
 * @param {Object} req.body - Dữ liệu cập nhật (storeName, address, status, etc.)
 * @returns {Object} Response chứa thông tin cửa hàng đã cập nhật hoặc thông báo lỗi
 * 
 * Logic flow:
 * 1. Lấy ID cửa hàng từ URL parameters
 * 2. Merge dữ liệu cập nhật với timestamp hiện tại
 * 3. Gọi service để cập nhật cửa hàng trong Lark
 * 4. Trả về response thành công với dữ liệu đã cập nhật
 */
export const updateStore = async (req, res) => {
    try {
        // ✅ STEP 1: Lấy ID cửa hàng từ URL parameters
        const { id } = req.params;
        
        // ✅ STEP 2: Merge dữ liệu từ request body với timestamp cập nhật (múi giờ VN)
        const updatedData = { 
            ...req.body, 
            updatedAt: TimezoneService.getCurrentVietnamDate().toISOString() 
        };
        
        // ✅ STEP 3: Gọi Lark Service để cập nhật cửa hàng
        const result = await larkServiceManager.updateStore(id, updatedData);
        
        // ✅ STEP 4: Trả về response thành công với dữ liệu cửa hàng đã cập nhật
        res.json(formatResponse(true, 'Cập nhật cửa hàng thành công', { store: result }));
    } catch (error) {
        // ❌ ERROR HANDLING: Log lỗi và trả về response lỗi với thông tin chi tiết
        console.error('❌ Controller: updateStore failed:', error);
        res.status(500).json(formatResponse(false, `Lỗi khi cập nhật cửa hàng: ${error.message}`, null, 'STORE_UPDATE_FAILED'));
    }
};

/* ======================= XÓA CỬA HÀNG ======================= */
/**
 * Xóa cửa hàng khỏi hệ thống
 * 
 * @description Xóa một cửa hàng dựa trên ID được cung cấp
 * @route DELETE /api/stores/:id
 * @param {string} id - ID của cửa hàng cần xóa (từ URL params)
 * @returns {Object} Response xác nhận xóa thành công hoặc thông báo lỗi
 * 
 * Logic flow:
 * 1. Lấy ID cửa hàng từ URL parameters
 * 2. Gọi service để xóa cửa hàng khỏi Lark
 * 3. Trả về response xác nhận xóa thành công
 * 
 * Note: Cần cân nhắc soft delete thay vì hard delete để tránh mất dữ liệu quan trọng
 * Cần kiểm tra xem cửa hàng có đang được sử dụng bởi nhân viên nào không trước khi xóa
 */
export const deleteStore = async (req, res) => {
    try {
        // ✅ STEP 1: Lấy ID cửa hàng từ URL parameters
        const { id } = req.params;
        
        // ✅ STEP 2: Gọi Lark Service để xóa cửa hàng khỏi hệ thống
        await larkServiceManager.deleteStore(id);
        
        // ✅ STEP 3: Trả về response xác nhận xóa thành công (không cần trả data)
        res.json(formatResponse(true, 'Xóa cửa hàng thành công'));
    } catch (error) {
        // ❌ ERROR HANDLING: Log lỗi và trả về response lỗi khi không thể xóa cửa hàng
        // Có thể do: cửa hàng không tồn tại, cửa hàng đang được sử dụng, lỗi kết nối Lark, etc.
        console.error('❌ Controller: deleteStore failed:', error);
        res.status(500).json(formatResponse(false, `Lỗi khi xóa cửa hàng: ${error.message}`, null, 'STORE_DELETE_FAILED'));
    }
};

