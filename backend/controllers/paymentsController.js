const { PrismaClient } = require("../generated/prisma");
const PDFDocument = require("pdfkit");
const path = require("path");
const fs = require("fs");

const prisma = new PrismaClient();

const logoPath = path.join(__dirname, "../assets/subflow-logo.png");

const getAdminBilling = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({
        message: "Not authenticated",
      });
    }

    if (req.session.user.role !== "ADMIN") {
      return res.status(403).json({
        message: "Admin access required",
      });
    }

    const page = Math.max(
      Number.parseInt(req.query.page, 10) || 1,
      1
    );

    const limit = Math.min(
      Math.max(
        Number.parseInt(req.query.limit, 10) || 5,
        1
      ),
      100
    );

    const skip = (page - 1) * limit;

    const search = req.query.search?.trim() || "";

    const paymentWhere = {};

    if (search) {
      paymentWhere.OR = [
        {
          transactionId: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          paymentMethod: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          subscription: {
            user: {
              name: {
                contains: search,
                mode: "insensitive",
              },
            },
          },
        },
        {
          subscription: {
            user: {
              email: {
                contains: search,
                mode: "insensitive",
              },
            },
          },
        },
        {
          subscription: {
            plan: {
              name: {
                contains: search,
                mode: "insensitive",
              },
            },
          },
        },
      ];
    }

    /*
     * Get all payments for summary calculations
     */
    const allPayments = await prisma.payment.findMany({
      where: paymentWhere,
      select: {
        amount: true,
        status: true,
      },
    });

    /*
     * Get total number of filtered payments
     */
    const totalPayments = await prisma.payment.count({
      where: paymentWhere,
    });

    /*
     * Get payments for current page
     */
    const payments = await prisma.payment.findMany({
      where: paymentWhere,
      orderBy: {
        paymentDate: "desc",
      },
      skip,
      take: limit,
      include: {
        subscription: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            plan: {
              select: {
                id: true,
                name: true,
                price: true,
                billingPeriod: true,
              },
            },
          },
        },
      },
    });

    const totalCollected = allPayments
      .filter((payment) => payment.status === "PAID")
      .reduce(
        (total, payment) =>
          total + Number(payment.amount),
        0
      );

    const successfulPayments = allPayments.filter(
      (payment) => payment.status === "PAID"
    ).length;

    const pendingPayments = allPayments.filter(
      (payment) => payment.status === "PENDING"
    ).length;

    const failedPayments = allPayments.filter(
      (payment) => payment.status === "FAILED"
    ).length;

    const totalPages = Math.ceil(
      totalPayments / limit
    );

    return res.status(200).json({
      message: "Admin billing data fetched successfully",

      summary: {
        totalCollected: Number(
          totalCollected.toFixed(2)
        ),
        successfulPayments,
        pendingPayments,
        failedPayments,
      },

      payments: payments.map((payment) => ({
        id: payment.id,
        amount: Number(payment.amount),
        status: payment.status,
        paymentMethod: payment.paymentMethod,
        transactionId: payment.transactionId,
        paymentDate: payment.paymentDate,

        customer: {
          id: payment.subscription.user.id,
          name: payment.subscription.user.name,
          email: payment.subscription.user.email,
        },

        plan: {
          id: payment.subscription.plan.id,
          name: payment.subscription.plan.name,
          price: Number(
            payment.subscription.plan.price
          ),
          billingPeriod:
            payment.subscription.plan.billingPeriod,
        },

        subscriptionId: payment.subscriptionId,
      })),

      pagination: {
        currentPage: page,
        totalPages,
        totalPayments,
        limit,
      },
    });
  } catch (error) {
    console.error("Get admin billing error:", error);

    return res.status(500).json({
      message: "Something went wrong. Please try again.",
    });
  }
};
const getAdminFinancialAnalytics = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({
        message: "Not authenticated",
      });
    }

    if (req.session.user.role !== "ADMIN") {
      return res.status(403).json({
        message: "Admin access required",
      });
    }
    // both controls the data need to be returned
    // --> select is only for to select particular fields of the table
    // --> but include is like to get data of its relations too and all fields of parent table

    const payments = await prisma.payment.findMany({
      include: {
        subscription: {
          include: {
            plan: {
              select: {
                id: true,
                name: true,
                billingPeriod: true,
              },
            },
          },
        },
      },
      orderBy: {
        paymentDate: "asc",
      },
    });

    const subscriptions =
      await prisma.subscription.findMany({
        select: {
          id: true,
          status: true,
          plan: {
            select: {
              id: true,
              name: true,
              billingPeriod: true,
            },
          },
        },
      });

    const paidPayments = payments.filter(
      (payment) => payment.status === "PAID"
    );

    const totalRevenue = paidPayments.reduce(
      (total, payment) =>
        total + Number(payment.amount),
      0
    );

    const successfulPayments = paidPayments.length;

    const activeSubscriptions =
      subscriptions.filter(
        (subscription) =>
          subscription.status === "ACTIVE"
      ).length;

    const averagePayment =
      successfulPayments > 0
        ? totalRevenue / successfulPayments
        : 0;

   //  each mon
    const monthlyRevenue = {};

    paidPayments.forEach((payment) => {
      const date = new Date(payment.paymentDate);

      const monthKey = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;// month as 02 not 2 for feb

      const monthLabel = date.toLocaleDateString(
        "en-US",
        {
          month: "short",
          year: "numeric",
        }
      );

      if (!monthlyRevenue[monthKey]) {
        monthlyRevenue[monthKey] = {
          month: monthLabel,
          revenue: 0,
        };
      }

      monthlyRevenue[monthKey].revenue +=
        Number(payment.amount);
    });

    /*
     * Subscription billing breakdown
     */
    const subscriptionBreakdown = {
      MONTHLY: subscriptions.filter(
        (subscription) =>
          subscription.plan.billingPeriod ===
          "MONTHLY"
      ).length,

      YEARLY: subscriptions.filter(
        (subscription) =>
          subscription.plan.billingPeriod ===
          "YEARLY"
      ).length,
    };

    /*
     * Revenue by plan
     */
    const revenueByPlan = {};

    paidPayments.forEach((payment) => {
      const plan = payment.subscription.plan;

      if (!revenueByPlan[plan.id]) {
        revenueByPlan[plan.id] = {
          planId: plan.id,
          planName: plan.name,
          revenue: 0,
          payments: 0,
        };
      }

      revenueByPlan[plan.id].revenue +=
        Number(payment.amount);

      revenueByPlan[plan.id].payments += 1;
    });

    return res.status(200).json({
      message:
        "Financial analytics data fetched successfully",

      summary: {
        totalRevenue: Number(
          totalRevenue.toFixed(2)
        ),
        successfulPayments,
        activeSubscriptions,
        averagePayment: Number(
          averagePayment.toFixed(2)
        ),
      },

      monthlyRevenue: Object.values(
        monthlyRevenue
      ).map((item) => ({
        month: item.month,
        revenue: Number(
          item.revenue.toFixed(2)
        ),
      })),

      paymentPerformance: {
        paid: payments.filter(
          (payment) =>
            payment.status === "PAID"
        ).length,

        pending: payments.filter(
          (payment) =>
            payment.status === "PENDING"
        ).length,

        failed: payments.filter(
          (payment) =>
            payment.status === "FAILED"
        ).length,
      },

      subscriptionBreakdown: {
        monthly:
          subscriptionBreakdown.MONTHLY,

        yearly:
          subscriptionBreakdown.YEARLY,
      },

      revenueByPlan: Object.values(
        revenueByPlan
      ).map((item) => ({
        planId: item.planId,
        planName: item.planName,
        revenue: Number(
          item.revenue.toFixed(2)
        ),
        payments: item.payments,
      })),
    });
  } catch (error) {
    console.error(
      "Get admin financial analytics error:",
      error
    );

    return res.status(500).json({
      message:
        "Something went wrong. Please try again.",
    });
  }
};
const getMyPayments = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({
        message: "Not authenticated",
      });
    }

    const page = Math.max(
      Number.parseInt(req.query.page, 10) || 1,
      1
    );

    const limit = Math.min(
      Math.max(
        Number.parseInt(req.query.limit, 10) || 5,
        1
      ),
      100
    );

    const skip = (page - 1) * limit;

    const paymentWhere = {
      subscription: {
        userId: req.session.user.id,
      },
    };

    /*
     * Get all customer payments for summary
     */
    const allPayments = await prisma.payment.findMany({
      where: paymentWhere,
      orderBy: {
        paymentDate: "desc",
      },
      select: {
        amount: true,
        status: true,
        paymentDate: true,
      },
    });

    /*
     * Get total number of customer payments
     */
    const totalPayments = allPayments.length;

    /*
     * Get payments for current page
     */
    const payments = await prisma.payment.findMany({
      where: paymentWhere,
      orderBy: {
        paymentDate: "desc",
      },
      skip,
      take: limit,
      include: {
        subscription: {
          include: {
            plan: {
              select: {
                id: true,
                name: true,
                price: true,
                billingPeriod: true,
              },
            },
          },
        },
      },
    });

    /*
     * Calculate summary from all payments
     */
    const successfulPayments = allPayments.filter(
      (payment) => payment.status === "PAID"
    );

    const totalPaid = successfulPayments.reduce(
      (total, payment) =>
        total + Number(payment.amount),
      0
    );

    const latestPayment =
      allPayments[0]?.paymentDate || null;

    const formattedPayments = payments.map(
      (payment) => ({
        id: payment.id,
        amount: payment.amount,
        status: payment.status,
        paymentMethod: payment.paymentMethod,
        transactionId: payment.transactionId,
        paymentDate: payment.paymentDate,
        subscriptionId: payment.subscriptionId,
        plan: payment.subscription.plan,
      })
    );

    const totalPages = Math.ceil(
      totalPayments / limit
    );

    return res.json({
      payments: formattedPayments,

      summary: {
        totalPaid: Number(
          totalPaid.toFixed(2)
        ),
        successfulPayments:
          successfulPayments.length,
        latestPayment,
      },

      pagination: {
        currentPage: page,
        totalPages,
        totalPayments,
        limit,
      },
    });
  } catch (error) {
    console.error(
      "Get my payments error:",
      error
    );

    return res.status(500).json({
      message: "Failed to fetch payment history",
    });
  }
};
const exportAdminBilling = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({
        message: "Not authenticated",
      });
    }

    if (req.session.user.role !== "ADMIN") {
      return res.status(403).json({
        message: "Admin access required",
      });
    }

    const search = req.query.search?.trim() || "";

    const paymentWhere = {};

    if (search) {
      paymentWhere.OR = [
        {
          transactionId: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          paymentMethod: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          subscription: {
            user: {
              name: {
                contains: search,
                mode: "insensitive",
              },
            },
          },
        },
        {
          subscription: {
            user: {
              email: {
                contains: search,
                mode: "insensitive",
              },
            },
          },
        },
        {
          subscription: {
            plan: {
              name: {
                contains: search,
                mode: "insensitive",
              },
            },
          },
        },
      ];
    }

    const payments = await prisma.payment.findMany({
      where: paymentWhere,
      orderBy: {
        paymentDate: "desc",
      },
      include: {
        subscription: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            plan: {
              select: {
                id: true,
                name: true,
                price: true,
                billingPeriod: true,
              },
            },
          },
        },
      },
    });

    if (payments.length === 0) {
      return res.status(404).json({
        message: "No billing records available to export.",
      });
    }

    const exportPayments = payments.map((payment) => ({
      ID: payment.id,
      Customer: payment.subscription.user.name,
      Email: payment.subscription.user.email,
      Plan: payment.subscription.plan.name,
      Amount: `INR ${Number(payment.amount).toLocaleString("en-IN")}`,
      Status: payment.status,
      "Payment Method": payment.paymentMethod,
      "Transaction ID": payment.transactionId,
      "Payment Date": payment.paymentDate
        ? new Date(payment.paymentDate).toLocaleDateString("en-IN")
        : "",
    }));

    return res.status(200).json({
      payments: exportPayments,
    });
  } catch (error) {
    console.error("Export admin billing error:", error);

    return res.status(500).json({
      message: "Unable to export billing records.",
    });
  }
};
const exportAdminBillingPdf = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({
        message: "Not authenticated",
      });
    }

    if (req.session.user.role !== "ADMIN") {
      return res.status(403).json({
        message: "Admin access required",
      });
    }

    const search = req.query.search?.trim() || "";

    const paymentWhere = {};

    if (search) {
      paymentWhere.OR = [
        {
          transactionId: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          paymentMethod: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          subscription: {
            user: {
              name: {
                contains: search,
                mode: "insensitive",
              },
            },
          },
        },
        {
          subscription: {
            user: {
              email: {
                contains: search,
                mode: "insensitive",
              },
            },
          },
        },
        {
          subscription: {
            plan: {
              name: {
                contains: search,
                mode: "insensitive",
              },
            },
          },
        },
      ];
    }

    const payments = await prisma.payment.findMany({
      where: paymentWhere,
      orderBy: {
        paymentDate: "desc",
      },
      include: {
        subscription: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            plan: {
              select: {
                id: true,
                name: true,
                price: true,
                billingPeriod: true,
              },
            },
          },
        },
      },
    });

    if (payments.length === 0) {
      return res.status(404).json({
        message: "No billing records available to export.",
      });
    }

    const doc = new PDFDocument({
      size: "A4",
      layout: "landscape",
      margins: {
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
      },
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="billing-report.pdf"',
    );

    doc.pipe(res);

    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;

    const blue = "#2563eb";
    const darkText = "#111827";
    const mutedText = "#6b7280";
    const borderColor = "#dbe3f0";
    const lightBlue = "#eff6ff";
    const alternateRow = "#f8fafc";

    // --------------------------------------------------
    // HEADER
    // --------------------------------------------------

    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, 50, 30, {
        width: 60,
        height: 60,
      });
    }

    doc
      .fillColor(darkText)
      .fontSize(21)
      .font("Helvetica-Bold")
      .text("SubFlow", 125, 31);

    doc
      .fillColor(mutedText)
      .fontSize(9)
      .font("Helvetica")
      .text("Subscription Management Platform", 126, 59);

    doc
      .fillColor(blue)
      .fontSize(20)
      .font("Helvetica-Bold")
      .text("BILLING REPORT", 560, 35, {
        width: 232,
        align: "right",
      });

    doc
      .fillColor(mutedText)
      .fontSize(8)
      .font("Helvetica")
      .text(
        `Generated: ${new Date().toLocaleString("en-IN")}`,
        560,
        62,
        {
          width: 232,
          align: "right",
        },
      );

    doc
      .strokeColor(borderColor)
      .lineWidth(1)
      .moveTo(50, 100)
      .lineTo(pageWidth - 50, 100)
      .stroke();

    // --------------------------------------------------
    // FILTERS
    // --------------------------------------------------

    doc
      .fillColor(darkText)
      .fontSize(10)
      .font("Helvetica-Bold")
      .text("REPORT FILTERS", 50, 124);

    doc
      .fillColor(mutedText)
      .fontSize(8)
      .font("Helvetica")
      .text(
        search
          ? `Search: ${search}`
          : "Search: All billing records",
        50,
        141,
      );

    // --------------------------------------------------
    // TABLE
    // --------------------------------------------------

    const tableX = 50;
    let currentY = 166;
