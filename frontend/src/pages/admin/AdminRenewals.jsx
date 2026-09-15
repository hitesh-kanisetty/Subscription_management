import { useEffect, useMemo, useState } from "react";
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

  const fetchRenewals = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/admin/renewals`,
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
    } catch (err) {
      console.error("Admin renewals error:", err);
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRenewals();
  }, []);

  const formatDate = (date) => {
    if (!date) return "—";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatAmount = (amount) => {
    return `₹${Number(amount || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const getDaysUntilRenewal = (date) => {
    if (!date) return null;

    const today = new Date();
    const renewal = new Date(date);

    today.setHours(0, 0, 0, 0);
    renewal.setHours(0, 0, 0, 0);

    return Math.ceil(
      (renewal - today) / (1000 * 60 * 60 * 24)
    );
  };

  const getRenewalLabel = (date) => {
    const days = getDaysUntilRenewal(date);

    if (days === null) return "—";
    if (days === 0) return "Today";
    if (days === 1) return "Tomorrow";

    return `${days} days`;
  };

  const filteredRenewals = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    if (!search) {
      return renewals;
    }

    return renewals.filter((renewal) => {
      const customerName =
        renewal.customer?.name?.toLowerCase() || "";

      const customerEmail =
        renewal.customer?.email?.toLowerCase() || "";

      const planName =
        renewal.plan?.name?.toLowerCase() || "";

      return (
        customerName.includes(search) ||
        customerEmail.includes(search) ||
        planName.includes(search)
      );
    });
  }, [renewals, searchTerm]);

  const totalUpcomingValue = renewals.reduce(
    (total, renewal) =>
      total + Number(renewal.plan?.price || 0),
    0
  );

  if (loading) {
    return (
      <div className="admin-renewals-page">
        <div className="admin-renewals-message">
          Loading renewal information...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-renewals-page">
        <div className="admin-renewals-message admin-renewals-error">
          <p>{error}</p>

          <button onClick={fetchRenewals}>
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
            className="admin-renewals-back"
            onClick={() => navigate("/admin")}
          >
            <ArrowLeft size={13} />
            Back to Dashboard
          </button>

          <p className="admin-renewals-eyebrow">
            SUBSCRIPTION MONITORING
          </p>

          <h1>Renewals</h1>

          <p className="admin-renewals-description">
            Monitor upcoming subscription renewal dates and
            renewal status.
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
            <span>UPCOMING RENEWALS</span>
            <strong>{renewals.length}</strong>
          </div>
        </div>

        <div className="admin-renewals-stat">
          <div className="admin-renewals-stat-icon">
            <IndianRupee size={18} />
          </div>

          <div>
            <span>PLAN VALUE</span>
            <strong>
              {formatAmount(totalUpcomingValue)}
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
            {filteredRenewals.length} renewal
            {filteredRenewals.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* SEARCH */}
        <div className="admin-renewals-search">
          <Search size={15} />

          <input
            type="text"
            placeholder="Search by customer, email, or plan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          {searchTerm && (
            <button
              type="button"
              className="admin-renewals-search-clear"
              onClick={() => setSearchTerm("")}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>

        {filteredRenewals.length === 0 ? (
          <div className="admin-renewals-empty">
            <CalendarClock size={25} />

            <strong>
              {renewals.length === 0
                ? "No upcoming renewals"
                : "No matching renewals"}
            </strong>

            <p>
              {renewals.length === 0
                ? "Active subscriptions with upcoming renewal dates will appear here."
                : "Try searching with a different customer or plan."}
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
                {filteredRenewals.map((renewal) => (
                  <tr key={renewal.id}>
                    <td>
                      <div className="admin-renewals-customer">
                        <strong>
                          {renewal.customer?.name || "—"}
                        </strong>

                        <span>
                          {renewal.customer?.email || "—"}
                        </span>
                      </div>
                    </td>

                    <td>
                      <div className="admin-renewals-plan">
                        <strong>
                          {renewal.plan?.name || "—"}
                        </strong>

                        <span>
                          {renewal.plan?.billingPeriod === "YEARLY"
                            ? "Yearly"
                            : "Monthly"}
                        </span>
                      </div>
                    </td>

                    <td>
                      <strong className="admin-renewals-amount">
                        {formatAmount(renewal.plan?.price)}
                      </strong>
                    </td>

                    <td>
                      <span className="admin-renewals-date">
                        {formatDate(renewal.startDate)}
                      </span>
                    </td>

                    <td>
  <div className="admin-renewal-date">
    <CalendarClock size={15} />

    <strong>
      {new Date(renewal.renewalDate).getDate()}
    </strong>

    <span>
      {new Date(renewal.renewalDate)
        .toLocaleDateString("en-US", {
          month: "short",
        })
        .toUpperCase()}
    </span>
  </div>
</td>

                    <td>
                      <span className="admin-renewals-due">
                        {getRenewalLabel(renewal.renewalDate)}
                      </span>
                    </td>

                    <td>
                      <span className="admin-renewals-status">
                        {renewal.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default AdminRenewals;