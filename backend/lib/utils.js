const { v4: uuidv4 } = require('uuid');

const generateOrderNumber = () => {
  const now = new Date();
  const y = String(now.getFullYear()).slice(-2);
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const rand = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `SW-${y}${m}${d}-${rand}`;
};

const generateToken = () => uuidv4();

const paginate = (page, limit) => {
  const p = Math.max(1, parseInt(page) || 1);
  const l = Math.min(100, Math.max(1, parseInt(limit) || 10));
  return { skip: (p - 1) * l, take: l, page: p, limit: l };
};

const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const validatePhone = (phone) => /^(07|\+937)\d{8}$/.test(phone);

const sanitize = (str) => {
  if (!str) return '';
  return str.replace(/<[^>]*>/g, '').trim();
};

const getProductName = (product, lang) => {
  if (lang === 'ps') return product.namePs || product.nameEn;
  if (lang === 'dr') return product.nameDr || product.nameEn;
  return product.nameEn;
};

const getProductDesc = (product, lang) => {
  if (lang === 'ps') return product.descPs || product.descEn;
  if (lang === 'dr') return product.descDr || product.descEn;
  return product.descEn;
};

const getCategoryName = (category, lang) => {
  if (!category) return '';
  if (lang === 'ps') return category.namePs || category.nameEn;
  if (lang === 'dr') return category.nameDr || category.nameEn;
  return category.nameEn;
};

module.exports = {
  generateOrderNumber, generateToken, paginate,
  validateEmail, validatePhone, sanitize,
  getProductName, getProductDesc, getCategoryName,
};
