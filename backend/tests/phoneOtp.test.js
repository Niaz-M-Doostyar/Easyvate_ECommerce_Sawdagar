const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeAfghanPhone, sendCode } = require('../lib/phoneOtp');

test('Afghan phone variants normalize, while foreign and malformed numbers are rejected', () => {
  for (const phone of ['0700123456', '+93 700 123 456', '0093700123456', '93700123456', '۰۷۰۰۱۲۳۴۵۶', '٠٧٠٠١٢٣٤٥٦']) {
    assert.equal(normalizeAfghanPhone(phone), '+93700123456');
  }
  for (const phone of ['+44700123456', '070012345', '07001234567', '+93600123456', 'abc0700123456', null, {}]) assert.equal(normalizeAfghanPhone(phone), null);
});

test('provider requests keep SMS to digits only and select the WhatsApp endpoint explicitly', async () => {
  const originalFetch = global.fetch;
  const originalKey = process.env.GHONCHA_API_KEY;
  process.env.GHONCHA_API_KEY = 'test-key';
  const calls = [];
  global.fetch = async (url, options) => { calls.push({ url, ...options }); return { ok: true, json: async () => ({ status: 'pending' }) }; };
  try {
    await sendCode('+93700123456', '123456', 'sms');
    await sendCode('+93700123456', '123456', 'whatsapp');
    assert.equal(calls[0].url, 'https://sms.ghoncha.com/api/v1/send');
    assert.deepEqual(JSON.parse(calls[0].body), { phone: '+93700123456', message: '123456' });
    assert.equal(calls[1].url, 'https://sms.ghoncha.com/api/v1/otp/send/whatsapp');
    assert.deepEqual(JSON.parse(calls[1].body), { phone: '+93700123456', code: '123456' });
    assert.equal(calls[0].headers['X-API-Key'], 'test-key');
    global.fetch = async () => ({ ok: false, json: async () => ({ error: 'insufficient balance' }) });
    await assert.rejects(sendCode('+93700123456', '123456', 'sms'));
  } finally {
    global.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.GHONCHA_API_KEY; else process.env.GHONCHA_API_KEY = originalKey;
  }
});

