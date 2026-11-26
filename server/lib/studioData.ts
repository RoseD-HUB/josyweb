import crypto from 'node:crypto';

export interface StudioShippingZone {
  id: 'UGHELLI_PICKUP' | 'DELTA_METRO' | 'NIGERIA_INTERSTATE' | 'INTERNATIONAL_EXPRESS';
  label: string;
  coverage: string;
  carrier: string;
  eta: string;
  rateNGN: number;
  trackingPrefix: string;
}

export interface StudioCurrencyMeta {
  code: 'NGN' | 'USD' | 'GBP' | 'EUR';
  symbol: string;
  rateFromNGN: number;
}

export interface RawMeasurementsInput {
  chestBust: number;
  waist: number;
  hips: number;
  shoulderWidth: number;
  sleeveLength: number;
  neck: number;
  trouserInseam: number;
  trouserOutseam: number;
  garmentLength: number;
}

export interface MeasurementValidationResult {
  valid: boolean;
  unit: 'in' | 'cm';
  canonicalInches: RawMeasurementsInput;
  errors: string[];
  warnings: string[];
  estimatedFabricYards: number;
  recommendedLeadDays: number;
}

export const STUDIO_INFO = {
  brand: 'Josy Textile',
  founder: 'Joseph Odehwingie',
  headquarters: 'Isoko Road, Ughelli, Delta State, Nigeria',
  phone: '07032802844',
  email: 'josephwingie@gmail.com',
  hours: 'Mon–Sat, 9:00 AM – 7:00 PM WAT',
  adminEmail: 'diamondroseline4@gmail.com',
} as const;

export const CURRENCY_RATES: Record<string, StudioCurrencyMeta> = {
  NGN: { code: 'NGN', symbol: '₦', rateFromNGN: 1 },
  USD: { code: 'USD', symbol: '$', rateFromNGN: 1 / 1550 },
  GBP: { code: 'GBP', symbol: '£', rateFromNGN: 1 / 1980 },
  EUR: { code: 'EUR', symbol: '€', rateFromNGN: 1 / 1680 },
};

export const SHIPPING_ZONES_MAP: Record<string, StudioShippingZone> = {
  UGHELLI_PICKUP: {
    id: 'UGHELLI_PICKUP',
    label: 'Free In-Store Pickup — Isoko Road Studio',
    coverage: 'Isoko Road, Ughelli, Delta State',
    carrier: 'Josy Textile Flagship Atelier',
    eta: 'Ready within 24 hrs (RTW) or on completion (Luxury)',
    rateNGN: 0,
    trackingPrefix: 'JT-UGL',
  },
  DELTA_METRO: {
    id: 'DELTA_METRO',
    label: 'Ughelli & Delta State Metro Dispatch',
    coverage: 'Ughelli, Warri, Effurun, Sapele, Asaba',
    carrier: 'Dedicated Delta Dispatch Rider',
    eta: 'Same day – 24 hrs after dispatch',
    rateNGN: 3500,
    trackingPrefix: 'JT-DLT',
  },
  NIGERIA_INTERSTATE: {
    id: 'NIGERIA_INTERSTATE',
    label: 'Inter-State Courier (Nationwide Nigeria)',
    coverage: 'Lagos, Abuja, Port Harcourt, Benin, Enugu & 36 States',
    carrier: 'GIG Logistics / DHL Domestic / Transit Waybill',
    eta: '2–4 business days after dispatch',
    rateNGN: 7500,
    trackingPrefix: 'JT-NGN',
  },
  INTERNATIONAL_EXPRESS: {
    id: 'INTERNATIONAL_EXPRESS',
    label: 'International Express Worldwide',
    coverage: 'UK, USA, Canada, Europe & Global Diaspora',
    carrier: 'DHL Express / FedEx Priority',
    eta: '4–6 business days after dispatch',
    rateNGN: 68000,
    trackingPrefix: 'JT-DHL',
  },
};

export const SHIPPING_ZONES_LIST: StudioShippingZone[] = Object.values(SHIPPING_ZONES_MAP);

export function resolveShippingZone(zoneId: string): StudioShippingZone | null {
  const normalized = zoneId.trim().toUpperCase();
  if (normalized === 'NIGERIA_NATIONWIDE') return SHIPPING_ZONES_MAP.NIGERIA_INTERSTATE;
  if (normalized === 'GLOBAL_EXPRESS') return SHIPPING_ZONES_MAP.INTERNATIONAL_EXPRESS;
  return SHIPPING_ZONES_MAP[normalized] || null;
}

/**
 * Adds atelier working days (Monday–Saturday, skipping Sundays) to calculate
 * realistic RTW dispatch and Luxury Tailoring completion dates in Ughelli.
 */
export function addAtelierWorkingDays(fromDate: Date, workingDays: number): string {
  const cursor = new Date(fromDate.getTime());
  let remaining = Math.max(0, Math.floor(workingDays));
  while (remaining > 0) {
    cursor.setUTCDate(cursor.getUTCDate() + 1);
    // 0 = Sunday (atelier closed on Sundays)
    if (cursor.getUTCDay() !== 0) {
      remaining -= 1;
    }
  }
  return cursor.toISOString().slice(0, 10);
}

