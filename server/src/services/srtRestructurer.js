/**
 * Restructure SRT segments to follow subtitle best practices:
 *   - Max 2 lines per subtitle, max 42 chars per line (84 total)
 *   - Min display time: 1 second
 *   - Max display time: 7 seconds
 *   - Comfortable reading speed: ~21 chars/second
 *   - Min gap between subtitles: 0.08s
 */

const MAX_CHARS_PER_LINE = 42;
const MAX_LINES = 2;
const MAX_CHARS = MAX_CHARS_PER_LINE * MAX_LINES;
const MIN_DURATION = 1.0;
const MAX_DURATION = 7.0;
const MIN_GAP = 0.08;
const MAX_CPS = 21; // characters per second

function splitTextAtBoundaries(text, maxParts) {
  const trimmed = text.trim();
  if (maxParts <= 1) return [trimmed];

  // Try splitting at sentence boundaries first
  const sentenceSplits = trimmed.split(/(?<=[.!?])\s+/);
  if (sentenceSplits.length >= maxParts) {
    return distributeEvenly(sentenceSplits, maxParts);
  }

  // Try clause boundaries
  const clauseSplits = trimmed.split(/(?<=[,;:\-])\s+/);
  if (clauseSplits.length >= maxParts) {
    return distributeEvenly(clauseSplits, maxParts);
  }

  // Fall back to word boundaries
  const words = trimmed.split(/\s+/);
  return distributeEvenly(words, maxParts);
}

function distributeEvenly(pieces, numGroups) {
  if (pieces.length <= numGroups) {
    return pieces.map((p) => p.trim()).filter(Boolean);
  }

  const totalLen = pieces.reduce((sum, p) => sum + p.length, 0);
  const targetLen = totalLen / numGroups;
  const groups = [];
  let current = [];
  let currentLen = 0;

  for (const piece of pieces) {
    current.push(piece);
    currentLen += piece.length;

    if (currentLen >= targetLen && groups.length < numGroups - 1) {
      groups.push(current.join(' ').trim());
      current = [];
      currentLen = 0;
    }
  }

  if (current.length > 0) {
    groups.push(current.join(' ').trim());
  }

  return groups.filter(Boolean);
}

function wrapLines(text) {
  // Wrap text to max 42 chars per line, max 2 lines
  if (text.length <= MAX_CHARS_PER_LINE) return text;

  const words = text.split(/\s+/);
  const lines = [];
  let currentLine = '';

  for (const word of words) {
    const test = currentLine ? `${currentLine} ${word}` : word;
    if (test.length <= MAX_CHARS_PER_LINE) {
      currentLine = test;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
      if (lines.length >= MAX_LINES - 1) {
        // Put everything remaining on the last line
        const remaining = words.slice(words.indexOf(word)).join(' ');
        lines.push(remaining);
        return lines.slice(0, MAX_LINES).join('\n');
      }
    }
  }
  if (currentLine) lines.push(currentLine);

  return lines.slice(0, MAX_LINES).join('\n');
}

function splitSegment(segment) {
  const text = segment.text.trim();
  const duration = segment.end - segment.start;

  // Determine how many parts we need
  const partsByChars = Math.ceil(text.length / MAX_CHARS);
  const partsByDuration = Math.ceil(duration / MAX_DURATION);
  const partsBySpeed = Math.ceil(text.length / (MAX_CPS * MAX_DURATION));
  const numParts = Math.max(partsByChars, partsByDuration, partsBySpeed, 1);

  if (numParts <= 1 && text.length <= MAX_CHARS && duration <= MAX_DURATION) {
    return [{ start: segment.start, end: segment.end, text: wrapLines(text) }];
  }

  const parts = splitTextAtBoundaries(text, numParts);
  const totalChars = parts.reduce((sum, p) => sum + p.length, 0) || 1;
  const results = [];
  let currentStart = segment.start;

  for (let i = 0; i < parts.length; i++) {
    const partRatio = parts[i].length / totalChars;
    let partDuration = duration * partRatio;
    partDuration = Math.max(partDuration, MIN_DURATION);

    let partEnd = i < parts.length - 1
      ? currentStart + partDuration
      : segment.end; // last part takes remaining time

    // Ensure minimum duration for last part too
    if (partEnd - currentStart < MIN_DURATION && i === parts.length - 1) {
      partEnd = currentStart + MIN_DURATION;
    }

    results.push({
      start: currentStart,
      end: Math.min(partEnd, segment.end + 1), // small grace for rounding
      text: wrapLines(parts[i]),
    });

    currentStart = partEnd + MIN_GAP;
  }

  return results;
}

function restructure(segments) {
  if (!segments || segments.length === 0) return [];

  // Step 1: Split segments that are too long or have too much text
  let processed = [];
  for (const seg of segments) {
    processed.push(...splitSegment(seg));
  }

  // Step 2: Merge segments that are too short (< 0.5s) with their neighbor
  const merged = [];
  for (let i = 0; i < processed.length; i++) {
    const seg = processed[i];
    const duration = seg.end - seg.start;

    if (duration < 0.5 && merged.length > 0) {
      const prev = merged[merged.length - 1];
      const combinedText = `${prev.text.replace('\n', ' ')} ${seg.text.replace('\n', ' ')}`.trim();
      const combinedDuration = seg.end - prev.start;

      // Merge if combined text is short enough and duration is reasonable
      if (combinedText.length <= MAX_CHARS && combinedDuration <= MAX_DURATION) {
        prev.end = seg.end;
        prev.text = wrapLines(combinedText);
        continue;
      }
    }
    merged.push({ ...seg });
  }

  // Step 3: Enforce minimum duration (extend end, but don't overlap next)
  for (let i = 0; i < merged.length; i++) {
    const seg = merged[i];
    const duration = seg.end - seg.start;

    if (duration < MIN_DURATION) {
      const maxEnd = i < merged.length - 1
        ? merged[i + 1].start - MIN_GAP
        : seg.start + MIN_DURATION;
      seg.end = Math.max(seg.end, Math.min(seg.start + MIN_DURATION, maxEnd));
    }
  }

  // Step 4: Ensure minimum gap between subtitles
  for (let i = 0; i < merged.length - 1; i++) {
    const gap = merged[i + 1].start - merged[i].end;
    if (gap < MIN_GAP) {
      merged[i].end = merged[i + 1].start - MIN_GAP;
      // If that made the segment too short, nudge it
      if (merged[i].end - merged[i].start < MIN_DURATION) {
        merged[i].end = merged[i].start + MIN_DURATION;
      }
    }
  }

  return merged;
}

module.exports = { restructure };
