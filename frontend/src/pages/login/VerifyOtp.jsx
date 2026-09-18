import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Navbar from "../../components/landing/Navbar";
import Footer from "../../components/landing/Footer";
import "./login.css";
import API_URL from "../../config";

export default function VerifyOtpPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const email = location.state?.email || "";

  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/verify-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          otp,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
  if (data.attemptsExceeded) {
    navigate("/forgot-password");
    return;
  }

  if (data.attemptsRemaining) {
    setError(
      `Invalid OTP. You have ${data.attemptsRemaining} attempt${
        data.attemptsRemaining === 1 ? "" : "s"
      } left.`
    );
    return;
  }

  setError(data.message || "Invalid OTP");
  return;
}

      navigate("/reset-password", {
        state: {
          email,
          otp,
        },
      });
    } catch (error) {
      console.error("OTP verification error:", error);
      setError("Unable to connect to the server");
    } finally {
      setLoading(false);
    }
  };

  if (!email) {
    return (
      <main className="auth-page">
        <Navbar />

        <section className="auth-shell" aria-labelledby="verify-otp-title">
          <div className="auth-card">
            <p className="auth-card-label">PASSWORD RESET</p>

            <h2 id="verify-otp-title">Session expired</h2>

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

      <section className="auth-shell" aria-labelledby="verify-otp-title">
        <div className="auth-intro">
          <p className="auth-eyebrow">
            ACCOUNT RECOVERY
          </p>

          <h1>
            Verify your <span>identity.</span>
          </h1>

          <p>
            Enter the one-time password we sent to your registered
            email address.
          </p>

          <div className="auth-note">
            <strong>Check your inbox.</strong>
            <span>
              The OTP is valid for a limited time.
            </span>
          </div>
        </div>

        <div className="auth-card">
          <p className="auth-card-label">OTP VERIFICATION</p>

          <h2 id="verify-otp-title">
            Enter your OTP
          </h2>

          <p className="auth-muted">
            We sent a 6-digit OTP to <strong>{email}</strong>
          </p>

          <form className="auth-form" onSubmit={handleSubmit}>
            <label htmlFor="otp">
              One-time password
            </label>

            <input
              id="otp"
              name="otp"
              type="text"
              inputMode="numeric"
              maxLength="6"
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChange={(e) =>
                setOtp(e.target.value.replace(/\D/g, ""))
              }
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
              {loading ? "Verifying..." : "Verify OTP"}
              {!loading && <span aria-hidden="true">→</span>}
            </button>
          </form>

          <p className="auth-switch">
            Entered the wrong email?{" "}
            <Link to="/forgot-password">
              Start again
            </Link>
          </p>
        </div>
      </section>

      <Footer />
    </main>
  );
}