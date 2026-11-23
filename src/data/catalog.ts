import {
  Category,
  CurrencyCode,
  MeasurementProfile,
  Order,
  Product,
  ShippingZone,
  SizeCode,
} from '../types/josy';

export const SIZES: SizeCode[] = ['S', 'M', 'L', 'XL', '2XL', '3XL'];

export const CURRENCY_META: Record<
  CurrencyCode,
  { symbol: string; label: string; rateFromNGN: number }
> = {
  NGN: { symbol: '₦', label: 'NGN ₦', rateFromNGN: 1 },
  USD: { symbol: '$', label: 'USD $', rateFromNGN: 1 / 1550 },
  GBP: { symbol: '£', label: 'GBP £', rateFromNGN: 1 / 1980 },
  EUR: { symbol: '€', label: 'EUR €', rateFromNGN: 1 / 1680 },
};

export function formatMoney(amountNGN: number, currency: CurrencyCode): string {
  const meta = CURRENCY_META[currency];
  const converted = amountNGN * meta.rateFromNGN;
  if (currency === 'NGN') {
    return `${meta.symbol}${Math.round(converted).toLocaleString('en-NG')}`;
  }
  return `${meta.symbol}${converted.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export const HERO_IMAGE = '/src/assets/images/hero_josy_campaign_1795429445290.jpg';
export const IMG_BOMBER = '/src/assets/images/cat_ankara_bomber_1795429444717.jpg';
export const IMG_SENATOR = '/src/assets/images/cat_traditional_senator_1795429443890.jpg';
export const IMG_AGBADA = '/src/assets/images/cat_traditional_agbada_1795429443523.jpg';
export const IMG_OWAMBE = '/src/assets/images/cat_occasion_owambe_1795429446121.jpg';
export const IMG_SUIT = '/src/assets/images/cat_corporate_suit_1795429443108.jpg';
export const IMG_AFRO_CASUAL = '/src/assets/images/cat_afro_casual_set_1795429444816.jpg';
export const IMG_STREETWEAR = '/src/assets/images/cat_streetwear_hoodie_tee_1795429445826.jpg';
export const IMG_TRACKSUIT = '/src/assets/images/cat_tracksuit_accessories_1795429444509.jpg';

export const CATEGORIES: Category[] = [
  {
    code: '01',
    name: 'T-Shirts & Graphic Tops',
    shortName: 'T-Shirts & Tops',
    scope: 'Round neck & V-neck tees, Afro-print pocket tees, cultural graphic tops',
    image: IMG_STREETWEAR,
    defaultFilterGroup: 'Corporate & Streetwear',
  },
  {
    code: '02',
    name: 'Ankara Bombers & Jackets',
    shortName: 'Ankara Bombers',
    scope: 'Reversible Ankara bomber jackets, structured varsity & denim-print jackets',
    image: IMG_BOMBER,
    defaultFilterGroup: 'Custom-Available',
  },
  {
    code: '03',
    name: 'Sweatshirts & Hoodies',
    shortName: 'Hoodies & Fleece',
    scope: 'Pullover hoodies, zip-up sweatshirts, fleece & textile-accented outerwear',
    image: IMG_STREETWEAR,
    defaultFilterGroup: 'Ready-to-Wear',
  },
  {
    code: '04',
    name: 'Afro-Casuals & Two-Piece Sets',
    shortName: 'Afro-Casual Sets',
    scope: 'Matching short-sleeve shirts & shorts, resort sets, relaxed contemporary sets',
    image: IMG_AFRO_CASUAL,
    defaultFilterGroup: 'Custom-Available',
  },
  {
    code: '05',
    name: 'All Nigerian Traditional Wears',
    shortName: 'Traditional Wears',
    scope: 'Senator wear, Agbada, Isiagu, Dashiki, Etibo, Iro & Buba, and Kaftan sets',
    image: IMG_SENATOR,
    defaultFilterGroup: 'Traditional & Occasion',
  },
  {
    code: '06',
    name: 'Occasion Wears',
    shortName: 'Occasion Wears',
    scope: 'Weddings, Owambe celebration attire, dinner, red-carpet & gala outfits',
    image: IMG_OWAMBE,
    defaultFilterGroup: 'Traditional & Occasion',
  },
  {
    code: '07',
    name: 'Suits & Corporate Wears',
    shortName: 'Suits & Corporate',
    scope: 'Two-piece & three-piece suits, blazers, corporate trousers & tailored shirts',
    image: IMG_SUIT,
    defaultFilterGroup: 'Corporate & Streetwear',
  },
  {
    code: '08',
    name: 'Tracksuits & Joggers',
    shortName: 'Tracksuits & Joggers',
    scope: 'Matching athleisure sets, tapered cargo joggers, Ankara-trim loungewear',
    image: IMG_TRACKSUIT,
    defaultFilterGroup: 'Ready-to-Wear',
  },
  {
    code: '09',
    name: 'Limited Textile Drops & Accessories',
    shortName: 'Limited Drops',
    scope: 'Exclusive numbered fabric releases, caps, scarves, pocket squares & bags',
    image: IMG_TRACKSUIT,
    defaultFilterGroup: 'Ready-to-Wear',
  },
];

export const SHIPPING_ZONES: ShippingZone[] = [
  {
    id: 'UGHELLI_PICKUP',
    label: 'Free In-Store Pickup — Isoko Road Studio',
    coverage: 'Isoko Road, Ughelli, Delta State',
    carrier: 'Josy Textile Flagship Atelier',
    eta: 'Ready within 24 hrs (RTW) or on completion (Luxury)',
    rateNGN: 0,
  },
  {
    id: 'DELTA_METRO',
    label: 'Ughelli & Delta State Metro Dispatch',
    coverage: 'Ughelli, Warri, Effurun, Sapele, Asaba',
    carrier: 'Dedicated Delta Dispatch Rider',
    eta: 'Same day – 24 hrs after dispatch',
    rateNGN: 3500,
  },
  {
    id: 'NIGERIA_INTERSTATE',
    label: 'Inter-State Courier (Nationwide Nigeria)',
    coverage: 'Lagos, Abuja, Port Harcourt, Benin, Enugu & 36 States',
    carrier: 'GIG Logistics / DHL Domestic / Transit Waybill',
    eta: '2–4 business days after dispatch',
    rateNGN: 7500,
  },
  {
    id: 'INTERNATIONAL_EXPRESS',
    label: 'International Express Worldwide',
    coverage: 'UK, USA, Canada, Europe & Global Diaspora',
    carrier: 'DHL Express / FedEx Priority',
    eta: '4–6 business days after dispatch',
    rateNGN: 68000,
  },
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'jt-bomber-01',
    sku: 'JT-02-INDIGO',
    name: 'Urhobo Heritage Reversible Ankara Bomber',
    categoryCode: '02',
    categoryName: 'Ankara Bombers & Jackets',
    fulfillmentMode: 'HYBRID',
    priceNGN: 118000,
    bespokeSurchargeNGN: 22000,
    image: IMG_BOMBER,
    secondaryImage: HERO_IMAGE,
    description:
      'Hand-cut from heavyweight waxed Dutch-block Ankara on one side and matte water-repellent obsidian twill on the reverse. Finished with ribbed Merino cuffs and brushed antique-brass hardware at our Isoko Road atelier.',
    craftDetails: [
      '100% authentic 6-yard waxed cotton Ankara exterior',
      'Reversible matte black structured twill lining',
      'Custom brass two-way zipper & welt pockets',
      'Available in Standard S–3XL or Custom Tailored Fit',
    ],
    swatches: [
      {
        id: 'sw-indigo-ochre',
        name: 'Royal Indigo & Ochre',
        material: 'Waxed Cotton Ankara',
        hexPrimary: '#1B365D',
        hexSecondary: '#B48436',
        hexAccent: '#111113',
        patternType: 'ankara',
      },
      {
        id: 'sw-obsidian-kente',
        name: 'Obsidian Gold Kente',
        material: 'Woven Kente Cotton Blend',
        hexPrimary: '#18181B',
        hexSecondary: '#C59B43',
        hexAccent: '#3F3F46',
        patternType: 'kente',
      },
      {
        id: 'sw-emerald-delta',
        name: 'Delta Forest Print',
        material: 'Waxed Cotton Ankara',
        hexPrimary: '#14382F',
        hexSecondary: '#D4A853',
        hexAccent: '#F2EFE9',
        patternType: 'ankara',
      },
    ],
    cutOptions: ['Structured Tailored Fit', 'Relaxed Oversized Cut'],
    stockBySize: { S: 4, M: 7, L: 5, XL: 6, '2XL': 3, '3XL': 2 },
    modelNote: 'Model is 6\'1" (185 cm) wearing Standard Size L.',
    isSpotlight: true,
    isNewArrival: true,
    filterGroups: ['All', 'Ready-to-Wear', 'Custom-Available', 'Corporate & Streetwear'],
  },
  {
    id: 'jt-senator-01',
    sku: 'JT-05-SEN01',
    name: 'Delta Executive Midnight Senator Set',
    categoryCode: '05',
    categoryName: 'All Nigerian Traditional Wears',
    fulfillmentMode: 'BESPOKE_ONLY',
    priceNGN: 145000,
    bespokeSurchargeNGN: 0,
    image: IMG_SENATOR,
    secondaryImage: HERO_IMAGE,
    description:
      'Precision-drafted two-piece Nigerian Senator kaftan and tapered trousers in breathable 320gsm Cashmere-Wool blend. Features architectural tonal geometric embroidery across the front placket and concealed horn buttons.',
    craftDetails: [
      'Made-to-measure exclusively at our Isoko Road, Ughelli studio',
      'Breathable tropical-weight Nigerian Cashmere suiting',
      'Hand-guided tonal chest embroidery & French seams',
      'Delivered in 10–14 business days with QC certification',
    ],
    swatches: [
      {
        id: 'sw-midnight-cashmere',
        name: 'Midnight Indigo Cashmere',
        material: 'Super 140s Tropical Wool',
        hexPrimary: '#16213E',
        hexSecondary: '#233661',
        hexAccent: '#0F172A',
        patternType: 'wool',
      },
      {
        id: 'sw-stone-linen',
        name: 'Architectural Chalk',
        material: 'Irish Linen-Wool Blend',
        hexPrimary: '#E7E4DC',
        hexSecondary: '#C8B99B',
        hexAccent: '#71717A',
        patternType: 'cotton',
      },
      {
        id: 'sw-obsidian-wool',
        name: 'Onyx Sovereign',
        material: 'Cashmere Suiting',
        hexPrimary: '#18181B',
        hexSecondary: '#3F3F46',
        hexAccent: '#B48436',
        patternType: 'wool',
      },
    ],
    cutOptions: ['Long Sleeve Classic Cuff', 'Short Sleeve Resort Cuff', 'French Cufflink Sleeve'],
    stockBySize: { S: 0, M: 0, L: 0, XL: 0, '2XL': 0, '3XL': 0 },
    modelNote: 'Crafted strictly to individual measurements. Model is 6\'2" (188 cm).',
    isNewArrival: true,
    filterGroups: ['All', 'Custom-Available', 'Traditional & Occasion'],
  },
  {
    id: 'jt-agbada-01',
    sku: 'JT-05-AGB04',
    name: 'Odehwingie Grand Ivory Three-Piece Agbada',
    categoryCode: '05',
    categoryName: 'All Nigerian Traditional Wears',
    fulfillmentMode: 'BESPOKE_ONLY',
    priceNGN: 285000,
    bespokeSurchargeNGN: 0,
    image: IMG_AGBADA,
    secondaryImage: IMG_SENATOR,
    description:
      'Our flagship ceremonial three-piece Agbada (grand flowing robe, tailored inner Buba tunic, and drawstring Sokoto trousers) crafted in lustrous ivory cotton-silk damask with 40 hours of burnished-gold geometric embroidery.',
    craftDetails: [
      'Includes flowing Agbada robe, tailored inner tunic, trousers & matching Fila cap',
      'Burnished champagne-gold heritage chest embroidery',
      'Split Deposit eligible (60% production deposit, 40% upon QC)',
      'Individual pattern drafted and archived under your profile',
    ],
    swatches: [
      {
        id: 'sw-ivory-gold',
        name: 'Ivory & Burnished Gold',
        material: 'Cotton-Silk Damask',
        hexPrimary: '#F3EFE6',
        hexSecondary: '#B48436',
        hexAccent: '#D6C7A9',
        patternType: 'aso-oke',
      },
      {
        id: 'sw-indigo-silver',
        name: 'Royal Indigo & Slate',
        material: 'Heavy Polished Cotton',
        hexPrimary: '#1B365D',
        hexSecondary: '#94A3B8',
        hexAccent: '#0F172A',
        patternType: 'aso-oke',
      },
    ],
    cutOptions: ['Full 3-Piece + Fila Cap', 'Modern Streamlined Drape'],
    stockBySize: { S: 0, M: 0, L: 0, XL: 0, '2XL': 0, '3XL': 0 },
    modelNote: 'Luxury drape scaled proportionally to shoulder width and height.',
    isNewArrival: true,
    filterGroups: ['All', 'Custom-Available', 'Traditional & Occasion'],
  },
  {
    id: 'jt-owambe-01',
    sku: 'JT-06-ASO02',
    name: 'Sovereign Aso-Oke Sculptural Gala Gown',
    categoryCode: '06',
    categoryName: 'Occasion Wears',
    fulfillmentMode: 'BESPOKE_ONLY',
    priceNGN: 260000,
    bespokeSurchargeNGN: 0,
    image: IMG_OWAMBE,
    secondaryImage: HERO_IMAGE,
    description:
      'An architectural Owambe and red-carpet celebration gown sculpted from hand-loomed deep indigo Aso-Oke interlaced with muted metallic gold warp threads. Features dramatic pleated shoulder geometry and a sweeping bias skirt.',
    craftDetails: [
      'Authentic hand-loomed Nigerian Aso-Oke & silk organza lining',
      'Structured internal corsetry tailored to exact bust, waist & hip ratios',
      'Ideal for Nigerian weddings, Owambe receptions & black-tie galas',
      'Optional Gele headtie & matching clutch fabric included',
    ],
    swatches: [
      {
        id: 'sw-asooke-indigo',
        name: 'Deep Indigo & Gold Weave',
        material: 'Hand-Loomed Aso-Oke',
        hexPrimary: '#172E44',
        hexSecondary: '#B48436',
        hexAccent: '#0C1A29',
        patternType: 'aso-oke',
      },
      {
        id: 'sw-asooke-champagne',
        name: 'Warm Champagne Silk',
        material: 'Silk-Blend Aso-Oke',
        hexPrimary: '#D8C9B2',
        hexSecondary: '#9E7835',
        hexAccent: '#F5F2EB',
        patternType: 'aso-oke',
      },
    ],
    cutOptions: ['Asymmetric Sculpted Sleeve', 'Off-Shoulder Architectural Collar'],
    stockBySize: { S: 0, M: 0, L: 0, XL: 0, '2XL': 0, '3XL': 0 },
    modelNote: 'Tailored to exact bodice length and heel height. Model is 5\'10" (178 cm).',
    isNewArrival: true,
    filterGroups: ['All', 'Custom-Available', 'Traditional & Occasion'],
  },
  {
    id: 'jt-suit-01',
    sku: 'JT-07-DB03',
    name: 'Isoko Atelier Double-Breasted Charcoal 3-Piece Suit',
    categoryCode: '07',
    categoryName: 'Suits & Corporate Wears',
    fulfillmentMode: 'HYBRID',
    priceNGN: 215000,
    bespokeSurchargeNGN: 35000,
    image: IMG_SUIT,
    secondaryImage: IMG_BOMBER,
    description:
      'Commanding boardroom tailoring fusing Savile Row canvas construction with subtle Nigerian textile provenance. Cut from Super 130s charcoal wool with an authentic Ankara silk-blend interior lining and matching pocket square.',
    craftDetails: [
      'Half-canvas chest construction for natural shoulder drape',
      'Includes jacket, tailored waistcoat & double-pleat trousers',
      'Signature hidden Ankara inner pocket trim & matching pocket square',
      'Buy Standard S–3XL (ships 24–48 hrs) or Custom Made-to-Measure',
    ],
    swatches: [
      {
        id: 'sw-charcoal-wool',
        name: 'Graphite Charcoal Wool',
        material: 'Super 130s Italian-Milled Wool',
        hexPrimary: '#2D3035',
        hexSecondary: '#52525B',
        hexAccent: '#1B365D',
        patternType: 'wool',
      },
      {
        id: 'sw-navy-chalk',
        name: 'Deep Navy Pinstripe',
        material: 'Super 130s Worsted Wool',
        hexPrimary: '#1A243B',
        hexSecondary: '#334155',
        hexAccent: '#E2E8F0',
        patternType: 'wool',
      },
    ],
    cutOptions: ['Double-Breasted Peak Lapel', 'Single-Breasted Notch Lapel'],
    stockBySize: { S: 2, M: 5, L: 4, XL: 3, '2XL': 2, '3XL': 1 },
    modelNote: 'Model is 6\'1" (185 cm), 40" chest wearing Standard Size L.',
    isNewArrival: true,
    filterGroups: ['All', 'Ready-to-Wear', 'Custom-Available', 'Corporate & Streetwear'],
  },
  {
    id: 'jt-casual-01',
    sku: 'JT-04-ADI01',
    name: 'Warri Coast Hand-Dyed Adire Two-Piece Resort Set',
    categoryCode: '04',
    categoryName: 'Afro-Casuals & Two-Piece Sets',
    fulfillmentMode: 'HYBRID',
    priceNGN: 72000,
    bespokeSurchargeNGN: 12000,
    image: IMG_AFRO_CASUAL,
    secondaryImage: IMG_BOMBER,
    description:
      'Relaxed camp-collar short-sleeve shirt paired with tailored knee-length shorts in authentic hand-resist indigo Adire cotton. Lightweight, breathable, and cut for coastal weekends from Warri to Miami.',
    craftDetails: [
      '100% breathable hand-dyed Nigerian Adire cotton poplin',
      'Camp collar with mother-of-pearl buttons',
      'Elasticated rear waistband with tailored front closure on shorts',
      'Choose Standard S–3XL or Custom Fit lengths',
    ],
    swatches: [
      {
        id: 'sw-adire-indigo',
        name: 'Indigo & Ecru Adire',
        material: 'Hand-Dyed Cotton Poplin',
        hexPrimary: '#1E3A5F',
        hexSecondary: '#DFD8C8',
        hexAccent: '#475569',
        patternType: 'adire',
      },
      {
        id: 'sw-adire-slate',
        name: 'Ash Slate & Obsidian',
        material: 'Hand-Dyed Cotton Poplin',
        hexPrimary: '#3F3F46',
        hexSecondary: '#D4D4D8',
        hexAccent: '#18181B',
        patternType: 'adire',
      },
    ],
    cutOptions: ['Shirt + Tailored Shorts', 'Shirt + Relaxed Drawstring Trousers'],
    stockBySize: { S: 6, M: 8, L: 9, XL: 5, '2XL': 4, '3XL': 2 },
    modelNote: 'Model is 6\'0" (183 cm) wearing Standard Size M.',
    isNewArrival: true,
    filterGroups: ['All', 'Ready-to-Wear', 'Custom-Available'],
  },
  {
    id: 'jt-hoodie-01',
    sku: 'JT-03-KNT01',
    name: 'Heritage Woven-Panel Heavyweight Hoodie',
    categoryCode: '03',
    categoryName: 'Sweatshirts & Hoodies',
    fulfillmentMode: 'RTW_ONLY',
    priceNGN: 68000,
    bespokeSurchargeNGN: 0,
    image: IMG_STREETWEAR,
    secondaryImage: IMG_TRACKSUIT,
    description:
      '480gsm garment-washed obsidian French terry pullover hoodie inlaid with an authentic hand-woven West African geometric chest panel. Engineered for structured boxy drape and everyday streetwear longevity.',
    craftDetails: [
      '480gsm heavy combed cotton loop-back terry',
      'Authentic woven indigo-and-gold heritage panel inset',
      'Double-lined structured hood & reinforced kangaroo pocket',
      'Ready-to-Wear immediate dispatch in sizes S–3XL',
    ],
    swatches: [
      {
        id: 'sw-washed-obsidian',
        name: 'Washed Obsidian / Gold Weave',
        material: '480gsm Cotton + Woven Textile',
        hexPrimary: '#18181B',
        hexSecondary: '#B48436',
        hexAccent: '#1B365D',
        patternType: 'kente',
      },
      {
        id: 'sw-chalk-indigo',
        name: 'Chalk Grey / Indigo Weave',
        material: '480gsm Cotton + Woven Textile',
        hexPrimary: '#E4E4E7',
        hexSecondary: '#1B365D',
        hexAccent: '#27272A',
        patternType: 'kente',
      },
    ],
    cutOptions: ['Boxy Drop-Shoulder', 'Classic Tapered Athletic'],
    stockBySize: { S: 5, M: 9, L: 6, XL: 4, '2XL': 3, '3XL': 2 },
    modelNote: 'Unisex fit. Model is 5\'9" (175 cm) wearing Size M.',
    isNewArrival: true,
    filterGroups: ['All', 'Ready-to-Wear', 'Corporate & Streetwear'],
  },
  {
    id: 'jt-tee-01',
    sku: 'JT-01-PKT02',
    name: 'Josy 2026 Afro-Pocket Heavyweight Tee',
    categoryCode: '01',
    categoryName: 'T-Shirts & Graphic Tops',
    fulfillmentMode: 'RTW_ONLY',
    priceNGN: 34000,
    bespokeSurchargeNGN: 0,
    image: IMG_STREETWEAR,
    secondaryImage: IMG_BOMBER,
    description:
      'Essential 280gsm combed Nigerian cotton jersey tee elevated with a precision-stitched Ankara textile chest pocket and tonal back-neck studio stamp. Pre-shrunk for a crisp architectural silhouette.',
    craftDetails: [
      '280gsm breathable long-staple cotton jersey',
      'Hand-cut Ankara chest pocket & twin-needle collar',
      'Available in Round Neck or V-Neck cuts',
      'In-stock RTW ships within 24–48 hours',
    ],
    swatches: [
      {
        id: 'sw-tee-onyx',
        name: 'Jet Onyx / Indigo Pocket',
        material: '280gsm Cotton + Ankara',
        hexPrimary: '#111113',
        hexSecondary: '#1B365D',
        hexAccent: '#B48436',
        patternType: 'cotton',
      },
      {
        id: 'sw-tee-white',
        name: 'Alabaster / Ochre Pocket',
        material: '280gsm Cotton + Ankara',
        hexPrimary: '#FAFAFA',
        hexSecondary: '#B48436',
        hexAccent: '#111113',
        patternType: 'cotton',
      },
    ],
    cutOptions: ['Round Neck Crew', 'Tailored V-Neck'],
    stockBySize: { S: 12, M: 15, L: 14, XL: 10, '2XL': 6, '3XL': 4 },
    modelNote: 'True to size. Model is 6\'0" wearing Size L.',
    isNewArrival: true,
    filterGroups: ['All', 'Ready-to-Wear', 'Corporate & Streetwear'],
  },
  {
    id: 'jt-tracksuit-01',
    sku: 'JT-08-TRK01',
    name: 'Ughelli Transit Ankara-Trim Athleisure Tracksuit',
    categoryCode: '08',
    categoryName: 'Tracksuits & Joggers',
    fulfillmentMode: 'RTW_ONLY',
    priceNGN: 94000,
    bespokeSurchargeNGN: 0,
    image: IMG_TRACKSUIT,
    secondaryImage: IMG_STREETWEAR,
    description:
      'Streamlined full-zip funnel-neck track jacket and tapered cargo joggers engineered in dense double-knit interlock jersey, trimmed with luxury royal indigo Ankara piping along the placket and seams.',
    craftDetails: [
      'Structured double-knit cotton-modal interlock fabric',
      'Subtle indigo Ankara woven piping & embroidered monogram',
      'Concealed zip pockets on both jacket and tapered joggers',
      'Ready-to-Wear sizes S–3XL with immediate dispatch',
    ],
    swatches: [
      {
        id: 'sw-track-onyx',
        name: 'Obsidian / Indigo Piping',
        material: 'Double-Knit Interlock + Ankara',
        hexPrimary: '#141417',
        hexSecondary: '#1E3A8A',
        hexAccent: '#B48436',
        patternType: 'ankara',
      },
    ],
    cutOptions: ['Full Two-Piece Tracksuit', 'Tapered Cargo Joggers Only'],
    stockBySize: { S: 3, M: 6, L: 4, XL: 2, '2XL': 2, '3XL': 1 },
    modelNote: 'Athletic tapered leg. Model is 6\'1" wearing Size L.',
    isNewArrival: true,
    filterGroups: ['All', 'Ready-to-Wear', 'Corporate & Streetwear'],
  },
  {
    id: 'jt-drop-01',
    sku: 'JT-09-LTD01',
    name: 'Edition 01 — Pebbled Leather & Ankara Weekender Capsule',
    categoryCode: '09',
    categoryName: 'Limited Textile Drops & Accessories',
    fulfillmentMode: 'RTW_ONLY',
    priceNGN: 165000,
    bespokeSurchargeNGN: 0,
    image: IMG_TRACKSUIT,
    secondaryImage: IMG_BOMBER,
    description:
      'Numbered collector travel capsule pairing full-grain black pebbled leather with hand-sealed royal indigo wax-print straps, matching structured cap, and silk-Ankara pocket square duo.',
    craftDetails: [
      'Individually numbered limited edition (Edition of 50)',
      'Full-grain leather weekender + structured cap + 2 pocket squares',
      'Cabin-compliant dimensions with padded laptop sleeve',
    ],
    swatches: [
      {
        id: 'sw-drop-indigo',
        name: 'Obsidian Leather / Royal Ankara',
        material: 'Full-Grain Leather & Wax Cotton',
        hexPrimary: '#111113',
        hexSecondary: '#1B365D',
        hexAccent: '#C59B43',
        patternType: 'ankara',
      },
    ],
    cutOptions: ['Complete 3-Piece Travel Set', 'Weekender Bag Only'],
    stockBySize: { S: 0, M: 0, L: 0, XL: 0, '2XL': 0, '3XL': 0 },
    soldOutOverride: true,
    modelNote: 'Limited capsule drop — sign up for restock alert below.',
    isNewArrival: true,
    filterGroups: ['All', 'Ready-to-Wear'],
  },
];

export const INITIAL_MEASUREMENT_PROFILES: MeasurementProfile[] = [];

export const INITIAL_ORDERS: Order[] = [];

export const RTW_PIPELINE: Order['rtwStage'][] = [
  'Order Confirmed',
  'Packed',
  'Dispatched',
  'Delivered',
];

export const BESPOKE_PIPELINE: Order['bespokeStage'][] = [
  'Measurements Confirmed',
  'Fabric Cutting',
  'Sewing & Construction',
  'Finishing & Quality Check',
  'Dispatched',
  'Delivered',
];

export function inToCm(inches: number): number {
  return Math.round(inches * 2.54 * 10) / 10;
}

export function cmToIn(cm: number): number {
  return Math.round((cm / 2.54) * 10) / 10;
}

export function isProductSoldOut(product: Product): boolean {
  if (product.soldOutOverride) return true;
  if (product.fulfillmentMode === 'BESPOKE_ONLY') return false;
  const totalStock = Object.values(product.stockBySize).reduce((sum, n) => sum + n, 0);
  return totalStock <= 0 && product.fulfillmentMode === 'RTW_ONLY';
}
