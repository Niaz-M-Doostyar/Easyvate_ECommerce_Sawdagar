const prisma = require('./prisma');

async function logTransaction(req, action, entity, entityId, details) {
  try {
    await prisma.transactionLog.create({
      data: {
        action,
        entity,
        entityId: entityId ? Number(entityId) : null,
        userId: req.user?.id || null,
        userName: req.user?.fullName || req.user?.email || null,
        details: typeof details === 'string' ? details : JSON.stringify(details),
        ipAddress: req.ip || req.connection?.remoteAddress || null,
        userAgent: req.headers?.['user-agent']?.substring(0, 500) || null,
      },
    });
  } catch (err) {
    console.error('Transaction log error:', err.message);
  }
}

module.exports = { logTransaction };
