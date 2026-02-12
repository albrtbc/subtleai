import { useState, useCallback, useRef, useEffect } from 'react';
import Header from './components/Header';
import DropZone from './components/DropZone';
import LanguageSelector from './components/LanguageSelector';
import ApiKeyInput from './components/ApiKeyInput';
import FileJobList from './components/FileJobList';
import { transcribe } from './services/api';
import { useJobQueue } from './hooks/useJobQueue';

const MAX_CONCURRENT = 3;

export default function App() {
  const [sourceLanguage, setSourceLanguage] = useState('auto');
  const [outputLanguage, setOutputLanguage] = useState('en');
  const [groqKey, setGroqKey] = useState(
    () => localStorage.getItem('groq_api_key') || '',
  );

  const {
    jobs,
    addJobs,
    removeJob,
    clearCompleted,
    cancelPending,
    updateJobStatus,
    updateJobProgress,
    updateJobResult,
    updateJobError,
    retryJob,
    getProcessingCount,
    getPendingJobs,
  } = useJobQueue();

  // Refs to break circular dependency between processNextJobs <-> processJob
  const jobsRef = useRef(jobs);
  const processJobRef = useRef();
  const processNextJobsRef = useRef();

  useEffect(() => {
    jobsRef.current = jobs;
    // Auto-trigger next jobs processing when jobs array changes
    // (e.g., when a job completes and status updates)
    processNextJobsRef.current?.();
  }, [jobs]);

  // Keep refs updated with latest closures
  processNextJobsRef.current = () => {
    const currentJobs = jobsRef.current;
    const processingCount = currentJobs.filter((j) => j.status === 'processing').length;
    const availableSlots = MAX_CONCURRENT - processingCount;
    if (availableSlots <= 0) return;

    const pending = currentJobs.filter((j) => j.status === 'pending');
    const toStart = pending.slice(0, availableSlots);

    for (const job of toStart) {
      processJobRef.current(job);
    }
  };

  processJobRef.current = async (job) => {
    // Mark as processing in the ref immediately so concurrent calls
    // see the correct count before React state updates
    jobsRef.current = jobsRef.current.map((j) =>
      j.id === job.id ? { ...j, status: 'processing', startTime: Date.now() } : j,
    );
    updateJobStatus(job.id, 'processing');
    updateJobProgress(job.id, { step: 'transcribing', message: 'Uploading...', chunk: 0, totalChunks: 0 });

    const formData = new FormData();
    formData.append('audio', job.file);
    formData.append('sourceLanguage', sourceLanguage);
    formData.append('outputLanguage', outputLanguage);
    if (groqKey) formData.append('groqApiKey', groqKey);

    try {
      const result = await transcribe(formData, (event) => {
        updateJobProgress(job.id, {
          step: event.step,
          message: event.message || '',
          chunk: event.chunk,
          totalChunks: event.totalChunks,
        });
      }, job.id);

      updateJobResult(job.id, {
        jobId: result.jobId,
        detectedLanguage: result.detectedLanguage,
        duration: result.duration,
      });
    } catch (err) {
      updateJobError(job.id, err.message || 'An error occurred');
    }
    // processNextJobs will be called automatically via useEffect when jobs state updates
  };

  // Stable function references that delegate to refs
  const processNextJobs = useCallback(() => processNextJobsRef.current(), []);

  const handleFilesSelected = useCallback(
    (files) => {
      addJobs(files);
    },
    [addJobs],
  );

  const handleRetry = useCallback(
    (jobId) => {
      retryJob(jobId);
      setTimeout(() => processNextJobsRef.current(), 0);
    },
    [retryJob],
  );

  const handleGroqKeyChange = useCallback((key) => {
    setGroqKey(key);
    localStorage.setItem('groq_api_key', key);
  }, []);

  const isProcessing = jobs.some((j) => j.status === 'processing');
  const pendingCount = getPendingJobs().length;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <Header />
      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <ApiKeyInput value={groqKey} onChange={handleGroqKeyChange} />
        <DropZone onFilesSelect={handleFilesSelected} disabled={isProcessing} />
        <LanguageSelector
          sourceLanguage={sourceLanguage}
          outputLanguage={outputLanguage}
          onSourceChange={setSourceLanguage}
          onOutputChange={setOutputLanguage}
          disabled={isProcessing}
        />
        {jobs.length > 0 && (
          <button
            onClick={processNextJobs}
            disabled={isProcessing || pendingCount === 0}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50
                       disabled:cursor-not-allowed rounded-lg font-semibold transition-colors cursor-pointer"
          >
            {isProcessing
              ? `Processing ${getProcessingCount()} file${getProcessingCount() > 1 ? 's' : ''}...`
              : `Generate SRT (${pendingCount} file${pendingCount !== 1 ? 's' : ''})`}
          </button>
        )}
        <FileJobList
          jobs={jobs}
          onRemoveJob={removeJob}
          onRetryJob={handleRetry}
          onClearCompleted={clearCompleted}
          onCancelPending={cancelPending}
        />
      </main>
    </div>
  );
}
