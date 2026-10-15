import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Spin } from 'antd';

const RoleRoute = ({ allowedRoles, children }) => {
  const { user } = useContext(AuthContext);

  if (user === undefined) {
    return <div className="min-h-[400px] flex items-center justify-center"><Spin size="large" /></div>;
  }

  if (user && allowedRoles.includes(user.role)) {
    return children;
  }

  // If role is not authorized for this specific section, redirect to common dashboard
  return <Navigate to="/admin/dashboard" replace />;
};

export default RoleRoute;
