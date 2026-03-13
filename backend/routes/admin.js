const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { authenticate, requireRole } = require('../middleware/auth');
const { paginate } = require('../lib/utils');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

// Multer config for backup file uploads
const backupUpload = multer({
  dest: path.join(__dirname, '..', 'backups'),
  limits: { fileSize: 500 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.originalname.endsWith('.sql')) cb(null, true);
    else cb(new Error('Only .sql files are allowed'));
  }
});
const { sendProductApprovalEmail, sendOrderStatusUpdate, sendSponsorshipStatusEmail } = require('../lib/email');
const { getSiteContent, saveSiteContent } = require('../lib/siteContent');
const { logTransaction } = require('../lib/transactionLog');

// GET /api/admin/stats
router.get('/stats', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      totalProducts,
      pendingProducts,
      totalOrders,
      todayOrders,
      recentOrders,
      activeSponsors,
      totalCustomers,
      totalSuppliers,
      deliveredOrders,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.product.count({ where: { isDeleted: false } }),
      prisma.product.count({ where: { status: 'pending', isDeleted: false } }),
      prisma.order.count(),
      prisma.order.count({ where: { createdAt: { gte: today } } }),
      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { id: true, fullName: true, phone: true } } },
      }),
      prisma.product.count({ where: { isSponsored: true, status: 'approved', isDeleted: false } }),
      prisma.user.count({ where: { role: 'customer' } }),
      prisma.user.count({ where: { role: 'supplier' } }),
      prisma.order.findMany({
        where: { status: { not: 'cancelled' } },
        select: { items: { select: { quantity: true, retailPrice: true, wholesaleCost: true } } },
      }),
    ]);

    const revenue = await prisma.order.aggregate({
      _sum: { totalAmount: true },
      where: { status: { not: 'cancelled' } },
    });

    const totalProfit = deliveredOrders.reduce((sum, order) => {
      return sum + order.items.reduce((orderSum, item) => orderSum + ((item.retailPrice - item.wholesaleCost) * item.quantity), 0);
    }, 0);

    res.json({
      totalUsers,
      totalProducts,
      pendingApprovals: pendingProducts,
      totalOrders,
      todayOrders,
      totalRevenue: revenue._sum.totalAmount || 0,
      totalProfit,
      activeSponsors,
      totalCustomers,
      totalSuppliers,
      recentOrders,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// GET /api/admin/products
router.get('/products', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { skip, take, page, limit } = paginate(req.query.page, req.query.limit);
    const status = req.query.status;
    const search = req.query.search;

    const where = { isDeleted: false };
    if (status && status !== 'all') where.status = status;
    if (search) {
      where.OR = [
        { nameEn: { contains: search } },
        { namePs: { contains: search } },
        { nameDr: { contains: search } },
      ];
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          images: { orderBy: { sortOrder: 'asc' }, take: 1 },
          category: true,
          supplier: { select: { id: true, fullName: true, companyName: true } },
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

// POST /api/admin/products/:id/approve
router.post('/products/:id/approve', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { supplier: true },
    });
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const retailPrice = req.body.retailPrice || product.suggestedPrice || product.wholesaleCost * 1.3;
    const adminNotes = req.body.adminNotes || null;

    const updated = await prisma.product.update({
      where: { id: product.id },
      data: { status: 'approved', retailPrice: parseFloat(retailPrice), adminNotes },
    });

    if (product.supplier) {
      await sendProductApprovalEmail(product.supplier.email, product.nameEn, 'approved');
    }

    await logTransaction(req, 'APPROVE_PRODUCT', 'Product', product.id, { nameEn: product.nameEn, retailPrice });
    res.json({ product: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to approve product' });
  }
});

// POST /api/admin/products/:id/reject
router.post('/products/:id/reject', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { supplier: true },
    });
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const updated = await prisma.product.update({
      where: { id: product.id },
      data: { status: 'rejected', adminNotes: req.body.reason || null },
    });

    if (product.supplier) {
      await sendProductApprovalEmail(product.supplier.email, product.nameEn, 'rejected');
    }

    res.json({ product: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reject product' });
  }
});