const columns = [
  { label: "ID", width: 40 },
  { label: "CUSTOMER", width: 125 },
  { label: "PLAN", width: 90 },
  { label: "AMOUNT", width: 75 },
  { label: "STATUS", width: 70 },
  { label: "METHOD", width: 80 },
  { label: "TRANSACTION ID", width: 180 },
  { label: "PAYMENT DATE", width: 82 },
];

    const tableWidth = columns.reduce(
      (total, column) => total + column.width,
      0,
    );

    const headerHeight = 28;
    const rowHeight = 30;

    const drawTableHeader = () => {
      let x = tableX;

      doc
        .fillColor(blue)
        .rect(tableX, currentY, tableWidth, headerHeight)
        .fill();

      columns.forEach((column) => {
        doc
          .fillColor("#ffffff")
          .fontSize(7.5)
          .font("Helvetica-Bold")
          .text(
            column.label,
            x + 5,
            currentY + 9,
            {
              width: column.width - 10,
              align: "left",
              ellipsis: true,
            },
          );

        x += column.width;
      });

      currentY += headerHeight;
    };

    const drawRow = (payment, index) => {
      const values = [
        String(payment.id),
        payment.subscription.user.name || "-",
        payment.subscription.plan.name || "-",
        `INR ${Number(payment.amount).toLocaleString("en-IN")}`,
        payment.status || "-",
        payment.paymentMethod || "-",
        payment.transactionId || "-",
        payment.paymentDate
          ? new Date(payment.paymentDate).toLocaleDateString(
              "en-IN",
            )
          : "-",
      ];

      if (index % 2 === 1) {
        doc
          .fillColor(alternateRow)
          .rect(tableX, currentY, tableWidth, rowHeight)
          .fill();
      }

      doc
        .strokeColor(borderColor)
        .lineWidth(0.5)
        .rect(tableX, currentY, tableWidth, rowHeight)
        .stroke();

      let x = tableX;

      values.forEach((value, valueIndex) => {
  const column = columns[valueIndex];
  const isTransactionId = valueIndex === 6;

  doc
    .fillColor(darkText)
    .fontSize(isTransactionId ? 7 : 7.5)
    .font("Helvetica")
    .text(
      String(value),
      x + 5,
      currentY + 10,
      {
        width: column.width - 10,
        height: 12,
        ellipsis: !isTransactionId,
        lineBreak: false,
      },
    );

  x += column.width;
});

      currentY += rowHeight;
    };

    drawTableHeader();

    payments.forEach((payment, index) => {
      if (currentY + rowHeight > pageHeight - 45) {
        drawFooter();

        doc.addPage();

        currentY = 45;

        drawTableHeader();
      }

      drawRow(payment, index);
    });

    // --------------------------------------------------
    // FOOTER
    // --------------------------------------------------

    function drawFooter() {
      const footerY = pageHeight - 30;

      doc
        .strokeColor(borderColor)
        .lineWidth(0.5)
        .moveTo(50, footerY - 8)
        .lineTo(pageWidth - 50, footerY - 8)
        .stroke();

      doc
        .fillColor(mutedText)
        .fontSize(8)
        .font("Helvetica")
        .text(
          `Total billing records: ${payments.length}`,
          50,
          footerY,
        );

      doc
        .fillColor(mutedText)
        .fontSize(8)
        .font("Helvetica")
        .text(
          "SubFlow Billing Management",
          0,
          footerY,
          {
            width: pageWidth - 50,
            align: "right",
          },
        );
    }

    drawFooter();

    doc.end();
  } catch (error) {
    console.error("Export admin billing PDF error:", error);

    if (!res.headersSent) {
      return res.status(500).json({
        message: "Unable to generate billing PDF.",
      });
    }
  }
};
// ==================================================
// EXPORT ADMIN FINANCIAL ANALYTICS - CSV
// ==================================================

