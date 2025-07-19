import React, { createContext, useContext, useCallback } from 'react';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const showNotification = useCallback((message, type = 'info', duration = 5000) => {
    const alertContainer = document.getElementById('alert-container');
    if (!alertContainer) {
      console.warn('Alert container not found');
      return;
    }
    
    const alertId = `alert-${Date.now()}`;
    const alertDiv = document.createElement('div');
    alertDiv.id = alertId;
    alertDiv.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show`;
    alertDiv.style.marginBottom = '10px';
    
    alertDiv.innerHTML = `
      <div class="d-flex align-items-center">
        <i class="fas fa-${getIconByType(type)} me-2"></i>
        <div class="flex-grow-1">${message}</div>
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
      </div>
    `;
    
    alertContainer.appendChild(alertDiv);
    
    // Auto remove after duration
    setTimeout(() => {
      const element = document.getElementById(alertId);
      if (element && element.parentNode) {
        element.parentNode.removeChild(element);
      }
    }, duration);
  }, []);

  const getIconByType = (type) => {
    switch (type) {
      case 'success': return 'check-circle';
      case 'error': 
      case 'danger': return 'exclamation-triangle';
      case 'warning': return 'exclamation-circle';
      case 'info': return 'info-circle';
      default: return 'info-circle';
    }
  };

  const clearNotifications = useCallback(() => {
    const alertContainer = document.getElementById('alert-container');
    if (alertContainer) {
      alertContainer.innerHTML = '';
    }
  }, []);

  const value = {
    showNotification,
    clearNotifications
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export { NotificationContext };
export default NotificationContext;