// GET /api/admin/users
router.get('/users', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { skip, take, page, limit } = paginate(req.query.page, req.query.limit);
    const role = req.query.role;
    const search = req.query.search;

    const where = {};
    if (role) where.role = role;
    if (search) {
      where.OR = [
        { fullName: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
        { companyName: { contains: search } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true, email: true, fullName: true, phone: true, role: true,
          isActive: true, isApproved: true, emailVerified: true, companyName: true, createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.user.count({ where }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));
    res.json({ users, total, totalPages, pagination: { page, limit, total, totalPages } });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// PUT /api/admin/users/:id
router.put('/users/:id', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { isActive, isApproved, role } = req.body;
    const updateData = {};
    if (isActive !== undefined) updateData.isActive = isActive;
    if (isApproved !== undefined) updateData.isApproved = isApproved;
    if (role) updateData.role = role;

    const user = await prisma.user.update({
      where: { id: parseInt(req.params.id) },
      data: updateData,
      select: { id: true, email: true, fullName: true, role: true, isActive: true, isApproved: true },
    });

    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// GET /api/admin/orders
router.get('/orders', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { skip, take, page, limit } = paginate(req.query.page, req.query.limit);
    const status = req.query.status;

    const where = {};
    if (status) where.status = status;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          items: { include: { product: { select: { nameEn: true } } } },
          user: { select: { id: true, fullName: true, phone: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.order.count({ where }),
    ]);

    const mapped = orders.map((o) => ({
      ...o,
      customer: o.user,
    }));

    const totalPages = Math.max(1, Math.ceil(total / limit));
    res.json({ orders: mapped, total, totalPages, pagination: { page, limit, total, totalPages } });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// PUT /api/admin/orders/:id
router.put('/orders/:id', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { status, deliveryPersonId } = req.body;
    const updateData = {};
    if (status) updateData.status = status;
    if (deliveryPersonId) updateData.deliveryPersonId = parseInt(deliveryPersonId);

    const order = await prisma.order.update({
      where: { id: parseInt(req.params.id) },
      data: updateData,
      include: { user: true },
    });

    if (status) {
      await sendOrderStatusUpdate(order.user.email, order);
    }

    await logTransaction(req, 'UPDATE_ORDER', 'Order', order.id, { status, deliveryPersonId });
    res.json({ order });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update order' });
  }
});

// GET /api/admin/reports
router.get('/reports', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const type = req.query.type || 'sales';
    const period = req.query.period || 'month';

    let startDate = new Date();
    if (period === 'day') startDate.setDate(startDate.getDate() - 1);
    else if (period === 'week') startDate.setDate(startDate.getDate() - 7);
    else if (period === 'month') startDate.setMonth(startDate.getMonth() - 1);
    else startDate.setFullYear(startDate.getFullYear() - 1);

    if (type === 'sales') {
      const orders = await prisma.order.findMany({
        where: { createdAt: { gte: startDate }, status: { not: 'cancelled' } },
        include: { items: { include: { product: { include: { supplier: { select: { id: true, companyName: true } } } } } } },
        orderBy: { createdAt: 'desc' },
      });

      const totalRevenue = orders.reduce((s, o) => s + o.totalAmount, 0);
      const totalProfit = orders.reduce((s, o) => {
        return s + o.items.reduce((ss, i) => ss + (i.retailPrice - i.wholesaleCost) * i.quantity, 0);
      }, 0);

      return res.json({ report: { type: 'sales', period, totalRevenue, totalProfit, orderCount: orders.length, orders } });
    }

    if (type === 'supplier_payables') {
      const deliveredOrders = await prisma.order.findMany({
        where: { status: 'delivered', createdAt: { gte: startDate } },
        include: { items: { include: { product: { include: { supplier: { select: { id: true, fullName: true, companyName: true } } } } } } },
      });

      const payables = {};
      for (const order of deliveredOrders) {
        for (const item of order.items) {
          const sid = item.product.supplierId;
          if (!payables[sid]) {
            payables[sid] = { supplier: item.product.supplier, totalPayable: 0, itemCount: 0 };
          }
          payables[sid].totalPayable += item.wholesaleCost * item.quantity;
          payables[sid].itemCount += item.quantity;
        }
      }

      return res.json({ report: { type: 'supplier_payables', period, payables: Object.values(payables) } });
    }

    if (type === 'sponsorship') {
      const sponsorships = await prisma.sponsorshipRequest.findMany({
        where: { status: 'approved', createdAt: { gte: startDate } },
        include: { package: true, product: true, supplier: { select: { companyName: true } } },
      });

      const totalRevenue = sponsorships.reduce((s, sp) => s + sp.package.price, 0);
      return res.json({ report: { type: 'sponsorship', period, totalRevenue, sponsorships } });
    }

    res.status(400).json({ error: 'Invalid report type' });
  } catch (err) {
    console.error('Admin reports error:', err);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

router.get('/site-content', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const content = await getSiteContent();
    res.json({ content });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch site content' });
  }
});

router.put('/site-content', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const content = await saveSiteContent(req.body);
    res.json({ content });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save site content' });
  }
});

// GET /api/admin/sponsorships/packages
router.get('/sponsorships/packages', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const packages = await prisma.sponsorshipPackage.findMany({ orderBy: { price: 'asc' } });
    res.json({ packages });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch packages' });
  }
});

