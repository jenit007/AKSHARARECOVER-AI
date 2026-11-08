import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Award, ShieldCheck, Copy, Download } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export default function PassportCard({ record, onClose }) {
  const toast = useToast();

  const passportPath = record.unique_slug
    ? `/heritage-record/${record.id}?token=${encodeURIComponent(record.unique_slug)}`
    : `/heritage-record/${record.id}`;
  const passportUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}${passportPath}`
      : passportPath;

  const copyLink = () => {
    navigator.clipboard.writeText(passportUrl);
    toast.info('Heritage Record passport link copied to clipboard.');
  };

  const downloadQR = () => {
    const svg = document.getElementById('heritage-qr-svg');
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
      downloadLink.download = `Heritage_QR_${record.id}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    img.src = `data:image/svg+xml;base64,${btoa(svgData)}`;
  };

  return (
    <div className="bg-[#17211d] rounded-2xl border-2 border-[#d4a373] shadow-2xl p-6 sm:p-8 max-w-2xl mx-auto relative overflow-hidden font-sans text-[#f1f2e9]">
      {/* Decorative Ornate Borders */}
      <div className="absolute top-2 left-2 right-2 bottom-2 border border-[#35443a] rounded-xl pointer-events-none" />
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#d4a373]/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header Seal */}
      <div className="flex items-start justify-between border-b border-[#35443a] pb-4 mb-6 relative z-10">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-xl bg-[#1c2923] text-[#d4a373] p-2 flex items-center justify-center border border-[#d4a373]/40 shadow-md">
            <Award className="w-7 h-7 text-[#d4a373]" />
          </div>
          <div>
            <span className="text-[10px] tracking-widest uppercase font-mono font-bold text-[#d4a373]">
              DIGITAL HERITAGE PASSPORT
            </span>
            <h2 className="font-heading text-2xl font-bold text-[#f1f2e9] leading-tight">
              AKSHARARECOVER AI
            </h2>
            <p className="text-xs text-[#77857b] font-mono">Team SCRIPTORIA</p>
          </div>
        </div>

        <span className="px-2.5 py-1 rounded-full bg-[#1c2923] border border-[#d4a373]/40 text-xs font-mono uppercase tracking-wider text-[#d4a373]">
          ARCHIVAL RECORD
        </span>
      </div>

      {/* Passport Body */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
        {/* Left: Metadata */}
        <div className="md:col-span-2 space-y-3.5 text-xs text-[#a9b3a8]">
          <div>
            <span className="text-[10px] uppercase font-mono text-[#77857b] block">
              Heritage Title
            </span>
            <h3 className="font-heading text-lg font-bold text-[#f1f2e9]">
              {record.title || record.original_filename || 'Historical Folio Record'}
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <span className="text-[10px] uppercase font-mono text-[#77857b] block">
                Record UUID
              </span>
              <span className="font-mono text-[11px] text-[#ccd5ae] break-all">
                {record.id}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono text-[#77857b] block">
                Cultural Region
              </span>
              <span className="font-semibold text-[#f1f2e9]">
                {record.region || 'Kerala, South India'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-[10px] uppercase font-mono text-[#77857b] block">
                Script / Language
              </span>
              <span className="font-semibold text-[#f1f2e9]">
                {record.source_language || 'Malayalam / Grantha'}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono text-[#77857b] block">
                Record Status
              </span>
              <span className="px-2 py-0.5 rounded bg-[#ccd5ae]/20 border border-[#ccd5ae]/40 text-[#ccd5ae] text-[10px] font-mono font-bold">
                {record.verification_status || 'PRESERVED'}
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-[#35443a]">
            <span className="text-[10px] uppercase font-mono text-[#77857b] block">
              Attribution &amp; Provenance
            </span>
            <p className="text-[11px] text-[#77857b] mt-0.5 leading-relaxed">
              Digitized and preserved under Team SCRIPTORIA&apos;s non-destructive palm-leaf conservation ledger.
            </p>
          </div>
        </div>

        {/* Right: QR Code & Actions */}
        <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-[#101614] border border-[#35443a] text-center space-y-3">
          <div className="p-2 bg-[#fefae0] rounded-lg border border-[#35443a] shadow-md">
            <QRCodeSVG
              id="heritage-qr-svg"
              value={passportUrl}
              size={130}
              level="H"
              fgColor="#101614"
              bgColor="#fefae0"
            />
          </div>
          <span className="text-[10px] font-mono text-[#77857b] uppercase tracking-wider block">
            Scan to inspect digital passport
          </span>

          <div className="flex items-center space-x-1.5 w-full pt-1">
            <button
              type="button"
              onClick={downloadQR}
              className="flex-1 py-1.5 px-2 rounded-md bg-[#1c2923] text-[#a9b3a8] hover:text-[#f1f2e9] hover:bg-[#25372f] border border-[#35443a] text-[11px] font-semibold flex items-center justify-center space-x-1 transition-all"
            >
              <Download className="w-3 h-3" />
              <span>QR PNG</span>
            </button>
            <button
              type="button"
              onClick={copyLink}
              className="flex-1 py-1.5 px-2 rounded-md bg-[#ccd5ae] text-[#101614] hover:bg-[#e9edc9] text-[11px] font-semibold flex items-center justify-center space-x-1 transition-all font-mono"
            >
              <Copy className="w-3 h-3" />
              <span>Copy</span>
            </button>
          </div>
        </div>
      </div>

      {/* Footer Audit Stamp */}
      <div className="mt-6 pt-4 border-t border-[#35443a] flex items-center justify-between text-[11px] text-[#77857b] relative z-10 font-mono">
        <span className="flex items-center space-x-1">
          <ShieldCheck className="w-4 h-4 text-[#ccd5ae]" />
          <span>Structured archival provenance preserved</span>
        </span>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-semibold text-[#d4a373] hover:underline"
          >
            Close Passport
          </button>
        )}
      </div>
    </div>
  );
}
