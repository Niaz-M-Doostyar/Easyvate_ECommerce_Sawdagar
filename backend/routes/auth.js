const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { hashPassword, comparePassword, generateToken } = require('../lib/auth');
const { validateEmail, sanitize } = require('../lib/utils');
const { generateToken: generateUUID } = require('../lib/utils');
const { sendVerificationEmail, sendPasswordResetEmail, sendAdminNotification, getLastEmailError } = require('../lib/email');
const { authenticate } = require('../middleware/auth');
const { logTransaction } = require('../lib/transactionLog');
const { normalizeProvince } = require('../lib/afghanistanProvinces');

const DELETED_CUSTOMER_EMAIL = 'deleted-user@sawdagar.local';
const DELETED_SUPPLIER_EMAIL = 'deleted-supplier@sawdagar.local';

async function ensureDeletedCustomerUser(tx) {
  const existing = await tx.user.findUnique({
    where: { email: DELETED_CUSTOMER_EMAIL },
    select: { id: true },
  });
  if (existing) return existing.id;

  const hashedPassword = await hashPassword(generateUUID());
  const created = await tx.user.create({
    data: {
      email: DELETED_CUSTOMER_EMAIL,
      password: hashedPassword,
      fullName: 'Deleted User',
      role: 'customer',
      isActive: false,
      isApproved: true,
      emailVerified: true,
    },
    select: { id: true },
  });

  return created.id;
}

async function ensureDeletedSupplierUser(tx) {
  const existing = await tx.user.findUnique({
    where: { email: DELETED_SUPPLIER_EMAIL },
    select: { id: true },
  });
  if (existing) return existing.id;

  const hashedPassword = await hashPassword(generateUUID());
  const created = await tx.user.create({
    data: {
      email: DELETED_SUPPLIER_EMAIL,
      password: hashedPassword,
      fullName: 'Deleted Supplier',
      role: 'supplier',
      companyName: 'Deleted Supplier',
      contactPerson: 'System',
      isActive: false,
      isApproved: true,
      emailVerified: true,
    },
    select: { id: true },
  });

  return created.id;
}

const crypto = require('node:crypto');
const { normalizeAfghanPhone, codeHash, sendCode } = require('../lib/phoneOtp');
const publicEmail = user => user.email?.endsWith('@phone.sawdagar.local') ? '' : user.email;

function otpRetryError(res, status, error, seconds) {
  const retryAfter = Math.max(1, Math.ceil(seconds));
  res.set('Retry-After', String(retryAfter));
  return res.status(status).json({ error, retryAfter });
}

