const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { authenticate } = require('../middleware/auth');
const { processCatalogUpload } = require('../lib/productImageProcessor');

function shouldTransformUpload(req) {
  const transformMode = String(req.body?.transformMode || '').trim().toLowerCase();

  if (req.user?.role === 'supplier') {
    return true;
  }

  return req.user?.role === 'admin' && transformMode === 'product';
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = new Set([
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/heic',
    'image/heif',
    'image/avif',
  ]);
  const mimetype = String(file.mimetype || '').toLowerCase();
  if (allowedTypes.has(mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, WebP, HEIC/HEIF and AVIF are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// POST /api/upload
router.post('/', authenticate, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (shouldTransformUpload(req)) {
      const processedFile = await processCatalogUpload(req.file);
      return res.json(processedFile);
    }

    const url = `/uploads/${req.file.filename}`;
    res.json({ url, filename: req.file.filename });
  } catch (err) {
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// POST /api/upload/multiple
router.post('/multiple', authenticate, upload.array('files', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    if (shouldTransformUpload(req)) {
      const files = await Promise.all(req.files.map((file) => processCatalogUpload(file)));
      return res.json({ files });
    }

    const files = req.files.map((f) => ({
      url: `/uploads/${f.filename}`,
      filename: f.filename,
    }));

    res.json({ files });
  } catch (err) {
    res.status(500).json({ error: 'Failed to upload files' });
  }
});

module.exports = router;
