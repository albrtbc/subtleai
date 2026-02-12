const storageManager = require('./storageManager');

const INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

function startCleanupJob() {
  setInterval(() => {
    storageManager.cleanupExpired();
  }, INTERVAL_MS);

  console.log('[cleanup] Cleanup job started (every 5 minutes)');
}

module.exports = { startCleanupJob };