// Persist challenges and limits so restarts and multiple workers cannot bypass them.
router.post('/customer-otp', async (req, res) => {
  try {
    const { firstName, lastName, fullName, password, confirmPassword, channel = 'sms', purpose = 'registration', role = 'customer' } = req.body;
    if (!['registration', 'password-reset'].includes(purpose)) return res.status(400).json({ error: 'Invalid verification request' });
    if (purpose === 'registration' && !['customer', 'supplier'].includes(role)) return res.status(400).json({ error: 'Invalid account type' });
    const phone = normalizeAfghanPhone(req.body.phone);
    if (!phone) return res.status(400).json({ error: 'Enter an Afghanistan mobile number, e.g. 0700123456' });
    if (!['sms', 'whatsapp'].includes(channel)) return res.status(400).json({ error: 'Invalid OTP method' });
    if (purpose === 'registration' && role === 'customer' && (typeof firstName !== 'string' || typeof lastName !== 'string' || !sanitize(firstName).trim() || !sanitize(lastName).trim() || firstName.length > 80 || lastName.length > 80))
      return res.status(400).json({ error: 'First name and last name are required (maximum 80 characters each)' });
    const supplierName = typeof fullName === 'string' ? sanitize(fullName).trim() : '';
    const supplierEmail = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const supplierCompany = typeof req.body.companyName === 'string' ? sanitize(req.body.companyName).trim() : '';
    const supplierProvince = role === 'supplier' ? normalizeProvince(req.body.province) : null;
    if (purpose === 'registration' && role === 'supplier') {
      if (!supplierName || supplierName.length > 160 || !supplierCompany || !supplierProvince)
        return res.status(400).json({ error: 'Full name, company name, and a valid province are required' });
      if (supplierEmail && (!validateEmail(supplierEmail) || supplierEmail.endsWith('@phone.sawdagar.local')))
        return res.status(400).json({ error: 'Enter a valid email or leave it blank' });
      if (supplierEmail && await prisma.user.findUnique({ where: { email: supplierEmail } }))
        return res.status(409).json({ error: 'Email already registered' });
    }
    if (purpose === 'registration' && (typeof password !== 'string' || password.length < 6 || password.length > 72 || password !== confirmPassword))
      return res.status(400).json({ error: 'Passwords must match and contain 6–72 characters' });
    const existing = await prisma.user.findFirst({ where: { OR: [{ customerPhone: phone }, { phone: { in: [phone, phone.slice(1), '0' + phone.slice(3)] } }] } });
    if (purpose === 'password-reset' && (!existing || !existing.phoneVerified || !existing.isActive || existing.customerPhone !== phone))
      return res.status(400).json({ error: 'Phone recovery is available for active phone-verified accounts. Existing email accounts should use email recovery.' });
    if (purpose === 'registration' && existing)
      return res.status(409).json({ error: 'Phone number already registered. Please sign in.' });
    const now = new Date();
    const rateKey = crypto.createHash('sha256').update(req.ip || 'unknown').digest('hex');
    const rateId = `${rateKey}:${Math.floor(now.getTime() / 3600000)}`;
    const rate = await prisma.phoneOtpRate.upsert({ where: { id: rateId }, create: { id: rateId, count: 1, expiresAt: new Date(now.getTime() + 7200000) }, update: { count: { increment: 1 } } });
    if (rate.count > 20) return otpRetryError(res, 429, 'Too many verification requests. Try again later.',
      ((Math.floor(now.getTime() / 3600000) + 1) * 3600000 - now.getTime()) / 1000);
    await prisma.phoneOtpRate.deleteMany({ where: { expiresAt: { lt: now } } });
    const id = crypto.randomUUID();
    const code = String(crypto.randomInt(100000, 1000000));
    const passwordHash = purpose === 'registration' ? await hashPassword(password) : '';
    const previous = await prisma.phoneRegistration.findUnique({ where: { phone } });
    if (previous) {
      const cooldown = 60000 - (now - previous.lastSentAt);
      const hourlyLimit = previous.sendCount >= 5 ? 3600000 - (now - previous.windowStart) : 0;
      if (Math.max(cooldown, hourlyLimit) > 0)
        return otpRetryError(res, 429, hourlyLimit > 0
          ? 'Maximum 5 codes per hour. Try again after the countdown.'
          : 'Please wait before requesting another code.', Math.max(cooldown, hourlyLimit) / 1000);
    }
    const data = { id, purpose, userId: purpose === 'password-reset' ? existing.id : null, fullName: purpose === 'registration' ? (role === 'supplier' ? supplierName : `${sanitize(firstName).trim()} ${sanitize(lastName).trim()}`) : '', password: passwordHash,
      registrationData: purpose === 'registration' ? { role, email: role === 'supplier' ? supplierEmail : '', companyName: role === 'supplier' ? supplierCompany : '', province: role === 'supplier' ? supplierProvince : '', district: role === 'supplier' ? sanitize(String(req.body.district || '')) : '', village: role === 'supplier' ? sanitize(String(req.body.village || '')) : '', landmark: role === 'supplier' ? sanitize(String(req.body.landmark || '')) : '' } : null,
      codeHash: codeHash(id, code), expiresAt: new Date(now.getTime() + 300000), lastSentAt: now, attempts: 0,
      sendCount: previous && now - previous.windowStart < 3600000 ? previous.sendCount + 1 : 1,
      windowStart: previous && now - previous.windowStart < 3600000 ? previous.windowStart : now };
    // Compare-and-swap reserves the send before contacting the paid provider.
    if (previous) {
      const reserved = await prisma.phoneRegistration.updateMany({ where: { id: previous.id, lastSentAt: previous.lastSentAt }, data });
      if (!reserved.count) return otpRetryError(res, 429, 'Another code request is in progress', 60);
    } else await prisma.phoneRegistration.create({ data: { ...data, phone } });
    try { await sendCode(phone, code, channel); }
    catch (deliveryFailure) {
      const reason = /^OTP_[A-Z0-9_]+$/.test(deliveryFailure.code || '') ? deliveryFailure.code : 'OTP_PROVIDER_NETWORK_ERROR';
      console.error(`Phone OTP delivery failed: ${reason}`);
      await prisma.phoneRegistration.updateMany({ where: { id }, data: { expiresAt: now } });
      return otpRetryError(res, 503, 'Could not send the code. Wait 60 seconds and try again or choose the other method.', 60);
    }
    return res.json({ challengeId: id, expiresIn: 300, retryAfter: 60, channel, message: `Code sent by ${channel === 'sms' ? 'SMS' : 'WhatsApp'}` });
  } catch (err) {
    if (err.code === 'P2002') return otpRetryError(res, 429, 'Another code request is in progress. Please wait before trying again.', 60);
    const reason = /^P\d{4}$/.test(err.code || '') ? err.code : 'OTP_REQUEST_ERROR';
    console.error(`Phone OTP request failed: ${reason}`);
    return res.status(500).json({ error: 'Unable to request verification. Please try again later.' });
  }
});
router.post('/verify-customer-otp', async (req, res) => {
  try {
    const { challengeId, code } = req.body;
    if (typeof challengeId !== 'string' || typeof code !== 'string' || !/^\d{6}$/.test(code))
      return res.status(400).json({ error: 'Enter the six-digit code' });
    const result = await prisma.$transaction(async tx => {
      const reserved = await tx.phoneRegistration.updateMany({ where: { id: challengeId, purpose: 'registration', expiresAt: { gt: new Date() }, attempts: { lt: 5 } }, data: { attempts: { increment: 1 } } });
      if (!reserved.count) return false;
      const challenge = await tx.phoneRegistration.findUnique({ where: { id: challengeId } });
      if (codeHash(challengeId, code) !== challenge.codeHash) return false;
      const registration = challenge.registrationData || { role: 'customer' };
      const supplier = registration.role === 'supplier';
      const user = await tx.user.create({ data: { email: registration.email || `${challenge.phone.slice(1)}@phone.sawdagar.local`, customerPhone: challenge.phone,
        phone: challenge.phone, phoneVerified: true, fullName: challenge.fullName, password: challenge.password,
        role: supplier ? 'supplier' : 'customer', isActive: true, isApproved: !supplier, emailVerified: false,
        companyName: supplier ? registration.companyName : null, province: supplier ? registration.province : null,
        district: supplier ? registration.district || null : null, village: supplier ? registration.village || null : null,
        landmark: supplier ? registration.landmark || null : null } });
      await tx.phoneRegistration.delete({ where: { id: challengeId } });
      return { id: user.id, role: user.role, fullName: user.fullName, email: publicEmail(user), phone: user.phone };
    });
    if (!result) return res.status(400).json({ error: 'Invalid or expired code. Request a new code after 5 failed attempts.' });
    if (result.role === 'supplier') {
      const notified = await sendAdminNotification('New supplier registration', `${result.fullName} (${result.phone}${result.email ? `, ${result.email}` : ''}) registered as a supplier.`);
      if (!notified) console.warn('Supplier registration admin notification failed:', getLastEmailError()?.message || 'unknown error');
    }
    return res.status(201).json({ message: result.role === 'supplier' ? 'Phone verified. Supplier account created and pending admin approval.' : 'Phone verified. Account created! You can now sign in with your phone number.', pendingApproval: result.role === 'supplier' });
  } catch (err) {
    return res.status(err.code === 'P2002' ? 409 : 500).json({ error: 'Unable to create account. Please try signing in or request a new code.' });
  }
});

