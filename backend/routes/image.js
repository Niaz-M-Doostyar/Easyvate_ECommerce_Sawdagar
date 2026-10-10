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
    const social = req.query.fit === 'social';
    const width = social ? 1200 : nearestAllowed(req.query.w, allowedWidths, 800);
    const quality = social ? 75 : nearestAllowed(req.query.q, allowedQualities, 60);
    const format = social || req.query.f === 'jpeg' ? 'jpeg' : 'webp';

    const lossless = format === 'webp' && req.query.lossless === '1';

    const originalPath = normalizeUploadPath(src);
    if (!originalPath) return res.status(400).json({ error: 'Invalid image source' });
    if (!fs.existsSync(originalPath)) return res.status(404).json({ error: 'Image not found' });

    const parsed = path.parse(originalPath);
    const stat = fs.statSync(originalPath);
    const sourceVersion = Math.round(stat.mtimeMs).toString(36);
    const recipe = social ? 'social-v1-1200x630' : `w${width}-${lossless ? 'lossless-v1' : `q${quality}`}`;
    const cacheName = `${parsed.name}-${sourceVersion}-${recipe}.${format}`;
    const cachePath = path.join(cacheRoot, cacheName);

    // ETag based on original file mtime + params
    const etag = `"${stat.mtimeMs}-${recipe}-${format}"`;
    res.setHeader('ETag', etag);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    if (req.headers['if-none-match'] === etag) {
      return res.status(304).end();
    }

    if (!fs.existsSync(cachePath)) {
      // Deduplicate concurrent requests for the same conversion
      if (!pending.has(cacheName)) {
        const promise = (async () => {
          if (social) {
            // Social clients need a small, opaque raster instead of the upload.
            // Keep the entire product visible and bound every preview's size.
            const pipeline = sharp(originalPath).rotate()
              .flatten({ background: '#ffffff' })
              .resize(1200, 630, { fit: 'contain', background: '#ffffff' });
            for (const previewQuality of [75, 60, 45, 30, 20]) {
              const buffer = await pipeline.clone().jpeg({ quality: previewQuality, progressive: true, mozjpeg: true }).toBuffer();
              if (buffer.length <= 280000) {
                const temporaryPath = `${cachePath}.${process.pid}.tmp`;
                await fs.promises.writeFile(temporaryPath, buffer);
                await fs.promises.rename(temporaryPath, cachePath);
                return;
              }
            }
            throw new Error('Preview image exceeds size limit');
          }
          const pipeline = sharp(originalPath).rotate()
            .resize({ width, withoutEnlargement: true, fit: 'inside' });
          const temporaryPath = `${cachePath}.${process.pid}.tmp`;
          try {
            await (format === 'jpeg'
              ? pipeline.jpeg({ quality, progressive: true, mozjpeg: true }).toFile(temporaryPath)
              : pipeline.webp({ quality, lossless, effort: 4 }).toFile(temporaryPath));
            await fs.promises.rename(temporaryPath, cachePath);
          } finally {
            await fs.promises.unlink(temporaryPath).catch(() => {});
          }
        })();

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