const exportAdminFinancialAnalytics = async (req, res) => {
  try {
    // --------------------------------------------------
    // AUTHENTICATION
    // --------------------------------------------------

    if (!req.session.user) {
      return res.status(401).json({
        message: "Not authenticated",
      });
    }

    if (req.session.user.role !== "ADMIN") {
      return res.status(403).json({
        message: "Admin access required",
      });
    }

    // --------------------------------------------------
    // GET PAYMENT DATA
    // --------------------------------------------------

    const payments = await prisma.payment.findMany({
      include: {
        subscription: {
          include: {
            plan: {
              select: {
                id: true,
                name: true,
                billingPeriod: true,
              },
            },
          },
        },
      },

      orderBy: {
        paymentDate: "asc",
      },
    });

    // --------------------------------------------------
    // GET SUBSCRIPTION DATA
    // --------------------------------------------------

    const subscriptions =
      await prisma.subscription.findMany({
        select: {
          id: true,
          status: true,
          plan: {
            select: {
              id: true,
              name: true,
              billingPeriod: true,
            },
          },
        },
      });

    // --------------------------------------------------
    // PAID PAYMENTS
    // --------------------------------------------------

    const paidPayments = payments.filter(
      (payment) => payment.status === "PAID"
    );

    // --------------------------------------------------
    // SUMMARY
    // --------------------------------------------------

    const totalRevenue = paidPayments.reduce(
      (total, payment) =>
        total + Number(payment.amount),
      0
    );

    const successfulPayments =
      paidPayments.length;

    const activeSubscriptions =
      subscriptions.filter(
        (subscription) =>
          subscription.status === "ACTIVE"
      ).length;

    const averagePayment =
      successfulPayments > 0
        ? totalRevenue / successfulPayments
        : 0;

    // --------------------------------------------------
    // MONTHLY REVENUE
    // --------------------------------------------------

    const monthlyRevenue = {};

    paidPayments.forEach((payment) => {
      const date = new Date(
        payment.paymentDate
      );

      const monthKey = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;

      const monthLabel =
        date.toLocaleDateString(
          "en-US",
          {
            month: "short",
            year: "numeric",
          }
        );

      if (!monthlyRevenue[monthKey]) {
        monthlyRevenue[monthKey] = {
          month: monthLabel,
          revenue: 0,
        };
      }

      monthlyRevenue[monthKey].revenue +=
        Number(payment.amount);
    });

    const monthlyRevenueData =
      Object.values(monthlyRevenue).map(
        (item) => ({
          month: item.month,
          revenue: Number(
            item.revenue.toFixed(2)
          ),
        })
      );

    // --------------------------------------------------
    // PAYMENT PERFORMANCE
    // --------------------------------------------------

    const paymentPerformance = {
      paid: payments.filter(
        (payment) =>
          payment.status === "PAID"
      ).length,

      pending: payments.filter(
        (payment) =>
          payment.status === "PENDING"
      ).length,

      failed: payments.filter(
        (payment) =>
          payment.status === "FAILED"
      ).length,
    };

    // --------------------------------------------------
    // SUBSCRIPTION BREAKDOWN
    // --------------------------------------------------

    const subscriptionBreakdown = {
      monthly: subscriptions.filter(
        (subscription) =>
          subscription.plan.billingPeriod ===
          "MONTHLY"
      ).length,

      yearly: subscriptions.filter(
        (subscription) =>
          subscription.plan.billingPeriod ===
          "YEARLY"
      ).length,
    };

    // --------------------------------------------------
    // REVENUE BY PLAN
    // --------------------------------------------------

    const revenueByPlan = {};

    paidPayments.forEach((payment) => {
      const plan =
        payment.subscription.plan;

      if (!revenueByPlan[plan.id]) {
        revenueByPlan[plan.id] = {
          planId: plan.id,
          planName: plan.name,
          revenue: 0,
          payments: 0,
        };
      }

      revenueByPlan[plan.id].revenue +=
        Number(payment.amount);

      revenueByPlan[plan.id].payments += 1;
    });

    const revenueByPlanData =
      Object.values(revenueByPlan).map(
        (item) => ({
          planId: item.planId,
          planName: item.planName,
          revenue: Number(
            item.revenue.toFixed(2)
          ),
          payments: item.payments,
        })
      );

    // --------------------------------------------------
    // CSV DATA
    // --------------------------------------------------

    const csvRows = [];

    // SUMMARY SECTION

    csvRows.push(
      "FINANCIAL ANALYTICS REPORT"
    );

    csvRows.push("");

    csvRows.push(
      "Financial Overview"
    );

    csvRows.push(
      "Metric,Value"
    );

    csvRows.push(
      `Total Revenue,"INR ${totalRevenue.toLocaleString(
        "en-IN"
      )}"`
    );

    csvRows.push(
      `Successful Payments,${successfulPayments}`
    );

    csvRows.push(
      `Active Subscriptions,${activeSubscriptions}`
    );

    csvRows.push(
      `Average Payment,"INR ${averagePayment.toLocaleString(
        "en-IN",
        {
          maximumFractionDigits: 2,
        }
      )}"`
    );

    csvRows.push("");

    // MONTHLY REVENUE

    csvRows.push(
      "Monthly Revenue"
    );

    csvRows.push(
      "Month,Revenue"
    );

    monthlyRevenueData.forEach(
      (item) => {
        csvRows.push(
          `${item.month},"INR ${item.revenue.toLocaleString(
            "en-IN"
          )}"`
        );
      }
    );

    csvRows.push("");

    // PAYMENT PERFORMANCE

    csvRows.push(
      "Payment Performance"
    );

    csvRows.push(
      "Status,Payments"
    );

    csvRows.push(
      `Paid,${paymentPerformance.paid}`
    );

    csvRows.push(
      `Pending,${paymentPerformance.pending}`
    );

    csvRows.push(
      `Failed,${paymentPerformance.failed}`
    );

    csvRows.push("");

    // SUBSCRIPTION BREAKDOWN

    csvRows.push(
      "Subscription Billing Breakdown"
    );

    csvRows.push(
      "Billing Period,Subscriptions"
    );

    csvRows.push(
      `Monthly,${subscriptionBreakdown.monthly}`
    );

    csvRows.push(
      `Yearly,${subscriptionBreakdown.yearly}`
    );

    csvRows.push("");

    // REVENUE BY PLAN

    csvRows.push(
      "Revenue By Plan"
    );

    csvRows.push(
      "Plan,Revenue,Payments"
    );

    revenueByPlanData.forEach(
      (item) => {
        csvRows.push(
          `"${item.planName}","INR ${item.revenue.toLocaleString(
            "en-IN"
          )}",${item.payments}`
        );
      }
    );

    const csvContent =
      csvRows.join("\n");

    // --------------------------------------------------
    // RESPONSE
    // --------------------------------------------------

    res.setHeader(
      "Content-Type",
      "text/csv; charset=utf-8"
    );

    res.setHeader(
      "Content-Disposition",
      'attachment; filename="financial-analytics-report.csv"'
    );

    return res.status(200).send(
      csvContent
    );
  } catch (error) {
    console.error(
      "Export admin financial analytics error:",
      error
    );

    return res.status(500).json({
      message:
        "Unable to export financial analytics.",
    });
  }
};



