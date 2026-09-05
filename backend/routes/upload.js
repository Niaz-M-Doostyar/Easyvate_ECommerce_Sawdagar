const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const { authenticate, requireRole } = require('../middleware/auth');
const { processCatalogUpload } = require('../lib/productImageProcessor');
const uploadsRoot = path.resolve(process.env.UPLOADS_DIR || path.join(__dirname, '../uploads'));

const uploadTypes = {
  'image/jpeg': { extension: '.jpg', formats: ['jpeg'] },
  'image/jpg': { extension: '.jpg', formats: ['jpeg'] },
  'image/png': { extension: '.png', formats: ['png'] },
  'image/gif': { extension: '.gif', formats: ['gif'] },
  'image/webp': { extension: '.webp', formats: ['webp'] },
  'image/heic': { extension: '.heic', formats: ['heif', 'avif'] },
  'image/heif': { extension: '.heif', formats: ['heif', 'avif'] },
  'image/avif': { extension: '.avif', formats: ['heif', 'avif'] },
};

async function removeUploadedFiles(files = []) {
  await Promise.all(files.filter(Boolean).map((file) => fs.promises.unlink(file.path).catch(() => {})));
}

async function validateUploadedImage(file) {
  const declared = uploadTypes[String(file?.mimetype || '').toLowerCase()];
  if (!file || !declared) throw Object.assign(new Error('Unsupported image type.'), { statusCode: 400 });

  try {
    const metadata = await sharp(file.path, { animated: true }).metadata();
    if (!metadata.width || !metadata.height || !declared.formats.includes(metadata.format)) {
      throw new Error('The uploaded file contents do not match its declared image type.');
    }
  } catch (error) {
    throw Object.assign(new Error(error.message || 'The uploaded file is not a valid image.'), { statusCode: 400 });
  }
}

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
    cb(null, uploadsRoot);
  },
  filename: (req, file, cb) => {
    const ext = uploadTypes[String(file.mimetype || '').toLowerCase()]?.extension || '.img';
    cb(null, `${uuidv4()}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const mimetype = String(file.mimetype || '').toLowerCase();
  if (uploadTypes[mimetype]) {
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
router.post('/', authenticate, requireRole('admin', 'supplier'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    await validateUploadedImage(req.file);

    if (shouldTransformUpload(req)) {
      const processedFile = await processCatalogUpload(req.file);
      return res.json(processedFile);
    }

    const url = `/uploads/${req.file.filename}`;
    res.json({ url, filename: req.file.filename });
  } catch (err) {
    await removeUploadedFiles([req.file]);
    res.status(err.statusCode || 500).json({ error: err.statusCode ? err.message : 'Failed to upload file' });
  }
});

// POST /api/upload/multiple
router.post('/multiple', authenticate, requireRole('admin', 'supplier'), upload.array('files', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    await Promise.all(req.files.map(validateUploadedImage));

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
    await removeUploadedFiles(req.files);
    res.status(err.statusCode || 500).json({ error: err.statusCode ? err.message : 'Failed to upload files' });
  }
});

module.exports = router;
