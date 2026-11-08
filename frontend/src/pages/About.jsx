import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Search,
  Network,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

export default function About() {
  const principles = [
    {
      title: 'PRESERVE',
      tagline: 'Non-Destructive Digital Archiving',
      desc: 'Uploaded manuscript scans are stored unaltered in dedicated original storage. All contrast enhancement and damage overlays operate on derivative copies.',
      icon: ShieldCheck,
    },
    {
      title: 'ASSIST, NEVER FABRICATE',
      tagline: 'Transparent AI & Heuristic Diagnostics',
      desc: 'Optical metrics, heuristic damage indicators, and OCR confidence scores are reported directly from actual computation without inventing readings or hiding uncertainty.',
      icon: Search,
    },
    {
      title: 'HUMAN SCHOLARSHIP FIRST',
      tagline: 'Versioned Epigraphical Review',
      desc: 'Researchers can inspect line-by-line OCR output, edit transcriptions, enter or refine English translations, and record verification decisions.',
      icon: Network,
    },
  ];

  return (
    <div className="min-h-screen bg-[#101614] text-[#f1f2e9] pt-28 pb-20 px-4 sm:px-6 lg:px-8 space-y-20 selection:bg-[#ccd5ae]/30 selection:text-[#fefae0]">
      {/* Hero Section */}
      <section className="max-w-4xl mx-auto text-center space-y-4">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#17211d] border border-[#35443a] text-xs font-mono text-[#ccd5ae] uppercase">
          <span>About the Project • Team SCRIPTORIA</span>
        </div>
        <h1 className="font-heading text-4xl sm:text-6xl font-bold tracking-tight text-[#fefae0] leading-tight">
          Why We Built AKSHARARECOVER AI
        </h1>
        <p className="font-editorial text-2xl sm:text-3xl text-[#d4a373] italic max-w-2xl mx-auto leading-relaxed">
          "Bringing Forgotten Knowledge Back to Life."
        </p>
      </section>

      {/* The Problem Being Addressed */}
      <section className="max-w-5xl mx-auto">
        <div className="p-8 sm:p-12 rounded-2xl bg-[#17211d] border border-[#35443a] space-y-6 shadow-xl">
          <div className="flex items-center space-x-2 text-xs font-mono text-[#faedcd]">
            <AlertTriangle className="w-4 h-4 text-[#d4a373]" />
            <span>THE PRESERVATION CHALLENGE</span>
          </div>
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-[#fefae0]">
            Fragile Palm-Leaf Manuscripts & Fading Legibility
          </h2>
          <div className="space-y-4 text-sm sm:text-base text-[#a9b3a8] leading-relaxed font-sans">
            <p>
              Historical Kerala palm-leaf manuscripts (thaliyola) are organic artifacts vulnerable to humidity, fungal staining, surface darkening, fading pigment, and physical cracking along leaf fibres. Raw photographic scans of aged folios frequently suffer from low contrast between the incised characters and the darkened leaf background.
            </p>
            <p>
              Deciphering these folios requires both careful visual restoration and paleographical expertise across historical scripts such as Malayalam, Grantha, and Devanagari. When digitized images remain unindexed and difficult to read, valuable literary, medical, astronomical, and cultural records remain inaccessible.
            </p>
          </div>
        </div>
      </section>

      {/* Project Vision & Cultural Motivation */}
      <section className="max-w-5xl mx-auto text-center space-y-4">
        <span className="text-xs font-mono uppercase tracking-widest text-[#ccd5ae] font-semibold">
          Project Vision
        </span>
        <h2 className="font-heading text-3xl sm:text-4xl font-bold text-[#fefae0]">
          THE LIVING ARCHIVE — Where Ancient Knowledge Meets Artificial Intelligence
        </h2>
        <p className="text-sm sm:text-base text-[#a9b3a8] max-w-3xl mx-auto font-sans leading-relaxed">
          AKSHARARECOVER AI was created by Team SCRIPTORIA as an integrated digital preservation workbench. Rather than treating AI as a replacement for human scholars, the platform pairs deterministic computer vision and OCR with human transcription editing, translation review, and structured archival record generation.
        </p>
      </section>

      {/* Core Principles */}
      <section className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        {principles.map((p) => {
          const Icon = p.icon;
          return (
            <div
              key={p.title}
              className="p-8 rounded-2xl bg-[#17211d] border border-[#35443a] hover:border-[#ccd5ae]/60 transition-all space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-[#1c2923] border border-[#35443a] text-[#ccd5ae] flex items-center justify-center">
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-mono font-bold text-[#d4a373] block">
                    {p.title}
                  </span>
                  <h3 className="font-heading text-lg font-bold text-[#fefae0] mt-0.5">
                    {p.tagline}
                  </h3>
                </div>
                <p className="text-xs text-[#a9b3a8] leading-relaxed font-sans">
                  {p.desc}
                </p>
              </div>
            </div>
          );
        })}
      </section>

      {/* Technical & Preservation Goals */}
      <section className="max-w-5xl mx-auto">
        <div className="p-8 sm:p-12 rounded-2xl bg-[#17211d] border border-[#ccd5ae]/40 space-y-8">
          <div className="space-y-2 text-center max-w-2xl mx-auto">
            <span className="text-xs font-mono uppercase tracking-widest text-[#ccd5ae] font-semibold">
              Technical & Preservation Goals
            </span>
            <blockquote className="font-editorial text-3xl sm:text-4xl font-normal text-[#fefae0] italic">
              "AI should help recover knowledge, not invent it."
            </blockquote>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-[#35443a] text-xs text-[#a9b3a8] leading-relaxed">
            <div className="space-y-3">
              <div className="flex items-start space-x-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#ccd5ae] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[#fefae0] block font-sans">Original File Preservation:</strong>
                  Every uploaded image or PDF is stored unmodified so scholars can always compare enhanced derivatives against the raw source.
                </div>
              </div>
              <div className="flex items-start space-x-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#ccd5ae] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[#fefae0] block font-sans">Honest OCR Confidence Reporting:</strong>
                  Line-level confidence scores and low-confidence regions are surfaced transparently instead of fabricating certainty.
                </div>
              </div>
              <div className="flex items-start space-x-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#ccd5ae] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[#fefae0] block font-sans">Versioned Human Corrections:</strong>
                  Researchers can edit transcriptions and translations while preserving the original machine output in the database.
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-start space-x-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#d4a373] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[#fefae0] block font-sans">Grounded Cultural References:</strong>
                  Cultural entities and knowledge graph nodes link back to manuscript excerpts rather than ungrounded generation.
                </div>
              </div>
              <div className="flex items-start space-x-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#d4a373] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[#fefae0] block font-sans">Account Isolation & Privacy Control:</strong>
                  Uploaded manuscripts belong to the authenticated user's library by default, with explicit owner-controlled public QR sharing.
                </div>
              </div>
              <div className="flex items-start space-x-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#d4a373] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[#fefae0] block font-sans">Structured Heritage Records:</strong>
                  Each manuscript can be exported as a structured JSON dossier or inspected via a QR-linked Digital Heritage Record.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="max-w-3xl mx-auto text-center space-y-4 pt-8 border-t border-[#35443a]/60">
        <span className="text-xs font-mono uppercase tracking-widest text-[#ccd5ae] font-semibold">
          Development Team
        </span>
        <h3 className="font-heading text-3xl font-bold text-[#fefae0]">
          Team SCRIPTORIA
        </h3>
        <p className="text-xs sm:text-sm text-[#a9b3a8] max-w-xl mx-auto leading-relaxed">
          Dedicated to building practical, transparent digital preservation software that supports the study and safeguarding of historical palm-leaf manuscripts.
        </p>
        <div className="pt-2">
          <Link
            to="/analyse"
            className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl text-xs font-mono font-bold uppercase tracking-wider text-[#101614] bg-[#ccd5ae] hover:bg-[#e9edc9] transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>Open Manuscript Workbench</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
