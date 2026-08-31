import {
  Plus,
  Pencil,
  Trash2,
  Users,
  Check,
} from "lucide-react";

import "./admin_plans.css";

const plans = [
  {
    id: 1,
    name: "Basic",
    description: "For individuals and small teams getting started.",
    price: "₹24,000",
    billing: "per month",
    subscribers: 128,
    status: "Active",
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
    description: "For growing businesses that need more flexibility.",
    price: "₹89,000",
    billing: "per month",
    subscribers: 342,
    status: "Active",
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
    description: "For organizations with advanced subscription needs.",
    price: "₹2,40,000",
    billing: "per month",
    subscribers: 814,
    status: "Active",
    features: [
      "Unlimited users",
      "Advanced analytics",
      "Dedicated support",
      "Custom billing options",
    ],
  },
];

export default function AdminPlans() {
  const handleCreatePlan = () => {
    console.log("Create plan");
  };

  const handleEditPlan = (plan) => {
    console.log("Edit plan:", plan.name);
  };

  const handleDeletePlan = (plan) => {
    console.log("Delete plan:", plan.name);
  };

  return (
    <div className="plans-page">
      {/* Page Header */}
      <header className="plans-header">
        <div>
          <p className="plans-eyebrow">MANAGEMENT</p>

          <h1>Plans & Subscriptions</h1>

          <p className="plans-description">
            Manage subscription plans, pricing, features, and
            customer subscriptions.
          </p>
        </div>

        <button
          type="button"
          className="plans-create-button"
          onClick={handleCreatePlan}
        >
          <Plus size={17} />
          <span>Create plan</span>
        </button>
      </header>

      {/* Plan Summary */}
      <section className="plans-summary">
        <div className="plans-summary-card">
          <span>Total plans</span>
          <strong>3</strong>
        </div>

        <div className="plans-summary-card">
          <span>Active subscribers</span>
          <strong>1,284</strong>
        </div>

        <div className="plans-summary-card">
          <span>Monthly recurring revenue</span>
          <strong>₹84,620</strong>
        </div>
      </section>

      {/* Plans */}
      <section className="plans-section">
        <div className="plans-section-heading">
          <div>
            <p className="plans-eyebrow">AVAILABLE PLANS</p>

            <h2>Subscription plans</h2>
          </div>

          <span className="plans-count">
            {plans.length} plans
          </span>
        </div>

        <div className="plans-grid">
          {plans.map((plan) => (
            <article
              className={`plan-card ${
                plan.popular ? "popular" : ""
              }`}
              key={plan.id}
            >
              {/* Popular badge */}
              {plan.popular && (
                <div className="popular-badge">
                  MOST POPULAR
                </div>
              )}

              {/* Card Header */}
              <div className="plan-card-header">
                <div>
                  <h3>{plan.name}</h3>

                  <p>{plan.description}</p>
                </div>

                <span
                  className={`plan-status ${
                    plan.status.toLowerCase()
                  }`}
                >
                  {plan.status}
                </span>
              </div>

              {/* Price */}
              <div className="plan-price">
                <strong>{plan.price}</strong>

                <span>/{plan.billing.replace("per ", "")}</span>
              </div>

              {/* Subscribers */}
              <div className="plan-subscribers">
                <Users size={16} />

                <span>
                  <strong>{plan.subscribers}</strong>{" "}
                  active subscribers
                </span>
              </div>

              {/* Features */}
              <div className="plan-features">
                <p>What's included</p>

                <ul>
                  {plan.features.map((feature) => (
                    <li key={feature}>
                      <span className="feature-check">
                        <Check size={13} />
                      </span>

                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Actions */}
              <div className="plan-actions">
                <button
                  type="button"
                  className="plan-edit-button"
                  onClick={() => handleEditPlan(plan)}
                >
                  <Pencil size={15} />
                  <span>Edit plan</span>
                </button>

                <button
                  type="button"
                  className="plan-delete-button"
                  onClick={() => handleDeletePlan(plan)}
                  aria-label={`Delete ${plan.name} plan`}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}