import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../../components/landing/Navbar";
import Footer from "../../components/landing/Footer";
import "./signup.css";

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
      const response = await fetch("http://localhost:5000/signup", {
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

      // For now, go to login after successful registration
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

            <button type="submit" className="signup-button" disabled={loading}>
              {loading ? "Creating Account..." : "Create Account"}
              {!loading && <span aria-hidden="true">→</span>}
            </button>
          </form>

          <p className="signup-switch">
            Already have an account? <Link to="/login">Log in</Link>
          </p>
        </div>
      </section>

      <Footer />
    </main>
  );
}
