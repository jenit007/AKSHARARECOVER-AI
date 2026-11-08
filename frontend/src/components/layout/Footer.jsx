import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Footer() {
  const { isAuthenticated } = useAuth();

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'About Us', path: '/about' },
    { name: 'AI Model', path: '/ai-model' },
    { name: 'Importance', path: '/importance' },
  ];

  return (
    <footer className="bg-[#101614] border-t border-[#35443a] text-[#a9b3a8] pt-16 pb-12 relative overflow-hidden">
      <div className="h-[2px] w-full heritage-gradient-bar opacity-40 absolute top-0 left-0 right-0" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-[#35443a]/60">
          {/* Brand & Mission */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-[#17211d] border border-[#ccd5ae]/40 flex items-center justify-center p-1.5 relative">
                <div className="w-2 h-2 rounded-full bg-[#ccd5ae]" />
                <div className="w-1 h-1 rounded-full bg-[#d4a373] absolute bottom-1.5 right-1.5" />
              </div>
              <span className="font-heading text-xl font-bold tracking-tight text-[#fefae0]">
                AKSHARARECOVER<span className="text-[#d4a373] font-mono text-sm ml-1 font-semibold">AI</span>
              </span>
            </div>

            <p className="font-editorial text-lg italic text-[#d4a373]">
              "Bringing Forgotten Knowledge Back to Life."
            </p>

            <p className="text-sm text-[#a9b3a8] max-w-md leading-relaxed font-sans">
              A digital heritage preservation workbench built by Team SCRIPTORIA to support non-destructive enhancement, script transcription review, and archival record-keeping for Kerala palm-leaf manuscripts.
            </p>

            <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-[#77857b]">
              <span>Team: SCRIPTORIA</span>
              <span>•</span>
              <span className="text-[#ccd5ae]">THE LIVING ARCHIVE</span>
            </div>
          </div>

          {/* Main Informational Pages */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-widest text-[#ccd5ae] font-semibold">
              Explore
            </h4>
            <ul className="space-y-2 text-sm font-sans">
              {navLinks.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="hover:text-[#fefae0] transition-colors flex items-center space-x-1 group"
                  >
                    <span>{link.name}</span>
                    <ArrowUpRight className="w-3 h-3 text-[#77857b] group-hover:text-[#ccd5ae] transition-colors" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Workspace Links */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-widest text-[#e9edc9] font-semibold">
              Workspace
            </h4>
            <ul className="space-y-2 text-sm font-sans">
              <li>
                <Link to="/analyse" className="hover:text-[#fefae0] transition-colors">
                  Restore a Manuscript
                </Link>
              </li>
              {isAuthenticated ? (
                <>
                  <li>
                    <Link to="/my-manuscripts" className="hover:text-[#fefae0] transition-colors">
                      My Manuscripts
                    </Link>
                  </li>
                  <li>
                    <Link to="/profile" className="hover:text-[#fefae0] transition-colors">
                      Researcher Profile
                    </Link>
                  </li>
                </>
              ) : (
                <>
                  <li>
                    <Link to="/login" className="hover:text-[#fefae0] transition-colors">
                      Sign In
                    </Link>
                  </li>
                  <li>
                    <Link to="/register" className="hover:text-[#fefae0] transition-colors">
                      Create Account
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* Philosophy */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-widest text-[#d4a373] font-semibold">
              Archival Principle
            </h4>
            <p className="text-xs text-[#a9b3a8] leading-relaxed font-sans">
              Raw manuscript scans are preserved untouched. Automated enhancement, optical damage indicators, OCR outputs, and human epigraphical revisions remain strictly separated and auditable.
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-[#77857b] gap-4">
          <div>
            &copy; {new Date().getFullYear()} AKSHARARECOVER AI — Team SCRIPTORIA.
          </div>
          <div className="text-[#a9b3a8]">
            THE LIVING ARCHIVE — Where Ancient Knowledge Meets Artificial Intelligence.
          </div>
        </div>
      </div>
    </footer>
  );
}
