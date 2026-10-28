
const emailjs = require("@emailjs/nodejs");

// Reusable EmailJS sender
const sendEmail = async ({ user, subject, message }) => {
  if (
    !process.env.EMAILJS_SERVICE_ID ||
    !process.env.EMAILJS_TEMPLATE_ID ||
    !process.env.EMAILJS_PUBLIC_KEY ||
    !process.env.EMAILJS_PRIVATE_KEY
  ) {
    throw new Error("EmailJS environment variables are not fully configured");
  }

  if (!user?.email) {
    throw new Error("Recipient email is required");
  }

  return emailjs.send(
    process.env.EMAILJS_SERVICE_ID,
    process.env.EMAILJS_TEMPLATE_ID,
    {
      to_email: user.email,
      to_name: user.name || "SubFlow user",
      subject,
      message,
    },
    {
      publicKey: process.env.EMAILJS_PUBLIC_KEY,
      privateKey: process.env.EMAILJS_PRIVATE_KEY,
    }
  );
};

// Welcome email
const sendWelcomeEmail = async (user) =>
  sendEmail({
    user,
    subject: "Welcome to SubFlow",
    message:
      `Hello ${user.name},\n\n` +
      "Your SubFlow account has been created successfully.\n\n" +
      "You can now log in and start using SubFlow.\n\n" +
      "Thank you,\nSubFlow",
  });

// Password changed notification
const sendPasswordChangedEmail = async (user) =>
  sendEmail({
    user,
    subject: "Your SubFlow Password Was Changed",
    message:
      `Hello ${user.name},\n\n` +
      "Your SubFlow account password was changed successfully.\n\n" +
      "If you made this change, no further action is required.\n\n" +
      "If you did not change your password, please contact SubFlow support immediately.\n\n" +
      "Thank you,\nSubFlow",
  });

// Password reset OTP
const sendPasswordResetOtpEmail = async (user, otp) =>
  sendEmail({
    user,
    subject: "SubFlow Password Reset OTP",
    message:
      `Hello ${user.name},\n\n` +
      `Your SubFlow password reset OTP is: ${otp}\n\n` +
      "This OTP will expire in 5 minutes.\n\n" +
      "If you did not request a password reset, you can ignore this email.\n\n" +
      "SubFlow",
  });

// Admin two-factor authentication OTP
const sendTwoFactorOtpEmail = async (user, otp) =>
  sendEmail({
    user,
    subject: "SubFlow Admin Login Verification",
    message:
      `Hello ${user.name},\n\n` +
      `Your SubFlow admin login verification OTP is: ${otp}\n\n` +
      "This OTP will expire in 5 minutes.\n\n" +
      "If you did not attempt to log in, please secure your account immediately.\n\n" +
      "SubFlow",
  });

// Subscription activated / trial started
const sendSubscriptionEmail = async ({ user, plan, subscription }) => {
  const isTrial = subscription.isTrial;

  const subject = isTrial
    ? "Your SubFlow 3-Day Free Trial Has Started"
    : "Your SubFlow Subscription Is Active";

  const message = isTrial
    ? `Hello ${user.name},\n\n` +
      `Your 3-day free trial for the ${plan.name} plan has started successfully.\n\n` +
      "Trial details:\n" +
      `Plan: ${plan.name}\n` +
      "Trial period: 3 days\n" +
      `Trial ends: ${new Date(subscription.renewalDate).toLocaleDateString("en-IN")}\n\n` +
      "Your subscription will automatically continue after the free trial.\n" +
      `The applicable plan amount of ₹${Number(plan.price).toLocaleString("en-IN")} ` +
      `will be charged for the ${plan.billingPeriod.toLowerCase()} billing period.\n\n` +
      "Please make sure your payment details are available before the trial ends.\n\n" +
      "Thank you for choosing SubFlow.\n\nSubFlow"
    : `Hello ${user.name},\n\n` +
      `Your ${plan.name} subscription is now active.\n\n` +
      `Plan: ${plan.name}\n` +
      `Price: ₹${Number(plan.price).toLocaleString("en-IN")}\n` +
      `Billing period: ${plan.billingPeriod}\n` +
      `Renewal date: ${new Date(subscription.renewalDate).toLocaleDateString("en-IN")}\n\n` +
      "Thank you for choosing SubFlow.\n\nSubFlow";

  return sendEmail({ user, subject, message });
};

