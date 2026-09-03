const { PrismaClient } = require("../generated/prisma");

const prisma = new PrismaClient();

/*
 * =====================================================
 * CUSTOMER - CREATE SUPPORT TICKET
 * =====================================================
 */

const createSupportTicket = async (req, res) => {
  try {
    // Check authentication
    if (!req.session.user) {
      return res.status(401).json({
        message: "Not authenticated",
      });
    }

    // Only customers can create support tickets
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

    // Validate required fields
    if (!category || !subject || !description) {
      return res.status(400).json({
        message:
          "Category, subject and description are required",
      });
    }

    // Validate category
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

    // Clean text values
    const cleanedSubject = subject.trim();
    const cleanedDescription = description.trim();

    if (!cleanedSubject || !cleanedDescription) {
      return res.status(400).json({
        message:
          "Subject and description cannot be empty",
      });
    }

    /*
     * If a payment is attached to the ticket,
     * make sure that payment actually belongs
     * to the logged-in customer.
     */
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

    // Create ticket
    const ticket = await prisma.supportTicket.create({
      data: {
        userId: req.session.user.id,
        paymentId: validPaymentId,
        category,
        subject: cleanedSubject,
        description: cleanedDescription,
        status: "OPEN",
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
    // Check authentication
    if (!req.session.user) {
      return res.status(401).json({
        message: "Not authenticated",
      });
    }

    // Only customers can access their tickets
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
    // Check authentication
    if (!req.session.user) {
      return res.status(401).json({
        message: "Not authenticated",
      });
    }

    // Only customers can access their tickets
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

    /*
     * The userId condition is important.
     * A customer can only retrieve their own ticket.
     */
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
 * ADMIN - GET ALL SUPPORT TICKETS
 * =====================================================
 */

const getSupportTickets = async (req, res) => {
  try {
    // Check authentication
    if (!req.session.user) {
      return res.status(401).json({
        message: "Not authenticated",
      });
    }

    // Only Admin can access all tickets
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
    // Check authentication
    if (!req.session.user) {
      return res.status(401).json({
        message: "Not authenticated",
      });
    }

    // Only Admin can access ticket details
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
    // Check authentication
    if (!req.session.user) {
      return res.status(401).json({
        message: "Not authenticated",
      });
    }

    // Only Admin can update ticket status
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

    /*
     * Once a ticket is CLOSED, it is permanently closed.
     * It cannot be reopened or changed to another status.
     */
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
        },
      });

    return res.status(200).json({
      message:
        "Support ticket status updated successfully",
      ticket: updatedTicket,
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
 * ADMIN / CUSTOMER - ADD TICKET MESSAGE
 * =====================================================
 */

const addTicketMessage = async (req, res) => {
  try {
    // Check authentication
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
        },
      });

    if (!ticket) {
      return res.status(404).json({
        message: "Support ticket not found",
      });
    }

    /*
     * Customer can only reply to their own ticket.
     * Admin can reply to any ticket.
     */
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