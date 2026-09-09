const { PrismaClient } = require("../generated/prisma");
const { createNotification } = require("./notificationHelper");

const prisma = new PrismaClient();

/*
 * =====================================================
 * CUSTOMER - CREATE SUPPORT TICKET
 * =====================================================
 */

const createSupportTicket = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({
        message: "Not authenticated",
      });
    }

    if (req.session.user.role !== "CUSTOMER") {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    const {
      category,
      subject,
      description,
      paymentId,
    } = req.body;

    if (!category || !subject || !description) {
      return res.status(400).json({
        message:
          "Category, subject and description are required",
      });
    }

    const validCategories = [
      "PAYMENT",
      "SUBSCRIPTION",
      "ACCOUNT",
      "TECHNICAL",
      "OTHER",
    ];

    if (!validCategories.includes(category)) {
      return res.status(400).json({
        message: "Invalid support category",
      });
    }

    const cleanedSubject = subject.trim();
    const cleanedDescription = description.trim();

    if (!cleanedSubject || !cleanedDescription) {
      return res.status(400).json({
        message:
          "Subject and description cannot be empty",
      });
    }

    let validPaymentId = null;

    if (
      paymentId !== undefined &&
      paymentId !== null &&
      paymentId !== ""
    ) {
      const parsedPaymentId = Number(paymentId);

      if (!Number.isInteger(parsedPaymentId)) {
        return res.status(400).json({
          message: "Invalid payment ID",
        });
      }

      // to check this payment is present users
      const payment = await prisma.payment.findFirst({
        where: {
          id: parsedPaymentId,
          subscription: {
            userId: req.session.user.id,
          },
        },
      });

      if (!payment) {
        return res.status(404).json({
          message: "Payment not found",
        });
      }

      validPaymentId = parsedPaymentId;
    }

    const ticket = await prisma.supportTicket.create({
      data: {
        userId: req.session.user.id,
        paymentId: validPaymentId,
        category,
        subject: cleanedSubject,
        description: cleanedDescription,
        status: "OPEN",
      },
      // //
      //select uses and helps to provide to add the selected fields in our result so we set true for selected fields
      // //
      select: {
        id: true,
        category: true,
        subject: true,
        description: true,
        status: true,
        paymentId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    /*
     * Customer notification
     */
    await createNotification({
      userId: req.session.user.id,
      type: "SUPPORT_TICKET_CREATED",
      title: "Support ticket created",
      message: `Your support ticket #${ticket.id} has been created successfully.`,
      details: {
        ticketId: ticket.id,
        category: ticket.category,
        subject: ticket.subject,
        status: ticket.status,
        createdAt: ticket.createdAt,
      },
    });

    /*
     * Admin notification(s)
     */
    const adminUsers = await prisma.user.findMany({
      where: {
        role: {
          name: "ADMIN",
        },
      },
      select: {
        id: true,
      },
    });

    for (const admin of adminUsers) {
      await createNotification({
        userId: admin.id,
        type: "NEW_SUPPORT_TICKET",
        title: "New support ticket",
        message: `A new support ticket #${ticket.id} was created by a customer.`,
        details: {
          ticketId: ticket.id,
          category: ticket.category,
          subject: ticket.subject,
          status: ticket.status,
          createdAt: ticket.createdAt,
        },
      });
    }

    return res.status(201).json({
      message: "Support ticket created successfully",
      ticket,
    });
  } catch (error) {
    console.error(
      "Create support ticket error:",
      error
    );

    return res.status(500).json({
      message:
        "Something went wrong. Please try again.",
    });
  }
};

/*
 * =====================================================
 * CUSTOMER - GET MY SUPPORT TICKETS
 * =====================================================
 */

const getMySupportTickets = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({
        message: "Not authenticated",
      });
    }

    if (req.session.user.role !== "CUSTOMER") {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    const tickets =
      await prisma.supportTicket.findMany({
        where: {
          userId: req.session.user.id,
        },
        orderBy: {
          createdAt: "desc",
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
        },
      });

    return res.status(200).json({
      message: "Support tickets fetched successfully",
      tickets,
    });
  } catch (error) {
    console.error(
      "Get my support tickets error:",
      error
    );

    return res.status(500).json({
      message:
        "Something went wrong. Please try again.",
    });
  }
};

