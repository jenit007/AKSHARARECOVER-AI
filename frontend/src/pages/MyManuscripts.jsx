import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, FolderOpen, ArrowRight } from 'lucide-react';
import UserManuscriptLibrary from '../components/archive/UserManuscriptLibrary';

export default function MyManuscripts() {
  return (
    <div className="min-h-screen bg-[#101614] text-[#f1f2e9] pt-28 pb-20 px-4 sm:px-6 lg:px-8 space-y-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[#35443a] pb-6">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#17211d] border border-[#35443a] text-[11px] font-mono text-[#ccd5ae] uppercase tracking-wider">
              <FolderOpen className="w-3.5 h-3.5 text-[#d4a373]" />
              <span>Personal Archival Workspace</span>
            </div>
            <h1 className="font-heading text-3xl sm:text-5xl font-bold text-[#fefae0] tracking-tight">
              My Manuscripts
            </h1>
            <p className="text-sm sm:text-base text-[#a9b3a8] leading-relaxed">
              Your preserved manuscripts, processing history, and digital heritage records — all in one place.
            </p>
          </div>

          <Link
            to="/analyse"
            className="inline-flex items-center justify-center space-x-2 px-5 py-3 rounded-xl text-xs font-mono font-bold uppercase tracking-wider text-[#101614] bg-[#ccd5ae] hover:bg-[#e9edc9] shadow-lg transition-all shrink-0"
          >
            <Sparkles className="w-4 h-4" />
            <span>Restore a Manuscript</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </section>

        {/* Library List Container */}
        <UserManuscriptLibrary />
      </div>
    </div>
  );
}
