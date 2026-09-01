import { Link, useOutletContext } from "react-router-dom";
import {
  Layers,
  Users,
  RefreshCw,
  CircleHelp,
  Bell,
  Plus,
  ArrowUpRight,
  ArrowRight,
  CalendarDays,
  CreditCard,
} from "lucide-react";

import "./dashboard.css";

const subscriptions = [
  {
    customer: "Acme Corporation",
    plan: "Enterprise",
    amount: "₹2,40,000",
    status: "Active",
    date: "Aug 24, 2026",
  },
  {
    customer: "Northstar Labs",
    plan: "Growth",
    amount: "₹89,000",
    status: "Active",
    date: "Aug 22, 2026",
  },
  {
    customer: "Ravex Studio",
    plan: "Starter",
    amount: "₹24,000",
    status: "Pending",
    date: "Aug 19, 2026",
  },
  {
    customer: "Orbit Finance",
    plan: "Enterprise",
    amount: "₹2,40,000",
    status: "Active",
    date: "Aug 16, 2026",
  },
];

const renewals = [
  {
    name: "Acme Corporation",
    plan: "Enterprise plan",
    date: "Sep 02, 2026",
    amount: "₹2,40,000",
  },
  {
    name: "Northstar Labs",
    plan: "Growth plan",
    date: "Sep 08, 2026",
    amount: "₹89,000",
  },
  {
    name: "Orbit Finance",
    plan: "Enterprise plan",
    date: "Sep 14, 2026",
    amount: "₹2,40,000",
  },
];

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
export default function AdminDashboard() {
  const { user } = useOutletContext();
  const greeting = getGreeting();
const currentDate = getFormattedDate();
  return (
    <>
      {/* Header */}
      {/* Header */}
<header className="dashboard-topbar">
  <div>
    <p className="eyebrow">
      {currentDate.toUpperCase()}
    </p>

    <h1>
      {greeting}, {user.name}.
    </h1>

    <p className="topbar-copy">
      Here's what's happening across your subscription business.
    </p>
  </div>

  <div className="topbar-actions">
    <button
      className="icon-button"
      aria-label="Notifications"
    >
      <Bell size={20} />
      <span className="notification-dot" />
    </button>

    <Link
      to="/admin/plans"
      className="primary-button"
    >
      <Plus size={17} />
      <span>Manage Plans</span>
    </Link>
  </div>
</header>

      {/* Statistics */}
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
              {subscriptions.map((row) => (
                <tr key={row.customer}>
                  <td>
                    <span className="customer-avatar">
                      {row.customer.slice(0, 2)}
                    </span>

                    <strong>{row.customer}</strong>
                  </td>

                  <td>{row.plan}</td>

                  <td className="amount">
                    {row.amount}
                    <small>/mo</small>
                  </td>

                  <td>
                    <span
                      className={`status ${row.status.toLowerCase()}`}
                    >
                      {row.status}
                    </span>
                  </td>

                  <td>{row.date}</td>

                  <td>
                    <Link
                      to="/admin/subscriptions"
                      className="row-action"
                      aria-label={`Open ${row.customer}`}
                    >
                      <ArrowRight size={15} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Lower Section */}
      <div className="lower-grid">
        {/* Renewals */}
        <section className="content-section renewals-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">NEXT UP</p>

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
            {renewals.map((item) => (
              <div
                className="renewal-row"
                key={item.name}
              >
                <div className="calendar-icon">
                  <CalendarDays size={17} />

                  <strong>
                    {item.date.slice(4, 6)}
                  </strong>

                  <small>
                    {item.date
                      .slice(0, 3)
                      .toUpperCase()}
                  </small>
                </div>

                <div className="renewal-info">
                  <strong>{item.name}</strong>

                  <span>
                    {item.plan} · {item.date}
                  </span>
                </div>

                <strong className="renewal-amount">
                  {item.amount}
                  <small>/mo</small>
                </strong>
              </div>
            ))}
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
                <strong>Create plan</strong>

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
                <strong>View subscriptions</strong>

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
                <strong>Get support</strong>

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