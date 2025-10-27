import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import LandingPage from "./LandingPage";
import AuthPage from "./AuthPage";
import Dashboard from "./Dashboard";
import TicketManagement from "./TicketManagement";
import ProtectedRoute from "./ProtectedRoute";
import "./index.css";

const App = () => {
  return (
    <Routes>
      {/*Route 1: Landing Page */}
      <Route path="/" element={<LandingPage />} />

      {/*Route 2: Authentication Pages */}
      <Route path="/auth/:type" element={<AuthPage />} />

      {/*Route 3: Dashboard */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      {/*Route 4: Ticket Management */}
      <Route
        path="/tickets"
        element={
          <ProtectedRoute>
            <TicketManagement />
          </ProtectedRoute>
        }
      />

      {/*Route 5: Catch-all for 404 Not found */}
      <Route
        path="*"
        element={
          <div style={{ padding: "50px", textAlign: "center" }}>
            <h1>404 Not Found</h1>
            <p>The page you are looking for does not exist.</p>
            <Link to="/">Go Home</Link>
          </div>
        }
      />
    </Routes>
  );
};

//Render the application
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
