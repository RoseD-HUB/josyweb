import React, { useMemo } from 'react';
import { ArrowRight, Heart } from 'lucide-react';
import {
  CATEGORIES,
  formatMoney,
  HERO_IMAGE,
  IMG_AGBADA,
  IMG_BOMBER,
  isProductSoldOut,
} from '../data/catalog';
import { useStore } from '../context/StoreContext';
import { CategoryCode, HomeFilterTab, Product } from '../types/josy';

const FILTER_TABS: HomeFilterTab[] = [
  'All',
  'Ready-to-Wear',
  'Custom-Available',
  'Traditional & Occasion',
  'Corporate & Streetwear',
];

const TICKER_ITEMS = [
  'Authentic Textiles',
  'Ughelli to the World',
  'Ready-to-Wear & Luxury',
  'Josy Textile 2026',
  'Isoko Road Flagship Studio',
  'Inclusive S–3XL & Custom Fit',
];

function ProductCard({ product }: { product: Product }) {
  const { currency, setSelectedProduct, wishlistIds, toggleWishlist } = useStore();
  const isWishlisted = wishlistIds.includes(product.id);
  const soldOut = isProductSoldOut(product);

  const modeSummary =
    product.fulfillmentMode === 'BESPOKE_ONLY'
      ? 'Made to Measure'
      : product.fulfillmentMode === 'HYBRID'
        ? 'S–3XL · Custom Fit'
        : 'S–3XL Ready-to-Wear';

  return (
    <article className="group flex flex-col bg-white border border-[#E4E4E0] transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md">
      {/* 3:4 Editorial Portrait Frame with Secondary Hover Image */}
      <div className="relative aspect-[3/4] overflow-hidden bg-[#F2F2F0]">
        <button
          type="button"
          onClick={() => setSelectedProduct(product)}
          className="block w-full h-full text-left cursor-pointer"
        >
          <img
            src={product.image}
            alt={product.name}
            referrerPolicy="no-referrer"
            loading="lazy"
            className="w-full h-full object-cover transition-opacity duration-300 group-hover:opacity-0"
          />
          <img
            src={product.secondaryImage}
            alt={`${product.name} alternate view`}
            referrerPolicy="no-referrer"
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover opacity-0 transition-all duration-500 group-hover:opacity-100 group-hover:scale-103"
          />
        </button>

        {/* Quiet Single Status Line (Sold Out only when applicable — zero pill clusters) */}
        {soldOut && (
          <div className="absolute top-3 left-3 bg-[#111113]/90 text-white px-2.5 py-1 text-[11px] font-mono tracking-wider uppercase">
            Sold Out
          </div>
        )}

        {/* Wishlist Affordance */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            void toggleWishlist(product.id);
          }}
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
          className="absolute top-3 right-3 w-9 h-9 bg-white/90 hover:bg-white flex items-center justify-center text-[#111113] transition-colors cursor-pointer"
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-[#1B365D] text-[#1B365D]' : ''}`} />
        </button>

        {/* Subtle Quick-Inspect Action on Hover */}
        <div className="absolute inset-x-0 bottom-0 p-3 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-200">
          <button
            type="button"
            onClick={() => setSelectedProduct(product)}
            className="w-full py-2.5 bg-[#111113]/95 text-white text-xs font-medium tracking-wider uppercase hover:bg-[#1B365D] transition-colors cursor-pointer"
          >
            {soldOut
              ? 'View Edition Details'
              : product.fulfillmentMode === 'BESPOKE_ONLY'
                ? 'Configure Custom Fit'
                : 'Select Size / Custom Fit'}
          </button>
        </div>
      </div>

      {/* Uniform Clean Metadata Block */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <div className="flex items-center gap-1.5 text-[11px] text-[#71717A] tracking-wide">
            <span className="font-mono">{product.categoryCode}</span>
            <span aria-hidden="true">·</span>
            <span className="truncate">{modeSummary}</span>
          </div>
          <button
            type="button"
            onClick={() => setSelectedProduct(product)}
            className="text-left text-[15px] font-semibold text-[#111113] hover:text-[#1B365D] transition-colors mt-1.5 line-clamp-2 cursor-pointer"
          >
            {product.name}
          </button>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-[#F4F4F5]">
          <span className="font-mono text-sm font-medium text-[#111113] tabular-nums">
            {formatMoney(product.priceNGN, currency)}
          </span>
          {/* Textile Swatch Dots Preview */}
          <div className="flex items-center gap-1.5" aria-label="Available textile prints">
            {product.swatches.slice(0, 3).map((sw) => (
              <span
                key={sw.id}
                title={sw.name}
                className="w-3.5 h-3.5 border border-black/20"
                style={{
                  background: `linear-gradient(135deg, ${sw.hexPrimary} 50%, ${sw.hexSecondary} 50%)`,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}

export function HomeView() {
  const {
    products,
    activeCategoryFilter,
    setActiveCategoryFilter,
    activeHomeTab,
    setActiveHomeTab,
    setSelectedProduct,
    setActivePage,
    settings,
  } = useStore();

  const spotlightProduct =
    products.find((p) => p.isSpotlight) || products[0];

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (activeCategoryFilter !== 'ALL' && p.categoryCode !== activeCategoryFilter) {
        return false;
      }
      if (activeHomeTab === 'All') return true;
      if (activeHomeTab === 'Ready-to-Wear') {
        return p.fulfillmentMode === 'RTW_ONLY' || p.fulfillmentMode === 'HYBRID';
      }
      if (activeHomeTab === 'Custom-Available') {
        return p.fulfillmentMode === 'BESPOKE_ONLY' || p.fulfillmentMode === 'HYBRID';
      }
      return p.filterGroups.includes(activeHomeTab);
    });
  }, [products, activeCategoryFilter, activeHomeTab]);

  const activeCategoryObj =
    activeCategoryFilter !== 'ALL'
      ? CATEGORIES.find((c) => c.code === activeCategoryFilter)
      : null;

  const scrollToCatalog = (category?: CategoryCode | 'ALL', tab?: HomeFilterTab) => {
    if (category !== undefined) setActiveCategoryFilter(category);
    if (tab !== undefined) setActiveHomeTab(tab);
    window.setTimeout(() => {
      document
        .getElementById('new-arrivals-catalog')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  return (
    <div>
      {/* 1. Editorial Hero Banner (Full-Bleed Campaign Photography) */}
      <section className="relative w-full min-h-[78vh] lg:min-h-[84vh] flex items-end bg-[#111113] overflow-hidden">
        <img
          src={HERO_IMAGE}
          alt="Josy Textile 2026 Campaign — Midnight Indigo Senator Kaftan and Tailored Ankara Bomber Jacket"
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        {/* Measured Contrast Scrim (>= 4.5:1 text contrast) */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/15" />

        <div className="relative z-10 max-w-[1360px] mx-auto w-full px-4 sm:px-6 lg:px-8 pb-16 sm:pb-20 pt-32">
          <div className="max-w-2xl space-y-6 text-white">
            <p className="text-xs tracking-[0.22em] text-[#E4E4E7] uppercase">
              Josy Textile 2026 · Isoko Road, Ughelli to the World
            </p>
            <h1 className="font-editorial text-4xl sm:text-6xl lg:text-[64px] font-medium leading-[1.06] tracking-tight text-white">
              Authentic African Textiles, Tailored for Modern Presence.
            </h1>
            <p className="text-sm sm:text-base text-[#E4E4E7] leading-relaxed max-w-xl">
              Instant Ready-to-Wear silhouettes in inclusive S–3XL sizing alongside precision made-to-measure Nigerian traditional wears and corporate suiting.
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                type="button"
                onClick={() => scrollToCatalog('ALL', 'Ready-to-Wear')}
                className="px-7 py-3.5 bg-white text-[#111113] text-xs font-semibold tracking-wider uppercase hover:bg-[#F4F4F5] transition-colors whitespace-nowrap cursor-pointer"
              >
                Shop Ready-to-Wear
              </button>
              <button
                type="button"
                onClick={() => {
                  setActivePage('custom-tailoring');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="px-7 py-3.5 border border-white/75 text-white text-xs font-semibold tracking-wider uppercase hover:bg-white hover:text-[#111113] transition-colors whitespace-nowrap cursor-pointer"
              >
                Order Custom Fit
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Brand Pillar Kinetic Marquee */}
      <div className="bg-[#111113] text-[#E4E4E7] border-y border-[#27272A] py-3.5 overflow-hidden">
        <div className="animate-josy-marquee flex items-center gap-10 text-xs tracking-[0.18em] uppercase">
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, idx) => (
            <span key={idx} className="flex items-center gap-10 whitespace-nowrap shrink-0">
              <span>{item}</span>
              <span className="text-[#B48436]" aria-hidden="true">
                ·
              </span>
            </span>
          ))}
        </div>
      </div>

      {/* 3. Spotlight Collection Block (Balanced 2-Column Editorial Split) */}
      <section className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch bg-white border border-[#E4E4E0]">
          <div className="lg:col-span-6 overflow-hidden bg-[#F2F2F0] min-h-[380px]">
            <img
              src={IMG_BOMBER}
              alt="The Heritage & Ankara Bomber Collection"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-top"
            />
          </div>
          <div className="lg:col-span-6 p-8 sm:p-12 lg:p-14 flex flex-col justify-center space-y-6">
            <p className="text-xs text-[#71717A] tracking-[0.18em] uppercase">
              Seasonal Capsule Spotlight
            </p>
            <h2 className="font-editorial text-4xl sm:text-5xl font-medium text-[#111113] leading-tight">
              The Heritage & Ankara Bomber Collection
            </h2>
            <p className="text-sm sm:text-base text-[#52525B] leading-relaxed">
              Structured outerwear pairing authentic waxed cotton Ankara with water-repellent matte obsidian twill. Order in-stock sizes S–3XL for 24–48 hour dispatch, or toggle Custom Fit on the product page for exact shoulder and sleeve tailoring.
            </p>
            <div className="grid grid-cols-2 gap-6 py-4 border-y border-[#E4E4E0] text-xs">
              <div>
                <p className="text-[#71717A]">Fulfillment Modes</p>
                <p className="font-medium text-[#111113] mt-1">Hybrid RTW + Luxury</p>
              </div>
              <div>
                <p className="text-[#71717A]">Fabric Provenance</p>
                <p className="font-medium text-[#111113] mt-1">Waxed Ankara & Woven Kente</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => spotlightProduct && setSelectedProduct(spotlightProduct)}
                className="px-6 py-3.5 bg-[#111113] text-white text-xs font-medium tracking-wider uppercase hover:bg-[#1B365D] transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer"
              >
                <span>Shop Reversible Bomber</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => scrollToCatalog('02', 'All')}
                className="text-xs font-medium text-[#111113] underline underline-offset-4 hover:text-[#1B365D] cursor-pointer"
              >
                Browse Category 02
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Numbered Category Grid Architecture (01–09) */}
      <section className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E4E4E0] pb-6">
          <div>
            <p className="text-xs text-[#71717A] tracking-[0.18em] uppercase">
              Complete Garment Architecture
            </p>
            <h2 className="font-editorial text-4xl font-medium text-[#111113] mt-1">
              Explore All Nine Lines (01–09)
            </h2>
          </div>
          <p className="text-xs text-[#52525B] max-w-md">
            Select any category below to filter the storefront catalog across Ready-to-Wear essentials, Nigerian heritage silhouettes, and corporate suiting.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {CATEGORIES.map((cat) => {
            const isSelected = activeCategoryFilter === cat.code;
            return (
              <button
                key={cat.code}
                type="button"
                onClick={() => scrollToCatalog(cat.code, 'All')}
                className={`group text-left bg-white border transition-all duration-200 flex items-stretch overflow-hidden cursor-pointer ${
                  isSelected
                    ? 'border-[#1B365D] ring-1 ring-[#1B365D]'
                    : 'border-[#E4E4E0] hover:border-[#111113]'
                }`}
              >
                <div className="w-28 sm:w-32 shrink-0 bg-[#F2F2F0] overflow-hidden">
                  <img
                    src={cat.image}
                    alt={cat.name}
                    referrerPolicy="no-referrer"
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="font-mono text-xs text-[#B48436] font-medium tabular-nums">
                      {cat.code}.
                    </span>
                    <h3 className="text-sm font-semibold text-[#111113] group-hover:text-[#1B365D] transition-colors mt-1">
                      {cat.name}
                    </h3>
                    <p className="text-xs text-[#71717A] mt-1.5 leading-relaxed line-clamp-2">
                      {cat.scope}
                    </p>
                  </div>
                  <span className="text-[11px] font-medium text-[#27272A] mt-3 inline-flex items-center gap-1 group-hover:text-[#1B365D]">
                    <span>Explore line</span>
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 5. Tabbed New Arrivals & Shop Catalog Grid */}
      <section
        id="new-arrivals-catalog"
        className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-20 space-y-8 scroll-mt-24"
      >
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-[#E4E4E0] pb-6">
          <div>
            <p className="text-xs text-[#71717A] tracking-[0.18em] uppercase">
              {activeCategoryObj
                ? `Category ${activeCategoryObj.code} · Filtered View`
                : 'Josy Textile 2026 Storefront'}
            </p>
            <h2 className="font-editorial text-4xl font-medium text-[#111113] mt-1">
              {activeCategoryObj ? activeCategoryObj.name : 'New Arrivals & Core Collection'}
            </h2>
            {activeCategoryObj && (
              <button
                type="button"
                onClick={() => setActiveCategoryFilter('ALL')}
                className="text-xs text-[#1B365D] hover:underline mt-2 cursor-pointer"
              >
                Reset category filter — show all 01–09 garments
              </button>
            )}
          </div>

          {/* Functional Segmented Filter Tabs */}
          <div className="flex items-center gap-1 p-1 bg-[#F2F2F0] border border-[#E4E4E0] overflow-x-auto">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveHomeTab(tab)}
                className={`px-3.5 py-2 text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  activeHomeTab === tab
                    ? 'bg-[#111113] text-white'
                    : 'text-[#52525B] hover:text-[#111113]'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="bg-white border border-[#E4E4E0] p-12 text-center space-y-3">
            <p className="font-editorial text-2xl text-[#111113]">
              No garments match this filter combination
            </p>
            <button
              type="button"
              onClick={() => {
                setActiveCategoryFilter('ALL');
                setActiveHomeTab('All');
              }}
              className="px-5 py-2.5 bg-[#111113] text-white text-xs font-medium cursor-pointer"
            >
              Show All Garments
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* 6. Bespoke Tailoring Explainer ("How Custom Fit Works") */}
      <section className="bg-[#111113] text-white py-20">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-[#27272A] pb-8">
            <div className="max-w-2xl">
              <p className="text-xs text-[#B48436] tracking-[0.2em] uppercase">
                Isoko Road Atelier · Luxury Process
              </p>
              <h2 className="font-editorial text-4xl sm:text-5xl font-medium text-white mt-2">
                How Custom Fit Works
              </h2>
            </div>
            <button
              type="button"
              onClick={() => {
                setActivePage('custom-tailoring');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-6 py-3.5 bg-white text-[#111113] text-xs font-semibold tracking-wider uppercase hover:bg-[#E4E4E7] transition-colors whitespace-nowrap self-start lg:self-auto cursor-pointer"
            >
              Launch Measurement Engine
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="border-t border-[#3F3F46] pt-6 space-y-3">
              <p className="font-mono text-xs text-[#B48436]">01</p>
              <h3 className="font-editorial text-2xl font-medium text-white">
                Select Your Style & Authentic Textile Print
              </h3>
              <p className="text-sm text-[#A1A1AA] leading-relaxed">
                Choose from Senator wear, grand three-piece Agbada, Owambe Aso-Oke couture, tailored corporate suits, or reversible Ankara bombers—with live fabric swatches and cut options.
              </p>
            </div>
            <div className="border-t border-[#3F3F46] pt-6 space-y-3">
              <p className="font-mono text-xs text-[#B48436]">02</p>
              <h3 className="font-editorial text-2xl font-medium text-white">
                Enter or Reuse Your Saved Body Measurements
              </h3>
              <p className="text-sm text-[#A1A1AA] leading-relaxed">
                Use our interactive visual measurement drawer in inches or centimeters, upload reference photos, and save named profiles like &ldquo;My Corporate Suit Fit&rdquo; for one-click repeat orders.
              </p>
            </div>
            <div className="border-t border-[#3F3F46] pt-6 space-y-3">
              <p className="font-mono text-xs text-[#B48436]">03</p>
              <h3 className="font-editorial text-2xl font-medium text-white">
                Hand-Tailored in Ughelli & Delivered Worldwide
              </h3>
              <p className="text-sm text-[#A1A1AA] leading-relaxed">
                Cut, sewn, embroidered, and inspected at our Isoko Road studio in {settings.bespokeLeadWindow}. Track every milestone from Fabric Cutting to Quality Control with optional 60/40 split deposit.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Brand Story & Four Trust Guarantees */}
      <section className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-20 space-y-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
          <div className="lg:col-span-5 overflow-hidden bg-[#F2F2F0] min-h-[360px]">
            <img
              src={IMG_AGBADA}
              alt="Josy Textile Heritage Craftsmanship — Embroidered Ivory Agbada"
              referrerPolicy="no-referrer"
              loading="lazy"
              className="w-full h-full object-cover object-top"
            />
          </div>
          <div className="lg:col-span-7 flex flex-col justify-center space-y-6">
            <p className="text-xs text-[#71717A] tracking-[0.18em] uppercase">
              Founded in Ughelli, Delta State
            </p>
            <h2 className="font-editorial text-4xl sm:text-5xl font-medium text-[#111113] leading-tight">
              From Isoko Road to Global Wardrobes
            </h2>
            <p className="text-sm sm:text-base text-[#52525B] leading-relaxed">
              Founded by CEO <strong className="text-[#111113] font-semibold">Joseph Odehwingie</strong> in Ughelli, Delta State, Josy Textile bridges the immediacy of modern Afro-urban ready-to-wear with the ceremonial precision of master Nigerian luxury tailoring. Whether dispatching locally across Warri, Asaba, Port Harcourt, Lagos, and Abuja, or shipping express to the global diaspora, every seam honors authentic African textile heritage.
            </p>
            <div>
              <button
                type="button"
                onClick={() => {
                  setActivePage('story');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="text-xs font-semibold text-[#111113] uppercase tracking-wider border-b border-[#111113] pb-1 hover:text-[#1B365D] hover:border-[#1B365D] transition-colors cursor-pointer"
              >
                Read Our Founding Story
              </button>
            </div>
          </div>
        </div>

        {/* Four Architectural Trust Guarantees (No Pill Spam / No Decorative Dots) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-10 border-t border-[#E4E4E0]">
          <div className="space-y-1.5">
            <p className="font-mono text-[11px] text-[#71717A]">01</p>
            <h3 className="text-sm font-semibold text-[#111113]">Culture-First Design</h3>
            <p className="text-xs text-[#52525B] leading-relaxed">
              Rooted in Delta State & Nigerian sartorial tradition, refined for contemporary daily wear.
            </p>
          </div>
          <div className="space-y-1.5">
            <p className="font-mono text-[11px] text-[#71717A]">02</p>
            <h3 className="text-sm font-semibold text-[#111113]">Authentic Fabrics & Textiles</h3>
            <p className="text-xs text-[#52525B] leading-relaxed">
              Verified waxed Ankara, hand-dyed Adire, hand-loomed Aso-Oke, and tropical wool suiting.
            </p>
          </div>
          <div className="space-y-1.5">
            <p className="font-mono text-[11px] text-[#71717A]">03</p>
            <h3 className="text-sm font-semibold text-[#111113]">Inclusive S–3XL + Custom Sizing</h3>
            <p className="text-xs text-[#52525B] leading-relaxed">
              In-stock standard proportions alongside individual body-metric pattern drafting.
            </p>
          </div>
          <div className="space-y-1.5">
            <p className="font-mono text-[11px] text-[#71717A]">04</p>
            <h3 className="text-sm font-semibold text-[#111113]">Secure Local & Global Checkout</h3>
            <p className="text-xs text-[#52525B] leading-relaxed">
              Pay in NGN, USD, GBP, or EUR via Paystack, Flutterwave, and Stripe with tracked delivery.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
