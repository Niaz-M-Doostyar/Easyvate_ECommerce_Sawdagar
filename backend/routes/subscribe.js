const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const crypto = require('crypto');

// POST /api/subscribe - Subscribe to newsletter and get coupon
router.post('/', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Valid email is required' });
    }

    const existing = await prisma.subscriber.findUnique({ where: { email } });
    if (existing) {
      if (existing.couponCode && !existing.couponUsed) {
        return res.json({ message: 'You are already subscribed!', couponCode: existing.couponCode });
      }
      return res.json({ message: 'You are already subscribed!' });
    }

    // Generate a unique coupon code for the subscriber
    const couponCode = 'WELCOME' + crypto.randomBytes(3).toString('hex').toUpperCase();

    const subscriber = await prisma.subscriber.create({
      data: { email, couponCode },
    });

    // Also create a Coupon record so it can be validated at checkout
    await prisma.coupon.create({
      data: {
        code: couponCode,
        discount: 10,
        isPercent: true,
        maxUses: 1,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });

    res.json({
      message: 'Subscribed successfully! Here is your discount coupon.',
      couponCode,
    });
  } catch (err) {
    if (err.code === 'P2002') {
      return res.json({ message: 'You are already subscribed!' });
    }
    res.status(500).json({ error: 'Subscription failed' });
  }
});

// POST /api/subscribe/validate-coupon - Validate a coupon code
router.post('/validate-coupon', async (req, res) => {
  try {
    const { code, orderTotal } = req.body;
    if (!code) return res.status(400).json({ error: 'Coupon code is required' });

    const coupon = await prisma.coupon.findUnique({ where: { code } });
    if (!coupon || !coupon.isActive) return res.status(404).json({ error: 'Invalid coupon code' });
    if (coupon.expiresAt && coupon.expiresAt < new Date()) return res.status(400).json({ error: 'Coupon has expired' });
    if (coupon.usedCount >= coupon.maxUses) return res.status(400).json({ error: 'Coupon usage limit reached' });
    if (orderTotal && coupon.minOrder > 0 && orderTotal < coupon.minOrder) {
      return res.status(400).json({ error: `Minimum order amount is ${coupon.minOrder}` });
    }

    const discountAmount = coupon.isPercent
      ? (orderTotal || 0) * (coupon.discount / 100)
      : coupon.discount;

    res.json({
      valid: true,
      discount: coupon.discount,
      isPercent: coupon.isPercent,
      discountAmount: Math.round(discountAmount),
    });
  } catch (err) {
    res.status(500).json({ error: 'Validation failed' });
  }
});

module.exports = router;
