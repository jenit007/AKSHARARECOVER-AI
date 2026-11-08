import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
  Sparkles,
  FileText,
  Search,
  Eye,
  Languages,
  Network,
  ShieldCheck,
  QrCode,
} from 'lucide-react';
import { Badge } from '../common/CommonUI';

export const PIPELINE_STAGES = [
  {
    id: 'image_validation',
    num: '01',
    name: 'Upload Validation',
    desc: 'Format verification, PDF page extraction, and resolution checks.',
    algorithm: 'PyMuPDF + Pillow Image Validator',
    icon: FileText,
  },
  {
    id: 'condition_analysis',
    num: '02',
    name: 'Initial Condition Analysis',
    desc: 'Mean brightness, contrast standard deviation, and Laplacian variance.',
    algorithm: 'OpenCV Signal Diagnostics',
    icon: Eye,
  },
  {
    id: 'image_enhancement',
    num: '03',
    name: 'Adaptive Image Enhancement',
    desc: 'Sequential fastNlMeans denoising, CLAHE contrast, and unsharp masking.',
    algorithm: 'Deterministic OpenCV Enhancement Pipeline',
    icon: Sparkles,
  },
  {
    id: 'damage_analysis',
    num: '04',
    name: 'Damage Identification',
    desc: 'Threshold-based dark/faded region segmentation and HoughP crack lines.',
    algorithm: 'OpenCV Heuristic Segmentation',
    icon: AlertTriangle,
  },
  {
    id: 'ocr_original',
    num: '05',
    name: 'Original-Image OCR',
    desc: 'Baseline text extraction on the raw unprocessed scan.',
    algorithm: 'EasyOCR / Tesseract Adapter',
    icon: Search,
  },
  {
    id: 'ocr_enhanced',
    num: '06',
    name: 'Enhanced-Image OCR',
    desc: 'Script recognition executed on the CLAHE-enhanced folio.',
    algorithm: 'Script Recognition Engine',
    icon: Search,
  },
  {
    id: 'ocr_comparison',
    num: '07',
    name: 'OCR Confidence Evaluation',
    desc: 'Per-line confidence aggregation and low-confidence segment flagging.',
    algorithm: 'Confidence Thresholding (< 0.70)',
    icon: CheckCircle2,
  },
  {
    id: 'transcription_review',
    num: '08',
    name: 'Human Epigraphist Review',
    desc: 'Interactive scholar correction workspace for uncertain ligatures.',
    algorithm: 'Human-in-the-Loop Transcription Audit',
    icon: FileText,
  },
  {
    id: 'translation',
    num: '09',
    name: 'English Translation',
    desc: 'Configurable translation stage or manual scholarly translation entry.',
    algorithm: 'Configured Translation Engine / Manual Entry',
    icon: Languages,
  },
  {
    id: 'cultural_extraction',
    num: '10',
    name: 'Cultural Entity Extraction',
    desc: 'Indexing cultural keywords, places, medicinal plants, and art forms.',
    algorithm: 'Heritage Entity Pattern Extractor',
    icon: Network,
  },
  {
    id: 'knowledge_graph',
    num: '11',
    name: 'Heritage Knowledge Graph',
    desc: 'Linking manuscript entities across Kerala cultural collections.',
    algorithm: 'Relational Entity Graph Builder',
    icon: Network,
  },
  {
    id: 'verification',
    num: '12',
    name: 'Scholarly Verification',
    desc: 'Researcher review metadata and publication state tracking.',
    algorithm: 'Archival Review Record',
    icon: ShieldCheck,
  },
  {
    id: 'heritage_record',
    num: '13',
    name: 'Digital Heritage Record & QR',
    desc: 'Generating permanent manuscript record and scannable QR passport.',
    algorithm: 'UUID Heritage Passport + QR Generator',
    icon: QrCode,
  },
];

