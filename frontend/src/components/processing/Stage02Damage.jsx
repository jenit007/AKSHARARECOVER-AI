import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  Sliders,
  MapPin,
  Layers,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { getDamageMap } from '../../services/manuscriptService';
import { resolveImageUrl } from '../../services/fileService';

export default function Stage02Damage({
  manuscriptId,
  originalUrl,
  enhancedUrl,
  overlayUrl,
  damageIndicators,
}) {
  const [activeLayer, setActiveLayer] = useState('overlay'); // 'overlay', 'mask', 'original', 'enhanced'
  const [maskOpacity, setMaskOpacity] = useState(70);
  const [showBoundingBoxes, setShowBoundingBoxes] = useState(true);
  const [damageData, setDamageData] = useState(null);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [naturalDims, setNaturalDims] = useState({ width: null, height: null });

  useEffect(() => {
    if (!manuscriptId) return;
    let isMounted = true;

    async function loadDamageMap() {
      try {
        const res = await getDamageMap(manuscriptId);
        if (isMounted && res) {
          setDamageData(res);
        }
      } catch (err) {
        console.warn('Could not load detailed damage map:', err);
      }
    }

    loadDamageMap();
    return () => {
      isMounted = false;
    };
  }, [manuscriptId]);

  const indicators =
    damageData?.indicators || damageIndicators?.indicators || damageIndicators || {};
  const detectedRegions =
    damageData?.detected_regions || damageIndicators?.detected_regions || [];
  const damageRatio =
    typeof damageData?.overall_damage_ratio === 'number'
      ? damageData.overall_damage_ratio
      : typeof damageIndicators?.overall_damage_ratio === 'number'
      ? damageIndicators.overall_damage_ratio
      : null;

  const darkPercentage =
    typeof indicators.dark_regions?.percentage === 'number'
      ? indicators.dark_regions.percentage
      : null;
  const fadedPercentage =
    typeof indicators.faded_regions?.percentage === 'number'
      ? indicators.faded_regions.percentage
      : null;
  const crackLinesCount =
    typeof indicators.line_artifacts?.count === 'number'
      ? indicators.line_artifacts.count
      : null;

  // Real image dimensions for coordinate scaling (no hardcoded 1653x2339)
  const imgWidth =
    damageData?.image_width ||
    damageIndicators?.image_width ||
    naturalDims.width ||
    1;
  const imgHeight =
    damageData?.image_height ||
    damageIndicators?.image_height ||
    naturalDims.height ||
    1;

  // Chart 1: Damage Category Distribution (only include available metrics)
  const categoryChartData = [];
  if (darkPercentage !== null) {
    categoryChartData.push({
      category: 'Dark Stains',
      value: Number(darkPercentage.toFixed(1)),
      unit: '% Area',
      fill: '#d4a373',
    });
  }
  if (fadedPercentage !== null) {
    categoryChartData.push({
      category: 'Faded Regions',
      value: Number(fadedPercentage.toFixed(1)),
      unit: '% Area',
      fill: '#faedcd',
    });
  }
  if (crackLinesCount !== null) {
    categoryChartData.push({
      category: 'Linear Cracks',
      value: crackLinesCount,
      unit: 'Hough Segments',
      fill: '#ccd5ae',
    });
  }

  // Chart 2: Damaged vs Unaffected Folio Area Donut
  const rawAreaPct =
    typeof damageData?.damage_area_percentage === 'number'
      ? damageData.damage_area_percentage
      : typeof damageRatio === 'number'
      ? damageRatio <= 1 && (darkPercentage || 0) + (fadedPercentage || 0) > 1.5
        ? damageRatio * 100
        : damageRatio
      : null;
  const hasDamageRatio = typeof rawAreaPct === 'number';
  const damagedAreaPct = hasDamageRatio
    ? Math.min(100, Math.max(0, Number(rawAreaPct.toFixed(1))))
    : 0;
  const unaffectedAreaPct = hasDamageRatio
    ? Number((100 - damagedAreaPct).toFixed(1))
    : 100;

  const areaPieData = [
    { name: 'Unaffected Folio', value: unaffectedAreaPct, color: '#ccd5ae' },
    { name: 'Identified Anomalies', value: damagedAreaPct, color: '#d4a373' },
  ];

  const resolvedOverlayUrl = damageData?.damage_overlay_url
    ? resolveImageUrl(damageData.damage_overlay_url)
    : overlayUrl;
  const resolvedMaskUrl = damageData?.damage_mask_url
    ? resolveImageUrl(damageData.damage_mask_url)
    : resolvedOverlayUrl;

  const handleImageLoad = (e) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    if (naturalWidth && naturalHeight) {
      setNaturalDims({ width: naturalWidth, height: naturalHeight });
    }
  };

  return (
    <div className="space-y-6">
      {/* Stage Header */}
      <div className="border-b border-[#35443a] pb-4">
        <div className="flex items-center space-x-2 text-[11px] font-mono uppercase tracking-wider text-[#d4a373]">
          <span className="w-2 h-2 rounded-full bg-[#d4a373]" />
          <span>Stage 02 of 05 • Heuristic CV Damage Mapping</span>
        </div>
        <h2 className="font-heading text-2xl sm:text-3xl font-bold text-[#f1f2e9] mt-1">
          Damage Identification &amp; Conservation Mapping
        </h2>
        <p className="text-sm text-[#a9b3a8] mt-1 max-w-3xl">
          Highlighting candidate physical anomalies to assist scholarly inspection. Deterministic OpenCV thresholding and probabilistic Hough line transforms identify dark staining, faded regions, and linear crack candidates.
        </p>
      </div>

      {/* Layer selector & Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#17211d] p-3 rounded-xl border border-[#35443a]">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-mono uppercase text-[#77857b] mr-1">Layer:</span>
          <button
            type="button"
            onClick={() => setActiveLayer('overlay')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center space-x-1.5 ${
              activeLayer === 'overlay'
                ? 'bg-[#d4a373] text-[#101614] font-bold shadow-sm'
                : 'text-[#a9b3a8] hover:bg-[#1c2923] hover:text-[#f1f2e9]'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Damage Overlay</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveLayer('mask')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center space-x-1.5 ${
              activeLayer === 'mask'
                ? 'bg-[#faedcd] text-[#101614] font-bold shadow-sm'
                : 'text-[#a9b3a8] hover:bg-[#1c2923] hover:text-[#f1f2e9]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Isolated Mask</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveLayer('original')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center space-x-1.5 ${
              activeLayer === 'original'
                ? 'bg-[#e9edc9] text-[#101614] font-bold shadow-sm'
                : 'text-[#a9b3a8] hover:bg-[#1c2923] hover:text-[#f1f2e9]'
            }`}
          >
            <span>Raw Scan</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveLayer('enhanced')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center space-x-1.5 ${
              activeLayer === 'enhanced'
                ? 'bg-[#ccd5ae] text-[#101614] font-bold shadow-sm'
                : 'text-[#a9b3a8] hover:bg-[#1c2923] hover:text-[#f1f2e9]'
            }`}
          >
            <span>Enhanced</span>
          </button>
        </div>

        {activeLayer === 'overlay' && (
          <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
            <div className="flex items-center space-x-2">
              <Sliders className="w-3.5 h-3.5 text-[#d4a373]" />
              <span className="text-[#a9b3a8]">Opacity:</span>
              <input
                type="range"
                min="20"
                max="100"
                value={maskOpacity}
                onChange={(e) => setMaskOpacity(Number(e.target.value))}
                className="w-20 accent-[#d4a373] cursor-pointer"
              />
              <span className="text-[#d4a373] w-8 font-bold">{maskOpacity}%</span>
            </div>

            <label className="flex items-center space-x-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={showBoundingBoxes}
                onChange={(e) => setShowBoundingBoxes(e.target.checked)}
                className="accent-[#d4a373] w-3.5 h-3.5 rounded"
              />
              <span className="text-[#a9b3a8]">Bounding Boxes ({detectedRegions.length})</span>
            </label>
          </div>
        )}
      </div>

      {/* Main Visual Display Frame */}
      <div className="relative rounded-2xl border border-[#35443a] bg-[#101614] min-h-[460px] sm:min-h-[540px] flex items-center justify-center overflow-hidden shadow-2xl p-4 pb-16">
        {activeLayer === 'original' && (
          <img
            src={originalUrl || '/assets/sample_original.png'}
            alt="Original Manuscript"
            onLoad={handleImageLoad}
            className="max-h-[60vh] w-auto object-contain"
          />
        )}

        {activeLayer === 'enhanced' && (
          <img
            src={enhancedUrl || '/assets/sample_enhanced.png'}
            alt="Enhanced Manuscript"
            onLoad={handleImageLoad}
            className="max-h-[60vh] w-auto object-contain"
          />
        )}

        {activeLayer === 'mask' && (
          <img
            src={resolvedMaskUrl || resolvedOverlayUrl || '/assets/sample_overlay.png'}
            alt="Isolated Damage Mask"
            onLoad={handleImageLoad}
            className="max-h-[60vh] w-auto object-contain"
          />
        )}

        {activeLayer === 'overlay' && (
          <div className="relative inline-block max-h-[60vh]">
            {/* Base Image */}
            <img
              src={originalUrl || '/assets/sample_original.png'}
              alt="Base Manuscript"
              onLoad={handleImageLoad}
              className="max-h-[60vh] w-auto object-contain block"
            />
            {/* Overlay Mask */}
            {resolvedOverlayUrl && (
              <img
                src={resolvedOverlayUrl}
                alt="Damage Mask Overlay"
                className="absolute inset-0 w-full h-full object-contain pointer-events-none mix-blend-screen"
                style={{ opacity: maskOpacity / 100 }}
              />
            )}

            {/* Interactive Bounding Boxes Scaled by Actual Image Dimensions */}
            {showBoundingBoxes && detectedRegions.length > 0 && imgWidth > 1 && imgHeight > 1 && (
              <div className="absolute inset-0 pointer-events-none">
                {detectedRegions.map((region, idx) => {
                  const [rx, ry, rw, rh] = region.box || [0, 0, 0, 0];
                  const isDark = region.category?.toLowerCase().includes('dark');
                  const borderColor = isDark ? '#d4a373' : '#faedcd';
                  return (
                    <div
                      key={region.id || idx}
                      style={{
                        position: 'absolute',
                        left: `${Math.min(100, Math.max(0, (rx / imgWidth) * 100))}%`,
                        top: `${Math.min(100, Math.max(0, (ry / imgHeight) * 100))}%`,
                        width: `${Math.min(100, Math.max(1, (rw / imgWidth) * 100))}%`,
                        height: `${Math.min(100, Math.max(1, (rh / imgHeight) * 100))}%`,
                        border: `1.5px solid ${borderColor}`,
                        backgroundColor: 'rgba(212, 163, 115, 0.14)',
                      }}
                      className="rounded pointer-events-auto cursor-pointer hover:bg-[#d4a373]/30 transition-colors"
                      title={`${region.id}: ${region.category} (${region.detection_method})`}
                      onClick={() => setSelectedRegion(region)}
                    />
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Overlay Color Legend Bar */}
        <div className="absolute bottom-3 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-[#17211d]/95 backdrop-blur-md border border-[#35443a] text-xs font-mono">
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-[#77857b] uppercase">CV Indicators:</span>
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded-sm bg-[#d4a373]" />
              <span className="text-[#f1f2e9]">Dark Stains (Intensity &lt; 65)</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded-sm bg-[#faedcd]" />
              <span className="text-[#f1f2e9]">Faded Regions (Intensity &gt; 215)</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded-sm bg-[#ccd5ae]" />
              <span className="text-[#f1f2e9]">HoughP Crack Candidates</span>
            </div>
          </div>
          <span className="text-[10px] text-[#a9b3a8]">
            {detectedRegions.length} Contour Regions ({imgWidth > 1 ? `${imgWidth}×${imgHeight}px` : 'native'})
          </span>
        </div>
      </div>

      {/* Selected Region Quick Inspection Callout */}
      {selectedRegion && (
        <div className="p-3.5 rounded-xl bg-[#17211d] border border-[#d4a373]/60 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <MapPin className="w-4 h-4 text-[#d4a373]" />
            <span className="font-mono font-bold text-[#d4a373]">{selectedRegion.id}</span>
            <span className="text-[#f1f2e9] font-medium">{selectedRegion.category}</span>
            <span className="text-[10px] text-[#77857b] font-mono">
              ({selectedRegion.detection_method} • Area: {selectedRegion.area_px} px² • Box: [{selectedRegion.box?.join(', ')}])
            </span>
          </div>
          <button
            type="button"
            onClick={() => setSelectedRegion(null)}
            className="text-[11px] font-mono text-[#a9b3a8] hover:text-[#f1f2e9]"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Graphical Data Visualisation: Charts & Region Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Category Distribution Bar Chart (7 cols) */}
        <div className="lg:col-span-7 p-5 rounded-2xl bg-[#17211d] border border-[#35443a] space-y-4 shadow-xl">
          <div className="border-b border-[#35443a] pb-3">
            <h3 className="font-heading text-lg font-bold text-[#f1f2e9] flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-[#d4a373]" />
              <span>Measured Anomaly Indicators</span>
            </h3>
            <p className="text-xs text-[#a9b3a8] mt-0.5">
              Actual measurements computed by the backend OpenCV damage analysis pipeline.
            </p>
          </div>

          {categoryChartData.length > 0 ? (
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={categoryChartData}
                  margin={{ top: 10, right: 20, left: -20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#35443a" opacity={0.5} />
                  <XAxis
                    dataKey="category"
                    stroke="#77857b"
                    tick={{ fill: '#a9b3a8', fontSize: 11 }}
                    tickLine={{ stroke: '#35443a' }}
                  />
                  <YAxis
                    stroke="#77857b"
                    tick={{ fill: '#a9b3a8', fontSize: 10 }}
                    tickLine={{ stroke: '#35443a' }}
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
                      `${value} ${item.payload.unit}`,
                      'Measured Value',
                    ]}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {categoryChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-56 flex items-center justify-center text-xs text-[#77857b] border border-dashed border-[#35443a] rounded-xl">
              Damage indicator metrics not available for this manuscript.
            </div>
          )}

          <div className="grid grid-cols-3 gap-2 pt-2 text-center text-xs font-mono">
            <div className="p-2 rounded-lg bg-[#101614] border border-[#35443a]">
              <span className="text-[10px] text-[#77857b] block">DARK STAINS</span>
              <span className="text-[#d4a373] font-bold">
                {darkPercentage !== null ? `${darkPercentage.toFixed(1)}%` : 'Not available'}
              </span>
            </div>
            <div className="p-2 rounded-lg bg-[#101614] border border-[#35443a]">
              <span className="text-[10px] text-[#77857b] block">FADED AREA</span>
              <span className="text-[#faedcd] font-bold">
                {fadedPercentage !== null ? `${fadedPercentage.toFixed(1)}%` : 'Not available'}
              </span>
            </div>
            <div className="p-2 rounded-lg bg-[#101614] border border-[#35443a]">
              <span className="text-[10px] text-[#77857b] block">HOUGH LINES</span>
              <span className="text-[#ccd5ae] font-bold">
                {crackLinesCount !== null ? `${crackLinesCount} lines` : 'Not available'}
              </span>
            </div>
          </div>
        </div>

        {/* Damaged vs Unaffected Folio Area Donut (5 cols) */}
        <div className="lg:col-span-5 p-5 rounded-2xl bg-[#17211d] border border-[#35443a] space-y-4 shadow-xl">
          <div className="border-b border-[#35443a] pb-3">
            <h3 className="font-heading text-lg font-bold text-[#f1f2e9] flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 text-[#ccd5ae]" />
              <span>Folio Surface Condition</span>
            </h3>
            <p className="text-xs text-[#a9b3a8] mt-0.5">
              Proportion of unaffected vs threshold-flagged surface area.
            </p>
          </div>

          {hasDamageRatio ? (
            <>
              <div className="h-44 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={areaPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {areaPieData.map((entry, index) => (
                        <Cell key={`donut-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#101614',
                        borderColor: '#35443a',
                        borderRadius: '8px',
                        color: '#fefae0',
                        fontSize: '12px',
                      }}
                      formatter={(val) => [`${val}% of Folio`, 'Area']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between items-center p-2 rounded bg-[#101614] border border-[#35443a]">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#ccd5ae]" />
                    <span className="text-[#f1f2e9]">Unaffected Surface</span>
                  </div>
                  <span className="font-bold text-[#ccd5ae]">{unaffectedAreaPct}%</span>
                </div>

                <div className="flex justify-between items-center p-2 rounded bg-[#101614] border border-[#35443a]">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#d4a373]" />
                    <span className="text-[#f1f2e9]">Flagged Anomaly Area</span>
                  </div>
                  <span className="font-bold text-[#d4a373]">{damagedAreaPct}%</span>
                </div>
              </div>
            </>
          ) : (
            <div className="h-44 flex items-center justify-center text-xs text-[#77857b] border border-dashed border-[#35443a] rounded-xl">
              Surface ratio not available.
            </div>
          )}

          <div className="text-[11px] text-[#77857b] font-mono bg-[#101614] p-2.5 rounded-lg border border-[#35443a] leading-relaxed">
            <strong className="text-[#faedcd]">Methodology Transparency:</strong> Indicators are produced by deterministic OpenCV intensity thresholding (`&lt;65` dark, `&gt;215` faded) and Canny + HoughLinesP linear detection, not a trained neural segmentation model.
          </div>
        </div>
      </div>
    </div>
  );
}
