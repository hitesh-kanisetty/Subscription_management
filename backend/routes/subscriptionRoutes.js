const express = require("express");

const {
  getMySubscription,
  previewUpgrade,
  upgradeSubscription,
  getAdminDashboard,
  getAdminRenewals,
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

router.get(
  "/admin/dashboard",
  getAdminDashboard
);
router.get("/admin/renewals", getAdminRenewals);

module.exports = router;