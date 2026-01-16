import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../utils/axiosInstance';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);

    const checkAuth = useCallback(async () => {
        const token = localStorage.getItem('authToken');
        if (token) {
            try {
                const res = await api.get('/auth/me');
                setUser(res.data);
                setIsAuthenticated(true);
            } catch (error) {
                console.error("Auth check failed:", error);
                // Only clear if 401/403 to avoid clearing on network errors
                if (error.response && (error.response.status === 401 || error.response.status === 403)) {
                    logout();
                }
            }
        } else {
            setUser(null);
            setIsAuthenticated(false);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    const login = (token, refreshToken, userData) => {
        localStorage.setItem('authToken', token);
        localStorage.setItem('refreshToken', refreshToken);
        if (userData) {
            localStorage.setItem('userRole', userData.role);
            setUser(userData);
        }
        setIsAuthenticated(true);
        // Fetch full profile if not provided or just to be safe
        if (!userData) {
            checkAuth();
        }
    };

    const logout = () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userRole');
        setUser(null);
        setIsAuthenticated(false);
        // Optional: Redirect to login or home handled by components
    };

    // Update user data manually (e.g. after profile edit)
    const updateUser = (data) => {
        setUser(prev => ({ ...prev, ...data }));
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated, loading, login, logout, checkAuth, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
};
