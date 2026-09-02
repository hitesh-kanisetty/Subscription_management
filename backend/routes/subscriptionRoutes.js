const express = require("express");

const {
  getMySubscription,
  previewUpgrade,
  upgradeSubscription,
} = require("../controllers/subscriptionController");

const router = express.Router();

router.get("/subscription", getMySubscription);

router.get(
  "/subscription/upgrade/:id/preview",
  previewUpgrade
);

router.post(
  "/subscription/upgrade/:id",
  upgradeSubscription
);

module.exports = router;