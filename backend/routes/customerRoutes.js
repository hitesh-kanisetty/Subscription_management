const express = require("express");
const { generalLimiter } = require("../middleware/rateLimiter");
const {
  getCustomers,
  getCustomerById,
  exportCustomers,
  exportCustomersPdf,
} = require("../controllers/customerController");

const router = express.Router();


router.get("/customers", generalLimiter, getCustomers);

router.get(
  "/customers/export",
  generalLimiter,
  exportCustomers
);

router.get(
  "/customers/export/pdf",
  generalLimiter,
  exportCustomersPdf
);

router.get(
  "/customers/:id",
  generalLimiter,
  getCustomerById
);


module.exports = router;