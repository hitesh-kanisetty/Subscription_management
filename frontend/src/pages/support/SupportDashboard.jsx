import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  Ticket,
  Clock3,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import API_URL from "../../config";
import "./SupportDashboard.css";

export default function SupportDashboard() {
  const { user } = useOutletContext();

  const [stats, setStats] = useState({
    totalAssigned: 0,
    openTickets: 0,
    resolvedTickets: 0,
    urgentTickets: 0,
  });

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_URL}/support-agent/dashboard`,
          {
            credentials: "include",
          }
        );

        const data = await response.json();

        if (!response.ok) {
          setError(
            data.message || "Unable to load dashboard."
          );
          return;
        }

        setStats(data.stats);
        setTickets(data.tickets || []);
      } catch (error) {
        console.error(
          "Support dashboard error:",
          error
        );

        setError("Unable to connect to the server.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  return (
    <div className="support-dashboard-page">
      <div className="support-dashboard-header">
        <div>
          <p className="support-dashboard-eyebrow">
            SUPPORT WORKSPACE
          </p>

          <h1>
            Welcome back,{" "}
            {user?.name?.split(" ")[0] || "Agent"}.
          </h1>

          <p>
            Manage assigned customer tickets and keep support
            requests moving forward.
          </p>
        </div>
      </div>

      {error && (
        <p className="support-dashboard-error">
          {error}
        </p>
      )}

      <div className="support-stats-grid">
        <div className="support-stat-card">
          <div className="support-stat-icon">
            <Ticket size={19} />
          </div>

          <div>
            <span>Assigned Tickets</span>
            <strong>
              {loading ? "—" : stats.totalAssigned}
            </strong>
          </div>
        </div>

        <div className="support-stat-card">
          <div className="support-stat-icon">
            <Clock3 size={19} />
          </div>

          <div>
            <span>Open Tickets</span>
            <strong>
              {loading ? "—" : stats.openTickets}
            </strong>
          </div>
        </div>

        <div className="support-stat-card">
          <div className="support-stat-icon">
            <CheckCircle2 size={19} />
          </div>

          <div>
            <span>Resolved</span>
            <strong>
              {loading ? "—" : stats.resolvedTickets}
            </strong>
          </div>
        </div>

        <div className="support-stat-card">
          <div className="support-stat-icon">
            <AlertCircle size={19} />
          </div>

          <div>
            <span>Urgent</span>
            <strong>
              {loading ? "—" : stats.urgentTickets}
            </strong>
          </div>
        </div>
      </div>

      <section className="support-dashboard-section">
        <div className="support-section-heading">
          <div>
            <p>YOUR WORK</p>
            <h2>Assigned Tickets</h2>
          </div>

          <span>
            {stats.totalAssigned} ticket
            {stats.totalAssigned !== 1 ? "s" : ""}
          </span>
        </div>

        {loading ? (
          <div className="support-empty-state">
            <h3>Loading tickets...</h3>
          </div>
        ) : tickets.length === 0 ? (
          <div className="support-empty-state">
            <div className="support-empty-icon">
              <Ticket size={22} />
            </div>

            <h3>No tickets assigned</h3>

            <p>
              Tickets assigned to you will appear here.
            </p>
          </div>
        ) : (
          <div className="support-dashboard-ticket-list">
            {tickets.map((ticket) => (
              <div
                className="support-dashboard-ticket"
                key={ticket.id}
              >
                <div>
                  <strong>
                    #{ticket.id} — {ticket.subject}
                  </strong>

                  <span>
                    {ticket.user?.name || "Customer"}{" "}
                    •{" "}
                    {ticket.category}
                  </span>
                </div>

                <div className="support-dashboard-ticket-meta">
                  <span
                    className={`support-ticket-priority priority-${ticket.priority?.toLowerCase()}`}
                  >
                    {ticket.priority}
                  </span>

                  <span
                    className={`support-ticket-status status-${ticket.status?.toLowerCase()}`}
                  >
                    {ticket.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}