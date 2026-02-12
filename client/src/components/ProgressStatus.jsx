const STEPS = [
  { key: 'transcribing', label: 'Transcribe' },
  { key: 'translating', label: 'Translate' },
  { key: 'restructuring', label: 'Restructure' },
  { key: 'done', label: 'Done' },
];

export default function ProgressStatus({ step, message, chunk, totalChunks, error }) {
  if (!step) return null;

  const currentIdx = STEPS.findIndex((s) => s.key === step);
  const isProcessing = step !== 'done' && step !== 'error';

  // Calculate overall progress percentage
  let progressPercent = 0;
  if (step === 'done') {
    progressPercent = 100;
  } else if (step === 'error') {
    progressPercent = 0;
  } else {
    const stepWeight = 100 / (STEPS.length - 1); // exclude 'done' from weight
    const completedSteps = currentIdx;
    let withinStepProgress = 0;

    if (step === 'transcribing' && totalChunks > 0) {
      withinStepProgress = ((chunk - 1) / totalChunks);
    } else if (isProcessing) {
      withinStepProgress = 0.5; // halfway through current step as estimate
    }

    progressPercent = Math.min(99, (completedSteps + withinStepProgress) * stepWeight);
  }

  return (
    <div className="space-y-4">
      {/* Overall progress bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-gray-400">
          <span>{message}</span>
          <span>{Math.round(progressPercent)}%</span>
        </div>
        <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out ${
              step === 'done'
                ? 'bg-green-500'
                : step === 'error'
                  ? 'bg-red-500'
                  : 'bg-indigo-500'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Step indicators */}
      <div className="flex items-center justify-between text-xs">
        {STEPS.map((s, i) => {
          const isActive = s.key === step;
          const isPast = currentIdx > i;
          const isFuture = currentIdx < i;

          return (
            <div key={s.key} className="flex flex-col items-center gap-1 flex-1">
              <div className="flex items-center w-full">
                {/* Connector line before */}
                {i > 0 && (
                  <div
                    className={`h-0.5 flex-1 transition-colors duration-500 ${
                      isPast || isActive ? 'bg-indigo-500' : 'bg-gray-700'
                    }`}
                  />
                )}
                {/* Step circle */}
                <div
                  className={`w-3 h-3 rounded-full flex-shrink-0 transition-all duration-500 ${
                    isActive
                      ? 'bg-indigo-400 ring-4 ring-indigo-400/20'
                      : isPast
                        ? 'bg-green-400'
                        : 'bg-gray-600'
                  }`}
                >
                  {isActive && (
                    <div className="w-full h-full rounded-full animate-ping bg-indigo-400 opacity-50" />
                  )}
                </div>
                {/* Connector line after */}
                {i < STEPS.length - 1 && (
                  <div
                    className={`h-0.5 flex-1 transition-colors duration-500 ${
                      isPast ? 'bg-indigo-500' : 'bg-gray-700'
                    }`}
                  />
                )}
              </div>
              <span
                className={`text-center transition-colors duration-300 ${
                  isActive
                    ? 'text-indigo-300 font-medium'
                    : isPast
                      ? 'text-green-400'
                      : 'text-gray-500'
                }`}
              >
                {s.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Chunk detail for transcription */}
      {step === 'transcribing' && totalChunks > 1 && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-gray-400">
            <span>Chunk progress</span>
            <span>
              {chunk} / {totalChunks}
            </span>
          </div>
          <div className="flex gap-1">
            {Array.from({ length: totalChunks }, (_, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                  i < chunk
                    ? 'bg-indigo-500'
                    : i === chunk
                      ? 'bg-indigo-400 animate-pulse'
                      : 'bg-gray-700'
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Spinner for active processing */}
      {isProcessing && (
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
          <span>This may take several minutes for long audio files</span>
        </div>
      )}

      {/* Success */}
      {step === 'done' && (
        <div className="flex items-center gap-2 text-sm text-green-400">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Transcription complete!
        </div>
      )}

      {/* Error */}
      {step === 'error' && (
        <div className="bg-red-950/50 border border-red-800 rounded-lg p-3 text-sm text-red-300">
          {error}
        </div>
      )}
    </div>
  );
}
