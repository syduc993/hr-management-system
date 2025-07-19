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
      const user = await checkAuth();
      setUser(user);
      setInitialized(true);
    } catch (error) {
      console.error('Auth initialization error:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/profile', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.user;
      } else {
        return null;
      }
    } catch (error) {
      console.error('Auth check error:', error);
      return null;
    }
  };

  const login = async (credentials) => {
    try {
      setLoading(true);
      const response = await ApiClient.post('/api/auth/login', credentials);
      
      if (response.user) {
        setUser(response.user);
        return response;
      } else {
        throw new Error('Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
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
      
      // Redirect after logout
      setTimeout(() => {
        window.location.href = '/login';
      }, 1000);
      
    } catch (error) {
      console.error('Logout error:', error);
      // Force logout even if API fails
      setUser(null);
      window.location.href = '/login';
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

  const isHR = () => {
    return user && (user.role === 'hr' || user.role === 'admin');
  };

  const isAdmin = () => {
    return user && user.role === 'admin';
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
    isHR,
    isAdmin
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
