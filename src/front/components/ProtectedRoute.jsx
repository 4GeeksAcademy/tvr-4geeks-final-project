import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = () => {
    const isAuthenticated = sessionStorage.getItem('token') !== null;
    
    return isAuthenticated ? <Outlet /> : < Navigate to="/Login_Register" replace />;
};

export default ProtectedRoute;