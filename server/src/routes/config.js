const express = require('express');
const router = express.Router();

/**
 * GET /api/config
 * Returns configuration info without exposing secrets
 */
router.get('/', (req, res) => {
  res.json({
    hasGroqApiKey: !!process.env.GROQ_API_KEY,
  });
});

module.exports = router;
