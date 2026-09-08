const { PrismaClient } = require("../generated/prisma");

const {
  createNotification,
} = require("./notificationHelper");

const prisma = new PrismaClient();

/*
 * =========================================================
 * RENEWAL NOTIFICATION HELPER
 * =========================================================
 */

const createRenewalNotificationIfNeeded = async ({
  userId,
  subscription,
  plan,
  customerName = null,
  isAdmin = false,
}) => {
  try {
    if (!subscription?.renewalDate) {
      return;
    }

    const now = new Date();

    const renewalDate = new Date(
      subscription.renewalDate
    );

    const difference =
      renewalDate.getTime() - now.getTime();

    const daysUntilRenewal = Math.ceil(
      difference /
        (1000 * 60 * 60 * 24)
    );

    /*
     * Customer:
     * Notify within 30 days.
     *
     * Admin:
     * Notify within 7 days.
     */
    const reminderWindow = isAdmin ? 7 : 30;

    if (
      daysUntilRenewal < 0 ||
      daysUntilRenewal > reminderWindow
    ) {
      return;
    }

    const formattedRenewalDate =
      renewalDate.toLocaleDateString(
        "en-IN",
        {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }
      );

    const message = isAdmin
      ? `${customerName || "A customer"}'s ${plan.name} subscription renews on ${formattedRenewalDate}.`
      : `Your ${plan.name} subscription renews on ${formattedRenewalDate}.`;

    /*
     * Prevent duplicate renewal notifications.
     */
    const existingNotification =
      await prisma.notification.findFirst({
        where: {
          userId,
          type: "RENEWAL_UPCOMING",
          message,
        },
      });

    if (existingNotification) {
      return;
    }

    await createNotification({
      userId,
      type: "RENEWAL_UPCOMING",
      title: isAdmin
        ? "Upcoming subscription renewal"
        : "Upcoming renewal",
      message,
      details: {
        subscriptionId:
          subscription.id,
        customerId:
          subscription.userId,
        customerName,
        plan: plan.name,
        price: `₹${Number(
          plan.price
        ).toLocaleString("en-IN")}`,
        billingPeriod:
          plan.billingPeriod,
        renewalDate:
          subscription.renewalDate,
        daysUntilRenewal,
      },
    });
  } catch (error) {
    /*
     * Notification failures must never
     * break the main subscription operation.
     */
    console.error(
      "Create renewal notification error:",
      error
    );
  }
};

/*
 * =========================================================
 * CUSTOMER - SUBSCRIBE TO PLAN
 * =========================================================
 */

