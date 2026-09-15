import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../../components/landing/Navbar";
import Footer from "../../components/landing/Footer";
import "./login.css";
import API_URL from "../../config";
export default function LoginPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

  setError("");
  setLoading(true);

  try {
    const response = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(formData),
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data.message || "Login failed");
      return;
    }

    // Admin
    if (data.role === "ADMIN") {
      navigate("/admin", {
        state: {
          user: data.user,
        },
      });
      return;
    }

    // Customer
    if (data.role === "CUSTOMER") {
      navigate("/user", {
        state: {
          user: data.user,
        },
      });
      return;
    }

    setError("Invalid user role");
  } catch (error) {
    console.error("Login error:", error);
    setError("Unable to connect to the server");
  } finally {
    setLoading(false);
  }
};

  return (
    <main className="auth-page">
      <Navbar />

      <section className="auth-shell" aria-labelledby="login-title">
        <div className="auth-intro">
          <p className="auth-eyebrow">
            SUBSCRIPTION OPERATIONS, SIMPLIFIED
          </p>

          <h1>
            Welcome back to <span>SubFlow.</span>
          </h1>

          <p>
            Pick up where you left off and keep your subscription business
            moving forward.
          </p>

          <div className="auth-note">
            <strong>One clear workspace.</strong>
            <span>
              Plans, customers, billing, and renewals—always within reach.
            </span>
          </div>
        </div>

        <div className="auth-card">
          <p className="auth-card-label">ACCOUNT ACCESS</p>

          <h2 id="login-title">Log in to your account</h2>

          <p className="auth-muted">
            Enter your details to continue to SubFlow.
          </p>

          <form className="auth-form" onSubmit={handleSubmit}>
            <label htmlFor="login-email">Email address</label>

            <input
              id="login-email"
              name="email"
              type="email"
              placeholder="you@company.com"
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
              required
            />

            <div className="label-row">
              <label htmlFor="login-password">Password</label>

              <Link to="#forgot">Forgot password?</Link>
            </div>

            <input
              id="login-password"
              name="password"
              type="password"
              placeholder="Enter your password"
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange}
              required
            />

            {error && (
              <p className="auth-error">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="auth-button"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Log In"}
              {!loading && <span aria-hidden="true">→</span>}
            </button>
          </form>

          <p className="auth-switch">
            New to SubFlow?{" "}
            <Link to="/signup">Create an account</Link>
          </p>
        </div>
      </section>

      <Footer />
    </main>
  );
}