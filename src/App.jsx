import { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import LandingPage from "./LandingPage";
import AuthPage from "./AuthPage";
// import Dashboard from "./Dashboard";
// import TicketManagement from "./TicketManagement";
import "./App.css";

//Mock function for checking auth status
const isAuthenticated = () => {
  return localStorage.getItem("ticketapp_session") !== null;
};

//Wrapper comment for protected routes
const ProtetedRoute = ({ element: Component, ...rest }) => {
  return isAuthenticated() ? Component : <Navigate to="/auth/login" replace />;
};

const App = () => {
  return (
    <Router>
      <div className="app-container">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth/:type" element={<AuthPage />} />{" "}
          {/* type will be 'login' or 'signup' */}
          {/*Protected Routes */}
          <Route
            path="/dashboard"
            element={<ProtectedRoute element={<Dashboard />} />}
          />
          <Route
            path="/tickets"
            element={<ProtectedRoute element={<TicketManagement />} />}
          />
          {/*Fallback/Catch-all route*/}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
