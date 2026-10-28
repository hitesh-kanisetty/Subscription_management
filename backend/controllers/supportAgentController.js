const prisma = require("../config/prisma");
const bcrypt = require("bcrypt");
const PDFDocument = require("pdfkit");


// const SLA_TARGETS = {
//   URGENT: {
//     responseMinutes: 15,
//     resolutionMinutes: 4 * 60,
//   },
//   HIGH: {
//     responseMinutes: 60,
//     resolutionMinutes: 8 * 60,
//   },
//   MEDIUM: {
//     responseMinutes: 4 * 60,
//     resolutionMinutes: 24 * 60,
//   },
//   LOW: {
//     responseMinutes: 8 * 60,
//     resolutionMinutes: 72 * 60,
//   },
// };

// const calculateTicketSLA = (ticket) => {
//   const targets = SLA_TARGETS[ticket.priority];

//   if (!targets) {
//     return null;
//   }

//   const now = new Date();
//   const createdAt = new Date(ticket.createdAt);

//   const responseDeadline = new Date(
//     createdAt.getTime() + targets.responseMinutes * 60 * 1000
//   );

//   const resolutionDeadline = new Date(
//     createdAt.getTime() + targets.resolutionMinutes * 60 * 1000
//   );

//   // First reply from ADMIN or SUPPORT, not the customer.
//   const firstStaffReply = ticket.messages?.find((message) =>
//     ["ADMIN", "SUPPORT"].includes(message.sender?.role?.name)
//   );

//   const firstResponseAt = firstStaffReply
//     ? new Date(firstStaffReply.createdAt)
//     : null;

//   const responseMinutes = firstResponseAt
//     ? Math.round((firstResponseAt - createdAt) / 60000)
//     : null;

//   let responseStatus;

//   if (firstResponseAt) {
//     responseStatus =
//       responseMinutes <= targets.responseMinutes ? "MET" : "BREACHED";
//   } else {
//     responseStatus =
//       now > responseDeadline ? "BREACHED" : "PENDING";
//   }

//   const resolvedAt = ticket.resolvedAt
//     ? new Date(ticket.resolvedAt)
//     : null;

//   const resolutionMinutes = resolvedAt
//     ? Math.round((resolvedAt - createdAt) / 60000)
//     : null;

//   let resolutionStatus;

//   if (resolvedAt) {
//     resolutionStatus =
//       resolutionMinutes <= targets.resolutionMinutes
//         ? "MET"
//         : "BREACHED";
//   } else {
//     resolutionStatus =
//       now > resolutionDeadline ? "BREACHED" : "PENDING";
//   }

//   return {
//     responseTargetMinutes: targets.responseMinutes,
//     responseDeadline,
//     firstResponseAt,
//     actualResponseMinutes: responseMinutes,
//     responseStatus,

//     resolutionTargetMinutes: targets.resolutionMinutes,
//     resolutionDeadline,
//     resolvedAt,
//     actualResolutionMinutes: resolutionMinutes,
//     resolutionStatus,
//   };
// };
const { calculateTicketSLA } = require("../utils/ticketSLA");

const { createNotification } = require("./notificationHelper");

const {
  sendSupportReplyEmail,
  sendSupportTicketClosedEmail,
} = require("../services/emailService");

const getBestSupportAgent = async (category) => {
  const specializationMap = {
    PAYMENT: "PAYMENT",
    SUBSCRIPTION: "SUBSCRIPTION",
    ACCOUNT: "ACCOUNT",
    TECHNICAL: "TECHNICAL",
    OTHER: "GENERAL",
  };

  const specialization = specializationMap[category] || "GENERAL";

  let agents = await prisma.user.findMany({
    where: {
      role: {
        name: "SUPPORT",
      },
      supportSpecialization: specialization,
    },
    select: {
      id: true,
      name: true,
      supportSpecialization: true,
      _count: {
        select: {
          assignedTickets: {
            where: {
              status: {
                in: ["OPEN", "IN_PROGRESS"],
              },
            },
          },
        },
      },
    },
    orderBy: {
      id: "asc",
    },
  });

  if (agents.length === 0 && specialization !== "GENERAL") {
    agents = await prisma.user.findMany({
      where: {
        role: {
          name: "SUPPORT",
        },
        supportSpecialization: "GENERAL",
      },
      select: {
        id: true,
        name: true,
        supportSpecialization: true,
        _count: {
          select: {
            assignedTickets: {
              where: {
                status: {
                  in: ["OPEN", "IN_PROGRESS"],
                },
              },
            },
          },
        },
      },
      orderBy: {
        id: "asc",
      },
    });
  }

  if (agents.length === 0) {
    return null;
  }

  agents.sort((a, b) => a._count.assignedTickets - b._count.assignedTickets);

  return agents[0];
};

