import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Globe, QrCode, ArrowRight, BookOpen, Image as ImageIcon } from 'lucide-react';
import { Badge } from '../common/CommonUI';
import { resolveImageUrl } from '../../services/fileService';

export default function ArchiveCard({ item, onOpenPassport }) {
  const thumbnail = item.preview_url || item.original_image_url;

  const verificationVariant =
    {
      verified: 'success',
      needs_review: 'warning',
      rejected: 'danger',
      pending: 'neutral',
    }[item.verification_status?.toLowerCase()] || 'neutral';

  return (
    <div className="flex flex-col justify-between h-full p-5 space-y-4 rounded-2xl bg-[#17211d] border border-[#35443a] shadow-xl hover:border-[#ccd5ae]/60 transition-all">
      {/* Thumbnail & Badges */}
      <div className="relative rounded-lg overflow-hidden border border-[#35443a] bg-[#101614] h-48 flex items-center justify-center group">
        {thumbnail ? (
          <img
            src={resolveImageUrl(thumbnail)}
            alt={item.title || item.original_filename}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <ImageIcon className="w-10 h-10 text-[#77857b]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#101614] via-transparent to-transparent pointer-events-none" />

        <div className="absolute top-2.5 left-2.5 flex items-center space-x-1.5">
          <Badge variant="neutral" size="xs">
            {item.source_language || 'Unspecified'}
          </Badge>
        </div>

        <div className="absolute top-2.5 right-2.5">
          <Badge variant={verificationVariant} size="xs">
            {item.verification_status || item.status || 'Archived'}
          </Badge>
        </div>

        <div className="absolute bottom-2 left-2.5 right-2.5 text-xs text-[#ccd5ae] truncate font-mono">
          {item.original_filename}
        </div>
      </div>

      {/* Content */}
      <div className="space-y-2 flex-1">
        <h3 className="font-heading text-lg font-bold text-[#fefae0] line-clamp-2 leading-snug">
          {item.title || item.original_filename?.replace(/\.[^/.]+$/, '') || 'Untitled Manuscript Folio'}
        </h3>

        <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-[#77857b]">
          <span className="flex items-center space-x-1">
            <Globe className="w-3.5 h-3.5 text-[#d4a373]" />
            <span>{item.source_script || 'Unspecified script'}</span>
          </span>
          <span className="flex items-center space-x-1">
            <BookOpen className="w-3.5 h-3.5 text-[#ccd5ae]" />
            <span>
              {item.page_count || 1} Folio{(item.page_count || 1) > 1 ? 's' : ''}
            </span>
          </span>
          {item.region && (
            <span className="flex items-center space-x-1">
              <MapPin className="w-3.5 h-3.5 text-[#d4a373]" />
              <span>{item.region}</span>
            </span>
          )}
        </div>

        {item.description && (
          <p className="text-xs text-[#a9b3a8] line-clamp-2 leading-relaxed pt-1">
            {item.description}
          </p>
        )}
      </div>

      {/* Footer Actions */}
      <div className="pt-3 border-t border-[#35443a] flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onOpenPassport && onOpenPassport(item)}
          className="inline-flex items-center space-x-1 text-xs font-semibold text-[#d4a373] hover:text-[#fefae0] py-1 transition-colors"
        >
          <QrCode className="w-3.5 h-3.5 text-[#d4a373]" />
          <span>Passport & QR</span>
        </button>

        <Link
          to={`/results/${item.id}`}
          className="inline-flex items-center space-x-1 text-xs font-semibold text-[#101614] bg-[#ccd5ae] hover:bg-[#e9edc9] px-3 py-1.5 rounded-md transition-colors shadow-sm font-mono"
        >
          <span>Report</span>
          <ArrowRight className="w-3 h-3 text-[#101614]" />
        </Link>
      </div>
    </div>
  );
}
