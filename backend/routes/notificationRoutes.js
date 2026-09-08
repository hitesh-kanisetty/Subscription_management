const express = require("express");

const {
  getCustomerNotifications,
  getAdminNotifications,
  markNotificationAsRead,
} = require("../controllers/notificationController");

const router = express.Router();

/* Customer notifications */
router.get(
  "/notifications",
  getCustomerNotifications
);

/* Admin notifications */
router.get(
  "/admin/notifications",
  getAdminNotifications
);

/* Mark notification as read */
router.patch(
  "/notifications/:id/read",
  markNotificationAsRead
);

module.exports = router;