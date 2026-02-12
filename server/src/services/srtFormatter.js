function formatTimestamp(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const millis = Math.round((seconds % 1) * 1000);

  return (
    String(hours).padStart(2, '0') + ':' +
    String(minutes).padStart(2, '0') + ':' +
    String(secs).padStart(2, '0') + ',' +
    String(millis).padStart(3, '0')
  );
}

function parseTimestamp(ts) {
  const match = ts.trim().match(/(\d+):(\d+):(\d+)[,.](\d+)/);
  if (!match) return 0;
  return (
    parseInt(match[1]) * 3600 +
    parseInt(match[2]) * 60 +
    parseInt(match[3]) +
    parseInt(match[4]) / 1000
  );
}

function toSrt(segments) {
  return segments
    .map((segment, index) => {
      const start = formatTimestamp(segment.start);
      const end = formatTimestamp(segment.end);
      const text = segment.text.trim();
      return `${index + 1}\n${start} --> ${end}\n${text}`;
    })
    .join('\n\n') + '\n';
}

/**
 * Parse SRT text back into an array of { start, end, text } segments.
 */
function parseSrt(srtContent) {
  const blocks = srtContent.trim().split(/\n\s*\n/);
  const segments = [];

  for (const block of blocks) {
    const lines = block.trim().split('\n');
    if (lines.length < 3) continue;

    // Find the timestamp line (contains "-->")
    const tsLineIndex = lines.findIndex((l) => l.includes('-->'));
    if (tsLineIndex === -1) continue;

    const tsParts = lines[tsLineIndex].split('-->');
    if (tsParts.length !== 2) continue;

    const start = parseTimestamp(tsParts[0]);
    const end = parseTimestamp(tsParts[1]);
    const text = lines.slice(tsLineIndex + 1).join('\n').trim();

    if (text) {
      segments.push({ start, end, text });
    }
  }

  return segments;
}

module.exports = { toSrt, parseSrt, formatTimestamp, parseTimestamp };
