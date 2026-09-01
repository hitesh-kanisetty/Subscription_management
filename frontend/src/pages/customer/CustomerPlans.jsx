import { useEffect, useState } from "react";
import { Check, ArrowRight } from "lucide-react";

import "./CustomerPlans.css";

export default function CustomerPlans() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Temporary until Subscription table is implemented
  const currentPlan = "Super";

  const fetchPlans = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "http://localhost:5000/plans",
        {
          method: "GET",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.message || "Unable to load plans."
        );
        return;
      }

      // Only show active plans to customers
      const activePlans = (data.plans || []).filter(
        (plan) => plan.isActive
      );

      setPlans(activePlans);
    } catch (error) {
      console.error("Fetch customer plans error:", error);

      setError(
        "Unable to connect to the server."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleSelectPlan = (plan) => {
    console.log("Selected plan:", plan.name);

    // Actual subscription functionality
    // will be implemented later.
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
            {plans.length}{" "}
            {plans.length === 1
              ? "plan available"
              : "plans available"}
          </span>
        </div>

        {/* Loading */}
        {loading && (
          <div className="customer-plans-message">
            Loading plans...
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="customer-plans-message customer-plans-error">
            {error}
          </div>
        )}

        {/* Empty */}
        {!loading &&
          !error &&
          plans.length === 0 && (
            <div className="customer-plans-message">
              No subscription plans are currently
              available.
            </div>
          )}

        {/* Plan Cards */}
        {!loading &&
          !error &&
          plans.length > 0 && (
            <div className="customer-plans-grid">
              {plans.map((plan) => {
                const isCurrent =
                  plan.name === currentPlan;

                return (
                  <article
                    className={`customer-plan-card ${
                      isCurrent
                        ? "customer-plan-current"
                        : ""
                    }`}
                    key={plan.id}
                  >
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
                      <strong>
                        ₹
                        {Number(
                          plan.price
                        ).toLocaleString("en-IN")}
                      </strong>

                      <span>
                        /
                        {plan.billingPeriod ===
                        "YEARLY"
                          ? "year"
                          : "month"}
                      </span>
                    </div>

                    {/* Features */}
                    <div className="customer-plan-features">
                      <p>What's included</p>

                      <ul>
                        {plan.features.map(
                          (feature) => (
                            <li key={feature}>
                              <span className="customer-feature-check">
                                <Check size={13} />
                              </span>

                              <span>
                                {feature}
                              </span>
                            </li>
                          )
                        )}
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
          )}
      </section>
    </div>
  );
}