// Exercise actual Express handlers with isolated storage and a fake provider.
test('signup and two-step recovery enforce purpose, expiry, attempt limits and one-use verification', async () => {
  const originalFetch = global.fetch;
  const originalKey = process.env.GHONCHA_API_KEY;
  process.env.GHONCHA_API_KEY = 'test-key';
  let deliveredCode;
  global.fetch = async (_url, options) => { const body = JSON.parse(options.body); deliveredCode = body.message || body.code; return { ok: true, json: async () => ({ status: 'pending' }) }; };
  let pending = null; let user = null;
  const db = {
    phoneOtpRate: { upsert: async () => ({ count: 1 }), deleteMany: async () => ({ count: 0 }) },
    user: {
      findFirst: async ({ where }) => user && where.OR?.some(condition => condition.customerPhone === user.customerPhone || condition.phone?.in?.includes(user.phone)) ? user : null,
      findUnique: async ({ where }) => user?.email === where.email ? user : null,
      updateMany: async ({ where, data }) => { if (!user || user.id !== where.id || user.customerPhone !== where.customerPhone || user.phoneVerified !== where.phoneVerified || user.isActive !== where.isActive) return { count: 0 }; Object.assign(user, data); return { count: 1 }; },
      create: async ({ data }) => { user = { id: 1, ...data }; return user; },
    },
    phoneRegistration: {
      findUnique: async ({ where }) => pending && (where.phone === pending.phone || where.id === pending.id) ? { ...pending } : null,
      create: async ({ data }) => { pending = { ...data }; return pending; },
      updateMany: async ({ where, data }) => {
        if (!pending || pending.id !== where.id) return { count: 0 };
        if (where.purpose && pending.purpose !== where.purpose) return { count: 0 };
        if (where.expiresAt && pending.expiresAt <= where.expiresAt.gt) return { count: 0 };
        if (where.attempts && pending.attempts >= where.attempts.lt) return { count: 0 };
        if (data.attempts?.increment) pending.attempts += data.attempts.increment;
        else Object.assign(pending, data);
        return { count: 1 };
      },
      delete: async () => { pending = null; },
    },
    $transaction: async fn => fn(db),
  };
  const prismaPath = require.resolve('../lib/prisma');
  const originalModule = require.cache[prismaPath];
  require.cache[prismaPath] = { id: prismaPath, filename: prismaPath, loaded: true, exports: db };
  const emailPath = require.resolve('../lib/email');
  const originalEmailModule = require.cache[emailPath];
  require.cache[emailPath] = { id: emailPath, filename: emailPath, loaded: true, exports: { ...require('../lib/email'), sendAdminNotification: async () => true } };
  const router = require('../routes/auth');
  const call = async (path, body) => {
    const handler = router.stack.find(layer => layer.route?.path === path).route.stack[0].handle;
    const res = { statusCode: 200, headers: {}, set(name, value) { this.headers[name] = value; return this; }, status(code) { this.statusCode = code; return this; }, json(data) { this.body = data; return this; } };
    await handler({ body, ip: '127.0.0.1' }, res);
    return res;
  };
  const body = { firstName: 'Test', lastName: 'Customer', phone: '0700123456', password: 'secret123', confirmPassword: 'secret123' };
  try {
    assert.equal((await call('/customer-otp', { ...body, phone: '+44700123456' })).statusCode, 400);
    assert.equal((await call('/customer-otp', { ...body, confirmPassword: 'wrong' })).statusCode, 400);
    assert.equal((await call('/register', { role: 'customer' })).statusCode, 400);
    const sent = await call('/customer-otp', body);
    assert.equal(sent.statusCode, 200);
    assert.equal(user, null);
    assert.equal(pending.password === body.password, false);
    assert.equal(pending.codeHash.includes(deliveredCode), false);
    const cooldown = await call('/customer-otp', body);
    assert.equal(cooldown.statusCode, 429);
    assert.ok(cooldown.body.retryAfter > 0 && cooldown.body.retryAfter <= 60);
    assert.equal(cooldown.headers['Retry-After'], String(cooldown.body.retryAfter));
    const challengeId = sent.body.challengeId;
    assert.equal((await call('/verify-phone-reset-otp', { challengeId, code: deliveredCode })).statusCode, 400);
    assert.equal((await call('/verify-customer-otp', { challengeId, code: '000000' })).statusCode, 400);
    pending.expiresAt = new Date(0);
    assert.equal((await call('/verify-customer-otp', { challengeId, code: deliveredCode })).statusCode, 400);
    pending.expiresAt = new Date(Date.now() + 300000);
    pending.attempts = 5;
    assert.equal((await call('/verify-customer-otp', { challengeId, code: deliveredCode })).statusCode, 400);
    pending.attempts = 1;
    assert.equal((await call('/verify-customer-otp', { challengeId, code: deliveredCode })).statusCode, 201);
    assert.equal(user.phoneVerified, true);
    assert.equal(user.customerPhone, '+93700123456');
    assert.equal(user.isActive, true);
    assert.equal(pending, null);
    assert.equal((await call('/verify-customer-otp', { challengeId, code: deliveredCode })).statusCode, 400);
    assert.equal((await call('/customer-otp', body)).statusCode, 409);
    const oldPasswordHash = user.password;
    const reset = await call('/customer-otp', { phone: body.phone, purpose: 'password-reset', channel: 'whatsapp' });
    assert.equal(reset.statusCode, 200);
    assert.equal(pending.purpose, 'password-reset');
    assert.equal((await call('/verify-customer-otp', { challengeId: reset.body.challengeId, code: deliveredCode })).statusCode, 400);
    assert.equal((await call('/reset-phone-password', { challengeId: reset.body.challengeId, code: '000000', password: 'changed123', confirmPassword: 'changed123' })).statusCode, 400);
    assert.equal(user.password, oldPasswordHash);
    assert.equal((await call('/reset-phone-password', { challengeId: reset.body.challengeId, code: deliveredCode, password: 'changed123', confirmPassword: 'changed123' })).statusCode, 200);
    assert.notEqual(user.password, oldPasswordHash);
    assert.equal(pending, null);
    assert.equal((await call('/reset-phone-password', { challengeId: reset.body.challengeId, code: deliveredCode, password: 'changed123', confirmPassword: 'changed123' })).statusCode, 400);
    // The new mobile flow verifies first, then submits only a short-lived proof.
    const recovery = await call('/customer-otp', { phone: body.phone, purpose: 'password-reset' });
    const recoveryId = recovery.body.challengeId;
    const resetCode = deliveredCode;
    const passwordBeforeVerification = user.password;
    assert.equal((await call('/verify-phone-reset-otp', { challengeId: recoveryId, code: '000000' })).statusCode, 400);
    assert.equal(pending.attempts, 1);
    assert.equal(user.password, passwordBeforeVerification);
    pending.expiresAt = new Date(0);
    assert.equal((await call('/verify-phone-reset-otp', { challengeId: recoveryId, code: resetCode })).statusCode, 400);
    pending.expiresAt = new Date(Date.now() + 300000);
    pending.attempts = 5;
    assert.equal((await call('/verify-phone-reset-otp', { challengeId: recoveryId, code: resetCode })).statusCode, 400);
    pending.attempts = 1;
    const proof = await call('/verify-phone-reset-otp', { challengeId: recoveryId, code: resetCode });
    assert.equal(proof.statusCode, 200);
    assert.equal(proof.body.expiresIn, 600);
    assert.match(proof.body.resetToken, /^[a-f0-9]{64}$/);
    assert.equal(pending.purpose, 'password-reset-verified');
    assert.notEqual(pending.codeHash, proof.body.resetToken);
    assert.equal(user.password, passwordBeforeVerification);
    assert.equal((await call('/verify-phone-reset-otp', { challengeId: recoveryId, code: resetCode })).statusCode, 400);
    assert.equal((await call('/reset-phone-password', { challengeId: recoveryId, code: resetCode, password: 'newsecret123', confirmPassword: 'newsecret123' })).statusCode, 400);
    const newPasswordBody = { challengeId: recoveryId, resetToken: proof.body.resetToken, password: 'newsecret123', confirmPassword: 'newsecret123' };
    assert.equal((await call('/reset-phone-password', { ...newPasswordBody, confirmPassword: 'mismatch' })).statusCode, 400);
    assert.equal(pending.attempts, 0);
    assert.equal((await call('/reset-phone-password', { ...newPasswordBody, resetToken: 'bad' })).body.code, 'RESET_PROOF_INVALID');
    assert.equal((await call('/reset-phone-password', { ...newPasswordBody, resetToken: '0'.repeat(64) })).body.code, 'RESET_PROOF_INVALID');
    assert.equal(user.password, passwordBeforeVerification);
    const verifiedExpiry = pending.expiresAt;
    pending.expiresAt = new Date(0);
    assert.equal((await call('/reset-phone-password', newPasswordBody)).body.code, 'RESET_PROOF_INVALID');
    pending.expiresAt = verifiedExpiry;
    pending.attempts = 5;
    assert.equal((await call('/reset-phone-password', newPasswordBody)).body.code, 'RESET_PROOF_INVALID');
    pending.attempts = 1;
    user.isActive = false;
    assert.equal((await call('/reset-phone-password', newPasswordBody)).body.code, 'RESET_PROOF_INVALID');
    assert.equal(user.password, passwordBeforeVerification);
    user.isActive = true;
    assert.equal((await call('/reset-phone-password', newPasswordBody)).statusCode, 200);
    assert.notEqual(user.password, passwordBeforeVerification);
    assert.equal(pending, null);
    assert.equal((await call('/reset-phone-password', newPasswordBody)).body.code, 'RESET_PROOF_INVALID');
    const supplierBody = { role: 'supplier', fullName: 'Test Supplier', companyName: 'Test Shop', province: 'Kabul', phone: '0700123457', password: 'secret123', confirmPassword: 'secret123' };
    assert.equal((await call('/customer-otp', { ...supplierBody, province: '' })).statusCode, 400);
    assert.equal((await call('/customer-otp', { ...supplierBody, email: 'invalid-email' })).statusCode, 400);
    const supplierSent = await call('/customer-otp', supplierBody);
    assert.equal(supplierSent.statusCode, 200);
    assert.equal(pending.registrationData.role, 'supplier');
    const supplierVerified = await call('/verify-customer-otp', { challengeId: supplierSent.body.challengeId, code: deliveredCode });
    assert.equal(supplierVerified.statusCode, 201);
    assert.equal(supplierVerified.body.pendingApproval, true);
    assert.equal(user.role, 'supplier');
    assert.equal(user.phoneVerified, true);
    assert.equal(user.emailVerified, false);
    assert.equal(user.isApproved, false);
    assert.equal(user.email, '93700123457@phone.sawdagar.local');
    assert.equal(user.companyName, 'Test Shop');
    // A failed supplier send cannot activate an account, and retry timers must
    // reflect both the minute cooldown and the full hourly send limit.
    user = null;
    global.fetch = async () => ({ ok: false, status: 502 });
    const failedSupplier = await call('/customer-otp', supplierBody);
    assert.equal(failedSupplier.statusCode, 503);
    assert.equal(failedSupplier.body.retryAfter, 60);
    assert.equal(failedSupplier.headers['Retry-After'], '60');
    assert.equal(user, null);
    assert.ok(pending.expiresAt <= new Date());
    assert.equal((await call('/verify-customer-otp', { challengeId: pending.id, code: '000000' })).statusCode, 400);
    pending.lastSentAt = new Date(Date.now() - 70000);
    pending.windowStart = new Date(Date.now() - 300000);
    pending.sendCount = 5;
    const hourlyLimit = await call('/customer-otp', supplierBody);
    assert.equal(hourlyLimit.statusCode, 429);
    assert.ok(hourlyLimit.body.retryAfter >= 3299 && hourlyLimit.body.retryAfter <= 3300);
    assert.equal(hourlyLimit.headers['Retry-After'], String(hourlyLimit.body.retryAfter));
    db.phoneOtpRate.upsert = async () => ({ count: 21 });
    const ipLimit = await call('/customer-otp', supplierBody);
    assert.equal(ipLimit.statusCode, 429);
    assert.ok(ipLimit.body.retryAfter > 0 && ipLimit.body.retryAfter <= 3600);
    assert.equal(ipLimit.headers['Retry-After'], String(ipLimit.body.retryAfter));
    // Two first requests can race on the unique phone constraint.
    db.phoneOtpRate.upsert = async () => ({ count: 1 });
    pending = null;
    db.phoneRegistration.create = async () => { throw Object.assign(new Error('Duplicate phone'), { code: 'P2002' }); };
    const concurrentSend = await call('/customer-otp', supplierBody);
    assert.equal(concurrentSend.statusCode, 429);
    assert.equal(concurrentSend.body.retryAfter, 60);
    assert.equal(concurrentSend.headers['Retry-After'], '60');
  } finally {
    global.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.GHONCHA_API_KEY; else process.env.GHONCHA_API_KEY = originalKey;
    if (originalModule) require.cache[prismaPath] = originalModule; else delete require.cache[prismaPath];
    if (originalEmailModule) require.cache[emailPath] = originalEmailModule; else delete require.cache[emailPath];
  }
});

