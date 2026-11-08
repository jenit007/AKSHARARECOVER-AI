import React from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  BookOpen,
  Sparkles,
  ArrowRight,
  GraduationCap,
  Library,
  Globe2,
  CheckCircle2,
  Compass,
} from 'lucide-react';

export default function WhyItMatters() {
  const challenges = [
    {
      title: 'Organic Material Vulnerability',
      desc: 'Prepared palm-leaf folios are organic substrates susceptible to tropical humidity, fungal staining, embrittlement, and insect damage over time.',
    },
    {
      title: 'Faded & Low-Contrast Incisions',
      desc: 'Stylus-incised characters darkened with traditional soot or herbal pigments gradually lose visual contrast against ageing leaf surfaces.',
    },
    {
      title: 'Dispersed Custodianship',
      desc: 'Important manuscripts are often held across family collections, regional libraries, and traditional repositories with varying conservation resources.',
    },
    {
      title: 'Script & Paleographical Complexity',
      desc: 'Reading historical Malayalam, Grantha, and Sanskrit manuscripts requires familiarity with older ligatures and scribal conventions.',
    },
    {
      title: 'Unindexed Visual Scans',
      desc: 'Raw photographic archives without transcription, metadata, or searchability remain difficult for students and researchers to study.',
    },
    {
      title: 'Need for Auditable Digital Records',
      desc: 'Preservation requires keeping raw scans intact while clearly separating machine outputs from human scholarly revisions.',
    },
  ];

  const contributions = [
    {
      title: 'Non-Destructive Archiving',
      desc: 'Preserves the original uploaded manuscript scan unaltered alongside enhanced inspection views.',
    },
    {
      title: 'Adaptive Contrast Enhancement',
      desc: 'Uses OpenCV denoising, CLAHE contrast equalization, and sharpening to improve stroke visibility.',
    },
    {
      title: 'Surface Anomaly Highlighting',
      desc: 'Provides heuristic overlays to help conservators and researchers inspect stained, faded, or cracked regions.',
    },
    {
      title: 'Assisted OCR & Confidence Scoring',
      desc: 'Extracts candidate text lines with bounding boxes and confidence metrics to accelerate transcription.',
    },
    {
      title: 'Human Transcription Workbench',
      desc: 'Enables researchers to correct OCR readings and maintain versioned revision trails.',
    },
    {
      title: 'Bilingual Translation Support',
      desc: 'Pairs source transcriptions with English translations and scholarly notes for broader accessibility.',
    },
    {
      title: 'Cultural Entity Indexing',
      desc: 'Links terms found in transcriptions to structured categories and interactive relationship graphs.',
    },
    {
      title: 'QR-Linked Heritage Passports',
      desc: 'Packages each preserved folio into a shareable digital record with downloadable JSON metadata.',
    },
  ];

  const beneficiaries = [
    {
      role: 'Epigraphists & Historians',
      desc: 'Inspect enhanced high-contrast folios, compare raw vs enhanced OCR, and record verified transcriptions.',
      icon: Library,
    },
    {
      role: 'Students & Educators',
      desc: 'Study primary regional manuscripts alongside readable transcriptions, English translations, and contextual notes.',
      icon: GraduationCap,
    },
    {
      role: 'Cultural Practitioners',
      desc: 'Document and preserve textual references connected to classical arts, ritual traditions, and regional lore.',
      icon: Sparkles,
    },
    {
      role: 'Traditional Knowledge Researchers',
      desc: 'Organize and review manuscripts relating to indigenous medicine, astronomy, architecture, and literature.',
      icon: BookOpen,
    },
    {
      role: 'Archivists & Custodians',
      desc: 'Maintain an account-scoped digital catalog with structured metadata, status tracking, and QR passports.',
      icon: Compass,
    },
    {
      role: 'Future Readers',
      desc: 'Benefit from preserved digital records that keep fragile textual heritage accessible across generations.',
      icon: Globe2,
    },
  ];

  return (
    <div className="min-h-screen bg-[#101614] text-[#f1f2e9] pt-28 pb-20 px-4 sm:px-6 lg:px-8 space-y-20 selection:bg-[#ccd5ae]/30 selection:text-[#fefae0]">
      {/* Hero */}
      <section className="max-w-4xl mx-auto text-center space-y-4">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#17211d] border border-[#35443a] text-xs font-mono text-[#ccd5ae] uppercase">
          <span>Importance of Preservation</span>
        </div>
        <h1 className="font-heading text-4xl sm:text-6xl font-bold tracking-tight text-[#fefae0] leading-tight">
          Why Palm-Leaf Manuscript Preservation Matters
        </h1>
        <p className="font-editorial text-2xl sm:text-3xl text-[#d4a373] italic max-w-2xl mx-auto leading-relaxed">
          "Every fragile folio carries irreplaceable cultural, literary, and scientific memory."
        </p>
      </section>

      {/* Historical & Cultural Significance */}
      <section className="max-w-5xl mx-auto">
        <div className="p-8 sm:p-12 rounded-2xl bg-[#17211d] border border-[#35443a] space-y-6 shadow-xl">
          <span className="text-xs font-mono uppercase tracking-widest text-[#ccd5ae] font-semibold">
            Cultural & Historical Value
          </span>
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-[#fefae0]">
            Safeguarding Regional Knowledge Systems
          </h2>
          <div className="space-y-4 text-sm sm:text-base text-[#a9b3a8] leading-relaxed font-sans">
            <p>
              For centuries, palm-leaf manuscripts served as the primary medium in Kerala and across South Asia for recording literature, philosophy, mathematics, astronomy, traditional medicine, temple architecture, and performing arts traditions.
            </p>
            <p>
              Because palm-leaf folios are organic artifacts, physical conservation must be complemented by careful digital preservation. High-clarity imaging, readable transcription, and structured cataloging ensure that even if a physical leaf continues to age, its textual content and provenance remain available for study.
            </p>
          </div>
        </div>
      </section>

      {/* Digitisation Challenges */}
      <section className="max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <span className="text-xs font-mono uppercase tracking-widest text-[#faedcd] font-semibold">
            Digitisation Challenges
          </span>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-[#fefae0]">
            Why Simple Photographing Is Not Enough
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {challenges.map((c) => (
            <div
              key={c.title}
              className="p-6 rounded-2xl bg-[#17211d] border border-[#35443a] space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <AlertTriangle className="w-5 h-5 text-[#d4a373]" />
                <h3 className="font-heading text-base font-bold text-[#fefae0]">
                  {c.title}
                </h3>
                <p className="text-xs text-[#a9b3a8] leading-relaxed font-sans">
                  {c.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How AI Can Support Preservation */}
      <section className="max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <span className="text-xs font-mono uppercase tracking-widest text-[#ccd5ae] font-semibold">
            Assistive Technology
          </span>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-[#fefae0]">
            How AKSHARARECOVER AI Supports Preservation
          </h2>
          <p className="text-xs sm:text-sm text-[#a9b3a8] font-sans">
            Practical tools designed to assist—never replace—epigraphists, archivists, and community custodians.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {contributions.map((item) => (
            <div
              key={item.title}
              className="p-5 rounded-xl bg-[#17211d] border border-[#35443a] hover:border-[#ccd5ae]/60 transition-all space-y-2"
            >
              <div className="flex items-center space-x-1.5 text-[#ccd5ae]">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <h4 className="font-heading text-xs font-bold text-[#fefae0]">
                  {item.title}
                </h4>
              </div>
              <p className="text-[11px] text-[#a9b3a8] leading-relaxed font-sans">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Research & Educational Value */}
      <section className="max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <span className="text-xs font-mono uppercase tracking-widest text-[#d4a373] font-semibold">
            Research & Educational Value
          </span>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-[#fefae0]">
            Supporting Scholars, Custodians & Learners
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {beneficiaries.map((b) => {
            const Icon = b.icon;
            return (
              <div
                key={b.role}
                className="p-6 rounded-2xl bg-[#17211d] border border-[#35443a] space-y-3"
              >
                <div className="w-10 h-10 rounded-xl bg-[#1c2923] border border-[#35443a] text-[#d4a373] flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-heading text-lg font-bold text-[#fefae0]">
                  {b.role}
                </h3>
                <p className="text-xs text-[#a9b3a8] leading-relaxed font-sans">
                  {b.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Before / After Comparison */}
      <section className="max-w-5xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <span className="text-xs font-mono uppercase tracking-widest text-[#ccd5ae] font-semibold">
            Long-Term Potential
          </span>
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-[#fefae0]">
            From Isolated Scans to Structured Digital Heritage
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 sm:p-8 rounded-2xl bg-[#17211d] border border-[#35443a]">
          <div className="p-6 rounded-xl bg-[#101614] border border-[#faedcd]/40 space-y-3">
            <span className="text-xs font-mono uppercase font-bold text-[#faedcd] block">
              UNPROCESSED DIGITAL SCANS
            </span>
            <ul className="space-y-2 text-xs text-[#a9b3a8] leading-relaxed">
              <li>• Low-contrast images where darkened leaf fibres obscure incised characters.</li>
              <li>• No separation between surface damage and readable script zones.</li>
              <li>• Unsearchable image files without line-level transcription or metadata.</li>
              <li>• No structured export or verifiable heritage record link.</li>
            </ul>
          </div>

          <div className="p-6 rounded-xl bg-[#101614] border border-[#ccd5ae]/40 space-y-3">
            <span className="text-xs font-mono uppercase font-bold text-[#ccd5ae] block">
              THE LIVING ARCHIVE WORKFLOW
            </span>
            <ul className="space-y-2 text-xs text-[#fefae0] leading-relaxed">
              <li>• Original scan preserved alongside CLAHE-enhanced and denoised views.</li>
              <li>• Heuristic surface damage overlay and measured optical metrics.</li>
              <li>• Assisted OCR line extraction with confidence flags and human correction.</li>
              <li>• Structured Digital Heritage Record with QR passport and JSON export.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="max-w-4xl mx-auto text-center space-y-6 pt-12 border-t border-[#35443a]/60">
        <h2 className="font-heading text-3xl sm:text-5xl font-bold text-[#fefae0]">
          Start Preserving a Manuscript Today
        </h2>
        <div className="pt-2">
          <Link
            to="/analyse"
            className="inline-flex items-center space-x-2 px-8 py-4 rounded-xl text-xs font-mono font-bold uppercase tracking-wider text-[#101614] bg-[#ccd5ae] hover:bg-[#e9edc9] shadow-lg transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>Restore a Manuscript</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
