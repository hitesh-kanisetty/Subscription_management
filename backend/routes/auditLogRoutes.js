const express = require("express");

const {
  getAuditLogs,
} = require("../controllers/auditLogController");

const router = express.Router();

router.get(
  "/admin/audit-logs",
  getAuditLogs
);

module.exports = router;