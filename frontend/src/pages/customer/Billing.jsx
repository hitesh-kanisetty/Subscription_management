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

        /*
         * Summary information should represent
         * all customer payments, not only the
         * payments shown on the current page.
         *
         * The current backend pagination response
         * does not contain summary data yet.
         */
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