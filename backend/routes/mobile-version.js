const express = require('express');
const prisma = require('../lib/prisma');
const { authenticate, requireRole } = require('../middleware/auth');
const router = express.Router();
const KEY = 'mobile_required_version';
const defaults = { ios: 4, android: 14, iosStoreUrl: 'https://apps.apple.com/app/sawdagar/id6763734260', androidStoreUrl: 'https://play.google.com/store/apps/details?id=com.ahmadwali.afghan_bazar.afghan_bazar' };

async function read() {
  const record = await prisma.siteContent.findUnique({ where: { key: KEY } });
  try { return { ...defaults, ...JSON.parse(record?.value || '{}') }; } catch { return defaults; }
}

router.get('/', async (req, res) => {
  try { res.json(await read()); } catch { res.status(500).json({ error: 'Failed to check app version' }); }
});
router.put('/', authenticate, requireRole('admin'), async (req, res) => {
  const current = await read();
  const ios = Number(req.body.ios);
  const android = Number(req.body.android);
  if (!Number.isInteger(ios) || !Number.isInteger(android) || ios < current.ios || android < current.android) return res.status(400).json({ error: 'Enter build numbers at least as high as the current minimum' });
  const value = { ...current, ios, android };
  try {
    await prisma.siteContent.upsert({ where: { key: KEY }, update: { value: JSON.stringify(value) }, create: { key: KEY, value: JSON.stringify(value) } });
    res.json(value);
  } catch { res.status(500).json({ error: 'Failed to save app version' }); }
});
module.exports = router;
