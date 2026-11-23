import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Calendar,
  Check,
  ChevronDown,
  Clock,
  Copy,
  Mail,
  MapPin,
  Phone,
  Ruler,
  Scissors,
  Sparkles,
  Truck,
  Video,
} from 'lucide-react';
import {
  formatMoney,
  IMG_AFRO_CASUAL,
  IMG_AGBADA,
  IMG_OWAMBE,
  IMG_SENATOR,
  IMG_SUIT,
  SHIPPING_ZONES,
} from '../data/catalog';
import { useStore } from '../context/StoreContext';
import { MeasurementDrawer } from './MeasurementDrawer';

/* ============================================================================
 * PAGE 1: CUSTOM TAILORING — Interactive Luxury Commission Studio
 * Distinct interactive tools:
 * 1. Occasion & Discipline Selector (Ceremonial Agbada, Senator, Owambe, Corporate)
 * 2. Interactive 6-Stage Atelier Craft Pipeline Explorer
 * 3. Instant Fit & Sizing Recommendation Calculator (in / cm)
 * ========================================================================== */

const TAILORING_DISCIPLINES = [
  {
    id: 'agbada',
    title: 'Ceremonial Grand Agbada',
    subtitle: '3-Piece Hand-Embroidered Heritage Set',
    leadTime: '12–16 business days',
    fabricWeight: 'Heavy Damask / Hand-Loomed Aso-Oke',
    embroidery: 'Multi-pass metallic & tonal geometric chest sculpture',
    image: IMG_AGBADA,
    highlights: [
      'Individually drafted drape ratio matched to shoulder span & height',
      'Hand-finished inner neck facing & reinforced wing hems',
      'Matching Sokoto trousers + inner Buba cut to your ease preference',
    ],
    productId: 'jt-agbada-01',
  },
  {
    id: 'senator',
    title: 'Executive Senator Kaftan',
    subtitle: 'Architectural Modern Nigerian Menswear',
    leadTime: '10–12 business days',
    fabricWeight: 'Breathable Italian Cashmere Wool & Suiting',
    embroidery: 'Minimalist tonal placket stitch & concealed cuff hardware',
    image: IMG_SENATOR,
    highlights: [
      'Sharp structured collar engineered to hold shape in humid climates',
      'Precision-tapered trousers with clean ankle break',
      'Available in long-sleeve French cuff or relaxed short-sleeve cut',
    ],
    productId: 'jt-senator-01',
  },
  {
    id: 'owambe',
    title: 'Owambe & Aso-Ebi Couture',
    subtitle: 'Sculptural Corseted Iro, Buba & Gowns',
    leadTime: '12–14 business days',
    fabricWeight: 'Hand-Woven Metallic Aso-Oke & Silk Brocade',
    embroidery: 'Beaded trim work & structured bustier boning',
    image: IMG_OWAMBE,
    highlights: [
      'Internal couture boning sculpted to your exact waist-to-hip ratio',
      'Coordinated group Aso-Ebi shade matching for bridal trains',
      'Custom sleeve drama: bell, cape, or architectural off-shoulder',
    ],
    productId: 'jt-owambe-01',
  },
  {
    id: 'corporate',
    title: 'Executive 3-Piece Suiting',
    subtitle: 'Half-Canvas Boardroom Tailoring',
    leadTime: '10–14 business days',
    fabricWeight: 'Super 130s Virgin Wool with Ankara Silk Lining',
    embroidery: 'Custom monogram inside chest pocket & pick-stitched lapels',
    image: IMG_SUIT,
    highlights: [
      'Natural shoulder construction with floating horsehair chest canvas',
      'Signature Josy Textile wax-print inner lining for quiet heritage',
      'High-waisted double-pleat or flat-front trouser silhouette',
    ],
    productId: 'jt-suit-01',
  },
];

const CRAFT_STAGES = [
  {
    step: '01',
    title: 'Measurement Verification',
    duration: 'Day 1',
    detail:
      'Our Lead Pattern Cutter reviews all nine body dimensions, checks posture ease allowances, and flags any asymmetry before scissors touch cloth.',
  },
  {
    step: '02',
    title: 'Chalk Pattern Drafting',
    duration: 'Days 2–3',
    detail:
      'A personal paper & chalk block is drafted from scratch at our Isoko Road cutting table—never pulled from generic factory templates.',
  },
  {
    step: '03',
    title: 'Hand-Cutting & Interfacing',
    duration: 'Days 4–5',
    detail:
      'Selected textiles are pre-steamed, aligned along print motifs, hand-cut, and fused with breathable cotton canvas interfacing.',
  },
  {
    step: '04',
    title: 'Tailoring & Embroidery',
    duration: 'Days 6–9',
    detail:
      'Master tailors assemble structural seams while our embroidery specialists execute geometric chest plackets or couture beadwork.',
  },
  {
    step: '05',
    title: '18-Point Quality Control',
    duration: 'Days 10–11',
    detail:
      'Every buttonhole, seam tension, lining hang, and steam press is checked against your Job Card before final clearance.',
  },
  {
    step: '06',
    title: 'Garment Bag & Dispatch',
    duration: 'Days 12–14',
    detail:
      'Packed in a breathable cotton Josy Textile garment cover for Ughelli studio pickup, nationwide courier, or DHL Express worldwide.',
  },
];

