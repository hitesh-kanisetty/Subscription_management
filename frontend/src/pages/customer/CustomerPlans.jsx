import { useEffect, useState } from "react";
import { Check, ArrowRight, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

import "./CustomerPlans.css";
import API_URL from "../../config";

export default function CustomerPlans() {
  const navigate = useNavigate();

  const [plans, setPlans] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchPlans = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/plans`, {
        method: "GET",
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Unable to load plans.");
        return;
      }

      // Only show active plans to customers
      const activePlans = (data.plans || []).filter((plan) => plan.isActive);

      setPlans(activePlans);
    } catch (error) {
      console.error("Fetch customer plans error:", error);

      setError("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscription = async () => {
    try {
      setSubscriptionLoading(true);

      const response = await fetch(`${API_URL}/subscription`, {
        method: "GET",
        credentials: "include",
      });

      const data = await response.json();

      // 404 means the customer has no subscription
      if (response.status === 404) {
        setSubscription(null);
        return;
      }

      if (!response.ok) {
        console.error("Fetch subscription error:", data.message);
        return;
      }

      setSubscription(data.subscription);
    } catch (error) {
      console.error("Fetch customer subscription error:", error);
    } finally {
      setSubscriptionLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
    fetchSubscription();
  }, []);

 
const hasActiveSubscription = subscription?.status === "ACTIVE";

const currentPlan = hasActiveSubscription
  ? subscription?.plan || null
  : null;


  const handleSelectPlan = (plan) => {
    navigate(`/user/plans/${plan.id}`);
  };

  const getPlanActionLabel = (plan) => {
    if (!currentPlan) {
      return "Choose plan";
    }

    if (plan.id === currentPlan.id) {
      return "Current plan";
    }

    if (isPendingPlan(plan)) {
      return "Scheduled next";
    }

    if (hasPendingDowngrade) {
      return "Change scheduled";
    }

    const currentPrice = Number(currentPlan.price);
    const selectedPrice = Number(plan.price);

    if (selectedPrice > currentPrice) {
      return `Upgrade to ${plan.name}`;
    }

    if (selectedPrice < currentPrice) {
      return `Downgrade to ${plan.name}`;
    }

    return `Switch to ${plan.name}`;
  };

  const isCurrentPlan = (plan) => {
    return currentPlan?.id === plan.id;
  };

  const hasPendingDowngrade =
  hasActiveSubscription && Boolean(subscription?.pendingPlanId);

  const isPendingPlan = (plan) => {
    return (
      hasPendingDowngrade &&
      Number(subscription.pendingPlanId) === Number(plan.id)
    );
  };

  const isUpgradePlan = (plan) => {
    if (!currentPlan) {
      return false;
    }

    return Number(plan.price) > Number(currentPlan.price);
  };

  return (
    <div className="customer-plans-page">
      {/* Header */}
      <header className="customer-plans-header">
        <div>
          <p className="customer-plans-eyebrow">SUBSCRIPTION</p>

          <h1>Plans</h1>

          <p className="customer-plans-description">
            Choose the subscription plan that best fits your business needs.
          </p>
        </div>

        <button
          type="button"
          className="customer-plans-back"
          onClick={() => navigate("/user")}
          aria-label="Back to Dashboard"
        >
          <ArrowLeft size={15} />
          <span>Back to Dashboard</span>
        </button>
      </header>

      {/* Current Plan */}
      <section className="customer-current-plan">
        <div>
          <span className="customer-current-label">CURRENT PLAN</span>

          {subscriptionLoading ? (
            <>
              <h2>Loading...</h2>

              <p>Checking your current subscription.</p>
            </>
          ) : currentPlan ? (
            <>
              <h2>{currentPlan.name} Plan</h2>

              <p>
                You are currently subscribed to the {currentPlan.name} plan.
              </p>

              {subscription.pendingPlan && (
                <p className="customer-pending-downgrade">
                  Downgrade scheduled to {subscription.pendingPlan.name} on{" "}
                  {new Date(subscription.renewalDate).toLocaleDateString(
                    "en-IN",
                  )}
                  .
                </p>
              )}
            </>
          ) : (
            <>
  <h2>No active plan</h2>

  <p>
    {subscription?.status === "CANCELLED"
      ? "Your previous subscription was cancelled. Choose a plan below to subscribe again."
      : "You do not currently have an active subscription."}
  </p>
</>
          )}
        </div>

        {!subscriptionLoading && currentPlan && (
          <span className="customer-current-status">{subscription.status}</span>
        )}
        
      </section>

      {/* Plans */}
      <section className="customer-plans-section">
        <div className="customer-plans-section-heading">
          <div>
            <p className="customer-plans-eyebrow">AVAILABLE PLANS</p>

            <h2>Choose your plan</h2>
          </div>

          <span className="customer-plans-count">
            {plans.length}{" "}
            {plans.length === 1 ? "plan available" : "plans available"}
          </span>
        </div>

        {/* Loading */}
        {loading && (
          <div className="customer-plans-message">Loading plans...</div>
        )}

        {/* Error */}
        {error && (
          <div className="customer-plans-message customer-plans-error">
            {error}
          </div>
        )}

        {/* Empty */}
        {!loading && !error && plans.length === 0 && (
          <div className="customer-plans-message">
            No subscription plans are currently available.
          </div>
        )}

        {/* Plan Cards */}
        {!loading && !error && plans.length > 0 && (
          <div className="customer-plans-grid">
            {plans.map((plan) => {
              const isCurrent = isCurrentPlan(plan);
              const isPending = isPendingPlan(plan);
              const actionLabel = getPlanActionLabel(plan);

              return (
                <article
                  className={`customer-plan-card ${
                    isCurrent ? "customer-plan-current" : ""
                  } ${isPending ? "customer-plan-pending" : ""}`}
                  key={plan.id}
                >
                  {/* Plan Header */}
                  
{/* Plan Header */}
<div className="customer-plan-header">
  <h3>{plan.name}</h3>

  {isCurrent && (
    <span className="customer-plan-active">
      Current plan
    </span>
  )}

  {isPending && (
    <span className="customer-plan-scheduled-badge">
      Scheduled next
    </span>
  )}
</div>


                  <p className="customer-plan-description">
                    {plan.description}
                  </p>

                  {/* Price */}
                  <div className="customer-plan-price">
                    <strong>
                      ₹{Number(plan.price).toLocaleString("en-IN")}
                    </strong>

                    <span>
                      /{plan.billingPeriod === "YEARLY" ? "year" : "month"}
                    </span>
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
                      isCurrent ? "customer-plan-button-current" : ""
                    } ${
                      !isCurrent && currentPlan
                        ? "customer-plan-button-change"
                        : ""
                    }`}
                    disabled={
                      isCurrent || subscriptionLoading || hasPendingDowngrade
                    }
                    onClick={() => {
                      if (!isCurrent && !subscriptionLoading) {
                        handleSelectPlan(plan);
                      }
                    }}
                  >
                    <span>{actionLabel}</span>

                    {!isCurrent && <ArrowRight size={15} />}
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