// POST /api/admin/sponsorships/packages
router.post('/sponsorships/packages', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { name, durationDays, price, description } = req.body;
    if (!name || !durationDays || !price) return res.status(400).json({ error: 'Name, duration, and price are required' });

    const pkg = await prisma.sponsorshipPackage.create({
      data: { name, durationDays: parseInt(durationDays), price: parseFloat(price), description: description || null },
    });

    res.status(201).json({ package: pkg });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create package' });
  }
});

// PUT /api/admin/sponsorships/packages/:id
router.put('/sponsorships/packages/:id', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const pkg = await prisma.sponsorshipPackage.update({
      where: { id: parseInt(req.params.id) },
      data: req.body,
    });
    res.json({ package: pkg });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update package' });
  }
});

// DELETE /api/admin/sponsorships/packages/:id
router.delete('/sponsorships/packages/:id', authenticate, requireRole('admin'), async (req, res) => {
  try {
    await prisma.sponsorshipPackage.update({
      where: { id: parseInt(req.params.id) },
      data: { isActive: false },
    });
    res.json({ message: 'Package deactivated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete package' });
  }
});

// GET /api/admin/sponsorships/requests
router.get('/sponsorships/requests', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { skip, take, page, limit } = paginate(req.query.page, req.query.limit);
    const status = req.query.status;

    const where = {};
    if (status) where.status = status;

    const [requests, total] = await Promise.all([
      prisma.sponsorshipRequest.findMany({
        where,
        include: {
          supplier: { select: { id: true, fullName: true, companyName: true } },
          product: { select: { id: true, nameEn: true } },
          package: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.sponsorshipRequest.count({ where }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));
    res.json({ requests, total, totalPages, pagination: { page, limit, total, totalPages } });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch sponsorship requests' });
  }
});

// PUT /api/admin/sponsorships/requests/:id
router.put('/sponsorships/requests/:id', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { status, startDate } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Status must be approved or rejected' });
    }

    const sponsorReq = await prisma.sponsorshipRequest.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { package: true, supplier: true },
    });

    if (!sponsorReq) return res.status(404).json({ error: 'Request not found' });

    const updateData = { status };

    if (status === 'approved') {
      const start = startDate ? new Date(startDate) : new Date();
      const end = new Date(start);
      end.setDate(end.getDate() + sponsorReq.package.durationDays);
      updateData.startDate = start;
      updateData.endDate = end;

      await prisma.product.update({
        where: { id: sponsorReq.productId },
        data: { isSponsored: true },
      });
    } else {
      await prisma.product.update({
        where: { id: sponsorReq.productId },
        data: { isSponsored: false },
      });
    }

    const updated = await prisma.sponsorshipRequest.update({
      where: { id: parseInt(req.params.id) },
      data: updateData,
    });

    await sendSponsorshipStatusEmail(sponsorReq.supplier.email, status);

    res.json({ request: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update sponsorship request' });
  }
});

// ─── Contact Messages ───
router.get('/contact-messages', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { page, limit, skip } = paginate(req.query.page, req.query.limit);
    const [messages, total] = await Promise.all([
      prisma.contactMessage.findMany({ orderBy: { createdAt: 'desc' }, skip, take: limit }),
      prisma.contactMessage.count(),
    ]);
    res.json({ messages, total, page, limit, pages: Math.ceil(total / limit) });
  } catch {
    res.status(500).json({ error: 'Failed to fetch contact messages' });
  }
});

router.patch('/contact-messages/:id/read', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const message = await prisma.contactMessage.update({
      where: { id: parseInt(req.params.id) },
      data: { isRead: true },
    });
    res.json({ message });
  } catch {
    res.status(500).json({ error: 'Failed to update message' });
  }
});

