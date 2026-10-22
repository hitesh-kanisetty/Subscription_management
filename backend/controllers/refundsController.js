
const prisma = require("../config/prisma");

const createRefundRequest = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({
        message: "Not authenticated",
      });
    }

    if (req.session.user.role !== "CUSTOMER") {
      return res.status(403).json({
        message: "Only customers can request refunds",
      });
    }

    const paymentId = Number(req.params.paymentId);
    const { reason, description } = req.body;

    if (!Number.isInteger(paymentId) || paymentId <= 0) {
      return res.status(400).json({
        message: "Invalid payment ID",
      });
    }

    if (typeof reason !== "string" || !reason.trim()) {
      return res.status(400).json({
        message: "Please select a refund reason",
      });
    }

    const allowedReasons = [
      "ACCIDENTAL_PURCHASE",
      "DUPLICATE_PAYMENT",
      "BILLING_ISSUE",
      "OTHER",
    ];

    if (!allowedReasons.includes(reason.trim())) {
      return res.status(400).json({
        message: "Invalid refund reason",
      });
    }

    const payment = await prisma.payment.findFirst({
      where: {
        id: paymentId,
        subscription: {
          userId: req.session.user.id,
        },
      },
      include: {
        subscription: {
          include: {
            plan: true,
          },
        },
      },
    });

    if (!payment) {
      return res.status(404).json({
        message: "Payment not found",
      });
    }

    if (payment.status !== "PAID") {
      return res.status(400).json({
        message: "Only successful payments are eligible for refund requests",
      });
    }

    const currentSubscription = await prisma.subscription.findFirst({
      where: {
        userId: req.session.user.id,
        status: "ACTIVE",
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (
      !currentSubscription ||
      currentSubscription.id !== payment.subscriptionId
    ) {
      return res.status(400).json({
        message: "Refund requests are only allowed for payments belonging to your current subscription",
      });
    }

    const paymentTime = new Date(payment.paymentDate).getTime();
    const elapsedTime = Date.now() - paymentTime;
    const twentyFourHours = 48 * 60 * 60 * 1000;

    if (
      !Number.isFinite(paymentTime) ||
      elapsedTime < 0 ||
      elapsedTime > twentyFourHours
    ) {
      return res.status(400).json({
        message: "Refund requests must be submitted within 24 hours of payment",
      });
    }

    const existingRequest = await prisma.refundRequest.findUnique({
      where: {
        paymentId: payment.id,
      },
    });

    if (existingRequest) {
      return res.status(409).json({
        message: "A refund request already exists for this payment",
        refundRequest: existingRequest,
      });
    }

    const refundRequest = await prisma.refundRequest.create({
      data: {
        paymentId: payment.id,
        userId: req.session.user.id,
        reason: reason.trim(),
        description:
          typeof description === "string"
            ? description.trim().slice(0, 1000) || null
            : null,
        status: "PENDING",
      },
    });

    return res.status(201).json({
      message: "Refund request submitted successfully",
      refundRequest,
    });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({
        message: "A refund request already exists for this payment",
      });
    }

    console.error("Create refund request error:", error);

    return res.status(500).json({
      message: "Unable to submit refund request",
    });
  }
};


