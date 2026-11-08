import React, { useState } from 'react';
import { ShieldAlert, Sparkles, Sliders } from 'lucide-react';

export default function DamageOverlayViewer({
  originalUrl,
  enhancedUrl,
  overlayUrl,
  damageIndicators,
  className = '',
}) {
  const [activeLayer, setActiveLayer] = useState('overlay');
  const [overlayOpacity, setOverlayOpacity] = useState(75);

  const damageRatio =
    typeof damageIndicators?.overall_damage_ratio === 'number'
      ? `${(damageIndicators.overall_damage_ratio * 100).toFixed(1)}%`
      : 'Not available';

  const suspectedRegions = damageIndicators?.total_suspected_regions ?? 'Not available';
  const darkStains = damageIndicators?.dark_stains || 'Luminance threshold';
  const scratches = damageIndicators?.scratches_and_cracks || 'Hough line analysis';

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Layer selector bar */}
      <div className="bg-[#17211d] p-3 rounded-xl border border-[#35443a] shadow-lg flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#77857b] mr-2 font-mono">
            Inspection Layer:
          </span>
          <button
            type="button"
            onClick={() => setActiveLayer('original')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              activeLayer === 'original'
                ? 'bg-[#e9edc9] text-[#101614] shadow-sm font-bold'
                : 'bg-[#101614] text-[#a9b3a8] hover:bg-[#1c2923] border border-[#35443a]'
            }`}
          >
            Original Damaged
          </button>
          <button
            type="button"
            onClick={() => setActiveLayer('overlay')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center space-x-1 ${
              activeLayer === 'overlay'
                ? 'bg-[#ccd5ae] text-[#101614] shadow-sm font-bold'
                : 'bg-[#101614] text-[#a9b3a8] hover:bg-[#1c2923] border border-[#35443a]'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Damage Map Overlay</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveLayer('enhanced')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center space-x-1 ${
              activeLayer === 'enhanced'
                ? 'bg-[#d4a373] text-[#101614] font-bold shadow-sm'
                : 'bg-[#101614] text-[#a9b3a8] hover:bg-[#1c2923] border border-[#35443a]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>CLAHE Enhanced Folio</span>
          </button>
        </div>

        {activeLayer === 'overlay' && (
          <div className="flex items-center space-x-2 text-xs text-[#a9b3a8] font-mono">
            <Sliders className="w-3.5 h-3.5 text-[#ccd5ae]" />
            <span>Mask Opacity:</span>
            <input
              type="range"
              min="20"
              max="100"
              value={overlayOpacity}
              onChange={(e) => setOverlayOpacity(Number(e.target.value))}
              aria-label="Damage mask opacity"
              className="w-24 accent-[#ccd5ae] cursor-pointer"
            />
            <span className="font-mono text-[11px] w-8 text-[#ccd5ae]">{overlayOpacity}%</span>
          </div>
        )}
      </div>

      {/* Main Image Display Frame */}
      <div className="relative rounded-xl border border-[#35443a] bg-[#101614] min-h-[380px] sm:min-h-[460px] flex items-center justify-center overflow-hidden shadow-2xl p-4">
        {activeLayer === 'original' && (
          <img
            src={originalUrl || '/assets/sample_original.png'}
            alt="Original Folio"
            className="max-h-[60vh] w-auto object-contain"
          />
        )}

        {activeLayer === 'enhanced' && (
          <img
            src={enhancedUrl || '/assets/sample_enhanced.png'}
            alt="Enhanced Folio"
            className="max-h-[60vh] w-auto object-contain filter contrast-105"
          />
        )}

        {activeLayer === 'overlay' && (
          <div className="relative max-h-[60vh] flex items-center justify-center">
            <img
              src={originalUrl || '/assets/sample_original.png'}
              alt="Base Folio"
              className="max-h-[60vh] w-auto object-contain"
            />
            <img
              src={overlayUrl || '/assets/sample_overlay.png'}
              alt="Damage Detection Mask"
              style={{ opacity: overlayOpacity / 100 }}
              className="absolute inset-0 w-full h-full object-contain pointer-events-none mix-blend-screen"
            />
          </div>
        )}

        {/* Legend Overlay */}
        <div className="absolute bottom-3 left-3 bg-[#101614]/90 backdrop-blur-md px-3.5 py-2 rounded-lg border border-[#35443a] text-xs text-[#f1f2e9] space-y-1">
          <div className="text-[10px] uppercase font-mono text-[#d4a373] font-semibold">
            Heuristic Damage Classification Legend
          </div>
          <div className="flex flex-wrap items-center gap-3 text-[11px]">
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#d4a373] inline-block" />
              <span className="text-[#a9b3a8]">Dark Staining</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#faedcd] inline-block" />
              <span className="text-[#a9b3a8]">Faded Zones</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ccd5ae] inline-block" />
              <span className="text-[#a9b3a8]">Hough Linear Cracks</span>
            </span>
          </div>
        </div>
      </div>

      {/* Heuristic & Quantitative Condition Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 text-center rounded-xl bg-[#17211d] border border-[#35443a]">
          <span className="text-[10px] uppercase font-mono text-[#77857b] block">
            Damaged Area
          </span>
          <span className="font-heading text-xl font-bold text-[#faedcd]">
            {damageRatio}
          </span>
          <span className="text-[11px] text-[#a9b3a8] block mt-0.5">
            Heuristic surface ratio
          </span>
        </div>

        <div className="p-3 text-center rounded-xl bg-[#17211d] border border-[#35443a]">
          <span className="text-[10px] uppercase font-mono text-[#77857b] block">
            Suspected Regions
          </span>
          <span className="font-heading text-xl font-bold text-[#d4a373]">
            {suspectedRegions}
          </span>
          <span className="text-[11px] text-[#a9b3a8] block mt-0.5">
            Segmented contours
          </span>
        </div>

        <div className="p-3 text-center rounded-xl bg-[#17211d] border border-[#35443a]">
          <span className="text-[10px] uppercase font-mono text-[#77857b] block">
            Dark Staining
          </span>
          <span className="font-heading text-sm font-bold text-[#ccd5ae] truncate block mt-1">
            {darkStains}
          </span>
          <span className="text-[11px] text-[#a9b3a8] block mt-0.5 font-mono">
            OpenCV Threshold
          </span>
        </div>

        <div className="p-3 text-center rounded-xl bg-[#17211d] border border-[#35443a]">
          <span className="text-[10px] uppercase font-mono text-[#77857b] block">
            Linear Cracks
          </span>
          <span className="font-heading text-sm font-bold text-[#fefae0] truncate block mt-1">
            {scratches}
          </span>
          <span className="text-[11px] text-[#a9b3a8] block mt-0.5">
            Edge vector detection
          </span>
        </div>
      </div>
    </div>
  );
}
