import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../../components/landing/Navbar";
import Footer from "../../components/landing/Footer";
import "./signup.css";
import API_URL from "../../config";

export default function SignupPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
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
    setSuccess("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Registration failed");
        return;
      }

      setSuccess(data.message || "Account created successfully");

      setTimeout(() => {
        navigate("/login");
      }, 1000);
    } catch (error) {
      console.error("Signup error:", error);
      setError("Unable to connect to the server");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = () => {
    window.location.href = `${API_URL}/auth/google`;
  };

  return (
    <main className="signup-page">
      <Navbar />

      <section className="signup-shell" aria-labelledby="signup-title">
        <aside className="signup-aside">
          <p className="signup-eyebrow">YOUR SUBSCRIPTION LIFECYCLE</p>

          <h2>From first plan to renewal, made clear.</h2>

          <div className="signup-steps">
            <span>
              <b>01</b> Choose a plan
            </span>

            <span>
              <b>02</b> Subscribe
            </span>

            <span>
              <b>03</b> Manage everything
            </span>

            <span>
              <b>04</b> Grow with confidence
            </span>
          </div>
        </aside>

        <div className="signup-card">
          <p className="signup-card-label">START WITH SUBFLOW</p>

          <h1 id="signup-title">Build a better subscription business.</h1>

          <p className="signup-muted">
            Create your workspace and bring every recurring operation into one
            clear place.
          </p>

          <form className="signup-form" onSubmit={handleSubmit}>
            <label htmlFor="signup-name">Full name</label>

            <input
              id="signup-name"
              name="name"
              type="text"
              placeholder="Your name"
              autoComplete="name"
              value={formData.name}
              onChange={handleChange}
              required
            />

            <label htmlFor="signup-email">Work email</label>

            <input
              id="signup-email"
              name="email"
              type="email"
              placeholder="you@company.com"
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
              required
            />

            <label htmlFor="signup-password">Create password</label>

            <input
              id="signup-password"
              name="password"
              type="password"
              placeholder="At least 8 characters"
              autoComplete="new-password"
              minLength={8}
              value={formData.password}
              onChange={handleChange}
              required
            />

            <label className="signup-check">
              <input type="checkbox" required />

              <span>
                I agree to the <Link to="#terms">Terms</Link> and{" "}
                <Link to="#privacy">Privacy Policy</Link>.
              </span>
            </label>

            {error && <p className="auth-error">{error}</p>}

            {success && <p className="auth-success">{success}</p>}

            <button
              type="submit"
              className="signup-button"
              disabled={loading}
            >
              {loading ? "Creating Account..." : "Create Account"}
              {!loading && <span aria-hidden="true">→</span>}
            </button>
          </form>

          <div className="auth-divider">
            <span>OR</span>
          </div>

          <button
            type="button"
            className="google-button"
            onClick={handleGoogleSignup}
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

          <p className="signup-switch">
            Already have an account? <Link to="/login">Log in</Link>
          </p>
        </div>
      </section>

      <Footer />
    </main>
  );
}