router.delete('/contact-messages/:id', authenticate, requireRole('admin'), async (req, res) => {
  try {
    await prisma.contactMessage.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

// ─── Single Product Detail ─── 
router.get('/products/:id', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        category: true,
        supplier: { select: { id: true, fullName: true, companyName: true, email: true, phone: true } },
      },
    });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json({ product });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// ─── Full Product Edit ───
router.put('/products/:id', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const product = await prisma.product.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const {
      nameEn, namePs, nameDr, descEn, descPs, descDr,
      wholesaleCost, suggestedPrice, retailPrice, categoryId,
      stock, status, adminNotes, isSponsored, attributes, images,
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
    if (retailPrice !== undefined) updateData.retailPrice = retailPrice === null || retailPrice === '' ? null : parseFloat(retailPrice);
    if (categoryId !== undefined) updateData.categoryId = categoryId ? parseInt(categoryId) : null;
    if (stock !== undefined) updateData.stock = parseInt(stock);
    if (status !== undefined) updateData.status = status;
    if (adminNotes !== undefined) updateData.adminNotes = adminNotes || null;
    if (isSponsored !== undefined) updateData.isSponsored = isSponsored;
    if (attributes !== undefined) updateData.attributes = attributes || null;

    const updated = await prisma.product.update({
      where: { id: product.id },
      data: updateData,
    });

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
      include: { images: { orderBy: { sortOrder: 'asc' } }, category: true, supplier: { select: { id: true, fullName: true, companyName: true } } },
    });

    res.json({ product: result });
  } catch (err) {
    console.error('Admin product update error:', err);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// ─── Soft Delete Product ───
router.delete('/products/:id', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const product = await prisma.product.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    await prisma.product.update({ where: { id: product.id }, data: { isDeleted: true } });
    res.json({ success: true, message: 'Product soft-deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// ─── Full User Detail ───
router.get('/users/:id', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(req.params.id) },
      select: {
        id: true, email: true, fullName: true, phone: true, role: true,
        isActive: true, isApproved: true, emailVerified: true,
        province: true, district: true, village: true, landmark: true,
        companyName: true, contactPerson: true, taxId: true, businessLicense: true,
        createdAt: true, updatedAt: true,
        _count: { select: { products: true, orders: true } },
      },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// ─── Enhanced User Update (full profile) ───
router.put('/users/:id/profile', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const {
      fullName, phone, role, isActive, isApproved, emailVerified,
      province, district, village, landmark,
      companyName, contactPerson, taxId, businessLicense,
    } = req.body;

    const updateData = {};
    if (fullName !== undefined) updateData.fullName = fullName;
    if (phone !== undefined) updateData.phone = phone || null;
    if (role !== undefined) updateData.role = role;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (isApproved !== undefined) updateData.isApproved = isApproved;
    if (emailVerified !== undefined) updateData.emailVerified = emailVerified;
    if (province !== undefined) updateData.province = province || null;
    if (district !== undefined) updateData.district = district || null;
    if (village !== undefined) updateData.village = village || null;
    if (landmark !== undefined) updateData.landmark = landmark || null;
    if (companyName !== undefined) updateData.companyName = companyName || null;
    if (contactPerson !== undefined) updateData.contactPerson = contactPerson || null;
    if (taxId !== undefined) updateData.taxId = taxId || null;
    if (businessLicense !== undefined) updateData.businessLicense = businessLicense || null;

    const user = await prisma.user.update({
      where: { id: parseInt(req.params.id) },
      data: updateData,
      select: {
        id: true, email: true, fullName: true, phone: true, role: true,
        isActive: true, isApproved: true, emailVerified: true,
        province: true, district: true, village: true, landmark: true,
        companyName: true, contactPerson: true, taxId: true, businessLicense: true,
      },
    });

    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update user profile' });
  }
});

// ─── Order Detail with wholesale costs ───
router.get('/orders/:id', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        items: {
          include: {
            product: {
              select: { nameEn: true, namePs: true, nameDr: true, wholesaleCost: true, images: { take: 1 } },
            },
          },
        },
        user: { select: { id: true, fullName: true, email: true, phone: true } },
        deliveryPerson: { select: { id: true, fullName: true, phone: true } },
      },
    });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const totalWholesale = order.items.reduce((s, i) => s + i.wholesaleCost * i.quantity, 0);
    const totalProfit = order.items.reduce((s, i) => s + (i.retailPrice - i.wholesaleCost) * i.quantity, 0);

    res.json({ order: { ...order, totalWholesale, totalProfit } });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch order details' });
  }
});

