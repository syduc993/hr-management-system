// server/services/core/lark-client.js
import axios from 'axios';

class LarkClient {
    constructor() {
        // Không load env vars tại constructor
        this.baseURL = 'https://open.larksuite.com/open-apis';
        this.tenantAccessToken = null;
        this.tokenExpiry = null;
    }

    // Getter methods để load env vars khi cần
    get appId() {
        return process.env.LARK_APP_ID;
    }

    get appSecret() {
        return process.env.LARK_APP_SECRET;
    }

    async getTenantAccessToken() {
        console.log('🔑 Getting tenant access token...');
        
        // Debug environment variables khi thực sự sử dụng
        console.log('🔍 DEBUG Lark Credentials:');
        console.log('App ID:', this.appId ? `${this.appId.substring(0, 8)}...` : 'Missing');
        console.log('App Secret:', this.appSecret ? `${this.appSecret.substring(0, 8)}...` : 'Missing');
        
        if (!this.appId || !this.appSecret) {
            throw new Error('Lark credentials not configured properly');
        }
        
        if (this.tenantAccessToken && this.tokenExpiry > Date.now()) {
            console.log('✅ Using cached access token');
            return this.tenantAccessToken;
        }

        try {
            console.log('📡 Requesting new access token from Lark...');
            const payload = {
                app_id: this.appId,
                app_secret: this.appSecret
            };
            
            console.log('🚀 Sending request to:', `${this.baseURL}/auth/v3/tenant_access_token/internal`);
            console.log('📦 Payload keys:', Object.keys(payload));
            
            const response = await axios.post(`${this.baseURL}/auth/v3/tenant_access_token/internal`, payload);
            
            console.log('📨 Lark auth response:', {
                status: response.status,
                code: response.data.code,
                msg: response.data.msg
            });

            if (response.data.code === 0) {
                this.tenantAccessToken = response.data.tenant_access_token;
                this.tokenExpiry = Date.now() + (response.data.expire - 300) * 1000;
                console.log('✅ Access token obtained successfully');
                console.log('Token expires in:', Math.floor((this.tokenExpiry - Date.now()) / 1000), 'seconds');
                return this.tenantAccessToken;
            } else {
                console.error('❌ Lark auth error:', response.data);
                throw new Error(`Lark Auth Error: ${response.data.msg}`);
            }
        } catch (error) {
            console.error('❌ Error getting tenant access token:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status
            });
            throw error;
        }
    }

    async request(endpoint, options = {}) {
        console.log(`📞 Making Lark API request: ${options.method || 'GET'} ${endpoint}`);
        
        const token = await this.getTenantAccessToken();
        
        const config = {
            ...options,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                ...options.headers
            }
        };

        try {
            console.log('🔄 Sending request to:', `${this.baseURL}${endpoint}`);
            const response = await axios(`${this.baseURL}${endpoint}`, config);
            
            console.log('✅ Lark API response:', {
                status: response.status,
                dataLength: response.data ? JSON.stringify(response.data).length : 0
            });
            
            return response.data;
        } catch (error) {
            console.error('❌ Lark API Error:', {
                endpoint,
                status: error.response?.status,
                data: error.response?.data,
                message: error.message
            });
            throw error;
        }
    }

    async get(endpoint, params = {}) {
        console.log('📥 GET request:', endpoint, params);
        return this.request(endpoint, { method: 'GET', params });
    }

    async post(endpoint, data = {}) {
        console.log('📤 POST request:', endpoint, { dataKeys: Object.keys(data) });
        return this.request(endpoint, { method: 'POST', data });
    }

    async put(endpoint, data = {}) {
        console.log('📝 PUT request:', endpoint, { dataKeys: Object.keys(data) });
        return this.request(endpoint, { method: 'PUT', data });
    }

    async delete(endpoint) {
        console.log('🗑️ DELETE request:', endpoint);
        return this.request(endpoint, { method: 'DELETE' });
    }
}

export default new LarkClient();
