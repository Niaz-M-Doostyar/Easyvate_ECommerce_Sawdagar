const express = require('express');
const router = express.Router();
const { getLastEmail, getLastEmailError } = require('../lib/email');

// Debug endpoint to view last email attempt (use only in dev)
router.get('/last-email', (req, res) => {
  const last = getLastEmail();
  const error = getLastEmailError();
  res.json({ lastEmail: last, lastError: error ? (error.message || error.toString()) : null });
});

module.exports = router;
