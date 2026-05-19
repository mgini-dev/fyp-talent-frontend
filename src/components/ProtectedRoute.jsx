import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Skeleton } from 'antd';

const ProtectedRoute = ({ requiredPermission }) => {
    const { user, loading, hasPermission } = useAuth();

    if (loading) {
        return <div style={{ padding: 50 }}><Skeleton active paragraph={{ rows: 10 }} /></div>;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (requiredPermission && !hasPermission(requiredPermission)) {
        return <Navigate to="/" replace />; // Redirect to dashboard if they lack permission
    }

    return <Outlet />;
};

export default ProtectedRoute;
