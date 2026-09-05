const express = require('express');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const router = express.Router();

const uploadsRoot = path.resolve(process.env.UPLOADS_DIR || path.join(__dirname, '..', 'uploads'));
const cacheRoot = path.join(uploadsRoot, '.cache');

if (!fs.existsSync(cacheRoot)) {
  fs.mkdirSync(cacheRoot, { recursive: true });
}

// Track in-progress conversions to avoid duplicate work
const pending = new Map();
const allowedWidths = [80, 280, 320, 420, 500, 560, 700, 760, 800, 1200];
const allowedQualities = [60, 75, 85];

function nearestAllowed(value, allowed, fallback) {
  const requested = parseInt(value, 10);
  if (!Number.isFinite(requested)) return fallback;
  return allowed.reduce((nearest, current) => (
    Math.abs(current - requested) < Math.abs(nearest - requested) ? current : nearest
  ), allowed[0]);
}

function normalizeUploadPath(src) {
  if (!src || typeof src !== 'string') return null;
  if (!src.startsWith('/uploads/')) return null;
  const relative = src.replace(/^\/uploads\//, '');
  if (!relative || relative.includes('..') || relative.startsWith('.')) return null;
  return path.join(uploadsRoot, relative);
}

router.get('/', async (req, res) => {
  try {
    const src = req.query.src;
    // Bucket variants so arbitrary query values cannot create unbounded files.
    const width = nearestAllowed(req.query.w, allowedWidths, 800);
    const quality = nearestAllowed(req.query.q, allowedQualities, 60);
    const format = req.query.f === 'jpeg' ? 'jpeg' : 'webp';

    const originalPath = normalizeUploadPath(src);
    if (!originalPath) return res.status(400).json({ error: 'Invalid image source' });
    if (!fs.existsSync(originalPath)) return res.status(404).json({ error: 'Image not found' });

    const parsed = path.parse(originalPath);
    const stat = fs.statSync(originalPath);
    const sourceVersion = Math.round(stat.mtimeMs).toString(36);
    const cacheName = `${parsed.name}-${sourceVersion}-w${width}-q${quality}.${format}`;
    const cachePath = path.join(cacheRoot, cacheName);

    // ETag based on original file mtime + params
    const etag = `"${stat.mtimeMs}-${width}-${quality}-${format}"`;
    if (req.headers['if-none-match'] === etag) {
      return res.status(304).end();
    }

    if (!fs.existsSync(cachePath)) {
      // Deduplicate concurrent requests for the same conversion
      if (!pending.has(cacheName)) {
        const pipeline = sharp(originalPath)
          .rotate()
          .resize({ width, withoutEnlargement: true, fit: 'inside' });

        const promise = format === 'jpeg'
          ? pipeline.jpeg({ quality, progressive: true, mozjpeg: true }).toFile(cachePath)
          : pipeline.webp({ quality, effort: 4 }).toFile(cachePath);

        pending.set(cacheName, promise.finally(() => pending.delete(cacheName)));
      }
      await pending.get(cacheName);
    }

    const contentType = format === 'jpeg' ? 'image/jpeg' : 'image/webp';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('ETag', etag);
    return res.sendFile(cachePath);
  } catch (error) {
    console.error('Image optimization error:', error.message);
    return res.status(500).json({ error: 'Failed to optimize image' });
  }
});

module.exports = router;
