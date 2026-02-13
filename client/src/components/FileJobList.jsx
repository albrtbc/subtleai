import FileJobItem from './FileJobItem';

export default function FileJobList({
  jobs,
  onRemoveJob,
  onRetryJob,
  onClearCompleted,
  onCancelPending,
  autoDownload,
}) {
  if (jobs.length === 0) return null;

  const completedCount = jobs.filter((j) => j.status === 'completed').length;
  const errorCount = jobs.filter((j) => j.status === 'error').length;
  const processingCount = jobs.filter((j) => j.status === 'processing').length;
  const pendingCount = jobs.filter((j) => j.status === 'pending').length;
  const finishedCount = completedCount + errorCount;

  return (
    <div className="space-y-3">
      {/* Header with progress and batch controls */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-400">
          {processingCount > 0 && (
            <>Processing {processingCount} of {jobs.length} file{jobs.length > 1 ? 's' : ''}...</>
          )}
          {processingCount === 0 && pendingCount > 0 && (
            <>{pendingCount} file{pendingCount > 1 ? 's' : ''} queued</>
          )}
          {processingCount === 0 && pendingCount === 0 && finishedCount > 0 && (
            <>All files complete &mdash; {completedCount} succeeded{errorCount > 0 ? `, ${errorCount} failed` : ''}</>
          )}
        </p>
        <div className="flex gap-2">
          {pendingCount > 0 && (
            <button
              onClick={onCancelPending}
              className="text-xs px-2 py-1 text-gray-400 hover:text-gray-200 bg-gray-800 hover:bg-gray-700 rounded transition-colors"
            >
              Cancel Pending
            </button>
          )}
          {finishedCount > 0 && (
            <button
              onClick={onClearCompleted}
              className="text-xs px-2 py-1 text-gray-400 hover:text-gray-200 bg-gray-800 hover:bg-gray-700 rounded transition-colors"
            >
              Clear Finished
            </button>
          )}
        </div>
      </div>

      {/* Job list */}
      <div className="space-y-2">
        {jobs.map((job) => (
          <FileJobItem
            key={job.id}
            job={job}
            onRemove={() => onRemoveJob(job.id)}
            onRetry={() => onRetryJob(job.id)}
            autoDownload={autoDownload}
          />
        ))}
      </div>
    </div>
  );
}
