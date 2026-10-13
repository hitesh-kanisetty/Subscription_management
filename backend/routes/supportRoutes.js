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

const {
  createSupportAgent,
  getSupportAgents,
  getMySupportAgentDashboard,
  getMySupportTicketsAgent,
  getMySupportTicketAgentById,
  updateMySupportTicketStatus,
  addMySupportTicketMessage,
} = require("../controllers/supportAgentController");

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

router.get(
  "/admin/support-agents",
  getSupportAgents
);

router.post(
  "/admin/support-agents",
  createSupportAgent
);
router.get(
  "/support-agent/dashboard",
  getMySupportAgentDashboard
);
router.get(
  "/support-agent/tickets/:id",
  getMySupportTicketAgentById
);
// Support Agent ticket actions
router.patch(
  "/support-agent/tickets/:id/status",
  updateMySupportTicketStatus
);

router.post(
  "/support-agent/tickets/:id/messages",
  addMySupportTicketMessage
);
router.get("/support-agent/tickets", getMySupportTicketsAgent);
// Customer/Admin reply
router.post("/support/:id/messages", addTicketMessage);
router.post("/admin/support/:id/messages", addTicketMessage);

module.exports = router;