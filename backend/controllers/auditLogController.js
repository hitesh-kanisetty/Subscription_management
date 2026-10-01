const { PrismaClient } = require("../generated/prisma");
const PDFDocument = require("pdfkit");
const path = require("path");
const fs = require("fs");

const prisma = new PrismaClient();

const logoPath = path.join(
  __dirname,
  "../assets/subflow-logo.png"
);

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
const exportAuditLogs = async (req, res) => {
  try {
    // Only admins can export audit logs
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
        where.createdAt.gte = new Date(
          `${from}T00:00:00`
        );
      }

      if (to) {
        where.createdAt.lte = new Date(
          `${to}T23:59:59.999`
        );
      }
    }

    const logs = await prisma.auditLog.findMany({
      where,
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
    });

    if (logs.length === 0) {
      return res.status(404).json({
        message: "No audit logs available to export.",
      });
    }

    const exportLogs = logs.map((log) => ({
      ID: log.id,
      User: log.user?.name || "-",
      Email: log.user?.email || "-",
      Module: log.module || "-",
      Action: log.action || "-",
      Description: log.description || "-",
      "Created Date": log.createdAt
        ? new Date(log.createdAt).toLocaleString(
            "en-IN"
          )
        : "-",
    }));

    return res.status(200).json({
      logs: exportLogs,
    });
  } catch (error) {
    console.error("Export audit logs error:", error);

    return res.status(500).json({
      message: "Unable to export audit logs.",
    });
  }
};
const exportAuditLogsPdf = async (req, res) => {
  try {
    // Only admins can export audit logs
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
        where.createdAt.gte = new Date(
          `${from}T00:00:00`
        );
      }

      if (to) {
        where.createdAt.lte = new Date(
          `${to}T23:59:59.999`
        );
      }
    }

    const logs = await prisma.auditLog.findMany({
      where,
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
    });

    if (logs.length === 0) {
      return res.status(404).json({
        message: "No audit logs available to export.",
      });
    }

    const doc = new PDFDocument({
      size: "A4",
      layout: "landscape",
      margins: {
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
      },
    });

    res.setHeader(
      "Content-Type",
      "application/pdf"
    );

    res.setHeader(
      "Content-Disposition",
      'attachment; filename="audit-logs-report.pdf"'
    );

    doc.pipe(res);

    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;

    const blue = "#2563eb";
    const darkText = "#111827";
    const mutedText = "#6b7280";
    const borderColor = "#dbe3f0";
    const alternateRow = "#f8fafc";

    // ---------------------------------------------
    // HEADER
    // ---------------------------------------------

    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, 50, 30, {
        width: 60,
        height: 60,
      });
    }

    doc
      .fillColor(darkText)
      .fontSize(21)
      .font("Helvetica-Bold")
      .text("SubFlow", 125, 31);

    doc
      .fillColor(mutedText)
      .fontSize(9)
      .font("Helvetica")
      .text(
        "Subscription Management Platform",
        126,
        59
      );

    doc
      .fillColor(blue)
      .fontSize(20)
      .font("Helvetica-Bold")
      .text(
        "AUDIT LOG REPORT",
        540,
        35,
        {
          width: 252,
          align: "right",
        }
      );

    doc
      .fillColor(mutedText)
      .fontSize(8)
      .font("Helvetica")
      .text(
        `Generated: ${new Date().toLocaleString(
          "en-IN"
        )}`,
        540,
        62,
        {
          width: 252,
          align: "right",
        }
      );

    doc
      .strokeColor(borderColor)
      .lineWidth(1)
      .moveTo(50, 100)
      .lineTo(pageWidth - 50, 100)
      .stroke();

    // ---------------------------------------------
    // FILTERS
    // ---------------------------------------------

    doc
      .fillColor(darkText)
      .fontSize(10)
      .font("Helvetica-Bold")
      .text("REPORT FILTERS", 50, 124);

    const filters = [];

    filters.push(
      search
        ? `Search: ${search}`
        : "Search: All"
    );

    filters.push(
      module
        ? `Module: ${module}`
        : "Module: All"
    );

    filters.push(
      action
        ? `Action: ${action}`
        : "Action: All"
    );

    if (from) {
      filters.push(`From: ${from}`);
    }

    if (to) {
      filters.push(`To: ${to}`);
    }

    doc
      .fillColor(mutedText)
      .fontSize(8)
      .font("Helvetica")
      .text(filters.join("   |   "), 50, 141);

    // ---------------------------------------------
    // TABLE
    // ---------------------------------------------

    const tableX = 50;
    let currentY = 166;

    const columns = [
      {
        label: "ID",
        width: 45,
      },
      {
        label: "USER",
        width: 125,
      },
      {
        label: "MODULE",
        width: 85,
      },
      {
        label: "ACTION",
        width: 95,
      },
      {
        label: "DESCRIPTION",
        width: 220,
      },
      {
        label: "CREATED DATE",
        width: 172,
      },
    ];

    const tableWidth = columns.reduce(
      (total, column) =>
        total + column.width,
      0
    );

    const headerHeight = 28;
    const rowHeight = 36;

    const drawTableHeader = () => {
      let x = tableX;

      doc
        .fillColor(blue)
        .rect(
          tableX,
          currentY,
          tableWidth,
          headerHeight
        )
        .fill();

      columns.forEach((column) => {
        doc
          .fillColor("#ffffff")
          .fontSize(7.5)
          .font("Helvetica-Bold")
          .text(
            column.label,
            x + 5,
            currentY + 9,
            {
              width: column.width - 10,
              align: "left",
              ellipsis: true,
            }
          );

        x += column.width;
      });

      currentY += headerHeight;
    };

    const drawRow = (log, index) => {
      const values = [
        String(log.id),
        log.user?.name || "-",
        log.module || "-",
        log.action || "-",
        log.description || "-",
        log.createdAt
          ? new Date(
              log.createdAt
            ).toLocaleString("en-IN")
          : "-",
      ];

      if (index % 2 === 1) {
        doc
          .fillColor(alternateRow)
          .rect(
            tableX,
            currentY,
            tableWidth,
            rowHeight
          )
          .fill();
      }

      doc
        .strokeColor(borderColor)
        .lineWidth(0.5)
        .rect(
          tableX,
          currentY,
          tableWidth,
          rowHeight
        )
        .stroke();

      let x = tableX;

      values.forEach((value, valueIndex) => {
        const column = columns[valueIndex];

        doc
          .fillColor(darkText)
          .fontSize(7.2)
          .font("Helvetica")
          .text(
            String(value),
            x + 5,
            currentY + 11,
            {
              width: column.width - 10,
              height: 15,
              ellipsis: true,
              lineBreak: false,
            }
          );

        x += column.width;
      });

      currentY += rowHeight;
    };

    const drawFooter = () => {
      const footerY = pageHeight - 30;

      doc
        .strokeColor(borderColor)
        .lineWidth(0.5)
        .moveTo(50, footerY - 8)
        .lineTo(
          pageWidth - 50,
          footerY - 8
        )
        .stroke();

      doc
        .fillColor(mutedText)
        .fontSize(8)
        .font("Helvetica")
        .text(
          `Total audit logs: ${logs.length}`,
          50,
          footerY
        );

      doc
        .fillColor(mutedText)
        .fontSize(8)
        .font("Helvetica")
        .text(
          "SubFlow Audit Log Management",
          0,
          footerY,
          {
            width: pageWidth - 50,
            align: "right",
          }
        );
    };

    drawTableHeader();

    logs.forEach((log, index) => {
      if (
        currentY + rowHeight >
        pageHeight - 45
      ) {
        drawFooter();

        doc.addPage();

        currentY = 45;

        drawTableHeader();
      }

      drawRow(log, index);
    });

    drawFooter();

    doc.end();
  } catch (error) {
    console.error(
      "Export audit logs PDF error:",
      error
    );

    if (!res.headersSent) {
      return res.status(500).json({
        message:
          "Unable to generate audit logs PDF.",
      });
    }
  }
};
module.exports = {
  getAuditLogs,
  exportAuditLogs,
  exportAuditLogsPdf,
};