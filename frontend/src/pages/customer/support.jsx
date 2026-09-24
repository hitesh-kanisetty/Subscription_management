import { useEffect, useState } from "react";
import {
  Eye,
  Plus,
  Search,
  ArrowLeft,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import "./support.css";
import API_URL from "../../config";

export default function Support() {
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

  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 0,
    totalTickets: 0,
    limit: 5,
  });

  /*
   * Search debounce
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
  useEffect(() => {
    const fetchTickets = async () => {
      try {
        setLoading(true);
        setError("");

        const queryParams = new URLSearchParams({
          page: currentPage,
          limit,
          search: debouncedSearch,
          status: statusFilter,
        });

        const response = await fetch(
          `${API_URL}/support?${queryParams.toString()}`,
          {
            method: "GET",
            credentials: "include",
          }
        );

        const data = await response.json();

        if (!response.ok) {
          setError(
            data.message ||
              "Unable to load support requests."
          );
          return;
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
          "Fetch support tickets error:",
          error
        );

        setError(
          "Unable to connect to the server."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, [
    currentPage,
    limit,
    debouncedSearch,
    statusFilter,
  ]);

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

  const getStatusClass = (status) => {
    switch (status) {
      case "OPEN":
        return "support-status-open";

      case "IN_PROGRESS":
        return "support-status-progress";

      case "RESOLVED":
        return "support-status-resolved";

      case "CLOSED":
        return "support-status-closed";

      default:
        return "";
    }
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

  return (
    <div className="support-page">
      {/* Header */}
      <header className="support-header">
        <div>
          <p className="support-eyebrow">
            SUPPORT
          </p>

          <h1>Support</h1>

          <p className="support-description">
            Create and manage your support
            requests.
          </p>
        </div>

        <button
          type="button"
          className="support-back"
          onClick={() => navigate("/user")}
          aria-label="Back to Dashboard"
        >
          <ArrowLeft size={15} />
          <span>Back to Dashboard</span>
        </button>

        <button
          type="button"
          className="support-create-button"
          onClick={() =>
            navigate("/user/support/create")
          }
        >
          <Plus size={17} />
          <span>New Request</span>
        </button>
      </header>

      {/* Search + Filters */}
      <div className="support-toolbar">
        <div className="support-search">
          <Search size={16} />

          <input
            type="text"
            placeholder="Search support requests..."
            value={search}
            onChange={handleSearch}
          />

          {search && (
            <button
              type="button"
              className="support-search-clear"
              onClick={clearSearch}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>

        <div className="support-filters">
          <button
            type="button"
            className={`support-filter ${
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
            className={`support-filter ${
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
            className={`support-filter ${
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

        <span className="support-result-count">
          {pagination.totalTickets}{" "}
          {pagination.totalTickets === 1
            ? "request"
            : "requests"}
        </span>
      </div>

      {/* Content */}
      <section className="support-card">
        {loading && (
          <div className="support-message">
            Loading support requests...
          </div>
        )}

        {error && (
          <div className="support-message support-error">
            {error}
          </div>
        )}

        {!loading &&
          !error &&
          tickets.length === 0 && (
            <div className="support-empty">
              <div className="support-empty-icon">
                <Search size={22} />
              </div>

              <h3>
                {search
                  ? "No requests found"
                  : statusFilter !== "ALL"
                  ? "No requests found"
                  : "No support requests yet"}
              </h3>

              <p>
                {search
                  ? "Try a different search term."
                  : statusFilter !== "ALL"
                  ? "There are no requests in this status."
                  : "Create a support request if you need help."}
              </p>

              {!search &&
                statusFilter === "ALL" && (
                  <button
                    type="button"
                    className="support-empty-button"
                    onClick={() =>
                      navigate(
                        "/user/support/create"
                      )
                    }
                  >
                    <Plus size={16} />
                    Create Request
                  </button>
                )}
            </div>
          )}

        {!loading &&
          !error &&
          tickets.length > 0 && (
            <div className="support-table-wrapper">
              <table className="support-table">
                <thead>
                  <tr>
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
                      <td>
                        <div className="support-subject">
                          <strong>
                            {ticket.subject}
                          </strong>

                          <span>
                            Request #{ticket.id}
                          </span>
                        </div>
                      </td>

                      <td>
                        <span className="support-category">
                          {formatCategory(
                            ticket.category
                          )}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`support-status ${getStatusClass(
                            ticket.status
                          )}`}
                        >
                          {formatStatus(
                            ticket.status
                          )}
                        </span>
                      </td>

                      <td>
                        <span className="support-date">
                          {formatDate(
                            ticket.createdAt
                          )}
                        </span>
                      </td>

                      <td>
                        <button
                          type="button"
                          className="support-view-button"
                          onClick={() =>
                            navigate(
                              `/user/support/${ticket.id}`
                            )
                          }
                          aria-label={`View request ${ticket.id}`}
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

      {/* Pagination */}
      {pagination.totalTickets > 0 && (
        <div className="support-pagination">
          <div className="support-page-size">
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

          <div className="support-pagination-controls">
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