const express = require("express");

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

router.get(
  "/admin/billing/export",
  exportAdminBilling
);

router.get(
  "/admin/billing/export/pdf",
  exportAdminBillingPdf
);

router.get(
  "/admin/billing",
  getAdminBilling
);

router.patch(
  "/admin/refunds/:refundId/decision",
  decideRefundRequest
);
router.get("/admin/refunds", getAdminRefundRequests);
router.get(
  "/admin/financial-analytics/export",
  exportAdminFinancialAnalytics
);

router.get(
  "/admin/financial-analytics/export/pdf",
  exportAdminFinancialAnalyticsPdf
);

router.get(
  "/admin/financial-analytics",
  getAdminFinancialAnalytics
);



router.get(
  "/payments",
  getMyPayments
);
router.post(
  "/refunds/request/:paymentId",
  createRefundRequest
);
router.get(
  "/support/refunds",
  getSupportRefundRequests
);

router.patch(
  "/support/refunds/:refundId",
  updateSupportRefundRequest
);

module.exports = router;