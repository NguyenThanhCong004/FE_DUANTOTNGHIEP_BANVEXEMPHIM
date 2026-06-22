/* eslint-disable react-refresh/only-export-components */
import React, { useCallback, useEffect, useState } from 'react';
import { normalizeToastType } from '../../utils/uiMessages';

/**
 * Component Toast thông báo chung cho admin pages
 * Hô trô các type: success, warning, danger, info
 * 
 * @param {string} message - Nôi dung thông báo
 * @param {string} type - Loai thông báo (success, warning, danger, info)
 * @param {number} duration - Thôi gian hiên (ms), default 3000
 * @param {boolean} show - Control hiên/ân
 * @param {Function} onClose - Callback khi ân toast
 */
const AdminToast = ({ 
  message = '', 
  type = 'success', 
  duration = 3000, 
  show = false, 
  onClose,
  position = 'bottom-end'
}) => {
  const [visible, setVisible] = useState(show);
  const normalizedType = normalizeToastType(type);

  useEffect(() => {
    setVisible(show);
  }, [show]);

  useEffect(() => {
    if (visible && duration > 0) {
      const timer = setTimeout(() => {
        setVisible(false);
        if (onClose) onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [visible, duration, onClose]);

  if (!visible || !message) return null;

  const positionClass = position === 'top-end' ? 'top-0 end-0' : 'bottom-0 end-0';

  const getIcon = () => {
    switch (normalizedType) {
      case 'success':
        return 'bi-check-circle-fill';
      case 'warning':
        return 'bi-exclamation-triangle-fill';
      case 'danger':
        return 'bi-x-circle-fill';
      case 'info':
        return 'bi-info-circle-fill';
      default:
        return 'bi-info-circle-fill';
    }
  };

  return (
    <div
      className={`position-fixed ${positionClass} m-4 admin-slide-up z-3 alert alert-${normalizedType} border-0 shadow-lg d-flex align-items-center gap-2`}
      style={{ minWidth: '300px', maxWidth: '500px' }}
    >
      <i className={`bi ${getIcon()} fs-5`}></i>
      <div className="fw-bold flex-grow-1">{message}</div>
      <button
        type="button"
        className="btn-close btn-sm ms-2"
        onClick={() => {
          setVisible(false);
          if (onClose) onClose();
        }}
        aria-label="Close"
      />
    </div>
  );
};

/**
 * Hook sê dîng AdminToast trong các component
 */
export const useAdminToast = (options = {}) => {
  const [toast, setToast] = useState({
    show: false,
    message: '',
    type: 'success',
    key: 0 // Thêm key dê force re-render/re-show nêu cùng message
  });

  const showToast = useCallback((message, type = 'success') => {
    // Reset truóc khi hiên dê dâm bảo toast luôn trigger logic hiên
    setToast(prev => ({
      ...prev,
      show: false,
    }));
    
    // Dung setTimeout dê dâm bảo re-render reset show=false hoàn tát truóc khi set true
    setTimeout(() => {
      setToast({
        show: true,
        message,
        type: normalizeToastType(type),
        key: Date.now()
      });
    }, 10);
  }, []);

  const hideToast = useCallback(() => {
    setToast(prev => ({ ...prev, show: false }));
  }, []);

  const ToastComponent = useCallback(() => (
    <AdminToast
      key={toast.key}
      message={toast.message}
      type={toast.type}
      show={toast.show}
      position={options.position}
      onClose={hideToast}
    />
  ), [hideToast, options.position, toast.key, toast.message, toast.show, toast.type]);

  return { showToast, hideToast, ToastComponent, toast };
};

export default AdminToast;