const exportAdminFinancialAnalyticsPdf = async (req, res) => {
  try {
    // ==================================================
    // AUTHENTICATION
    // ==================================================

    if (!req.session.user) {
      return res.status(401).json({
        message: "Not authenticated",
      });
    }

    if (req.session.user.role !== "ADMIN") {
      return res.status(403).json({
        message: "Admin access required",
      });
    }

    // ==================================================
    // GET PAYMENT DATA
    // ==================================================

    const payments = await prisma.payment.findMany({
      include: {
        subscription: {
          include: {
            plan: {
              select: {
                id: true,
                name: true,
                billingPeriod: true,
              },
            },
          },
        },
      },
      orderBy: {
        paymentDate: "asc",
      },
    });

    // ==================================================
    // GET SUBSCRIPTION DATA
    // ==================================================

    const subscriptions =
      await prisma.subscription.findMany({
        select: {
          id: true,
          status: true,
          plan: {
            select: {
              id: true,
              name: true,
              billingPeriod: true,
            },
          },
        },
      });

    // ==================================================
    // PAID PAYMENTS
    // ==================================================

    const paidPayments = payments.filter(
      (payment) => payment.status === "PAID"
    );

    // ==================================================
    // FINANCIAL SUMMARY
    // ==================================================

    const totalRevenue = paidPayments.reduce(
      (total, payment) =>
        total + Number(payment.amount),
      0
    );

    const successfulPayments =
      paidPayments.length;

    const activeSubscriptions =
      subscriptions.filter(
        (subscription) =>
          subscription.status === "ACTIVE"
      ).length;

    const averagePayment =
      successfulPayments > 0
        ? totalRevenue / successfulPayments
        : 0;

    // ==================================================
    // PAYMENT PERFORMANCE
    // ==================================================

    const paymentPerformance = {
      paid: payments.filter(
        (payment) => payment.status === "PAID"
      ).length,

      pending: payments.filter(
        (payment) => payment.status === "PENDING"
      ).length,

      failed: payments.filter(
        (payment) => payment.status === "FAILED"
      ).length,
    };

    // ==================================================
    // SUBSCRIPTION BREAKDOWN
    // ==================================================

    const subscriptionBreakdown = {
      monthly: subscriptions.filter(
        (subscription) =>
          subscription.plan.billingPeriod ===
          "MONTHLY"
      ).length,

      yearly: subscriptions.filter(
        (subscription) =>
          subscription.plan.billingPeriod ===
          "YEARLY"
      ).length,
    };

    // ==================================================
    // REVENUE BY PLAN
    // ==================================================

    const revenueByPlan = {};

    paidPayments.forEach((payment) => {
      const plan = payment.subscription.plan;

      if (!plan) {
        return;
      }

      if (!revenueByPlan[plan.id]) {
        revenueByPlan[plan.id] = {
          planId: plan.id,
          planName: plan.name,
          revenue: 0,
          payments: 0,
        };
      }

      revenueByPlan[plan.id].revenue +=
        Number(payment.amount);

      revenueByPlan[plan.id].payments += 1;
    });

    const revenueByPlanData =
      Object.values(revenueByPlan).map(
        (item) => ({
          planId: item.planId,
          planName: item.planName,
          revenue: Number(
            item.revenue.toFixed(2)
          ),
          payments: item.payments,
        })
      );

    // ==================================================
    // REVENUE CONTRIBUTION
    // ==================================================

    const revenueByPlanWithPercentage =
      revenueByPlanData.map((item) => ({
        ...item,
        percentage:
          totalRevenue > 0
            ? (item.revenue / totalRevenue) * 100
            : 0,
      }));

    // ==================================================
    // PDF DOCUMENT
    // ==================================================

    const doc = new PDFDocument({
      size: "A4",
      layout: "landscape",
      margins: {
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
      },
    });

    res.setHeader(
      "Content-Type",
      "application/pdf"
    );

    res.setHeader(
      "Content-Disposition",
      'attachment; filename="financial-analytics-report.pdf"'
    );

    doc.pipe(res);

    // ==================================================
    // PAGE SETTINGS
    // ==================================================

    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;

    const blue = "#2563eb";
    const darkText = "#111827";
    const mutedText = "#6b7280";
    const borderColor = "#dbe3f0";
    const lightBlue = "#eff6ff";
    const alternateRow = "#f8fafc";

    const green = "#16a34a";
    const orange = "#d97706";
    const red = "#dc2626";

    const left = 50;
    const right = pageWidth - 50;
    const contentWidth = right - left;

    // ==================================================
    // COMMON HELPERS
    // ==================================================

    const drawSectionTitle = (title, y) => {
      doc
        .fillColor(darkText)
        .fontSize(11)
        .font("Helvetica-Bold")
        .text(title, left, y, {
          lineBreak: false,
        });

      doc
        .strokeColor(borderColor)
        .lineWidth(0.5)
        .moveTo(left, y + 17)
        .lineTo(right, y + 17)
        .stroke();
    };

    const drawTableHeader = (
      columns,
      y
    ) => {
      let x = left;

      columns.forEach((column) => {
        doc
          .fillColor(blue)
          .rect(
            x,
            y,
            column.width,
            28
          )
          .fill();

        doc
          .fillColor("#ffffff")
          .fontSize(7.5)
          .font("Helvetica-Bold")
          .text(
            column.label,
            x + 8,
            y + 9,
            {
              width:
                column.width - 16,
              height: 10,
              lineBreak: false,
            }
          );

        x += column.width;
      });
    };

    const formatINR = (value) => {
      return `INR ${Number(value).toLocaleString(
        "en-IN",
        {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }
      )}`;
    };

    // ==================================================
    // PAGE 1
    // ==================================================

    // --------------------------------------------------
    // HEADER
    // --------------------------------------------------

    if (fs.existsSync(logoPath)) {
      doc.image(
        logoPath,
        50,
        22,
        {
          width: 58,
          height: 58,
        }
      );
    }

    doc
      .fillColor(darkText)
      .font("Helvetica-Bold")
      .fontSize(21)
      .text(
        "SubFlow",
        122,
        24,
        {
          lineBreak: false,
        }
      );

    doc
      .fillColor(mutedText)
      .font("Helvetica")
      .fontSize(9)
      .text(
        "Subscription Management Platform",
        123,
        51,
        {
          lineBreak: false,
        }
      );

    // --------------------------------------------------
    // RIGHT SIDE REPORT TITLE
    // Deliberately separated to prevent overlap.
    // --------------------------------------------------

    doc
      .fillColor(blue)
      .font("Helvetica-Bold")
      .fontSize(13)
      .text(
        "FINANCIAL ANALYTICS",
        500,
        20,
        {
          width: 292,
          height: 16,
          align: "right",
          lineBreak: false,
        }
      );

    doc
      .fillColor(blue)
      .font("Helvetica-Bold")
      .fontSize(13)
      .text(
        "REPORT",
        500,
        39,
        {
          width: 292,
          height: 16,
          align: "right",
          lineBreak: false,
        }
      );

    doc
      .fillColor(mutedText)
      .font("Helvetica")
      .fontSize(8)
      .text(
        `Generated: ${new Date().toLocaleString(
          "en-IN"
        )}`,
        500,
        60,
        {
          width: 292,
          height: 11,
          align: "right",
          lineBreak: false,
        }
      );

    // --------------------------------------------------
    // HEADER DIVIDER
    // --------------------------------------------------

    doc
      .strokeColor(borderColor)
      .lineWidth(1)
      .moveTo(50, 88)
      .lineTo(
        pageWidth - 50,
        88
      )
      .stroke();

    // ==================================================
    // FINANCIAL OVERVIEW
    // ==================================================

    drawSectionTitle(
      "FINANCIAL OVERVIEW",
      108
    );

    const cardY = 136;
    const cardGap = 12;

    const cardWidth =
      (contentWidth -
        cardGap * 3) /
      4;

    const cardHeight = 72;

    const cards = [
      {
        title: "TOTAL REVENUE",
        value: formatINR(
          totalRevenue
        ),
      },
      {
        title: "SUCCESSFUL PAYMENTS",
        value: String(
          successfulPayments
        ),
      },
      {
        title: "ACTIVE SUBSCRIPTIONS",
        value: String(
          activeSubscriptions
        ),
      },
      {
        title: "AVERAGE PAYMENT",
        value: formatINR(
          averagePayment
        ),
      },
    ];

    cards.forEach(
      (card, index) => {
        const x =
          left +
          index *
            (cardWidth + cardGap);

        doc
          .fillColor(lightBlue)
          .roundedRect(
            x,
            cardY,
            cardWidth,
            cardHeight,
            7
          )
          .fill();

        doc
          .fillColor(mutedText)
          .fontSize(7.5)
          .font("Helvetica-Bold")
          .text(
            card.title,
            x + 12,
            cardY + 12,
            {
              width:
                cardWidth - 24,
              lineBreak: false,
            }
          );

        doc
          .fillColor(darkText)
          .fontSize(14)
          .font("Helvetica-Bold")
          .text(
            card.value,
            x + 12,
            cardY + 35,
            {
              width:
                cardWidth - 24,
              lineBreak: false,
            }
          );
      }
    );

    // ==================================================
    // PAYMENT PERFORMANCE
    // ==================================================

    drawSectionTitle(
      "PAYMENT PERFORMANCE",
      238
    );

    const perfY = 266;

    const perfWidth =
      (contentWidth - 24) / 3;

    const performanceCards = [
      {
        title: "PAID",
        value: paymentPerformance.paid,
        label: "Successful",
        background: "#f0fdf4",
        color: green,
      },
      {
        title: "PENDING",
        value: paymentPerformance.pending,
        label: "Awaiting payment",
        background: "#fff7ed",
        color: orange,
      },
      {
        title: "FAILED",
        value: paymentPerformance.failed,
        label: "Unsuccessful",
        background: "#fef2f2",
        color: red,
      },
    ];

    performanceCards.forEach(
      (item, index) => {
        const x =
          left +
          index *
            (perfWidth + 12);

        doc
          .fillColor(
            item.background
          )
          .roundedRect(
            x,
            perfY,
            perfWidth,
            64,
            7
          )
          .fill();

        doc
          .fillColor(item.color)
          .fontSize(8)
          .font("Helvetica-Bold")
          .text(
            item.title,
            x + 12,
            perfY + 10,
            {
              lineBreak: false,
            }
          );

        doc
          .fillColor(darkText)
          .fontSize(17)
          .font("Helvetica-Bold")
          .text(
            String(item.value),
            x + 12,
            perfY + 27,
            {
              lineBreak: false,
            }
          );

        doc
          .fillColor(mutedText)
          .fontSize(7)
          .font("Helvetica")
          .text(
            item.label,
            x + 55,
            perfY + 33,
            {
              lineBreak: false,
            }
          );
      }
    );

    // ==================================================
    // PAGE 1 FOOTER
    // ==================================================

    const footerY =
      pageHeight - 30;

    doc
      .strokeColor(borderColor)
      .lineWidth(0.5)
      .moveTo(
        50,
        footerY - 8
      )
      .lineTo(
        pageWidth - 50,
        footerY - 8
      )
      .stroke();

    doc
      .fillColor(mutedText)
      .fontSize(8)
      .font("Helvetica")
      .text(
        `Total Revenue: ${formatINR(
          totalRevenue
        )}`,
        50,
        footerY,
        {
          lineBreak: false,
        }
      );

    doc
      .fillColor(mutedText)
      .fontSize(8)
      .font("Helvetica")
      .text(
        "SubFlow Financial Analytics",
        0,
        footerY,
        {
          width:
            pageWidth - 50,
          align: "right",
          lineBreak: false,
        }
      );

    // ==================================================
    // PAGE 2
    // ==================================================

    doc.addPage();

    // ==================================================
    // PAGE 2 HEADER
    // ==================================================

    if (fs.existsSync(logoPath)) {
      doc.image(
        logoPath,
        50,
        20,
        {
          width: 48,
          height: 48,
        }
      );
    }

    doc
      .fillColor(darkText)
      .fontSize(17)
      .font("Helvetica-Bold")
      .text(
        "SubFlow",
        110,
        22,
        {
          lineBreak: false,
        }
      );

    doc
      .fillColor(mutedText)
      .fontSize(8)
      .font("Helvetica")
      .text(
        "Financial Analytics",
        111,
        44,
        {
          lineBreak: false,
        }
      );

    doc
      .fillColor(blue)
      .fontSize(15)
      .font("Helvetica-Bold")
      .text(
        "ANALYTICAL BREAKDOWN",
        500,
        29,
        {
          width: 292,
          align: "right",
          lineBreak: false,
        }
      );

    doc
      .strokeColor(borderColor)
      .lineWidth(1)
      .moveTo(50, 75)
      .lineTo(
        pageWidth - 50,
        75
      )
      .stroke();

    // ==================================================
    // SUBSCRIPTION BILLING BREAKDOWN
    // ==================================================

    drawSectionTitle(
      "SUBSCRIPTION BILLING BREAKDOWN",
      94
    );

    let subscriptionY = 120;

    const subscriptionColumns = [
      {
        label: "BILLING PERIOD",
        width: 350,
      },
      {
        label: "SUBSCRIPTIONS",
        width: 392,
      },
    ];

    drawTableHeader(
      subscriptionColumns,
      subscriptionY
    );

    subscriptionY += 28;

    const subscriptionRows = [
      [
        "Monthly",
        subscriptionBreakdown.monthly,
      ],
      [
        "Yearly",
        subscriptionBreakdown.yearly,
      ],
    ];

    subscriptionRows.forEach(
      (row, index) => {
        let x = left;

        if (index % 2 === 1) {
          doc
            .fillColor(alternateRow)
            .rect(
              left,
              subscriptionY,
              contentWidth,
              28
            )
            .fill();
        }

        row.forEach(
          (
            value,
            valueIndex
          ) => {
            const width =
              subscriptionColumns[
                valueIndex
              ].width;

            doc
              .strokeColor(
                borderColor
              )
              .lineWidth(0.5)
              .rect(
                x,
                subscriptionY,
                width,
                28
              )
              .stroke();

            doc
              .fillColor(darkText)
              .fontSize(8)
              .font("Helvetica")
              .text(
                String(value),
                x + 8,
                subscriptionY + 9,
                {
                  width:
                    width - 16,
                  lineBreak: false,
                }
              );

            x += width;
          }
        );

        subscriptionY += 28;
      }
    );

    // ==================================================
    // REVENUE BY PLAN
    // ==================================================

    drawSectionTitle(
      "REVENUE BY PLAN",
      210
    );

    let planY = 236;

    const planColumns = [
      {
        label: "PLAN",
        width: 300,
      },
      {
        label: "REVENUE",
        width: 250,
      },
      {
        label: "PAYMENTS",
        width: 192,
      },
    ];

    drawTableHeader(
      planColumns,
      planY
    );

    planY += 28;

    if (
      revenueByPlanData.length === 0
    ) {
      doc
        .strokeColor(borderColor)
        .lineWidth(0.5)
        .rect(
          left,
          planY,
          contentWidth,
          30
        )
        .stroke();

      doc
        .fillColor(mutedText)
        .fontSize(8)
        .font("Helvetica")
        .text(
          "No plan revenue data available.",
          left + 8,
          planY + 10,
          {
            lineBreak: false,
          }
        );

      planY += 30;
    } else {
      revenueByPlanData.forEach(
        (item, index) => {
          let x = left;

          if (index % 2 === 1) {
            doc
              .fillColor(alternateRow)
              .rect(
                left,
                planY,
                contentWidth,
                30
              )
              .fill();
          }

          const values = [
            item.planName || "-",
            formatINR(
              item.revenue
            ),
            item.payments,
          ];

          values.forEach(
            (
              value,
              valueIndex
            ) => {
              const column =
                planColumns[
                  valueIndex
                ];

              doc
                .strokeColor(
                  borderColor
                )
                .lineWidth(0.5)
                .rect(
                  x,
                  planY,
                  column.width,
                  30
                )
                .stroke();

              doc
                .fillColor(darkText)
                .fontSize(8)
                .font("Helvetica")
                .text(
                  String(value),
                  x + 8,
                  planY + 10,
                  {
                    width:
                      column.width - 16,
                    lineBreak: false,
                  }
                );

              x += column.width;
            }
          );

          planY += 30;
        }
      );
    }

    // ==================================================
    // REVENUE CONTRIBUTION
    // ==================================================

    drawSectionTitle(
      "REVENUE CONTRIBUTION",
      360
    );

    let contributionY = 386;

    const contributionColumns = [
      {
        label: "PLAN",
        width: 300,
      },
      {
        label: "REVENUE",
        width: 250,
      },
      {
        label: "CONTRIBUTION",
        width: 192,
      },
    ];

    drawTableHeader(
      contributionColumns,
      contributionY
    );

    contributionY += 28;

    revenueByPlanWithPercentage.forEach(
      (item, index) => {
        let x = left;

        if (index % 2 === 1) {
          doc
            .fillColor(alternateRow)
            .rect(
              left,
              contributionY,
              contentWidth,
              30
            )
            .fill();
        }

        const values = [
          item.planName || "-",
          formatINR(
            item.revenue
          ),
          `${item.percentage.toFixed(
            1
          )}%`,
        ];

        values.forEach(
          (
            value,
            valueIndex
          ) => {
            const column =
              contributionColumns[
                valueIndex
              ];

            doc
              .strokeColor(
                borderColor
              )
              .lineWidth(0.5)
              .rect(
                x,
                contributionY,
                column.width,
                30
              )
              .stroke();

            doc
              .fillColor(darkText)
              .fontSize(8)
              .font("Helvetica")
              .text(
                String(value),
                x + 8,
                contributionY + 10,
                {
                  width:
                    column.width - 16,
                  lineBreak: false,
                }
              );

            x += column.width;
          }
        );

        contributionY += 30;
      }
    );

    // ==================================================
    // PAGE 2 FOOTER
    // ==================================================

    const page2FooterY =
      pageHeight - 30;

    doc
      .strokeColor(borderColor)
      .lineWidth(0.5)
      .moveTo(
        50,
        page2FooterY - 8
      )
      .lineTo(
        pageWidth - 50,
        page2FooterY - 8
      )
      .stroke();

    doc
      .fillColor(mutedText)
      .fontSize(8)
      .font("Helvetica")
      .text(
        "SubFlow Financial Analytics",
        50,
        page2FooterY,
        {
          lineBreak: false,
        }
      );

    doc
      .fillColor(mutedText)
      .fontSize(8)
      .font("Helvetica")
      .text(
        `Total Revenue: ${formatINR(
          totalRevenue
        )}`,
        0,
        page2FooterY,
        {
          width:
            pageWidth - 50,
          align: "right",
          lineBreak: false,
        }
      );

    // ==================================================
    // END PDF
    // ==================================================

    doc.end();
  } catch (error) {
    console.error(
      "Export admin financial analytics PDF error:",
      error
    );

    if (!res.headersSent) {
      return res.status(500).json({
        message:
          "Unable to generate financial analytics PDF.",
      });
    }
  }
};
module.exports = {
  getAdminBilling,
  getAdminFinancialAnalytics,
  getMyPayments,

  exportAdminBilling,
  exportAdminBillingPdf,

  exportAdminFinancialAnalytics,
  exportAdminFinancialAnalyticsPdf,
};