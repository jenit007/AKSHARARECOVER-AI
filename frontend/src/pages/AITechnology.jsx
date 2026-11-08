import React from 'react';
import { Link } from 'react-router-dom';
import {
  Sliders,
  ShieldAlert,
  FileText,
  Languages,
  QrCode,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import DamageOverlayViewer from '../components/manuscript/DamageOverlayViewer';
import HeritageGraphView from '../components/knowledgeGraph/HeritageGraphView';

export default function AITechnology() {
  const fivePipelineStages = [
    {
      num: '01',
      title: 'Adaptive Image Enhancement',
      status: 'Implemented & Active Locally',
      tech: 'OpenCV (cv2.cvtColor, fastNlMeansDenoising, createCLAHE, GaussianBlur / addWeighted)',
      desc: 'Converts the input folio to grayscale, suppresses high-frequency sensor and grain noise via Non-Local Means denoising, normalizes local contrast across uneven palm-leaf illumination using CLAHE, and applies unsharp masking to sharpen character incisions. Computes a 32-bin pixel intensity histogram and optical metrics (mean brightness, contrast standard deviation, Laplacian sharpness variance, and noise estimate).',
      icon: Sliders,
    },
    {
      num: '02',
      title: 'Damage Identification',
      status: 'Implemented & Active Locally (Heuristic CV)',
      tech: 'OpenCV Luminance Thresholding, Morphological Contours & Probabilistic Hough Transform',
      desc: 'Identifies three classes of physical surface anomalies using deterministic computer vision heuristics: darkened staining (low luminance < 65), faded washout zones (high luminance > 215 with low local contrast), and linear crack/scratch artifacts (Canny edges + HoughLinesP). Outputs a colour-coded overlay image, binary mask, and bounding-box coordinates.',
      icon: ShieldAlert,
    },
    {
      num: '03',
      title: 'Enhanced-Image OCR & Transcription Review',
      status: 'Implemented & Active Locally',
      tech: 'EasyOCR (CRAFT Text Detector + CRNN Sequence Recognizer) & Versioned Human Correction',
      desc: 'Runs optical character recognition on both the raw original scan and the enhanced image to measure recognition improvement. Returns line bounding boxes, per-line softmax confidence scores, and flags lines below the 0.70 confidence threshold for human epigraphical correction.',
      icon: FileText,
    },
    {
      num: '04',
      title: 'English Translation',
      status: 'Hybrid: Manual Scholarly Editor Active • Automated NLLB-200 Optional',
      tech: 'Transformers / Meta NLLB-200 (Optional Local Weights) + Human Translation Workbench',
      desc: 'Provides a bilingual translation interface linked to the transcription version. When local NLLB-200 weights (facebook/nllb-200-distilled-600M) or an external translation engine are configured, automated neural translation can be triggered; when unavailable, the system transparently reports engine status and enables direct scholarly English translation entry and editing without fabricating output.',
      icon: Languages,
    },
    {
      num: '05',
      title: 'Digital Heritage Record & QR',
      status: 'Implemented & Active Locally',
      tech: 'SQLAlchemy Archival Ledger + Python qrcode PNG / SVG Generator',
      desc: 'Compiles manuscript metadata, real stage completion status, verification history, and cultural entities into a Digital Heritage Record. Generates a high-contrast QR code pointing to the record URL with owner-controlled PRIVATE or PUBLIC sharing visibility.',
      icon: QrCode,
    },
  ];

  const provenanceBadges = [
    {
      label: 'AI / HEURISTIC OUTPUT',
      desc: 'Automated OpenCV enhancement metrics, heuristic damage boxes, and raw EasyOCR line predictions with explicit confidence scores.',
      color: '#faedcd',
      badge: 'Machine Computed',
    },
    {
      label: 'HUMAN CORRECTED',
      desc: 'Transcriptions or English translations edited by the manuscript owner/researcher, stored as versioned records while preserving original OCR.',
      color: '#d4a373',
      badge: 'Versioned Revision',
    },
    {
      label: 'SCHOLARLY VERIFIED',
      desc: 'Manuscripts that have undergone review sign-off with recorded reviewer notes and timestamped audit history.',
      color: '#ccd5ae',
      badge: 'Verified Record',
    },
    {
      label: 'OWNER-CONTROLLED QR SHARE',
      desc: 'Heritage records default to PRIVATE visibility and can be toggled to PUBLIC by the owner for external QR code verification.',
      color: '#fefae0',
      badge: 'Access Controlled',
    },
  ];

  return (
    <div className="min-h-screen bg-[#101614] text-[#f1f2e9] pt-28 pb-20 px-4 sm:px-6 lg:px-8 space-y-20 selection:bg-[#ccd5ae]/30 selection:text-[#fefae0]">
      {/* Hero */}
      <section className="max-w-4xl mx-auto text-center space-y-4">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#17211d] border border-[#35443a] text-xs font-mono text-[#ccd5ae] uppercase">
          <span>AI Model & Technical Pipeline</span>
        </div>
        <h1 className="font-heading text-4xl sm:text-6xl font-bold tracking-tight text-[#fefae0] leading-tight">
          Inside the Five-Stage Preservation Pipeline
        </h1>
        <p className="font-editorial text-2xl sm:text-3xl text-[#d4a373] italic max-w-2xl mx-auto leading-relaxed">
          "Transparent computer vision, optical character recognition, and human-in-the-loop archival engineering."
        </p>
      </section>

      {/* Detailed 5-Stage Pipeline Breakdown */}
      <section className="max-w-6xl mx-auto space-y-8">
        <div className="space-y-2">
          <span className="text-xs font-mono uppercase tracking-widest text-[#ccd5ae] font-semibold">
            Pipeline Architecture
          </span>
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-[#fefae0]">
            Implemented Five-Stage Processing Workflow
          </h2>
          <p className="text-xs sm:text-sm text-[#a9b3a8] font-sans">
            Each stage executes real backend logic in FastAPI and persists structured results to the database.
          </p>
        </div>

        <div className="space-y-4">
          {fivePipelineStages.map((stage) => {
            const Icon = stage.icon;
            return (
              <div
                key={stage.num}
                className="p-6 rounded-2xl bg-[#17211d] border border-[#35443a] hover:border-[#ccd5ae]/60 transition-all space-y-3 shadow-lg"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#35443a] pb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-[#1c2923] border border-[#ccd5ae]/40 text-[#ccd5ae] flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-widest text-[#d4a373] block">
                        Stage {stage.num}
                      </span>
                      <h3 className="font-heading text-lg sm:text-xl font-bold text-[#fefae0]">
                        {stage.title}
                      </h3>
                    </div>
                  </div>

                  <span className="px-3 py-1 rounded-full bg-[#1c2923] border border-[#ccd5ae]/40 text-[11px] font-mono text-[#ccd5ae]">
                    {stage.status}
                  </span>
                </div>

                <div className="text-xs font-mono text-[#e9edc9]">
                  Technology: <span className="text-[#d4a373]">{stage.tech}</span>
                </div>

                <p className="text-xs sm:text-sm text-[#a9b3a8] leading-relaxed">
                  {stage.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Honest Distinction: Implemented vs Planned / Optional Enhancements */}
      <section className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 sm:p-8 rounded-2xl bg-[#17211d] border border-[#ccd5ae]/50 space-y-4">
          <div className="flex items-center space-x-2 text-xs font-mono text-[#ccd5ae] uppercase">
            <CheckCircle2 className="w-4 h-4" />
            <span>Implemented & Active in This Build</span>
          </div>
          <h3 className="font-heading text-xl font-bold text-[#fefae0]">
            Active Local Capabilities
          </h3>
          <ul className="space-y-2.5 text-xs text-[#a9b3a8] leading-relaxed">
            <li>• <strong className="text-[#fefae0]">File Ingestion & Normalization:</strong> JPG, PNG, WebP, TIFF, and PDF page conversion via PyMuPDF & Pillow.</li>
            <li>• <strong className="text-[#fefae0]">OpenCV Multi-Step Enhancement:</strong> Grayscale, fastNlMeansDenoising, CLAHE, unsharp masking, and 32-bin histogram calculation.</li>
            <li>• <strong className="text-[#fefae0]">Heuristic Surface Damage Mapping:</strong> Dark stain, faded pigment, and Hough line crack segmentation with proportional bounding boxes.</li>
            <li>• <strong className="text-[#fefae0]">EasyOCR Script Extraction:</strong> CRAFT text detection + CRNN recognition with line coordinates and confidence scoring.</li>
            <li>• <strong className="text-[#fefae0]">Human Review & Digital Heritage Passports:</strong> Versioned transcription/translation editing, cultural entity extraction, and QR code generation.</li>
          </ul>
        </div>

        <div className="p-6 sm:p-8 rounded-2xl bg-[#17211d] border border-[#d4a373]/50 space-y-4">
          <div className="flex items-center space-x-2 text-xs font-mono text-[#d4a373] uppercase">
            <Clock className="w-4 h-4" />
            <span>Optional Dependencies & Planned Enhancements</span>
          </div>
          <h3 className="font-heading text-xl font-bold text-[#fefae0]">
            External Models & Future Roadmap
          </h3>
          <ul className="space-y-2.5 text-xs text-[#a9b3a8] leading-relaxed">
            <li>• <strong className="text-[#fefae0]">Automated Neural Translation (NLLB-200):</strong> Supported in backend code via HuggingFace <code>transformers</code> (<code>facebook/nllb-200-distilled-600M</code>). When local weights are not installed (<code>TRANSLATION_ENGINE=none</code>), the UI clearly reports engine unavailability and provides manual scholarly translation editing.</li>
            <li>• <strong className="text-[#fefae0]">Trained Deep Segmentation for Damage:</strong> Current damage detection uses deterministic OpenCV luminance and Hough line heuristics; training a dedicated U-Net/Mask-RCNN model on annotated palm-leaf datasets is a planned research extension.</li>
            <li>• <strong className="text-[#fefae0]">Specialized Paleographical Models:</strong> Fine-tuning custom OCR weights for archaic Vatteluttu and Kolezhuthu ligatures beyond standard Devanagari/Malayalam/English character sets.</li>
          </ul>
        </div>
      </section>

      {/* Interactive Sample Preview: Damage Overlay */}
      <section className="max-w-6xl mx-auto space-y-6">
        <div className="space-y-2">
          <span className="text-xs font-mono uppercase tracking-widest text-[#ccd5ae] font-semibold">
            Interactive Reference Preview
          </span>
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-[#fefae0]">
            Sample Computer Vision & Heuristic Damage Layer Inspection
          </h2>
          <p className="text-xs sm:text-sm text-[#a9b3a8] font-sans">
            Illustrative sample demonstrating how the original scan, heuristic damage mask overlay, and CLAHE-enhanced output are compared.
          </p>
        </div>

        <DamageOverlayViewer
          originalUrl="/assets/sample_original.png"
          enhancedUrl="/assets/sample_enhanced.png"
          overlayUrl="/assets/sample_overlay.png"
          damageIndicators={{
            overall_damage_ratio: 0.148,
            total_suspected_regions: 14,
            dark_stains: 'Luminance < 65 threshold',
            scratches_and_cracks: 'Probabilistic Hough lines',
          }}
        />
      </section>

      {/* Semantic Graph Preview */}
      <section className="max-w-6xl mx-auto space-y-6">
        <div className="space-y-2">
          <span className="text-xs font-mono uppercase tracking-widest text-[#d4a373] font-semibold">
            Cultural Intelligence
          </span>
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-[#fefae0]">
            Cultural Entity Extraction & Knowledge Graph Topology
          </h2>
          <p className="text-xs sm:text-sm text-[#a9b3a8] font-sans">
            Verified transcriptions can be scanned for domain terminology to build navigable entity relationships.
          </p>
        </div>

        <HeritageGraphView />
      </section>

      {/* Provenance Governance */}
      <section className="max-w-6xl mx-auto space-y-8">
        <div className="space-y-2">
          <span className="text-xs font-mono uppercase tracking-widest text-[#ccd5ae] font-semibold">
            Data Provenance
          </span>
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-[#fefae0]">
            Verification & Access Classification
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {provenanceBadges.map((st) => (
            <div
              key={st.label}
              className="p-6 rounded-2xl bg-[#17211d] border border-[#35443a] space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <span
                  className="text-xs font-mono font-bold uppercase tracking-wider block"
                  style={{ color: st.color }}
                >
                  {st.label}
                </span>
                <span className="inline-block text-[10px] font-mono px-2 py-0.5 rounded bg-[#101614] border border-[#35443a] text-[#e9edc9]">
                  {st.badge}
                </span>
                <p className="text-xs text-[#a9b3a8] leading-relaxed pt-2 font-sans">
                  {st.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center pt-4">
          <Link
            to="/analyse"
            className="inline-flex items-center space-x-2 px-8 py-4 rounded-xl text-xs font-mono font-bold uppercase tracking-wider text-[#101614] bg-[#ccd5ae] hover:bg-[#e9edc9] shadow-lg transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>Test the Pipeline on a Manuscript</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
