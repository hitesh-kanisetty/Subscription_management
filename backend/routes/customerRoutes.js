const express = require("express");

const {
  getCustomers,
  getCustomerById,
} = require("../controllers/customerController");

const router = express.Router();

router.get("/customers", getCustomers);

router.get(
  "/customers/:id",
  getCustomerById
);

module.exports = router;