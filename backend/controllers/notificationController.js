const { PrismaClient } = require("../generated/prisma");

const prisma = new PrismaClient();

/* =========================================================
   CUSTOMER NOTIFICATIONS
========================================================= */

const getCustomerNotifications = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({
        message: "Not authenticated.",
      });
    }

    if (req.session.user.role !== "CUSTOMER") {
      return res.status(403).json({
        message: "Access denied.",
      });
    }

    const userId = req.session.user.id;

    const notifications = await prisma.notification.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 15,
    });

    return res.status(200).json({
      notifications,
    });
  } catch (error) {
    console.error(
      "Get customer notifications error:",
      error
    );

    return res.status(500).json({
      message: "Unable to load notifications.",
    });
  }
};


/* =========================================================
   ADMIN NOTIFICATIONS
========================================================= */

const getAdminNotifications = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({
        message: "Not authenticated.",
      });
    }

    if (req.session.user.role !== "ADMIN") {
      return res.status(403).json({
        message: "Access denied.",
      });
    }

    const userId = req.session.user.id;

    const notifications = await prisma.notification.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 15,
    });

    return res.status(200).json({
      notifications,
    });
  } catch (error) {
    console.error(
      "Get admin notifications error:",
      error
    );

    return res.status(500).json({
      message: "Unable to load notifications.",
    });
  }
};


/* =========================================================
   MARK NOTIFICATION AS READ
========================================================= */

const markNotificationAsRead = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({
        message: "Not authenticated.",
      });
    }

    const userId = req.session.user.id;
    const notificationId = Number(req.params.id);

    if (Number.isNaN(notificationId)) {
      return res.status(400).json({
        message: "Invalid notification ID.",
      });
    }

    const notification =
      await prisma.notification.findFirst({
        where: {
          id: notificationId,
          userId,
        },
      });

    if (!notification) {
      return res.status(404).json({
        message: "Notification not found.",
      });
    }

    const updatedNotification =
      await prisma.notification.update({
        where: {
          id: notificationId,
        },
        data: {
          isRead: true,
        },
      });

    return res.status(200).json({
      message: "Notification marked as read.",
      notification: updatedNotification,
    });
  } catch (error) {
    console.error(
      "Mark notification as read error:",
      error
    );

    return res.status(500).json({
      message: "Unable to update notification.",
    });
  }
};


module.exports = {
  getCustomerNotifications,
  getAdminNotifications,
  markNotificationAsRead,
};