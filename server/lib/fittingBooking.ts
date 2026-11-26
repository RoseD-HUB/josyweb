import crypto from 'node:crypto';
import { STUDIO_INFO } from './studioData.ts';

export type FittingType =
  | 'IN_STUDIO_UGHELLI'
  | 'WHATSAPP_VIDEO_FITTING'
  | 'EVENT_GROUP_CONSULTATION';

export interface FittingSlotDay {
  date: string; // YYYY-MM-DD
  weekday: string;
  slotsWAT: string[];
}

const WEEKDAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export const STUDIO_FITTING_TIMES_WAT = [
  '10:00 AM WAT',
  '12:00 PM WAT',
  '02:30 PM WAT',
  '04:30 PM WAT',
] as const;

const FITTING_TYPE_LABELS: Record<FittingType, string> = {
  IN_STUDIO_UGHELLI: 'In-Studio Measurement & Fitting — Isoko Road, Ughelli',
  WHATSAPP_VIDEO_FITTING: 'Guided WhatsApp Video Measurement Session (07032802844)',
  EVENT_GROUP_CONSULTATION: 'Wedding / Aso-Ebi / Corporate Group Consultation',
};

export function getAvailableFittingSlots(daysAhead = 10, now = new Date()): FittingSlotDay[] {
  const safeDays = Math.max(1, Math.min(21, Math.floor(daysAhead)));
  const results: FittingSlotDay[] = [];
  const cursor = new Date(now.getTime());

  while (results.length < safeDays) {
    cursor.setUTCDate(cursor.getUTCDate() + 1);
    const dayOfWeek = cursor.getUTCDay();
    if (dayOfWeek === 0) continue; // Atelier closed Sundays

    results.push({
      date: cursor.toISOString().slice(0, 10),
      weekday: WEEKDAY_NAMES[dayOfWeek],
      slotsWAT: [...STUDIO_FITTING_TIMES_WAT],
    });
  }

  return results;
}

export function validateFittingBookingRequest(input: {
  date: string;
  timeSlotWAT: string;
  fittingType: string;
  clientName: string;
  clientPhone: string;
  garmentInterest?: string;
}):
  | {
      valid: true;
      bookingRef: string;
      date: string;
      weekday: string;
      timeSlotWAT: string;
      fittingType: FittingType;
      fittingLabel: string;
      studioLocation: string;
      studioPhone: string;
      summarySubject: string;
      summaryMessage: string;
    }
  | { valid: false; error: string } {
  const cleanDate = input.date.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(cleanDate)) {
    return { valid: false, error: 'Please select a valid fitting date (YYYY-MM-DD).' };
  }

  const parsed = new Date(`${cleanDate}T12:00:00Z`);
  if (Number.isNaN(parsed.getTime())) {
    return { valid: false, error: 'Invalid calendar date.' };
  }

  const todayFloor = new Date();
  todayFloor.setUTCHours(0, 0, 0, 0);
  if (parsed.getTime() < todayFloor.getTime()) {
    return { valid: false, error: 'Fitting date cannot be in the past.' };
  }

  const dayOfWeek = parsed.getUTCDay();
  if (dayOfWeek === 0) {
    return {
      valid: false,
      error: 'Our Isoko Road studio operates Mon–Sat (closed Sundays). Please pick Monday–Saturday.',
    };
  }

  const cleanSlot = input.timeSlotWAT.trim();
  if (!(STUDIO_FITTING_TIMES_WAT as readonly string[]).includes(cleanSlot)) {
    return { valid: false, error: 'Please select an available WAT fitting time slot.' };
  }

  const typeKey = input.fittingType.trim().toUpperCase() as FittingType;
  if (!(typeKey in FITTING_TYPE_LABELS)) {
    return { valid: false, error: 'Unsupported fitting consultation type.' };
  }

  const cleanName = input.clientName.replace(/[<>]/g, '').trim().slice(0, 120);
  const cleanPhone = input.clientPhone.replace(/[^\d+\s()-]/g, '').trim().slice(0, 40);
  const cleanInterest = (input.garmentInterest || 'Luxury Tailoring Consultation')
    .replace(/[<>]/g, '')
    .trim()
    .slice(0, 160);

  if (cleanName.length < 2 || cleanPhone.length < 7) {
    return { valid: false, error: 'Client name and valid phone/WhatsApp number are required.' };
  }

  const bookingRef = `JT-FIT-${crypto.randomInt(1000, 9999)}`;
  const weekday = WEEKDAY_NAMES[dayOfWeek];
  const fittingLabel = FITTING_TYPE_LABELS[typeKey];

  return {
    valid: true,
    bookingRef,
    date: cleanDate,
    weekday,
    timeSlotWAT: cleanSlot,
    fittingType: typeKey,
    fittingLabel,
    studioLocation: STUDIO_INFO.headquarters,
    studioPhone: STUDIO_INFO.phone,
    summarySubject: `Fitting Booking ${bookingRef} — ${cleanDate} (${cleanSlot})`,
    summaryMessage: [
      `Booking Ref: ${bookingRef}`,
      `Type: ${fittingLabel}`,
      `Date & Time: ${weekday}, ${cleanDate} at ${cleanSlot}`,
      `Client: ${cleanName} (${cleanPhone})`,
      `Garment / Request: ${cleanInterest}`,
    ].join('\n'),
  };
}
