import { useEffect, useState } from "react";
import { Eye, Plus, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

import "./support.css";
import API_URL from "../../config";
export default function Support() {
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
          `${API_URL}/support`,
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

  const filteredTickets = tickets.filter(
    (ticket) => {
      const searchTerm = search
        .trim()
        .toLowerCase();

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
          .includes(searchTerm)
      );
    }
  );

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
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />
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
              setStatusFilter("ALL")
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
              setStatusFilter("OPEN")
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
              setStatusFilter("CLOSED")
            }
          >
            Closed
          </button>
        </div>

        <span className="support-result-count">
          {filteredTickets.length}{" "}
          {filteredTickets.length === 1
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
          filteredTickets.length === 0 && (
            <div className="support-empty">
              <div className="support-empty-icon">
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
                  : "Create a support request if you need help."}
              </p>

              {!search && (
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
          filteredTickets.length > 0 && (
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
                  {filteredTickets.map(
                    (ticket) => (
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