// ─── List Delivery Persons ───
router.get('/delivery-persons', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const persons = await prisma.user.findMany({
      where: { role: 'delivery', isActive: true },
      select: { id: true, fullName: true, phone: true },
      orderBy: { fullName: 'asc' },
    });
    res.json({ deliveryPersons: persons });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch delivery persons' });
  }
});

// ─── Chart Data for Dashboard ───
router.get('/chart-data', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const orders = await prisma.order.findMany({
      where: { createdAt: { gte: startDate }, status: { not: 'cancelled' } },
      select: { createdAt: true, totalAmount: true, items: { select: { retailPrice: true, wholesaleCost: true, quantity: true } } },
      orderBy: { createdAt: 'asc' },
    });

    // Group by date
    const dailyData = {};
    for (const order of orders) {
      const key = order.createdAt.toISOString().slice(0, 10);
      if (!dailyData[key]) dailyData[key] = { date: key, orders: 0, revenue: 0, profit: 0 };
      dailyData[key].orders += 1;
      dailyData[key].revenue += order.totalAmount;
      dailyData[key].profit += order.items.reduce((s, i) => s + (i.retailPrice - i.wholesaleCost) * i.quantity, 0);
    }

    // Fill missing dates
    const result = [];
    const current = new Date(startDate);
    const today = new Date();
    while (current <= today) {
      const key = current.toISOString().slice(0, 10);
      result.push(dailyData[key] || { date: key, orders: 0, revenue: 0, profit: 0 });
      current.setDate(current.getDate() + 1);
    }

    res.json({ chartData: result });
  } catch (err) {
    console.error('Chart data error:', err);
    res.status(500).json({ error: 'Failed to fetch chart data' });
  }
});

