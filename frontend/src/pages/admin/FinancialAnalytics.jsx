import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import "./financialAnalytics.css";

const FinancialAnalytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch(
          "http://localhost:5000/admin/financial-analytics",
          {
            credentials: "include",
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Failed to fetch analytics"
          );
        }

        setAnalytics(data);
      } catch (error) {
        console.error("Financial analytics error:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  const formatCurrency = (value) => {
    return `₹${Number(value).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  /*
    Demo historical revenue.

    IMPORTANT:
    These values are ONLY used for the graph.
    They are not inserted into the database.
  */
  const demoHistoricalRevenue = [
    {
      month: "Apr 2026",
      revenue: 54000,
    },
    {
      month: "May 2026",
      revenue: 91000,
    },
    {
      month: "Jun 2026",
      revenue: 135000,
    },
    {
      month: "Jul 2026",
      revenue: 108000,
    },
    {
      month: "Aug 2026",
      revenue: 172000,
    },
  ];

  /*
    Get the current month.

    Example:
    September 2026 → "Sep 2026"
  */
  const currentMonthLabel = new Date().toLocaleDateString(
    "en-US",
    {
      month: "short",
      year: "numeric",
    }
  );

  /*
    Find the current month's REAL data
    returned by the backend.
  */
  const currentMonthRevenue =
    analytics?.monthlyRevenue?.find(
      (item) => item.month === currentMonthLabel
    );

  /*
    Final data used by the graph:

    Apr-Aug → frontend demo data
    Sep     → real backend data
  */
  const chartData = [
    ...demoHistoricalRevenue,
    ...(currentMonthRevenue
      ? [currentMonthRevenue]
      : []),
  ];

  if (loading) {
    return (
      <div className="financial-page-state">
        Loading financial analytics...
      </div>
    );
  }

  if (error) {
    return (
      <div className="financial-page-state error">
        {error}
      </div>
    );
  }

  return (
    <div className="financial-analytics-page">
      {/* Page Header */}
      <div className="financial-header">
        <div>
          <p className="financial-eyebrow">
            FINANCIAL ANALYTICS
          </p>

          <h1>Business Performance</h1>

          <p className="financial-header-description">
            Understand your revenue, payments and
            subscription performance.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <section className="financial-kpi-grid">
        <div className="financial-kpi-card">
          <span className="financial-kpi-label">
            Total Revenue
          </span>

          <strong>
            {formatCurrency(
              analytics.summary.totalRevenue
            )}
          </strong>

          <span className="financial-kpi-note">
            From successful payments
          </span>
        </div>

        <div className="financial-kpi-card">
          <span className="financial-kpi-label">
            Successful Payments
          </span>

          <strong>
            {analytics.summary.successfulPayments}
          </strong>

          <span className="financial-kpi-note">
            Paid transactions
          </span>
        </div>

        <div className="financial-kpi-card">
          <span className="financial-kpi-label">
            Active Subscriptions
          </span>

          <strong>
            {analytics.summary.activeSubscriptions}
          </strong>

          <span className="financial-kpi-note">
            Currently active
          </span>
        </div>

        <div className="financial-kpi-card">
          <span className="financial-kpi-label">
            Average Payment
          </span>

          <strong>
            {formatCurrency(
              analytics.summary.averagePayment
            )}
          </strong>

          <span className="financial-kpi-note">
            Per successful payment
          </span>
        </div>
      </section>

      {/* Revenue Overview */}
      <section className="financial-panel revenue-panel">
        <div className="financial-panel-header">
          <div>
            <p className="financial-panel-eyebrow">
              REVENUE OVERVIEW
            </p>

            <h2>Revenue over time</h2>
          </div>

          <div className="financial-panel-total">
            {formatCurrency(
              analytics.summary.totalRevenue
            )}
          </div>
        </div>

        <div className="revenue-chart">
          {chartData.length > 0 ? (
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <LineChart
                data={chartData}
                margin={{
                  top: 10,
                  right: 20,
                  left: 10,
                  bottom: 10,
                }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                />

                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                />

                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) =>
                    `₹${value}`
                  }
                />

                <Tooltip
                  formatter={(value) => [
                    formatCurrency(value),
                    "Revenue",
                  ]}
                />

                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#2563eb"
                  strokeWidth={3}
                  dot={{
                    r: 4,
                  }}
                  activeDot={{
                    r: 6,
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="financial-empty">
              No revenue data available yet.
            </div>
          )}
        </div>
      </section>

      {/* Lower Analytics */}
      <section className="financial-lower-grid">
        {/* Payment Performance */}
        <div className="financial-panel">
          <div className="financial-panel-header">
            <div>
              <p className="financial-panel-eyebrow">
                PAYMENTS
              </p>

              <h2>Payment performance</h2>
            </div>
          </div>

          <div className="payment-status-list">
            <div className="payment-status-row">
              <span>
                <span className="status-dot paid" />
                Paid
              </span>

              <strong>
                {analytics.paymentPerformance.paid}
              </strong>
            </div>

            <div className="payment-status-row">
              <span>
                <span className="status-dot pending" />
                Pending
              </span>

              <strong>
                {analytics.paymentPerformance.pending}
              </strong>
            </div>

            <div className="payment-status-row">
              <span>
                <span className="status-dot failed" />
                Failed
              </span>

              <strong>
                {analytics.paymentPerformance.failed}
              </strong>
            </div>
          </div>
        </div>

        {/* Subscription Breakdown */}
        <div className="financial-panel">
          <div className="financial-panel-header">
            <div>
              <p className="financial-panel-eyebrow">
                SUBSCRIPTIONS
              </p>

              <h2>Billing period</h2>
            </div>
          </div>

          <div className="subscription-breakdown">
            <div className="subscription-item">
              <span className="subscription-icon monthly">
                M
              </span>

              <div>
                <strong>Monthly</strong>
                <span>
                  {analytics.subscriptionBreakdown.monthly}{" "}
                  subscriptions
                </span>
              </div>
            </div>

            <div className="subscription-item">
              <span className="subscription-icon yearly">
                Y
              </span>

              <div>
                <strong>Yearly</strong>
                <span>
                  {analytics.subscriptionBreakdown.yearly}{" "}
                  subscriptions
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Revenue By Plan */}
      <section className="financial-panel">
        <div className="financial-panel-header">
          <div>
            <p className="financial-panel-eyebrow">
              PLAN PERFORMANCE
            </p>

            <h2>Revenue by plan</h2>
          </div>
        </div>

        {analytics.revenueByPlan.length > 0 ? (
          <div className="plan-revenue-list">
            {analytics.revenueByPlan.map((plan) => (
              <div
                className="plan-revenue-row"
                key={plan.planId}
              >
                <div className="plan-revenue-info">
                  <strong>{plan.planName}</strong>

                  <span>
                    {plan.payments} successful payment
                    {plan.payments !== 1 ? "s" : ""}
                  </span>
                </div>

                <strong className="plan-revenue-value">
                  {formatCurrency(plan.revenue)}
                </strong>
              </div>
            ))}
          </div>
        ) : (
          <div className="financial-empty">
            No plan revenue data available yet.
          </div>
        )}
      </section>
    </div>
  );
};

export default FinancialAnalytics;