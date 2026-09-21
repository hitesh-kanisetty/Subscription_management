const { PrismaClient } = require("../generated/prisma");

const {
  sendRenewal7DayEmail,
  sendRenewal3DayEmail,
  sendRenewalDayEmail,
} = require("./emailService");

const prisma = new PrismaClient();

const ONE_DAY_MS = 1000 * 60 * 60 * 24;

const checkRenewalReminders = async () => {
  try {
    const now = new Date();

    const subscriptions =
      await prisma.subscription.findMany({
        where: {
          status: "ACTIVE",
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

    for (const subscription of subscriptions) {
      const renewalDate = new Date(
        subscription.renewalDate
      );

      const difference =
        renewalDate.getTime() - now.getTime();

      const daysUntilRenewal = Math.ceil(
        difference / ONE_DAY_MS
      );

      /*
       * 7 DAYS BEFORE RENEWAL
       */
      if (
        daysUntilRenewal === 7 &&
        !subscription.renewal7DaySent
      ) {
        await sendRenewal7DayEmail({
          user: subscription.user,
          plan: subscription.plan,
          subscription,
        });

        await prisma.subscription.update({
          where: {
            id: subscription.id,
          },
          data: {
            renewal7DaySent: true,
          },
        });

        console.log(
          `7-day renewal email sent for subscription ${subscription.id}`
        );
      }

      /*
       * 3 DAYS BEFORE RENEWAL
       */
      if (
        daysUntilRenewal === 3 &&
        !subscription.renewal3DaySent
      ) {
        await sendRenewal3DayEmail({
          user: subscription.user,
          plan: subscription.plan,
          subscription,
        });

        await prisma.subscription.update({
          where: {
            id: subscription.id,
          },
          data: {
            renewal3DaySent: true,
          },
        });

        console.log(
          `3-day renewal email sent for subscription ${subscription.id}`
        );
      }

      /*
       * RENEWAL DAY
       */
      if (
        daysUntilRenewal === 0 &&
        !subscription.renewalDaySent
      ) {
        await sendRenewalDayEmail({
          user: subscription.user,
          plan: subscription.plan,
          subscription,
        });

        await prisma.subscription.update({
          where: {
            id: subscription.id,
          },
          data: {
            renewalDaySent: true,
          },
        });

        console.log(
          `Renewal-day email sent for subscription ${subscription.id}`
        );
      }
    }
  } catch (error) {
    console.error(
      "Renewal reminder service error:",
      error
    );
  }
};

module.exports = {
  checkRenewalReminders,
};