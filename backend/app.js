const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const authRoutes = require("./routes/authRoutes");
const planRoutes = require("./routes/planRoutes");
const subscriptionRoutes = require("./routes/subscriptionRoutes");
const customerRoutes = require("./routes/customerRoutes");
const supportRoutes = require("./routes/supportRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

const cors = require("cors");
const session = require("express-session");

const app = express();

const server = http.createServer(app);

const sessionMiddleware = session({
  secret:
    process.env.SESSION_SECRET ||
    "subflow-session-secret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
  },
});

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    credentials: true,
  },
});

/*
 * Make Socket.IO available to Express controllers.
 */
app.set("io", io);

/*
 * CORS
 */
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());

/*
 * Express session
 */
app.use(sessionMiddleware);

/*
 * Existing routes
 */
app.use("/", authRoutes);
app.use("/", planRoutes);
app.use("/", subscriptionRoutes);
app.use("/", customerRoutes);
app.use("/", supportRoutes);
app.use("/", paymentRoutes);
app.use("/", notificationRoutes);

/*
 * =====================================================
 * SOCKET.IO SESSION
 * =====================================================
 *
 * Reuse the same Express session used by
 * the REST APIs.
 */
io.use((socket, next) => {
  sessionMiddleware(
    socket.request,
    {},
    next
  );
});

/*
 * =====================================================
 * SOCKET.IO CONNECTION
 * =====================================================
 */

io.on("connection", (socket) => {
  const user = socket.request.session?.user;

  if (!user) {
    console.log(
      `Unauthenticated socket rejected: ${socket.id}`
    );

    socket.disconnect(true);
    return;
  }

  console.log(
    `Socket connected: ${socket.id} | User: ${user.id} | Role: ${user.role}`
  );

  /*
   * ===================================================
   * JOIN SUPPORT TICKET
   * ===================================================
   */

  socket.on(
    "join-support-ticket",
    async (ticketId) => {
      try {
        const parsedTicketId =
          Number(ticketId);

        if (
          !Number.isInteger(parsedTicketId)
        ) {
          return;
        }

        const { PrismaClient } = require(
          "./generated/prisma"
        );

        const prisma = new PrismaClient();

        const ticket =
          await prisma.supportTicket.findUnique({
            where: {
              id: parsedTicketId,
            },
            select: {
              id: true,
              userId: true,
            },
          });

        await prisma.$disconnect();

        if (!ticket) {
          console.log(
            `Ticket ${parsedTicketId} not found for socket ${socket.id}`
          );

          return;
        }

        /*
         * Customer can only join their own ticket.
         */
        if (
          user.role === "CUSTOMER" &&
          ticket.userId !== user.id
        ) {
          console.log(
            `Customer ${user.id} denied access to ticket ${parsedTicketId}`
          );

          return;
        }

        /*
         * Only CUSTOMER and ADMIN users
         * are allowed in support chat.
         */
        if (
          user.role !== "CUSTOMER" &&
          user.role !== "ADMIN"
        ) {
          return;
        }

        const roomName =
          `support-ticket-${parsedTicketId}`;

        socket.join(roomName);

        console.log(
          `User ${user.id} joined ${roomName}`
        );
      } catch (error) {
        console.error(
          "Socket join support ticket error:",
          error
        );
      }
    }
  );

  socket.on("disconnect", () => {
    console.log(
      `Socket disconnected: ${socket.id}`
    );
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(
    `Server running on http://localhost:${PORT}`
  );
});