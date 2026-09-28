const { BrevoClient } = require("@getbrevo/brevo");

const brevo = new BrevoClient({
  apiKey: process.env.BREVO_API_KEY,
});

const sendWelcomeEmail = async (user) => {
  await brevo.transactionalEmails.sendTransacEmail({
    sender: {
      email: process.env.BREVO_SENDER_EMAIL,
      name: "SubFlow",
    },
    to: [
      {
        email: user.email,
        name: user.name,
      },
    ],
    subject: "Welcome to SubFlow",
    textContent:
      `Hello ${user.name},\n\n` +
      `Your SubFlow account has been created successfully.\n\n` +
      `You can now log in and start using SubFlow.\n\n` +
      `Thank you,\n` +
      `SubFlow`,
  });
};

const sendPasswordChangedEmail = async (user) => {
  await brevo.transactionalEmails.sendTransacEmail({
    sender: {
      email: process.env.BREVO_SENDER_EMAIL,
      name: "SubFlow",
    },
    to: [
      {
        email: user.email,
        name: user.name,
      },
    ],
    subject: "Your SubFlow Password Was Changed",
    textContent:
      `Hello ${user.name},\n\n` +
      `Your SubFlow account password was changed successfully.\n\n` +
      `If you made this change, no further action is required.\n\n` +
      `If you did not change your password, please contact SubFlow support immediately.\n\n` +
      `Thank you,\n` +
      `SubFlow`,
  });
};

const sendSubscriptionEmail = async ({
  user,
  plan,
  subscription,
}) => {
  const isTrial = subscription.isTrial;

  const subject = isTrial
    ? "Your SubFlow 3-Day Free Trial Has Started"
    : "Your SubFlow Subscription Is Active";

  const textContent = isTrial
    ? `Hello ${user.name},\n\n` +
      `Your 3-day free trial for the ${plan.name} plan has started successfully.\n\n` +
      `Trial details:\n` +
      `Plan: ${plan.name}\n` +
      `Trial period: 3 days\n` +
      `Trial ends: ${new Date(subscription.renewalDate).toLocaleDateString("en-IN")}\n\n` +
      `Your subscription will automatically continue after the free trial.\n` +
      `The applicable plan amount of ₹${Number(plan.price).toLocaleString("en-IN")} ` +
      `will be charged for the ${plan.billingPeriod.toLowerCase()} billing period.\n\n` +
      `Please make sure your payment details are available before the trial ends.\n\n` +
      `Thank you for choosing SubFlow.\n\n` +
      `SubFlow`
    : `Hello ${user.name},\n\n` +
      `Your ${plan.name} subscription is now active.\n\n` +
      `Plan: ${plan.name}\n` +
      `Price: ₹${Number(plan.price).toLocaleString("en-IN")}\n` +
      `Billing period: ${plan.billingPeriod}\n` +
      `Renewal date: ${new Date(subscription.renewalDate).toLocaleDateString("en-IN")}\n\n` +
      `Thank you for choosing SubFlow.\n\n` +
      `SubFlow`;

  await brevo.transactionalEmails.sendTransacEmail({
    sender: {
      email: process.env.BREVO_SENDER_EMAIL,
      name: "SubFlow",
    },
    to: [
      {
        email: user.email,
        name: user.name,
      },
    ],
    subject,
    textContent,
  });
};
const sendTrialConversionEmail = async ({
  user,
  plan,
  subscription,
  payment,
}) => {
  const subject =
    "Your SubFlow Free Trial Has Ended";

  const textContent =
    `Hello ${user.name},\n\n` +
    `Your 3-day free trial for the ${plan.name} plan has ended.\n\n` +
    `Your subscription has automatically continued as a paid subscription.\n\n` +
    `Payment details:\n` +
    `Plan: ${plan.name}\n` +
    `Amount: ₹${Number(
      payment.amount
    ).toLocaleString("en-IN")}\n` +
    `Billing period: ${plan.billingPeriod}\n` +
    `Payment method: ${payment.paymentMethod}\n` +
    `Transaction ID: ${payment.transactionId}\n` +
    `Payment date: ${new Date(
      payment.paymentDate
    ).toLocaleDateString("en-IN")}\n\n` +
    `Your next renewal date is ${new Date(
      subscription.renewalDate
    ).toLocaleDateString("en-IN")}.\n\n` +
    `Thank you for choosing SubFlow.\n\n` +
    `SubFlow`;

  await brevo.transactionalEmails.sendTransacEmail({
    sender: {
      email: process.env.BREVO_SENDER_EMAIL,
      name: "SubFlow",
    },
    to: [
      {
        email: user.email,
        name: user.name,
      },
    ],
    subject,
    textContent,
  });
};
const sendSubscriptionUpgradeEmail = async ({
  user,
  previousPlan,
  newPlan,
  payment,
  subscription,
}) => {
  await brevo.transactionalEmails.sendTransacEmail({
    sender: {
      email: process.env.BREVO_SENDER_EMAIL,
      name: "SubFlow",
    },
    to: [
      {
        email: user.email,
        name: user.name,
      },
    ],
    subject: "Your SubFlow Subscription Has Been Upgraded",
    textContent:
      `Hello ${user.name},\n\n` +
      `Your SubFlow subscription has been successfully upgraded.\n\n` +
      `Previous plan: ${previousPlan.name}\n` +
      `New plan: ${newPlan.name}\n` +
      `New price: ₹${Number(newPlan.price).toLocaleString("en-IN")}\n` +
      `Billing period: ${newPlan.billingPeriod}\n` +
      `Upgrade payment: ₹${Number(payment.amount).toLocaleString("en-IN")}\n` +
      `Renewal date: ${new Date(subscription.renewalDate).toLocaleDateString("en-IN")}\n\n` +
      `Thank you for choosing SubFlow.\n\n` +
      `SubFlow`,
  });
};

