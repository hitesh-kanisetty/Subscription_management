const prisma = require("../config/prisma");

const createPlan = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      billingPeriod,
      features,
    } = req.body;

    if (
      !name ||
      price === undefined ||
      !billingPeriod ||
      !features
    ) {
      return res.status(400).json({
        message:
          "Name, price, billing period and features are required",
      });
    }

    if (!Array.isArray(features) || features.length === 0) {
      return res.status(400).json({
        message: "At least one feature is required",
      });
    }

    if (!["MONTHLY", "YEARLY"].includes(billingPeriod)) {
      return res.status(400).json({
        message: "Invalid billing period",
      });
    }

    if (Number(price) <= 0) {
      return res.status(400).json({
        message: "Price must be greater than zero",
      });
    }

    const existingPlan = await prisma.plan.findUnique({
      where: {
        name: name.trim(),
      },
    });

    if (existingPlan) {
      return res.status(409).json({
        message: "A plan with this name already exists",
      });
    }

    const plan = await prisma.plan.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        price: Number(price),
        billingPeriod,
        features,
        isActive: true,
      },
    });


    await prisma.auditLog.create({
      data: {
        userId: req.session.user.id,
        action: "CREATE",
        module: "Plans",
        description: `Created plan "${plan.name}"`,
      },
    });

    return res.status(201).json({
      message: "Plan created successfully",
      plan,
    });
  } catch (error) {
    console.error("Create plan error:", error);

    return res.status(500).json({
      message: "Something went wrong. Please try again.",
    });
  }
};

const getPlans = async (req, res) => {
  try {

    const plans = await prisma.plan.findMany({
      orderBy: {
        createdAt: "asc",
      },
    });

    return res.status(200).json({
      message: "Plans fetched successfully",
      plans,
    });
  } catch (error) {
    console.error("Get plans error:", error);

    return res.status(500).json({
      message: "Something went wrong. Please try again.",
    });
  }
};

const getPlanById = async (req, res) => {
  try {

    const planId = Number(req.params.id);

    if (!Number.isInteger(planId)) {
      return res.status(400).json({
        message: "Invalid plan ID",
      });
    }


    if (req.session.user.role === "CUSTOMER") {
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

      return res.status(200).json({
        message: "Plan fetched successfully",
        plan,
      });
    }



    const plan = await prisma.plan.findUnique({
      where: {
        id: planId,
      },
      include: {
        subscriptions: {
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
            payments: {
              orderBy: {
                paymentDate: "desc",
              },
              select: {
                id: true,
                amount: true,
                status: true,
                paymentMethod: true,
                transactionId: true,
                paymentDate: true,
              },
            },
          },
        },
      },
    });

    if (!plan) {
      return res.status(404).json({
        message: "Plan not found",
      });
    }
    const uniqueSubscriberIds = new Set(
      plan.subscriptions.map(
        (subscription) => subscription.userId
      )
    );

    const totalSubscribers =
      uniqueSubscriberIds.size;

    const activeSubscribers =
      new Set(
        plan.subscriptions
          .filter(
            (subscription) =>
              subscription.status === "ACTIVE"
          )
          .map(
            (subscription) =>
              subscription.userId
          )
      ).size;

  

    const revenue = plan.subscriptions.reduce(
      (total, subscription) => {
        const subscriptionRevenue =
          subscription.payments.reduce(
            (paymentTotal, payment) => {
              if (payment.status !== "PAID") {
                return paymentTotal;
              }

              return (
                paymentTotal +
                Number(payment.amount)
              );
            },
            0
          );

        return total + subscriptionRevenue;
      },
      0
    );


    return res.status(200).json({
      message: "Plan fetched successfully",

      plan: {
        id: plan.id,
        name: plan.name,
        description: plan.description,
        price: plan.price,
        billingPeriod: plan.billingPeriod,
        features: plan.features,
        isActive: plan.isActive,
        createdAt: plan.createdAt,
        updatedAt: plan.updatedAt,

        totalSubscribers,
        activeSubscribers,
        revenue,

        subscribers:
          plan.subscriptions.map(
            (subscription) => ({
              subscriptionId:
                subscription.id,

              status:
                subscription.status,

              startDate:
                subscription.startDate,

              renewalDate:
                subscription.renewalDate,

              createdAt:
                subscription.createdAt,

              user: subscription.user,

              payments:
                subscription.payments,
            })
          ),
      },
    });
  } catch (error) {
    console.error("Get plan error:", error);

    return res.status(500).json({
      message:
        "Something went wrong. Please try again.",
    });
  }
};

