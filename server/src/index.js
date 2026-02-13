require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const path = require('path');
const express = require('express');
const cors = require('cors');
const transcribeRouter = require('./routes/transcribe');
const downloadRouter = require('./routes/download');
const cleanup = require('./services/cleanup');
const logger = require('./utils/logger');

// Validate required environment variables
function validateEnv() {
  const required = ['GROQ_API_KEY'];
  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    logger.error('Missing required environment variables', { missing });
    logger.error('Please set these variables in your .env file:');
    missing.forEach(key => logger.error(`  - ${key}`));
    process.exit(1);
  }

  logger.info('Environment variables validated');
}

validateEnv();

const app = express();
const PORT = process.env.PORT || 3001;

// Validate PORT is a valid number
if (isNaN(PORT) || PORT < 1 || PORT > 65535) {
  logger.error('Invalid PORT value', { PORT });
  process.exit(1);
}

// CORS configuration - use environment variable in production
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';
logger.info('CORS enabled for', { origin: CORS_ORIGIN });
app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json());

app.use('/api/transcribe', transcribeRouter);
app.use('/api/download', downloadRouter);

// Serve built React client in production
const clientDist = path.join(__dirname, '../../client/dist');
app.use(express.static(clientDist));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(clientDist, 'index.html'));
});

app.use((err, req, res, next) => {
  logger.error('Request error', { message: err.message, stack: err.stack });

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'File too large. Maximum size is 10GB.' });
  }

  if (err.message && err.message.includes('Unsupported file type')) {
    return res.status(400).json({ error: err.message });
  }

  res.status(500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, '0.0.0.0', () => {
  logger.info(`SubtleAI server running on http://localhost:${PORT}`);
  cleanup.startCleanupJob();
});
