const { PrismaClient } = require("../generated/prisma");

const prisma = new PrismaClient();

const subscribeToPlan = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({
        message: "Not authenticated",
      });
    }

    if (req.session.user.role !== "CUSTOMER") {
      return res.status(403).json({
        message: "Only customers can subscribe to plans",
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
        message: "This plan is currently unavailable",
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
      return res.status(409).json({
        message: "You already have an active subscription",
      });
    }

    const startDate = new Date();
    const renewalDate = new Date(startDate);

    if (plan.billingPeriod === "MONTHLY") {
      renewalDate.setMonth(
        renewalDate.getMonth() + 1
      );
    } else {
      renewalDate.setFullYear(
        renewalDate.getFullYear() + 1
      );
    }

    const result = await prisma.$transaction(
      async (tx) => {
        const subscription =
          await tx.subscription.create({
            data: {
              userId: req.session.user.id,
              planId: plan.id,
              status: "ACTIVE",
              startDate,
              renewalDate,
            },
          });

        const transactionId =
          `DEMO-${Date.now()}-${subscription.id}`;

        const payment = await tx.payment.create({
          data: {
            subscriptionId: subscription.id,
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

    return res.status(201).json({
      message: "Subscription created successfully",
      subscription: result.subscription,
      payment: result.payment,
      plan: {
        id: plan.id,
        name: plan.name,
        price: plan.price,
        billingPeriod: plan.billingPeriod,
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
 * Preview the amount required to upgrade
 * to another plan.
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
        message: "Only customers can upgrade plans",
      });
    }

    const newPlanId = Number(req.params.id);

    if (!Number.isInteger(newPlanId)) {
      return res.status(400).json({
        message: "Invalid plan ID",
      });
    }

    // Find the customer's active subscription
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
        message: "No active subscription found",
      });
    }

    // Find the plan the customer wants to upgrade to
    const newPlan = await prisma.plan.findUnique({
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
        message: "This plan is currently unavailable",
      });
    }

    // Same plan
    if (newPlan.id === currentSubscription.plan.id) {
      return res.status(400).json({
        message: "You are already subscribed to this plan",
      });
    }

    /*
     * For now, we use price to determine whether
     * the selected plan is an upgrade.
     *
     * Later we can introduce an explicit plan
     * hierarchy if needed.
     */
    if (
      Number(newPlan.price) <=
      Number(currentSubscription.plan.price)
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

    /*
     * Prevent invalid calculations if the
     * subscription has already reached renewal.
     */
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

    const currentPlanPrice = Number(
      currentSubscription.plan.price
    );

    const newPlanPrice = Number(
      newPlan.price
    );

    /*
     * Value of the unused portion of the
     * current subscription.
     */
    const unusedCurrentValue =
      currentPlanPrice * remainingRatio;

    /*
     * Value of the new plan for the same
     * remaining subscription period.
     */
    const newPlanRemainingValue =
      newPlanPrice * remainingRatio;

    /*
     * Customer only pays the difference.
     */
    const upgradeAmount = Math.max(
      0,
      newPlanRemainingValue -
        unusedCurrentValue
    );

    return res.status(200).json({
      message: "Upgrade amount calculated successfully",

      currentPlan: {
        id: currentSubscription.plan.id,
        name: currentSubscription.plan.name,
        price: currentPlanPrice,
        billingPeriod:
          currentSubscription.plan.billingPeriod,
      },

      newPlan: {
        id: newPlan.id,
        name: newPlan.name,
        price: newPlanPrice,
        billingPeriod: newPlan.billingPeriod,
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
            unusedCurrentValue.toFixed(2)
          ),

        newPlanRemainingValue:
          Number(
            newPlanRemainingValue.toFixed(2)
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
const upgradeSubscription = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({
        message: "Not authenticated",
      });
    }

    if (req.session.user.role !== "CUSTOMER") {
      return res.status(403).json({
        message: "Only customers can upgrade plans",
      });
    }

    const newPlanId = Number(req.params.id);

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
        message: "No active subscription found",
      });
    }

    const newPlan = await prisma.plan.findUnique({
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
        message: "This plan is currently unavailable",
      });
    }

    if (newPlan.id === currentSubscription.plan.id) {
      return res.status(400).json({
        message: "You are already subscribed to this plan",
      });
    }

    // Only higher-priced plans can be selected
    if (
      Number(newPlan.price) <=
      Number(currentSubscription.plan.price)
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

    const currentPlanPrice = Number(
      currentSubscription.plan.price
    );

    const newPlanPrice = Number(
      newPlan.price
    );

    const unusedCurrentValue =
      currentPlanPrice * remainingRatio;

    const newPlanRemainingValue =
      newPlanPrice * remainingRatio;

    const upgradeAmount = Math.max(
      0,
      newPlanRemainingValue -
        unusedCurrentValue
    );

    const roundedUpgradeAmount = Number(
      upgradeAmount.toFixed(2)
    );

    /*
     * Keep the same renewal date.
     *
     * The customer is upgrading for the
     * remainder of the current billing period.
     */
    const result = await prisma.$transaction(
      async (tx) => {
        // Cancel the existing subscription
        await tx.subscription.update({
          where: {
            id: currentSubscription.id,
          },
          data: {
            status: "CANCELLED",
          },
        });

        // Create the upgraded subscription
        const newSubscription =
          await tx.subscription.create({
            data: {
              userId: req.session.user.id,
              planId: newPlan.id,
              status: "ACTIVE",
              startDate: now,
              renewalDate: renewalDate,
            },
            include: {
              plan: true,
            },
          });

        const transactionId =
          `DEMO-UPGRADE-${Date.now()}-${newSubscription.id}`;

        // Record the upgrade payment
        const payment = await tx.payment.create({
          data: {
            subscriptionId:
              newSubscription.id,
            amount: roundedUpgradeAmount,
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

    return res.status(200).json({
      message:
        "Subscription upgraded successfully",

      subscription:
        result.newSubscription,

      payment: result.payment,

      previousPlan: {
        id: currentSubscription.plan.id,
        name: currentSubscription.plan.name,
        price: currentPlanPrice,
        billingPeriod:
          currentSubscription.plan.billingPeriod,
      },

      newPlan: {
        id: newPlan.id,
        name: newPlan.name,
        price: newPlanPrice,
        billingPeriod:
          newPlan.billingPeriod,
      },

      upgradeAmount: roundedUpgradeAmount,

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

const getMySubscription = async (req, res) => {
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
        message: "No subscription found",
      });
    }

    return res.status(200).json({
      message: "Subscription fetched successfully",
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


module.exports = {
  subscribeToPlan,
  previewUpgrade,
  upgradeSubscription,
  getMySubscription,
};