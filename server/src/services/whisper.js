const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFile } = require('child_process');
const { promisify } = require('util');
const OpenAI = require('openai');

const execFileAsync = promisify(execFile);
const MAX_CHUNK_SIZE = 24 * 1024 * 1024;

const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';

async function getAudioDuration(filePath) {
  const { stdout } = await execFileAsync('ffprobe', [
    '-v', 'error',
    '-show_entries', 'format=duration',
    '-of', 'default=noprint_wrappers=1:nokey=1',
    filePath,
  ]);
  return parseFloat(stdout.trim());
}

async function splitAudio(filePath, chunkDurationSecs) {
  const tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'srt-chunk-'));
  const outputPattern = path.join(tmpDir, 'chunk_%03d.mp3');

  await execFileAsync('ffmpeg', [
    '-i', filePath,
    '-f', 'segment',
    '-segment_time', String(chunkDurationSecs),
    '-c:a', 'libmp3lame',
    '-q:a', '4',
    '-y',
    outputPattern,
  ], { timeout: 600000 });

  const files = (await fs.promises.readdir(tmpDir))
    .filter((f) => f.startsWith('chunk_'))
    .sort();

  return {
    tmpDir,
    chunks: files.map((f) => path.join(tmpDir, f)),
  };
}

async function cleanupDir(dirPath) {
  try {
    const files = await fs.promises.readdir(dirPath);
    for (const file of files) {
      await fs.promises.unlink(path.join(dirPath, file));
    }
    await fs.promises.rmdir(dirPath);
  } catch {
    // best-effort
  }
}

// Known Whisper hallucination phrases
const HALLUCINATION_PATTERNS = [
  /^sub(t[ií]tul|scri)/i,
  /^subt[ií]tulos?\s+(por|de|provided|realizado)/i,
  /^thanks?\s+for\s+watch/i,
  /^thank\s+you\s+for\s+watch/i,
  /^please\s+subscribe/i,
  /^subscribe\s+(to|and)/i,
  /^like\s+and\s+subscribe/i,
  /^amara\.org/i,
  /^www\./i,
  /^translated\s+by/i,
  /^captioned\s+by/i,
  /^copyright/i,
  /^\[m[uú]sica\]$/i,
  /^\[music\]$/i,
  /^\[aplausos\]$/i,
  /^\[applause\]$/i,
  /^\[risas?\]$/i,
  /^\[laughter\]$/i,
  /^gracias\s+por\s+ver/i,
  /^nos\s+vemos/i,
  /^hasta\s+(la\s+pr[oó]xima|luego|pronto)\.?$/i,
];

function normalize(text) {
  return text.trim().toLowerCase().replace(/[.,!?¡¿;:\s]+/g, ' ').trim();
}

/**
 * Filter hallucinated segments:
 * 1. no_speech_prob > 0.3 — likely no real speech
 * 2. compression_ratio > 2.4 — repetitive/hallucinated text
 * 3. Known hallucination phrase patterns
 * 4. Consecutive repetition — same text appearing 2+ times in a row
 */
function filterHallucinations(segments) {
  if (!segments || segments.length === 0) return [];

  const before = segments.length;

  // Step 1: Mark segments that match individual filters
  const marked = segments.map((seg) => {
    const text = (seg.text || '').trim();
    let dominated = false;
    let reason = '';

    if (!text) {
      dominated = true;
      reason = 'empty';
    } else if (seg.no_speech_prob != null && seg.no_speech_prob > 0.6) {
      dominated = true;
      reason = `no_speech_prob=${seg.no_speech_prob.toFixed(2)}`;
    } else if (seg.compression_ratio != null && seg.compression_ratio > 2.4) {
      dominated = true;
      reason = `compression_ratio=${seg.compression_ratio.toFixed(2)}`;
    } else if (HALLUCINATION_PATTERNS.some((p) => p.test(text))) {
      dominated = true;
      reason = 'pattern match';
    }

    return { ...seg, _dominated: dominated, _reason: reason };
  });

  // Step 2: Detect consecutive repetitions (same normalized text 2+ times in a row)
  // Group runs of identical text
  let i = 0;
  while (i < marked.length) {
    const norm = normalize(marked[i].text || '');
    if (!norm) { i++; continue; }

    // Find the run of identical text
    let j = i + 1;
    while (j < marked.length && normalize(marked[j].text || '') === norm) {
      j++;
    }

    const runLength = j - i;
    if (runLength >= 2) {
      // All segments in this run are hallucinations
      for (let k = i; k < j; k++) {
        marked[k]._dominated = true;
        marked[k]._reason = `repeated ${runLength}x`;
      }
    }

    i = j;
  }

  // Step 3: Also detect non-consecutive repetitions — if the same text appears
  // in many segments throughout the audio, it's likely hallucination
  const textCounts = {};
  for (const seg of marked) {
    if (seg._dominated) continue;
    const norm = normalize(seg.text || '');
    if (!norm) continue;
    textCounts[norm] = (textCounts[norm] || 0) + 1;
  }

  for (const seg of marked) {
    if (seg._dominated) continue;
    const norm = normalize(seg.text || '');
    // If the exact same text appears 4+ times across the whole file, it's suspect
    if (textCounts[norm] >= 4) {
      seg._dominated = true;
      seg._reason = `appears ${textCounts[norm]}x total`;
    }
  }

  // Step 4: Filter and log
  const filtered = marked.filter((seg) => {
    if (seg._dominated) {
      console.log(`  [hallucination] Removed (${seg._reason}): "${(seg.text || '').trim().substring(0, 60)}"`);
      return false;
    }
    return true;
  });

  if (before !== filtered.length) {
    console.log(`  Filtered ${before - filtered.length} hallucinated segments (${before} -> ${filtered.length})`);
  }

  return filtered;
}

