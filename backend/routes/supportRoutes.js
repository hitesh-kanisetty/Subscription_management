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
  getSupportAgentCustomers,
  getMySupportTicketAgentById,
  updateMySupportTicketStatus,
  getSupportAgentCustomerDetails,
  addMySupportTicketMessage,
  getSupportBilling,
  exportSupportBillingCsv,
  exportSupportBillingPdf,
} = require("../controllers/supportAgentController");

const router = express.Router();


router.post("/support", generalLimiter, createSupportTicket);
router.get("/support", generalLimiter, getMySupportTickets);
router.get("/support/:id", generalLimiter, getMySupportTicketById);

router.get("/admin/support", getSupportTickets);
router.get("/admin/support/:id", getSupportTicketById);

router.patch(
  "/admin/support/:id/status",
  updateSupportTicketStatus
);

router.get("/admin/support-agents", getSupportAgents);
router.post("/admin/support-agents", createSupportAgent);

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
  "/support-agent/customers",
  getSupportAgentCustomers
);

router.get(
  "/support-agent/customers/:id",
  getSupportAgentCustomerDetails
);
router.get(
  "/support-agent/tickets",
  generalLimiter,
  getMySupportTicketsAgent
);
router.get("/support-agent/billing", getSupportBilling);

router.get("/support-agent/billing/export", exportSupportBillingCsv);

router.get("/support-agent/billing/export/pdf", exportSupportBillingPdf);

router.post("/support/:id/messages", generalLimiter, addTicketMessage);
router.post("/admin/support/:id/messages", generalLimiter, addTicketMessage);

module.exports = router;