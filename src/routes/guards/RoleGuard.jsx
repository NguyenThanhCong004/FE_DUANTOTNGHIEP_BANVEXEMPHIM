import React from 'react';
import { Navigate } from 'react-router-dom';

const RoleGuard = ({ children, allowedRoles }) => {
  // Mock user role - changed to 'SUPER_ADMIN' for testing
  const userRole = 'SUPER_ADMIN'; 


  if (!allowedRoles.includes(userRole)) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default RoleGuard;
