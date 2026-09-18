import { useEffect, useState } from "react";
import { Eye, Search,ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import API_URL from "../../config";
import "./AdminSupport.css";

export default function AdminSupport() {
  const navigate = useNavigate();

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState("ALL");

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_URL}/admin/support`,
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
      } catch (error) {
        console.error(
          "Fetch admin support tickets error:",
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
  }, []);

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

  // =========================
  // Search + Status Filter
  // =========================

  const filteredTickets = tickets.filter(
    (ticket) => {
      const searchTerm = search
        .trim()
        .toLowerCase();

      // =========================
      // Status Filter
      // =========================

      if (
        statusFilter === "OPEN" &&
        ticket.status === "CLOSED"
      ) {
        return false;
      }

      if (
        statusFilter === "CLOSED" &&
        ticket.status !== "CLOSED"
      ) {
        return false;
      }

      // =========================
      // Search Filter
      // =========================

      if (!searchTerm) {
        return true;
      }

      return (
        ticket.subject
          ?.toLowerCase()
          .includes(searchTerm) ||
        ticket.category
          ?.toLowerCase()
          .includes(searchTerm) ||
        ticket.status
          ?.toLowerCase()
          .includes(searchTerm) ||
        ticket.user?.name
          ?.toLowerCase()
          .includes(searchTerm) ||
        ticket.user?.email
          ?.toLowerCase()
          .includes(searchTerm)
      );
    }
  );

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
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />
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
              setStatusFilter("ALL")
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
              setStatusFilter("OPEN")
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
              setStatusFilter("CLOSED")
            }
          >
            Closed
          </button>
        </div>

        <span className="admin-support-result-count">
          {filteredTickets.length}{" "}
          {filteredTickets.length === 1
            ? "request"
            : "requests"}
        </span>
      </div>

      {/* Content */}
      <section className="admin-support-card">
        {loading && (
          <div className="admin-support-message">
            Loading support requests...
          </div>
        )}

        {error && (
          <div className="admin-support-message admin-support-error">
            {error}
          </div>
        )}

        {!loading &&
          !error &&
          filteredTickets.length === 0 && (
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

        {!loading &&
          !error &&
          filteredTickets.length > 0 && (
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
                  {filteredTickets.map(
                    (ticket) => (
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
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
      </section>
    </div>
  );
}