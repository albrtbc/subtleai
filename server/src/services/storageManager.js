const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

const SRT_DIR = path.join(__dirname, '../../srt-output');
const EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

// Ensure output directory exists
if (!fs.existsSync(SRT_DIR)) {
  fs.mkdirSync(SRT_DIR, { recursive: true });
}

function srtPath(jobId) {
  return path.join(SRT_DIR, `${jobId}.srt`);
}

function metaPath(jobId) {
  return path.join(SRT_DIR, `${jobId}.json`);
}

function saveSrt(jobId, srtContent, metadata) {
  fs.writeFileSync(srtPath(jobId), srtContent, 'utf-8');
  fs.writeFileSync(metaPath(jobId), JSON.stringify({ ...metadata, timestamp: Date.now() }), 'utf-8');
}

function getSrt(jobId) {
  const p = srtPath(jobId);
  if (!fs.existsSync(p)) return null;
  return fs.readFileSync(p, 'utf-8');
}

function getMetadata(jobId) {
  const p = metaPath(jobId);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, 'utf-8'));
}

function deleteSrt(jobId) {
  // Safe to ignore errors here - files may not exist yet
  try { fs.unlinkSync(srtPath(jobId)); } catch (err) {
    // File doesn't exist or already deleted - this is expected
  }
  try { fs.unlinkSync(metaPath(jobId)); } catch (err) {
    // Metadata file may not exist - this is expected
  }
}

function cleanupExpired() {
  const now = Date.now();
  let deleted = 0;

  try {
    const files = fs.readdirSync(SRT_DIR).filter(f => f.endsWith('.json'));
    for (const file of files) {
      try {
        const meta = JSON.parse(fs.readFileSync(path.join(SRT_DIR, file), 'utf-8'));
        if (now - meta.timestamp > EXPIRY_MS) {
          const jobId = file.replace('.json', '');
          deleteSrt(jobId);
          deleted++;
        }
      } catch (err) {
        // Skip files that can't be parsed - they may be corrupted
        logger.warn(`Could not parse metadata file: ${file}`, { error: err.message });
      }
    }

    if (deleted > 0) {
      logger.info(`Cleanup completed - deleted ${deleted} expired SRT file(s)`);
    }
  } catch (err) {
    logger.error('Cleanup job failed', { error: err.message });
  }
}

module.exports = { saveSrt, getSrt, getMetadata, deleteSrt, cleanupExpired };
