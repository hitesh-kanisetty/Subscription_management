import { useEffect, useState } from "react";

import {
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Eye,
  Download,
  FileSpreadsheet,
  FileText,
} from "lucide-react";

import "./AdminAuditLogs.css";

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 5,
    totalLogs: 0,
    totalPages: 1,
  });

  const [search, setSearch] = useState("");
  const [module, setModule] = useState("");
  const [action, setAction] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const [selectedLog, setSelectedLog] = useState(null);

  // Export
  const [exportOpen, setExportOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  // --------------------------------------------------
  // FETCH AUDIT LOGS
  // --------------------------------------------------

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();

      params.set("page", page);
      params.set("limit", limit);

      if (search.trim()) {
        params.set("search", search.trim());
      }

      if (module) {
        params.set("module", module);
      }

      if (action) {
        params.set("action", action);
      }

      if (from) {
        params.set("from", from);
      }

      if (to) {
        params.set("to", to);
      }

      const response = await fetch(
        `http://localhost:5000/admin/audit-logs?${params.toString()}`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to load audit logs"
        );
      }

      setLogs(data.logs || []);

      setPagination(
        data.pagination || {
          page: 1,
          limit,
          totalLogs: 0,
          totalPages: 1,
        }
      );
    } catch (error) {
      console.error("Audit logs fetch error:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [
    page,
    limit,
    search,
    module,
    action,
    from,
    to,
  ]);

  // --------------------------------------------------
  // FILTER HANDLERS
  // --------------------------------------------------

  const handleSearchChange = (event) => {
    setSearch(event.target.value);
    setPage(1);
  };

  const handleModuleChange = (event) => {
    setModule(event.target.value);
    setPage(1);
  };

  const handleActionChange = (event) => {
    setAction(event.target.value);
    setPage(1);
  };

  const handleFromChange = (event) => {
    setFrom(event.target.value);
    setPage(1);
  };

  const handleToChange = (event) => {
    setTo(event.target.value);
    setPage(1);
  };

  const handleLimitChange = (event) => {
    setLimit(Number(event.target.value));
    setPage(1);
  };

  const clearFilters = () => {
    setSearch("");
    setModule("");
    setAction("");
    setFrom("");
    setTo("");
    setPage(1);
  };

  const hasFilters =
    search ||
    module ||
    action ||
    from ||
    to;

  // --------------------------------------------------
  // EXPORT
  // --------------------------------------------------

  const handleExport = async (format) => {
    try {
      setExporting(true);
      setExportOpen(false);

      const params = new URLSearchParams();

      if (search.trim()) {
        params.set("search", search.trim());
      }

      if (module) {
        params.set("module", module);
      }

      if (action) {
        params.set("action", action);
      }

      if (from) {
        params.set("from", from);
      }

      if (to) {
        params.set("to", to);
      }

      // -----------------------------
      // PDF
      // -----------------------------

      if (format === "pdf") {
        const response = await fetch(
          `http://localhost:5000/admin/audit-logs/export/pdf?${params.toString()}`,
          {
            method: "GET",
            credentials: "include",
          }
        );

        if (!response.ok) {
          const data = await response
            .json()
            .catch(() => null);

          throw new Error(
            data?.message ||
              "Unable to generate audit logs PDF."
          );
        }

        const blob = await response.blob();

        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");

        link.href = url;
        link.download = "audit-logs-report.pdf";

        document.body.appendChild(link);

        link.click();

        document.body.removeChild(link);

        URL.revokeObjectURL(url);

        return;
      }

      // -----------------------------
      // CSV
      // -----------------------------

      const response = await fetch(
        `http://localhost:5000/admin/audit-logs/export?${params.toString()}`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to export audit logs."
        );
      }

      const exportLogs = data.logs || [];

      if (exportLogs.length === 0) {
        alert("No audit logs available to export.");
        return;
      }

      const headers = Object.keys(
        exportLogs[0]
      );

      const csvRows = [
        headers.join(","),

        ...exportLogs.map((log) =>
          headers
            .map((header) => {
              const value = log[header] ?? "";

              return `"${String(value).replace(
                /"/g,
                '""'
              )}"`;
            })
            .join(",")
        ),
      ];

      const csvContent = csvRows.join("\n");

      const blob = new Blob([csvContent], {
        type: "text/csv;charset=utf-8;",
      });

      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.href = url;
      link.download = "audit-logs-report.csv";

      document.body.appendChild(link);

      link.click();

      document.body.removeChild(link);

      URL.revokeObjectURL(url);
    } catch (error) {
      console.error(
        "Audit log export error:",
        error
      );

      alert(
        error.message ||
          "Unable to export audit logs."
      );
    } finally {
      setExporting(false);
    }
  };

  // --------------------------------------------------
  // HELPERS
  // --------------------------------------------------

  const formatDate = (date) => {
    return new Date(date).toLocaleString();
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

  // --------------------------------------------------
  // RENDER
  // --------------------------------------------------

  return (
    <div className="admin-audit-logs-page">

      {/* =========================
          HEADER
      ========================= */}

      <section className="content-section admin-audit-header">
        <div className="section-heading">
          <div>
            <p className="eyebrow">
              SYSTEM ACTIVITY
            </p>

            <h2>Audit Logs</h2>

            <p className="admin-audit-subtitle">
              Track important administrative actions
              performed in the system.
            </p>
          </div>

          <div className="admin-audit-total">
            <span>Total Logs</span>

            <strong>
              {pagination.totalLogs}
            </strong>
          </div>
        </div>
      </section>

      {/* =========================
          FILTERS
      ========================= */}

      <section className="content-section admin-audit-filters-section">

        <div className="admin-audit-filters-heading">
          <div>
            <SlidersHorizontal size={16} />

            <span>Filters</span>
          </div>

          {hasFilters && (
            <button
              type="button"
              className="admin-audit-clear"
              onClick={clearFilters}
            >
              <X size={14} />
              Clear filters
            </button>
          )}
        </div>

        <div className="admin-audit-filters">

          {/* Search */}

          <div className="admin-audit-search">
            <Search size={16} />

            <input
              type="text"
              value={search}
              onChange={handleSearchChange}
              placeholder="Search user, email or description..."
            />

            {search && (
              <button
                type="button"
                className="admin-audit-search-clear"
                onClick={() => {
                  setSearch("");
                  setPage(1);
                }}
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Module */}

          <select
            value={module}
            onChange={handleModuleChange}
            className="admin-audit-filter-select"
          >
            <option value="">
              All Modules
            </option>

            <option value="Plans">
              Plans
            </option>

            <option value="Support">
              Support
            </option>

            <option value="Profile">
              Profile
            </option>
          </select>

          {/* Action */}

          <select
            value={action}
            onChange={handleActionChange}
            className="admin-audit-filter-select"
          >
            <option value="">
              All Actions
            </option>

            <option value="CREATE">
              Create
            </option>

            <option value="UPDATE">
              Update
            </option>

            <option value="ACTIVATE">
              Activate
            </option>

            <option value="DEACTIVATE">
              Deactivate
            </option>

            <option value="DELETE">
              Delete
            </option>

            <option value="REPLY">
              Reply
            </option>

            <option value="CHANGE_PASSWORD">
              Change Password
            </option>
          </select>

          {/* From */}

          <div className="admin-audit-date-field">
            <label htmlFor="audit-from">
              From
            </label>

            <input
              id="audit-from"
              type="date"
              value={from}
              onChange={handleFromChange}
            />
          </div>

          {/* To */}

          <div className="admin-audit-date-field">
            <label htmlFor="audit-to">
              To
            </label>

            <input
              id="audit-to"
              type="date"
              value={to}
              onChange={handleToChange}
            />
          </div>

        </div>
      </section>

      {/* =========================
          TABLE
      ========================= */}

      <section className="content-section admin-audit-table-section">

        <div className="section-heading">

          <div>
            <p className="eyebrow">
              ACTIVITY HISTORY
            </p>

            <h2>
              Administrative Activity
            </h2>
          </div>

          {/* EXPORT */}

          <div className="admin-audit-export">

            <button
              type="button"
              className="admin-audit-export-button"
              onClick={() =>
                setExportOpen(
                  (previous) => !previous
                )
              }
              disabled={exporting}
            >
              <Download size={16} />

              <span>
                {exporting
                  ? "Exporting..."
                  : "Export"}
              </span>
            </button>

            {exportOpen && (
              <div className="admin-audit-export-menu">

                <button
                  type="button"
                  onClick={() =>
                    handleExport("csv")
                  }
                >
                  <FileSpreadsheet size={15} />

                  <span>
                    Export CSV
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleExport("pdf")
                  }
                >
                  <FileText size={15} />

                  <span>
                    Export PDF
                  </span>
                </button>

              </div>
            )}

          </div>
        </div>

        {loading ? (
          <div className="admin-audit-state">
            Loading audit logs...
          </div>
        ) : error ? (
          <div className="admin-audit-state admin-audit-error">
            {error}
          </div>
        ) : (
          <>
            <div className="admin-audit-table-wrap">

              <table className="admin-audit-table">

                <thead>
                  <tr>
                    <th>Date & Time</th>
                    <th>User</th>
                    <th>Action</th>
                    <th>Module</th>
                    <th>Description</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>

                  {logs.length === 0 ? (
                    <tr>
                      <td
                        colSpan="6"
                        className="admin-audit-empty"
                      >
                        No audit logs found.
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr
                        key={log.id}
                        onClick={() =>
                          setSelectedLog(log)
                        }
                        className="admin-audit-row"
                      >

                        {/* Date */}

                        <td className="admin-audit-date">
                          {formatDate(
                            log.createdAt
                          )}
                        </td>

                        {/* User */}

                        <td>
                          <div className="admin-audit-user">

                            <span className="admin-audit-avatar">
                              {log.user?.name
                                ?.slice(0, 2)
                                .toUpperCase() ||
                                "NA"}
                            </span>

                            <div>
                              <strong>
                                {log.user?.name ||
                                  "Unknown"}
                              </strong>

                              <small>
                                {log.user?.email ||
                                  ""}
                              </small>
                            </div>

                          </div>
                        </td>

                        {/* Action */}

                        <td>
                          <span
                            className={`admin-audit-action action-${String(
                              log.action
                            ).toLowerCase()}`}
                          >
                            {log.action}
                          </span>
                        </td>

                        {/* Module */}

                        <td>
                          <span className="admin-audit-module">
                            {log.module}
                          </span>
                        </td>

                        {/* Description */}

                        <td className="admin-audit-description">
                          {log.description}
                        </td>

                        {/* View */}

                        <td>
                          <button
                            type="button"
                            className="admin-audit-view-button"
                            onClick={(event) => {
                              event.stopPropagation();
                              setSelectedLog(log);
                            }}
                          >
                            <Eye size={14} />
                            View
                          </button>
                        </td>

                      </tr>
                    ))
                  )}

                </tbody>

              </table>

            </div>

            {/* =========================
                PAGINATION
            ========================= */}

            {pagination.totalLogs > 0 && (
              <div className="admin-audit-pagination">

                <div className="admin-audit-rows-control">
                  <span>
                    Rows per page:
                  </span>

                  <select
                    value={limit}
                    onChange={handleLimitChange}
                  >
                    <option value="5">
                      5
                    </option>

                    <option value="10">
                      10
                    </option>

                    <option value="20">
                      20
                    </option>
                  </select>
                </div>

                <div className="admin-audit-pagination-controls">

                  <button
                    type="button"
                    className="admin-audit-page-button"
                    disabled={page === 1}
                    onClick={() =>
                      setPage(
                        (current) =>
                          current - 1
                      )
                    }
                  >
                    <ChevronLeft size={15} />
                    Previous
                  </button>

                  {getPageNumbers().map(
                    (pageNumber) => (
                      <button
                        key={pageNumber}
                        type="button"
                        className={`admin-audit-page-number ${
                          page === pageNumber
                            ? "active"
                            : ""
                        }`}
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
                    className="admin-audit-page-button"
                    disabled={
                      page ===
                      pagination.totalPages
                    }
                    onClick={() =>
                      setPage(
                        (current) =>
                          current + 1
                      )
                    }
                  >
                    Next
                    <ChevronRight size={15} />
                  </button>

                </div>
              </div>
            )}
          </>
        )}

      </section>

      {/* =========================
          LOG DETAILS MODAL
      ========================= */}

      {selectedLog && (
        <div
          className="admin-audit-modal-overlay"
          onClick={() =>
            setSelectedLog(null)
          }
        >

          <div
            className="admin-audit-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div className="admin-audit-modal-header">

              <div>
                <p className="eyebrow">
                  AUDIT LOG DETAILS
                </p>

                <h2>
                  Activity Details
                </h2>
              </div>

              <button
                type="button"
                className="admin-audit-modal-close"
                onClick={() =>
                  setSelectedLog(null)
                }
                aria-label="Close"
              >
                <X size={18} />
              </button>

            </div>

            <div className="admin-audit-modal-body">

              <div className="admin-audit-detail-grid">

                <div>
                  <span>Date & Time</span>

                  <strong>
                    {formatDate(
                      selectedLog.createdAt
                    )}
                  </strong>
                </div>

                <div>
                  <span>Log ID</span>

                  <strong>
                    #{selectedLog.id}
                  </strong>
                </div>

                <div>
                  <span>User</span>

                  <strong>
                    {selectedLog.user?.name ||
                      "Unknown"}
                  </strong>

                  <small>
                    {selectedLog.user?.email ||
                      ""}
                  </small>
                </div>

                <div>
                  <span>Module</span>

                  <strong>
                    {selectedLog.module}
                  </strong>
                </div>

              </div>

              <div className="admin-audit-modal-action">

                <span>Action</span>

                <span
                  className={`admin-audit-action action-${String(
                    selectedLog.action
                  ).toLowerCase()}`}
                >
                  {selectedLog.action}
                </span>

              </div>

              <div className="admin-audit-modal-description">

                <span>Description</span>

                <p>
                  {selectedLog.description}
                </p>

              </div>

            </div>

            <div className="admin-audit-modal-footer">

              <button
                type="button"
                onClick={() =>
                  setSelectedLog(null)
                }
              >
                Close
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}