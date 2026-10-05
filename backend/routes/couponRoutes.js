const express = require("express");

const {
  createCoupon,
  getCoupons,
  getCouponById,
  updateCoupon,
  toggleCouponStatus,
  validateCoupon,
  getAvailableCoupons
} = require("../controllers/couponController");

const router = express.Router();

router.post("/admin/coupons", createCoupon);

router.get("/admin/coupons", getCoupons);
router.get(
  "/coupons/available",
  getAvailableCoupons
);
router.get("/admin/coupons/:id", getCouponById);

router.put("/admin/coupons/:id", updateCoupon);

router.patch("/admin/coupons/:id/status", toggleCouponStatus);

router.post("/coupons/validate", validateCoupon);

module.exports = router;