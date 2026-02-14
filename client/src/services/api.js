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
 * Resolves with a streaming Response as soon as headers arrive,
 * then streams the response body incrementally via XHR onprogress.
 */
function uploadWithProgress(formData, onProgress, signal) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    let aborted = false;
    let streamController = null;
    let resolved = false;
    let bytesDelivered = 0;

    if (signal) {
      signal.addEventListener('abort', () => {
        aborted = true;
        xhr.abort();
        if (streamController) {
          try { streamController.close(); } catch (_) { /* already closed */ }
        }
        reject(new Error('Request was cancelled'));
      });
    }

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

    xhr.onreadystatechange = () => {
      if (xhr.readyState === XMLHttpRequest.HEADERS_RECEIVED && !resolved && !aborted) {
        resolved = true;
        const stream = new ReadableStream({
          start(controller) {
            streamController = controller;
          },
        });
        resolve(new Response(stream, {
          status: xhr.status,
          statusText: xhr.statusText,
        }));
      }
    };

    xhr.onprogress = () => {
      if (aborted || !streamController) return;
      const newText = xhr.responseText.slice(bytesDelivered);
      if (newText) {
        streamController.enqueue(new TextEncoder().encode(newText));
        bytesDelivered = xhr.responseText.length;
      }
    };

    xhr.onload = () => {
      if (aborted) return;
      if (streamController) {
        const remaining = xhr.responseText.slice(bytesDelivered);
        if (remaining) {
          streamController.enqueue(new TextEncoder().encode(remaining));
        }
        try { streamController.close(); } catch (_) { /* already closed */ }
      }
    };

    xhr.onerror = () => {
      if (!aborted) {
        if (streamController) {
          try { streamController.error(new Error('Network error during upload')); } catch (_) { /* already errored */ }
        }
        if (!resolved) reject(new Error('Network error during upload'));
      }
    };

    xhr.ontimeout = () => {
      if (!aborted) {
        if (streamController) {
          try { streamController.error(new Error('Upload timeout - file too large or connection too slow')); } catch (_) { /* already errored */ }
        }
        if (!resolved) reject(new Error('Upload timeout - file too large or connection too slow'));
      }
    };

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
async function readNdjsonStream(response, onProgress, signal) {
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

  if (signal?.aborted) throw new Error('Request was cancelled');

  if (!result) {
    throw new Error('No result received from server');
  }

  return result;
}
