import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [permissions, setPermissions] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadUser = async () => {
        const token = localStorage.getItem('auth_token');
        if (!token) {
            setLoading(false);
            return;
        }

        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        try {
            const res = await api.get('/me');
            setUser(res.data.user);
            setPermissions(res.data.permissions || []);
        } catch (error) {
            console.error('Failed to load user', error);
            localStorage.removeItem('auth_token');
            delete api.defaults.headers.common['Authorization'];
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUser();
    }, []);

    const login = async (email, password) => {
        const res = await api.post('/login', { email, password });
        const { token, user: userData, permissions: userPerms } = res.data;
        
        localStorage.setItem('auth_token', token);
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        setUser(userData);
        setPermissions(userPerms || []);
        return res.data;
    };

    const register = async (userData) => {
        const res = await api.post('/register', userData);
        const { token, user: newUser, permissions: newPerms } = res.data;
        
        localStorage.setItem('auth_token', token);
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        setUser(newUser);
        setPermissions(newPerms || []);
        return res.data;
    };

    const logout = async () => {
        try {
            await api.post('/logout');
        } catch (error) {
            console.error(error);
        } finally {
            localStorage.removeItem('auth_token');
            delete api.defaults.headers.common['Authorization'];
            setUser(null);
            setPermissions([]);
        }
    };

    const hasPermission = (permissionName) => {
        return permissions.includes(permissionName);
    };

    return (
        <AuthContext.Provider value={{ user, permissions, loading, login, register, logout, hasPermission }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
