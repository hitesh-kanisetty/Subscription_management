const { PrismaClient } = require("../generated/prisma");

const prisma = new PrismaClient();


const createCoupon = async (req, res) => {
  try {
    // Check authentication
    if (!req.session.user) {
      return res.status(401).json({
        message: "Not authenticated",
      });
    }

    // Check admin access
    if (req.session.user.role !== "ADMIN") {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    const {
      code,
      description,
      discountType,
      discountValue,
      validFrom,
      validUntil,
      usageLimit,
      minimumAmount,
      targetType,
    } = req.body;

    // Validate required fields
    if (
      !code ||
      !discountType ||
      discountValue === undefined ||
      !validFrom ||
      !validUntil
    ) {
      return res.status(400).json({
        message:
          "Code, discount type, discount value, valid from and valid until are required",
      });
    }

    // Validate discount type
    if (!["PERCENTAGE", "FIXED"].includes(discountType)) {
      return res.status(400).json({
        message: "Invalid discount type",
      });
    }

    const finalTargetType = targetType || "ALL";

    if (!["ALL", "FIRST_TIME", "SELECTED"].includes(finalTargetType)) {
      return res.status(400).json({
        message: "Invalid target type",
      });
    }


    if (finalTargetType === "SELECTED") {
      return res.status(400).json({
        message:
          "Selected customer coupons are not supported yet",
      });
    }

    const numericDiscountValue = Number(discountValue);

    if (
      !Number.isFinite(numericDiscountValue) ||
      numericDiscountValue <= 0
    ) {
      return res.status(400).json({
        message: "Discount value must be greater than zero",
      });
    }

    // Percentage cannot exceed 100
    if (
      discountType === "PERCENTAGE" &&
      numericDiscountValue > 100
    ) {
      return res.status(400).json({
        message: "Percentage discount cannot exceed 100",
      });
    }

    // Validate dates
    const startDate = new Date(validFrom);
    const endDate = new Date(validUntil);

    if (
      Number.isNaN(startDate.getTime()) ||
      Number.isNaN(endDate.getTime())
    ) {
      return res.status(400).json({
        message: "Invalid coupon dates",
      });
    }

    if (endDate <= startDate) {
      return res.status(400).json({
        message: "Valid until date must be after valid from date",
      });
    }

    let finalUsageLimit = null;

    if (
      usageLimit !== undefined &&
      usageLimit !== null &&
      usageLimit !== ""
    ) {
      finalUsageLimit = Number(usageLimit);

      if (
        !Number.isInteger(finalUsageLimit) ||
        finalUsageLimit <= 0
      ) {
        return res.status(400).json({
          message: "Usage limit must be a positive whole number",
        });
      }
    }

    // Validate minimum amount
    let finalMinimumAmount = null;

    if (
      minimumAmount !== undefined &&
      minimumAmount !== null &&
      minimumAmount !== ""
    ) {
      finalMinimumAmount = Number(minimumAmount);

      if (
        !Number.isFinite(finalMinimumAmount) ||
        finalMinimumAmount < 0
      ) {
        return res.status(400).json({
          message: "Minimum amount cannot be negative",
        });
      }
    }

    // Normalize coupon code
    const normalizedCode = code.trim().toUpperCase();

    if (!normalizedCode) {
      return res.status(400).json({
        message: "Coupon code cannot be empty",
      });
    }

    // Check duplicate coupon code
    const existingCoupon = await prisma.coupon.findUnique({
      where: {
        code: normalizedCode,
      },
    });

    if (existingCoupon) {
      return res.status(409).json({
        message: "A coupon with this code already exists",
      });
    }

    // Create coupon
    const coupon = await prisma.coupon.create({
      data: {
        code: normalizedCode,
        description: description?.trim() || null,

        discountType,
        discountValue: numericDiscountValue,

        validFrom: startDate,
        validUntil: endDate,

        usageLimit: finalUsageLimit,
        minimumAmount: finalMinimumAmount,

        targetType: finalTargetType,

        isActive: true,
      },
    });


    await prisma.auditLog.create({
      data: {
        userId: req.session.user.id,
        action: "CREATE",
        module: "Coupons",
        description: `Created coupon "${coupon.code}"`,
      },
    });

    return res.status(201).json({
      message: "Coupon created successfully",
      coupon,
    });
  } catch (error) {
    console.error("Create coupon error:", error);

    return res.status(500).json({
      message: "Something went wrong. Please try again.",
    });
  }
};



const getCoupons = async (req, res) => {
  try {
    // Check authentication
    if (!req.session.user) {
      return res.status(401).json({
        message: "Not authenticated",
      });
    }

    // Check admin access
    if (req.session.user.role !== "ADMIN") {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    const {
      search = "",
      status = "",
    } = req.query;

    const where = {};

    // Search by coupon code or description
    if (search.trim()) {
      where.OR = [
        {
          code: {
            contains: search.trim(),
            mode: "insensitive",
          },
        },
        {
          description: {
            contains: search.trim(),
            mode: "insensitive",
          },
        },
      ];
    }

    // Status filter
    if (status === "ACTIVE") {
      where.isActive = true;
    }

    if (status === "INACTIVE") {
      where.isActive = false;
    }

    const coupons = await prisma.coupon.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      message: "Coupons fetched successfully",
      coupons,
    });
  } catch (error) {
    console.error("Get coupons error:", error);

    return res.status(500).json({
      message: "Something went wrong. Please try again.",
    });
  }
};



