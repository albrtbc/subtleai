/**
 * Simple structured logger for SubtleAI
 * Provides consistent logging with timestamps and levels
 */

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

const COLORS = {
  RESET: '\x1b[0m',
  DEBUG: '\x1b[36m', // Cyan
  INFO: '\x1b[32m',  // Green
  WARN: '\x1b[33m',  // Yellow
  ERROR: '\x1b[31m', // Red
};

const currentLevel = LOG_LEVELS[process.env.LOG_LEVEL || 'INFO'];

function formatTimestamp() {
  return new Date().toISOString();
}

function log(level, message, data = null) {
  if (LOG_LEVELS[level] < currentLevel) return;

  const timestamp = formatTimestamp();
  const color = COLORS[level];
  const reset = COLORS.RESET;

  let output = `${color}[${timestamp}] [${level}]${reset} ${message}`;

  if (data) {
    output += ` ${JSON.stringify(data)}`;
  }

  if (level === 'ERROR') {
    console.error(output);
  } else {
    console.log(output);
  }
}

module.exports = {
  debug: (message, data) => log('DEBUG', message, data),
  info: (message, data) => log('INFO', message, data),
  warn: (message, data) => log('WARN', message, data),
  error: (message, data) => log('ERROR', message, data),
};
