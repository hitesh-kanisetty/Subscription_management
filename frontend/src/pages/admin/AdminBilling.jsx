import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API_URL from "../../config";
import {
  CreditCard,
  IndianRupee,
  Receipt,
  ArrowLeft,
  Search,
} from "lucide-react";
import "./AdminBilling.css";

function AdminBilling() {
  const navigate = useNavigate();

  const [billing, setBilling] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(5);

  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 0,
    totalPayments: 0,
    limit: 5,
  });

  /*
   * Delay backend search until the user
   * stops typing for 400ms.
   */
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchBilling = async () => {
  try {
    // Only show full-page loading on initial load
    if (!billing) {
      setLoading(true);
    }

    setError("");

    const params = new URLSearchParams({
      page: currentPage,
      limit,
    });

    if (debouncedSearch.trim()) {
      params.append(
        "search",
        debouncedSearch.trim()
      );
    }

    const response = await fetch(
      `${API_URL}/admin/billing?${params.toString()}`,
      {
        credentials: "include",
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Failed to fetch billing data"
      );
    }

    setBilling(data);

    setPagination(
      data.pagination || {
        currentPage: 1,
        totalPages: 0,
        totalPayments: 0,
        limit,
      }
    );
  } catch (err) {
    console.error("Admin billing error:", err);
    setError(
      err.message || "Something went wrong."
    );
  } finally {
    setLoading(false);
  }
};

  /*
   * Fetch only when:
   * - page changes
   * - page size changes
   * - debounced search changes
   */
  useEffect(() => {
    fetchBilling();
  }, [currentPage, limit, debouncedSearch]);

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1);
  };

  const clearSearch = () => {
    setSearchTerm("");
    setDebouncedSearch("");
    setCurrentPage(1);
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

  const formatAmount = (amount) => {
    return `₹${Number(amount || 0).toLocaleString(
      "en-IN",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    )}`;
  };

  const payments = billing?.payments || [];
  const summary = billing?.summary || {};

  if (loading) {
    return (
      <div className="admin-billing-page">
        <div className="admin-billing-message">
          Loading billing information...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-billing-page">
        <div className="admin-billing-message admin-billing-error">
          <p>{error}</p>

          <button onClick={fetchBilling}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-billing-page">
      {/* HEADER */}
      <header className="admin-billing-header">
        <div>
          <button
            type="button"
            className="admin-billing-back"
            onClick={() => navigate("/admin")}
            aria-label="Back to Dashboard"
          >
            <ArrowLeft size={15} />
            <span>Back to Dashboard</span>
          </button>

          <p className="admin-billing-eyebrow">
            FINANCIAL OVERVIEW
          </p>

          <h1>Billing & Payments</h1>

          <p className="admin-billing-description">
            View payment collections and subscription
            billing records.
          </p>
        </div>
      </header>

      {/* SUMMARY */}
      <section className="admin-billing-overview">
        <div className="admin-billing-stat">
          <div className="admin-billing-stat-icon">
            <IndianRupee size={18} />
          </div>

          <div>
            <span>TOTAL COLLECTED</span>

            <strong>
              {formatAmount(
                summary.totalCollected
              )}
            </strong>
          </div>
        </div>

        <div className="admin-billing-stat">
          <div className="admin-billing-stat-icon">
            <Receipt size={18} />
          </div>

          <div>
            <span>TOTAL PAYMENTS</span>

            <strong>
              {summary.successfulPayments || 0}
            </strong>
          </div>
        </div>

        <div className="admin-billing-stat">
          <div className="admin-billing-stat-icon">
            <CreditCard size={18} />
          </div>

          <div>
            <span>PAYMENT STATUS</span>

            <strong>PAID</strong>
          </div>
        </div>
      </section>

      {/* PAYMENT HISTORY */}
      <section className="admin-billing-card">
        <div className="admin-billing-section-heading">
          <div>
            <p>TRANSACTION RECORDS</p>

            <h2>Payment History</h2>
          </div>

          <span>
            {pagination.totalPayments} payment
            {pagination.totalPayments !== 1
              ? "s"
              : ""}
          </span>
        </div>

        {/* SEARCH */}
        <div className="admin-billing-search">
          <Search size={15} />

          <input
            type="text"
            placeholder="Search by customer, plan, transaction ID..."
            value={searchTerm}
            onChange={handleSearch}
          />

          {searchTerm && (
            <button
              type="button"
              className="admin-billing-search-clear"
              onClick={clearSearch}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>

        {/* EMPTY STATE */}
        {payments.length === 0 ? (
          <div className="admin-billing-empty">
            <Receipt size={25} />

            <strong>
              {pagination.totalPayments === 0
                ? searchTerm
                  ? "No matching payments"
                  : "No payments yet"
                : "No payments on this page"}
            </strong>

            <p>
              {pagination.totalPayments === 0
                ? searchTerm
                  ? "Try searching with a different customer, plan, or transaction ID."
                  : "Payment records will appear here when customers subscribe to plans."
                : "Try navigating to another page."}
            </p>
          </div>
        ) : (
          <div className="admin-billing-table-wrapper">
            <table className="admin-billing-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Plan</th>
                  <th>Amount</th>
                  {/* <th>Method</th> */}
                  <th>Transaction ID</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id}>
                    <td>
                      <div className="admin-billing-customer">
                        <strong>
                          {payment.customer?.name ||
                            "—"}
                        </strong>

                        <span>
                          {payment.customer?.email ||
                            "—"}
                        </span>
                      </div>
                    </td>

                    <td>
                      <div className="admin-billing-plan">
                        <strong>
                          {payment.plan?.name ||
                            "—"}
                        </strong>

                        <span>
                          {payment.plan
                            ?.billingPeriod ===
                          "YEARLY"
                            ? "Yearly"
                            : "Monthly"}
                        </span>
                      </div>
                    </td>

                    <td>
                      <strong className="admin-billing-amount">
                        {formatAmount(
                          payment.amount
                        )}
                      </strong>
                    </td>

                    {/* <td>
                      <span className="admin-billing-method">
                        {payment.paymentMethod || "—"}
                      </span>
                    </td> */}

                    <td>
                      <span className="admin-billing-transaction">
                        {payment.transactionId ||
                          "—"}
                      </span>
                    </td>

                    <td>
                      <span className="admin-billing-date">
                        {formatDate(
                          payment.paymentDate
                        )}
                      </span>
                    </td>

                    <td>
                      <span className="admin-billing-status">
                        {payment.status || "PAID"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* PAGINATION */}
        
      </section>
      {pagination.totalPages > 0 && (
          <div className="admin-billing-pagination">
            <div className="admin-billing-page-size">
              <span>Rows:</span>

              <select
                value={limit}
                onChange={handleLimitChange}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
              </select>
            </div>

            <div className="admin-billing-pagination-controls">
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
                  length:
                    pagination.totalPages,
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

export default AdminBilling;