import React from 'react';


import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ user, role, children }) => {
  if (!user) {
    return <Navigate to="/" />;
  }
  if (role && user.role !== role) {  // Asegúrate de que esté accediendo a `user.role`, no `user.permissions?.role`
    return <Navigate to="/user" />;
  }
  return children;
};
export default ProtectedRoute;
