const express = require("express");

const {
  getMySubscription,
  previewUpgrade,
  upgradeSubscription,
  getAdminDashboard,
} = require("../controllers/subscriptionController");

const router = express.Router();

router.get("/subscription", getMySubscription);

router.get(
  "/subscription/upgrade/:id/preview",
  previewUpgrade
);

router.post(
  "/subscription/upgrade/:id",
  upgradeSubscription
);

// Admin dashboard
router.get(
  "/admin/dashboard",
  getAdminDashboard
);

module.exports = router;