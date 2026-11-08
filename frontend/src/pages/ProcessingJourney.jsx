import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useParams, useNavigate, Link } from 'react-router-dom';
import {
  Sparkles,
  Sliders,
  FileText,
  Languages,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  QrCode,
  ChevronLeft,
  ChevronRight,
  FolderOpen,
  X,
  ShieldAlert,
  FileJson,
  Loader2,
} from 'lucide-react';
import {
  getManuscript,
  getManuscriptResults,
  exportManuscriptDossier,
} from '../services/manuscriptService';
import { getJobStatus, startProcessing } from '../services/processingService';
import { resolveImageUrl } from '../services/fileService';
import { verifyManuscript } from '../services/verificationService';
import { useManuscript } from '../context/ManuscriptContext';
import { useToast } from '../context/ToastContext';
import { LoadingSpinner, AlertBanner } from '../components/common/CommonUI';

import Stage01Enhancement from '../components/processing/Stage01Enhancement';
import Stage02Damage from '../components/processing/Stage02Damage';
import Stage03OCR from '../components/processing/Stage03OCR';
import Stage04Translation from '../components/processing/Stage04Translation';
import Stage05HeritageRecord from '../components/processing/Stage05HeritageRecord';
import PassportCard from '../components/heritage/PassportCard';
import UserManuscriptLibrary from '../components/archive/UserManuscriptLibrary';

const STAGES = [
  {
    id: 1,
    key: 'enhancement',
    name: 'Adaptive Enhancement',
    short: '01. Enhancement',
    icon: Sliders,
  },
  {
    id: 2,
    key: 'damage',
    name: 'Damage Identification',
    short: '02. Damage Map',
    icon: ShieldAlert,
  },
  {
    id: 3,
    key: 'ocr',
    name: 'Enhanced-Image OCR',
    short: '03. Script OCR',
    icon: FileText,
  },
  {
    id: 4,
    key: 'translation',
    name: 'English Translation',
    short: '04. Translation',
    icon: Languages,
  },
  {
    id: 5,
    key: 'heritage',
    name: 'Digital Record & QR',
    short: '05. Digital Record',
    icon: QrCode,
  },
];

