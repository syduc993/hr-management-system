import React, { createContext, useState, useCallback, useContext } from 'react';
import ReactDOM from 'react-dom';
import Alert from '../components/common/Alert';
import '../styles/notifications.css';

// FIX: Thêm "export" vào đây. Đây là thay đổi quan trọng nhất.
export const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);

    const showNotification = useCallback((message, type = 'info', duration = 5000) => {
        const newNotification = {
            id: Date.now() + Math.random(),
            message,
            type,
            duration,
        };
        // Thêm thông báo mới vào đầu danh sách để hiện trên cùng
        setNotifications(prev => [newNotification, ...prev]);
    }, []);

    const removeNotification = useCallback((id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    // Giá trị mà Context sẽ cung cấp cho các component con
    const value = {
        showNotification,
    };
    
    // Logic render thông báo qua Portal
    const alertContainer = document.getElementById('alert-container');
    if (!alertContainer) {
        console.error('LỖI NGHIÊM TRỌNG: Không tìm thấy thẻ <div id="alert-container"> trong DOM. Thông báo sẽ không hiển thị.');
        // Vẫn render children để ứng dụng không bị sập
        return (
             <NotificationContext.Provider value={value}>
                {children}
            </NotificationContext.Provider>
        );
    }

    return (
        <NotificationContext.Provider value={value}>
            {children}
            {/* Render các Alert vào portal */}
            {ReactDOM.createPortal(
                <div className="notification-container">
                    {notifications.map((notification) => (
                        <Alert
                            key={notification.id}
                            notification={notification}
                            onClose={removeNotification}
                        />
                    ))}
                </div>,
                alertContainer
            )}
        </NotificationContext.Provider>
    );
};

// Bạn có thể giữ hook này ở đây hoặc trong file riêng đều được
export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (context === null) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};
