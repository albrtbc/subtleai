const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');
const { promisify } = require('util');

const execFileAsync = promisify(execFile);

/**
 * Detect if file is a video based on extension or MIME type
 */
function isVideo(originalname, mimetype) {
  const videoMimes = ['video/mp4', 'video/webm', 'video/mpeg', 'video/x-matroska', 'application/x-matroska'];
  const videoExts = ['.mp4', '.webm', '.mpeg', '.mkv', '.mov', '.avi', '.flv', '.m4v'];

  const ext = path.extname(originalname).toLowerCase();
  return videoMimes.includes(mimetype) || videoExts.includes(ext);
}

/**
 * Extract audio from video file and save as MP3
 * @param {string} videoPath - Path to video file
 * @returns {Promise<string>} Path to extracted MP3 file
 */
async function extractAudio(videoPath) {
  const dir = path.dirname(videoPath);
  const audioPath = path.join(dir, `audio-${Date.now()}.mp3`);

  console.log(`[videoConverter] Extracting audio from video...`);

  try {
    await execFileAsync('ffmpeg', [
      '-i', videoPath,
      '-vn', // no video
      '-acodec', 'libmp3lame',
      '-q:a', '4', // quality
      '-y', // overwrite
      audioPath,
    ], { timeout: 600000 });

    console.log(`[videoConverter] Audio extracted to ${audioPath}`);
    return audioPath;
  } catch (err) {
    // Cleanup on error
    try {
      fs.unlinkSync(audioPath);
    } catch {}
    throw new Error(`Failed to extract audio from video: ${err.message}`);
  }
}

module.exports = { isVideo, extractAudio };
