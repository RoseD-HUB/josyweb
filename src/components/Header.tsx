import React, { useEffect, useRef, useState } from 'react';
import {
  ChevronDown,
  Search,
  ShoppingBag,
  User as UserIcon,
  X,
} from 'lucide-react';
import { CATEGORIES, CURRENCY_META } from '../data/catalog';
import { useStore } from '../context/StoreContext';
import { CategoryCode, CurrencyCode } from '../types/josy';
import { JosyLogo } from './JosyLogo';

const ANNOUNCEMENTS = [
  'Crafted in Ughelli, Delta State, shipped worldwide — Explore the Josy Textile 2026 Collection',
  'Complimentary In-Store Pickup at Isoko Road, Ughelli · DHL Express International Delivery',
  'Luxury Nigerian Traditional & Corporate Tailoring — 60% Deposit Option Available',
];

export function Header() {
  const {
    activePage,
    setActivePage,
    setActiveCategoryFilter,
    setActiveHomeTab,
    currency,
    setCurrency,
    cart,
    setIsCartOpen,
    setIsSearchOpen,
    user,
    isAdmin,
  } = useStore();

  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [bannerIndex, setBannerIndex] = useState(0);
  const [megaOpen, setMegaOpen] = useState(false);
  const [currencyOpen, setCurrencyOpen] = useState(false);

  const megaRef = useRef<HTMLDivElement>(null);
  const currencyRef = useRef<HTMLDivElement>(null);

  const totalBagCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const isHomePage = activePage === 'home';

  useEffect(() => {
    const timer = window.setInterval(() => {
      setBannerIndex((prev) => (prev + 1) % ANNOUNCEMENTS.length);
    }, 6500);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (megaRef.current && !megaRef.current.contains(e.target as Node)) {
        setMegaOpen(false);
      }
      if (currencyRef.current && !currencyRef.current.contains(e.target as Node)) {
        setCurrencyOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navigateToCategory = (code: CategoryCode | 'ALL') => {
    setActiveCategoryFilter(code);
    setActiveHomeTab('All');
    setActivePage('home');
    setMegaOpen(false);
    window.setTimeout(() => {
      const el = document.getElementById('new-arrivals-catalog');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 60);
  };

  const handleNavClick = (page: typeof activePage) => {
    setActivePage(page);
    setMegaOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="sticky top-0 z-40 w-full bg-[#FAFAFA]/95 backdrop-blur-md border-b border-[#E4E4E0]">
      {/* Slim Dismissible Announcement Bar */}
      {!bannerDismissed && (
        <div className="bg-[#111113] text-[#F4F4F5] px-4 h-8 flex items-center justify-center relative text-xs tracking-wide">
          <p className="truncate max-w-[85vw] text-center font-normal">
            {ANNOUNCEMENTS[bannerIndex]}
          </p>
          <button
            type="button"
            onClick={() => setBannerDismissed(true)}
            aria-label="Dismiss announcement"
            className="absolute right-3 p-1 text-[#A1A1AA] hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Row 1: Prominent Logo (Larger on First Page) + Utility Controls */}
      <header
        className={`max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 transition-all ${
          isHomePage ? 'py-3.5 sm:py-4' : 'py-2.5'
        }`}
      >
        {/* Clicking the Logo Opens the Dedicated Brand House Page */}
        <button
          type="button"
          onClick={() => handleNavClick('brand-house')}
          title="Open The House of Josy Textile Brand Page"
          aria-label="Open The House of Josy Textile Brand Page"
          className="shrink-0 cursor-pointer hover:opacity-90 transition-opacity"
        >
          <JosyLogo
            variant="light"
            size={isHomePage ? 'lg' : 'md'}
            showTagline={isHomePage}
          />
        </button>

        {/* Compact Utilities + Primary Bag Action */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {/* Live Currency Switcher */}
          <div className="relative" ref={currencyRef}>
            <button
              type="button"
              onClick={() => setCurrencyOpen((v) => !v)}
              aria-label="Select currency"
              className="h-9 px-2.5 text-xs font-mono font-medium text-[#27272A] hover:text-[#111113] border border-transparent hover:border-[#E4E4E0] flex items-center gap-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>{CURRENCY_META[currency].label}</span>
              <ChevronDown className="w-3 h-3" />
            </button>
            {currencyOpen && (
              <div className="absolute right-0 top-full mt-2 w-32 bg-white border border-[#E4E4E0] shadow-lg py-1 z-50">
                {(Object.keys(CURRENCY_META) as CurrencyCode[]).map((code) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => {
                      setCurrency(code);
                      setCurrencyOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs font-mono flex items-center justify-between hover:bg-[#F4F4F5] transition-colors cursor-pointer ${
                      currency === code ? 'font-semibold text-[#1B365D]' : 'text-[#3F3F46]'
                    }`}
                  >
                    <span>{code}</span>
                    <span>{CURRENCY_META[code].symbol}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Predictive Search Trigger */}
          <button
            type="button"
            onClick={() => setIsSearchOpen(true)}
            aria-label="Search garments and textiles"
            className="w-9 h-9 flex items-center justify-center text-[#27272A] hover:text-[#111113] transition-colors cursor-pointer"
          >
            <Search className="w-[18px] h-[18px]" />
          </button>

          {/* Compact User Status */}
          <button
            type="button"
            onClick={() => handleNavClick('account')}
            aria-label="My Account and Orders"
            className={`hidden sm:flex h-9 px-2.5 items-center gap-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activePage === 'account' || activePage === 'workshop'
                ? 'text-[#1B365D]'
                : 'text-[#27272A] hover:text-[#111113]'
            }`}
          >
            <UserIcon className="w-[17px] h-[17px]" />
            <span>
              {user ? (isAdmin ? 'Admin' : user.displayName?.split(' ')[0] || 'Buyer') : 'Sign In'}
            </span>
          </button>

          {/* Primary Action: Slide-Out Cart Drawer */}
          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            className="h-9 px-3.5 sm:px-4 bg-[#111113] text-white text-xs font-medium tracking-wide flex items-center gap-2 hover:bg-[#1B365D] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Bag</span>
            <span className="font-mono tabular-nums">({totalBagCount})</span>
          </button>
        </div>
      </header>

      {/* Row 2: Top Index Navigation Bar — Always Visible & Arranged Horizontally */}
      <div className="border-t border-[#E4E4E0] bg-white/90">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 relative" ref={megaRef}>
          <nav
            aria-label="Primary navigation"
            className="flex items-center justify-start sm:justify-center gap-5 sm:gap-8 h-11 overflow-x-auto text-[13px] font-medium text-[#3F3F46]"
          >
            <button
              type="button"
              onClick={() => {
                setActiveCategoryFilter('ALL');
                setActiveHomeTab('All');
                handleNavClick('home');
              }}
              className={`h-full flex items-center whitespace-nowrap shrink-0 border-b-2 transition-colors cursor-pointer ${
                activePage === 'home'
                  ? 'text-[#111113] border-[#111113] font-semibold'
                  : 'border-transparent hover:text-[#111113] hover:border-[#A1A1AA]'
              }`}
            >
              Home
            </button>

            {/* Shop RTW Mega-Dropdown Trigger */}
            <button
              type="button"
              onClick={() => setMegaOpen((o) => !o)}
              aria-expanded={megaOpen}
              className={`h-full flex items-center gap-1 whitespace-nowrap shrink-0 border-b-2 transition-colors cursor-pointer ${
                megaOpen
                  ? 'text-[#1B365D] border-[#1B365D]'
                  : 'border-transparent hover:text-[#111113] hover:border-[#A1A1AA]'
              }`}
            >
              <span>Shop RTW</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-150 ${
                  megaOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            <button
              type="button"
              onClick={() => handleNavClick('custom-tailoring')}
              className={`h-full flex items-center whitespace-nowrap shrink-0 border-b-2 transition-colors cursor-pointer ${
                activePage === 'custom-tailoring'
                  ? 'text-[#111113] border-[#111113] font-semibold'
                  : 'border-transparent hover:text-[#111113] hover:border-[#A1A1AA]'
              }`}
            >
              Custom Tailoring
            </button>

            <button
              type="button"
              onClick={() => handleNavClick('story')}
              className={`h-full flex items-center whitespace-nowrap shrink-0 border-b-2 transition-colors cursor-pointer ${
                activePage === 'story'
                  ? 'text-[#111113] border-[#111113] font-semibold'
                  : 'border-transparent hover:text-[#111113] hover:border-[#A1A1AA]'
              }`}
            >
              Our Story
            </button>

            <button
              type="button"
              onClick={() => handleNavClick('contact')}
              className={`h-full flex items-center whitespace-nowrap shrink-0 border-b-2 transition-colors cursor-pointer ${
                activePage === 'contact'
                  ? 'text-[#111113] border-[#111113] font-semibold'
                  : 'border-transparent hover:text-[#111113] hover:border-[#A1A1AA]'
              }`}
            >
              Contact
            </button>

            <button
              type="button"
              onClick={() => handleNavClick('account')}
              className={`h-full flex items-center whitespace-nowrap shrink-0 border-b-2 transition-colors cursor-pointer ${
                activePage === 'account'
                  ? 'text-[#111113] border-[#111113] font-semibold'
                  : 'border-transparent hover:text-[#111113] hover:border-[#A1A1AA]'
              }`}
            >
              My Account &amp; Order Tracker
            </button>

            {isAdmin && (
              <button
                type="button"
                onClick={() => handleNavClick('workshop')}
                className={`h-full flex items-center whitespace-nowrap shrink-0 border-b-2 transition-colors cursor-pointer ${
                  activePage === 'workshop'
                    ? 'text-[#1B365D] border-[#1B365D] font-semibold'
                    : 'border-transparent text-[#1B365D] hover:border-[#1B365D]'
                }`}
              >
                Workshop Portal
              </button>
            )}
          </nav>

          {/* Shop RTW 9-Category Mega-Dropdown Panel */}
          {megaOpen && (
            <div className="absolute left-4 right-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 top-full mt-1 sm:w-[740px] max-w-[94vw] bg-white border border-[#E4E4E0] shadow-xl p-6 sm:p-7 z-50">
              <div className="flex items-center justify-between pb-4 mb-5 border-b border-[#E4E4E0]">
                <div>
                  <p className="text-xs text-[#71717A]">Josy Textile Catalog</p>
                  <h3 className="font-editorial text-xl font-medium text-[#111113]">
                    Nine Core Garment Lines (01–09)
                  </h3>
                </div>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => navigateToCategory('ALL')}
                    className="text-xs font-medium text-[#1B365D] hover:underline whitespace-nowrap cursor-pointer"
                  >
                    View Complete Catalog
                  </button>
                  <button
                    type="button"
                    onClick={() => setMegaOpen(false)}
                    aria-label="Close catalog menu"
                    className="p-1 text-[#71717A] hover:text-[#111113] cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-4">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.code}
                    type="button"
                    onClick={() => navigateToCategory(cat.code)}
                    className="text-left group py-1 cursor-pointer"
                  >
                    <div className="flex items-baseline gap-2">
                      <span className="font-mono text-[11px] text-[#71717A] tabular-nums">
                        {cat.code}
                      </span>
                      <span className="text-sm font-medium text-[#111113] group-hover:text-[#1B365D] transition-colors">
                        {cat.shortName}
                      </span>
                    </div>
                    <p className="text-xs text-[#71717A] mt-0.5 line-clamp-1 pl-6">
                      {cat.scope}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
