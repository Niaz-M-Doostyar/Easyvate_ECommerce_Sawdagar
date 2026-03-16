const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { hashPassword, comparePassword, generateToken } = require('../lib/auth');
const { validateEmail, sanitize } = require('../lib/utils');
const { generateToken: generateUUID } = require('../lib/utils');
const { sendVerificationEmail, sendPasswordResetEmail, sendAdminNotification, getLastEmailError } = require('../lib/email');
const { authenticate } = require('../middleware/auth');
const { logTransaction } = require('../lib/transactionLog');

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const {
      email,
      password,
      fullName,
      phone,
      role,
      province,
      district,
      village,
      landmark,
      companyName,
      contactPerson,
      taxId,
      businessLicense,
    } = req.body;

    if (!email || !password || !fullName) {
      return res.status(400).json({ error: 'Email, password, and full name are required' });
    }
    if (!validateEmail(email)) return res.status(400).json({ error: 'Invalid email' });
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) return res.status(400).json({ error: 'Email already registered' });

    const userRole = ['customer', 'supplier'].includes(role) ? role : 'customer';
    if (userRole === 'supplier' && !companyName) {
      return res.status(400).json({ error: 'Company name is required for suppliers' });
    }

    const hashedPassword = await hashPassword(password);

    // Auto-verify if explicitly enabled via env (useful for local dev).
    // By default, users must verify their email to login.
    const autoVerify = process.env.AUTO_VERIFY_CUSTOMER === 'true';
    const verificationToken = autoVerify ? null : generateUUID();

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        fullName: sanitize(fullName),
        phone: phone || null,
        role: userRole,
        isActive: autoVerify,
        emailVerified: autoVerify,
        province: province || null,
        district: district || null,
        village: village || null,
        landmark: landmark || null,
        companyName: userRole === 'supplier' ? sanitize(companyName) : null,
        contactPerson: contactPerson ? sanitize(contactPerson) : null,
        businessLicense: businessLicense || null,
        taxId: taxId || null,
        verifyToken: verificationToken,
        isApproved: userRole === 'customer',
      },
    });

    if (!autoVerify) {
      const sent = await sendVerificationEmail(user.email, verificationToken);
      if (!sent) {
        return res.status(500).json({
          error: 'Registration created but verification email could not be sent. Please contact support or try again later.',
          details: getLastEmailError()?.message || undefined,
        });
      }
    }

    if (userRole === 'supplier') {
      await sendAdminNotification('New supplier registration', `${user.fullName} (${user.email}) registered as a supplier.`);
    }

    await logTransaction(req, 'REGISTER', 'User', user.id, { email: user.email, role: userRole });

    if (autoVerify) {
      res.status(201).json({ message: 'Registration successful! You can now log in.' });
    } else {
      res.status(201).json({ message: 'Registration successful. Please verify your email.' });
    }
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    if (!user.emailVerified) return res.status(403).json({ error: 'Please verify your email first' });
    if (!user.isActive) return res.status(403).json({ error: 'Account is deactivated' });
    if (user.role === 'supplier' && !user.isApproved) {
      return res.status(403).json({ error: 'Supplier account is pending admin approval' });
    }

    const valid = await comparePassword(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = generateToken({ userId: user.id, role: user.role });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    res.json({
      user: {
        id: user.id, email: user.email, fullName: user.fullName,
        role: user.role, phone: user.phone, province: user.province,
        district: user.district, village: user.village, landmark: user.landmark,
        companyName: user.companyName, isApproved: user.isApproved,
      },
      token,
    });
    await logTransaction(req, 'LOGIN', 'User', user.id, { email: user.email, role: user.role });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.cookie('token', '', { httpOnly: true, maxAge: 0, path: '/' });
  res.json({ message: 'Logged out' });
});

const verifyEmail = async (token, res) => {
  try {
    if (!token) return res.status(400).json({ error: 'Token is required' });

    const user = await prisma.user.findFirst({ where: { verifyToken: token } });
    if (!user) return res.status(400).json({ error: 'Invalid or expired token' });

    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true, isActive: true },
      // Keep verifyToken in the database so the link remains usable if clicked again.
    });

    res.json({ message: 'Email verified successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Verification failed' });
  }
};

router.post('/verify-email', async (req, res) => verifyEmail(req.body.token, res));
router.get('/verify-email', async (req, res) => verifyEmail(req.query.token, res));

