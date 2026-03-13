const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { authenticate, requireRole } = require('../middleware/auth');
const { paginate } = require('../lib/utils');

// GET /api/delivery/orders
router.get('/orders', authenticate, requireRole('delivery'), async (req, res) => {
  try {
    const { skip, take, page, limit } = paginate(req.query.page, req.query.limit);
    const status = req.query.status;

    const where = { deliveryPersonId: req.user.id };
    if (status) where.status = status;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          items: { include: { product: { select: { nameEn: true } } } },
          user: { select: { fullName: true, phone: true, province: true, district: true, village: true, landmark: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.order.count({ where }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));
    res.json({ orders, total, totalPages, pagination: { page, limit, total, totalPages } });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch delivery orders' });
  }
});

// PUT /api/delivery/orders/:id
router.put('/orders/:id', authenticate, requireRole('delivery'), async (req, res) => {
  try {
    const order = await prisma.order.findFirst({
      where: { id: parseInt(req.params.id), deliveryPersonId: req.user.id },
    });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const { status } = req.body;
    if (!['confirmed', 'shipped', 'delivered'].includes(status)) {
      return res.status(400).json({ error: 'Invalid delivery status' });
    }

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: { status, paymentStatus: status === 'delivered' ? 'paid' : order.paymentStatus },
    });

    res.json({ order: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update delivery order' });
  }
});

// POST /api/delivery/location
router.post('/location', authenticate, requireRole('delivery'), async (req, res) => {
  try {
    const { latitude, longitude, orderId } = req.body;
    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const location = await prisma.deliveryLocation.create({
      data: {
        userId: req.user.id,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
      },
    });

    res.status(201).json({ location });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save location' });
  }
});

module.exports = router;
