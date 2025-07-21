// server/controllers/storeController.js
import larkServiceManager from '../services/lark-service-manager.js';
import { formatResponse } from '../services/utils/response-formatter.js';

// ==================== STORE MANAGEMENT ====================
export const getStores = async (req, res) => {
    try {
        const stores = await larkServiceManager.getAllStores();
        res.json(formatResponse(true, 'Lấy danh sách cửa hàng thành công', stores));
    } catch (error) {
        console.error('❌ Controller: getStores failed:', error);
        res.status(500).json(formatResponse(false, `Lỗi khi tải danh sách cửa hàng: ${error.message}`, null, 'STORE_LOAD_FAILED'));
    }
};

export const addStore = async (req, res) => {
    try {
        const { storeName, address } = req.body;
        // (Validation sẽ được thêm vào ở bước sau)
        const store = {
            storeName,
            address,
            status: 'active',
            createdAt: new Date().toISOString()
        };
        const result = await larkServiceManager.addStore(store);
        res.json(formatResponse(true, 'Thêm cửa hàng thành công', { store: result }));
    } catch (error) {
        console.error('❌ Controller: addStore failed:', error);
        res.status(500).json(formatResponse(false, `Lỗi khi thêm cửa hàng: ${error.message}`, null, 'STORE_ADD_FAILED'));
    }
};

export const updateStore = async (req, res) => {
    try {
        const { id } = req.params;
        const updatedData = { ...req.body, updatedAt: new Date().toISOString() };
        const result = await larkServiceManager.updateStore(id, updatedData);
        res.json(formatResponse(true, 'Cập nhật cửa hàng thành công', { store: result }));
    } catch (error) {
        console.error('❌ Controller: updateStore failed:', error);
        res.status(500).json(formatResponse(false, `Lỗi khi cập nhật cửa hàng: ${error.message}`, null, 'STORE_UPDATE_FAILED'));
    }
};

export const deleteStore = async (req, res) => {
    try {
        const { id } = req.params;
        await larkServiceManager.deleteStore(id);
        res.json(formatResponse(true, 'Xóa cửa hàng thành công'));
    } catch (error) {
        console.error('❌ Controller: deleteStore failed:', error);
        res.status(500).json(formatResponse(false, `Lỗi khi xóa cửa hàng: ${error.message}`, null, 'STORE_DELETE_FAILED'));
    }
};
