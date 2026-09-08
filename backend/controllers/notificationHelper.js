const { PrismaClient } = require("../generated/prisma");

const prisma = new PrismaClient();

const createNotification = async ({
  userId,
  type,
  title,
  message,
  details = null,
}) => {
  try {
    return await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        details,
      },
    });
  } catch (error) {
    console.error(
      "Create notification error:",
      error
    );

    return null;
  }
};

module.exports = {
  createNotification,
};