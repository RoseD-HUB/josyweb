import { auth } from './firebase';
import type { BodyMeasurements, CartItem, Order } from '../types/josy';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');

const TRUSTED_CHECKOUT_HOSTS = new Set([
  'checkout.paystack.com',
  'checkout.flutterwave.com',
  'checkout-v2.dev-flutterwave.com',
  'checkout.stripe.com',
]);

async function authHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

export function isTrustedCheckoutUrl(rawUrl: string | null | undefined): rawUrl is string {
  if (!rawUrl) return false;
  try {
    const parsed = new URL(rawUrl);
    return parsed.protocol === 'https:' && TRUSTED_CHECKOUT_HOSTS.has(parsed.hostname);
  } catch {
    return false;
  }
}

export interface PaymentInitResponse {
  mode: 'pending' | 'live' | 'preview';
  gateway: 'pending' | 'paystack' | 'flutterwave' | 'stripe';
  paymentStatus?: 'PENDING_CONFIRMATION' | 'AUTHORIZED';
  reference: string;
  authorizationUrl: string | null;
  message?: string;
}

export interface PreparedOrderResponse {
  orderId: string;
  paymentMode: 'pending' | 'live';
  paymentStatus: 'PENDING_CONFIRMATION' | 'AUTHORIZED';
  paymentGatewayLabel: string;
  paymentPlan: 'FULL_UPFRONT' | 'SPLIT_DEPOSIT_60_40';
  subtotalNGN: number;
  shippingNGN: number;
  totalNGN: number;
  amountPaidNGN: number;
  balanceDueNGN: number;
  balanceSettled: boolean;
  targetCompletionDate: string;
}

export interface MeasurementValidationResponse {
  valid: boolean;
  unit: 'in' | 'cm';
  canonicalInches: BodyMeasurements;
  errors: string[];
  warnings: string[];
  estimatedFabricYards: number;
  recommendedLeadDays: number;
}

