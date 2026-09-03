const express = require("express");

const {
  createSupportTicket,
  getMySupportTickets,
  getMySupportTicketById,
  getSupportTickets,
  getSupportTicketById,
  updateSupportTicketStatus,
  addTicketMessage,
} = require("../controllers/supportController");

const router = express.Router();

// Customer support routes
router.post("/support", createSupportTicket);
router.get("/support", getMySupportTickets);
router.get("/support/:id", getMySupportTicketById);

// Admin support routes
router.get("/admin/support", getSupportTickets);
router.get("/admin/support/:id", getSupportTicketById);
router.patch(
  "/admin/support/:id/status",
  updateSupportTicketStatus
);

// Customer/Admin reply
router.post("/support/:id/messages", addTicketMessage);
router.post("/admin/support/:id/messages", addTicketMessage);

module.exports = router;