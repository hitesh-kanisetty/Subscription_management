import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Search,
  Download,
  FileSpreadsheet,
  FileText,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import "./AdminSubscriptions.css";

export default function AdminSubscriptions() {
  const navigate = useNavigate();

  const [subscriptions, setSubscriptions] = useState([]);
  const [activeMembersByPlan, setActiveMembersByPlan] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [plan, setPlan] = useState("");
  const [exportOpen, setExportOpen] = useState(false);
const [exporting, setExporting] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 5,
    total: 0,
    totalPages: 1,
  });

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString(),
      });

      if (search.trim()) {
        params.append("search", search.trim());
      }

      if (status) {
        params.append("status", status);
      }

      if (plan) {
        params.append("plan", plan);
      }

      const response = await fetch(
        `http://localhost:5000/admin/subscriptions?${params.toString()}`,
        {
          credentials: "include",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to fetch subscriptions"
        );
      }

      setSubscriptions(data.subscriptions || []);

      setActiveMembersByPlan(
        data.activeMembersByPlan || []
      );

      setPagination(
        data.pagination || {
          page: 1,
          limit: pageSize,
          total: 0,
          totalPages: 1,
        }
      );
    } catch (err) {
      console.error(
        "Fetch subscriptions error:",
        err
      );

      setError(
        err.message || "Failed to fetch subscriptions"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, [page, pageSize, search, status, plan]);

  const handleSearchChange = (event) => {
    setSearch(event.target.value);
    setPage(1);
  };

  const handleStatusChange = (event) => {
    setStatus(event.target.value);
    setPage(1);
  };

  const handlePlanChange = (event) => {
    setPlan(event.target.value);
    setPage(1);
  };

  const handlePageSizeChange = (event) => {
    setPageSize(Number(event.target.value));
    setPage(1);
  };

  const clearFilters = () => {
    setSearch("");
    setStatus("");
    setPlan("");
    setPage(1);
  };
  const handleExport = async (format) => {
  try {
    setExporting(true);
    setExportOpen(false);

    const params = new URLSearchParams();

    if (search.trim()) {
      params.append("search", search.trim());
    }

    if (status) {
      params.append("status", status);
    }

    if (plan) {
      params.append("plan", plan);
    }

    if (format === "pdf") {
      const response = await fetch(
        `http://localhost:5000/admin/subscriptions/export/pdf?${params.toString()}`,
        {
          method: "GET",
          credentials: "include",
        },
      );

      if (!response.ok) {
        const data = await response.json().catch(() => null);

        throw new Error(
          data?.message ||
            "Unable to generate subscription PDF.",
        );
      }

      const blob = await response.blob();

      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.href = url;
      link.download = "subscriptions-report.pdf";

      document.body.appendChild(link);

      link.click();

      document.body.removeChild(link);

      URL.revokeObjectURL(url);

      return;
    }

    const response = await fetch(
      `http://localhost:5000/admin/subscriptions/export?${params.toString()}`,
      {
        method: "GET",
        credentials: "include",
      },
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message ||
          "Unable to export subscriptions.",
      );
    }

    const exportSubscriptions =
      data.subscriptions || [];

    if (exportSubscriptions.length === 0) {
      alert("No subscriptions available to export.");
      return;
    }

    const headers = Object.keys(
      exportSubscriptions[0],
    );

    const csvRows = [
      headers.join(","),
      ...exportSubscriptions.map(
        (subscription) =>
          headers
            .map((header) => {
              const value =
                subscription[header] ?? "";

              return `"${String(value).replace(
                /"/g,
                '""',
              )}"`;
            })
            .join(","),
      ),
    ];

    const csvContent = csvRows.join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;
    link.download = "subscriptions-report.csv";

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  } catch (error) {
    console.error(
      "Subscription export error:",
      error,
    );

    alert(
      error.message ||
        "Unable to export subscriptions.",
    );
  } finally {
    setExporting(false);
  }
};
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

  const formatAmount = (price) => {
    if (
      price === null ||
      price === undefined
    ) {
      return "—";
    }

    return `₹${Number(price).toLocaleString(
      "en-IN"
    )}`;
  };

  const getStatusClass = (subscriptionStatus) => {
    switch (subscriptionStatus) {
      case "ACTIVE":
        return "admin-subscription-status admin-subscription-status-active";

      case "CANCELLED":
        return "admin-subscription-status admin-subscription-status-cancelled";

      case "EXPIRED":
        return "admin-subscription-status admin-subscription-status-expired";

      default:
        return "admin-subscription-status";
    }
  };

  const getTypeClass = (subscription) => {
    if (subscription.isTrial) {
      return "admin-subscription-type admin-subscription-type-trial";
    }

    return "admin-subscription-type";
  };

  const getPageNumbers = () => {
    const totalPages = pagination.totalPages;

    if (totalPages <= 5) {
      return Array.from(
        { length: totalPages },
        (_, index) => index + 1
      );
    }

    if (page <= 3) {
      return [1, 2, 3, 4, 5];
    }

    if (page >= totalPages - 2) {
      return [
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ];
    }

    return [
      page - 2,
      page - 1,
      page,
      page + 1,
      page + 2,
    ];
  };

  return (
    <div className="admin-subscriptions-page">

      {/* Header */}
      <div className="admin-subscriptions-header">
        <div>
          <p className="admin-subscriptions-eyebrow">
            SUBSCRIPTION MANAGEMENT
          </p>

          <h1>Subscriptions</h1>

          <p className="admin-subscriptions-description">
            View and manage customer subscriptions,
            plans, and renewal activity.
          </p>
        </div>

        <button
          type="button"
          className="admin-subscriptions-back"
          onClick={() => navigate("/admin")}
        >
          <ArrowLeft size={15} />
          <span>Back to Dashboard</span>
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="admin-subscriptions-error">
          {error}
        </div>
      )}

      {/* Active Members by Plan */}
      <div className="admin-subscriptions-summary">

        <div className="admin-subscriptions-summary-header">
          <h2>Active Members by Plan</h2>
        </div>

        <div className="admin-subscriptions-plan-cards">
          {activeMembersByPlan.length === 0 ? (
            <div className="admin-subscriptions-message">
              No active subscriptions found.
            </div>
          ) : (
            activeMembersByPlan.map(
              (planItem) => (
                <div
                  className="admin-subscriptions-plan-card"
                  key={planItem.planId}
                >
                  <span className="admin-subscriptions-plan-card-name">
                    {planItem.planName}
                  </span>

                  <strong>
                    {planItem.activeMembers}
                  </strong>

                  <span className="admin-subscriptions-plan-card-label">
                    {planItem.activeMembers === 1
                      ? "active member"
                      : "active members"}
                  </span>
                </div>
              )
            )
          )}
        </div>
      </div>

      {/* Toolbar */}
      <div className="admin-subscriptions-toolbar">

        {/* Search */}
        <div className="admin-subscriptions-search">
          <Search size={15} />

          <input
            type="text"
            placeholder="Search subscriptions..."
            value={search}
            onChange={handleSearchChange}
          />
        </div>

        {/* Filters */}
        <div className="admin-subscriptions-filters">

          <select
            className="admin-subscriptions-filter-select"
            value={status}
            onChange={handleStatusChange}
          >
            <option value="">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="CANCELLED">
              Cancelled
            </option>
            <option value="EXPIRED">
              Expired
            </option>
          </select>

          <select
            className="admin-subscriptions-filter-select"
            value={plan}
            onChange={handlePlanChange}
          >
            <option value="">All Plans</option>

            {activeMembersByPlan.map(
              (planItem) => (
                <option
                  key={planItem.planId}
                  value={planItem.planName}
                >
                  {planItem.planName}
                </option>
              )
            )}
          </select>
        </div>

        {/* Clear */}
        {(search || status || plan) && (
          <button
            type="button"
            className="admin-subscriptions-clear-button"
            onClick={clearFilters}
          >
            Clear
          </button>
        )}

        {/* Count */}
        <span className="admin-subscriptions-result-count">
          {pagination.total} subscriptions
        </span>
        <div className="admin-subscriptions-export">
  <button
    type="button"
    className="admin-subscriptions-export-button"
    onClick={() =>
      setExportOpen(
        (previous) => !previous,
      )
    }
    disabled={exporting}
  >
    <Download size={16} />

    <span>
      {exporting ? "Exporting..." : "Export"}
    </span>
  </button>

  {exportOpen && (
    <div className="admin-subscriptions-export-menu">
      <button
        type="button"
        onClick={() =>
          handleExport("csv")
        }
      >
        <FileSpreadsheet size={15} />
        <span>Export CSV</span>
      </button>

      <button
        type="button"
        onClick={() =>
          handleExport("pdf")
        }
      >
        <FileText size={15} />
        <span>Export PDF</span>
      </button>
    </div>
  )}
