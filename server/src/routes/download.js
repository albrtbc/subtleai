const express = require('express');
const router = express.Router();
const storageManager = require('../services/storageManager');

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

router.get('/:jobId', (req, res) => {
  const { jobId } = req.params;

  if (!UUID_RE.test(jobId)) {
    return res.status(400).json({ error: 'Invalid job ID' });
  }

  const srtContent = storageManager.getSrt(jobId);
  if (!srtContent) {
    return res.status(404).json({ error: 'File not found or expired. Please regenerate.' });
  }

  const metadata = storageManager.getMetadata(jobId);
  const filename = metadata?.originalFilename
    ? metadata.originalFilename.replace(/\.[^.]+$/, '.srt')
    : 'subtitles.srt';

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(srtContent);
});

module.exports = router;
