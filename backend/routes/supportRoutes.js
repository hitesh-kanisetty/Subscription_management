const express = require("express");
const { generalLimiter } = require("../middleware/rateLimiter");

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


router.post("/support", generalLimiter, createSupportTicket);
router.get("/support", generalLimiter, getMySupportTickets);
router.get("/support/:id", generalLimiter, getMySupportTicketById);

router.get("/admin/support", generalLimiter, getSupportTickets);
router.get("/admin/support/:id", generalLimiter, getSupportTicketById);

router.patch(
  "/admin/support/:id/status",
  generalLimiter,
  updateSupportTicketStatus
);

router.get("/admin/support-agents", generalLimiter, getSupportAgents);
router.post("/admin/support-agents", generalLimiter, createSupportAgent);

router.get(
  "/support-agent/dashboard",
  generalLimiter,
  getMySupportAgentDashboard
);

router.get(
  "/support-agent/tickets/:id",
  generalLimiter,
  getMySupportTicketAgentById
);

router.patch(
  "/support-agent/tickets/:id/status",
  generalLimiter,
  updateMySupportTicketStatus
);

router.post(
  "/support-agent/tickets/:id/messages",
  generalLimiter,
  addMySupportTicketMessage
);

router.get(
  "/support-agent/tickets",
  generalLimiter,
  getMySupportTicketsAgent
);

router.post("/support/:id/messages", generalLimiter, addTicketMessage);
router.post("/admin/support/:id/messages", generalLimiter, addTicketMessage);

module.exports = router;