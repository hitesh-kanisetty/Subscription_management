const express = require("express");
const { generalLimiter } = require("../middleware/rateLimiter");
const {
  getMySubscription,
  previewUpgrade,
  upgradeSubscription,
  getAdminDashboard,
  getAdminRenewals,
  exportAdminRenewals,
  exportAdminRenewalsPdf,
  getAdminSubscriptions,
  exportAdminSubscriptions,
  exportAdminSubscriptionsPdf,
} = require("../controllers/subscriptionController");
const { getCustomerInvoice } = require("../controllers/invoiceController");
const router = express.Router();

router.get("/subscription", generalLimiter, getMySubscription);

router.get(
  "/subscription/upgrade/:id/preview",
  generalLimiter,
  previewUpgrade
);

router.get(
  "/subscription/invoice",
  generalLimiter,
  getCustomerInvoice
);

router.post(
  "/subscription/upgrade/:id",
  generalLimiter,
  upgradeSubscription
);

router.get("/admin/dashboard", generalLimiter, getAdminDashboard);

router.get(
  "/admin/subscriptions/export",
  generalLimiter,
  exportAdminSubscriptions
);

router.get(
  "/admin/subscriptions/export/pdf",
  generalLimiter,
  exportAdminSubscriptionsPdf
);

router.get(
  "/admin/subscriptions",
  generalLimiter,
  getAdminSubscriptions
);

router.get(
  "/admin/renewals/export",
  generalLimiter,
  exportAdminRenewals
);

router.get(
  "/admin/renewals/export/pdf",
  generalLimiter,
  exportAdminRenewalsPdf
);

router.get("/admin/renewals", generalLimiter, getAdminRenewals);


module.exports = router;
