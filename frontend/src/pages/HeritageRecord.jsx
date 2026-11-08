import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import {
  Award,
  ArrowLeft,
  Languages,
  FileText,
  Sparkles,
} from 'lucide-react';
import PassportCard from '../components/heritage/PassportCard';
import ImageComparisonSlider from '../components/manuscript/ImageComparisonSlider';
import { LoadingSpinner } from '../components/common/CommonUI';
import {
  getManuscript,
  getManuscriptResults,
  getHeritageRecord,
} from '../services/manuscriptService';
import { resolveImageUrl } from '../services/fileService';

export default function HeritageRecord() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const shareToken = searchParams.get('token');

  const [record, setRecord] = useState(null);
  const [heritageMeta, setHeritageMeta] = useState(null);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const m = await getManuscript(id, shareToken);
        setRecord(m);
        try {
          const [r, h] = await Promise.all([
            getManuscriptResults(id, shareToken).catch(() => null),
            getHeritageRecord(id, shareToken).catch(() => null),
          ]);
          if (r) setResults(r);
          if (h) setHeritageMeta(h);
        } catch (e) {
          console.warn('Results not yet available:', e);
        }
      } catch (err) {
        console.error('Failed to load heritage record:', err);
        setError(
          err.response?.data?.message ||
            'Heritage record is private or could not be found.'
        );
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, shareToken]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#101614] flex items-center justify-center p-8">
        <LoadingSpinner
          size="lg"
          text="Retrieving certified digital heritage passport..."
        />
      </div>
    );
  }

  if (error || !record) {
    return (
      <div className="min-h-screen bg-[#101614] py-20 px-4 text-center space-y-4">
        <div className="max-w-md mx-auto p-8 space-y-3 rounded-2xl bg-[#17211d] border border-[#35443a]">
          <Award className="w-10 h-10 text-[#d4a373] mx-auto" />
          <h2 className="font-heading text-2xl font-bold text-[#f1f2e9]">
            Heritage Record Unavailable
          </h2>
          <p className="text-xs text-[#a9b3a8]">
            {error || 'This record could not be found.'}
          </p>
          <Link
            to="/"
            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-[#ccd5ae] hover:underline pt-2 font-mono"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return Home</span>
          </Link>
        </div>
      </div>
    );
  }

  const appendToken = (url) => {
    if (!url) return url;
    if (!shareToken) return resolveImageUrl(url);
    const resolved = resolveImageUrl(url);
    return resolved.includes('?')
      ? `${resolved}&token=${encodeURIComponent(shareToken)}`
      : `${resolved}?token=${encodeURIComponent(shareToken)}`;
  };

  const firstImage = results?.images?.[0];
  const originalUrl = firstImage?.original_image_url
    ? appendToken(firstImage.original_image_url)
    : '/assets/sample_original.png';

  const enhancedUrl = firstImage?.enhanced_image_url
    ? appendToken(firstImage.enhanced_image_url)
    : '/assets/sample_enhanced.png';

  const ocrText =
    results?.ocr?.selected_text ||
    results?.ocr?.enhanced_text ||
    results?.ocr?.enhanced_image_text ||
    results?.ocr?.original_text ||
    results?.ocr?.original_image_text ||
    '';
  const translatedText = results?.translation?.translated_text || '';

  return (
    <div className="min-h-screen bg-[#101614] text-[#f1f2e9] py-16 px-4 sm:px-6 lg:px-8 space-y-12 selection:bg-[#ccd5ae]/30">
      {/* Navigation breadcrumb */}
      <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-2 font-mono">
        <Link
          to="/my-manuscripts"
          className="inline-flex items-center space-x-1 text-xs font-semibold uppercase tracking-wider text-[#a9b3a8] hover:text-[#ccd5ae]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>My Manuscripts</span>
        </Link>
        <Link
          to={`/results/${record.id}`}
          className="inline-flex items-center space-x-1 text-xs font-semibold uppercase tracking-wider text-[#ccd5ae] hover:underline"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Open 5-Stage Research Report</span>
        </Link>
      </div>

      {/* Official Digital Passport Card */}
      <section className="max-w-3xl mx-auto">
        <PassportCard
          record={{
            ...record,
            unique_slug: heritageMeta?.unique_slug || shareToken,
          }}
        />
      </section>

      {/* Restored Folio Comparison */}
      <section className="max-w-4xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-heading text-2xl font-bold text-[#f1f2e9]">
            Folio Comparison &amp; Inscription Detail
          </h3>
          <span className="px-2.5 py-0.5 rounded-full bg-[#1c2923] border border-[#d4a373]/40 text-xs font-mono text-[#d4a373]">
            Non-Destructive Restoration
          </span>
        </div>

        <ImageComparisonSlider
          originalUrl={originalUrl}
          enhancedUrl={enhancedUrl}
        />
      </section>

      {/* Inscription Transcription & Translation — Strictly Real Data Only */}
      <section className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl bg-[#17211d] border border-[#35443a] space-y-3 shadow-xl">
          <div className="flex items-center justify-between border-b border-[#35443a] pb-2">
            <h4 className="font-heading text-lg font-bold text-[#f1f2e9] flex items-center space-x-2">
              <FileText className="w-4 h-4 text-[#ccd5ae]" />
              <span>Extracted Transcription</span>
            </h4>
            <span className="px-2 py-0.5 rounded bg-[#ccd5ae]/20 border border-[#ccd5ae]/40 text-[#ccd5ae] text-[10px] font-mono font-bold">
              {results?.ocr?.human_corrected ? 'Scholar Verified' : 'OCR Output'}
            </span>
          </div>
          <pre className="p-4 bg-[#101614] rounded-lg border border-[#35443a] font-indic text-sm text-[#f1f2e9] whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto">
            {ocrText || 'Transcription not available for this manuscript.'}
          </pre>
        </div>

        <div className="p-6 rounded-2xl bg-[#17211d] border border-[#35443a] space-y-3 shadow-xl">
          <div className="flex items-center justify-between border-b border-[#35443a] pb-2">
            <h4 className="font-heading text-lg font-bold text-[#f1f2e9] flex items-center space-x-2">
              <Languages className="w-4 h-4 text-[#d4a373]" />
              <span>English Translation</span>
            </h4>
            <span className="px-2 py-0.5 rounded bg-[#1c2923] border border-[#d4a373]/40 text-[#d4a373] text-[10px] font-mono">
              {results?.translation?.human_edited
                ? 'Scholar Translated'
                : results?.translation?.engine || 'Stage 04'}
            </span>
          </div>
          <div className="p-4 bg-[#101614] rounded-lg border border-[#35443a] text-sm text-[#f1f2e9] leading-relaxed max-h-56 overflow-y-auto">
            {translatedText ||
              'English translation not available for this manuscript.'}
          </div>
        </div>
      </section>
    </div>
  );
}
