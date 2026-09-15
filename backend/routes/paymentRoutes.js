const express = require("express");

const {
  getAdminBilling,
  getAdminFinancialAnalytics,
  getMyPayments,
} = require("../controllers/paymentsController");

const router = express.Router();

router.get("/admin/billing", getAdminBilling);

router.get(
  "/admin/financial-analytics",
  getAdminFinancialAnalytics
);

router.get("/payments", getMyPayments);

module.exports = router;