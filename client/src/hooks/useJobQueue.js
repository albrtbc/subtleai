import { useState, useCallback } from 'react';
import { generateJobId } from '../utils/jobManager';

export function useJobQueue() {
  const [jobs, setJobs] = useState([]);

  const addJobs = useCallback((files) => {
    const newJobs = Array.from(files).map((file) => ({
      id: generateJobId(),
      file,
      status: 'pending',
      progress: null,
      result: null,
      error: null,
      startTime: null,
      endTime: null,
    }));
    setJobs((prev) => [...prev, ...newJobs]);
    return newJobs;
  }, []);

  const removeJob = useCallback((jobId) => {
    setJobs((prev) => prev.filter((j) => j.id !== jobId));
  }, []);

  const clearCompleted = useCallback(() => {
    setJobs((prev) => prev.filter((j) => j.status !== 'completed' && j.status !== 'error'));
  }, []);

  const cancelPending = useCallback(() => {
    setJobs((prev) => prev.filter((j) => j.status !== 'pending'));
  }, []);

  const updateJobStatus = useCallback((jobId, status) => {
    setJobs((prev) =>
      prev.map((j) => {
        if (j.id !== jobId) return j;
        const updates = { status };
        if (status === 'processing') updates.startTime = Date.now();
        if (status === 'completed' || status === 'error') updates.endTime = Date.now();
        return { ...j, ...updates };
      }),
    );
  }, []);

  const updateJobProgress = useCallback((jobId, progress) => {
    setJobs((prev) =>
      prev.map((j) => (j.id === jobId ? { ...j, progress } : j)),
    );
  }, []);

  const updateJobResult = useCallback((jobId, result) => {
    setJobs((prev) =>
      prev.map((j) => (j.id === jobId ? { ...j, result, status: 'completed', endTime: Date.now() } : j)),
    );
  }, []);

  const updateJobError = useCallback((jobId, error) => {
    setJobs((prev) =>
      prev.map((j) => (j.id === jobId ? { ...j, error, status: 'error', endTime: Date.now() } : j)),
    );
  }, []);

  const retryJob = useCallback((jobId) => {
    setJobs((prev) =>
      prev.map((j) =>
        j.id === jobId
          ? { ...j, status: 'pending', progress: null, result: null, error: null, startTime: null, endTime: null }
          : j,
      ),
    );
  }, []);

  const getProcessingCount = useCallback(() => {
    return jobs.filter((j) => j.status === 'processing').length;
  }, [jobs]);

  const getPendingJobs = useCallback(() => {
    return jobs.filter((j) => j.status === 'pending');
  }, [jobs]);

  return {
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
  };
}
