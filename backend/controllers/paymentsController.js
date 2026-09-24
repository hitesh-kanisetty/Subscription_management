const { PrismaClient } = require("../generated/prisma");

const prisma = new PrismaClient();

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
module.exports = {
  getAdminBilling,
  getAdminFinancialAnalytics,
  getMyPayments,
};