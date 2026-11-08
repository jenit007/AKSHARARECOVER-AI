import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Calendar,
  BookOpen,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ShieldCheck,
  Sparkles,
  FolderOpen,
  LogOut,
  ArrowRight,
  Image as ImageIcon,
} from 'lucide-react';
import { getUserProfile } from '../services/authService';
import { resolveImageUrl } from '../services/fileService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { LoadingSpinner } from '../components/common/CommonUI';

export default function Profile() {
  const { user, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    async function loadProfile() {
      try {
        setLoading(true);
        const data = await getUserProfile();
        if (mounted) {
          setProfile(data);
        }
      } catch (err) {
        if (mounted) {
          setError(err.response?.data?.message || 'Unable to load profile data.');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadProfile();
    return () => {
      mounted = false;
    };
  }, []);

  const handleLogout = async () => {
    await logout();
    toast.info('Signed out successfully.', 'Session Ended');
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#101614] pt-28 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading archival profile & statistics..." />
      </div>
    );
  }

  const profileUser = profile?.user || user;
  const stats = profile?.stats || {
    total_uploaded: 0,
    completed_count: 0,
    processing_count: 0,
    failed_count: 0,
    verified_count: 0,
  };
  const recent = profile?.recent_manuscripts || [];

  const memberSince = profileUser?.created_at
    ? new Date(profileUser.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Not available';

  return (
    <div className="min-h-screen bg-[#101614] text-[#f1f2e9] pt-28 pb-20 px-4 sm:px-6 lg:px-8 space-y-10">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header Card */}
        <section className="p-6 sm:p-8 rounded-2xl bg-[#17211d] border border-[#35443a] shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[#1c2923] border border-[#ccd5ae]/40 flex items-center justify-center shrink-0">
              <User className="w-8 h-8 text-[#ccd5ae]" />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#d4a373]">
                Archivist Account
              </span>
              <h1 className="font-heading text-2xl sm:text-3xl font-bold text-[#fefae0]">
                {profileUser?.full_name || 'Researcher'}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-xs text-[#a9b3a8] font-mono">
                <span className="flex items-center space-x-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#ccd5ae]" />
                  <span>{profileUser?.email}</span>
                </span>
                <span className="flex items-center space-x-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#d4a373]" />
                  <span>Member since {memberSince}</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
            <Link
              to="/my-manuscripts"
              className="px-4 py-2.5 rounded-xl bg-[#1c2923] hover:bg-[#25372f] border border-[#35443a] text-xs font-mono text-[#e9edc9] flex items-center space-x-2"
            >
              <FolderOpen className="w-4 h-4 text-[#d4a373]" />
              <span>My Manuscripts</span>
            </Link>
            <Link
              to="/analyse"
              className="px-4 py-2.5 rounded-xl bg-[#ccd5ae] hover:bg-[#e9edc9] text-[#101614] text-xs font-mono font-bold uppercase tracking-wider flex items-center space-x-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Restore a Manuscript</span>
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="px-4 py-2.5 rounded-xl bg-[#101614] hover:bg-[#1c2923] border border-[#35443a] text-xs font-mono text-[#faedcd] flex items-center space-x-2"
            >
              <LogOut className="w-4 h-4 text-[#d4a373]" />
              <span>Sign Out</span>
            </button>
          </div>
        </section>

        {error && (
          <div className="p-4 rounded-xl bg-[#da7770]/15 border border-[#da7770]/50 text-[#da7770] text-xs">
            {error}
          </div>
        )}

        {/* Real Database Statistics Cards */}
        <section className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <div className="p-5 rounded-2xl bg-[#17211d] border border-[#35443a] space-y-1">
            <div className="flex items-center justify-between text-[#a9b3a8]">
              <span className="text-[10px] font-mono uppercase">Total Uploaded</span>
              <BookOpen className="w-4 h-4 text-[#ccd5ae]" />
            </div>
            <div className="font-heading text-3xl font-bold text-[#fefae0]">
              {stats.total_uploaded}
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#17211d] border border-[#35443a] space-y-1">
            <div className="flex items-center justify-between text-[#a9b3a8]">
              <span className="text-[10px] font-mono uppercase">Completed</span>
              <CheckCircle2 className="w-4 h-4 text-[#ccd5ae]" />
            </div>
            <div className="font-heading text-3xl font-bold text-[#ccd5ae]">
              {stats.completed_count}
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#17211d] border border-[#35443a] space-y-1">
            <div className="flex items-center justify-between text-[#a9b3a8]">
              <span className="text-[10px] font-mono uppercase">In Progress</span>
              <Clock className="w-4 h-4 text-[#faedcd]" />
            </div>
            <div className="font-heading text-3xl font-bold text-[#faedcd]">
              {stats.processing_count}
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#17211d] border border-[#35443a] space-y-1">
            <div className="flex items-center justify-between text-[#a9b3a8]">
              <span className="text-[10px] font-mono uppercase">Failed</span>
              <AlertTriangle className="w-4 h-4 text-[#da7770]" />
            </div>
            <div className="font-heading text-3xl font-bold text-[#da7770]">
              {stats.failed_count}
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#17211d] border border-[#35443a] space-y-1 col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between text-[#a9b3a8]">
              <span className="text-[10px] font-mono uppercase">Verified</span>
              <ShieldCheck className="w-4 h-4 text-[#d4a373]" />
            </div>
            <div className="font-heading text-3xl font-bold text-[#d4a373]">
              {stats.verified_count}
            </div>
          </div>
        </section>

        {/* Recent Manuscripts */}
        <section className="p-6 sm:p-8 rounded-2xl bg-[#17211d] border border-[#35443a] space-y-5 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#35443a] pb-4">
            <div>
              <h2 className="font-heading text-xl font-bold text-[#fefae0]">
                Recent Preserved Folios
              </h2>
              <p className="text-xs text-[#a9b3a8]">
                Most recent manuscripts associated with your account
              </p>
            </div>
            <Link
              to="/my-manuscripts"
              className="text-xs font-mono text-[#ccd5ae] hover:text-[#fefae0] flex items-center space-x-1"
            >
              <span>Open Full Library</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recent.length > 0 ? (
            <div className="space-y-3">
              {recent.map((m) => (
                <div
                  key={m.id}
                  className="p-4 rounded-xl bg-[#101614] border border-[#35443a] flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-[#ccd5ae]/50 transition-colors"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-14 h-14 rounded-lg bg-[#17211d] border border-[#35443a] flex items-center justify-center overflow-hidden shrink-0">
                      {m.preview_url ? (
                        <img
                          src={resolveImageUrl(m.preview_url)}
                          alt={m.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ImageIcon className="w-5 h-5 text-[#77857b]" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-heading text-sm font-bold text-[#fefae0] truncate">
                        {m.title}
                      </h3>
                      <p className="text-[11px] font-mono text-[#77857b] truncate">
                        {m.id} • {m.source_script || 'Unknown script'} •{' '}
                        {m.created_at ? new Date(m.created_at).toLocaleDateString() : 'Unknown date'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 justify-end">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-mono uppercase bg-[#1c2923] border border-[#35443a] text-[#ccd5ae]">
                      {m.processing_status}
                    </span>
                    <Link
                      to={`/results/${m.id}`}
                      className="px-3.5 py-1.5 rounded-lg bg-[#ccd5ae] hover:bg-[#e9edc9] text-[#101614] text-xs font-mono font-bold uppercase"
                    >
                      Open Report
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center space-y-3 border border-dashed border-[#35443a] rounded-xl">
              <p className="text-sm font-heading font-semibold text-[#fefae0]">
                No manuscripts uploaded under this account yet.
              </p>
              <Link
                to="/analyse"
                className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-[#ccd5ae] text-[#101614] text-xs font-mono font-bold uppercase"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Restore a Manuscript</span>
              </Link>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
