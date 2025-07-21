import React, { createContext, useContext, useState, useEffect } from 'react';
import { ApiClient } from '../services/api.js';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      setLoading(true);
      // ✅ SỬA: Thay thế checkAuth() bằng việc gọi trực tiếp getProfile từ ApiClient
      const response = await ApiClient.get('/api/auth/profile');
      if (response.success && response.data.user) {
        setUser(response.data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.warn('Auth initialization: Not logged in.');
      setUser(null);
    } finally {
      setInitialized(true);
      setLoading(false);
    }
  };

  // Hàm checkAuth cũ có thể xóa hoặc giữ lại nếu cần
  const checkAuth = async () => {
    try {
      const response = await ApiClient.get('/api/auth/profile');
      return response.success ? response.data.user : null;
    } catch (error) {
      return null;
    }
  };

  const login = async (credentials) => {
    try {
      setLoading(true);
      const response = await ApiClient.post('/api/auth/login', credentials);
      
      // ✅ SỬA LOGIC KIỂM TRA TẠI ĐÂY
      // Kiểm tra `response.data.user` thay vì `response.user`
      if (response.success && response.data && response.data.user) {
        setUser(response.data.user);
        return response.data; // Trả về `response.data` để LoginPage có thể sử dụng
      } else {
        // Ném lỗi với thông điệp từ server nếu có
        throw new Error(response.message || 'Login failed: Invalid response structure');
      }
    } catch (error) {
      console.error('Login error:', error);
      // Đảm bảo ném lại lỗi để component gọi có thể bắt được
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await ApiClient.post('/api/auth/logout');
      setUser(null);
      // Chuyển hướng về trang login một cách an toàn
      window.location.assign('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Vẫn xóa user và chuyển hướng dù API có lỗi
      setUser(null);
      window.location.assign('/login');
    } finally {
      setLoading(false);
    }
  };

  const updateUserInfo = (userData) => {
    setUser(prevUser => ({
      ...prevUser,
      ...userData
    }));
  };

  const hasRole = (requiredRoles) => {
    if (!user) return false;
    if (typeof requiredRoles === 'string') {
      return user.role === requiredRoles;
    }
    if (Array.isArray(requiredRoles)) {
      return requiredRoles.includes(user.role);
    }
    return false;
  };

  const value = {
    user,
    loading,
    initialized,
    login,
    logout,
    checkAuth,
    updateUserInfo,
    hasRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
