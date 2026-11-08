import React, { useState } from 'react';
import { AlertCircle, Save, UserCheck } from 'lucide-react';
import { Badge } from '../common/CommonUI';
import { correctTranscription } from '../../services/manuscriptService';

export default function OCRTranscriptionEditor({
  manuscriptId,
  ocrData,
  onCorrectionSaved,
  reviewerDefault = 'Authenticated Researcher',
}) {
  const [activeTab, setActiveTab] = useState('selected'); // 'selected', 'enhanced', 'original', 'uncertain'
  const [correctedText, setCorrectedText] = useState(
    ocrData?.selected_text || ocrData?.enhanced_text || ocrData?.original_text || ''
  );
  const [reviewer, setReviewer] = useState(reviewerDefault);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  const confidence = ocrData?.confidence_summary || {};
  const uncertainRegions = ocrData?.uncertain_regions || [];

  const handleSaveCorrection = async (e) => {
    e.preventDefault();
    if (!manuscriptId || !correctedText.trim()) return;

    try {
      setSaving(true);
      setStatusMessage(null);
      const res = await correctTranscription(manuscriptId, {
        corrected_text: correctedText,
        reviewer,
        notes,
      });
      setStatusMessage({
        type: 'success',
        text: `Correction saved as Version ${res.version_number || 'updated'}.`,
      });
      if (onCorrectionSaved) onCorrectionSaved(res);
    } catch (err) {
      console.error('Failed to correct transcription:', err);
      setStatusMessage({
        type: 'error',
        text:
          err.response?.data?.message ||
          err.message ||
          'Failed to save correction',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* OCR Metrics Header */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 text-center rounded-xl bg-[#17211d] border border-[#35443a]">
          <span className="text-[10px] uppercase font-mono text-[#77857b] block">
            Avg Confidence
          </span>
          <span className="font-heading text-2xl font-bold text-[#ccd5ae]">
            {typeof confidence.average_confidence === 'number'
              ? `${(confidence.average_confidence * 100).toFixed(1)}%`
              : 'Not available'}
          </span>
          <span className="text-[10px] text-[#d4a373] font-mono block mt-0.5">
            Engine: {ocrData?.engine || 'Not available'}
          </span>
        </div>

        <div className="p-3 text-center rounded-xl bg-[#17211d] border border-[#35443a]">
          <span className="text-[10px] uppercase font-mono text-[#77857b] block">
            Total Lines Extracted
          </span>
          <span className="font-heading text-2xl font-bold text-[#f1f2e9]">
            {typeof confidence.total_lines === 'number'
              ? confidence.total_lines
              : 'Not available'}
          </span>
          <span className="text-[10px] text-[#a9b3a8] block mt-0.5">
            Extracted Segments
          </span>
        </div>

        <div className="p-3 text-center rounded-xl bg-[#17211d] border border-[#35443a]">
          <span className="text-[10px] uppercase font-mono text-[#77857b] block">
            Confident Lines
          </span>
          <span className="font-heading text-2xl font-bold text-[#ccd5ae]">
            {typeof confidence.confident_lines === 'number'
              ? confidence.confident_lines
              : 'Not available'}
          </span>
          <span className="text-[10px] text-[#ccd5ae] font-mono block mt-0.5">
            &ge; 0.70 threshold
          </span>
        </div>

        <div className="p-3 text-center rounded-xl bg-[#17211d] border border-[#35443a]">
          <span className="text-[10px] uppercase font-mono text-[#77857b] block">
            Uncertain Glyphs
          </span>
          <span className="font-heading text-2xl font-bold text-[#faedcd]">
            {typeof confidence.uncertain_lines === 'number'
              ? confidence.uncertain_lines
              : uncertainRegions.length}
          </span>
          <span className="text-[10px] text-[#faedcd] block mt-0.5">
            Needs review
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-[#17211d] rounded-xl border border-[#35443a] p-4 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between border-b border-[#35443a] pb-3 gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('selected')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                activeTab === 'selected'
                  ? 'bg-[#ccd5ae] text-[#101614] font-bold shadow-sm'
                  : 'text-[#a9b3a8] hover:bg-[#1c2923] hover:text-[#f1f2e9]'
              }`}
            >
              Active Transcription (Editable)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('enhanced')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                activeTab === 'enhanced'
                  ? 'bg-[#d4a373] text-[#101614] font-bold shadow-sm'
                  : 'text-[#a9b3a8] hover:bg-[#1c2923] hover:text-[#f1f2e9]'
              }`}
            >
              Enhanced Image OCR
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('original')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                activeTab === 'original'
                  ? 'bg-[#1c2923] text-[#f1f2e9] border border-[#35443a]'
                  : 'text-[#a9b3a8] hover:bg-[#1c2923] hover:text-[#f1f2e9]'
              }`}
            >
              Original Image OCR
            </button>
            {uncertainRegions.length > 0 && (
              <button
                type="button"
                onClick={() => setActiveTab('uncertain')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center space-x-1 ${
                  activeTab === 'uncertain'
                    ? 'bg-[#faedcd] text-[#101614] font-bold'
                    : 'text-[#faedcd] bg-[#faedcd]/15 hover:bg-[#faedcd]/25'
                }`}
              >
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Uncertain Glyphs ({uncertainRegions.length})</span>
              </button>
            )}
          </div>

          <div className="text-xs text-[#77857b] flex items-center space-x-1 font-mono">
            <UserCheck className="w-4 h-4 text-[#ccd5ae]" />
            <span>Human-in-the-Loop Verification</span>
          </div>
        </div>

        {statusMessage && (
          <div
            className={`p-3 rounded-lg text-xs font-medium border ${
              statusMessage.type === 'success'
                ? 'bg-[#ccd5ae]/15 border-[#ccd5ae]/40 text-[#ccd5ae]'
                : 'bg-[#d4a373]/15 border-[#d4a373]/40 text-[#d4a373]'
            }`}
          >
            {statusMessage.text}
          </div>
        )}

        {activeTab === 'selected' && (
          <form onSubmit={handleSaveCorrection} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#a9b3a8] mb-1.5 font-mono">
                Transcription (Malayalam / Grantha / Sanskrit)
              </label>
              <textarea
                rows={8}
                value={correctedText}
                onChange={(e) => setCorrectedText(e.target.value)}
                className="w-full p-4 rounded-lg border border-[#35443a] bg-[#101614] text-[#f1f2e9] font-indic text-base leading-relaxed focus:border-[#ccd5ae] focus:outline-none shadow-inner"
                placeholder="Transcribed manuscript text will appear here for review and correction..."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#77857b] mb-1 font-mono">
                  Reviewing Epigraphist / Researcher
                </label>
                <input
                  type="text"
                  value={reviewer}
                  onChange={(e) => setReviewer(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-[#35443a] bg-[#101614] text-xs font-sans text-[#f1f2e9] focus:border-[#ccd5ae] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#77857b] mb-1 font-mono">
                  Epigraphical Revision Notes
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Corrected faded conjunct in line 3"
                  className="w-full px-3 py-2 rounded-md border border-[#35443a] bg-[#101614] text-xs font-sans text-[#f1f2e9] focus:border-[#ccd5ae] focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-[#77857b]">
                Saving commits a human-verified revision to the archival ledger.
              </span>
              <button
                type="submit"
                disabled={saving || !correctedText.trim()}
                className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider text-[#101614] bg-[#ccd5ae] hover:bg-[#e9edc9] shadow-md transition-all disabled:opacity-50"
              >
                <Save className="w-4 h-4 text-[#101614]" />
                <span>
                  {saving ? 'Saving Revision...' : 'Save & Certify Transcription'}
                </span>
              </button>
            </div>
          </form>
        )}

        {activeTab === 'enhanced' && (
          <div className="space-y-2">
            <div className="text-xs text-[#77857b] flex items-center justify-between">
              <span>Extracted from high-contrast enhanced image.</span>
              <button
                type="button"
                onClick={() => {
                  setCorrectedText(ocrData?.enhanced_text || '');
                  setActiveTab('selected');
                }}
                className="text-xs text-[#ccd5ae] font-semibold hover:underline font-mono"
              >
                Copy to Active Editor &rarr;
              </button>
            </div>
            <pre className="p-4 rounded-lg bg-[#101614] border border-[#35443a] font-indic text-sm text-[#f1f2e9] whitespace-pre-wrap leading-relaxed max-h-[300px] overflow-y-auto">
              {ocrData?.enhanced_text ||
                'No text extracted from enhanced image yet.'}
            </pre>
          </div>
        )}

        {activeTab === 'original' && (
          <div className="space-y-2">
            <div className="text-xs text-[#77857b] flex items-center justify-between">
              <span>Baseline extraction on raw unprocessed folio.</span>
              <button
                type="button"
                onClick={() => {
                  setCorrectedText(ocrData?.original_text || '');
                  setActiveTab('selected');
                }}
                className="text-xs text-[#ccd5ae] font-semibold hover:underline font-mono"
              >
                Copy to Active Editor &rarr;
              </button>
            </div>
            <pre className="p-4 rounded-lg bg-[#101614] border border-[#35443a] font-indic text-sm text-[#a9b3a8] whitespace-pre-wrap leading-relaxed max-h-[300px] overflow-y-auto">
              {ocrData?.original_text || 'No baseline text available.'}
            </pre>
          </div>
        )}

        {activeTab === 'uncertain' && (
          <div className="space-y-3">
            <p className="text-xs text-[#77857b]">
              Segments scoring below confidence 0.70 for priority verification:
            </p>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {uncertainRegions.map((region, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg border border-[#35443a] bg-[#101614] flex items-center justify-between"
                >
                  <div>
                    <span className="font-indic text-sm font-bold text-[#d4a373] mr-3">
                      {region.text}
                    </span>
                    <span className="text-xs text-[#a9b3a8]">
                      {region.reason || 'Low optical contrast / damaged ligature'}
                    </span>
                  </div>
                  <Badge variant="bronze" size="xs">
                    {typeof region.confidence === 'number'
                      ? `${(region.confidence * 100).toFixed(0)}%`
                      : 'Flagged'}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