/*
 * =====================================================
 * CUSTOMER - GET MY SUPPORT TICKET BY ID
 * =====================================================
 */

const getMySupportTicketById = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({
        message: "Not authenticated",
      });
    }

    if (req.session.user.role !== "CUSTOMER") {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    const ticketId = Number(req.params.id);

    if (!Number.isInteger(ticketId)) {
      return res.status(400).json({
        message: "Invalid ticket ID",
      });
    }

    const ticket =
      await prisma.supportTicket.findFirst({
        where: {
          id: ticketId,
          userId: req.session.user.id,
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

          payment: {
            select: {
              id: true,
              amount: true,
              status: true,
              paymentMethod: true,
              transactionId: true,
              paymentDate: true,
            },
          },

          messages: {
            orderBy: {
              createdAt: "asc",
            },
            select: {
              id: true,
              message: true,
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
        message: "Support ticket not found",
      });
    }
  
    return res.status(200).json({
      message: "Support ticket fetched successfully",
      ticket,
    });
  } catch (error) {
    console.error(
      "Get my support ticket error:",
      error
    );

    return res.status(500).json({
      message:
        "Something went wrong. Please try again.",
    });
  }
};

/*
 * =====================================================
 * ADMIN - GET SUPPORT TICKETS
 * =====================================================
 */

const getSupportTickets = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({
        message: "Not authenticated",
      });
    }

    if (req.session.user.role !== "ADMIN") {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    const tickets =
      await prisma.supportTicket.findMany({
        orderBy: {
          createdAt: "desc",
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

          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

    return res.status(200).json({
      message: "Support tickets fetched successfully",
      tickets,
    });
  } catch (error) {
    console.error(
      "Get support tickets error:",
      error
    );

    return res.status(500).json({
      message:
        "Something went wrong. Please try again.",
    });
  }
};

/*
 * =====================================================
 * ADMIN - GET SUPPORT TICKET BY ID
 * =====================================================
 */

const getSupportTicketById = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({
        message: "Not authenticated",
      });
    }

    if (req.session.user.role !== "ADMIN") {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    const ticketId = Number(req.params.id);

    if (!Number.isInteger(ticketId)) {
      return res.status(400).json({
        message: "Invalid ticket ID",
      });
    }

    const ticket =
      await prisma.supportTicket.findUnique({
        where: {
          id: ticketId,
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

          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },

          payment: {
            select: {
              id: true,
              amount: true,
              status: true,
              paymentMethod: true,
              transactionId: true,
              paymentDate: true,
            },
          },

          messages: {
            orderBy: {
              createdAt: "asc",
            },
            select: {
              id: true,
              message: true,
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
        message: "Support ticket not found",
      });
    }
    

    return res.status(200).json({
      message: "Support ticket fetched successfully",
      ticket,
    });
  } catch (error) {
    console.error(
      "Get support ticket by ID error:",
      error
    );

    return res.status(500).json({
      message:
        "Something went wrong. Please try again.",
    });
  }
};

/*
 * =====================================================
 * ADMIN - UPDATE SUPPORT TICKET STATUS
 * =====================================================
 */

const updateSupportTicketStatus = async (
  req,
  res
) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({
        message: "Not authenticated",
      });
    }

    if (req.session.user.role !== "ADMIN") {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    const ticketId = Number(req.params.id);

    if (!Number.isInteger(ticketId)) {
      return res.status(400).json({
        message: "Invalid ticket ID",
      });
    }

    const { status } = req.body;

    const validStatuses = [
      "OPEN",
      "IN_PROGRESS",
      "RESOLVED",
      "CLOSED",
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid support ticket status",
      });
    }

    const existingTicket =
      await prisma.supportTicket.findUnique({
        where: {
          id: ticketId,
        },
      });

    if (!existingTicket) {
      return res.status(404).json({
        message: "Support ticket not found",
      });
    }

    if (existingTicket.status === "CLOSED") {
      return res.status(400).json({
        message:
          "Closed support tickets cannot be reopened or modified.",
      });
    }

    const updatedTicket =
      await prisma.supportTicket.update({
        where: {
          id: ticketId,
        },
        data: {
          status,
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
const io = req.app.get("io");

if (io) {
  io.to(`support-ticket-${updatedTicket.id}`).emit(
    "support-ticket-status-updated",
    {
      ticketId: updatedTicket.id,
      status: updatedTicket.status,
    }
  );
}
    /*
     * Notify the customer who owns the ticket.
     */
    await createNotification({
      userId: updatedTicket.userId,
      type: "SUPPORT_TICKET_UPDATED",
      title: "Support ticket updated",
      message: `Your support ticket #${updatedTicket.id} is now ${updatedTicket.status.replace(
        "_",
        " "
      )}.`,
      details: {
        ticketId: updatedTicket.id,
        subject: updatedTicket.subject,
        status: updatedTicket.status,
        updatedAt: updatedTicket.updatedAt,
      },
    });

    /*
     * Do not notify the admin who made the change.
     */

    const ticketForResponse = {
      id: updatedTicket.id,
      category: updatedTicket.category,
      subject: updatedTicket.subject,
      description: updatedTicket.description,
      status: updatedTicket.status,
      paymentId: updatedTicket.paymentId,
      createdAt: updatedTicket.createdAt,
      updatedAt: updatedTicket.updatedAt,
    };

    return res.status(200).json({
      message:
        "Support ticket status updated successfully",
      ticket: ticketForResponse,
    });
  } catch (error) {
    console.error(
      "Update support ticket status error:",
      error
    );

    return res.status(500).json({
      message:
        "Something went wrong. Please try again.",
    });
  }
};

/*
 * =====================================================
 * CUSTOMER / ADMIN - ADD TICKET MESSAGE
 * =====================================================
 */

const addTicketMessage = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({
        message: "Not authenticated",
      });
    }

    const ticketId = Number(req.params.id);

    if (!Number.isInteger(ticketId)) {
      return res.status(400).json({
        message: "Invalid ticket ID",
      });
    }

    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        message: "Message is required",
      });
    }

    const ticket =
      await prisma.supportTicket.findUnique({
        where: {
          id: ticketId,
        },
        select: {
          id: true,
          userId: true,
          status: true,
          subject: true,
        },
      });

    if (!ticket) {
      return res.status(404).json({
        message: "Support ticket not found",
      });
    }
