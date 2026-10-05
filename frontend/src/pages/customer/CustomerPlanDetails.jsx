import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Check, X, Tag } from "lucide-react";
import "./CustomerPlanDetails.css";
import API_URL from "../../config";

export default function CustomerPlanDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [plan, setPlan] = useState(null);
  const [currentSubscription, setCurrentSubscription] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [upgradeAmount, setUpgradeAmount] = useState(null);

  const [upgradeLoading, setUpgradeLoading] = useState(false);

  const [paymentLoading, setPaymentLoading] = useState(false);

  const [paymentError, setPaymentError] = useState("");

  const [paymentSuccess, setPaymentSuccess] = useState(null);


  const [couponCode, setCouponCode] = useState("");

  const [couponApplied, setCouponApplied] = useState(null);

  const [couponLoading, setCouponLoading] = useState(false);

  const [couponError, setCouponError] = useState("");
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [couponsLoading, setCouponsLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");

        // Fetch selected plan
        const planResponse = await fetch(`${API_URL}/plans/${id}`, {
          method: "GET",
          credentials: "include",
        });

        const planData = await planResponse.json();

        if (!planResponse.ok) {
          setError(planData.message || "Unable to load plan.");
          return;
        }

        setPlan(planData.plan);

        // Check customer's current subscription
        const subscriptionResponse = await fetch(`${API_URL}/subscription`, {
          method: "GET",
          credentials: "include",
        });

        const subscriptionData = await subscriptionResponse.json();

        if (subscriptionResponse.status === 404) {
          setCurrentSubscription(null);
          return;
        }

        if (!subscriptionResponse.ok) {
          return;
        }

        setCurrentSubscription(subscriptionData.subscription);
      } catch (error) {
        console.error("Fetch plan details error:", error);

        setError("Unable to connect to the server.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);
  const isUpgrade =
    currentSubscription &&
    currentSubscription.plan &&
    Number(plan?.price) > Number(currentSubscription.plan.price);

  const isCurrentPlan =
    currentSubscription &&
    currentSubscription.plan &&
    Number(currentSubscription.plan.id) === Number(id);
  useEffect(() => {
    const fetchAvailableCoupons = async () => {
      if (!isUpgrade) {
        return;
      }

      try {
        setCouponsLoading(true);

        const response = await fetch(
          `${API_URL}/coupons/available?planId=${id}`,
          {
            method: "GET",
            credentials: "include",
          },
        );

        const data = await response.json();

        if (!response.ok) {
          setAvailableCoupons([]);
          return;
        }

        setAvailableCoupons(data.coupons || []);
      } catch (error) {
        console.error("Fetch available coupons error:", error);
        setAvailableCoupons([]);
      } finally {
        setCouponsLoading(false);
      }
    };

    fetchAvailableCoupons();
  }, [id, isUpgrade]);
 
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
          },
        );

        const data = await response.json();

        if (!response.ok) {
          setPaymentError(
            data.message || "Unable to calculate upgrade amount.",
          );
          return;
        }

        setUpgradeAmount(data.calculation.upgradeAmount);
      } catch (error) {
        console.error("Upgrade preview error:", error);

        setPaymentError("Unable to calculate upgrade amount.");
      } finally {
        setUpgradeLoading(false);
      }
    };

    fetchUpgradePreview();
  }, [id, isUpgrade]);


  const handleApplyCoupon = async () => {
    const code = couponCode.trim().toUpperCase();

    if (!code) {
      setCouponError("Please enter a coupon code.");
      return;
    }

    try {
      setCouponLoading(true);
      setCouponError("");
      setPaymentError("");

      const params = new URLSearchParams({
        couponCode: code,
      });

      const response = await fetch(
        `${API_URL}/subscription/upgrade/${id}/preview?${params.toString()}`,
        {
          method: "GET",
          credentials: "include",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        setCouponApplied(null);

        setCouponError(data.message || "Unable to apply coupon.");

        return;
      }

      setUpgradeAmount(data.calculation.upgradeAmount);

      if (!data.coupon) {
        setCouponApplied(null);

        setCouponError("Unable to apply coupon.");

        return;
      }

      setCouponApplied({
        code: data.coupon.code,
        discountAmount: data.calculation.discountAmount,
        finalAmount: data.calculation.finalAmount,
      });

      setCouponCode(data.coupon.code);
    } catch (error) {
      console.error("Apply coupon error:", error);

      setCouponApplied(null);

      setCouponError("Unable to apply coupon. Please try again.");
    } finally {
      setCouponLoading(false);
    }
  };


  const handleRemoveCoupon = () => {
    setCouponCode("");
    setCouponApplied(null);
    setCouponError("");
    setPaymentError("");
  };


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

        ...(isUpgrade
          ? {
              headers: {
                "Content-Type": "application/json",
              },

              body: JSON.stringify({
                couponCode: couponApplied?.code || "",
              }),
            }
          : {}),
      });

      const data = await response.json();

      if (!response.ok) {
        setPaymentError(data.message || "Unable to complete payment.");
        return;
      }

      setPaymentSuccess(data);
    } catch (error) {
      console.error("Payment error:", error);

      setPaymentError("Unable to connect to the server. Please try again.");
    } finally {
      setPaymentLoading(false);
    }
  };


  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatPrice = (price) => {
    return `₹${Number(price).toLocaleString("en-IN")}`;
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
      {/* Back Button */}

      <button
        type="button"
        className="customer-plan-details-back-button"
        onClick={() => navigate("/user/plans")}
      >
        <ArrowLeft size={16} />
        <span>Back to plans</span>
      </button>

      <section className="customer-plan-details-card">
        {/* Header */}

        <div className="customer-plan-details-header">
          <div>
            <p className="customer-plan-details-eyebrow">
              {isUpgrade ? "UPGRADE PLAN" : "SUBSCRIPTION PLAN"}
            </p>

            <h1>{plan.name} Plan</h1>

            <p className="customer-plan-details-description">
              {plan.description}
            </p>
          </div>

          <div className="customer-plan-details-price">
            <strong>{formatPrice(plan.price)}</strong>

            <span>/{plan.billingPeriod === "YEARLY" ? "year" : "month"}</span>
          </div>
        </div>

        <div className="customer-plan-details-divider" />

  
        {isUpgrade && (
          <div className="customer-plan-details-section">
            <p className="customer-plan-details-label">UPGRADE SUMMARY</p>

            <div className="customer-plan-details-summary">
              <div>
                <span>Current plan</span>

                <strong>{currentSubscription.plan.name}</strong>
              </div>

              <div>
                <span>New plan</span>

                <strong>{plan.name}</strong>
              </div>

              <div>
                <span>Upgrade amount</span>

                <strong>
                  {upgradeLoading
                    ? "Calculating..."
                    : upgradeAmount !== null
                      ? formatPrice(upgradeAmount)
                      : "—"}
                </strong>
              </div>
            </div>
          </div>
        )}

  
        <div className="customer-plan-details-section">
          <p className="customer-plan-details-label">WHAT'S INCLUDED</p>

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

        {isUpgrade && (
          <div className="customer-plan-details-section">
            <p className="customer-plan-details-label">DISCOUNT CODE</p>

            {!couponApplied ? (
              <>
                <div className="customer-plan-details-coupon">
                 

                    <div className="customer-plan-details-coupon-input">
                      <Tag size={15} />

                      <select
                        value={couponCode}
                        onChange={(event) => {
                          setCouponCode(event.target.value);
                          setCouponError("");
                        }}
                        disabled={couponsLoading || couponLoading}
                      >
                        <option value="">
                          {couponsLoading
                            ? "Loading coupons..."
                            : availableCoupons.length === 0
                              ? "No coupons available"
                              : "Select a coupon"}
                        </option>

                        {availableCoupons.map((coupon) => (
                          <option key={coupon.id} value={coupon.code}>
                            {coupon.code} — {coupon.discountLabel}
                          </option>
                        ))}
                      </select>
                    </div>
                  

                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={couponLoading || !couponCode.trim()}
                  >
                    {couponLoading ? "Applying..." : "Apply"}
                  </button>
                </div>

                {couponError && (
                  <p className="customer-plan-details-coupon-error">
                    {couponError}
                  </p>
                )}
              </>
            ) : (
              <div className="customer-plan-details-coupon-applied">
                <div>
                  <span>Coupon applied</span>

                  <strong>{couponApplied.code}</strong>
                </div>

                <button
                  type="button"
                  onClick={handleRemoveCoupon}
                  disabled={couponLoading}
                >
                  Remove
                </button>
              </div>
            )}
          </div>
        )}

        {/* =====================================================
            UPGRADE PRICE BREAKDOWN
            ===================================================== */}

        {isUpgrade && couponApplied && (
          <div className="customer-plan-details-summary customer-plan-details-coupon-summary">
            <div>
              <span>Upgrade amount</span>

              <strong>{formatPrice(upgradeAmount)}</strong>
            </div>

            <div>
              <span>Discount</span>

              <strong className="customer-plan-details-discount">
                -{formatPrice(couponApplied.discountAmount)}
              </strong>
            </div>

            <div>
              <span>Final amount</span>

              <strong>{formatPrice(couponApplied.finalAmount)}</strong>
            </div>
          </div>
        )}

        {/* =====================================================
            NORMAL SUBSCRIPTION SUMMARY
            ===================================================== */}

        {!isUpgrade && (
          <div className="customer-plan-details-summary">
            <div>
              <span>Billing period</span>

              <strong>
                {plan.billingPeriod === "YEARLY" ? "Yearly" : "Monthly"}
              </strong>
            </div>

            <div>
              <span>Subscription</span>

              <strong>Auto-renewal</strong>
            </div>
          </div>
        )}

        {/* =====================================================
            PAYMENT ERROR
            ===================================================== */}

        {paymentError && (
          <div className="customer-plan-details-payment-error">
            {paymentError}
          </div>
        )}

        {/* =====================================================
            ACTIONS
            ===================================================== */}

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
                (isUpgrade && upgradeAmount === null)
              }
            >
              {paymentLoading
                ? "Processing..."
                : isUpgrade
                  ? `Upgrade & Pay ${
                      couponApplied
                        ? formatPrice(couponApplied.finalAmount)
                        : upgradeAmount !== null
                          ? formatPrice(upgradeAmount)
                          : ""
                    }`
                  : "Start 3-Day Free Trial"}
            </button>
          )}

          <p>
            {isUpgrade
              ? "Your unused current subscription value is applied toward the upgrade."
              : "Start your 3-day free trial. No payment is required today."}
          </p>
        </div>
      </section>

      {/* =======================================================
          PAYMENT SUCCESS MODAL
          ======================================================= */}

      {paymentSuccess && (
        <div className="customer-payment-modal-overlay">
          <div className="customer-payment-modal">
            <button
              type="button"
              className="customer-payment-modal-close"
              onClick={() => setPaymentSuccess(null)}
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
                : paymentSuccess.isTrial
                  ? "3-DAY FREE TRIAL STARTED"
                  : "PAYMENT SUCCESSFUL"}
            </p>

            <h2>
              {isUpgrade
                ? "Your plan has been upgraded!"
                : paymentSuccess.isTrial
                  ? "Your free trial has started!"
                  : "You're subscribed!"}
            </h2>

            <p className="customer-payment-modal-description">
              Your subscription to{" "}
              <strong>
                {paymentSuccess.newPlan?.name || paymentSuccess.plan?.name} Plan
              </strong>{" "}
              is now active.
              {paymentSuccess.isTrial &&
                " You can use the plan free for 3 days."}
            </p>

            <div className="customer-payment-details">
              {/* Previous Plan */}

              {isUpgrade && (
                <div>
                  <span>Previous plan</span>

                  <strong>{paymentSuccess.previousPlan?.name}</strong>
                </div>
              )}

              {/* Plan */}

              <div>
                <span>Plan</span>

                <strong>
                  {paymentSuccess.newPlan?.name || paymentSuccess.plan?.name}
                </strong>
              </div>

              {/* Trial */}

              {paymentSuccess.isTrial ? (
                <>
                  <div>
                    <span>Trial period</span>

                    <strong>3 Days</strong>
                  </div>

                  <div>
                    <span>Payment</span>

                    <strong>Free</strong>
                  </div>

                  <div>
                    <span>Subscription</span>

                    <strong>Active</strong>
                  </div>
                </>
              ) : (
                <>
                  {/* Amount */}

                  <div>
                    <span>Amount paid</span>

                    <strong>
                      {formatPrice(paymentSuccess.payment.amount)}
                    </strong>
                  </div>

                  {/* Discount */}

                  {isUpgrade && paymentSuccess.discountAmount > 0 && (
                    <div>
                      <span>Discount</span>

                      <strong className="customer-payment-paid">
                        -{formatPrice(paymentSuccess.discountAmount)}
                      </strong>
                    </div>
                  )}

                  {/* Payment Status */}

                  <div>
                    <span>Payment status</span>

                    <strong className="customer-payment-paid">Paid</strong>
                  </div>

                  {/* Subscription */}

                  <div>
                    <span>Subscription</span>

                    <strong>Active</strong>
                  </div>
                </>
              )}

              {/* Start Date */}

              <div>
                <span>Start date</span>

                <strong>
                  {formatDate(paymentSuccess.subscription.startDate)}
                </strong>
              </div>

              {/* Renewal */}

              <div>
                <span>
                  {paymentSuccess.isTrial ? "Trial ends" : "Next renewal"}
                </span>

                <strong>
                  {formatDate(paymentSuccess.subscription.renewalDate)}
                </strong>
              </div>

              {/* Auto Renewal */}

              {!paymentSuccess.isTrial && (
                <div>
                  <span>Auto-renewal</span>

                  <strong>Enabled</strong>
                </div>
              )}

              {/* Transaction ID */}

              {!paymentSuccess.isTrial && (
                <div>
                  <span>Transaction ID</span>

                  <strong>{paymentSuccess.payment.transactionId}</strong>
                </div>
              )}
            </div>

            {/* Invoice */}

            {!paymentSuccess.isTrial && (
              <div className="customer-payment-invoice-message">
                Your invoice is available in <strong>My Subscription</strong>.
              </div>
            )}

            <button
              type="button"
              className="customer-payment-modal-button"
              onClick={() => navigate("/user/subscription")}
            >
              Go to My Subscription
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
