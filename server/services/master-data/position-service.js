// Position management service
import BaseService from '../core/base-service.js';
import LarkClient from '../core/lark-client.js';
import CacheService from '../core/cache-service.js';

class PositionService extends BaseService {
    constructor() {
        super();
        this.baseId = process.env.LARK_BASE_ID;
        this.tableId = process.env.LARK_POSITION_TABLE_ID;
    }

    async initializeService() {
        console.log('Initializing Position Service...');
    }

    async getAllPositions() {
        const cacheKey = 'positions_all';
        let positions = CacheService.get(cacheKey);
        
        if (!positions) {
            try {
                const response = await LarkClient.get(`/bitable/v1/apps/${this.baseId}/tables/${this.tableId}/records`);
                positions = this.transformPositionData(response.data?.items || []);
                CacheService.set(cacheKey, positions, 300000); // 5 minutes
            } catch (error) {
                console.error('Error fetching positions from Lark:', error);
                positions = this.getMockPositions();
            }
        }
        
        return positions;
    }

    async addPosition(positionData) {
        try {
            const transformedData = this.transformPositionForLark(positionData);
            
            const response = await LarkClient.post(`/bitable/v1/apps/${this.baseId}/tables/${this.tableId}/records`, {
                fields: transformedData
            });

            // Clear cache
            CacheService.delete('positions_all');
            
            return this.transformPositionData([response.data])[0];
        } catch (error) {
            await this.handleError(error, 'addPosition');
            throw error;
        }
    }

    async updatePosition(id, positionData) {
        try {
            const transformedData = this.transformPositionForLark(positionData);
            
            const response = await LarkClient.put(`/bitable/v1/apps/${this.baseId}/tables/${this.tableId}/records/${id}`, {
                fields: transformedData
            });

            // Clear cache
            CacheService.delete('positions_all');
            
            return this.transformPositionData([response.data])[0];
        } catch (error) {
            await this.handleError(error, 'updatePosition');
            throw error;
        }
    }

    async deletePosition(id) {
        try {
            await LarkClient.delete(`/bitable/v1/apps/${this.baseId}/tables/${this.tableId}/records/${id}`);
            
            // Clear cache
            CacheService.delete('positions_all');
            
            return true;
        } catch (error) {
            await this.handleError(error, 'deletePosition');
            throw error;
        }
    }

    async getActivePositions() {
        const positions = await this.getAllPositions();
        return positions.filter(position => position.status === 'active');
    }

    async searchPositions(query) {
        const positions = await this.getAllPositions();
        
        if (!query) return positions;
        
        const searchTerm = query.toLowerCase();
        return positions.filter(position => 
            position.positionName.toLowerCase().includes(searchTerm) ||
            (position.description && position.description.toLowerCase().includes(searchTerm))
        );
    }

    transformPositionData(larkData) {
        return larkData.map(record => ({
            id: record.record_id,
            positionName: record.fields['Position Name'] || '',
            description: record.fields['Description'] || '',
            status: record.fields['Status'] || 'active',
            createdAt: record.fields['Created At'] || new Date().toISOString(),
            updatedAt: record.fields['Updated At'] || new Date().toISOString()
        }));
    }

    transformPositionForLark(positionData) {
        return {
            'Position Name': positionData.positionName,
            'Description': positionData.description || '',
            'Status': positionData.status || 'active',
            'Created At': positionData.createdAt || new Date().toISOString(),
            'Updated At': positionData.updatedAt || new Date().toISOString()
        };
    }

    getMockPositions() {
        return [
            {
                id: 'pos_001',
                positionName: 'Nhân viên bán hàng',
                description: 'Nhân viên bán hàng tại cửa hàng',
                status: 'active',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            },
            {
                id: 'pos_002',
                positionName: 'Nhân viên kho',
                description: 'Nhân viên quản lý kho hàng',
                status: 'active',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            },
            {
                id: 'pos_003',
                positionName: 'Trưởng ca',
                description: 'Trưởng ca quản lý nhân viên',
                status: 'active',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }
        ];
    }
}

export default PositionService;
