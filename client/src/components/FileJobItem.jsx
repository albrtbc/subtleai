const STEPS = ['transcribing', 'translating', 'restructuring', 'done'];

function ProgressBar({ progress }) {
  if (!progress) return null;

  const { step, chunk, totalChunks } = progress;
  const stepIdx = STEPS.indexOf(step);
  const stepWeight = 100 / (STEPS.length - 1);
  let withinStep = 0;
  if (step === 'transcribing' && totalChunks > 0) {
    withinStep = (chunk - 1) / totalChunks;
  } else {
    withinStep = 0.5;
  }
  const percent = Math.min(99, (stepIdx + withinStep) * stepWeight);

  return (
    <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
      <div
        className="h-full bg-indigo-500 rounded-full transition-all duration-500"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

import { useEffect } from 'react';

export default function FileJobItem({ job, onRemove, onRetry, autoDownload }) {
  useEffect(() => {
    if (autoDownload && job.status === 'completed' && job.id) {
      // Trigger auto-download
      const link = document.createElement('a');
      link.href = `/api/download/${job.id}`;
      link.click();
    }
  }, [job.status, job.id, autoDownload]);
  const statusConfig = {
    pending: { label: 'Queued', color: 'bg-yellow-500/20 text-yellow-400' },
    processing: { label: 'Processing...', color: 'bg-blue-500/20 text-blue-400' },
    completed: { label: 'Ready', color: 'bg-green-500/20 text-green-400' },
    error: { label: 'Failed', color: 'bg-red-500/20 text-red-400' },
  };

  const { label, color } = statusConfig[job.status];

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-gray-200 truncate">{job.file.name}</p>
          <p className="text-xs text-gray-500">{(job.file.size / 1024 / 1024).toFixed(2)} MB</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${color}`}>
            {job.status === 'processing' && (
              <span className="inline-block w-2 h-2 border border-blue-400 border-t-transparent rounded-full animate-spin mr-1 align-middle" />
            )}
            {label}
          </span>
          <button
            onClick={onRemove}
            className="text-gray-500 hover:text-gray-300 text-sm p-1 transition-colors"
            title="Remove"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {job.status === 'processing' && (
        <div className="space-y-1">
          <ProgressBar progress={job.progress} />
          {job.progress?.message && (
            <p className="text-xs text-gray-400">{job.progress.message}</p>
          )}
        </div>
      )}

      {job.status === 'completed' && (
        <a
          href={`/api/download/${job.id}`}
          download
          className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded transition-colors font-medium"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Download SRT
        </a>
      )}

      {job.status === 'error' && (
        <div className="space-y-2">
          <p className="text-xs text-red-400">{job.error}</p>
          <button
            onClick={onRetry}
            className="text-xs px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded transition-colors font-medium"
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );
}