// Verify recovery before asking for a new password. Store only a hash of the
// short-lived proof; the original OTP cannot be reused after this transition.
router.post('/verify-phone-reset-otp', async (req, res) => {
  try {
    const { challengeId, code } = req.body;
    if (typeof challengeId !== 'string' || typeof code !== 'string' || !/^\d{6}$/.test(code))
      return res.status(400).json({ error: 'Enter the six-digit code' });
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresIn = 600;
    const valid = await prisma.$transaction(async tx => {
      const now = new Date();
      const reserved = await tx.phoneRegistration.updateMany({ where: { id: challengeId, purpose: 'password-reset', expiresAt: { gt: now }, attempts: { lt: 5 } }, data: { attempts: { increment: 1 } } });
      if (!reserved.count) return false;
      const challenge = await tx.phoneRegistration.findUnique({ where: { id: challengeId } });
      if (codeHash(challengeId, code) !== challenge.codeHash) return false;
      await tx.phoneRegistration.updateMany({ where: { id: challengeId, purpose: 'password-reset' }, data: {
        purpose: 'password-reset-verified', codeHash: codeHash(challengeId, resetToken),
        expiresAt: new Date(now.getTime() + expiresIn * 1000), attempts: 0,
      } });
      return true;
    });
    if (!valid) return res.status(400).json({ error: 'Invalid or expired code. Request a new code after 5 failed attempts.' });
    return res.json({ challengeId, resetToken, expiresIn, message: 'Phone verified. Choose a new password.' });
  } catch { return res.status(500).json({ error: 'Unable to verify code. Please try again later.' }); }
});

