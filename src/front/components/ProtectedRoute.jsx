import { Navigate, Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';

const ProtectedRoute = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(localStorage.getItem('token') !== null);

    useEffect(() => {
        const recheck = () => setIsAuthenticated(localStorage.getItem('token') !== null);
        window.addEventListener('loginChange', recheck);
        window.addEventListener('storage', recheck);
        return () => {
            window.removeEventListener('loginChange', recheck);
            window.removeEventListener('storage', recheck);
        };
    }, []);

    return isAuthenticated ? <Outlet /> : <Navigate to="/login-register" replace />;
};

export default ProtectedRoute;