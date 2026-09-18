import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Navbar from "../../components/landing/Navbar";
import Footer from "../../components/landing/Footer";
import "./login.css";
import API_URL from "../../config";

export default function ResetPasswordPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const email = location.state?.email || "";
  const otp = location.state?.otp || "";

  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (formData.newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          otp,
          newPassword: formData.newPassword,
          confirmPassword: formData.confirmPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Unable to reset password");
        return;
      }

      setSuccess(data.message);

      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (error) {
      console.error("Reset password error:", error);
      setError("Unable to connect to the server");
    } finally {
      setLoading(false);
    }
  };

  if (!email || !otp) {
    return (
      <main className="auth-page">
        <Navbar />

        <section className="auth-shell" aria-labelledby="reset-password-title">
          <div className="auth-card">
            <p className="auth-card-label">PASSWORD RESET</p>

            <h2 id="reset-password-title">
              Reset session expired
            </h2>

            <p className="auth-muted">
              Please request a new OTP to continue.
            </p>

            <Link to="/forgot-password" className="auth-button">
              Request New OTP
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </section>

        <Footer />
      </main>
    );
  }

  return (
    <main className="auth-page">
      <Navbar />

      <section className="auth-shell" aria-labelledby="reset-password-title">
        <div className="auth-intro">
          <p className="auth-eyebrow">
            ACCOUNT RECOVERY
          </p>

          <h1>
            Create a <span>new password.</span>
          </h1>

          <p>
            Choose a new password for your SubFlow account.
          </p>

          <div className="auth-note">
            <strong>Keep your account secure.</strong>
            <span>
              Use a password with at least 8 characters.
            </span>
          </div>
        </div>

        <div className="auth-card">
          <p className="auth-card-label">PASSWORD RESET</p>

          <h2 id="reset-password-title">
            Set new password
          </h2>

          <p className="auth-muted">
            Create a new password for <strong>{email}</strong>
          </p>

          <form className="auth-form" onSubmit={handleSubmit}>
            <label htmlFor="new-password">
              New password
            </label>

            <input
              id="new-password"
              name="newPassword"
              type="password"
              placeholder="Enter new password"
              autoComplete="new-password"
              value={formData.newPassword}
              onChange={handleChange}
              required
            />

            <label htmlFor="confirm-password">
              Confirm password
            </label>

            <input
              id="confirm-password"
              name="confirmPassword"
              type="password"
              placeholder="Confirm new password"
              autoComplete="new-password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />

            {error && (
              <p className="auth-error">
                {error}
              </p>
            )}

            {success && (
              <p className="auth-success">
                {success}
              </p>
            )}

            <button
              type="submit"
              className="auth-button"
              disabled={loading}
            >
              {loading ? "Resetting..." : "Reset Password"}
              {!loading && <span aria-hidden="true">→</span>}
            </button>
          </form>

          <p className="auth-switch">
            Remember your password?{" "}
            <Link to="/login">Log in</Link>
          </p>
        </div>
      </section>

      <Footer />
    </main>
  );
}