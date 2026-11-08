import React, { useState, useEffect } from 'react';
import {
  Languages,
  Copy,
  Check,
  Edit3,
  Save,
  Sparkles,
  FileText,
  CheckCircle2,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { generateTranslation, editTranslation } from '../../services/translationService';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

export default function Stage04Translation({
  manuscriptId,
  translationData,
  sourceText,
  sourceLanguage = 'mal',
  onTranslationUpdated,
}) {
  const toast = useToast();
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTranslation, setEditedTranslation] = useState(
    translationData?.translated_text || ''
  );
  const [translating, setTranslating] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  useEffect(() => {
    if (translationData?.translated_text) {
      setEditedTranslation(translationData.translated_text);
    }
  }, [translationData?.translated_text]);

  const activeTranslation =
    translationData?.translated_text || editedTranslation || '';
  const modelName =
    translationData?.translation_model ||
    translationData?.engine ||
    'Not configured';
  const translationStatus =
    translationData?.status ||
    (activeTranslation ? 'completed' : 'unavailable');
  const statusReason = translationData?.reason || null;

  const sourceLines = sourceText
    ? sourceText.split('\n').filter((l) => l.trim().length > 0)
    : [];
  const transLines = activeTranslation
    ? activeTranslation.split('\n').filter((l) => l.trim().length > 0)
    : [];

  // Honest coverage data (zero hardcoded 12s)
  const coverageData = [
    { name: 'Source Segments', count: sourceLines.length, fill: '#e9edc9' },
    { name: 'Translated Segments', count: transLines.length, fill: '#ccd5ae' },
  ];

  const coverageRatio =
    sourceLines.length > 0 && transLines.length > 0
      ? `${Math.min(100, Math.round((transLines.length / sourceLines.length) * 100))}% Segment Ratio`
      : transLines.length > 0
      ? 'Scholarly Translation Available'
      : 'Translation Pending';

  const handleCopy = () => {
    if (!activeTranslation) return;
    navigator.clipboard.writeText(activeTranslation);
    setCopied(true);
    toast.info('English translation copied to clipboard.');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGenerate = async () => {
    if (!manuscriptId || !sourceText) return;
    try {
      setTranslating(true);
      setStatusMessage(null);
      const res = await generateTranslation(manuscriptId, {
        source_text: sourceText,
        source_language: sourceLanguage,
        target_language: 'en',
        translation_mode: 'contextual',
      });
      if (res?.translated_text) {
        setEditedTranslation(res.translated_text);
        setStatusMessage({
          type: 'success',
          text: 'English translation generated.',
        });
        toast.success('English translation generated.');
      } else {
        setStatusMessage({
          type: 'warning',
          text:
            res?.reason ||
            'Automated neural translation engine is not configured in this environment. You may enter a scholarly English translation manually.',
        });
      }
      if (onTranslationUpdated) onTranslationUpdated(res);
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Automated translation engine unavailable';
      setStatusMessage({ type: 'error', text: msg });
      toast.warning(msg);
    } finally {
      setTranslating(false);
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!manuscriptId || !editedTranslation.trim()) return;
    try {
      setSavingEdit(true);
      const res = await editTranslation(manuscriptId, {
        corrected_translation: editedTranslation,
        reviewer: user?.full_name || 'Authenticated Scholar',
        notes: 'Human reviewed historical contextual translation.',
      });
      setIsEditing(false);
      setStatusMessage({
        type: 'success',
        text: 'Scholarly translation saved to manuscript record.',
      });
      toast.success('Scholarly English translation saved.');
      if (onTranslationUpdated) onTranslationUpdated(res);
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err) {
      toast.error(
        'Failed to save translation: ' +
          (err.response?.data?.message || err.message)
      );
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Stage Header */}
      <div className="border-b border-[#35443a] pb-4">
        <div className="flex items-center space-x-2 text-[11px] font-mono uppercase tracking-wider text-[#d4a373]">
          <span className="w-2 h-2 rounded-full bg-[#d4a373]" />
          <span>Stage 04 of 05 • Bilingual Scholarly Translation</span>
        </div>
        <h2 className="font-heading text-2xl sm:text-3xl font-bold text-[#f1f2e9] mt-1">
          Bilingual Epigraphical Translation
        </h2>
        <p className="text-sm text-[#a9b3a8] mt-1 max-w-3xl">
          Making recovered manuscript text accessible in English while preserving side-by-side alignment with the source script transcription.
        </p>
      </div>

      {/* Translation Metadata Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-[#17211d] border border-[#35443a] text-center">
          <span className="text-[10px] uppercase font-mono text-[#77857b] block">
            ENGINE / SOURCE
          </span>
          <span className="font-mono text-sm font-bold text-[#ccd5ae] truncate block mt-1">
            {translationData?.human_edited
              ? 'Human Scholarly Review'
              : modelName === 'none'
              ? 'Manual / Unconfigured'
              : modelName}
          </span>
          <span className="text-[10px] text-[#a9b3a8] font-mono block">
            {translationData?.human_edited
              ? `Edited by ${translationData.edited_by || 'Scholar'}`
              : 'Translation Pipeline'}
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-[#17211d] border border-[#35443a] text-center">
          <span className="text-[10px] uppercase font-mono text-[#77857b] block">
            SOURCE LANGUAGE
          </span>
          <span className="font-heading text-lg font-bold text-[#fefae0] mt-0.5 block">
            {sourceLanguage === 'mal'
              ? 'Malayalam / Grantha'
              : sourceLanguage.toUpperCase()}
          </span>
          <span className="text-[10px] text-[#a9b3a8] font-mono block">
            OCR Stage Output
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-[#17211d] border border-[#35443a] text-center">
          <span className="text-[10px] uppercase font-mono text-[#77857b] block">
            TARGET LANGUAGE
          </span>
          <span className="font-heading text-lg font-bold text-[#ccd5ae] mt-0.5 block">
            Academic English
          </span>
          <span className="text-[10px] text-[#ccd5ae] font-mono block">
            ISO: en
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-[#17211d] border border-[#35443a] text-center">
          <span className="text-[10px] uppercase font-mono text-[#77857b] block">
            STAGE STATUS
          </span>
          <span className="font-heading text-lg font-bold text-[#d4a373] mt-0.5 block uppercase">
            {translationStatus}
          </span>
          <span className="text-[10px] text-[#d4a373] font-mono block">
            {activeTranslation ? 'Available' : 'Awaiting Input'}
          </span>
        </div>
      </div>

      {/* Status Alert */}
      {statusMessage && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center space-x-2 border ${
            statusMessage.type === 'success'
              ? 'bg-[#ccd5ae]/15 border-[#ccd5ae]/40 text-[#ccd5ae]'
              : 'bg-[#faedcd]/15 border-[#faedcd]/40 text-[#faedcd]'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* BILINGUAL COMPARISON WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Source Script Transcription (6 cols) */}
        <div className="lg:col-span-6 p-5 rounded-2xl bg-[#17211d] border border-[#35443a] space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-[#35443a] pb-3">
            <h3 className="font-heading text-base font-bold text-[#f1f2e9] flex items-center space-x-2">
              <FileText className="w-4 h-4 text-[#e9edc9]" />
              <span>Source Epigraphical Text</span>
            </h3>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#1c2923] text-[#e9edc9] border border-[#35443a]">
              Stage 03 Output
            </span>
          </div>

          <div className="min-h-[340px] max-h-[440px] overflow-y-auto p-4 rounded-xl bg-[#101614] border border-[#35443a] space-y-3 font-indic text-[15px] text-[#f1f2e9] leading-loose">
            {sourceLines.length > 0 ? (
              sourceLines.map((line, idx) => (
                <div
                  key={idx}
                  className="flex items-start space-x-3 border-b border-[#35443a]/40 pb-2 last:border-none"
                >
                  <span className="text-[10px] font-mono text-[#77857b] mt-1 shrink-0 w-6">
                    {idx + 1}.
                  </span>
                  <p className="flex-1">{line}</p>
                </div>
              ))
            ) : (
              <p className="text-xs text-[#77857b] italic">
                No source transcription available from Stage 03 yet.
              </p>
            )}
          </div>

          <div className="text-[11px] text-[#77857b] font-mono flex justify-between items-center">
            <span>Source Script Segments</span>
            <span>{sourceLines.length} Lines</span>
          </div>
        </div>

        {/* Right Column: English Translation (6 cols) */}
        <div className="lg:col-span-6 p-5 rounded-2xl bg-[#17211d] border border-[#35443a] space-y-4 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#35443a] pb-3">
            <h3 className="font-heading text-base font-bold text-[#f1f2e9] flex items-center space-x-2">
              <Languages className="w-4 h-4 text-[#ccd5ae]" />
              <span>English Translation</span>
            </h3>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleCopy}
                disabled={!activeTranslation}
                className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-[#1c2923] hover:bg-[#26372f] disabled:opacity-50 text-[#f1f2e9] border border-[#35443a] flex items-center space-x-1.5 transition-all"
                title="Copy Translation"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-[#ccd5ae]" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsEditing(!isEditing)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all flex items-center space-x-1.5 ${
                  isEditing
                    ? 'bg-[#d4a373] text-[#101614] border-[#d4a373] font-bold'
                    : 'bg-[#1c2923] hover:bg-[#26372f] text-[#d4a373] border-[#35443a]'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{isEditing ? 'View Mode' : 'Enter / Edit Translation'}</span>
              </button>
            </div>
          </div>

          {isEditing ? (
            <form onSubmit={handleSaveEdit} className="space-y-3">
              <textarea
                value={editedTranslation}
                onChange={(e) => setEditedTranslation(e.target.value)}
                rows={10}
                className="w-full p-3.5 rounded-xl bg-[#101614] border border-[#d4a373]/50 text-sm font-sans text-[#fefae0] leading-relaxed focus:outline-none focus:border-[#d4a373]"
                placeholder="Enter scholarly English translation..."
              />
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1.5 rounded-lg text-xs text-[#a9b3a8] hover:text-[#f1f2e9]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider text-[#101614] bg-[#ccd5ae] hover:bg-[#e9edc9] flex items-center space-x-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>
                    {savingEdit ? 'Saving...' : 'Save Scholarly Translation'}
                  </span>
                </button>
              </div>
            </form>
          ) : (
            <div className="min-h-[340px] max-h-[440px] overflow-y-auto p-4 rounded-xl bg-[#101614] border border-[#35443a] space-y-3 text-sm text-[#f1f2e9] leading-relaxed">
              {transLines.length > 0 ? (
                transLines.map((line, idx) => (
                  <div
                    key={idx}
                    className="flex items-start space-x-3 border-b border-[#35443a]/40 pb-2 last:border-none"
                  >
                    <span className="text-[10px] font-mono text-[#d4a373] mt-1 shrink-0 w-6">
                      {idx + 1}.
                    </span>
                    <p className="flex-1 font-serif text-[15px] text-[#fefae0]">
                      {line}
                    </p>
                  </div>
                ))
              ) : (
                <div className="py-10 px-4 text-center space-y-3">
                  <AlertTriangle className="w-7 h-7 text-[#faedcd] mx-auto" />
                  <p className="text-xs text-[#fefae0] font-medium">
                    No automated English translation generated for this manuscript.
                  </p>
                  <p className="text-xs text-[#a9b3a8] max-w-md mx-auto leading-relaxed">
                    {statusReason ||
                      'When local TRANSLATION_ENGINE is set to none, the pipeline never fabricates fake English text. Researchers can enter a verified English translation directly or trigger a configured translation engine.'}
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider text-[#101614] bg-[#ccd5ae] hover:bg-[#e9edc9] transition-all"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Enter Scholarly Translation</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleGenerate}
                      disabled={translating || !sourceText}
                      className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-mono text-[#e9edc9] bg-[#1c2923] border border-[#35443a] hover:border-[#ccd5ae]/50 disabled:opacity-50 transition-all"
                    >
                      <RefreshCw
                        className={`w-3.5 h-3.5 ${translating ? 'animate-spin' : ''}`}
                      />
                      <span>
                        {translating ? 'Requesting Engine...' : 'Attempt Auto-Translate'}
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="text-[11px] text-[#77857b] font-mono flex justify-between items-center">
            <span>Translation Record</span>
            <span className="text-[#ccd5ae]">{transLines.length} Translated Lines</span>
          </div>
        </div>
      </div>

      {/* Segment Mapping Visualisation */}
      <div className="p-5 rounded-2xl bg-[#17211d] border border-[#35443a] space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-[#35443a] pb-3">
          <div>
            <h3 className="font-heading text-lg font-bold text-[#f1f2e9] flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-[#ccd5ae]" />
              <span>Segment Alignment &amp; Coverage</span>
            </h3>
            <p className="text-xs text-[#a9b3a8] mt-0.5">
              Actual line count comparison between extracted source transcription and English translation.
            </p>
          </div>
          <span className="text-xs font-mono text-[#ccd5ae] px-2.5 py-1 rounded bg-[#1c2923] border border-[#35443a]">
            {coverageRatio}
          </span>
        </div>

        <div className="h-36 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={coverageData}
              layout="vertical"
              margin={{ top: 10, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#35443a" opacity={0.5} />
              <XAxis
                type="number"
                stroke="#77857b"
                tick={{ fill: '#a9b3a8', fontSize: 10 }}
              />
              <YAxis
                dataKey="name"
                type="category"
                width={130}
                stroke="#77857b"
                tick={{ fill: '#a9b3a8', fontSize: 11 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#101614',
                  borderColor: '#35443a',
                  borderRadius: '8px',
                  color: '#fefae0',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {coverageData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
