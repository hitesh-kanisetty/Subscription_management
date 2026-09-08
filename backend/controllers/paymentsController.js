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

    const payments = await prisma.payment.findMany({
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

    const totalCollected = payments
      .filter((payment) => payment.status === "PAID")
      .reduce((total, payment) => total + Number(payment.amount), 0);

    const successfulPayments = payments.filter(
      (payment) => payment.status === "PAID"
    ).length;

    const pendingPayments = payments.filter(
      (payment) => payment.status === "PENDING"
    ).length;

    const failedPayments = payments.filter(
      (payment) => payment.status === "FAILED"
    ).length;

    return res.status(200).json({
      message: "Admin billing data fetched successfully",

      summary: {
        totalCollected: Number(totalCollected.toFixed(2)),
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
          price: Number(payment.subscription.plan.price),
          billingPeriod: payment.subscription.plan.billingPeriod,
        },

        subscriptionId: payment.subscriptionId,
      })),
    });
  } catch (error) {
    console.error("Get admin billing error:", error);

    return res.status(500).json({
      message: "Something went wrong. Please try again.",
    });
  }
};

module.exports = {
  getAdminBilling,
};