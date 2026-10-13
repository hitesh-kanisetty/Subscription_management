import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import API_URL from "../../config";
import "./SupportMyTickets.css";
export default function SupportMyTickets() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [priority, setPriority] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchTickets = async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();

      if (search.trim()) {
        params.append("search", search.trim());
      }

      if (status !== "ALL") {
        params.append("status", status);
      }

      if (priority !== "ALL") {
        params.append("priority", priority);
      }

      const response = await fetch(
        `${API_URL}/support-agent/tickets?${params.toString()}`,
        {
          credentials: "include",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch tickets");
      }

      setTickets(data.tickets || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [status, priority]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTickets();
    }, 400);

    return () => clearTimeout(timer);
  }, [search]);

  const formatDate = (date) => {
    if (!date) return "-";

    return new Date(date).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getPriorityClass = (priority) => {
    return `support-priority priority-${priority?.toLowerCase()}`;
  };

  const getStatusClass = (status) => {
    return `support-status status-${status?.toLowerCase()}`;
  };

  return (
    <div className="support-page">
      <div className="support-page-header">
        <div>
          <h1>My Tickets</h1>
          <p>Tickets assigned to you</p>
        </div>
      </div>

      <div className="support-ticket-toolbar">
        <div className="support-search-box">
          <Search size={18} />

          <input
            type="text"
            placeholder="Search tickets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="ALL">All Status</option>
          <option value="OPEN">Open</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="RESOLVED">Resolved</option>
        </select>

        <select value={priority} onChange={(e) => setPriority(e.target.value)}>
          <option value="ALL">All Priority</option>
          <option value="URGENT">Urgent</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>
      </div>

      {loading ? (
        <div className="support-empty-state">Loading tickets...</div>
      ) : error ? (
        <div className="support-error-state">{error}</div>
      ) : tickets.length === 0 ? (
        <div className="support-empty-state">No tickets assigned to you.</div>
      ) : (
        <div className="support-tickets-table-wrapper">
          <table className="support-tickets-table">
            <thead>
              <tr>
                {/* <th>ID</th> */}
                <th>CUSTOMER</th>
                <th>SUBJECT</th>
                <th>CATEGORY</th>
                <th>PRIORITY</th>
                <th>STATUS</th>
                <th>SLA</th>
                <th>UPDATED</th>
                <th>ACTION</th>
              </tr>
            </thead>

            <tbody>
              {tickets.map((ticket) => (
                <tr key={ticket.id}>
                  {/* <td>#{ticket.id}</td> */}

                  <td>
                    <div className="support-customer-cell">
                      <strong>{ticket.user?.name || "Unknown"}</strong>

                      <span>{ticket.user?.email || "-"}</span>
                    </div>
                  </td>

                  <td>
                    <span className="support-ticket-subject">
                      {ticket.subject}
                    </span>
                  </td>

                  <td>{ticket.category}</td>

                  <td>
                    <span className={getPriorityClass(ticket.priority)}>
                      {ticket.priority}
                    </span>
                  </td>

                  <td>
                    <span className={getStatusClass(ticket.status)}>
                      {ticket.status.replace("_", " ")}
                    </span>
                  </td>
                  <td>
  <div className="support-list-sla">
    <span
      className={`support-list-sla-status sla-${ticket.sla?.responseStatus?.toLowerCase() || "pending"}`}
    >
      Response: {ticket.sla?.responseStatus || "PENDING"}
    </span>

    <span
      className={`support-list-sla-status sla-${ticket.sla?.resolutionStatus?.toLowerCase() || "pending"}`}
    >
      Resolution: {ticket.sla?.resolutionStatus || "PENDING"}
    </span>
  </div>
</td>
                  <td>
                    <span className="support-ticket-date">
                      {formatDate(ticket.updatedAt)}
                    </span>
                  </td>

                  <td>
                    <button
                      type="button"
                      className="support-view-ticket-btn"
                      onClick={() => navigate(`/support/tickets/${ticket.id}`)}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
