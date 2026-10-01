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


module.exports = router;