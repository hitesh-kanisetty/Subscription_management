import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Mail,
  Send,
  Paperclip,
  X,
  FileText,
  Download,
  Image as ImageIcon,
} from "lucide-react";
import { io } from "socket.io-client";
import { useNavigate, useParams } from "react-router-dom";
import API_URL from "../../config";
import "./SupportTicketDetail.css";

const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const ALLOWED_FILE_EXTENSIONS = ".pdf,.png,.jpg,.jpeg,.doc,.docx";

export default function SupportTicketDetail() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [message, setMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusError, setStatusError] = useState("");
  const [chatError, setChatError] = useState("");

  const [previewAttachment, setPreviewAttachment] = useState(null);

  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  const isClosed = ticket?.status === "CLOSED";
  const messages = ticket?.messages || [];
  const [slaNow, setSlaNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setSlaNow(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    let cancelled = false;

    const fetchTicket = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`${API_URL}/support-agent/tickets/${id}`, {
          credentials: "include",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to fetch ticket");
        }

        if (!cancelled) {
          setTicket({
            ...data.ticket,
            messages: data.ticket.messages || [],
          });
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchTicket();

    return () => {
      cancelled = true;
    };
  }, [id]);

  // Live messages and status changes for this ticket.
  useEffect(() => {
    if (!id) return;

    const socket = io(API_URL, { withCredentials: true });

    socket.on("connect", () => {
      socket.emit("join-support-ticket", id);
    });

    socket.on("new-support-message", (data) => {
      if (String(data.ticketId) !== String(id) || !data.ticketMessage) {
        return;
      }

      setTicket((current) => {
        if (!current) return current;

        const incoming = data.ticketMessage;
        const alreadyExists = (current.messages || []).some(
          (item) => String(item.id) === String(incoming.id),
        );

        if (alreadyExists) return current;

        return {
          ...current,
          messages: [...(current.messages || []), incoming],
        };
      });
    });

    socket.on("support-ticket-status-updated", (data) => {
      if (String(data.ticketId) !== String(id)) return;

      setTicket((current) =>
        current ? { ...current, status: data.status } : current,
      );

      if (data.status === "CLOSED") {
        setMessage("");
        setSelectedFile(null);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

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
  const formatDuration = (minutes) => {
    if (minutes === null || minutes === undefined) return "Awaiting response";

    const totalMinutes = Math.max(0, Math.round(minutes));
    const hours = Math.floor(totalMinutes / 60);
    const remainingMinutes = totalMinutes % 60;

    if (hours === 0) return `${remainingMinutes}m`;
    if (remainingMinutes === 0) return `${hours}h`;

    return `${hours}h ${remainingMinutes}m`;
  };

  const formatRemaining = (deadline) => {
    if (!deadline) return "-";

    const remaining = new Date(deadline).getTime() - slaNow;

    if (remaining <= 0) {
      return `Overdue by ${formatDuration(Math.ceil(-remaining / 60000))}`;
    }

    return `${formatDuration(Math.ceil(remaining / 60000))} remaining`;
  };

  const formatSlaStatus = (status) => {
    if (status === "MET") return "Met";
    if (status === "BREACHED") return "Breached";
    return "Pending";
  };

  const formatFileSize = (bytes) => {
    if (bytes === null || bytes === undefined) return "";

    return `${(Number(bytes) / (1024 * 1024)).toFixed(2)} MB`;
  };

  const addMessageIfMissing = (incomingMessage) => {
    if (!incomingMessage) return;

    setTicket((current) => {
      if (!current) return current;

      const currentMessages = current.messages || [];
      const exists = currentMessages.some(
        (item) => String(item.id) === String(incomingMessage.id),
      );

      if (exists) return current;

      return {
        ...current,
        messages: [...currentMessages, incomingMessage],
      };
    });
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      setChatError("Only PDF, PNG, JPG, DOC and DOCX files are allowed.");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setChatError("The maximum attachment size is 10 MB.");
      event.target.value = "";
      return;
    }

    setChatError("");
    setSelectedFile(file);
  };

  const uploadAttachment = async (file) => {
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
      throw new Error(
        "Cloudinary is not configured. Check your VITE_CLOUDINARY environment variables.",
      );
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`,
      {
        method: "POST",
        body: formData,
      },
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || "Attachment upload failed");
    }

    return {
      url: data.secure_url,
      name: file.name,
      type: file.type,
      size: file.size,
    };
  };

  const handleSendMessage = async (event) => {
    event.preventDefault();

    if (isClosed || sending) return;

    if (!message.trim() && !selectedFile) {
      setChatError("Write a message or attach a file first.");
      return;
    }

    try {
      setSending(true);
      setChatError("");

      let attachment = null;

      if (selectedFile) {
        setUploading(true);
        attachment = await uploadAttachment(selectedFile);
        setUploading(false);
      }

      const response = await fetch(
        `${API_URL}/support-agent/tickets/${id}/messages`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: message.trim(),
            attachmentUrl: attachment?.url || null,
            attachmentName: attachment?.name || null,
            attachmentType: attachment?.type || null,
            attachmentSize: attachment?.size ?? null,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to send message");
      }

      // The socket may deliver the same message first; avoid duplicates.
      addMessageIfMissing(data.ticketMessage);

      setMessage("");
      setSelectedFile(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      setChatError(err.message || "Failed to send message.");
    } finally {
      setSending(false);
      setUploading(false);
    }
  };

  const handleStatusChange = async (event) => {
    const newStatus = event.target.value;
    const currentStatus = ticket.status;

    if (newStatus === currentStatus || updatingStatus) return;

    if (currentStatus === "CLOSED") {
      setStatusError("Closed tickets cannot be changed.");
      return;
    }

    if (newStatus === "CLOSED") {
      const confirmed = window.confirm(
        "Are you sure you want to close this support ticket?\n\nOnce closed, it cannot be reopened or modified.",
      );

      if (!confirmed) return;
    }

    try {
      setUpdatingStatus(true);
      setStatusError("");

      const response = await fetch(
        `${API_URL}/support-agent/tickets/${id}/status`,
        {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update status");
      }

      setTicket((current) => ({
        ...current,
        ...data.ticket,
        status: data.ticket?.status || newStatus,
      }));

      if ((data.ticket?.status || newStatus) === "CLOSED") {
        setMessage("");
        setSelectedFile(null);
      }
    } catch (err) {
      setStatusError(err.message);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleDownload = async (attachment) => {
    try {
      const response = await fetch(attachment.attachmentUrl);

      if (!response.ok) throw new Error("Download failed");

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = objectUrl;
      link.download = attachment.attachmentName || "attachment";
      document.body.appendChild(link);
      link.click();
      link.remove();

      URL.revokeObjectURL(objectUrl);
    } catch {
      window.open(attachment.attachmentUrl, "_blank", "noopener,noreferrer");
    }
  };

  const renderAttachment = (item) => {
    if (!item.attachmentUrl) return null;

    const isImage = item.attachmentType?.startsWith("image/");
    const isPdf = item.attachmentType === "application/pdf";

    return (
      <div className="support-chat-attachment">
        {isImage ? (
          <button
            type="button"
            className="support-chat-image-preview"
            onClick={() =>
              setPreviewAttachment({
                url: item.attachmentUrl,
                name: item.attachmentName,
                type: item.attachmentType,
              })
            }
          >
            <img
              src={item.attachmentUrl}
              alt={item.attachmentName || "Attachment"}
            />
          </button>
        ) : (
          <div className="support-chat-file">
            <FileText size={20} />
            <div className="support-chat-file-info">
              <strong>{item.attachmentName || "Attachment"}</strong>
              <span>{formatFileSize(item.attachmentSize)}</span>
            </div>
            {isPdf && (
              <button
                type="button"
                title="Preview PDF"
                onClick={() =>
                  setPreviewAttachment({
                    url: item.attachmentUrl,
                    name: item.attachmentName,
                    type: item.attachmentType,
                  })
                }
              >
                View
              </button>
            )}
          </div>
        )}

        <button
          type="button"
          className="support-chat-download"
          onClick={() => handleDownload(item)}
          title="Download attachment"
        >
          <Download size={14} />
          Download
        </button>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="support-ticket-detail-message">Loading ticket...</div>
    );
  }

  if (error) {
    return (
      <div className="support-ticket-detail-message support-ticket-detail-error">
        {error}
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="support-ticket-detail-message">Ticket not found.</div>
    );
  }

  return (
    <div className="support-ticket-detail-page">
      <div className="support-ticket-detail-header">
        <button
          type="button"
          className="support-ticket-back-btn"
          onClick={() => navigate("/support/tickets")}
        >
          <ArrowLeft size={15} />
          <span>Back to My Tickets</span>
        </button>

        <div className="support-ticket-heading">
          <div>
            <p className="support-ticket-eyebrow">SUPPORT TICKET</p>
            <h1>Ticket #{ticket.id}</h1>
            <p className="support-ticket-heading-subtitle">{ticket.subject}</p>
          </div>

          <div className="support-ticket-heading-badges">
            <span
              className={`support-status status-${ticket.status.toLowerCase()}`}
            >
              {ticket.status.replaceAll("_", " ")}
            </span>

            <span
              className={`support-priority priority-${ticket.priority.toLowerCase()}`}
            >
              {ticket.priority}
            </span>
          </div>
        </div>
      </div>

      <div className="support-ticket-detail-grid">
        <div className="support-ticket-detail-main">
          <div className="support-ticket-card">
            <div className="support-ticket-card-header">
              <h2>Customer</h2>
            </div>

            <div className="support-ticket-customer">
              <div className="support-ticket-customer-avatar">
                {ticket.user?.name?.charAt(0)?.toUpperCase() || "U"}
              </div>

              <div className="support-ticket-customer-info">
                <strong>{ticket.user?.name || "Unknown"}</strong>
                <span>
                  <Mail size={13} />
                  {ticket.user?.email || "-"}
                </span>
              </div>
            </div>
          </div>

          <div className="support-ticket-card">
            <div className="support-ticket-card-header">
              <h2>Ticket Information</h2>
            </div>

            <div className="support-ticket-info-grid">
              <div>
                <span>Category</span>
                <strong>{ticket.category}</strong>
              </div>
              <div>
                <span>Priority</span>
                <strong>{ticket.priority}</strong>
              </div>
              <div>
                <span>Status</span>
                <strong>{ticket.status.replaceAll("_", " ")}</strong>
              </div>
              <div>
                <span>Created</span>
                <strong>{formatDate(ticket.createdAt)}</strong>
              </div>
              <div>
                <span>Last Updated</span>
                <strong>{formatDate(ticket.updatedAt)}</strong>
              </div>
            </div>
          </div>

          <div className="support-ticket-card">
            <div className="support-ticket-card-header">
              <h2>Issue Description</h2>
            </div>
            <div className="support-ticket-description">
              {ticket.description}
            </div>
          </div>

          <div className="support-ticket-card">
            <div className="support-ticket-card-header support-chat-header">
              <h2>Conversation</h2>
              <span className="support-chat-count">
                {messages.length}{" "}
                {messages.length === 1 ? "message" : "messages"}
              </span>
            </div>

            <div className="support-ticket-conversation support-chat-messages">
              {messages.length === 0 ? (
                <div className="support-ticket-empty-chat">
                  No messages yet. Send the customer a reply below.
                </div>
              ) : (
                messages.map((item) => {
                  const senderRole = item.sender?.role?.name;
                  const isAgentMessage = senderRole === "SUPPORT";
                  const senderName = isAgentMessage
                    ? "You"
                    : item.sender?.name || "Customer";

                  return (
                    <div
                      key={item.id}
                      className={`support-chat-message ${
                        isAgentMessage
                          ? "support-chat-message-agent"
                          : "support-chat-message-customer"
                      }`}
                    >
                      <div className="support-chat-message-meta">
                        <strong>{senderName}</strong>
                        <span>{formatDate(item.createdAt)}</span>
                      </div>

                      {item.message && (
                        <div className="support-chat-message-text">
                          {item.message}
                        </div>
                      )}

                      {renderAttachment(item)}
                    </div>
                  );
                })
              )}

              <div ref={messagesEndRef} />
            </div>

            <form
              className="support-ticket-reply-box"
              onSubmit={handleSendMessage}
            >
              {isClosed && (
                <div className="support-chat-closed-notice">
                  This ticket is closed. Replies are disabled.
                </div>
              )}

              {selectedFile && (
                <div className="support-chat-selected-file">
                  <FileText size={16} />
                  <span>{selectedFile.name}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    aria-label="Remove attachment"
                    disabled={sending || isClosed}
                  >
                    <X size={15} />
                  </button>
                </div>
              )}

              <textarea
                placeholder={
                  isClosed ? "This ticket is closed." : "Write a reply..."
                }
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                disabled={isClosed || sending}
                rows={4}
              />

              <input
                ref={fileInputRef}
                className="support-chat-file-input"
                type="file"
                accept={ALLOWED_FILE_EXTENSIONS}
                onChange={handleFileChange}
                disabled={isClosed || sending}
              />

              {chatError && <p className="support-chat-error">{chatError}</p>}

              <div className="support-ticket-reply-actions">
                <div className="support-chat-reply-tools">
                  <button
                    type="button"
                    className="support-chat-attach-btn"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isClosed || sending}
                  >
                    <Paperclip size={14} />
                    Attach file
                  </button>

                  <span>
                    {uploading ? "Uploading attachment..." : "Max 10 MB"}
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={
                    isClosed || sending || (!message.trim() && !selectedFile)
                  }
                >
                  <Send size={13} />
                  {sending ? "Sending..." : "Send"}
                </button>
              </div>
            </form>
          </div>
        </div>

        <aside className="support-ticket-detail-sidebar">
          <div className="support-ticket-card">
            <div className="support-ticket-card-header">
              <h2>Assigned Agent</h2>
            </div>

            <div className="support-ticket-agent">
              <div className="support-ticket-agent-avatar">
                {ticket.assignedAgent?.name?.charAt(0)?.toUpperCase() || "A"}
              </div>

              <div>
                <strong>{ticket.assignedAgent?.name || "-"}</strong>
                <span>
                  {ticket.assignedAgent?.supportSpecialization ||
                    "Support Agent"}
                </span>
              </div>
            </div>
          </div>
          <div className="support-ticket-card support-sla-card">
            <div className="support-ticket-card-header">
              <h2>Service Level Agreement</h2>
            </div>

            {!ticket.sla ? (
              <div className="support-sla-content">
                SLA information is unavailable.
              </div>
            ) : (
              <div className="support-sla-content">
                <div className="support-sla-priority">
                  <span>Priority</span>
                  <strong>{ticket.priority}</strong>
                </div>

                <div className="support-sla-metric">
                  <div className="support-sla-metric-heading">
                    <strong>First Response</strong>
                    <span
                      className={`support-sla-status sla-${ticket.sla.responseStatus.toLowerCase()}`}
                    >
                      {formatSlaStatus(ticket.sla.responseStatus)}
                    </span>
                  </div>

                  <p>
                    Target: {formatDuration(ticket.sla.responseTargetMinutes)}
                  </p>

                  <p>
                    Actual:{" "}
                    {ticket.sla.firstResponseAt
                      ? formatDuration(ticket.sla.actualResponseMinutes)
                      : "Awaiting response"}
                  </p>

                  {!ticket.sla.firstResponseAt && (
                    <div className="support-sla-countdown">
                      {formatRemaining(ticket.sla.responseDeadline)}
                    </div>
                  )}

                  <small>
                    Deadline: {formatDate(ticket.sla.responseDeadline)}
                  </small>
                </div>

                <div className="support-sla-metric">
                  <div className="support-sla-metric-heading">
                    <strong>Resolution</strong>
                    <span
                      className={`support-sla-status sla-${ticket.sla.resolutionStatus.toLowerCase()}`}
                    >
                      {formatSlaStatus(ticket.sla.resolutionStatus)}
                    </span>
                  </div>

                  <p>
                    Target: {formatDuration(ticket.sla.resolutionTargetMinutes)}
                  </p>

                  <p>
                    Actual:{" "}
                    {ticket.sla.resolvedAt
                      ? formatDuration(ticket.sla.actualResolutionMinutes)
                      : "Not resolved"}
                  </p>

                  {!ticket.sla.resolvedAt && (
                    <div className="support-sla-countdown">
                      {formatRemaining(ticket.sla.resolutionDeadline)}
                    </div>
                  )}

                  <small>
                    Deadline: {formatDate(ticket.sla.resolutionDeadline)}
                  </small>
                </div>
              </div>
            )}
          </div>
          <div className="support-ticket-card">
            <div className="support-ticket-card-header">
              <h2>Ticket Status</h2>
            </div>

            <div className="support-ticket-status-control">
              <label htmlFor="ticket-status">Status</label>

              <select
                id="ticket-status"
                value={ticket.status}
                onChange={handleStatusChange}
                disabled={isClosed || updatingStatus}
              >
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
              </select>

              {updatingStatus && (
                <span className="support-status-feedback">
                  Updating status...
                </span>
              )}

              {statusError && (
                <p className="support-chat-error">{statusError}</p>
              )}

              {isClosed && (
                <p className="support-status-feedback">
                  This ticket is permanently closed.
                </p>
              )}
            </div>
          </div>
        </aside>
      </div>

      {previewAttachment && (
        <div
          className="support-chat-preview-overlay"
          onClick={() => setPreviewAttachment(null)}
          role="presentation"
        >
          <div
            className="support-chat-preview-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Attachment preview"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="support-chat-preview-header">
              <strong>{previewAttachment.name || "Attachment preview"}</strong>
              <button
                type="button"
                onClick={() => setPreviewAttachment(null)}
                aria-label="Close preview"
              >
                <X size={18} />
              </button>
            </div>

            {previewAttachment.type?.startsWith("image/") ? (
              <img
                className="support-chat-preview-image"
                src={previewAttachment.url}
                alt={previewAttachment.name || "Attachment preview"}
              />
            ) : previewAttachment.type === "application/pdf" ? (
              <iframe
                className="support-chat-preview-pdf"
                src={previewAttachment.url}
                title={previewAttachment.name || "PDF preview"}
              />
            ) : (
              <div className="support-chat-preview-unavailable">
                <ImageIcon size={24} />
                <p>Preview is not available for this document type.</p>
                <a
                  href={previewAttachment.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open document
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
