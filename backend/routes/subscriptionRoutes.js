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

router.get("/admin/dashboard", getAdminDashboard);

router.get(
  "/admin/subscriptions/export",
  exportAdminSubscriptions
);

router.get(
  "/admin/subscriptions/export/pdf",
  exportAdminSubscriptionsPdf
);

router.get(
  "/admin/subscriptions",
 
  getAdminSubscriptions
);

router.get(
  "/admin/renewals/export",
  exportAdminRenewals
);

router.get(
  "/admin/renewals/export/pdf",
  exportAdminRenewalsPdf
);

router.get("/admin/renewals", getAdminRenewals);


module.exports = router;
