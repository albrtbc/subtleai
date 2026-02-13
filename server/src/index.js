require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const path = require('path');
const express = require('express');
const cors = require('cors');
const transcribeRouter = require('./routes/transcribe');
const downloadRouter = require('./routes/download');
const cleanup = require('./services/cleanup');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: 'http://localhost:5173' }));
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
  console.error(err);

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'File too large. Maximum size is 10GB.' });
  }

  if (err.message && err.message.includes('Unsupported file type')) {
    return res.status(400).json({ error: err.message });
  }

  res.status(500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
  cleanup.startCleanupJob();
});
