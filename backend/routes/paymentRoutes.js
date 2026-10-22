const express = require("express");
const { generalLimiter } = require("../middleware/rateLimiter");
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


router.get("/admin/billing/export", generalLimiter, exportAdminBilling);

router.get(
  "/admin/billing/export/pdf",
  generalLimiter,
  exportAdminBillingPdf
);

router.get("/admin/billing", generalLimiter, getAdminBilling);

router.patch(
  "/admin/refunds/:refundId/decision",
  generalLimiter,
  decideRefundRequest
);

router.get("/admin/refunds", generalLimiter, getAdminRefundRequests);

router.get(
  "/admin/financial-analytics/export",
  generalLimiter,
  exportAdminFinancialAnalytics
);

router.get(
  "/admin/financial-analytics/export/pdf",
  generalLimiter,
  exportAdminFinancialAnalyticsPdf
);

router.get(
  "/admin/financial-analytics",
  generalLimiter,
  getAdminFinancialAnalytics
);

router.get("/payments", generalLimiter, getMyPayments);

router.post(
  "/refunds/request/:paymentId",
  generalLimiter,
  createRefundRequest
);

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