const subscribeToPlan = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({
        message: "Not authenticated",
      });
    }

    if (req.session.user.role !== "CUSTOMER") {
      return res.status(403).json({
        message:
          "Only customers can subscribe to plans",
      });
    }

    const planId = Number(req.params.id);

    if (!Number.isInteger(planId)) {
      return res.status(400).json({
        message: "Invalid plan ID",
      });
    }

    const plan = await prisma.plan.findUnique({
      where: {
        id: planId,
      },
    });

    if (!plan) {
      return res.status(404).json({
        message: "Plan not found",
      });
    }

    if (!plan.isActive) {
      return res.status(400).json({
        message:
          "This plan is currently unavailable",
      });
    }

    const existingSubscription =
      await prisma.subscription.findFirst({
        where: {
          userId: req.session.user.id,
          status: "ACTIVE",
        },
      });

    if (existingSubscription) {
      return res.status(400).json({
        message:
          "You already have an active subscription",
      });
    }

    const startDate = new Date();

    const renewalDate = new Date(
      startDate
    );

    if (plan.billingPeriod === "MONTHLY") {
      renewalDate.setMonth(
        renewalDate.getMonth() + 1
      );
    } else if (
      plan.billingPeriod === "YEARLY"
    ) {
      renewalDate.setFullYear(
        renewalDate.getFullYear() + 1
      );
    }

    const result = await prisma.$transaction(
      async (tx) => {
        const subscription =
          await tx.subscription.create({
            data: {
              userId:
                req.session.user.id,
              planId: plan.id,
              status: "ACTIVE",
              startDate,
              renewalDate,
            },
          });

        const transactionId =
          `DEMO-${Date.now()}-${subscription.id}`;

        const payment =
          await tx.payment.create({
            data: {
              subscriptionId:
                subscription.id,
              amount: plan.price,
              status: "PAID",
              paymentMethod: "DEMO",
              transactionId,
              paymentDate: startDate,
            },
          });

        return {
          subscription,
          payment,
        };
      }
    );

    /*
     * =====================================================
     * CUSTOMER NOTIFICATIONS
     * =====================================================
     */

    await createNotification({
      userId: req.session.user.id,
      type: "PAYMENT_SUCCESS",
      title: "Payment successful",
      message: `Your payment of ₹${Number(
        result.payment.amount
      ).toLocaleString("en-IN")} was successful.`,
      details: {
        amount: `₹${Number(
          result.payment.amount
        ).toLocaleString("en-IN")}`,
        plan: plan.name,
        paymentMethod:
          result.payment.paymentMethod,
        transactionId:
          result.payment.transactionId,
        paymentDate:
          result.payment.paymentDate,
      },
    });

    await createNotification({
      userId: req.session.user.id,
      type: "SUBSCRIPTION_ACTIVE",
      title: "Subscription active",
      message: `Your ${plan.name} subscription is now active.`,
      details: {
        plan: plan.name,
        price: `₹${Number(
          plan.price
        ).toLocaleString("en-IN")}`,
        billingPeriod:
          plan.billingPeriod,
        status:
          result.subscription.status,
        startDate:
          result.subscription.startDate,
        renewalDate:
          result.subscription.renewalDate,
      },
    });

    /*
     * =====================================================
     * ADMIN NOTIFICATIONS
     * =====================================================
     */

    const adminUsers =
      await prisma.user.findMany({
        where: {
          role: {
            name: "ADMIN",
          },
        },
        select: {
          id: true,
        },
      });

    for (const admin of adminUsers) {
      await createNotification({
        userId: admin.id,
        type: "NEW_SUBSCRIPTION",
        title: "New subscription",
        message: `A customer subscribed to the ${plan.name} plan.`,
        details: {
          subscriptionId:
            result.subscription.id,
          customerId:
            req.session.user.id,
          plan: plan.name,
          price: `₹${Number(
            plan.price
          ).toLocaleString("en-IN")}`,
          billingPeriod:
            plan.billingPeriod,
          status:
            result.subscription.status,
          startDate:
            result.subscription.startDate,
          renewalDate:
            result.subscription.renewalDate,
        },
      });

      await createNotification({
        userId: admin.id,
        type: "NEW_PAYMENT",
        title: "New payment received",
        message: `A payment of ₹${Number(
          result.payment.amount
        ).toLocaleString("en-IN")} was received for a new subscription.`,
        details: {
          paymentId:
            result.payment.id,
          subscriptionId:
            result.subscription.id,
          customerId:
            req.session.user.id,
          amount: `₹${Number(
            result.payment.amount
          ).toLocaleString("en-IN")}`,
          plan: plan.name,
          paymentMethod:
            result.payment.paymentMethod,
          transactionId:
            result.payment.transactionId,
          paymentDate:
            result.payment.paymentDate,
        },
      });
    }

    return res.status(201).json({
      message:
        "Subscription created successfully",
      subscription:
        result.subscription,
      payment:
        result.payment,
      plan: {
        id: plan.id,
        name: plan.name,
        price: plan.price,
        billingPeriod:
          plan.billingPeriod,
      },
    });
  } catch (error) {
    console.error(
      "Subscribe to plan error:",
      error
    );

    return res.status(500).json({
      message:
        "Something went wrong. Please try again.",
    });
  }
};

/*
 * =========================================================
 * CUSTOMER - PREVIEW UPGRADE
 * =========================================================
 */

