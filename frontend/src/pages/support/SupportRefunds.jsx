
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ReceiptText } from "lucide-react";
import API_URL from "../../config";
import "./SupportRefunds.css";

export default function SupportRefunds() {
  const navigate = useNavigate();

  const [refunds, setRefunds] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchRefunds = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/support/refunds`,
        { credentials: "include", },
      );

      const data = await response.json();

      if (!response.ok) {
            console.log("Refund API error:", response.status, data);

  throw new Error(
    `HTTP ${response.status}: ${
      data.message || "Failed to fetch refund requests"
    }`
  );
}

      setRefunds(data.refundRequests || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRefunds();
  }, []);

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

  const filteredRefunds = refunds.filter((refund) => {
    const query = search.trim().toLowerCase();

    const matchesSearch =
      !query ||
      String(refund.id).includes(query) ||
      refund.user?.name?.toLowerCase().includes(query) ||
      refund.user?.email?.toLowerCase().includes(query) ||
      refund.payment?.transactionId?.toLowerCase().includes(query);

    const matchesStatus =
      status === "ALL" || refund.status === status;

    return matchesSearch && matchesStatus;
  });

  const getStatusClass = (value) =>
    `refund-status refund-status-${value?.toLowerCase()}`;

  return (
    <div className="support-page support-refunds-page">
      <div className="support-page-header">
        <div>
          <h1>Refund Requests</h1>
          <p>Review customer refund requests and forward recommendations to the admin.</p>
        </div>
      </div>

      <div className="support-ticket-toolbar">
        <div className="support-search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search customer, refund ID or transaction..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="ALL">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="UNDER_REVIEW">Under Review</option>
          <option value="APPROVED">Awaiting Admin (Recommended Approval)</option>
          <option value="REJECTED">Awaiting Admin (Recommended Rejection)</option>
          <option value="PROCESSING">Processing</option>
          <option value="REFUNDED">Refunded</option>
        </select>
      </div>

      {loading ? (
        <div className="support-empty-state">Loading refund requests...</div>
      ) : error ? (
        <div className="support-error-state">{error}</div>
      ) : filteredRefunds.length === 0 ? (
        <div className="support-empty-state">
          No refund requests found.
        </div>
      ) : (
        <div className="support-tickets-table-wrapper">
          <table className="support-tickets-table support-refunds-table">
            <thead>
              <tr>
                <th>REFUND</th>
                <th>CUSTOMER</th>
                <th>TRANSACTION</th>
                <th>AMOUNT</th>
                <th>REASON</th>
                <th>STATUS</th>
                <th>SUBMITTED</th>
                <th>ACTION</th>
              </tr>
            </thead>

            <tbody>
              {filteredRefunds.map((refund) => (
                <tr key={refund.id}>
                  <td>#{refund.id}</td>

                  <td>
                    <div className="support-customer-cell">
                      <strong>{refund.user?.name || "Unknown"}</strong>
                      <span>{refund.user?.email || "-"}</span>
                    </div>
                  </td>

                  <td>
                    <span className="refund-transaction">
                      {refund.payment?.transactionId || "-"}
                    </span>
                  </td>

                  <td>
                    ₹{Number(refund.payment?.amount || 0).toLocaleString("en-IN")}
                  </td>

                  <td>
                    <span className="refund-reason">
                      {refund.reason?.replaceAll("_", " ") || "-"}
                    </span>
                  </td>

                  <td>
                    <span className={getStatusClass(refund.status)}>
                      {refund.status?.replaceAll("_", " ")}
                    </span>
                  </td>

                  <td>
                    <span className="support-ticket-date">
                      {formatDate(refund.createdAt)}
                    </span>
                  </td>

                  <td>
                    <button
                      type="button"
                      className="support-view-ticket-btn"
                      onClick={() =>
                        navigate(`/support/refunds/${refund.id}`)
                      }
                    >
                      <ReceiptText size={14} />
                      Review
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
