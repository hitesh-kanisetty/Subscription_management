import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API_URL from "../../config";
import {
  Plus,
  Pencil,
  Trash2,
  Check,
  ArrowRight,
} from "lucide-react";

import "./admin_plans.css";

export default function AdminPlans() {
  const navigate = useNavigate();

  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [deletePlan, setDeletePlan] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/plans`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.message || "Unable to load plans."
        );
        return;
      }

      setPlans(data.plans || []);
    } catch (error) {
      console.error("Fetch plans error:", error);

      setError(
        "Unable to connect to the server."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  // =========================
  // Delete
  // =========================

  const handleDeletePlan = (plan) => {
    setDeletePlan(plan);
  };

  const confirmDeletePlan = async () => {
    if (!deletePlan) {
      return;
    }

    try {
      setDeleting(true);
      setError("");

      const response = await fetch(
        `${API_URL}/plans/${deletePlan.id}`,
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

        return;
      }

      setPlans((previousPlans) =>
        previousPlans.filter(
          (plan) =>
            plan.id !== deletePlan.id
        )
      );

      setDeletePlan(null);
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
  // Edit
  // =========================

  const handleEditPlan = (plan) => {
    navigate(
      `/admin/plans/${plan.id}/edit`
    );
  };

  return (
    <div className="plans-page">
      {/* Page Header */}
      <header className="plans-header">
        <div>
          <p className="plans-eyebrow">
            MANAGEMENT
          </p>

          <h1>
            Plans & Subscriptions
          </h1>

          <p className="plans-description">
            Manage subscription plans, pricing,
            features, and customer subscriptions.
          </p>
        </div>

        <Link
          to="/admin/plans/create"
          className="plans-create-button"
        >
          <Plus size={17} />

          <span>Create plan</span>
        </Link>
      </header>

      {/* Plan Summary */}
      {/* <section className="plans-summary">
        <div className="plans-summary-card">
          <span>Total plans</span>

          <strong>{plans.length}</strong>
        </div>

        <div className="plans-summary-card">
          <span>Active subscribers</span>

          <strong>—</strong>
        </div>

        <div className="plans-summary-card">
          <span>
            Monthly recurring revenue
          </span>

          <strong>—</strong>
        </div>
      </section> */}

      {/* Plans */}
      <section className="plans-section">
        <div className="plans-section-heading">
          <div>
            <p className="plans-eyebrow">
              AVAILABLE PLANS
            </p>

            <h2>
              Subscription plans
            </h2>
          </div>

          <span className="plans-count">
            {plans.length}{" "}
            {plans.length === 1
              ? "plan"
              : "plans"}
          </span>
        </div>

        {/* Loading */}
        {loading && (
          <div className="plans-message">
            Loading plans...
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="plans-message plans-error">
            {error}
          </div>
        )}

        {/* Empty */}
        {!loading &&
          !error &&
          plans.length === 0 && (
            <div className="plans-message">
              No plans have been created yet.
            </div>
          )}

        {/* Plan Cards */}
        {!loading &&
          !error &&
          plans.length > 0 && (
            <div className="plans-grid">
              {plans.map((plan) => (
                <article
                  className="plan-card"
                  key={plan.id}
                >
                  {/* Header */}
                  <div className="plan-card-header">
                    <div>
                      <h3>{plan.name}</h3>

                      {plan.description && (
                        <p>
                          {plan.description}
                        </p>
                      )}
                    </div>

                    <span
                      className={`plan-status ${
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

                  {/* Price */}
                  <div className="plan-price">
                    <strong>
                      ₹
                      {Number(
                        plan.price
                      ).toLocaleString(
                        "en-IN"
                      )}
                    </strong>

                    <span>
                      /
                      {plan.billingPeriod ===
                      "YEARLY"
                        ? "year"
                        : "month"}
                    </span>
                  </div>

                  {/* Feature Count */}
                  <div className="plan-feature-summary">
                    <span className="feature-check">
                      <Check size={13} />
                    </span>

                    <span>
                      {plan.features?.length ||
                        0}{" "}
                      features included
                    </span>
                  </div>

                  {/* Main Action */}
                  <Link
                    to={`/admin/plans/${plan.id}`}
                    className="plan-manage-button"
                  >
                    <span>
                      Manage plan
                    </span>

                    <ArrowRight size={15} />
                  </Link>

                  {/* Secondary Actions */}
                  {/* <div className="plan-actions">
                    <button
                      type="button"
                      className="plan-edit-button"
                      onClick={() =>
                        handleEditPlan(plan)
                      }
                    >
                      <Pencil size={15} />

                      <span>
                        Edit plan
                      </span>
                    </button>

                    <button
                      type="button"
                      className="plan-delete-button"
                      onClick={() =>
                        handleDeletePlan(plan)
                      }
                      aria-label={`Delete ${plan.name} plan`}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div> */}
                </article>
              ))}
            </div>
          )}
      </section>

      {/* Delete Confirmation */}
      {deletePlan && (
        <div
          className="delete-modal-overlay"
          onClick={() => {
            if (!deleting) {
              setDeletePlan(null);
            }
          }}
        >
          <div
            className="delete-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            <div className="delete-modal-icon">
              <Trash2 size={20} />
            </div>

            <h2>Delete plan?</h2>

            <p>
              Are you sure you want to delete{" "}
              <strong>
                {deletePlan.name}
              </strong>
              ? This action cannot be undone.
            </p>

            <div className="delete-modal-actions">
              <button
                type="button"
                className="delete-modal-cancel"
                onClick={() =>
                  setDeletePlan(null)
                }
                disabled={deleting}
              >
                Cancel
              </button>

              <button
                type="button"
                className="delete-modal-confirm"
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