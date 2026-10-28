
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API_URL from "../../config";
import {
  CreditCard,
  IndianRupee,
  Receipt,
  ArrowLeft,
  Search,
  Download,
  FileSpreadsheet,
  FileText,
} from "lucide-react";
import "./SupportAgentBilling.css";

export default function SupportAgentBilling() {
  const navigate = useNavigate();

  const [billing, setBilling] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [exportOpen, setExportOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(5);

  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 0,
    totalPayments: 0,
    limit: 5,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    const controller = new AbortController();

    const fetchBilling = async () => {
      try {
        setLoading(true);
        setError("");

        const params = new URLSearchParams({
          page: String(currentPage),
          limit: String(limit),
        });

        if (debouncedSearch.trim()) {
          params.set("search", debouncedSearch.trim());
        }

        const response = await fetch(
          `${API_URL}/support-agent/billing?${params.toString()}`,
          {
            credentials: "include",
            signal: controller.signal,
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Failed to fetch billing data."
          );
        }

        setBilling(data);
        setPagination(
          data.pagination || {
            currentPage: 1,
            totalPages: 0,
            totalPayments: 0,
            limit,
          }
        );
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Support billing error:", err);
          setError(err.message || "Something went wrong.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchBilling();

    return () => controller.abort();
  }, [currentPage, limit, debouncedSearch]);

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1);
  };

  const clearSearch = () => {
    setSearchTerm("");
    setDebouncedSearch("");
    setCurrentPage(1);
  };

  const handleExport = async (format) => {
    try {
      setExporting(true);
      setExportOpen(false);

      const params = new URLSearchParams();

      if (debouncedSearch.trim()) {
        params.set("search", debouncedSearch.trim());
      }

      const isPdf = format === "pdf";
      const endpoint = isPdf
        ? "/support-agent/billing/export/pdf"
        : "/support-agent/billing/export";

      const response = await fetch(
        `${API_URL}${endpoint}?${params.toString()}`,
        { credentials: "include" }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(
          data?.message || "Unable to export billing records."
        );
      }

      if (isPdf) {
        const blob = await response.blob();
        downloadBlob(blob, "billing-report.pdf");
        return;
      }

      const data = await response.json();
      const payments = data.payments || [];

      if (!payments.length) {
        alert("No billing records available to export.");
        return;
      }

      const headers = Object.keys(payments[0]);

      const csvRows = [
        headers.map(csvEscape).join(","),
        ...payments.map((payment) =>
          headers.map((header) => csvEscape(payment[header])).join(",")
        ),
      ];

      const blob = new Blob(
        ["\uFEFF", csvRows.join("\r\n")],
        { type: "text/csv;charset=utf-8;" }
      );

      downloadBlob(blob, "billing-report.csv");
    } catch (err) {
      console.error("Support billing export error:", err);
      alert(err.message || "Unable to export billing records.");
    } finally {
      setExporting(false);
    }
  };

  const csvEscape = (value) =>
    `"${String(value ?? "").replace(/"/g, '""')}"`;

  const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const formatDate = (date) => {
    if (!date) return "—";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatAmount = (amount) =>
    `₹${Number(amount || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const payments = billing?.payments || [];
  const summary = billing?.summary || {};

  if (loading && !billing) {
    return (
      <div className="admin-billing-page">
        <div className="admin-billing-message">
          Loading billing information...
        </div>
      </div>
    );
  }

  if (error && !billing) {
    return (
      <div className="admin-billing-page">
        <div className="admin-billing-message admin-billing-error">
          <p>{error}</p>
          <button
            type="button"
            onClick={() => {
              setBilling(null);
              setCurrentPage((page) => page);
              setDebouncedSearch((value) => `${value} `);
            }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-billing-page">
      <header className="admin-billing-header">
        <div>
          <button
            type="button"
            className="admin-billing-back"
            onClick={() => navigate("/support")}
            aria-label="Back to Support Dashboard"
          >
            <ArrowLeft size={15} />
            <span>Back to Dashboard</span>
          </button>

          <p className="admin-billing-eyebrow">FINANCIAL OVERVIEW</p>
          <h1>Billing &amp; Payments</h1>
          <p className="admin-billing-description">
            View payment collections and subscription billing records.
          </p>
        </div>
      </header>

      <section className="admin-billing-overview">
        <div className="admin-billing-stat">
          <div className="admin-billing-stat-icon">
            <IndianRupee size={18} />
          </div>
          <div>
            <span>TOTAL COLLECTED</span>
            <strong>{formatAmount(summary.totalCollected)}</strong>
          </div>
        </div>

        <div className="admin-billing-stat">
          <div className="admin-billing-stat-icon">
            <Receipt size={18} />
          </div>
          <div>
            <span>TOTAL PAYMENTS</span>
            <strong>{summary.successfulPayments || 0}</strong>
          </div>
        </div>

        <div className="admin-billing-stat">
          <div className="admin-billing-stat-icon">
            <CreditCard size={18} />
          </div>
          <div>
            <span>PAYMENT STATUS</span>
            <strong>PAID</strong>
          </div>
        </div>
      </section>

      <section className="admin-billing-card">
        <div className="admin-billing-section-heading">
          <div>
            <p>TRANSACTION RECORDS</p>
            <h2>Payment History</h2>
          </div>
          <span>
            {pagination.totalPayments} payment
            {pagination.totalPayments !== 1 ? "s" : ""}
          </span>
        </div>

        <div className="admin-billing-toolbar">
          <div className="admin-billing-search">
            <Search size={15} />
            <input
              type="text"
              placeholder="Search customer, plan, transaction ID..."
              value={searchTerm}
              onChange={handleSearch}
            />

            {searchTerm && (
              <button
                type="button"
                className="admin-billing-search-clear"
                onClick={clearSearch}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>

          <div className="admin-billing-export">
            <button
              type="button"
              className="admin-billing-export-button"
              onClick={() => setExportOpen((open) => !open)}
              disabled={exporting}
            >
              <Download size={16} />
              <span>{exporting ? "Exporting..." : "Export"}</span>
            </button>

            {exportOpen && (
              <div className="admin-billing-export-menu">
                <button type="button" onClick={() => handleExport("csv")}>
                  <FileSpreadsheet size={15} />
                  <span>Export CSV</span>
                </button>
                <button type="button" onClick={() => handleExport("pdf")}>
                  <FileText size={15} />
                  <span>Export PDF</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {loading && billing && (
          <div className="admin-billing-message">Refreshing payments...</div>
        )}

        {error && billing && (
          <div className="admin-billing-message admin-billing-error">
            {error}
          </div>
        )}

        {!payments.length ? (
          <div className="admin-billing-empty">
            <Receipt size={25} />
            <strong>
              {searchTerm ? "No matching payments" : "No payments yet"}
            </strong>
            <p>
              {searchTerm
                ? "Try another customer, plan, or transaction ID."
                : "Payment records will appear here when available."}
            </p>
          </div>
        ) : (
          <div className="admin-billing-table-wrapper">
            <table className="admin-billing-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Plan</th>
                  <th>Amount</th>
                  <th>Transaction ID</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id}>
                    <td>
                      <div className="admin-billing-customer">
                        <strong>{payment.customer?.name || "—"}</strong>
                        <span>{payment.customer?.email || "—"}</span>
                      </div>
                    </td>
                    <td>
                      <div className="admin-billing-plan">
                        <strong>{payment.plan?.name || "—"}</strong>
                        <span>
                          {payment.plan?.billingPeriod === "YEARLY"
                            ? "Yearly"
                            : "Monthly"}
                        </span>
                      </div>
                    </td>
                    <td>
                      <strong className="admin-billing-amount">
                        {formatAmount(payment.amount)}
                      </strong>
                    </td>
                    <td>
                      <span className="admin-billing-transaction">
                        {payment.transactionId || "—"}
                      </span>
                    </td>
                    <td>
                      <span className="admin-billing-date">
                        {formatDate(payment.paymentDate)}
                      </span>
                    </td>
                    <td>
                      <span className="admin-billing-status">
                        {payment.status || "PAID"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {pagination.totalPages > 0 && (
        <div className="admin-billing-pagination">
          <div className="admin-billing-page-size">
            <span>Rows:</span>
            <select
              value={limit}
              onChange={(event) => {
                setLimit(Number(event.target.value));
                setCurrentPage(1);
              }}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
            </select>
          </div>

          <div className="admin-billing-pagination-controls">
            <button
              type="button"
              onClick={() => setCurrentPage((page) => page - 1)}
              disabled={currentPage <= 1}
            >
              Previous
            </button>

            {Array.from(
              { length: pagination.totalPages },
              (_, index) => index + 1
            ).map((page) => (
              <button
                key={page}
                type="button"
                className={currentPage === page ? "active" : ""}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            ))}

            <button
              type="button"
              onClick={() => setCurrentPage((page) => page + 1)}
              disabled={currentPage >= pagination.totalPages}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
