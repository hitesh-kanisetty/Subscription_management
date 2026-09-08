import { useEffect, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import {
  Layers,
  Users,
  RefreshCw,
  CircleHelp,
  Plus,
  ArrowUpRight,
  ArrowRight,
  CalendarDays,
  CreditCard,
} from "lucide-react";

import "./dashboard.css";
import NotificationBell from "../../components/NotificationBell";

function StatIcon({ children }) {
  return <span className="stat-icon">{children}</span>;
}

function Trend({ children }) {
  return (
    <span className="trend">
      <ArrowUpRight size={14} />
      {children}
    </span>
  );
}

function getGreeting() {
  const hour = new Date().getHours();

  if (hour < 12) {
    return "Good morning";
  }

  if (hour < 18) {
    return "Good afternoon";
  }

  return "Good evening";
}

function getFormattedDate() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatDate(date) {
  if (!date) return "—";

  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatAmount(amount) {
  return `₹${Number(amount || 0).toLocaleString("en-IN")}`;
}

function getBillingLabel(billingPeriod) {
  if (billingPeriod === "YEARLY") {
    return "/yr";
  }

  return "/mo";
}

function getInitials(name) {
  if (!name) return "U";

  const words = name.trim().split(/\s+/);

  if (words.length >= 2) {
    return (
      words[0].charAt(0) +
      words[1].charAt(0)
    ).toUpperCase();
  }

  return name.slice(0, 2).toUpperCase();
}

export default function AdminDashboard() {
  const { user } = useOutletContext();

  const [recentSubscriptions, setRecentSubscriptions] =
    useState([]);

  const [upcomingRenewals, setUpcomingRenewals] =
    useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const greeting = getGreeting();
  const currentDate = getFormattedDate();

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          "http://localhost:5000/admin/dashboard",
          {
            method: "GET",
            credentials: "include",
          }
        );

        const data = await response.json();

        if (!response.ok) {
          setError(
            data.message ||
              "Unable to load dashboard data."
          );
          return;
        }

        setRecentSubscriptions(
          data.recentSubscriptions || []
        );

        setUpcomingRenewals(
          data.upcomingRenewals || []
        );
      } catch (error) {
        console.error(
          "Fetch admin dashboard error:",
          error
        );

        setError(
          "Unable to connect to the server."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  return (
    <>
      {/* Header */}
      <header className="dashboard-topbar">
        <div>
          <p className="eyebrow">
            {currentDate.toUpperCase()}
          </p>

          <h1>
            {greeting}, {user?.name}.
          </h1>

          <p className="topbar-copy">
            Here's what's happening across your
            subscription business.
          </p>
        </div>

        <div className="topbar-actions">
          <NotificationBell admin />

          <Link
            to="/admin/plans"
            className="primary-button"
          >
            <Plus size={17} />
            <span>Manage Plans</span>
          </Link>
        </div>
      </header>

      {/* Dashboard Error */}
      {error && (
        <div
          style={{
            marginBottom: "20px",
            padding: "12px 14px",
            border: "1px solid #f0d1d1",
            borderRadius: "7px",
            background: "#fff5f5",
            color: "#b44444",
            fontSize: "13px",
          }}
        >
          {error}
        </div>
      )}

      {/* Statistics */}
      {/* Keep these boxes for future dynamic logic */}
      <section
        className="summary-grid"
        aria-label="Business summary"
      >
        <article className="summary-card">
          <div className="card-top">
            <span>Active subscriptions</span>

            <StatIcon>
              <Layers size={17} />
            </StatIcon>
          </div>

          <strong>1,284</strong>

          <Trend>12.8% this month</Trend>
        </article>

        <article className="summary-card">
          <div className="card-top">
            <span>Monthly recurring revenue</span>

            <StatIcon>
              <CreditCard size={17} />
            </StatIcon>
          </div>

          <strong>₹84,620</strong>

          <Trend>8.4% this month</Trend>
        </article>

        <article className="summary-card">
          <div className="card-top">
            <span>Total customers</span>

            <StatIcon>
              <Users size={17} />
            </StatIcon>
          </div>

          <strong>936</strong>

          <Trend>6.2% this month</Trend>
        </article>

        <article className="summary-card">
          <div className="card-top">
            <span>Renewals this month</span>

            <StatIcon>
              <RefreshCw size={17} />
            </StatIcon>
          </div>

          <strong>86</strong>

          <span className="neutral-trend">
            14 due this week
          </span>
        </article>
      </section>

      {/* Recent Subscriptions */}
      <section className="content-section subscriptions-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">
              SUBSCRIPTION ACTIVITY
            </p>

            <h2>Recent subscriptions</h2>
          </div>

          <Link
            to="/admin/plans"
            className="text-link"
          >
            View all subscriptions
            <ArrowRight size={16} />
          </Link>
        </div>

        <div className="table-wrap">
          {loading ? (
            <div
              style={{
                padding: "35px 20px",
                textAlign: "center",
                color: "var(--muted)",
                fontSize: "13px",
              }}
            >
              Loading subscriptions...
            </div>
          ) : recentSubscriptions.length === 0 ? (
            <div
              style={{
                padding: "35px 20px",
                textAlign: "center",
                color: "var(--muted)",
                fontSize: "13px",
              }}
            >
              No subscriptions found.
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Plan</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Started</th>
                  <th aria-label="Action" />
                </tr>
              </thead>

              <tbody>
                {recentSubscriptions.map(
                  (subscription) => (
                    <tr
                      key={subscription.id}
                    >
                      <td>
                        <span className="customer-avatar">
                          {getInitials(
                            subscription.customer
                              ?.name
                          )}
                        </span>

                        <strong>
                          {
                            subscription.customer
                              ?.name
                          }
                        </strong>
                      </td>

                      <td>
                        {subscription.plan?.name}
                      </td>

                      <td className="amount">
                        {formatAmount(
                          subscription.plan?.price
                        )}

                        <small>
                          {getBillingLabel(
                            subscription.plan
                              ?.billingPeriod
                          )}
                        </small>
                      </td>

                      <td>
                        <span
                          className={`status ${String(
                            subscription.status || ""
                          ).toLowerCase()}`}
                        >
                          {subscription.status}
                        </span>
                      </td>

                      <td>
                        {formatDate(
                          subscription.startDate
                        )}
                      </td>

                      <td>
                        <Link
                          to="/admin/customers"
                          className="row-action"
                          aria-label={`Open ${subscription.customer?.name}`}
                        >
                          <ArrowRight size={15} />
                        </Link>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* Lower Section */}
      <div className="lower-grid">
        {/* Renewals */}
        <section className="content-section renewals-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">
                NEXT UP
              </p>

              <h2>Upcoming renewals</h2>
            </div>

            <Link
              to="/admin/renewals"
              className="text-link"
            >
              View all
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="renewal-list">
            {loading ? (
              <div
                style={{
                  padding: "25px 10px",
                  textAlign: "center",
                  color: "var(--muted)",
                  fontSize: "13px",
                }}
              >
                Loading renewals...
              </div>
            ) : upcomingRenewals.length === 0 ? (
              <div
                style={{
                  padding: "25px 10px",
                  textAlign: "center",
                  color: "var(--muted)",
                  fontSize: "13px",
                }}
              >
                No upcoming renewals.
              </div>
            ) : (
              upcomingRenewals.map(
                (subscription) => (
                  <div
                    className="renewal-row"
                    key={subscription.id}
                  >
                    <div className="calendar-icon">
                      <CalendarDays size={17} />

                      <strong>
                        {new Date(
                          subscription.renewalDate
                        ).getDate()}
                      </strong>

                      <small>
                        {new Date(
                          subscription.renewalDate
                        )
                          .toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                            }
                          )
                          .toUpperCase()}
                      </small>
                    </div>

                    <div className="renewal-info">
                      <strong>
                        {
                          subscription.customer
                            ?.name
                        }
                      </strong>

                      <span>
                        {subscription.plan?.name}{" "}
                        ·{" "}
                        {formatDate(
                          subscription.renewalDate
                        )}
                      </span>
                    </div>

                    <strong className="renewal-amount">
                      {formatAmount(
                        subscription.plan?.price
                      )}

                      <small>
                        {getBillingLabel(
                          subscription.plan
                            ?.billingPeriod
                        )}
                      </small>
                    </strong>
                  </div>
                )
              )
            )}
          </div>
        </section>

        {/* Quick Actions */}
        <section className="content-section quick-actions-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">
                WORK FASTER
              </p>

              <h2>Quick actions</h2>
            </div>
          </div>

          <div className="quick-action-list">
            <Link
              to="/admin/plans"
              className="quick-action"
            >
              <span className="quick-action-icon">
                <Plus size={18} />
              </span>

              <span className="quick-action-content">
                <strong>
                  Create plan
                </strong>

                <small>
                  Create a new subscription plan
                </small>
              </span>

              <ArrowRight size={16} />
            </Link>

            <Link
              to="/admin/subscriptions"
              className="quick-action"
            >
              <span className="quick-action-icon">
                <Layers size={18} />
              </span>

              <span className="quick-action-content">
                <strong>
                  View subscriptions
                </strong>

                <small>
                  Review customer subscriptions
                </small>
              </span>

              <ArrowRight size={16} />
            </Link>

            <Link
              to="/admin/support"
              className="quick-action"
            >
              <span className="quick-action-icon">
                <CircleHelp size={18} />
              </span>

              <span className="quick-action-content">
                <strong>
                  Get support
                </strong>

                <small>
                  View support requests
                </small>
              </span>

              <ArrowRight size={16} />
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}