const { PrismaClient } = require("../generated/prisma");
const PDFDocument = require("pdfkit");

const path = require("path");
const fs = require("fs");
const { createNotification } = require("./notificationHelper");
const {
  sendSubscriptionEmail,
  sendSubscriptionUpgradeEmail,
} = require("../services/emailService");
const prisma = new PrismaClient();

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

    const renewalDate = new Date(subscription.renewalDate);

    const difference = renewalDate.getTime() - now.getTime();

    const daysUntilRenewal = Math.ceil(difference / (1000 * 60 * 60 * 24));

    const reminderWindow = isAdmin ? 7 : 30;

    if (daysUntilRenewal < 0 || daysUntilRenewal > reminderWindow) {
      return;
    }

    const formattedRenewalDate = renewalDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    const message = isAdmin
      ? `${customerName || "A customer"}'s ${plan.name} subscription renews on ${formattedRenewalDate}.`
      : `Your ${plan.name} subscription renews on ${formattedRenewalDate}.`;

    const existingNotification = await prisma.notification.findFirst({
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
      title: isAdmin ? "Upcoming subscription renewal" : "Upcoming renewal",
      message,
      details: {
        subscriptionId: subscription.id,
        customerId: subscription.userId,
        customerName,
        plan: plan.name,
        price: `₹${Number(plan.price).toLocaleString("en-IN")}`,
        billingPeriod: plan.billingPeriod,
        renewalDate: subscription.renewalDate,
        daysUntilRenewal,
      },
    });
  } catch (error) {
    console.error("Create renewal notification error:", error);
  }
};

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
      return res.status(400).json({
        message: "You already have an active subscription",
      });
    }

    const previousSubscription =
      await prisma.subscription.findFirst({
        where: {
          userId: req.session.user.id,
        },
        select: {
          id: true,
        },
      });

    const previousPayment = await prisma.payment.findFirst({
      where: {
        subscription: {
          userId: req.session.user.id,
        },
      },
      select: {
        id: true,
      },
    });

    const isTrial =
      !previousSubscription && !previousPayment;

    /*
     * Coupon handling
     */
    const couponCode =
      typeof req.body?.couponCode === "string"
        ? req.body.couponCode.trim().toUpperCase()
        : "";

    let coupon = null;
    let discountAmount = 0;
    let finalAmount = Number(plan.price);

    if (couponCode) {
      coupon = await prisma.coupon.findUnique({
        where: {
          code: couponCode,
        },
      });

      if (!coupon) {
        return res.status(400).json({
          message: "Invalid coupon code",
        });
      }

      if (!coupon.isActive) {
        return res.status(400).json({
          message: "This coupon is inactive",
        });
      }

      const now = new Date();

      if (
        now < new Date(coupon.validFrom) ||
        now > new Date(coupon.validUntil)
      ) {
        return res.status(400).json({
          message:
            "This coupon has expired or is not yet active",
        });
      }

      if (
        coupon.usageLimit !== null &&
        coupon.usedCount >= coupon.usageLimit
      ) {
        return res.status(400).json({
          message:
            "This coupon has reached its usage limit",
        });
      }

      const planAmount = Number(plan.price);

      if (
        coupon.minimumAmount !== null &&
        planAmount < Number(coupon.minimumAmount)
      ) {
        return res.status(400).json({
          message:
            `Minimum purchase amount for this coupon is ₹${Number(
              coupon.minimumAmount
            ).toLocaleString("en-IN")}`,
        });
      }

      
      if (coupon.targetType === "FIRST_TIME") {
        if (previousSubscription || previousPayment) {
          return res.status(400).json({
            message:
              "This coupon is only available for first-time customers",
          });
        }
      }

   
      if (coupon.targetType === "SELECTED") {
        return res.status(400).json({
          message:
            "This coupon is not available for this customer",
        });
      }

    
      if (coupon.discountType === "PERCENTAGE") {
        discountAmount =
          planAmount *
          (Number(coupon.discountValue) / 100);
      } else if (coupon.discountType === "FIXED") {
        discountAmount = Number(coupon.discountValue);
      }

     
      discountAmount = Math.min(
        discountAmount,
        planAmount
      );

      finalAmount = Math.max(
        0,
        planAmount - discountAmount
      );
    }

    const startDate = new Date();
    const renewalDate = new Date(startDate);

    if (isTrial) {
      renewalDate.setDate(
        renewalDate.getDate() + 3
      );
    } else if (plan.billingPeriod === "MONTHLY") {
      renewalDate.setMonth(
        renewalDate.getMonth() + 1
      );
    } else if (plan.billingPeriod === "YEARLY") {
      renewalDate.setFullYear(
        renewalDate.getFullYear() + 1
      );
    }

    const result = await prisma.$transaction(
      async (tx) => {
        /*
         * Create subscription.
         *
         * IMPORTANT:
         * If a coupon exists, we only SAVE its ID here.
         *
         * We do NOT:
         * - increment usedCount
         * - create CouponUsage
         *
         * because the coupon has not been consumed yet.
         *
         * For a first-time customer, the actual coupon
         * will be consumed when the 3-day trial converts
         * into the first paid subscription.
         */
        const subscription =
          await tx.subscription.create({
            data: {
              userId: req.session.user.id,
              planId: plan.id,
              couponId: coupon
                ? coupon.id
                : null,
              status: "ACTIVE",
              isTrial,
              startDate,
              renewalDate,
            },
          });

        /*
         * First-time customer:
         * create only the trial subscription.
         *
         * No payment yet.
         * No CouponUsage yet.
         * Coupon remains attached to subscription.
         */
        if (isTrial) {
          return {
            subscription,
            payment: null,
            couponUsage: null,
          };
        }

        /*
         * Existing customer paid subscription flow.
         *
         * This branch is normally reached when the customer
         * has previous subscription/payment history but no
         * active subscription.
         */
        const transactionId =
          `DEMO-${Date.now()}-${subscription.id}`;

        const payment =
          await tx.payment.create({
            data: {
              subscriptionId:
                subscription.id,

              amount: finalAmount,

              status: "PAID",

              paymentMethod: "DEMO",

              transactionId,

              paymentDate: startDate,
            },
          });

        /*
         * For a normal paid subscription, the coupon is
         * consumed immediately.
         */
        let couponUsage = null;

        if (coupon) {
          /*
           * Re-check usage limit inside the transaction.
           */
          if (coupon.usageLimit !== null) {
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

            if (usageUpdate.count === 0) {
              throw new Error(
                "COUPON_USAGE_LIMIT_REACHED"
              );
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

          couponUsage =
            await tx.couponUsage.create({
              data: {
                couponId: coupon.id,
                userId: req.session.user.id,
                subscriptionId:
                  subscription.id,
                discountAmount,
              },
            });
        }

        return {
          subscription,
          payment,
          couponUsage,
        };
      }
    );

    /*
     * Sends the appropriate email depending on isTrial.
     */
    await sendSubscriptionEmail({
      user: {
        name: req.session.user.name,
        email: req.session.user.email,
      },
      plan,
      subscription:
        result.subscription,
    });

    /*
     * Payment notification only for paid subscriptions.
     */
    if (!isTrial && result.payment) {
      await createNotification({
        userId: req.session.user.id,
        type: "PAYMENT_SUCCESS",
        title: "Payment successful",
        message:
          `Your payment of ₹${Number(
            result.payment.amount
          ).toLocaleString("en-IN")} was successful.`,
        details: {
          amount:
            `₹${Number(
              result.payment.amount
            ).toLocaleString("en-IN")}`,
          plan: plan.name,
          paymentMethod:
            result.payment.paymentMethod,
          transactionId:
            result.payment.transactionId,
          paymentDate:
            result.payment.paymentDate,

          ...(coupon && {
            couponCode: coupon.code,
            discountAmount:
              `₹${discountAmount.toLocaleString(
                "en-IN"
              )}`,
          }),
        },
      });
    }

    /*
     * Subscription notification for both trial
     * and paid subscriptions.
     */
    await createNotification({
      userId: req.session.user.id,
      type: "SUBSCRIPTION_ACTIVE",
      title: isTrial
        ? "Free trial started"
        : "Subscription active",
      message: isTrial
        ? `Your 3-day free trial for the ${plan.name} plan has started.`
        : `Your ${plan.name} subscription is now active.`,
      details: {
        plan: plan.name,

        price: isTrial
          ? "FREE"
          : `₹${Number(
              result.payment.amount
            ).toLocaleString("en-IN")}`,

        billingPeriod: isTrial
          ? "3-day trial"
          : plan.billingPeriod,

        status:
          result.subscription.status,

        startDate:
          result.subscription.startDate,

        renewalDate:
          result.subscription.renewalDate,

        ...(coupon && {
          couponCode: coupon.code,

          originalPrice:
            `₹${Number(
              plan.price
            ).toLocaleString("en-IN")}`,

          discountAmount:
            `₹${discountAmount.toLocaleString(
              "en-IN"
            )}`,

          finalPrice:
            `₹${Number(
              finalAmount
            ).toLocaleString("en-IN")}`,
        }),
      },
    });

    /*
     * Notify all admins.
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
        message: isTrial
          ? `A customer started a 3-day free trial for the ${plan.name} plan.`
          : `A customer subscribed to the ${plan.name} plan.`,
        details: {
          subscriptionId:
            result.subscription.id,

          customerId:
            req.session.user.id,

          plan: plan.name,

          price: isTrial
            ? "FREE"
            : `₹${Number(
                result.payment.amount
              ).toLocaleString("en-IN")}`,

          billingPeriod: isTrial
            ? "3-day trial"
            : plan.billingPeriod,

          status:
            result.subscription.status,

          startDate:
            result.subscription.startDate,

          renewalDate:
            result.subscription.renewalDate,

          ...(coupon && {
            couponCode: coupon.code,
            discountAmount:
              `₹${discountAmount.toLocaleString(
                "en-IN"
              )}`,
          }),
        },
      });

      /*
       * Admin payment notification only for
       * paid subscriptions.
       */
      if (!isTrial && result.payment) {
        await createNotification({
          userId: admin.id,
          type: "NEW_PAYMENT",
          title: "New payment received",
          message:
            `A payment of ₹${Number(
              result.payment.amount
            ).toLocaleString("en-IN")} was received for a new subscription.`,
          details: {
            paymentId:
              result.payment.id,

            subscriptionId:
              result.subscription.id,

            customerId:
              req.session.user.id,

            amount:
              `₹${Number(
                result.payment.amount
              ).toLocaleString("en-IN")}`,

            plan: plan.name,

            paymentMethod:
              result.payment.paymentMethod,

            transactionId:
              result.payment.transactionId,

            paymentDate:
              result.payment.paymentDate,

            ...(coupon && {
              couponCode: coupon.code,
              discountAmount:
                `₹${discountAmount.toLocaleString(
                  "en-IN"
                )}`,
            }),
          },
        });
      }
    }

    return res.status(201).json({
      message: isTrial
        ? "3-day free trial started successfully"
        : "Subscription created successfully",

      isTrial,

      subscription:
        result.subscription,

      payment:
        result.payment,

      coupon: coupon
        ? {
            code: coupon.code,
            discountType:
              coupon.discountType,
            discountValue:
              coupon.discountValue,
            discountAmount,
            originalAmount:
              Number(plan.price),
            finalAmount,
          }
        : null,

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

    if (
      error.message ===
      "COUPON_USAGE_LIMIT_REACHED"
    ) {
      return res.status(400).json({
        message:
          "This coupon has just reached its usage limit",
      });
    }

    return res.status(500).json({
      message:
        "Unable to create subscription",
    });
  }
};
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


    const couponCode =
      typeof req.query?.couponCode === "string"
        ? req.query.couponCode
            .trim()
            .toUpperCase()
        : "";

    let coupon = null;
    let discountAmount = 0;
    let finalAmount = roundedUpgradeAmount;

    if (couponCode) {
      coupon = await prisma.coupon.findUnique({
        where: {
          code: couponCode,
        },
      });

      if (!coupon) {
        return res.status(400).json({
          message: "Invalid coupon code",
        });
      }

      if (!coupon.isActive) {
        return res.status(400).json({
          message: "This coupon is inactive",
        });
      }

      if (
        now < new Date(coupon.validFrom) ||
        now > new Date(coupon.validUntil)
      ) {
        return res.status(400).json({
          message:
            "This coupon has expired or is not yet active",
        });
      }

      if (
        coupon.usageLimit !== null &&
        coupon.usedCount >=
          coupon.usageLimit
      ) {
        return res.status(400).json({
          message:
            "This coupon has reached its usage limit",
        });
      }

      // Existing customers cannot use
      // first-time-only coupons for upgrades.
      if (
        coupon.targetType === "FIRST_TIME"
      ) {
        return res.status(400).json({
          message:
            "This coupon is only available for first-time customers",
        });
      }

      if (
        coupon.targetType !== "ALL"
      ) {
        return res.status(400).json({
          message:
            "This coupon is not available for upgrades",
        });
      }

      // Minimum amount is checked against
      // the actual upgrade amount.
      if (
        coupon.minimumAmount !== null &&
        roundedUpgradeAmount <
          Number(coupon.minimumAmount)
      ) {
        return res.status(400).json({
          message:
            `Minimum upgrade amount for this coupon is ₹${Number(
              coupon.minimumAmount
            ).toLocaleString("en-IN")}`,
        });
      }

      if (
        coupon.discountType ===
        "PERCENTAGE"
      ) {
        discountAmount =
          roundedUpgradeAmount *
          (Number(coupon.discountValue) /
            100);
      } else if (
        coupon.discountType === "FIXED"
      ) {
        discountAmount = Number(
          coupon.discountValue
        );
      }

      discountAmount = Math.min(
        discountAmount,
        roundedUpgradeAmount
      );

      finalAmount = Math.max(
        0,
        roundedUpgradeAmount -
          discountAmount
      );

      discountAmount = Number(
        discountAmount.toFixed(2)
      );

      finalAmount = Number(
        finalAmount.toFixed(2)
      );
    }

    return res.status(200).json({
      message:
        "Upgrade amount calculated successfully",

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

        unusedCurrentValue: Number(
          unusedCurrentValue.toFixed(2)
        ),

        newPlanRemainingValue: Number(
          newPlanRemainingValue.toFixed(2)
        ),

        upgradeAmount:
          roundedUpgradeAmount,

        discountAmount,

        finalAmount,
      },

      coupon: coupon
        ? {
            code: coupon.code,
            discountType:
              coupon.discountType,
            discountValue:
              Number(coupon.discountValue),
          }
        : null,
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
        message:
          "Only customers can upgrade plans",
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
        message:
          "No active subscription found",
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

    const couponCode =
      typeof req.body?.couponCode === "string"
        ? req.body.couponCode
            .trim()
            .toUpperCase()
        : "";

    let coupon = null;
    let discountAmount = 0;
    let finalAmount =
      roundedUpgradeAmount;

    if (couponCode) {
      coupon = await prisma.coupon.findUnique({
        where: {
          code: couponCode,
        },
      });

      if (!coupon) {
        return res.status(400).json({
          message: "Invalid coupon code",
        });
      }

      if (!coupon.isActive) {
        return res.status(400).json({
          message: "This coupon is inactive",
        });
      }

      if (
        now < new Date(coupon.validFrom) ||
        now > new Date(coupon.validUntil)
      ) {
        return res.status(400).json({
          message:
            "This coupon has expired or is not yet active",
        });
      }

      if (
        coupon.usageLimit !== null &&
        coupon.usedCount >=
          coupon.usageLimit
      ) {
        return res.status(400).json({
          message:
            "This coupon has reached its usage limit",
        });
      }

      if (
        coupon.targetType === "FIRST_TIME"
      ) {
        return res.status(400).json({
          message:
            "This coupon is only available for first-time customers",
        });
      }

      if (
        coupon.targetType !== "ALL"
      ) {
        return res.status(400).json({
          message:
            "This coupon is not available for upgrades",
        });
      }

      if (
        coupon.minimumAmount !== null &&
        roundedUpgradeAmount <
          Number(coupon.minimumAmount)
      ) {
        return res.status(400).json({
          message:
            `Minimum upgrade amount for this coupon is ₹${Number(
              coupon.minimumAmount
            ).toLocaleString("en-IN")}`,
        });
      }

      if (
        coupon.discountType ===
        "PERCENTAGE"
      ) {
        discountAmount =
          roundedUpgradeAmount *
          (Number(coupon.discountValue) /
            100);
      } else if (
        coupon.discountType === "FIXED"
      ) {
        discountAmount = Number(
          coupon.discountValue
        );
      }

      discountAmount = Math.min(
        discountAmount,
        roundedUpgradeAmount
      );

      finalAmount = Math.max(
        0,
        roundedUpgradeAmount -
          discountAmount
      );

      discountAmount = Number(
        discountAmount.toFixed(2)
      );

      finalAmount = Number(
        finalAmount.toFixed(2)
      );
    }

    // =========================================
    // TRANSACTION
    // =========================================

    const result =
      await prisma.$transaction(
        async (tx) => {
          // Consume coupon atomically.
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

              if (usageUpdate.count === 0) {
                const error =
                  new Error(
                    "COUPON_USAGE_LIMIT_REACHED"
                  );

                error.code =
                  "COUPON_USAGE_LIMIT_REACHED";

                throw error;
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

          // Cancel current subscription.
          await tx.subscription.update({
            where: {
              id: currentSubscription.id,
            },
            data: {
              status: "CANCELLED",
            },
          });

          // Create upgraded subscription.
          const newSubscription =
            await tx.subscription.create({
              data: {
                userId:
                  req.session.user.id,
                planId: newPlan.id,
                couponId: coupon
                  ? coupon.id
                  : null,
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
                amount: finalAmount,
                status: "PAID",
                paymentMethod: "DEMO",
                transactionId,
                paymentDate: now,
              },
            });

          let couponUsage = null;

          if (coupon) {
            couponUsage =
              await tx.couponUsage.create({
                data: {
                  couponId: coupon.id,
                  userId:
                    req.session.user.id,
                  subscriptionId:
                    newSubscription.id,
                  discountAmount,
                },
              });
          }

          return {
            newSubscription,
            payment,
            couponUsage,
          };
        }
      );

  
    await sendSubscriptionUpgradeEmail({
  user: req.session.user,
  previousPlan: currentSubscription.plan,
  newPlan,
  payment: result.payment,
  subscription: result.newSubscription,
  coupon,
  discountAmount,
});

    await createNotification({
      userId: req.session.user.id,
      type: "PAYMENT_SUCCESS",
      title: "Upgrade payment successful",
      message:
        `Your upgrade payment of ₹${Number(
          result.payment.amount
        ).toLocaleString(
          "en-IN"
        )} was successful.`,
      details: {
        amount:
          `₹${Number(
            result.payment.amount
          ).toLocaleString("en-IN")}`,

        originalAmount:
          `₹${roundedUpgradeAmount.toLocaleString(
            "en-IN"
          )}`,

        ...(result.couponUsage && {
          couponCode: coupon.code,
          discountAmount:
            `₹${discountAmount.toLocaleString(
              "en-IN"
            )}`,
        }),

        plan: newPlan.name,
        paymentMethod:
          result.payment.paymentMethod,
        transactionId:
          result.payment.transactionId,
        paymentDate:
          result.payment.paymentDate,
      },
    });

    // =========================================
    // CUSTOMER SUBSCRIPTION NOTIFICATION
    // =========================================

    await createNotification({
      userId: req.session.user.id,
      type: "SUBSCRIPTION_UPDATED",
      title: "Subscription upgraded",
      message:
        `Your subscription has been upgraded to the ${newPlan.name} plan.`,
      details: {
        previousPlan:
          currentSubscription.plan.name,
        newPlan: newPlan.name,
        price:
          `₹${Number(
            newPlan.price
          ).toLocaleString("en-IN")}`,
        billingPeriod:
          newPlan.billingPeriod,
        status:
          result.newSubscription.status,
        startDate:
          result.newSubscription.startDate,
        renewalDate:
          result.newSubscription.renewalDate,

        ...(result.couponUsage && {
          couponCode: coupon.code,
          discountAmount:
            `₹${discountAmount.toLocaleString(
              "en-IN"
            )}`,
        }),
      },
    });

    // =========================================
    // ADMIN NOTIFICATIONS
    // =========================================

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
        type: "SUBSCRIPTION_UPGRADED",
        title: "Subscription upgraded",
        message:
          `A customer upgraded from ${currentSubscription.plan.name} to ${newPlan.name}.`,
        details: {
          subscriptionId:
            result.newSubscription.id,
          customerId:
            req.session.user.id,
          previousPlan:
            currentSubscription.plan.name,
          newPlan: newPlan.name,
          price:
            `₹${Number(
              newPlan.price
            ).toLocaleString("en-IN")}`,
          billingPeriod:
            newPlan.billingPeriod,
          status:
            result.newSubscription.status,
          startDate:
            result.newSubscription.startDate,
          renewalDate:
            result.newSubscription.renewalDate,

          ...(result.couponUsage && {
            couponCode: coupon.code,
            discountAmount:
              `₹${discountAmount.toLocaleString(
                "en-IN"
              )}`,
          }),
        },
      });

      await createNotification({
        userId: admin.id,
        type: "NEW_PAYMENT",
        title: "Upgrade payment received",
        message:
          `An upgrade payment of ₹${Number(
            result.payment.amount
          ).toLocaleString(
            "en-IN"
          )} was received.`,
        details: {
          paymentId:
            result.payment.id,
          subscriptionId:
            result.newSubscription.id,
          customerId:
            req.session.user.id,
          amount:
            `₹${Number(
              result.payment.amount
            ).toLocaleString("en-IN")}`,
          previousPlan:
            currentSubscription.plan.name,
          newPlan: newPlan.name,
          paymentMethod:
            result.payment.paymentMethod,
          transactionId:
            result.payment.transactionId,
          paymentDate:
            result.payment.paymentDate,

          ...(result.couponUsage && {
            couponCode: coupon.code,
            discountAmount:
              `₹${discountAmount.toLocaleString(
                "en-IN"
              )}`,
          }),
        },
      });
    }

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

      discountAmount,

      finalAmount,

      coupon: coupon
        ? {
            code: coupon.code,
            discountType:
              coupon.discountType,
            discountValue:
              Number(coupon.discountValue),
          }
        : null,

      renewalDate,
    });
  } catch (error) {
    console.error(
      "Upgrade subscription error:",
      error
    );

    if (
      error.code ===
      "COUPON_USAGE_LIMIT_REACHED"
    ) {
      return res.status(400).json({
        message:
          "This coupon has just reached its usage limit. Please try another coupon.",
      });
    }

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

    const subscription = await prisma.subscription.findFirst({
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
        user: {
          select: {
            id: true,
            name: true,
            email: true,
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

    /*
     * Customer renewal notification.
     * Generated only when renewal is
     * within the next 30 days.
     */
    await createRenewalNotificationIfNeeded({
      userId: req.session.user.id,
      subscription,
      plan: subscription.plan,
      customerName: req.session.user.name || null,
      isAdmin: false,
    });

    return res.status(200).json({
      message: "Subscription fetched successfully",
      subscription,
    });
  } catch (error) {
    console.error("Get my subscription error:", error);

    return res.status(500).json({
      message: "Something went wrong. Please try again.",
    });
  }
};

const getAdminDashboard = async (req, res) => {
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

    const now = new Date();

    const [
      totalCustomers,
      activeSubscriptions,
      revenueResult,
      pendingSupportRequests,
      recentSubscriptions,
      upcomingRenewals,
    ] = await Promise.all([
      prisma.user.count({
        where: {
          role: {
            name: "CUSTOMER",
          },
        },
      }),

      prisma.subscription.count({
        where: {
          status: "ACTIVE",
        },
      }),

      prisma.payment.aggregate({
        _sum: {
          amount: true,
        },
        where: {
          status: "PAID",
        },
      }),

      prisma.supportTicket.count({
        where: {
          status: {
            in: ["OPEN", "IN_PROGRESS"],
          },
        },
      }),

      prisma.subscription.findMany({
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
      }),

      prisma.subscription.findMany({
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
      }),
    ]);

    return res.status(200).json({
      message: "Admin dashboard data fetched successfully",

      stats: {
        totalCustomers,
        activeSubscriptions,
        revenue: Number(revenueResult._sum.amount || 0),
        pendingSupportRequests,
      },

      recentSubscriptions: recentSubscriptions.map((subscription) => ({
        id: subscription.id,

        customer: {
          id: subscription.user.id,
          name: subscription.user.name,
          email: subscription.user.email,
        },

        plan: {
          id: subscription.plan.id,
          name: subscription.plan.name,
          price: Number(subscription.plan.price),
          billingPeriod: subscription.plan.billingPeriod,
        },

        status: subscription.status,

        startDate: subscription.startDate,

        renewalDate: subscription.renewalDate,

        createdAt: subscription.createdAt,
      })),

      upcomingRenewals: upcomingRenewals.map((subscription) => ({
        id: subscription.id,

        customer: {
          id: subscription.user.id,
          name: subscription.user.name,
          email: subscription.user.email,
        },

        plan: {
          id: subscription.plan.id,
          name: subscription.plan.name,
          price: Number(subscription.plan.price),
          billingPeriod: subscription.plan.billingPeriod,
        },

        status: subscription.status,

        startDate: subscription.startDate,

        renewalDate: subscription.renewalDate,
      })),
    });
  } catch (error) {
    console.error("Get admin dashboard error:", error);

    return res.status(500).json({
      message: "Something went wrong. Please try again.",
    });
  }
};

const getAdminRenewals = async (req, res) => {
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

    // Pagination
    const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);

    const limit = Math.min(
      Math.max(Number.parseInt(req.query.limit, 10) || 5, 1),
      100,
    );

    const skip = (page - 1) * limit;

    // Search
    const search = req.query.search?.trim() || "";

    const now = new Date();

    // Base filter for upcoming active renewals
    const renewalWhere = {
      status: "ACTIVE",

      renewalDate: {
        gte: now,
      },
    };

    // Search by customer name, email, or plan name
    if (search) {
      renewalWhere.OR = [
        {
          user: {
            name: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
        {
          user: {
            email: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
        {
          plan: {
            name: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
      ];
    }

    // Get total number of matching renewals
    const totalRenewals = await prisma.subscription.count({
      where: renewalWhere,
    });

    // Get paginated renewals
    const renewals = await prisma.subscription.findMany({
      where: renewalWhere,

      orderBy: {
        renewalDate: "asc",
      },

      skip,
      take: limit,

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
     * Notifications are checked separately from
     * pagination so pagination does not hide
     * upcoming renewals from notification logic.
     */

    const notificationRenewals = await prisma.subscription.findMany({
      where: {
        status: "ACTIVE",

        renewalDate: {
          gte: now,
          lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        },
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

    const adminUsers = await prisma.user.findMany({
      where: {
        role: {
          name: "ADMIN",
        },
      },

      select: {
        id: true,
      },
    });

    for (const subscription of notificationRenewals) {
      for (const admin of adminUsers) {
        await createRenewalNotificationIfNeeded({
          userId: admin.id,
          subscription,
          plan: subscription.plan,
          customerName: subscription.user.name,
          isAdmin: true,
        });
      }
    }

    const totalPages = Math.ceil(totalRenewals / limit);

    return res.status(200).json({
      message: "Admin renewals data fetched successfully",

      renewals: renewals.map((subscription) => ({
        id: subscription.id,

        customer: {
          id: subscription.user.id,
          name: subscription.user.name,
          email: subscription.user.email,
        },

        plan: {
          id: subscription.plan.id,
          name: subscription.plan.name,
          price: Number(subscription.plan.price),
          billingPeriod: subscription.plan.billingPeriod,
        },

        status: subscription.status,

        startDate: subscription.startDate,

        renewalDate: subscription.renewalDate,
      })),

      pagination: {
        currentPage: page,
        totalPages,
        totalRenewals,
        limit,
      },
    });
  } catch (error) {
    console.error("Get admin renewals error:", error);

    return res.status(500).json({
      message: "Something went wrong. Please try again.",
    });
  }
};

const exportAdminRenewals = async (req, res) => {
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

    const search = req.query.search?.trim() || "";

    const now = new Date();

    // Same base logic as getAdminRenewals
    const renewalWhere = {
      status: "ACTIVE",
      renewalDate: {
        gte: now,
      },
    };

    // Same search logic as the existing renewals page
    if (search) {
      renewalWhere.OR = [
        {
          user: {
            name: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
        {
          user: {
            email: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
        {
          plan: {
            name: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
      ];
    }

    const renewals = await prisma.subscription.findMany({
      where: renewalWhere,

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

    const exportRenewals = renewals.map(
      (subscription) => ({
        ID: subscription.id,
        Customer:
          subscription.user?.name || "Unknown",
        Email:
          subscription.user?.email || "",
        Plan:
          subscription.plan?.name || "—",
        Amount:
          subscription.plan?.price != null
            ? `INR ${Number(
                subscription.plan.price
              ).toLocaleString("en-IN")}`
            : "—",
        "Start Date": subscription.startDate
          ? new Date(
              subscription.startDate
            ).toLocaleDateString("en-IN")
          : "—",
        "Renewal Date":
          subscription.renewalDate
            ? new Date(
                subscription.renewalDate
              ).toLocaleDateString("en-IN")
            : "—",
        Status:
          subscription.status || "ACTIVE",
      })
    );

    return res.status(200).json({
      renewals: exportRenewals,
    });
  } catch (error) {
    console.error(
      "Export admin renewals error:",
      error
    );

    return res.status(500).json({
      message: "Unable to export renewals",
    });
  }
};


const exportAdminRenewalsPdf = async (req, res) => {
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

    const search = req.query.search?.trim() || "";

    const now = new Date();

    // Same renewal logic as getAdminRenewals
    const renewalWhere = {
      status: "ACTIVE",
      renewalDate: {
        gte: now,
      },
    };

    if (search) {
      renewalWhere.OR = [
        {
          user: {
            name: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
        {
          user: {
            email: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
        {
          plan: {
            name: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
      ];
    }

    const renewals = await prisma.subscription.findMany({
      where: renewalWhere,

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

    const logoPath = path.join(
      __dirname,
      "../assets/subflow-logo.png"
    );

    if (!fs.existsSync(logoPath)) {
      return res.status(500).json({
        message: "Renewal report logo is missing.",
      });
    }

    const doc = new PDFDocument({
      size: "A4",
      layout: "landscape",
      margin: 0,
      autoFirstPage: true,
    });

    res.setHeader(
      "Content-Type",
      "application/pdf"
    );

    res.setHeader(
      "Content-Disposition",
      'attachment; filename="renewals-report.pdf"'
    );

    doc.pipe(res);

    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;

    const BLUE = "#2867df";
    const DARK = "#17191d";
    const TEXT = "#25272b";
    const MUTED = "#8a8f98";
    const BORDER = "#e1e3e6";

    // =========================
    // HELPERS
    // =========================

    const formatDate = (date) => {
      if (!date) return "—";

      return new Date(date).toLocaleDateString(
        "en-IN",
        {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }
      );
    };

    const formatAmount = (amount) => {
      if (
        amount === null ||
        amount === undefined
      ) {
        return "—";
      }

      return `INR ${Number(
        amount
      ).toLocaleString("en-IN")}`;
    };

    const getDaysUntilRenewal = (date) => {
      if (!date) return "—";

      const renewal = new Date(date);

      const difference =
        renewal.getTime() - now.getTime();

      return Math.max(
        0,
        Math.ceil(
          difference /
            (1000 * 60 * 60 * 24)
        )
      );
    };

    const drawFooter = () => {
      const footerY = pageHeight - 30;

      doc
        .font("Helvetica")
        .fontSize(7.5)
        .fillColor(MUTED)
        .text(
          `Total renewals: ${renewals.length}`,
          50,
          footerY,
          {
            width: 220,
            align: "left",
          }
        );

      doc
        .font("Helvetica")
        .fontSize(7.5)
        .fillColor(MUTED)
        .text(
          "SubFlow Renewal Management",
          pageWidth - 270,
          footerY,
          {
            width: 220,
            align: "right",
          }
        );
    };

    // =========================
    // HEADER
    // =========================

    doc.image(logoPath, 50, 30, {
      width: 60,
      height: 60,
    });

    doc
      .font("Helvetica-Bold")
      .fontSize(24)
      .fillColor(DARK)
      .text("SubFlow", 125, 31);

    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor(MUTED)
      .text(
        "Subscription Management Platform",
        126,
        59
      );

    doc
      .font("Helvetica-Bold")
      .fontSize(20)
      .fillColor(BLUE)
      .text(
        "RENEWAL REPORT",
        pageWidth - 350,
        32,
        {
          width: 300,
          align: "right",
        }
      );

    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor(MUTED)
      .text(
        `Generated: ${new Date().toLocaleDateString(
          "en-IN",
          {
            day: "2-digit",
            month: "short",
            year: "numeric",
          }
        )}`,
        pageWidth - 350,
        62,
        {
          width: 300,
          align: "right",
        }
      );

    // =========================
    // DIVIDER
    // =========================

    doc
      .moveTo(50, 100)
      .lineTo(pageWidth - 50, 100)
      .lineWidth(0.5)
      .strokeColor("#eef0f2")
      .stroke();

    // =========================
    // REPORT FILTERS
    // =========================

    doc
      .font("Helvetica-Bold")
      .fontSize(8)
      .fillColor(MUTED)
      .text(
        "REPORT FILTERS",
        50,
        124
      );

    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor(TEXT)
      .text(
        `Status: Active | Search: ${
          search || "All renewals"
        } | Date: Upcoming renewals`,
        50,
        141
      );

    // =========================
    // TABLE
    // =========================

    const tableX = 50;
    const tableTop = 166;

    // Total = 742pt.
    // A4 landscape = 842pt.
    // 50pt left + 50pt right = 742pt available.

    const columns = [
      {
        label: "ID",
        width: 40,
      },
      {
        label: "CUSTOMER",
        width: 170,
      },
      {
        label: "PLAN",
        width: 100,
      },
      {
        label: "AMOUNT",
        width: 100,
      },
      {
        label: "START",
        width: 90,
      },
      {
        label: "RENEWAL",
        width: 105,
      },
      {
        label: "DUE IN",
        width: 70,
      },
      {
        label: "STATUS",
        width: 67,
      },
    ];

    const tableWidth = columns.reduce(
      (total, column) =>
        total + column.width,
      0
    );

    const headerHeight = 30;
    const rowHeight = 34;

    let currentY = tableTop;

    const drawTableHeader = () => {
      let currentX = tableX;

      doc
        .rect(
          tableX,
          currentY,
          tableWidth,
          headerHeight
        )
        .fill(BLUE);

      columns.forEach((column) => {
        doc
          .font("Helvetica-Bold")
          .fontSize(7)
          .fillColor("#ffffff")
          .text(
            column.label,
            currentX + 8,
            currentY + 10,
            {
              width:
                column.width - 16,
            }
          );

        currentX += column.width;
      });

      currentY += headerHeight;
    };

    drawTableHeader();

    // =========================
    // ROWS
    // =========================

    renewals.forEach(
      (subscription, index) => {
        if (
          currentY + rowHeight >
          pageHeight - 45
        ) {
          drawFooter();

          doc.addPage();

          currentY = 45;

          drawTableHeader();
        }

        if (index % 2 === 0) {
          doc
            .rect(
              tableX,
              currentY,
              tableWidth,
              rowHeight
            )
            .fill("#fafafa");
        }

        const rowData = [
          subscription.id,
          subscription.user?.name ||
            "Unknown",
          subscription.plan?.name ||
            "—",
          formatAmount(
            subscription.plan?.price
          ),
          formatDate(
            subscription.startDate
          ),
          formatDate(
            subscription.renewalDate
          ),
          `${getDaysUntilRenewal(
            subscription.renewalDate
          )} days`,
          subscription.status ||
            "ACTIVE",
        ];

        let currentX = tableX;

        rowData.forEach(
          (value, columnIndex) => {
            const column =
              columns[columnIndex];

            doc
              .font("Helvetica")
              .fontSize(7.5)
              .fillColor(TEXT)
              .text(
                String(value),
                currentX + 8,
                currentY + 12,
                {
                  width:
                    column.width - 16,
                  height:
                    rowHeight - 10,
                  ellipsis: true,
                  lineBreak: false,
                }
              );

            currentX +=
              column.width;
          }
        );

        doc
          .moveTo(
            tableX,
            currentY + rowHeight
          )
          .lineTo(
            tableX + tableWidth,
            currentY + rowHeight
          )
          .lineWidth(0.5)
          .strokeColor(BORDER)
          .stroke();

        currentY += rowHeight;
      }
    );

    drawFooter();

    doc.end();
  } catch (error) {
    console.error(
      "Export admin renewals PDF error:",
      error
    );

    if (!res.headersSent) {
      return res.status(500).json({
        message:
          "Unable to generate renewal PDF",
      });
    }
  }
};
const getAdminSubscriptions = async (req, res) => {
  try {
    if (!req.session.user || req.session.user.role !== "ADMIN") {
      return res.status(403).json({
        message: "Admin access required",
      });
    }

    const page = Math.max(parseInt(req.query.page) || 1, 1);

    const limit = Math.min(
      Math.max(parseInt(req.query.limit) || 5, 1),
      100
    );

    const search = req.query.search?.trim() || "";
    const status = req.query.status?.trim() || "";
    const plan = req.query.plan?.trim() || "";

    const skip = (page - 1) * limit;

    const where = {};

    if (search) {
      where.user = {
        OR: [
          {
            name: {
              contains: search,
              mode: "insensitive",
            },
          },
          {
            email: {
              contains: search,
              mode: "insensitive",
            },
          },
        ],
      };
    }


    if (
      status &&
      ["ACTIVE", "CANCELLED", "EXPIRED"].includes(status)
    ) {
      where.status = status;
    }


    if (plan) {
      where.plan = {
        name: plan,
      };
    }

    const [
      total,
      subscriptions,
      activePlanCounts,
    ] = await Promise.all([
      prisma.subscription.count({
        where,
      }),

      prisma.subscription.findMany({
        where,
        skip,
        take: limit,
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
      }),


      prisma.subscription.groupBy({
        by: ["planId"],
        where: {
          status: "ACTIVE",
        },
        _count: {
          _all: true,
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);


    const planIds = activePlanCounts.map(
      (item) => item.planId
    );

    const plans = planIds.length
      ? await prisma.plan.findMany({
          where: {
            id: {
              in: planIds,
            },
          },
          select: {
            id: true,
            name: true,
          },
          orderBy: {
            name: "asc",
          },
        })
      : [];

    const activeMembersByPlan = plans.map((planItem) => {
      const countData = activePlanCounts.find(
        (item) => item.planId === planItem.id
      );

      return {
        planId: planItem.id,
        planName: planItem.name,
        activeMembers: countData?._count?._all || 0,
      };
    });

    return res.status(200).json({
      subscriptions,

      activeMembersByPlan,

      pagination: {
        page,
        limit,
        total,
        totalPages,
      },

      filters: {
        search,
        status,
        plan,
      },
    });
  } catch (error) {
    console.error(
      "Get admin subscriptions error:",
      error
    );

    return res.status(500).json({
      message: "Failed to fetch subscriptions",
    });
  }
};

const exportAdminSubscriptions = async (req, res) => {
  try {
    if (!req.session.user || req.session.user.role !== "ADMIN") {
      return res.status(403).json({
        message: "Admin access required",
      });
    }

    const search = req.query.search?.trim() || "";
    const status = req.query.status?.trim() || "";
    const plan = req.query.plan?.trim() || "";

    const where = {};

    // Same search logic as subscriptions page
    if (search) {
      where.user = {
        OR: [
          {
            name: {
              contains: search,
              mode: "insensitive",
            },
          },
          {
            email: {
              contains: search,
              mode: "insensitive",
            },
          },
        ],
      };
    }

    // Same status filter
    if (
      status &&
      ["ACTIVE", "CANCELLED", "EXPIRED"].includes(status)
    ) {
      where.status = status;
    }

    // Same plan filter
    if (plan) {
      where.plan = {
        name: plan,
      };
    }

    const subscriptions = await prisma.subscription.findMany({
      where,
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

    const exportSubscriptions = subscriptions.map(
      (subscription) => ({
        ID: subscription.id,
        Customer: subscription.user?.name || "Unknown",
        Email: subscription.user?.email || "",
        Plan: subscription.plan?.name || "",
        Billing: subscription.plan?.price
          ? `₹${Number(subscription.plan.price).toLocaleString("en-IN")}`
          : "",
        "Billing Period":
          subscription.plan?.billingPeriod || "",
        Status: subscription.status,
        Start: subscription.startDate
          ? new Date(subscription.startDate).toLocaleDateString(
              "en-IN",
            )
          : "",
        Renewal: subscription.renewalDate
          ? new Date(
              subscription.renewalDate,
            ).toLocaleDateString("en-IN")
          : "",
        Type: subscription.isTrial ? "Trial" : "Paid",
      }),
    );

    return res.status(200).json({
      subscriptions: exportSubscriptions,
    });
  } catch (error) {
    console.error(
      "Export admin subscriptions error:",
      error,
    );

    return res.status(500).json({
      message: "Unable to export subscriptions",
    });
  }
};


const exportAdminSubscriptionsPdf = async (req, res) => {
  try {
    if (!req.session.user || req.session.user.role !== "ADMIN") {
      return res.status(403).json({
        message: "Admin access required",
      });
    }

    const search = req.query.search?.trim() || "";
    const status = req.query.status?.trim() || "";
    const plan = req.query.plan?.trim() || "";

    const where = {};

    // =========================
    // SEARCH
    // =========================

    if (search) {
      where.user = {
        OR: [
          {
            name: {
              contains: search,
              mode: "insensitive",
            },
          },
          {
            email: {
              contains: search,
              mode: "insensitive",
            },
          },
        ],
      };
    }

    // =========================
    // STATUS FILTER
    // =========================

    if (
      status &&
      ["ACTIVE", "CANCELLED", "EXPIRED"].includes(status)
    ) {
      where.status = status;
    }

    // =========================
    // PLAN FILTER
    // =========================

    if (plan) {
      where.plan = {
        name: plan,
      };
    }

    // =========================
    // FETCH DATA
    // =========================

    const subscriptions = await prisma.subscription.findMany({
      where,
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

    // =========================
    // PDF SETUP
    // =========================

    const logoPath = path.join(
      __dirname,
      "../assets/subflow-logo.png",
    );

    if (!fs.existsSync(logoPath)) {
      return res.status(500).json({
        message: "Subscription report logo is missing.",
      });
    }

    const doc = new PDFDocument({
      size: "A4",
      layout: "landscape",
      margin: 0,
      autoFirstPage: true,
    });

    res.setHeader("Content-Type", "application/pdf");

    res.setHeader(
      "Content-Disposition",
      'attachment; filename="subscriptions-report.pdf"',
    );

    doc.pipe(res);

    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;

    // =========================
    // COLORS
    // =========================

    const BLUE = "#2867df";
    const DARK = "#17191d";
    const TEXT = "#25272b";
    const MUTED = "#8a8f98";
    const LIGHT = "#f7f8fa";
    const BORDER = "#e1e3e6";

    // =========================
    // HELPERS
    // =========================

    const formatDate = (date) => {
      if (!date) return "—";

      return new Date(date).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    };

    const formatAmount = (amount) => {
      if (amount === null || amount === undefined) {
        return "—";
      }

      return `INR ${Number(amount).toLocaleString("en-IN")}`;
    };

    const drawFooter = () => {
      const footerY = pageHeight - 30;

      doc
        .font("Helvetica")
        .fontSize(7.5)
        .fillColor("#8a8f98")
        .text(
          `Total subscriptions: ${subscriptions.length}`,
          50,
          footerY,
          {
            width: 220,
            align: "left",
          },
        );

      doc
        .font("Helvetica")
        .fontSize(7.5)
        .fillColor("#8a8f98")
        .text(
          "SubFlow Subscription Management",
          pageWidth - 270,
          footerY,
          {
            width: 220,
            align: "right",
          },
        );
    };

    // =========================
    // HEADER
    // =========================

    doc.image(logoPath, 50, 30, {
      width: 60,
      height: 60,
    });

    doc
      .font("Helvetica-Bold")
      .fontSize(24)
      .fillColor(DARK)
      .text("SubFlow", 125, 31);

    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor(MUTED)
      .text(
        "Subscription Management Platform",
        126,
        59,
      );

    // Report title — same position/style as Customers
    doc
      .font("Helvetica-Bold")
      .fontSize(20)
      .fillColor(BLUE)
      .text(
        "SUBSCRIPTION REPORT",
        pageWidth - 350,
        32,
        {
          width: 300,
          align: "right",
        },
      );

    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor(MUTED)
      .text(
        `Generated: ${new Date().toLocaleDateString(
          "en-IN",
          {
            day: "2-digit",
            month: "short",
            year: "numeric",
          },
        )}`,
        pageWidth - 350,
        62,
        {
          width: 300,
          align: "right",
        },
      );

    // =========================
    // HEADER DIVIDER
    // =========================

    doc
      .moveTo(50, 100)
      .lineTo(pageWidth - 50, 100)
      .lineWidth(0.5)
      .strokeColor("#eef0f2")
      .stroke();

    // =========================
    // REPORT FILTERS
    // =========================

    doc
      .font("Helvetica-Bold")
      .fontSize(8)
      .fillColor(MUTED)
      .text("REPORT FILTERS", 50, 124);

    const filterParts = [];

    filterParts.push(
      `Status: ${status || "All"}`,
    );

    filterParts.push(
      `Search: ${search || "All subscriptions"}`,
    );

    filterParts.push(
      `Plan: ${plan || "All plans"}`,
    );

    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor(TEXT)
      .text(
        filterParts.join(" | "),
        50,
        141,
      );

  
    const tableX = 50;
    const tableTop = 166;

    const columns = [
  {
    label: "ID",
    width: 40,
  },
  {
    label: "CUSTOMER",
    width: 150,
  },
  {
    label: "PLAN",
    width: 90,
  },
  {
    label: "BILLING",
    width: 90,
  },
  {
    label: "STATUS",
    width: 90,
  },
  {
    label: "START",
    width: 90,
  },
  {
    label: "RENEWAL",
    width: 110,
  },
  {
    label: "TYPE",
    width: 82,
  },
];

    const tableWidth = columns.reduce(
      (total, column) => total + column.width,
      0,
    );

    const headerHeight = 30;
    const rowHeight = 34;

    let currentY = tableTop;

    const drawTableHeader = () => {
      let currentX = tableX;

      doc
        .rect(
          tableX,
          currentY,
          tableWidth,
          headerHeight,
        )
        .fill(BLUE);

      columns.forEach((column) => {
        doc
          .font("Helvetica-Bold")
          .fontSize(7)
          .fillColor("#ffffff")
          .text(
            column.label,
            currentX + 8,
            currentY + 10,
            {
              width: column.width - 16,
              align: "left",
            },
          );

        currentX += column.width;
      });

      currentY += headerHeight;
    };

    drawTableHeader();

    // =========================
    // TABLE ROWS
    // =========================

    subscriptions.forEach((subscription, index) => {
  
      if (
        currentY + rowHeight >
        pageHeight - 45
      ) {
        drawFooter();

        doc.addPage();

        currentY = 45;

        drawTableHeader();
      }

      // Alternating row background
      if (index % 2 === 0) {
        doc
          .rect(
            tableX,
            currentY,
            tableWidth,
            rowHeight,
          )
          .fill("#fafafa");
      }

      let currentX = tableX;

      const rowData = [
        subscription.id,
        subscription.user?.name || "Unknown",
        subscription.plan?.name || "—",
        formatAmount(
          subscription.plan?.price,
        ),
        subscription.status || "—",
        formatDate(
          subscription.startDate,
        ),
        formatDate(
          subscription.renewalDate,
        ),
        subscription.isTrial
          ? "Trial"
          : "Paid",
      ];

      rowData.forEach((value, columnIndex) => {
        const column = columns[columnIndex];

        doc
          .font("Helvetica")
          .fontSize(7.5)
          .fillColor(TEXT)
          .text(
            String(value),
            currentX + 8,
            currentY + 12,
            {
              width: column.width - 16,
              height: rowHeight - 10,
              ellipsis: true,
              lineBreak: false,
            },
          );

        currentX += column.width;
      });

      
      doc
        .moveTo(
          tableX,
          currentY + rowHeight,
        )
        .lineTo(
          tableX + tableWidth,
          currentY + rowHeight,
        )
        .lineWidth(0.5)
        .strokeColor(BORDER)
        .stroke();

      currentY += rowHeight;
    });

   
    drawFooter();

    doc.end();
  } catch (error) {
    console.error(
      "Export admin subscriptions PDF error:",
      error,
    );

    if (!res.headersSent) {
      return res.status(500).json({
        message:
          "Unable to generate subscription PDF",
      });
    }
  }
};
module.exports = {
  subscribeToPlan,
  previewUpgrade,
  upgradeSubscription,
  getMySubscription,
  getAdminDashboard,
  exportAdminRenewals,
  exportAdminRenewalsPdf,
  getAdminRenewals,
  getAdminSubscriptions,
  exportAdminSubscriptions,
  exportAdminSubscriptionsPdf,
};