const sendNewSupportTicketEmail = async ({
  admin,
  customer,
  ticket,
}) => {
  await brevo.transactionalEmails.sendTransacEmail({
    sender: {
      email: process.env.BREVO_SENDER_EMAIL,
      name: "SubFlow",
    },
    to: [
      {
        email: admin.email,
        name: admin.name,
      },
    ],
    subject: `New Support Ticket #${ticket.id}`,
    textContent:
      `Hello ${admin.name},\n\n` +
      `A new support ticket has been created in SubFlow.\n\n` +
      `Ticket ID: #${ticket.id}\n` +
      `Customer: ${customer.name}\n` +
      `Customer Email: ${customer.email}\n` +
      `Category: ${ticket.category}\n` +
      `Subject: ${ticket.subject}\n` +
      `Description: ${ticket.description}\n\n` +
      `Please log in to SubFlow to review and respond to the ticket.\n\n` +
      `SubFlow`,
  });
};

const sendRenewal7DayEmail = async ({
  user,
  plan,
  subscription,
}) => {
  await brevo.transactionalEmails.sendTransacEmail({
    sender: {
      email: process.env.BREVO_SENDER_EMAIL,
      name: "SubFlow",
    },
    to: [
      {
        email: user.email,
        name: user.name,
      },
    ],
    subject: "Your SubFlow Subscription Renews in 7 Days",
    textContent:
      `Hello ${user.name},\n\n` +
      `Your SubFlow subscription will renew in 7 days.\n\n` +
      `Plan: ${plan.name}\n` +
      `Price: ₹${Number(plan.price).toLocaleString("en-IN")}\n` +
      `Billing period: ${plan.billingPeriod}\n` +
      `Renewal date: ${new Date(subscription.renewalDate).toLocaleDateString("en-IN")}\n\n` +
      `Please make sure your subscription details are up to date.\n\n` +
      `Thank you,\n` +
      `SubFlow`,
  });
};

const sendRenewal3DayEmail = async ({
  user,
  plan,
  subscription,
}) => {
  await brevo.transactionalEmails.sendTransacEmail({
    sender: {
      email: process.env.BREVO_SENDER_EMAIL,
      name: "SubFlow",
    },
    to: [
      {
        email: user.email,
        name: user.name,
      },
    ],
    subject: "Your SubFlow Subscription Renews in 3 Days",
    textContent:
      `Hello ${user.name},\n\n` +
      `Your SubFlow subscription will renew in 3 days.\n\n` +
      `Plan: ${plan.name}\n` +
      `Price: ₹${Number(plan.price).toLocaleString("en-IN")}\n` +
      `Billing period: ${plan.billingPeriod}\n` +
      `Renewal date: ${new Date(subscription.renewalDate).toLocaleDateString("en-IN")}\n\n` +
      `Please make sure your subscription details are up to date.\n\n` +
      `Thank you,\n` +
      `SubFlow`,
  });
};

const sendRenewalDayEmail = async ({
  user,
  plan,
  subscription,
}) => {
  await brevo.transactionalEmails.sendTransacEmail({
    sender: {
      email: process.env.BREVO_SENDER_EMAIL,
      name: "SubFlow",
    },
    to: [
      {
        email: user.email,
        name: user.name,
      },
    ],
    subject: "Your SubFlow Subscription Renews Today",
    textContent:
      `Hello ${user.name},\n\n` +
      `Your SubFlow subscription is due for renewal today.\n\n` +
      `Plan: ${plan.name}\n` +
      `Price: ₹${Number(plan.price).toLocaleString("en-IN")}\n` +
      `Billing period: ${plan.billingPeriod}\n` +
      `Renewal date: ${new Date(subscription.renewalDate).toLocaleDateString("en-IN")}\n\n` +
      `Please complete your renewal payment to continue your subscription.\n\n` +
      `Thank you,\n` +
      `SubFlow`,
  });
};

const sendSupportReplyEmail = async ({
  user,
  ticket,
  admin,
  message,
}) => {
  await brevo.transactionalEmails.sendTransacEmail({
    sender: {
      email: process.env.BREVO_SENDER_EMAIL,
      name: "SubFlow",
    },
    to: [
      {
        email: user.email,
        name: user.name,
      },
    ],
    subject: `New Reply on Support Ticket #${ticket.id}`,
    textContent:
      `Hello ${user.name},\n\n` +
      `An admin has replied to your SubFlow support ticket.\n\n` +
      `Ticket ID: #${ticket.id}\n` +
      `Subject: ${ticket.subject}\n` +
      `Admin: ${admin.name}\n\n` +
      `Reply:\n` +
      `${message}\n\n` +
      `Please log in to SubFlow to continue the conversation.\n\n` +
      `SubFlow`,
  });
};

const sendSupportTicketClosedEmail = async ({
  user,
  ticket,
}) => {
  await brevo.transactionalEmails.sendTransacEmail({
    sender: {
      email: process.env.BREVO_SENDER_EMAIL,
      name: "SubFlow",
    },
    to: [
      {
        email: user.email,
        name: user.name,
      },
    ],
    subject: `Support Ticket #${ticket.id} Closed`,
    textContent:
      `Hello ${user.name},\n\n` +
      `Your SubFlow support ticket has been closed.\n\n` +
      `Ticket ID: #${ticket.id}\n` +
      `Subject: ${ticket.subject}\n` +
      `Status: CLOSED\n\n` +
      `If you need further assistance, please create a new support ticket.\n\n` +
      `Thank you,\n` +
      `SubFlow`,
  });
};

module.exports = {
  sendWelcomeEmail,
  sendPasswordChangedEmail,
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