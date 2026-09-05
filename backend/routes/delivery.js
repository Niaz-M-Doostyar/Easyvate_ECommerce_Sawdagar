const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { authenticate, requireRole } = require('../middleware/auth');
const { paginate } = require('../lib/utils');
const { sendOrderStatusUpdate, sendOrderStatusRecord, getLastEmailError } = require('../lib/email');

function logOrderEmailFailure(label, order, to) {
  const err = typeof getLastEmailError === 'function' ? getLastEmailError() : null;
  console.error(`${label} failed:`, {
    orderNumber: order.orderNumber,
    to,
    error: err ? err.message : 'Unknown email error',
  });
}

// GET /api/delivery/orders
router.get('/orders', authenticate, requireRole('delivery'), async (req, res) => {
  try {
    const pagination = paginate(req.query.page, req.query.limit);
    const showAll = req.query.all === 'true' || req.query.all === '1';
    const { page, limit } = pagination;
    const skip = showAll ? undefined : pagination.skip;
    const take = showAll ? undefined : pagination.take;
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

    const totalPages = showAll ? 1 : Math.max(1, Math.ceil(total / limit));
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
      include: { user: true },
    });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const { status } = req.body;
    if (!['confirmed', 'shipped', 'delivered'].includes(status)) {
      return res.status(400).json({ error: 'Invalid delivery status' });
    }

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: { status, paymentStatus: status === 'delivered' ? 'paid' : order.paymentStatus },
      include: { user: true, items: true },
    });

    const customerEmailSent = await sendOrderStatusUpdate(updated.user.email, updated);
    if (!customerEmailSent) logOrderEmailFailure('Delivery status customer email', updated, updated.user.email);

    const salesEmailSent = await sendOrderStatusRecord(updated, updated.user, order.status);
    if (!salesEmailSent) logOrderEmailFailure('Delivery status sales record email', updated, 'sales');

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
