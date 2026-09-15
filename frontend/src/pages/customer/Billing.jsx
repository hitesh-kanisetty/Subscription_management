import { useEffect, useState } from "react";
import {
  CreditCard,
  CheckCircle2,
  IndianRupee,
  CalendarDays,
  ArrowLeft,
  Receipt,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import API_URL from "../../config";
import "./Billing.css";

export default function Billing() {
  const navigate = useNavigate();

  const [subscription, setSubscription] =
    useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchBilling = async () => {
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
              "Unable to load billing information."
          );
          return;
        }

        setSubscription(data.subscription);
      } catch (error) {
        console.error(
          "Fetch billing error:",
          error
        );

        setError(
          "Unable to connect to the server."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchBilling();
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

  const payments = subscription?.payments || [];

  const successfulPayments = payments.filter(
    (payment) =>
      String(payment.status).toUpperCase() ===
      "PAID"
  );

  const totalPaid = successfulPayments.reduce(
    (total, payment) =>
      total + Number(payment.amount || 0),
    0
  );

  const latestPayment = payments[0] || null;

  if (loading) {
    return (
      <div className="customer-billing-page">
        <div className="customer-billing-message">
          Loading billing information...
        </div>
      </div>
    );
  }

  if (error || !subscription) {
    return (
      <div className="customer-billing-page">
        <header className="customer-billing-header">
          <div>
            <p className="customer-billing-eyebrow">
              BILLING & PAYMENTS
            </p>

            <h1>Billing & Payments</h1>

            <p className="customer-billing-description">
              View your payment history and
              billing information.
            </p>
          </div>
        </header>

        <div className="customer-billing-empty">
          <div className="customer-billing-empty-icon">
            <CreditCard size={24} />
          </div>

          <h2>No billing information</h2>

          <p>
            {error === "No subscription found"
              ? "You don't have any payment records yet."
              : error ||
                "No billing information is available."}
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
    <div className="customer-billing-page">
      {/* Header */}
      <header className="customer-billing-header">
        <div>
          <p className="customer-billing-eyebrow">
            BILLING & PAYMENTS
          </p>

          <h1>Billing & Payments</h1>

          <p className="customer-billing-description">
            View your payment history and billing
            information.
          </p>
        </div>

        <button
          type="button"
          className="customer-billing-back"
          onClick={() =>
            navigate("/user/subscription")
          }
        >
          <ArrowLeft size={15} />
          Subscription
        </button>
      </header>

      {/* Summary */}
      <section className="customer-billing-summary">
        <div className="customer-billing-summary-card">
          <div className="customer-billing-summary-icon">
            <IndianRupee size={18} />
          </div>

          <div>
            <span>Total Paid</span>

            <strong>
              ₹
              {totalPaid.toLocaleString(
                "en-IN"
              )}
            </strong>
          </div>
        </div>

        <div className="customer-billing-summary-card">
          <div className="customer-billing-summary-icon">
            <CheckCircle2 size={18} />
          </div>

          <div>
            <span>Successful Payments</span>

            <strong>
              {successfulPayments.length}
            </strong>
          </div>
        </div>

        <div className="customer-billing-summary-card">
          <div className="customer-billing-summary-icon">
            <CalendarDays size={18} />
          </div>

          <div>
            <span>Latest Payment</span>

            <strong>
              {latestPayment
                ? formatDate(
                    latestPayment.paymentDate
                  )
                : "—"}
            </strong>
          </div>
        </div>
      </section>

      {/* Payment History */}
      <section className="customer-billing-card">
        <div className="customer-billing-section-heading">
          <div>
            <p className="customer-billing-label">
              PAYMENT HISTORY
            </p>

            <h2>Payment History</h2>

            <p>
              Your subscription payment records.
            </p>
          </div>

          <Receipt size={20} />
        </div>

        {payments.length > 0 ? (
          <div className="customer-billing-table-wrapper">
            <table className="customer-billing-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Plan</th>
                  <th>Amount</th>
                  {/* <th>Method</th> */}
                  <th>Transaction ID</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id}>
                    <td>
                      {formatDate(
                        payment.paymentDate
                      )}
                    </td>

                    <td>
                      <div className="customer-billing-plan">
                        <CreditCard size={14} />

                        <span>
                          {subscription.plan.name}
                        </span>
                      </div>
                    </td>

                    <td>
                      <strong>
                        ₹
                        {Number(
                          payment.amount
                        ).toLocaleString(
                          "en-IN"
                        )}
                      </strong>
                    </td>

                    {/* <td>
                      {payment.paymentMethod ||
                        "DEMO"}
                    </td> */}

                    <td>
                      <span className="customer-billing-transaction">
                        {
                          payment.transactionId
                        }
                      </span>
                    </td>

                    <td>
                      <span
                        className={`customer-billing-status ${
                          String(
                            payment.status
                          ).toLowerCase() ===
                          "paid"
                            ? "paid"
                            : "other"
                        }`}
                      >
                        <CheckCircle2
                          size={13}
                        />

                        {payment.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="customer-billing-no-payment">
            <CreditCard size={20} />

            <p>
              No payment information is
              available yet.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}