export function getAtelierSchedule(now = new Date()) {
  const rtwWorkingDays = 2;
  const luxuryWorkingDays = 10;
  return {
    timezone: 'WAT (UTC+1)',
    operatingHours: STUDIO_INFO.hours,
    location: STUDIO_INFO.headquarters,
    rtwEstimatedDispatchDate: addAtelierWorkingDays(now, rtwWorkingDays),
    luxuryEstimatedCompletionDate: addAtelierWorkingDays(now, luxuryWorkingDays),
    rtwLeadLabel: '24–48 hrs (2 working days)',
    luxuryLeadLabel: '10–14 working days',
  };
}

export function generateOrderReference(now = new Date()): string {
  const year = now.getUTCFullYear();
  const suffix = crypto.randomInt(1000, 9999);
  return `JT-${year}-${suffix}`;
}

export function generateCarrierTrackingCode(
  zoneId: string,
  track: 'RTW' | 'BESPOKE'
): string {
  const zone = resolveShippingZone(zoneId);
  const prefix = zone ? zone.trackingPrefix : 'JT-TRK';
  const modeTag = track === 'BESPOKE' ? 'LX' : 'RTW';
  const digits = crypto.randomInt(100000, 999999);
  return `${prefix}-${modeTag}-${digits}`;
}

const MEASUREMENT_BOUNDS_IN: Record<
  keyof RawMeasurementsInput,
  { label: string; min: number; max: number }
> = {
  neck: { label: 'Neck circumference', min: 11, max: 26 },
  shoulderWidth: { label: 'Shoulder width', min: 13, max: 28 },
  chestBust: { label: 'Chest / Bust', min: 26, max: 68 },
  waist: { label: 'Natural waist', min: 22, max: 66 },
  hips: { label: 'Hips / Seat', min: 28, max: 72 },
  sleeveLength: { label: 'Sleeve length', min: 16, max: 36 },
  garmentLength: { label: 'Garment length', min: 20, max: 66 },
  trouserOutseam: { label: 'Trouser outseam', min: 30, max: 56 },
  trouserInseam: { label: 'Trouser inseam', min: 22, max: 42 },
};

export function validateTailoringMeasurements(
  raw: Partial<Record<keyof RawMeasurementsInput, unknown>>,
  unit: 'in' | 'cm'
): MeasurementValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const factor = unit === 'cm' ? 1 / 2.54 : 1;

  const canonicalInches: RawMeasurementsInput = {
    chestBust: 0,
    waist: 0,
    hips: 0,
    shoulderWidth: 0,
    sleeveLength: 0,
    neck: 0,
    trouserInseam: 0,
    trouserOutseam: 0,
    garmentLength: 0,
  };

  for (const key of Object.keys(MEASUREMENT_BOUNDS_IN) as Array<keyof RawMeasurementsInput>) {
    const spec = MEASUREMENT_BOUNDS_IN[key];
    const num = Number(raw[key]);
    if (!Number.isFinite(num) || num <= 0) {
      errors.push(`${spec.label} must be a positive number.`);
      continue;
    }
    const inches = Math.round(num * factor * 10) / 10;
    canonicalInches[key] = inches;
    if (inches < spec.min || inches > spec.max) {
      errors.push(
        `${spec.label} (${inches}") is outside tailoring bounds (${spec.min}" – ${spec.max}").`
      );
    }
  }

  if (errors.length === 0) {
    if (canonicalInches.trouserInseam >= canonicalInches.trouserOutseam - 4) {
      warnings.push(
        'Trouser inseam is unusually close to outseam. Our Isoko Road tailor will confirm rise height before cutting.'
      );
    }
    if (canonicalInches.hips < canonicalInches.waist - 4) {
      warnings.push(
        'Hip measurement is noticeably smaller than waist; please double-check tape placement around fullest seat.'
      );
    }
    if (canonicalInches.shoulderWidth > canonicalInches.chestBust * 0.65) {
      warnings.push(
        'Shoulder width is broad relative to chest/bust; our pattern cutter will verify yoke balance.'
      );
    }
  }

  // Estimate textile yardage needed for traditional/luxury cut
  let estimatedFabricYards = 4;
  if (canonicalInches.chestBust >= 46 || canonicalInches.garmentLength >= 44) {
    estimatedFabricYards = 5;
  }
  if (canonicalInches.chestBust >= 54 || canonicalInches.garmentLength >= 54) {
    estimatedFabricYards = 6;
  }

  const recommendedLeadDays = estimatedFabricYards >= 6 ? 12 : 10;

  return {
    valid: errors.length === 0,
    unit,
    canonicalInches,
    errors,
    warnings,
    estimatedFabricYards,
    recommendedLeadDays,
  };
}

export function formatCurrencyAmount(amountNGN: number, currencyCode: string): string {
  const meta = CURRENCY_RATES[currencyCode] || CURRENCY_RATES.NGN;
  const converted = amountNGN * meta.rateFromNGN;
  if (meta.code === 'NGN') {
    return `${meta.symbol}${Math.round(converted).toLocaleString('en-NG')}`;
  }
  return `${meta.symbol}${converted.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
