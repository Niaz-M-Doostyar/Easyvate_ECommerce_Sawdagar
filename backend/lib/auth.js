const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

if (!process.env.JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET is required when NODE_ENV=production.');
  }
  console.warn('WARNING: JWT_SECRET is not set. Using a development-only fallback secret.');
  process.env.JWT_SECRET = 'sawdagar-dev-fallback-secret';
}

const hashPassword = async (password) => {
  return bcrypt.hash(password, 10);
};

const comparePassword = async (password, hash) => {
  return bcrypt.compare(password, hash);
};

const generateToken = (payload, options = {}) => {
  const expiresIn = options.persistent
    ? (process.env.JWT_PERSISTENT_EXPIRES_IN || '10y')
    : (process.env.JWT_EXPIRES_IN || '7d');
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn,
  });
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }
};

module.exports = { hashPassword, comparePassword, generateToken, verifyToken };
