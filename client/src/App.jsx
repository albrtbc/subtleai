import { useState, useCallback, useRef, useEffect } from 'react';
import Header from './components/Header';
import DropZone from './components/DropZone';
import LanguageSelector from './components/LanguageSelector';
import ApiKeyInput from './components/ApiKeyInput';
import AutoDownloadToggle from './components/AutoDownloadToggle';
import FileJobList from './components/FileJobList';
import { transcribe, getServerConfig } from './services/api';
import { useJobQueue } from './hooks/useJobQueue';

const MAX_CONCURRENT = 3;

export default function App() {
  const [sourceLanguage, setSourceLanguage] = useState('auto');
  const [outputLanguage, setOutputLanguage] = useState('en');
  const [groqKey, setGroqKey] = useState(
    () => sessionStorage.getItem('groq_api_key') || '',
  );
  const [autoDownload, setAutoDownload] = useState(
    () => localStorage.getItem('auto_download') !== 'false',
  );
  const [serverHasApiKey, setServerHasApiKey] = useState(false);
  const [configLoaded, setConfigLoaded] = useState(false);

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
  const lastProcessingCountRef = useRef(0);
  const abortControllersRef = useRef(new Map());

  // Check if server has API key configured on mount
  useEffect(() => {
    getServerConfig()
      .then((config) => {
        setServerHasApiKey(config.hasGroqApiKey);
        setConfigLoaded(true);
      })
      .catch(() => {
        setConfigLoaded(true);
      });
  }, []);

  useEffect(() => {
    jobsRef.current = jobs;

    // Only auto-trigger when a job completes/fails (processing count decreased)
    // Not when new jobs are added (pending count increased)
    const processingCount = jobs.filter((j) => j.status === 'processing').length;
    const hadProcessing = lastProcessingCountRef.current > 0;
    const hasProcessing = processingCount > 0;

    if (hadProcessing && !hasProcessing) {
      // A job just finished, process next in queue
      processNextJobsRef.current?.();
    }

    lastProcessingCountRef.current = processingCount;
  }, [jobs]);

  // Setup ref functions in effect to avoid ref access during render
  useEffect(() => {
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
      jobsRef.current = jobsRef.current.map((j) =>
        j.id === job.id ? { ...j, status: 'processing', startTime: Date.now() } : j,
      );
      updateJobStatus(job.id, 'processing');
      updateJobProgress(job.id, { step: 'uploading', message: 'Uploading...', uploadPercent: 0 });

      const abortController = new AbortController();
      abortControllersRef.current.set(job.id, abortController);

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
            uploadPercent: event.uploadPercent,
          });
        }, job.id, { signal: abortController.signal });

        updateJobResult(job.id, {
          jobId: result.jobId,
          detectedLanguage: result.detectedLanguage,
          duration: result.duration,
        });
      } catch (err) {
        if (!abortController.signal.aborted) {
          updateJobError(job.id, err.message || 'An error occurred');
        }
      } finally {
        abortControllersRef.current.delete(job.id);
      }
    };
  }, [sourceLanguage, outputLanguage, groqKey, updateJobStatus, updateJobProgress, updateJobResult, updateJobError]);

  // Stable function references that delegate to refs
  const processNextJobs = useCallback(() => {
    if (processNextJobsRef.current) {
      processNextJobsRef.current();
    }
  }, []);

  const handleFilesSelected = useCallback(
    (files) => {
      addJobs(files);
    },
    [addJobs],
  );

  const handleRemoveJob = useCallback((jobId) => {
    const controller = abortControllersRef.current.get(jobId);
    if (controller) {
      controller.abort();
      abortControllersRef.current.delete(jobId);
    }
    removeJob(jobId);
  }, [removeJob]);

  const handleRetry = useCallback(
    (jobId) => {
      retryJob(jobId);
      setTimeout(() => processNextJobsRef.current(), 0);
    },
    [retryJob],
  );

  const handleGroqKeyChange = useCallback((key) => {
    setGroqKey(key);
    // Use sessionStorage instead of localStorage for security
    // Session storage is cleared when browser closes
    sessionStorage.setItem('groq_api_key', key);
  }, []);

  const handleAutoDownloadChange = useCallback((value) => {
    setAutoDownload(value);
    localStorage.setItem('auto_download', String(value));
  }, []);

  const isProcessing = jobs.some((j) => j.status === 'processing');
  const pendingCount = getPendingJobs().length;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <Header />
      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {configLoaded && !serverHasApiKey && (
          <ApiKeyInput value={groqKey} onChange={handleGroqKeyChange} />
        )}
        {configLoaded && serverHasApiKey && (
          <div className="bg-green-500/10 border border-green-700/50 rounded-lg p-4">
            <p className="text-sm text-green-400">
              ✓ API key configured on server - no configuration needed
            </p>
          </div>
        )}
        <DropZone onFilesSelect={handleFilesSelected} disabled={isProcessing} />
        <LanguageSelector
          sourceLanguage={sourceLanguage}
          outputLanguage={outputLanguage}
          onSourceChange={setSourceLanguage}
          onOutputChange={setOutputLanguage}
          disabled={isProcessing}
        />
        <AutoDownloadToggle
          autoDownload={autoDownload}
          onChange={handleAutoDownloadChange}
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
          onRemoveJob={handleRemoveJob}
          onRetryJob={handleRetry}
          onClearCompleted={clearCompleted}
          onCancelPending={cancelPending}
          autoDownload={autoDownload}
        />
      </main>
    </div>
  );
}
