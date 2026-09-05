const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { authenticate, requireRole } = require('../middleware/auth');
const { normalizeIconKey, normalizeImage } = require('../lib/categoryVisuals');

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
    res.json({ categories: allCategories, tree: categories });
  } catch (err) {
    console.error('Categories error:', err);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// POST /api/categories — admin only
router.post('/', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { slug, nameEn, namePs, nameDr, parentId, image, iconKey } = req.body;
    if (!slug || !nameEn) return res.status(400).json({ error: 'slug and nameEn are required' });
    const cleanImage = normalizeImage(image);
    const cleanIconKey = normalizeIconKey(iconKey);
    if (!cleanImage && !cleanIconKey) {
      return res.status(400).json({ error: 'Choose a category icon or upload a category image' });
    }
    if (iconKey && !cleanIconKey) return res.status(400).json({ error: 'Invalid category icon' });
    if (image && !cleanImage) return res.status(400).json({ error: 'Invalid category image URL' });
    const existing = await prisma.category.findUnique({ where: { slug } });
    if (existing) return res.status(400).json({ error: 'Category slug already exists' });
    const category = await prisma.category.create({
      data: {
        slug,
        nameEn,
        namePs: namePs || nameEn,
        nameDr: nameDr || nameEn,
        parentId: parentId ? parseInt(parentId) : null,
        image: cleanImage,
        iconKey: cleanIconKey,
      },
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
    const { slug, nameEn, namePs, nameDr, parentId, image, iconKey } = req.body;
    const id = parseInt(req.params.id);
    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Category not found' });

    const nextImage = image !== undefined ? normalizeImage(image) : existing.image;
    const nextIconKey = iconKey !== undefined ? normalizeIconKey(iconKey) : existing.iconKey;
    if (image && !nextImage) return res.status(400).json({ error: 'Invalid category image URL' });
    if (iconKey && !nextIconKey) return res.status(400).json({ error: 'Invalid category icon' });
    if (!nextImage && !nextIconKey) {
      return res.status(400).json({ error: 'Choose a category icon or upload a category image' });
    }

    const data = {};
    if (slug) data.slug = slug;
    if (nameEn) data.nameEn = nameEn;
    if (namePs) data.namePs = namePs;
    if (nameDr) data.nameDr = nameDr;
    if (parentId !== undefined) data.parentId = parentId ? parseInt(parentId) : null;
    if (image !== undefined) data.image = nextImage;
    if (iconKey !== undefined) data.iconKey = nextIconKey;
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
