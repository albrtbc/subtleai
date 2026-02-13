/**
 * Fetch server configuration (without exposing secrets)
 * @returns {Promise<{hasGroqApiKey: boolean}>}
 */
export async function getServerConfig() {
  try {
    const response = await fetch('/api/config');
    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }
    return await response.json();
  } catch (err) {
    console.error('Failed to fetch server config:', err);
    return { hasGroqApiKey: false }; // Default to safe state
  }
}

/**
 * Streams the transcription request and calls onProgress for each server event.
 * Uses NDJSON streaming (one JSON object per line).
 *
 * @param {FormData} formData
 * @param {(event: object) => void} onProgress
 * @param {string} [jobId] - Optional job ID for server-side storage
 * @returns {Promise<{srt: string, jobId: string, detectedLanguage: string, duration: number}>}
 */
export async function transcribe(formData, onProgress, jobId, { signal } = {}) {
  if (jobId) {
    formData.append('jobId', jobId);
  }

  // Create AbortController for timeout (30 minutes max for large files)
  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => timeoutController.abort(), 30 * 60 * 1000);

  // Combine external signal (user cancel) with timeout signal
  const combinedSignal = signal
    ? AbortSignal.any([signal, timeoutController.signal])
    : timeoutController.signal;

  try {
    const response = await fetch('/api/transcribe', {
      method: 'POST',
      body: formData,
      signal: combinedSignal,
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
  } catch (err) {
    if (err.name === 'AbortError') {
      if (signal?.aborted) {
        throw new Error('Request was cancelled');
      }
      throw new Error('Request timeout - processing took too long (max 30 minutes)');
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}
