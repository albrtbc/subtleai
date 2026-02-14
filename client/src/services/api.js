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
 * Uploads the file via XMLHttpRequest (for upload progress tracking),
 * then reads the NDJSON streaming response for server-side progress.
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

  // Phase 1: Upload file with progress tracking via XHR
  const response = await uploadWithProgress(formData, onProgress, signal);

  // Phase 2: Read NDJSON streaming response
  return readNdjsonStream(response, onProgress, signal);
}

/**
 * Uploads FormData via XMLHttpRequest to track upload progress.
 * Returns the Response object for streaming.
 */
function uploadWithProgress(formData, onProgress, signal) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    let aborted = false;

    // Handle cancellation
    if (signal) {
      signal.addEventListener('abort', () => {
        aborted = true;
        xhr.abort();
        reject(new Error('Request was cancelled'));
      });
    }

    // Timeout: 60 minutes for very large files
    xhr.timeout = 60 * 60 * 1000;

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        const percent = Math.round((e.loaded / e.total) * 100);
        onProgress({
          type: 'progress',
          step: 'uploading',
          message: `Uploading... ${percent}% (${formatBytes(e.loaded)} / ${formatBytes(e.total)})`,
          uploadPercent: percent,
        });
      }
    };

    xhr.onload = () => {
      if (aborted) return;
      // Convert XHR response to a fetch-like Response for NDJSON reading
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(xhr.responseText));
          controller.close();
        },
      });
      resolve(new Response(stream, {
        status: xhr.status,
        statusText: xhr.statusText,
      }));
    };

    xhr.onerror = () => {
      if (!aborted) reject(new Error('Network error during upload'));
    };

    xhr.ontimeout = () => {
      if (!aborted) reject(new Error('Upload timeout - file too large or connection too slow'));
    };

    // Use responseType text to get full response at once
    xhr.responseType = 'text';
    xhr.open('POST', '/api/transcribe');
    xhr.send(formData);
  });
}

function formatBytes(bytes) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

/**
 * Reads an NDJSON response stream and dispatches progress/result events.
 */
function readNdjsonStream(response, onProgress, signal) {
  return new Promise(async (resolve, reject) => {
    try {
      if (!response.ok && !response.body) {
        throw new Error(`Server error: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let result = null;

      while (true) {
        if (signal?.aborted) throw new Error('Request was cancelled');

        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();

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

      resolve(result);
    } catch (err) {
      reject(err);
    }
  });
}