test('missing configuration and malformed provider replies have safe diagnostic codes', async () => {
  const originalFetch = global.fetch;
  const originalKey = process.env.GHONCHA_API_KEY;
  try {
    delete process.env.GHONCHA_API_KEY;
    global.fetch = async () => { throw new Error('Must not contact provider without a key'); };
    await assert.rejects(sendCode('+93700123456', '123456', 'sms'), { code: 'OTP_NOT_CONFIGURED' });
    process.env.GHONCHA_API_KEY = 'test-key';
    global.fetch = async () => ({ ok: false, status: 401 });
    await assert.rejects(sendCode('+93700123456', '123456', 'sms'), { code: 'OTP_PROVIDER_HTTP_401' });
    global.fetch = async () => ({ ok: true, json: async () => { throw new Error('non-JSON response'); } });
    await assert.rejects(sendCode('+93700123456', '123456', 'sms'), { code: 'OTP_PROVIDER_INVALID_RESPONSE' });
    global.fetch = async () => ({ ok: true, json: async () => ({ status: 'failed' }) });
    await assert.rejects(sendCode('+93700123456', '123456', 'sms'), { code: 'OTP_PROVIDER_REJECTED' });
  } finally {
    global.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.GHONCHA_API_KEY; else process.env.GHONCHA_API_KEY = originalKey;
  }
});
