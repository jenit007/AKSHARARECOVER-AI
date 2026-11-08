import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import { LoadingSpinner } from '../components/common/CommonUI';
import { listManuscripts, getManuscriptResults } from '../services/manuscriptService';
import { verifyManuscript } from '../services/verificationService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function ResearcherReview() {
  const { user } = useAuth();
  const toast = useToast();

  const [manuscripts, setManuscripts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [results, setResults] = useState(null);

  const [statusDecision, setStatusDecision] = useState('verified');
  const [reviewerNotes, setReviewerNotes] = useState('');
  const [submittingDecision, setSubmittingDecision] = useState(false);
  const [actionSuccess, setActionSuccess] = useState(null);

  const fetchPending = async () => {
    try {
      setLoading(true);
      const res = await listManuscripts({ page: 1, page_size: 50 });
      setManuscripts(res.items || []);
      if (res.items?.length > 0 && !selectedItem) {
        setSelectedItem(res.items[0]);
      }
    } catch (err) {
      console.error('Failed to load review queue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  useEffect(() => {
    if (!selectedItem) return;
    getManuscriptResults(selectedItem.id)
      .then((res) => setResults(res))
      .catch(() => setResults(null));
  }, [selectedItem]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!selectedItem || !user) return;

    try {
      setSubmittingDecision(true);
      setActionSuccess(null);
      await verifyManuscript(selectedItem.id, {
        verification_status: statusDecision,
        reviewer: user.full_name,
        reviewer_notes: reviewerNotes,
        transcription_version: results?.ocr?.version_number || 1,
        translation_version: results?.translation?.transcription_version || 1,
      });

      const msg = `Manuscript ${selectedItem.id} status updated to ${statusDecision.toUpperCase()}.`;
      setActionSuccess(msg);
      toast.success(msg);
      setReviewerNotes('');
      fetchPending();
    } catch (err) {
      console.error('Review decision submission failed:', err);
      toast.error(
        'Verification submission failed: ' +
          (err.response?.data?.message || err.message)
      );
    } finally {
      setSubmittingDecision(false);
    }
  };

  const reviewerDisplay = user?.full_name || 'Authenticated Scholar';

  return (
    <div className="min-h-screen bg-[#101614] text-[#f1f2e9] py-16 px-4 sm:px-6 lg:px-8 space-y-12 selection:bg-[#ccd5ae]/30">
      {/* Header */}
      <section className="max-w-5xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-[#35443a] pb-6">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#1c2923] border border-[#35443a] text-xs font-mono text-[#d4a373]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#d4a373]" />
            <span>Authenticated Scholar Portal</span>
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-[#fefae0] mt-2">
            Epigraphist &amp; Researcher Review Workbench
          </h1>
          <p className="text-xs text-[#a9b3a8] mt-1">
            Review OCR transcriptions, inspect translations, and record scholarly verification decisions on your manuscripts
          </p>
        </div>

        <div className="bg-[#17211d] p-3 rounded-xl border border-[#35443a] flex items-center space-x-2 text-xs shadow-lg">
          <span className="w-2.5 h-2.5 rounded-full bg-[#ccd5ae]" />
          <span className="font-semibold text-[#fefae0] font-mono">
            {reviewerDisplay}
          </span>
        </div>
      </section>

      {/* Main Review Dashboard */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Queue of Manuscripts */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-lg font-bold text-[#f1f2e9]">
              Manuscript Queue ({manuscripts.length})
            </h2>
            <span className="text-[11px] font-mono text-[#77857b]">
              Select to inspect
            </span>
          </div>

          {loading ? (
            <LoadingSpinner size="sm" text="Loading review queue..." />
          ) : manuscripts.length > 0 ? (
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {manuscripts.map((m) => {
                const isSelected = selectedItem?.id === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setSelectedItem(m);
                      setActionSuccess(null);
                    }}
                    className={`w-full text-left p-4 rounded-xl border transition-all space-y-1.5 ${
                      isSelected
                        ? 'bg-[#1c2923] border-[#ccd5ae] shadow-lg'
                        : 'bg-[#17211d] border-[#35443a] hover:bg-[#1c2923]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-[#f1f2e9] truncate font-heading">
                        {m.title || m.original_filename}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase shrink-0 ${
                          m.status === 'verified'
                            ? 'bg-[#ccd5ae]/20 border border-[#ccd5ae]/40 text-[#ccd5ae]'
                            : 'bg-[#d4a373]/20 border border-[#d4a373]/40 text-[#d4a373]'
                        }`}
                      >
                        {m.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#77857b] font-mono truncate">
                      {m.id} • {m.source_language || 'mal'}
                    </p>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="p-6 rounded-xl bg-[#17211d] border border-[#35443a] text-xs text-[#a9b3a8]">
              No manuscripts in your library yet. Upload one in the laboratory to begin review.
            </div>
          )}
        </div>

        {/* Right Column: Detailed Scholarly Verification Panel */}
        <div className="lg:col-span-8 space-y-6">
          {selectedItem ? (
            <div className="p-8 rounded-2xl bg-[#17211d] border border-[#35443a] space-y-6 shadow-xl">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#35443a] pb-4">
                <div>
                  <span className="px-2 py-0.5 rounded bg-[#1c2923] border border-[#35443a] text-xs font-mono text-[#d4a373]">
                    Folio Audit Target
                  </span>
                  <h2 className="font-heading text-2xl font-bold text-[#fefae0] mt-2">
                    {selectedItem.title || selectedItem.original_filename}
                  </h2>
                  <p className="text-xs text-[#77857b] font-mono mt-0.5">
                    UUID: {selectedItem.id} • Uploaded:{' '}
                    {new Date(selectedItem.created_at).toLocaleDateString()}
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase font-mono text-[#77857b] block">
                    Current Status
                  </span>
                  <span className="px-2.5 py-1 rounded bg-[#1c2923] border border-[#35443a] text-xs font-mono uppercase text-[#ccd5ae]">
                    {(selectedItem.verification_status || selectedItem.status).toUpperCase()}
                  </span>
                </div>
              </div>

              {actionSuccess && (
                <div className="p-3 rounded-lg bg-[#ccd5ae]/15 border border-[#ccd5ae]/40 text-[#ccd5ae] text-xs font-semibold font-mono">
                  {actionSuccess}
                </div>
              )}

              {/* Inscription Transcript Inspection */}
              <div className="space-y-3">
                <span className="text-xs font-mono uppercase font-bold text-[#ccd5ae] block">
                  Active OCR Transcript
                </span>
                <pre className="p-4 rounded-xl bg-[#101614] border border-[#35443a] font-indic text-sm text-[#f1f2e9] whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                  {results?.ocr?.selected_text ||
                    results?.ocr?.enhanced_text ||
                    results?.ocr?.enhanced_image_text ||
                    results?.ocr?.original_text ||
                    results?.ocr?.original_image_text ||
                    'No OCR transcription available yet.'}
                </pre>
              </div>

              {/* Translation Inspection */}
              {results?.translation?.translated_text && (
                <div className="space-y-2">
                  <span className="text-xs font-mono uppercase font-bold text-[#d4a373] block">
                    English Translation
                  </span>
                  <div className="p-4 rounded-xl bg-[#101614] border border-[#35443a] text-xs text-[#f1f2e9] leading-relaxed">
                    {results.translation.translated_text}
                  </div>
                </div>
              )}

              {/* Verification Form */}
              <form
                onSubmit={handleSubmitReview}
                className="space-y-4 pt-4 border-t border-[#35443a]"
              >
                <h3 className="font-heading text-lg font-bold text-[#f1f2e9]">
                  Scholarly Decision &amp; Certification
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setStatusDecision('verified')}
                    className={`p-3 rounded-xl border text-center transition-all flex items-center justify-center space-x-2 ${
                      statusDecision === 'verified'
                        ? 'bg-[#ccd5ae] text-[#101614] border-[#ccd5ae] shadow-md font-bold'
                        : 'bg-[#101614] text-[#ccd5ae] border-[#35443a] hover:bg-[#1c2923]'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-xs font-mono">Approve &amp; Certify</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStatusDecision('needs_review')}
                    className={`p-3 rounded-xl border text-center transition-all flex items-center justify-center space-x-2 ${
                      statusDecision === 'needs_review'
                        ? 'bg-[#faedcd] text-[#101614] border-[#faedcd] shadow-md font-bold'
                        : 'bg-[#101614] text-[#faedcd] border-[#35443a] hover:bg-[#1c2923]'
                    }`}
                  >
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-xs font-mono">Request Revision</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStatusDecision('rejected')}
                    className={`p-3 rounded-xl border text-center transition-all flex items-center justify-center space-x-2 ${
                      statusDecision === 'rejected'
                        ? 'bg-[#d4a373] text-[#101614] border-[#d4a373] shadow-md font-bold'
                        : 'bg-[#101614] text-[#d4a373] border-[#35443a] hover:bg-[#1c2923]'
                    }`}
                  >
                    <XCircle className="w-4 h-4" />
                    <span className="text-xs font-mono">Flag Unverified</span>
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#a9b3a8] mb-1 font-mono">
                    Scholarly Epigraphical Notes &amp; Comments
                  </label>
                  <textarea
                    rows={3}
                    value={reviewerNotes}
                    onChange={(e) => setReviewerNotes(e.target.value)}
                    placeholder="Enter academic remarks, script observations, or verification notes..."
                    className="w-full p-3 rounded-lg border border-[#35443a] bg-[#101614] text-xs text-[#f1f2e9] placeholder-[#77857b] focus:border-[#ccd5ae] focus:outline-none font-sans"
                    required
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                  <span className="text-xs text-[#77857b] font-mono">
                    Reviewer signature:{' '}
                    <strong className="text-[#f1f2e9]">{reviewerDisplay}</strong>
                  </span>

                  <button
                    type="submit"
                    disabled={submittingDecision}
                    className="px-6 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider text-[#101614] bg-[#ccd5ae] hover:bg-[#e9edc9] shadow-md disabled:opacity-50 transition-all font-mono"
                  >
                    {submittingDecision
                      ? 'Submitting Decision...'
                      : 'Commit Verification Decision'}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="p-12 text-center text-[#77857b] rounded-2xl bg-[#17211d] border border-[#35443a]">
              Select a manuscript from the queue to start review.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
