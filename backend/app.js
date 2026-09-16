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

const isProduction = process.env.NODE_ENV === "production";

const frontendUrl =
  process.env.FRONTEND_URL;

const sessionSecret =
  process.env.SESSION_SECRET;


if (isProduction) {
  app.set("trust proxy", 1);
}



const sessionMiddleware = session({
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
  },
});


const io = new Server(server, {
  cors: {
    origin: frontendUrl,
    credentials: true,
  },
});


app.set("io", io);



app.use(
  cors({
    origin: frontendUrl,
    credentials: true,
  })
);

app.use(express.json());

app.use(sessionMiddleware);


app.use("/", authRoutes);
app.use("/", planRoutes);
app.use("/", subscriptionRoutes);
app.use("/", customerRoutes);
app.use("/", supportRoutes);
app.use("/", paymentRoutes);
app.use("/", notificationRoutes);


io.use((socket, next) => {
  sessionMiddleware(
    socket.request,
    {},
    next
  );
});


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
        if (
          user.role === "CUSTOMER" &&
          ticket.userId !== user.id
        ) {
          console.log(
            `Customer ${user.id} denied access to ticket ${parsedTicketId}`
          );

          return;
        }
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
    `Server running on port ${PORT}`
  );
});