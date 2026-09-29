import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  CalendarDays,
  RefreshCw,
  FileText,
  ArrowUpRight,
} from "lucide-react";
import API_URL from "../../config";
import "./CustomerSubscription.css";

export default function CustomerSubscription() {
  const navigate = useNavigate();

  const [subscription, setSubscription] = useState(null);
  const [availableUpgrades, setAvailableUpgrades] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchSubscriptionData = async () => {
      try {
        setLoading(true);
        setError("");

        const [subscriptionResponse, plansResponse] =
          await Promise.all([
            fetch(`${API_URL}/subscription`, {
              method: "GET",
              credentials: "include",
            }),

            fetch(`${API_URL}/plans`, {
              method: "GET",
              credentials: "include",
            }),
          ]);

        const subscriptionData =
          await subscriptionResponse.json();

        if (!subscriptionResponse.ok) {
          setError(
            subscriptionData.message ||
              "Unable to load subscription."
          );
          return;
        }

        setSubscription(subscriptionData.subscription);

        const plansData = await plansResponse.json();

        if (!plansResponse.ok) {
          return;
        }

        const currentPrice = Number(
          subscriptionData.subscription?.plan?.price || 0
        );

        const plans = Array.isArray(plansData)
          ? plansData
          : plansData.plans || [];

        const higherPlans = plans.filter(
          (plan) =>
            plan.isActive !== false &&
            Number(plan.price) > currentPrice &&
            plan.id !==
              subscriptionData.subscription?.plan?.id
        );

        setAvailableUpgrades(higherPlans);
      } catch (error) {
        console.error(
          "Fetch subscription data error:",
          error
        );

        setError(
          "Unable to connect to the server."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchSubscriptionData();
  }, []);

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatPrice = (price) => {
    return `₹${Number(price || 0).toLocaleString(
      "en-IN"
    )}`;
  };

  const getBillingLabel = (billingPeriod) => {
    return billingPeriod === "YEARLY"
      ? "/year"
      : "/month";
  };

  const handleInvoiceDownload = async () => {
    try {
      setError("");

      const response = await fetch(
        `${API_URL}/subscription/invoice`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      if (!response.ok) {
        const data = await response
          .json()
          .catch(() => null);

        setError(
          data?.message ||
            "Unable to generate invoice."
        );

        return;
      }

      const blob = await response.blob();

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.href = url;
      link.download = "SubFlow-Invoice.pdf";

      document.body.appendChild(link);

      link.click();

      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(
        "Invoice download error:",
        error
      );

      setError("Unable to download invoice.");
    }
  };

  const handleUpgrade = (planId) => {
    navigate(`/user/plans/${planId}`);
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
            onClick={() => navigate("/user/plans")}
          >
            Browse Plans
          </button>
        </div>
      </div>
    );
  }

  const isTrial = subscription.isTrial;

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
            View your current subscription, renewal
            details, and payment information.
          </p>
        </div>

        <button
          type="button"
          className="customer-subscription-back"
          onClick={() => navigate("/user/plans")}
        >
          <ArrowLeft size={15} />
          <span>Back to Plans</span>
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

            {isTrial
              ? "FREE TRIAL"
              : subscription.status}
          </span>
        </div>

        <div className="customer-subscription-price">
          {isTrial ? (
            <strong>3-Day Free Trial</strong>
          ) : (
            <>
              <strong>
                {formatPrice(
                  subscription.plan.price
                )}
              </strong>

              <span>
                {getBillingLabel(
                  subscription.plan.billingPeriod
                )}
              </span>
            </>
          )}
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
              <small>
                {isTrial
                  ? "Trial ends"
                  : "Next renewal"}
              </small>

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
              <small>After trial</small>

              <strong>
                {isTrial
                  ? `${formatPrice(
                      subscription.plan.price
                    )} ${getBillingLabel(
                      subscription.plan.billingPeriod
                    )}`
                  : "Auto-renewal enabled"}
              </strong>
            </span>
          </div>
        </div>
      </section>

      {/* Available Upgrades */}
      {availableUpgrades.length > 0 && (
        <section className="customer-subscription-card customer-upgrades-section">
          <div className="customer-subscription-section-heading">
            <div>
              <p className="customer-subscription-label">
                AVAILABLE UPGRADES
              </p>

              <h2>Upgrade your plan</h2>

              <p className="customer-upgrades-description">
                Move to a higher plan with more
                features and benefits.
              </p>
            </div>

            <ArrowUpRight size={20} />
          </div>

          <div className="customer-upgrades-grid">
            {availableUpgrades.map((plan) => (
              <div
                className="customer-upgrade-card"
                key={plan.id}
              >
                <div>
                  <h3>{plan.name}</h3>

                  {plan.description && (
                    <p>{plan.description}</p>
                  )}
                </div>

                <div className="customer-upgrade-price">
                  <strong>
                    {formatPrice(plan.price)}
                  </strong>

                  <span>
                    {getBillingLabel(
                      plan.billingPeriod
                    )}
                  </span>
                </div>

                {Array.isArray(plan.features) &&
                  plan.features.length > 0 && (
                    <ul>
                      {plan.features
                        .slice(0, 3)
                        .map((feature, index) => (
                          <li key={index}>
                            <CheckCircle2 size={13} />
                            <span>{feature}</span>
                          </li>
                        ))}
                    </ul>
                  )}

                <button
                  type="button"
                  className="customer-upgrade-button"
                  onClick={() =>
                    handleUpgrade(plan.id)
                  }
                >
                  Upgrade

                  <ArrowUpRight size={15} />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

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

        {isTrial ? (
          <p className="customer-subscription-no-payment">
            No payment has been made yet. Your plan
            will automatically continue at{" "}
            {formatPrice(
              subscription.plan.price
            )}{" "}
            after the 3-day free trial.
          </p>
        ) : subscription.payments?.length > 0 ? (
          <div className="customer-subscription-payment">
            <div>
              <span>Amount paid</span>

              <strong>
                {formatPrice(
                  subscription.payments[0].amount
                )}
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
                {subscription.payments[0]
                  .transactionId}
              </strong>
            </div>
          </div>
        ) : (
          <p className="customer-subscription-no-payment">
            No payment information available.
          </p>
        )}

        {/* Invoice is only available after payment */}
        {!isTrial && (
          <div className="customer-subscription-invoice">
            <div>
              <FileText size={18} />

              <div>
                <strong>
                  Invoice available
                </strong>

                <span>
                  Your subscription invoice is
                  available for your records.
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleInvoiceDownload}
            >
              Invoice
            </button>
          </div>
        )}
      </section>
    </div>
  );
}