export default function ProcessingTimeline({
  currentStage,
  progress = 0,
  jobStatus = 'pending',
  startedAt,
  onSelectStage,
  selectedStageId,
  className = '',
}) {
  const getStageStatus = (stage, index) => {
    if (jobStatus === 'failed') {
      if (stage.id === currentStage) return 'FAILED';
    }
    if (jobStatus === 'completed') return 'COMPLETED';

    const stageThresholds = [10, 20, 35, 50, 65, 80, 88, 92, 94, 96, 98, 99, 100];
    const threshold = stageThresholds[index];

    if (progress >= threshold) {
      return 'COMPLETED';
    } else if (
      stage.id === currentStage ||
      (progress >= (stageThresholds[index - 1] || 0) && progress < threshold)
    ) {
      return 'IN_PROGRESS';
    }
    return 'WAITING';
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <Badge variant="success" size="xs">
            Completed
          </Badge>
        );
      case 'IN_PROGRESS':
        return (
          <Badge variant="warning" size="xs" className="flex items-center space-x-1">
            <Loader2 className="w-2.5 h-2.5 animate-spin" />
            <span>Processing</span>
          </Badge>
        );
      case 'FAILED':
        return (
          <Badge variant="danger" size="xs">
            Failed
          </Badge>
        );
      default:
        return (
          <Badge variant="neutral" size="xs">
            Queued
          </Badge>
        );
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Overall Progress Indicator */}
      <div className="bg-[#17211d] p-4 rounded-xl border border-[#35443a] shadow-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#a9b3a8] font-mono">
            Pipeline Progress
          </span>
          <span className="text-xs font-bold text-[#ccd5ae] font-mono">
            {progress}% Completed
          </span>
        </div>
        <div className="w-full bg-[#101614] h-2 rounded-full overflow-hidden border border-[#35443a]">
          <div
            className="h-full transition-all duration-500 rounded-full"
            style={{ width: `${progress}%`, background: 'var(--heritage-gradient)' }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px] text-[#77857b] font-mono">
          <span>
            Status: <strong className="uppercase text-[#f1f2e9]">{jobStatus}</strong>
          </span>
          {startedAt && (
            <span>Started: {new Date(startedAt).toLocaleTimeString()}</span>
          )}
        </div>
      </div>

      {/* Vertical Stages List */}
      <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
        {PIPELINE_STAGES.map((stage, idx) => {
          const status = getStageStatus(stage, idx);
          const isSelected = selectedStageId === stage.id;

          return (
            <button
              key={stage.id}
              type="button"
              onClick={() => onSelectStage && onSelectStage(stage.id)}
              className={`w-full text-left p-3 rounded-lg border transition-all flex items-start space-x-3 ${
                isSelected
                  ? 'bg-[#1c2923] border-[#ccd5ae] shadow-md'
                  : 'bg-[#17211d]/80 border-[#35443a] hover:bg-[#1c2923] hover:border-[#ccd5ae]/60'
              }`}
            >
              {/* Stage Number / Status Icon */}
              <div className="shrink-0 mt-0.5">
                {status === 'COMPLETED' ? (
                  <div className="w-6 h-6 rounded-full bg-[#ccd5ae]/20 text-[#ccd5ae] flex items-center justify-center border border-[#ccd5ae]/40">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                ) : status === 'IN_PROGRESS' ? (
                  <div className="w-6 h-6 rounded-full bg-[#d4a373]/20 text-[#d4a373] flex items-center justify-center animate-spin border border-[#d4a373]/40">
                    <Loader2 className="w-4 h-4" />
                  </div>
                ) : status === 'FAILED' ? (
                  <div className="w-6 h-6 rounded-full bg-[#faedcd]/20 text-[#faedcd] flex items-center justify-center border border-[#faedcd]/40">
                    <XCircle className="w-4 h-4" />
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-full bg-[#101614] text-[#77857b] text-[10px] font-mono font-bold flex items-center justify-center border border-[#35443a]">
                    {stage.num}
                  </div>
                )}
              </div>

              {/* Stage Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-[#f1f2e9] truncate font-heading">
                    {stage.name}
                  </h4>
                  {getStatusBadge(status)}
                </div>
                <p className="text-[11px] text-[#a9b3a8] line-clamp-1 mt-0.5">
                  {stage.desc}
                </p>
                <div className="mt-1 text-[10px] text-[#d4a373] font-mono truncate">
                  {stage.algorithm}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
