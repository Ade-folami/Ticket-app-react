import React from "react";
import { Link } from "react-router-dom";
import "./LandingPage.css";

const LandingPage = () => {
  return (
    <>
      <div className="landing-page">
        {/* Header */}
        <header className="header">
          <div className="logo">TicketApp</div>
          <nav className="nav-links">
            <Link to="/">Home</Link>
            <Link to="/auth/login">Login</Link>
          </nav>
        </header>

        {/* Hero Section */}
        <section className="hero-section">
          <div className="decor-circle-hero"></div> {/*Decorative circle */}
          <div className="hero-content">
            <h1>The Ultimate Ticket Management Solution</h1>
            <p>
              Streamline your support, development, and operational tasks with a
              single, powerful platform.
            </p>
            <div className="cta-buttons">
              <Link to="/auth/login" className="login-btn">
                Login
              </Link>
              <Link to="/auth/signup" className="get-started-btn">
                Get started
              </Link>
            </div>
          </div>
          <div className="wave-bg"></div> {/*Wavy Background */}
        </section>

        {/*Features Section */}
        <section className="features-section">
          <div className="decor-circle-features"></div>{" "}
          {/*Another decorative circle */}
          <h2>Core Features</h2>
          <div className="features-grid">
            {/*Feature box 1 (box- shaped with shadow and rounded corners  */}
            <div className="feature-box">
              <h3>Full CRUD</h3>
              <p>
                Create, Read, Update and Delete tickets with real-time feedback
                and validation
              </p>
            </div>

            {/*Feature box 2 */}
            <div className="feature0-bo">
              <h3>Protected Routes</h3>
              <p>
                Secure access to your dashboard and ticket screens using session
                tokens{" "}
              </p>
            </div>

            {/*Feature box 3 */}
            <div className="feature-box">
              <h3>Consistent UI</h3>
              <p>
                A unified, responsive design across all devices and pages for a
                seamless experience{" "}
              </p>
            </div>
          </div>
        </section>

        {/*Footer */}
        <footer className="footer">
          &copy; {new Date().getFullYear()} TicketApp. All rights reserved.
        </footer>
      </div>
    </>
  );
};

export default LandingPage;
