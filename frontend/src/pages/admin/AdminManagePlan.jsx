import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Users,
  Check,
  CreditCard,
  Power,
  IndianRupee,
} from "lucide-react";
import API_URL from "../../config";
import "./AdminManagePlan.css";

export default function AdminManagePlan() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Delete state
  const [deletePlan, setDeletePlan] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Status state
  const [statusModal, setStatusModal] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchPlan = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/plans/${id}`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.message || "Unable to load plan."
        );
        return;
      }

      setPlan(data.plan);
    } catch (error) {
      console.error("Fetch plan error:", error);

      setError(
        "Unable to connect to the server."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlan();
  }, [id]);

  // =========================
  // DELETE PLAN
  // =========================

  const confirmDeletePlan = async () => {
    if (!plan) {
      return;
    }

    try {
      setDeleting(true);

      const response = await fetch(
        `${API_URL}/plans/${plan.id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.message ||
            "Unable to delete plan."
        );

        setDeletePlan(false);
        return;
      }

      setDeletePlan(false);

      navigate("/admin/plans");
    } catch (error) {
      console.error(
        "Delete plan error:",
        error
      );

      setError(
        "Unable to connect to the server."
      );
    } finally {
      setDeleting(false);
    }
  };

  // =========================
  // ACTIVATE / DEACTIVATE
  // =========================

  const handleStatusChange = async () => {
    if (!plan) {
      return;
    }

    try {
      setUpdatingStatus(true);
      setError("");

      const response = await fetch(
        `${API_URL}/plans/${plan.id}/status`,
        {
          method: "PATCH",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.message ||
            "Unable to update plan status."
        );

        setStatusModal(false);
        return;
      }

      /*
       * The status endpoint returns the normal
       * plan object, so fetch the complete plan
       * again to keep subscriber statistics
       * and payment information up to date.
       */
      setStatusModal(false);
      await fetchPlan();
    } catch (error) {
      console.error(
        "Update plan status error:",
        error
      );

      setError(
        "Unable to connect to the server."
      );
    } finally {
      setUpdatingStatus(false);
    }
  };

  // =========================
  // FORMATTERS
  // =========================

  const formatPrice = (price) => {
    if (
      price === undefined ||
      price === null
    ) {
      return "₹0";
    }

    return `₹${Number(price).toLocaleString(
      "en-IN"
    )}`;
  };

  const formatDate = (date) => {
    if (!date) {
      return "—";
    }

    return new Date(date).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  const getStatusClass = (status) => {
    if (status === "ACTIVE") {
      return "active";
    }

    if (status === "CANCELLED") {
      return "cancelled";
    }

    if (status === "EXPIRED") {
      return "expired";
    }

    return "";
  };

  // =========================
  // LOADING
  // =========================

  if (loading) {
    return (
      <div className="manage-plan-message">
        Loading plan...
      </div>
    );
  }

  // =========================
  // ERROR
  // =========================

  if (error && !plan) {
    return (
      <div className="manage-plan-message manage-plan-error">
        <p>{error}</p>

        <button
          type="button"
          onClick={() =>
            navigate("/admin/plans")
          }
        >
          Back to plans
        </button>
      </div>
    );
  }

  if (!plan) {
    return null;
  }

  const subscribers =
    plan.subscribers || [];

  return (
    <div className="manage-plan-page">
      {/* Header */}
      <header className="manage-plan-header">
        <div>
          <button
            type="button"
            className="manage-plan-back"
            onClick={() =>
              navigate("/admin/plans")
            }
          >
            <ArrowLeft size={16} />
            <span>Back to plans</span>
          </button>

          <p className="manage-plan-eyebrow">
            PLAN MANAGEMENT
          </p>

          <div className="manage-plan-title-row">
            <h1>{plan.name} Plan</h1>

            <span
              className={`manage-plan-status ${
                plan.isActive
                  ? "active"
                  : "inactive"
              }`}
            >
              {plan.isActive
                ? "Active"
                : "Inactive"}
            </span>
          </div>

          <p className="manage-plan-description">
            {plan.description ||
              "No description provided."}
          </p>
        </div>

        <div className="manage-plan-header-actions">
          {/* EDIT */}
          <button
            type="button"
            className="manage-plan-edit-button"
            onClick={() =>
              navigate(
                `/admin/plans/${plan.id}/edit`
              )
            }
          >
            <Pencil size={15} />
            <span>Edit plan</span>
          </button>

          {/* ACTIVATE / DEACTIVATE */}
          <button
            type="button"
            className={`manage-plan-status-button ${
              plan.isActive
                ? "deactivate"
                : "activate"
            }`}
            onClick={() =>
              setStatusModal(true)
            }
          >
            <Power size={15} />

            <span>
              {plan.isActive
                ? "Deactivate"
                : "Activate"}
            </span>
          </button>

          {/* DELETE */}
          <button
            type="button"
            className="manage-plan-delete-button"
            onClick={() =>
              setDeletePlan(true)
            }
          >
            <Trash2 size={15} />

            <span>Delete</span>
          </button>
        </div>
      </header>

      {/* Error while page is still visible */}
      {error && (
        <div className="manage-plan-inline-error">
          {error}
        </div>
      )}

      {/* =========================
          OVERVIEW
      ========================= */}

      <section className="manage-plan-overview">
        {/* Price */}
        <article className="manage-plan-stat">
          <div className="manage-plan-stat-icon">
            <CreditCard size={18} />
          </div>

          <div>
            <span>PRICE</span>

            <strong>
              {formatPrice(plan.price)}
            </strong>

            <small>
              /{" "}
              {plan.billingPeriod ===
              "YEARLY"
                ? "year"
                : "month"}
            </small>
          </div>
        </article>

        {/* Subscribers */}
        <article className="manage-plan-stat">
          <div className="manage-plan-stat-icon">
            <Users size={18} />
          </div>

          <div>
            <span>SUBSCRIBERS</span>

            <strong>
              {plan.totalSubscribers ?? 0}
            </strong>

            <small>
              {plan.activeSubscribers ??
                0}{" "}
              active
            </small>
          </div>
        </article>

        {/* Revenue */}
        <article className="manage-plan-stat">
          <div className="manage-plan-stat-icon">
            <IndianRupee size={18} />
          </div>

          <div>
            <span>REVENUE</span>

            <strong>
              {formatPrice(plan.revenue)}
            </strong>

            <small>
              From paid transactions
            </small>
          </div>
        </article>
      </section>


      <div className="manage-plan-content">
        {/* Plan Details */}
        <section className="manage-plan-card">
          <div className="manage-plan-section-heading">
            <div>
              <p>PLAN DETAILS</p>

              <h2>
                Subscription information
              </h2>
            </div>
          </div>

          <div className="manage-plan-details">
            <div>
              <span>Plan name</span>

              <strong>{plan.name}</strong>
            </div>

            <div>
              <span>Billing period</span>

              <strong>
                {plan.billingPeriod ===
                "YEARLY"
                  ? "Yearly"
                  : "Monthly"}
              </strong>
            </div>

            <div>
              <span>Status</span>

              <strong>
                {plan.isActive
                  ? "Available"
                  : "Inactive"}
              </strong>
            </div>

            <div>
              <span>Created</span>

              <strong>
                {formatDate(
                  plan.createdAt
                )}
              </strong>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="manage-plan-card">
          <div className="manage-plan-section-heading">
            <div>
              <p>PLAN FEATURES</p>

              <h2>What's included</h2>
            </div>

            <span>
              {plan.features?.length || 0}{" "}
              features
            </span>
          </div>

          <ul className="manage-plan-features">
            {plan.features?.map(
              (feature) => (
                <li key={feature}>
                  <span>
                    <Check size={14} />
                  </span>

                  <strong>
                    {feature}
                  </strong>
                </li>
              )
            )}
          </ul>
        </section>


        {/* <section className="manage-plan-card">
          <div className="manage-plan-section-heading">
            <div>
              <p>SUBSCRIBERS</p>

              <h2>
                Customers on this plan
              </h2>
            </div>

            <span>
              {subscribers.length}{" "}
              {subscribers.length === 1
                ? "record"
                : "records"}
            </span>
          </div>

          {subscribers.length === 0 ? (
            <div className="manage-plan-empty">
              <Users size={22} />

              <strong>
                No subscribers yet
              </strong>

              <p>
                Customers who subscribe to
                this plan will appear here.
              </p>
            </div>
          ) : (
            <div className="manage-plan-subscribers-wrapper">
              <table className="manage-plan-subscribers-table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Email</th>
                    <th>Status</th>
                    <th>Start Date</th>
                    <th>Renewal</th>
                  </tr>
                </thead>

                <tbody>
                  {subscribers.map(
                    (subscriber) => (
                      <tr
                        key={
                          subscriber.subscriptionId
                        }
                      >
                        <td>
                          <div className="manage-plan-customer">
                            <div className="manage-plan-customer-avatar">
                              {subscriber.user?.name
                                ?.charAt(0)
                                .toUpperCase()}
                            </div>

                            <div>
                              <strong>
                                {
                                  subscriber
                                    .user
                                    ?.name
                                }
                              </strong>

                              <span>
                                Customer #
                                {
                                  subscriber
                                    .user
                                    ?.id
                                }
                              </span>
                            </div>
                          </div>
                        </td>

                        <td>
                          <span className="manage-plan-customer-email">
                            {
                              subscriber
                                .user
                                ?.email
                            }
                          </span>
                        </td>

                        <td>
                          <span
                            className={`manage-plan-subscriber-status ${getStatusClass(
                              subscriber.status
                            )}`}
                          >
                            {
                              subscriber.status
                            }
                          </span>
                        </td>

                        <td>
                          <span className="manage-plan-subscriber-date">
                            {formatDate(
                              subscriber.startDate
                            )}
                          </span>
                        </td>

                        <td>
                          <span className="manage-plan-subscriber-date">
                            {formatDate(
                              subscriber.renewalDate
                            )}
                          </span>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section> */}
      </div>


      {statusModal && (
        <div
          className="manage-status-modal-overlay"
          onClick={() => {
            if (!updatingStatus) {
              setStatusModal(false);
            }
          }}
        >
          <div
            className="manage-status-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            <div className="manage-status-modal-icon">
              <Power size={20} />
            </div>

            <h2>
              {plan.isActive
                ? "Deactivate plan?"
                : "Activate plan?"}
            </h2>

            <p>
              {plan.isActive
                ? "This plan will no longer be available for new customers to subscribe to."
                : "This plan will become available for customers to subscribe to again."}
            </p>

            <strong>
              {plan.name} Plan
            </strong>

            <div className="manage-status-modal-actions">
              <button
                type="button"
                className="manage-status-modal-cancel"
                onClick={() =>
                  setStatusModal(false)
                }
                disabled={
                  updatingStatus
                }
              >
                Cancel
              </button>

              <button
                type="button"
                className={`manage-status-modal-confirm ${
                  plan.isActive
                    ? "deactivate"
                    : "activate"
                }`}
                onClick={
                  handleStatusChange
                }
                disabled={
                  updatingStatus
                }
              >
                {updatingStatus
                  ? "Updating..."
                  : plan.isActive
                  ? "Deactivate plan"
                  : "Activate plan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deletePlan && (
        <div
          className="manage-delete-modal-overlay"
          onClick={() => {
            if (!deleting) {
              setDeletePlan(false);
            }
          }}
        >
          <div
            className="manage-delete-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            <div className="manage-delete-modal-icon">
              <Trash2 size={20} />
            </div>

            <h2>Delete plan?</h2>

            <p>
              Are you sure you want to delete{" "}
              <strong>
                {plan.name}
              </strong>
              ? This action cannot be
              undone.
            </p>

            <div className="manage-delete-modal-actions">
              <button
                type="button"
                className="manage-delete-modal-cancel"
                onClick={() =>
                  setDeletePlan(false)
                }
                disabled={deleting}
              >
                Cancel
              </button>

              <button
                type="button"
                className="manage-delete-modal-confirm"
                onClick={
                  confirmDeletePlan
                }
                disabled={deleting}
              >
                {deleting
                  ? "Deleting..."
                  : "Delete plan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}