// ─── Enhanced Reports with top products ───
router.get('/reports/summary', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const period = req.query.period || 'month';
    let startDate = new Date();
    if (period === 'day') startDate.setDate(startDate.getDate() - 1);
    else if (period === 'week') startDate.setDate(startDate.getDate() - 7);
    else if (period === 'month') startDate.setMonth(startDate.getMonth() - 1);
    else startDate.setFullYear(startDate.getFullYear() - 1);

    const orders = await prisma.order.findMany({
      where: { createdAt: { gte: startDate }, status: { not: 'cancelled' } },
      include: { items: { include: { product: { select: { id: true, nameEn: true, supplierId: true } } } } },
    });

    const totalRevenue = orders.reduce((s, o) => s + o.totalAmount, 0);
    const totalProfit = orders.reduce((s, o) => s + o.items.reduce((ss, i) => ss + (i.retailPrice - i.wholesaleCost) * i.quantity, 0), 0);
    const averageOrder = orders.length > 0 ? totalRevenue / orders.length : 0;

    // Top products
    const productSales = {};
    for (const order of orders) {
      for (const item of order.items) {
        const pid = item.productId;
        if (!productSales[pid]) productSales[pid] = { id: pid, name: item.product?.nameEn || `#${pid}`, sold: 0, revenue: 0 };
        productSales[pid].sold += item.quantity;
        productSales[pid].revenue += item.retailPrice * item.quantity;
      }
    }
    const topProducts = Object.values(productSales).sort((a, b) => b.revenue - a.revenue).slice(0, 10);

    // Supplier payables
    const payables = {};
    const deliveredOrders = await prisma.order.findMany({
      where: { status: 'delivered', createdAt: { gte: startDate } },
      include: { items: { include: { product: { include: { supplier: { select: { id: true, fullName: true, companyName: true } } } } } } },
    });
    for (const order of deliveredOrders) {
      for (const item of order.items) {
        const sid = item.product.supplierId;
        if (!payables[sid]) payables[sid] = { supplier: item.product.supplier?.companyName || item.product.supplier?.fullName || `#${sid}`, amount: 0, items: 0 };
        payables[sid].amount += item.wholesaleCost * item.quantity;
        payables[sid].items += item.quantity;
      }
    }
    const supplierPayables = Object.values(payables).sort((a, b) => b.amount - a.amount);

    // Orders by status
    const ordersByStatus = {};
    const allOrders = await prisma.order.findMany({ where: { createdAt: { gte: startDate } }, select: { status: true } });
    for (const o of allOrders) {
      ordersByStatus[o.status] = (ordersByStatus[o.status] || 0) + 1;
    }

    // Sponsorship revenue
    const sponsorships = await prisma.sponsorshipRequest.findMany({
      where: { status: 'approved', createdAt: { gte: startDate } },
      include: { package: true },
    });
    const sponsorshipRevenue = sponsorships.reduce((s, sp) => s + (sp.package?.price || 0), 0);

    res.json({
      totalRevenue, totalProfit, totalOrders: orders.length, averageOrder,
      topProducts, supplierPayables, ordersByStatus, sponsorshipRevenue,
    });
  } catch (err) {
    console.error('Report summary error:', err);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

// ─── CSV Export ───
router.get('/reports/csv', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const type = req.query.type || 'orders';
    const period = req.query.period || 'month';

    let startDate = new Date();
    if (period === 'day') startDate.setDate(startDate.getDate() - 1);
    else if (period === 'week') startDate.setDate(startDate.getDate() - 7);
    else if (period === 'month') startDate.setMonth(startDate.getMonth() - 1);
    else startDate.setFullYear(startDate.getFullYear() - 1);

    if (type === 'orders') {
      const orders = await prisma.order.findMany({
        where: { createdAt: { gte: startDate } },
        include: {
          items: { include: { product: { select: { nameEn: true } } } },
          user: { select: { fullName: true, email: true, phone: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      const rows = [['Order #', 'Date', 'Customer', 'Email', 'Phone', 'Status', 'Payment', 'Items', 'Total', 'Province', 'District']];
      for (const o of orders) {
        rows.push([
          o.orderNumber, o.createdAt.toISOString().slice(0, 10),
          o.user?.fullName || '', o.user?.email || '', o.user?.phone || o.phone || '',
          o.status, o.paymentStatus, o.items.length, o.totalAmount,
          o.province || '', o.district || '',
        ]);
      }

      const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=orders_${period}_${Date.now()}.csv`);
      return res.send(csv);
    }

    if (type === 'products') {
      const products = await prisma.product.findMany({
        where: { isDeleted: false },
        include: { category: true, supplier: { select: { companyName: true, fullName: true } } },
        orderBy: { createdAt: 'desc' },
      });

      const rows = [['ID', 'Name (EN)', 'Name (PS)', 'Name (DR)', 'Category', 'Supplier', 'Wholesale', 'Retail', 'Stock', 'Status', 'Created']];
      for (const p of products) {
        rows.push([
          p.id, p.nameEn, p.namePs || '', p.nameDr || '', p.category?.nameEn || '',
          p.supplier?.companyName || p.supplier?.fullName || '', p.wholesaleCost,
          p.retailPrice || '', p.stock, p.status, p.createdAt.toISOString().slice(0, 10),
        ]);
      }

      const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=products_${Date.now()}.csv`);
      return res.send(csv);
    }

    if (type === 'users') {
      const users = await prisma.user.findMany({
        select: { id: true, fullName: true, email: true, phone: true, role: true, isActive: true, isApproved: true, companyName: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      });

      const rows = [['ID', 'Name', 'Email', 'Phone', 'Role', 'Active', 'Approved', 'Company', 'Created']];
      for (const u of users) {
        rows.push([u.id, u.fullName, u.email, u.phone || '', u.role, u.isActive, u.isApproved, u.companyName || '', u.createdAt.toISOString().slice(0, 10)]);
      }

      const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=users_${Date.now()}.csv`);
      return res.send(csv);
    }

    if (type === 'supplier_payables') {
      const deliveredOrders = await prisma.order.findMany({
        where: { status: 'delivered', createdAt: { gte: startDate } },
        include: { items: { include: { product: { include: { supplier: { select: { id: true, fullName: true, companyName: true, email: true } } } } } } },
      });

      const payables = {};
      for (const order of deliveredOrders) {
        for (const item of order.items) {
          const sid = item.product.supplierId;
          if (!payables[sid]) {
            payables[sid] = { supplier: item.product.supplier, totalPayable: 0, itemCount: 0 };
          }
          payables[sid].totalPayable += item.wholesaleCost * item.quantity;
          payables[sid].itemCount += item.quantity;
        }
      }

      const rows = [['Supplier ID', 'Supplier Name', 'Company', 'Email', 'Items Sold', 'Total Payable']];
      for (const p of Object.values(payables)) {
        rows.push([p.supplier?.id || '', p.supplier?.fullName || '', p.supplier?.companyName || '', p.supplier?.email || '', p.itemCount, p.totalPayable]);
      }

      const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=supplier_payables_${period}_${Date.now()}.csv`);
      return res.send(csv);
    }

    res.status(400).json({ error: 'Invalid export type. Use: orders, products, users, supplier_payables' });
  } catch (err) {
    console.error('CSV export error:', err);
    res.status(500).json({ error: 'Failed to export CSV' });
  }
});

// GET /api/admin/transaction-logs
router.get('/transaction-logs', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { skip, take, page, limit } = paginate(req.query.page, req.query.limit);
    const where = {};
    if (req.query.action) where.action = req.query.action;
    if (req.query.entity) where.entity = req.query.entity;
    if (req.query.userId) where.userId = parseInt(req.query.userId);

    const [logs, total] = await Promise.all([
      prisma.transactionLog.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take }),
      prisma.transactionLog.count({ where }),
    ]);
    const totalPages = Math.max(1, Math.ceil(total / limit));
    res.json({ logs, total, totalPages, pagination: { page, limit, total, totalPages } });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch transaction logs' });
  }
});

