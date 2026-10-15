import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Spin } from 'antd';

const ProtectedRoute = ({ children }) => {
  const { user } = useContext(AuthContext);

  if (user === undefined) {
    return <div className="min-h-screen flex items-center justify-center"><Spin size="large" /></div>;
  }

  if (user) {
    return children ? children : <Outlet />;
  }

  return <Navigate to="/" replace />;
};

export default ProtectedRoute;
