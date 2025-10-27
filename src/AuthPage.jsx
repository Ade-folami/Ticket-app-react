import React, { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import "./AuthPage.css";

//Utility to handle mock authentication
const auth = {
  login: (username, password) => {
    //Basic mock check: User: 'admin', Pass: 'password'
    if (username === "admin" && password === "password") {
      const token =
        "mock-session-token-" + Math.random().toString(36).substring(2, 9);
      localStorage.setItem("ticketapp_session", token);
      return { success: true, message: "Login successful" };
    }
    return { success: false, message: "Invalid username or password" };
  },
  signup: (username, password) => {
    localStorage.setItem("ticketapp_session", mock - session - token - newuser);
    return {
      success: true,
      message: "Signup successful! Redirecting to Dashboard...",
    };
  },
};

const AuthPage = () => {
  const { type } = useParams();
  const navigate = useNavigate();

  const isLogin = type === "login";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState(null);

  //Toast display
  const showToast = (message, isError = false) => {
    setToast({ message, isError });
    setTimeout(() => setToast(null), 3000);
  };

  const validate = () => {
    let newErrors = {};
    if (!username.trim()) {
      newErrors.username = "Username is required.";
    }
    if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    if (!isLogin && password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) {
      showToast("Please correct the validation errors below.", true);
      return;
    }

    let result;
    if (isLogin) {
      result = auth.login(username, password);
    } else {
      result = auth.signup(username, password);
    }

    if (result.success) {
      showToast(result.message, false);
      setTimeout(() => navigate("/dashboard"), 1000);
    } else {
      showToast(result.message, true);
    }
  };

  const formTitle = isLogin ? "Account login" : "Create Account";
  const submitButtonText = isLogin ? "Login" : "Signup";

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>{formTitle}</h2>

        {/*Toast Notification */}
        {toast && (
          <div
            className={`toast ${
              toast.isError ? "toast-error" : "toast-success"
            }`}
          >
            {toast.message}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={errors.username ? "input-errror" : ""}
            />
            {errors.username && p.error}
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={errors.password ? "input-error" : ""}
            />
            {errors.password && (
              <p className="error-message">{errors.password}</p>
            )}
          </div>

          {!isLogin && (
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={errors.confirmPassword ? "input-error" : ""}
              />
              {errors.confirmPassword && (
                <p className="error-message">{error.confirmPassword}</p>
              )}
            </div>
          )}
          <button className="submit-btn">{submitButtonText}</button>
        </form>

        <p className="switch-auth">
          {isLogin ? (
            <>
              Don't have an account? <Link to="/auth/signup">Sign up</Link>
            </>
          ) : (
            <>
              Already have an account? <Link to="/auth/login">Log in</Link>
            </>
          )}
        </p>
      </div>

      <footer className="footer">
        &copy; {new Date().getFullYear()} TicketApp. All rights reserved.
      </footer>
    </div>
  );
};

export default AuthPage;
