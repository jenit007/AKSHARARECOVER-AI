import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, LogIn, ShieldCheck, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { login, isAuthenticated } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const nextPath = searchParams.get('next') || '/my-manuscripts';

  useEffect(() => {
    if (isAuthenticated) {
      navigate(nextPath, { replace: true });
    }
  }, [isAuthenticated, navigate, nextPath]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setErrorMsg('Please enter both your email address and password.');
      return;
    }

    try {
      setSubmitting(true);
      const user = await login({ email: cleanEmail, password });
      toast.success(`Welcome back, ${user.full_name}.`, 'Signed In');
      navigate(nextPath, { replace: true });
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.detail ||
        'Sign in failed. Please check your credentials and try again.';
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#101614] text-[#f1f2e9] pt-28 pb-20 px-4 sm:px-6 lg:px-8 flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 archive-grid opacity-25 pointer-events-none" />
      <div className="absolute top-1/4 left-1/3 w-80 h-80 bg-[#ccd5ae]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#17211d] border border-[#35443a] text-[11px] font-mono text-[#ccd5ae] uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5 text-[#d4a373]" />
            <span>The Living Archive Access</span>
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-[#fefae0]">
            Sign In to Your Archive
          </h1>
          <p className="text-xs sm:text-sm text-[#a9b3a8]">
            Access your personal manuscript repository, processing reports, and digital heritage records.
          </p>
        </div>

        <div className="p-6 sm:p-8 rounded-2xl bg-[#17211d] border border-[#35443a] shadow-2xl space-y-5">
          {errorMsg && (
            <div
              role="alert"
              className="p-3.5 rounded-xl bg-[#da7770]/15 border border-[#da7770]/50 text-[#da7770] text-xs flex items-start space-x-2.5"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label
                htmlFor="login-email"
                className="block text-xs font-mono uppercase tracking-wider text-[#e9edc9] mb-1.5"
              >
                Email Address
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="researcher@example.org"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#101614] border border-[#35443a] text-sm text-[#fefae0] placeholder-[#77857b] focus:border-[#ccd5ae] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="login-password"
                className="block text-xs font-mono uppercase tracking-wider text-[#e9edc9] mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-[#101614] border border-[#35443a] text-sm text-[#fefae0] placeholder-[#77857b] focus:border-[#ccd5ae] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a9b3a8] hover:text-[#fefae0]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 px-5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider text-[#101614] bg-[#ccd5ae] hover:bg-[#e9edc9] disabled:opacity-50 shadow-lg transition-all flex items-center justify-center space-x-2"
            >
              <LogIn className="w-4 h-4" />
              <span>{submitting ? 'Signing In...' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="pt-4 border-t border-[#35443a] text-center text-xs text-[#a9b3a8]">
            New to AKSHARARECOVER AI?{' '}
            <Link
              to={nextPath ? `/register?next=${encodeURIComponent(nextPath)}` : '/register'}
              className="text-[#d4a373] font-semibold hover:text-[#fefae0] hover:underline"
            >
              Create an Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