const previewUpgrade = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({
        message: "Not authenticated",
      });
    }

    if (req.session.user.role !== "CUSTOMER") {
      return res.status(403).json({
        message:
          "Only customers can upgrade plans",
      });
    }

    const newPlanId = Number(
      req.params.id
    );

    if (!Number.isInteger(newPlanId)) {
      return res.status(400).json({
        message: "Invalid plan ID",
      });
    }

    const currentSubscription =
      await prisma.subscription.findFirst({
        where: {
          userId: req.session.user.id,
          status: "ACTIVE",
        },
        include: {
          plan: true,
        },
      });

    if (!currentSubscription) {
      return res.status(404).json({
        message:
          "No active subscription found",
      });
    }

    const newPlan =
      await prisma.plan.findUnique({
        where: {
          id: newPlanId,
        },
      });

    if (!newPlan) {
      return res.status(404).json({
        message: "Plan not found",
      });
    }

    if (!newPlan.isActive) {
      return res.status(400).json({
        message:
          "This plan is currently unavailable",
      });
    }

    if (
      newPlan.id ===
      currentSubscription.plan.id
    ) {
      return res.status(400).json({
        message:
          "You are already subscribed to this plan",
      });
    }

    if (
      Number(newPlan.price) <=
      Number(
        currentSubscription.plan.price
      )
    ) {
      return res.status(400).json({
        message:
          "You can only upgrade to a higher-priced plan",
      });
    }

    const now = new Date();

    const startDate = new Date(
      currentSubscription.startDate
    );

    const renewalDate = new Date(
      currentSubscription.renewalDate
    );

    const totalTime =
      renewalDate.getTime() -
      startDate.getTime();

    const remainingTime =
      renewalDate.getTime() -
      now.getTime();

    const remainingRatio =
      totalTime > 0
        ? Math.max(
            0,
            Math.min(
              1,
              remainingTime / totalTime
            )
          )
        : 0;

    const currentPlanPrice =
      Number(
        currentSubscription.plan.price
      );

    const newPlanPrice =
      Number(newPlan.price);

    const unusedCurrentValue =
      currentPlanPrice *
      remainingRatio;

    const newPlanRemainingValue =
      newPlanPrice *
      remainingRatio;

    const upgradeAmount = Math.max(
      0,
      newPlanRemainingValue -
        unusedCurrentValue
    );

    return res.status(200).json({
      message:
        "Upgrade amount calculated successfully",

      currentPlan: {
        id:
          currentSubscription.plan.id,
        name:
          currentSubscription.plan.name,
        price: currentPlanPrice,
        billingPeriod:
          currentSubscription.plan
            .billingPeriod,
      },

      newPlan: {
        id: newPlan.id,
        name: newPlan.name,
        price: newPlanPrice,
        billingPeriod:
          newPlan.billingPeriod,
      },

      calculation: {
        totalDays: Math.ceil(
          totalTime /
            (1000 * 60 * 60 * 24)
        ),

        remainingDays: Math.max(
          0,
          Math.ceil(
            remainingTime /
              (1000 * 60 * 60 * 24)
          )
        ),

        remainingRatio,

        unusedCurrentValue:
          Number(
            unusedCurrentValue.toFixed(
              2
            )
          ),

        newPlanRemainingValue:
          Number(
            newPlanRemainingValue.toFixed(
              2
            )
          ),

        upgradeAmount:
          Number(
            upgradeAmount.toFixed(2)
          ),
      },
    });
  } catch (error) {
    console.error(
      "Preview upgrade error:",
      error
    );

    return res.status(500).json({
      message:
        "Something went wrong. Please try again.",
    });
  }
};

/*
 * =========================================================
 * CUSTOMER - UPGRADE SUBSCRIPTION
 * =========================================================
 */

