import React from 'react';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const userString = localStorage.getItem('user');
  let user = null;
  
  try {
    user = userString ? JSON.parse(userString) : null;
  } catch (error) {
    console.error('Error parsing user data:', error);
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const userRole = user.rol?.toLowerCase();
  
  if (!userRole || !allowedRoles.includes(userRole)) {
    console.log('Access denied. User role:', userRole, 'Required roles:', allowedRoles);
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute; 