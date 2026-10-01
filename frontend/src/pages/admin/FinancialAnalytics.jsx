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

import {
  ArrowLeft,
  Download,
  FileSpreadsheet,
  FileText,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import "./financialAnalytics.css";

import API_URL from "../../config";

const FinancialAnalytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [exportOpen, setExportOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  const navigate = useNavigate();

  // ==================================================
  // FETCH ANALYTICS
  // ==================================================

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_URL}/admin/financial-analytics`,
          {
            credentials: "include",
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Failed to fetch analytics"
          );
        }

        setAnalytics(data);
      } catch (error) {
        console.error(
          "Financial analytics error:",
          error
        );

        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  // ==================================================
  // CURRENCY
  // ==================================================

  const formatCurrency = (value) => {
    return `₹${Number(value).toLocaleString(
      "en-IN",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    )}`;
  };

  // ==================================================
  // DEMO HISTORICAL REVENUE
  // ==================================================

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

  // ==================================================
  // CHART DATA
  // ==================================================

  const chartData = [
    ...demoHistoricalRevenue.map(
      (demo) => {
        const realData =
          analytics?.monthlyRevenue?.find(
            (item) =>
              item.month ===
              demo.month
          );

        return realData || demo;
      }
    ),

    ...(analytics?.monthlyRevenue || []).filter(
      (real) =>
        !demoHistoricalRevenue.some(
          (demo) =>
            demo.month ===
            real.month
        )
    ),
  ];

  // ==================================================
  // EXPORT
  // ==================================================

  const handleExport = async (format) => {
    try {
      setExporting(true);
      setExportOpen(false);

      const endpoint =
        format === "pdf"
          ? `${API_URL}/admin/financial-analytics/export/pdf`
          : `${API_URL}/admin/financial-analytics/export`;

      const response = await fetch(
        endpoint,
        {
          method: "GET",
          credentials: "include",
        }
      );

      if (format === "pdf") {
        if (!response.ok) {
          const data =
            await response
              .json()
              .catch(() => null);

          throw new Error(
            data?.message ||
              "Unable to generate financial analytics PDF."
          );
        }

        const blob =
          await response.blob();

        const url =
          URL.createObjectURL(blob);

        const link =
          document.createElement(
            "a"
          );

        link.href = url;

        link.download =
          "financial-analytics-report.pdf";

        document.body.appendChild(
          link
        );

        link.click();

        document.body.removeChild(
          link
        );

        URL.revokeObjectURL(url);

        return;
      }

      // CSV

      if (!response.ok) {
        const data =
          await response
            .json()
            .catch(() => null);

        throw new Error(
          data?.message ||
            "Unable to export financial analytics."
        );
      }

      const blob =
        await response.blob();

      const url =
        URL.createObjectURL(blob);

      const link =
        document.createElement("a");

      link.href = url;

      link.download =
        "financial-analytics-report.csv";

      document.body.appendChild(
        link
      );

      link.click();

      document.body.removeChild(
        link
      );

      URL.revokeObjectURL(url);
    } catch (error) {
      console.error(
        "Financial analytics export error:",
        error
      );

      alert(
        error.message ||
          "Unable to export financial analytics."
      );
    } finally {
      setExporting(false);
    }
  };

  // ==================================================
  // LOADING
  // ==================================================

  if (loading) {
    return (
      <div className="financial-page-state">
        Loading financial analytics...
      </div>
    );
  }

  // ==================================================
  // ERROR
  // ==================================================

  if (error) {
    return (
      <div className="financial-page-state error">
        {error}
      </div>
    );
  }

  // ==================================================
  // PAGE
  // ==================================================

  return (
    <div className="financial-analytics-page">

  
      <div className="financial-header">

        <div>
          <p className="financial-eyebrow">
            FINANCIAL ANALYTICS
          </p>

          <h1>
            Business Performance
          </h1>

          <p className="financial-header-description">
            Understand your revenue, payments
            and subscription performance.
          </p>
        </div>

        <div className="financial-header-actions">

          {/* EXPORT */}

          <div className="financial-export">

            <button
              type="button"
              className="financial-export-button"
              onClick={() =>
                setExportOpen(
                  (previous) =>
                    !previous
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
              <div className="financial-export-menu">

                <button
                  type="button"
                  onClick={() =>
                    handleExport("csv")
                  }
                >
                  <FileSpreadsheet
                    size={15}
                  />

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
                  <FileText
                    size={15}
                  />

                  <span>
                    Export PDF
                  </span>
                </button>

              </div>
            )}

          </div>

          {/* BACK */}

          <button
            type="button"
            className="financial-back"
            onClick={() =>
              navigate("/admin")
            }
            aria-label="Back to Dashboard"
          >
            <ArrowLeft size={15} />

            <span>
              Back to Dashboard
            </span>
          </button>

        </div>

      </div>

      {/* ==================================================
          KPI CARDS
      ================================================== */}

      <section className="financial-kpi-grid">

        <div className="financial-kpi-card">

          <span className="financial-kpi-label">
            Total Revenue
          </span>

          <strong>
            {formatCurrency(
              analytics.summary
                .totalRevenue
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
            {
              analytics.summary
                .successfulPayments
            }
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
            {
              analytics.summary
                .activeSubscriptions
            }
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
              analytics.summary
                .averagePayment
            )}
          </strong>

          <span className="financial-kpi-note">
            Per successful payment
          </span>

        </div>

      </section>

      {/* ==================================================
          REVENUE OVERVIEW
      ================================================== */}

      <section className="financial-panel revenue-panel">

        <div className="financial-panel-header">

          <div>
            <p className="financial-panel-eyebrow">
              REVENUE OVERVIEW
            </p>

            <h2>
              Revenue over time
            </h2>
          </div>

          <div className="financial-panel-total">
            {formatCurrency(
              analytics.summary
                .totalRevenue
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
                  tickFormatter={(
                    value
                  ) =>
                    `₹${value}`
                  }
                />

                <Tooltip
                  formatter={(
                    value
                  ) => [
                    formatCurrency(
                      value
                    ),
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
              No revenue data available
              yet.
            </div>
          )}

        </div>

      </section>

      {/* ==================================================
          LOWER ANALYTICS
      ================================================== */}

      <section className="financial-lower-grid">

        {/* PAYMENT PERFORMANCE */}

        <div className="financial-panel">

          <div className="financial-panel-header">

            <div>
              <p className="financial-panel-eyebrow">
                PAYMENTS
              </p>

              <h2>
                Payment performance
              </h2>
            </div>

          </div>

          <div className="payment-status-list">

            <div className="payment-status-row">

              <span>
                <span className="status-dot paid" />

                Paid
              </span>

              <strong>
                {
                  analytics
                    .paymentPerformance
                    .paid
                }
              </strong>

            </div>

            <div className="payment-status-row">

              <span>
                <span className="status-dot pending" />

                Pending
              </span>

              <strong>
                {
                  analytics
                    .paymentPerformance
                    .pending
                }
              </strong>

            </div>

            <div className="payment-status-row">

              <span>
                <span className="status-dot failed" />

                Failed
              </span>

              <strong>
                {
                  analytics
                    .paymentPerformance
                    .failed
                }
              </strong>

            </div>

          </div>

        </div>

        {/* SUBSCRIPTION BREAKDOWN */}

        <div className="financial-panel">

          <div className="financial-panel-header">

            <div>
              <p className="financial-panel-eyebrow">
                SUBSCRIPTIONS
              </p>

              <h2>
                Billing period
              </h2>
            </div>

          </div>

          <div className="subscription-breakdown">

            <div className="subscription-item">

              <span className="subscription-icon monthly">
                M
              </span>

              <div>
                <strong>
                  Monthly
                </strong>

                <span>
                  {
                    analytics
                      .subscriptionBreakdown
                      .monthly
                  }{" "}
                  subscription
                  {analytics
                    .subscriptionBreakdown
                    .monthly !== 1
                    ? "s"
                    : ""}
                </span>
              </div>

            </div>

            <div className="subscription-item">

              <span className="subscription-icon yearly">
                Y
              </span>

              <div>
                <strong>
                  Yearly
                </strong>

                <span>
                  {
                    analytics
                      .subscriptionBreakdown
                      .yearly
                  }{" "}
                  subscription
                  {analytics
                    .subscriptionBreakdown
                    .yearly !== 1
                    ? "s"
                    : ""}
                </span>
              </div>

            </div>

          </div>

        </div>

      </section>

      {/* ==================================================
          REVENUE BY PLAN
      ================================================== */}

      <section className="financial-panel">

        <div className="financial-panel-header">

          <div>
            <p className="financial-panel-eyebrow">
              PLAN PERFORMANCE
            </p>

            <h2>
              Revenue by plan
            </h2>
          </div>

        </div>

        {analytics.revenueByPlan
          .length > 0 ? (
          <div className="plan-revenue-list">

            {analytics.revenueByPlan.map(
              (plan) => (
                <div
                  className="plan-revenue-row"
                  key={plan.planId}
                >

                  <div className="plan-revenue-info">

                    <strong>
                      {plan.planName}
                    </strong>

                    <span>
                      {plan.payments} successful
                      payment
                      {plan.payments !== 1
                        ? "s"
                        : ""}
                    </span>

                  </div>

                  <strong className="plan-revenue-value">
                    {formatCurrency(
                      plan.revenue
                    )}
                  </strong>

                </div>
              )
            )}

          </div>
        ) : (
          <div className="financial-empty">
            No plan revenue data
            available yet.
          </div>
        )}

      </section>

    </div>
  );
};

export default FinancialAnalytics;