const express = require('express');
const fs = require('fs');
const router = express.Router();
const upload = require('../middleware/upload');
const whisperService = require('../services/whisper');
const srtFormatter = require('../services/srtFormatter');
const srtRestructurer = require('../services/srtRestructurer');
const translator = require('../services/translator');

function sendProgress(res, data) {
  res.write(JSON.stringify({ type: 'progress', ...data }) + '\n');
}

function sendResult(res, data) {
  res.write(JSON.stringify({ type: 'result', ...data }) + '\n');
  res.end();
}

function sendError(res, error) {
  res.write(JSON.stringify({ type: 'error', error }) + '\n');
  res.end();
}

router.post('/', upload.single('audio'), async (req, res) => {
  res.setHeader('Content-Type', 'application/x-ndjson');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Transfer-Encoding', 'chunked');

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

    const { sourceLanguage, outputLanguage } = req.body;

    // Step 1: Transcribe with Whisper large-v3 via Groq
    sendProgress(res, {
      step: 'transcribing',
      message: 'Starting transcription...',
      chunk: 0,
      totalChunks: 0,
    });

    const transcription = await whisperService.transcribe(
      file.path,
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
    );

    // Step 2: Format to SRT
    let srtContent = srtFormatter.toSrt(transcription.segments);
    const lastSeg = transcription.segments[transcription.segments.length - 1];
    console.log(`[pipeline] After transcription: ${transcription.segments.length} segments, last ends at ${lastSeg ? lastSeg.end.toFixed(1) : 0}s`);

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
      srtContent = await translator.translate(srtContent, detectedLanguage, outputLanguage, groqApiKey);
      const afterTranslate = srtFormatter.parseSrt(srtContent);
      const lastTransSeg = afterTranslate[afterTranslate.length - 1];
      console.log(`[pipeline] After translation: ${afterTranslate.length} segments, last ends at ${lastTransSeg ? lastTransSeg.end.toFixed(1) : 0}s`);
    }

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

    // Cleanup uploaded file
    fs.unlink(file.path, () => {});

    sendResult(res, {
      srt: srtContent,
      detectedLanguage,
      duration: transcription.duration,
    });
  } catch (err) {
    console.error(err);
    if (req.file) fs.unlink(req.file.path, () => {});
    sendError(res, err.message || 'Internal server error');
  }
});

module.exports = router;
