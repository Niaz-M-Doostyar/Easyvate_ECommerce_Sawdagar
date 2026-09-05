const nodemailer = require('nodemailer');

const configuredSmtpHost = (process.env.SMTP_HOST || '').trim();
const smtpUser = (process.env.SMTP_USER || '').trim();
const smtpPass = process.env.SMTP_PASS || '';
const smtpHasAuth = Boolean(smtpUser && smtpPass);
const smtpHost = configuredSmtpHost || null;
const smtpPort = parseInt(process.env.SMTP_PORT, 10) || 587;
const smtpSecure = process.env.SMTP_SECURE === 'true' || smtpPort === 465;
const smtpAllowUnauth = process.env.SMTP_ALLOW_UNAUTH === 'true'
  || ['localhost', '127.0.0.1', '::1'].includes(smtpHost || '');
const smtpRequireTls = process.env.SMTP_REQUIRE_TLS === 'true'
  || (process.env.SMTP_REQUIRE_TLS !== 'false' && (smtpSecure || smtpHasAuth));
const smtpIgnoreTls = process.env.SMTP_IGNORE_TLS === 'true'
  || (!smtpSecure && !smtpHasAuth && ['localhost', '127.0.0.1', '::1'].includes(smtpHost || '') && process.env.SMTP_REQUIRE_TLS !== 'true');
const smtpConfigured = Boolean(smtpHost && (smtpHasAuth || smtpAllowUnauth));

let transporter = null;
if (smtpConfigured) {
  const transportOptions = {
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    pool: true,
    maxConnections: 3,
  };

  if (smtpRequireTls) {
    transportOptions.requireTLS = true;
  }

  if (smtpIgnoreTls) {
    transportOptions.ignoreTLS = true;
  }

  if (smtpHasAuth) {
    transportOptions.auth = {
      user: smtpUser,
      pass: smtpPass,
    };
  }

  transporter = nodemailer.createTransport(transportOptions);
} else {
  console.warn('SMTP is not configured. Set authenticated SMTP credentials, or configure a local relay with SMTP_HOST=localhost and SMTP_ALLOW_UNAUTH=true.');
}

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

let lastEmailError = null;
let lastEmail = null;

function getFrontendUrl() {
  return (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/+$/, '');
}

const emailIdentities = {
  info: {
    from: process.env.SMTP_FROM_INFO || process.env.SMTP_FROM || 'Sawdagar <info@sawdagaraf.com>',
    replyTo: process.env.SMTP_REPLY_TO_INFO || process.env.ADMIN_EMAIL || 'info@sawdagaraf.com',
  },
  sales: {
    from: process.env.SMTP_FROM_SALES || 'Sawdagar Sales <sales@sawdagaraf.com>',
    replyTo: process.env.SMTP_REPLY_TO_SALES || 'sales@sawdagaraf.com',
  },
  support: {
    from: process.env.SMTP_FROM_SUPPORT || 'Sawdagar Support <supports@sawdagaraf.com>',
    replyTo: process.env.SMTP_REPLY_TO_SUPPORT || process.env.SMTP_REPLY_TO || 'supports@sawdagaraf.com',
  },
};

function getEmailIdentity(type = 'info') {
  return emailIdentities[type] || emailIdentities.info;
}

const sendEmail = async (to, subject, html, options = {}) => {
  const identity = getEmailIdentity(options.fromType);
  const fromAddress = options.from || identity.from || (smtpUser ? `Sawdagar <${smtpUser}>` : 'Sawdagar <info@sawdagaraf.com>');
  const replyToAddress = options.replyTo || identity.replyTo || fromAddress;

  if (!transporter) {
    const err = new Error('SMTP not configured. Set SMTP_USER and SMTP_PASS.');
    console.warn('Email not sent:', { to, subject, html, from: fromAddress });
    lastEmailError = err;
    return false;
  }

  try {
    await transporter.sendMail({
      from: fromAddress,
      replyTo: replyToAddress,
      to,
      subject,
      html,
    });
    lastEmailError = null;
    lastEmail = { to, subject, html, sentAt: new Date().toISOString() };
    return true;
  } catch (err) {
    console.error('Email send error:', err);
    lastEmailError = err;
    return false;
  }
};

const getLastEmailError = () => lastEmailError;
const getLastEmail = () => lastEmail;

