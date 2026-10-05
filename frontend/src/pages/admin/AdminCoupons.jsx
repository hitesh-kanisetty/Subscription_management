import { useEffect, useState } from "react";

import { Search, Plus, Pencil, Power, ArrowLeft } from "lucide-react";

import { useNavigate } from "react-router-dom";

import "./AdminCoupons.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function AdminCoupons() {
  const navigate = useNavigate();

  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [showCreateModal, setShowCreateModal] = useState(false);

  const [editingCoupon, setEditingCoupon] = useState(null);

  const [formData, setFormData] = useState({
    code: "",
    description: "",
    discountType: "PERCENTAGE",
    discountValue: "",
    validFrom: "",
    validUntil: "",
    usageLimit: "",
    minimumAmount: "",
    targetType: "ALL",
  });

  const [saving, setSaving] = useState(false);


  const fetchCoupons = async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();

      if (search.trim()) {
        params.append("search", search.trim());
      }

      if (statusFilter !== "ALL") {
        params.append("status", statusFilter);
      }

      const response = await fetch(
        `${API_URL}/admin/coupons?${params.toString()}`,
        {
          credentials: "include",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch coupons");
      }

      setCoupons(data.coupons || []);
    } catch (error) {
      console.error("Fetch coupons error:", error);

      setError(error.message || "Unable to load coupons");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, [statusFilter]);



  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCoupons();
    }, 400);

    return () => clearTimeout(timer);
  }, [search]);



  const resetForm = () => {
    setFormData({
      code: "",
      description: "",
      discountType: "PERCENTAGE",
      discountValue: "",
      validFrom: "",
      validUntil: "",
      usageLimit: "",
      minimumAmount: "",
      targetType: "ALL",
    });
  };



  const formatDateTimeLocal = (date) => {
    if (!date) return "";

    const localDate = new Date(date);

    const offset = localDate.getTimezoneOffset() * 60000;

    const adjustedDate = new Date(localDate.getTime() - offset);

    return adjustedDate.toISOString().slice(0, 16);
  };

  const openCreateModal = () => {
    resetForm();
    setEditingCoupon(null);
    setShowCreateModal(true);
  };

  const openEditModal = (coupon) => {
    setEditingCoupon(coupon);

    setFormData({
      code: coupon.code || "",

      description: coupon.description || "",

      discountType: coupon.discountType || "PERCENTAGE",

      discountValue: coupon.discountValue?.toString() || "",

      validFrom: formatDateTimeLocal(coupon.validFrom),

      validUntil: formatDateTimeLocal(coupon.validUntil),

      usageLimit:
        coupon.usageLimit !== null && coupon.usageLimit !== undefined
          ? coupon.usageLimit.toString()
          : "",

      minimumAmount:
        coupon.minimumAmount !== null && coupon.minimumAmount !== undefined
          ? coupon.minimumAmount.toString()
          : "",

      targetType: coupon.targetType || "ALL",
    });

    setShowCreateModal(true);
  };

  const closeModal = () => {
    if (saving) return;

    setShowCreateModal(false);
    setEditingCoupon(null);
    resetForm();
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };



  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);

      const payload = {
        ...formData,

        discountValue: Number(formData.discountValue),

        usageLimit:
          formData.usageLimit === "" ? null : Number(formData.usageLimit),

        minimumAmount:
          formData.minimumAmount === "" ? null : Number(formData.minimumAmount),
      };

      const url = editingCoupon
        ? `${API_URL}/admin/coupons/${editingCoupon.id}`
        : `${API_URL}/admin/coupons`;

      const response = await fetch(url, {
        method: editingCoupon ? "PUT" : "POST",

        headers: {
          "Content-Type": "application/json",
        },

        credentials: "include",

        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to save coupon");
      }

      closeModal();

      await fetchCoupons();
    } catch (error) {
      console.error("Save coupon error:", error);

      alert(error.message || "Unable to save coupon");
    } finally {
      setSaving(false);
    }
  };



  const handleToggleStatus = async (coupon) => {
    const action = coupon.isActive ? "deactivate" : "activate";

    const confirmed = window.confirm(
      `Are you sure you want to ${action} coupon "${coupon.code}"?`,
    );

    if (!confirmed) return;

    try {
      const response = await fetch(
        `${API_URL}/admin/coupons/${coupon.id}/status`,
        {
          method: "PATCH",
          credentials: "include",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update coupon status");
      }

      await fetchCoupons();
    } catch (error) {
      console.error("Toggle coupon status error:", error);

      alert(error.message || "Unable to update coupon status");
    }
  };



  const formatDiscount = (coupon) => {
    const value = Number(coupon.discountValue);

    if (coupon.discountType === "PERCENTAGE") {
      return `${value}%`;
    }

    return `₹${value.toLocaleString("en-IN")}`;
  };

  const formatDate = (date) => {
    if (!date) return "—";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getUsageText = (coupon) => {
    if (coupon.usageLimit === null || coupon.usageLimit === undefined) {
      return `${coupon.usedCount || 0} / Unlimited`;
    }

    return `${coupon.usedCount || 0} / ${coupon.usageLimit}`;
  };

 

  return (
    <div className="admin-coupons-page">
      {/* HEADER */}

      <div className="admin-coupons-header">
        <div className="admin-coupons-header-content">
          <p className="admin-coupons-eyebrow">COUPON MANAGEMENT</p>

          <h1>Coupons</h1>

          <p className="admin-coupons-description">
            Create and manage discount coupons for your customers.
          </p>
        </div>

        <div className="admin-coupons-header-actions">
          <button
            type="button"
            className="admin-coupons-back-button"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft size={15} />
            Back
          </button>

          <button
            type="button"
            className="admin-coupons-create-button"
            onClick={openCreateModal}
          >
            <Plus size={16} />
            Create Coupon
          </button>
        </div>
      </div>

      {/* TOOLBAR */}

      <div className="admin-coupons-toolbar">
        <div className="admin-coupons-search">
          <Search size={16} />

          <input
            type="text"
            placeholder="Search coupons..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <div className="admin-coupons-filters">
          <button
            type="button"
            className={statusFilter === "ALL" ? "active" : ""}
            onClick={() => setStatusFilter("ALL")}
          >
            All
          </button>

          <button
            type="button"
            className={statusFilter === "ACTIVE" ? "active" : ""}
            onClick={() => setStatusFilter("ACTIVE")}
          >
            Active
          </button>

          <button
            type="button"
            className={statusFilter === "INACTIVE" ? "active" : ""}
            onClick={() => setStatusFilter("INACTIVE")}
          >
            Inactive
          </button>
        </div>

        <span className="admin-coupons-result-count">
          {coupons.length} coupon
          {coupons.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* TABLE */}

      <div className="admin-coupons-table-card">
        {loading ? (
          <div className="admin-coupons-state">Loading coupons...</div>
        ) : error ? (
          <div className="admin-coupons-state error">{error}</div>
        ) : coupons.length === 0 ? (
          <div className="admin-coupons-state">No coupons found.</div>
        ) : (
          <div className="admin-coupons-table-wrapper">
            <table className="admin-coupons-table">
              <thead>
                <tr>
                  <th>CODE</th>
                  <th>DISCOUNT</th>
                  <th>VALIDITY</th>
                  <th>USAGE</th>
                  <th>TARGET</th>
                  <th>STATUS</th>
                  <th>ACTION</th>
                </tr>
              </thead>

              <tbody>
                {coupons.map((coupon) => (
                  <tr key={coupon.id}>
                    <td>
                      <div className="coupon-code-cell">
                        <div className="coupon-code">{coupon.code}</div>

                        {coupon.description && (
                          <div className="coupon-description">
                            {coupon.description}
                          </div>
                        )}
                      </div>
                    </td>

                    <td>
                      <span className="coupon-discount">
                        {formatDiscount(coupon)}
                      </span>
                    </td>

                    <td>
                      <div className="coupon-validity">
                        <span>{formatDate(coupon.validFrom)}</span>

                        <span className="coupon-date-separator">→</span>

                        <span>{formatDate(coupon.validUntil)}</span>
                      </div>
                    </td>

                    <td>
                      <span className="coupon-usage">
                        {getUsageText(coupon)}
                      </span>
                    </td>

                    <td>
                      <span className="coupon-target">
                        {coupon.targetType === "FIRST_TIME"
                          ? "First Time"
                          : "All Customers"}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`coupon-status ${
                          coupon.isActive ? "active" : "inactive"
                        }`}
                      >
                        {coupon.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td>
                      <div className="coupon-actions">
                        <button
                          type="button"
                          title="Edit coupon"
                          onClick={() => openEditModal(coupon)}
                        >
                          <Pencil size={15} />
                        </button>

                        <button
                          type="button"
                          title={
                            coupon.isActive
                              ? "Deactivate coupon"
                              : "Activate coupon"
                          }
                          onClick={() => handleToggleStatus(coupon)}
                        >
                          <Power size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE / EDIT MODAL */}

      {showCreateModal && (
        <div className="admin-coupons-modal-overlay">
          <div className="admin-coupons-modal">
            <div className="admin-coupons-modal-header">
              <div>
                <p>COUPON MANAGEMENT</p>

                <h2>{editingCoupon ? "Edit Coupon" : "Create Coupon"}</h2>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="admin-coupons-modal-close"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="admin-coupons-form">
              <div className="admin-coupons-form-grid">
                {/* CODE */}

                <div className="admin-coupons-field">
                  <label>Coupon Code</label>

                  <input
                    type="text"
                    name="code"
                    value={formData.code}
                    onChange={handleChange}
                    placeholder="WELCOME20"
                    required
                  />
                </div>

                {/* DESCRIPTION */}

                <div className="admin-coupons-field">
                  <label>Description</label>

                  <input
                    type="text"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="20% welcome discount"
                  />
                </div>

                {/* DISCOUNT TYPE */}

                <div className="admin-coupons-field">
                  <label>Discount Type</label>

                  <select
                    name="discountType"
                    value={formData.discountType}
                    onChange={handleChange}
                  >
                    <option value="PERCENTAGE">Percentage</option>

                    <option value="FIXED">Fixed Amount</option>
                  </select>
                </div>

                {/* DISCOUNT VALUE */}

                <div className="admin-coupons-field">
                  <label>Discount Value</label>

                  <input
                    type="number"
                    name="discountValue"
                    value={formData.discountValue}
                    onChange={handleChange}
                    placeholder={
                      formData.discountType === "PERCENTAGE" ? "20" : "100"
                    }
                    min="0"
                    step="0.01"
                    required
                  />
                </div>

                {/* VALID FROM */}

                <div className="admin-coupons-field">
                  <label>Valid From</label>

                  <input
                    type="datetime-local"
                    name="validFrom"
                    value={formData.validFrom}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* VALID UNTIL */}

                <div className="admin-coupons-field">
                  <label>Valid Until</label>

                  <input
                    type="datetime-local"
                    name="validUntil"
                    value={formData.validUntil}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* USAGE LIMIT */}

                <div className="admin-coupons-field">
                  <label>Usage Limit</label>

                  <input
                    type="number"
                    name="usageLimit"
                    value={formData.usageLimit}
                    onChange={handleChange}
                    placeholder="Unlimited"
                    min="1"
                  />
                </div>

                {/* MINIMUM AMOUNT */}

                <div className="admin-coupons-field">
                  <label>Minimum Amount</label>

                  <input
                    type="number"
                    name="minimumAmount"
                    value={formData.minimumAmount}
                    onChange={handleChange}
                    placeholder="No minimum"
                    min="0"
                    step="0.01"
                  />
                </div>

                {/* TARGET */}

                <div className="admin-coupons-field">
                  <label>Target Customers</label>

                  <select
                    name="targetType"
                    value={formData.targetType}
                    onChange={handleChange}
                  >
                    <option value="ALL">All Customers</option>

                    <option value="FIRST_TIME">First-Time Customers</option>
                  </select>
                </div>
              </div>

              {/* FORM ACTIONS */}

              <div className="admin-coupons-form-actions">
                <button
                  type="button"
                  className="admin-coupons-cancel-button"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="admin-coupons-save-button"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingCoupon
                      ? "Update Coupon"
                      : "Create Coupon"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