router.post('/reset-phone-password', async (req, res) => {
  try {
    const { challengeId, code, resetToken, password, confirmPassword } = req.body;
    const hasProof = resetToken !== undefined;
    const proofError = { error: 'Verification expired or is no longer valid. Request a new code.', code: 'RESET_PROOF_INVALID' };
    if (hasProof && (typeof challengeId !== 'string' || typeof resetToken !== 'string' || !/^[a-f0-9]{64}$/.test(resetToken)))
      return res.status(400).json(proofError);
    // Retain the single-step request for existing website and installed clients.
    if (!hasProof && (typeof challengeId !== 'string' || typeof code !== 'string' || !/^\d{6}$/.test(code)))
      return res.status(400).json({ error: 'Enter the six-digit code' });
    if (typeof password !== 'string' || password.length < 6 || password.length > 72 || password !== confirmPassword)
      return res.status(400).json({ error: 'Passwords must match and contain 6–72 characters' });
    const hashed = await hashPassword(password);
    const valid = await prisma.$transaction(async tx => {
      const reserved = await tx.phoneRegistration.updateMany({ where: { id: challengeId, purpose: hasProof ? 'password-reset-verified' : 'password-reset', expiresAt: { gt: new Date() }, attempts: { lt: 5 } }, data: { attempts: { increment: 1 } } });
      if (!reserved.count) return false;
      const challenge = await tx.phoneRegistration.findUnique({ where: { id: challengeId } });
      if (codeHash(challengeId, hasProof ? resetToken : code) !== challenge.codeHash) return false;
      const updated = await tx.user.updateMany({ where: { id: challenge.userId, customerPhone: challenge.phone, phoneVerified: true, isActive: true }, data: { password: hashed, resetToken: null, resetTokenExp: null } });
      if (!updated.count) return false;
      await tx.phoneRegistration.delete({ where: { id: challengeId } });
      return true;
    });
    if (!valid) return res.status(400).json(hasProof ? proofError : { error: 'Invalid or expired code. Request a new code after 5 failed attempts.' });
    return res.json({ message: 'Password updated. Sign in with your phone number and new password.' });
  } catch { return res.status(500).json({ error: 'Unable to reset password. Please try again later.' }); }
});

// New customer and supplier accounts are created only after phone OTP verification.
router.post('/register', (_req, res) => res.status(400).json({
  error: 'Use phone verification to create an account',
}));

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { password, rememberMe } = req.body;
    const email = req.body.phone || req.body.email;
    if (typeof email !== 'string' || typeof password !== 'string') return res.status(400).json({ error: 'Phone or email and password are required' });

    const phone = normalizeAfghanPhone(email);
    const user = phone ? await prisma.user.findUnique({ where: { customerPhone: phone } }) : await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    if (!user.emailVerified && !user.phoneVerified) return res.status(403).json({ error: 'Please verify your phone or email first' });
    if (!user.isActive) return res.status(403).json({ error: 'Account is deactivated' });
    if (user.role === 'supplier' && !user.isApproved) {
      return res.status(403).json({ error: 'Supplier account is pending admin approval' });
    }

    const valid = await comparePassword(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const persistentSession = rememberMe === true || rememberMe === 'true';
    const token = generateToken({ userId: user.id, role: user.role }, { persistent: persistentSession });
    const cookieDays = persistentSession ? 3650 : 7;

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: cookieDays * 24 * 60 * 60 * 1000,
      path: '/',
    });

    res.json({
      user: {
        id: user.id, email: publicEmail(user), phoneVerified: user.phoneVerified, fullName: user.fullName,
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

// DELETE /api/auth/account
router.delete('/account', authenticate, async (req, res) => {
  try {
    const currentUser = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, email: true, role: true },
    });

    if (!currentUser) return res.status(404).json({ error: 'User not found' });
    if (currentUser.role === 'admin') {
      return res.status(403).json({ error: 'Admin account deletion is not allowed' });
    }

    const activeOrder = await prisma.order.findFirst({
      where: { userId: currentUser.id, status: { in: ['pending', 'confirmed', 'shipped'] } },
      select: { orderNumber: true },
    });
    if (activeOrder) {
      return res.status(409).json({
        error: `Your order ${activeOrder.orderNumber} is still active. Please contact support to complete or cancel it before deleting your account.`,
      });
    }

    await prisma.$transaction(async (tx) => {
      const deletedCustomerId = await ensureDeletedCustomerUser(tx);

      await tx.order.updateMany({
        where: { userId: currentUser.id },
        data: {
          userId: deletedCustomerId,
          province: null,
          district: null,
          village: null,
          landmark: null,
          phone: null,
          notes: null,
        },
      });

      await tx.order.updateMany({
        where: { deliveryPersonId: currentUser.id },
        data: { deliveryPersonId: null },
      });

      const ownedProducts = await tx.product.findMany({
        where: { supplierId: currentUser.id },
        select: { id: true },
      });
      const ownedProductIds = ownedProducts.map((product) => product.id);
      const supplierRequestCount = await tx.sponsorshipRequest.count({
        where: { supplierId: currentUser.id },
      });

      if (ownedProductIds.length > 0 || supplierRequestCount > 0) {
        const deletedSupplierId = await ensureDeletedSupplierUser(tx);

        if (ownedProductIds.length > 0) {
          await tx.cartItem.deleteMany({
            where: { productId: { in: ownedProductIds } },
          });

          await tx.product.updateMany({
            where: { id: { in: ownedProductIds } },
            data: {
              supplierId: deletedSupplierId,
              status: 'rejected',
              isDeleted: true,
              isSponsored: false,
            },
          });
        }

        await tx.sponsorshipRequest.updateMany({
          where: { supplierId: currentUser.id },
          data: { supplierId: deletedSupplierId, status: 'rejected' },
        });
      }

      await tx.cartItem.deleteMany({ where: { userId: currentUser.id } });
      await tx.deliveryLocation.deleteMany({ where: { userId: currentUser.id } });

      await tx.user.delete({ where: { id: currentUser.id } });
    });

    await logTransaction(req, 'DELETE_ACCOUNT', 'User', currentUser.id, {
      email: currentUser.email,
      role: currentUser.role,
    });

    res.cookie('token', '', { httpOnly: true, maxAge: 0, path: '/' });
    return res.json({ message: 'Account deleted permanently' });
  } catch (err) {
    console.error('Delete account error:', err);
    return res.status(500).json({ error: 'Failed to delete account' });
  }
});

