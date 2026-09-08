const express = require("express");

const {
  getAdminBilling,
} = require("../controllers/paymentsController");

const router = express.Router();

router.get("/admin/billing", getAdminBilling);

module.exports = router;