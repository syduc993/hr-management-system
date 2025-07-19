// Store management service
import BaseService from '../core/base-service.js';
import LarkClient from '../core/lark-client.js';
import CacheService from '../core/cache-service.js';

class StoreService extends BaseService {
    constructor() {
        super();
        this.baseId = process.env.LARK_BASE_ID;
        this.tableId = process.env.LARK_STORE_TABLE_ID;
    }

    async initializeService() {
        console.log('Initializing Store Service...');
    }

    async getAllStores() {
        const cacheKey = 'stores_all';
        let stores = CacheService.get(cacheKey);
        
        if (!stores) {
            try {
                const response = await LarkClient.get(`/bitable/v1/apps/${this.baseId}/tables/${this.tableId}/records`);
                stores = this.transformStoreData(response.data?.items || []);
                CacheService.set(cacheKey, stores, 300000); // 5 minutes
            } catch (error) {
                console.error('Error fetching stores from Lark:', error);
                stores = this.getMockStores();
            }
        }
        
        return stores;
    }

    async addStore(storeData) {
        try {
            const transformedData = this.transformStoreForLark(storeData);
            
            const response = await LarkClient.post(`/bitable/v1/apps/${this.baseId}/tables/${this.tableId}/records`, {
                fields: transformedData
            });

            // Clear cache
            CacheService.delete('stores_all');
            
            return this.transformStoreData([response.data])[0];
        } catch (error) {
            await this.handleError(error, 'addStore');
            throw error;
        }
    }

    async updateStore(id, storeData) {
        try {
            const transformedData = this.transformStoreForLark(storeData);
            
            const response = await LarkClient.put(`/bitable/v1/apps/${this.baseId}/tables/${this.tableId}/records/${id}`, {
                fields: transformedData
            });

            // Clear cache
            CacheService.delete('stores_all');
            
            return this.transformStoreData([response.data])[0];
        } catch (error) {
            await this.handleError(error, 'updateStore');
            throw error;
        }
    }

    async deleteStore(id) {
        try {
            await LarkClient.delete(`/bitable/v1/apps/${this.baseId}/tables/${this.tableId}/records/${id}`);
            
            // Clear cache
            CacheService.delete('stores_all');
            
            return true;
        } catch (error) {
            await this.handleError(error, 'deleteStore');
            throw error;
        }
    }

    async getActiveStores() {
        const stores = await this.getAllStores();
        return stores.filter(store => store.status === 'active');
    }

    async searchStores(query) {
        const stores = await this.getAllStores();
        
        if (!query) return stores;
        
        const searchTerm = query.toLowerCase();
        return stores.filter(store => 
            store.storeName.toLowerCase().includes(searchTerm) ||
            store.address.toLowerCase().includes(searchTerm)
        );
    }

    transformStoreData(larkData) {
        return larkData.map(record => ({
            id: record.record_id,
            storeName: record.fields['Store Name'] || '',
            address: record.fields['Address'] || '',
            status: record.fields['Status'] || 'active',
            createdAt: record.fields['Created At'] || new Date().toISOString(),
            updatedAt: record.fields['Updated At'] || new Date().toISOString()
        }));
    }

    transformStoreForLark(storeData) {
        return {
            'Store Name': storeData.storeName,
            'Address': storeData.address,
            'Status': storeData.status || 'active',
            'Created At': storeData.createdAt || new Date().toISOString(),
            'Updated At': storeData.updatedAt || new Date().toISOString()
        };
    }

    getMockStores() {
        return [
            {
                id: 'store_001',
                storeName: '116 Cầu Giấy',
                address: '116 Cầu Giấy, Hà Nội',
                status: 'active',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            },
            {
                id: 'store_002',
                storeName: 'Trâm Trỗi',
                address: 'Trâm Trỗi, Hà Nội',
                status: 'active',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }
        ];
    }
}

export default StoreService;
