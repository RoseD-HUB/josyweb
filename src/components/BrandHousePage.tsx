import React, { useState } from 'react';
import {
  ArrowRight,
  Compass,
  Mail,
  MapPin,
  Phone,
  Scissors,
  Sparkles,
  User as UserIcon,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { JosyLogo } from './JosyLogo';

const CREST_SYMBOLS = [
  {
    id: 'diamond',
    label: '01 · Woven Diamond Frame',
    title: 'West African Loom Geometry',
    description:
      'The inner diamond outline honors traditional Aso-Oke and Urhobo ceremonial weaving patterns—framing every garment with cultural permanence.',
  },
  {
    id: 'monogram',
    label: '02 · Interlocking J & T',
    title: 'Sculpted Tailoring Architecture',
    description:
      'Midnight Indigo J and Obsidian T lock together like crisp lapel geometry, symbolizing the union of contemporary Ready-to-Wear and Luxury Made-to-Measure.',
  },
  {
    id: 'stitch',
    label: '03 · Golden Stitch Axis',
    title: 'Master Needle Precision',
    description:
      'The dashed burnished-brass thread and central knot cutting horizontally across the crest represent our 18-point Quality Control standard at Isoko Road.',
  },
  {
    id: 'corners',
    label: '04 · Four Corner Anchors',
    title: 'Ughelli to Four Continents',
    description:
      'Four brass corner anchors symbolize our flagship atelier in Delta State serving clients across Nigeria, the United Kingdom, North America, and Europe.',
  },
];

export function BrandHousePage() {
  const { setActivePage, setActiveCategoryFilter, setActiveHomeTab } = useStore();
  const [activeSymbolId, setActiveSymbolId] = useState(CREST_SYMBOLS[0].id);

  const activeSymbol =
    CREST_SYMBOLS.find((s) => s.id === activeSymbolId) || CREST_SYMBOLS[0];

  const jumpTo = (page: Parameters<typeof setActivePage>[0]) => {
    if (page === 'home') {
      setActiveCategoryFilter('ALL');
      setActiveHomeTab('All');
    }
    setActivePage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-14">
      {/* Brand Identity Showcase Banner */}
      <section className="bg-[#111113] text-white p-8 sm:p-12 border border-[#27272A] grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        <div className="lg:col-span-7 space-y-6">
          <p className="text-xs text-[#D4AF37] tracking-[0.22em] uppercase">
            The House of Josy Textile · Brand Identity &amp; Directory
          </p>
          <JosyLogo variant="dark" size="xl" showTagline />
          <p className="text-sm sm:text-base text-[#D4D4D8] leading-relaxed max-w-2xl">
            Founded by CEO <strong className="text-white">Joseph Odehwingie</strong> on Isoko Road, Ughelli, Delta State. Every crest, stitch, and silhouette represents our commitment to authentic African textiles tailored for the modern global wardrobe.
          </p>
          <div className="flex flex-wrap gap-4 pt-2 text-xs font-mono text-[#A1A1AA]">
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#D4AF37]" />
              Isoko Road, Ughelli, Delta State
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-[#D4AF37]" />
              07032802844
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-[#D4AF37]" />
              josephwingie@gmail.com
            </span>
          </div>
        </div>

        {/* Interactive Crest Symbolism Explorer */}
        <div className="lg:col-span-5 bg-[#18181B] border border-[#27272A] p-6 space-y-4">
          <p className="text-xs font-mono text-[#D4AF37] uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Interactive Crest Anatomy</span>
          </p>
          <div className="grid grid-cols-1 gap-2">
            {CREST_SYMBOLS.map((sym) => {
              const selected = sym.id === activeSymbol.id;
              return (
                <button
                  key={sym.id}
                  type="button"
                  onClick={() => setActiveSymbolId(sym.id)}
                  className={`px-3.5 py-2.5 text-left text-xs font-medium border transition-colors cursor-pointer ${
                    selected
                      ? 'border-[#D4AF37] bg-[#111113] text-white'
                      : 'border-[#27272A] text-[#A1A1AA] hover:text-white hover:border-[#52525B]'
                  }`}
                >
                  {sym.label}
                </button>
              );
            })}
          </div>
          <div className="pt-3 border-t border-[#27272A] space-y-1.5">
            <h2 className="font-editorial text-2xl font-medium text-white">
              {activeSymbol.title}
            </h2>
            <p className="text-xs text-[#D4D4D8] leading-relaxed">
              {activeSymbol.description}
            </p>
          </div>
        </div>
      </section>

      {/* Interactive House Navigation Index */}
      <section className="space-y-6">
        <div>
          <p className="text-xs text-[#71717A] tracking-[0.18em] uppercase">
            Interactive Atelier Index
          </p>
          <h2 className="font-editorial text-3xl sm:text-4xl font-medium text-[#111113] mt-1">
            Explore Every Wing of Josy Textile
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            {
              page: 'home' as const,
              icon: Compass,
              tag: '01 · Storefront',
              title: 'Home & 9-Line Catalog',
              desc: 'Browse Ready-to-Wear S–3XL drops and luxury hybrid silhouettes.',
            },
            {
              page: 'custom-tailoring' as const,
              icon: Scissors,
              tag: '02 · Atelier',
              title: 'Custom Tailoring Studio',
              desc: 'Compare tailoring disciplines, 6-stage workflow & fit estimator.',
            },
            {
              page: 'story' as const,
              icon: Sparkles,
              tag: '03 · Heritage',
              title: 'Our Story & Textiles',
              desc: 'Read our Ughelli chapters and inspect our West African fabric library.',
            },
            {
              page: 'account' as const,
              icon: UserIcon,
              tag: '04 · Client Hub',
              title: 'My Account & Tracker',
              desc: 'Create a buyer account, track orders, and store new measurements.',
            },
          ].map((card) => {
            const Icon = card.icon;
            return (
              <button
                key={card.page}
                type="button"
                onClick={() => jumpTo(card.page)}
                className="bg-white border border-[#E4E4E0] p-6 text-left hover:border-[#111113] transition-colors flex flex-col justify-between space-y-5 group cursor-pointer"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] text-[#71717A]">{card.tag}</span>
                    <Icon className="w-4 h-4 text-[#1B365D]" />
                  </div>
                  <h3 className="font-editorial text-2xl font-medium text-[#111113] group-hover:text-[#1B365D] transition-colors">
                    {card.title}
                  </h3>
                  <p className="text-xs text-[#52525B] leading-relaxed">{card.desc}</p>
                </div>
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#111113] group-hover:text-[#1B365D]">
                  <span>Open Page</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
