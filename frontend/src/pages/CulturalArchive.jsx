import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  BookOpen,
  Sparkles,
} from 'lucide-react';
import ArchiveCard from '../components/archive/ArchiveCard';
import PassportCard from '../components/heritage/PassportCard';
import { LoadingSpinner } from '../components/common/CommonUI';
import { listManuscripts } from '../services/manuscriptService';

export default function CulturalArchive() {
  const [manuscripts, setManuscripts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [activePassportRecord, setActivePassportRecord] = useState(null);

  const fetchArchive = async () => {
    try {
      setLoading(true);
      const res = await listManuscripts({
        page: 1,
        page_size: 50,
        search: searchQuery.trim() || undefined,
        source_language: selectedLanguage !== 'ALL' ? selectedLanguage : undefined,
        status: selectedStatus !== 'ALL' ? selectedStatus : undefined,
      });
      setManuscripts(res.items || []);
    } catch (err) {
      console.error('Failed to load archive:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArchive();
  }, [selectedLanguage, selectedStatus]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchArchive();
  };

  return (
    <div className="min-h-screen bg-[#101614] text-[#f1f2e9] py-16 px-4 sm:px-6 lg:px-8 space-y-12 selection:bg-[#ccd5ae]/30">
      {/* Header */}
      <section className="max-w-4xl mx-auto text-center space-y-4">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#1c2923] border border-[#35443a] text-xs font-mono text-[#ccd5ae]">
          <Sparkles className="w-3.5 h-3.5 text-[#ccd5ae]" />
          <span>LIVING HERITAGE ARCHIVE</span>
        </div>
        <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold text-[#fefae0] tracking-tight">
          Explore Preserved Manuscripts
        </h1>
        <p className="text-lg text-[#a9b3a8] max-w-2xl mx-auto font-sans leading-relaxed">
          Search and filter your preserved palm-leaf manuscripts, transcriptions, and digital heritage records.
        </p>
      </section>

      {/* Search & Multi-Filter Bar */}
      <section className="max-w-7xl mx-auto">
        <div className="p-6 rounded-2xl bg-[#17211d] border border-[#35443a] space-y-4 shadow-xl">
          <form
            onSubmit={handleSearchSubmit}
            className="flex flex-col md:flex-row gap-3"
          >
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-[#77857b] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by manuscript title, filename, script, or region..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-[#35443a] bg-[#101614] text-sm text-[#f1f2e9] placeholder-[#77857b] focus:border-[#ccd5ae] focus:outline-none shadow-inner"
              />
            </div>

            <button
              type="submit"
              className="inline-flex items-center justify-center space-x-2 px-6 py-3 rounded-xl text-xs font-semibold uppercase tracking-wider text-[#101614] bg-[#ccd5ae] hover:bg-[#e9edc9] shadow-md transition-all font-mono"
            >
              <Search className="w-4 h-4 text-[#101614]" />
              <span>Search Archive</span>
            </button>
          </form>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-[#35443a] text-xs">
            <div className="flex items-center space-x-1.5 text-[#77857b]">
              <Filter className="w-3.5 h-3.5 text-[#d4a373]" />
              <span className="font-mono uppercase font-semibold">Filters:</span>
            </div>

            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-[#35443a] bg-[#101614] text-xs text-[#f1f2e9] focus:outline-none focus:border-[#ccd5ae]"
            >
              <option value="ALL">All Languages</option>
              <option value="mal">Malayalam</option>
              <option value="san">Sanskrit</option>
              <option value="tam">Tamil</option>
              <option value="en">English</option>
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-[#35443a] bg-[#101614] text-xs text-[#f1f2e9] focus:outline-none focus:border-[#ccd5ae]"
            >
              <option value="ALL">All Preservation Statuses</option>
              <option value="processed">Processed &amp; Transcribed</option>
              <option value="verified">Scholarly Verified</option>
              <option value="uploaded">Uploaded</option>
            </select>

            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedLanguage('ALL');
                setSelectedStatus('ALL');
                fetchArchive();
              }}
              className="ml-auto text-xs text-[#d4a373] font-semibold hover:underline font-mono"
            >
              Reset Filters
            </button>
          </div>
        </div>
      </section>

      {/* Manuscripts Grid */}
      <section className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between text-xs text-[#77857b]">
          <span>
            Showing <strong className="text-[#f1f2e9]">{manuscripts.length}</strong>{' '}
            archived records
          </span>
          <span className="font-mono text-[#ccd5ae]">
            Linked with Digital Heritage QR Passports
          </span>
        </div>

        {loading ? (
          <div className="py-20">
            <LoadingSpinner text="Retrieving digital manuscript archive..." />
          </div>
        ) : manuscripts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {manuscripts.map((item) => (
              <ArchiveCard
                key={item.id}
                item={item}
                onOpenPassport={(rec) => setActivePassportRecord(rec)}
              />
            ))}
          </div>
        ) : (
          <div className="p-12 text-center max-w-md mx-auto space-y-3 rounded-2xl bg-[#17211d] border border-[#35443a]">
            <BookOpen className="w-10 h-10 text-[#d4a373] mx-auto" />
            <h3 className="font-heading text-xl font-bold text-[#f1f2e9]">
              No Manuscripts Found
            </h3>
            <p className="text-xs text-[#77857b]">
              No archived folios matched your query. Try broadening your search or resetting filters.
            </p>
          </div>
        )}
      </section>

      {activePassportRecord && (
        <div className="fixed inset-0 z-50 bg-[#101614]/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl animate-fade-in">
            <PassportCard
              record={activePassportRecord}
              onClose={() => setActivePassportRecord(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
