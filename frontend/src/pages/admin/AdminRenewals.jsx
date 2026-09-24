import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarClock,
  IndianRupee,
  RefreshCw,
  ArrowLeft,
  Search,
} from "lucide-react";
import "./AdminRenewals.css";
import API_URL from "../../config";

function AdminRenewals() {
  const navigate = useNavigate();

  const [renewals, setRenewals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(5);

  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 0,
    totalRenewals: 0,
    limit: 5,
  });

  const fetchRenewals = async (
    page = currentPage,
    pageLimit = limit,
    search = searchTerm
  ) => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams({
        page,
        limit: pageLimit,
      });

      if (search.trim()) {
        params.append("search", search.trim());
      }

      const response = await fetch(
        `${API_URL}/admin/renewals?${params.toString()}`,
        {
          credentials: "include",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to fetch renewals"
        );
      }

      setRenewals(data.renewals || []);

      setPagination(
        data.pagination || {
          currentPage: page,
          totalPages: 0,
          totalRenewals: 0,
          limit: pageLimit,
        }
      );
    } catch (err) {
      console.error("Admin renewals error:", err);
      setError(
        err.message || "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  };

  // Initial load and pagination/page-size changes
  useEffect(() => {
    fetchRenewals(
      currentPage,
      limit,
      searchTerm
    );
  }, [currentPage, limit]);

  // Debounced backend search
  useEffect(() => {
    if (searchTerm === "") {
      setCurrentPage(1);
      fetchRenewals(1, limit, "");
      return;
    }

    const timer = setTimeout(() => {
      setCurrentPage(1);
      fetchRenewals(
        1,
        limit,
        searchTerm
      );
    }, 400);

    return () => clearTimeout(timer);
  }, [searchTerm]);

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

  const getDaysUntilRenewal = (date) => {
    if (!date) return null;

    const today = new Date();
    const renewal = new Date(date);

    today.setHours(0, 0, 0, 0);
    renewal.setHours(0, 0, 0, 0);

    return Math.ceil(
      (renewal - today) /
        (1000 * 60 * 60 * 24)
    );
  };

  const getRenewalLabel = (date) => {
    const days = getDaysUntilRenewal(date);

    if (days === null) return "—";
    if (days === 0) return "Today";
    if (days === 1) return "Tomorrow";

    return `${days} days`;
  };

  // Calculate value of renewals on current page
  const totalUpcomingValue = renewals.reduce(
    (total, renewal) =>
      total +
      Number(renewal.plan?.price || 0),
    0
  );

  const handleSearchChange = (value) => {
    setSearchTerm(value);
  };

  const handleLimitChange = (value) => {
    setLimit(Number(value));
    setCurrentPage(1);
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(
        currentPage - 1
      );
    }
  };

  const goToNextPage = () => {
    if (
      currentPage <
      pagination.totalPages
    ) {
      setCurrentPage(
        currentPage + 1
      );
    }
  };

  const getPageNumbers = () => {
    const totalPages =
      pagination.totalPages;

    if (totalPages <= 5) {
      return Array.from(
        { length: totalPages },
        (_, index) => index + 1
      );
    }

    if (currentPage <= 3) {
      return [1, 2, 3, 4, 5];
    }

    if (
      currentPage >=
      totalPages - 2
    ) {
      return [
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ];
    }

    return [
      currentPage - 2,
      currentPage - 1,
      currentPage,
      currentPage + 1,
      currentPage + 2,
    ];
  };

  // Initial page loading only
  if (loading && renewals.length === 0) {
    return (
      <div className="admin-renewals-page">
        <div className="admin-renewals-message">
          Loading renewal information...
        </div>
      </div>
    );
  }

  if (error && renewals.length === 0) {
    return (
      <div className="admin-renewals-page">
        <div className="admin-renewals-message admin-renewals-error">
          <p>{error}</p>

          <button onClick={() => fetchRenewals()}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-renewals-page">
      {/* HEADER */}
      <header className="admin-renewals-header">
        <div>
          <button
            type="button"
            className="admin-renewals-back"
            onClick={() =>
              navigate("/admin")
            }
            aria-label="Back to Dashboard"
          >
            <ArrowLeft size={15} />
            <span>
              Back to Dashboard
            </span>
          </button>

          <p className="admin-renewals-eyebrow">
            SUBSCRIPTION MONITORING
          </p>

          <h1>Renewals</h1>

          <p className="admin-renewals-description">
            Monitor upcoming subscription
            renewal dates and renewal status.
          </p>
        </div>
      </header>

      {/* OVERVIEW */}
      <section className="admin-renewals-overview">
        <div className="admin-renewals-stat">
          <div className="admin-renewals-stat-icon">
            <CalendarClock size={18} />
          </div>

          <div>
            <span>
              UPCOMING RENEWALS
            </span>

            <strong>
              {pagination.totalRenewals}
            </strong>
          </div>
        </div>

        <div className="admin-renewals-stat">
          <div className="admin-renewals-stat-icon">
            <IndianRupee size={18} />
          </div>

          <div>
            <span>PLAN VALUE</span>

            <strong>
              {formatAmount(
                totalUpcomingValue
              )}
            </strong>
          </div>
        </div>

        <div className="admin-renewals-stat">
          <div className="admin-renewals-stat-icon">
            <RefreshCw size={18} />
          </div>

          <div>
            <span>ACTIVE STATUS</span>
            <strong>ACTIVE</strong>
          </div>
        </div>
      </section>

      {/* RENEWALS */}
      <section className="admin-renewals-card">
        <div className="admin-renewals-section-heading">
          <div>
            <p>RENEWAL RECORDS</p>
            <h2>Upcoming Renewals</h2>
          </div>

          <span>
            {pagination.totalRenewals} renewal
            {pagination.totalRenewals !== 1
              ? "s"
              : ""}
          </span>
        </div>

        {/* SEARCH */}
        <div className="admin-renewals-search">
          <Search size={15} />

          <input
            type="text"
            placeholder="Search by customer, email, or plan..."
            value={searchTerm}
            onChange={(e) =>
              handleSearchChange(
                e.target.value
              )
            }
          />

          {searchTerm && (
            <button
              type="button"
              className="admin-renewals-search-clear"
              onClick={() =>
                handleSearchChange("")
              }
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>

        {renewals.length === 0 ? (
          <div className="admin-renewals-empty">
            <CalendarClock size={25} />

            <strong>
              {searchTerm
                ? "No matching renewals"
                : "No upcoming renewals"}
            </strong>

            <p>
              {searchTerm
                ? "Try searching with a different customer or plan."
                : "Active subscriptions with upcoming renewal dates will appear here."}
            </p>
          </div>
        ) : (
          <div className="admin-renewals-table-wrapper">
            <table className="admin-renewals-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Plan</th>
                  <th>Amount</th>
                  <th>Started</th>
                  <th>Renewal Date</th>
                  <th>Due In</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {renewals.map(
                  (renewal) => (
                    <tr key={renewal.id}>
                      <td>
                        <div className="admin-renewals-customer">
                          <strong>
                            {renewal.customer
                              ?.name || "—"}
                          </strong>

                          <span>
                            {renewal.customer
                              ?.email || "—"}
                          </span>
                        </div>
                      </td>

                      <td>
                        <div className="admin-renewals-plan">
                          <strong>
                            {renewal.plan
                              ?.name || "—"}
                          </strong>

                          <span>
                            {renewal.plan
                              ?.billingPeriod ===
                            "YEARLY"
                              ? "Yearly"
                              : "Monthly"}
                          </span>
                        </div>
                      </td>

                      <td>
                        <strong className="admin-renewals-amount">
                          {formatAmount(
                            renewal.plan
                              ?.price
                          )}
                        </strong>
                      </td>

                      <td>
                        <span className="admin-renewals-date">
                          {formatDate(
                            renewal.startDate
                          )}
                        </span>
                      </td>

                      <td>
                        <div className="admin-renewal-date">
                          <CalendarClock
                            size={15}
                          />

                          <strong>
                            {new Date(
                              renewal.renewalDate
                            ).getDate()}
                          </strong>

                          <span>
                            {new Date(
                              renewal.renewalDate
                            )
                              .toLocaleDateString(
                                "en-US",
                                {
                                  month:
                                    "short",
                                }
                              )
                              .toUpperCase()}
                          </span>
                        </div>
                      </td>

                      <td>
                        <span className="admin-renewals-due">
                          {getRenewalLabel(
                            renewal.renewalDate
                          )}
                        </span>
                      </td>

                      <td>
                        <span className="admin-renewals-status">
                          {renewal.status}
                        </span>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* PAGINATION */}
      {pagination.totalPages > 0 && (
        <div className="admin-renewals-pagination">
          <div className="admin-renewals-page-size">
            <span>Show</span>

            <select
              value={limit}
              onChange={(e) =>
                handleLimitChange(
                  e.target.value
                )
              }
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="20">20</option>
            </select>

            <span>per page</span>
          </div>

          <div className="admin-renewals-pagination-controls">
            <button
              type="button"
              onClick={
                goToPreviousPage
              }
              disabled={
                currentPage === 1
              }
            >
              Previous
            </button>

            {getPageNumbers().map(
              (page) => (
                <button
                  key={page}
                  type="button"
                  className={
                    currentPage === page
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    setCurrentPage(page)
                  }
                >
                  {page}
                </button>
              )
            )}

            <button
              type="button"
              onClick={goToNextPage}
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

export default AdminRenewals;