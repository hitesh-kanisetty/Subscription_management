const PDFDocument = require("pdfkit");
const path = require("path");
const fs = require("fs");

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

const exportCustomers = async (req, res) => {
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

    const customers = await prisma.user.findMany({
      where: customerWhere,

      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,

        subscriptions: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1,

          select: {
            status: true,
            renewalDate: true,

            plan: {
              select: {
                name: true,
              },
            },
          },
        },
      },

      orderBy: {
        createdAt: "desc",
      },
    });

    const exportData = customers.map((customer) => {
      const subscription =
        customer.subscriptions?.[0] || null;

      return {
        ID: customer.id,
        Customer: customer.name || "",
        Email: customer.email || "",
        Plan: subscription?.plan?.name || "No plan",
        Status:
          subscription?.status || "Not subscribed",
        Renewal: subscription?.renewalDate
          ? new Date(
              subscription.renewalDate
            ).toLocaleDateString("en-IN")
          : "—",
        "Created Date": customer.createdAt
          ? new Date(
              customer.createdAt
            ).toLocaleDateString("en-IN")
          : "—",
      };
    });

    return res.status(200).json({
      message:
        "Customer export data fetched successfully",
      customers: exportData,
    });
  } catch (error) {
    console.error(
      "Export customers error:",
      error
    );

    return res.status(500).json({
      message: "Something went wrong. Please try again.",
    });
  }
};

