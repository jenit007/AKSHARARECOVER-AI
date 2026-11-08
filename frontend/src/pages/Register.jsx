import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, UserPlus, ShieldCheck, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Register() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { register, isAuthenticated } = useAuth();
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

    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim();

    if (trimmedName.length < 2) {
      setErrorMsg('Full name must be at least 2 characters.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    if (password.length < 8 || !/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
      setErrorMsg('Password must be at least 8 characters and include both letters and numbers.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    try {
      setSubmitting(true);
      const user = await register({
        full_name: trimmedName,
        email: trimmedEmail,
        password,
        confirm_password: confirmPassword,
      });
      toast.success(`Account created for ${user.full_name}.`, 'Welcome to the Archive');
      navigate(nextPath, { replace: true });
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.detail?.[0]?.msg ||
        err.response?.data?.detail ||
        'Registration failed. Please verify your details.';
      setErrorMsg(typeof msg === 'string' ? msg : 'Registration validation failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#101614] text-[#f1f2e9] pt-28 pb-20 px-4 sm:px-6 lg:px-8 flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 archive-grid opacity-25 pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-[#d4a373]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#17211d] border border-[#35443a] text-[11px] font-mono text-[#ccd5ae] uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5 text-[#d4a373]" />
            <span>Create Archivist Account</span>
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-[#fefae0]">
            Join The Living Archive
          </h1>
          <p className="text-xs sm:text-sm text-[#a9b3a8]">
            Establish a personal workspace to preserve, analyse, and export manuscript records.
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
                htmlFor="reg-name"
                className="block text-xs font-mono uppercase tracking-wider text-[#e9edc9] mb-1.5"
              >
                Full Name
              </label>
              <input
                id="reg-name"
                type="text"
                autoComplete="name"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your full name"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#101614] border border-[#35443a] text-sm text-[#fefae0] placeholder-[#77857b] focus:border-[#ccd5ae] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="reg-email"
                className="block text-xs font-mono uppercase tracking-wider text-[#e9edc9] mb-1.5"
              >
                Email Address
              </label>
              <input
                id="reg-email"
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
                htmlFor="reg-password"
                className="block text-xs font-mono uppercase tracking-wider text-[#e9edc9] mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 8 chars with letters & numbers"
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

            <div>
              <label
                htmlFor="reg-confirm"
                className="block text-xs font-mono uppercase tracking-wider text-[#e9edc9] mb-1.5"
              >
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="reg-confirm"
                  type={showConfirm ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-[#101614] border border-[#35443a] text-sm text-[#fefae0] placeholder-[#77857b] focus:border-[#ccd5ae] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((prev) => !prev)}
                  aria-label={showConfirm ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a9b3a8] hover:text-[#fefae0]"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 px-5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider text-[#101614] bg-[#ccd5ae] hover:bg-[#e9edc9] disabled:opacity-50 shadow-lg transition-all flex items-center justify-center space-x-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>{submitting ? 'Creating Account...' : 'Create Account'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="pt-4 border-t border-[#35443a] text-center text-xs text-[#a9b3a8]">
            Already have an archive account?{' '}
            <Link
              to={nextPath ? `/login?next=${encodeURIComponent(nextPath)}` : '/login'}
              className="text-[#d4a373] font-semibold hover:text-[#fefae0] hover:underline"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
