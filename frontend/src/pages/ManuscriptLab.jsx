import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UploadCloud,
  FileCheck,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  FileText,
  ArrowRight,
  X,
} from 'lucide-react';
import { uploadManuscript } from '../services/manuscriptService';
import { startProcessing } from '../services/processingService';
import { useManuscript } from '../context/ManuscriptContext';
import { useToast } from '../context/ToastContext';

export default function ManuscriptLab() {
  const navigate = useNavigate();
  const { selectManuscript } = useManuscript();
  const toast = useToast();

  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  // Form Metadata
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [sourceLanguage, setSourceLanguage] = useState('mal');
  const [sourceScript, setSourceScript] = useState('Malayalam');
  const [historicalPeriod, setHistoricalPeriod] = useState('17th - 18th Century CE');
  const [region, setRegion] = useState('Kerala');
  const [consentGranted, setConsentGranted] = useState(false);

  // Pipeline execution toggles
  const [enhancementEnabled, setEnhancementEnabled] = useState(true);
  const [ocrEnabled, setOcrEnabled] = useState(true);
  const [compareOriginal, setCompareOriginal] = useState(true);

  // Upload & processing progress states
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState(null);

  const fileInputRef = useRef(null);

  const handleFileSelect = (selectedFile) => {
    setErrorMessage(null);
    if (!selectedFile) return;

    const validExtensions = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (
      !validExtensions.includes(selectedFile.type) &&
      !selectedFile.name.match(/\.(jpg|jpeg|png|pdf)$/i)
    ) {
      setErrorMessage(
        'Invalid file type. Please upload a JPG, PNG, or PDF manuscript.'
      );
      return;
    }

    if (selectedFile.size > 20 * 1024 * 1024) {
      setErrorMessage('File exceeds maximum upload limit of 20MB.');
      return;
    }

    setFile(selectedFile);
    if (!title.trim()) {
      setTitle(selectedFile.name.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' '));
    }

    if (selectedFile.type.startsWith('image/')) {
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setErrorMessage('Please select a historical manuscript file to upload.');
      return;
    }
    if (!consentGranted) {
      setErrorMessage(
        'Please confirm explicit consent for digital preservation and non-destructive analysis.'
      );
      return;
    }

    try {
      setUploading(true);
      setErrorMessage(null);
      setUploadProgress(15);

      const manuscriptMeta = await uploadManuscript(file, {
        title: title.trim() || file.name.replace(/\.[^/.]+$/, ''),
        description: description.trim() || undefined,
        source_language: sourceLanguage,
        source_script: sourceScript,
        historical_period: historicalPeriod.trim() || undefined,
        region: region.trim() || 'Kerala',
        onUploadProgress: (pct) => {
          setUploadProgress(Math.min(70, Math.max(15, Math.round(pct * 0.7))));
        },
      });

      setUploadProgress(75);

      const jobData = await startProcessing(manuscriptMeta.manuscript_id, {
        enhancement_enabled: enhancementEnabled,
        ocr_enabled: ocrEnabled,
        compare_original: compareOriginal,
        source_language: sourceLanguage,
        source_script: sourceScript,
      });

      setUploadProgress(100);
      selectManuscript(manuscriptMeta.manuscript_id, jobData.job_id);
      toast.success('Manuscript uploaded. Launching 5-stage restoration pipeline.');

      navigate(
        `/results/${manuscriptMeta.manuscript_id}?job_id=${jobData.job_id}`
      );
    } catch (err) {
      console.error('Upload / processing initiation error:', err);
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Failed to initialize manuscript pipeline.';
      setErrorMessage(msg);
      toast.error(msg);
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#101614] text-[#f1f2e9] py-16 px-4 sm:px-6 lg:px-8 space-y-12 selection:bg-[#ccd5ae]/30">
      {/* Header */}
      <section className="max-w-4xl mx-auto text-center space-y-4">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#1c2923] border border-[#35443a] text-xs font-mono text-[#ccd5ae]">
          <Sparkles className="w-3.5 h-3.5 text-[#ccd5ae]" />
          <span>Active Epigraphical Laboratory</span>
        </div>
        <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold text-[#fefae0] tracking-tight">
          Restore &amp; Analyse a Manuscript
        </h1>
        <p className="text-lg text-[#a9b3a8] max-w-2xl mx-auto font-sans leading-relaxed">
          Upload a palm-leaf folio image or PDF to execute the five-stage preservation pipeline: Adaptive CLAHE Enhancement, Damage Identification, Script OCR, Scholarly Translation, and Digital Heritage QR Record.
        </p>
      </section>

      {/* Main Form Container */}
      <div className="max-w-5xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Error Banner */}
          {errorMessage && (
            <div className="p-4 rounded-xl bg-[#faedcd]/15 border border-[#d4a373] text-[#faedcd] flex items-start space-x-3 text-xs sm:text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-[#d4a373]" />
              <div className="flex-1 font-medium">{errorMessage}</div>
              <button type="button" onClick={() => setErrorMessage(null)}>
                <X className="w-4 h-4 hover:opacity-75" />
              </button>
            </div>
          )}

          {/* 1. Drag & Drop Upload Zone */}
          <div className="p-8 rounded-2xl bg-[#17211d] border border-[#35443a] space-y-4 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#35443a] pb-3">
              <h2 className="font-heading text-xl font-bold text-[#f1f2e9] flex items-center space-x-2">
                <UploadCloud className="w-5 h-5 text-[#ccd5ae]" />
                <span>1. Select Historical Manuscript File</span>
              </h2>
              <span className="text-xs font-mono text-[#77857b]">
                Supported: JPG, JPEG, PNG, PDF (Up to 20MB)
              </span>
            </div>

            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 sm:p-12 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-4 ${
                dragActive
                  ? 'border-[#ccd5ae] bg-[#1c2923] scale-[1.01]'
                  : 'border-[#35443a] bg-[#101614]/60 hover:bg-[#1c2923] hover:border-[#ccd5ae]'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={(e) =>
                  e.target.files?.[0] && handleFileSelect(e.target.files[0])
                }
                className="hidden"
              />

              {file ? (
                <div className="space-y-3">
                  <div className="w-16 h-16 rounded-full bg-[#ccd5ae]/20 text-[#ccd5ae] flex items-center justify-center mx-auto shadow-sm">
                    <FileCheck className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-base text-[#fefae0]">
                      {file.name}
                    </h3>
                    <p className="text-xs text-[#77857b] font-mono mt-0.5">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB •{' '}
                      {file.type || 'Manuscript Document'}
                    </p>
                  </div>
                  <span className="inline-block text-xs text-[#ccd5ae] font-semibold hover:underline">
                    Click or drag another file to replace
                  </span>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="w-16 h-16 rounded-2xl bg-[#1c2923] text-[#ccd5ae] flex items-center justify-center mx-auto shadow-sm border border-[#35443a]">
                    <UploadCloud className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="font-heading text-lg font-bold text-[#f1f2e9]">
                      Drag &amp; Drop Manuscript Folio or PDF Here
                    </h3>
                    <p className="text-xs text-[#77857b] mt-1 font-sans">
                      Or click to browse your local device files
                    </p>
                  </div>
                </div>
              )}
            </div>

            {previewUrl && (
              <div className="pt-4 border-t border-[#35443a]">
                <span className="text-xs font-mono uppercase text-[#77857b] block mb-2">
                  Folio Upload Preview
                </span>
                <div className="rounded-lg overflow-hidden border border-[#35443a] bg-[#101614] max-h-56 flex items-center justify-center p-2">
                  <img
                    src={previewUrl}
                    alt="Upload Preview"
                    className="max-h-52 object-contain"
                  />
                </div>
              </div>
            )}

            <div className="p-3 bg-[#1c2923] rounded-lg text-xs text-[#a9b3a8] flex items-center space-x-2 border border-[#35443a]">
              <ShieldCheck className="w-4 h-4 text-[#d4a373] shrink-0" />
              <span>
                <strong className="text-[#fefae0]">
                  Archival Preservation Guarantee:
                </strong>{' '}
                The raw original image is preserved untouched in{' '}
                <code>uploads/originals</code> and is never overwritten.
              </span>
            </div>
          </div>

          {/* 2. Metadata & Epigraphical Context */}
          <div className="p-8 rounded-2xl bg-[#17211d] border border-[#35443a] space-y-6 shadow-xl">
            <h2 className="font-heading text-xl font-bold text-[#f1f2e9] flex items-center space-x-2 border-b border-[#35443a] pb-3">
              <FileText className="w-5 h-5 text-[#d4a373]" />
              <span>2. Manuscript Archival Metadata</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label
                  htmlFor="manuscript-title"
                  className="block text-xs font-semibold uppercase tracking-wider text-[#a9b3a8] mb-1 font-mono"
                >
                  Manuscript Folio Title
                </label>
                <input
                  id="manuscript-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Rigveda Samhita Folio / Ayurveda Nighantu"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#35443a] bg-[#101614] text-sm text-[#f1f2e9] placeholder-[#77857b] focus:border-[#ccd5ae] focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="historical-period"
                  className="block text-xs font-semibold uppercase tracking-wider text-[#a9b3a8] mb-1 font-mono"
                >
                  Historical Period / Era
                </label>
                <input
                  id="historical-period"
                  type="text"
                  value={historicalPeriod}
                  onChange={(e) => setHistoricalPeriod(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#35443a] bg-[#101614] text-sm text-[#f1f2e9] placeholder-[#77857b] focus:border-[#ccd5ae] focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label
                  htmlFor="manuscript-description"
                  className="block text-xs font-semibold uppercase tracking-wider text-[#a9b3a8] mb-1 font-mono"
                >
                  Optional Notes / Archival Description
                </label>
                <textarea
                  id="manuscript-description"
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional provenance notes, folio condition observations, or collection context..."
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#35443a] bg-[#101614] text-sm text-[#f1f2e9] placeholder-[#77857b] focus:border-[#ccd5ae] focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="source-language"
                  className="block text-xs font-semibold uppercase tracking-wider text-[#a9b3a8] mb-1 font-mono"
                >
                  Source Language
                </label>
                <select
                  id="source-language"
                  value={sourceLanguage}
                  onChange={(e) => setSourceLanguage(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#35443a] bg-[#101614] text-sm text-[#f1f2e9] focus:border-[#ccd5ae] focus:outline-none font-sans"
                >
                  <option value="mal">Malayalam (Old / Medieval)</option>
                  <option value="san">Sanskrit (Classical)</option>
                  <option value="tam">Tamil (Classical / Manipravalam)</option>
                  <option value="hin">Hindi (Devanagari)</option>
                  <option value="en">English (Archival Catalog)</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="source-script"
                  className="block text-xs font-semibold uppercase tracking-wider text-[#a9b3a8] mb-1 font-mono"
                >
                  Historical Script
                </label>
                <select
                  id="source-script"
                  value={sourceScript}
                  onChange={(e) => setSourceScript(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#35443a] bg-[#101614] text-sm text-[#f1f2e9] focus:border-[#ccd5ae] focus:outline-none font-sans"
                >
                  <option value="Malayalam">Malayalam Lipi</option>
                  <option value="Grantha">Grantha Lipi</option>
                  <option value="Devanagari">Devanagari</option>
                  <option value="Vatteluttu">Vatteluttu</option>
                  <option value="Kolezhuthu">Kolezhuthu</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="manuscript-region"
                  className="block text-xs font-semibold uppercase tracking-wider text-[#a9b3a8] mb-1 font-mono"
                >
                  Provenance / Region
                </label>
                <input
                  id="manuscript-region"
                  type="text"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#35443a] bg-[#101614] text-sm text-[#f1f2e9] placeholder-[#77857b] focus:border-[#ccd5ae] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* 3. Pipeline Configuration & Consent */}
          <div className="p-8 rounded-2xl bg-[#17211d] border border-[#35443a] space-y-6 shadow-xl">
            <h2 className="font-heading text-xl font-bold text-[#f1f2e9] flex items-center space-x-2 border-b border-[#35443a] pb-3">
              <Sparkles className="w-5 h-5 text-[#ccd5ae]" />
              <span>3. Execution Options &amp; Ethical Consent</span>
            </h2>

            {/* Pipeline Toggles */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <label className="p-4 rounded-xl border border-[#35443a] bg-[#101614] flex items-start space-x-3 cursor-pointer hover:border-[#ccd5ae] transition-colors">
                <input
                  type="checkbox"
                  checked={enhancementEnabled}
                  onChange={(e) => setEnhancementEnabled(e.target.checked)}
                  className="mt-1 accent-[#ccd5ae] w-4 h-4 rounded"
                />
                <div className="text-xs">
                  <strong className="block text-[#f1f2e9]">CV Enhancement</strong>
                  <span className="text-[#77857b]">Denoise, CLAHE, and sharpen</span>
                </div>
              </label>

              <label className="p-4 rounded-xl border border-[#35443a] bg-[#101614] flex items-start space-x-3 cursor-pointer hover:border-[#ccd5ae] transition-colors">
                <input
                  type="checkbox"
                  checked={ocrEnabled}
                  onChange={(e) => setOcrEnabled(e.target.checked)}
                  className="mt-1 accent-[#ccd5ae] w-4 h-4 rounded"
                />
                <div className="text-xs">
                  <strong className="block text-[#f1f2e9]">Script OCR</strong>
                  <span className="text-[#77857b]">Extract lines &amp; confidence</span>
                </div>
              </label>

              <label className="p-4 rounded-xl border border-[#35443a] bg-[#101614] flex items-start space-x-3 cursor-pointer hover:border-[#ccd5ae] transition-colors">
                <input
                  type="checkbox"
                  checked={compareOriginal}
                  onChange={(e) => setCompareOriginal(e.target.checked)}
                  className="mt-1 accent-[#ccd5ae] w-4 h-4 rounded"
                />
                <div className="text-xs">
                  <strong className="block text-[#f1f2e9]">Compare Original</strong>
                  <span className="text-[#77857b]">Benchmark raw vs enhanced</span>
                </div>
              </label>
            </div>

            {/* Explicit Consent Checkbox */}
            <div className="p-4 rounded-xl bg-[#1c2923] border border-[#d4a373]/40 space-y-2">
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentGranted}
                  onChange={(e) => setConsentGranted(e.target.checked)}
                  className="mt-1 accent-[#ccd5ae] w-4 h-4 rounded"
                  required
                />
                <div className="text-xs text-[#a9b3a8] leading-relaxed">
                  <strong className="text-[#d4a373] block mb-0.5">
                    Explicit Preservation Consent &amp; Attribution Agreement (Required)
                  </strong>
                  I confirm that I possess permission to submit this cultural record for digital preservation, non-destructive analysis, and scholarly review.
                </div>
              </label>
            </div>

            {uploading && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono text-[#ccd5ae]">
                  <span>Uploading &amp; initializing pipeline...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-[#101614] border border-[#35443a] overflow-hidden">
                  <div
                    className="h-full transition-all duration-300"
                    style={{
                      width: `${uploadProgress}%`,
                      background: 'var(--heritage-gradient)',
                    }}
                  />
                </div>
              </div>
            )}

            {/* Submit Action */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-xs text-[#77857b]">
                Submitting creates an asynchronous processing job and opens the 5-stage report.
              </span>

              <button
                type="submit"
                disabled={uploading || !file || !consentGranted}
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2.5 px-8 py-4 rounded-xl text-xs font-semibold uppercase tracking-wider text-[#101614] bg-[#ccd5ae] hover:bg-[#e9edc9] shadow-lg disabled:opacity-50 transition-all"
              >
                <Sparkles className="w-4 h-4 text-[#101614]" />
                <span>
                  {uploading
                    ? `Processing (${uploadProgress}%)...`
                    : 'Launch Restoration Journey'}
                </span>
                <ArrowRight className="w-4 h-4 text-[#101614]" />
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
