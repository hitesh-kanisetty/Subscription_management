const express = require("express");

const {
  getAdminBilling,
  getAdminFinancialAnalytics,
} = require("../controllers/paymentsController");

const router = express.Router();

router.get("/admin/billing", getAdminBilling);

router.get(
  "/admin/financial-analytics",
  getAdminFinancialAnalytics
);

module.exports = router;