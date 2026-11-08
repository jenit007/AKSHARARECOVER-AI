import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  Play,
  Pause,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  QrCode,
  CheckCircle2,
  Sliders,
} from 'lucide-react';

export const MOVIE_SCENES = [
  {
    num: '01',
    id: 'discovery',
    title: 'THE DISCOVERY',
    subtitle: 'Within these fragile leaves lie centuries of forgotten knowledge.',
    desc: 'An aged Kerala palm-leaf folio enters the preservation workflow with surface wear, darkened fibres, and faded ink incisions.',
    badge: 'Stage 00 • Archival Intake',
  },
  {
    num: '02',
    id: 'scanning',
    title: 'DIGITAL SCANNING',
    subtitle: 'First, our system examines the manuscript and its physical condition.',
    desc: 'Non-destructive optical diagnostics measure resolution, luminance distribution, contrast variance, and Laplacian edge sharpness.',
    badge: 'Stage 00 • Condition Diagnostics',
  },
  {
    num: '03',
    id: 'enhancement',
    title: 'IMAGE ENHANCEMENT',
    subtitle: 'Image enhancement improves visibility while preserving the original.',
    desc: 'OpenCV grayscale conversion, non-local means denoising, CLAHE adaptive contrast equalization, and unsharp masking clarify incised strokes while keeping the raw scan untouched.',
    badge: 'Stage 01 • Adaptive Enhancement',
  },
  {
    num: '04',
    id: 'damage',
    title: 'DAMAGE IDENTIFICATION',
    subtitle: 'Potentially damaged regions are highlighted for closer examination.',
    desc: 'Heuristic computer vision segments darkened staining, faded washout zones, and linear crack artifacts into an inspectable conservation overlay.',
    badge: 'Stage 02 • Heuristic Damage Map',
  },
  {
    num: '05',
    id: 'ocr',
    title: 'OCR RECOGNITION',
    subtitle: 'Artificial intelligence begins recovering the readable text.',
    desc: 'Sequence recognition detects script lines on the enhanced folio, surfaces per-line confidence scores, and flags uncertain readings for human review.',
    badge: 'Stage 03 • Script Recognition & Review',
  },
  {
    num: '06',
    id: 'translation',
    title: 'TRANSLATION',
    subtitle: 'Verified words become accessible to a wider world.',
    desc: 'Reviewed source transcriptions are paired side-by-side with English translation support and scholarly annotation tools.',
    badge: 'Stage 04 • English Translation',
  },
  {
    num: '07',
    id: 'heritage',
    title: 'DIGITAL HERITAGE RECORD',
    subtitle: 'Every recovered record becomes part of a searchable digital heritage.',
    desc: 'The preserved manuscript is packaged into a structured Digital Heritage Record with metadata, stage completion audit, and a scannable QR code.',
    badge: 'Stage 05 • Digital Heritage Record & QR',
  },
];

