const express = require('express');
const fs = require('fs');
const router = express.Router();
const upload = require('../middleware/upload');
const whisperService = require('../services/whisper');
const srtFormatter = require('../services/srtFormatter');
const srtRestructurer = require('../services/srtRestructurer');
const translator = require('../services/translator');
const storageManager = require('../services/storageManager');
const videoConverter = require('../services/videoConverter');
const { isValidLanguage } = require('../config/languages');

function sendProgress(res, data) {
  if (res.writableEnded) return;
  try {
    res.write(JSON.stringify({ type: 'progress', ...data }) + '\n');
  } catch {
    // Client disconnected, ignore
  }
}

function sendResult(res, data) {
  if (res.writableEnded) return;
  try {
    res.write(JSON.stringify({ type: 'result', ...data }) + '\n');
    res.end();
  } catch {
    // Client disconnected, ignore
  }
}

function sendError(res, error) {
  if (res.writableEnded) return;
  try {
    res.write(JSON.stringify({ type: 'error', error }) + '\n');
    res.end();
  } catch {
    // Client disconnected, ignore
  }
}

function checkCancelled(signal) {
  if (signal.aborted) {
    const err = new Error('Job cancelled');
    err.code = 'CANCELLED';
    throw err;
  }
}

router.post('/', upload.single('audio'), async (req, res) => {
  res.setHeader('Content-Type', 'application/x-ndjson');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Transfer-Encoding', 'chunked');

  // Cancellation support: abort when client disconnects
  const abortController = new AbortController();
  const signal = abortController.signal;

  res.on('close', () => {
    if (!res.writableFinished) {
      console.log('[pipeline] Client disconnected, cancelling job');
      abortController.abort();
    }
  });

  let audioPath = null;

  try {
    const file = req.file;
    if (!file) {
      sendError(res, 'No audio file provided');
      return;
    }

    const groqApiKey = req.body.groqApiKey || process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      fs.unlink(file.path, () => {});
      sendError(res, 'No Groq API key configured. Set it in the app or in the server .env file.');
      return;
    }

    const { sourceLanguage, outputLanguage, jobId } = req.body;

    // Validate languages
    if (sourceLanguage && !isValidLanguage(sourceLanguage)) {
      fs.unlink(file.path, () => {});
      return res.status(400).json({ error: `Invalid source language: ${sourceLanguage}` });
    }
    if (outputLanguage && !isValidLanguage(outputLanguage)) {
      fs.unlink(file.path, () => {});
      return res.status(400).json({ error: `Invalid output language: ${outputLanguage}` });
    }

    // Step 0: Extract audio if video file
    audioPath = file.path;
    if (videoConverter.isVideo(file.originalname, file.mimetype)) {
      sendProgress(res, {
        step: 'transcribing',
        message: 'Extracting audio from video...',
        chunk: 0,
        totalChunks: 0,
      });
      audioPath = await videoConverter.extractAudio(file.path);
    }

    checkCancelled(signal);

    // Step 1: Transcribe with Whisper large-v3 via Groq
    sendProgress(res, {
      step: 'transcribing',
      message: 'Starting transcription...',
      chunk: 0,
      totalChunks: 0,
    });

    const transcription = await whisperService.transcribe(
      audioPath,
      sourceLanguage,
      groqApiKey,
      ({ chunk, totalChunks }) => {
        sendProgress(res, {
          step: 'transcribing',
          message: totalChunks > 1
            ? `Transcribing chunk ${chunk} of ${totalChunks}...`
            : 'Transcribing audio...',
          chunk,
          totalChunks,
        });
      },
      signal,
    );

    checkCancelled(signal);

    // Step 2: Format to SRT
    let srtContent = srtFormatter.toSrt(transcription.segments);
    const lastSeg = transcription.segments[transcription.segments.length - 1];
    console.log(`[pipeline] After transcription: ${transcription.segments.length} segments, last ends at ${lastSeg ? lastSeg.end.toFixed(1) : 0}s`);

    checkCancelled(signal);

    // Step 3: Translate if needed
    const detectedLanguage = transcription.language;
    const needsTranslation = outputLanguage
      && sourceLanguage
      && outputLanguage !== sourceLanguage
      && sourceLanguage !== 'auto';
    const shouldTranslate = needsTranslation
      || (sourceLanguage === 'auto' && outputLanguage && outputLanguage !== detectedLanguage);

    if (shouldTranslate) {
      sendProgress(res, {
        step: 'translating',
        message: `Translating subtitles to ${outputLanguage}...`,
      });
      srtContent = await translator.translate(srtContent, detectedLanguage, outputLanguage, groqApiKey, signal);
      const afterTranslate = srtFormatter.parseSrt(srtContent);
      const lastTransSeg = afterTranslate[afterTranslate.length - 1];
      console.log(`[pipeline] After translation: ${afterTranslate.length} segments, last ends at ${lastTransSeg ? lastTransSeg.end.toFixed(1) : 0}s`);
    }

    checkCancelled(signal);

    // Step 4: Restructure (after translation so it accounts for translated text length)
    sendProgress(res, {
      step: 'restructuring',
      message: 'Restructuring subtitles for readability...',
    });

    const segments = srtFormatter.parseSrt(srtContent);
    const restructured = srtRestructurer.restructure(segments);
    srtContent = srtFormatter.toSrt(restructured);
    const lastResSeg = restructured[restructured.length - 1];
    console.log(`[pipeline] After restructure: ${restructured.length} segments, last ends at ${lastResSeg ? lastResSeg.end.toFixed(1) : 0}s`);

    // Save SRT to storage if jobId provided
    if (jobId) {
      storageManager.saveSrt(jobId, srtContent, {
        originalFilename: file.originalname,
        detectedLanguage,
        duration: transcription.duration,
      });
    }

    // Cleanup uploaded file and extracted audio if it exists
    fs.unlink(file.path, () => {});
    if (audioPath !== file.path) {
      fs.unlink(audioPath, () => {});
    }

    sendResult(res, {
      srt: srtContent,
      jobId: jobId || null,
      detectedLanguage,
      duration: transcription.duration,
    });
  } catch (err) {
    if (req.file) fs.unlink(req.file.path, () => {});
    if (audioPath && audioPath !== req.file?.path) {
      fs.unlink(audioPath, () => {});
    }

    if (err.code === 'CANCELLED' || signal.aborted) {
      console.log('[pipeline] Job cancelled, cleaned up temp files');
      if (!res.writableEnded) res.end();
      return;
    }

    console.error(err);
    sendError(res, err.message || 'Internal server error');
  }
});

module.exports = router;
