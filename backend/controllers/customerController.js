const { PrismaClient } = require("../generated/prisma");

const prisma = new PrismaClient();

const getCustomers = async (req, res) => {
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


    const page = Math.max(
      Number.parseInt(req.query.page, 10) || 1,
      1
    );

    const limit = Math.min(
      Math.max(
        Number.parseInt(req.query.limit, 10) || 5,
        1
      ),
      100
    );

    const skip = (page - 1) * limit;

    
    const search = req.query.search?.trim() || "";
    const status = req.query.status || "ALL";

    const customerWhere = {
      role: {
        name: "CUSTOMER",
      },
    };


    if (search) {
      customerWhere.OR = [
        {
          name: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          email: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          subscriptions: {
            some: {
              plan: {
                name: {
                  contains: search,
                  mode: "insensitive",
                },
              },
            },
          },
        },
      ];
    }

    
    if (status === "NO_SUBSCRIPTION") {
      customerWhere.subscriptions = {
        none: {},
      };
    }

    if (status === "ACTIVE") {
      customerWhere.subscriptions = {
        some: {
          status: "ACTIVE",
        },
      };
    }

   
    const totalCustomers = await prisma.user.count({
      where: customerWhere,
    });

  
    const customers = await prisma.user.findMany({
      where: customerWhere,

      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        updatedAt: true,

        subscriptions: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1,

          select: {
            id: true,
            status: true,
            startDate: true,
            renewalDate: true,

            plan: {
              select: {
                id: true,
                name: true,
                price: true,
                billingPeriod: true,
                isActive: true,
              },
            },
          },
        },
      },

      orderBy: {
        createdAt: "desc",
      },

      skip,
      take: limit,
    });

    const totalPages = Math.ceil(
      totalCustomers / limit
    );

    return res.status(200).json({
      message: "Customers fetched successfully",
      customers,
      pagination: {
        currentPage: page,
        totalPages,
        totalCustomers,
        limit,
      },
    });
  } catch (error) {
    console.error("Get customers error:", error);

    return res.status(500).json({
      message: "Something went wrong. Please try again.",
    });
  }
};

const getCustomerById = async (req, res) => {
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

    const customerId = Number(req.params.id);

    if (!Number.isInteger(customerId)) {
      return res.status(400).json({
        message: "Invalid customer ID",
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
        createdAt: true,
        updatedAt: true,

        subscriptions: {
          orderBy: {
            createdAt: "desc",
          },

          select: {
            id: true,
            status: true,
            startDate: true,
            renewalDate: true,
            createdAt: true,

            plan: {
              select: {
                id: true,
                name: true,
                description: true,
                price: true,
                billingPeriod: true,
                features: true,
                isActive: true,
              },
            },

            payments: {
              orderBy: {
                paymentDate: "desc",
              },

              select: {
                id: true,
                amount: true,
                status: true,
                paymentMethod: true,
                transactionId: true,
                paymentDate: true,
                createdAt: true,
              },
            },
          },
        },
      },
    });

    if (!customer) {
      return res.status(404).json({
        message: "Customer not found",
      });
    }

    return res.status(200).json({
      message: "Customer fetched successfully",
      customer,
    });
  } catch (error) {
    console.error(
      "Get customer by ID error:",
      error
    );

    return res.status(500).json({
      message:
        "Something went wrong. Please try again.",
    });
  }
};

module.exports = {
  getCustomers,
  getCustomerById,
};