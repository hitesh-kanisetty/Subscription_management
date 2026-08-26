export default function Footer() {
  return (
    <footer
      id="contact"
      className="site-footer"
    >
      <div className="container footer-grid">

        <div className="footer-brand-section">

          <a
            href="#home"
            className="brand"
            aria-label="SubFlow home"
          >
            <span className="brand-mark">
              <img
                src="/subflow-logo.png"
                alt="SubFlow logo"
              />
            </span>

            <span>SubFlow</span>
          </a>

          <p>
            A simple platform to manage subscriptions,
            payments, customers, and renewals in one place.
          </p>

        </div>

        <div className="footer-column">

          <h4>Quick Links</h4>

          <a href="#home">
            Home
          </a>

          <a href="#features">
            Features
          </a>

          <a href="#journey">
            How It Works
          </a>

          <a href="#get-started">
            Get Started
          </a>

        </div>

        <div className="footer-column">

          <h4>Features</h4>

          <a href="#features">
            Plan Management
          </a>

          <a href="#features">
            Customer Management
          </a>

          <a href="#features">
            Billing & Payments
          </a>

          <a href="#features">
            Revenue Analytics
          </a>

        </div>

        <div className="footer-column">

          <h4>Contact</h4>

          <a href="mailto:support@shnoor.com">
            support@shnoor.com
          </a>

          <a href="tel:+911234567890">
            +91 12345 67890
          </a>

          <span>
            India
          </span>

        </div>

      </div>

      <div className="container footer-bottom">

        <p>
          © 2026 SubFlow. All rights reserved.
        </p>

        <div>
          <a href="#home">
            Privacy
          </a>

          <a href="#home">
            Terms
          </a>
        </div>

      </div>
    </footer>
  );
}