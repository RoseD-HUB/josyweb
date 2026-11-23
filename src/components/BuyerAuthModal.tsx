import React, { useEffect, useState } from 'react';
import { Lock, Mail, ShieldCheck, User as UserIcon, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { JosyLogo } from './JosyLogo';

export function BuyerAuthModal() {
  const {
    isAuthModalOpen,
    setIsAuthModalOpen,
    authModalMode,
    signUpWithEmail,
    signInWithEmail,
    signInWithGoogle,
  } = useStore();

  const [mode, setMode] = useState<'signup' | 'signin'>(authModalMode);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthModalOpen) {
      setMode(authModalMode);
      setErrorMsg(null);
      setPassword('');
      setConfirmPassword('');
    }
  }, [isAuthModalOpen, authModalMode]);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (mode === 'signup') {
      if (fullName.trim().length < 2) {
        setErrorMsg('Please enter your full name.');
        return;
      }
      if (password.length < 6) {
        setErrorMsg('Password must be at least 6 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg('Passwords do not match.');
        return;
      }
    }

    setSubmitting(true);
    try {
      const result =
        mode === 'signup'
          ? await signUpWithEmail(fullName.trim(), email.trim(), password)
          : await signInWithEmail(email.trim(), password);

      if (result.error) {
        setErrorMsg(result.error);
      } else {
        setIsAuthModalOpen(false);
        setFullName('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setSubmitting(true);
    try {
      const u = await signInWithGoogle();
      if (u) {
        setIsAuthModalOpen(false);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={() => setIsAuthModalOpen(false)}
    >
      <div
        className="w-full max-w-md bg-white border border-[#E4E4E0] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="px-6 py-5 border-b border-[#E4E4E0] flex items-center justify-between bg-[#FAFAFA]">
          <JosyLogo size="sm" />
          <button
            type="button"
            onClick={() => setIsAuthModalOpen(false)}
            aria-label="Close account dialog"
            className="p-1.5 text-[#52525B] hover:text-[#111113] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Mode Switch Tabs */}
          <div className="grid grid-cols-2 border border-[#E4E4E0] p-1 bg-[#FAFAFA]">
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setErrorMsg(null);
              }}
              className={`py-2 text-xs font-medium transition-colors cursor-pointer ${
                mode === 'signup'
                  ? 'bg-[#111113] text-white'
                  : 'text-[#52525B] hover:text-[#111113]'
              }`}
            >
              Create Buyer Account
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setErrorMsg(null);
              }}
              className={`py-2 text-xs font-medium transition-colors cursor-pointer ${
                mode === 'signin'
                  ? 'bg-[#111113] text-white'
                  : 'text-[#52525B] hover:text-[#111113]'
              }`}
            >
              Buyer Sign In
            </button>
          </div>

          <div className="space-y-1">
            <h2 className="font-editorial text-2xl font-medium text-[#111113]">
              {mode === 'signup' ? 'Register Your Buyer Account' : 'Welcome Back'}
            </h2>
            <p className="text-xs text-[#52525B] leading-relaxed">
              {mode === 'signup'
                ? 'Create an email & password buyer account to place orders, submit tailoring requests, and track your commissions.'
                : 'Sign in with your buyer email and password to place orders, send studio requests, or track order progress.'}
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] text-xs text-[#991B1B] leading-relaxed">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === 'signup' && (
              <div>
                <label className="block text-[11px] font-medium text-[#52525B] mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-[#A1A1AA] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    maxLength={120}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your full name"
                    className="w-full border border-[#D4D4D8] pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-[#111113]"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-medium text-[#52525B] mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#A1A1AA] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  maxLength={180}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="buyer@example.com"
                  className="w-full border border-[#D4D4D8] pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-[#111113]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[#52525B] mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#A1A1AA] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  minLength={6}
                  maxLength={128}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full border border-[#D4D4D8] pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-[#111113]"
                />
              </div>
            </div>

            {mode === 'signup' && (
              <div>
                <label className="block text-[11px] font-medium text-[#52525B] mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#A1A1AA] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    maxLength={128}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full border border-[#D4D4D8] pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-[#111113]"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-[#111113] text-white text-xs font-medium tracking-wider uppercase hover:bg-[#1B365D] transition-colors disabled:opacity-60 cursor-pointer"
            >
              {submitting
                ? mode === 'signup'
                  ? 'Creating Account...'
                  : 'Signing In...'
                : mode === 'signup'
                  ? 'Create Buyer Account'
                  : 'Sign In as Buyer'}
            </button>
          </form>

          {/* Role Scope Notice */}
          <div className="p-3 bg-[#F8FAFC] border border-[#E4E4E0] flex items-start gap-2.5 text-[11px] text-[#52525B] leading-relaxed">
            <ShieldCheck className="w-4 h-4 text-[#1B365D] shrink-0 mt-0.5" />
            <span>
              Buyer accounts can place orders, submit tailoring requests, and view their order tracker. Editing or deleting platform records is restricted to Studio Administrators.
            </span>
          </div>

          <div className="relative flex items-center py-1">
            <div className="flex-1 border-t border-[#E4E4E0]" />
            <span className="px-3 text-[11px] text-[#71717A]">or</span>
            <div className="flex-1 border-t border-[#E4E4E0]" />
          </div>

          <button
            type="button"
            disabled={submitting}
            onClick={() => void handleGoogleSignIn()}
            className="w-full py-2.5 border border-[#D4D4D8] text-xs font-medium text-[#27272A] hover:border-[#111113] hover:text-[#111113] transition-colors cursor-pointer"
          >
            Continue with Google (Buyers &amp; Studio Admin)
          </button>
        </div>
      </div>
    </div>
  );
}
