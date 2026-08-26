import {
  ArrowRight,
  Check,
  MoveUpRight,
} from "lucide-react";

const lifecycleSteps = [
  "Choose a Plan",
  "Subscribe",
  "Payment",
  "Manage Subscription",
  "Renewal",
  "Notifications",
];

export default function Hero() {
  return (
    <section
      id="home"
      className="hero section-rule"
    >
      <div className="container hero-grid">

        <div className="hero-content">

          <div className="eyebrow">
            <span />
            Subscription operations, simplified
          </div>

          <h1>
            Manage subscriptions.
            <br />
            <strong>Grow your business.</strong>
          </h1>

          <p className="hero-copy">
            Manage plans, customers, billing, payments,
            renewals, and subscription analytics from one
            powerful platform.
          </p>

          <div className="button-row">

            <a
              href="#get-started"
              className="button"
            >
              Get Started
              <ArrowRight size={16} />
            </a>

            <a
              href="#features"
              className="button button-outline"
            >
              Explore Features
              <MoveUpRight size={15} />
            </a>

          </div>

        </div>

        <div className="lifecycle-card">

          <div className="card-heading">

            <div>
              <p className="mono-label">
                SUBSCRIPTION LIFECYCLE
              </p>

              <p className="card-title">
                Your journey with SubFlow
              </p>
            </div>

            <span className="check">
              <Check size={15} />
            </span>

          </div>

          <div className="lifecycle-list">

            {lifecycleSteps.map((step, index) => (
              <div
                className="lifecycle-item"
                key={step}
              >
                <span className="step-dot">
                  {index + 1}
                </span>

                <span>{step}</span>
              </div>
            ))}

          </div>

        </div>

      </div>
    </section>
  );
}