const getSupportRefundRequests = async (req, res) => {
    console.log("GET SUPPORT REFUNDS CONTROLLER REACHED");
  try {
    if (!req.session.user) {
      return res.status(401).json({
        message: "Not authenticated",
      });
    }

    console.log("Refund API session:", req.session.user);
    if (req.session.user.role !== "SUPPORT") {
      return res.status(403).json({
        message: "Support agent access required",
      });
    }

    // Verify specialization from the database, not just the session.
    const agent = await prisma.user.findUnique({
      where: {
        id: req.session.user.id,
      },
      select: {
        supportSpecialization: true,
      },
    });
    console.log("Refund API agent:", agent);
    if (agent?.supportSpecialization !== "PAYMENT") {
      return res.status(403).json({
        message: "Only payment support agents can access refund requests",
      });
    }

    const refundRequests = await prisma.refundRequest.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        payment: {
          select: {
            id: true,
            amount: true,
            status: true,
            paymentMethod: true,
            transactionId: true,
            paymentDate: true,
            subscription: {
              select: {
                plan: {
                  select: {
                    name: true,
                    price: true,
                    billingPeriod: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      message: "Refund requests fetched successfully",
      refundRequests,
    });
  } catch (error) {
    console.error("Get support refund requests error:", error);

    return res.status(500).json({
      message: "Unable to fetch refund requests",
    });
  }
};


const updateSupportRefundRequest = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({
        message: "Not authenticated",
      });
    }

    if (req.session.user.role !== "SUPPORT") {
      return res.status(403).json({
        message: "Support agent access required",
      });
    }

    // Verify the agent's current specialization from the database.
    const agent = await prisma.user.findUnique({
      where: {
        id: req.session.user.id,
      },
      select: {
        supportSpecialization: true,
      },
    });

    if (agent?.supportSpecialization !== "PAYMENT") {
      return res.status(403).json({
        message: "Only payment support agents can review refund requests",
      });
    }

    const refundId = Number(req.params.refundId);
    const { action, reviewNote } = req.body;

    if (!Number.isInteger(refundId) || refundId <= 0) {
      return res.status(400).json({
        message: "Invalid refund request ID",
      });
    }

    const allowedActions = [
      "START_REVIEW",
      "RECOMMEND_APPROVAL",
      "RECOMMEND_REJECTION",
    ];

    if (!allowedActions.includes(action)) {
      return res.status(400).json({
        message: "Invalid refund review action",
      });
    }

    if (
      reviewNote !== undefined &&
      (typeof reviewNote !== "string" || reviewNote.length > 1000)
    ) {
      return res.status(400).json({
        message: "Review note must be a string of at most 1000 characters",
      });
    }

    const refundRequest = await prisma.refundRequest.findUnique({
      where: {
        id: refundId,
      },
    });

    if (!refundRequest) {
      return res.status(404).json({
        message: "Refund request not found",
      });
    }

    // Agents can review pending requests, but cannot finalize refunds.
    if (action === "START_REVIEW") {
      if (refundRequest.status !== "PENDING") {
        return res.status(400).json({
          message: "Only pending refund requests can enter review",
        });
      }

      const updatedRequest = await prisma.refundRequest.update({
        where: {
          id: refundId,
        },
        data: {
          status: "UNDER_REVIEW",
        },
      });

      return res.status(200).json({
        message: "Refund request moved to review",
        refundRequest: updatedRequest,
      });
    }

    if (refundRequest.status !== "UNDER_REVIEW") {
      return res.status(400).json({
        message: "Only refund requests under review can receive a recommendation",
      });
    }

    const recommendation =
      action === "RECOMMEND_APPROVAL"
        ? "APPROVAL"
        : "REJECTION";

    const note = reviewNote?.trim() || "No additional review notes provided.";

    // Keep status UNDER_REVIEW until the admin makes the final decision.
    // The existing adminNote field temporarily stores the agent's recommendation.
    const updatedRequest = await prisma.refundRequest.update({
      where: {
        id: refundId,
      },
      data: {
        adminNote: `Agent recommendation: ${recommendation}\nReview note: ${note}`,
      },
    });

    return res.status(200).json({
      message: "Agent recommendation submitted for admin review",
      refundRequest: updatedRequest,
    });
  } catch (error) {
    console.error("Update support refund request error:", error);

    return res.status(500).json({
      message: "Unable to update refund request",
    });
  }
};


const decideRefundRequest = async (req, res) => {
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

    const refundId = Number(req.params.refundId);
    const { action, adminNote } = req.body;

    if (!Number.isInteger(refundId) || refundId <= 0) {
      return res.status(400).json({
        message: "Invalid refund request ID",
      });
    }

    if (!["APPROVE", "REJECT"].includes(action)) {
      return res.status(400).json({
        message: "Action must be APPROVE or REJECT",
      });
    }

    if (
      adminNote !== undefined &&
      (typeof adminNote !== "string" || adminNote.length > 1000)
    ) {
      return res.status(400).json({
        message: "Admin note must be at most 1000 characters",
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      const refund = await tx.refundRequest.findUnique({
        where: { id: refundId },
        include: {
          payment: {
            include: {
              subscription: true,
            },
          },
        },
      });

      if (!refund) {
        throw new Error("REFUND_NOT_FOUND");
      }

      if (refund.status !== "UNDER_REVIEW") {
        throw new Error("REFUND_NOT_UNDER_REVIEW");
      }

      const recommendation = refund.adminNote?.match(
        /Agent recommendation:\s*(APPROVAL|REJECTION)/i
      )?.[1]?.toUpperCase();

      if (!recommendation) {
        throw new Error("AGENT_RECOMMENDATION_REQUIRED");
      }

      const subscription = refund.payment.subscription;

      if (action === "REJECT") {
        const rejected = await tx.refundRequest.update({
          where: { id: refundId },
          data: {
            status: "REJECTED",
            adminNote: [
              refund.adminNote,
              `Admin decision: REJECTED`,
              adminNote?.trim()
                ? `Admin note: ${adminNote.trim()}`
                : null,
            ]
              .filter(Boolean)
              .join("\n"),
          },
        });

        return {
          refundRequest: rejected,
          refundPayment: null,
          message: "Refund request rejected",
        };
      }

      // Prevent approval if the original payment is no longer eligible.
      if (refund.payment.status !== "PAID") {
        throw new Error("ORIGINAL_PAYMENT_NOT_PAID");
      }

      if (subscription.status !== "ACTIVE") {
        throw new Error("SUBSCRIPTION_NOT_ACTIVE");
      }

      // Create a separate refund entry. This records the refund in
      // SubFlow; it does not transfer money through a payment gateway.
      const refundPayment = await tx.payment.create({
        data: {
          subscriptionId: subscription.id,
          amount: refund.payment.amount,
          status: "REFUNDED",
          paymentMethod: "SYSTEM",
          transactionId: `REFUND-${refund.id}-${Date.now()}`,
          paymentDate: new Date(),
        },
      });

      // Cancel the subscription and remove its scheduled downgrade.
      await tx.subscription.update({
        where: { id: subscription.id },
        data: {
          status: "CANCELLED",
          pendingPlanId: null,
        },
      });

      // Cancel any scheduled payment records for this subscription.
      await tx.payment.updateMany({
        where: {
          subscriptionId: subscription.id,
          status: "SCHEDULED",
        },
        data: {
          status: "CANCELLED",
        },
      });

      const approved = await tx.refundRequest.update({
        where: { id: refundId },
        data: {
          status: "REFUNDED",
          adminNote: [
            refund.adminNote,
            "Admin decision: APPROVED",
            adminNote?.trim()
              ? `Admin note: ${adminNote.trim()}`
              : null,
          ]
            .filter(Boolean)
            .join("\n"),
        },
      });

      return {
        refundRequest: approved,
        refundPayment,
        message: "Refund approved and subscription cancelled",
      };
    });

    return res.status(200).json(result);
  } catch (error) {
    if (error.message === "REFUND_NOT_FOUND") {
      return res.status(404).json({
        message: "Refund request not found",
      });
    }

    if (error.message === "REFUND_NOT_UNDER_REVIEW") {
      return res.status(400).json({
        message: "Only refund requests under review can be finalized",
      });
    }

    if (error.message === "AGENT_RECOMMENDATION_REQUIRED") {
      return res.status(400).json({
        message: "A support agent recommendation is required first",
      });
    }

    if (error.message === "ORIGINAL_PAYMENT_NOT_PAID") {
      return res.status(400).json({
        message: "The original payment is no longer marked as paid",
      });
    }

    if (error.message === "SUBSCRIPTION_NOT_ACTIVE") {
      return res.status(400).json({
        message: "The subscription is no longer active",
      });
    }

    console.error("Admin refund decision error:", error);

    return res.status(500).json({
      message: "Unable to finalize refund request",
    });
  }
};


const getAdminRefundRequests = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    if (req.session.user.role !== "ADMIN") {
      return res.status(403).json({ message: "Admin access required" });
    }

    const refunds = await prisma.refundRequest.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        payment: {
          include: {
            subscription: {
              include: {
                plan: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({ refunds });
  } catch (error) {
    console.error("Get admin refund requests error:", error);

    return res.status(500).json({
      message: "Failed to fetch refund requests",
    });
  }
};


module.exports = {
  createRefundRequest,
  getSupportRefundRequests,
  updateSupportRefundRequest,
  decideRefundRequest,
  getAdminRefundRequests,
};
