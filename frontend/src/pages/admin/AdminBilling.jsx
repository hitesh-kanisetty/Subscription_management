import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import API_URL from "../../config";
import {
  CreditCard,
  IndianRupee,
  Receipt,
  ArrowLeft,
  Search,
} from "lucide-react";
import "./AdminBilling.css";

function AdminBilling() {
  const navigate = useNavigate();

  const [billing, setBilling] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const fetchBilling = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/admin/billing`,
        {
          credentials: "include",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to fetch billing data"
        );
      }

      setBilling(data);
    } catch (err) {
      console.error("Admin billing error:", err);
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBilling();
  }, []);

  const formatDate = (date) => {
    if (!date) return "—";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatAmount = (amount) => {
    return `₹${Number(amount || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const payments = billing?.payments || [];
  const summary = billing?.summary || {};

  const filteredPayments = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    if (!search) {
      return payments;
    }

    return payments.filter((payment) => {
      const customerName =
        payment.customer?.name?.toLowerCase() || "";

      const customerEmail =
        payment.customer?.email?.toLowerCase() || "";

      const planName =
        payment.plan?.name?.toLowerCase() || "";

      const transactionId =
        payment.transactionId?.toLowerCase() || "";

      const paymentMethod =
        payment.paymentMethod?.toLowerCase() || "";

      return (
        customerName.includes(search) ||
        customerEmail.includes(search) ||
        planName.includes(search) ||
        transactionId.includes(search) ||
        paymentMethod.includes(search)
      );
    });
  }, [payments, searchTerm]);

  if (loading) {
    return (
      <div className="admin-billing-page">
        <div className="admin-billing-message">
          Loading billing information...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-billing-page">
        <div className="admin-billing-message admin-billing-error">
          <p>{error}</p>

          <button onClick={fetchBilling}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-billing-page">
      {/* HEADER */}
      <header className="admin-billing-header">
        <div>
          <button
  type="button"
  className="admin-billing-back"
  onClick={() => navigate("/admin")}
  aria-label="Back to Dashboard"
>
  <ArrowLeft size={15} />
  <span>Back to Dashboard</span>
</button>

          <p className="admin-billing-eyebrow">
            FINANCIAL OVERVIEW
          </p>

          <h1>Billing & Payments</h1>

          <p className="admin-billing-description">
            View payment collections and subscription billing records.
          </p>
        </div>
      </header>

      {/* SUMMARY */}
      <section className="admin-billing-overview">
        <div className="admin-billing-stat">
          <div className="admin-billing-stat-icon">
            <IndianRupee size={18} />
          </div>

          <div>
            <span>TOTAL COLLECTED</span>
            <strong>
              {formatAmount(summary.totalCollected)}
            </strong>
          </div>
        </div>

        <div className="admin-billing-stat">
          <div className="admin-billing-stat-icon">
            <Receipt size={18} />
          </div>

          <div>
            <span>TOTAL PAYMENTS</span>
            <strong>
              {summary.successfulPayments || 0}
            </strong>
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

      {/* PAYMENT HISTORY */}
      <section className="admin-billing-card">
        <div className="admin-billing-section-heading">
          <div>
            <p>TRANSACTION RECORDS</p>
            <h2>Payment History</h2>
          </div>

          <span>
            {filteredPayments.length} payment
            {filteredPayments.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* SEARCH */}
        <div className="admin-billing-search">
          <Search size={15} />

          <input
            type="text"
            placeholder="Search by customer, plan, transaction ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          {searchTerm && (
            <button
              type="button"
              className="admin-billing-search-clear"
              onClick={() => setSearchTerm("")}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>

        {filteredPayments.length === 0 ? (
          <div className="admin-billing-empty">
            <Receipt size={25} />

            <strong>
              {payments.length === 0
                ? "No payments yet"
                : "No matching payments"}
            </strong>

            <p>
              {payments.length === 0
                ? "Payment records will appear here when customers subscribe to plans."
                : "Try searching with a different customer, plan, or transaction ID."}
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
                  {/* <th>Method</th> */}
                  <th>Transaction ID</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {filteredPayments.map((payment) => (
                  <tr key={payment.id}>
                    <td>
                      <div className="admin-billing-customer">
                        <strong>
                          {payment.customer?.name || "—"}
                        </strong>

                        <span>
                          {payment.customer?.email || "—"}
                        </span>
                      </div>
                    </td>

                    <td>
                      <div className="admin-billing-plan">
                        <strong>
                          {payment.plan?.name || "—"}
                        </strong>

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

                    {/* <td>
                      <span className="admin-billing-method">
                        {payment.paymentMethod || "—"}
                      </span>
                    </td> */}

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
    </div>
  );
}

export default AdminBilling;