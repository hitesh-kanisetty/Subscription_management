import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Send,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { io } from "socket.io-client";
import API_URL from "../../config";
import "./AdminSupportDetails.css";

export default function AdminSupportDetails() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [ticket, setTicket] = useState(null);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [updatingStatus, setUpdatingStatus] =
    useState(false);

  const [error, setError] = useState("");

  const fetchTicket = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/admin/support/${id}`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.message ||
            "Unable to load support request."
        );
        return;
      }

      setTicket(data.ticket);
      setStatus(data.ticket.status);
    } catch (error) {
      console.error(
        "Fetch admin support ticket error:",
        error
      );

      setError(
        "Unable to connect to the server."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicket();
  }, [id]);

  /*
   * =====================================================
   * SOCKET.IO - ADMIN CONNECTION
   * =====================================================
   */

  useEffect(() => {
    if (!id) {
      return;
    }

    const socket = io(
      `${API_URL}`,
      {
        withCredentials: true,
      }
    );

    socket.on("connect", () => {
      console.log(
        "Admin socket connected:",
        socket.id
      );

      socket.emit(
        "join-support-ticket",
        id
      );
    });

    socket.on(
      "new-support-message",
      (data) => {
        if (
          String(data.ticketId) !== String(id)
        ) {
          return;
        }

        setTicket((currentTicket) => {
          if (!currentTicket) {
            return currentTicket;
          }

          const existingMessages =
            currentTicket.messages || [];

          const messageAlreadyExists =
            existingMessages.some(
              (item) =>
                item.id ===
                data.ticketMessage.id
            );

          if (messageAlreadyExists) {
            return currentTicket;
          }

          return {
            ...currentTicket,
            messages: [
              ...existingMessages,
              data.ticketMessage,
            ],
          };
        });
      }
    );

    socket.on("connect_error", (error) => {
      console.error(
        "Admin socket connection error:",
        error
      );
    });

    socket.on("disconnect", () => {
      console.log(
        "Admin socket disconnected"
      );
    });

    return () => {
      socket.disconnect();
    };
  }, [id]);

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

  const formatDateTime = (date) => {
    if (!date) return "—";

    return new Date(date).toLocaleString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  const formatStatus = (value) => {
    if (!value) return "—";

    return value
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase()
      );
  };

  const formatCategory = (value) => {
    if (!value) return "—";

    return value
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase()
      );
  };

  const getStatusClass = (value) => {
    switch (value) {
      case "OPEN":
        return "admin-support-details-status-open";

      case "IN_PROGRESS":
        return "admin-support-details-status-progress";

      case "RESOLVED":
        return "admin-support-details-status-resolved";

      case "CLOSED":
        return "admin-support-details-status-closed";

      default:
        return "";
    }
  };

  const handleStatusChange = async (event) => {
    const newStatus = event.target.value;

    if (!newStatus || newStatus === ticket.status) {
      return;
    }

    // Once a ticket is closed, it cannot be changed again.
    if (ticket.status === "CLOSED") {
      setStatus("CLOSED");
      return;
    }

    // Confirm before permanently closing the ticket.
    if (newStatus === "CLOSED") {
      const confirmed = window.confirm(
        "Are you sure you want to close this support request?\n\nOnce closed, it cannot be reopened or changed again."
      );

      if (!confirmed) {
        setStatus(ticket.status);
        return;
      }
    }

    try {
      setUpdatingStatus(true);
      setError("");

      const response = await fetch(
        `${API_URL}/admin/support/${id}/status`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: newStatus,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setStatus(ticket.status);

        setError(
          data.message ||
            "Unable to update ticket status."
        );
        return;
      }

      setTicket((currentTicket) => ({
        ...currentTicket,
        status: data.ticket.status,
      }));

      setStatus(data.ticket.status);
    } catch (error) {
      console.error(
        "Update support ticket status error:",
        error
      );

      setStatus(ticket.status);

      setError(
        "Unable to connect to the server."
      );
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleSendMessage = async (event) => {
    event.preventDefault();

    const trimmedMessage = message.trim();

    if (!trimmedMessage) {
      return;
    }

    try {
      setSending(true);
      setError("");

      const response = await fetch(
        `${API_URL}/admin/support/${id}/messages`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: trimmedMessage,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.message ||
            "Unable to send message."
        );
        return;
      }

      setMessage("");
    } catch (error) {
      console.error(
        "Send admin support message error:",
        error
      );

      setError(
        "Unable to connect to the server."
      );
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-support-details-page">
        <div className="admin-support-details-message">
          Loading support request...
        </div>
      </div>
    );
  }

  if (error && !ticket) {
    return (
      <div className="admin-support-details-page">
        <button
          type="button"
          className="admin-support-details-back"
          onClick={() =>
            navigate("/admin/support")
          }
        >
          <ArrowLeft size={17} />
          <span>Back to Support</span>
        </button>

        <div className="admin-support-details-message admin-support-details-error">
          {error}
        </div>
      </div>
    );
  }

  if (!ticket) {
    return null;
  }

  const messages = ticket.messages || [];

  const canReply = ticket.status !== "CLOSED";
  const isClosed = ticket.status === "CLOSED";

  return (
    <div className="admin-support-details-page">
      {/* Header */}
      <header className="admin-support-details-header">
        <button
          type="button"
          className="admin-support-details-back"
          onClick={() =>
            navigate("/admin/support")
          }
        >
          <ArrowLeft size={17} />
          <span>Back to Support</span>
        </button>

        <div className="admin-support-details-title-row">
          <div>
            <p className="admin-support-details-eyebrow">
              SUPPORT REQUEST #{ticket.id}
            </p>

            <h1>{ticket.subject}</h1>
          </div>

          <span
            className={`admin-support-details-status ${getStatusClass(
              ticket.status
            )}`}
          >
            {formatStatus(ticket.status)}
          </span>
        </div>

        <div className="admin-support-details-meta">
          <span>
            Category:{" "}
            <strong>
              {formatCategory(ticket.category)}
            </strong>
          </span>

          <span>
            Created:{" "}
            <strong>
              {formatDate(ticket.createdAt)}
            </strong>
          </span>
        </div>
      </header>

      {/* Error */}
      {error && ticket && (
        <div className="admin-support-details-inline-error">
          {error}
        </div>
      )}

      {/* Customer + Status */}
      <section className="admin-support-details-card">
        <div className="admin-support-details-card-header">
          <div>
            <h2>Request Information</h2>

            <p>
              Customer and support request
              details.
            </p>
          </div>
        </div>

        <div className="admin-support-details-info-grid">
          <div className="admin-support-details-info-item">
            <span>Customer</span>

            <strong>
              {ticket.user?.name ||
                "Unknown Customer"}
            </strong>
          </div>

          <div className="admin-support-details-info-item">
            <span>Email</span>

            <strong>
              {ticket.user?.email || "—"}
            </strong>
          </div>

          <div className="admin-support-details-info-item">
            <span>Category</span>

            <strong>
              {formatCategory(ticket.category)}
            </strong>
          </div>

          <div className="admin-support-details-info-item">
            <span>Created</span>

            <strong>
              {formatDateTime(ticket.createdAt)}
            </strong>
          </div>
        </div>

        <div className="admin-support-details-status-control">
          <label htmlFor="ticket-status">
            Update Status
          </label>

          <select
            id="ticket-status"
            value={status}
            onChange={handleStatusChange}
            disabled={
              updatingStatus || isClosed
            }
          >
            <option value="OPEN">Open</option>

            <option value="IN_PROGRESS">
              In Progress
            </option>

            <option value="RESOLVED">
              Resolved
            </option>

            <option value="CLOSED">
              Closed
            </option>
          </select>

          {updatingStatus && (
            <span>Updating...</span>
          )}

          {isClosed && (
            <span>
              This ticket is permanently closed.
            </span>
          )}
        </div>
      </section>

      {/* Customer Request */}
      <section className="admin-support-details-card">
        <div className="admin-support-details-card-header">
          <div>
            <h2>Customer Request</h2>

            <p>
              Original issue submitted by the
              customer.
            </p>
          </div>
        </div>

        <div className="admin-support-details-description">
          {ticket.description}
        </div>

        {/* Related Payment */}
        {ticket.payment && (
          <div className="admin-support-details-payment">
            <div>
              <span>Payment</span>

              <strong>
                #{ticket.payment.id}
              </strong>
            </div>

            <div>
              <span>Amount</span>

              <strong>
                ₹
                {Number(
                  ticket.payment.amount
                ).toFixed(2)}
              </strong>
            </div>

            <div>
              <span>Status</span>

              <strong>
                {ticket.payment.status}
              </strong>
            </div>

            <div>
              <span>Date</span>

              <strong>
                {formatDate(
                  ticket.payment.paymentDate
                )}
              </strong>
            </div>
          </div>
        )}
      </section>

      {/* Conversation */}
      <section className="admin-support-details-card">
        <div className="admin-support-details-card-header">
          <div>
            <h2>Conversation</h2>

            <p>
              Communication between the customer
              and support team.
            </p>
          </div>
        </div>

        <div className="admin-support-details-messages">
          {messages.length === 0 ? (
            <div className="admin-support-details-no-messages">
              No replies yet.
            </div>
          ) : (
            messages.map((item) => {
              const isAdmin =
                item.sender?.role?.name ===
                "ADMIN";

              return (
                <div
                  key={item.id}
                  className={`admin-support-details-message-row ${
                    isAdmin
                      ? "admin-support-details-message-admin"
                      : "admin-support-details-message-customer"
                  }`}
                >
                  <div className="admin-support-details-message-bubble">
                    <div className="admin-support-details-message-header">
                      <strong>
                        {isAdmin
                          ? "Support Team"
                          : item.sender?.name ||
                            "Customer"}
                      </strong>

                      <span>
                        {formatDateTime(
                          item.createdAt
                        )}
                      </span>
                    </div>

                    <p>{item.message}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Reply */}
        {canReply ? (
          <form
            className="admin-support-details-reply"
            onSubmit={handleSendMessage}
          >
            <textarea
              value={message}
              onChange={(event) =>
                setMessage(event.target.value)
              }
              placeholder="Write a reply to the customer..."
              rows={4}
              maxLength={2000}
              disabled={sending}
            />

            <div className="admin-support-details-reply-footer">
              <span>
                {message.length}/2000
              </span>

              <button
                type="submit"
                disabled={
                  sending ||
                  !message.trim()
                }
              >
                <Send size={15} />

                <span>
                  {sending
                    ? "Sending..."
                    : "Send Reply"}
                </span>
              </button>
            </div>
          </form>
        ) : (
          <div className="admin-support-details-closed">
            This support request is closed and
            can no longer receive replies.
          </div>
        )}
      </section>
    </div>
  );
}