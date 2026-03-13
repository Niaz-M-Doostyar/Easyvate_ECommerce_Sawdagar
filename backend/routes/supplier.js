const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { authenticate, requireRole } = require('../middleware/auth');
const { paginate, getProductName } = require('../lib/utils');

// GET /api/supplier/products
router.get('/products', authenticate, requireRole('supplier'), async (req, res) => {
  try {
    const { skip, take, page, limit } = paginate(req.query.page, req.query.limit);

    const where = { supplierId: req.user.id, isDeleted: false };
    const status = req.query.status;
    if (status && status !== 'all') where.status = status;

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          images: { orderBy: { sortOrder: 'asc' }, take: 1 },
          category: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.product.count({ where }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));
    res.json({ products, total, totalPages, pagination: { page, limit, total, totalPages } });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

router.get('/products/:id', authenticate, requireRole('supplier'), async (req, res) => {
  try {
    const product = await prisma.product.findFirst({
      where: { id: parseInt(req.params.id, 10), supplierId: req.user.id, isDeleted: false },
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        category: true,
      },
    });

    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json({ product });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// POST /api/supplier/products
router.post('/products', authenticate, requireRole('supplier'), async (req, res) => {
  try {
    const {
      nameEn, namePs, nameDr, descEn, descPs, descDr,
      wholesaleCost, suggestedPrice, categoryId, stock, images, attributes,
    } = req.body;

    if (!nameEn || !wholesaleCost || !categoryId) {
      return res.status(400).json({ error: 'Name (EN), wholesale cost, and category are required' });
    }

    const product = await prisma.product.create({
      data: {
        nameEn, namePs: namePs || null, nameDr: nameDr || null,
        descEn: descEn || null, descPs: descPs || null, descDr: descDr || null,
        wholesaleCost: parseFloat(wholesaleCost),
        suggestedPrice: suggestedPrice ? parseFloat(suggestedPrice) : null,
        stock: parseInt(stock) || 0,
        categoryId: parseInt(categoryId),
        supplierId: req.user.id,
        status: 'pending',
        attributes: attributes || null,
        images: images && images.length > 0 ? {
          create: images.map((url, idx) => ({ url, sortOrder: idx })),
        } : undefined,
      },
      include: { images: true, category: true },
    });

    res.status(201).json({ product });
  } catch (err) {
    console.error('Create product error:', err);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// PUT /api/supplier/products/:id
router.put('/products/:id', authenticate, requireRole('supplier'), async (req, res) => {
  try {
    const product = await prisma.product.findFirst({
      where: { id: parseInt(req.params.id), supplierId: req.user.id, isDeleted: false },
    });
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const {
      nameEn, namePs, nameDr, descEn, descPs, descDr,
      wholesaleCost, suggestedPrice, categoryId, stock, images, attributes,
    } = req.body;

    const updateData = {};
    if (nameEn !== undefined) updateData.nameEn = nameEn;
    if (namePs !== undefined) updateData.namePs = namePs;
    if (nameDr !== undefined) updateData.nameDr = nameDr;
    if (descEn !== undefined) updateData.descEn = descEn;
    if (descPs !== undefined) updateData.descPs = descPs;
    if (descDr !== undefined) updateData.descDr = descDr;
    if (wholesaleCost !== undefined) updateData.wholesaleCost = parseFloat(wholesaleCost);
    if (suggestedPrice !== undefined) updateData.suggestedPrice = suggestedPrice === null || suggestedPrice === '' ? null : parseFloat(suggestedPrice);
    if (categoryId !== undefined) updateData.categoryId = categoryId ? parseInt(categoryId, 10) : null;
    if (stock !== undefined) updateData.stock = parseInt(stock);
    if (attributes !== undefined) updateData.attributes = attributes || null;

    if (product.status === 'rejected' || product.status === 'approved') {
      updateData.status = 'pending';
      updateData.retailPrice = null;
    }

    const updated = await prisma.product.update({
      where: { id: product.id },
      data: updateData,
    });

    // Update images if provided
    if (images && Array.isArray(images)) {
      await prisma.productImage.deleteMany({ where: { productId: product.id } });
      if (images.length > 0) {
        await prisma.productImage.createMany({
          data: images.map((url, idx) => ({ productId: product.id, url, sortOrder: idx })),
        });
      }
    }

    const result = await prisma.product.findUnique({
      where: { id: product.id },
      include: { images: true, category: true },
    });

    res.json({ product: result });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// DELETE /api/supplier/products/:id
router.delete('/products/:id', authenticate, requireRole('supplier'), async (req, res) => {
  try {
    const product = await prisma.product.findFirst({
      where: { id: parseInt(req.params.id), supplierId: req.user.id, isDeleted: false },
    });
    if (!product) return res.status(404).json({ error: 'Product not found' });

    await prisma.product.update({
      where: { id: product.id },
      data: { isDeleted: true },
    });

    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// GET /api/supplier/orders
router.get('/orders', authenticate, requireRole('supplier'), async (req, res) => {
  try {
    const { skip, take, page, limit } = paginate(req.query.page, req.query.limit);

    const orders = await prisma.order.findMany({
      where: {
        items: { some: { product: { supplierId: req.user.id } } },
      },
      include: {
        items: {
          where: { product: { supplierId: req.user.id } },
          include: { product: { select: { nameEn: true } } },
        },
        user: { select: { fullName: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });

    const total = await prisma.order.count({
      where: { items: { some: { product: { supplierId: req.user.id } } } },
    });

    const totalPages = Math.max(1, Math.ceil(total / limit));
    res.json({ orders, total, totalPages, pagination: { page, limit, total, totalPages } });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// GET /api/supplier/sponsorships
router.get('/sponsorships', authenticate, requireRole('supplier'), async (req, res) => {
  try {
    const [requests, packages] = await Promise.all([
      prisma.sponsorshipRequest.findMany({
        where: { supplierId: req.user.id },
        include: { package: true, product: { select: { id: true, nameEn: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.sponsorshipPackage.findMany({
        where: { isActive: true },
        orderBy: { price: 'asc' },
      }),
    ]);

    res.json({ requests, packages });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch sponsorships' });
  }
});

// POST /api/supplier/sponsorships
router.post('/sponsorships', authenticate, requireRole('supplier'), async (req, res) => {
  try {
    const { productId, packageId } = req.body;
    if (!productId || !packageId) {
      return res.status(400).json({ error: 'Product ID and package ID are required' });
    }

    // Verify product belongs to supplier
    const product = await prisma.product.findFirst({
      where: { id: parseInt(productId), supplierId: req.user.id, isDeleted: false },
    });
    if (!product) return res.status(404).json({ error: 'Product not found' });

    // Check if there's already an active/pending request
    const existing = await prisma.sponsorshipRequest.findFirst({
      where: {
        productId: parseInt(productId),
        supplierId: req.user.id,
        status: { in: ['pending', 'approved'] },
      },
    });
    if (existing) return res.status(400).json({ error: 'Active sponsorship request already exists for this product' });

    const request = await prisma.sponsorshipRequest.create({
      data: {
        productId: parseInt(productId),
        supplierId: req.user.id,
        packageId: parseInt(packageId),
        status: 'pending',
      },
      include: { package: true, product: { select: { nameEn: true } } },
    });

    res.status(201).json({ request });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create sponsorship request' });
  }
});

module.exports = router;
