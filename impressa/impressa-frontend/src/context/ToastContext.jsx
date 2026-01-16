import React, { createContext, useContext, useCallback } from 'react';
import toast from 'react-hot-toast';

const ToastContext = createContext();

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error("useToast must be used within a ToastProvider");
    }
    return context;
};

export const ToastProvider = ({ children }) => {
    // We wrap toast functions to maintain API compatibility with the old context
    // This allows existing components (like CartContext) to work without changes
    const showSuccess = useCallback((msg) => toast.success(msg), []);
    const showError = useCallback((msg) => toast.error(msg), []);
    const showInfo = useCallback((msg) => toast(msg, { icon: 'ℹ️' }), []);
    const showWarning = useCallback((msg) => toast(msg, { icon: '⚠️' }), []);

    // Helper to add a generic toast if needed, though direct usage is preferred now
    const addToast = useCallback((message, type = 'info') => {
        switch (type) {
            case 'success': toast.success(message); break;
            case 'error': toast.error(message); break;
            case 'warning': toast(message, { icon: '⚠️' }); break;
            default: toast(message);
        }
    }, []);

    const removeToast = useCallback((id) => toast.dismiss(id), []);

    return (
        <ToastContext.Provider value={{ addToast, removeToast, showSuccess, showError, showInfo, showWarning }}>
            {children}
        </ToastContext.Provider>
    );
};