const updatePlan = async (req, res) => {
  try {

    const planId = Number(req.params.id);

    if (!Number.isInteger(planId)) {
      return res.status(400).json({
        message: "Invalid plan ID",
      });
    }

    const {
      name,
      description,
      price,
      billingPeriod,
      features,
      isActive,
    } = req.body;

    if (
      !name ||
      price === undefined ||
      !billingPeriod ||
      !Array.isArray(features) ||
      features.length === 0
    ) {
      return res.status(400).json({
        message:
          "Name, price, billing period and features are required",
      });
    }

    if (!["MONTHLY", "YEARLY"].includes(billingPeriod)) {
      return res.status(400).json({
        message: "Invalid billing period",
      });
    }

    if (Number(price) <= 0) {
      return res.status(400).json({
        message: "Price must be greater than zero",
      });
    }

    const cleanedFeatures = features
      .map((feature) => feature.trim())
      .filter(Boolean);

    if (cleanedFeatures.length === 0) {
      return res.status(400).json({
        message: "At least one feature is required",
      });
    }

    const existingPlan = await prisma.plan.findUnique({
      where: {
        id: planId,
      },
    });

    if (!existingPlan) {
      return res.status(404).json({
        message: "Plan not found",
      });
    }

    const duplicatePlan = await prisma.plan.findFirst({
      where: {
        name: name.trim(),
        NOT: {
          id: planId,
        },
      },
    });

    if (duplicatePlan) {
      return res.status(409).json({
        message: "A plan with this name already exists",
      });
    }

    const updatedPlan = await prisma.plan.update({
      where: {
        id: planId,
      },
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        price: Number(price),
        billingPeriod,
        features: cleanedFeatures,
        isActive: Boolean(isActive),
        updatedAt: new Date(),
      },
    });

    // Create audit log after successful plan update
    await prisma.auditLog.create({
      data: {
        userId: req.session.user.id,
        action: "UPDATE",
        module: "Plans",
        description: `Updated plan "${updatedPlan.name}"`,
      },
    });

    return res.status(200).json({
      message: "Plan updated successfully",
      plan: updatedPlan,
    });
  } catch (error) {
    console.error("Update plan error:", error);

    return res.status(500).json({
      message: "Something went wrong. Please try again.",
    });
  }
};

const togglePlanStatus = async (req, res) => {
  try {

    const planId = Number(req.params.id);

    if (!Number.isInteger(planId)) {
      return res.status(400).json({
        message: "Invalid plan ID",
      });
    }

    const existingPlan = await prisma.plan.findUnique({
      where: {
        id: planId,
      },
    });

    if (!existingPlan) {
      return res.status(404).json({
        message: "Plan not found",
      });
    }

    const updatedPlan = await prisma.plan.update({
      where: {
        id: planId,
      },
      data: {
        isActive: !existingPlan.isActive,
        updatedAt: new Date(),
      },
    });

    // Create audit log after successful status change
    await prisma.auditLog.create({
      data: {
        userId: req.session.user.id,
        action: updatedPlan.isActive
          ? "ACTIVATE"
          : "DEACTIVATE",
        module: "Plans",
        description: `${
          updatedPlan.isActive
            ? "Activated"
            : "Deactivated"
        } plan "${updatedPlan.name}"`,
      },
    });

    return res.status(200).json({
      message: updatedPlan.isActive
        ? "Plan activated successfully"
        : "Plan deactivated successfully",
      plan: updatedPlan,
    });
  } catch (error) {
    console.error(
      "Toggle plan status error:",
      error
    );

    return res.status(500).json({
      message:
        "Something went wrong. Please try again.",
    });
  }
};

const deletePlan = async (req, res) => {
  try {
   
    const planId = Number(req.params.id);

    if (!Number.isInteger(planId)) {
      return res.status(400).json({
        message: "Invalid plan ID",
      });
    }

    const existingPlan = await prisma.plan.findUnique({
      where: {
        id: planId,
      },
    });

    if (!existingPlan) {
      return res.status(404).json({
        message: "Plan not found",
      });
    }

    await prisma.plan.delete({
      where: {
        id: planId,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.session.user.id,
        action: "DELETE",
        module: "Plans",
        description: `Deleted plan "${existingPlan.name}"`,
      },
    });

    return res.status(200).json({
      message: "Plan deleted successfully",
    });
  } catch (error) {
    console.error("Delete plan error:", error);

    return res.status(500).json({
      message: "Something went wrong. Please try again.",
    });
  }
};

module.exports = {
  createPlan,
  getPlans,
  getPlanById,
  updatePlan,
  togglePlanStatus,
  deletePlan,
};