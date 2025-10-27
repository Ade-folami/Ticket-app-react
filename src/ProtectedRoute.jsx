import React from "react";
import { Navigate } from "react-router-dom";

//Mock function for checking authentication status
const isAuthenticated = () => {
  return localStorage.getItem("ticketapp_session") !== null;
};

const ProtectedRoute = ({ children }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/auth/login" replace />;
  }
  return children;
};

export default ProtectedRoute;
