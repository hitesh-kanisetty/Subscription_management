
const express = require("express");
const { generalLimiter } = require("../middleware/rateLimiter");
const {
  requireAuth,
  requireAdmin,
} = require("../middleware/authMiddleware");

const {
  getAdminBilling,
  getAdminFinancialAnalytics,
  getMyPayments,
  exportAdminBilling,
  exportAdminBillingPdf,
  exportAdminFinancialAnalytics,
  exportAdminFinancialAnalyticsPdf,
} = require("../controllers/paymentsController");

const {
  createRefundRequest,
  getSupportRefundRequests,
  updateSupportRefundRequest,
  decideRefundRequest,
  getAdminRefundRequests,
} = require("../controllers/refundsController");

const router = express.Router();

// Admin billing
router.get(
  "/admin/billing/export",
  generalLimiter,
  requireAdmin,
  exportAdminBilling
);

router.get(
  "/admin/billing/export/pdf",
  generalLimiter,
  requireAdmin,
  exportAdminBillingPdf
);

router.get(
  "/admin/billing",
  generalLimiter,
  requireAdmin,
  getAdminBilling
);

// Admin refunds
router.patch(
  "/admin/refunds/:refundId/decision",
  generalLimiter,
  decideRefundRequest
);

router.get(
  "/admin/refunds",
  generalLimiter,
  getAdminRefundRequests
);

// Admin financial analytics
router.get(
  "/admin/financial-analytics/export",
  generalLimiter,
  requireAdmin,
  exportAdminFinancialAnalytics
);

router.get(
  "/admin/financial-analytics/export/pdf",
  generalLimiter,
  requireAdmin,
  exportAdminFinancialAnalyticsPdf
);

router.get(
  "/admin/financial-analytics",
  generalLimiter,
  requireAdmin,
  getAdminFinancialAnalytics
);

// Customer payment history
router.get(
  "/payments",
  generalLimiter,
  requireAuth,
  getMyPayments
);

// Refund requests
router.post(
  "/refunds/request/:paymentId",
  generalLimiter,
  createRefundRequest
);

// Support refund management
router.get(
  "/support/refunds",
  generalLimiter,
  getSupportRefundRequests
);

router.patch(
  "/support/refunds/:refundId",
  generalLimiter,
  updateSupportRefundRequest
);

module.exports = router;
