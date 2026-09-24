import { useEffect, useState } from "react";
import { Eye, Search, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import API_URL from "../../config";
import "./AdminCustomers.css";

export default function AdminCustomers() {
  const navigate = useNavigate();

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(5);

  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 0,
    totalCustomers: 0,
    limit: 5,
  });

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setLoading(true);
        setError("");

        const params = new URLSearchParams({
          page: currentPage,
          limit,
        });

        if (search.trim()) {
          params.append("search", search.trim());
        }

        if (statusFilter !== "ALL") {
          params.append("status", statusFilter);
        }

        const response = await fetch(
          `${API_URL}/customers?${params.toString()}`,
          {
            method: "GET",
            credentials: "include",
          },
        );

        const data = await response.json();

        if (!response.ok) {
          setError(data.message || "Unable to load customers.");
          return;
        }

        setCustomers(data.customers || []);

        setPagination(
          data.pagination || {
            currentPage: currentPage,
            totalPages: 0,
            totalCustomers: 0,
            limit,
          },
        );
      } catch (error) {
        console.error("Fetch customers error:", error);

        setError("Unable to connect to the server.");
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, [currentPage, limit, statusFilter, search]);

  const formatDate = (date) => {
    if (!date) return "—";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getSubscription = (customer) => {
    return customer.subscriptions?.[0] || null;
  };

  const getStatusClass = (status) => {
    if (status === "ACTIVE") {
      return "admin-customer-status-active";
    }

    if (status === "CANCELLED") {
      return "admin-customer-status-cancelled";
    }

    if (status === "EXPIRED") {
      return "admin-customer-status-expired";
    }

    return "";
  };

  const handleStatusFilter = (status) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  const handleSearch = (event) => {
    setSearch(event.target.value);
    setCurrentPage(1);
  };

  const handleLimitChange = (event) => {
    setLimit(Number(event.target.value));
    setCurrentPage(1);
  };

  const goToPage = (page) => {
    if (page >= 1 && page <= pagination.totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="admin-customers-page">
      <header className="admin-customers-header">
        <div>
          <button
            type="button"
            className="admin-customers-back"
            onClick={() => navigate("/admin")}
            aria-label="Back to Dashboard"
          >
            <ArrowLeft size={15} />
            <span>Back to Dashboard</span>
          </button>

          <p className="admin-customers-eyebrow">CUSTOMER MANAGEMENT</p>

          <h1>Customers</h1>

          <p className="admin-customers-description">
            View and manage customer accounts, subscriptions, and activity.
          </p>
        </div>
      </header>

      <div className="admin-customers-toolbar">
        <div className="admin-customers-search">
          <Search size={16} />

          <input
            type="text"
            placeholder="Search customers..."
            value={search}
            onChange={handleSearch}
          />
        </div>

        <div className="admin-customers-filters">
          <button
            type="button"
            className={`admin-customers-filter ${
              statusFilter === "ALL" ? "active" : ""
            }`}
            onClick={() => handleStatusFilter("ALL")}
          >
            All
          </button>

          <button
            type="button"
            className={`admin-customers-filter ${
              statusFilter === "ACTIVE" ? "active" : ""
            }`}
            onClick={() => handleStatusFilter("ACTIVE")}
          >
            Active
          </button>

          <button
            type="button"
            className={`admin-customers-filter ${
              statusFilter === "NO_SUBSCRIPTION" ? "active" : ""
            }`}
            onClick={() => handleStatusFilter("NO_SUBSCRIPTION")}
          >
            No subscription
          </button>
        </div>

        <span className="admin-customers-result-count">
          {pagination.totalCustomers}{" "}
          {pagination.totalCustomers === 1 ? "customer" : "customers"}
        </span>
      </div>

      <section className="admin-customers-card">
        {loading && (
          <div className="admin-customers-message">Loading customers...</div>
        )}

        {error && (
          <div className="admin-customers-message admin-customers-error">
            {error}
          </div>
        )}

        {!loading && !error && customers.length === 0 && (
          <div className="admin-customers-message">
            {search ? "No customers match your search." : "No customers found."}
          </div>
        )}

        {!loading && !error && customers.length > 0 && (
          <>
            <div className="admin-customers-table-wrapper">
              <table className="admin-customers-table">
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

                    const plan = subscription?.plan || null;

                    return (
                      <tr key={customer.id}>
                        <td>
                          <div className="admin-customer-name">
                            <div className="admin-customer-avatar">
                              {customer.name?.charAt(0).toUpperCase()}
                            </div>

                            <span>{customer.name}</span>
                          </div>
                        </td>

                        <td>
                          <span className="admin-customer-email">
                            {customer.email}
                          </span>
                        </td>

                        <td>
                          {plan ? (
                            <span className="admin-customer-plan">
                              {plan.name}
                            </span>
                          ) : (
                            <span className="admin-customer-muted">
                              No plan
                            </span>
                          )}
                        </td>

                        <td>
                          {subscription ? (
                            <span
                              className={`admin-customer-status ${getStatusClass(
                                subscription.status,
                              )}`}
                            >
                              {subscription.status}
                            </span>
                          ) : (
                            <span className="admin-customer-muted">
                              Not subscribed
                            </span>
                          )}
                        </td>

                        <td>
                          <span className="admin-customer-date">
                            {formatDate(subscription?.renewalDate)}
                          </span>
                        </td>

                        <td>
                          <button
                            type="button"
                            className="admin-customer-view-button"
                            onClick={() =>
                              navigate(`/admin/customers/${customer.id}`)
                            }
                            aria-label={`View ${customer.name}`}
                          >
                            <Eye size={16} />
                            <span>View</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
      {!loading && !error && customers.length > 0 && (
        <div className="admin-customers-pagination">
          <div className="admin-customers-page-size">
            <span>Rows per page:</span>

            <select value={limit} onChange={handleLimitChange}>
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
            </select>
          </div>

          <div className="admin-customers-pagination-controls">
            <button
              type="button"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </button>

            {Array.from(
              {
                length: pagination.totalPages,
              },
              (_, index) => index + 1,
            ).map((page) => (
              <button
                key={page}
                type="button"
                className={currentPage === page ? "active" : ""}
                onClick={() => goToPage(page)}
              >
                {page}
              </button>
            ))}

            <button
              type="button"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === pagination.totalPages}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
