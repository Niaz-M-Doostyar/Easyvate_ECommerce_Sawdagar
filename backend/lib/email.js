const nodemailer = require('nodemailer');

const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
const smtpPort = parseInt(process.env.SMTP_PORT, 10) || 587;
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;

const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: smtpPort === 465,
  auth: {
    user: smtpUser,
    pass: smtpPass,
  },
  pool: true,
  maxConnections: 3,
});

function emailWrapper(title, body) {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title></head>
<body style="margin:0;padding:0;background:#f5f7fa;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f7fa;padding:40px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
<tr><td style="background:#059669;padding:28px 40px;text-align:center;">
<h1 style="color:#fff;margin:0;font-size:26px;">🛒 Sawdagar</h1>
<p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:13px;">Afghanistan's #1 Online Marketplace</p>
</td></tr>
<tr><td style="padding:36px 40px 28px;">${body}</td></tr>
<tr><td style="padding:20px 40px 28px;border-top:1px solid #eee;text-align:center;">
<p style="color:#999;font-size:12px;margin:0;">This is an automated message from Sawdagar. Please do not reply to this email.</p>
<p style="color:#bbb;font-size:11px;margin:8px 0 0;">© ${new Date().getFullYear()} Sawdagar - سوداګر</p>
</td></tr>
</table>
</td></tr></table></body></html>`;
}

const sendEmail = async (to, subject, html) => {
  try {
    const fromAddress = process.env.SMTP_FROM || `Sawdagar NoReply <noreply@sawdagar.af>`;
    await transporter.sendMail({
      from: fromAddress,
      replyTo: 'noreply@sawdagar.af',
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
  const body = `
    <h2 style="color:#1a1a1a;margin:0 0 16px;">Welcome to Sawdagar! 🎉</h2>
    <p style="color:#555;font-size:15px;line-height:1.6;">Thank you for creating your account. Please verify your email address by clicking the button below:</p>
    <div style="text-align:center;margin:28px 0;">
      <a href="${url}" style="background:#059669;color:#fff;padding:14px 36px;border-radius:8px;display:inline-block;text-decoration:none;font-weight:bold;font-size:16px;">Verify My Email</a>
    </div>
    <p style="color:#888;font-size:13px;">Or copy and paste this link in your browser:</p>
    <p style="color:#059669;font-size:13px;word-break:break-all;">${url}</p>
    <p style="color:#999;font-size:12px;margin-top:24px;">If you didn't create this account, you can safely ignore this email.</p>
  `;
  return sendEmail(email, 'Verify Your Sawdagar Account', emailWrapper('Verify Your Email', body));
};

const sendPasswordResetEmail = async (email, token) => {
  const url = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
  const body = `
    <h2 style="color:#1a1a1a;margin:0 0 16px;">Password Reset</h2>
    <p style="color:#555;font-size:15px;line-height:1.6;">We received a request to reset your password. Click the button below to set a new one:</p>
    <div style="text-align:center;margin:28px 0;">
      <a href="${url}" style="background:#059669;color:#fff;padding:14px 36px;border-radius:8px;display:inline-block;text-decoration:none;font-weight:bold;font-size:16px;">Reset Password</a>
    </div>
    <p style="color:#888;font-size:13px;">This link expires in 1 hour.</p>
    <p style="color:#999;font-size:12px;margin-top:24px;">If you didn't request this, you can safely ignore this email.</p>
  `;
  return sendEmail(email, 'Reset Your Sawdagar Password', emailWrapper('Reset Password', body));
};

const sendOrderConfirmation = async (email, order) => {
  const body = `
    <h2 style="color:#1a1a1a;margin:0 0 16px;">Order Confirmed! ✅</h2>
    <p style="color:#555;font-size:15px;">Your order has been placed successfully.</p>
    <table style="width:100%;margin:20px 0;border-collapse:collapse;">
      <tr><td style="padding:8px 0;color:#888;">Order Number</td><td style="padding:8px 0;font-weight:bold;">${order.orderNumber}</td></tr>
      <tr><td style="padding:8px 0;color:#888;">Total</td><td style="padding:8px 0;font-weight:bold;color:#059669;">${order.totalAmount} AFN</td></tr>
      <tr><td style="padding:8px 0;color:#888;">Status</td><td style="padding:8px 0;">${order.status}</td></tr>
    </table>
    <p style="color:#555;font-size:14px;">We'll notify you when your order ships.</p>
  `;
  return sendEmail(email, `Order Confirmed - ${order.orderNumber}`, emailWrapper('Order Confirmed', body));
};

const sendOrderStatusUpdate = async (email, order) => {
  const body = `
    <h2 style="color:#1a1a1a;margin:0 0 16px;">Order Update</h2>
    <p style="color:#555;font-size:15px;">Your order <strong>${order.orderNumber}</strong> status has been updated to: <strong style="color:#059669;">${order.status}</strong></p>
  `;
  return sendEmail(email, `Order Update - ${order.orderNumber}`, emailWrapper('Order Update', body));
};

const sendProductApprovalEmail = async (email, productName, status) => {
  const body = `
    <h2 style="color:#1a1a1a;margin:0 0 16px;">Product ${status}</h2>
    <p style="color:#555;font-size:15px;">Your product "<strong>${productName}</strong>" has been <strong style="color:#059669;">${status}</strong>.</p>
  `;
  return sendEmail(email, `Product ${status}: ${productName}`, emailWrapper(`Product ${status}`, body));
};

const sendSponsorshipStatusEmail = async (email, status) => {
  const body = `
    <h2 style="color:#1a1a1a;margin:0 0 16px;">Sponsorship ${status}</h2>
    <p style="color:#555;font-size:15px;">Your sponsorship request has been <strong style="color:#059669;">${status}</strong>.</p>
  `;
  return sendEmail(email, `Sponsorship Request ${status}`, emailWrapper(`Sponsorship ${status}`, body));
};

const sendAdminNotification = async (subject, message) => {
  const body = `<p style="color:#555;font-size:15px;">${message}</p>`;
  return sendEmail(process.env.SMTP_USER || 'admin@sawdagar.af', subject, emailWrapper(subject, body));
};

module.exports = {
  sendEmail, sendVerificationEmail, sendPasswordResetEmail,
  sendOrderConfirmation, sendOrderStatusUpdate,
  sendProductApprovalEmail, sendSponsorshipStatusEmail, sendAdminNotification,
};
