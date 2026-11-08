import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getManuscript, getManuscriptResults } from '../services/manuscriptService';
import { getJobStatus } from '../services/processingService';
import { useAuth } from './AuthContext';

const ManuscriptContext = createContext(null);

export function ManuscriptProvider({ children }) {
  const { user, isAuthenticated } = useAuth();

  const [activeManuscriptId, setActiveManuscriptId] = useState(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('akshara_active_manuscript_id') || null;
  });
  const [activeJobId, setActiveJobId] = useState(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('akshara_active_job_id') || null;
  });

  const [manuscript, setManuscript] = useState(null);
  const [results, setResults] = useState(null);
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Clear stale manuscript state when user signs out
  useEffect(() => {
    if (!isAuthenticated) {
      setActiveManuscriptId(null);
      setActiveJobId(null);
      setManuscript(null);
      setResults(null);
      setJob(null);
      setError(null);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (activeManuscriptId) {
      localStorage.setItem('akshara_active_manuscript_id', activeManuscriptId);
    } else {
      localStorage.removeItem('akshara_active_manuscript_id');
    }
  }, [activeManuscriptId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (activeJobId) {
      localStorage.setItem('akshara_active_job_id', activeJobId);
    } else {
      localStorage.removeItem('akshara_active_job_id');
    }
  }, [activeJobId]);

  const refreshManuscript = useCallback(
    async (id = activeManuscriptId) => {
      if (!id || !isAuthenticated) return;
      try {
        setLoading(true);
        setError(null);
        const data = await getManuscript(id);
        setManuscript(data);

        try {
          const resData = await getManuscriptResults(id);
          setResults(resData);
        } catch {
          // Results may still be processing
        }
      } catch (err) {
        if (err.response?.status === 403 || err.response?.status === 404) {
          setActiveManuscriptId(null);
          setActiveJobId(null);
        }
        setError(err.response?.data?.message || err.message || 'Failed to load manuscript');
      } finally {
        setLoading(false);
      }
    },
    [activeManuscriptId, isAuthenticated],
  );

  const refreshJob = useCallback(
    async (jobId = activeJobId) => {
      if (!jobId || !isAuthenticated) return null;
      try {
        const jobData = await getJobStatus(jobId);
        setJob(jobData);
        return jobData;
      } catch {
        return null;
      }
    },
    [activeJobId, isAuthenticated],
  );

  useEffect(() => {
    if (activeManuscriptId && isAuthenticated) {
      refreshManuscript(activeManuscriptId);
    }
  }, [activeManuscriptId, isAuthenticated, refreshManuscript]);

  useEffect(() => {
    if (activeJobId && isAuthenticated) {
      refreshJob(activeJobId);
    }
  }, [activeJobId, isAuthenticated, refreshJob]);

  const selectManuscript = (id, jobId = null) => {
    setActiveManuscriptId(id);
    if (jobId !== undefined) setActiveJobId(jobId);
  };

  return (
    <ManuscriptContext.Provider
      value={{
        activeManuscriptId,
        setActiveManuscriptId,
        activeJobId,
        setActiveJobId,
        manuscript,
        setManuscript,
        results,
        setResults,
        job,
        setJob,
        loading,
        error,
        refreshManuscript,
        refreshJob,
        selectManuscript,
        reviewerName: user?.full_name || '',
      }}
    >
      {children}
    </ManuscriptContext.Provider>
  );
}

export function useManuscript() {
  const context = useContext(ManuscriptContext);
  if (!context) {
    throw new Error('useManuscript must be used within a ManuscriptProvider');
  }
  return context;
}
