import React from 'react';
import { Navigate } from 'react-router-dom';

const RoleGuard = ({ children, allowedRoles }) => {
  // Mock user role - change this to 'ADMIN', 'STAFF', 'SUPER_ADMIN', or 'USER' to test
  const userRole = 'USER'; 

  if (!allowedRoles.includes(userRole)) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default RoleGuard;
