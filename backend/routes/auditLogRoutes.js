const express = require("express");

const {
  getAuditLogs,
  exportAuditLogs,
  exportAuditLogsPdf,
} = require("../controllers/auditLogController");

const router = express.Router();

router.get(
  "/admin/audit-logs/export",
  exportAuditLogs
);

router.get(
  "/admin/audit-logs/export/pdf",
  exportAuditLogsPdf
);

router.get(
  "/admin/audit-logs",
  getAuditLogs
);

module.exports = router;