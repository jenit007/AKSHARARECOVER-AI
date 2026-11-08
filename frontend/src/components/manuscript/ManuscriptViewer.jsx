import React, { useRef, useState } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  RotateCw,
  Maximize2,
  Minimize2,
  RefreshCw,
} from 'lucide-react';

export default function ManuscriptViewer({
  src,
  alt = 'Manuscript High-Resolution View',
  title = 'Historical Folio View',
  className = '',
}) {
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef(null);

  const rotateClockwise = () => setRotation((prev) => (prev + 90) % 360);
  const rotateCounterClockwise = () => setRotation((prev) => (prev - 90 + 360) % 360);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => console.error(err));
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch((err) => console.error(err));
      setIsFullscreen(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative rounded-xl border border-[#35443a] bg-[#101614] overflow-hidden flex flex-col shadow-xl ${className}`}
    >
      <TransformWrapper
        initialScale={1}
        minScale={0.5}
        maxScale={6}
        centerOnInit
        wheel={{ step: 0.1 }}
      >
        {({ zoomIn, zoomOut, resetTransform }) => (
          <>
            {/* Top Toolbar */}
            <div className="z-20 bg-[#17211d]/95 backdrop-blur-md px-4 py-2.5 border-b border-[#35443a] flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-heading text-[#ccd5ae] font-semibold tracking-wide">
                  {title}
                </span>
                <span className="text-[11px] text-[#77857b] hidden sm:inline font-mono">
                  • Drag to pan, scroll to zoom
                </span>
              </div>

              {/* Controls */}
              <div className="flex items-center space-x-1.5">
                <button
                  type="button"
                  onClick={() => zoomIn()}
                  className="p-1.5 text-[#a9b3a8] hover:text-[#ccd5ae] hover:bg-[#1c2923] rounded transition-all"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => zoomOut()}
                  className="p-1.5 text-[#a9b3a8] hover:text-[#ccd5ae] hover:bg-[#1c2923] rounded transition-all"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={rotateCounterClockwise}
                  className="p-1.5 text-[#a9b3a8] hover:text-[#ccd5ae] hover:bg-[#1c2923] rounded transition-all"
                  title="Rotate Left"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={rotateClockwise}
                  className="p-1.5 text-[#a9b3a8] hover:text-[#ccd5ae] hover:bg-[#1c2923] rounded transition-all"
                  title="Rotate Right"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    resetTransform();
                    setRotation(0);
                  }}
                  className="p-1.5 text-[#a9b3a8] hover:text-[#ccd5ae] hover:bg-[#1c2923] rounded transition-all"
                  title="Reset View"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={toggleFullscreen}
                  className="p-1.5 text-[#d4a373] hover:text-[#fefae0] hover:bg-[#1c2923] rounded transition-all ml-1 border-l border-[#35443a] pl-2.5"
                  title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                >
                  {isFullscreen ? (
                    <Minimize2 className="w-4 h-4" />
                  ) : (
                    <Maximize2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Interactive Canvas */}
            <div className="relative flex-1 min-h-[420px] sm:min-h-[520px] flex items-center justify-center p-4 cursor-grab active:cursor-grabbing bg-[#101614]">
              <TransformComponent
                wrapperClass="!w-full !h-full flex items-center justify-center"
                contentClass="!flex !items-center !justify-center"
              >
                <img
                  src={src || '/assets/sample_original.png'}
                  alt={alt}
                  style={{ transform: `rotate(${rotation}deg)` }}
                  className="max-h-[70vh] w-auto object-contain transition-transform duration-200 select-none drop-shadow-2xl rounded-sm"
                  draggable={false}
                />
              </TransformComponent>
            </div>
          </>
        )}
      </TransformWrapper>
    </div>
  );
}
