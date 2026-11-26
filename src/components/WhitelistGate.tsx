import React, { useState } from 'react';
import { Eye, EyeOff, Lock, ShieldCheck } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { JosyLogo } from './JosyLogo';

export function WhitelistGate() {
  const {
    signInWithWhitelist,
    signInWithGoogle,
    whitelistError,
    authReady,
    whitelistCheckReady,
  } = useStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [adminLoading, setAdminLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setSubmitting(true);
    try {
      const result = await signInWithWhitelist(email, password);
      if (result.error) {
        setLocalError(result.error);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdminGoogle = async () => {
    setLocalError(null);
    setAdminLoading(true);
    try {
      await signInWithGoogle();
    } finally {
      setAdminLoading(false);
    }
  };

  const displayError = localError || whitelistError;

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#111113] flex flex-col justify-between">
      <div className="h-1 bg-[#1B365D]" />

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-white border border-[#E4E4E0] shadow-xl p-8 sm:p-10 space-y-7">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <JosyLogo variant="light" size="md" />
            </div>
            <div className="space-y-1.5">
              <p className="text-[11px] font-mono uppercase tracking-[0.22em] text-[#B48436] flex items-center justify-center gap-1.5">
                <Lock className="w-3.5 h-3.5" />
                <span>Private Access Whitelist</span>
              </p>
              <h1 className="font-editorial text-3xl font-medium text-[#111113]">
                Approved Member Sign In
              </h1>
              <p className="text-xs text-[#52525B] leading-relaxed">
                Enter your whitelisted email address and password to access Josy Textile.
              </p>
            </div>
          </div>

          {!authReady || !whitelistCheckReady ? (
            <div className="py-8 text-center text-xs text-[#71717A] font-mono">
              Verifying access permissions...
            </div>
          ) : (
            <>
              {displayError && (
                <div
                  role="alert"
                  className="p-3.5 border border-[#991B1B] bg-[#FEF2F2] text-xs text-[#991B1B] leading-relaxed"
                >
                  {displayError}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label
                    htmlFor="whitelist-email"
                    className="block text-xs font-medium text-[#111113]"
                  >
                    Whitelisted Email Address
                  </label>
                  <input
                    id="whitelist-email"
                    type="email"
                    required
                    autoComplete="email"
                    maxLength={180}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="member@example.com"
                    className="w-full border border-[#D4D4D8] px-3.5 py-2.5 text-sm text-[#111113] focus:outline-none focus:border-[#111113]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="whitelist-password"
                    className="block text-xs font-medium text-[#111113]"
                  >
                    Access Password
                  </label>
                  <div className="relative">
                    <input
                      id="whitelist-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      maxLength={128}
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your assigned password"
                      className="w-full border border-[#D4D4D8] px-3.5 py-2.5 pr-10 text-sm text-[#111113] focus:outline-none focus:border-[#111113]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#71717A] hover:text-[#111113] cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 bg-[#111113] text-white text-xs font-medium tracking-wider uppercase hover:bg-[#1B365D] transition-colors disabled:opacity-60 cursor-pointer"
                >
                  {submitting ? 'Verifying Credentials...' : 'Enter Josy Textile'}
                </button>
              </form>

              <div className="pt-5 border-t border-[#E4E4E0] space-y-3">
                <p className="text-[11px] text-[#71717A] text-center">
                  Studio Administrator? Sign in to manage the approved whitelist.
                </p>
                <button
                  type="button"
                  disabled={adminLoading}
                  onClick={handleAdminGoogle}
                  className="w-full py-2.5 border border-[#1B365D] text-[#1B365D] text-xs font-medium flex items-center justify-center gap-2 hover:bg-[#1B365D] hover:text-white transition-colors disabled:opacity-60 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{adminLoading ? 'Signing In...' : 'Studio Admin Sign In (Google)'}</span>
                </button>
              </div>
            </>
          )}
        </div>
      </main>

      <footer className="py-5 px-4 text-center text-[11px] text-[#71717A] border-t border-[#E4E4E0] bg-white">
        Josy Textile · Isoko Road, Ughelli, Delta State, Nigeria · 07032802844 · josephwingie@gmail.com
      </footer>
    </div>
  );
}