// Free trial converted to paid subscription
const sendTrialConversionEmail = async ({
  user,
  plan,
  subscription,
  payment,
  coupon = null,
  discountAmount = 0,
}) => {
  const finalAmount = Number(payment.amount);
  const discount = Number(discountAmount);
  const originalAmount = finalAmount + discount;

  const couponDetails = coupon
    ? `Original amount: ₹${originalAmount.toLocaleString("en-IN")}\n` +
      `Coupon: ${coupon.code}\n` +
      `Discount: -₹${discount.toLocaleString("en-IN")}\n` +
      `Final amount paid: ₹${finalAmount.toLocaleString("en-IN")}\n`
    : `Amount: ₹${finalAmount.toLocaleString("en-IN")}\n`;

  return sendEmail({
    user,
    subject: "Your SubFlow Free Trial Has Ended",
    message:
      `Hello ${user.name},\n\n` +
      `Your 3-day free trial for the ${plan.name} plan has ended.\n\n` +
      "Your subscription has automatically continued as a paid subscription.\n\n" +
      "Payment details:\n" +
      `Plan: ${plan.name}\n` +
      couponDetails +
      `Billing period: ${plan.billingPeriod}\n` +
      `Payment method: ${payment.paymentMethod}\n` +
      `Transaction ID: ${payment.transactionId}\n` +
      `Payment date: ${new Date(payment.paymentDate).toLocaleDateString("en-IN")}\n\n` +
      `Your next renewal date is ${new Date(subscription.renewalDate).toLocaleDateString("en-IN")}.\n\n` +
      "Thank you for choosing SubFlow.\n\nSubFlow",
  });
};

// Subscription upgraded
const sendSubscriptionUpgradeEmail = async ({
  user,
  previousPlan,
  newPlan,
  payment,
  subscription,
  coupon = null,
  discountAmount = 0,
}) => {
  const finalAmount = Number(payment.amount);
  const discount = Number(discountAmount);
  const originalUpgradeAmount = finalAmount + discount;

  const couponDetails = coupon
    ? `Original upgrade amount: ₹${originalUpgradeAmount.toLocaleString("en-IN")}\n` +
      `Coupon: ${coupon.code}\n` +
      `Discount: -₹${discount.toLocaleString("en-IN")}\n` +
      `Final upgrade payment: ₹${finalAmount.toLocaleString("en-IN")}\n`
    : `Upgrade payment: ₹${finalAmount.toLocaleString("en-IN")}\n`;

  return sendEmail({
    user,
    subject: "Your SubFlow Subscription Has Been Upgraded",
    message:
      `Hello ${user.name},\n\n` +
      "Your SubFlow subscription has been successfully upgraded.\n\n" +
      `Previous plan: ${previousPlan.name}\n` +
      `New plan: ${newPlan.name}\n` +
      `New price: ₹${Number(newPlan.price).toLocaleString("en-IN")}\n` +
      `Billing period: ${newPlan.billingPeriod}\n` +
      couponDetails +
      `Renewal date: ${new Date(subscription.renewalDate).toLocaleDateString("en-IN")}\n\n` +
      "Thank you for choosing SubFlow.\n\nSubFlow",
  });
};

// New support ticket notification to admin
const sendNewSupportTicketEmail = async ({ admin, customer, ticket }) =>
  sendEmail({
    user: admin,
    subject: `New Support Ticket #${ticket.id}`,
    message:
      `Hello ${admin.name},\n\n` +
      "A new support ticket has been created in SubFlow.\n\n" +
      `Ticket ID: #${ticket.id}\n` +
      `Customer: ${customer.name}\n` +
      `Customer Email: ${customer.email}\n` +
      `Category: ${ticket.category}\n` +
      `Subject: ${ticket.subject}\n` +
      `Description: ${ticket.description}\n\n` +
      "Please log in to SubFlow to review and respond to the ticket.\n\nSubFlow",
  });

