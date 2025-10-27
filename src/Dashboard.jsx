import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./Dashboard.css";

//Mock function to check authentication
const isAuthenticated = () => {
  return localStorage.getItem("ticketapp_session") !== null;
};

//Mock data for dashboard statistics
const MOCK_STATS = [
  { title: "Total Tickets", value: 125, color: "#4f46e5" },
  { title: "Open Tickets", value: 32, color: "#10b981" },
  { title: "In Progress", value: 15, color: "#f59e0b" },
  { title: "Resolved Tickets", value: 78, color: "#6b7280" },
];

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    //Security check and initial data load
    if (!isAuthenticated()) {
      navigate("/auth/login", { replace: true });
      return;
    }

    //Simulate API call to fetch dashboard data
    const fetchData = () => {
      setLoading(true);
      setError(null);
      try {
        //Mock successful network/API call
        setTimeout(() => {
          setStats(MOCK_STATS);
          setLoading(false);
        }, 500);
      } catch (err) {
        //Simulate Failed network/API call
        setError("Failed to load tickets. Please retry");
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("ticketapp_session");
    showToast("You have been logged out successfully", false);
    navigate("/", { replace: true });
  };

  const showToast = (message, isError = false) => {
    console.log(`Toast: ${message} (Error: ${isError})`);
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-state">Loading dashboard data...</div>
      </div>
    );
  }
  return (
    <div className="dashboard-container">
      {/* Dashboard Header/Navbar*/}
      <header className="dashboard-header">
        <h1 className="logo">TicketApp Dashboard</h1>
        <nav className="dashboard-nav">
          <Link to="/tickets" className="nav-link-btn">
            Ticket Management
          </Link>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </nav>
      </header>

      <main className="dashboard-main">
        {/*Error handling for failed API calls */}
        {error && (
          <div className="api-error-alert">
            {error}{" "}
            <button
              onClick={() => window.location.reload()}
              className="retry-btn"
            >
              Retry
            </button>
          </div>
        )}

        {/*Summary Statistics */}
        <section className="stats-section">
          <h2>Summary Statistics</h2>
          <div className="stats-grid">
            {stats.map((stat, index) => (
              <div className="stat-card">
                <p className="stat-title">{stat.title}</p>
                <p className="stat-value" style={{ color: stat.color }}>
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/*Quick Actions */}
        <section className="quick-actions-section">
          <h2>Quick Actions</h2>
          <div className="action-grid">
            <Link to="/tickets" className="action-card action-create">
              Create New TIcket
            </Link>
            <Link to="/tickets" className="action-card action-view">
              View all Tickets
            </Link>
          </div>
        </section>
      </main>

      <footer className="footer">
        &copy; {new Date().getFullYear()} TicketApp. All rights reserved.
      </footer>
    </div>
  );
};

export default Dashboard;
