const express = require('express');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const router = express.Router();

const uploadsRoot = path.join(__dirname, '..', 'uploads');
const cacheRoot = path.join(uploadsRoot, '.cache');

if (!fs.existsSync(cacheRoot)) {
  fs.mkdirSync(cacheRoot, { recursive: true });
}

// Track in-progress conversions to avoid duplicate work
const pending = new Map();

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
    const width = Math.max(40, Math.min(parseInt(req.query.w, 10) || 800, 2000));
    const quality = Math.max(40, Math.min(parseInt(req.query.q, 10) || 75, 95));
    const format = req.query.f === 'jpeg' ? 'jpeg' : 'webp';

    const originalPath = normalizeUploadPath(src);
    if (!originalPath) return res.status(400).json({ error: 'Invalid image source' });
    if (!fs.existsSync(originalPath)) return res.status(404).json({ error: 'Image not found' });

    const parsed = path.parse(originalPath);
    const cacheName = `${parsed.name}-w${width}-q${quality}.${format}`;
    const cachePath = path.join(cacheRoot, cacheName);

    // ETag based on original file mtime + params
    const stat = fs.statSync(originalPath);
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
