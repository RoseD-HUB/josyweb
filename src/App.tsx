/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { StoreProvider, useStore } from './context/StoreContext';
import { Header } from './components/Header';
import { HomeView } from './components/HomeView';
import { BrandHousePage } from './components/BrandHousePage';
import {
  ContactPage,
  CustomTailoringPage,
  OurStoryPage,
} from './components/SecondaryPages';
import { AccountAndTrackerView } from './components/AccountAndTrackerView';
import { WorkshopAdminPortal } from './components/WorkshopAdminPortal';
import { ProductDetailModal } from './components/ProductDetailModal';
import { CartCheckoutDrawer } from './components/CartCheckoutDrawer';
import { PredictiveSearchModal } from './components/PredictiveSearchModal';
import { SizingPolicyModal } from './components/SizingPolicyModal';
import { BuyerAuthModal } from './components/BuyerAuthModal';
import { Footer } from './components/Footer';
import { ActivePageView } from './types/josy';

const PAGE_LABELS: Record<Exclude<ActivePageView, 'home'>, string> = {
  'brand-house': 'The House of Josy Textile',
  'custom-tailoring': 'Custom Tailoring Studio',
  story: 'Our Story & Textile Archive',
  contact: 'Contact & Fitting Scheduler',
  account: 'My Account & Order Tracker',
  workshop: 'Admin & Tailor Workshop Portal',
};

function StorefrontShell() {
  const {
    activePage,
    setActivePage,
    setActiveCategoryFilter,
    setActiveHomeTab,
    toastMessage,
    selectedProduct,
    isCartOpen,
    isSearchOpen,
    isSizingPolicyOpen,
    isAuthModalOpen,
  } = useStore();

  const closeCurrentPage = () => {
    setActiveCategoryFilter('ALL');
    setActiveHomeTab('All');
    setActivePage('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Allow pressing Escape to close an open subpage when no modal/drawer is open
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === 'Escape' &&
        activePage !== 'home' &&
        !selectedProduct &&
        !isCartOpen &&
        !isSearchOpen &&
        !isSizingPolicyOpen &&
        !isAuthModalOpen
      ) {
        closeCurrentPage();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    activePage,
    selectedProduct,
    isCartOpen,
    isSearchOpen,
    isSizingPolicyOpen,
    isAuthModalOpen,
  ]);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA] text-[#111113]">
      <Header />

      <main className="flex-1">
        {/* Consistent Top-Right Corner X Close Control on Every Opened Page */}
        {activePage !== 'home' && (
          <div className="border-b border-[#E4E4E0] bg-white">
            <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
              <p className="text-xs font-mono text-[#71717A] uppercase tracking-wider truncate">
                {PAGE_LABELS[activePage]}
              </p>
              <button
                type="button"
                onClick={closeCurrentPage}
                aria-label={`Close ${PAGE_LABELS[activePage]} page`}
                title="Close this page and return to Homepage"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#D4D4D8] bg-[#FAFAFA] text-[#111113] text-xs font-medium hover:bg-[#111113] hover:text-white hover:border-[#111113] transition-colors shrink-0 cursor-pointer"
              >
                <X className="w-4 h-4" />
                <span>Close</span>
              </button>
            </div>
          </div>
        )}

        {activePage === 'home' && <HomeView />}
        {activePage === 'brand-house' && <BrandHousePage />}
        {activePage === 'custom-tailoring' && <CustomTailoringPage />}
        {activePage === 'story' && <OurStoryPage />}
        {activePage === 'contact' && <ContactPage />}
        {activePage === 'account' && <AccountAndTrackerView />}
        {activePage === 'workshop' && <WorkshopAdminPortal />}
      </main>

      <Footer />

      {/* Overlays & Drawers */}
      <ProductDetailModal />
      <CartCheckoutDrawer />
      <PredictiveSearchModal />
      <SizingPolicyModal />
      <BuyerAuthModal />

      {/* Clean Transient Feedback Toast */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-[70] bg-[#111113] text-white px-5 py-3 text-xs font-medium shadow-xl border border-[#27272A] max-w-sm"
        >
          {toastMessage}
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <StoreProvider>
        <StorefrontShell />
      </StoreProvider>
    </ErrorBoundary>
  );
}
