const PDFDocument = require("pdfkit");
const path = require("path");
const fs = require("fs");

const { PrismaClient } = require("../generated/prisma");

const prisma = new PrismaClient();

const getCustomerInvoice = async (req, res) => {
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

    const subscription =
      await prisma.subscription.findFirst({
        where: {
          userId: req.session.user.id,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          plan: true,
          payments: {
            where: {
              status: "PAID",
            },
            orderBy: {
              paymentDate: "desc",
            },
            take: 1,
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

    if (!subscription) {
      return res.status(404).json({
        message: "No subscription found",
      });
    }

    const payment = subscription.payments[0];

    if (!payment) {
      return res.status(404).json({
        message:
          "No completed payment found for this subscription.",
      });
    }

    const logoPath = path.join(
      __dirname,
      "../assets/subflow-logo.png"
    );

    if (!fs.existsSync(logoPath)) {
      return res.status(500).json({
        message:
          "Invoice logo is missing on the server.",
      });
    }

    const invoiceNumber = `INV-${new Date(
      payment.paymentDate
    ).getFullYear()}-${String(
      subscription.id
    ).padStart(6, "0")}`;

    const invoiceDate = new Date(
      payment.paymentDate
    );

    const formatDate = (date) => {
      return new Date(date).toLocaleDateString(
        "en-IN",
        {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }
      );
    };

    const amount = Number(payment.amount);

    const formattedAmount = `INR ${amount.toLocaleString(
      "en-IN",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    )}`;

    const billingPeriod =
      subscription.plan.billingPeriod ===
      "YEARLY"
        ? "Yearly"
        : "Monthly";

    const features = Array.isArray(
      subscription.plan.features
    )
      ? subscription.plan.features
      : [];

    const doc = new PDFDocument({
      size: "A4",
      margin: 0,
      autoFirstPage: true,
    });

    res.setHeader(
      "Content-Type",
      "application/pdf"
    );

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${invoiceNumber}.pdf"`
    );

    doc.pipe(res);

    const primary = "#2563EB";
    const dark = "#111827";
    const text = "#374151";
    const muted = "#6B7280";
    const lightText = "#9CA3AF";
    const border = "#E5E7EB";
    const background = "#F8FAFC";
    const success = "#047857";
    const successBackground = "#ECFDF5";

    const pageWidth = 595.28;

    const left = 45;
    const right = 550;
    const contentWidth = right - left;


    doc
      .rect(0, 0, pageWidth, 118)
      .fill("#F8FAFC");

    doc.image(logoPath, left, 28, {
      width: 52,
      height: 52,
    });

    doc
      .font("Helvetica-Bold")
      .fontSize(21)
      .fillColor(dark)
      .text(
        "SubFlow",
        left + 65,
        31
      );

    doc
      .font("Helvetica")
      .fontSize(8.5)
      .fillColor(muted)
      .text(
        "Subscription Management Platform",
        left + 65,
        57
      );

    doc
      .font("Helvetica-Bold")
      .fontSize(25)
      .fillColor(primary)
      .text("INVOICE", 385, 30, {
        width: 165,
        align: "right",
      });

    doc
      .font("Helvetica")
      .fontSize(8.5)
      .fillColor(muted)
      .text(
        `Invoice #: ${invoiceNumber}`,
        385,
        62,
        {
          width: 165,
          align: "right",
        }
      );

    doc.text(
      `Invoice Date: ${formatDate(invoiceDate)}`,
      385,
      77,
      {
        width: 165,
        align: "right",
      }
    );
    let y = 145;

    doc
      .font("Helvetica-Bold")
      .fontSize(8)
      .fillColor(muted)
      .text("BILLED TO", left, y);

    doc
      .font("Helvetica-Bold")
      .fontSize(12)
      .fillColor(dark)
      .text(
        subscription.user.name,
        left,
        y + 17
      );

    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor(text)
      .text(
        subscription.user.email,
        left,
        y + 36
      );

    doc
      .roundedRect(
        425,
        y,
        125,
        48,
        6
      )
      .fill(successBackground);

    doc
      .font("Helvetica-Bold")
      .fontSize(7.5)
      .fillColor(success)
      .text(
        "PAYMENT STATUS",
        438,
        y + 9
      );

    doc
      .font("Helvetica-Bold")
      .fontSize(11)
      .fillColor(success)
      .text(
        payment.status,
        438,
        y + 24
      );


    y = 220;

    doc
      .font("Helvetica-Bold")
      .fontSize(8)
      .fillColor(muted)
      .text(
        "SUBSCRIPTION",
        left,
        y
      );

    doc
      .roundedRect(
        left,
        y + 17,
        contentWidth,
        90,
        7
      )
      .fill(background);

    doc
      .font("Helvetica-Bold")
      .fontSize(13)
      .fillColor(dark)
      .text(
        `${subscription.plan.name} Plan`,
        left + 18,
        y + 33
      );

    doc
      .font("Helvetica")
      .fontSize(8.5)
      .fillColor(muted)
      .text(
        subscription.plan.description ||
          "Subscription plan",
        left + 18,
        y + 53,
        {
          width: 260,
        }
      );

    doc
      .font("Helvetica-Bold")
      .fontSize(8)
      .fillColor(muted)
      .text(
        "BILLING",
        370,
        y + 32
      );

    doc
      .font("Helvetica-Bold")
      .fontSize(10)
      .fillColor(dark)
      .text(
        billingPeriod,
        370,
        y + 48
      );

    doc
      .font("Helvetica-Bold")
      .fontSize(7.5)
      .fillColor(muted)
      .text(
        "START DATE",
        left + 18,
        y + 75
      );

    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor(text)
      .text(
        formatDate(subscription.startDate),
        left + 83,
        y + 75
      );

    doc
      .font("Helvetica-Bold")
      .fontSize(7.5)
      .fillColor(muted)
      .text(
        "NEXT RENEWAL",
        365,
        y + 75
      );

    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor(text)
      .text(
        formatDate(subscription.renewalDate),
        450,
        y + 75
      );

 
    y = 345;

    doc
      .font("Helvetica-Bold")
      .fontSize(8)
      .fillColor(muted)
      .text(
        "CHARGES",
        left,
        y
      );

    doc
      .moveTo(left, y + 20)
      .lineTo(right, y + 20)
      .lineWidth(1)
      .strokeColor(border)
      .stroke();

    doc
      .font("Helvetica-Bold")
      .fontSize(8)
      .fillColor(text)
      .text(
        "DESCRIPTION",
        left,
        y + 31
      );

    doc.text(
      "BILLING",
      350,
      y + 31
    );

    doc.text(
      "AMOUNT",
      450,
      y + 31,
      {
        width: 100,
        align: "right",
      }
    );

    doc
      .moveTo(left, y + 49)
      .lineTo(right, y + 49)
      .lineWidth(1)
      .strokeColor(border)
      .stroke();

    doc
      .font("Helvetica-Bold")
      .fontSize(9.5)
      .fillColor(dark)
      .text(
        `${subscription.plan.name} Subscription`,
        left,
        y + 64
      );

    doc
      .font("Helvetica")
      .fontSize(7.8)
      .fillColor(muted)
      .text(
        subscription.plan.description ||
          "Subscription charge",
        left,
        y + 81,
        {
          width: 260,
        }
      );

    doc
      .font("Helvetica")
      .fontSize(8.5)
      .fillColor(text)
      .text(
        billingPeriod,
        350,
        y + 66
      );

    doc
      .font("Helvetica-Bold")
      .fontSize(9.5)
      .fillColor(dark)
      .text(
        formattedAmount,
        405,
        y + 66,
        {
          width: 145,
          align: "right",
        }
      );

 
    y = 450;

    doc
      .moveTo(350, y)
      .lineTo(right, y)
      .lineWidth(1)
      .strokeColor(border)
      .stroke();

    doc
      .font("Helvetica")
      .fontSize(8.5)
      .fillColor(muted)
      .text(
        "Subtotal",
        350,
        y + 14
      );

    doc
      .font("Helvetica")
      .fillColor(text)
      .text(
        formattedAmount,
        405,
        y + 14,
        {
          width: 145,
          align: "right",
        }
      );

    doc
      .fillColor(muted)
      .text(
        "Tax",
        350,
        y + 34
      );

    doc
      .fillColor(text)
      .text(
        "INR 0.00",
        405,
        y + 34,
        {
          width: 145,
          align: "right",
        }
      );

    doc
      .moveTo(350, y + 54)
      .lineTo(right, y + 54)
      .lineWidth(1)
      .strokeColor(border)
      .stroke();

    doc
      .font("Helvetica-Bold")
      .fontSize(11)
      .fillColor(dark)
      .text(
        "TOTAL PAID",
        350,
        y + 68
      );

    doc
      .font("Helvetica-Bold")
      .fontSize(13)
      .fillColor(primary)
      .text(
        formattedAmount,
        395,
        y + 67,
        {
          width: 155,
          align: "right",
        }
      );

  

    y = 555;

    doc
      .font("Helvetica-Bold")
      .fontSize(8)
      .fillColor(muted)
      .text(
        "PAYMENT INFORMATION",
        left,
        y
      );

    doc
      .roundedRect(
        left,
        y + 17,
        contentWidth,
        68,
        6
      )
      .fill(background);

    doc
      .font("Helvetica-Bold")
      .fontSize(7.5)
      .fillColor(muted)
      .text(
        "PAYMENT DATE",
        left + 15,
        y + 31
      );

    doc
      .font("Helvetica")
      .fontSize(8.5)
      .fillColor(text)
      .text(
        formatDate(payment.paymentDate),
        left + 15,
        y + 47
      );

    doc
      .font("Helvetica-Bold")
      .fontSize(7.5)
      .fillColor(muted)
      .text(
        "PAYMENT METHOD",
        205,
        y + 31
      );

    doc
      .font("Helvetica")
      .fontSize(8.5)
      .fillColor(text)
      .text(
        payment.paymentMethod,
        205,
        y + 47
      );

    doc
      .font("Helvetica-Bold")
      .fontSize(7.5)
      .fillColor(muted)
      .text(
        "TRANSACTION ID",
        350,
        y + 31
      );

    doc
      .font("Helvetica")
      .fontSize(7.5)
      .fillColor(text)
      .text(
        payment.transactionId,
        350,
        y + 47,
        {
          width: 175,
        }
      );



    if (features.length > 0) {
      y = 650;

      doc
        .font("Helvetica-Bold")
        .fontSize(8)
        .fillColor(muted)
        .text(
          "PLAN FEATURES",
          left,
          y
        );

      const featureColumns = 2;

      const columnWidth =
        contentWidth / featureColumns;

      const maxFeatures = Math.min(
        features.length,
        6
      );

      for (
        let i = 0;
        i < maxFeatures;
        i++
      ) {
        const column =
          i % featureColumns;

        const row =
          Math.floor(i / featureColumns);

        const featureX =
          left +
          column * columnWidth;

        const featureY =
          y +
          22 +
          row * 19;

        doc
          .font("Helvetica")
          .fontSize(8)
          .fillColor(text)
          .text(
            "•",
            featureX,
            featureY
          );

        doc.text(
          features[i],
          featureX + 12,
          featureY,
          {
            width:
              columnWidth - 25,
          }
        );
      }
    }



    doc
      .moveTo(left, 775)
      .lineTo(right, 775)
      .lineWidth(1)
      .strokeColor(border)
      .stroke();

    doc
      .font("Helvetica-Bold")
      .fontSize(9)
      .fillColor(dark)
      .text(
        "Thank you for choosing SubFlow.",
        left,
        795
      );

    doc
      .font("Helvetica")
      .fontSize(7.5)
      .fillColor(lightText)
      .text(
        "This invoice was generated electronically and is valid without a signature.",
        left,
        813
      );

    doc.end();
  } catch (error) {
    console.error(
      "Generate customer invoice error:",
      error
    );

    if (!res.headersSent) {
      return res.status(500).json({
        message:
          "Unable to generate invoice.",
      });
    }
  }
};

module.exports = {
  getCustomerInvoice,
};