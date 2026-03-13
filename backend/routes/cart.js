const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { authenticate } = require('../middleware/auth');

// GET /api/cart
router.get('/', authenticate, async (req, res) => {
  try {
    const items = await prisma.cartItem.findMany({
      where: { userId: req.user.id },
      include: { product: { include: { images: { take: 1 } } } },
    });
    res.json({ items });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch cart' });
  }
});

// POST /api/cart
router.post('/', authenticate, async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    if (!productId) return res.status(400).json({ error: 'Product ID is required' });

    const product = await prisma.product.findUnique({ where: { id: parseInt(productId) } });
    if (!product || product.status !== 'approved') return res.status(404).json({ error: 'Product not found' });
    if (product.stock < quantity) return res.status(400).json({ error: 'Not enough stock' });

    const existing = await prisma.cartItem.findUnique({
      where: { userId_productId: { userId: req.user.id, productId: parseInt(productId) } },
    });

    let item;
    if (existing) {
      const newQty = existing.quantity + quantity;
      if (product.stock < newQty) return res.status(400).json({ error: 'Not enough stock' });
      item = await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: newQty },
        include: { product: { include: { images: { take: 1 } } } },
      });
    } else {
      item = await prisma.cartItem.create({
        data: { userId: req.user.id, productId: parseInt(productId), quantity },
        include: { product: { include: { images: { take: 1 } } } },
      });
    }

    res.json({ item });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add to cart' });
  }
});

// DELETE /api/cart (clear all)
router.delete('/', authenticate, async (req, res) => {
  try {
    await prisma.cartItem.deleteMany({ where: { userId: req.user.id } });
    res.json({ message: 'Cart cleared' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to clear cart' });
  }
});

// PUT /api/cart/:id
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { quantity } = req.body;
    const item = await prisma.cartItem.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!item || item.userId !== req.user.id) return res.status(404).json({ error: 'Cart item not found' });

    if (quantity <= 0) {
      await prisma.cartItem.delete({ where: { id: item.id } });
      return res.json({ message: 'Item removed' });
    }

    const updated = await prisma.cartItem.update({
      where: { id: item.id },
      data: { quantity },
      include: { product: { include: { images: { take: 1 } } } },
    });

    res.json({ item: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update cart item' });
  }
});

// DELETE /api/cart/:id
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const item = await prisma.cartItem.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!item || item.userId !== req.user.id) return res.status(404).json({ error: 'Cart item not found' });

    await prisma.cartItem.delete({ where: { id: item.id } });
    res.json({ message: 'Item removed' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove cart item' });
  }
});

module.exports = router;
