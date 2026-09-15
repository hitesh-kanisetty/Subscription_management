import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, X } from "lucide-react";
import API_URL from "../../config";
import "./adminCreatePlan.css";

export default function AdminCreatePlan() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    billingPeriod: "MONTHLY",
    isActive: true,
  });

  const [features, setFeatures] = useState([""]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleFeatureChange = (index, value) => {
    setFeatures((previous) =>
      previous.map((feature, featureIndex) =>
        featureIndex === index ? value : feature
      )
    );
  };

  const addFeature = () => {
    setFeatures((previous) => [...previous, ""]);
  };

  const removeFeature = (index) => {
    setFeatures((previous) => {
      if (previous.length === 1) {
        return previous;
      }

      return previous.filter(
        (_, featureIndex) => featureIndex !== index
      );
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    const cleanedFeatures = features
      .map((feature) => feature.trim())
      .filter(Boolean);

    if (!formData.name.trim()) {
      setError("Plan name is required.");
      return;
    }

    if (!formData.price || Number(formData.price) <= 0) {
      setError("Please enter a valid price.");
      return;
    }

    if (cleanedFeatures.length === 0) {
      setError("Please add at least one feature.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL}/plans`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: formData.name.trim(),
            description: formData.description.trim(),
            price: Number(formData.price),
            billingPeriod: formData.billingPeriod,
            features: cleanedFeatures,
            isActive: formData.isActive,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Unable to create plan.");
        return;
      }

      setSuccess("Plan created successfully.");

      setTimeout(() => {
        navigate("/admin/plans");
      }, 700);
    } catch (error) {
      console.error("Create plan error:", error);

      setError(
        "Unable to connect to the server. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-plan-page">
      {/* Header */}
      <header className="create-plan-header">
        <div>
          <button
            type="button"
            className="create-plan-back"
            onClick={() => navigate("/admin/plans")}
          >
            <ArrowLeft size={16} />
            <span>Back to plans</span>
          </button>

          <p className="create-plan-eyebrow">
            PLAN MANAGEMENT
          </p>

          <h1>Create Plan</h1>

          <p className="create-plan-description">
            Create a new subscription plan for your customers.
          </p>
        </div>
      </header>

      <form
        className="create-plan-form"
        onSubmit={handleSubmit}
      >
        {/* Basic Information */}
        <section className="create-plan-card">
          <div className="create-plan-section-heading">
            <div>
              <p className="create-plan-section-eyebrow">
                BASIC INFORMATION
              </p>

              <h2>Plan details</h2>
            </div>
          </div>

          <div className="form-grid">
            {/* Name */}
            <div className="form-field">
              <label htmlFor="plan-name">
                Plan name
              </label>

              <input
                id="plan-name"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Super"
              />

              <small>
                Give your subscription plan a clear name.
              </small>
            </div>

            {/* Price */}
            <div className="form-field">
              <label htmlFor="plan-price">
                Price
              </label>

              <div className="price-input">
                <span>₹</span>

                <input
                  id="plan-price"
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  min="1"
                  step="0.01"
                  placeholder="89000"
                />
              </div>

              <small>
                Enter the amount customers will pay.
              </small>
            </div>

            {/* Description */}
            <div className="form-field form-field-full">
              <label htmlFor="plan-description">
                Description
              </label>

              <textarea
                id="plan-description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="4"
                placeholder="Describe who this plan is designed for..."
              />

              <small>
                A short description displayed on the plan card.
              </small>
            </div>

            {/* Billing */}
            <div className="form-field">
              <label htmlFor="billing-period">
                Billing period
              </label>

              <select
                id="billing-period"
                name="billingPeriod"
                value={formData.billingPeriod}
                onChange={handleChange}
              >
                <option value="MONTHLY">
                  Monthly
                </option>

                <option value="YEARLY">
                  Yearly
                </option>
              </select>

              <small>
                Choose how frequently customers are billed.
              </small>
            </div>

            {/* Status */}
            <div className="form-field">
              <label htmlFor="plan-status">
                Status
              </label>

              <select
                id="plan-status"
                name="isActive"
                value={formData.isActive}
                onChange={(e) =>
                  setFormData((previous) => ({
                    ...previous,
                    isActive: e.target.value === "true",
                  }))
                }
              >
                <option value="true">
                  Active
                </option>

                <option value="false">
                  Inactive
                </option>
              </select>

              <small>
                Inactive plans won't be available to customers.
              </small>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="create-plan-card">
          <div className="create-plan-section-heading">
            <div>
              <p className="create-plan-section-eyebrow">
                PLAN FEATURES
              </p>

              <h2>What's included</h2>

              <p>
                Add the benefits customers receive with this plan.
              </p>
            </div>
          </div>

          <div className="feature-input-list">
            {features.map((feature, index) => (
              <div
                className="feature-input-row"
                key={index}
              >
                <input
                  type="text"
                  value={feature}
                  onChange={(e) =>
                    handleFeatureChange(
                      index,
                      e.target.value
                    )
                  }
                  placeholder="e.g. Priority support"
                />

                <button
                  type="button"
                  className="remove-feature-button"
                  onClick={() => removeFeature(index)}
                  aria-label="Remove feature"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            className="add-feature-button"
            onClick={addFeature}
          >
            <Plus size={15} />
            <span>Add feature</span>
          </button>
        </section>

        {/* Messages */}
        {error && (
          <p className="create-plan-error">
            {error}
          </p>
        )}

        {success && (
          <p className="create-plan-success">
            {success}
          </p>
        )}

        {/* Actions */}
        <div className="create-plan-actions">
          <button
            type="button"
            className="create-plan-cancel"
            onClick={() => navigate("/admin/plans")}
            disabled={loading}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="create-plan-submit"
            disabled={loading}
          >
            {loading ? "Creating..." : "Create plan"}
          </button>
        </div>
      </form>
    </div>
  );
}