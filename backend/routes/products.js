const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { paginate } = require('../lib/utils');
const { optionalAuth } = require('../middleware/auth');

const resolveCategoryFilter = async (category) => {
  if (!category) return undefined;
  const numericId = parseInt(category, 10);
  if (!Number.isNaN(numericId)) return numericId;
  const found = await prisma.category.findUnique({ where: { slug: category }, select: { id: true } });
  return found?.id;
};

const buildOrderBy = (sort) => {
  if (sort === 'price_low' || sort === 'price_asc') return { retailPrice: 'asc' };
  if (sort === 'price_high' || sort === 'price_desc') return { retailPrice: 'desc' };
  if (sort === 'name' || sort === 'name_asc') return { nameEn: 'asc' };
  return { createdAt: 'desc' };
};

// GET /api/products
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { skip, take, page, limit } = paginate(req.query.page, req.query.limit);
    const { category, sort, minPrice, maxPrice, search, q, sponsoredOnly, inStock } = req.query;

    const where = { status: 'approved', isDeleted: false };
    const categoryId = await resolveCategoryFilter(category);
    if (category && !categoryId) {
      return res.json({ products: [], total: 0, totalPages: 1, pagination: { page, limit, total: 0, totalPages: 1 } });
    }
    if (categoryId) where.categoryId = categoryId;
    if (minPrice || maxPrice) {
      where.retailPrice = {};
      if (minPrice) where.retailPrice.gte = parseFloat(minPrice);
      if (maxPrice) where.retailPrice.lte = parseFloat(maxPrice);
    }
    if (sponsoredOnly === 'true' || sponsoredOnly === '1') {
      where.isSponsored = true;
    }
    if (inStock === 'true' || inStock === '1') {
      where.stock = { gt: 0 };
    }
    const term = (search || q || '').trim();
    if (term) {
      where.OR = [
        { nameEn: { contains: term } },
        { namePs: { contains: term } },
        { nameDr: { contains: term } },
        { descEn: { contains: term } },
        { descPs: { contains: term } },
        { descDr: { contains: term } },
      ];
    }

    const orderBy = buildOrderBy(sort);

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          images: { orderBy: { sortOrder: 'asc' }, take: 5 },
          category: true,
          supplier: { select: { id: true, companyName: true, fullName: true } },
        },
        orderBy,
        skip,
        take,
      }),
      prisma.product.count({ where }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));
    res.set('Cache-Control', 'public, max-age=30, stale-while-revalidate=60');
    res.json({
      products,
      total,
      totalPages,
      pagination: { page, limit, total, totalPages },
    });
  } catch (err) {
    console.error('Products error:', err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// GET /api/products/search
router.get('/search', async (req, res) => {
  try {
    const { skip, take, page, limit } = paginate(req.query.page, req.query.limit);
    const { q, category, sort, minPrice, maxPrice, sponsoredOnly } = req.query;

    const where = { status: 'approved', isDeleted: false };
    if (q) {
      where.OR = [
        { nameEn: { contains: q } },
        { namePs: { contains: q } },
        { nameDr: { contains: q } },
        { descEn: { contains: q } },
        { descPs: { contains: q } },
        { descDr: { contains: q } },
      ];
    }
    const categoryId = await resolveCategoryFilter(category);
    if (category && !categoryId) {
      return res.json({ products: [], total: 0, totalPages: 1, pagination: { page, limit, total: 0, totalPages: 1 } });
    }
    if (categoryId) where.categoryId = categoryId;
    if (minPrice || maxPrice) {
      where.retailPrice = {};
      if (minPrice) where.retailPrice.gte = parseFloat(minPrice);
      if (maxPrice) where.retailPrice.lte = parseFloat(maxPrice);
    }
    if (sponsoredOnly === 'true' || sponsoredOnly === '1') where.isSponsored = true;

    const orderBy = buildOrderBy(sort);

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { images: { orderBy: { sortOrder: 'asc' }, take: 5 }, category: true },
        orderBy,
        skip,
        take,
      }),
      prisma.product.count({ where }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));
    res.json({
      products,
      total,
      totalPages,
      pagination: { page, limit, total, totalPages },
    });
  } catch (err) {
    res.status(500).json({ error: 'Search failed' });
  }
});

// GET /api/products/sponsored
router.get('/sponsored', async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: { isSponsored: true, status: 'approved', isDeleted: false },
      include: { images: { orderBy: { sortOrder: 'asc' }, take: 5 }, category: true },
      take: 8,
    });
    res.json({ products });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch sponsored products' });
  }
});

// GET /api/products/:id
router.get('/:id', async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        category: true,
        supplier: { select: { id: true, companyName: true, fullName: true } },
      },
    });

    if (!product || product.isDeleted) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const relatedProducts = await prisma.product.findMany({
      where: {
        categoryId: product.categoryId,
        id: { not: product.id },
        status: 'approved',
        isDeleted: false,
      },
      include: { images: { take: 1 } },
      take: 4,
    });

    res.json({ product, relatedProducts });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

module.exports = router;
