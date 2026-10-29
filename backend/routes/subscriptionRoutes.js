const express = require("express");
const { generalLimiter } = require("../middleware/rateLimiter");

const {
  requireCustomer,
  requireAdmin,
} = require("../middleware/authMiddleware");

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

// CUSTOMER ROUTES
router.get("/subscription", generalLimiter, requireCustomer, getMySubscription);

router.get(
  "/subscription/upgrade/:id/preview",
  generalLimiter,
  requireCustomer,
  previewUpgrade,
);

router.get(
  "/subscription/invoice",
  generalLimiter,
  requireCustomer,
  getCustomerInvoice,
);

router.post(
  "/subscription/upgrade/:id",
  generalLimiter,
  requireCustomer,
  upgradeSubscription,
);

// ADMIN DASHBOARD
router.get("/admin/dashboard", generalLimiter, requireAdmin, getAdminDashboard);

// ADMIN SUBSCRIPTIONS
router.get(
  "/admin/subscriptions/export",
  generalLimiter,
  requireAdmin,
  exportAdminSubscriptions,
);

router.get(
  "/admin/subscriptions/export/pdf",
  generalLimiter,
  requireAdmin,
  exportAdminSubscriptionsPdf,
);

router.get(
  "/admin/subscriptions",
  generalLimiter,
  requireAdmin,
  getAdminSubscriptions,
);

// ADMIN RENEWALS
router.get(
  "/admin/renewals/export",
  generalLimiter,
  requireAdmin,
  exportAdminRenewals,
);

router.get(
  "/admin/renewals/export/pdf",
  generalLimiter,
  requireAdmin,
  exportAdminRenewalsPdf,
);

router.get("/admin/renewals", generalLimiter, requireAdmin, getAdminRenewals);

module.exports = router;