const sendVerificationEmail = async (email, token) => {
  const url = `${getFrontendUrl()}/verify-email?token=${token}`;
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
  return sendEmail(email, 'Verify Your Sawdagar Account', emailWrapper('Verify Your Email', body), { fromType: 'support' });
};

const sendPasswordResetEmail = async (email, token) => {
  const url = `${getFrontendUrl()}/reset-password?token=${token}`;
  const body = `
    <h2 style="color:#1a1a1a;margin:0 0 16px;">Password Reset</h2>
    <p style="color:#555;font-size:15px;line-height:1.6;">We received a request to reset your password. Click the button below to set a new one:</p>
    <div style="text-align:center;margin:28px 0;">
      <a href="${url}" style="background:#059669;color:#fff;padding:14px 36px;border-radius:8px;display:inline-block;text-decoration:none;font-weight:bold;font-size:16px;">Reset Password</a>
    </div>
    <p style="color:#888;font-size:13px;">This link expires in 1 hour.</p>
    <p style="color:#999;font-size:12px;margin-top:24px;">If you didn't request this, you can safely ignore this email.</p>
  `;
  return sendEmail(email, 'Reset Your Sawdagar Password', emailWrapper('Reset Password', body), { fromType: 'support' });
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
  return sendEmail(email, `Order Confirmed - ${order.orderNumber}`, emailWrapper('Order Confirmed', body), { fromType: 'sales' });
};

const sendNewOrderNotification = async (order, user) => {
  const orderEmail = process.env.ORDER_NOTIFICATION_EMAIL
    || process.env.SMTP_REPLY_TO_SALES
    || 'sales@sawdagaraf.com';
  const customerLabel = user ? `${user.fullName || 'Customer'} (${user.email})` : 'Customer';
  const body = `
    <h2 style="color:#1a1a1a;margin:0 0 16px;">New Customer Order</h2>
    <p style="color:#555;font-size:15px;">A new order has been placed on Sawdagar.</p>
    <table style="width:100%;margin:20px 0;border-collapse:collapse;">
      <tr><td style="padding:8px 0;color:#888;">Order Number</td><td style="padding:8px 0;font-weight:bold;">${order.orderNumber}</td></tr>
      <tr><td style="padding:8px 0;color:#888;">Customer</td><td style="padding:8px 0;">${customerLabel}</td></tr>
      <tr><td style="padding:8px 0;color:#888;">Total</td><td style="padding:8px 0;font-weight:bold;color:#059669;">${order.totalAmount} AFN</td></tr>
      <tr><td style="padding:8px 0;color:#888;">Items</td><td style="padding:8px 0;">${order.items?.length || 0}</td></tr>
      <tr><td style="padding:8px 0;color:#888;">Phone</td><td style="padding:8px 0;">${order.phone || ''}</td></tr>
      <tr><td style="padding:8px 0;color:#888;">Province</td><td style="padding:8px 0;">${order.province || ''}</td></tr>
    </table>
  `;
  return sendEmail(orderEmail, `New Order - ${order.orderNumber}`, emailWrapper('New Order', body), { fromType: 'sales' });
};

const sendOrderStatusUpdate = async (email, order) => {
  const body = `
    <h2 style="color:#1a1a1a;margin:0 0 16px;">Order Update</h2>
    <p style="color:#555;font-size:15px;">Your order <strong>${order.orderNumber}</strong> status has been updated to: <strong style="color:#059669;">${order.status}</strong></p>
  `;
  return sendEmail(email, `Order Update - ${order.orderNumber}`, emailWrapper('Order Update', body), { fromType: 'sales' });
};

