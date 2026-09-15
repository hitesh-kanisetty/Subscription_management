import { useEffect, useState } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import NotificationBell from "../../components/NotificationBell";
import {
  Plus,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  CreditCard,
} from "lucide-react";
import API_URL from "../../config";
import "./customerDashboard.css";

function getGreeting() {
  const hour = new Date().getHours();

  if (hour < 12) {
    return "Good morning";
  }

  if (hour < 18) {
    return "Good afternoon";
  }

  return "Good evening";
}

function getFormattedDate() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatDate(date) {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatShortDate(date) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
  });
}

function getDaysRemaining(date) {
  const today = new Date();
  const renewal = new Date(date);

  today.setHours(0, 0, 0, 0);
  renewal.setHours(0, 0, 0, 0);

  const difference = renewal - today;

  return Math.max(
    0,
    Math.ceil(difference / (1000 * 60 * 60 * 24))
  );
}

function formatPrice(price) {
  return `₹${Number(price).toLocaleString("en-IN")}`;
}

export default function CustomerDashboard() {
  const { user } = useOutletContext();
  const navigate = useNavigate();

  const greeting = getGreeting();
  const currentDate = getFormattedDate();

  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_URL}/subscription`,
          {
            method: "GET",
            credentials: "include",
          }
        );

        const data = await response.json();

        if (!response.ok) {
          if (response.status === 404) {
            setSubscription(null);
            return;
          }

          setError(
            data.message || "Unable to load subscription."
          );
          return;
        }

        setSubscription(data.subscription);
      } catch (error) {
        console.error(
          "Fetch dashboard subscription error:",
          error
        );

        setError("Unable to connect to the server.");
      } finally {
        setLoading(false);
      }
    };

    fetchSubscription();
  }, []);

  const plan = subscription?.plan;
  const daysRemaining = subscription
    ? getDaysRemaining(subscription.renewalDate)
    : 0;

  const billingLabel =
    plan?.billingPeriod === "YEARLY"
      ? "Billed yearly"
      : "Billed monthly";

  const priceLabel = plan
  ? plan.billingPeriod === "YEARLY"
    ? `${formatPrice(plan.price)} / year`
    : `${formatPrice(plan.price)} / month`
  : "—";
  return (
    <>
      {/* Header */}
      <header className="customer-header">
        <div className="header-content">
          <p className="dashboard-eyebrow">
            {currentDate.toUpperCase()}
          </p>

          <h1>
            {greeting}, {user?.name}.
          </h1>

          <p className="header-description">
            Here's an overview of your subscription and
            account activity.
          </p>
        </div>

        <div className="header-actions">
          <NotificationBell />

          <button
            type="button"
            className="primary-button"
            onClick={() => navigate("/user/plans")}
          >
            <Plus size={17} />

            <span>Manage subscription</span>
          </button>
        </div>
      </header>

      {/* Loading */}
      {loading ? (
        <div className="dashboard-card">
          <div className="customer-subscription-message">
            Loading subscription...
          </div>
        </div>
      ) : error ? (
        <div className="dashboard-card">
          <div className="customer-subscription-message">
            {error}
          </div>
        </div>
      ) : !subscription ? (
        <>
          {/* No Subscription */}
          <section className="summary-grid">
            <article className="summary-card">
              <div className="summary-card-top">
                <span>Current plan</span>
                <CreditCard size={17} />
              </div>

              <strong>No plan</strong>

              <span className="summary-secondary">
                No active subscription
              </span>
            </article>

            <article className="summary-card">
              <div className="summary-card-top">
                <span>Payment</span>
                <CreditCard size={17} />
              </div>

              <strong>—</strong>

              <span className="summary-secondary">
                No payment yet
              </span>
            </article>

            <article className="summary-card">
              <div className="summary-card-top">
                <span>Subscription status</span>
                <CheckCircle2 size={17} />
              </div>

              <strong>Not active</strong>

              <span className="summary-secondary">
                Choose a plan to get started
              </span>
            </article>

            <article className="summary-card">
              <div className="summary-card-top">
                <span>Next renewal</span>
                <CalendarDays size={17} />
              </div>

              <strong>—</strong>

              <span className="summary-secondary">
                No renewal scheduled
              </span>
            </article>
          </section>

          <section className="dashboard-card subscription-card">
            <div className="section-heading">
              <div>
                <p className="section-eyebrow">
                  CURRENT SUBSCRIPTION
                </p>

                <h2>Your subscription</h2>
              </div>

              <button
                type="button"
                className="text-link"
                onClick={() => navigate("/user/plans")}
              >
                Browse plans
                <ArrowRight size={16} />
              </button>
            </div>

            <div className="current-subscription">
              <div className="subscription-plan-icon">
                <CreditCard size={20} />
              </div>

              <div className="subscription-main-info">
                <span className="small-label">
                  CURRENT PLAN
                </span>

                <h3>No active subscription</h3>

                <p>
                  Choose a subscription plan to get started.
                </p>
              </div>
            </div>
          </section>
        </>
      ) : (
        <>
          {/* Summary */}
          <section className="summary-grid">
            <article className="summary-card">
              <div className="summary-card-top">
                <span>Current plan</span>

                <CreditCard size={17} />
              </div>

              <strong>{plan?.name}</strong>

              <span className="summary-secondary">
                Active subscription
              </span>
            </article>

            <article className="summary-card">
              <div className="summary-card-top">
                <span>
                  {plan?.billingPeriod === "YEARLY"
                    ? "Yearly payment"
                    : "Monthly payment"}
                </span>

                <CreditCard size={17} />
              </div>

              <strong>{formatPrice(plan?.price)}</strong>

              <span className="summary-secondary">
                {billingLabel}
              </span>
            </article>

            <article className="summary-card">
              <div className="summary-card-top">
                <span>Subscription status</span>

                <CheckCircle2 size={17} />
              </div>

              <strong>
                {subscription.status}
              </strong>

              <span className="summary-success">
                Subscription is active
              </span>
            </article>

            <article className="summary-card">
              <div className="summary-card-top">
                <span>Next renewal</span>

                <CalendarDays size={17} />
              </div>

              <strong>
                {formatShortDate(subscription.renewalDate)}
              </strong>

              <span className="summary-secondary">
                {daysRemaining === 0
                  ? "Renewal due today"
                  : `${daysRemaining} days remaining`}
              </span>
            </article>
          </section>

          {/* Current Subscription */}
          <section className="dashboard-card subscription-card">
            <div className="section-heading">
              <div>
                <p className="section-eyebrow">
                  CURRENT SUBSCRIPTION
                </p>

                <h2>Your subscription</h2>
              </div>

              <button
                type="button"
                className="text-link"
                onClick={() =>
                  navigate("/user/subscription")
                }
              >
                View details
                <ArrowRight size={16} />
              </button>
            </div>

            <div className="current-subscription">
              <div className="subscription-plan-icon">
                <CreditCard size={20} />
              </div>

              <div className="subscription-main-info">
                <span className="small-label">
                  CURRENT PLAN
                </span>

                <h3>{plan?.name} Plan</h3>

                <p>
                  {plan?.description ||
                    "Your subscription is active and running normally."}
                </p>
              </div>

              <div className="subscription-details">
                <div>
                  <span>PRICE</span>

                  <strong>{priceLabel}</strong>
                </div>

                <div>
                  <span>STARTED</span>

                  <strong>
                    {formatDate(subscription.startDate)}
                  </strong>
                </div>

                <div>
                  <span>RENEWAL</span>

                  <strong>
                    {formatDate(subscription.renewalDate)}
                  </strong>
                </div>

                <div>
                  <span>STATUS</span>

                  <strong className="status-active">
                    {subscription.status}
                  </strong>
                </div>
              </div>
            </div>
          </section>

          {/* Bottom Grid */}
          <div className="dashboard-bottom-grid">
            {/* Upcoming Renewal */}
            <section className="dashboard-card renewal-card">
              <div className="section-heading">
                <div>
                  <p className="section-eyebrow">
                    UPCOMING
                  </p>

                  <h2>Next renewal</h2>
                </div>

                <button
                  type="button"
                  className="text-link"
                  onClick={() =>
                    navigate("/user/renewals")
                  }
                >
                  View renewals
                  <ArrowRight size={16} />
                </button>
              </div>

              <div className="renewal-item">
                <div className="renewal-date">
                  <CalendarDays size={15} />

                  <strong>
                    {new Date(
                      subscription.renewalDate
                    ).getDate()}
                  </strong>

                  <span>
                    {new Date(
                      subscription.renewalDate
                    )
                      .toLocaleDateString("en-US", {
                        month: "short",
                      })
                      .toUpperCase()}
                  </span>
                </div>

                <div className="renewal-info">
                  <strong>
                    {plan?.name} Plan renewal
                  </strong>

                  <span>
                    Your subscription will renew on{" "}
                    {formatDate(
                      subscription.renewalDate
                    )}
                    .
                  </span>

                  <small>
                    Amount: {formatPrice(plan?.price)}
                  </small>
                </div>

                <span className="renewal-badge">
                  Upcoming
                </span>
              </div>
            </section>

            {/* Quick Actions */}
            <section className="dashboard-card quick-actions-card">
              <div className="section-heading">
                <div>
                  <p className="section-eyebrow">
                    ACCOUNT
                  </p>

                  <h2>Quick actions</h2>
                </div>
              </div>

              <div className="quick-actions-list">
                <button
                  type="button"
                  className="quick-action"
                  onClick={() =>
                    navigate("/user/plans")
                  }
                >
                  <span className="quick-action-icon">
                    <Plus size={18} />
                  </span>

                  <span className="quick-action-content">
                    <strong>Change plan</strong>

                    <small>
                      Explore available subscription
                      plans
                    </small>
                  </span>

                  <ArrowRight size={16} />
                </button>

                <button
                  type="button"
                  className="quick-action"
                  onClick={() =>
                    navigate("/user/billing")
                  }
                >
                  <span className="quick-action-icon">
                    <CreditCard size={18} />
                  </span>

                  <span className="quick-action-content">
                    <strong>Payment details</strong>

                    <small>
                      View your billing information
                    </small>
                  </span>

                  <ArrowRight size={16} />
                </button>

                <button
                  type="button"
                  className="quick-action"
                  onClick={() =>
                    navigate("/user/profile")
                  }
                >
                  <span className="quick-action-icon">
                    <CheckCircle2 size={18} />
                  </span>

                  <span className="quick-action-content">
                    <strong>Account settings</strong>

                    <small>
                      Manage your profile and
                      preferences
                    </small>
                  </span>

                  <ArrowRight size={16} />
                </button>
              </div>
            </section>
          </div>
        </>
      )}
    </>
  );
}