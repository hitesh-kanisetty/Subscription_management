
import { useEffect, useState } from "react";
import { Search, Eye, Users, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import API_URL from "../../config";
import "./SupportAgentCustomers.css";

export default function SupportAgentCustomers() {
  const navigate = useNavigate();

  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);
  const [pagination, setPagination] = useState({
    totalPages: 0,
    totalCustomers: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    const fetchCustomers = async () => {
      try {
        setLoading(true);
        setError("");

        const params = new URLSearchParams({
          page: String(page),
          limit: String(limit),
        });

        if (search.trim()) params.set("search", search.trim());
        if (status !== "ALL") params.set("status", status);

        const response = await fetch(
          `${API_URL}/support-agent/customers?${params}`,
          {
            method: "GET",
            credentials: "include",
            signal: controller.signal,
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to load customers.");
        }

        setCustomers(data.customers || []);
        setPagination(data.pagination || {
          totalPages: 0,
          totalCustomers: 0,
        });
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message || "Unable to connect to the server.");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    fetchCustomers();
    return () => controller.abort();
  }, [page, limit, search, status]);

  const formatDate = (date) => {
    if (!date) return "—";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getSubscription = (customer) =>
    customer.subscriptions?.[0] || null;

  const resetPage = (callback) => {
    setPage(1);
    callback();
  };

  return (
    <main className="sa-customers">
      <header className="sa-customers-header">
        <div>
          <span className="sa-customers-eyebrow">
            CUSTOMER SUPPORT
          </span>
          <h1>Customers</h1>
          <p>View customer accounts and subscription information.</p>
        </div>

        <div className="sa-customers-total">
          <Users size={20} />
          <div>
            <strong>{pagination.totalCustomers}</strong>
            <span>Total customers</span>
          </div>
        </div>
      </header>

      <section className="sa-customers-toolbar">
        <label className="sa-customers-search">
          <Search size={17} />
          <input
            type="search"
            placeholder="Search name or email..."
            value={search}
            onChange={(e) =>
              resetPage(() => setSearch(e.target.value))
            }
          />
        </label>

        <select
          value={status}
          onChange={(e) =>
            resetPage(() => setStatus(e.target.value))
          }
          aria-label="Filter customers by subscription status"
        >
          <option value="ALL">All customers</option>
          <option value="ACTIVE">Active subscriptions</option>
          <option value="NO_SUBSCRIPTION">No subscription</option>
          <option value="CANCELLED">Cancelled</option>
          <option value="EXPIRED">Expired</option>
        </select>

        <select
          value={limit}
          onChange={(e) =>
            resetPage(() => setLimit(Number(e.target.value)))
          }
          aria-label="Rows per page"
        >
          <option value={5}>5 per page</option>
          <option value={10}>10 per page</option>
          <option value={20}>20 per page</option>
        </select>
      </section>

      <section className="sa-customers-card">
        {loading ? (
          <div className="sa-customers-message">
            <RefreshCw size={18} className="sa-spin" />
            Loading customers...
          </div>
        ) : error ? (
          <div className="sa-customers-message sa-customers-error">
            {error}
            <button onClick={() => setPage((p) => p)}>
              Retry
            </button>
          </div>
        ) : customers.length === 0 ? (
          <div className="sa-customers-message">
            No customers found.
          </div>
        ) : (
          <div className="sa-customers-table-wrap">
            <table className="sa-customers-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Email</th>
                  <th>Plan</th>
                  <th>Status</th>
                  <th>Renewal</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {customers.map((customer) => {
                  const subscription = getSubscription(customer);
                  const plan = subscription?.plan;

                  return (
                    <tr key={customer.id}>
                      <td>
                        <div className="sa-customer-name">
                          <span className="sa-customer-avatar">
                            {customer.name?.charAt(0)?.toUpperCase() || "C"}
                          </span>
                          <span>{customer.name || "—"}</span>
                        </div>
                      </td>

                      <td>{customer.email}</td>

                      <td>
                        {plan?.name || (
                          <span className="sa-muted">No plan</span>
                        )}
                      </td>

                      <td>
                        <span
                          className={`sa-status sa-status-${(
                            subscription?.status || "NONE"
                          ).toLowerCase()}`}
                        >
                          {subscription?.status || "Not subscribed"}
                        </span>
                      </td>

                      <td>
                        {formatDate(subscription?.renewalDate)}
                      </td>

                      <td>
                        <button
                          className="sa-view-button"
                          onClick={() =>
                            navigate(
                              `/support/customers/${customer.id}`
                            )
                          }
                        >
                          <Eye size={15} />
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {!loading && !error && customers.length > 0 && (
        <footer className="sa-customers-pagination">
          <span>
            Page {page} of {Math.max(pagination.totalPages, 1)}
          </span>

          <div>
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </button>

            <button
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        </footer>
      )}
    </main>
  );
}
