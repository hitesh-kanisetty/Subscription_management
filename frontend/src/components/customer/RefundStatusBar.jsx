
import { useState } from "react";
import { createPortal } from "react-dom";
import {
  CheckCircle2,
  ChevronDown,
  Clock3,
  X,
  XCircle,
} from "lucide-react";
import "./RefundStatusBar.css";

const statusConfig = {
  PENDING: {
    label: "Pending",
    progress: 35,
    message: "Your request has been submitted and is waiting for review.",
    color: "pending",
  },
  UNDER_REVIEW: {
    label: "Under Review",
    progress: 60,
    message: "Your refund request is currently being reviewed.",
    color: "review",
  },
  APPROVED: {
    label: "Approved",
    progress: 75,
    message: "Your request is approved and awaiting completion.",
    color: "approved",
  },
  PROCESSING: {
    label: "Processing",
    progress: 90,
    message: "Your refund is being processed.",
    color: "processing",
  },
  REFUNDED: {
    label: "Refunded",
    progress: 100,
    message: "The refund workflow has been marked as completed.",
    color: "refunded",
  },
  REJECTED: {
    label: "Rejected",
    progress: 0,
    message: "Your refund request was rejected.",
    color: "rejected",
  },
};

const reasonLabels = {
  ACCIDENTAL_PURCHASE: "Accidental Purchase",
  DUPLICATE_PAYMENT: "Duplicate Payment",
  BILLING_ISSUE: "Billing Issue",
  OTHER: "Other",
};

function formatDate(date) {
  if (!date) return "—";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "—";

  return parsedDate.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function RefundStatusBar({ refundRequest, payment }) {
  const [expanded, setExpanded] = useState(false);
  const [isDark, setIsDark] = useState(false);

  if (!refundRequest) return null;

  const status =
    statusConfig[refundRequest.status] || statusConfig.PENDING;

  const isRejected = refundRequest.status === "REJECTED";

  const openDetails = () => {
    const dashboard = document.querySelector(
      '.customer-dashboard-shell[data-theme="dark"]'
    );

    setIsDark(Boolean(dashboard));
    setExpanded(true);
  };

  const closeDetails = () => setExpanded(false);

  return (
    <div className="refund-status-container">
      <button
        type="button"
        className={`refund-status-toggle ${status.color}`}
        onClick={expanded ? closeDetails : openDetails}
        aria-expanded={expanded}
        aria-label={`View refund details: ${status.label}`}
      >
        <span className="refund-status-main">
          <span className="refund-status-icon">
            {isRejected ? (
              <XCircle size={15} />
            ) : refundRequest.status === "REFUNDED" ? (
              <CheckCircle2 size={15} />
            ) : (
              <Clock3 size={15} />
            )}
          </span>

          <span className="refund-status-text">
            <span className="refund-status-title">{status.label}</span>
            <span className="refund-status-caption">
              View refund details
            </span>
          </span>
        </span>

        <ChevronDown
          size={15}
          className={`refund-status-chevron ${
            expanded ? "expanded" : ""
          }`}
        />
      </button>

      {!isRejected && (
        <div
          className="refund-status-track"
          role="progressbar"
          aria-label="Refund workflow progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={status.progress}
        >
          <div
            className={`refund-status-fill ${status.color}`}
            style={{ width: `${status.progress}%` }}
          />
        </div>
      )}

      {expanded &&
        createPortal(
          <div
            className={`refund-status-overlay ${
              isDark ? "refund-status-dark" : ""
            }`}
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                closeDetails();
              }
            }}
          >
            <section
              className="refund-status-dialog"
              role="dialog"
              aria-modal="true"
              aria-labelledby="refund-status-dialog-title"
            >
              <header className="refund-status-dialog-header">
                <div>
                  <span className="refund-status-eyebrow">
                    BILLING & PAYMENTS
                  </span>
                  <h2 id="refund-status-dialog-title">
                    Refund Details
                  </h2>
                </div>

                <button
                  type="button"
                  className="refund-status-close"
                  onClick={closeDetails}
                  aria-label="Close refund details"
                >
                  <X size={19} />
                </button>
              </header>

              <div className={`refund-status-summary ${status.color}`}>
                <div className="refund-status-summary-heading">
                  <span>{status.label}</span>
                  <span>{status.progress}%</span>
                </div>

                {!isRejected && (
                  <div className="refund-status-track">
                    <div
                      className={`refund-status-fill ${status.color}`}
                      style={{ width: `${status.progress}%` }}
                    />
                  </div>
                )}

                <p>{status.message}</p>
              </div>

              <div className="refund-status-detail-row">
                <span>Payment amount</span>
                <strong>
                  ₹
                  {Number(payment?.amount || 0).toLocaleString("en-IN", {
                    maximumFractionDigits: 2,
                  })}
                </strong>
              </div>

              <div className="refund-status-detail-row">
                <span>Reason</span>
                <strong>
                  {reasonLabels[refundRequest.reason] ||
                    refundRequest.reason}
                </strong>
              </div>

              <div className="refund-status-detail-row">
                <span>Request submitted</span>
                <strong>{formatDate(refundRequest.createdAt)}</strong>
              </div>

              {refundRequest.description && (
                <div className="refund-status-description">
                  <span>Additional details</span>
                  <p>{refundRequest.description}</p>
                </div>
              )}

              {refundRequest.adminNote && (
                <div className="refund-status-description">
                  <span>Review note</span>
                  <p>{refundRequest.adminNote}</p>
                </div>
              )}

              <div className="refund-status-detail-row">
                <span>Last updated</span>
                <strong>{formatDate(refundRequest.updatedAt)}</strong>
              </div>

              <div className="refund-status-transaction">
                <span>Transaction ID</span>
                <strong>{payment?.transactionId || "—"}</strong>
              </div>

              <footer className="refund-status-dialog-footer">
                <button type="button" onClick={closeDetails}>
                  Close
                </button>
              </footer>
            </section>
          </div>,
          document.body
        )}
    </div>
  );
}
