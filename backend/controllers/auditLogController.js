const { PrismaClient } = require("../generated/prisma");

const prisma = new PrismaClient();

const getAuditLogs = async (req, res) => {
  try {
    // Only admins can access audit logs
    if (!req.session.user) {
      return res.status(401).json({
        message: "Not authenticated",
      });
    }

    if (req.session.user.role !== "ADMIN") {
      return res.status(403).json({
        message: "Admin access required",
      });
    }

    const page = Math.max(
      1,
      Number.parseInt(req.query.page, 10) || 1
    );

    const limit = Math.min(
      100,
      Math.max(
        1,
        Number.parseInt(req.query.limit, 10) || 20
      )
    );

    const search = req.query.search?.trim() || "";
    const module = req.query.module?.trim() || "";
    const action = req.query.action?.trim() || "";
    const from = req.query.from?.trim() || "";
    const to = req.query.to?.trim() || "";

    const where = {};

    if (search) {
      where.OR = [
        {
          description: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          user: {
            name: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
        {
          user: {
            email: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
      ];
    }

    if (module) {
      where.module = module;
    }

    if (action) {
      where.action = action;
    }

    if (from || to) {
      where.createdAt = {};

      if (from) {
        where.createdAt.gte = new Date(`${from}T00:00:00`);
      }

      if (to) {
        where.createdAt.lte = new Date(`${to}T23:59:59.999`);
      }
    }

    const skip = (page - 1) * limit;

    const [logs, totalLogs] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: "desc",
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
      }),

      prisma.auditLog.count({
        where,
      }),
    ]);

    const totalPages = Math.ceil(totalLogs / limit);

    return res.status(200).json({
      logs,
      pagination: {
        page,
        limit,
        totalLogs,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Get audit logs error:", error);

    return res.status(500).json({
      message: "Unable to load audit logs",
    });
  }
};

module.exports = {
  getAuditLogs,
};