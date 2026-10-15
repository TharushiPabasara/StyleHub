import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Spin } from 'antd';

const AdminRoute = () => {
  const { user } = useContext(AuthContext);

  if (user === undefined) {
    return <div className="min-h-screen flex items-center justify-center"><Spin size="large" /></div>;
  }

  // Check if user exists and has an admin/staff role
  const staffRoles = ['developer', 'owner', 'inventory_handler', 'sales_staff'];
  if (user && staffRoles.includes(user.role)) {
    return <Outlet />;
  }

  // If not logged in or not admin, redirect to home
  return <Navigate to="/" replace />;
};

export default AdminRoute;