export default function ProcessingJourney() {
  const { id: routeId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();

  const manuscriptIdParam = routeId || searchParams.get('id');
  const jobIdParam = searchParams.get('job_id');

  const { activeManuscriptId, activeJobId, reviewerName } = useManuscript();

  const manuscriptId = manuscriptIdParam || activeManuscriptId;
  const [currentJobId, setCurrentJobId] = useState(jobIdParam || activeJobId);

  const [manuscript, setManuscript] = useState(null);
  const [results, setResults] = useState(null);
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeStage, setActiveStage] = useState(1);

  const [showPassport, setShowPassport] = useState(false);
  const [showLibraryModal, setShowLibraryModal] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [retryingJob, setRetryingJob] = useState(false);
  const [exportingDossier, setExportingDossier] = useState(false);

  const pollingRef = useRef(null);

  const fetchData = useCallback(async () => {
    if (!manuscriptId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const mData = await getManuscript(manuscriptId);
      setManuscript(mData);

      try {
        const rData = await getManuscriptResults(manuscriptId);
        setResults(rData);
      } catch (e) {
        console.warn('Processing results not ready yet:', e);
      }

      if (currentJobId) {
        const jData = await getJobStatus(currentJobId).catch(() => null);
        if (jData) setJob(jData);
      }
    } catch (err) {
      console.error('Failed to load processing journey data:', err);
      setError(
        err.response?.data?.message ||
          err.message ||
          'Could not load manuscript data.'
      );
    } finally {
      setLoading(false);
    }
  }, [manuscriptId, currentJobId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Real-time job polling
  useEffect(() => {
    if (!currentJobId) return;

    const poll = async () => {
      try {
        const jData = await getJobStatus(currentJobId);
        setJob(jData);

        if (jData.status === 'completed' || jData.status === 'failed') {
          clearInterval(pollingRef.current);
          if (jData.status === 'completed' && manuscriptId) {
            const [rData, mData] = await Promise.all([
              getManuscriptResults(manuscriptId).catch(() => null),
              getManuscript(manuscriptId).catch(() => null),
            ]);
            if (rData) setResults(rData);
            if (mData) setManuscript(mData);
          }
        }
      } catch (e) {
        console.warn('Error polling job status:', e);
      }
    };

    pollingRef.current = setInterval(poll, 2000);
    return () => clearInterval(pollingRef.current);
  }, [currentJobId, manuscriptId]);

  const handleRetryProcessing = async () => {
    if (!manuscriptId || retryingJob) return;
    try {
      setRetryingJob(true);
      const jobData = await startProcessing(manuscriptId, {
        enhancement_enabled: true,
        ocr_enabled: true,
        compare_original: true,
        source_language: manuscript?.source_language || 'mal',
        source_script: manuscript?.source_script || 'Malayalam',
      });
      setCurrentJobId(jobData.job_id);
      setJob(jobData);
      toast.info('Re-running 5-stage manuscript processing pipeline.');
    } catch (err) {
      toast.error(
        'Failed to restart processing: ' +
          (err.response?.data?.message || err.message)
      );
    } finally {
      setRetryingJob(false);
    }
  };

  const handleExportDossier = async () => {
    if (!manuscriptId || exportingDossier) return;
    try {
      setExportingDossier(true);
      const data = await exportManuscriptDossier(manuscriptId);
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `AksharaRecover_Dossier_${manuscriptId}.json`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('Structured JSON dossier downloaded.');
    } catch (err) {
      toast.error(
        'Failed to export JSON dossier: ' +
          (err.response?.data?.message || err.message)
      );
    } finally {
      setExportingDossier(false);
    }
  };

  const handleVerifyManuscript = async () => {
    if (!manuscriptId) return;
    try {
      setVerifying(true);
      await verifyManuscript(manuscriptId, {
        verification_status: 'verified',
        reviewer: reviewerName || 'Authenticated Scholar',
        reviewer_notes: `Certified by ${
          reviewerName || 'Authenticated Scholar'
        } during laboratory inspection.`,
        transcription_version: results?.ocr?.version_number || 1,
        translation_version: results?.translation?.transcription_version || 1,
      });
      setVerificationSuccess(true);
      toast.success('Scholarly verification committed to manuscript record.');
      const mData = await getManuscript(manuscriptId);
      setManuscript(mData);
    } catch (err) {
      toast.error(
        'Verification submission failed: ' +
          (err.response?.data?.message || err.message)
      );
    } finally {
      setVerifying(false);
    }
  };

  const firstImage = results?.images?.[0];
  const originalUrl = firstImage?.original_image_url
    ? resolveImageUrl(firstImage.original_image_url)
    : '/assets/sample_original.png';

  const enhancedUrl = firstImage?.enhanced_image_url
    ? resolveImageUrl(firstImage.enhanced_image_url)
    : '/assets/sample_enhanced.png';

  const overlayUrl = firstImage?.damage_overlay_url
    ? resolveImageUrl(firstImage.damage_overlay_url)
    : '/assets/sample_overlay.png';

  if (loading && !manuscript) {
    return (
      <div className="min-h-screen bg-[#101614] flex items-center justify-center p-8">
        <LoadingSpinner
          size="lg"
          text="Loading Five-Stage Epigraphical Preservation Results..."
        />
      </div>
    );
  }

  if (error && !manuscript) {
    return (
      <div className="min-h-screen bg-[#101614] py-20 px-4 text-center space-y-6">
        <div className="max-w-md mx-auto p-8 rounded-2xl bg-[#17211d] border border-[#d4a373]/60 space-y-4 shadow-2xl">
          <AlertTriangle className="w-10 h-10 text-[#faedcd] mx-auto" />
          <h2 className="font-heading text-2xl font-bold text-[#f1f2e9]">
            Manuscript Record Unavailable
          </h2>
          <p className="text-xs text-[#a9b3a8]">{error}</p>
          <div className="pt-2 flex justify-center space-x-3">
            <Link
              to="/my-manuscripts"
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider text-[#f1f2e9] bg-[#1c2923] border border-[#35443a]"
            >
              <FolderOpen className="w-3.5 h-3.5 text-[#d4a373]" />
              <span>My Manuscripts</span>
            </Link>
            <Link
              to="/analyse"
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider text-[#101614] bg-[#ccd5ae]"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Restore New Folio</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!manuscriptId && !manuscript) {
    return (
      <div className="min-h-screen bg-[#101614] py-20 px-4 text-center space-y-6">
        <div className="max-w-md mx-auto p-8 rounded-2xl bg-[#17211d] border border-[#35443a] space-y-4 shadow-2xl">
          <AlertTriangle className="w-10 h-10 text-[#d4a373] mx-auto" />
          <h2 className="font-heading text-2xl font-bold text-[#f1f2e9]">
            No Active Manuscript Selected
          </h2>
          <p className="text-xs text-[#a9b3a8]">
            Please upload a manuscript in the laboratory or select a record from your personal library to inspect its five-stage AI processing report.
          </p>
          <div className="pt-2 flex justify-center space-x-3">
            <button
              type="button"
              onClick={() => setShowLibraryModal(true)}
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider text-[#f1f2e9] bg-[#1c2923] hover:bg-[#273830] border border-[#35443a] transition-all"
            >
              <FolderOpen className="w-3.5 h-3.5 text-[#d4a373]" />
              <span>Open Library</span>
            </button>
            <Link
              to="/analyse"
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider text-[#101614] bg-[#ccd5ae] hover:bg-[#e9edc9] transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#101614]" />
              <span>Restore a Manuscript</span>
            </Link>
          </div>
        </div>

        {showLibraryModal && (
          <div className="fixed inset-0 z-50 bg-[#101614]/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
            <div className="w-full max-w-4xl p-6 rounded-2xl bg-[#17211d] border border-[#35443a] space-y-4">
              <div className="flex justify-between items-center border-b border-[#35443a] pb-3">
                <h3 className="font-heading text-lg font-bold text-[#f1f2e9]">
                  Personal Manuscript Repository
                </h3>
                <button
                  type="button"
                  onClick={() => setShowLibraryModal(false)}
                >
                  <X className="w-5 h-5 text-[#a9b3a8] hover:text-[#f1f2e9]" />
                </button>
              </div>
              <UserManuscriptLibrary
                onSelectManuscript={(selectedId) => {
                  setShowLibraryModal(false);
                  navigate(`/results/${selectedId}`);
                }}
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  const uploadDate = manuscript?.created_at
    ? new Date(manuscript.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'Recent';

  const isJobRunning =
    job && (job.status === 'pending' || job.status === 'processing');
  const isJobFailed = job && job.status === 'failed';

  return (
    <div className="min-h-screen bg-[#101614] text-[#f1f2e9] py-8 px-4 sm:px-6 lg:px-8 space-y-6 selection:bg-[#ccd5ae]/30">
      {/* Live Job Progress or Failure Banner */}
      {isJobRunning && (
        <div className="bg-[#17211d] rounded-2xl border border-[#ccd5ae]/50 p-4 shadow-lg space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="flex items-center space-x-2 text-[#ccd5ae]">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>
                LIVE PIPELINE EXECUTION:{' '}
                {(job.current_stage || 'processing').replace(/_/g, ' ').toUpperCase()}
              </span>
            </span>
            <span className="font-bold text-[#fefae0]">{job.progress || 0}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-[#101614] border border-[#35443a] overflow-hidden">
            <div
              className="h-full transition-all duration-300"
              style={{
                width: `${job.progress || 10}%`,
                background: 'var(--heritage-gradient)',
              }}
            />
          </div>
          {job.message && (
            <p className="text-[11px] font-mono text-[#a9b3a8]">{job.message}</p>
          )}
        </div>
      )}

      {isJobFailed && (
        <div className="bg-[#17211d] rounded-2xl border border-[#d4a373] p-4 shadow-lg flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-[#faedcd] shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-[#faedcd]">
                Pipeline Execution Encountered an Error
              </h3>
              <p className="text-xs text-[#a9b3a8] mt-0.5">
                {job.error?.message ||
                  job.message ||
                  'An unexpected error occurred during processing.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleRetryProcessing}
            disabled={retryingJob}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider text-[#101614] bg-[#ccd5ae] hover:bg-[#e9edc9]"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${retryingJob ? 'animate-spin' : ''}`}
            />
            <span>{retryingJob ? 'Retrying...' : 'Retry Pipeline'}</span>
          </button>
        </div>
      )}

      {/* 1. TOP TECHNICAL METADATA HEADER */}
      <div className="bg-[#17211d] rounded-2xl border border-[#35443a] p-5 sm:p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-[#1c2923] border border-[#35443a] text-[10px] font-mono uppercase tracking-wider text-[#ccd5ae]">
              5-STAGE RESEARCH REPORT
            </span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider border ${
                manuscript?.status === 'processed' ||
                manuscript?.status === 'verified'
                  ? 'bg-[#ccd5ae]/15 border-[#ccd5ae]/40 text-[#ccd5ae]'
                  : 'bg-[#d4a373]/15 border-[#d4a373]/40 text-[#d4a373]'
              }`}
            >
              Status: {manuscript?.status || 'Processed'}
            </span>
            {manuscript?.verification_status && (
              <span className="px-2.5 py-0.5 rounded-full bg-[#1c2923] border border-[#d4a373]/40 text-[10px] font-mono uppercase tracking-wider text-[#d4a373]">
                Verified: {manuscript.verification_status}
              </span>
            )}
            <span className="text-[10px] font-mono text-[#77857b] hidden sm:inline">
              Uploaded: {uploadDate}
            </span>
          </div>

          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-[#fefae0] mt-2">
            {manuscript?.title ||
              manuscript?.original_filename ||
              'Historical Palm-Leaf Folio'}
          </h1>

          <p className="text-xs text-[#77857b] font-mono mt-1">
            UUID: <span className="text-[#fefae0]">{manuscript?.id}</span> •
            Script:{' '}
            <span className="text-[#ccd5ae]">
              {manuscript?.source_script || 'Malayalam / Grantha'}
            </span>{' '}
            • Language:{' '}
            <span className="text-[#e9edc9]">
              {manuscript?.source_language === 'mal'
                ? 'Malayalam'
                : manuscript?.source_language || 'Sanskrit'}
            </span>
          </p>
        </div>

        {/* Header Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowLibraryModal(true)}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider text-[#f1f2e9] bg-[#1c2923] hover:bg-[#25372f] border border-[#35443a] transition-all"
            title="Switch to another manuscript"
          >
            <FolderOpen className="w-3.5 h-3.5 text-[#d4a373]" />
            <span>Switch Folio</span>
          </button>

          <button
            type="button"
            onClick={handleExportDossier}
            disabled={exportingDossier}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider text-[#fefae0] bg-[#1c2923] hover:bg-[#25372f] border border-[#d4a373]/40 transition-all"
          >
            <FileJson className="w-3.5 h-3.5 text-[#d4a373]" />
            <span>{exportingDossier ? 'Exporting...' : 'JSON Dossier'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowPassport(true)}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider text-[#101614] bg-[#ccd5ae] hover:bg-[#e9edc9] shadow-sm transition-all"
          >
            <QrCode className="w-3.5 h-3.5 text-[#101614]" />
            <span>Digital Passport</span>
          </button>

          <button
            type="button"
            disabled={verifying}
            onClick={handleVerifyManuscript}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider text-[#f1f2e9] bg-[#1c2923] hover:bg-[#25372f] border border-[#35443a] transition-all"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#ccd5ae]" />
            <span>{verifying ? 'Certifying...' : 'Certify Folio'}</span>
          </button>
        </div>
      </div>

      {/* Verification Success Alert */}
      {verificationSuccess && (
        <AlertBanner
          type="success"
          title="Scholarly Verification Certified"
          message={`Manuscript ${manuscript?.id} verified by ${
            reviewerName || 'Authenticated Scholar'
          }. Timestamped audit record committed to permanent database.`}
          onClose={() => setVerificationSuccess(false)}
        />
      )}

      {/* 2. FIVE-STAGE HORIZONTAL STEPPER NAVIGATION */}
      <div className="bg-[#17211d] p-2 rounded-2xl border border-[#35443a] shadow-lg">
        {/* Desktop Horizontal Stepper */}
        <div className="hidden md:grid grid-cols-5 gap-2">
          {STAGES.map((s) => {
            const IconComponent = s.icon;
            const isActive = activeStage === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setActiveStage(s.id)}
                className={`p-3 rounded-xl border transition-all text-left flex items-center space-x-3 ${
                  isActive
                    ? 'bg-[#1c2923] border-[#ccd5ae] shadow-md ring-1 ring-[#ccd5ae]/30'
                    : 'bg-[#101614] border-[#35443a] hover:border-[#ccd5ae]/40 text-[#a9b3a8]'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                    isActive
                      ? 'bg-[#ccd5ae] text-[#101614] border-[#ccd5ae]'
                      : 'bg-[#1c2923] text-[#ccd5ae] border-[#35443a]'
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <span
                    className={`text-[10px] font-mono uppercase tracking-wider block ${
                      isActive ? 'text-[#ccd5ae] font-bold' : 'text-[#77857b]'
                    }`}
                  >
                    Stage 0{s.id}
                  </span>
                  <span
                    className={`text-xs font-semibold truncate block ${
                      isActive ? 'text-[#fefae0]' : 'text-[#f1f2e9]'
                    }`}
                  >
                    {s.name}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Mobile Stepper Dropdown */}
        <div className="md:hidden flex items-center justify-between p-1">
          <span className="text-xs font-mono uppercase text-[#77857b]">
            Active Stage:
          </span>
          <select
            value={activeStage}
            onChange={(e) => setActiveStage(Number(e.target.value))}
            className="px-3 py-2 rounded-xl bg-[#101614] border border-[#35443a] text-xs font-bold text-[#ccd5ae] focus:outline-none focus:border-[#ccd5ae]"
          >
            {STAGES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.short} — {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 3. ACTIVE STAGE COMPONENT SHOWCASE */}
      <div className="bg-[#101614] rounded-2xl transition-all">
        {activeStage === 1 && (
          <Stage01Enhancement
            manuscriptId={manuscriptId}
            originalUrl={originalUrl}
            enhancedUrl={enhancedUrl}
            metrics={firstImage?.quality_metrics}
          />
        )}

        {activeStage === 2 && (
          <Stage02Damage
            manuscriptId={manuscriptId}
            originalUrl={originalUrl}
            enhancedUrl={enhancedUrl}
            overlayUrl={overlayUrl}
            damageIndicators={firstImage?.damage_indicators}
          />
        )}

        {activeStage === 3 && (
          <Stage03OCR
            manuscriptId={manuscriptId}
            enhancedUrl={enhancedUrl}
            originalUrl={originalUrl}
            ocrData={results?.ocr}
            onCorrectionSaved={() => fetchData()}
          />
        )}

        {activeStage === 4 && (
          <Stage04Translation
            manuscriptId={manuscriptId}
            translationData={results?.translation}
            sourceText={
              results?.ocr?.selected_text ||
              results?.ocr?.enhanced_text ||
              results?.ocr?.enhanced_image_text ||
              results?.ocr?.original_text ||
              results?.ocr?.original_image_text
            }
            sourceLanguage={manuscript?.source_language || 'mal'}
            onTranslationUpdated={() => fetchData()}
          />
        )}

        {activeStage === 5 && (
          <Stage05HeritageRecord manuscript={manuscript} results={results} />
        )}
      </div>

      {/* 4. BOTTOM STAGE PREV / NEXT NAVIGATION CONTROLS */}
      <div className="bg-[#17211d] p-4 rounded-2xl border border-[#35443a] flex items-center justify-between shadow-xl">
        <button
          type="button"
          disabled={activeStage <= 1}
          onClick={() => setActiveStage((prev) => Math.max(1, prev - 1))}
          className="px-4 py-2 rounded-xl text-xs font-medium text-[#f1f2e9] bg-[#1c2923] hover:bg-[#25372f] border border-[#35443a] disabled:opacity-40 disabled:cursor-not-allowed flex items-center space-x-1.5 transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Previous Stage</span>
        </button>

        <span className="text-xs font-mono text-[#77857b]">
          Stage {activeStage} of 5
        </span>

        <button
          type="button"
          disabled={activeStage >= 5}
          onClick={() => setActiveStage((prev) => Math.min(5, prev + 1))}
          className="px-5 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider text-[#101614] bg-[#ccd5ae] hover:bg-[#e9edc9] disabled:opacity-40 disabled:cursor-not-allowed flex items-center space-x-1.5 shadow-sm transition-all"
        >
          <span>Next Stage</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Digital Passport Modal */}
      {showPassport && manuscript && (
        <div className="fixed inset-0 z-50 bg-[#101614]/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl animate-fade-in relative">
            <button
              type="button"
              onClick={() => setShowPassport(false)}
              className="absolute top-4 right-4 z-20 text-[#a9b3a8] hover:text-[#f1f2e9]"
            >
              <X className="w-5 h-5" />
            </button>
            <PassportCard
              record={manuscript}
              onClose={() => setShowPassport(false)}
            />
          </div>
        </div>
      )}

      {/* Library Drawer Modal */}
      {showLibraryModal && (
        <div className="fixed inset-0 z-50 bg-[#101614]/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-4xl p-6 rounded-2xl bg-[#17211d] border border-[#35443a] space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-[#35443a] pb-3">
              <div>
                <h3 className="font-heading text-lg font-bold text-[#f1f2e9]">
                  Select Archived Manuscript
                </h3>
                <p className="text-xs text-[#a9b3a8]">
                  Choose any uploaded folio to examine its five-stage preservation results.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowLibraryModal(false)}
                className="text-[#a9b3a8] hover:text-[#f1f2e9]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <UserManuscriptLibrary
              activeId={manuscriptId}
              onSelectManuscript={(selectedId) => {
                setShowLibraryModal(false);
                if (routeId) {
                  navigate(`/results/${selectedId}`);
                } else {
                  setSearchParams({ id: selectedId });
                }
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
