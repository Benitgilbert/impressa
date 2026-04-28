import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../utils/axiosInstance';
import { supabase } from '../utils/supabaseClient';

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

    const checkAuth = useCallback(async (session) => {
        if (session) {
            try {
                // Fetch full profile from our backend using the Supabase token
                const res = await api.get('/auth/me');
                setUser(res.data);
                setIsAuthenticated(true);
                localStorage.setItem('userRole', res.data.role);
            } catch (error) {
                console.error("Profile fetch failed:", error);
                // If backend fetch fails but we have a session, we might be a new user
                // or backend is down. We'll set a basic user object from the session.
                setUser({
                    id: session.user.id,
                    email: session.user.email,
                    name: session.user.user_metadata?.name || 'User'
                });
                setIsAuthenticated(true);
            }
        } else {
            setUser(null);
            setIsAuthenticated(false);
            localStorage.removeItem('userRole');
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            checkAuth(session);
        });

        // Initial check
        supabase.auth.getSession().then(({ data: { session } }) => {
            checkAuth(session);
        });

        return () => subscription.unsubscribe();
    }, [checkAuth]);

    const login = async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        if (error) throw error;
        return data;
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setUser(null);
        setIsAuthenticated(false);
    };

    const updateUser = (data) => {
        setUser(prev => ({ ...prev, ...data }));
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated, loading, login, logout, checkAuth, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
};
