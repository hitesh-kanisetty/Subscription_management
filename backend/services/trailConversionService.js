const { PrismaClient } = require("../generated/prisma");

const {
  sendTrialConversionEmail,
} = require("./emailService");

const {
  createNotification,
} = require("../controllers/notificationHelper");

const prisma = new PrismaClient();

const checkTrialConversions = async () => {
  try {
    const now = new Date();

    const expiredTrials =
      await prisma.subscription.findMany({
        where: {
          status: "ACTIVE",
          isTrial: true,
          renewalDate: {
            lte: now,
          },
        },
        include: {
          user: true,
          plan: true,
        },
      });

    if (expiredTrials.length === 0) {
      return;
    }

    for (const subscription of expiredTrials) {
      const nextRenewalDate = new Date(now);

      if (
        subscription.plan.billingPeriod ===
        "MONTHLY"
      ) {
        nextRenewalDate.setMonth(
          nextRenewalDate.getMonth() + 1
        );
      } else if (
        subscription.plan.billingPeriod ===
        "YEARLY"
      ) {
        nextRenewalDate.setFullYear(
          nextRenewalDate.getFullYear() + 1
        );
      }

      const transactionId =
        `DEMO-TRIAL-${Date.now()}-${subscription.id}`;

      let payment;

      await prisma.$transaction(async (tx) => {
        payment = await tx.payment.create({
          data: {
            subscriptionId:
              subscription.id,
            amount:
              subscription.plan.price,
            status: "PAID",
            paymentMethod: "DEMO",
            transactionId,
            paymentDate: now,
          },
        });

        await tx.subscription.update({
          where: {
            id: subscription.id,
          },
          data: {
            isTrial: false,
            renewalDate:
              nextRenewalDate,
          },
        });
      });

      /*
       * Customer payment notification
       */
      await createNotification({
        userId: subscription.user.id,
        type: "PAYMENT_SUCCESS",
        title: "Trial converted to paid subscription",
        message:
          `Your 3-day free trial has ended. ` +
          `A payment of ₹${Number(
            payment.amount
          ).toLocaleString("en-IN")} ` +
          `was processed for the ${subscription.plan.name} plan.`,
        details: {
          amount:
            `₹${Number(
              payment.amount
            ).toLocaleString("en-IN")}`,
          plan:
            subscription.plan.name,
          paymentMethod:
            payment.paymentMethod,
          transactionId:
            payment.transactionId,
          paymentDate:
            payment.paymentDate,
        },
      });

      /*
       * Customer trial conversion email
       */
      await sendTrialConversionEmail({
        user: subscription.user,
        plan: subscription.plan,
        subscription: {
          ...subscription,
          isTrial: false,
          renewalDate:
            nextRenewalDate,
        },
        payment,
      });

      /*
       * Admin payment notification
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
          type: "NEW_PAYMENT",
          title: "Trial converted to paid subscription",
          message:
            `A customer's 3-day free trial has ended ` +
            `and a payment of ₹${Number(
              payment.amount
            ).toLocaleString("en-IN")} ` +
            `was processed for the ${subscription.plan.name} plan.`,
          details: {
            paymentId:
              payment.id,
            subscriptionId:
              subscription.id,
            customerId:
              subscription.user.id,
            amount:
              `₹${Number(
                payment.amount
              ).toLocaleString("en-IN")}`,
            plan:
              subscription.plan.name,
            paymentMethod:
              payment.paymentMethod,
            transactionId:
              payment.transactionId,
            paymentDate:
              payment.paymentDate,
          },
        });
      }

      console.log(
        `Trial converted to paid subscription: ${subscription.id}`
      );
    }
  } catch (error) {
    console.error(
      "Trial conversion check error:",
      error
    );
  }
};

module.exports = {
  checkTrialConversions,
};