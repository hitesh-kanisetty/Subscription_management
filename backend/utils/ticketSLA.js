const SLA_TARGETS = {
  URGENT: { responseMinutes: 15, resolutionMinutes: 4 * 60 },
  HIGH: { responseMinutes: 60, resolutionMinutes: 8 * 60 },
  MEDIUM: { responseMinutes: 4 * 60, resolutionMinutes: 24 * 60 },
  LOW: { responseMinutes: 8 * 60, resolutionMinutes: 72 * 60 },
};

const calculateTicketSLA = (ticket) => {
  const targets = SLA_TARGETS[ticket.priority];

  if (!targets) return null;

  const now = new Date();
  const createdAt = new Date(ticket.createdAt);

  const responseDeadline = new Date(
    createdAt.getTime() + targets.responseMinutes * 60000
  );

  const resolutionDeadline = new Date(
    createdAt.getTime() + targets.resolutionMinutes * 60000
  );

  const firstStaffReply = ticket.messages?.find((message) =>
    ["ADMIN", "SUPPORT"].includes(message.sender?.role?.name)
  );

  const firstResponseAt = firstStaffReply
    ? new Date(firstStaffReply.createdAt)
    : null;

  const actualResponseMinutes = firstResponseAt
    ? Math.round((firstResponseAt - createdAt) / 60000)
    : null;

  const responseStatus = firstResponseAt
    ? actualResponseMinutes <= targets.responseMinutes
      ? "MET"
      : "BREACHED"
    : now > responseDeadline
      ? "BREACHED"
      : "PENDING";

  const resolvedAt = ticket.resolvedAt
    ? new Date(ticket.resolvedAt)
    : null;

  const actualResolutionMinutes = resolvedAt
    ? Math.round((resolvedAt - createdAt) / 60000)
    : null;

  const resolutionStatus = resolvedAt
    ? actualResolutionMinutes <= targets.resolutionMinutes
      ? "MET"
      : "BREACHED"
    : now > resolutionDeadline
      ? "BREACHED"
      : "PENDING";

  return {
    responseTargetMinutes: targets.responseMinutes,
    responseDeadline,
    firstResponseAt,
    actualResponseMinutes,
    responseStatus,
    resolutionTargetMinutes: targets.resolutionMinutes,
    resolutionDeadline,
    resolvedAt,
    actualResolutionMinutes,
    resolutionStatus,
  };
};

module.exports = { SLA_TARGETS, calculateTicketSLA };