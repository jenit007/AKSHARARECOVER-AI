import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Sliders } from 'lucide-react';

export default function ImageComparisonSlider({
  originalUrl,
  enhancedUrl,
  originalLabel = 'Original Manuscript (Raw)',
  enhancedLabel = 'Enhanced Manuscript (CLAHE)',
  initialSliderPosition = 50,
  className = '',
}) {
  const [sliderPosition, setSliderPosition] = useState(initialSliderPosition);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);

  const handleMove = useCallback((clientX) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    let position = (x / rect.width) * 100;
    if (position < 0) position = 0;
    if (position > 100) position = 100;
    setSliderPosition(position);
  }, []);

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    handleMove(e.touches[0].clientX);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  };

  const handleMouseUp = () => setIsDragging(false);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging]);

  return (
    <div className={`relative select-none overflow-hidden rounded-xl border border-[#35443a] shadow-xl bg-[#101614] ${className}`}>
      {/* Top Banner Indicator */}
      <div className="absolute top-3 left-3 z-30 bg-[#101614]/90 backdrop-blur-md px-3 py-1 rounded-md text-[11px] font-mono tracking-wider text-[#f1f2e9] border border-[#35443a] flex items-center space-x-2">
        <Sliders className="w-3.5 h-3.5 text-[#ccd5ae]" />
        <span>Drag Slider to Compare Restoration</span>
      </div>

      <div
        ref={containerRef}
        className="relative w-full h-[420px] sm:h-[520px] md:h-[580px] overflow-hidden cursor-ew-resize"
        onMouseDown={(e) => {
          setIsDragging(true);
          handleMove(e.clientX);
        }}
        onTouchStart={(e) => {
          setIsDragging(true);
          handleMove(e.touches[0].clientX);
        }}
      >
        {/* Enhanced Image (Underneath, full view) */}
        <div className="absolute inset-0 w-full h-full flex items-center justify-center p-2 bg-[#101614]">
          <img
            src={enhancedUrl || '/assets/sample_enhanced.png'}
            alt={enhancedLabel}
            className="w-full h-full object-contain"
            draggable={false}
          />
          <div className="absolute bottom-4 right-4 z-20 bg-[#1c2923]/90 backdrop-blur-md px-3 py-1.5 rounded-md text-xs font-semibold text-[#ccd5ae] border border-[#ccd5ae]/40 shadow-lg flex items-center space-x-1.5 font-mono">
            <span className="w-2 h-2 rounded-full bg-[#ccd5ae] animate-pulse" />
            <span>{enhancedLabel}</span>
          </div>
        </div>

        {/* Original Image (Clipped by slider position) */}
        <div
          className="absolute inset-0 h-full overflow-hidden flex items-center justify-center p-2 bg-[#101614]"
          style={{ width: `${sliderPosition}%`, borderRight: '2px solid #ccd5ae' }}
        >
          <div
            className="absolute inset-0 flex items-center justify-center p-2"
            style={{ width: containerRef.current ? `${containerRef.current.offsetWidth}px` : '100%' }}
          >
            <img
              src={originalUrl || '/assets/sample_original.png'}
              alt={originalLabel}
              className="w-full h-full object-contain"
              draggable={false}
            />
          </div>

          <div className="absolute bottom-4 left-4 z-20 bg-[#17211d]/90 backdrop-blur-md px-3 py-1.5 rounded-md text-xs font-semibold text-[#e9edc9] border border-[#35443a] shadow-lg font-mono">
            <span>{originalLabel}</span>
          </div>
        </div>

        {/* Slider Handle Divider */}
        <div
          className="absolute top-0 bottom-0 z-30 w-1 bg-gradient-to-b from-[#ccd5ae] via-[#fefae0] to-[#d4a373] shadow-[0_0_12px_rgba(204,213,174,0.6)] pointer-events-none"
          style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-[#1c2923] border-2 border-[#ccd5ae] shadow-2xl flex items-center justify-center pointer-events-auto cursor-ew-resize">
            <div className="flex items-center space-x-1">
              <span className="text-[10px] text-[#ccd5ae] font-bold">&lsaquo;</span>
              <span className="text-[10px] text-[#ccd5ae] font-bold">&rsaquo;</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
