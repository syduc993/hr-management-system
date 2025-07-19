import React from 'react';

const Loading = ({ 
  size = 'medium', 
  text = 'Đang tải...', 
  overlay = false,
  fullScreen = false 
}) => {
  const getSizeClass = () => {
    switch (size) {
      case 'small': return 'spinner-border-sm';
      case 'large': return 'spinner-border spinner-border-lg';
      default: return 'spinner-border';
    }
  };

  const LoadingSpinner = () => (
    <div className="d-flex flex-column align-items-center justify-content-center p-3">
      <div className={`${getSizeClass()} text-primary`} role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
      {text && (
        <div className="mt-2 text-muted small">
          {text}
        </div>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div 
        className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
        style={{ 
          backgroundColor: 'rgba(255, 255, 255, 0.9)', 
          zIndex: 9999 
        }}
      >
        <div className="text-center">
          <div className="spinner-border spinner-border-lg text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <div className="mt-3 h5 text-muted">{text}</div>
        </div>
      </div>
    );
  }

  if (overlay) {
    return (
      <div 
        className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
        style={{ 
          backgroundColor: 'rgba(255, 255, 255, 0.8)', 
          zIndex: 1000 
        }}
      >
        <LoadingSpinner />
      </div>
    );
  }

  return <LoadingSpinner />;
};

// Loading wrapper component for conditional loading states
export const LoadingWrapper = ({ loading, children, ...loadingProps }) => {
  if (loading) {
    return <Loading {...loadingProps} />;
  }
  return children;
};

// Inline loading component for buttons
export const ButtonLoading = ({ loading, children, disabled, ...props }) => {
  return (
    <button 
      {...props} 
      disabled={disabled || loading}
      className={`${props.className || ''} ${loading ? 'position-relative' : ''}`}
    >
      {loading && (
        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
      )}
      {children}
    </button>
  );
};

export default Loading;
