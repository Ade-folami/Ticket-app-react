import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { User, Lock, LogIn, UserPlus, Zap, AlertTriangle } from "lucide-react";
import "./AuthPage.css";
// import "./testAuth.css";

// --- MOCK AUTHENTICATION LOGIC  ---
const USER_STORAGE_KEY = "ticketapp_users";
const loadUsers = () => {
  const usersJson = localStorage.getItem(USER_STORAGE_KEY);
  let users = usersJson ? JSON.parse(usersJson) : {};
  if (!users["admin"]) {
    users["admin"] = "password";
  }
  return users;
};
const saveUsers = (users) => {
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(users));
};
const auth = {
  isAuthenticated: () => !!localStorage.getItem("ticketapp_session"),
  login: (username, password) => {
    const users = loadUsers();
    if (users[username] && users[username] === password) {
      const token =
        "mock-session-token-" + Math.random().toString(36).substring(2, 9);
      localStorage.setItem("ticketapp_session", token);
      return { success: true, message: "Login successful!" };
    }
    return { success: false, message: "Invalid username or password." };
  },
  signup: (username, password) => {
    const users = loadUsers();
    if (username.length < 3 || password.length < 6) {
      return {
        success: false,
        message: "Username must be at least 3 chars and password at least 6.",
      };
    }
    if (username === "admin" || users[username]) {
      return { success: false, message: "Username already taken or reserved." };
    }
    users[username] = password;
    saveUsers(users);
    const token =
      "mock-session-token-" + Math.random().toString(36).substring(2, 20);
    localStorage.setItem("ticketapp_session", token);
    return {
      success: true,
      message: "Signup successful! Redirecting to Dashboard...",
    };
  },
  logout: () => {
    localStorage.removeItem("ticketapp_session");
  },
};

// --- UI Component for displaying alerts/toasts ---
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`toast toast--${type}`}>
      {type === "success" && <Zap size={20} className="toast__icon" />}
      {type === "error" && <AlertTriangle size={20} className="toast__icon" />}
      {message}
    </div>
  );
};

// --- Main Authentication Page Component  ---
const AuthPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [toast, setToast] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();

  const isLoginPage = location.pathname.includes("/login");

  useEffect(() => {
    if (auth.isAuthenticated()) {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!username || !password) {
      setToast({
        message: "Please enter both username and password.",
        type: "error",
      });
      return;
    }

    let result = isLoginPage
      ? auth.login(username, password)
      : auth.signup(username, password);

    if (result.success) {
      setToast({ message: result.message, type: "success" });
      setTimeout(() => navigate("/dashboard", { replace: true }), 1000);
    } else {
      setToast({ message: result.message, type: "error" });
    }
  };

  const formTitle = isLoginPage ? "Welcome Back" : "Create Account";
  const submitButtonText = isLoginPage ? "Log In" : "Sign Up";
  const SubmitIcon = isLoginPage ? LogIn : UserPlus;

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-title">{formTitle}</h1>
          <p className="auth-subtitle">Access your Ticket Manager</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {/* Username Input */}
          <div className="input-group">
            <User size={20} className="input-icon" />
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input-field"
              required
            />
          </div>

          {/* Password Input */}
          <div className="input-group">
            <Lock size={20} className="input-icon" />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              required
            />
          </div>

          {/* Submit Button */}
          <button type="submit" className="submit-button">
            <SubmitIcon size={20} className="submit-icon" />
            {submitButtonText}
          </button>
        </form>

        {/* Navigation Link */}
        <div className="auth-footer">
          {isLoginPage ? (
            <p>
              Don't have an account?{" "}
              <Link to="/auth/signup" className="auth-link">
                Sign Up
              </Link>
            </p>
          ) : (
            <p>
              Already have an account?{" "}
              <Link to="/auth/login" className="auth-link">
                Log In
              </Link>
            </p>
          )}
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default AuthPage;
