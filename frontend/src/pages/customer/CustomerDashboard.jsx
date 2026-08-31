import { useOutletContext } from "react-router-dom";
import {
  Bell,
  Plus,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  CreditCard,
} from "lucide-react";

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
export default function CustomerDashboard() {
  const { user } = useOutletContext();

  const greeting = getGreeting();
  const currentDate = getFormattedDate();
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
          <button
            type="button"
            className="notification-button"
            aria-label="Notifications"
          >
            <Bell size={19} />

            <span className="notification-dot" />
          </button>

          <button
            type="button"
            className="primary-button"
          >
            <Plus size={17} />

            <span>Manage subscription</span>
          </button>
        </div>
      </header>

      {/* Summary */}
      <section className="summary-grid">
        <article className="summary-card">
          <div className="summary-card-top">
            <span>Current plan</span>

            <CreditCard size={17} />
          </div>

          <strong>Super</strong>

          <span className="summary-secondary">
            Active subscription
          </span>
        </article>

        <article className="summary-card">
          <div className="summary-card-top">
            <span>Monthly payment</span>

            <CreditCard size={17} />
          </div>

          <strong>₹89,000</strong>

          <span className="summary-secondary">
            Billed monthly
          </span>
        </article>

        <article className="summary-card">
          <div className="summary-card-top">
            <span>Subscription status</span>

            <CheckCircle2 size={17} />
          </div>

          <strong>Active</strong>

          <span className="summary-success">
            Subscription is active
          </span>
        </article>

        <article className="summary-card">
          <div className="summary-card-top">
            <span>Next renewal</span>

            <CalendarDays size={17} />
          </div>

          <strong>Sep 08</strong>

          <span className="summary-secondary">
            8 days remaining
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

            <h3>Super Plan</h3>

            <p>
              Your subscription is active and running
              normally.
            </p>
          </div>

          <div className="subscription-details">
            <div>
              <span>PRICE</span>

              <strong>₹89,000 / month</strong>
            </div>

            <div>
              <span>STARTED</span>

              <strong>Aug 08, 2026</strong>
            </div>

            <div>
              <span>RENEWAL</span>

              <strong>Sep 08, 2026</strong>
            </div>

            <div>
              <span>STATUS</span>

              <strong className="status-active">
                Active
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
            >
              View renewals
              <ArrowRight size={16} />
            </button>
          </div>

          <div className="renewal-item">
            <div className="renewal-date">
              <CalendarDays size={15} />

              <strong>08</strong>

              <span>SEP</span>
            </div>

            <div className="renewal-info">
              <strong>Super Plan renewal</strong>

              <span>
                Your subscription will renew on
                September 08, 2026.
              </span>

              <small>
                Amount: ₹89,000
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
            >
              <span className="quick-action-icon">
                <Plus size={18} />
              </span>

              <span className="quick-action-content">
                <strong>Change plan</strong>

                <small>
                  Explore available subscription plans
                </small>
              </span>

              <ArrowRight size={16} />
            </button>

            <button
              type="button"
              className="quick-action"
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
            >
              <span className="quick-action-icon">
                <CheckCircle2 size={18} />
              </span>

              <span className="quick-action-content">
                <strong>Account settings</strong>

                <small>
                  Manage your profile and preferences
                </small>
              </span>

              <ArrowRight size={16} />
            </button>
          </div>
        </section>
      </div>
    </>
  );
}