const upgradeSubscription = async (
  req,
  res
) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({
        message: "Not authenticated",
      });
    }

    if (req.session.user.role !== "CUSTOMER") {
      return res.status(403).json({
        message:
          "Only customers can upgrade plans",
      });
    }

    const newPlanId = Number(
      req.params.id
    );

    if (!Number.isInteger(newPlanId)) {
      return res.status(400).json({
        message: "Invalid plan ID",
      });
    }

    const currentSubscription =
      await prisma.subscription.findFirst({
        where: {
          userId: req.session.user.id,
          status: "ACTIVE",
        },
        include: {
          plan: true,
        },
      });

    if (!currentSubscription) {
      return res.status(404).json({
        message:
          "No active subscription found",
      });
    }

    const newPlan =
      await prisma.plan.findUnique({
        where: {
          id: newPlanId,
        },
      });

    if (!newPlan) {
      return res.status(404).json({
        message: "Plan not found",
      });
    }

    if (!newPlan.isActive) {
      return res.status(400).json({
        message:
          "This plan is currently unavailable",
      });
    }

    if (
      newPlan.id ===
      currentSubscription.plan.id
    ) {
      return res.status(400).json({
        message:
          "You are already subscribed to this plan",
      });
    }

    if (
      Number(newPlan.price) <=
      Number(
        currentSubscription.plan.price
      )
    ) {
      return res.status(400).json({
        message:
          "You can only upgrade to a higher-priced plan",
      });
    }

    const now = new Date();

    const startDate = new Date(
      currentSubscription.startDate
    );

    const renewalDate = new Date(
      currentSubscription.renewalDate
    );

    const totalTime =
      renewalDate.getTime() -
      startDate.getTime();

    const remainingTime =
      renewalDate.getTime() -
      now.getTime();

    const remainingRatio =
      totalTime > 0
        ? Math.max(
            0,
            Math.min(
              1,
              remainingTime / totalTime
            )
          )
        : 0;

    const currentPlanPrice =
      Number(
        currentSubscription.plan.price
      );

    const newPlanPrice =
      Number(newPlan.price);

    const unusedCurrentValue =
      currentPlanPrice *
      remainingRatio;

    const newPlanRemainingValue =
      newPlanPrice *
      remainingRatio;

    const upgradeAmount = Math.max(
      0,
      newPlanRemainingValue -
        unusedCurrentValue
    );

    const roundedUpgradeAmount =
      Number(
        upgradeAmount.toFixed(2)
      );

    const result = await prisma.$transaction(
      async (tx) => {
        await tx.subscription.update({
          where: {
            id: currentSubscription.id,
          },
          data: {
            status: "CANCELLED",
          },
        });

        const newSubscription =
          await tx.subscription.create({
            data: {
              userId:
                req.session.user.id,
              planId: newPlan.id,
              status: "ACTIVE",
              startDate: now,
              renewalDate,
            },
            include: {
              plan: true,
            },
          });

        const transactionId =
          `DEMO-UPGRADE-${Date.now()}-${newSubscription.id}`;

        const payment =
          await tx.payment.create({
            data: {
              subscriptionId:
                newSubscription.id,
              amount:
                roundedUpgradeAmount,
              status: "PAID",
              paymentMethod: "DEMO",
              transactionId,
              paymentDate: now,
            },
          });

        return {
          newSubscription,
          payment,
        };
      }
    );

    /*
     * =====================================================
     * CUSTOMER NOTIFICATIONS
     * =====================================================
     */

    await createNotification({
      userId: req.session.user.id,
      type: "PAYMENT_SUCCESS",
      title:
        "Upgrade payment successful",
      message: `Your upgrade payment of ₹${Number(
        result.payment.amount
      ).toLocaleString("en-IN")} was successful.`,
      details: {
        amount: `₹${Number(
          result.payment.amount
        ).toLocaleString("en-IN")}`,
        plan: newPlan.name,
        paymentMethod:
          result.payment.paymentMethod,
        transactionId:
          result.payment.transactionId,
        paymentDate:
          result.payment.paymentDate,
      },
    });

    await createNotification({
      userId: req.session.user.id,
      type: "SUBSCRIPTION_UPDATED",
      title:
        "Subscription upgraded",
      message: `Your subscription has been upgraded to the ${newPlan.name} plan.`,
      details: {
        previousPlan:
          currentSubscription.plan
            .name,
        newPlan: newPlan.name,
        price: `₹${Number(
          newPlan.price
        ).toLocaleString("en-IN")}`,
        billingPeriod:
          newPlan.billingPeriod,
        status:
          result.newSubscription
            .status,
        startDate:
          result.newSubscription
            .startDate,
        renewalDate:
          result.newSubscription
            .renewalDate,
      },
    });

    /*
     * =====================================================
     * ADMIN NOTIFICATIONS
     * =====================================================
     */

    const adminUsers =
      await prisma.user.findMany({
        where: {
          role: {
            name: "ADMIN",
          },
        },
        select: {
          id: true,
        },
      });

    for (const admin of adminUsers) {
      await createNotification({
        userId: admin.id,
        type:
          "SUBSCRIPTION_UPGRADED",
        title:
          "Subscription upgraded",
        message: `A customer upgraded from ${currentSubscription.plan.name} to ${newPlan.name}.`,
        details: {
          subscriptionId:
            result.newSubscription
              .id,
          customerId:
            req.session.user.id,
          previousPlan:
            currentSubscription.plan
              .name,
          newPlan: newPlan.name,
          price: `₹${Number(
            newPlan.price
          ).toLocaleString("en-IN")}`,
          billingPeriod:
            newPlan.billingPeriod,
          status:
            result.newSubscription
              .status,
          startDate:
            result.newSubscription
              .startDate,
          renewalDate:
            result.newSubscription
              .renewalDate,
        },
      });

      await createNotification({
        userId: admin.id,
        type: "NEW_PAYMENT",
        title:
          "Upgrade payment received",
        message: `An upgrade payment of ₹${Number(
          result.payment.amount
        ).toLocaleString("en-IN")} was received.`,
        details: {
          paymentId:
            result.payment.id,
          subscriptionId:
            result.newSubscription
              .id,
          customerId:
            req.session.user.id,
          amount: `₹${Number(
            result.payment.amount
          ).toLocaleString("en-IN")}`,
          previousPlan:
            currentSubscription.plan
              .name,
          newPlan: newPlan.name,
          paymentMethod:
            result.payment.paymentMethod,
          transactionId:
            result.payment.transactionId,
          paymentDate:
            result.payment.paymentDate,
        },
      });
    }

    return res.status(200).json({
      message:
        "Subscription upgraded successfully",

      subscription:
        result.newSubscription,

      payment:
        result.payment,

      previousPlan: {
        id:
          currentSubscription.plan.id,
        name:
          currentSubscription.plan.name,
        price: currentPlanPrice,
        billingPeriod:
          currentSubscription.plan
            .billingPeriod,
      },

      newPlan: {
        id: newPlan.id,
        name: newPlan.name,
        price: newPlanPrice,
        billingPeriod:
          newPlan.billingPeriod,
      },

      upgradeAmount:
        roundedUpgradeAmount,

      renewalDate,
    });
  } catch (error) {
    console.error(
      "Upgrade subscription error:",
      error
    );

    return res.status(500).json({
      message:
        "Something went wrong. Please try again.",
    });
  }
};