const exportCustomersPdf = async (req, res) => {
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

    const customers = await prisma.user.findMany({
      where: customerWhere,

      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,

        subscriptions: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1,

          select: {
            status: true,
            renewalDate: true,

            plan: {
              select: {
                name: true,
              },
            },
          },
        },
      },

      orderBy: {
        createdAt: "desc",
      },
    });

    const logoPath = path.join(
      __dirname,
      "../assets/subflow-logo.png"
    );

    if (!fs.existsSync(logoPath)) {
      return res.status(500).json({
        message:
          "Report logo is missing on the server.",
      });
    }

    const formatDate = (date) => {
      if (!date) return "—";

      return new Date(date).toLocaleDateString(
        "en-IN",
        {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }
      );
    };

    const rows = customers.map((customer) => {
      const subscription =
        customer.subscriptions?.[0] || null;

      return {
        id: customer.id,
        name: customer.name || "—",
        email: customer.email || "—",
        plan:
          subscription?.plan?.name || "No plan",
        status:
          subscription?.status || "Not subscribed",
        renewal: formatDate(
          subscription?.renewalDate
        ),
        created: formatDate(customer.createdAt),
      };
    });

    const doc = new PDFDocument({
      size: "A4",
      layout: "landscape",
      margin: 0,
      autoFirstPage: true,
    });

    res.setHeader(
      "Content-Type",
      "application/pdf"
    );

    res.setHeader(
      "Content-Disposition",
      'attachment; filename="customers-report.pdf"'
    );

    doc.pipe(res);

    const primary = "#2563EB";
    const dark = "#111827";
    const text = "#374151";
    const muted = "#6B7280";
    const border = "#E5E7EB";
    const headerBackground = "#F8FAFC";
    const alternateRow = "#FAFAFA";

    const pageWidth = 841.89;
    const pageHeight = 595.28;

    const left = 42;
    const right = pageWidth - 42;
    const contentWidth = right - left;

    const addHeader = () => {
      doc
        .rect(0, 0, pageWidth, 105)
        .fill(headerBackground);

      doc.image(logoPath, left, 24, {
        width: 48,
        height: 48,
      });

      doc
        .font("Helvetica-Bold")
        .fontSize(20)
        .fillColor(dark)
        .text("SubFlow", left + 62, 25);

      doc
        .font("Helvetica")
        .fontSize(8.5)
        .fillColor(muted)
        .text(
          "Subscription Management Platform",
          left + 62,
          49
        );

      doc
        .font("Helvetica-Bold")
        .fontSize(20)
        .fillColor(primary)
        .text("CUSTOMER REPORT", 550, 28, {
          width: 250,
          align: "right",
        });

      doc
        .font("Helvetica")
        .fontSize(8.5)
        .fillColor(muted)
        .text(
          `Generated: ${formatDate(new Date())}`,
          550,
          57,
          {
            width: 250,
            align: "right",
          }
        );
    };

    const drawTableHeader = (y) => {
      const columns = [
        {
          title: "ID",
          width: 42,
        },
        {
          title: "CUSTOMER",
          width: 125,
        },
        {
          title: "EMAIL",
          width: 205,
        },
        {
          title: "PLAN",
          width: 100,
        },
        {
          title: "STATUS",
          width: 100,
        },
        {
          title: "RENEWAL",
          width: 100,
        },
        {
          title: "CREATED DATE",
          width: 127,
        },
      ];

      let x = left;

      doc
        .rect(left, y, contentWidth, 30)
        .fill(primary);

      columns.forEach((column) => {
        doc
          .font("Helvetica-Bold")
          .fontSize(7.5)
          .fillColor("#FFFFFF")
          .text(
            column.title,
            x + 8,
            y + 10,
            {
              width: column.width - 16,
              align: "left",
            }
          );

        x += column.width;
      });

      return columns;
    };

    const drawRow = (
      row,
      y,
      rowHeight,
      columns,
      alternate
    ) => {
      if (alternate) {
        doc
          .rect(
            left,
            y,
            contentWidth,
            rowHeight
          )
          .fill(alternateRow);
      }

      doc
        .rect(
          left,
          y,
          contentWidth,
          rowHeight
        )
        .lineWidth(0.5)
        .strokeColor(border)
        .stroke();

      const values = [
        String(row.id),
        row.name,
        row.email,
        row.plan,
        row.status,
        row.renewal,
        row.created,
      ];

      let x = left;

      values.forEach((value, index) => {
        const column = columns[index];

        doc
          .font(
            index === 0
              ? "Helvetica-Bold"
              : "Helvetica"
          )
          .fontSize(8)
          .fillColor(
            index === 4 && row.status === "ACTIVE"
              ? "#047857"
              : text
          )
          .text(
            value,
            x + 8,
            y + 9,
            {
              width: column.width - 16,
              height: rowHeight - 12,
              ellipsis: true,
            }
          );

        x += column.width;
      });
    };

    const drawFooter = () => {
      const footerY = pageHeight - 32;

      doc
        .moveTo(left, footerY - 8)
        .lineTo(right, footerY - 8)
        .lineWidth(0.5)
        .strokeColor(border)
        .stroke();

      doc
        .font("Helvetica")
        .fontSize(7.5)
        .fillColor(muted)
        .text(
          `Total customers: ${rows.length}`,
          left,
          footerY
        );

      doc
        .text(
          "SubFlow Customer Management",
          0,
          footerY,
          {
            width: pageWidth,
            align: "center",
          }
        );
    };

    addHeader();

    let y = 125;

    doc
      .font("Helvetica-Bold")
      .fontSize(8)
      .fillColor(muted)
      .text("REPORT FILTERS", left, y);

    y += 17;

    const filterText = [
      `Status: ${
        status === "ALL"
          ? "All"
          : status === "NO_SUBSCRIPTION"
            ? "No subscription"
            : "Active"
      }`,
      search
        ? `Search: ${search}`
        : "Search: All customers",
    ].join("   |   ");

    doc
      .font("Helvetica")
      .fontSize(8.5)
      .fillColor(text)
      .text(filterText, left, y);

    y += 25;

    const columns = drawTableHeader(y);

    y += 30;

    const rowHeight = 31;

    if (rows.length === 0) {
      doc
        .font("Helvetica")
        .fontSize(9)
        .fillColor(muted)
        .text(
          "No customers found for the selected filters.",
          left,
          y + 15,
          {
            width: contentWidth,
            align: "center",
          }
        );
    } else {
      rows.forEach((row, index) => {
        if (
          y + rowHeight >
          pageHeight - 48
        ) {
          drawFooter();

          doc.addPage();

          addHeader();

          y = 125;

          doc
            .font("Helvetica-Bold")
            .fontSize(8)
            .fillColor(muted)
            .text(
              "CUSTOMER REPORT — CONTINUED",
              left,
              y
            );

          y += 20;

          drawTableHeader(y);

          y += 30;
        }

        drawRow(
          row,
          y,
          rowHeight,
          columns,
          index % 2 === 1
        );

        y += rowHeight;
      });
    }

    drawFooter();

    doc.end();
  } catch (error) {
    console.error(
      "Export customers PDF error:",
      error
    );

    if (!res.headersSent) {
      return res.status(500).json({
        message:
          "Unable to generate customer report.",
      });
    }
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
  exportCustomers,
  exportCustomersPdf,
  getCustomerById,
};