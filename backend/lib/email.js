const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendEmail = async (to, subject, html) => {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'Sawdagar <noreply@sawdagar.af>',
      to, subject, html,
    });
    return true;
  } catch (err) {
    console.error('Email send error:', err.message);
    return false;
  }
};

const sendVerificationEmail = async (email, token) => {
  const url = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
  return sendEmail(email, 'Verify Your Sawdagar Account', `
    <h2>Welcome to Sawdagar!</h2>
    <p>Click below to verify your email:</p>
    <a href="${url}" style="background:#059669;color:white;padding:12px 24px;border-radius:8px;display:inline-block;text-decoration:none;">Verify Email</a>
    <p>Or copy: ${url}</p>
  `);
};

const sendPasswordResetEmail = async (email, token) => {
  const url = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
  return sendEmail(email, 'Reset Your Password', `
    <h2>Password Reset</h2>
    <p>Click below to reset:</p>
    <a href="${url}" style="background:#059669;color:white;padding:12px 24px;border-radius:8px;display:inline-block;text-decoration:none;">Reset Password</a>
    <p>This link expires in 1 hour.</p>
  `);
};

const sendOrderConfirmation = async (email, order) => {
  return sendEmail(email, `Order Confirmed - ${order.orderNumber}`, `
    <h2>Order Confirmed!</h2>
    <p>Order: <strong>${order.orderNumber}</strong></p>
    <p>Total: <strong>${order.totalAmount} AFN</strong></p>
    <p>Status: ${order.status}</p>
    <p>We'll notify you when your order ships.</p>
  `);
};

const sendOrderStatusUpdate = async (email, order) => {
  return sendEmail(email, `Order Update - ${order.orderNumber}`, `
    <h2>Order Update</h2>
    <p>Order: <strong>${order.orderNumber}</strong></p>
    <p>New status: <strong>${order.status}</strong></p>
  `);
};

const sendProductApprovalEmail = async (email, productName, status) => {
  return sendEmail(email, `Product ${status}: ${productName}`, `
    <h2>Product ${status}</h2>
    <p>Your product "<strong>${productName}</strong>" has been <strong>${status}</strong>.</p>
  `);
};

const sendSponsorshipStatusEmail = async (email, status) => {
  return sendEmail(email, `Sponsorship Request ${status}`, `
    <h2>Sponsorship ${status}</h2>
    <p>Your sponsorship request has been <strong>${status}</strong>.</p>
  `);
};

const sendAdminNotification = async (subject, message) => {
  return sendEmail(process.env.SMTP_USER || 'admin@sawdagar.af', subject, `<p>${message}</p>`);
};

module.exports = {
  sendEmail, sendVerificationEmail, sendPasswordResetEmail,
  sendOrderConfirmation, sendOrderStatusUpdate,
  sendProductApprovalEmail, sendSponsorshipStatusEmail, sendAdminNotification,
};