export async function prepareOrderOnServer(payload: {
  shippingZoneId: string;
  currency: string;
  paymentPlan: string;
  paymentGateway: string;
  splitDepositEnabled: boolean;
  items: Array<Pick<CartItem, 'selectedMode' | 'unitPriceNGN' | 'quantity'>>;
}): Promise<PreparedOrderResponse | null> {
  try {
    const res = await fetch(`${API_BASE}/api/orders/prepare`, {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) return null;
    return (await res.json()) as PreparedOrderResponse;
  } catch {
    return null;
  }
}

export async function validateMeasurementsOnServer(payload: {
  unit: 'in' | 'cm';
  measurements: BodyMeasurements;
}): Promise<MeasurementValidationResponse | null> {
  try {
    const res = await fetch(`${API_BASE}/api/tailoring/validate-measurements`, {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify(payload),
    });
    if (res.status !== 200 && res.status !== 422) return null;
    return (await res.json()) as MeasurementValidationResponse;
  } catch {
    return null;
  }
}

export async function downloadOrderReceiptFromServer(order: Order): Promise<boolean> {
  try {
    const items = [...order.rtwItems, ...order.bespokeItems].map((item) => ({
      name: item.name,
      sku: item.sku,
      mode: item.selectedMode,
      quantity: item.quantity,
      unitPriceNGN: item.unitPriceNGN,
      size: item.size,
      swatchName: item.swatch?.name,
      cutOption: item.cutOption,
    }));

    const res = await fetch(`${API_BASE}/api/orders/receipt`, {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify({
        orderId: order.id,
        createdAt: order.createdAt,
        targetCompletionDate: order.targetCompletionDate,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        customerPhone: order.customerPhone,
        deliveryAddress: order.deliveryAddress,
        shippingLabel: order.shippingZone.label,
        currency: order.currency,
        paymentGateway: order.paymentGateway,
        paymentPlan: order.paymentPlan,
        subtotalNGN: order.subtotalNGN,
        shippingNGN: order.shippingNGN,
        totalNGN: order.totalNGN,
        amountPaidNGN: order.amountPaidNGN,
        balanceDueNGN: order.balanceDueNGN,
        balanceSettled: order.balanceSettled,
        items,
      }),
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { filename: string; receiptText: string };
    const blob = new Blob([data.receiptText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = data.filename || `Josy-Textile-Receipt-${order.id}.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    return true;
  } catch {
    return false;
  }
}

export async function generateAdminTrackingCode(payload: {
  shippingZoneId: string;
  track: 'RTW' | 'BESPOKE';
}): Promise<{ trackingCode: string; carrier: string; eta: string } | null> {
  try {
    const res = await fetch(`${API_BASE}/api/admin/tracking/generate`, {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) return null;
    return (await res.json()) as { trackingCode: string; carrier: string; eta: string };
  } catch {
    return null;
  }
}

export async function initializePaymentOnServer(payload: {
  orderId: string;
  gateway: string;
  currency: string;
  amountMajor: number;
  customerName: string;
  customerEmail: string;
}): Promise<PaymentInitResponse | null> {
  try {
    const res = await fetch(`${API_BASE}/api/payments/initialize`, {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) return null;
    return (await res.json()) as PaymentInitResponse;
  } catch {
    return null;
  }
}

export async function dispatchMilestoneNotification(payload: {
  orderId: string;
  stage: string;
  message: string;
  recipientEmail: string;
  recipientPhone: string;
  whatsappOptIn: boolean;
}): Promise<void> {
  try {
    await fetch(`${API_BASE}/api/notifications/milestone`, {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify(payload),
    });
  } catch {
    // Non-blocking: Firestore order timeline remains authoritative
  }
}

export async function forwardStudioInquiryToEmail(payload: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): Promise<void> {
  try {
    await fetch(`${API_BASE}/api/notifications/studio-inquiry`, {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify(payload),
    });
  } catch {
    // Non-blocking: Firestore inquiry record remains authoritative
  }
}

export interface FittingSlotDayResponse {
  date: string;
  weekday: string;
  slotsWAT: string[];
}

export async function fetchFittingSlotsFromServer(days = 10): Promise<FittingSlotDayResponse[]> {
  try {
    const res = await fetch(`${API_BASE}/api/fittings/slots?days=${encodeURIComponent(days)}`);
    if (!res.ok) return [];
    const data = (await res.json()) as { days?: FittingSlotDayResponse[] };
    return data.days || [];
  } catch {
    return [];
  }
}

export async function downloadOrdersCsvFromServer(orders: Order[]): Promise<boolean> {
  try {
    const mapped = orders.map((o) => ({
      id: o.id,
      createdAt: o.createdAt,
      targetCompletionDate: o.targetCompletionDate,
      customerName: o.customerName,
      customerEmail: o.customerEmail,
      customerPhone: o.customerPhone,
      deliveryAddress: o.deliveryAddress,
      shippingLabel: o.shippingZone.label,
      currency: o.currency,
      paymentGateway: o.paymentGateway,
      totalNGN: o.totalNGN,
      amountPaidNGN: o.amountPaidNGN,
      balanceDueNGN: o.balanceDueNGN,
      balanceSettled: o.balanceSettled,
      rtwStage: o.rtwStage,
      rtwTrackingCode: o.rtwTrackingCode,
      bespokeStage: o.bespokeStage,
      bespokeTrackingCode: o.bespokeTrackingCode,
      rtwSubtotalNGN: o.rtwItems.reduce((s, i) => s + i.unitPriceNGN * i.quantity, 0),
      luxurySubtotalNGN: o.bespokeItems.reduce((s, i) => s + i.unitPriceNGN * i.quantity, 0),
      itemCount: o.rtwItems.length + o.bespokeItems.length,
    }));

    const res = await fetch(`${API_BASE}/api/admin/exports/orders-csv`, {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify({ orders: mapped }),
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { filename: string; csv: string };
    const blob = new Blob([data.csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = data.filename || 'Josy-Textile-Orders.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    return true;
  } catch {
    return false;
  }
}

export async function downloadTailorJobCardFromServer(order: Order): Promise<boolean> {
  try {
    const garments = order.bespokeItems.map((item) => ({
      name: item.name,
      sku: item.sku,
      quantity: item.quantity,
      cutOption: item.cutOption,
      swatchName: item.swatch.name,
      swatchMaterial: item.swatch.material,
      profileName: item.bespokeSpec?.profileName,
      fitNotes: item.bespokeSpec?.fitNotes,
      measurementsIn: item.bespokeSpec?.measurementsIn,
    }));

    const res = await fetch(`${API_BASE}/api/admin/job-card/export`, {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify({
        orderId: order.id,
        targetCompletionDate: order.targetCompletionDate,
        currentStage: order.bespokeStage || order.rtwStage || 'In Production',
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        customerEmail: order.customerEmail,
        shippingLabel: order.shippingZone.label,
        deliveryAddress: order.deliveryAddress,
        totalNGN: order.totalNGN,
        amountPaidNGN: order.amountPaidNGN,
        balanceSettled: order.balanceSettled,
        currency: order.currency,
        garments,
      }),
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { filename: string; cutSheetText: string };
    const blob = new Blob([data.cutSheetText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = data.filename || `Josy-Textile-JobCard-${order.id}.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    return true;
  } catch {
    return false;
  }
}

export async function hashWhitelistPasswordOnServer(
  password: string,
  meta?: { email?: string; displayName?: string; note?: string }
): Promise<{ passwordHash: string; passwordSalt: string } | null> {
  try {
    const res = await fetch(`${API_BASE}/api/admin/whitelist/hash-password`, {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify({
        password,
        email: meta?.email,
        displayName: meta?.displayName,
        note: meta?.note,
      }),
    });
    if (!res.ok) return null;
    return (await res.json()) as { passwordHash: string; passwordSalt: string };
  } catch {
    return null;
  }
}

export interface WhitelistSeedEntryResponse {
  email: string;
  displayName: string;
  passwordHash: string;
  passwordSalt: string;
  active: boolean;
  note: string;
}

export async function fetchWhitelistSeedEntriesFromServer(): Promise<WhitelistSeedEntryResponse[]> {
  try {
    const res = await fetch(`${API_BASE}/api/admin/whitelist/seed-entries`, {
      method: 'GET',
      headers: await authHeaders(),
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { entries?: WhitelistSeedEntryResponse[] };
    return Array.isArray(data.entries) ? data.entries : [];
  } catch {
    return [];
  }
}

export async function syncWhitelistStatusOnServer(payload: {
  email: string;
  active: boolean;
  removed?: boolean;
}): Promise<void> {
  try {
    await fetch(`${API_BASE}/api/admin/whitelist/status`, {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify(payload),
    });
  } catch {
    // Non-blocking: Firestore remains authoritative
  }
}

export async function verifyWhitelistPasswordOnServer(payload: {
  password: string;
  passwordHash?: string;
  passwordSalt?: string;
  useServerRegistry?: boolean;
  idToken?: string;
}): Promise<{ valid: boolean; displayName?: string }> {
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (payload.idToken) {
      headers.Authorization = `Bearer ${payload.idToken}`;
    } else {
      const merged = await authHeaders();
      Object.assign(headers, merged);
    }
    const res = await fetch(`${API_BASE}/api/auth/verify-whitelist-password`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        password: payload.password,
        passwordHash: payload.passwordHash || '',
        passwordSalt: payload.passwordSalt || '',
        useServerRegistry: Boolean(payload.useServerRegistry),
      }),
    });
    if (!res.ok) return { valid: false };
    const data = (await res.json()) as { valid?: boolean; displayName?: string };
    return { valid: Boolean(data.valid), displayName: data.displayName };
  } catch {
    return { valid: false };
  }
}

export async function loginWithServerWhitelistFallback(payload: {
  email: string;
  password: string;
}): Promise<{
  ok: boolean;
  email?: string;
  displayName?: string;
  token?: string;
  error?: string;
}> {
  try {
    const res = await fetch(`${API_BASE}/api/auth/whitelist-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = (await res.json()) as {
      ok?: boolean;
      email?: string;
      displayName?: string;
      token?: string;
      error?: string;
    };
    if (!res.ok || !data.ok || !data.token) {
      return { ok: false, error: data.error || 'Invalid email or password.' };
    }
    return {
      ok: true,
      email: data.email,
      displayName: data.displayName,
      token: data.token,
    };
  } catch {
    return { ok: false, error: 'Unable to reach verification server. Please retry.' };
  }
}

export async function checkServerWhitelistMembership(idToken?: string): Promise<{
  allowed: boolean;
  displayName?: string;
}> {
  try {
    const headers: Record<string, string> = {};
    if (idToken) {
      headers.Authorization = `Bearer ${idToken}`;
    } else {
      const merged = await authHeaders();
      Object.assign(headers, merged);
    }
    const res = await fetch(`${API_BASE}/api/auth/whitelist-check`, {
      method: 'GET',
      headers,
    });
    if (!res.ok) return { allowed: false };
    const data = (await res.json()) as { allowed?: boolean; displayName?: string };
    return { allowed: Boolean(data.allowed), displayName: data.displayName };
  } catch {
    return { allowed: false };
  }
}