async function transcribeSingle(groq, filePath, language, signal) {
  const params = {
    file: fs.createReadStream(filePath),
    model: 'whisper-large-v3',
    response_format: 'verbose_json',
    timestamp_granularities: ['segment'],
  };

  if (language && language !== 'auto') {
    params.language = language;
  }

  const options = signal ? { signal } : {};
  return groq.audio.transcriptions.create(params, options);
}

/**
 * @param {string} filePath
 * @param {string} language
 * @param {string} groqApiKey
 * @param {(info: {chunk: number, totalChunks: number}) => void} [onProgress]
 */
async function transcribe(filePath, language, groqApiKey, onProgress, signal) {
  const groq = new OpenAI({
    apiKey: groqApiKey,
    baseURL: GROQ_BASE_URL,
  });

  const fileSize = (await fs.promises.stat(filePath)).size;
  const totalDuration = await getAudioDuration(filePath);
  const chunkDuration = 600; // 10 minutes

  const needsChunking = fileSize > MAX_CHUNK_SIZE || totalDuration > chunkDuration;

  // Short & small file — send directly
  if (!needsChunking) {
    console.log(`File is ${(fileSize / 1024 / 1024).toFixed(1)}MB, ${totalDuration.toFixed(1)}s — sending directly`);
    if (onProgress) onProgress({ chunk: 1, totalChunks: 1 });
    const response = await transcribeSingle(groq, filePath, language, signal);
    const segments = filterHallucinations(response.segments || []);
    return {
      language: response.language,
      duration: response.duration,
      segments,
      text: segments.map((s) => s.text).join(''),
    };
  }

  // Large or long file — split into chunks, transcribe each, merge results
  console.log(`File is ${(fileSize / 1024 / 1024).toFixed(1)}MB, ${totalDuration.toFixed(1)}s — splitting into ${chunkDuration}s chunks...`);

  const { tmpDir, chunks } = await splitAudio(filePath, chunkDuration);

  console.log(`Split into ${chunks.length} chunks`);

  try {
    const allSegments = [];
    let detectedLanguage = null;
    let totalDur = 0;
    let timeOffset = 0;

    for (let i = 0; i < chunks.length; i++) {
      if (signal?.aborted) {
        const err = new Error('Job cancelled');
        err.code = 'CANCELLED';
        throw err;
      }

      console.log(`Transcribing chunk ${i + 1}/${chunks.length}...`);
      if (onProgress) onProgress({ chunk: i + 1, totalChunks: chunks.length });

      const chunkDur = await getAudioDuration(chunks[i]);
      const response = await transcribeSingle(groq, chunks[i], language, signal);

      if (!detectedLanguage) {
        detectedLanguage = response.language;
      }

      const chunkSegmentCount = response.segments ? response.segments.length : 0;
      console.log(`  Chunk ${i + 1}: ${chunkDur.toFixed(1)}s, ${chunkSegmentCount} segments, offset=${timeOffset.toFixed(1)}s`);

      if (response.segments) {
        for (const segment of response.segments) {
          allSegments.push({
            ...segment,
            start: segment.start + timeOffset,
            end: segment.end + timeOffset,
          });
        }
      }

      timeOffset += chunkDur;
      totalDur += chunkDur;
    }

    const filtered = filterHallucinations(allSegments);
    console.log(`Total segments: ${filtered.length}, total duration: ${totalDur.toFixed(1)}s`);

    return {
      language: detectedLanguage,
      duration: totalDur,
      segments: filtered,
      text: filtered.map((s) => s.text).join(''),
    };
  } finally {
    await cleanupDir(tmpDir);
  }
}

module.exports = { transcribe };
