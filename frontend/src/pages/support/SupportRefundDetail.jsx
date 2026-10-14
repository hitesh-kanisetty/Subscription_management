
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  UserRound,
  CreditCard,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import API_URL from "../../config";
import "./SupportRefundDetail.css";

export default function SupportRefundDetail() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [refund, setRefund] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reviewNote, setReviewNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState("");

  const fetchRefund = async () => {
    try {
      setLoading(true);
      setError("");

      // Reuse the existing list API and find this refund.
      const response = await fetch(`${API_URL}/support/refunds`, {
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load refund request");
      }

      const request = (data.refundRequests || []).find(
        (item) => String(item.id) === String(id)
      );

      if (!request) {
        throw new Error("Refund request not found");
      }

      setRefund(request);

      const recommendation = request.adminNote || "";
      const noteMatch = recommendation.match(/Review note:\s*([\s\S]*)/i);

      if (noteMatch) {
        setReviewNote(noteMatch[1].trim());
      }
    } catch (err) {
      setError(err.message || "Unable to load refund request");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRefund();
  }, [id]);

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

  const formatAmount = (amount) =>
    `₹${Number(amount || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const getRecommendation = () => {
    const match = refund?.adminNote?.match(
      /Agent recommendation:\s*(APPROVAL|REJECTION)/i
    );

    return match ? match[1].toUpperCase() : null;
  };

  const submitAction = async (action) => {
    if (busy || !refund) return;

    if (
      action !== "START_REVIEW" &&
      !window.confirm(
        action === "RECOMMEND_APPROVAL"
          ? "Submit your recommendation to approve this refund for admin review?"
          : "Submit your recommendation to reject this refund for admin review?"
      )
    ) {
      return;
    }

    try {
      setBusy(true);
      setError("");
      setSuccess("");

      const response = await fetch(
        `${API_URL}/support/refunds/${refund.id}`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action,
            reviewNote: reviewNote.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to update refund review");
      }

      setSuccess(data.message || "Refund review updated successfully");
      await fetchRefund();
    } catch (err) {
      setError(err.message || "Unable to update refund review");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="refund-detail-message">
        Loading refund request...
      </div>
    );
  }

  if (error && !refund) {
    return (
      <div className="refund-detail-message refund-detail-error">
        <p>{error}</p>
        <button onClick={() => navigate("/support/refunds")}>
          Back to Refund Requests
        </button>
      </div>
    );
  }

  if (!refund) return null;

  const recommendation = getRecommendation();
  const canStartReview = refund.status === "PENDING";
  const canRecommend =
    refund.status === "UNDER_REVIEW" && !recommendation;

  return (
    <div className="support-refund-detail-page">
      <header className="refund-detail-header">
        <button
          type="button"
          className="refund-back-button"
          onClick={() => navigate("/support/refunds")}
        >
          <ArrowLeft size={15} />
          Back to Refund Requests
        </button>

        <div className="refund-detail-heading">
          <div>
            <p className="refund-detail-eyebrow">REFUND REVIEW</p>
            <h1>Refund #{refund.id}</h1>
            <p>Review the customer's request and submit your recommendation.</p>
          </div>

          <span
            className={`refund-status refund-status-${refund.status.toLowerCase()}`}
          >
            {refund.status.replaceAll("_", " ")}
          </span>
        </div>
      </header>

      {error && <div className="refund-detail-alert error">{error}</div>}
      {success && (
        <div className="refund-detail-alert success">{success}</div>
      )}

      <div className="refund-detail-grid">
        <main className="refund-detail-main">
          <section className="refund-detail-card">
            <div className="refund-detail-card-header">
              <UserRound size={16} />
              <h2>Customer Information</h2>
            </div>

            <div className="refund-detail-card-body">
              <div className="refund-customer-avatar">
                {refund.user?.name?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <div>
                <strong>{refund.user?.name || "Unknown customer"}</strong>
                <p>{refund.user?.email || "-"}</p>
                <small>Customer ID: {refund.user?.id ?? "-"}</small>
              </div>
            </div>
          </section>

          <section className="refund-detail-card">
            <div className="refund-detail-card-header">
              <CreditCard size={16} />
              <h2>Payment Information</h2>
            </div>

            <div className="refund-detail-info-grid">
              <div>
                <span>Payment ID</span>
                <strong>#{refund.payment?.id ?? refund.paymentId}</strong>
              </div>
              <div>
                <span>Amount</span>
                <strong>{formatAmount(refund.payment?.amount)}</strong>
              </div>
              <div>
                <span>Payment Status</span>
                <strong>{refund.payment?.status || "-"}</strong>
              </div>
              <div>
                <span>Payment Method</span>
                <strong>{refund.payment?.paymentMethod || "-"}</strong>
              </div>
              <div>
                <span>Transaction ID</span>
                <strong className="refund-break-word">
                  {refund.payment?.transactionId || "-"}
                </strong>
              </div>
              <div>
                <span>Payment Date</span>
                <strong>{formatDate(refund.payment?.paymentDate)}</strong>
              </div>
              <div>
                <span>Subscription Plan</span>
                <strong>
                  {refund.payment?.subscription?.plan?.name || "-"}
                </strong>
              </div>
            </div>
          </section>

          <section className="refund-detail-card">
            <div className="refund-detail-card-header">
              <FileText size={16} />
              <h2>Customer's Refund Request</h2>
            </div>

            <div className="refund-detail-description">
              <div>
                <span>Reason</span>
                <strong>{refund.reason?.replaceAll("_", " ") || "-"}</strong>
              </div>

              <div>
                <span>Description</span>
                <p>{refund.description || "No additional description provided."}</p>
              </div>

              <div>
                <span>Submitted</span>
                <strong>{formatDate(refund.createdAt)}</strong>
              </div>
            </div>
          </section>

          <section className="refund-detail-card">
            <div className="refund-detail-card-header">
              <Clock size={16} />
              <h2>Agent Review</h2>
            </div>

            <div className="refund-detail-review-body">
              {recommendation && (
                <div className="refund-recommendation-summary">
                  <strong>Recommendation already submitted</strong>
                  <span>{recommendation}</span>
                  <p>
                    The request remains under review until the admin makes
                    the final decision.
                  </p>
                </div>
              )}

              {!recommendation && refund.adminNote && (
                <div className="refund-existing-note">
                  <strong>Existing review note</strong>
                  <p>{refund.adminNote}</p>
                </div>
              )}

              <label htmlFor="refund-review-note">
                Review Notes
              </label>
              <textarea
                id="refund-review-note"
                value={reviewNote}
                onChange={(event) => setReviewNote(event.target.value)}
                maxLength={1000}
                rows={5}
                placeholder="Explain why you recommend approval or rejection..."
                disabled={!canRecommend || busy}
              />
              <small>{reviewNote.length}/1000 characters</small>

              <div className="refund-review-actions">
                {canStartReview && (
                  <button
                    type="button"
                    className="refund-action-primary"
                    disabled={busy}
                    onClick={() => submitAction("START_REVIEW")}
                  >
                    <Clock size={15} />
                    {busy ? "Updating..." : "Start Review"}
                  </button>
                )}

                {canRecommend && (
                  <>
                    <button
                      type="button"
                      className="refund-action-approve"
                      disabled={busy}
                      onClick={() => submitAction("RECOMMEND_APPROVAL")}
                    >
                      <CheckCircle size={15} />
                      Recommend Approval
                    </button>

                    <button
                      type="button"
                      className="refund-action-reject"
                      disabled={busy}
                      onClick={() => submitAction("RECOMMEND_REJECTION")}
                    >
                      <XCircle size={15} />
                      Recommend Rejection
                    </button>
                  </>
                )}

                {!canStartReview && !canRecommend && (
                  <p className="refund-review-locked">
                    {refund.status === "UNDER_REVIEW"
                      ? "A recommendation has already been submitted."
                      : "This request is not available for agent review."}
                  </p>
                )}
              </div>
            </div>
          </section>
        </main>

        <aside className="refund-detail-sidebar">
          <section className="refund-detail-card">
            <div className="refund-detail-card-header">
              <h2>Review Summary</h2>
            </div>

            <div className="refund-summary-body">
              <div>
                <span>Refund Amount</span>
                <strong className="refund-summary-amount">
                  {formatAmount(refund.payment?.amount)}
                </strong>
              </div>
              <div>
                <span>Request Status</span>
                <strong>{refund.status.replaceAll("_", " ")}</strong>
              </div>
              <div>
                <span>Recommendation</span>
                <strong>{recommendation || "Not submitted"}</strong>
              </div>
              <div>
                <span>Last Updated</span>
                <strong>{formatDate(refund.updatedAt)}</strong>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
