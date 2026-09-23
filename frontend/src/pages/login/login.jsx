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

  const handleGoogleLogin = () => {
    window.location.href = `${API_URL}/auth/google`;
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

              <Link to="/forgot-password">Forgot password?</Link>
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

            {error && <p className="auth-error">{error}</p>}

            <button
              type="submit"
              className="auth-button"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Log In"}
              {!loading && <span aria-hidden="true">→</span>}
            </button>
          </form>

          <div className="auth-divider">
            <span>OR</span>
          </div>

          <button
            type="button"
            className="google-button"
            onClick={handleGoogleLogin}
          >
            <span className="google-icon" aria-hidden="true">
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fill="#4285F4"
      d="M21.35 12.27c0-.78-.07-1.54-.22-2.27H12v4.3h5.24a4.48 4.48 0 0 1-1.94 2.94v2.45h3.14c1.84-1.69 2.91-4.18 2.91-7.42Z"
    />
    <path
      fill="#34A853"
      d="M12 21.75c2.63 0 4.84-.87 6.45-2.36l-3.14-2.45c-.87.58-1.98.92-3.31.92-2.54 0-4.69-1.72-5.46-4.03H3.3v2.53A9.75 9.75 0 0 0 12 21.75Z"
    />
    <path
      fill="#FBBC05"
      d="M6.54 13.83A5.86 5.86 0 0 1 6.23 12c0-.64.11-1.26.31-1.83V7.64H3.3A9.75 9.75 0 0 0 2.25 12c0 1.57.38 3.05 1.05 4.36l3.24-2.53Z"
    />
    <path
      fill="#EA4335"
      d="M12 6.14c1.43 0 2.71.49 3.72 1.45l2.79-2.79C16.83 3.23 14.63 2.25 12 2.25A9.75 9.75 0 0 0 3.3 7.64l3.24 2.53c.77-2.31 2.92-4.03 5.46-4.03Z"
    />
  </svg>
</span>

            <span>Continue with Google</span>
          </button>

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