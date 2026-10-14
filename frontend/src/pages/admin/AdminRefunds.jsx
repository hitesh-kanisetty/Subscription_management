import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  RefreshCw,
  RotateCcw,
  Search,
} from "lucide-react";
import API_URL from "../../config";
import "./AdminRefunds.css";

function AdminRefunds() {
  const navigate = useNavigate();

  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [processingId, setProcessingId] = useState(null);
  const [adminNotes, setAdminNotes] = useState({});

  const fetchRefunds = async () => {
    try {
      setLoading(true);
      setError("");

      // Replace this URL if your backend uses a different admin listing route.
      const response = await fetch(
        `${API_URL}/admin/refunds`,
        { credentials: "include" }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load refund requests.");
      }

      setRefunds(Array.isArray(data) ? data : data.refunds || []);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRefunds();
  }, []);

  const handleDecision = async (refundId, action) => {
    const actionLabel = action === "APPROVE" ? "approve" : "reject";

    if (!window.confirm(`Are you sure you want to ${actionLabel} this refund?`)) {
      return;
    }

    try {
      setProcessingId(refundId);

      const response = await fetch(
        `${API_URL}/admin/refunds/${refundId}/decision`,
        {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action,
            adminNote: adminNotes[refundId] || "",
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to process refund decision.");
      }

      await fetchRefunds();
      window.alert(data.message || `Refund ${actionLabel} action completed.`);
    } catch (err) {
      window.alert(err.message || "Unable to process refund decision.");
    } finally {
      setProcessingId(null);
    }
  };

  const filteredRefunds = refunds.filter((refund) => {
    const search = searchTerm.trim().toLowerCase();

    if (!search) return true;

    return [
      refund.user?.name,
      refund.user?.email,
      refund.reason,
      refund.status,
      refund.payment?.transactionId,
      refund.payment?.subscription?.plan?.name,
    ].some((value) => String(value || "").toLowerCase().includes(search));
  });

  const formatAmount = (amount) =>
    `₹${Number(amount || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const formatDate = (date) =>
    date
      ? new Date(date).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "—";

  const getRecommendation = (note = "") => {
    if (/Agent recommendation:\s*APPROVAL/i.test(note)) {
      return "Approval recommended";
    }

    if (/Agent recommendation:\s*REJECTION/i.test(note)) {
      return "Rejection recommended";
    }

    return "No recommendation";
  };

  if (loading) {
    return (
      <div className="admin-refunds-page">
        <div className="admin-refunds-message">Loading refund requests...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-refunds-page">
        <div className="admin-refunds-message admin-refunds-error">
          <p>{error}</p>
          <button type="button" onClick={fetchRefunds}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-refunds-page">
      <header className="admin-refunds-header">
        <div>
          <button
            type="button"
            className="admin-refunds-back"
            onClick={() => navigate("/admin")}
          >
            <ArrowLeft size={15} />
            <span>Back to Dashboard</span>
          </button>

          <p className="admin-refunds-eyebrow">PAYMENT OPERATIONS</p>
          <h1>Refund Requests</h1>
          <p className="admin-refunds-description">
            Review support recommendations and make final refund decisions.
          </p>
        </div>

        <button
          type="button"
          className="admin-refunds-refresh"
          onClick={fetchRefunds}
        >
          <RefreshCw size={15} />
          Refresh
        </button>
      </header>

      <section className="admin-refunds-overview">
        <div className="admin-refunds-stat">
          <span>TOTAL REQUESTS</span>
          <strong>{refunds.length}</strong>
        </div>

        <div className="admin-refunds-stat">
          <span>AWAITING DECISION</span>
          <strong>
            {refunds.filter((refund) => refund.status === "UNDER_REVIEW").length}
          </strong>
        </div>

        <div className="admin-refunds-stat">
          <span>REFUNDED</span>
          <strong>
            {refunds.filter((refund) => refund.status === "REFUNDED").length}
          </strong>
        </div>
      </section>

      <section className="admin-refunds-card">
        <div className="admin-refunds-section-heading">
          <div>
            <p>REQUEST MANAGEMENT</p>
            <h2>All Refund Requests</h2>
          </div>
          <span>{filteredRefunds.length} request(s)</span>
        </div>

        <div className="admin-refunds-search">
          <Search size={15} />
          <input
            type="text"
            placeholder="Search customer, transaction, reason..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>

        {filteredRefunds.length === 0 ? (
          <div className="admin-refunds-empty">
            <RotateCcw size={25} />
            <strong>No refund requests found</strong>
            <p>
              {searchTerm
                ? "Try another search term."
                : "Refund requests will appear here when customers submit them."}
            </p>
          </div>
        ) : (
          <div className="admin-refunds-table-wrapper">
            <table className="admin-refunds-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Plan</th>
                  <th>Amount</th>
                  <th>Reason</th>
                  <th>Recommendation</th>
                  <th>Requested</th>
                  <th>Status</th>
                  <th>Admin Decision</th>
                </tr>
              </thead>

              <tbody>
                {filteredRefunds.map((refund) => {
                  const note = refund.adminNote || "";
                  const canDecide =
                    refund.status === "UNDER_REVIEW" &&
                    /Agent recommendation:\s*(APPROVAL|REJECTION)/i.test(note);

                  return (
                    <tr key={refund.id}>
                      <td>
                        <div className="admin-refunds-customer">
                          <strong>{refund.user?.name || "—"}</strong>
                          <span>{refund.user?.email || "—"}</span>
                        </div>
                      </td>

                      <td>
                        {refund.payment?.subscription?.plan?.name || "—"}
                      </td>

                      <td>
                        <strong>
                          {formatAmount(refund.payment?.amount)}
                        </strong>
                      </td>

                      <td>
                        <div className="admin-refunds-reason">
                          <strong>{refund.reason?.replaceAll("_", " ") || "—"}</strong>
                          <span>{refund.description || "No additional details"}</span>
                        </div>
                      </td>

                      <td>{getRecommendation(note)}</td>
                      <td>{formatDate(refund.createdAt)}</td>
                      <td>
                        <span className={`admin-refunds-status status-${refund.status?.toLowerCase()}`}>
                          {refund.status?.replaceAll("_", " ") || "UNKNOWN"}
                        </span>
                      </td>

                      <td>
                        {canDecide ? (
                          <div className="admin-refunds-decision">
                            <textarea
                              rows={2}
                              placeholder="Optional admin note"
                              value={adminNotes[refund.id] || ""}
                              onChange={(event) =>
                                setAdminNotes((previous) => ({
                                  ...previous,
                                  [refund.id]: event.target.value,
                                }))
                              }
                            />

                            <div>
                              <button
                                type="button"
                                disabled={processingId === refund.id}
                                onClick={() => handleDecision(refund.id, "APPROVE")}
                              >
                                {processingId === refund.id ? "Processing..." : "Approve"}
                              </button>

                              <button
                                type="button"
                                className="reject"
                                disabled={processingId === refund.id}
                                onClick={() => handleDecision(refund.id, "REJECT")}
                              >
                                Reject
                              </button>
                            </div>
                          </div>
                        ) : (
                          <span>—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default AdminRefunds;