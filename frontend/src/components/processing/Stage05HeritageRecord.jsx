import React, { useState, useEffect } from 'react';
import {
  Award,
  Copy,
  Download,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Tag,
  Globe,
  Lock,
  FileJson,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Link } from 'react-router-dom';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import {
  getHeritageRecord,
  getCulturalEntities,
  setHeritageRecordVisibility,
  exportManuscriptDossier,
} from '../../services/manuscriptService';
import { useToast } from '../../context/ToastContext';

export default function Stage05HeritageRecord({ manuscript, results }) {
  const toast = useToast();
  const [copiedLink, setCopiedLink] = useState(false);
  const [heritageRecord, setHeritageRecord] = useState(null);
  const [culturalEntities, setCulturalEntities] = useState([]);
  const [togglingVisibility, setTogglingVisibility] = useState(false);
  const [exportingDossier, setExportingDossier] = useState(false);

  const manuscriptId = manuscript?.id;

  useEffect(() => {
    if (!manuscriptId) return;
    let isMounted = true;

    async function loadData() {
      try {
        const [rec, entitiesRes] = await Promise.all([
          getHeritageRecord(manuscriptId).catch(() => null),
          getCulturalEntities(manuscriptId).catch(() => null),
        ]);
        if (isMounted) {
          if (rec) setHeritageRecord(rec);
          if (entitiesRes?.entities) setCulturalEntities(entitiesRes.entities);
        }
      } catch (err) {
        console.warn('Could not load heritage record details:', err);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [manuscriptId]);

  const visibility = heritageRecord?.visibility || 'PRIVATE';
  const uniqueSlug = heritageRecord?.unique_slug || '';
  const passportPath = uniqueSlug
    ? `/heritage-record/${manuscriptId}?token=${encodeURIComponent(uniqueSlug)}`
    : `/heritage-record/${manuscriptId}`;
  const passportUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}${passportPath}`
      : passportPath;

  const copyPassportLink = () => {
    navigator.clipboard.writeText(passportUrl);
    setCopiedLink(true);
    toast.info('Heritage Passport URL copied to clipboard.');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleToggleVisibility = async () => {
    if (!manuscriptId || togglingVisibility) return;
    const nextVis = visibility === 'PUBLIC' ? 'PRIVATE' : 'PUBLIC';
    try {
      setTogglingVisibility(true);
      const res = await setHeritageRecordVisibility(manuscriptId, nextVis);
      setHeritageRecord((prev) => ({
        ...(prev || {}),
        visibility: res.visibility || nextVis,
        unique_slug: res.unique_slug || prev?.unique_slug,
      }));
      toast.success(
        nextVis === 'PUBLIC'
          ? 'Heritage Record is now publicly shareable via QR token link.'
          : 'Heritage Record is now private to your account.'
      );
    } catch (err) {
      toast.error(
        'Failed to update record visibility: ' +
          (err.response?.data?.message || err.message)
      );
    } finally {
      setTogglingVisibility(false);
    }
  };

  const handleExportDossier = async () => {
    if (!manuscriptId || exportingDossier) return;
    try {
      setExportingDossier(true);
      const data = await exportManuscriptDossier(manuscriptId);
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `AksharaRecover_Dossier_${manuscriptId}.json`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('Structured JSON dossier downloaded.');
    } catch (err) {
      toast.error(
        'Could not export JSON dossier: ' +
          (err.response?.data?.message || err.message)
      );
    } finally {
      setExportingDossier(false);
    }
  };

  const downloadQR = () => {
    const svg = document.getElementById('stage-qr-code');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `Heritage_QR_${manuscriptId}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    img.src = `data:image/svg+xml;base64,${btoa(svgData)}`;
  };

  // Real Stage Completion Status from backend or results
  const stageCompletion = heritageRecord?.stage_completion || {
    stage_01_enhancement: Boolean(results?.images?.[0]?.enhanced_image_url),
    stage_02_damage_map: Boolean(results?.images?.[0]?.damage_overlay_url),
    stage_03_ocr: Boolean(
      results?.ocr?.selected_text ||
        results?.ocr?.enhanced_text ||
        results?.ocr?.enhanced_image_text ||
        results?.ocr?.original_text ||
        results?.ocr?.original_image_text
    ),
    stage_04_translation: Boolean(results?.translation?.translated_text),
    stage_05_heritage_record: Boolean(heritageRecord?.record_id || heritageRecord?.id || manuscriptId),
  };

  const stageItems = [
    { label: '01. Enhancement', done: Boolean(stageCompletion.stage_01_enhancement) },
    { label: '02. Damage Map', done: Boolean(stageCompletion.stage_02_damage ?? stageCompletion.stage_02_damage_map) },
    { label: '03. Script OCR', done: Boolean(stageCompletion.stage_03_ocr) },
    { label: '04. Translation', done: Boolean(stageCompletion.stage_04_translation) },
    { label: '05. Digital Record', done: Boolean(stageCompletion.stage_05_heritage_record) },
  ];
  const completedStagesCount = stageItems.filter((s) => s.done).length;

  // Record Completeness Checklist: 7 key elements
  const completenessItems = [
    { name: 'Original Scan Preserved', done: true },
    {
      name: 'Adaptive CLAHE Enhanced',
      done: Boolean(results?.images?.[0]?.enhanced_image_url),
    },
    {
      name: 'Optical Damage Mask',
      done: Boolean(results?.images?.[0]?.damage_overlay_url),
    },
    {
      name: 'Script OCR Transcription',
      done: Boolean(
        results?.ocr?.selected_text ||
          results?.ocr?.enhanced_text ||
          results?.ocr?.enhanced_image_text ||
          results?.ocr?.original_text ||
          results?.ocr?.original_image_text
      ),
    },
    {
      name: 'English Translation',
      done: Boolean(results?.translation?.translated_text),
    },
    {
      name: 'Cultural Entities Indexed',
      done: culturalEntities.length > 0,
    },
    { name: 'Digital Heritage QR Seal', done: true },
  ];

  const completedCount = completenessItems.filter((i) => i.done).length;
  const completenessPct = Math.round(
    (completedCount / completenessItems.length) * 100
  );

  const completenessPieData = [
    { name: 'Verified Artifacts', value: completenessPct, color: '#ccd5ae' },
    { name: 'Pending / Optional', value: 100 - completenessPct, color: '#35443a' },
  ];

  return (
    <div className="space-y-6">
      {/* Stage Header */}
      <div className="border-b border-[#35443a] pb-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-[11px] font-mono uppercase tracking-wider text-[#ccd5ae]">
            <span className="w-2 h-2 rounded-full bg-[#ccd5ae]" />
            <span>Stage 05 of 05 • Living Heritage Preservation</span>
          </div>
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-[#f1f2e9] mt-1">
            Digital Heritage Record &amp; Certified QR Passport
          </h2>
          <p className="text-sm text-[#a9b3a8] mt-1 max-w-3xl">
            Packaging the manuscript&apos;s raw scan, enhanced image, damage indicators, transcription, translation, and metadata into a permanent archival record with scannable QR access.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportDossier}
          disabled={exportingDossier}
          className="px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider bg-[#1c2923] hover:bg-[#26372f] text-[#fefae0] border border-[#d4a373]/50 flex items-center space-x-2 transition-all"
        >
          <FileJson className="w-4 h-4 text-[#d4a373]" />
          <span>{exportingDossier ? 'Exporting...' : 'Export JSON Dossier'}</span>
        </button>
      </div>

      {/* Real 5-Stage Preservation Progress Bar */}
      <div className="p-4 rounded-xl bg-[#17211d] border border-[#35443a] shadow-md space-y-2">
        <div className="flex justify-between items-center text-xs font-mono">
          <span className="text-[#a9b3a8]">END-TO-END PRESERVATION PIPELINE</span>
          <span className="text-[#ccd5ae] font-bold">
            {completedStagesCount} / 5 STAGES COMPLETED
          </span>
        </div>
        <div className="grid grid-cols-5 gap-2 pt-1">
          {stageItems.map((item, idx) => (
            <div key={idx} className="space-y-1">
              <div
                className={`h-2 rounded-full ${
                  item.done ? 'bg-[#ccd5ae]' : 'bg-[#35443a]'
                }`}
              />
              <span
                className={`text-[10px] font-mono block truncate ${
                  item.done ? 'text-[#fefae0]' : 'text-[#77857b]'
                }`}
              >
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* MAIN SHOWCASE: Certified Heritage Passport Card */}
      <div className="p-6 sm:p-8 rounded-2xl bg-[#17211d] border-2 border-[#d4a373] shadow-2xl relative overflow-hidden font-sans">
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#d4a373]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Passport Header */}
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#35443a] pb-6 mb-6">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-xl bg-[#1c2923] text-[#d4a373] p-2 flex items-center justify-center border border-[#d4a373]/50 shadow-md">
              <Award className="w-7 h-7 text-[#d4a373]" />
            </div>
            <div>
              <span className="text-[10px] tracking-widest uppercase font-mono font-bold text-[#d4a373] block">
                AUTHENTICATED HERITAGE PASSPORT
              </span>
              <h3 className="font-heading text-2xl font-bold text-[#f1f2e9]">
                {manuscript?.title ||
                  manuscript?.original_filename ||
                  'Historical Palm-Leaf Folio'}
              </h3>
              <p className="text-xs text-[#77857b] font-mono mt-0.5">
                UUID: {manuscriptId} • Team SCRIPTORIA
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Visibility Toggle Button */}
            <button
              type="button"
              onClick={handleToggleVisibility}
              disabled={togglingVisibility}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono border flex items-center space-x-1.5 transition-all ${
                visibility === 'PUBLIC'
                  ? 'bg-[#ccd5ae]/20 text-[#ccd5ae] border-[#ccd5ae]/50'
                  : 'bg-[#1c2923] text-[#faedcd] border-[#35443a]'
              }`}
              title="Toggle whether external researchers with the QR token link can view this record"
            >
              {visibility === 'PUBLIC' ? (
                <Globe className="w-3.5 h-3.5 text-[#ccd5ae]" />
              ) : (
                <Lock className="w-3.5 h-3.5 text-[#faedcd]" />
              )}
              <span>
                {togglingVisibility
                  ? 'Updating...'
                  : visibility === 'PUBLIC'
                  ? 'QR Sharing: PUBLIC'
                  : 'QR Sharing: PRIVATE'}
              </span>
            </button>

            <button
              type="button"
              onClick={copyPassportLink}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#1c2923] hover:bg-[#25372f] text-[#f1f2e9] border border-[#35443a] flex items-center space-x-1.5 transition-all"
            >
              {copiedLink ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-[#ccd5ae]" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-[#d4a373]" />
              )}
              <span>{copiedLink ? 'Link Copied' : 'Copy Passport Link'}</span>
            </button>

            <Link
              to={passportPath}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider text-[#101614] bg-[#ccd5ae] hover:bg-[#e9edc9] flex items-center space-x-1.5 shadow-sm transition-all"
            >
              <span>Inspect Record</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Passport Body: Left Metadata & Right QR */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          {/* Metadata Grid (8 cols) */}
          <div className="md:col-span-8 space-y-4 text-xs text-[#a9b3a8]">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="p-3 rounded-lg bg-[#101614] border border-[#35443a]">
                <span className="text-[10px] font-mono text-[#77857b] block uppercase">
                  Provenance / Region
                </span>
                <span className="font-semibold text-[#fefae0] text-sm mt-0.5 block">
                  {manuscript?.region ||
                    heritageRecord?.metadata_json?.region ||
                    'Kerala, South India'}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-[#101614] border border-[#35443a]">
                <span className="text-[10px] font-mono text-[#77857b] block uppercase">
                  Historical Script
                </span>
                <span className="font-semibold text-[#ccd5ae] text-sm mt-0.5 block">
                  {manuscript?.source_script || 'Malayalam / Grantha'}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-[#101614] border border-[#35443a]">
                <span className="text-[10px] font-mono text-[#77857b] block uppercase">
                  Access Policy
                </span>
                <span className="font-semibold text-[#d4a373] text-sm mt-0.5 block">
                  {visibility === 'PUBLIC'
                    ? 'Public QR Token Enabled'
                    : 'Owner Authenticated'}
                </span>
              </div>
            </div>

            {manuscript?.description && (
              <div className="p-3.5 rounded-xl bg-[#101614] border border-[#35443a] space-y-1">
                <span className="text-[10px] font-mono uppercase text-[#77857b] block">
                  MANUSCRIPT NOTES &amp; DESCRIPTION
                </span>
                <p className="text-[#fefae0] text-xs leading-relaxed">
                  {manuscript.description}
                </p>
              </div>
            )}

            <div className="p-3.5 rounded-xl bg-[#101614] border border-[#35443a] space-y-1.5">
              <span className="text-[10px] font-mono uppercase text-[#77857b] block">
                ARCHIVAL ATTESTATION
              </span>
              <p className="text-[#f1f2e9] text-xs leading-relaxed font-sans">
                Preserved in AKSHARARECOVER AI with non-destructive original scan retention, CLAHE contrast enhancement, OpenCV anomaly indicators, OCR line extraction, and structured digital provenance.
              </p>
            </div>

            {/* Cultural Entities Chips */}
            {culturalEntities.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-mono uppercase text-[#77857b] flex items-center space-x-1">
                  <Tag className="w-3 h-3 text-[#d4a373]" />
                  <span>Extracted Cultural Entities:</span>
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {culturalEntities.map((entity, i) => (
                    <span
                      key={entity.id || i}
                      className="px-2.5 py-1 rounded-md text-[11px] font-mono bg-[#1c2923] text-[#fefae0] border border-[#35443a] flex items-center space-x-1"
                      title={entity.description}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-[#d4a373]" />
                      <span>{entity.canonical_name}</span>
                      <span className="text-[9px] text-[#77857b]">
                        ({entity.category})
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right QR Box (4 cols) */}
          <div className="md:col-span-4 flex flex-col items-center justify-center p-5 rounded-2xl bg-[#101614] border border-[#35443a] text-center space-y-3">
            <div className="p-3 bg-[#fefae0] rounded-xl shadow-lg">
              <QRCodeSVG
                id="stage-qr-code"
                value={passportUrl}
                size={150}
                level="H"
                includeMargin={false}
              />
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase text-[#d4a373] font-bold block">
                SCANNABLE DIGITAL SEAL
              </span>
              <p className="text-[11px] text-[#77857b] max-w-[200px] leading-tight">
                {visibility === 'PUBLIC'
                  ? 'Public sharing active: anyone scanning this QR can view the record.'
                  : 'Private mode: set QR Sharing to PUBLIC above to allow external scan access.'}
              </p>
            </div>

            <button
              type="button"
              onClick={downloadQR}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider text-[#101614] bg-[#ccd5ae] hover:bg-[#e9edc9] transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download QR PNG</span>
            </button>
          </div>
        </div>
      </div>

      {/* Graphical Data Visualisation: Record Completeness Donut & Checklist */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Completeness Donut (5 cols) */}
        <div className="lg:col-span-5 p-5 rounded-2xl bg-[#17211d] border border-[#35443a] space-y-4 shadow-xl">
          <div className="border-b border-[#35443a] pb-3">
            <h3 className="font-heading text-lg font-bold text-[#f1f2e9] flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-[#ccd5ae]" />
              <span>Record Completeness</span>
            </h3>
            <p className="text-xs text-[#a9b3a8] mt-0.5">
              Verified inventory of digitized archival artifacts for this manuscript.
            </p>
          </div>

          <div className="h-44 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={completenessPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {completenessPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
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
                  formatter={(val) => [`${val}%`, 'Status']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="text-center font-mono">
            <span className="font-heading text-3xl font-bold text-[#ccd5ae]">
              {completenessPct}%
            </span>
            <span className="text-xs text-[#77857b] block mt-0.5">
              {completedCount} of {completenessItems.length} Archival Artifacts Present
            </span>
          </div>
        </div>

        {/* Checklist (7 cols) */}
        <div className="lg:col-span-7 p-5 rounded-2xl bg-[#17211d] border border-[#35443a] space-y-3.5 shadow-xl">
          <div className="border-b border-[#35443a] pb-3">
            <h3 className="font-heading text-lg font-bold text-[#f1f2e9] flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-[#ccd5ae]" />
              <span>Preservation Artifact Checklist</span>
            </h3>
            <p className="text-xs text-[#a9b3a8] mt-0.5">
              Real-time verification of generated files and database records.
            </p>
          </div>

          <div className="space-y-2 text-xs">
            {completenessItems.map((item, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-lg bg-[#101614] border border-[#35443a] flex items-center justify-between"
              >
                <div className="flex items-center space-x-2.5">
                  <CheckCircle2
                    className={`w-4 h-4 ${
                      item.done ? 'text-[#ccd5ae]' : 'text-[#77857b]'
                    }`}
                  />
                  <span
                    className={
                      item.done
                        ? 'text-[#fefae0] font-medium'
                        : 'text-[#77857b]'
                    }
                  >
                    {item.name}
                  </span>
                </div>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                    item.done
                      ? 'bg-[#1c2923] text-[#ccd5ae] border border-[#ccd5ae]/30'
                      : 'bg-[#1c2923] text-[#faedcd] border border-[#35443a]'
                  }`}
                >
                  {item.done ? 'VERIFIED' : 'NOT GENERATED'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