// Renewal reminders
const sendRenewal7DayEmail = async ({ user, plan, subscription }) =>
  sendEmail({
    user,
    subject: "Your SubFlow Subscription Renews in 7 Days",
    message:
      `Hello ${user.name},\n\n` +
      "Your SubFlow subscription will renew in 7 days.\n\n" +
      `Plan: ${plan.name}\n` +
      `Price: ₹${Number(plan.price).toLocaleString("en-IN")}\n` +
      `Billing period: ${plan.billingPeriod}\n` +
      `Renewal date: ${new Date(subscription.renewalDate).toLocaleDateString("en-IN")}\n\n` +
      "Please make sure your subscription details are up to date.\n\nThank you,\nSubFlow",
  });

const sendRenewal3DayEmail = async ({ user, plan, subscription }) =>
  sendEmail({
    user,
    subject: "Your SubFlow Subscription Renews in 3 Days",
    message:
      `Hello ${user.name},\n\n` +
      "Your SubFlow subscription will renew in 3 days.\n\n" +
      `Plan: ${plan.name}\n` +
      `Price: ₹${Number(plan.price).toLocaleString("en-IN")}\n` +
      `Billing period: ${plan.billingPeriod}\n` +
      `Renewal date: ${new Date(subscription.renewalDate).toLocaleDateString("en-IN")}\n\n` +
      "Please make sure your subscription details are up to date.\n\nThank you,\nSubFlow",
  });

const sendRenewalDayEmail = async ({ user, plan, subscription }) =>
  sendEmail({
    user,
    subject: "Your SubFlow Subscription Renews Today",
    message:
      `Hello ${user.name},\n\n` +
      "Your SubFlow subscription is due for renewal today.\n\n" +
      `Plan: ${plan.name}\n` +
      `Price: ₹${Number(plan.price).toLocaleString("en-IN")}\n` +
      `Billing period: ${plan.billingPeriod}\n` +
      `Renewal date: ${new Date(subscription.renewalDate).toLocaleDateString("en-IN")}\n\n` +
      "Please complete your renewal payment to continue your subscription.\n\nThank you,\nSubFlow",
  });

// Support reply notification
const sendSupportReplyEmail = async ({ user, ticket, admin, message }) =>
  sendEmail({
    user,
    subject: `New Reply on Support Ticket #${ticket.id}`,
    message:
      `Hello ${user.name},\n\n` +
      "An admin has replied to your SubFlow support ticket.\n\n" +
      `Ticket ID: #${ticket.id}\n` +
      `Subject: ${ticket.subject}\n` +
      `Admin: ${admin.name}\n\n` +
      `Reply:\n${message}\n\n` +
      "Please log in to SubFlow to continue the conversation.\n\nSubFlow",
  });

// Support ticket closed notification
const sendSupportTicketClosedEmail = async ({ user, ticket }) =>
  sendEmail({
    user,
    subject: `Support Ticket #${ticket.id} Closed`,
    message:
      `Hello ${user.name},\n\n` +
      "Your SubFlow support ticket has been closed.\n\n" +
      `Ticket ID: #${ticket.id}\n` +
      `Subject: ${ticket.subject}\n` +
      "Status: CLOSED\n\n" +
      "If you need further assistance, please create a new support ticket.\n\n" +
      "Thank you,\nSubFlow",
  });

module.exports = {
  sendWelcomeEmail,
  sendPasswordChangedEmail,
  sendPasswordResetOtpEmail,
  sendTwoFactorOtpEmail,
  sendSubscriptionEmail,
  sendSubscriptionUpgradeEmail,
  sendNewSupportTicketEmail,
  sendRenewal7DayEmail,
  sendRenewal3DayEmail,
  sendRenewalDayEmail,
  sendSupportReplyEmail,
  sendSupportTicketClosedEmail,
  sendTrialConversionEmail,
};
