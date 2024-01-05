import React from 'react';
import { Navigate } from 'react-router-dom';

export const ProtectedRoute = ({ isAuthenticated, children }) => {
    const storedIsAuthenticated = localStorage.getItem('isAuthenticated');
    const expiryTime = localStorage.getItem('authExpiry');

    // Check both the prop and the stored value
    const isAuthValid = storedIsAuthenticated === 'true' && new Date().getTime() < parseInt(expiryTime, 10);

    if (!isAuthenticated && !isAuthValid) {
        return <Navigate to="/marrojo2023" />;
    }

    return children;
};