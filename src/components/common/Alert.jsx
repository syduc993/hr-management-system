import React, { useState, useEffect } from 'react';

// Hàm helper để lấy icon dựa trên loại thông báo
const getIconByType = (type) => {
    switch (type) {
        case 'success': return 'fa-check-circle';
        case 'error': return 'fa-times-circle';
        case 'warning': return 'fa-exclamation-triangle';
        case 'info': return 'fa-info-circle';
        default: return 'fa-info-circle';
    }
};

const Alert = ({ notification, onClose }) => {
    // ✅ THÊM: Guard clause để tránh lỗi destructuring khi notification = undefined
    if (!notification) {
        console.warn('Alert component received undefined notification');
        return null;
    }

    // ✅ SỬA: Thêm default values để tránh crash
    const { 
        id = 'unknown', 
        message = 'Thông báo không xác định', 
        type = 'info',
        duration 
    } = notification;

    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        // Tự động đóng sau một khoảng thời gian nếu có
        if (duration) {
            const timer = setTimeout(() => {
                handleClose();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [duration]); // ✅ SỬA: Sử dụng duration đã destructured

    const handleClose = () => {
        setIsExiting(true);
        // Đợi animation fade-out hoàn thành rồi mới gỡ component khỏi state
        setTimeout(() => {
            // ✅ THÊM: Kiểm tra onClose tồn tại trước khi gọi
            if (onClose) {
                onClose(id);
            }
        }, 400); // Phải khớp với thời gian transition trong CSS
    };

    return (
        <div className={`alert-toast ${type} ${isExiting ? '' : 'show'}`}>
            <i className={`fas ${getIconByType(type)} alert-toast-icon`}></i>
            <div className="alert-toast-content">
                <div className="alert-toast-message">{message}</div>
            </div>
            <button className="alert-toast-close" onClick={handleClose}>
                &times;
            </button>
        </div>
    );
};

export default Alert;