if (ticket.status === "CLOSED") {
  return res.status(400).json({
    message: "Closed support tickets cannot receive new messages.",
  });
}
    if (
      req.session.user.role === "CUSTOMER" &&
      ticket.userId !== req.session.user.id
    ) {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    if (
      req.session.user.role !== "CUSTOMER" &&
      req.session.user.role !== "ADMIN"
    ) {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    const ticketMessage =
      await prisma.ticketMessage.create({
        data: {
          ticketId: ticket.id,
          senderId: req.session.user.id,
          message: message.trim(),
        },
        select: {
          id: true,
          message: true,
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

    /*
     * =====================================================
     * SOCKET.IO - SEND MESSAGE IN REAL TIME
     * =====================================================
     */

    const io = req.app.get("io");

    if (io) {
      io.to(`support-ticket-${ticket.id}`).emit(
        "new-support-message",
        {
          ticketId: ticket.id,
          ticketMessage,
        }
      );
    }

    /*
     * CUSTOMER SENT MESSAGE
     * Notify all admins.
     */
    if (req.session.user.role === "CUSTOMER") {
      const adminUsers = await prisma.user.findMany({
        where: {
          role: {
            name: "ADMIN",
          },
        },
        select: {
          id: true,
        },
      });

      for (const admin of adminUsers) {
        await createNotification({
          userId: admin.id,
          type: "NEW_SUPPORT_MESSAGE",
          title: "New support message",
          message: `A customer replied to support ticket #${ticket.id}.`,
          details: {
            ticketId: ticket.id,
            subject: ticket.subject,
            messageId: ticketMessage.id,
            sentAt: ticketMessage.createdAt,
          },
        });
      }
    }

    /*
     * ADMIN SENT MESSAGE
     * Notify the customer who owns the ticket.
     */
    if (req.session.user.role === "ADMIN") {
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
    }

    return res.status(201).json({
      message: "Message added successfully",
      ticketMessage,
    });
  } catch (error) {
    console.error(
      "Add ticket message error:",
      error
    );

    return res.status(500).json({
      message:
        "Something went wrong. Please try again.",
    });
  }
};

module.exports = {
  createSupportTicket,
  getMySupportTickets,
  getMySupportTicketById,
  getSupportTickets,
  getSupportTicketById,
  updateSupportTicketStatus,
  addTicketMessage,
};