/*
 * =========================================================
 * CUSTOMER - GET MY SUBSCRIPTION
 * =========================================================
 */

const getMySubscription = async (
  req,
  res
) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({
        message: "Not authenticated",
      });
    }

    if (req.session.user.role !== "CUSTOMER") {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    const subscription =
      await prisma.subscription.findFirst({
        where: {
          userId: req.session.user.id,
        },
        include: {
          plan: true,
          payments: {
            orderBy: {
              paymentDate: "desc",
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

    if (!subscription) {
      return res.status(404).json({
        message:
          "No subscription found",
      });
    }

    /*
     * Customer renewal notification.
     * Generated only when renewal is
     * within the next 30 days.
     */
    await createRenewalNotificationIfNeeded({
      userId:
        req.session.user.id,
      subscription,
      plan: subscription.plan,
      customerName:
        req.session.user.name ||
        null,
      isAdmin: false,
    });

    return res.status(200).json({
      message:
        "Subscription fetched successfully",
      subscription,
    });
  } catch (error) {
    console.error(
      "Get my subscription error:",
      error
    );

    return res.status(500).json({
      message:
        "Something went wrong. Please try again.",
    });
  }
};

/*
 * =========================================================
 * ADMIN - DASHBOARD
 * =========================================================
 */

const getAdminDashboard = async (
  req,
  res
) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({
        message: "Not authenticated",
      });
    }

    if (req.session.user.role !== "ADMIN") {
      return res.status(403).json({
        message:
          "Admin access required",
      });
    }

    const now = new Date();

    const recentSubscriptions =
      await prisma.subscription.findMany({
        take: 5,
        orderBy: {
          createdAt: "desc",
        },
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
      });

    const upcomingRenewals =
      await prisma.subscription.findMany({
        where: {
          status: "ACTIVE",
          renewalDate: {
            gte: now,
          },
        },
        take: 3,
        orderBy: {
          renewalDate: "asc",
        },
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
      });

    return res.status(200).json({
      message:
        "Admin dashboard data fetched successfully",

      recentSubscriptions:
        recentSubscriptions.map(
          (subscription) => ({
            id:
              subscription.id,

            customer: {
              id:
                subscription.user.id,
              name:
                subscription.user.name,
              email:
                subscription.user.email,
            },

            plan: {
              id:
                subscription.plan.id,
              name:
                subscription.plan.name,
              price: Number(
                subscription.plan.price
              ),
              billingPeriod:
                subscription.plan
                  .billingPeriod,
            },

            status:
              subscription.status,

            startDate:
              subscription.startDate,

            renewalDate:
              subscription.renewalDate,

            createdAt:
              subscription.createdAt,
          })
        ),

      upcomingRenewals:
        upcomingRenewals.map(
          (subscription) => ({
            id:
              subscription.id,

            customer: {
              id:
                subscription.user.id,
              name:
                subscription.user.name,
              email:
                subscription.user.email,
            },

            plan: {
              id:
                subscription.plan.id,
              name:
                subscription.plan.name,
              price: Number(
                subscription.plan.price
              ),
              billingPeriod:
                subscription.plan
                  .billingPeriod,
            },

            status:
              subscription.status,

            startDate:
              subscription.startDate,

            renewalDate:
              subscription.renewalDate,
          })
        ),
    });
  } catch (error) {
    console.error(
      "Get admin dashboard error:",
      error
    );

    return res.status(500).json({
      message:
        "Something went wrong. Please try again.",
    });
  }
};

/*
 * =========================================================
 * ADMIN - RENEWALS
 * =========================================================
 */

const getAdminRenewals = async (
  req,
  res
) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({
        message: "Not authenticated",
      });
    }

    if (req.session.user.role !== "ADMIN") {
      return res.status(403).json({
        message:
          "Admin access required",
      });
    }

    const now = new Date();

    const renewals =
      await prisma.subscription.findMany({
        where: {
          status: "ACTIVE",
          renewalDate: {
            gte: now,
          },
        },
        orderBy: {
          renewalDate: "asc",
        },
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
      });

    /*
     * =====================================================
     * ADMIN RENEWAL NOTIFICATIONS
     * =====================================================
     *
     * Only subscriptions renewing within
     * the next 7 days generate notifications.
     */

    const adminUsers =
      await prisma.user.findMany({
        where: {
          role: {
            name: "ADMIN",
          },
        },
        select: {
          id: true,
        },
      });

    for (const subscription of renewals) {
      for (const admin of adminUsers) {
        await createRenewalNotificationIfNeeded({
          userId: admin.id,
          subscription,
          plan: subscription.plan,
          customerName:
            subscription.user.name,
          isAdmin: true,
        });
      }
    }

    return res.status(200).json({
      message:
        "Admin renewals data fetched successfully",

      renewals: renewals.map(
        (subscription) => ({
          id:
            subscription.id,

          customer: {
            id:
              subscription.user.id,
            name:
              subscription.user.name,
            email:
              subscription.user.email,
          },

          plan: {
            id:
              subscription.plan.id,
            name:
              subscription.plan.name,
            price: Number(
              subscription.plan.price
            ),
            billingPeriod:
              subscription.plan
                .billingPeriod,
          },

          status:
            subscription.status,

          startDate:
            subscription.startDate,

          renewalDate:
            subscription.renewalDate,
        })
      ),
    });
  } catch (error) {
    console.error(
      "Get admin renewals error:",
      error
    );

    return res.status(500).json({
      message:
        "Something went wrong. Please try again.",
    });
  }
};

module.exports = {
  subscribeToPlan,
  previewUpgrade,
  upgradeSubscription,
  getMySubscription,
  getAdminDashboard,
  getAdminRenewals,
};