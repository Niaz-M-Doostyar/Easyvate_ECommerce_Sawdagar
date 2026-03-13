const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { authenticate } = require('../middleware/auth');
const { generateOrderNumber, paginate } = require('../lib/utils');
const { sendOrderConfirmation } = require('../lib/email');
const { logTransaction } = require('../lib/transactionLog');

// GET /api/orders
router.get('/', authenticate, async (req, res) => {
  try {
    const { skip, take, page, limit } = paginate(req.query.page, req.query.limit);

    const where = { userId: req.user.id };

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: { items: { include: { product: { include: { images: { take: 1 } } } } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.order.count({ where }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));
    res.json({ orders, total, totalPages, pagination: { page, limit, total, totalPages } });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// POST /api/orders
router.post('/', authenticate, async (req, res) => {
  try {
    const {
      shippingProvince,
      shippingDistrict,
      shippingVillage,
      shippingLandmark,
      shippingPhone,
      province,
      district,
      village,
      landmark,
      phone,
      notes,
      items,
    } = req.body;

    const orderProvince = shippingProvince || province;
    const orderDistrict = shippingDistrict || district;
    const orderVillage = shippingVillage || village;
    const orderLandmark = shippingLandmark || landmark;
    const orderPhone = shippingPhone || phone;

    if (!orderProvince || !orderDistrict || !orderPhone) {
      return res.status(400).json({ error: 'Province, district, and phone are required' });
    }

    let sourceItems = [];

    if (Array.isArray(items) && items.length > 0) {
      const productIds = items.map((item) => parseInt(item.productId, 10)).filter(Boolean);
      const products = await prisma.product.findMany({
        where: { id: { in: productIds }, status: 'approved', isDeleted: false },
      });

      sourceItems = items.map((item) => {
        const product = products.find((entry) => entry.id === parseInt(item.productId, 10));
        return product ? { productId: product.id, quantity: parseInt(item.quantity, 10) || 1, product } : null;
      }).filter(Boolean);
    } else {
      const cartItems = await prisma.cartItem.findMany({
        where: { userId: req.user.id },
        include: { product: true },
      });
      sourceItems = cartItems.map((item) => ({ productId: item.productId, quantity: item.quantity, product: item.product }));
    }

    if (sourceItems.length === 0) return res.status(400).json({ error: 'Cart is empty' });

    for (const item of sourceItems) {
      if (item.product.stock < item.quantity) {
        return res.status(400).json({ error: `Not enough stock for ${item.product.nameEn}` });
      }
    }

    const totalAmount = sourceItems.reduce((sum, item) => {
      return sum + (item.product.retailPrice || item.product.suggestedPrice) * item.quantity;
    }, 0);

    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          userId: req.user.id,
          totalAmount,
          province: orderProvince,
          district: orderDistrict,
          village: orderVillage || null,
          landmark: orderLandmark || null,
          phone: orderPhone,
          notes: notes || null,
          items: {
            create: sourceItems.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              retailPrice: item.product.retailPrice || item.product.suggestedPrice,
              wholesaleCost: item.product.wholesaleCost,
            })),
          },
        },
        include: { items: { include: { product: true } } },
      });

      for (const item of sourceItems) {
        const updated = await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
        if (updated.stock < 0) throw new Error(`Not enough stock for ${item.product.nameEn}`);
      }

      await tx.cartItem.deleteMany({ where: { userId: req.user.id } });
      return created;
    });

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    await sendOrderConfirmation(user.email, order);

    await logTransaction(req, 'CREATE', 'Order', order.id, { orderNumber: order.orderNumber, totalAmount: order.totalAmount, itemCount: order.items.length });

    res.status(201).json({ order });
  } catch (err) {
    console.error('Create order error:', err);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// GET /api/orders/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        items: { include: { product: { include: { images: { take: 1 } } } } },
        user: { select: { fullName: true, email: true, phone: true } },
      },
    });

    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    res.json({ order });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// GET /api/orders/:id/tracking
router.get('/:id/tracking', authenticate, async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        deliveryPerson: { select: { id: true, fullName: true, phone: true } },
      },
    });

    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.userId !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'delivery') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const latestLocation = order.deliveryPersonId
      ? await prisma.deliveryLocation.findFirst({
          where: { userId: order.deliveryPersonId },
          orderBy: { createdAt: 'desc' },
        })
      : null;

    res.json({
      tracking: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: order.paymentStatus,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        deliveryPerson: order.deliveryPerson,
        location: latestLocation,
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch tracking' });
  }
});

module.exports = router;