const createSupportAgent = async (req, res) => {
  try {
    if (req.session.user.role !== "ADMIN") {
      return res.status(403).json({
        message: "Admin access required",
      });
    }

    const { name, email, specialization } = req.body;

    const cleanedName = name?.trim();
    const cleanedEmail = email?.trim().toLowerCase();

    if (!cleanedName || !cleanedEmail || !specialization) {
      return res.status(400).json({
        message: "Name, email and specialization are required",
      });
    }

    const validSpecializations = [
      "PAYMENT",
      "SUBSCRIPTION",
      "ACCOUNT",
      "TECHNICAL",
      "GENERAL",
    ];

    if (!validSpecializations.includes(specialization)) {
      return res.status(400).json({
        message: "Invalid support specialization",
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: {
        email: cleanedEmail,
      },
    });

    if (existingUser) {
      return res.status(409).json({
        message: "A user with this email already exists",
      });
    }

    const firstName = cleanedName.split(/\s+/)[0];
    const initialPassword = `${firstName}@12345`;

    const hashedPassword = await bcrypt.hash(initialPassword, 10);

    const supportRole = await prisma.role.findUnique({
      where: {
        name: "SUPPORT",
      },
    });

    if (!supportRole) {
      return res.status(500).json({
        message: "SUPPORT role not found",
      });
    }

    const agent = await prisma.user.create({
      data: {
        name: cleanedName,
        email: cleanedEmail,
        password: hashedPassword,
        authProvider: "LOCAL",
        roleId: supportRole.id,
        supportSpecialization: specialization,
      },
      select: {
        id: true,
        name: true,
        email: true,
        supportSpecialization: true,
        createdAt: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.session.user.id,
        action: "CREATE_SUPPORT_AGENT",
        module: "SUPPORT",
        description: `Created support agent ${agent.name} (${agent.email})`,
      },
    });

    return res.status(201).json({
      message: "Support agent created successfully",
      agent,
      initialPassword,
    });
  } catch (error) {
    console.error("Create support agent error:", error);

    return res.status(500).json({
      message: "Unable to create support agent",
    });
  }
};

const getSupportAgents = async (req, res) => {
  try {
    if (!req.session.user || req.session.user.role !== "ADMIN") {
      return res.status(403).json({
        message: "Admin access required",
      });
    }

    const { specialization } = req.query;

    const validSpecializations = [
      "PAYMENT",
      "SUBSCRIPTION",
      "ACCOUNT",
      "TECHNICAL",
      "GENERAL",
    ];

    const where = {
      role: {
        name: "SUPPORT",
      },
    };

    if (specialization && specialization !== "ALL") {
      if (!validSpecializations.includes(specialization)) {
        return res.status(400).json({
          message: "Invalid support specialization",
        });
      }

      where.supportSpecialization = specialization;
    }

    const agents = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        supportSpecialization: true,
        createdAt: true,
        _count: {
          select: {
            assignedTickets: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      agents: agents.map((agent) => ({
        id: agent.id,
        name: agent.name,
        email: agent.email,
        supportSpecialization: agent.supportSpecialization,
        assignedTickets: agent._count.assignedTickets,
        createdAt: agent.createdAt,
      })),
    });
  } catch (error) {
    console.error("Get support agents error:", error);

    return res.status(500).json({
      message: "Unable to fetch support agents",
    });
  }
};

const getMySupportAgentDashboard = async (req, res) => {
  try {
    if (!req.session.user || req.session.user.role !== "SUPPORT") {
      return res.status(403).json({
        message: "Support agent access required",
      });
    }

    const agentId = req.session.user.id;

    const [
      tickets,
      totalAssigned,
      openTickets,
      resolvedTickets,
      urgentTickets,
    ] = await Promise.all([
      prisma.supportTicket.findMany({
        where: {
          assignedAgentId: agentId,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          updatedAt: "desc",
        },
        take: 10,
      }),

      prisma.supportTicket.count({
        where: {
          assignedAgentId: agentId,
        },
      }),

      prisma.supportTicket.count({
        where: {
          assignedAgentId: agentId,
          status: {
            in: ["OPEN", "IN_PROGRESS"],
          },
        },
      }),

      prisma.supportTicket.count({
        where: {
          assignedAgentId: agentId,
          status: {
      in: ["RESOLVED", "CLOSED"],
    },
        },
      }),

      prisma.supportTicket.count({
        where: {
          assignedAgentId: agentId,
          priority: "URGENT",
        },
      }),
    ]);

    res.json({
      stats: {
        totalAssigned,
        openTickets,
        resolvedTickets,
        urgentTickets,
      },
      tickets,
    });
  } catch (error) {
    console.error("Get support agent dashboard error:", error);

    res.status(500).json({
      message: "Unable to load support dashboard",
    });
  }
};

const getMySupportTicketsAgent = async (req, res) => {
  try {
    if (!req.session.user || req.session.user.role !== "SUPPORT") {
      return res.status(403).json({
        message: "Support agent access required",
      });
    }

    const agentId = req.session.user.id;

    const { search = "", status = "ALL", priority = "ALL" } = req.query;

    const where = {
      assignedAgentId: agentId,
    };

    if (status !== "ALL") {
      where.status = status;
    }

    if (priority !== "ALL") {
      where.priority = priority;
    }

    if (search.trim()) {
      where.OR = [
        {
          subject: {
            contains: search.trim(),
            mode: "insensitive",
          },
        },
        {
          description: {
            contains: search.trim(),
            mode: "insensitive",
          },
        },
        {
          user: {
            name: {
              contains: search.trim(),
              mode: "insensitive",
            },
          },
        },
        {
          user: {
            email: {
              contains: search.trim(),
              mode: "insensitive",
            },
          },
        },
      ];
    }

const tickets = await prisma.supportTicket.findMany({
  where,
  include: {
    user: {
      select: {
        id: true,
        name: true,
        email: true,
      },
    },
    messages: {
      select: {
        createdAt: true,
        sender: {
          select: {
            role: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    },
  },
  orderBy: {
    updatedAt: "desc",
  },
});

const ticketsWithSLA = tickets.map((ticket) => ({
  ...ticket,
  sla: calculateTicketSLA(ticket),
}));

res.json({ tickets: ticketsWithSLA });
  } catch (error) {
    console.error("Get my support tickets error:", error);

    res.status(500).json({
      message: "Failed to fetch support tickets",
    });
  }
};

const getMySupportTicketAgentById = async (req, res) => {
  try {
    if (!req.session.user || req.session.user.role !== "SUPPORT") {
      return res.status(403).json({
        message: "Support agent access required",
      });
    }

    const agentId = req.session.user.id;
    const ticketId = Number(req.params.id);

    if (!Number.isInteger(ticketId)) {
      return res.status(400).json({
        message: "Invalid ticket ID",
      });
    }

    const ticket = await prisma.supportTicket.findFirst({
      where: {
        id: ticketId,
        assignedAgentId: agentId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignedAgent: {
          select: {
            id: true,
            name: true,
            email: true,
            supportSpecialization: true,
          },
        },
        payment: true,

        messages: {
          orderBy: {
            createdAt: "asc",
          },
          select: {
            id: true,
            message: true,
            attachmentUrl: true,
            attachmentName: true,
            attachmentType: true,
            attachmentSize: true,
            createdAt: true,
            sender: {
              select: {
                id: true,
                name: true,
                email: true,
                role: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!ticket) {
      return res.status(404).json({
        message: "Ticket not found or not assigned to you",
      });
    }

    const sla = calculateTicketSLA(ticket);

res.json({
  ticket: {
    ...ticket,
    sla,
  },
});
  } catch (error) {
    console.error("Get support ticket error:", error);

    res.status(500).json({
      message: "Failed to fetch ticket",
    });
  }
};

const updateMySupportTicketStatus = async (req, res) => {
  try {
    if (!req.session.user || req.session.user.role !== "SUPPORT") {
      return res.status(403).json({
        message: "Support agent access required",
      });
    }

    const agentId = req.session.user.id;
    const ticketId = Number(req.params.id);
    const { status } = req.body;

    if (!Number.isInteger(ticketId) || ticketId <= 0) {
      return res.status(400).json({
        message: "Invalid ticket ID",
      });
    }

    const validStatuses = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid support ticket status",
      });
    }

    const existingTicket = await prisma.supportTicket.findFirst({
      where: {
        id: ticketId,
        assignedAgentId: agentId,
      },
    });

    if (!existingTicket) {
      return res.status(404).json({
        message: "Ticket not found or not assigned to you",
      });
    }

    if (existingTicket.status === "CLOSED") {
      return res.status(400).json({
        message: "Closed support tickets cannot be reopened or modified.",
      });
    }

    if (existingTicket.status === status) {
      return res.status(200).json({
        message: "Ticket status is unchanged",
        ticket: existingTicket,
      });
    }

    const updatedTicket = await prisma.supportTicket.update({
      where: {
        id: ticketId,
      },
      data: {
  status,
  resolvedAt:
    status === "RESOLVED" || status === "CLOSED"
      ? existingTicket.resolvedAt || new Date()
      : null,
},
      select: {
        id: true,
        category: true,
        subject: true,
        description: true,
        status: true,
        paymentId: true,
        createdAt: true,
        updatedAt: true,
        userId: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: agentId,
        action: "UPDATE",
        module: "Support",
        description:
          `Support agent changed ticket #${ticketId} status ` +
          `from "${existingTicket.status}" to "${updatedTicket.status}"`,
      },
    });

    const io = req.app.get("io");

    if (io) {
      io.to(`support-ticket-${ticketId}`).emit(
        "support-ticket-status-updated",
        {
          ticketId,
          status: updatedTicket.status,
        },
      );
    }

    await createNotification({
      userId: updatedTicket.userId,
      type: "SUPPORT_TICKET_UPDATED",
      title: "Support ticket updated",
      message: `Your support ticket #${ticketId} is now ${status.replaceAll("_", " ")}.`,
      details: {
        ticketId,
        subject: updatedTicket.subject,
        status: updatedTicket.status,
        updatedAt: updatedTicket.updatedAt,
      },
    });

    if (updatedTicket.status === "CLOSED") {
      const customer = await prisma.user.findUnique({
        where: {
          id: updatedTicket.userId,
        },
        select: {
          name: true,
          email: true,
        },
      });

      if (customer) {
        await sendSupportTicketClosedEmail({
          user: customer,
          ticket: updatedTicket,
        });
      }
    }

    return res.status(200).json({
      message: "Support ticket status updated successfully",
      ticket: updatedTicket,
    });
  } catch (error) {
    console.error("Support agent status update error:", error);

    return res.status(500).json({
      message: "Unable to update support ticket status",
    });
  }
};

const addMySupportTicketMessage = async (req, res) => {
  try {
    if (!req.session.user || req.session.user.role !== "SUPPORT") {
      return res.status(403).json({
        message: "Support agent access required",
      });
    }

    const agentId = req.session.user.id;
    const ticketId = Number(req.params.id);

    if (!Number.isInteger(ticketId) || ticketId <= 0) {
      return res.status(400).json({
        message: "Invalid ticket ID",
      });
    }

    const {
      message,
      attachmentUrl,
      attachmentName,
      attachmentType,
      attachmentSize,
    } = req.body;

    const trimmedMessage = message?.trim() || "";

    const hasAttachment =
      Boolean(attachmentUrl) &&
      Boolean(attachmentName) &&
      Boolean(attachmentType) &&
      Number.isSafeInteger(Number(attachmentSize)) &&
      Number(attachmentSize) > 0;

    if (!trimmedMessage && !hasAttachment) {
      return res.status(400).json({
        message: "Message or attachment is required",
      });
    }

    const ticket = await prisma.supportTicket.findFirst({
      where: {
        id: ticketId,
        assignedAgentId: agentId,
      },
      select: {
        id: true,
        userId: true,
        assignedAgentId: true,
        status: true,
        subject: true,
      },
    });

    if (!ticket) {
      return res.status(404).json({
        message: "Ticket not found or not assigned to you",
      });
    }

    if (ticket.status === "CLOSED") {
      return res.status(400).json({
        message: "Closed support tickets cannot receive new messages.",
      });
    }

    const ticketMessage = await prisma.ticketMessage.create({
      data: {
        ticketId: ticket.id,
        senderId: agentId,
        message: trimmedMessage,
        attachmentUrl: hasAttachment ? attachmentUrl : null,
        attachmentName: hasAttachment ? attachmentName : null,
        attachmentType: hasAttachment ? attachmentType : null,
        attachmentSize: hasAttachment ? Number(attachmentSize) : null,
      },
      select: {
        id: true,
        message: true,
        attachmentUrl: true,
        attachmentName: true,
        attachmentType: true,
        attachmentSize: true,
        createdAt: true,
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            role: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    const io = req.app.get("io");

    if (io) {
      io.to(`support-ticket-${ticket.id}`).emit("new-support-message", {
        ticketId: ticket.id,
        ticketMessage,
      });
    }

    await prisma.auditLog.create({
      data: {
        userId: agentId,
        action: "REPLY",
        module: "Support",
        description: `Replied to support ticket #${ticket.id}`,
      },
    });

    await createNotification({
      userId: ticket.userId,
      type: "NEW_SUPPORT_MESSAGE",
      title: "New support message",
      message: `You received a new reply on support ticket #${ticket.id}.`,
      details: {
        ticketId: ticket.id,
        subject: ticket.subject,
        messageId: ticketMessage.id,
        sentAt: ticketMessage.createdAt,
      },
    });

    const customer = await prisma.user.findUnique({
      where: {
        id: ticket.userId,
      },
      select: {
        name: true,
        email: true,
      },
    });

    if (customer) {
      await sendSupportReplyEmail({
        user: customer,
        ticket,
        admin: {
          name: req.session.user.name,
        },
        message: ticketMessage.message,
      });
    }

    return res.status(201).json({
      message: "Message added successfully",
      ticketMessage,
    });
  } catch (error) {
    console.error("Support agent message error:", error);

    return res.status(500).json({
      message: "Unable to send support message",
    });
  }
};
const getSupportAgentCustomers = async (req, res) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      20,
      Math.max(1, Number.parseInt(req.query.limit, 10) || 5)
    );

    const search = String(req.query.search || "").trim();
    const status = String(req.query.status || "ALL").toUpperCase();

    const allowedStatuses = [
      "ALL",
      "ACTIVE",
      "CANCELLED",
      "EXPIRED",
      "NO_SUBSCRIPTION",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status filter." });
    }

    const where = {
      role: { name: "CUSTOMER" },
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    if (status === "NO_SUBSCRIPTION") {
      where.subscriptions = { none: {} };
    } else if (["ACTIVE", "CANCELLED", "EXPIRED"].includes(status)) {
      where.subscriptions = {
        some: { status },
      };
    }

    const [totalCustomers, customers] = await prisma.$transaction([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          subscriptions: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: {
              id: true,
              status: true,
              renewalDate: true,
              createdAt: true,
              plan: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: { name: "asc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return res.status(200).json({
      customers,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCustomers / limit),
        totalCustomers,
        limit,
      },
    });
  } catch (error) {
    console.error("Support agent customer listing error:", error);

    return res.status(500).json({
      message: "Unable to load customers.",
    });
  }
};
const getSupportAgentCustomerDetails = async (req, res) => {
  try {
    const customerId = Number(req.params.id);

    if (!Number.isInteger(customerId) || customerId <= 0) {
      return res.status(400).json({
        message: "Invalid customer ID.",
      });
    }

    const customer = await prisma.user.findFirst({
      where: {
        id: customerId,
        role: {
          name: "CUSTOMER",
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        subscriptions: {
          orderBy: {
            createdAt: "desc",
          },
          include: {
            plan: true,
            payments: {
              orderBy: {
                paymentDate: "desc",
              },
            },
          },
        },
      },
    });

    if (!customer) {
      return res.status(404).json({
        message: "Customer not found.",
      });
    }

    return res.status(200).json({ customer });
  } catch (error) {
    console.error("Support agent customer details error:", error);

    return res.status(500).json({
      message: "Unable to fetch customer details.",
    });
  }
};
const getPaymentWhere = (search) => {
  const where = {};

  if (search?.trim()) {
    const term = search.trim();

    where.OR = [
      {
        transactionId: {
          contains: term,
          mode: "insensitive",
        },
      },
      {
        subscription: {
          is: {
            user: {
              is: {
                name: { contains: term, mode: "insensitive" },
              },
            },
          },
        },
      },
      {
        subscription: {
          is: {
            user: {
              is: {
                email: { contains: term, mode: "insensitive" },
              },
            },
          },
        },
      },
      {
        subscription: {
          is: {
            plan: {
              is: {
                name: { contains: term, mode: "insensitive" },
              },
            },
          },
        },
      },
    ];
  }

  return where;
};

const getPaymentData = async (where, skip, take) => {
  const payments = await prisma.payment.findMany({
    where,
    include: {
      subscription: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          plan: true,
        },
      },
    },
    orderBy: {
      paymentDate: "desc",
    },
    ...(skip !== null ? { skip, take } : {}),
  });

  return payments.map((payment) => ({
    id: payment.id,
    amount: payment.amount,
    transactionId: payment.transactionId,
    paymentDate: payment.paymentDate,
    paymentMethod: payment.paymentMethod,
    status: payment.status,
    customer: payment.subscription?.user
      ? {
          id: payment.subscription.user.id,
          name: payment.subscription.user.name,
          email: payment.subscription.user.email,
        }
      : null,
    plan: payment.subscription?.plan
      ? {
          name: payment.subscription.plan.name,
          billingPeriod: payment.subscription.plan.billingPeriod,
        }
      : null,
  }));
};

 const getSupportBilling = async (req, res) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      100,
      Math.max(1, Number.parseInt(req.query.limit, 10) || 5)
    );
    const search = String(req.query.search || "");

    const where = getPaymentWhere(search);

    const [payments, totalPayments, successfulPayments, paidPayments] =
      await Promise.all([
        getPaymentData(where, (page - 1) * limit, limit),
        prisma.payment.count({ where }),
        prisma.payment.count({
          where: { ...where, status: "PAID" },
        }),
        prisma.payment.findMany({
          where: { ...where, status: "PAID" },
          select: { amount: true },
        }),
      ]);

    const totalCollected = paidPayments.reduce(
      (sum, payment) => sum + Number(payment.amount || 0),
      0
    );

    return res.status(200).json({
      payments,
      summary: {
        totalCollected,
        successfulPayments,
      },
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalPayments / limit),
        totalPayments,
        limit,
      },
    });
  } catch (error) {
    console.error("Support billing fetch error:", error);

    return res.status(500).json({
      message: "Unable to fetch billing records.",
    });
  }
};

 const exportSupportBillingCsv = async (req, res) => {
  try {
    const where = getPaymentWhere(String(req.query.search || ""));
    const payments = await getPaymentData(where, null, null);

    const rows = [
      [
        "Payment ID",
        "Customer",
        "Email",
        "Plan",
        "Amount",
        "Transaction ID",
        "Payment Method",
        "Payment Date",
        "Status",
      ],
      ...payments.map((payment) => [
        payment.id,
        payment.customer?.name || "",
        payment.customer?.email || "",
        payment.plan?.name || "",
        payment.amount ?? "",
        payment.transactionId || "",
        payment.paymentMethod || "",
        payment.paymentDate
          ? new Date(payment.paymentDate).toISOString()
          : "",
        payment.status || "",
      ]),
    ];

    const csv = rows
      .map((row) =>
        row
          .map((value) => {
            let text = String(value ?? "");

            // Prevent spreadsheet formula injection.
            if (/^[\s]*[=+\-@]/.test(text)) {
              text = `'${text}`;
            }

            return `"${text.replace(/"/g, '""')}"`;
          })
          .join(",")
      )
      .join("\r\n");

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="billing-report.csv"'
    );

    return res.status(200).send("\uFEFF" + csv);
  } catch (error) {
    console.error("Support billing CSV export error:", error);

    return res.status(500).json({
      message: "Unable to export billing records.",
    });
  }
};

 const exportSupportBillingPdf = async (req, res) => {
  try {
    const where = getPaymentWhere(String(req.query.search || ""));
    const payments = await getPaymentData(where, null, null);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="billing-report.pdf"'
    );

    const doc = new PDFDocument({
      size: "A4",
      margin: 40,
      layout: "landscape",
    });

    doc.pipe(res);

    doc.fontSize(18).text("Billing & Payments Report");
    doc.moveDown(0.4);
    doc
      .fontSize(9)
      .fillColor("#64748b")
      .text(`Generated: ${new Date().toLocaleString("en-IN")}`);
    doc.moveDown();

    const columns = [
      { label: "Customer", x: 40, width: 110 },
      { label: "Plan", x: 155, width: 90 },
      { label: "Amount", x: 250, width: 65 },
      { label: "Transaction ID", x: 320, width: 130 },
      { label: "Date", x: 455, width: 75 },
      { label: "Status", x: 535, width: 65 },
    ];

    const drawHeader = (y) => {
      doc.font("Helvetica-Bold").fontSize(8).fillColor("#334155");

      columns.forEach((column) => {
        doc.text(column.label, column.x, y, {
          width: column.width,
          lineBreak: false,
        });
      });

      doc
        .moveTo(40, y + 16)
        .lineTo(600, y + 16)
        .strokeColor("#cbd5e1")
        .stroke();
    };

    let y = doc.y + 8;
    drawHeader(y);
    y += 25;

    doc.font("Helvetica").fontSize(8).fillColor("#334155");

    for (const payment of payments) {
      if (y > 520) {
        doc.addPage();
        y = 40;
        drawHeader(y);
        y += 25;
        doc.font("Helvetica").fontSize(8).fillColor("#334155");
      }

      const date = payment.paymentDate
        ? new Date(payment.paymentDate).toLocaleDateString("en-IN")
        : "—";

      const values = [
        payment.customer?.name || "—",
        payment.plan?.name || "—",
        `Rs. ${Number(payment.amount || 0).toFixed(2)}`,
        payment.transactionId || "—",
        date,
        payment.status || "—",
      ];

      columns.forEach((column, index) => {
        doc.text(String(values[index]), column.x, y, {
          width: column.width,
          height: 28,
          ellipsis: true,
        });
      });

      y += 28;
    }

    if (payments.length === 0) {
      doc.text("No billing records found.", 40, y);
    }

    doc.end();
  } catch (error) {
    console.error("Support billing PDF export error:", error);

    if (!res.headersSent) {
      return res.status(500).json({
        message: "Unable to generate billing PDF.",
      });
    }

    res.end();
  }
};


module.exports = {
  createSupportAgent,
  getSupportAgents,
  getMySupportAgentDashboard,
  getSupportAgentCustomers,
  getSupportAgentCustomerDetails,
  getBestSupportAgent,
  getMySupportTicketsAgent,
  getMySupportTicketAgentById,
  updateMySupportTicketStatus,
  addMySupportTicketMessage,
  getSupportBilling,
  exportSupportBillingCsv,
  exportSupportBillingPdf,
};
