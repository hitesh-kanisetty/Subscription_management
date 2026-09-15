import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  CalendarDays,
  RefreshCw,
  FileText,
} from "lucide-react";
import API_URL from "../../config";
import "./CustomerSubscription.css";

export default function CustomerSubscription() {
  const navigate = useNavigate();

  const [subscription, setSubscription] =
    useState(null);

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
          setError(
            data.message ||
              "Unable to load subscription."
          );
          return;
        }

        setSubscription(data.subscription);
      } catch (error) {
        console.error(
          "Fetch subscription error:",
          error
        );

        setError(
          "Unable to connect to the server."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchSubscription();
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

  if (loading) {
    return (
      <div className="customer-subscription-page">
        <div className="customer-subscription-message">
          Loading subscription...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="customer-subscription-page">
        <header className="customer-subscription-header">
          <div>
            <p className="customer-subscription-eyebrow">
              SUBSCRIPTION
            </p>

            <h1>My Subscription</h1>
          </div>
        </header>

        <div className="customer-subscription-empty">
          <div className="customer-subscription-empty-icon">
            <CreditCard size={24} />
          </div>

          <h2>No active subscription</h2>

          <p>
            {error === "No subscription found"
              ? "You haven't subscribed to a plan yet."
              : error}
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

  return (
    <div className="customer-subscription-page">
      {/* Header */}
      <header className="customer-subscription-header">
        <div>
          <p className="customer-subscription-eyebrow">
            SUBSCRIPTION
          </p>

          <h1>My Subscription</h1>

          <p className="customer-subscription-description">
            View your current subscription,
            renewal details, and payment
            information.
          </p>
        </div>

        <button
          type="button"
          className="customer-subscription-back"
          onClick={() =>
            navigate("/user/plans")
          }
        >
          <ArrowLeft size={15} />
          Plans
        </button>
      </header>

      {/* Current Subscription */}
      <section className="customer-subscription-card">
        <div className="customer-subscription-card-header">
          <div>
            <p className="customer-subscription-label">
              CURRENT PLAN
            </p>

            <h2>
              {subscription.plan.name} Plan
            </h2>

            <p>
              {subscription.plan.description}
            </p>
          </div>

          <span className="customer-subscription-status">
            <CheckCircle2 size={14} />
            {subscription.status}
          </span>
        </div>

        <div className="customer-subscription-price">
          <strong>
            ₹
            {Number(
              subscription.plan.price
            ).toLocaleString("en-IN")}
          </strong>

          <span>
            /
            {subscription.plan.billingPeriod ===
            "YEARLY"
              ? "year"
              : "month"}
          </span>
        </div>

        <div className="customer-subscription-details">
          <div>
            <CalendarDays size={16} />

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
            <RefreshCw size={16} />

            <span>
              <small>Next renewal</small>

              <strong>
                {formatDate(
                  subscription.renewalDate
                )}
              </strong>
            </span>
          </div>

          <div>
            <CheckCircle2 size={16} />

            <span>
              <small>Auto-renewal</small>

              <strong>Enabled</strong>
            </span>
          </div>
        </div>
      </section>

      {/* Payment */}
      <section className="customer-subscription-card">
        <div className="customer-subscription-section-heading">
          <div>
            <p className="customer-subscription-label">
              PAYMENT
            </p>

            <h2>Latest Payment</h2>
          </div>

          <CreditCard size={20} />
        </div>

        {subscription.payments?.length > 0 ? (
          <div className="customer-subscription-payment">
            <div>
              <span>Amount paid</span>

              <strong>
                ₹
                {Number(
                  subscription.payments[0].amount
                ).toLocaleString("en-IN")}
              </strong>
            </div>

            <div>
              <span>Status</span>

              <strong className="payment-paid">
                {subscription.payments[0].status}
              </strong>
            </div>

            <div>
              <span>Payment date</span>

              <strong>
                {formatDate(
                  subscription.payments[0]
                    .paymentDate
                )}
              </strong>
            </div>

            <div>
              <span>Transaction ID</span>

              <strong>
                {
                  subscription.payments[0]
                    .transactionId
                }
              </strong>
            </div>
          </div>
        ) : (
          <p className="customer-subscription-no-payment">
            No payment information available.
          </p>
        )}

        <div className="customer-subscription-invoice">
          <div>
            <FileText size={18} />

            <div>
              <strong>Invoice available</strong>

              <span>
                Your subscription invoice is
                available for your records.
              </span>
            </div>
          </div>

          <button
            type="button"
            disabled
            title="Invoice download will be added later"
          >
            Invoice
          </button>
        </div>
      </section>
    </div>
  );
}