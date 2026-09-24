import { useEffect, useState } from "react";
import {
  Eye,
  Search,
  ArrowLeft,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import API_URL from "../../config";
import "./AdminSupport.css";

export default function AdminSupport() {
  const navigate = useNavigate();

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("ALL");

  const [currentPage, setCurrentPage] =
    useState(1);

  const [limit, setLimit] = useState(5);

  const [pagination, setPagination] =
    useState({
      currentPage: 1,
      totalPages: 0,
      totalTickets: 0,
      limit: 5,
    });

  /*
   * Search debounce
   *
   * Wait 400ms after the user stops typing
   * before sending the search request.
   */
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);

    return () => clearTimeout(timer);
  }, [search]);

  /*
   * Fetch support tickets
   */
  const fetchTickets = async () => {
    try {
      /*
       * Only show full-page loading
       * on the initial request.
       *
       * This prevents the search input from
       * disappearing and losing focus.
       */
      if (tickets.length === 0 && currentPage === 1) {
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

      if (statusFilter !== "ALL") {
        params.append(
          "status",
          statusFilter
        );
      }

      const response = await fetch(
        `${API_URL}/admin/support?${params.toString()}`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to load support requests."
        );
      }

      setTickets(data.tickets || []);

      setPagination(
        data.pagination || {
          currentPage: 1,
          totalPages: 0,
          totalTickets: 0,
          limit,
        }
      );
    } catch (error) {
      console.error(
        "Fetch admin support tickets error:",
        error
      );

      setError(
        error.message ||
          "Unable to connect to the server."
      );
    } finally {
      setLoading(false);
    }
  };

  /*
   * Fetch when:
   * - page changes
   * - page size changes
   * - status changes
   * - debounced search changes
   */
  useEffect(() => {
    fetchTickets();
  }, [
    currentPage,
    limit,
    statusFilter,
    debouncedSearch,
  ]);

  const handleSearch = (event) => {
    setSearch(event.target.value);
    setCurrentPage(1);
  };

  const clearSearch = () => {
    setSearch("");
    setDebouncedSearch("");
    setCurrentPage(1);
  };

  const handleStatusFilter = (status) => {
    setStatusFilter(status);
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

  const formatStatus = (status) => {
    if (!status) return "—";

    return status
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase()
      );
  };

  const formatCategory = (category) => {
    if (!category) return "—";

    return category
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase()
      );
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "OPEN":
        return "admin-support-status-open";

      case "IN_PROGRESS":
        return "admin-support-status-progress";

      case "RESOLVED":
        return "admin-support-status-resolved";

      case "CLOSED":
        return "admin-support-status-closed";

      default:
        return "";
    }
  };

  /*
   * Initial loading state
   */
  if (loading) {
    return (
      <div className="admin-support-page">
        <div className="admin-support-message">
          Loading support requests...
        </div>
      </div>
    );
  }

  /*
   * Error state
   */
  if (error && tickets.length === 0) {
    return (
      <div className="admin-support-page">
        <div className="admin-support-message admin-support-error">
          <p>{error}</p>

          <button onClick={fetchTickets}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-support-page">
      {/* Header */}
      <header className="admin-support-header">
        <div>
          <button
            type="button"
            className="admin-support-back"
            onClick={() => navigate("/admin")}
            aria-label="Back to Dashboard"
          >
            <ArrowLeft size={15} />
            <span>Back to Dashboard</span>
          </button>

          <p className="admin-support-eyebrow">
            SUPPORT MANAGEMENT
          </p>

          <h1>Support Requests</h1>

          <p className="admin-support-description">
            View and manage customer support
            requests and conversations.
          </p>
        </div>
      </header>

      {/* Search + Filters */}
      <div className="admin-support-toolbar">
        <div className="admin-support-search">
          <Search size={16} />

          <input
            type="text"
            placeholder="Search requests, customers..."
            value={search}
            onChange={handleSearch}
          />

          {search && (
            <button
              type="button"
              className="admin-support-search-clear"
              onClick={clearSearch}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>

        <div className="admin-support-filters">
          <button
            type="button"
            className={`admin-support-filter ${
              statusFilter === "ALL"
                ? "active"
                : ""
            }`}
            onClick={() =>
              handleStatusFilter("ALL")
            }
          >
            All
          </button>

          <button
            type="button"
            className={`admin-support-filter ${
              statusFilter === "OPEN"
                ? "active"
                : ""
            }`}
            onClick={() =>
              handleStatusFilter("OPEN")
            }
          >
            Open
          </button>

          <button
            type="button"
            className={`admin-support-filter ${
              statusFilter === "CLOSED"
                ? "active"
                : ""
            }`}
            onClick={() =>
              handleStatusFilter("CLOSED")
            }
          >
            Closed
          </button>
        </div>

        <span className="admin-support-result-count">
          {pagination.totalTickets}{" "}
          {pagination.totalTickets === 1
            ? "request"
            : "requests"}
        </span>
      </div>

      {/* Content */}
      <section className="admin-support-card">
        {error && (
          <div className="admin-support-message admin-support-error">
            {error}
          </div>
        )}

        {tickets.length === 0 && (
          <div className="admin-support-empty">
            <div className="admin-support-empty-icon">
              <Search size={22} />
            </div>

            <h3>
              {search
                ? "No requests found"
                : "No support requests yet"}
            </h3>

            <p>
              {search
                ? "Try a different search term."
                : "Customer support requests will appear here."}
            </p>
          </div>
        )}

        {tickets.length > 0 && (
          <div className="admin-support-table-wrapper">
            <table className="admin-support-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Subject</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {tickets.map((ticket) => (
                  <tr key={ticket.id}>
                    {/* Customer */}
                    <td>
                      <div className="admin-support-customer">
                        <div className="admin-support-avatar">
                          {ticket.user?.name
                            ?.charAt(0)
                            .toUpperCase()}
                        </div>

                        <div className="admin-support-customer-info">
                          <strong>
                            {ticket.user?.name ||
                              "Unknown Customer"}
                          </strong>

                          <span>
                            {ticket.user?.email ||
                              "—"}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Subject */}
                    <td>
                      <div className="admin-support-subject">
                        <strong>
                          {ticket.subject}
                        </strong>

                        <span>
                          Request #{ticket.id}
                        </span>
                      </div>
                    </td>

                    {/* Category */}
                    <td>
                      <span className="admin-support-category">
                        {formatCategory(
                          ticket.category
                        )}
                      </span>
                    </td>

                    {/* Status */}
                    <td>
                      <span
                        className={`admin-support-status ${getStatusClass(
                          ticket.status
                        )}`}
                      >
                        {formatStatus(
                          ticket.status
                        )}
                      </span>
                    </td>

                    {/* Created */}
                    <td>
                      <span className="admin-support-date">
                        {formatDate(
                          ticket.createdAt
                        )}
                      </span>
                    </td>

                    {/* Action */}
                    <td>
                      <button
                        type="button"
                        className="admin-support-view-button"
                        onClick={() =>
                          navigate(
                            `/admin/support/${ticket.id}`
                          )
                        }
                        aria-label={`View support request ${ticket.id}`}
                      >
                        <Eye size={16} />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* PAGINATION - OUTSIDE CARD */}
      {pagination.totalPages > 0 && (
        <div className="admin-support-pagination">
          <div className="admin-support-page-size">
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

          <div className="admin-support-pagination-controls">
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