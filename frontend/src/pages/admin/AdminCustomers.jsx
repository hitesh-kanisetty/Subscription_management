import { useEffect, useState } from "react";
import { Eye, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import API_URL from "../../config";
import "./AdminCustomers.css";

export default function AdminCustomers() {
  const navigate = useNavigate();

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState("ALL");

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_URL}/customers`,
          {
            method: "GET",
            credentials: "include",
          }
        );

        const data = await response.json();

        if (!response.ok) {
          setError(
            data.message || "Unable to load customers."
          );
          return;
        }

        setCustomers(data.customers || []);
      } catch (error) {
        console.error(
          "Fetch customers error:",
          error
        );

        setError(
          "Unable to connect to the server."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, []);

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

  // Search + Status Filter
  const filteredCustomers = customers.filter(
    (customer) => {
      const searchTerm = search
        .trim()
        .toLowerCase();

      const subscription =
        customer.subscriptions?.[0];

      const plan = subscription?.plan;

      if (
        statusFilter === "ACTIVE" &&
        subscription?.status !== "ACTIVE"
      ) {
        return false;
      }

      if (
        statusFilter === "NO_SUBSCRIPTION" &&
        subscription
      ) {
        return false;
      }

      if (!searchTerm) {
        return true;
      }

      return (
        customer.name
          ?.toLowerCase()
          .includes(searchTerm) ||
        customer.email
          ?.toLowerCase()
          .includes(searchTerm) ||
        plan?.name
          ?.toLowerCase()
          .includes(searchTerm)
      );
    }
  );

  return (
    <div className="admin-customers-page">
      <header className="admin-customers-header">
        <div>
          <p className="admin-customers-eyebrow">
            CUSTOMER MANAGEMENT
          </p>

          <h1>Customers</h1>

          <p className="admin-customers-description">
            View and manage customer accounts,
            subscriptions, and activity.
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
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />
        </div>

        <div className="admin-customers-filters">
          <button
            type="button"
            className={`admin-customers-filter ${
              statusFilter === "ALL"
                ? "active"
                : ""
            }`}
            onClick={() =>
              setStatusFilter("ALL")
            }
          >
            All
          </button>

          <button
            type="button"
            className={`admin-customers-filter ${
              statusFilter === "ACTIVE"
                ? "active"
                : ""
            }`}
            onClick={() =>
              setStatusFilter("ACTIVE")
            }
          >
            Active
          </button>

          <button
            type="button"
            className={`admin-customers-filter ${
              statusFilter === "NO_SUBSCRIPTION"
                ? "active"
                : ""
            }`}
            onClick={() =>
              setStatusFilter(
                "NO_SUBSCRIPTION"
              )
            }
          >
            No subscription
          </button>
        </div>

        <span className="admin-customers-result-count">
          {filteredCustomers.length}{" "}
          {filteredCustomers.length === 1
            ? "customer"
            : "customers"}
        </span>
      </div>

      {/* Content */}
      <section className="admin-customers-card">
        {loading && (
          <div className="admin-customers-message">
            Loading customers...
          </div>
        )}

        {error && (
          <div className="admin-customers-message admin-customers-error">
            {error}
          </div>
        )}

        {!loading &&
          !error &&
          filteredCustomers.length === 0 && (
            <div className="admin-customers-message">
              {search
                ? "No customers match your search."
                : "No customers found."}
            </div>
          )}

        {!loading &&
          !error &&
          filteredCustomers.length > 0 && (
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
                  {filteredCustomers.map(
                    (customer) => {
                      const subscription =
                        getSubscription(customer);

                      const plan =
                        subscription?.plan || null;

                      return (
                        <tr key={customer.id}>
                          <td>
                            <div className="admin-customer-name">
                              <div className="admin-customer-avatar">
                                {customer.name
                                  ?.charAt(0)
                                  .toUpperCase()}
                              </div>

                              <span>
                                {customer.name}
                              </span>
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
                                  subscription.status
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
                              {formatDate(
                                subscription?.renewalDate
                              )}
                            </span>
                          </td>

                          <td>
                            <button
                              type="button"
                              className="admin-customer-view-button"
                              onClick={() =>
                                navigate(
                                  `/admin/customers/${customer.id}`
                                )
                              }
                              aria-label={`View ${customer.name}`}
                            >
                              <Eye size={16} />
                              <span>View</span>
                            </button>
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            </div>
          )}
      </section>
    </div>
  );
}