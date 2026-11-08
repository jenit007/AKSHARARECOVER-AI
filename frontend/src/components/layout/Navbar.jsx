import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Menu,
  X,
  ArrowRight,
  LogIn,
  UserPlus,
  FolderOpen,
  User,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const toast = useToast();
  const menuRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // EXACTLY FOUR MAIN INFORMATIONAL PAGES
  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'About Us', path: '/about' },
    { name: 'AI Model', path: '/ai-model' },
    { name: 'Importance', path: '/importance' },
  ];

  const isActive = (path) => {
    if (path === '/' && location.pathname !== '/') return false;
    return location.pathname === path;
  };

  const handleLogout = async () => {
    setUserMenuOpen(false);
    setMobileMenuOpen(false);
    await logout();
    toast.info('Your archive session has been closed cleanly.', 'Signed Out');
    navigate('/');
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[#101614]/95 backdrop-blur-md border-b border-[#35443a] shadow-lg'
          : 'bg-[#101614]/75 backdrop-blur-sm border-b border-[#35443a]/40'
      }`}
    >
      {/* Subtle 5-colour Heritage Botanical accent hairline */}
      <div className="h-[2px] w-full heritage-gradient-bar opacity-80" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between gap-3">
          {/* Brand Logo / Wordmark */}
          <Link to="/" className="flex items-center space-x-3 group shrink-0">
            <div className="w-10 h-10 rounded-lg bg-[#17211d] border border-[#35443a] group-hover:border-[#ccd5ae] transition-all flex items-center justify-center p-2 relative overflow-hidden shadow-inner">
              <div className="w-2.5 h-2.5 rounded-full bg-[#ccd5ae] group-hover:scale-125 transition-transform" />
              <div className="w-1.5 h-1.5 rounded-full bg-[#d4a373] absolute bottom-1.5 right-1.5" />
            </div>
            <div className="flex flex-col">
              <span className="font-heading text-base sm:text-lg font-bold tracking-tight text-[#fefae0] group-hover:text-[#ccd5ae] transition-colors">
                AKSHARARECOVER<span className="text-[#d4a373] font-mono text-xs ml-1 font-semibold">AI</span>
              </span>
              <span className="text-[10px] font-mono tracking-widest text-[#a9b3a8] uppercase">
                The Living Archive
              </span>
            </div>
          </Link>

          {/* Desktop Navigation — Strictly 4 Informational Pages */}
          <nav
            aria-label="Primary navigation"
            className="hidden lg:flex items-center space-x-1 bg-[#17211d]/90 backdrop-blur-sm px-2.5 py-1.5 rounded-full border border-[#35443a]"
          >
            {navLinks.map((link) => {
              const active = isActive(link.path);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-3.5 py-1.5 text-xs font-mono tracking-wider uppercase transition-all rounded-full whitespace-nowrap ${
                    active
                      ? 'text-[#101614] bg-[#ccd5ae] font-bold shadow-sm'
                      : 'text-[#a9b3a8] hover:text-[#fefae0] hover:bg-[#1c2923]'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Right Functional Controls */}
          <div className="hidden md:flex items-center space-x-2.5 shrink-0">
            {isAuthenticated ? (
              <>
                <Link
                  to="/my-manuscripts"
                  className={`inline-flex items-center space-x-1.5 px-3 py-2 text-xs font-mono font-medium rounded-lg border transition-all whitespace-nowrap ${
                    location.pathname.startsWith('/my-manuscripts') || location.pathname.startsWith('/library')
                      ? 'bg-[#1c2923] border-[#ccd5ae] text-[#ccd5ae]'
                      : 'bg-[#17211d] border-[#35443a] text-[#e9edc9] hover:border-[#ccd5ae]/60 hover:text-[#fefae0]'
                  }`}
                >
                  <FolderOpen className="w-3.5 h-3.5 text-[#d4a373]" />
                  <span>My Manuscripts</span>
                </Link>

                {/* User Menu Dropdown */}
                <div className="relative" ref={menuRef}>
                  <button
                    type="button"
                    onClick={() => setUserMenuOpen((prev) => !prev)}
                    aria-expanded={userMenuOpen}
                    className="inline-flex items-center space-x-2 px-3 py-2 text-xs font-mono rounded-lg bg-[#17211d] border border-[#35443a] text-[#fefae0] hover:border-[#d4a373]/70 transition-all"
                  >
                    <span className="w-2 h-2 rounded-full bg-[#ccd5ae]" />
                    <span className="max-w-[110px] truncate">{user?.full_name || 'Account'}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-[#a9b3a8]" />
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 rounded-xl bg-[#17211d] border border-[#35443a] shadow-2xl py-2 z-50">
                      <div className="px-3.5 py-2 border-b border-[#35443a]">
                        <div className="text-xs font-semibold text-[#fefae0] truncate">{user?.full_name}</div>
                        <div className="text-[11px] font-mono text-[#77857b] truncate">{user?.email}</div>
                      </div>
                      <Link
                        to="/profile"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center space-x-2.5 px-3.5 py-2.5 text-xs text-[#e9edc9] hover:bg-[#1c2923] transition-colors"
                      >
                        <User className="w-3.5 h-3.5 text-[#ccd5ae]" />
                        <span>Profile & Stats</span>
                      </Link>
                      <Link
                        to="/my-manuscripts"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center space-x-2.5 px-3.5 py-2.5 text-xs text-[#e9edc9] hover:bg-[#1c2923] transition-colors"
                      >
                        <FolderOpen className="w-3.5 h-3.5 text-[#d4a373]" />
                        <span>My Manuscripts</span>
                      </Link>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full flex items-center space-x-2.5 px-3.5 py-2.5 text-xs text-[#faedcd] hover:bg-[#1c2923] border-t border-[#35443a] transition-colors text-left"
                      >
                        <LogOut className="w-3.5 h-3.5 text-[#d4a373]" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="inline-flex items-center space-x-1.5 px-3.5 py-2 text-xs font-mono font-medium text-[#e9edc9] bg-[#17211d] hover:bg-[#1c2923] border border-[#35443a] hover:border-[#ccd5ae]/60 rounded-lg transition-all whitespace-nowrap"
                >
                  <LogIn className="w-3.5 h-3.5 text-[#ccd5ae]" />
                  <span>Sign In</span>
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center space-x-1.5 px-3.5 py-2 text-xs font-mono font-medium text-[#d4a373] bg-[#17211d] hover:bg-[#1c2923] border border-[#d4a373]/40 rounded-lg transition-all whitespace-nowrap"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Register</span>
                </Link>
              </>
            )}

            <Link
              to="/analyse"
              className="inline-flex items-center space-x-2 px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider text-[#101614] bg-[#ccd5ae] hover:bg-[#e9edc9] rounded-lg shadow-[0_0_15px_rgba(204,213,174,0.2)] transition-all whitespace-nowrap"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#101614]" />
              <span>Restore a Manuscript</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#101614]" />
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex lg:hidden">
            <button
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              type="button"
              className="p-2 rounded-lg text-[#e9edc9] hover:text-[#fefae0] hover:bg-[#17211d] border border-[#35443a]"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-[#ccd5ae]" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile / Tablet Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-[#35443a] bg-[#101614]/98 backdrop-blur-xl px-4 pt-4 pb-6 space-y-3 shadow-2xl">
          <div className="flex flex-col space-y-1">
            {navLinks.map((link) => {
              const active = isActive(link.path);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-4 py-2.5 rounded-lg text-sm font-mono tracking-wider uppercase transition-colors ${
                    active
                      ? 'bg-[#ccd5ae] text-[#101614] font-bold'
                      : 'text-[#a9b3a8] hover:bg-[#17211d] hover:text-[#fefae0]'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </div>

          <div className="pt-3 border-t border-[#35443a] space-y-2">
            {isAuthenticated ? (
              <>
                <div className="px-3 py-2 rounded-lg bg-[#17211d] border border-[#35443a] text-xs">
                  <div className="font-semibold text-[#fefae0]">{user?.full_name}</div>
                  <div className="font-mono text-[#77857b] text-[11px]">{user?.email}</div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    to="/my-manuscripts"
                    onClick={() => setMobileMenuOpen(false)}
                    className="py-2.5 px-3 rounded-lg bg-[#17211d] border border-[#35443a] text-xs font-mono text-[#e9edc9] text-center"
                  >
                    My Manuscripts
                  </Link>
                  <Link
                    to="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="py-2.5 px-3 rounded-lg bg-[#17211d] border border-[#35443a] text-xs font-mono text-[#d4a373] text-center"
                  >
                    Profile
                  </Link>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full py-2.5 px-4 rounded-lg bg-[#1c2923] border border-[#35443a] text-xs font-mono text-[#faedcd]"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2.5 px-4 rounded-lg bg-[#17211d] border border-[#35443a] text-xs font-mono text-[#fefae0] text-center"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2.5 px-4 rounded-lg bg-[#17211d] border border-[#d4a373]/40 text-xs font-mono text-[#d4a373] text-center"
                >
                  Register
                </Link>
              </div>
            )}

            <Link
              to="/analyse"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center py-3 px-4 text-xs font-mono font-bold uppercase tracking-wider text-[#101614] bg-[#ccd5ae] hover:bg-[#e9edc9] rounded-lg shadow-md flex items-center justify-center space-x-2"
            >
              <Sparkles className="w-4 h-4 text-[#101614]" />
              <span>Restore a Manuscript</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
