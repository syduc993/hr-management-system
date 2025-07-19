// API helper functions - converted from vanilla JS
export class ApiClient {
  static async request(url, options = {}) {
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        credentials: 'include',
        ...options
      });

      // ✅ THÊM: Log request details để debug
      console.log('API Request:', {
        url,
        method: options.method || 'GET',
        body: options.body,
        status: response.status,
        statusText: response.statusText
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
          // ✅ THÊM: Log full error response
          console.error('Server error response:', errorData);
        } catch (parseError) {
          console.error('Could not parse error response:', parseError);
          errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
        }
        
        // ✅ SỬA: Trả về object chứa đầy đủ thông tin lỗi
        throw new Error(JSON.stringify({
          status: response.status,
          message: errorData.message || errorData.error || 'Request failed',
          details: errorData
        }));
      }

      const data = await response.json();
      console.log('API Response:', data);
      return data;
    } catch (error) {
      console.error('API request error:', error);
      throw error;
    }
  }

  static async get(url, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const fullUrl = queryString ? `${url}?${queryString}` : url;
    return this.request(fullUrl);
  }

  static async post(url, data) {
    return this.request(url, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  static async put(url, data) {
    return this.request(url, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  static async delete(url) {
    return this.request(url, {
      method: 'DELETE'
    });
  }
}

export default ApiClient;
