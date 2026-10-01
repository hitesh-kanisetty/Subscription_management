const express = require("express");

const {
  getCustomers,
  getCustomerById,
  exportCustomers,
  exportCustomersPdf,
} = require("../controllers/customerController");

const router = express.Router();

router.get("/customers", getCustomers);

router.get("/customers/export", exportCustomers);

router.get(
  "/customers/export/pdf",
  exportCustomersPdf
);

router.get(
  "/customers/:id",
  getCustomerById
);

module.exports = router;