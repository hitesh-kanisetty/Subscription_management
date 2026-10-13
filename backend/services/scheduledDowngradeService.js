
const { PrismaClient } = require("../generated/prisma");
const { createNotification } = require("../controllers/notificationHelper");

const prisma = new PrismaClient();

const addBillingPeriod = (date, billingPeriod) => {
  const nextDate = new Date(date);

  if (billingPeriod === "MONTHLY") {
    nextDate.setMonth(nextDate.getMonth() + 1);
  } else if (billingPeriod === "YEARLY") {
    nextDate.setFullYear(nextDate.getFullYear() + 1);
  }

  return nextDate;
};

const checkScheduledDowngrades = async () => {
  try {
    const now = new Date();

    const subscriptions = await prisma.subscription.findMany({
      where: {
        status: "ACTIVE",
        isTrial: false,
        pendingPlanId: { not: null },
        renewalDate: { lte: now },
      },
      include: {
        user: true,
        plan: true,
        pendingPlan: true,
        payments: {
          where: {
            status: "SCHEDULED",
            transactionId: {
              startsWith: "DOWNGRADE-SCHEDULED-",
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        },
      },
    });

    for (const subscription of subscriptions) {
      const scheduledPayment = subscription.payments[0];
      const nextPlan = subscription.pendingPlan;

      if (!nextPlan || !scheduledPayment) {
        console.error(
          `Skipping subscription ${subscription.id}: pending plan or scheduled payment missing.`
        );
        continue;
      }

      const effectiveDate = new Date(subscription.renewalDate);
      const nextRenewalDate = addBillingPeriod(
        effectiveDate,
        nextPlan.billingPeriod
      );

      const transactionId =
        `DEMO-DOWNGRADE-${Date.now()}-${scheduledPayment.id}`;

      const result = await prisma.$transaction(async (tx) => {
    
        const current = await tx.subscription.findFirst({
          where: {
            id: subscription.id,
            status: "ACTIVE",
            isTrial: false,
            pendingPlanId: nextPlan.id,
            renewalDate: { lte: now },
          },
        });

        if (!current) {
          return null;
        }

       
        const paymentUpdate = await tx.payment.updateMany({
          where: {
            id: scheduledPayment.id,
            subscriptionId: subscription.id,
            status: "SCHEDULED",
          },
          data: {
            status: "PAID",
            paymentMethod: "DEMO",
            transactionId,
            paymentDate: now,
          },
        });

        if (paymentUpdate.count !== 1) {
          return null;
        }

        const updatedSubscription = await tx.subscription.update({
          where: {
            id: subscription.id,
          },
          data: {
            planId: nextPlan.id,
            pendingPlanId: null,
            startDate: effectiveDate,
            renewalDate: nextRenewalDate,
            renewal7DaySent: false,
            renewal3DaySent: false,
            renewalDaySent: false,
          },
          include: {
            plan: true,
            pendingPlan: true,
          },
        });

        return {
          subscription: updatedSubscription,
          payment: await tx.payment.findUnique({
            where: { id: scheduledPayment.id },
          }),
        };
      });

      if (!result) {
        continue;
      }

      await createNotification({
        userId: subscription.userId,
        type: "PAYMENT_SUCCESS",
        title: "Scheduled downgrade payment processed",
        message: `Your scheduled payment of ₹${Number(
          result.payment.amount
        ).toLocaleString("en-IN")} was processed for the ${
          nextPlan.name
        } plan.`,
        details: {
          amount: `₹${Number(result.payment.amount).toLocaleString("en-IN")}`,
          plan: nextPlan.name,
          transactionId: result.payment.transactionId,
          paymentDate: result.payment.paymentDate,
        },
      });

      await createNotification({
        userId: subscription.userId,
        type: "SUBSCRIPTION_UPDATED",
        title: "Scheduled downgrade applied",
        message: `Your subscription is now on the ${nextPlan.name} plan.`,
        details: {
          previousPlan: subscription.plan.name,
          newPlan: nextPlan.name,
          startDate: result.subscription.startDate,
          renewalDate: result.subscription.renewalDate,
        },
      });

      console.log(
        `Scheduled downgrade applied: subscription ${subscription.id}, plan ${nextPlan.name}`
      );

      const admins = await prisma.user.findMany({
        where: {
          role: { name: "ADMIN" },
        },
        select: { id: true },
      });

      for (const admin of admins) {
        await createNotification({
          userId: admin.id,
          type: "SUBSCRIPTION_UPDATED",
          title: "Scheduled downgrade applied",
          message: `A customer subscription changed from ${subscription.plan.name} to ${nextPlan.name}.`,
          details: {
            subscriptionId: subscription.id,
            customerId: subscription.userId,
            previousPlan: subscription.plan.name,
            newPlan: nextPlan.name,
            paymentId: result.payment.id,
            amount: `₹${Number(result.payment.amount).toLocaleString("en-IN")}`,
          },
        });
      }
    }
  } catch (error) {
    console.error("Scheduled downgrade check error:", error);
  }
};

module.exports = {
  checkScheduledDowngrades,
};