export default function CinematicProcessingMovie() {
  const prefersReducedMotion = useReducedMotion();
  const [currentSceneIdx, setCurrentSceneIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(() => !prefersReducedMotion);
  const [isCompleted, setIsCompleted] = useState(false);
  const [splitReveal, setSplitReveal] = useState(55);
  const timerRef = useRef(null);

  const scene = MOVIE_SCENES[currentSceneIdx];

  useEffect(() => {
    if (prefersReducedMotion) {
      setIsPlaying(false);
    }
  }, [prefersReducedMotion]);

  useEffect(() => {
    if (!isPlaying || isCompleted) return undefined;

    timerRef.current = setInterval(() => {
      setCurrentSceneIdx((prev) => {
        if (prev >= MOVIE_SCENES.length - 1) {
          setIsCompleted(true);
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 5500);

    return () => clearInterval(timerRef.current);
  }, [isPlaying, isCompleted]);

  const handlePlayPause = () => {
    if (isCompleted) {
      setIsCompleted(false);
      setCurrentSceneIdx(0);
      setIsPlaying(true);
    } else {
      setIsPlaying((prev) => !prev);
    }
  };

  const handleReplay = () => {
    setIsCompleted(false);
    setCurrentSceneIdx(0);
    setIsPlaying(!prefersReducedMotion);
  };

  const handlePrev = () => {
    setIsCompleted(false);
    setCurrentSceneIdx((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    if (currentSceneIdx >= MOVIE_SCENES.length - 1) {
      setIsCompleted(true);
      setIsPlaying(false);
    } else {
      setCurrentSceneIdx((prev) => prev + 1);
    }
  };

  const progressPct = isCompleted
    ? 100
    : Math.round(((currentSceneIdx + 1) / MOVIE_SCENES.length) * 100);

  return (
    <div className="relative rounded-2xl border border-[#35443a] bg-[#101614] overflow-hidden shadow-2xl">
      {/* Top Status Header */}
      <div className="bg-[#17211d]/95 backdrop-blur-md px-4 sm:px-6 py-3.5 border-b border-[#35443a] flex flex-wrap items-center justify-between gap-3 z-30 relative">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="flex items-center space-x-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                isPlaying ? 'bg-[#ccd5ae] animate-pulse' : 'bg-[#d4a373]'
              }`}
            />
            <span className="text-[11px] font-mono uppercase tracking-widest text-[#ccd5ae] font-semibold">
              {isPlaying ? 'Cinematic Walkthrough' : isCompleted ? 'Sequence Complete' : 'Paused'}
            </span>
          </div>
          <span className="text-[#35443a] hidden sm:inline">•</span>
          <span className="text-xs font-mono text-[#d4a373]">
            Scene {scene.num} of 07: {scene.title}
          </span>
        </div>

        <span className="px-2.5 py-1 rounded bg-[#1c2923] border border-[#35443a] text-[10px] font-mono text-[#e9edc9]">
          ILLUSTRATIVE PIPELINE PREVIEW (SAMPLE ARTIFACT — NOT A LIVE JOB)
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1 bg-[#17211d]">
        <div
          className="h-full heritage-gradient-bar transition-all duration-500"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Main Cinematic Stage */}
      <div className="relative w-full min-h-[440px] sm:min-h-[540px] lg:min-h-[580px] bg-[#101614] flex items-center justify-center overflow-hidden p-4 sm:p-8">
        <div className="absolute inset-0 archive-grid opacity-30 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] bg-[#ccd5ae]/5 rounded-full blur-3xl pointer-events-none" />

        <AnimatePresence mode="wait">
          {!isCompleted ? (
            <motion.div
              key={scene.id}
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 1.01 }}
              transition={{ duration: prefersReducedMotion ? 0.1 : 0.55 }}
              className="relative w-full max-w-4xl flex flex-col items-center justify-center z-10"
            >
              {/* Manuscript Visual Container */}
              <div className="relative w-full rounded-2xl overflow-hidden border border-[#35443a] bg-[#17211d] shadow-2xl">
                {/* Scene 03 Interactive Split Comparison */}
                {scene.id === 'enhancement' ? (
                  <div className="relative w-full h-[320px] sm:h-[400px] bg-[#101614] select-none overflow-hidden">
                    <img
                      src="/assets/sample_enhanced.png"
                      alt="CLAHE Enhanced Sample Manuscript"
                      className="w-full h-full object-contain p-3 filter contrast-105"
                    />
                    <div
                      className="absolute inset-y-0 left-0 overflow-hidden border-r-2 border-[#ccd5ae]"
                      style={{ width: `${splitReveal}%` }}
                    >
                      <img
                        src="/assets/sample_original.png"
                        alt="Original Aged Sample Manuscript"
                        className="w-full h-full object-contain p-3 filter brightness-90"
                      />
                    </div>
                    <div className="absolute top-3 left-3 px-2.5 py-1 rounded bg-[#101614]/90 border border-[#35443a] text-[10px] font-mono text-[#e9edc9]">
                      Original Scan
                    </div>
                    <div className="absolute top-3 right-3 px-2.5 py-1 rounded bg-[#101614]/90 border border-[#ccd5ae]/50 text-[10px] font-mono text-[#ccd5ae]">
                      CLAHE + Denoised + Sharpened
                    </div>
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-[#17211d]/95 border border-[#35443a] text-[10px] font-mono text-[#fefae0]">
                      <Sliders className="w-3 h-3 text-[#ccd5ae]" />
                      <span>Reveal Split:</span>
                      <input
                        type="range"
                        min="15"
                        max="85"
                        value={splitReveal}
                        onChange={(e) => setSplitReveal(Number(e.target.value))}
                        aria-label="Adjust enhancement comparison split"
                        className="w-24 accent-[#ccd5ae] cursor-pointer"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="relative w-full h-[320px] sm:h-[400px] bg-[#101614] flex items-center justify-center p-3 overflow-hidden">
                    <img
                      src={
                        scene.id === 'ocr' || scene.id === 'translation' || scene.id === 'heritage'
                          ? '/assets/sample_enhanced.png'
                          : '/assets/sample_original.png'
                      }
                      alt="Sample Historical Palm-Leaf Manuscript"
                      className={`max-h-full max-w-full object-contain transition-all duration-700 ${
                        scene.id === 'discovery' ? 'brightness-90 contrast-95' : 'contrast-105'
                      }`}
                    />

                    {/* Scene 01: Discovery Badge */}
                    {scene.id === 'discovery' && (
                      <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-[#17211d]/90 border border-[#35443a] text-xs font-mono">
                        <span className="text-[#fefae0]">
                          Sample Artifact: Aged Palm-Leaf Folio
                        </span>
                        <span className="text-[#d4a373]">
                          Raw Original Preserved Untouched
                        </span>
                      </div>
                    )}

                    {/* Scene 02: Digital Scanning Beam */}
                    {scene.id === 'scanning' && (
                      <div className="absolute inset-0 pointer-events-none overflow-hidden">
                        {!prefersReducedMotion && (
                          <motion.div
                            initial={{ top: '-5%' }}
                            animate={{ top: '105%' }}
                            transition={{ duration: 2.6, repeat: Infinity, ease: 'linear' }}
                            className="scan-line"
                          />
                        )}
                        <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-[#ccd5ae]" />
                        <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-[#ccd5ae]" />
                        <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-[#ccd5ae]" />
                        <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-[#ccd5ae]" />
                        <div className="absolute top-5 left-6 px-2.5 py-1 rounded bg-[#101614]/90 border border-[#ccd5ae]/50 font-mono text-[10px] text-[#ccd5ae]">
                          OPTICAL CONDITION SCAN: LUMINANCE • CONTRAST • LAPLACIAN SHARPNESS
                        </div>
                      </div>
                    )}

                    {/* Scene 04: Damage Identification */}
                    {scene.id === 'damage' && (
                      <div className="absolute inset-0 pointer-events-none">
                        <img
                          src="/assets/sample_overlay.png"
                          alt="Illustrative Damage Overlay"
                          className="absolute inset-0 w-full h-full object-contain mix-blend-screen opacity-75 p-3"
                        />
                        <div className="absolute top-1/4 left-1/4 w-28 h-16 border-2 border-[#d4a373] bg-[#d4a373]/15 rounded-lg" />
                        <div className="absolute bottom-1/3 right-1/4 w-32 h-14 border-2 border-[#faedcd] bg-[#faedcd]/15 rounded-lg" />
                        <div className="absolute bottom-4 right-4 bg-[#17211d]/95 border border-[#d4a373] text-[#fefae0] font-mono text-[10px] px-3 py-2 rounded-xl space-y-1">
                          <div className="text-[#d4a373] font-bold">HEURISTIC DAMAGE REGIONS</div>
                          <div className="text-[#e9edc9]">• Dark Staining & Faded Zones</div>
                          <div className="text-[#faedcd]">• Linear Surface Crack Indicators</div>
                        </div>
                      </div>
                    )}

                    {/* Scene 05: OCR Recognition */}
                    {scene.id === 'ocr' && (
                      <div className="absolute inset-0 pointer-events-none p-4 flex flex-col justify-end bg-gradient-to-t from-[#101614]/95 via-[#101614]/30 to-transparent">
                        <div className="p-4 rounded-xl bg-[#17211d]/95 border border-[#ccd5ae] text-xs space-y-2 shadow-2xl">
                          <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono">
                            <span className="text-[#ccd5ae]">
                              ILLUSTRATIVE OCR LINE SEGMENTATION & TRANSCRIPTION
                            </span>
                            <span className="px-2 py-0.5 rounded bg-[#faedcd]/15 text-[#faedcd] border border-[#faedcd]/40">
                              Low-Confidence Glyphs Flagged for Scholar Review
                            </span>
                          </div>
                          <div className="font-indic text-base sm:text-lg text-[#fefae0] tracking-wide">
                            നമസ്തേസ്തു ഭഗവൻ വിശ്വേശ്വരായ മഹാദേവായ ത്ര്യംബകായ...
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Scene 06: English Translation */}
                    {scene.id === 'translation' && (
                      <div className="absolute inset-0 pointer-events-none p-4 flex flex-col justify-end bg-gradient-to-t from-[#101614]/95 via-[#101614]/40 to-transparent">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl bg-[#17211d]/95 border border-[#d4a373] text-xs shadow-2xl">
                          <div className="space-y-1">
                            <span className="text-[10px] font-mono text-[#e9edc9]">
                              REVIEWED SOURCE TRANSCRIPTION
                            </span>
                            <p className="font-indic text-sm text-[#fefae0]">
                              നമസ്തേസ്തു ഭഗവൻ വിശ്വേശ്വരായ മഹാദേവായ...
                            </p>
                          </div>
                          <div className="space-y-1 sm:border-l sm:border-[#35443a] sm:pl-3">
                            <span className="text-[10px] font-mono text-[#ccd5ae]">
                              ENGLISH TRANSLATION PREVIEW
                            </span>
                            <p className="font-serif text-sm text-[#fefae0] italic">
                              "Salutations unto the Sovereign of the Cosmos, the Great Divinity..."
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Scene 07: Digital Heritage Record */}
                    {scene.id === 'heritage' && (
                      <div className="absolute inset-0 pointer-events-none p-4 flex flex-col justify-end bg-gradient-to-t from-[#101614]/95 via-[#101614]/40 to-transparent">
                        <div className="p-4 rounded-xl bg-[#17211d]/95 border-2 border-[#d4a373] text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xl">
                          <div className="space-y-1">
                            <span className="text-[10px] font-mono text-[#d4a373] font-bold">
                              DIGITAL HERITAGE RECORD & QR PASSPORT
                            </span>
                            <div className="font-heading text-sm font-bold text-[#fefae0]">
                              Preserved Archival Folio — Structured Metadata & Provenance
                            </div>
                            <div className="text-[11px] text-[#a9b3a8] font-mono">
                              Owner-Controlled Visibility (Private Default / Public QR Share)
                            </div>
                          </div>
                          <div className="w-14 h-14 bg-[#fefae0] p-1.5 rounded-lg flex items-center justify-center shrink-0 border border-[#d4a373]">
                            <QrCode className="w-11 h-11 text-[#101614]" />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            /* Final Screen */
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="text-center p-6 sm:p-8 max-w-2xl space-y-6 z-20"
            >
              <div className="w-16 h-16 rounded-full bg-[#17211d] border-2 border-[#ccd5ae] text-[#ccd5ae] flex items-center justify-center mx-auto shadow-lg">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h3 className="font-heading text-3xl sm:text-5xl font-bold text-[#fefae0]">
                  Not just restored. Remembered.
                </h3>
                <p className="font-editorial text-2xl text-[#d4a373] italic">
                  "Bringing Forgotten Knowledge Back to Life."
                </p>
              </div>

              <p className="text-sm text-[#a9b3a8] leading-relaxed font-sans max-w-lg mx-auto">
                Upload a manuscript image or PDF to run the actual 5-stage computer vision, OCR, and digital heritage record pipeline in your personal workspace.
              </p>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  to="/analyse"
                  className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-8 py-3.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider text-[#101614] bg-[#ccd5ae] hover:bg-[#e9edc9] shadow-lg transition-all"
                >
                  <Sparkles className="w-4 h-4 text-[#101614]" />
                  <span>RESTORE A MANUSCRIPT</span>
                </Link>

                <button
                  type="button"
                  onClick={handleReplay}
                  className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3.5 rounded-xl text-xs font-mono tracking-wider text-[#fefae0] bg-[#17211d] hover:bg-[#1c2923] border border-[#35443a] transition-all"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-[#ccd5ae]" />
                  <span>Replay Walkthrough</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Subtitle & Narration Bar */}
      <div className="bg-[#17211d] px-4 sm:px-6 py-5 border-t border-[#35443a] relative z-20">
        <div className="max-w-4xl mx-auto text-center space-y-1.5">
          <div className="text-[11px] font-mono uppercase tracking-widest text-[#ccd5ae]">
            {scene.badge}
          </div>
          <h4 className="font-editorial text-xl sm:text-2xl text-[#fefae0] italic leading-snug">
            "{scene.subtitle}"
          </h4>
          <p className="text-xs text-[#a9b3a8] font-sans max-w-2xl mx-auto pt-0.5">
            {scene.desc}
          </p>
        </div>
      </div>

      {/* Playback Controls & Scene Stepper */}
      <div className="bg-[#101614] px-4 sm:px-6 py-4 border-t border-[#35443a]/80 flex flex-col sm:flex-row items-center justify-between gap-4 z-20 relative">
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentSceneIdx === 0 && !isCompleted}
            aria-label="Previous scene"
            className="p-2 rounded-lg bg-[#17211d] border border-[#35443a] text-[#a9b3a8] hover:text-[#fefae0] disabled:opacity-30 transition-all"
            title="Previous Scene"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handlePlayPause}
            className="px-4 py-2 rounded-lg bg-[#ccd5ae] text-[#101614] font-mono text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 hover:bg-[#e9edc9] shadow-md transition-all"
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>{isCompleted ? 'Replay' : 'Play'}</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleNext}
            disabled={isCompleted}
            aria-label="Next scene"
            className="p-2 rounded-lg bg-[#17211d] border border-[#35443a] text-[#a9b3a8] hover:text-[#fefae0] disabled:opacity-30 transition-all"
            title="Next Scene"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleReplay}
            aria-label="Restart walkthrough"
            className="p-2 rounded-lg bg-[#17211d] border border-[#35443a] text-[#a9b3a8] hover:text-[#fefae0] transition-all ml-1"
            title="Restart Walkthrough"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* 7-Stage Step Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-1.5">
          {MOVIE_SCENES.map((sc, i) => {
            const active = i === currentSceneIdx && !isCompleted;
            return (
              <button
                key={sc.id}
                type="button"
                onClick={() => {
                  setIsCompleted(false);
                  setCurrentSceneIdx(i);
                }}
                aria-label={`Jump to Scene ${sc.num}: ${sc.title}`}
                className={`px-2.5 py-1 rounded-md text-[10px] font-mono transition-all border ${
                  active
                    ? 'bg-[#ccd5ae] text-[#101614] border-[#ccd5ae] font-bold'
                    : i < currentSceneIdx || isCompleted
                    ? 'bg-[#1c2923] text-[#e9edc9] border-[#35443a]'
                    : 'bg-[#17211d] text-[#77857b] border-[#35443a]'
                }`}
              >
                {sc.num}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
