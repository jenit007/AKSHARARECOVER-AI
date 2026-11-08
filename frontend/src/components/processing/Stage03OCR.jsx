import React, { useState, useEffect } from 'react';
import {
  FileText,
  Copy,
  Check,
  Edit3,
  Save,
  Activity,
  Eye,
  CheckCircle2,
  Columns,
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
import { getOCRComparison, correctTranscription } from '../../services/manuscriptService';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

export default function Stage03OCR({
  manuscriptId,
  enhancedUrl,
  originalUrl,
  ocrData,
  onCorrectionSaved,
}) {
  const toast = useToast();
  const { user } = useAuth();
  const [ocrComparison, setOcrComparison] = useState(null);
  const [selectedLineIndex, setSelectedLineIndex] = useState(null);
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showRawVsEnhanced, setShowRawVsEnhanced] = useState(false);
  const [editedText, setEditedText] = useState('');
  const [savingCorrection, setSavingCorrection] = useState(false);
  const [correctionSuccess, setCorrectionSuccess] = useState(false);
  const [imgNaturalDims, setImgNaturalDims] = useState({ width: null, height: null });

  useEffect(() => {
    if (!manuscriptId) return;
    let isMounted = true;

    async function loadOcrData() {
      try {
        const res = await getOCRComparison(manuscriptId);
        if (isMounted && res) {
          setOcrComparison(res);
          const initialText =
            res.selected_text ||
            res.enhanced_ocr?.text ||
            res.original_ocr?.text ||
            '';
          setEditedText(initialText);
        }
      } catch (err) {
        console.warn('Could not load OCR comparison endpoint:', err);
      }
    }

    loadOcrData();
    return () => {
      isMounted = false;
    };
  }, [manuscriptId]);

  const activeOcr = ocrComparison || ocrData || {};
  const originalOcrText =
    activeOcr.original_ocr?.text ||
    activeOcr.original_image_text ||
    activeOcr.original_text ||
    '';
  const enhancedOcrText =
    activeOcr.enhanced_ocr?.text ||
    activeOcr.enhanced_image_text ||
    activeOcr.enhanced_text ||
    '';
  const currentText =
    activeOcr.selected_text || enhancedOcrText || originalOcrText || '';
  const confidence = activeOcr.confidence_summary || {};
  const uncertainRegions =
    activeOcr.uncertain_regions ||
    activeOcr.enhanced_ocr?.uncertain_regions ||
    [];
  const textRegions =
    activeOcr.text_regions ||
    activeOcr.enhanced_ocr?.regions ||
    [];
  const engineName =
    activeOcr.engine ||
    activeOcr.enhanced_ocr?.engine ||
    ocrData?.engine ||
    'Not available';

  // Split lines from real extracted text
  const lines = currentText
    ? currentText.split('\n').filter((l) => l.trim().length > 0)
    : [];

  // Only build chart data from REAL per-line confidence values (zero fabricated numbers)
  const lineChartData = textRegions
    .filter((reg) => typeof reg?.confidence === 'number' && !Number.isNaN(reg.confidence))
    .map((reg, idx) => {
      const confVal = Number((reg.confidence * 100).toFixed(1));
      let color = '#ccd5ae';
      if (confVal < 70) color = '#faedcd';
      else if (confVal < 85) color = '#d4a373';
      return {
        lineLabel: `Seg ${reg.line_number || idx + 1}`,
        text: reg.text || '',
        confidence: confVal,
        fill: color,
      };
    });

  const handleCopy = () => {
    if (!currentText) return;
    navigator.clipboard.writeText(currentText);
    setCopied(true);
    toast.info('Extracted transcription copied to clipboard.');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveCorrection = async (e) => {
    e.preventDefault();
    if (!manuscriptId || !editedText.trim()) return;
    try {
      setSavingCorrection(true);
      await correctTranscription(manuscriptId, {
        corrected_text: editedText,
        reviewer: user?.full_name || 'Authenticated Scholar',
        notes: 'Human verified transcription committed to permanent record.',
      });
      setIsEditing(false);
      setCorrectionSuccess(true);
      toast.success('Epigraphical correction saved to manuscript record.');
      if (onCorrectionSaved) onCorrectionSaved();
      setTimeout(() => setCorrectionSuccess(false), 3000);
    } catch (err) {
      toast.error(
        'Failed to save correction: ' +
          (err.response?.data?.message || err.message)
      );
    } finally {
      setSavingCorrection(false);
    }
  };

  const selectedRegionBox =
    selectedLineIndex !== null && textRegions[selectedLineIndex]?.bounding_box
      ? textRegions[selectedLineIndex].bounding_box
      : null;

  return (
    <div className="space-y-6">
      {/* Stage Header */}
      <div className="border-b border-[#35443a] pb-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-[11px] font-mono uppercase tracking-wider text-[#ccd5ae]">
            <span className="w-2 h-2 rounded-full bg-[#ccd5ae]" />
            <span>Stage 03 of 05 • Script Recognition &amp; Scholarly Review</span>
          </div>
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-[#f1f2e9] mt-1">
            Enhanced-Image OCR &amp; Epigraphical Transcription
          </h2>
          <p className="text-sm text-[#a9b3a8] mt-1 max-w-3xl">
            Extracting script lines from both the raw scan and the CLAHE-enhanced image. Low-confidence segments are flagged for human verification.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowRawVsEnhanced(!showRawVsEnhanced)}
          className={`px-3.5 py-2 rounded-xl text-xs font-mono border transition-all flex items-center space-x-1.5 ${
            showRawVsEnhanced
              ? 'bg-[#ccd5ae] text-[#101614] border-[#ccd5ae] font-bold'
              : 'bg-[#17211d] text-[#e9edc9] border-[#35443a] hover:border-[#ccd5ae]/50'
          }`}
        >
          <Columns className="w-3.5 h-3.5" />
          <span>{showRawVsEnhanced ? 'Hide Raw vs Enhanced OCR' : 'Compare Raw vs Enhanced OCR'}</span>
        </button>
      </div>

      {/* Recognition Summary Metrics Bar — Strictly Real Values Only */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-[#17211d] border border-[#35443a] text-center">
          <span className="text-[10px] uppercase font-mono text-[#77857b] block">
            AVG CONFIDENCE
          </span>
          <span className="font-heading text-2xl font-bold text-[#ccd5ae]">
            {typeof confidence.average_confidence === 'number'
              ? `${(confidence.average_confidence * 100).toFixed(1)}%`
              : 'Not available'}
          </span>
          <span className="text-[10px] text-[#a9b3a8] font-mono block mt-0.5">
            Engine: {engineName}
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-[#17211d] border border-[#35443a] text-center">
          <span className="text-[10px] uppercase font-mono text-[#77857b] block">
            RECOGNIZED LINES
          </span>
          <span className="font-heading text-2xl font-bold text-[#fefae0]">
            {typeof confidence.total_lines === 'number'
              ? confidence.total_lines
              : lines.length}
          </span>
          <span className="text-[10px] text-[#a9b3a8] font-mono block mt-0.5">
            Extracted Segments
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-[#17211d] border border-[#35443a] text-center">
          <span className="text-[10px] uppercase font-mono text-[#77857b] block">
            CONFIDENT LINES
          </span>
          <span className="font-heading text-2xl font-bold text-[#ccd5ae]">
            {typeof confidence.confident_lines === 'number'
              ? confidence.confident_lines
              : 'Not available'}
          </span>
          <span className="text-[10px] text-[#ccd5ae] font-mono block mt-0.5">
            &ge; 0.70 Threshold
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-[#17211d] border border-[#35443a] text-center">
          <span className="text-[10px] uppercase font-mono text-[#77857b] block">
            UNCERTAIN SEGMENTS
          </span>
          <span className="font-heading text-2xl font-bold text-[#faedcd]">
            {typeof confidence.uncertain_lines === 'number'
              ? confidence.uncertain_lines
              : uncertainRegions.length}
          </span>
          <span className="text-[10px] text-[#faedcd] font-mono block mt-0.5">
            Flagged for Review
          </span>
        </div>
      </div>

      {/* Optional Raw vs Enhanced OCR Comparison Panel */}
      {showRawVsEnhanced && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-2xl bg-[#17211d] border border-[#35443a]">
          <div className="p-4 rounded-xl bg-[#101614] border border-[#35443a] space-y-2">
            <div className="flex justify-between items-center text-xs font-mono text-[#e9edc9] border-b border-[#35443a] pb-2">
              <span>OCR ON RAW ORIGINAL IMAGE</span>
              <span className="text-[#77857b]">
                {typeof activeOcr.original_ocr?.confidence_summary?.average_confidence === 'number'
                  ? `Avg: ${(activeOcr.original_ocr.confidence_summary.average_confidence * 100).toFixed(1)}%`
                  : 'Baseline'}
              </span>
            </div>
            <pre className="text-xs font-indic text-[#a9b3a8] whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
              {originalOcrText || 'No text extracted from raw image.'}
            </pre>
          </div>

          <div className="p-4 rounded-xl bg-[#101614] border border-[#ccd5ae]/40 space-y-2">
            <div className="flex justify-between items-center text-xs font-mono text-[#ccd5ae] border-b border-[#35443a] pb-2">
              <span>OCR ON CLAHE ENHANCED IMAGE</span>
              <span>
                {typeof activeOcr.enhanced_ocr?.confidence_summary?.average_confidence === 'number'
                  ? `Avg: ${(activeOcr.enhanced_ocr.confidence_summary.average_confidence * 100).toFixed(1)}%`
                  : 'Enhanced'}
              </span>
            </div>
            <pre className="text-xs font-indic text-[#fefae0] whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
              {enhancedOcrText || 'No text extracted from enhanced image.'}
            </pre>
          </div>
        </div>
      )}

      {/* TWO-COLUMN EPIGRAPHICAL WORKBENCH */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Enhanced Manuscript Image with Real Bounding Box Highlight (6 cols) */}
        <div className="lg:col-span-6 p-5 rounded-2xl bg-[#17211d] border border-[#35443a] space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-[#35443a] pb-3">
            <h3 className="font-heading text-base font-bold text-[#f1f2e9] flex items-center space-x-2">
              <Eye className="w-4 h-4 text-[#ccd5ae]" />
              <span>Input: Enhanced Manuscript Folio</span>
            </h3>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#1c2923] text-[#ccd5ae] border border-[#35443a]">
              CLAHE Normalized
            </span>
          </div>

          <div className="relative min-h-[380px] max-h-[500px] flex items-center justify-center bg-[#101614] rounded-xl overflow-hidden border border-[#35443a] p-2">
            <div className="relative inline-block max-h-[460px]">
              <img
                src={enhancedUrl || originalUrl || '/assets/sample_enhanced.png'}
                alt="Enhanced Scan for OCR"
                onLoad={(e) => {
                  const { naturalWidth, naturalHeight } = e.currentTarget;
                  if (naturalWidth && naturalHeight) {
                    setImgNaturalDims({ width: naturalWidth, height: naturalHeight });
                  }
                }}
                className="max-h-[460px] w-auto object-contain block"
              />

              {/* Highlight Actual OCR Bounding Box if coordinates exist */}
              {selectedRegionBox &&
                selectedRegionBox.length === 4 &&
                imgNaturalDims.width &&
                imgNaturalDims.height && (
                  <div
                    className="absolute border-2 border-[#ccd5ae] bg-[#ccd5ae]/20 rounded pointer-events-none transition-all duration-200"
                    style={{
                      left: `${Math.max(0, (selectedRegionBox[0] / imgNaturalDims.width) * 100)}%`,
                      top: `${Math.max(0, (selectedRegionBox[1] / imgNaturalDims.height) * 100)}%`,
                      width: `${Math.min(100, ((selectedRegionBox[2] - selectedRegionBox[0]) / imgNaturalDims.width) * 100)}%`,
                      height: `${Math.min(100, ((selectedRegionBox[3] - selectedRegionBox[1]) / imgNaturalDims.height) * 100)}%`,
                    }}
                  >
                    <span className="absolute -top-5 left-0 px-1.5 py-0.5 rounded bg-[#101614] text-[#ccd5ae] text-[9px] font-mono border border-[#ccd5ae] whitespace-nowrap">
                      Segment {selectedLineIndex + 1}
                    </span>
                  </div>
                )}
            </div>
          </div>

          <div className="flex items-center justify-between text-xs font-mono text-[#77857b]">
            <span>Click a recognized segment on the right to inspect coordinates</span>
            <span className="text-[#ccd5ae]">Engine: {engineName}</span>
          </div>
        </div>

        {/* Right Column: Recognized Text & Human Editor (6 cols) */}
        <div className="lg:col-span-6 p-5 rounded-2xl bg-[#17211d] border border-[#35443a] space-y-4 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#35443a] pb-3">
            <div>
              <h3 className="font-heading text-base font-bold text-[#f1f2e9] flex items-center space-x-2">
                <FileText className="w-4 h-4 text-[#d4a373]" />
                <span>Extracted Script Transcription</span>
              </h3>
              <span className="text-[10px] font-mono text-[#a9b3a8]">
                {activeOcr.human_corrected
                  ? `Human Verified by ${activeOcr.corrected_by || 'Scholar'}`
                  : 'Automated OCR Output — Editable by Researcher'}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleCopy}
                disabled={!currentText}
                className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-[#1c2923] hover:bg-[#26372f] disabled:opacity-50 text-[#f1f2e9] border border-[#35443a] flex items-center space-x-1.5 transition-all"
                title="Copy entire transcription"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-[#ccd5ae]" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>{copied ? 'Copied' : 'Copy Text'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (!isEditing && !editedText) {
                    setEditedText(currentText);
                  }
                  setIsEditing(!isEditing);
                }}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all flex items-center space-x-1.5 ${
                  isEditing
                    ? 'bg-[#d4a373] text-[#101614] border-[#d4a373] font-bold'
                    : 'bg-[#1c2923] hover:bg-[#26372f] text-[#d4a373] border-[#35443a]'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{isEditing ? 'View Mode' : 'Correct'}</span>
              </button>
            </div>
          </div>

          {correctionSuccess && (
            <div className="p-3 rounded-lg bg-[#ccd5ae]/15 border border-[#ccd5ae]/40 text-[#ccd5ae] text-xs flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Epigraphical correction saved to manuscript record.</span>
            </div>
          )}

          {isEditing ? (
            <form onSubmit={handleSaveCorrection} className="space-y-3">
              <textarea
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
                rows={10}
                className="w-full p-3.5 rounded-xl bg-[#101614] border border-[#d4a373]/50 text-sm font-indic text-[#fefae0] leading-relaxed focus:outline-none focus:border-[#d4a373]"
                placeholder="Enter scholarly transcription correction..."
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
                  disabled={savingCorrection}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider text-[#101614] bg-[#ccd5ae] hover:bg-[#e9edc9] flex items-center space-x-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{savingCorrection ? 'Saving...' : 'Commit Correction'}</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {textRegions.length > 0 ? (
                textRegions.map((reg, idx) => {
                  const isSelected = selectedLineIndex === idx;
                  const regConf =
                    typeof reg.confidence === 'number'
                      ? `${(reg.confidence * 100).toFixed(1)}%`
                      : null;
                  const isLowConf =
                    typeof reg.confidence === 'number' && reg.confidence < 0.7;
                  return (
                    <div
                      key={idx}
                      onClick={() => setSelectedLineIndex(isSelected ? null : idx)}
                      className={`p-3 rounded-xl border text-sm transition-all cursor-pointer flex items-start justify-between gap-3 ${
                        isSelected
                          ? 'bg-[#1c2923] border-[#ccd5ae] text-[#fefae0] shadow-md'
                          : 'bg-[#101614] border-[#35443a] text-[#f1f2e9] hover:border-[#ccd5ae]/50'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <span className="text-[10px] font-mono text-[#77857b] mt-0.5 w-8">
                          S{reg.line_number || idx + 1}
                        </span>
                        <p className="leading-relaxed font-indic text-[15px]">
                          {reg.text}
                        </p>
                      </div>

                      <div className="flex items-center space-x-1.5 shrink-0">
                        {regConf && (
                          <span
                            className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                              isLowConf
                                ? 'bg-[#faedcd]/15 text-[#faedcd] border-[#faedcd]/40'
                                : 'bg-[#1c2923] text-[#ccd5ae] border-[#35443a]'
                            }`}
                          >
                            {regConf}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : lines.length > 0 ? (
                lines.map((line, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl border border-[#35443a] bg-[#101614] text-sm text-[#f1f2e9] flex items-start space-x-3"
                  >
                    <span className="text-[10px] font-mono text-[#77857b] mt-0.5 w-6">
                      L{idx + 1}
                    </span>
                    <p className="leading-relaxed font-indic text-[15px]">{line}</p>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-xs text-[#77857b] border border-dashed border-[#35443a] rounded-xl">
                  No OCR text extracted from this image. Click &ldquo;Correct&rdquo; above to enter a manual scholarly transcription.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Graphical Data Visualisation: Line-by-Line Confidence Chart (Only when real confidence scores exist) */}
      <div className="p-5 rounded-2xl bg-[#17211d] border border-[#35443a] space-y-4 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#35443a] pb-3">
          <div>
            <h3 className="font-heading text-lg font-bold text-[#f1f2e9] flex items-center space-x-2">
              <Activity className="w-4 h-4 text-[#ccd5ae]" />
              <span>Segment-by-Segment OCR Confidence Scores</span>
            </h3>
            <p className="text-xs text-[#a9b3a8] mt-0.5">
              Measured recognition confidence returned by the active OCR engine ({engineName}).
            </p>
          </div>

          <div className="flex items-center space-x-3 text-xs font-mono">
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded-sm bg-[#ccd5ae]" />
              <span className="text-[#ccd5ae]">&ge; 85% High</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded-sm bg-[#d4a373]" />
              <span className="text-[#d4a373]">70–84% Medium</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded-sm bg-[#faedcd]" />
              <span className="text-[#faedcd]">&lt; 70% Flagged</span>
            </div>
          </div>
        </div>

        {lineChartData.length > 0 ? (
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={lineChartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#35443a" opacity={0.5} />
                <XAxis
                  dataKey="lineLabel"
                  stroke="#77857b"
                  tick={{ fill: '#a9b3a8', fontSize: 10 }}
                  tickLine={{ stroke: '#35443a' }}
                />
                <YAxis
                  domain={[0, 100]}
                  stroke="#77857b"
                  tick={{ fill: '#a9b3a8', fontSize: 10 }}
                  tickLine={{ stroke: '#35443a' }}
                  unit="%"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#101614',
                    borderColor: '#35443a',
                    borderRadius: '8px',
                    color: '#fefae0',
                    fontSize: '12px',
                  }}
                  formatter={(value, name, item) => [
                    `${value}% Confidence`,
                    item.payload.text?.slice(0, 40) || 'Segment',
                  ]}
                />
                <Bar
                  dataKey="confidence"
                  radius={[4, 4, 0, 0]}
                  onClick={(entry, idx) => setSelectedLineIndex(idx)}
                  className="cursor-pointer"
                >
                  {lineChartData.map((entry, index) => (
                    <Cell key={`bar-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-36 flex items-center justify-center text-xs text-[#77857b] border border-dashed border-[#35443a] rounded-xl">
            Per-segment OCR confidence scores are not available for this transcription.
          </div>
        )}

        <div className="text-[11px] text-[#77857b] font-mono leading-relaxed bg-[#101614] p-3 rounded-lg border border-[#35443a]">
          <strong className="text-[#ccd5ae]">Scholarly Clarification:</strong> OCR confidence reflects the sequence recognizer&apos;s statistical certainty and is provided to assist human epigraphists in prioritizing review of worn or complex ligatures.
        </div>
      </div>
    </div>
  );
}