// POST /api/admin/backup - Create MySQL database backup
router.post('/backup', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const dbUrl = process.env.DATABASE_URL || '';
    const match = dbUrl.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+?)(\?|$)/);
    if (!match) return res.status(500).json({ error: 'Invalid DATABASE_URL format' });

    const [, dbUser, dbPass, dbHost, dbPort, dbName] = match;
    const backupsDir = path.join(__dirname, '..', 'backups');
    if (!fs.existsSync(backupsDir)) fs.mkdirSync(backupsDir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup_${dbName}_${timestamp}.sql`;
    const filepath = path.join(backupsDir, filename);

    try {
      execSync(
        `mysqldump -h ${dbHost} -P ${dbPort} -u ${dbUser} -p${dbPass} ${dbName} > "${filepath}"`,
        { timeout: 60000 }
      );

      await logTransaction(req, 'BACKUP', 'Database', null, { filename });

      // Send file for download
      res.download(filepath, filename, (err) => {
        if (err) console.error('Backup download error:', err);
      });
    } catch (err) {
      // If mysqldump failed (likely not installed), fall back to JSON export
      console.warn('mysqldump failed, falling back to JSON backup:', err.message);
      try {
        // retrieve all table names for current database
        const rows = await prisma.$queryRawUnsafe(
          `SELECT table_name FROM information_schema.tables WHERE table_schema='${dbName}'`);
        const data = {};
        for (const r of rows) {
          const tbl = r.table_name || r.TABLE_NAME;
          data[tbl] = await prisma.$queryRawUnsafe(`SELECT * FROM \`${tbl}\``);
        }
        const json = JSON.stringify(data);
        await logTransaction(req, 'BACKUP', 'Database (JSON)', null, { method: 'json' });
        res.setHeader('Content-disposition', `attachment; filename=backup_${dbName}_${timestamp}.json`);
        res.setHeader('Content-Type', 'application/json');
        res.send(json);
      } catch (jsonErr) {
        console.error('JSON backup error:', jsonErr.message);
        res.status(500).json({ error: 'Failed to create backup (mysqldump missing and JSON export failed).' });
      }
    }
  } catch (err) {
    console.error('Backup error:', err.message);
    res.status(500).json({ error: 'Unexpected error while creating backup.' });
  }
});

// GET /api/admin/backups - List available backups
router.get('/backups', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const backupsDir = path.join(__dirname, '..', 'backups');
    if (!fs.existsSync(backupsDir)) return res.json({ backups: [] });
    const files = fs.readdirSync(backupsDir)
      .filter(f => f.endsWith('.sql'))
      .map(f => {
        const stat = fs.statSync(path.join(backupsDir, f));
        return { name: f, size: stat.size, createdAt: stat.mtime };
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json({ backups: files });
  } catch (err) {
    res.status(500).json({ error: 'Failed to list backups' });
  }
});

// GET /api/admin/backups/:filename - Download a specific backup
router.get('/backups/:filename', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const safeName = path.basename(req.params.filename);
    if (!safeName.endsWith('.sql')) return res.status(400).json({ error: 'Invalid filename' });
    const backupsDir = path.join(__dirname, '..', 'backups');
    const filepath = path.join(backupsDir, safeName);
    if (!fs.existsSync(filepath)) return res.status(404).json({ error: 'File not found' });
    res.download(filepath, safeName);
  } catch (err) {
    res.status(500).json({ error: 'Failed to download backup' });
  }
});

