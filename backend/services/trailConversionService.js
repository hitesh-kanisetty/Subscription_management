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
          coupon: true,
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

      const planAmount =
  Number(subscription.plan.price);

let coupon = subscription.coupon;

let discountAmount = 0;
let finalAmount = planAmount;

/*
 * FIRST-TIME CUSTOMER AUTO COUPON
 *
 * New customers get a 3-day trial.
 * If no coupon was attached during signup,
 * automatically find the active FIRST_TIME coupon
 * when the trial converts to a paid subscription.
 *
 * This does NOT affect upgrade coupons because
 * this code runs only inside trial conversion.
 */
if (!coupon) {
  const firstTimeCoupon =
    await prisma.coupon.findFirst({
      where: {
        isActive: true,
        targetType: "FIRST_TIME",
        validFrom: {
          lte: now,
        },
        validUntil: {
          gte: now,
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

  if (firstTimeCoupon) {
    const usageLimitValid =
      firstTimeCoupon.usageLimit === null ||
      firstTimeCoupon.usedCount <
        firstTimeCoupon.usageLimit;

    const minimumAmountValid =
      firstTimeCoupon.minimumAmount === null ||
      planAmount >=
        Number(firstTimeCoupon.minimumAmount);

    if (
      usageLimitValid &&
      minimumAmountValid
    ) {
      coupon = firstTimeCoupon;

      console.log(
        `Auto-applying first-time coupon ${coupon.code} for trial conversion of subscription ${subscription.id}`
      );
    }
  }
}

      /*
       * Validate the coupon again at the moment
       * of the first automatic payment.
       *
       * The coupon may have expired or reached its
       * usage limit during the 3-day trial.
       */
      if (coupon) {
        const couponValid =
          coupon.isActive &&
          now >= new Date(coupon.validFrom) &&
          now <= new Date(coupon.validUntil) &&
          (
            coupon.usageLimit === null ||
            coupon.usedCount < coupon.usageLimit
          );

        const minimumAmountValid =
          coupon.minimumAmount === null ||
          planAmount >= Number(coupon.minimumAmount);

        const targetValid =
          coupon.targetType === "ALL" ||
          coupon.targetType === "FIRST_TIME";

        if (
          !couponValid ||
          !minimumAmountValid ||
          !targetValid
        ) {
          console.log(
            `Coupon ${coupon.code} is no longer valid for trial conversion.`
          );

          coupon = null;
        }
      }

      /*
       * Calculate the discount.
       */
      if (coupon) {
        if (
          coupon.discountType ===
          "PERCENTAGE"
        ) {
          discountAmount =
            planAmount *
            (Number(coupon.discountValue) / 100);
        } else if (
          coupon.discountType === "FIXED"
        ) {
          discountAmount =
            Number(coupon.discountValue);
        }

        /*
         * Never allow the discount to exceed
         * the plan price.
         */
        discountAmount = Math.min(
          discountAmount,
          planAmount
        );

        finalAmount = Math.max(
          0,
          planAmount - discountAmount
        );
      }

      const transactionId =
        `DEMO-TRIAL-${Date.now()}-${subscription.id}`;

      let payment;
      let couponUsage = null;

      await prisma.$transaction(async (tx) => {
        /*
         * If there is a coupon, consume it
         * atomically at the time of payment.
         */
        if (coupon) {
          if (
            coupon.usageLimit !== null
          ) {
            const usageUpdate =
              await tx.coupon.updateMany({
                where: {
                  id: coupon.id,
                  isActive: true,
                  usedCount: {
                    lt: coupon.usageLimit,
                  },
                },
                data: {
                  usedCount: {
                    increment: 1,
                  },
                },
              });

            /*
             * Another customer may have consumed
             * the last available coupon between
             * validation and this transaction.
             */
            if (usageUpdate.count === 0) {
              coupon = null;
              discountAmount = 0;
              finalAmount = planAmount;
            }
          } else {
            await tx.coupon.update({
              where: {
                id: coupon.id,
              },
              data: {
                usedCount: {
                  increment: 1,
                },
              },
            });
          }
        }

        /*
         * Create the first automatic payment.
         *
         * If coupon is valid:
         *     payment = discounted amount
         *
         * Otherwise:
         *     payment = normal plan price
         */
        payment = await tx.payment.create({
          data: {
            subscriptionId:
              subscription.id,

            amount: finalAmount,

            status: "PAID",

            paymentMethod: "DEMO",

            transactionId,

            paymentDate: now,
          },
        });

        /*
         * Record coupon usage only when the
         * coupon was actually consumed.
         */
        if (coupon) {
          couponUsage =
            await tx.couponUsage.create({
              data: {
                couponId: coupon.id,

                userId:
                  subscription.user.id,

                subscriptionId:
                  subscription.id,

                discountAmount,
              },
            });
        }

        /*
         * Convert trial into paid subscription.
         *
         * Clear couponId because the coupon has now
         * been consumed and is no longer pending.
         */
        await tx.subscription.update({
          where: {
            id: subscription.id,
          },
          data: {
            isTrial: false,

            renewalDate:
              nextRenewalDate,

            couponId: null,
          },
        });
      });

      /*
       * Customer payment notification
       */
      await createNotification({
        userId:
          subscription.user.id,

        type: "PAYMENT_SUCCESS",

        title:
          "Trial converted to paid subscription",

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

          ...(couponUsage && {
            couponCode:
              subscription.coupon?.code,

            discountAmount:
              `₹${discountAmount.toLocaleString(
                "en-IN"
              )}`,

            originalAmount:
              `₹${planAmount.toLocaleString(
                "en-IN"
              )}`,

            finalAmount:
              `₹${finalAmount.toLocaleString(
                "en-IN"
              )}`,
          }),
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
    renewalDate: nextRenewalDate,
  },
  payment,
  coupon: couponUsage
    ? subscription.coupon
    : null,
  discountAmount,
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

          title:
            "Trial converted to paid subscription",

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

            ...(couponUsage && {
              couponCode:
                subscription.coupon?.code,

              discountAmount:
                `₹${discountAmount.toLocaleString(
                  "en-IN"
                )}`,
            }),
          },
        });
      }

      console.log(
        `Trial converted to paid subscription: ${subscription.id}` +
          (couponUsage
            ? ` | Coupon applied: ${subscription.coupon?.code}`
            : "")
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