const getCouponById = async (req, res) => {
  try {
    // Check authentication
    if (!req.session.user) {
      return res.status(401).json({
        message: "Not authenticated",
      });
    }

    // Check admin access
    if (req.session.user.role !== "ADMIN") {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    const couponId = Number(req.params.id);

    if (!Number.isInteger(couponId)) {
      return res.status(400).json({
        message: "Invalid coupon ID",
      });
    }

    const coupon = await prisma.coupon.findUnique({
      where: {
        id: couponId,
      },
      include: {
        _count: {
          select: {
            usages: true,
          },
        },
      },
    });

    if (!coupon) {
      return res.status(404).json({
        message: "Coupon not found",
      });
    }

    return res.status(200).json({
      message: "Coupon fetched successfully",
      coupon,
    });
  } catch (error) {
    console.error("Get coupon error:", error);

    return res.status(500).json({
      message: "Something went wrong. Please try again.",
    });
  }
};


/*
==================================================
UPDATE COUPON
==================================================
*/
const updateCoupon = async (req, res) => {
  try {
    // Check authentication
    if (!req.session.user) {
      return res.status(401).json({
        message: "Not authenticated",
      });
    }

    // Check admin access
    if (req.session.user.role !== "ADMIN") {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    const couponId = Number(req.params.id);

    if (!Number.isInteger(couponId)) {
      return res.status(400).json({
        message: "Invalid coupon ID",
      });
    }

    const existingCoupon = await prisma.coupon.findUnique({
      where: {
        id: couponId,
      },
    });

    if (!existingCoupon) {
      return res.status(404).json({
        message: "Coupon not found",
      });
    }

    const {
      code,
      description,
      discountType,
      discountValue,
      validFrom,
      validUntil,
      usageLimit,
      minimumAmount,
      targetType,
      isActive,
    } = req.body;

    // Validate required fields
    if (
      !code ||
      !discountType ||
      discountValue === undefined ||
      !validFrom ||
      !validUntil
    ) {
      return res.status(400).json({
        message:
          "Code, discount type, discount value, valid from and valid until are required",
      });
    }

    // Validate discount type
    if (!["PERCENTAGE", "FIXED"].includes(discountType)) {
      return res.status(400).json({
        message: "Invalid discount type",
      });
    }

    // Validate target type
    const finalTargetType =
      targetType || existingCoupon.targetType;

    if (!["ALL", "FIRST_TIME", "SELECTED"].includes(finalTargetType)) {
      return res.status(400).json({
        message: "Invalid target type",
      });
    }

    if (finalTargetType === "SELECTED") {
      return res.status(400).json({
        message:
          "Selected customer coupons are not supported yet",
      });
    }

    // Validate discount value
    const numericDiscountValue = Number(discountValue);

    if (
      !Number.isFinite(numericDiscountValue) ||
      numericDiscountValue <= 0
    ) {
      return res.status(400).json({
        message: "Discount value must be greater than zero",
      });
    }

    if (
      discountType === "PERCENTAGE" &&
      numericDiscountValue > 100
    ) {
      return res.status(400).json({
        message: "Percentage discount cannot exceed 100",
      });
    }

    // Validate dates
    const startDate = new Date(validFrom);
    const endDate = new Date(validUntil);

    if (
      Number.isNaN(startDate.getTime()) ||
      Number.isNaN(endDate.getTime())
    ) {
      return res.status(400).json({
        message: "Invalid coupon dates",
      });
    }

    if (endDate <= startDate) {
      return res.status(400).json({
        message: "Valid until date must be after valid from date",
      });
    }

    // Validate usage limit
    let finalUsageLimit = null;

    if (
      usageLimit !== undefined &&
      usageLimit !== null &&
      usageLimit !== ""
    ) {
      finalUsageLimit = Number(usageLimit);

      if (
        !Number.isInteger(finalUsageLimit) ||
        finalUsageLimit <= 0
      ) {
        return res.status(400).json({
          message: "Usage limit must be a positive whole number",
        });
      }

      // Do not allow lowering the limit below current usage
      if (finalUsageLimit < existingCoupon.usedCount) {
        return res.status(400).json({
          message:
            "Usage limit cannot be lower than the current usage count",
        });
      }
    }

    // Validate minimum amount
    let finalMinimumAmount = null;

    if (
      minimumAmount !== undefined &&
      minimumAmount !== null &&
      minimumAmount !== ""
    ) {
      finalMinimumAmount = Number(minimumAmount);

      if (
        !Number.isFinite(finalMinimumAmount) ||
        finalMinimumAmount < 0
      ) {
        return res.status(400).json({
          message: "Minimum amount cannot be negative",
        });
      }
    }

    const normalizedCode = code.trim().toUpperCase();

    if (!normalizedCode) {
      return res.status(400).json({
        message: "Coupon code cannot be empty",
      });
    }

    // Check duplicate code
    const duplicateCoupon = await prisma.coupon.findFirst({
      where: {
        code: normalizedCode,
        NOT: {
          id: couponId,
        },
      },
    });

    if (duplicateCoupon) {
      return res.status(409).json({
        message: "A coupon with this code already exists",
      });
    }

    const updatedCoupon = await prisma.coupon.update({
      where: {
        id: couponId,
      },
      data: {
        code: normalizedCode,
        description: description?.trim() || null,

        discountType,
        discountValue: numericDiscountValue,

        validFrom: startDate,
        validUntil: endDate,

        usageLimit: finalUsageLimit,
        minimumAmount: finalMinimumAmount,

        targetType: finalTargetType,

        isActive: Boolean(isActive),
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: req.session.user.id,
        action: "UPDATE",
        module: "Coupons",
        description: `Updated coupon "${updatedCoupon.code}"`,
      },
    });

    return res.status(200).json({
      message: "Coupon updated successfully",
      coupon: updatedCoupon,
    });
  } catch (error) {
    console.error("Update coupon error:", error);

    return res.status(500).json({
      message: "Something went wrong. Please try again.",
    });
  }
};


/*
==================================================
TOGGLE COUPON STATUS
==================================================
*/
const toggleCouponStatus = async (req, res) => {
  try {
    // Check authentication
    if (!req.session.user) {
      return res.status(401).json({
        message: "Not authenticated",
      });
    }

    // Check admin access
    if (req.session.user.role !== "ADMIN") {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    const couponId = Number(req.params.id);

    if (!Number.isInteger(couponId)) {
      return res.status(400).json({
        message: "Invalid coupon ID",
      });
    }

    const existingCoupon = await prisma.coupon.findUnique({
      where: {
        id: couponId,
      },
    });

    if (!existingCoupon) {
      return res.status(404).json({
        message: "Coupon not found",
      });
    }

    const updatedCoupon = await prisma.coupon.update({
      where: {
        id: couponId,
      },
      data: {
        isActive: !existingCoupon.isActive,
        updatedAt: new Date(),
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: req.session.user.id,
        action: updatedCoupon.isActive
          ? "ACTIVATE"
          : "DEACTIVATE",
        module: "Coupons",
        description: `${
          updatedCoupon.isActive
            ? "Activated"
            : "Deactivated"
        } coupon "${updatedCoupon.code}"`,
      },
    });

    return res.status(200).json({
      message: updatedCoupon.isActive
        ? "Coupon activated successfully"
        : "Coupon deactivated successfully",
      coupon: updatedCoupon,
    });
  } catch (error) {
    console.error("Toggle coupon status error:", error);

    return res.status(500).json({
      message: "Something went wrong. Please try again.",
    });
  }
};
const validateCoupon = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({
        message: "Not authenticated",
      });
    }

    if (req.session.user.role !== "CUSTOMER") {
      return res.status(403).json({
        message: "Only customers can use coupons",
      });
    }

    const { code, planId } = req.body;

    if (!code || !code.trim()) {
      return res.status(400).json({
        message: "Coupon code is required",
      });
    }

    const numericPlanId = Number(planId);

    if (!Number.isInteger(numericPlanId)) {
      return res.status(400).json({
        message: "Invalid plan ID",
      });
    }

    const couponCode = code.trim().toUpperCase();

    const coupon = await prisma.coupon.findUnique({
      where: {
        code: couponCode,
      },
    });

    if (!coupon) {
      return res.status(404).json({
        message: "Invalid coupon code",
      });
    }

    if (!coupon.isActive) {
      return res.status(400).json({
        message: "This coupon is inactive",
      });
    }

    const now = new Date();

    if (now < coupon.validFrom) {
      return res.status(400).json({
        message: "This coupon is not active yet",
      });
    }

    if (now > coupon.validUntil) {
      return res.status(400).json({
        message: "This coupon has expired",
      });
    }

    if (
      coupon.usageLimit !== null &&
      coupon.usedCount >= coupon.usageLimit
    ) {
      return res.status(400).json({
        message: "This coupon has reached its usage limit",
      });
    }

    const plan = await prisma.plan.findUnique({
      where: {
        id: numericPlanId,
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

    const planAmount = Number(plan.price);

    if (
      coupon.minimumAmount !== null &&
      planAmount < Number(coupon.minimumAmount)
    ) {
      return res.status(400).json({
        message: `Minimum purchase amount is ₹${Number(
          coupon.minimumAmount
        ).toLocaleString("en-IN")}`,
      });
    }

    // FIRST_TIME coupon validation
    if (coupon.targetType === "FIRST_TIME") {
      const [previousSubscription, previousPayment] =
        await Promise.all([
          prisma.subscription.findFirst({
            where: {
              userId: req.session.user.id,
            },
            select: {
              id: true,
            },
          }),

          prisma.payment.findFirst({
            where: {
              subscription: {
                userId: req.session.user.id,
              },
            },
            select: {
              id: true,
            },
          }),
        ]);

      if (previousSubscription || previousPayment) {
        return res.status(400).json({
          message: "This coupon is only available to first-time customers",
        });
      }
    }

    let discountAmount = 0;

    if (coupon.discountType === "PERCENTAGE") {
      discountAmount =
        planAmount * (Number(coupon.discountValue) / 100);
    } else if (coupon.discountType === "FIXED") {
      discountAmount = Number(coupon.discountValue);
    }

    // Never allow discount to exceed plan price
    discountAmount = Math.min(discountAmount, planAmount);

    discountAmount = Number(discountAmount.toFixed(2));

    const finalAmount = Number(
      Math.max(0, planAmount - discountAmount).toFixed(2)
    );

    return res.status(200).json({
      valid: true,

      coupon: {
        id: coupon.id,
        code: coupon.code,
        description: coupon.description,
        discountType: coupon.discountType,
        discountValue: Number(coupon.discountValue),
        targetType: coupon.targetType,
      },

      plan: {
        id: plan.id,
        name: plan.name,
        price: planAmount,
        billingPeriod: plan.billingPeriod,
      },

      originalAmount: planAmount,
      discountAmount,
      finalAmount,
    });
  } catch (error) {
    console.error("Validate coupon error:", error);

    return res.status(500).json({
      message: "Unable to validate coupon",
    });
  }
};
const getAvailableCoupons = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({
        message: "Not authenticated",
      });
    }

    if (req.session.user.role !== "CUSTOMER") {
      return res.status(403).json({
        message: "Only customers can view available coupons",
      });
    }

    const planId = Number(req.query.planId);

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

    const now = new Date();

    const coupons = await prisma.coupon.findMany({
      where: {
        isActive: true,

        validFrom: {
          lte: now,
        },

        validUntil: {
          gte: now,
        },

      },

      orderBy: {
        createdAt: "desc",
      },
    });

    const planAmount = Number(plan.price);

    const availableCoupons = [];

    for (const coupon of coupons) {
      
      if (
        coupon.usageLimit !== null &&
        coupon.usedCount >= coupon.usageLimit
      ) {
        continue;
      }

      // Minimum purchase
      if (
        coupon.minimumAmount !== null &&
        planAmount < Number(coupon.minimumAmount)
      ) {
        continue;
      }

      // FIRST_TIME eligibility
      if (coupon.targetType === "FIRST_TIME") {
        const [previousSubscription, previousPayment] =
          await Promise.all([
            prisma.subscription.findFirst({
              where: {
                userId: req.session.user.id,
              },
              select: {
                id: true,
              },
            }),

            prisma.payment.findFirst({
              where: {
                subscription: {
                  userId: req.session.user.id,
                },
              },
              select: {
                id: true,
              },
            }),
          ]);

        if (previousSubscription || previousPayment) {
          continue;
        }
      }

      // SELECTED is not supported yet
      if (coupon.targetType === "SELECTED") {
        continue;
      }

      let discountAmount = 0;

      if (coupon.discountType === "PERCENTAGE") {
        discountAmount =
          planAmount *
          (Number(coupon.discountValue) / 100);
      } else {
        discountAmount = Number(coupon.discountValue);
      }

      discountAmount = Math.min(
        discountAmount,
        planAmount
      );

      const finalAmount = Math.max(
        0,
        planAmount - discountAmount
      );

      availableCoupons.push({
        id: coupon.id,
        code: coupon.code,
        description: coupon.description,
        discountType: coupon.discountType,
        discountValue: Number(coupon.discountValue),
        discountAmount,
        finalAmount,
        minimumAmount:
          coupon.minimumAmount !== null
            ? Number(coupon.minimumAmount)
            : null,
        validUntil: coupon.validUntil,

        discountLabel:
          coupon.discountType === "PERCENTAGE"
            ? `${Number(coupon.discountValue)}% OFF`
            : `₹${Number(
                coupon.discountValue
              ).toLocaleString("en-IN")} OFF`,
      });
    }

    return res.status(200).json({
      coupons: availableCoupons,
    });
  } catch (error) {
    console.error(
      "Get available coupons error:",
      error
    );

    return res.status(500).json({
      message: "Unable to fetch available coupons",
    });
  }
};
module.exports = {
  createCoupon,
  getCoupons,
  getCouponById,
  updateCoupon,
  toggleCouponStatus,
  validateCoupon,
  getAvailableCoupons,
};