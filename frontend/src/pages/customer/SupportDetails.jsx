import { useEffect, useState } from "react";
import {
ArrowLeft,
Send,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { io } from "socket.io-client";
import API_URL from "../../config";
import "./SupportDetails.css";

export default function SupportDetails() {
const navigate = useNavigate();
const { id } = useParams();

const [ticket, setTicket] = useState(null);
const [message, setMessage] = useState("");

const [loading, setLoading] = useState(true);
const [sending, setSending] = useState(false);
const [error, setError] = useState("");

const fetchTicket = async () => {
try {
setLoading(true);
setError("");

  const response = await fetch(
    `${API_URL}/support/${id}`,
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
} catch (error) {
  console.error(
    "Fetch support ticket error:",
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

=====================================================

SOCKET.IO - CUSTOMER CONNECTION

=====================================================
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
    "Customer socket connected:",
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
socket.on(
  "support-ticket-status-updated",
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

      return {
        ...currentTicket,
        status: data.status,
      };
    });

    setMessage("");
    setError("");
  }
);
socket.on("connect_error", (error) => {
  console.error(
    "Customer socket connection error:",
    error
  );
});

socket.on("disconnect", () => {
  console.log(
    "Customer socket disconnected"
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

const getStatusClass = (status) => {
switch (status) {
case "OPEN":
return "support-details-status-open";

  case "IN_PROGRESS":
    return "support-details-status-progress";

  case "RESOLVED":
    return "support-details-status-resolved";

  case "CLOSED":
    return "support-details-status-closed";

  default:
    return "";
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
    `${API_URL}/support/${id}/messages`,
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
    "Send support message error:",
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
<div className="support-details-page">
<div className="support-details-message">
Loading support request...
</div>
</div>
);
}

if (error && !ticket) {
return (
<div className="support-details-page">
<button
type="button"
className="support-details-back"
onClick={() =>
navigate("/user/support")
}
>
<ArrowLeft size={17} />
<span>Back to Support</span>
</button>

    <div className="support-details-message support-details-error">
      {error}
    </div>
  </div>
);

}

if (!ticket) {
return null;
}

const messages = ticket.messages || [];

const canReply =
ticket.status !== "CLOSED";

return (
<div className="support-details-page">
{/* Header */}
<header className="support-details-header">
<button
type="button"
className="support-details-back"
onClick={() =>
navigate("/user/support")
}
>
<ArrowLeft size={17} />
<span>Back to Support</span>
</button>

    <div className="support-details-title-row">
      <div>
        <p className="support-details-eyebrow">
          SUPPORT REQUEST #{ticket.id}
        </p>

        <h1>{ticket.subject}</h1>
      </div>

      <span
        className={`support-details-status ${getStatusClass(
          ticket.status
        )}`}
      >
        {formatStatus(ticket.status)}
      </span>
    </div>

    <div className="support-details-meta">
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
    <div className="support-details-inline-error">
      {error}
    </div>
  )}

  {/* Original Request */}
  <section className="support-details-card">
    <div className="support-details-card-header">
      <div>
        <h2>Your Request</h2>

        <p>
          Submitted{" "}
          {formatDateTime(ticket.createdAt)}
        </p>
      </div>
    </div>

    <div className="support-details-description">
      {ticket.description}
    </div>

    {/* Related Payment */}
    {ticket.payment && (
      <div className="support-details-payment">
        <div>
          <span className="support-details-payment-label">
            Related Payment
          </span>

          <strong>
            Payment #{ticket.payment.id}
          </strong>
        </div>

        <div>
          <span className="support-details-payment-label">
            Amount
          </span>

          <strong>
            ₹
            {Number(
              ticket.payment.amount
            ).toFixed(2)}
          </strong>
        </div>

        <div>
          <span className="support-details-payment-label">
            Status
          </span>

          <strong>
            {ticket.payment.status}
          </strong>
        </div>

        <div>
          <span className="support-details-payment-label">
            Date
          </span>

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
  <section className="support-details-card">
    <div className="support-details-card-header">
      <div>
        <h2>Conversation</h2>

        <p>
          Messages between you and the
          support team.
        </p>
      </div>
    </div>

    <div className="support-details-messages">
      {messages.length === 0 ? (
        <div className="support-details-no-messages">
          No replies yet. Our support team
          will respond to your request.
        </div>
      ) : (
        messages.map((item) => {
          const isCustomer =
            item.sender?.role?.name ===
            "CUSTOMER";

          return (
            <div
              key={item.id}
              className={`support-details-message-row ${
                isCustomer
                  ? "support-details-message-customer"
                  : "support-details-message-admin"
              }`}
            >
              <div className="support-details-message-bubble">
                <div className="support-details-message-header">
                  <strong>
                    {isCustomer
                      ? "You"
                      : item.sender?.name ||
                        "Support Team"}
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
        className="support-details-reply"
        onSubmit={handleSendMessage}
      >
        <textarea
          value={message}
          onChange={(event) =>
            setMessage(event.target.value)
          }
          placeholder="Write a reply..."
          rows={4}
          maxLength={2000}
          disabled={sending}
        />

        <div className="support-details-reply-footer">
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
      <div className="support-details-closed">
        This support request is closed and
        can no longer receive replies.
      </div>
    )}
  </section>
</div>

);
}