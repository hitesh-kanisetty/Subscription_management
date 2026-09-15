import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, Clock3 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import API_URL from "../../config";
import "./AdminCustomerDetails.css";

export default function AdminCustomerDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_URL}/customers/${id}`,
          {
            method: "GET",
            credentials: "include",
          }
        );

        const data = await response.json();

        if (!response.ok) {
          setError(
            data.message || "Unable to load customer."
          );
          return;
        }

        setCustomer(data.customer);
      } catch (error) {
        console.error(
          "Fetch customer details error:",
          error
        );

        setError(
          "Unable to connect to the server."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCustomer();
  }, [id]);

  const formatDate = (date) => {
    if (!date) return "—";

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
    if (price === undefined || price === null) {
      return "₹0";
    }

    return `₹${Number(price).toLocaleString(
      "en-IN"
    )}`;
  };

  const getStatusClass = (status) => {
    if (status === "ACTIVE") {
      return "admin-customer-detail-status-active";
    }

    if (status === "CANCELLED") {
      return "admin-customer-detail-status-cancelled";
    }

    if (status === "EXPIRED") {
      return "admin-customer-detail-status-expired";
    }

    return "";
  };

  if (loading) {
    return (
      <div className="admin-customer-details-page">
        <div className="admin-customer-details-message">
          Loading customer details...
        </div>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="admin-customer-details-page">
        <button
          type="button"
          className="admin-customer-back-button"
          onClick={() =>
            navigate("/admin/customers")
          }
        >
          <ArrowLeft size={16} />
          <span>Back to Customers</span>
        </button>

        <div className="admin-customer-details-message admin-customer-details-error">
          {error || "Customer not found."}
        </div>
      </div>
    );
  }

  const subscriptions =
    customer.subscriptions || [];

  const currentSubscription =
    subscriptions.find(
      (subscription) =>
        subscription.status === "ACTIVE"
    ) || subscriptions[0];

  const currentPlan =
    currentSubscription?.plan || null;

  const payments = subscriptions.flatMap(
    (subscription) =>
      subscription.payments || []
  );

  return (
    <div className="admin-customer-details-page">
      {/* Back */}
      <button
        type="button"
        className="admin-customer-back-button"
        onClick={() =>
          navigate("/admin/customers")
        }
      >
        <ArrowLeft size={16} />
        <span>Back to Customers</span>
      </button>

      {/* Header */}
      <header className="admin-customer-details-header">
        <div className="admin-customer-details-profile">
          <div className="admin-customer-details-avatar">
            {customer.name
              ?.charAt(0)
              .toUpperCase()}
          </div>

          <div>
            <p className="admin-customers-eyebrow">
              CUSTOMER DETAILS
            </p>

            <h1>{customer.name}</h1>

            <p>{customer.email}</p>
          </div>
        </div>

        <div className="admin-customer-details-id">
          CUSTOMER #{customer.id}
        </div>
      </header>

      {/* Overview */}
      <section className="admin-customer-details-grid">
        <div className="admin-customer-detail-card">
          <span className="admin-customer-detail-label">
            CURRENT PLAN
          </span>

          <strong>
            {currentPlan?.name || "No plan"}
          </strong>

          <span className="admin-customer-detail-subtext">
            {currentPlan
              ? `${formatPrice(
                  currentPlan.price
                )} / ${
                  currentPlan.billingPeriod ===
                  "YEARLY"
                    ? "year"
                    : "month"
                }`
              : "Customer has no subscription"}
          </span>
        </div>

        <div className="admin-customer-detail-card">
          <span className="admin-customer-detail-label">
            SUBSCRIPTION STATUS
          </span>

          {currentSubscription ? (
            <span
              className={`admin-customer-detail-status ${getStatusClass(
                currentSubscription.status
              )}`}
            >
              {currentSubscription.status}
            </span>
          ) : (
            <strong>Not subscribed</strong>
          )}

          <span className="admin-customer-detail-subtext">
            {currentSubscription
              ? `Started ${formatDate(
                  currentSubscription.startDate
                )}`
              : "No active subscription"}
          </span>
        </div>

        <div className="admin-customer-detail-card">
          <span className="admin-customer-detail-label">
            NEXT RENEWAL
          </span>

          <strong>
            {formatDate(
              currentSubscription?.renewalDate
            )}
          </strong>

          <span className="admin-customer-detail-subtext">
            {currentSubscription
              ? "Scheduled renewal date"
              : "No renewal scheduled"}
          </span>
        </div>
      </section>

      {/* Subscription */}
      <section className="admin-customer-details-section">
        <div className="admin-customer-details-section-heading">
          <div>
            <p className="admin-customers-eyebrow">
              SUBSCRIPTION
            </p>

            <h2>Subscription Details</h2>
          </div>
        </div>

        {currentSubscription ? (
          <div className="admin-customer-subscription-card">
            <div>
              <span className="admin-customer-detail-label">
                PLAN
              </span>

              <h3>
                {currentPlan?.name || "—"}
              </h3>
            </div>

            <div>
              <span className="admin-customer-detail-label">
                PRICE
              </span>

              <strong>
                {formatPrice(
                  currentPlan?.price
                )}
              </strong>
            </div>

            <div>
              <span className="admin-customer-detail-label">
                BILLING
              </span>

              <strong>
                {currentPlan?.billingPeriod ===
                "YEARLY"
                  ? "Yearly"
                  : "Monthly"}
              </strong>
            </div>

            <div>
              <span className="admin-customer-detail-label">
                START DATE
              </span>

              <strong>
                {formatDate(
                  currentSubscription.startDate
                )}
              </strong>
            </div>

            <div>
              <span className="admin-customer-detail-label">
                RENEWAL DATE
              </span>

              <strong>
                {formatDate(
                  currentSubscription.renewalDate
                )}
              </strong>
            </div>

            <div>
              <span className="admin-customer-detail-label">
                STATUS
              </span>

              <span
                className={`admin-customer-detail-status ${getStatusClass(
                  currentSubscription.status
                )}`}
              >
                {currentSubscription.status}
              </span>
            </div>
          </div>
        ) : (
          <div className="admin-customer-details-message">
            This customer has no subscription.
          </div>
        )}
      </section>

      {/* Payments */}
      <section className="admin-customer-details-section">
        <div className="admin-customer-details-section-heading">
          <div>
            <p className="admin-customers-eyebrow">
              BILLING
            </p>

            <h2>Payment History</h2>
          </div>

          <span className="admin-customer-payment-count">
            {payments.length}{" "}
            {payments.length === 1
              ? "payment"
              : "payments"}
          </span>
        </div>

        {payments.length === 0 ? (
          <div className="admin-customer-details-message">
            No payment records found.
          </div>
        ) : (
          <div className="admin-customer-payments-card">
            <div className="admin-customer-payments-table-wrapper">
              <table className="admin-customer-payments-table">
                <thead>
                  <tr>
                    <th>Transaction</th>
                    <th>Amount</th>
                    <th>Method</th>
                    <th>Status</th>
                    <th>Payment Date</th>
                  </tr>
                </thead>

                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment.id}>
                      <td>
                        <span className="admin-customer-transaction">
                          {payment.transactionId}
                        </span>
                      </td>

                      <td>
                        <strong>
                          {formatPrice(
                            payment.amount
                          )}
                        </strong>
                      </td>

                      <td>
                        <span className="admin-customer-payment-method">
                          {payment.paymentMethod}
                        </span>
                      </td>

                      <td>
                        {payment.status ===
                        "PAID" ? (
                          <span className="admin-customer-payment-status admin-customer-payment-paid">
                            <CheckCircle2
                              size={13}
                            />
                            Paid
                          </span>
                        ) : (
                          <span className="admin-customer-payment-status admin-customer-payment-other">
                            <Clock3 size={13} />
                            {payment.status}
                          </span>
                        )}
                      </td>

                      <td>
                        <span className="admin-customer-payment-date">
                          {formatDate(
                            payment.paymentDate
                          )}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}