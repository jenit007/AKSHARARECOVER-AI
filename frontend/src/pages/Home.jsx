import React from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  BookOpen,
  Languages,
  Users,
  FileText,
  Sliders,
  QrCode,
  ShieldAlert,
} from 'lucide-react';
import CinematicProcessingMovie from '../components/home/CinematicProcessingMovie';

export default function Home() {
  const prefersReducedMotion = useReducedMotion();

  const fiveStages = [
    {
      num: '01',
      title: 'Adaptive Image Enhancement',
      tech: 'OpenCV Grayscale • fastNlMeans Denoising • CLAHE • Unsharp Mask',
      desc: 'Improves stroke contrast across uneven palm-leaf fibres while keeping the original uploaded scan untouched in permanent storage.',
      icon: Sliders,
      accent: 'border-[#ccd5ae]/50 text-[#ccd5ae]',
    },
    {
      num: '02',
      title: 'Damage Identification',
      tech: 'Heuristic Luminance Thresholding & Probabilistic Hough Lines',
      desc: 'Segments darkened stains, faded washout areas, and linear crack indicators into an inspectable overlay and region map.',
      icon: ShieldAlert,
      accent: 'border-[#faedcd]/50 text-[#faedcd]',
    },
    {
      num: '03',
      title: 'Enhanced-Image OCR',
      tech: 'EasyOCR Sequence Recognition + Human Correction Workbench',
      desc: 'Extracts text lines with bounding-box coordinates and per-line confidence scores, enabling side-by-side comparison and human revision.',
      icon: FileText,
      accent: 'border-[#e9edc9]/50 text-[#e9edc9]',
    },
    {
      num: '04',
      title: 'English Translation',
      tech: 'Bilingual Alignment & Scholarly Translation Editor',
      desc: 'Supports automated NLLB-200 translation when model weights are configured, alongside direct scholarly English translation entry and revision.',
      icon: Languages,
      accent: 'border-[#d4a373]/50 text-[#d4a373]',
    },
    {
      num: '05',
      title: 'Digital Heritage Record & QR',
      tech: 'Structured Archival Dossier & Owner-Controlled QR Passport',
      desc: 'Generates a permanent Digital Heritage Record with stage completion audit, downloadable JSON dossier, and a scannable QR code.',
      icon: QrCode,
      accent: 'border-[#ccd5ae]/50 text-[#fefae0]',
    },
  ];

  const preservationPillars = [
    {
      title: 'Historical Palm-Leaf Manuscripts',
      desc: 'Supports digital preservation of fragile Kerala palm-leaf folios (thaliyola) containing literature, philosophy, medicine, and astronomy.',
      badge: 'Digital Archaeology',
      icon: BookOpen,
    },
    {
      title: 'Non-Destructive Computer Vision',
      desc: 'Every uploaded folio is stored unmodified alongside intermediate grayscale, denoised, contrast-equalized, and sharpened outputs.',
      badge: 'Archival Integrity',
      icon: ShieldCheck,
    },
    {
      title: 'Human-in-the-Loop Epigraphy',
      desc: 'Machine recognition never overwrites scholarly judgment. Uncertain readings are flagged so researchers can commit versioned corrections.',
      badge: 'Verifiable Scholarship',
      icon: Languages,
    },
    {
      title: 'Account-Scoped Repository',
      desc: 'Each researcher manages a private manuscript archive with search, status filtering, JSON dossier export, and optional public QR sharing.',
      badge: 'Research Workspace',
      icon: Users,
    },
  ];

  return (
    <div className="min-h-screen bg-[#101614] text-[#f1f2e9] overflow-hidden selection:bg-[#ccd5ae]/30 selection:text-[#fefae0]">
      {/* HERO SECTION */}
      <section className="relative min-h-[90vh] flex items-center justify-center pt-28 pb-20 px-4 sm:px-6 lg:px-8 border-b border-[#35443a]/60">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#ccd5ae]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#d4a373]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-0 archive-grid opacity-25 pointer-events-none" />

        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          {/* Left Column */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#17211d] border border-[#35443a] text-[11px] font-mono tracking-widest text-[#ccd5ae] uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ccd5ae]" />
              <span>TEAM SCRIPTORIA • THE LIVING ARCHIVE</span>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-mono uppercase tracking-widest text-[#d4a373]">
                AKSHARARECOVER AI — Where Ancient Knowledge Meets Artificial Intelligence
              </p>
              <h1 className="font-heading text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-[#fefae0] leading-[1.08]">
                Bringing Forgotten Knowledge Back to Life.
              </h1>
              <h2 className="font-editorial text-2xl sm:text-3xl text-[#e9edc9] italic font-normal">
                AI-powered restoration support and digital preservation for historical Kerala palm-leaf manuscripts.
              </h2>
            </div>

            <p className="text-base sm:text-lg text-[#a9b3a8] leading-relaxed max-w-2xl font-sans">
              AKSHARARECOVER AI assists researchers, archivists, and custodians in examining aged manuscripts through non-destructive OpenCV enhancement, heuristic surface damage mapping, optical character recognition, human transcription review, English translation, and QR-linked digital heritage records.
            </p>

            {/* Primary & Secondary CTAs */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-4">
              <Link
                to="/analyse"
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-8 py-4 rounded-xl text-xs font-mono font-bold uppercase tracking-wider text-[#101614] bg-[#ccd5ae] hover:bg-[#e9edc9] shadow-[0_0_20px_rgba(204,213,174,0.25)] transition-all"
              >
                <Sparkles className="w-4 h-4 text-[#101614]" />
                <span>Restore a Manuscript</span>
                <ArrowRight className="w-4 h-4 text-[#101614]" />
              </Link>

              <Link
                to="/ai-model"
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-8 py-4 rounded-xl text-xs font-mono tracking-wider uppercase text-[#fefae0] bg-[#17211d] hover:bg-[#1c2923] border border-[#35443a] hover:border-[#d4a373]/70 transition-all"
              >
                <span>Explore the AI Model</span>
              </Link>
            </div>

            {/* Technical Subtext */}
            <div className="pt-4 flex flex-wrap items-center gap-6 text-[11px] font-mono text-[#a9b3a8]">
              <span className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-[#ccd5ae]" />
                <span>OpenCV CLAHE & Denoising</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-[#faedcd]" />
                <span>Heuristic Damage Overlay</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-[#d4a373]" />
                <span>EasyOCR + Scholar Audit</span>
              </span>
            </div>
          </div>

          {/* Right Column: Hero Manuscript Card */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-2xl border border-[#35443a] bg-[#17211d] p-3 shadow-2xl overflow-hidden">
              <div className="relative rounded-xl overflow-hidden bg-[#101614] min-h-[340px] flex items-center justify-center p-2">
                <img
                  src="/assets/sample_original.png"
                  alt="Sample Palm-Leaf Manuscript Folio"
                  className="w-full max-h-[400px] object-contain filter contrast-105"
                />

                {!prefersReducedMotion && (
                  <motion.div
                    initial={{ top: '-5%' }}
                    animate={{ top: '105%' }}
                    transition={{ duration: 3.2, repeat: Infinity, ease: 'linear' }}
                    className="scan-line"
                  />
                )}

                <div className="absolute top-3 left-3 bg-[#101614]/90 border border-[#ccd5ae]/60 px-2.5 py-1 rounded text-[10px] font-mono text-[#ccd5ae] flex items-center space-x-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ccd5ae]" />
                  <span>5-STAGE PRESERVATION PIPELINE</span>
                </div>

                <div className="absolute bottom-3 left-3 right-3 bg-[#101614]/90 border border-[#35443a] px-3 py-2 rounded-lg flex items-center justify-between text-[10px] font-mono">
                  <span className="text-[#fefae0]">Illustrative Archive Preview</span>
                  <span className="text-[#d4a373]">Non-Destructive Workflow</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CINEMATIC MANUSCRIPT SCANNING ANIMATION */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-10">
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#17211d] border border-[#35443a] text-xs font-mono text-[#ccd5ae] uppercase">
            <span>Interactive Pipeline Walkthrough</span>
          </div>
          <h2 className="font-heading text-3xl sm:text-5xl font-bold tracking-tight text-[#fefae0]">
            From Fragile Leaf to Digital Heritage Record
          </h2>
          <p className="font-editorial text-xl sm:text-2xl text-[#d4a373] italic">
            Follow how an ancient manuscript moves through the five preservation stages.
          </p>
        </div>

        <CinematicProcessingMovie />
      </section>

      {/* FIVE PROCESSING STAGES */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-[#35443a]/60 space-y-12">
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <span className="text-xs font-mono uppercase tracking-widest text-[#ccd5ae] font-semibold">
            Technical Architecture
          </span>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-[#fefae0]">
            The Five Processing Stages
          </h2>
          <p className="text-sm sm:text-base text-[#a9b3a8] font-sans">
            Every manuscript uploaded to AKSHARARECOVER AI is processed through five structured, auditable stages.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {fiveStages.map((stage) => {
            const Icon = stage.icon;
            return (
              <div
                key={stage.num}
                className="p-5 rounded-2xl bg-[#17211d] border border-[#35443a] hover:border-[#ccd5ae]/60 transition-all flex flex-col justify-between space-y-4 shadow-lg"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-[#d4a373]">
                      STAGE {stage.num}
                    </span>
                    <div className={`w-9 h-9 rounded-xl bg-[#1c2923] border flex items-center justify-center ${stage.accent}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>
                  <h3 className="font-heading text-base font-bold text-[#fefae0]">
                    {stage.title}
                  </h3>
                  <p className="text-[11px] font-mono text-[#ccd5ae] leading-snug">
                    {stage.tech}
                  </p>
                  <p className="text-xs text-[#a9b3a8] leading-relaxed">
                    {stage.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* CULTURAL PRESERVATION MOTIVATION & IMPACT */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-[#35443a]/60 space-y-12">
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <span className="text-xs font-mono uppercase tracking-widest text-[#d4a373] font-semibold">
            Preservation Impact
          </span>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-[#fefae0]">
            Designed for Research Integrity & Cultural Continuity
          </h2>
          <p className="text-sm sm:text-base text-[#a9b3a8] font-sans">
            Combining deterministic image processing with transparent human review so fragile historical texts can be studied and shared responsibly.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {preservationPillars.map((b) => {
            const Icon = b.icon;
            return (
              <div
                key={b.title}
                className="p-6 rounded-2xl bg-[#17211d] border border-[#35443a] hover:border-[#ccd5ae]/60 transition-all space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-[#1c2923] border border-[#35443a] text-[#ccd5ae] flex items-center justify-center">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-[#d4a373] block mb-1">
                      {b.badge}
                    </span>
                    <h3 className="font-heading text-lg font-bold text-[#fefae0]">
                      {b.title}
                    </h3>
                  </div>
                  <p className="text-xs text-[#a9b3a8] leading-relaxed font-sans">
                    {b.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center space-y-6 border-t border-[#35443a]/60">
        <h2 className="font-heading text-3xl sm:text-5xl font-bold text-[#fefae0]">
          Begin Preserving a Manuscript Folio
        </h2>
        <p className="text-base sm:text-lg text-[#a9b3a8] max-w-2xl mx-auto font-sans leading-relaxed">
          Upload a high-resolution manuscript image or PDF to generate enhanced visuals, damage maps, OCR transcriptions, and a Digital Heritage Record.
        </p>
        <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/analyse"
            className="inline-flex items-center space-x-2.5 px-8 py-4 rounded-xl text-xs font-mono font-bold uppercase tracking-wider text-[#101614] bg-[#ccd5ae] hover:bg-[#e9edc9] shadow-lg transition-all"
          >
            <Sparkles className="w-4 h-4 text-[#101614]" />
            <span>Restore a Manuscript</span>
            <ArrowRight className="w-4 h-4 text-[#101614]" />
          </Link>
          <Link
            to="/importance"
            className="inline-flex items-center space-x-2 px-6 py-4 rounded-xl text-xs font-mono uppercase tracking-wider text-[#e9edc9] bg-[#17211d] hover:bg-[#1c2923] border border-[#35443a]"
          >
            <span>Why Preservation Matters</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
