import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Sparkles,
  Eye,
  Activity,
  Layers,
  CheckCircle2,
  Image as ImageIcon,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import ImageComparisonSlider from '../manuscript/ImageComparisonSlider';
import ManuscriptViewer from '../manuscript/ManuscriptViewer';
import { getHistogramComparison, getManuscriptArtifacts } from '../../services/manuscriptService';
import { resolveImageUrl } from '../../services/fileService';

export default function Stage01Enhancement({
  manuscriptId,
  originalUrl,
  enhancedUrl,
  metrics,
}) {
  const [viewMode, setViewMode] = useState('slider'); // 'slider', 'sidebyside', 'intermediate', 'viewer'
  const [histogramData, setHistogramData] = useState([]);
  const [measuredMetrics, setMeasuredMetrics] = useState(null);
  const [artifacts, setArtifacts] = useState({});
  const [activeIntermediateKey, setActiveIntermediateKey] = useState('clahe_contrast');
  const [loadingHistogram, setLoadingHistogram] = useState(false);

  useEffect(() => {
    if (!manuscriptId) return;
    let isMounted = true;

    async function loadData() {
      try {
        setLoadingHistogram(true);
        const [histRes, artRes] = await Promise.all([
          getHistogramComparison(manuscriptId).catch(() => null),
          getManuscriptArtifacts(manuscriptId).catch(() => null),
        ]);
        if (isMounted) {
          if (histRes?.histogram?.length > 0) {
            setHistogramData(histRes.histogram);
          }
          if (histRes?.metrics) {
            setMeasuredMetrics(histRes.metrics);
          }
          if (artRes) {
            setArtifacts(artRes.intermediate_enhanced || artRes.artifacts || artRes);
          }
        }
      } catch (err) {
        console.warn('Could not load Stage 01 enhancement details:', err);
      } finally {
        if (isMounted) setLoadingHistogram(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [manuscriptId]);

  const origMetrics = measuredMetrics?.original || metrics?.before || {};
  const enhMetrics = measuredMetrics?.enhanced || metrics?.after || {};

  const intermediateSteps = [
    {
      key: 'grayscale',
      label: '01. Grayscale Luminance',
      method: 'cv2.cvtColor(BGR2GRAY)',
      desc: 'Single-channel intensity normalization isolating organic fiber contrast from color cast.',
      url: artifacts.grayscale ? resolveImageUrl(artifacts.grayscale) : originalUrl,
    },
    {
      key: 'denoised',
      label: '02. Non-Local Means Denoised',
      method: 'cv2.fastNlMeansDenoising (h=10)',
      desc: 'Suppresses high-frequency sensor grain and micro-speckling while preserving character edges.',
      url: artifacts.denoised ? resolveImageUrl(artifacts.denoised) : enhancedUrl,
    },
    {
      key: 'clahe_contrast',
      label: '03. CLAHE Local Contrast',
      method: 'cv2.createCLAHE (clipLimit=2.5, tileGrid=8×8)',
      desc: 'Equalizes local histogram tiles to recover faded stylus incisions in darkened leaf zones.',
      url: (artifacts.contrast_enhanced || artifacts.clahe_contrast)
        ? resolveImageUrl(artifacts.contrast_enhanced || artifacts.clahe_contrast)
        : enhancedUrl,
    },
    {
      key: 'enhanced_final',
      label: '04. Unsharp Edge Sharpening',
      method: 'cv2.addWeighted(clahe, 1.5, gaussian, -0.5, 0)',
      desc: 'Final edge-sharpened output prepared for Stage 03 OCR character segmentation.',
      url: (artifacts.final_enhanced || artifacts.enhanced_final)
        ? resolveImageUrl(artifacts.final_enhanced || artifacts.enhanced_final)
        : enhancedUrl,
    },
  ];

  const activeStepObj =
    intermediateSteps.find((s) => s.key === activeIntermediateKey) || intermediateSteps[2];

  const formatMetric = (val, decimals = 1, prefix = '') => {
    if (typeof val === 'number' && !Number.isNaN(val)) {
      return `${prefix}${val.toFixed(decimals)}`;
    }
    return 'Not available';
  };

  return (
    <div className="space-y-6">
      {/* Stage Header */}
      <div className="border-b border-[#35443a] pb-4">
        <div className="flex items-center space-x-2 text-[11px] font-mono uppercase tracking-wider text-[#ccd5ae]">
          <span className="w-2 h-2 rounded-full bg-[#ccd5ae]" />
          <span>Stage 01 of 05 • Non-Destructive Image Processing</span>
        </div>
        <h2 className="font-heading text-2xl sm:text-3xl font-bold text-[#f1f2e9] mt-1">
          Adaptive Image Enhancement
        </h2>
        <p className="text-sm text-[#a9b3a8] mt-1 max-w-3xl">
          Improving manuscript legibility while preserving the original scan unchanged. Deterministic OpenCV preprocessing applies grayscale conversion, Fast Non-Local Means denoising, CLAHE local contrast equalization, and unsharp masking.
        </p>
      </div>

      {/* View Mode Toggle Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#17211d] p-3 rounded-xl border border-[#35443a]">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-mono uppercase text-[#77857b] mr-1">Visual Mode:</span>
          <button
            type="button"
            onClick={() => setViewMode('slider')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center space-x-1.5 ${
              viewMode === 'slider'
                ? 'bg-[#ccd5ae] text-[#101614] font-bold shadow-sm'
                : 'text-[#a9b3a8] hover:bg-[#1c2923] hover:text-[#f1f2e9]'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Split Slider</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('sidebyside')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center space-x-1.5 ${
              viewMode === 'sidebyside'
                ? 'bg-[#ccd5ae] text-[#101614] font-bold shadow-sm'
                : 'text-[#a9b3a8] hover:bg-[#1c2923] hover:text-[#f1f2e9]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Side-by-Side</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('intermediate')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center space-x-1.5 ${
              viewMode === 'intermediate'
                ? 'bg-[#ccd5ae] text-[#101614] font-bold shadow-sm'
                : 'text-[#a9b3a8] hover:bg-[#1c2923] hover:text-[#f1f2e9]'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Pipeline Sub-Stages</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('viewer')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center space-x-1.5 ${
              viewMode === 'viewer'
                ? 'bg-[#ccd5ae] text-[#101614] font-bold shadow-sm'
                : 'text-[#a9b3a8] hover:bg-[#1c2923] hover:text-[#f1f2e9]'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Deep Zoom</span>
          </button>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono text-[#d4a373]">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#ccd5ae]" />
          <span>Original Scan Preserved Unmodified</span>
        </div>
      </div>

      {/* Main Visual Showcase Area */}
      <div>
        {viewMode === 'slider' && (
          <ImageComparisonSlider
            originalUrl={originalUrl}
            enhancedUrl={enhancedUrl}
            originalLabel="Raw Manuscript Scan"
            enhancedLabel="CLAHE Enhanced Output"
          />
        )}

        {viewMode === 'sidebyside' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-[#17211d] border border-[#35443a] space-y-2">
              <div className="flex justify-between items-center text-xs font-mono text-[#e9edc9] border-b border-[#35443a] pb-2">
                <span>RAW ORIGINAL SCAN</span>
                <span className="text-[#77857b]">Unmodified</span>
              </div>
              <div className="h-[400px] flex items-center justify-center overflow-hidden rounded-lg bg-[#101614] p-2">
                <img
                  src={originalUrl || '/assets/sample_original.png'}
                  alt="Original Raw Manuscript"
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#17211d] border border-[#35443a] space-y-2">
              <div className="flex justify-between items-center text-xs font-mono text-[#ccd5ae] border-b border-[#35443a] pb-2">
                <span>ADAPTIVE CLAHE ENHANCED</span>
                <span className="text-[#ccd5ae]">Restored Contrast</span>
              </div>
              <div className="h-[400px] flex items-center justify-center overflow-hidden rounded-lg bg-[#101614] p-2">
                <img
                  src={enhancedUrl || '/assets/sample_enhanced.png'}
                  alt="Enhanced Manuscript"
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            </div>
          </div>
        )}

        {viewMode === 'intermediate' && (
          <div className="p-5 rounded-2xl bg-[#17211d] border border-[#35443a] space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {intermediateSteps.map((step) => (
                <button
                  key={step.key}
                  type="button"
                  onClick={() => setActiveIntermediateKey(step.key)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    activeIntermediateKey === step.key
                      ? 'bg-[#1c2923] border-[#ccd5ae] text-[#fefae0]'
                      : 'bg-[#101614] border-[#35443a] text-[#a9b3a8] hover:border-[#ccd5ae]/40'
                  }`}
                >
                  <span className="text-xs font-semibold block">{step.label}</span>
                  <span className="text-[10px] font-mono text-[#d4a373] block mt-0.5 truncate">
                    {step.method}
                  </span>
                </button>
              ))}
            </div>

            <div className="rounded-xl bg-[#101614] border border-[#35443a] p-4 flex flex-col items-center justify-center min-h-[380px]">
              <img
                src={activeStepObj.url || enhancedUrl || originalUrl}
                alt={activeStepObj.label}
                className="max-h-[420px] max-w-full object-contain rounded"
              />
              <div className="mt-3 text-center max-w-xl">
                <span className="text-xs font-mono text-[#ccd5ae] font-semibold">
                  {activeStepObj.label} ({activeStepObj.method})
                </span>
                <p className="text-xs text-[#a9b3a8] mt-1">{activeStepObj.desc}</p>
              </div>
            </div>
          </div>
        )}

        {viewMode === 'viewer' && (
          <ManuscriptViewer
            src={enhancedUrl || originalUrl}
            title="High-Resolution Folio Deep Zoom"
          />
        )}
      </div>

      {/* Graphical Data Visualisation: Overlaid Intensity Histogram & Real Optical Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Histogram Chart (8 cols) */}
        <div className="lg:col-span-8 p-5 rounded-2xl bg-[#17211d] border border-[#35443a] space-y-4 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#35443a] pb-3">
            <div>
              <h3 className="font-heading text-lg font-bold text-[#f1f2e9] flex items-center space-x-2">
                <Activity className="w-4 h-4 text-[#ccd5ae]" />
                <span>Grayscale Intensity Histogram Comparison</span>
              </h3>
              <p className="text-xs text-[#a9b3a8] mt-0.5">
                Real 32-bin pixel luminance distribution computed from the manuscript images via OpenCV calcHist.
              </p>
            </div>
            <div className="flex items-center space-x-3 text-xs font-mono">
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded bg-[#e9edc9]" />
                <span className="text-[#e9edc9]">Original Raw</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded bg-[#ccd5ae]" />
                <span className="text-[#ccd5ae]">Enhanced CLAHE</span>
              </div>
            </div>
          </div>

          {histogramData.length > 0 ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={histogramData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorOriginal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#e9edc9" stopOpacity={0.6} />
                      <stop offset="95%" stopColor="#e9edc9" stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="colorEnhanced" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ccd5ae" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#ccd5ae" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#35443a" opacity={0.5} />
                  <XAxis
                    dataKey="intensity"
                    stroke="#77857b"
                    tick={{ fill: '#a9b3a8', fontSize: 10 }}
                    tickLine={{ stroke: '#35443a' }}
                  />
                  <YAxis
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
                    formatter={(value, name) => [
                      `${value}% of image area`,
                      name === 'original' ? 'Original Scan' : 'Enhanced Scan',
                    ]}
                    labelFormatter={(label) => `Intensity Bin: ${label}`}
                  />
                  <Area
                    type="monotone"
                    dataKey="original"
                    name="original"
                    stroke="#e9edc9"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorOriginal)"
                  />
                  <Area
                    type="monotone"
                    dataKey="enhanced"
                    name="enhanced"
                    stroke="#ccd5ae"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorEnhanced)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 border border-dashed border-[#35443a] rounded-xl">
              <Activity className="w-8 h-8 text-[#77857b] mb-2" />
              <p className="text-xs text-[#a9b3a8]">
                {loadingHistogram
                  ? 'Computing OpenCV pixel histogram...'
                  : 'Histogram distribution not available for this manuscript.'}
              </p>
            </div>
          )}

          <div className="text-[11px] text-[#77857b] font-mono leading-relaxed bg-[#101614] p-3 rounded-lg border border-[#35443a]">
            <strong className="text-[#e9edc9]">Preservation Note:</strong> The enhanced curve (Tea Green) reflects actual local histogram equalization across pixel luminance values, expanding dynamic range for incised palm-leaf strokes while preserving the raw original scan intact.
          </div>
        </div>

        {/* Real Measured Metrics Panel (4 cols) */}
        <div className="lg:col-span-4 p-5 rounded-2xl bg-[#17211d] border border-[#35443a] space-y-4 shadow-xl">
          <div className="border-b border-[#35443a] pb-3">
            <h3 className="font-heading text-lg font-bold text-[#f1f2e9] flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-[#d4a373]" />
              <span>Optical Measurements</span>
            </h3>
            <span className="text-[10px] font-mono text-[#77857b]">
              Deterministic OpenCV Signal Analysis
            </span>
          </div>

          <div className="space-y-3 text-xs">
            {/* Resolution */}
            <div className="p-2.5 rounded-lg bg-[#101614] border border-[#35443a] flex justify-between items-center">
              <div>
                <span className="text-[10px] font-mono text-[#77857b] block">IMAGE RESOLUTION</span>
                <span className="font-mono font-semibold text-[#fefae0]">
                  {origMetrics.width && origMetrics.height
                    ? `${origMetrics.width} × ${origMetrics.height} px`
                    : 'Not available'}
                </span>
              </div>
              <span className="text-[10px] font-mono text-[#ccd5ae] px-2 py-0.5 rounded bg-[#1c2923]">
                1:1 Native
              </span>
            </div>

            {/* Laplacian Sharpness */}
            <div className="p-2.5 rounded-lg bg-[#101614] border border-[#35443a] space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-mono text-[#77857b]">LAPLACIAN VARIANCE</span>
                <span className="font-mono text-[10px] text-[#ccd5ae]">Edge Sharpness</span>
              </div>
              <div className="flex justify-between items-baseline font-mono">
                <span className="text-[#a9b3a8]">
                  Orig: {formatMetric(origMetrics.sharpness_laplacian)}
                </span>
                <span className="text-[#ccd5ae] font-bold text-sm">
                  Enh: {formatMetric(enhMetrics.sharpness_laplacian)}
                </span>
              </div>
            </div>

            {/* Mean Brightness */}
            <div className="p-2.5 rounded-lg bg-[#101614] border border-[#35443a] space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-mono text-[#77857b]">MEAN BRIGHTNESS (0-255)</span>
                <span className="font-mono text-[10px] text-[#d4a373]">Luminance</span>
              </div>
              <div className="flex justify-between items-baseline font-mono">
                <span className="text-[#a9b3a8]">
                  Orig: {formatMetric(origMetrics.mean_brightness)}
                </span>
                <span className="text-[#d4a373] font-bold text-sm">
                  Enh: {formatMetric(enhMetrics.mean_brightness)}
                </span>
              </div>
            </div>

            {/* Contrast Std Dev */}
            <div className="p-2.5 rounded-lg bg-[#101614] border border-[#35443a] space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-mono text-[#77857b]">CONTRAST DYNAMIC RANGE</span>
                <span className="font-mono text-[10px] text-[#e9edc9]">Std Deviation</span>
              </div>
              <div className="flex justify-between items-baseline font-mono">
                <span className="text-[#a9b3a8]">
                  Orig: {formatMetric(origMetrics.contrast_std, 1, '±')}
                </span>
                <span className="text-[#e9edc9] font-bold text-sm">
                  Enh: {formatMetric(enhMetrics.contrast_std, 1, '±')}
                </span>
              </div>
            </div>
          </div>

          {/* Technical Operations List */}
          <div className="pt-2 border-t border-[#35443a] space-y-1.5">
            <span className="text-[10px] font-mono uppercase text-[#77857b] block">
              Implemented OpenCV Operations:
            </span>
            <div className="flex flex-wrap gap-1.5">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#1c2923] text-[#ccd5ae] border border-[#35443a]">
                CLAHE (clipLimit=2.5, 8×8)
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#1c2923] text-[#e9edc9] border border-[#35443a]">
                fastNlMeansDenoising (h=10)
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#1c2923] text-[#d4a373] border border-[#35443a]">
                Unsharp Masking (1.5 / -0.5)
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
