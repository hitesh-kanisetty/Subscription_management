import { useEffect, useState } from "react";
import { ArrowLeft, Send } from "lucide-react";
import { useNavigate } from "react-router-dom";
import API_URL from "../../config";
import "./CreateSupport.css";

export default function CreateSupport() {
  const navigate = useNavigate();

  const [category, setCategory] = useState("ACCOUNT");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [paymentId, setPaymentId] = useState("");

  const [payments, setPayments] = useState([]);
  const [loadingPayments, setLoadingPayments] =
    useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        setLoadingPayments(true);

        const response = await fetch(
          `${API_URL}/subscription`,
          {
            method: "GET",
            credentials: "include",
          }
        );

        const data = await response.json();

        if (!response.ok) {
          return;
        }

        setPayments(data.subscription?.payments || []);
      } catch (error) {
        console.error(
          "Fetch payments error:",
          error
        );
      } finally {
        setLoadingPayments(false);
      }
    };

    fetchPayments();
  }, []);

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

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    if (!subject.trim()) {
      setError("Please enter a subject.");
      return;
    }

    if (!description.trim()) {
      setError("Please describe your issue.");
      return;
    }

    try {
      setSubmitting(true);

      const body = {
        category,
        subject: subject.trim(),
        description: description.trim(),
      };

      if (paymentId) {
        body.paymentId = Number(paymentId);
      }

      const response = await fetch(
        `${API_URL}/support`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.message ||
            "Unable to create support request."
        );
        return;
      }

      navigate(`/user/support/${data.ticket.id}`);
    } catch (error) {
      console.error(
        "Create support ticket error:",
        error
      );

      setError(
        "Unable to connect to the server."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="create-support-page">
      {/* Header */}
      <header className="create-support-header">
        <button
          type="button"
          className="create-support-back"
          onClick={() => navigate("/user/support")}
        >
          <ArrowLeft size={17} />
          <span>Back to Support</span>
        </button>

        <div>
          <p className="create-support-eyebrow">
            SUPPORT
          </p>

          <h1>New Support Request</h1>

          <p className="create-support-description">
            Tell us what you need help with and
            we'll review your request.
          </p>
        </div>
      </header>

      {/* Form */}
      <section className="create-support-card">
        <form
          className="create-support-form"
          onSubmit={handleSubmit}
        >
          {error && (
            <div className="create-support-error">
              {error}
            </div>
          )}

          {/* Category */}
          <div className="create-support-field">
            <label htmlFor="support-category">
              Category
            </label>

            <select
              id="support-category"
              value={category}
              onChange={(event) =>
                setCategory(event.target.value)
              }
              disabled={submitting}
            >
              <option value="PAYMENT">
                Payment
              </option>

              <option value="SUBSCRIPTION">
                Subscription
              </option>

              <option value="ACCOUNT">
                Account
              </option>

              <option value="TECHNICAL">
                Technical
              </option>

              <option value="OTHER">
                Other
              </option>
            </select>
          </div>

          {/* Subject */}
          <div className="create-support-field">
            <label htmlFor="support-subject">
              Subject
            </label>

            <input
              id="support-subject"
              type="text"
              placeholder="What do you need help with?"
              value={subject}
              onChange={(event) =>
                setSubject(event.target.value)
              }
              maxLength={150}
              disabled={submitting}
            />
          </div>

          {/* Payment */}
          <div className="create-support-field">
            <label htmlFor="support-payment">
              Related Payment
              <span>Optional</span>
            </label>

            <select
              id="support-payment"
              value={paymentId}
              onChange={(event) =>
                setPaymentId(event.target.value)
              }
              disabled={
                submitting || loadingPayments
              }
            >
              <option value="">
                No payment selected
              </option>

              {payments.map((payment) => (
                <option
                  key={payment.id}
                  value={payment.id}
                >
                  Payment #{payment.id} — ₹
                  {Number(payment.amount).toFixed(2)} —{" "}
                  {formatDate(payment.paymentDate)}
                </option>
              ))}
            </select>

            {!loadingPayments &&
              payments.length === 0 && (
                <small className="create-support-hint">
                  No payments are available to
                  attach.
                </small>
              )}
          </div>

          {/* Description */}
          <div className="create-support-field">
            <label htmlFor="support-description">
              Description
            </label>

            <textarea
              id="support-description"
              placeholder="Describe your issue in detail..."
              value={description}
              onChange={(event) =>
                setDescription(event.target.value)
              }
              rows={7}
              maxLength={2000}
              disabled={submitting}
            />

            <div className="create-support-character-count">
              {description.length}/2000
            </div>
          </div>

          {/* Actions */}
          <div className="create-support-actions">
            <button
              type="button"
              className="create-support-cancel"
              onClick={() =>
                navigate("/user/support")
              }
              disabled={submitting}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="create-support-submit"
              disabled={submitting}
            >
              <Send size={16} />

              <span>
                {submitting
                  ? "Submitting..."
                  : "Submit Request"}
              </span>
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}