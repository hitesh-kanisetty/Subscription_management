const express = require("express");
const { generalLimiter } = require("../middleware/rateLimiter");
const { requireAdmin } = require("../middleware/authMiddleware");

const {
  getCustomers,
  getCustomerById,
  exportCustomers,
  exportCustomersPdf,
} = require("../controllers/customerController");

const router = express.Router();

router.get("/customers", generalLimiter, requireAdmin, getCustomers);

router.get("/customers/export", generalLimiter, requireAdmin, exportCustomers);

router.get(
  "/customers/export/pdf",
  generalLimiter,
  requireAdmin,
  exportCustomersPdf,
);

router.get("/customers/:id", generalLimiter, requireAdmin, getCustomerById);

module.exports = router;
