import { Check, ArrowRight } from "lucide-react";

import "./CustomerPlans.css";

const plans = [
  {
    id: 1,
    name: "Basic",
    price: "₹24,000",
    description: "For individuals and small teams getting started.",
    features: [
      "Up to 5 users",
      "Basic subscription management",
      "Email support",
      "Monthly billing",
    ],
  },
  {
    id: 2,
    name: "Super",
    price: "₹89,000",
    description: "For growing businesses that need more flexibility.",
    popular: true,
    features: [
      "Up to 25 users",
      "Advanced subscription management",
      "Priority support",
      "Monthly and yearly billing",
    ],
  },
  {
    id: 3,
    name: "Expert",
    price: "₹2,40,000",
    description: "For organizations with advanced subscription needs.",
    features: [
      "Unlimited users",
      "Advanced analytics",
      "Dedicated support",
      "Custom billing options",
    ],
  },
];

export default function CustomerPlans() {
  const currentPlan = "Super";

  const handleSelectPlan = (plan) => {
    console.log("Selected plan:", plan.name);
  };

  return (
    <div className="customer-plans-page">
      {/* Header */}
      <header className="customer-plans-header">
        <div>
          <p className="customer-plans-eyebrow">
            SUBSCRIPTION
          </p>

          <h1>Plans</h1>

          <p className="customer-plans-description">
            Choose the subscription plan that best fits
            your business needs.
          </p>
        </div>
      </header>

      {/* Current Plan */}
      <section className="customer-current-plan">
        <div>
          <span className="customer-current-label">
            CURRENT PLAN
          </span>

          <h2>{currentPlan} Plan</h2>

          <p>
            You are currently subscribed to the{" "}
            {currentPlan} plan.
          </p>
        </div>

        <span className="customer-current-status">
          Active
        </span>
      </section>

      {/* Plans */}
      <section className="customer-plans-section">
        <div className="customer-plans-section-heading">
          <div>
            <p className="customer-plans-eyebrow">
              AVAILABLE PLANS
            </p>

            <h2>Choose your plan</h2>
          </div>

          <span className="customer-plans-count">
            {plans.length} plans available
          </span>
        </div>

        <div className="customer-plans-grid">
          {plans.map((plan) => {
            const isCurrent = plan.name === currentPlan;

            return (
              <article
                className={`customer-plan-card ${
                  plan.popular
                    ? "customer-plan-popular"
                    : ""
                } ${
                  isCurrent
                    ? "customer-plan-current"
                    : ""
                }`}
                key={plan.id}
              >
                {plan.popular && (
                  <span className="customer-plan-badge">
                    MOST POPULAR
                  </span>
                )}

                {/* Plan Header */}
                <div className="customer-plan-header">
                  <h3>{plan.name}</h3>

                  {isCurrent && (
                    <span className="customer-plan-active">
                      Current plan
                    </span>
                  )}
                </div>

                <p className="customer-plan-description">
                  {plan.description}
                </p>

                {/* Price */}
                <div className="customer-plan-price">
                  <strong>{plan.price}</strong>

                  <span>/month</span>
                </div>

                {/* Features */}
                <div className="customer-plan-features">
                  <p>What's included</p>

                  <ul>
                    {plan.features.map((feature) => (
                      <li key={feature}>
                        <span className="customer-feature-check">
                          <Check size={13} />
                        </span>

                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Action */}
                <button
                  type="button"
                  className={`customer-plan-button ${
                    isCurrent
                      ? "customer-plan-button-current"
                      : ""
                  }`}
                  disabled={isCurrent}
                  onClick={() =>
                    handleSelectPlan(plan)
                  }
                >
                  <span>
                    {isCurrent
                      ? "Current plan"
                      : "Choose plan"}
                  </span>

                  {!isCurrent && (
                    <ArrowRight size={15} />
                  )}
                </button>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}