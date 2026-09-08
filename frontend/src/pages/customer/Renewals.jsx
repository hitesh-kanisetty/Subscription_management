import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  RefreshCw,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  Clock3,
} from "lucide-react";

import "./Renewals.css";

export default function Renewals() {
  const navigate = useNavigate();

  const [subscription, setSubscription] =
    useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchRenewal = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          "http://localhost:5000/subscription",
          {
            method: "GET",
            credentials: "include",
          }
        );

        const data = await response.json();

        if (!response.ok) {
          setError(
            data.message ||
              "Unable to load renewal information."
          );
          return;
        }

        setSubscription(data.subscription);
      } catch (error) {
        console.error(
          "Fetch renewal error:",
          error
        );

        setError(
          "Unable to connect to the server."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchRenewal();
  }, []);

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  const getDaysRemaining = (date) => {
    const today = new Date();
    const renewalDate = new Date(date);

    today.setHours(0, 0, 0, 0);
    renewalDate.setHours(0, 0, 0, 0);

    const difference =
      renewalDate.getTime() -
      today.getTime();

    return Math.ceil(
      difference /
        (1000 * 60 * 60 * 24)
    );
  };

  const getRenewalState = () => {
    if (!subscription) {
      return {
        label: "Unavailable",
        className: "unavailable",
        description:
          "No subscription renewal information is available.",
      };
    }

    if (subscription.status === "CANCELLED") {
      return {
        label: "Cancelled",
        className: "cancelled",
        description:
          "Your subscription has been cancelled.",
      };
    }

    if (subscription.status === "EXPIRED") {
      return {
        label: "Expired",
        className: "expired",
        description:
          "Your subscription has expired.",
      };
    }

    const daysRemaining =
      getDaysRemaining(
        subscription.renewalDate
      );

    if (daysRemaining < 0) {
      return {
        label: "Past Renewal Date",
        className: "expired",
        description:
          "Your subscription has passed its renewal date.",
      };
    }

    if (daysRemaining === 0) {
      return {
        label: "Renewal Due Today",
        className: "warning",
        description:
          "Your subscription is due for renewal today.",
      };
    }

    if (daysRemaining <= 7) {
      return {
        label: "Renewing Soon",
        className: "warning",
        description:
          `Your subscription renews in ${daysRemaining} day${
            daysRemaining === 1
              ? ""
              : "s"
          }.`,
      };
    }

    return {
      label: "Active",
      className: "active",
      description:
        `Your subscription is active and renews in ${daysRemaining} days.`,
    };
  };

  if (loading) {
    return (
      <div className="customer-renewals-page">
        <div className="customer-renewals-message">
          Loading renewal information...
        </div>
      </div>
    );
  }

  if (error || !subscription) {
    return (
      <div className="customer-renewals-page">
        <header className="customer-renewals-header">
          <div>
            <p className="customer-renewals-eyebrow">
              RENEWALS
            </p>

            <h1>Renewals</h1>

            <p className="customer-renewals-description">
              View your subscription renewal
              information and status.
            </p>
          </div>
        </header>

        <div className="customer-renewals-empty">
          <div className="customer-renewals-empty-icon">
            <RefreshCw size={24} />
          </div>

          <h2>No renewal information</h2>

          <p>
            {error === "No subscription found"
              ? "You don't have an active subscription to renew."
              : error ||
                "No renewal information is available."}
          </p>

          <button
            type="button"
            onClick={() =>
              navigate("/user/plans")
            }
          >
            Browse Plans
          </button>
        </div>
      </div>
    );
  }

  const renewalState = getRenewalState();

  const daysRemaining =
    getDaysRemaining(
      subscription.renewalDate
    );

  const isActive =
    subscription.status === "ACTIVE";

  return (
    <div className="customer-renewals-page">
      {/* Header */}
      <header className="customer-renewals-header">
        <div>
          <p className="customer-renewals-eyebrow">
            RENEWALS
          </p>

          <h1>Renewals</h1>

          <p className="customer-renewals-description">
            View your subscription renewal
            information and status.
          </p>
        </div>

        <button
          type="button"
          className="customer-renewals-back"
          onClick={() =>
            navigate("/user/subscription")
          }
        >
          <ArrowLeft size={15} />
          Subscription
        </button>
      </header>

      {/* Renewal Status */}
      <section className="customer-renewals-status-card">
        <div className="customer-renewals-status-top">
          <div>
            <p className="customer-renewals-label">
              RENEWAL STATUS
            </p>

            <h2>{renewalState.label}</h2>

            <p>
              {renewalState.description}
            </p>
          </div>

          <span
            className={`customer-renewals-badge ${renewalState.className}`}
          >
            {renewalState.className ===
            "active" ? (
              <CheckCircle2 size={14} />
            ) : (
              <Clock3 size={14} />
            )}

            {renewalState.label}
          </span>
        </div>

        {isActive && (
          <div className="customer-renewals-countdown">
            <div className="customer-renewals-countdown-icon">
              <RefreshCw size={19} />
            </div>

            <div>
              <span>
                NEXT RENEWAL
              </span>

              <strong>
                {daysRemaining > 0
                  ? `${daysRemaining} day${
                      daysRemaining ===
                      1
                        ? ""
                        : "s"
                    } remaining`
                  : daysRemaining === 0
                  ? "Due today"
                  : "Past due"}
              </strong>
            </div>
          </div>
        )}
      </section>

      {/* Subscription Renewal Details */}
      <section className="customer-renewals-card">
        <div className="customer-renewals-section-heading">
          <div>
            <p className="customer-renewals-label">
              SUBSCRIPTION
            </p>

            <h2>Renewal Details</h2>

            <p>
              Details of your current
              subscription renewal.
            </p>
          </div>

          <RefreshCw size={20} />
        </div>

        <div className="customer-renewals-details">
          <div>
            <div className="customer-renewals-detail-icon">
              <CreditCard size={17} />
            </div>

            <span>
              <small>Plan</small>

              <strong>
                {subscription.plan.name}
              </strong>
            </span>
          </div>

          <div>
            <div className="customer-renewals-detail-icon">
              <IndianRupeeIcon />
            </div>

            <span>
              <small>Amount</small>

              <strong>
                ₹
                {Number(
                  subscription.plan.price
                ).toLocaleString("en-IN")}
                /
                {subscription.plan
                  .billingPeriod ===
                "YEARLY"
                  ? "year"
                  : "month"}
              </strong>
            </span>
          </div>

          <div>
            <div className="customer-renewals-detail-icon">
              <CalendarDays size={17} />
            </div>

            <span>
              <small>Started</small>

              <strong>
                {formatDate(
                  subscription.startDate
                )}
              </strong>
            </span>
          </div>

          <div>
            <div className="customer-renewals-detail-icon">
              <RefreshCw size={17} />
            </div>

            <span>
              <small>Renewal Date</small>

              <strong>
                {formatDate(
                  subscription.renewalDate
                )}
              </strong>
            </span>
          </div>
        </div>
      </section>

      {/* Renewal Information */}
      <section className="customer-renewals-card">
        <div className="customer-renewals-section-heading">
          <div>
            <p className="customer-renewals-label">
              RENEWAL INFORMATION
            </p>

            <h2>What happens next?</h2>
          </div>

          <CalendarDays size={20} />
        </div>

        <div className="customer-renewals-info">
          <div className="customer-renewals-info-item">
            <span className="customer-renewals-info-number">
              01
            </span>

            <div>
              <strong>
                Current subscription remains active
              </strong>

              <p>
                Your current plan remains active
                until the renewal date shown above.
              </p>
            </div>
          </div>

          <div className="customer-renewals-info-item">
            <span className="customer-renewals-info-number">
              02
            </span>

            <div>
              <strong>
                Renewal date is tracked
              </strong>

              <p>
                Your renewal date is maintained
                as part of your subscription.
              </p>
            </div>
          </div>

          <div className="customer-renewals-info-item">
            <span className="customer-renewals-info-number">
              03
            </span>

            <div>
              <strong>
                Manage your subscription
              </strong>

              <p>
                You can review your subscription
                and available plans from the
                subscription section.
              </p>
            </div>
          </div>
        </div>

        <div className="customer-renewals-actions">
          <button
            type="button"
            onClick={() =>
              navigate("/user/subscription")
            }
          >
            View Subscription
          </button>

          <button
            type="button"
            className="secondary"
            onClick={() =>
              navigate("/user/plans")
            }
          >
            View Plans
          </button>
        </div>
      </section>
    </div>
  );
}

function IndianRupeeIcon() {
  return (
    <span className="customer-renewals-rupee">
      ₹
    </span>
  );
}