const verifyEmail = async (token, res) => {
  try {
    if (!token) return res.status(400).json({ error: 'Token is required' });

    const user = await prisma.user.findFirst({ where: { verifyToken: token } });
    if (!user) return res.status(400).json({ error: 'Invalid or expired token' });

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        isActive: true,
        isApproved: user.isApproved,
      },
      // Keep verifyToken in the database so the link remains usable if clicked again.
    });

    const pendingApproval = updatedUser.role === 'supplier' && !updatedUser.isApproved;
    res.json({
      message: pendingApproval
        ? 'Email verified successfully. Your supplier account is pending admin approval.'
        : updatedUser.role === 'supplier'
          ? 'Email verified successfully. Your supplier account is approved. You can now log in.'
          : 'Email verified successfully',
      pendingApproval,
    });
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
    if (typeof email !== 'string' || !validateEmail(email) || email.toLowerCase().endsWith('@phone.sawdagar.local')) return res.status(400).json({ error: 'Enter a valid email. Phone accounts should use phone OTP recovery.' });

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.phoneVerified) return res.status(400).json({ error: 'This account uses phone verification' });
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
    if (typeof email !== 'string' || !validateEmail(email) || email.toLowerCase().endsWith('@phone.sawdagar.local')) return res.status(400).json({ error: 'Enter a valid email. Phone accounts should use phone OTP recovery.' });

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
  res.json({ user: { ...req.user, email: publicEmail(req.user) } });
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
    if (phone !== undefined) {
      if (req.user.phoneVerified && normalizeAfghanPhone(phone) !== req.user.phone) return res.status(400).json({ error: 'Verified phone number cannot be changed here' });
      updateData.phone = req.user.phoneVerified ? req.user.phone : phone;
    }
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
        id: true, email: true, fullName: true, phone: true, phoneVerified: true, role: true,
        province: true, district: true, village: true, landmark: true,
        companyName: true, contactPerson: true, taxId: true,
      },
    });

    res.json({ user: { ...updated, email: publicEmail(updated) } });
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
    if (typeof email !== 'string' || !validateEmail(email) || email.toLowerCase().endsWith('@phone.sawdagar.local')) return res.status(400).json({ error: 'Enter a valid email. Phone accounts should use phone OTP recovery.' });
    const testToken = 'test-' + Date.now();
    const result = await sendVerificationEmail(email, testToken);
    if (result) {
      res.json({ message: `Test verification email sent to ${email}` });
    } else {
      const err = (typeof getLastEmailError === 'function' ? getLastEmailError() : null);
      return res.status(500).json({
        error: 'Failed to send email. Check SMTP settings in .env',
        details: err ? (err.message || String(err)) : undefined,
      });
    }
  } catch (err) {
    console.error('Test email error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