const sendOrderStatusRecord = async (order, user, previousStatus) => {
  const orderEmail = process.env.ORDER_NOTIFICATION_EMAIL
    || process.env.SMTP_REPLY_TO_SALES
    || 'sales@sawdagaraf.com';
  const customerLabel = user ? `${user.fullName || 'Customer'} (${user.email})` : 'Customer';
  const body = `
    <h2 style="color:#1a1a1a;margin:0 0 16px;">Order Status Record</h2>
    <p style="color:#555;font-size:15px;">An order status was updated on Sawdagar.</p>
    <table style="width:100%;margin:20px 0;border-collapse:collapse;">
      <tr><td style="padding:8px 0;color:#888;">Order Number</td><td style="padding:8px 0;font-weight:bold;">${order.orderNumber}</td></tr>
      <tr><td style="padding:8px 0;color:#888;">Customer</td><td style="padding:8px 0;">${customerLabel}</td></tr>
      <tr><td style="padding:8px 0;color:#888;">Previous Status</td><td style="padding:8px 0;">${previousStatus || 'unknown'}</td></tr>
      <tr><td style="padding:8px 0;color:#888;">New Status</td><td style="padding:8px 0;font-weight:bold;color:#059669;">${order.status}</td></tr>
      <tr><td style="padding:8px 0;color:#888;">Payment Status</td><td style="padding:8px 0;">${order.paymentStatus || ''}</td></tr>
      <tr><td style="padding:8px 0;color:#888;">Total</td><td style="padding:8px 0;">${order.totalAmount} AFN</td></tr>
    </table>
  `;
  return sendEmail(orderEmail, `Order Status ${order.status} - ${order.orderNumber}`, emailWrapper('Order Status Record', body), { fromType: 'sales' });
};

const sendProductApprovalEmail = async (email, productName, status) => {
  const body = `
    <h2 style="color:#1a1a1a;margin:0 0 16px;">Product ${status}</h2>
    <p style="color:#555;font-size:15px;">Your product "<strong>${productName}</strong>" has been <strong style="color:#059669;">${status}</strong>.</p>
  `;
  return sendEmail(email, `Product ${status}: ${productName}`, emailWrapper(`Product ${status}`, body), { fromType: 'support' });
};

const sendSponsorshipStatusEmail = async (email, status) => {
  const body = `
    <h2 style="color:#1a1a1a;margin:0 0 16px;">Sponsorship ${status}</h2>
    <p style="color:#555;font-size:15px;">Your sponsorship request has been <strong style="color:#059669;">${status}</strong>.</p>
  `;
  return sendEmail(email, `Sponsorship Request ${status}`, emailWrapper(`Sponsorship ${status}`, body), { fromType: 'sales' });
};

const sendSupplierAccountStatusEmail = async (email, status) => {
  const loginUrl = `${getFrontendUrl()}/login`;
  const approved = status === 'approved';
  const subject = approved
    ? 'Your Sawdagar supplier account is approved'
    : 'Update on your Sawdagar supplier account';
  const body = approved
    ? `
      <h2 style="color:#1a1a1a;margin:0 0 16px;">Supplier Account Approved</h2>
      <p style="color:#555;font-size:15px;line-height:1.6;">Your supplier account has been approved by the Sawdagar team. You can now sign in and start managing your supplier portal.</p>
      <div style="text-align:center;margin:28px 0;">
        <a href="${loginUrl}" style="background:#059669;color:#fff;padding:14px 36px;border-radius:8px;display:inline-block;text-decoration:none;font-weight:bold;font-size:16px;">Sign In</a>
      </div>
      <p style="color:#888;font-size:13px;word-break:break-all;">${loginUrl}</p>
    `
    : `
      <h2 style="color:#1a1a1a;margin:0 0 16px;">Supplier Account Update</h2>
      <p style="color:#555;font-size:15px;line-height:1.6;">Your supplier account has not been approved at this time. If you believe this is a mistake, please contact the Sawdagar support team for more information.</p>
    `;

  return sendEmail(email, subject, emailWrapper(subject, body), { fromType: 'support' });
};

const sendAdminNotification = async (subject, message) => {
  const adminEmail = (process.env.ADMIN_EMAIL || smtpUser || '').trim();
  if (!adminEmail) {
    lastEmailError = new Error('ADMIN_EMAIL is not configured.');
    return false;
  }

  const body = `<p style="color:#555;font-size:15px;">${message}</p>`;
  return sendEmail(adminEmail, subject, emailWrapper(subject, body), { fromType: 'info' });
};

module.exports = {
  sendEmail, sendVerificationEmail, sendPasswordResetEmail,
  sendOrderConfirmation, sendNewOrderNotification, sendOrderStatusUpdate, sendOrderStatusRecord,
  sendProductApprovalEmail, sendSponsorshipStatusEmail, sendSupplierAccountStatusEmail, sendAdminNotification,
  getLastEmailError, getLastEmail,
};
