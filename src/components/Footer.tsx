import React, { useState } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { JosyLogo } from './JosyLogo';

export function Footer() {
  const {
    setActivePage,
    setActiveCategoryFilter,
    setActiveHomeTab,
    setIsSizingPolicyOpen,
    subscribeNewsletter,
    user,
    isAdmin,
  } = useStore();

  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await subscribeNewsletter(email);
    if (ok) {
      setSubscribed(true);
      setEmail('');
    }
  };

  const go = (page: Parameters<typeof setActivePage>[0]) => {
    setActivePage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#111113] text-[#D4D4D8] border-t border-[#27272A]">
      {/* Drop Alert Newsletter Band */}
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-14 border-b border-[#27272A]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-6 space-y-2">
            <p className="text-xs text-[#B48436] tracking-[0.2em] uppercase">
              Drop Alert Newsletter
            </p>
            <h2 className="font-editorial text-3xl sm:text-4xl font-medium text-white">
              First Access to Limited Textile Drops & Private Restocks
            </h2>
          </div>
          <div className="lg:col-span-6">
            {subscribed ? (
              <div className="p-4 border border-[#3F3F46] bg-[#18181B] flex items-center gap-3 text-sm text-white">
                <Check className="w-4 h-4 text-[#B48436] shrink-0" />
                <span>You are on the Josy Textile private drop & restock dispatch list.</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  required
                  maxLength={180}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="flex-1 bg-[#18181B] border border-[#3F3F46] px-4 py-3 text-sm text-white placeholder:text-[#71717A] focus:outline-none focus:border-white"
                />
                <button
                  type="submit"
                  className="px-6 py-3 bg-white text-[#111113] text-xs font-semibold tracking-wider uppercase hover:bg-[#E4E4E7] transition-colors flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
                >
                  <span>Join Drop List</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Structured Navigation Columns */}
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 text-xs">
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => go('brand-house')}
            title="Open The House of Josy Textile Brand Page"
            aria-label="Open The House of Josy Textile Brand Page"
            className="text-left cursor-pointer hover:opacity-90 transition-opacity"
          >
            <JosyLogo variant="dark" size="sm" showTagline />
          </button>
          <p className="text-[#A1A1AA] leading-relaxed">
            Culture-driven African fashion house uniting Ready-to-Wear apparel and precision Nigerian luxury tailoring. Founded by CEO Joseph Odehwingie.
          </p>
        </div>

        <div className="space-y-3">
          <p className="text-white font-semibold uppercase tracking-wider">Quick Navigation</p>
          <ul className="space-y-2.5 text-[#A1A1AA]">
            <li>
              <button
                type="button"
                onClick={() => {
                  setActiveCategoryFilter('ALL');
                  go('home');
                }}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Shop Ready-to-Wear (01–09)
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => go('custom-tailoring')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Custom Tailoring & Measurements
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => go('story')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Our Story & Craftsmanship
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => go('contact')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Contact & Fittings
              </button>
            </li>
          </ul>
        </div>

        <div className="space-y-3">
          <p className="text-white font-semibold uppercase tracking-wider">Client & Operations</p>
          <ul className="space-y-2.5 text-[#A1A1AA]">
            <li>
              <button
                type="button"
                onClick={() => go('account')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Track My Order & Profiles
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => setIsSizingPolicyOpen(true)}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Sizing & Luxury Policy
              </button>
            </li>
            {(isAdmin || !user) && (
              <li>
                <button
                  type="button"
                  onClick={() => go('workshop')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  {isAdmin ? 'Admin & Tailor Workshop Portal' : 'Studio Admin Portal'}
                </button>
              </li>
            )}
          </ul>
        </div>

        <div className="space-y-3">
          <p className="text-white font-semibold uppercase tracking-wider">Headquarters</p>
          <p className="text-[#A1A1AA] leading-relaxed">
            Isoko Road, Ughelli, Delta State, Nigeria
          </p>
          <p className="text-[#D4D4D8] font-mono">
            Phone / WhatsApp: 07032802844
          </p>
          <p className="text-[#D4D4D8] font-mono">
            Email:{' '}
            <a
              href="mailto:josephwingie@gmail.com"
              className="underline decoration-[#52525B] underline-offset-4 hover:text-white transition-colors"
            >
              josephwingie@gmail.com
            </a>
          </p>
          <p className="text-[#A1A1AA]">
            Available: Mon–Sat, 9:00 AM – 7:00 PM WAT
          </p>
          <p className="text-[#A1A1AA]">
            Domestic Dispatch: Ughelli, Warri, Asaba, Port Harcourt, Lagos, Abuja &amp; Nationwide
          </p>
          <p className="text-[#A1A1AA]">
            International Express: DHL Express &amp; FedEx Worldwide
          </p>
        </div>
      </div>

      {/* Quiet Legal Line */}
      <div className="border-t border-[#27272A]">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#71717A]">
          <p>© 2026 Josy Textile. All rights reserved.</p>
          <p>NGN ₦ · USD $ · GBP £ · EUR € — Paystack, Flutterwave &amp; Stripe Supported</p>
        </div>
      </div>
    </footer>
  );
}
