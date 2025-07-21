// server/controllers/positionController.js
import larkServiceManager from '../services/lark-service-manager.js';
import { formatResponse } from '../services/utils/response-formatter.js';

// ==================== POSITION MANAGEMENT ====================
export const getPositions = async (req, res) => {
    try {
        const positions = await larkServiceManager.getAllPositions();
        res.json(formatResponse(true, 'Lấy danh sách vị trí thành công', positions));
    } catch (error) {
        console.error('❌ Controller: getPositions failed:', error);
        res.status(500).json(formatResponse(false, `Lỗi khi tải danh sách vị trí: ${error.message}`, null, 'POSITION_LOAD_FAILED'));
    }
};

export const addPosition = async (req, res) => {
    try {
        const { positionName, description } = req.body;
        // (Validation sẽ được thêm vào ở bước sau)
        const position = {
            positionName,
            description: description || '',
            status: 'active',
            createdAt: new Date().toISOString()
        };
        const result = await larkServiceManager.addPosition(position);
        res.json(formatResponse(true, 'Thêm vị trí thành công', { position: result }));
    } catch (error) {
        console.error('❌ Controller: addPosition failed:', error);
        res.status(500).json(formatResponse(false, `Lỗi khi thêm vị trí: ${error.message}`, null, 'POSITION_ADD_FAILED'));
    }
};

export const updatePosition = async (req, res) => {
    try {
        const { id } = req.params;
        const updatedData = { ...req.body, updatedAt: new Date().toISOString() };
        const result = await larkServiceManager.updatePosition(id, updatedData);
        res.json(formatResponse(true, 'Cập nhật vị trí thành công', { position: result }));
    } catch (error) {
        console.error('❌ Controller: updatePosition failed:', error);
        res.status(500).json(formatResponse(false, `Lỗi khi cập nhật vị trí: ${error.message}`, null, 'POSITION_UPDATE_FAILED'));
    }
};

export const deletePosition = async (req, res) => {
    try {
        const { id } = req.params;
        await larkServiceManager.deletePosition(id);
        res.json(formatResponse(true, 'Xóa vị trí thành công'));
    } catch (error) {
        console.error('❌ Controller: deletePosition failed:', error);
        res.status(500).json(formatResponse(false, `Lỗi khi xóa vị trí: ${error.message}`, null, 'POSITION_DELETE_FAILED'));
    }
};
