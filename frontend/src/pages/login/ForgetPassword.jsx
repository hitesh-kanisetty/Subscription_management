import { useState } from "react";
import { Link ,useNavigate} from "react-router-dom";
import Navbar from "../../components/landing/Navbar";
import Footer from "../../components/landing/Footer";
import "./login.css";
import API_URL from "../../config";

export default function ForgotPasswordPage() {
    const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Unable to send OTP");
        return;
      }

      setMessage(data.message);

setTimeout(() => {
  navigate("/verify-otp", {
    state: {
      email: email.trim(),
    },
  });
}, 1000);
    } catch (error) {
      console.error("Forgot password error:", error);
      setError("Unable to connect to the server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <Navbar />

      <section className="auth-shell" aria-labelledby="forgot-password-title">
        <div className="auth-intro">
          <p className="auth-eyebrow">
            ACCOUNT RECOVERY
          </p>

          <h1>
            Reset your <span>SubFlow.</span>
          </h1>

          <p>
            Enter your registered email address and we'll send you a
            one-time password to reset your account.
          </p>

          <div className="auth-note">
            <strong>Secure account recovery.</strong>
            <span>
              Your OTP will expire after a few minutes for security.
            </span>
          </div>
        </div>

        <div className="auth-card">
          <p className="auth-card-label">PASSWORD RESET</p>

          <h2 id="forgot-password-title">
            Forgot your password?
          </h2>

          <p className="auth-muted">
            Enter your email address to receive an OTP.
          </p>

          <form className="auth-form" onSubmit={handleSubmit}>
            <label htmlFor="forgot-email">
              Email address
            </label>

            <input
              id="forgot-email"
              name="email"
              type="email"
              placeholder="you@company.com"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            {error && (
              <p className="auth-error">
                {error}
              </p>
            )}

            {message && (
              <p className="auth-success">
                {message}
              </p>
            )}

            <button
              type="submit"
              className="auth-button"
              disabled={loading}
            >
              {loading ? "Sending OTP..." : "Send OTP"}
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