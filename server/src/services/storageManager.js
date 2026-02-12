const fs = require('fs');
const path = require('path');

const SRT_DIR = path.join(__dirname, '../../srt-output');
const EXPIRY_MS = 30 * 60 * 1000; // 30 minutes

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
  try { fs.unlinkSync(srtPath(jobId)); } catch {}
  try { fs.unlinkSync(metaPath(jobId)); } catch {}
}

function cleanupExpired() {
  const now = Date.now();
  let deleted = 0;

  const files = fs.readdirSync(SRT_DIR).filter(f => f.endsWith('.json'));
  for (const file of files) {
    try {
      const meta = JSON.parse(fs.readFileSync(path.join(SRT_DIR, file), 'utf-8'));
      if (now - meta.timestamp > EXPIRY_MS) {
        const jobId = file.replace('.json', '');
        deleteSrt(jobId);
        deleted++;
      }
    } catch {}
  }

  if (deleted > 0) {
    console.log(`[cleanup] Deleted ${deleted} expired SRT file(s)`);
  }
}

module.exports = { saveSrt, getSrt, getMetadata, deleteSrt, cleanupExpired };
