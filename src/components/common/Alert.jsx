// src/components/common/Alert.jsx

// ✅ SỬA: Dùng "export const" để tạo một named export, khớp với cách import
export const Alert = ({ message, type = 'info', onClose }) => {
  if (!message) {
    return null;
  }

  // Chuyển đổi type 'error' thành 'danger' cho Bootstrap
  const alertType = type === 'error' ? 'danger' : type;

  const getIcon = () => {
    switch (alertType) {
      case 'success':
        return 'fas fa-check-circle';
      case 'danger':
        return 'fas fa-exclamation-triangle';
      case 'warning':
        return 'fas fa-exclamation-circle';
      default:
        return 'fas fa-info-circle';
    }
  };

  return (
    <div
      className={`alert alert-${alertType} alert-dismissible fade show d-flex align-items-center`}
      role="alert"
    >
      <i className={`${getIcon()} me-2`}></i>
      <div>{message}</div>
      {onClose && (
        <button
          type="button"
          className="btn-close"
          onClick={onClose}
          aria-label="Close"
        ></button>
      )}
    </div>
  );
};