</div>
      </div>

      {/* Subscription Table */}
      <div className="admin-subscriptions-card">
        <div className="admin-subscriptions-table-wrapper">

          <table className="admin-subscriptions-table">

            <thead>
              <tr>
                <th>Customer</th>
                <th>Plan</th>
                <th>Billing</th>
                <th>Status</th>
                <th>Start</th>
                <th>Renewal</th>
                <th>Type</th>
              </tr>
            </thead>

            <tbody>

              {loading ? (
                <tr>
                  <td
                    colSpan="7"
                    className="admin-subscriptions-message"
                  >
                    Loading subscriptions...
                  </td>
                </tr>
              ) : subscriptions.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="admin-subscriptions-message"
                  >
                    No subscriptions found.
                  </td>
                </tr>
              ) : (
                subscriptions.map(
                  (subscription) => (
                    <tr
                      key={subscription.id}
                    >

                      {/* Customer */}
                      <td>
                        <div className="admin-subscription-customer">

                          <div className="admin-subscription-customer-name">
                            {subscription.user?.name ||
                              "Unknown"}
                          </div>

                          <div className="admin-subscription-customer-email">
                            {subscription.user?.email ||
                              "—"}
                          </div>

                        </div>
                      </td>

                      {/* Plan */}
                      <td>
                        <span className="admin-subscription-plan">
                          {subscription.plan?.name ||
                            "—"}
                        </span>
                      </td>

                      {/* Billing */}
                      <td>
                        <span className="admin-subscription-price">
                          {formatAmount(
                            subscription.plan?.price
                          )}
                        </span>

                        <span className="admin-subscription-billing-period">
                          {subscription.plan
                            ?.billingPeriod || "—"}
                        </span>
                      </td>

                      {/* Status */}
                      <td>
                        <span
                          className={getStatusClass(
                            subscription.status
                          )}
                        >
                          {subscription.status}
                        </span>
                      </td>

                      {/* Start */}
                      <td>
                        <span className="admin-subscription-date">
                          {formatDate(
                            subscription.startDate
                          )}
                        </span>
                      </td>

                      {/* Renewal */}
                      <td>
                        <span className="admin-subscription-date">
                          {formatDate(
                            subscription.renewalDate
                          )}
                        </span>
                      </td>

                      {/* Type */}
                      <td>
                        <span
                          className={getTypeClass(
                            subscription
                          )}
                        >
                          {subscription.isTrial
                            ? "Trial"
                            : "Paid"}
                        </span>
                      </td>

                    </tr>
                  )
                )
              )}

            </tbody>
          </table>

        </div>
      </div>

      {/* Pagination */}
      {pagination.total > 0 && (
        <div className="admin-subscriptions-pagination">

          <div className="admin-subscriptions-page-size">
            <span>Rows per page:</span>

            <select
              value={pageSize}
              onChange={handlePageSizeChange}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
            </select>
          </div>

          <div className="admin-subscriptions-pagination-controls">

            <button
              type="button"
              disabled={page === 1 || loading}
              onClick={() =>
                setPage(
                  (previousPage) =>
                    previousPage - 1
                )
              }
            >
              Previous
            </button>

            {getPageNumbers().map(
              (pageNumber) => (
                <button
                  key={pageNumber}
                  type="button"
                  className={
                    page === pageNumber
                      ? "active"
                      : ""
                  }
                  disabled={loading}
                  onClick={() =>
                    setPage(pageNumber)
                  }
                >
                  {pageNumber}
                </button>
              )
            )}

            <button
              type="button"
              disabled={
                page === pagination.totalPages ||
                loading
              }
              onClick={() =>
                setPage(
                  (previousPage) =>
                    previousPage + 1
                )
              }
            >
              Next
            </button>

          </div>
        </div>
      )}
    </div>
  );
}