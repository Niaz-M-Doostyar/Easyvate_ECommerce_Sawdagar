const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { getSiteContent } = require('../lib/siteContent');

router.get('/', async (req, res) => {
  try {
    const content = await getSiteContent();
    res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=120');
    res.json({ content });
  } catch {
    res.status(500).json({ error: 'Failed to fetch site content' });
  }
});

// POST /api/site-content/contact  — public contact form submission
router.post('/contact', async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, email and message are required' });
    }
    await prisma.contactMessage.create({
      data: { name, email, phone: phone || null, subject: subject || null, message },
    });
    res.json({ success: true });
  } catch (err) {
    console.error('Contact form error:', err);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

module.exports = router;