export function CustomTailoringPage() {
  const { products, currency, settings, setSelectedProduct, setActivePage } = useStore();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeDisciplineId, setActiveDisciplineId] = useState(TAILORING_DISCIPLINES[0].id);
  const [activeStageIdx, setActiveStageIdx] = useState(0);

  // Interactive Fit Estimator state
  const [unit, setUnit] = useState<'in' | 'cm'>('in');
  const [chestVal, setChestVal] = useState<number>(40);
  const [waistVal, setWaistVal] = useState<number>(34);

  const activeDiscipline =
    TAILORING_DISCIPLINES.find((d) => d.id === activeDisciplineId) || TAILORING_DISCIPLINES[0];

  const matchedProduct = products.find((p) => p.id === activeDiscipline.productId);

  const fitRecommendation = useMemo(() => {
    const chestIn = unit === 'cm' ? chestVal / 2.54 : chestVal;
    const waistIn = unit === 'cm' ? waistVal / 2.54 : waistVal;
    const drop = chestIn - waistIn;

    let rtwSize = 'M';
    if (chestIn < 37) rtwSize = 'S';
    else if (chestIn < 40) rtwSize = 'M';
    else if (chestIn < 43) rtwSize = 'L';
    else if (chestIn < 46) rtwSize = 'XL';
    else if (chestIn < 50) rtwSize = '2XL';
    else rtwSize = '3XL';

    const needsCustom = drop >= 7.5 || drop <= 2.5;
    return {
      rtwSize,
      chestIn: Math.round(chestIn * 10) / 10,
      waistIn: Math.round(waistIn * 10) / 10,
      needsCustom,
      note: needsCustom
        ? 'Your chest-to-waist taper benefits significantly from Luxury Made-to-Measure cutting so shoulders drape cleanly without waist bunching.'
        : `You sit comfortably near Josy Textile RTW Size ${rtwSize}, with Luxury Custom Tailoring ideal for ceremonial length & sleeve precision.`,
    };
  }, [unit, chestVal, waistVal]);

  return (
    <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-16">
      {/* Section 1: Interactive Tailoring Discipline Selector */}
      <section className="space-y-8 border-b border-[#E4E4E0] pb-14">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <p className="text-xs text-[#71717A] tracking-[0.2em] uppercase">
              Interactive Commission Studio · Isoko Road, Ughelli
            </p>
            <h1 className="font-editorial text-4xl sm:text-6xl font-medium text-[#111113] leading-[1.06]">
              Explore Our Four Tailoring Disciplines
            </h1>
            <p className="text-sm sm:text-base text-[#52525B] leading-relaxed">
              Select a silhouette below to inspect cloth architecture, handwork specifications, turnaround window, and configure your commission directly.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="px-5 py-3 bg-[#111113] text-white text-xs font-medium tracking-wider uppercase hover:bg-[#1B365D] transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Ruler className="w-4 h-4" />
              <span>Record 9-Point Measurements</span>
            </button>
            <button
              type="button"
              onClick={() => setActivePage('account')}
              className="px-5 py-3 border border-[#111113] text-[#111113] text-xs font-medium tracking-wider uppercase hover:bg-[#111113] hover:text-white transition-colors cursor-pointer"
            >
              My Account &amp; Tracker
            </button>
          </div>
        </div>

        {/* Interactive Discipline Tabs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {TAILORING_DISCIPLINES.map((disc) => {
            const selected = disc.id === activeDiscipline.id;
            return (
              <button
                key={disc.id}
                type="button"
                onClick={() => setActiveDisciplineId(disc.id)}
                className={`p-4 text-left border transition-colors cursor-pointer ${
                  selected
                    ? 'border-[#111113] bg-[#111113] text-white'
                    : 'border-[#E4E4E0] bg-white text-[#111113] hover:border-[#111113]'
                }`}
              >
                <p className="text-sm font-semibold">{disc.title}</p>
                <p
                  className={`text-[11px] mt-1 ${selected ? 'text-[#D4D4D8]' : 'text-[#71717A]'}`}
                >
                  {disc.leadTime}
                </p>
              </button>
            );
          })}
        </div>

        {/* Active Discipline Interactive Showcase */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 bg-white border border-[#E4E4E0] p-6 sm:p-8 items-stretch">
          <div className="lg:col-span-5 overflow-hidden bg-[#F2F2F0] min-h-[360px]">
            <img
              src={activeDiscipline.image}
              alt={activeDiscipline.title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-top"
            />
          </div>
          <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div>
                <p className="text-xs font-mono uppercase tracking-wider text-[#B48436]">
                  {activeDiscipline.subtitle}
                </p>
                <h2 className="font-editorial text-3xl sm:text-4xl font-medium text-[#111113] mt-1">
                  {activeDiscipline.title}
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-4 border-y border-[#E4E4E0] text-xs">
                <div>
                  <p className="text-[#71717A]">Atelier Lead Time</p>
                  <p className="font-medium text-[#111113] mt-0.5">{activeDiscipline.leadTime}</p>
                </div>
                <div>
                  <p className="text-[#71717A]">Signature Textile</p>
                  <p className="font-medium text-[#111113] mt-0.5">{activeDiscipline.fabricWeight}</p>
                </div>
                <div>
                  <p className="text-[#71717A]">Payment Structure</p>
                  <p className="font-medium text-[#1B365D] mt-0.5">
                    {settings.splitDepositEnabled ? '60% Deposit / 40% QC' : '100% Upfront'}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#111113]">
                  Handwork &amp; Finish Details
                </p>
                <p className="text-sm text-[#52525B]">{activeDiscipline.embroidery}</p>
                <ul className="space-y-2 pt-2">
                  {activeDiscipline.highlights.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm text-[#27272A]">
                      <Check className="w-4 h-4 text-[#B48436] shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-[#E4E4E0]">
              {matchedProduct && (
                <div>
                  <p className="text-[11px] text-[#71717A]">Starting Luxury Commission</p>
                  <p className="font-mono text-lg font-semibold text-[#111113] tabular-nums">
                    {formatMoney(
                      matchedProduct.priceNGN + matchedProduct.bespokeSurchargeNGN,
                      currency
                    )}
                  </p>
                </div>
              )}
              <div className="flex flex-wrap gap-3">
                {matchedProduct && (
                  <button
                    type="button"
                    onClick={() => setSelectedProduct(matchedProduct)}
                    className="px-6 py-3 bg-[#1B365D] text-white text-xs font-medium tracking-wider uppercase hover:bg-[#111113] transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <span>Configure &amp; Order This Silhouette</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Interactive 6-Stage Atelier Craft Pipeline */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <p className="text-xs text-[#71717A] tracking-[0.18em] uppercase">
              Inside Our Ughelli Workshop
            </p>
            <h2 className="font-editorial text-3xl sm:text-4xl font-medium text-[#111113] mt-1">
              Click Any Stage of the 6-Step Tailoring Process
            </h2>
          </div>
          <span className="text-xs font-mono text-[#1B365D]">
            Queue Status: {settings.bespokeCapacityOpen ? 'Open for Commissions' : 'Peak Waitlist'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {CRAFT_STAGES.map((stage, index) => {
            const active = index === activeStageIdx;
            return (
              <button
                key={stage.step}
                type="button"
                onClick={() => setActiveStageIdx(index)}
                className={`p-4 text-left border transition-colors cursor-pointer ${
                  active
                    ? 'border-[#1B365D] bg-[#1B365D] text-white'
                    : 'border-[#E4E4E0] bg-white text-[#27272A] hover:border-[#1B365D]'
                }`}
              >
                <p className="font-mono text-[11px] opacity-75">{stage.step}</p>
                <p className="text-xs font-semibold mt-1 leading-snug">{stage.title}</p>
              </button>
            );
          })}
        </div>

        <div className="bg-white border border-[#E4E4E0] p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-3 text-xs font-mono text-[#B48436]">
              <span>STAGE {CRAFT_STAGES[activeStageIdx].step}</span>
              <span>·</span>
              <span>{CRAFT_STAGES[activeStageIdx].duration}</span>
            </div>
            <h3 className="font-editorial text-2xl sm:text-3xl font-medium text-[#111113]">
              {CRAFT_STAGES[activeStageIdx].title}
            </h3>
            <p className="text-sm text-[#52525B] leading-relaxed">
              {CRAFT_STAGES[activeStageIdx].detail}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() =>
                setActiveStageIdx((prev) => (prev - 1 + CRAFT_STAGES.length) % CRAFT_STAGES.length)
              }
              className="px-4 py-2 border border-[#D4D4D8] text-xs font-medium hover:border-[#111113] cursor-pointer"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => setActiveStageIdx((prev) => (prev + 1) % CRAFT_STAGES.length)}
              className="px-4 py-2 bg-[#111113] text-white text-xs font-medium hover:bg-[#1B365D] cursor-pointer"
            >
              Next Stage
            </button>
          </div>
        </div>
      </section>

      {/* Section 3: Interactive Quick Fit Estimator */}
      <section className="bg-[#111113] text-white p-8 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        <div className="lg:col-span-6 space-y-4">
          <p className="text-xs text-[#D4AF37] tracking-[0.2em] uppercase flex items-center gap-2">
            <Scissors className="w-3.5 h-3.5" />
            <span>Interactive Fit Recommendation Tool</span>
          </p>
          <h2 className="font-editorial text-3xl sm:text-4xl font-medium">
            Should You Choose RTW or Custom-Tailored?
          </h2>
          <p className="text-sm text-[#D4D4D8] leading-relaxed">
            Adjust your chest/bust and waist measurements below to calculate your ideal Josy Textile RTW size or check whether a custom pattern block will elevate your silhouette.
          </p>

          <div className="inline-flex border border-[#3F3F46] p-1 bg-[#18181B]">
            {(['in', 'cm'] as const).map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => {
                  if (u === unit) return;
                  if (u === 'cm') {
                    setChestVal(Math.round(chestVal * 2.54));
                    setWaistVal(Math.round(waistVal * 2.54));
                  } else {
                    setChestVal(Math.round((chestVal / 2.54) * 10) / 10);
                    setWaistVal(Math.round((waistVal / 2.54) * 10) / 10);
                  }
                  setUnit(u);
                }}
                className={`px-4 py-1.5 text-xs font-mono cursor-pointer ${
                  unit === u ? 'bg-white text-[#111113] font-semibold' : 'text-[#A1A1AA]'
                }`}
              >
                {u === 'in' ? 'Inches (in)' : 'Centimeters (cm)'}
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-6 bg-[#18181B] border border-[#27272A] p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="space-y-1.5 text-xs">
              <span className="text-[#A1A1AA]">
                Chest / Bust ({unit}) — <strong className="text-white font-mono">{chestVal}</strong>
              </span>
              <input
                type="range"
                min={unit === 'in' ? 32 : 81}
                max={unit === 'in' ? 56 : 142}
                step={unit === 'in' ? 0.5 : 1}
                value={chestVal}
                onChange={(e) => setChestVal(Number(e.target.value))}
                className="w-full accent-[#D4AF37]"
              />
            </label>
            <label className="space-y-1.5 text-xs">
              <span className="text-[#A1A1AA]">
                Natural Waist ({unit}) — <strong className="text-white font-mono">{waistVal}</strong>
              </span>
              <input
                type="range"
                min={unit === 'in' ? 24 : 61}
                max={unit === 'in' ? 50 : 127}
                step={unit === 'in' ? 0.5 : 1}
                value={waistVal}
                onChange={(e) => setWaistVal(Number(e.target.value))}
                className="w-full accent-[#D4AF37]"
              />
            </label>
          </div>

          <div className="p-4 border border-[#3F3F46] bg-[#111113] space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-mono text-[#D4AF37]">
                RECOMMENDED FIT: {fitRecommendation.needsCustom ? 'LUXURY MADE-TO-MEASURE' : `RTW SIZE ${fitRecommendation.rtwSize} OR CUSTOM`}
              </span>
              <span className="text-[11px] font-mono text-[#A1A1AA]">
                {fitRecommendation.chestIn}&quot; Chest · {fitRecommendation.waistIn}&quot; Waist
              </span>
            </div>
            <p className="text-xs text-[#D4D4D8] leading-relaxed">{fitRecommendation.note}</p>
          </div>

          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="w-full py-3 bg-white text-[#111113] text-xs font-semibold uppercase tracking-wider hover:bg-[#E4E4E7] transition-colors cursor-pointer"
          >
            Open Full 9-Point Body Measurement Sheet
          </button>
        </div>
      </section>

      <MeasurementDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Create & Save Body Measurement Profile"
        submitLabel="Save Measurement Profile"
        defaultSaveProfile={true}
        onConfirm={() => {
          setDrawerOpen(false);
        }}
      />
    </div>
  );
}

/* ============================================================================
 * PAGE 2: OUR STORY — Interactive Heritage Chapters, Textile Library & Logistics
 * Completely distinct content from Home and Custom Tailoring
 * ========================================================================== */

const STORY_CHAPTERS = [
  {
    code: '01',
    title: 'Founding Vision',
    heading: 'Joseph Odehwingie & the Delta Tailoring Renaissance',
    body: 'Founded by CEO Joseph Odehwingie in Ughelli, Delta State, Josy Textile began with a singular conviction: West African garments should command the same architectural precision, stitch density, and international logistics reliability as Milan or Savile Row—without losing the warmth of Nigerian heritage.',
    statLabel: 'Founded Headquarters',
    statValue: 'Isoko Road, Ughelli',
  },
  {
    code: '02',
    title: 'The Ughelli Atelier',
    heading: 'One Roof for Contemporary RTW & Master Tailoring',
    body: 'Rather than outsourcing production across anonymous factories, every Josy Textile piece passes through our Isoko Road studio. Our cutting floor separates daily S–3XL ready-to-wear batches from dedicated luxury tailoring benches handling hand-embroidered Agbada, Senator kaftans, and corporate suiting.',
    statLabel: 'Quality Benchmark',
    statValue: '18-Point Studio QC',
  },
  {
    code: '03',
    title: 'Authentic Textiles',
    heading: 'Direct Mill Partnerships & Hand-Loomed Sourcing',
    body: 'We source heavyweight wax-resist Ankara, loom-woven Aso-Oke, ceremonial velvet Isiagu, and Super 130s breathable cashmere wool directly from trusted weavers and fabric merchants—testing colorfastness and drape before any roll enters our archive.',
    statLabel: 'Core Garment Lines',
    statValue: '9 Curated Collections',
  },
  {
    code: '04',
    title: 'Global Diaspora',
    heading: 'From Delta State to London, Houston & Toronto',
    body: 'Through multi-currency checkout (NGN, USD, GBP, EUR), virtual body measurement consultations, and tracked DHL Express corridors, Josy Textile outfits weddings, diplomatic galas, and executive wardrobes across four continents.',
    statLabel: 'Delivery Network',
    statValue: 'Nigeria & Worldwide',
  },
];

const TEXTILE_ARCHIVE = [
  {
    id: 'aso-oke',
    name: 'Hand-Woven Metallic Aso-Oke',
    origin: 'Southwestern Nigerian Master Looms',
    weight: '340 GSM · Structured Drape',
    care: 'Dry clean only; store folded in breathable cotton bag',
    idealFor: 'Grand Agbada, Owambe Corset Gowns, Bridal Iro & Buba',
    colors: ['#1B365D', '#B48436', '#111113'],
  },
  {
    id: 'cashmere',
    name: 'Midnight Super 130s Cashmere Wool',
    origin: 'Curated Breathable Executive Suiting',
    weight: '260 GSM · Fluid Year-Round Tailoring',
    care: 'Steam gently vertically; dry clean between seasons',
    idealFor: 'Delta Executive Senator Sets, 3-Piece Corporate Suits',
    colors: ['#0F172A', '#334155', '#CBD5E1'],
  },
  {
    id: 'ankara',
    name: 'Heavyweight Wax-Resist Ankara',
    origin: 'West African Heritage Print Mills',
    weight: '210 GSM · Crisp Architectural Cotton',
    care: 'Cold gentle wash inside-out; press on reverse side',
    idealFor: 'Reversible Bombers, Afro-Casual Co-Ord Sets, Resort Shirts',
    colors: ['#9A3412', '#1B365D', '#D4AF37'],
  },
  {
    id: 'isiagu',
    name: 'Ceremonial Velvet & Lion Brocade',
    origin: 'Eastern & Delta Heritage Guilds',
    weight: '310 GSM · Rich Matte-Lustre Pile',
    care: 'Specialist dry clean; brush gently with garment brush',
    idealFor: 'Royal Isiagu Tunics, Etibo Traditional Ensembles',
    colors: ['#7F1D1D', '#B48436', '#18181B'],
  },
];

export function OurStoryPage() {
  const { setActivePage, currency } = useStore();
  const [activeChapterIdx, setActiveChapterIdx] = useState(0);
  const [activeTextileId, setActiveTextileId] = useState(TEXTILE_ARCHIVE[0].id);
  const [activeZoneId, setActiveZoneId] = useState(SHIPPING_ZONES[0].id);

  const chapter = STORY_CHAPTERS[activeChapterIdx];
  const textile = TEXTILE_ARCHIVE.find((t) => t.id === activeTextileId) || TEXTILE_ARCHIVE[0];
  const zone = SHIPPING_ZONES.find((z) => z.id === activeZoneId) || SHIPPING_ZONES[0];

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-16">
      {/* Interactive Heritage Chapters */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
        <div className="lg:col-span-7 flex flex-col justify-between space-y-8">
          <div className="space-y-3">
            <p className="text-xs text-[#71717A] tracking-[0.2em] uppercase">
              House Manifesto &amp; Heritage Archive
            </p>
            <h1 className="font-editorial text-4xl sm:text-6xl font-medium text-[#111113] leading-tight">
              Crafted in Ughelli. Worn Worldwide.
            </h1>
          </div>

          {/* Clickable Chapter Selector */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {STORY_CHAPTERS.map((ch, idx) => (
              <button
                key={ch.code}
                type="button"
                onClick={() => setActiveChapterIdx(idx)}
                className={`p-3 text-left border transition-colors cursor-pointer ${
                  activeChapterIdx === idx
                    ? 'border-[#111113] bg-[#111113] text-white'
                    : 'border-[#E4E4E0] bg-white text-[#27272A] hover:border-[#111113]'
                }`}
              >
                <p className="font-mono text-[10px] opacity-75">CHAPTER {ch.code}</p>
                <p className="text-xs font-semibold mt-0.5">{ch.title}</p>
              </button>
            ))}
          </div>

          {/* Active Chapter Reader */}
          <div className="bg-white border border-[#E4E4E0] p-6 sm:p-8 space-y-4">
            <div className="flex items-center justify-between text-xs font-mono text-[#B48436]">
              <span>CHAPTER {chapter.code}</span>
              <span>
                {chapter.statLabel}: {chapter.statValue}
              </span>
            </div>
            <h2 className="font-editorial text-2xl sm:text-3xl font-medium text-[#111113]">
              {chapter.heading}
            </h2>
            <p className="text-sm sm:text-base text-[#52525B] leading-relaxed">{chapter.body}</p>
            <div className="pt-2 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setActivePage('custom-tailoring')}
                className="px-5 py-2.5 bg-[#111113] text-white text-xs font-medium tracking-wider uppercase hover:bg-[#1B365D] transition-colors cursor-pointer"
              >
                Explore Tailoring Studio
              </button>
              <button
                type="button"
                onClick={() => setActivePage('contact')}
                className="px-5 py-2.5 border border-[#111113] text-[#111113] text-xs font-medium tracking-wider uppercase hover:bg-[#111113] hover:text-white transition-colors cursor-pointer"
              >
                Book Studio Visit
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 overflow-hidden bg-[#F2F2F0] min-h-[420px]">
          <img
            src={IMG_AFRO_CASUAL}
            alt="Josy Textile Contemporary African Craft"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-top"
          />
        </div>
      </section>

      {/* Interactive West African Textile Library */}
      <section className="border-t border-[#E4E4E0] pt-12 space-y-6">
        <div className="space-y-1">
          <p className="text-xs text-[#71717A] tracking-[0.18em] uppercase flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#B48436]" />
            <span>Interactive Fabric Library</span>
          </p>
          <h2 className="font-editorial text-3xl sm:text-4xl font-medium text-[#111113]">
            Inspect Our Signature House Textiles
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-2.5">
            {TEXTILE_ARCHIVE.map((item) => {
              const selected = item.id === textile.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTextileId(item.id)}
                  className={`w-full p-4 border text-left flex items-center justify-between gap-4 transition-colors cursor-pointer ${
                    selected
                      ? 'border-[#111113] bg-[#111113] text-white'
                      : 'border-[#E4E4E0] bg-white text-[#111113] hover:border-[#111113]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 border border-white/20 shrink-0"
                      style={{
                        background: `linear-gradient(135deg, ${item.colors[0]} 45%, ${item.colors[1]} 45%, ${item.colors[1]} 75%, ${item.colors[2]} 75%)`,
                      }}
                    />
                    <div>
                      <p className="text-sm font-semibold">{item.name}</p>
                      <p className={`text-[11px] ${selected ? 'text-[#D4D4D8]' : 'text-[#71717A]'}`}>
                        {item.origin}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 shrink-0 opacity-70" />
                </button>
              );
            })}
          </div>

          <div className="lg:col-span-7 bg-white border border-[#E4E4E0] p-6 sm:p-8 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {textile.colors.map((hex) => (
                  <span
                    key={hex}
                    className="w-6 h-6 border border-black/15 inline-block"
                    style={{ backgroundColor: hex }}
                  />
                ))}
                <span className="text-xs font-mono text-[#71717A] ml-2">{textile.weight}</span>
              </div>
              <h3 className="font-editorial text-3xl font-medium text-[#111113]">
                {textile.name}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-[#F4F4F5] text-xs">
                <div>
                  <p className="text-[#71717A] uppercase tracking-wider">Sourcing Origin</p>
                  <p className="text-sm text-[#111113] font-medium mt-1">{textile.origin}</p>
                </div>
                <div>
                  <p className="text-[#71717A] uppercase tracking-wider">Recommended Silhouettes</p>
                  <p className="text-sm text-[#111113] font-medium mt-1">{textile.idealFor}</p>
                </div>
              </div>
              <div className="pt-3 border-t border-[#F4F4F5] text-xs">
                <p className="text-[#71717A] uppercase tracking-wider">Garment Care Standard</p>
                <p className="text-sm text-[#52525B] mt-1">{textile.care}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Global Shipping Corridor Explorer */}
      <section className="border-t border-[#E4E4E0] pt-12 space-y-6">
        <div className="flex items-center gap-2">
          <Truck className="w-4 h-4 text-[#1B365D]" />
          <h2 className="font-editorial text-3xl sm:text-4xl font-medium text-[#111113]">
            Interactive Delivery &amp; Pickup Explorer
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {SHIPPING_ZONES.map((z) => {
            const active = z.id === zone.id;
            return (
              <button
                key={z.id}
                type="button"
                onClick={() => setActiveZoneId(z.id)}
                className={`p-4 text-left border transition-colors cursor-pointer ${
                  active
                    ? 'border-[#1B365D] bg-[#1B365D] text-white'
                    : 'border-[#E4E4E0] bg-white text-[#111113] hover:border-[#1B365D]'
                }`}
              >
                <p className="text-xs font-semibold">{z.label}</p>
                <p
                  className={`font-mono text-xs mt-1.5 ${
                    active ? 'text-[#D4AF37]' : 'text-[#52525B]'
                  }`}
                >
                  {z.rateNGN === 0 ? 'FREE PICKUP' : formatMoney(z.rateNGN, currency)}
                </p>
              </button>
            );
          })}
        </div>

        <div className="bg-white border border-[#E4E4E0] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-sm">
          <div className="space-y-1">
            <p className="font-semibold text-[#111113]">{zone.label}</p>
            <p className="text-[#52525B]">{zone.coverage}</p>
          </div>
          <div className="font-mono text-xs text-[#1B365D] sm:text-right space-y-1">
            <p>Carrier: {zone.carrier}</p>
            <p>Transit Window: {zone.eta}</p>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ============================================================================
 * PAGE 3: CONTACT — Interactive Fitting Scheduler, Direct Concierge & FAQ
 * Includes josephwingie@gmail.com, 07032802844, Mon-Sat 9 AM - 7 PM WAT
 * ========================================================================== */

const APPOINTMENT_MODES = [
  {
    id: 'studio',
    label: 'In-Studio Fitting (Isoko Road)',
    icon: MapPin,
    summary: 'Walk-in live measurement & fabric swatch session in Ughelli, Delta State.',
  },
  {
    id: 'virtual',
    label: 'Virtual Diaspora Video Fitting',
    icon: Video,
    summary: 'Guided WhatsApp / video measurement check with our Lead Master Tailor.',
  },
  {
    id: 'group',
    label: 'Wedding / Group Aso-Ebi',
    icon: Calendar,
    summary: 'Coordinated fabrics & individual body profiles for bridal trains and events.',
  },
] as const;

const TIME_SLOTS = [
  'Mon–Fri · 9:30 AM – 12:00 PM WAT',
  'Mon–Fri · 1:00 PM – 4:00 PM WAT',
  'Mon–Fri · 4:30 PM – 7:00 PM WAT',
  'Saturday · 10:00 AM – 5:00 PM WAT',
];

const STUDIO_FAQS = [
  {
    q: 'Do I need a buyer account to send a studio request or place an order?',
    a: 'Yes. Create a free buyer account with your email and password so your orders, fitting requests, and measurements stay tied securely to your client hub.',
  },
  {
    q: 'How does the 60% / 40% luxury payment option work?',
    a: 'For custom-tailored garments, you can pay a 60% production deposit at checkout. Once your garment passes our 18-point Quality Control at Isoko Road, the remaining 40% balance clears it for dispatch.',
  },
  {
    q: 'Can you tailor garments for clients living outside Nigeria?',
    a: 'Yes. Select Virtual Diaspora Video Fitting above, enter your 9 body dimensions in inches or centimeters, and we dispatch globally via DHL Express.',
  },
  {
    q: 'Can buyers edit or delete submitted orders on the platform?',
    a: 'To protect cutting schedules and textile allocation, submitted orders and requests are locked against edits or deletions. Contact our studio concierge at 07032802844 or josephwingie@gmail.com for any authorized adjustments.',
  },
];

export function ContactPage() {
  const { submitContactInquiry, user, openAuthModal, showToast } = useStore();
  const [name, setName] = useState(user?.displayName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [appointmentMode, setAppointmentMode] = useState<(typeof APPOINTMENT_MODES)[number]['id']>('studio');
  const [preferredSlot, setPreferredSlot] = useState(TIME_SLOTS[0]);
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(0);
  const [copiedEmail, setCopiedEmail] = useState(false);

  useEffect(() => {
    if (user?.displayName && !name) setName(user.displayName);
    if (user?.email && !email) setEmail(user.email);
  }, [user, name, email]);

  const activeModeObj =
    APPOINTMENT_MODES.find((m) => m.id === appointmentMode) || APPOINTMENT_MODES[0];

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText('josephwingie@gmail.com');
      setCopiedEmail(true);
      showToast('Copied josephwingie@gmail.com');
      window.setTimeout(() => setCopiedEmail(false), 2000);
    } catch {
      showToast('Email: josephwingie@gmail.com');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const subject = `${activeModeObj.label} (${preferredSlot})`;
    const ok = await submitContactInquiry({ name, email, subject, message });
    if (ok) {
      setSubmitted(true);
      setMessage('');
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-16">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Direct Studio Contact Directory */}
        <div className="lg:col-span-5 space-y-6">
          <p className="text-xs text-[#71717A] tracking-[0.2em] uppercase">
            Direct Studio Concierge
          </p>
          <h1 className="font-editorial text-4xl sm:text-5xl font-medium text-[#111113]">
            Josy Textile Headquarters
          </h1>
          <p className="text-sm text-[#52525B] leading-relaxed">
            Visit our Isoko Road flagship studio for live measurements and swatch viewing, message our WhatsApp line, or email our atelier desk directly.
          </p>

          <div className="space-y-5 pt-4 border-t border-[#E4E4E0] text-sm">
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-[#1B365D] mt-1 shrink-0" />
              <div>
                <p className="font-semibold text-[#111113]">Flagship Studio &amp; Workshop</p>
                <p className="text-[#52525B]">Isoko Road, Ughelli, Delta State, Nigeria</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Phone className="w-4 h-4 text-[#1B365D] mt-1 shrink-0" />
              <div>
                <p className="font-semibold text-[#111113]">Phone / WhatsApp Line</p>
                <p className="font-mono text-xs text-[#111113] font-medium mt-0.5">07032802844</p>
                <p className="font-mono text-xs text-[#52525B] mt-0.5">
                  Available: Mon–Sat, 9:00 AM – 7:00 PM WAT
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Mail className="w-4 h-4 text-[#1B365D] mt-1 shrink-0" />
              <div className="space-y-1">
                <p className="font-semibold text-[#111113]">Studio Email</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <a
                    href="mailto:josephwingie@gmail.com"
                    className="font-mono text-xs text-[#1B365D] font-medium underline underline-offset-4 hover:text-[#111113]"
                  >
                    josephwingie@gmail.com
                  </a>
                  <button
                    type="button"
                    onClick={() => void handleCopyEmail()}
                    className="inline-flex items-center gap-1 px-2 py-0.5 border border-[#D4D4D8] text-[11px] text-[#52525B] hover:border-[#111113] hover:text-[#111113] cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copiedEmail ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Fitting Scheduler & Request Form */}
        <div className="lg:col-span-7 bg-white border border-[#E4E4E0] p-6 sm:p-8 space-y-6">
          {submitted ? (
            <div className="py-12 text-center space-y-3">
              <Check className="w-8 h-8 text-[#1B365D] mx-auto" />
              <h2 className="font-editorial text-3xl text-[#111113]">Studio Request Logged</h2>
              <p className="text-sm text-[#52525B] max-w-md mx-auto">
                Thank you. Our Isoko Road concierge team has received your {activeModeObj.label.toLowerCase()} request for <span className="font-mono text-[#111113]">{preferredSlot}</span> and will respond via email or WhatsApp.
              </p>
              <button
                type="button"
                onClick={() => setSubmitted(false)}
                className="mt-4 px-5 py-2.5 border border-[#111113] text-xs font-medium cursor-pointer"
              >
                Submit Another Request
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <h2 className="font-editorial text-2xl sm:text-3xl font-medium text-[#111113]">
                  Interactive Fitting &amp; Request Scheduler
                </h2>
                <p className="text-xs text-[#71717A] mt-1">
                  Pick your consultation format and preferred time window before sending your brief.
                </p>
              </div>

              {!user && (
                <div className="p-3.5 bg-[#F8FAFC] border border-[#1B365D] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <p className="text-xs text-[#27272A]">
                    Sign in or create a buyer account with email &amp; password to submit studio requests.
                  </p>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => openAuthModal('signup')}
                      className="px-3 py-1.5 bg-[#111113] text-white text-[11px] font-medium hover:bg-[#1B365D] cursor-pointer"
                    >
                      Create Account
                    </button>
                    <button
                      type="button"
                      onClick={() => openAuthModal('signin')}
                      className="px-3 py-1.5 border border-[#111113] text-[#111113] text-[11px] font-medium hover:bg-[#111113] hover:text-white cursor-pointer"
                    >
                      Sign In
                    </button>
                  </div>
                </div>
              )}

              {/* Step 1: Appointment Mode Cards */}
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#111113]">
                  1. Select Consultation Mode
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {APPOINTMENT_MODES.map((m) => {
                    const Icon = m.icon;
                    const selected = appointmentMode === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setAppointmentMode(m.id)}
                        className={`p-3 text-left border transition-colors cursor-pointer ${
                          selected
                            ? 'border-[#111113] bg-[#111113] text-white'
                            : 'border-[#E4E4E0] bg-[#FAFAFA] text-[#111113] hover:border-[#111113]'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${selected ? 'text-[#D4AF37]' : 'text-[#1B365D]'}`} />
                        <p className="text-xs font-semibold mt-2 leading-snug">{m.label}</p>
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-[#52525B]">{activeModeObj.summary}</p>
              </div>

              {/* Step 2: Interactive Time Window Picker */}
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#111113] flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#1B365D]" />
                  <span>2. Preferred Window (WAT)</span>
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {TIME_SLOTS.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setPreferredSlot(slot)}
                      className={`px-3 py-2 text-left text-xs font-mono border transition-colors cursor-pointer ${
                        preferredSlot === slot
                          ? 'border-[#1B365D] bg-[#F8FAFC] text-[#1B365D] font-medium'
                          : 'border-[#E4E4E0] text-[#52525B] hover:border-[#111113]'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 3: Client Details & Brief */}
              <div className="space-y-3 pt-2 border-t border-[#E4E4E0]">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    required
                    maxLength={120}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Full Name"
                    className="border border-[#D4D4D8] px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#111113]"
                  />
                  <input
                    type="email"
                    required
                    maxLength={180}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email Address"
                    className="border border-[#D4D4D8] px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#111113]"
                  />
                </div>
                <textarea
                  rows={4}
                  required
                  maxLength={2000}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Share your event date, garment style, fabric preference, or sizing question..."
                  className="w-full border border-[#D4D4D8] px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#111113]"
                />
                <button
                  type="submit"
                  className="px-7 py-3.5 bg-[#111113] text-white text-xs font-medium tracking-wider uppercase hover:bg-[#1B365D] transition-colors cursor-pointer"
                >
                  {user ? 'Send Request to Ughelli Studio' : 'Sign In / Create Account & Send Request'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Interactive Concierge FAQ Accordion */}
      <section className="border-t border-[#E4E4E0] pt-12 space-y-6">
        <div>
          <p className="text-xs text-[#71717A] tracking-[0.18em] uppercase">
            Quick Concierge Answers
          </p>
          <h2 className="font-editorial text-3xl font-medium text-[#111113] mt-1">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="divide-y divide-[#E4E4E0] border-y border-[#E4E4E0] bg-white">
          {STUDIO_FAQS.map((faq, idx) => {
            const isOpen = openFaqIdx === idx;
            return (
              <div key={faq.q}>
                <button
                  type="button"
                  onClick={() => setOpenFaqIdx(isOpen ? null : idx)}
                  aria-expanded={isOpen}
                  className="w-full px-6 py-4 text-left flex items-center justify-between gap-4 hover:bg-[#FAFAFA] transition-colors cursor-pointer"
                >
                  <span className="text-sm font-medium text-[#111113]">{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-[#71717A] shrink-0 transition-transform ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-6 pb-5 text-sm text-[#52525B] leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