// POST /api/admin/restore - Restore from a backup file
router.post('/restore', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { filename } = req.body;
    if (!filename) return res.status(400).json({ error: 'Filename is required' });

    // Sanitize filename to prevent path traversal
    const safeName = path.basename(filename);
    if (safeName !== filename || !filename.endsWith('.sql')) {
      return res.status(400).json({ error: 'Invalid filename' });
    }

    const backupsDir = path.join(__dirname, '..', 'backups');
    const filepath = path.join(backupsDir, safeName);
    if (!fs.existsSync(filepath)) return res.status(404).json({ error: 'Backup file not found' });

    const dbUrl = process.env.DATABASE_URL || '';
    const match = dbUrl.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+?)(\?|$)/);
    if (!match) return res.status(500).json({ error: 'Invalid DATABASE_URL format' });

    const [, dbUser, dbPass, dbHost, dbPort, dbName] = match;

    execSync(
      `mysql -h ${dbHost} -P ${dbPort} -u ${dbUser} -p${dbPass} ${dbName} < "${filepath}"`,
      { timeout: 120000 }
    );

    await logTransaction(req, 'RESTORE', 'Database', null, { filename: safeName });
    res.json({ message: `Database restored from ${safeName}` });
  } catch (err) {
    console.error('Restore error:', err.message);
    res.status(500).json({ error: 'Failed to restore backup. Ensure mysql client is available.' });
  }
});

// POST /api/admin/restore-upload - Restore from uploaded .sql file
router.post('/restore-upload', authenticate, requireRole('admin'), backupUpload.single('backup'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No backup file uploaded' });

    const dbUrl = process.env.DATABASE_URL || '';
    const match = dbUrl.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+?)(\?|$)/);
    if (!match) {
      fs.unlinkSync(req.file.path);
      return res.status(500).json({ error: 'Invalid DATABASE_URL format' });
    }

    const [, dbUser, dbPass, dbHost, dbPort, dbName] = match;

    // Rename temp file to safe name
    const safeName = `uploaded_${Date.now()}_${path.basename(req.file.originalname).replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const finalPath = path.join(path.dirname(req.file.path), safeName);
    fs.renameSync(req.file.path, finalPath);

    const ext = path.extname(req.file.originalname).toLowerCase();
    if (ext === '.json') {
      // restore JSON data via prisma
      const raw = fs.readFileSync(finalPath, 'utf8');
      const data = JSON.parse(raw);
      // disable foreign keys, truncate and insert rows
      const escapeVal = (v) => {
        if (v === null || v === undefined) return 'NULL';
        if (typeof v === 'number' || typeof v === 'boolean') return v;
        return `'${v.toString().replace(/'/g, "\\'")}'`;
      };
      await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS=0;');
      for (const tbl of Object.keys(data)) {
        await prisma.$executeRawUnsafe(`TRUNCATE TABLE \`${tbl}\``);
        const rows = data[tbl];
        for (const row of rows) {
          const cols = Object.keys(row).map(c => `\`${c}\``).join(',');
          const vals = Object.values(row).map(escapeVal).join(',');
          await prisma.$executeRawUnsafe(`INSERT INTO \`${tbl}\` (${cols}) VALUES (${vals})`);
        }
      }
      await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS=1;');
      await logTransaction(req, 'RESTORE_UPLOAD', 'Database (JSON)', null, { filename: safeName });
      res.json({ message: `Database restored from uploaded JSON backup: ${req.file.originalname}` });
    } else {
      // assume SQL
      execSync(
        `mysql -h ${dbHost} -P ${dbPort} -u ${dbUser} -p${dbPass} ${dbName} < "${finalPath}"`,
        { timeout: 120000 }
      );
      await logTransaction(req, 'RESTORE_UPLOAD', 'Database', null, { filename: safeName });
      res.json({ message: `Database restored from uploaded file: ${req.file.originalname}` });
    }
  } catch (err) {
    // Clean up temp file on error
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    console.error('Restore upload error:', err.message);
    res.status(500).json({ error: 'Failed to restore from uploaded backup. Ensure mysql client is available or JSON format is valid.' });
  }
});

// DELETE /api/admin/backups/:filename - Delete a backup
router.delete('/backups/:filename', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const safeName = path.basename(req.params.filename);
    if (!safeName.endsWith('.sql')) return res.status(400).json({ error: 'Invalid filename' });
    const filepath = path.join(__dirname, '..', 'backups', safeName);
    if (!fs.existsSync(filepath)) return res.status(404).json({ error: 'File not found' });
    fs.unlinkSync(filepath);
    res.json({ message: 'Backup deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete backup' });
  }
});

module.exports = router;