// POST /api/auth/resend-verification
router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.emailVerified) return res.status(400).json({ error: 'Email already verified' });

    const token = user.verifyToken || generateUUID();
    await prisma.user.update({ where: { id: user.id }, data: { verifyToken: token } });

    const sent = await sendVerificationEmail(user.email, token);
    if (!sent) return res.status(500).json({ error: 'Failed to send verification email' });

    res.json({ message: 'Verification email sent' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send verification email' });
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (user) {
      const resetToken = generateUUID();
      const resetExpires = new Date(Date.now() + 60 * 60 * 1000);
      await prisma.user.update({
        where: { id: user.id },
        data: { resetToken, resetTokenExp: resetExpires },
      });
      const sent = await sendPasswordResetEmail(user.email, resetToken);
      if (!sent) {
        const err = getLastEmailError && getLastEmailError();
        console.error('Forgot password email failed:', err);
        return res.status(500).json({ error: 'Failed to send reset link. Please check email settings.' });
      }
    }

    res.json({ message: 'If the email exists, a reset link has been sent.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to process request' });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ error: 'Token and password are required' });
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

    const user = await prisma.user.findFirst({
      where: { resetToken: token, resetTokenExp: { gt: new Date() } },
    });
    if (!user) return res.status(400).json({ error: 'Invalid or expired token' });

    const hashedPassword = await hashPassword(password);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword, resetToken: null, resetTokenExp: null },
    });

    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Password reset failed' });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req, res) => {
  res.json({ user: req.user });
});

const updateProfile = async (req, res) => {
  try {
    const {
      fullName,
      phone,
      province,
      district,
      village,
      landmark,
      companyName,
      contactPerson,
      taxId,
      currentPassword,
      newPassword,
    } = req.body;

    if (newPassword) {
      if (!currentPassword) return res.status(400).json({ error: 'Current password is required' });
      const user = await prisma.user.findUnique({ where: { id: req.user.id } });
      const valid = await comparePassword(currentPassword, user.password);
      if (!valid) return res.status(400).json({ error: 'Current password is incorrect' });
      if (newPassword.length < 6) return res.status(400).json({ error: 'New password must be at least 6 characters' });
      const hashed = await hashPassword(newPassword);
      await prisma.user.update({ where: { id: req.user.id }, data: { password: hashed } });
      return res.json({ message: 'Password updated' });
    }

    const updateData = {};
    if (fullName) updateData.fullName = sanitize(fullName);
    if (phone !== undefined) updateData.phone = phone;
    if (province !== undefined) updateData.province = province;
    if (district !== undefined) updateData.district = district;
    if (village !== undefined) updateData.village = village;
    if (landmark !== undefined) updateData.landmark = landmark;
    if (req.user.role === 'supplier') {
      if (companyName !== undefined) updateData.companyName = companyName ? sanitize(companyName) : null;
      if (contactPerson !== undefined) updateData.contactPerson = contactPerson ? sanitize(contactPerson) : null;
      if (taxId !== undefined) updateData.taxId = taxId || null;
    }

    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData,
      select: {
        id: true, email: true, fullName: true, phone: true, role: true,
        province: true, district: true, village: true, landmark: true,
        companyName: true, contactPerson: true, taxId: true,
      },
    });

    res.json({ user: updated });
  } catch (err) {
    res.status(500).json({ error: 'Profile update failed' });
  }
};

router.put('/me', authenticate, updateProfile);
router.put('/profile', authenticate, updateProfile);
router.put('/change-password', authenticate, async (req, res) => {
  req.body = { currentPassword: req.body.currentPassword, newPassword: req.body.newPassword };
  return updateProfile(req, res);
});

// POST /api/auth/test-email - Send a test verification email (admin/dev only)
router.post('/test-email', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });
    const testToken = 'test-' + Date.now();
    const result = await sendVerificationEmail(email, testToken);
    if (result) {
      res.json({ message: `Test verification email sent to ${email}` });
    } else {
      const err = (typeof getLastEmailError === 'function' ? getLastEmailError() : null);
      return res.status(500).json({
        error: 'Failed to send email. Check SMTP_USER and SMTP_PASS in .env',
        details: err ? (err.message || String(err)) : undefined,
      });
    }
  } catch (err) {
    console.error('Test email error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
