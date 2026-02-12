/**
 * Streams the transcription request and calls onProgress for each server event.
 * Uses NDJSON streaming (one JSON object per line).
 *
 * @param {FormData} formData
 * @param {(event: object) => void} onProgress
 * @param {string} [jobId] - Optional job ID for server-side storage
 * @returns {Promise<{srt: string, jobId: string, detectedLanguage: string, duration: number}>}
 */
export async function transcribe(formData, onProgress, jobId) {
  if (jobId) {
    formData.append('jobId', jobId);
  }
  const response = await fetch('/api/transcribe', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok && !response.body) {
    throw new Error(`Server error: ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let result = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop(); // keep incomplete line in buffer

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const event = JSON.parse(line);
        if (event.type === 'progress' && onProgress) {
          onProgress(event);
        } else if (event.type === 'result') {
          result = event;
        } else if (event.type === 'error') {
          throw new Error(event.error);
        }
      } catch (err) {
        if (err.message && !err.message.startsWith('Unexpected token')) {
          throw err;
        }
      }
    }
  }

  // Process any remaining data in buffer
  if (buffer.trim()) {
    try {
      const event = JSON.parse(buffer);
      if (event.type === 'result') result = event;
      if (event.type === 'error') throw new Error(event.error);
    } catch (err) {
      if (err.message && !err.message.startsWith('Unexpected token')) {
        throw err;
      }
    }
  }

  if (!result) {
    throw new Error('No result received from server');
  }

  return result;
}
