import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Sparkles,
  ExternalLink,
  Download,
  FolderOpen,
  AlertCircle,
  QrCode,
  Calendar,
  FileText,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { listManuscripts, exportManuscriptDossier } from '../../services/manuscriptService';
import { resolveImageUrl } from '../../services/fileService';
import { useToast } from '../../context/ToastContext';
import PassportCard from '../heritage/PassportCard';

const STATUS_TABS = [
  { id: 'all', label: 'All' },
  { id: 'completed', label: 'Completed' },
  { id: 'processing', label: 'Processing' },
  { id: 'failed', label: 'Failed' },
];

export default function UserManuscriptLibrary({ onSelectManuscript, activeId, compact = false }) {
  const [manuscripts, setManuscripts] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalAllForUser, setTotalAllForUser] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');
  const [passportRecord, setPassportRecord] = useState(null);
  const [exportingId, setExportingId] = useState(null);

  const toast = useToast();

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const fetchManuscripts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await listManuscripts({
        page,
        page_size: compact ? 8 : 10,
        status: filterStatus === 'all' ? undefined : filterStatus,
        search: debouncedSearch || undefined,
        sort: sortOrder,
      });

      const items = data?.items || [];
      setManuscripts(items);
      setTotal(data?.total ?? items.length);
      setTotalPages(data?.total_pages ?? 1);

      if (filterStatus === 'all' && !debouncedSearch) {
        setTotalAllForUser(data?.total ?? items.length);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Could not load manuscripts.');
    } finally {
      setLoading(false);
    }
  }, [page, compact, filterStatus, debouncedSearch, sortOrder]);

  useEffect(() => {
    fetchManuscripts();
  }, [fetchManuscripts]);

  const handleExport = async (item) => {
    try {
      setExportingId(item.id);
      const dossier = await exportManuscriptDossier(item.id);
      const blob = new Blob([JSON.stringify(dossier, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `akshara_heritage_dossier_${item.id.slice(0, 8)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Complete heritage dossier exported as JSON.', 'Export Ready');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to export dossier.');
    } finally {
      setExportingId(null);
    }
  };

  const statusBadgeStyle = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'completed' || s === 'processed' || s === 'verified') {
      return 'bg-[#ccd5ae]/15 border-[#ccd5ae]/40 text-[#ccd5ae]';
    }
    if (s === 'failed') {
      return 'bg-[#da7770]/15 border-[#da7770]/40 text-[#da7770]';
    }
    if (s === 'processing' || s === 'pending') {
      return 'bg-[#faedcd]/15 border-[#faedcd]/40 text-[#faedcd]';
    }
    return 'bg-[#e9edc9]/15 border-[#e9edc9]/40 text-[#e9edc9]';
  };

  // True zero-upload empty state
  const isTrueEmptyArchive =
    !loading &&
    !error &&
    manuscripts.length === 0 &&
    filterStatus === 'all' &&
    !debouncedSearch &&
    totalAllForUser === 0;

  return (
    <div className="space-y-6">
      {/* Control Bar: Search, Status Tabs, Sort */}
      <div className="p-4 rounded-2xl bg-[#17211d] border border-[#35443a] space-y-4 shadow-xl">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#77857b] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by title, manuscript ID, filename, or description..."
              aria-label="Search manuscripts"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#101614] border border-[#35443a] text-xs text-[#fefae0] placeholder-[#77857b] focus:outline-none focus:border-[#ccd5ae]"
            />
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center space-x-2 text-xs font-mono shrink-0">
            <span className="text-[#77857b]">Sort:</span>
            <select
              value={sortOrder}
              onChange={(e) => {
                setSortOrder(e.target.value);
                setPage(1);
              }}
              aria-label="Sort manuscripts"
              className="px-3 py-2 rounded-xl bg-[#101614] border border-[#35443a] text-xs text-[#fefae0] focus:outline-none focus:border-[#ccd5ae]"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#35443a]/70">
          <div className="flex flex-wrap items-center gap-1.5" role="tablist" aria-label="Status filter">
            {STATUS_TABS.map((tab) => {
              const active = filterStatus === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => {
                    setFilterStatus(tab.id);
                    setPage(1);
                  }}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-mono transition-all ${
                    active
                      ? 'bg-[#ccd5ae] text-[#101614] font-bold'
                      : 'bg-[#101614] text-[#a9b3a8] border border-[#35443a] hover:border-[#ccd5ae]/50 hover:text-[#fefae0]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="text-xs font-mono text-[#77857b]">
            Showing <span className="text-[#fefae0] font-semibold">{manuscripts.length}</span> of{' '}
            <span className="text-[#ccd5ae] font-semibold">{total}</span> records
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="p-12 text-center rounded-2xl bg-[#17211d] border border-[#35443a] space-y-3">
          <Sparkles className="w-6 h-6 text-[#ccd5ae] mx-auto animate-spin" />
          <p className="text-xs font-mono text-[#a9b3a8]">Loading your manuscript archive...</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-4 rounded-xl bg-[#da7770]/15 border border-[#da7770]/40 text-[#da7770] text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Empty State: Zero Uploads for User */}
      {isTrueEmptyArchive && (
        <div className="p-12 sm:p-16 text-center rounded-2xl bg-[#17211d] border border-[#35443a] space-y-5 shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-[#1c2923] border border-[#ccd5ae]/40 flex items-center justify-center mx-auto">
            <FolderOpen className="w-8 h-8 text-[#ccd5ae]" />
          </div>
          <div className="space-y-2 max-w-md mx-auto">
            <h2 className="font-heading text-2xl sm:text-3xl font-bold text-[#fefae0]">
              Your archive begins here.
            </h2>
            <p className="text-sm text-[#a9b3a8]">
              Upload your first manuscript and begin preserving its knowledge.
            </p>
          </div>
          <Link
            to="/analyse"
            className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl text-xs font-mono font-bold uppercase tracking-wider text-[#101614] bg-[#ccd5ae] hover:bg-[#e9edc9] shadow-lg transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>RESTORE A MANUSCRIPT</span>
          </Link>
        </div>
      )}

      {/* Filtered Empty State */}
      {!loading && !error && !isTrueEmptyArchive && manuscripts.length === 0 && (
        <div className="p-12 text-center rounded-2xl bg-[#17211d] border border-dashed border-[#35443a] space-y-3">
          <FolderOpen className="w-8 h-8 text-[#77857b] mx-auto" />
          <h3 className="font-heading text-lg font-bold text-[#fefae0]">
            No Matching Manuscripts Found
          </h3>
          <p className="text-xs text-[#a9b3a8] max-w-sm mx-auto">
            No archived manuscripts matched your search or status filter.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchInput('');
              setDebouncedSearch('');
              setFilterStatus('all');
              setPage(1);
            }}
            className="px-4 py-2 rounded-lg text-xs font-mono bg-[#1c2923] border border-[#35443a] text-[#ccd5ae] hover:border-[#ccd5ae]"
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Vertical List Cards (Clean Structured Layout) */}
      {!loading && !error && manuscripts.length > 0 && (
        <div className="space-y-4">
          {manuscripts.map((item) => {
            const isActive = activeId === item.id;
            const uploadDate = item.created_at
              ? new Date(item.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })
              : 'Unknown';

            const completedDate = item.completed_at
              ? new Date(item.completed_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })
              : null;

            const origThumb = item.preview_url || item.original_image_url;
            const enhThumb = item.enhanced_image_url;
            const processingStatus = item.processing_status || item.status || 'uploaded';

            return (
              <div
                key={item.id}
                className={`p-5 rounded-2xl border transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-6 shadow-xl ${
                  isActive
                    ? 'bg-[#1c2923] border-[#ccd5ae]'
                    : 'bg-[#17211d] border-[#35443a] hover:border-[#ccd5ae]/60'
                }`}
              >
                {/* Left: Original + Enhanced Previews & Metadata */}
                <div className="flex flex-col sm:flex-row items-start gap-5 min-w-0 flex-1">
                  {/* Thumbnails Stack */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div
                      className="w-24 h-24 rounded-xl bg-[#101614] border border-[#35443a] overflow-hidden flex flex-col items-center justify-center relative"
                      title="Original folio preview"
                    >
                      {origThumb ? (
                        <img
                          src={resolveImageUrl(origThumb)}
                          alt={`${item.title} original`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ImageIcon className="w-6 h-6 text-[#77857b]" />
                      )}
                      <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-[#101614]/85 text-[9px] font-mono text-[#e9edc9]">
                        Original
                      </span>
                    </div>

                    {!compact && (
                      <div
                        className="w-24 h-24 rounded-xl bg-[#101614] border border-[#35443a] overflow-hidden flex flex-col items-center justify-center relative"
                        title="Enhanced folio preview"
                      >
                        {enhThumb ? (
                          <img
                            src={resolveImageUrl(enhThumb)}
                            alt={`${item.title} enhanced`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-[10px] font-mono text-[#77857b] text-center px-2">
                            Not yet enhanced
                          </span>
                        )}
                        <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-[#101614]/85 text-[9px] font-mono text-[#ccd5ae]">
                          Enhanced
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Metadata */}
                  <div className="space-y-2 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider border ${statusBadgeStyle(
                          processingStatus,
                        )}`}
                      >
                        {processingStatus}
                      </span>

                      {item.verification_status && (
                        <span className="px-2.5 py-0.5 rounded-full bg-[#1c2923] border border-[#d4a373]/40 text-[10px] font-mono uppercase text-[#d4a373]">
                          {item.verification_status}
                        </span>
                      )}

                      {item.heritage_visibility && (
                        <span className="px-2 py-0.5 rounded-full bg-[#101614] border border-[#35443a] text-[10px] font-mono text-[#a9b3a8]">
                          QR: {item.heritage_visibility}
                        </span>
                      )}
                    </div>

                    <h3 className="font-heading text-lg sm:text-xl font-bold text-[#fefae0] truncate">
                      {item.title || item.original_filename || 'Untitled Manuscript'}
                    </h3>

                    {item.description && (
                      <p className="text-xs text-[#a9b3a8] line-clamp-2 max-w-2xl">
                        {item.description}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-mono text-[#a9b3a8]">
                      <span className="text-[#ccd5ae]" title={item.id}>
                        ID: {item.id.slice(0, 8)}...
                      </span>
                      <span className="flex items-center space-x-1">
                        <FileText className="w-3 h-3 text-[#77857b]" />
                        <span className="truncate max-w-[180px]">{item.original_filename}</span>
                      </span>
                      <span>
                        {item.source_language || 'Unknown'} / {item.source_script || 'Unknown'}
                      </span>
                      <span className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3 text-[#d4a373]" />
                        <span>Uploaded {uploadDate}</span>
                      </span>
                      {completedDate && (
                        <span className="text-[#ccd5ae]">Completed {completedDate}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 shrink-0 justify-end pt-3 lg:pt-0 border-t lg:border-t-0 border-[#35443a]">
                  {onSelectManuscript ? (
                    <button
                      type="button"
                      onClick={() => onSelectManuscript(item.id)}
                      className="px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider text-[#101614] bg-[#ccd5ae] hover:bg-[#e9edc9] flex items-center space-x-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Load Report</span>
                    </button>
                  ) : (
                    <Link
                      to={`/results/${item.id}`}
                      className="px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider text-[#101614] bg-[#ccd5ae] hover:bg-[#e9edc9] flex items-center space-x-1.5 shadow-sm transition-all"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>View Report</span>
                    </Link>
                  )}

                  {!compact && (
                    <>
                      <Link
                        to={`/heritage-record/${item.id}`}
                        className="px-3.5 py-2 rounded-xl text-xs font-mono text-[#e9edc9] bg-[#1c2923] hover:bg-[#25372f] border border-[#35443a] flex items-center space-x-1.5 transition-all"
                      >
                        <span>Heritage Record</span>
                        <ExternalLink className="w-3.5 h-3.5 text-[#d4a373]" />
                      </Link>

                      <button
                        type="button"
                        onClick={() => setPassportRecord(item)}
                        className="px-3 py-2 rounded-xl text-xs font-mono text-[#d4a373] bg-[#101614] hover:bg-[#1c2923] border border-[#35443a] flex items-center space-x-1.5 transition-all"
                        title="Open QR Passport"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>QR</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleExport(item)}
                        disabled={exportingId === item.id}
                        className="px-3 py-2 rounded-xl text-xs font-mono text-[#a9b3a8] hover:text-[#fefae0] bg-[#101614] hover:bg-[#1c2923] border border-[#35443a] flex items-center space-x-1.5 transition-all disabled:opacity-50"
                        title="Export full preservation report as JSON"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>{exportingId === item.id ? '...' : 'JSON'}</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-4 py-2 rounded-xl bg-[#17211d] border border-[#35443a] text-xs font-mono text-[#fefae0] disabled:opacity-40 flex items-center space-x-1"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          <span className="text-xs font-mono text-[#a9b3a8]">
            Page <strong className="text-[#fefae0]">{page}</strong> of {totalPages}
          </span>

          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="px-4 py-2 rounded-xl bg-[#17211d] border border-[#35443a] text-xs font-mono text-[#fefae0] disabled:opacity-40 flex items-center space-x-1"
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Quick QR Passport Modal */}
      {passportRecord && (
        <div className="fixed inset-0 z-50 bg-[#101614]/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl relative">
            <button
              type="button"
              onClick={() => setPassportRecord(null)}
              aria-label="Close modal"
              className="absolute top-3 right-3 z-20 p-1.5 rounded-lg bg-[#101614] border border-[#35443a] text-[#a9b3a8] hover:text-[#fefae0]"
            >
              <X className="w-4 h-4" />
            </button>
            <PassportCard record={passportRecord} onClose={() => setPassportRecord(null)} />
          </div>
        </div>
      )}
    </div>
  );
}
