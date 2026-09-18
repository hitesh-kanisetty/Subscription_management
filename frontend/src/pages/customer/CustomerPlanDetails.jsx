import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Check, X } from "lucide-react";

import "./CustomerPlanDetails.css";
import API_URL from "../../config";
export default function CustomerPlanDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [plan, setPlan] = useState(null);
  const [currentSubscription, setCurrentSubscription] =
    useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [upgradeAmount, setUpgradeAmount] = useState(null);
  const [upgradeLoading, setUpgradeLoading] =
    useState(false);

  const [paymentLoading, setPaymentLoading] =
    useState(false);
  const [paymentError, setPaymentError] =
    useState("");
  const [paymentSuccess, setPaymentSuccess] =
    useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");

        // Fetch selected plan
        const planResponse = await fetch(
          `${API_URL}/plans/${id}`,
          {
            method: "GET",
            credentials: "include",
          }
        );

        const planData = await planResponse.json();

        if (!planResponse.ok) {
          setError(
            planData.message ||
              "Unable to load plan."
          );
          return;
        }

        setPlan(planData.plan);

        // Check customer's current subscription
        const subscriptionResponse =
          await fetch(
            `${API_URL}/subscription`,
            {
              method: "GET",
              credentials: "include",
            }
          );

        const subscriptionData =
          await subscriptionResponse.json();

        if (subscriptionResponse.status === 404) {
          setCurrentSubscription(null);
          return;
        }

        if (!subscriptionResponse.ok) {
          return;
        }

        setCurrentSubscription(
          subscriptionData.subscription
        );
      } catch (error) {
        console.error(
          "Fetch plan details error:",
          error
        );

        setError(
          "Unable to connect to the server."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const isUpgrade =
    currentSubscription &&
    currentSubscription.plan &&
    Number(plan?.price) >
      Number(currentSubscription.plan.price);

  const isCurrentPlan =
    currentSubscription &&
    currentSubscription.plan &&
    Number(currentSubscription.plan.id) ===
      Number(id);

  useEffect(() => {
    const fetchUpgradePreview = async () => {
      if (!isUpgrade) {
        setUpgradeAmount(null);
        return;
      }

      try {
        setUpgradeLoading(true);
        setPaymentError("");

        const response = await fetch(
          `${API_URL}/subscription/upgrade/${id}/preview`,
          {
            method: "GET",
            credentials: "include",
          }
        );

        const data = await response.json();

        if (!response.ok) {
          setPaymentError(
            data.message ||
              "Unable to calculate upgrade amount."
          );
          return;
        }

        setUpgradeAmount(
          data.calculation.upgradeAmount
        );
      } catch (error) {
        console.error(
          "Upgrade preview error:",
          error
        );

        setPaymentError(
          "Unable to calculate upgrade amount."
        );
      } finally {
        setUpgradeLoading(false);
      }
    };

    fetchUpgradePreview();
  }, [id, isUpgrade]);

  const handlePayNow = async () => {
    try {
      setPaymentLoading(true);
      setPaymentError("");

      let url;
      let method;

      if (isUpgrade) {
        url = `${API_URL}/subscription/upgrade/${id}`;
        method = "POST";
      } else {
        url = `${API_URL}/plans/${id}/subscribe`;
        method = "POST";
      }

      const response = await fetch(url, {
        method,
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        setPaymentError(
          data.message ||
            "Unable to complete payment."
        );
        return;
      }

      setPaymentSuccess(data);
    } catch (error) {
      console.error(
        "Payment error:",
        error
      );

      setPaymentError(
        "Unable to connect to the server. Please try again."
      );
    } finally {
      setPaymentLoading(false);
    }
  };

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

  const formatPrice = (price) => {
    return `₹${Number(price).toLocaleString(
      "en-IN"
    )}`;
  };

  if (loading) {
    return (
      <div className="customer-plan-details-page">
        <div className="customer-plan-details-message">
          Loading plan details...
        </div>
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div className="customer-plan-details-page">
        <div className="customer-plan-details-message customer-plan-details-error">
          {error || "Plan not found."}
        </div>

        <button
          type="button"
          className="customer-plan-details-back-button"
          onClick={() => navigate("/user/plans")}
        >
          <ArrowLeft size={16} />
          Back to plans
        </button>
      </div>
    );
  }

  return (
    <div className="customer-plan-details-page">
      <button
        type="button"
        className="customer-plan-details-back-button"
        onClick={() => navigate("/user/plans")}
      >
        <ArrowLeft size={16} />
        <span>Back to plans</span>
      </button>

      <section className="customer-plan-details-card">
        <div className="customer-plan-details-header">
          <div>
            <p className="customer-plan-details-eyebrow">
              {isUpgrade
                ? "UPGRADE PLAN"
                : "SUBSCRIPTION PLAN"}
            </p>

            <h1>{plan.name} Plan</h1>

            <p className="customer-plan-details-description">
              {plan.description}
            </p>
          </div>

          <div className="customer-plan-details-price">
            <strong>
              {formatPrice(plan.price)}
            </strong>

            <span>
              /
              {plan.billingPeriod === "YEARLY"
                ? "year"
                : "month"}
            </span>
          </div>
        </div>

        <div className="customer-plan-details-divider" />

        {/* Upgrade Summary */}
        {isUpgrade && (
          <div className="customer-plan-details-section">
            <p className="customer-plan-details-label">
              UPGRADE SUMMARY
            </p>

            <div className="customer-plan-details-summary">
              <div>
                <span>Current plan</span>

                <strong>
                  {currentSubscription.plan.name}
                </strong>
              </div>

              <div>
                <span>New plan</span>

                <strong>
                  {plan.name}
                </strong>
              </div>

              <div>
                <span>Upgrade amount</span>

                <strong>
                  {upgradeLoading
                    ? "Calculating..."
                    : upgradeAmount !== null
                    ? formatPrice(
                        upgradeAmount
                      )
                    : "—"}
                </strong>
              </div>
            </div>
          </div>
        )}

        {/* Features */}
        <div className="customer-plan-details-section">
          <p className="customer-plan-details-label">
            WHAT'S INCLUDED
          </p>

          <ul className="customer-plan-details-features">
            {plan.features.map((feature) => (
              <li key={feature}>
                <span className="customer-plan-details-check">
                  <Check size={14} />
                </span>

                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Normal Summary */}
        {!isUpgrade && (
          <div className="customer-plan-details-summary">
            <div>
              <span>Billing period</span>

              <strong>
                {plan.billingPeriod === "YEARLY"
                  ? "Yearly"
                  : "Monthly"}
              </strong>
            </div>

            <div>
              <span>Subscription</span>

              <strong>Auto-renewal</strong>
            </div>
          </div>
        )}

        {paymentError && (
          <div className="customer-plan-details-payment-error">
            {paymentError}
          </div>
        )}

        <div className="customer-plan-details-actions">
          {isCurrentPlan ? (
            <button
              type="button"
              className="customer-plan-details-pay-button"
              disabled
            >
              Current Plan
            </button>
          ) : (
            <button
              type="button"
              className="customer-plan-details-pay-button"
              onClick={handlePayNow}
              disabled={
                paymentLoading ||
                upgradeLoading ||
                (isUpgrade &&
                  upgradeAmount === null)
              }
            >
              {paymentLoading
                ? "Processing..."
                : isUpgrade
                ? `Upgrade & Pay ${
                    upgradeAmount !== null
                      ? formatPrice(
                          upgradeAmount
                        )
                      : ""
                  }`
                : "Pay Now"}
            </button>
          )}

          <p>
            {isUpgrade
              ? "Your unused current subscription value is applied toward the upgrade."
              : "By continuing, your subscription will be activated after successful payment."}
          </p>
        </div>
      </section>

      {/* Payment Success Modal */}
      {paymentSuccess && (
        <div className="customer-payment-modal-overlay">
          <div className="customer-payment-modal">
            <button
              type="button"
              className="customer-payment-modal-close"
              onClick={() =>
                setPaymentSuccess(null)
              }
              aria-label="Close"
            >
              <X size={18} />
            </button>

            <div className="customer-payment-success-icon">
              <Check size={28} />
            </div>

            <p className="customer-payment-modal-eyebrow">
              {isUpgrade
                ? "UPGRADE SUCCESSFUL"
                : "PAYMENT SUCCESSFUL"}
            </p>

            <h2>
              {isUpgrade
                ? "Your plan has been upgraded!"
                : "You're subscribed!"}
            </h2>

            <p className="customer-payment-modal-description">
              Your subscription to the{" "}
              <strong>
                {paymentSuccess.newPlan?.name ||
                  paymentSuccess.plan?.name}{" "}
                Plan
              </strong>{" "}
              is now active.
            </p>

            <div className="customer-payment-details">
              {isUpgrade && (
                <div>
                  <span>Previous plan</span>

                  <strong>
                    {paymentSuccess.previousPlan?.name}
                  </strong>
                </div>
              )}

              <div>
                <span>Plan</span>

                <strong>
                  {paymentSuccess.newPlan?.name ||
                    paymentSuccess.plan?.name}
                </strong>
              </div>

              <div>
                <span>Amount paid</span>

                <strong>
                  {formatPrice(
                    paymentSuccess.payment.amount
                  )}
                </strong>
              </div>

              <div>
                <span>Payment status</span>

                <strong className="customer-payment-paid">
                  Paid
                </strong>
              </div>

              <div>
                <span>Subscription</span>

                <strong>Active</strong>
              </div>

              <div>
                <span>Start date</span>

                <strong>
                  {formatDate(
                    paymentSuccess.subscription
                      .startDate
                  )}
                </strong>
              </div>

              <div>
                <span>Next renewal</span>

                <strong>
                  {formatDate(
                    paymentSuccess.subscription
                      .renewalDate
                  )}
                </strong>
              </div>

              <div>
                <span>Auto-renewal</span>

                <strong>Enabled</strong>
              </div>

              <div>
                <span>Transaction ID</span>

                <strong>
                  {
                    paymentSuccess.payment
                      .transactionId
                  }
                </strong>
              </div>
            </div>

            <div className="customer-payment-invoice-message">
              Your invoice is available in{" "}
              <strong>My Subscription</strong>.
            </div>

            <button
              type="button"
              className="customer-payment-modal-button"
              onClick={() =>
                navigate("/user/subscription")
              }
            >
              Go to My Subscription
            </button>
          </div>
        </div>
      )}
    </div>
  );
}