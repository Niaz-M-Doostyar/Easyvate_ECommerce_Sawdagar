const prisma = require('../lib/prisma');
const { verifyToken } = require('../lib/auth');

const authenticate = async (req, res, next) => {
  try {
    let token = null;
    
    // Check cookie first
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }
    
    // Then check Authorization header
    const authHeader = req.headers.authorization;
    if (!token && authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7);
    }

    if (!token) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true, email: true, fullName: true, phone: true, role: true,
        province: true, district: true, village: true, landmark: true,
        isActive: true, isApproved: true, emailVerified: true,
        companyName: true, contactPerson: true, taxId: true,
      },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'User not found or inactive' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Authentication failed' });
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    let token = null;
    if (req.cookies && req.cookies.token) token = req.cookies.token;
    const authHeader = req.headers.authorization;
    if (!token && authHeader && authHeader.startsWith('Bearer ')) token = authHeader.slice(7);
    
    if (token) {
      const payload = verifyToken(token);
      if (payload) {
        const user = await prisma.user.findUnique({ where: { id: payload.userId } });
        if (user && user.isActive) req.user = user;
      }
    }
  } catch {}
  next();
};

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });
    next();
  };
};

module.exports = { authenticate, optionalAuth, requireRole };
