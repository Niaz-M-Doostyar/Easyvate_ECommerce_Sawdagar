const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { authenticate, requireRole } = require('../middleware/auth');

// GET /api/categories — public
router.get('/', async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: { select: { products: { where: { status: 'approved', isDeleted: false } } } },
        children: {
          include: { _count: { select: { products: { where: { status: 'approved', isDeleted: false } } } } },
          orderBy: { nameEn: 'asc' },
        },
      },
      where: { parentId: null },
      orderBy: { nameEn: 'asc' },
    });
    // Also return flat list for backwards compat
    const allCategories = await prisma.category.findMany({
      include: { _count: { select: { products: { where: { status: 'approved', isDeleted: false } } } } },
      orderBy: { nameEn: 'asc' },
    });
    res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=120');
    res.json({ categories: allCategories, tree: categories });
  } catch (err) {
    console.error('Categories error:', err);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// POST /api/categories — admin only
router.post('/', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { slug, nameEn, namePs, nameDr, parentId } = req.body;
    if (!slug || !nameEn) return res.status(400).json({ error: 'slug and nameEn are required' });
    const existing = await prisma.category.findUnique({ where: { slug } });
    if (existing) return res.status(400).json({ error: 'Category slug already exists' });
    const category = await prisma.category.create({
      data: { slug, nameEn, namePs: namePs || nameEn, nameDr: nameDr || nameEn, parentId: parentId ? parseInt(parentId) : null },
    });
    res.status(201).json({ category });
  } catch (err) {
    console.error('Create category error:', err);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// PUT /api/categories/:id — admin only
router.put('/:id', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { slug, nameEn, namePs, nameDr, parentId } = req.body;
    const id = parseInt(req.params.id);
    const data = {};
    if (slug) data.slug = slug;
    if (nameEn) data.nameEn = nameEn;
    if (namePs) data.namePs = namePs;
    if (nameDr) data.nameDr = nameDr;
    if (parentId !== undefined) data.parentId = parentId ? parseInt(parentId) : null;
    const category = await prisma.category.update({ where: { id }, data });
    res.json({ category });
  } catch (err) {
    console.error('Update category error:', err);
    res.status(500).json({ error: 'Failed to update category' });
  }
});

// DELETE /api/categories/:id — admin only
router.delete('/:id', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    // Move products to uncategorized
    await prisma.product.updateMany({ where: { categoryId: id }, data: { categoryId: null } });
    // Move children to root
    await prisma.category.updateMany({ where: { parentId: id }, data: { parentId: null } });
    await prisma.category.delete({ where: { id } });
    res.json({ success: true });
  } catch (err) {
    console.error('Delete category error:', err);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

module.exports = router;
