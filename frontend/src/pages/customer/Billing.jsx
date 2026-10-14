import { useEffect, useState } from "react";
import RefundStatusBar from "../../components/customer/RefundStatusBar";
import {
  CreditCard,
  CheckCircle2,
  IndianRupee,
  CalendarDays,
  ArrowLeft,
  Receipt,
  RotateCcw,
X,
Send,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import API_URL from "../../config";
import "./Billing.css";


export default function Billing() {
  const navigate = useNavigate();

  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState({
    totalPaid: 0,
    successfulPayments: 0,
    latestPayment: null,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(5);
  const [selectedPayment, setSelectedPayment] = useState(null);
const [refundReason, setRefundReason] = useState("");
const [refundDescription, setRefundDescription] = useState("");
const [refundSubmitting, setRefundSubmitting] = useState(false);
const [refundMessage, setRefundMessage] = useState("");
const [refundError, setRefundError] = useState("");
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 0,
    totalPayments: 0,
    limit: 5,
  });

  useEffect(() => {
    const fetchBilling = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_URL}/payments?page=${currentPage}&limit=${limit}`,
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

        setPayments(data.payments || []);
        setSummary(
  data.summary || {
    totalPaid: 0,
    successfulPayments: 0,
    latestPayment: null,
  }
);
        setPagination(
          data.pagination || {
            currentPage: 1,
            totalPages: 0,
            totalPayments: 0,
            limit,
          }
        );

        
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
  }, [currentPage, limit]);

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

  const handleLimitChange = (event) => {
    setLimit(Number(event.target.value));
    setCurrentPage(1);
  };

  const goToPage = (page) => {
    if (
      page >= 1 &&
      page <= pagination.totalPages
    ) {
      setCurrentPage(page);
    }
  };
  
const canRequestRefund = (payment) => {
  if (payment.status !== "PAID" || payment.refundRequest) {
    return false;
  }

  const paymentTime = new Date(payment.paymentDate).getTime();
  const elapsedTime = Date.now() - paymentTime;

  return (
    Number.isFinite(paymentTime) &&
    elapsedTime >= 0 &&
    elapsedTime <= 48 * 60 * 60 * 1000
  );
};

const openRefundForm = (payment) => {
  setSelectedPayment(payment);
  setRefundReason("");
  setRefundDescription("");
  setRefundMessage("");
  setRefundError("");
};

const closeRefundForm = () => {
  if (refundSubmitting) return;

  setSelectedPayment(null);
  setRefundReason("");
  setRefundDescription("");
  setRefundMessage("");
  setRefundError("");
};

const handleRefundSubmit = async (event) => {
  event.preventDefault();

  if (!selectedPayment || !refundReason) {
    setRefundError("Please select a refund reason.");
    return;
  }

  try {
    setRefundSubmitting(true);
    setRefundError("");
    setRefundMessage("");

    const response = await fetch(
      `${API_URL}/refunds/request/${selectedPayment.id}`,
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reason: refundReason,
          description: refundDescription.trim(),
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      setRefundError(
        data.message || "Unable to submit your refund request."
      );
      return;
    }

    setPayments((previousPayments) =>
      previousPayments.map((payment) =>
        payment.id === selectedPayment.id
          ? {
              ...payment,
              refundRequest: data.refundRequest,
            }
          : payment
      )
    );

    setRefundMessage("Your refund request has been submitted.");

    setSelectedPayment(null);
    setRefundReason("");
    setRefundDescription("");
  } catch (error) {
    console.error("Refund request error:", error);
    setRefundError("Unable to connect to the server.");
  } finally {
    setRefundSubmitting(false);
  }
};

  if (loading) {
    return (
      <div className="customer-billing-page">
        <div className="customer-billing-message">
          Loading billing information...
        </div>
      </div>
    );
  }

  if (error) {
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

          <p>{error}</p>

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
          <span>Back to Subscription</span>
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
              {summary.totalPaid.toLocaleString(
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
              {summary.successfulPayments}
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
              {summary.latestPayment
                ? formatDate(
                    summary.latestPayment
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
                  <th>Transaction ID</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id}>
                    <td>
                      <div className="customer-billing-date">
                        {formatDate(
                          payment.paymentDate
                        )}
                      </div>
                    </td>

                    <td>
                      <div className="customer-billing-plan">
                        <CreditCard size={14} />

                        <span>
                          {payment.plan?.name ||
                            "Unknown Plan"}
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

                    <td>
                      <span className="customer-billing-transaction">
                        {payment.transactionId}
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
                    
<td>

{payment.refundRequest ? (
  <RefundStatusBar
    refundRequest={payment.refundRequest}
    payment={payment}
  />
) : canRequestRefund(payment) ? (
  <button
    type="button"
    className="customer-refund-button"
    onClick={() => openRefundForm(payment)}
  >
    <RotateCcw size={14} />
    Request Refund
  </button>
) : (
  <span className="customer-refund-unavailable">—</span>
)}

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
        
{selectedPayment && (
  <div className="customer-refund-overlay">
    <section
      className="customer-refund-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="customer-refund-title"
    >
      <div className="customer-refund-modal-header">
        <div>
          <p className="customer-billing-label">BILLING & PAYMENTS</p>
          <h2 id="customer-refund-title">Request a Refund</h2>
        </div>

        <button
          type="button"
          className="customer-refund-close"
          onClick={closeRefundForm}
          disabled={refundSubmitting}
          aria-label="Close refund form"
        >
          <X size={20} />
        </button>
      </div>

      <p className="customer-refund-info">
        Payment amount:{" "}
        <strong>
          ₹{Number(selectedPayment.amount).toLocaleString("en-IN")}
        </strong>
      </p>

      <p className="customer-refund-info">
        Transaction ID: {selectedPayment.transactionId}
      </p>

      {refundError && (
        <p className="customer-refund-error" role="alert">
          {refundError}
        </p>
      )}

      {refundMessage && (
        <p className="customer-refund-success" role="status">
          {refundMessage}
        </p>
      )}

      <form onSubmit={handleRefundSubmit}>
        <label htmlFor="refundReason">Reason for refund</label>

        <select
          id="refundReason"
          value={refundReason}
          onChange={(event) => setRefundReason(event.target.value)}
          required
          disabled={refundSubmitting}
        >
          <option value="">Select a reason</option>
          <option value="ACCIDENTAL_PURCHASE">
            Accidental Purchase
          </option>
          <option value="DUPLICATE_PAYMENT">
            Duplicate Payment
          </option>
          <option value="BILLING_ISSUE">Billing Issue</option>
          <option value="OTHER">Other</option>
        </select>

        <label htmlFor="refundDescription">
          Additional details (optional)
        </label>

        <textarea
          id="refundDescription"
          value={refundDescription}
          onChange={(event) =>
            setRefundDescription(event.target.value)
          }
          placeholder="Explain why you are requesting a refund..."
          rows={4}
          maxLength={1000}
          disabled={refundSubmitting}
        />

        <div className="customer-refund-actions">
          <button
            type="button"
            className="customer-refund-cancel"
            onClick={closeRefundForm}
            disabled={refundSubmitting}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="customer-refund-submit"
            disabled={refundSubmitting || !refundReason}
          >
            <Send size={15} />
            {refundSubmitting ? "Submitting..." : "Submit Request"}
          </button>
        </div>
      </form>

      <p className="customer-refund-disclaimer">
        Submitting a request does not guarantee approval or an actual
        payment refund. Your request will be reviewed.
      </p>
    </section>
  </div>
)}

      {/* Pagination */}
      {pagination.totalPayments > 0 && (
        <div className="customer-billing-pagination">
          <div className="customer-billing-page-size">
            <span>Rows per page</span>

            <select
              value={limit}
              onChange={handleLimitChange}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
            </select>
          </div>

          <div className="customer-billing-pagination-controls">
            <button
              type="button"
              onClick={() =>
                goToPage(currentPage - 1)
              }
              disabled={currentPage === 1}
            >
              Previous
            </button>

            {Array.from(
              {
                length: pagination.totalPages,
              },
              (_, index) => index + 1
            ).map((page) => (
              <button
                key={page}
                type="button"
                className={
                  currentPage === page
                    ? "active"
                    : ""
                }
                onClick={() =>
                  goToPage(page)
                }
              >
                {page}
              </button>
            ))}

            <button
              type="button"
              onClick={() =>
                goToPage(currentPage + 1)
              }
              disabled={
                currentPage ===
                pagination.totalPages
              }
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}